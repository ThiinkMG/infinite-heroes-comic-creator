/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Schema Validation Utility for AI Responses
 * Validates and sanitizes responses from Gemini/Claude AI models against expected schemas
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely converts any value to a string.
 * Handles cases where AI returns objects instead of strings.
 */
export function ensureString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(v => ensureString(v)).join(', ');
    }
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(val);
}

/**
 * Safely converts any value to an array.
 * Handles single values, comma-separated strings, and malformed data.
 */
export function ensureArray<T = string>(val: unknown, itemConverter?: (item: unknown) => T): T[] {
  const converter = itemConverter || ((item: unknown) => ensureString(item) as unknown as T);

  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) {
    return val.map(converter);
  }
  if (typeof val === 'string') {
    // Handle comma-separated strings
    const trimmed = val.trim();
    if (trimmed === '') return [];
    return trimmed.split(',').map(s => converter(s.trim()));
  }
  // Single value - wrap in array
  return [converter(val)];
}

/**
 * Safely converts any value to a number with a default fallback.
 */
export function ensureNumber(val: unknown, defaultVal: number = 0): number {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
  }
  return defaultVal;
}

/**
 * Safely converts any value to a boolean.
 */
export function ensureBoolean(val: unknown, defaultVal: boolean = false): boolean {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  if (typeof val === 'number') return val !== 0;
  return defaultVal;
}

// ============================================================================
// SCHEMA TYPE DEFINITIONS
// ============================================================================

/**
 * Expected schema for Beat AI responses (narrative generation)
 */
export interface BeatResponseSchema {
  caption?: string;
  dialogue?: string;
  scene: string;
  focus_char: 'hero' | 'friend' | 'other' | string;
  choices: string[];
}

/**
 * Hair details sub-schema
 */
export interface HairDetailsSchema {
  length: string;
  type: string;
  color: string;
  style: string;
}

/**
 * Identity header sub-schema for 4-Layer Consistency System
 */
export interface IdentityHeaderSchema {
  face: string;
  eyes: string;
  hair: string;
  skin: string;
  build: string;
  signature: string[];
}

/**
 * Expected schema for CharacterProfile AI responses
 */
export interface CharacterProfileResponseSchema {
  id?: string;
  name: string;
  faceDescription: string;
  bodyType: string;
  clothing: string;
  colorPalette: string;
  distinguishingFeatures: string;
  emblemDescription?: string;
  emblemPlacement?: string;
  maskDescription?: string;
  hairDetails?: HairDetailsSchema;
  weaponDescription?: string;
  identityHeader?: IdentityHeaderSchema;
  hardNegatives?: string[];
  contrastFeatures?: string[];
}

/**
 * Page breakdown item for outline responses
 */
export interface PageBreakdownItemSchema {
  pageIndex: number;
  primaryCharacters: string[];
  secondaryCharacters?: string[];
  focusCharacter: string;
  sceneDescription?: string;
  isDecisionPage?: boolean;
}

/**
 * Expected schema for Outline AI responses
 */
export interface OutlineResponseSchema {
  content: string;
  pageBreakdown?: PageBreakdownItemSchema[];
}

/**
 * Validation result with sanitized data and error information
 */
export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: T;
}

// ============================================================================
// SCHEMA VALIDATORS
// ============================================================================

/**
 * Validates and sanitizes a Beat response from AI
 */
export function validateBeatResponse(response: unknown): ValidationResult<BeatResponseSchema> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof response !== 'object' || response === null) {
    errors.push('Response is not an object');
    return {
      valid: false,
      errors,
      warnings,
      sanitized: getDefaultBeat()
    };
  }

  const obj = response as Record<string, unknown>;

  // Validate and sanitize scene (required)
  const scene = ensureString(obj.scene);
  if (!scene) {
    errors.push('Missing required field: scene');
  }

  // Validate and sanitize focus_char (required)
  let focusChar = ensureString(obj.focus_char);
  if (!focusChar) {
    warnings.push('Missing focus_char, defaulting to "hero"');
    focusChar = 'hero';
  }
  // Normalize common values
  const focusCharLower = focusChar.toLowerCase();
  if (focusCharLower === 'hero' || focusCharLower === 'main' || focusCharLower === 'protagonist') {
    focusChar = 'hero';
  } else if (focusCharLower === 'friend' || focusCharLower === 'costar' || focusCharLower === 'co-star' || focusCharLower === 'sidekick') {
    focusChar = 'friend';
  }

  // Validate and sanitize choices (required array)
  let choices = ensureArray<string>(obj.choices);
  if (choices.length === 0) {
    warnings.push('No choices provided, using default choices');
    choices = ['Continue the story', 'Take a different path'];
  }
  // Ensure we have at least 2 choices
  while (choices.length < 2) {
    choices.push('Continue');
  }

  // Optional fields
  const caption = obj.caption !== undefined ? ensureString(obj.caption) : undefined;
  const dialogue = obj.dialogue !== undefined ? ensureString(obj.dialogue) : undefined;

  const sanitized: BeatResponseSchema = {
    scene: scene || 'A dramatic scene unfolds.',
    focus_char: focusChar as BeatResponseSchema['focus_char'],
    choices,
    ...(caption && { caption }),
    ...(dialogue && { dialogue })
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized
  };
}

/**
 * Returns a default Beat for error recovery
 */
export function getDefaultBeat(): BeatResponseSchema {
  return {
    scene: 'The scene continues...',
    focus_char: 'hero',
    choices: ['Continue the story', 'Take action'],
    caption: undefined,
    dialogue: undefined
  };
}

/**
 * Validates and sanitizes hair details sub-schema
 */
function validateHairDetails(obj: unknown): HairDetailsSchema | undefined {
  if (typeof obj !== 'object' || obj === null) return undefined;

  const details = obj as Record<string, unknown>;
  const length = ensureString(details.length);
  const type = ensureString(details.type);
  const color = ensureString(details.color);
  const style = ensureString(details.style);

  // Only return if at least one field has a value
  if (length || type || color || style) {
    return {
      length: length || 'medium',
      type: type || 'straight',
      color: color || 'dark',
      style: style || 'natural'
    };
  }
  return undefined;
}

/**
 * Validates and sanitizes identity header sub-schema
 */
function validateIdentityHeader(obj: unknown): IdentityHeaderSchema | undefined {
  if (typeof obj !== 'object' || obj === null) return undefined;

  const header = obj as Record<string, unknown>;
  const face = ensureString(header.face);
  const eyes = ensureString(header.eyes);
  const hair = ensureString(header.hair);
  const skin = ensureString(header.skin);
  const build = ensureString(header.build);
  const signature = ensureArray<string>(header.signature);

  // Only return if we have meaningful data
  if (face || eyes || hair || skin || build) {
    return {
      face: face || 'distinctive features',
      eyes: eyes || 'expressive',
      hair: hair || 'styled',
      skin: skin || 'natural complexion',
      build: build || 'average build',
      signature
    };
  }
  return undefined;
}

/**
 * Validates and sanitizes a CharacterProfile response from AI
 */
export function validateCharacterProfileResponse(
  response: unknown,
  providedName?: string
): ValidationResult<CharacterProfileResponseSchema> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof response !== 'object' || response === null) {
    errors.push('Response is not an object');
    return {
      valid: false,
      errors,
      warnings,
      sanitized: getDefaultCharacterProfile(providedName)
    };
  }

  const obj = response as Record<string, unknown>;

  // Validate required fields
  const name = ensureString(obj.name) || providedName || 'Unknown Character';
  const faceDescription = ensureString(obj.faceDescription);
  const bodyType = ensureString(obj.bodyType);
  const clothing = ensureString(obj.clothing);
  const colorPalette = ensureString(obj.colorPalette);
  const distinguishingFeatures = ensureString(obj.distinguishingFeatures);

  if (!faceDescription) {
    warnings.push('Missing faceDescription, using placeholder');
  }
  if (!bodyType) {
    warnings.push('Missing bodyType, using placeholder');
  }
  if (!clothing) {
    warnings.push('Missing clothing, using placeholder');
  }
  if (!colorPalette) {
    warnings.push('Missing colorPalette, using placeholder');
  }
  if (!distinguishingFeatures) {
    warnings.push('Missing distinguishingFeatures, using placeholder');
  }

  // Optional fields
  const emblemDescription = obj.emblemDescription !== undefined
    ? ensureString(obj.emblemDescription) : undefined;
  const emblemPlacement = obj.emblemPlacement !== undefined
    ? ensureString(obj.emblemPlacement) : undefined;
  const maskDescription = obj.maskDescription !== undefined
    ? ensureString(obj.maskDescription) : undefined;
  const weaponDescription = obj.weaponDescription !== undefined
    ? ensureString(obj.weaponDescription) : undefined;

  // Complex optional fields
  const hairDetails = validateHairDetails(obj.hairDetails);
  const identityHeader = validateIdentityHeader(obj.identityHeader);
  const hardNegatives = obj.hardNegatives !== undefined
    ? ensureArray<string>(obj.hardNegatives) : undefined;
  const contrastFeatures = obj.contrastFeatures !== undefined
    ? ensureArray<string>(obj.contrastFeatures) : undefined;

  const sanitized: CharacterProfileResponseSchema = {
    id: ensureString(obj.id) || undefined,
    name,
    faceDescription: faceDescription || 'Distinctive facial features',
    bodyType: bodyType || 'Athletic build',
    clothing: clothing || 'Signature outfit',
    colorPalette: colorPalette || 'Primary colors',
    distinguishingFeatures: distinguishingFeatures || 'Unique visual elements',
    ...(emblemDescription && { emblemDescription }),
    ...(emblemPlacement && { emblemPlacement }),
    ...(maskDescription && { maskDescription }),
    ...(hairDetails && { hairDetails }),
    ...(weaponDescription && { weaponDescription }),
    ...(identityHeader && { identityHeader }),
    ...(hardNegatives && hardNegatives.length > 0 && { hardNegatives }),
    ...(contrastFeatures && contrastFeatures.length > 0 && { contrastFeatures })
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized
  };
}

/**
 * Returns a default CharacterProfile for error recovery
 */
export function getDefaultCharacterProfile(name?: string): CharacterProfileResponseSchema {
  return {
    name: name || 'Unknown Character',
    faceDescription: 'Distinctive facial features',
    bodyType: 'Athletic build',
    clothing: 'Signature outfit',
    colorPalette: 'Primary colors',
    distinguishingFeatures: 'Unique visual elements'
  };
}

/**
 * Validates a page breakdown item
 */
function validatePageBreakdownItem(
  obj: unknown,
  index: number
): { item: PageBreakdownItemSchema; warnings: string[] } {
  const warnings: string[] = [];

  if (typeof obj !== 'object' || obj === null) {
    return {
      item: {
        pageIndex: index + 1,
        primaryCharacters: ['hero'],
        focusCharacter: 'hero',
        isDecisionPage: false
      },
      warnings: [`Page ${index + 1}: Invalid page breakdown item, using defaults`]
    };
  }

  const page = obj as Record<string, unknown>;

  const pageIndex = ensureNumber(page.pageIndex, index + 1);
  const primaryCharacters = ensureArray<string>(page.primaryCharacters);
  const secondaryCharacters = page.secondaryCharacters !== undefined
    ? ensureArray<string>(page.secondaryCharacters) : undefined;
  const focusCharacter = ensureString(page.focusCharacter) || 'hero';
  const sceneDescription = page.sceneDescription !== undefined
    ? ensureString(page.sceneDescription) : undefined;
  const isDecisionPage = ensureBoolean(page.isDecisionPage, false);

  if (primaryCharacters.length === 0) {
    warnings.push(`Page ${pageIndex}: No primary characters specified, defaulting to hero`);
    primaryCharacters.push('hero');
  }

  return {
    item: {
      pageIndex,
      primaryCharacters,
      ...(secondaryCharacters && secondaryCharacters.length > 0 && { secondaryCharacters }),
      focusCharacter,
      ...(sceneDescription && { sceneDescription }),
      isDecisionPage
    },
    warnings
  };
}

/**
 * Validates and sanitizes an Outline response from AI
 */
export function validateOutlineResponse(response: unknown): ValidationResult<OutlineResponseSchema> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof response !== 'object' || response === null) {
    errors.push('Response is not an object');
    return {
      valid: false,
      errors,
      warnings,
      sanitized: getDefaultOutline()
    };
  }

  const obj = response as Record<string, unknown>;

  // Validate content (required)
  const content = ensureString(obj.content);
  if (!content) {
    errors.push('Missing required field: content');
  }

  // Validate pageBreakdown (optional array)
  let pageBreakdown: PageBreakdownItemSchema[] | undefined;
  if (obj.pageBreakdown !== undefined) {
    const rawBreakdown = ensureArray(obj.pageBreakdown, (item) => item);
    if (rawBreakdown.length > 0) {
      pageBreakdown = [];
      rawBreakdown.forEach((item, index) => {
        const { item: validatedItem, warnings: itemWarnings } = validatePageBreakdownItem(item, index);
        pageBreakdown!.push(validatedItem);
        warnings.push(...itemWarnings);
      });
    }
  }

  const sanitized: OutlineResponseSchema = {
    content: content || 'Story outline to be determined.',
    ...(pageBreakdown && pageBreakdown.length > 0 && { pageBreakdown })
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized
  };
}

/**
 * Returns a default Outline for error recovery
 */
export function getDefaultOutline(): OutlineResponseSchema {
  return {
    content: 'Story outline could not be generated. Please try again.'
  };
}

// ============================================================================
// GENERIC SCHEMA VALIDATION
// ============================================================================

export type SchemaName = 'beat' | 'characterProfile' | 'outline';

/**
 * Generic schema validation function
 * Routes to specific validators based on schema name
 */
export function validateSchema<T>(
  response: unknown,
  schemaName: SchemaName,
  options?: { providedName?: string }
): ValidationResult<T> {
  switch (schemaName) {
    case 'beat':
      return validateBeatResponse(response) as ValidationResult<T>;
    case 'characterProfile':
      return validateCharacterProfileResponse(response, options?.providedName) as ValidationResult<T>;
    case 'outline':
      return validateOutlineResponse(response) as ValidationResult<T>;
    default:
      return {
        valid: false,
        errors: [`Unknown schema: ${schemaName}`],
        warnings: [],
        sanitized: {} as T
      };
  }
}

// ============================================================================
// JSON PARSING WITH VALIDATION
// ============================================================================

/**
 * Parses JSON and validates against a schema in one step.
 * Handles markdown code blocks and malformed JSON gracefully.
 */
export function parseAndValidate<T>(
  jsonString: string,
  schemaName: SchemaName,
  options?: { providedName?: string }
): ValidationResult<T> {
  const errors: string[] = [];

  // Clean up the JSON string
  let cleaned = jsonString.trim();

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Try to find JSON object boundaries
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  } else {
    // Try array format
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
    }
  }

  // Attempt to parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown parse error';
    errors.push(`JSON parse error: ${error}`);

    // Return default based on schema type
    switch (schemaName) {
      case 'beat':
        return {
          valid: false,
          errors,
          warnings: [],
          sanitized: getDefaultBeat() as T
        };
      case 'characterProfile':
        return {
          valid: false,
          errors,
          warnings: [],
          sanitized: getDefaultCharacterProfile(options?.providedName) as T
        };
      case 'outline':
        return {
          valid: false,
          errors,
          warnings: [],
          sanitized: getDefaultOutline() as T
        };
      default:
        return {
          valid: false,
          errors,
          warnings: [],
          sanitized: {} as T
        };
    }
  }

  // Validate the parsed object
  const result = validateSchema<T>(parsed, schemaName, options);

  // Prepend any parse-related errors
  return {
    ...result,
    errors: [...errors, ...result.errors]
  };
}
