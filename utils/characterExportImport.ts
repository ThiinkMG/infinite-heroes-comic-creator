/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Character Export/Import Utilities
 * Enables users to export characters as JSON files for sharing and backup,
 * and import characters from JSON files with validation.
 */

import type { Persona, CharacterProfile } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Current version of the export format for future compatibility */
const EXPORT_FORMAT_VERSION = '1.0.0';

/** Maximum size (in bytes) for base64 images before warning/stripping (1MB) */
const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

/** Approximate base64 overhead ratio (base64 is ~33% larger than binary) */
const BASE64_OVERHEAD = 1.33;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Library character structure for export/import
 * Combines Persona data with optional AI-generated profile and metadata
 */
export interface LibraryCharacter {
  /** Unique identifier (will be regenerated on import to avoid conflicts) */
  id: string;
  /** Character persona data */
  persona: Persona;
  /** AI-generated character profile (optional) */
  profile?: CharacterProfile;
  /** User-defined tags for organization */
  tags?: string[];
  /** When the character was created */
  createdAt?: number;
  /** When the character was last modified */
  updatedAt?: number;
  /** Optional notes about the character */
  notes?: string;
}

/**
 * Export file format structure
 */
export interface CharacterExportData {
  /** Format version for compatibility checking */
  version: string;
  /** Export type: single character or array */
  type: 'single' | 'collection';
  /** Timestamp when export was created */
  exportedAt: number;
  /** Application identifier */
  source: 'infinite-heroes-comic-creator';
  /** The character data (single or array) */
  data: LibraryCharacter | LibraryCharacter[];
  /** Metadata about the export */
  metadata?: {
    /** Whether images were stripped due to size */
    imagesStripped?: boolean;
    /** Original count of characters (for collections) */
    characterCount?: number;
    /** Warning messages */
    warnings?: string[];
  };
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean;
  character?: LibraryCharacter;
  characters?: LibraryCharacter[];
  error?: string;
  warnings?: string[];
}

/**
 * Options for export operations
 */
export interface ExportOptions {
  /** Whether to strip large images to reduce file size */
  stripLargeImages?: boolean;
  /** Custom filename (without extension) */
  filename?: string;
  /** Include profile data (default: true) */
  includeProfile?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique ID for imported characters
 */
const generateId = (): string => {
  return `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Sanitize filename for safe download
 */
const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim() || 'character';
};

/**
 * Get the approximate size of a base64 string in bytes
 */
const getBase64SizeBytes = (base64: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  // Base64 uses 4 characters to encode 3 bytes
  return Math.ceil((base64Data?.length || 0) * 0.75);
};

/**
 * Check if a base64 image exceeds the size limit
 */
const isImageTooLarge = (base64?: string): boolean => {
  if (!base64) return false;
  return getBase64SizeBytes(base64) > MAX_IMAGE_SIZE_BYTES;
};

/**
 * Format date for filename: YYYY-MM-DD
 */
const formatDateForFilename = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Create a download from JSON data
 */
const downloadJson = (data: object, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
};

/**
 * Read a file as text
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
};

/**
 * Strip large images from a persona to reduce file size
 */
const stripLargeImagesFromPersona = (persona: Persona): { stripped: Persona; warnings: string[] } => {
  const warnings: string[] = [];
  const stripped = { ...persona };

  // Check main portrait
  if (isImageTooLarge(stripped.base64)) {
    warnings.push(`Portrait image for "${persona.name}" was stripped (>1MB)`);
    stripped.base64 = '';
  }

  // Check reference images
  if (stripped.referenceImages) {
    const filteredRefs: string[] = [];
    stripped.referenceImages.forEach((ref, index) => {
      if (isImageTooLarge(ref)) {
        warnings.push(`Reference image ${index + 1} for "${persona.name}" was stripped (>1MB)`);
      } else {
        filteredRefs.push(ref);
      }
    });
    stripped.referenceImages = filteredRefs;
  }

  // Check legacy single reference image
  if (isImageTooLarge(stripped.referenceImage)) {
    warnings.push(`Reference image for "${persona.name}" was stripped (>1MB)`);
    stripped.referenceImage = undefined;
  }

  // Check emblem image
  if (isImageTooLarge(stripped.emblemImage)) {
    warnings.push(`Emblem image for "${persona.name}" was stripped (>1MB)`);
    stripped.emblemImage = undefined;
  }

  // Check weapon image
  if (isImageTooLarge(stripped.weaponImage)) {
    warnings.push(`Weapon image for "${persona.name}" was stripped (>1MB)`);
    stripped.weaponImage = undefined;
  }

  // Check backstory files
  if (stripped.backstoryFiles) {
    const filteredFiles = stripped.backstoryFiles.filter((file, index) => {
      if (isImageTooLarge(file.base64)) {
        warnings.push(`Backstory file ${index + 1} for "${persona.name}" was stripped (>1MB)`);
        return false;
      }
      return true;
    });
    stripped.backstoryFiles = filteredFiles;
  }

  return { stripped, warnings };
};

/**
 * Prepare a library character for export
 */
const prepareCharacterForExport = (
  character: LibraryCharacter,
  options: ExportOptions = {}
): { prepared: LibraryCharacter; warnings: string[] } => {
  const warnings: string[] = [];
  let prepared = { ...character };

  // Strip large images if requested
  if (options.stripLargeImages) {
    const { stripped, warnings: strippedWarnings } = stripLargeImagesFromPersona(prepared.persona);
    prepared.persona = stripped;
    warnings.push(...strippedWarnings);
  }

  // Remove profile if not requested
  if (options.includeProfile === false) {
    prepared = { ...prepared };
    delete prepared.profile;
  }

  return { prepared, warnings };
};

/**
 * Validate that an object has the required Persona fields
 */
const validatePersona = (obj: unknown): obj is Persona => {
  if (!obj || typeof obj !== 'object') return false;

  const persona = obj as Record<string, unknown>;

  // Required fields
  if (typeof persona.id !== 'string' || !persona.id) return false;
  if (typeof persona.name !== 'string' || !persona.name) return false;
  if (typeof persona.desc !== 'string') return false;
  if (typeof persona.base64 !== 'string') return false;

  return true;
};

/**
 * Validate that an object has the required LibraryCharacter fields
 */
const validateLibraryCharacter = (obj: unknown): { valid: boolean; error?: string } => {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, error: 'Invalid character data: not an object' };
  }

  const char = obj as Record<string, unknown>;

  // ID is required
  if (typeof char.id !== 'string' || !char.id) {
    return { valid: false, error: 'Invalid character data: missing or invalid id' };
  }

  // Persona is required
  if (!char.persona || typeof char.persona !== 'object') {
    return { valid: false, error: 'Invalid character data: missing persona' };
  }

  // Validate persona structure
  if (!validatePersona(char.persona)) {
    return { valid: false, error: 'Invalid character data: persona is malformed (requires id, name, desc, base64)' };
  }

  // Tags must be array of strings if present
  if (char.tags !== undefined) {
    if (!Array.isArray(char.tags)) {
      return { valid: false, error: 'Invalid character data: tags must be an array' };
    }
    if (!char.tags.every(tag => typeof tag === 'string')) {
      return { valid: false, error: 'Invalid character data: tags must be strings' };
    }
  }

  return { valid: true };
};

/**
 * Validate the export file structure
 */
const validateExportStructure = (obj: unknown): { valid: boolean; error?: string } => {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, error: 'Invalid file: not a valid JSON object' };
  }

  const data = obj as Record<string, unknown>;

  // Check source identifier
  if (data.source !== 'infinite-heroes-comic-creator') {
    // Allow files without source for backward compatibility, but warn
    console.warn('[characterExportImport] File does not have source identifier');
  }

  // Check version
  if (data.version && typeof data.version !== 'string') {
    return { valid: false, error: 'Invalid file: version must be a string' };
  }

  // Check type
  if (data.type && data.type !== 'single' && data.type !== 'collection') {
    return { valid: false, error: 'Invalid file: type must be "single" or "collection"' };
  }

  // Check data exists
  if (!data.data) {
    return { valid: false, error: 'Invalid file: missing character data' };
  }

  return { valid: true };
};

/**
 * Regenerate IDs for an imported character to avoid conflicts
 */
const regenerateIds = (character: LibraryCharacter): LibraryCharacter => {
  const newId = generateId();
  return {
    ...character,
    id: newId,
    persona: {
      ...character.persona,
      id: newId,
    },
    profile: character.profile ? {
      ...character.profile,
      id: newId,
    } : undefined,
  };
};

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export a single character to a JSON file
 * Downloads a file named: character_[name]_[date].json
 */
export const exportCharacter = (
  character: LibraryCharacter,
  options: ExportOptions = {}
): void => {
  const { prepared, warnings } = prepareCharacterForExport(character, options);

  const exportData: CharacterExportData = {
    version: EXPORT_FORMAT_VERSION,
    type: 'single',
    exportedAt: Date.now(),
    source: 'infinite-heroes-comic-creator',
    data: prepared,
    metadata: warnings.length > 0 ? {
      imagesStripped: warnings.length > 0,
      warnings,
    } : undefined,
  };

  const filename = options.filename ||
    `character_${sanitizeFilename(character.persona.name)}_${formatDateForFilename()}`;

  downloadJson(exportData, filename);

  console.log('[exportCharacter] Character exported:', {
    name: character.persona.name,
    filename: `${filename}.json`,
    warnings: warnings.length,
  });
};

/**
 * Export multiple characters to a single JSON file
 * Downloads a file named: characters_[date].json or custom filename
 */
export const exportAllCharacters = (
  characters: LibraryCharacter[],
  options: ExportOptions = {}
): void => {
  if (characters.length === 0) {
    console.warn('[exportAllCharacters] No characters to export');
    return;
  }

  const allWarnings: string[] = [];
  const preparedCharacters = characters.map(char => {
    const { prepared, warnings } = prepareCharacterForExport(char, options);
    allWarnings.push(...warnings);
    return prepared;
  });

  const exportData: CharacterExportData = {
    version: EXPORT_FORMAT_VERSION,
    type: 'collection',
    exportedAt: Date.now(),
    source: 'infinite-heroes-comic-creator',
    data: preparedCharacters,
    metadata: {
      characterCount: characters.length,
      imagesStripped: allWarnings.length > 0,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    },
  };

  const filename = options.filename || `characters_${formatDateForFilename()}`;

  downloadJson(exportData, filename);

  console.log('[exportAllCharacters] Characters exported:', {
    count: characters.length,
    filename: `${filename}.json`,
    warnings: allWarnings.length,
  });
};

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Import a single character from a JSON file
 * Validates the file and returns the parsed character with a new ID
 */
export const importCharacter = async (file: File): Promise<LibraryCharacter> => {
  // Check file extension
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    throw new Error('Please select a valid .json character file');
  }

  const text = await readFileAsText(file);

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file: could not parse content');
  }

  // Check if it's an export file format
  const structureCheck = validateExportStructure(parsed);
  if (structureCheck.valid && (parsed as CharacterExportData).source === 'infinite-heroes-comic-creator') {
    // It's our export format
    const exportData = parsed as CharacterExportData;

    if (exportData.type === 'collection') {
      throw new Error('This file contains multiple characters. Use importCharacters() instead.');
    }

    const character = exportData.data as LibraryCharacter;
    const validation = validateLibraryCharacter(character);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid character data');
    }

    // Regenerate ID to avoid conflicts
    return regenerateIds(character);
  }

  // Try to parse as a raw LibraryCharacter object
  const validation = validateLibraryCharacter(parsed);
  if (validation.valid) {
    return regenerateIds(parsed as LibraryCharacter);
  }

  // Try to parse as a raw Persona object
  if (validatePersona(parsed)) {
    const persona = parsed as Persona;
    const newId = generateId();
    return {
      id: newId,
      persona: {
        ...persona,
        id: newId,
      },
      createdAt: Date.now(),
    };
  }

  throw new Error('Invalid character file format. Expected a character export file.');
};

/**
 * Import multiple characters from a JSON file
 * Handles both single character and collection exports
 */
export const importCharacters = async (file: File): Promise<LibraryCharacter[]> => {
  // Check file extension
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    throw new Error('Please select a valid .json character file');
  }

  const text = await readFileAsText(file);

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file: could not parse content');
  }

  // Check if it's an export file format
  const structureCheck = validateExportStructure(parsed);
  if (structureCheck.valid && (parsed as CharacterExportData).source === 'infinite-heroes-comic-creator') {
    const exportData = parsed as CharacterExportData;

    if (exportData.type === 'single') {
      // Single character export
      const character = exportData.data as LibraryCharacter;
      const validation = validateLibraryCharacter(character);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid character data');
      }
      return [regenerateIds(character)];
    }

    // Collection export
    const characters = exportData.data as LibraryCharacter[];
    if (!Array.isArray(characters)) {
      throw new Error('Invalid collection: data is not an array');
    }

    const validatedCharacters: LibraryCharacter[] = [];
    const errors: string[] = [];

    characters.forEach((char, index) => {
      const validation = validateLibraryCharacter(char);
      if (validation.valid) {
        validatedCharacters.push(regenerateIds(char));
      } else {
        errors.push(`Character ${index + 1}: ${validation.error}`);
      }
    });

    if (validatedCharacters.length === 0) {
      throw new Error(`No valid characters found. Errors: ${errors.join('; ')}`);
    }

    if (errors.length > 0) {
      console.warn('[importCharacters] Some characters failed validation:', errors);
    }

    return validatedCharacters;
  }

  // Try to parse as a raw array of characters
  if (Array.isArray(parsed)) {
    const validatedCharacters: LibraryCharacter[] = [];

    for (const item of parsed) {
      if (validateLibraryCharacter(item).valid) {
        validatedCharacters.push(regenerateIds(item as LibraryCharacter));
      } else if (validatePersona(item)) {
        const persona = item as Persona;
        const newId = generateId();
        validatedCharacters.push({
          id: newId,
          persona: { ...persona, id: newId },
          createdAt: Date.now(),
        });
      }
    }

    if (validatedCharacters.length === 0) {
      throw new Error('No valid characters found in the file');
    }

    return validatedCharacters;
  }

  // Try single character or persona
  if (validateLibraryCharacter(parsed).valid) {
    return [regenerateIds(parsed as LibraryCharacter)];
  }

  if (validatePersona(parsed)) {
    const persona = parsed as Persona;
    const newId = generateId();
    return [{
      id: newId,
      persona: { ...persona, id: newId },
      createdAt: Date.now(),
    }];
  }

  throw new Error('Invalid character file format');
};

// ============================================================================
// VALIDATION UTILITIES (exported for external use)
// ============================================================================

/**
 * Validate a character file without importing
 * Useful for showing previews or validation errors before import
 */
export const validateCharacterFile = async (file: File): Promise<{
  valid: boolean;
  type: 'single' | 'collection' | 'unknown';
  count?: number;
  names?: string[];
  error?: string;
  warnings?: string[];
}> => {
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    return { valid: false, type: 'unknown', error: 'Please select a valid .json file' };
  }

  try {
    const text = await readFileAsText(file);
    const parsed = JSON.parse(text);

    // Check export format
    const structureCheck = validateExportStructure(parsed);
    if (structureCheck.valid && (parsed as CharacterExportData).source === 'infinite-heroes-comic-creator') {
      const exportData = parsed as CharacterExportData;

      if (exportData.type === 'single') {
        const character = exportData.data as LibraryCharacter;
        const validation = validateLibraryCharacter(character);
        return {
          valid: validation.valid,
          type: 'single',
          count: 1,
          names: validation.valid ? [character.persona.name] : undefined,
          error: validation.error,
          warnings: exportData.metadata?.warnings,
        };
      }

      const characters = exportData.data as LibraryCharacter[];
      const validNames: string[] = [];
      characters.forEach(char => {
        if (validateLibraryCharacter(char).valid) {
          validNames.push(char.persona.name);
        }
      });

      return {
        valid: validNames.length > 0,
        type: 'collection',
        count: characters.length,
        names: validNames,
        warnings: exportData.metadata?.warnings,
      };
    }

    // Try raw formats
    if (Array.isArray(parsed)) {
      const names = parsed
        .filter(item => validateLibraryCharacter(item).valid || validatePersona(item))
        .map(item => (item as LibraryCharacter).persona?.name || (item as Persona).name);
      return {
        valid: names.length > 0,
        type: 'collection',
        count: parsed.length,
        names,
      };
    }

    if (validateLibraryCharacter(parsed).valid) {
      return {
        valid: true,
        type: 'single',
        count: 1,
        names: [(parsed as LibraryCharacter).persona.name],
      };
    }

    if (validatePersona(parsed)) {
      return {
        valid: true,
        type: 'single',
        count: 1,
        names: [(parsed as Persona).name],
      };
    }

    return { valid: false, type: 'unknown', error: 'Unrecognized file format' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { valid: false, type: 'unknown', error: `Failed to parse file: ${message}` };
  }
};

/**
 * Create a LibraryCharacter from a Persona
 * Helper for converting existing characters to library format
 */
export const createLibraryCharacter = (
  persona: Persona,
  profile?: CharacterProfile,
  tags?: string[]
): LibraryCharacter => {
  return {
    id: persona.id,
    persona,
    profile,
    tags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/**
 * Calculate the approximate export file size for a character
 * Returns size in bytes
 */
export const estimateExportSize = (character: LibraryCharacter): number => {
  // Rough estimate: JSON serialization + base64 images
  let size = 500; // Base JSON overhead

  // Portrait
  if (character.persona.base64) {
    size += getBase64SizeBytes(character.persona.base64);
  }

  // Reference images
  character.persona.referenceImages?.forEach(ref => {
    size += getBase64SizeBytes(ref);
  });

  // Legacy reference
  if (character.persona.referenceImage) {
    size += getBase64SizeBytes(character.persona.referenceImage);
  }

  // Emblem
  if (character.persona.emblemImage) {
    size += getBase64SizeBytes(character.persona.emblemImage);
  }

  // Weapon
  if (character.persona.weaponImage) {
    size += getBase64SizeBytes(character.persona.weaponImage);
  }

  // Backstory files
  character.persona.backstoryFiles?.forEach(file => {
    size += getBase64SizeBytes(file.base64);
  });

  return size;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default {
  exportCharacter,
  exportAllCharacters,
  importCharacter,
  importCharacters,
  validateCharacterFile,
  createLibraryCharacter,
  estimateExportSize,
  formatFileSize,
};
