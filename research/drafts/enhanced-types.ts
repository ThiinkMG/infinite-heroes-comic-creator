/**
 * Enhanced Type Definitions for 4-Layer Consistency System
 *
 * Based on: research/gemini/character-consistency-guide.md
 * Status: DRAFT - To be integrated into types.ts after review
 *
 * @license Apache-2.0
 */

// ============================================================================
// LAYER 2: IDENTITY HEADER TYPES
// ============================================================================

/**
 * Structured visual identity description for a character.
 * Each field should be detailed enough to uniquely identify the character.
 */
export interface IdentityHeader {
  /**
   * Face shape and distinctive facial features.
   * Example: "Oval shape, high cheekbones, small rounded chin, slight dimple on left cheek"
   */
  face: string;

  /**
   * Eye color, shape, spacing, and typical expression.
   * Example: "Emerald green, almond-shaped, slightly wide-set, determined expression"
   */
  eyes: string;

  /**
   * Hair color, style, length, texture.
   * Example: "Curly auburn, shoulder-length, usually loose with volume"
   */
  hair: string;

  /**
   * Skin tone, texture, visible marks.
   * Example: "Light olive tone, small scar above left eyebrow (always visible)"
   */
  skin: string;

  /**
   * Body type, height impression, posture.
   * Example: "Athletic, medium height, confident posture"
   */
  build: string;

  /**
   * Items/features that should ALWAYS be present.
   * Example: ["silver pendant necklace", "leather jacket", "combat boots"]
   */
  signature: string[];
}

/**
 * Color palette extracted from character for consistency.
 */
export interface CharacterColorPalette {
  /** Dominant color (usually hair or main outfit) */
  primary: string;    // "Auburn red (#8B4513)"
  /** Second most prominent color */
  secondary: string;  // "Emerald green (#50C878)"
  /** Skin tone */
  skin: string;       // "Light olive (#C4A484)"
  /** Accent color (accessories, highlights) */
  accent: string;     // "Silver (#C0C0C0)"
}

// ============================================================================
// ENHANCED CHARACTER PROFILE
// ============================================================================

/**
 * Enhanced character profile with full 4-layer consistency support.
 * Extends the original CharacterProfile with structured identity data.
 */
export interface EnhancedCharacterProfile {
  // === Core Identity ===
  id: string;
  name: string;

  // === Layer 2: Visual Identity ===
  /**
   * Structured identity header for prompt injection.
   * This is the core of the consistency system.
   */
  identityHeader: IdentityHeader;

  /**
   * Features to explicitly EXCLUDE from generation.
   * Prevents common AI drift (adding glasses, changing hair, etc.)
   * Example: ["no bangs", "no freckles", "no glasses", "no beard"]
   */
  hardNegatives: string[];

  // === Multi-Character Support ===
  /**
   * What makes this character visually distinct from others.
   * Used when multiple characters are in the same scene.
   * Example: ["only character with red hair", "tallest in the group"]
   */
  contrastFeatures: string[];

  /**
   * Label for spatial positioning in multi-character scenes.
   * Example: "CHARACTER A", "CHARACTER B"
   */
  spatialLabel: string;

  // === Color Reference ===
  colorPalette: CharacterColorPalette;

  // === Reference Tracking ===
  /**
   * Index of the canonical/primary reference image.
   * Used when multiple refs exist to identify the "main" one.
   */
  canonicalImageIndex: number;

  /**
   * Page index of the last "approved" panel featuring this character.
   * Used for reference chaining - newer refs are better than original.
   */
  lastGoodPanelIndex?: number;

  // === Legacy Compatibility ===
  // These are computed from identityHeader for backward compatibility
  faceDescription: string;
  bodyType: string;
  clothing: string;
  distinguishingFeatures: string;
}

// ============================================================================
// PROMPT STRUCTURE TYPES
// ============================================================================

/**
 * Layer 1: Reference images with metadata
 */
export interface PromptReferenceImage {
  /** Base64 encoded image data */
  data: string;
  /** Label for the prompt (e.g., "HERO PORTRAIT") */
  label: string;
  /** Type of reference */
  type: 'portrait' | 'reference_sheet' | 'previous_panel' | 'style_reference';
  /** Which character this belongs to */
  characterId: string;
}

/**
 * Full prompt structure following 4-layer system
 */
export interface StructuredPrompt {
  // Layer 1: Reference Images
  references: PromptReferenceImage[];

  // Layer 2: Identity Headers (one per character)
  identities: Array<{
    characterId: string;
    characterName: string;
    identityHeader: IdentityHeader;
    hardNegatives: string[];
  }>;

  // Layer 3: Scene with reinforcement
  scene: {
    /** Full scene description with character names and features woven in */
    reinforcedDescription: string;
    /** Environment/setting */
    environment: string;
    /** Character action */
    action: string;
    /** Camera angle/shot type */
    camera: string;
    /** Lighting description */
    lighting: string;
    /** Emotional mood */
    mood: string;
  };

  // Layer 4: Consistency instructions
  consistency: {
    /** Main instruction text */
    instruction: string;
    /** Features that MUST be visible */
    mustBeVisible: string[];
    /** Art style anchor phrase */
    artStyleAnchor: string;
  };

  // Metadata
  panelType: 'cover' | 'story' | 'back_cover';
  pageIndex: number;
}

// ============================================================================
// REGENERATION TYPES
// ============================================================================

/**
 * Available regeneration modes for the reroll system
 */
export type RegenerationMode =
  | 'full'              // Regenerate entire panel from scratch
  | 'characters_only'   // Keep scene/background, regenerate all characters
  | 'single_character'  // Keep scene + other characters, regenerate one specific character
  | 'expression_only'   // Keep everything, only change facial expression
  | 'outfit_only'       // Keep everything, only change clothing
  | 'background_only'   // Keep characters exactly, change only background
  | 'lighting_only';    // Keep composition, change lighting/mood

/**
 * Configuration for a regeneration request
 */
export interface RegenerationConfig {
  mode: RegenerationMode;

  /** Page being regenerated */
  pageIndex: number;

  /** Original image to preserve elements from */
  originalImage: string;

  /** For single_character mode: which character to regenerate */
  targetCharacterId?: string;

  /** Custom instruction from user */
  userInstruction?: string;

  /** Elements to explicitly preserve */
  preserveElements: string[];

  /** For expression_only: target expression */
  targetExpression?: string;

  /** For outfit_only: new outfit description */
  newOutfit?: string;
}

// ============================================================================
// REFERENCE CHAINING TYPES
// ============================================================================

/**
 * Tracks the "last known good" panel for each character
 */
export interface CharacterReferenceChain {
  characterId: string;

  /** Page index of the last approved panel */
  lastGoodPageIndex: number;

  /** Image URL/base64 of that panel */
  lastGoodImage: string;

  /** When this was marked as good */
  approvedAt: number;

  /** User explicitly approved (vs auto-approved) */
  explicitlyApproved: boolean;
}

/**
 * State for managing reference chains
 */
export interface ReferenceChainState {
  chains: { [characterId: string]: CharacterReferenceChain };

  /** Auto-approve panels that aren't rerolled within X seconds */
  autoApproveDelayMs: number;

  /** Maximum chain length before resetting to original ref */
  maxChainLength: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Common AI drift patterns to auto-generate hard negatives
 */
export const COMMON_AI_DRIFT_PATTERNS = {
  hair: ['bangs', 'straight hair', 'curly hair', 'short hair', 'long hair'],
  face: ['freckles', 'moles', 'scars', 'wrinkles', 'dimples'],
  accessories: ['glasses', 'sunglasses', 'earrings', 'piercings', 'headband'],
  facial_hair: ['beard', 'mustache', 'stubble', 'goatee'],
  eyes: ['blue eyes', 'brown eyes', 'green eyes', 'hazel eyes'],
} as const;

/**
 * Auto-generate hard negatives based on character's actual features
 */
export function generateHardNegatives(identity: IdentityHeader): string[] {
  const negatives: string[] = [];

  // Hair-based negatives
  if (identity.hair.toLowerCase().includes('curly')) {
    negatives.push('no straight hair');
  } else if (identity.hair.toLowerCase().includes('straight')) {
    negatives.push('no curly hair');
  }

  if (!identity.hair.toLowerCase().includes('bangs')) {
    negatives.push('no bangs');
  }

  // Eye color negatives
  const eyeColor = identity.eyes.toLowerCase();
  if (eyeColor.includes('green')) {
    negatives.push('no blue eyes', 'no brown eyes');
  } else if (eyeColor.includes('blue')) {
    negatives.push('no green eyes', 'no brown eyes');
  } else if (eyeColor.includes('brown')) {
    negatives.push('no blue eyes', 'no green eyes');
  }

  // Skin/face negatives
  if (!identity.skin.toLowerCase().includes('freckle')) {
    negatives.push('no freckles');
  }

  if (!identity.skin.toLowerCase().includes('scar')) {
    negatives.push('no scars');
  }

  // Accessory negatives (assume none unless specified)
  if (!identity.signature.some(s => s.toLowerCase().includes('glass'))) {
    negatives.push('no glasses');
  }

  return negatives;
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Convert old CharacterProfile to EnhancedCharacterProfile
 */
export function migrateToEnhancedProfile(
  oldProfile: {
    id: string;
    name: string;
    faceDescription?: string;
    bodyType?: string;
    clothing?: string;
    colorPalette?: string;
    distinguishingFeatures?: string;
  }
): EnhancedCharacterProfile {
  // Parse existing data into structured format
  const identityHeader: IdentityHeader = {
    face: oldProfile.faceDescription || '',
    eyes: extractEyeInfo(oldProfile.faceDescription || ''),
    hair: extractHairInfo(oldProfile.colorPalette || ''),
    skin: extractSkinInfo(oldProfile.colorPalette || ''),
    build: oldProfile.bodyType || '',
    signature: (oldProfile.distinguishingFeatures || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  };

  const enhanced: EnhancedCharacterProfile = {
    id: oldProfile.id,
    name: oldProfile.name,
    identityHeader,
    hardNegatives: generateHardNegatives(identityHeader),
    contrastFeatures: [],
    spatialLabel: `CHARACTER ${oldProfile.name.charAt(0).toUpperCase()}`,
    colorPalette: parseColorPalette(oldProfile.colorPalette || ''),
    canonicalImageIndex: 0,
    // Legacy compatibility
    faceDescription: oldProfile.faceDescription || '',
    bodyType: oldProfile.bodyType || '',
    clothing: oldProfile.clothing || '',
    distinguishingFeatures: oldProfile.distinguishingFeatures || '',
  };

  return enhanced;
}

// Helper functions for migration
function extractEyeInfo(faceDesc: string): string {
  const eyeMatch = faceDesc.match(/eye[s]?[:\s]+([^,.]+)/i);
  return eyeMatch ? eyeMatch[1].trim() : '';
}

function extractHairInfo(colorPalette: string): string {
  const hairMatch = colorPalette.match(/hair[:\s]+([^,.]+)/i);
  return hairMatch ? hairMatch[1].trim() : '';
}

function extractSkinInfo(colorPalette: string): string {
  const skinMatch = colorPalette.match(/skin[:\s]+([^,.]+)/i);
  return skinMatch ? skinMatch[1].trim() : '';
}

function parseColorPalette(paletteStr: string): CharacterColorPalette {
  // Default fallback
  return {
    primary: '#333333',
    secondary: '#666666',
    skin: '#E0B8A0',
    accent: '#999999',
  };
}

// ============================================================================
// PROMPT TEMPLATE FUNCTIONS
// ============================================================================

/**
 * Generate the identity header block for a prompt
 */
export function formatIdentityHeader(profile: EnhancedCharacterProfile): string {
  const { identityHeader, hardNegatives, name } = profile;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER IDENTITY - ${name.toUpperCase()}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MUST-MATCH VISUALS:
- Face: ${identityHeader.face}
- Eyes: ${identityHeader.eyes}
- Hair: ${identityHeader.hair}
- Skin: ${identityHeader.skin}
- Build: ${identityHeader.build}
- Signature elements: ${identityHeader.signature.join(', ')}

HARD NEGATIVES (never include): ${hardNegatives.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Generate scene description with character reinforcement (Layer 3)
 */
export function formatReinforcedScene(
  profile: EnhancedCharacterProfile,
  action: string,
  environment: string
): string {
  const keyFeatures = [
    profile.identityHeader.hair.split(',')[0],
    profile.identityHeader.signature[0],
  ].filter(Boolean);

  return `${profile.name}, recognizable by their ${keyFeatures.join(' and ')}, ${action} in ${environment}.`;
}

/**
 * Generate consistency instruction (Layer 4)
 */
export function formatConsistencyInstruction(
  profile: EnhancedCharacterProfile,
  artStyle: string
): string {
  const mustBeVisible = [
    ...profile.identityHeader.signature.slice(0, 2),
  ].filter(Boolean);

  return `
CONSISTENCY REQUIREMENT: Maintain ${profile.name}'s exact appearance from the reference image.
${mustBeVisible.length > 0 ? `The following MUST be visible: ${mustBeVisible.join(', ')}.` : ''}
Art style: ${artStyle} (maintain consistently).
Do not alter facial structure, eye color, or hair style.
`.trim();
}
