/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Novel Mode batch size (generates in smaller batches with user review)
export const NOVEL_MODE_BATCH_SIZE = 3;

// Core Configuration Factory
export const getComicConfig = (storyLength: number, extraPages: number = 0, isNovelMode: boolean = false) => {
    // Decision pages adjusted for new smaller page lengths (3, 5, 8)
    const getDecisionPages = (pages: number): number[] => {
        if (pages <= 3) return [2];                    // Quick Shot: 1 decision
        if (pages <= 5) return [2, 4];                 // Short Story: 2 decisions
        return [3, 5, 7];                              // Standard Issue: 3 decisions
    };

    return {
        MAX_STORY_PAGES: storyLength + extraPages,
        BACK_COVER_PAGE: storyLength + extraPages + 1,
        TOTAL_PAGES: storyLength + extraPages + 1,
        INITIAL_PAGES: Math.min(2, storyLength),
        GATE_PAGE: Math.min(2, storyLength),
        BATCH_SIZE: isNovelMode ? NOVEL_MODE_BATCH_SIZE : 3,
        DECISION_PAGES: getDecisionPages(storyLength + extraPages)
    };
};

export const ART_STYLES = [
  "Modern American Comic",
  "Classic 90s Marvel",
  "Black & White Manga",
  "Gritty Noir Horror",
  "Watercolor Fantasy",
  "Cinematic 3D Render"
];

export const PAGE_LENGTHS = [
  { label: "Quick Shot (3 Pages)", value: 3 },
  { label: "Short Story (5 Pages)", value: 5 },
  { label: "Standard Issue (8 Pages)", value: 8 }
];
export const GENRES = ["Classic Horror", "Superhero Action", "Dark Sci-Fi", "High Fantasy", "Neon Noir Detective", "Wasteland Apocalypse", "Lighthearted Comedy", "Teen Drama / Slice of Life", "Custom"];
export const TONES = [
    "ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)",
    "INNER-MONOLOGUE (Heavy captions revealing thoughts.)",
    "QUIPPY (Characters use humor as a defense mechanism.)",
    "OPERATIC (Grand, dramatic declarations and high stakes.)",
    "CASUAL (Natural dialogue, focus on relationships/gossip.)",
    "WHOLESOME (Warm, gentle, optimistic.)"
];

export const LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'ar-EG', name: 'Arabic (Egypt)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'id-ID', name: 'Indonesian (Indonesia)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'ua-UA', name: 'Ukrainian (Ukraine)' },
    { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
    { code: 'zh-CN', name: 'Chinese (China)' }
];

export const CHARACTER_ROLES = [
  'Hero',
  'Anti-Hero',
  'Sidekick',
  'Antagonist',
  'Villain',
  'Family/Friend',
  'Custom'
] as const;

export type CharacterRole = typeof CHARACTER_ROLES[number];

// Emblem/Logo Placement Options
export type EmblemPlacement =
  | 'chest-top-right'
  | 'chest-top-left'
  | 'chest-center'
  | 'back'
  | 'face'
  | 'hair'
  | 'shoulder'
  | 'weapon'
  | 'other';

export const EMBLEM_PLACEMENTS: { value: EmblemPlacement; label: string }[] = [
  { value: 'chest-top-right', label: 'Chest (Top Right)' },
  { value: 'chest-top-left', label: 'Chest (Top Left)' },
  { value: 'chest-center', label: 'Chest (Center)' },
  { value: 'back', label: 'Back' },
  { value: 'face', label: 'Face' },
  { value: 'hair', label: 'Hair' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'other', label: 'Other (Manual Entry)' }
];

// ============================================================================
// 4-LAYER CONSISTENCY SYSTEM TYPES
// ============================================================================

/**
 * Structured visual identity description for a character (Layer 2).
 * Each field should be detailed enough to uniquely identify the character.
 */
export interface IdentityHeader {
  /** Face shape and distinctive features. E.g., "Oval shape, high cheekbones, small chin" */
  face: string;
  /** Eye color, shape, spacing. E.g., "Emerald green, almond-shaped, wide-set" */
  eyes: string;
  /** Hair color, style, length. E.g., "Curly auburn, shoulder-length, loose" */
  hair: string;
  /** Skin tone, marks, texture. E.g., "Light olive, scar above left eyebrow" */
  skin: string;
  /** Body type, height, posture. E.g., "Athletic, medium height, confident posture" */
  build: string;
  /** Items/features that should ALWAYS be present. E.g., ["silver pendant", "leather jacket"] */
  signature: string[];
}

/**
 * Regeneration modes for the reroll system
 */
export type RegenerationMode =
  | 'full'              // Regenerate entire panel from scratch
  | 'characters_only'   // Keep scene/background, regenerate all characters
  | 'expression_only'   // Keep everything, only change facial expression
  | 'outfit_only';      // Keep everything, only change clothing

/**
 * Reroll options with comic fundamentals overrides
 * These allow users to override the default page plan settings during reroll
 */
export interface RerollOptions {
  /** Regeneration mode (full, characters_only, etc.) - undefined means default/auto */
  regenerationMode?: RegenerationMode;

  /** User instruction text */
  instruction: string;

  /** Negative prompt - things to EXCLUDE from generation (e.g., "no mask, no cape, no helmet") */
  negativePrompt?: string;

  /** Selected reference images (base64) */
  selectedRefImages: string[];

  /** Selected character profile IDs to enforce */
  selectedProfileIds: string[];

  // === Comic Fundamentals Overrides ===

  /** Override the shot type from page plan */
  shotTypeOverride?: ShotType;

  /** Override the balloon shape for dialogue */
  balloonShapeOverride?: BalloonShape;

  /** Apply flashback styling (sepia, soft edges) */
  applyFlashbackStyle?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  base64: string; // The generated or uploaded portrait
  desc: string;
  referenceImage?: string; // Legacy single reference image base64
  referenceImages?: string[]; // Multiple reference images
  role?: CharacterRole;
  customRole?: string; // Used when role is 'Family/Friend' or 'Custom'
  backstoryText?: string;
  backstoryFiles?: { base64: string; mimeType: string; name: string }[];
  // === Emblem/Logo Support ===
  /** Emblem/logo reference image (base64) */
  emblemImage?: string;
  /** Where the emblem should be placed on the character */
  emblemPlacement?: EmblemPlacement;
  /** Custom placement description when emblemPlacement is 'other' */
  emblemPlacementCustom?: string;
  // === Weapon Reference Support ===
  /** Weapon reference image (base64) */
  weaponImage?: string;
  /** Description of the weapon for AI consistency */
  weaponDescriptionText?: string;
  // === Mid-Project Addition Support ===
  /** Timestamp when character was added (for tracking mid-project additions) */
  addedAt?: number;
  /** Whether character has appeared in the comic yet */
  isIntroduced?: boolean;
  /** Which page the character first appears on */
  firstAppearancePage?: number;
  /** All pages where this character appears */
  appearancePages?: number[];
}

export interface StoryContext {
  title: string;
  descriptionText: string;
  descriptionFiles: { base64: string; mimeType: string; name: string }[];
  publisherName: string;
  publisherLogo?: string;
  seriesTitle: string;
  issueNumber: string;
  useOverlayLogo: boolean;
  artStyle: string;
  pageLength: number;
  publisherLogoBgColor?: string;
  publisherLogoFit?: 'cover' | 'contain';
}

export interface StoryOutline {
  content: string;
  isReady: boolean;
  isGenerating: boolean;
  /** Per-page breakdown with comic fundamentals (optional for backward compatibility) */
  pageBreakdown?: PageCharacterPlan[];
  /** Timestamp of last edit */
  lastEditedAt?: number;
  /** Version number for conflict detection */
  version?: number;
  /** Whether the outline has been enhanced with comic fundamentals */
  isEnhanced?: boolean;
}

export interface ComicFace {
    id: string;
    type: 'cover' | 'story' | 'back_cover';
    imageUrl?: string;
    isLoading?: boolean;
    hasFailed?: boolean;
    choices: string[];
    isDecisionPage?: boolean;
    resolvedChoice?: string;
    pageIndex?: number;
    narrative?: Beat;
    /** Original prompt used to generate this panel (for debugging/reroll reference) */
    originalPrompt?: string;
    /** Previous choices that were rejected (for reroll to generate different options) */
    previousChoices?: string[];
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'other' | string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  faceDescription: string;
  bodyType: string;
  clothing: string;
  colorPalette: string;
  distinguishingFeatures: string;
  /** Description of emblem/logo and its placement if provided */
  emblemDescription?: string;
  /** Detailed mask description if character wears a mask */
  maskDescription?: string;
  /** Detailed hair information */
  hairDetails?: {
    length: string;
    type: string;
    color: string;
    style: string;
  };
  /** Weapon description if character has a signature weapon */
  weaponDescription?: string;

  // === 4-Layer Consistency System Fields ===
  /** Structured identity header for Layer 2 prompt injection */
  identityHeader?: IdentityHeader;
  /** Features to explicitly EXCLUDE from generation (prevents AI drift) */
  hardNegatives?: string[];
  /** What makes this character visually distinct from others */
  contrastFeatures?: string[];
}

export interface RerollPayload {
  pageIndex: number;
  instruction: string;
  selectedRefImages: string[];  // base64 strings of toggled-on images
  useCharacterProfiles?: boolean;
  regenerationMode?: RegenerationMode;
  // === Comic Fundamentals Overrides ===
  shotTypeOverride?: ShotType;
  balloonShapeOverride?: BalloonShape;
  applyFlashbackStyle?: boolean;
}

// ============================================================================
// 4-LAYER CONSISTENCY HELPER FUNCTIONS
// ============================================================================

/**
 * Generate hard negatives based on a character's identity header.
 * Prevents common AI drift patterns (adding glasses, changing hair, etc.)
 */
export function generateHardNegatives(identity: IdentityHeader): string[] {
  const negatives: string[] = [];

  // Hair-based negatives
  const hairLower = identity.hair.toLowerCase();
  if (hairLower.includes('curly')) negatives.push('no straight hair');
  else if (hairLower.includes('straight')) negatives.push('no curly hair');
  if (!hairLower.includes('bangs')) negatives.push('no bangs');
  if (hairLower.includes('short')) negatives.push('no long hair');
  else if (hairLower.includes('long')) negatives.push('no short hair');

  // Eye color negatives
  const eyeLower = identity.eyes.toLowerCase();
  if (eyeLower.includes('green')) negatives.push('no blue eyes', 'no brown eyes');
  else if (eyeLower.includes('blue')) negatives.push('no green eyes', 'no brown eyes');
  else if (eyeLower.includes('brown')) negatives.push('no blue eyes', 'no green eyes');

  // Face/skin negatives (assume no features unless specified)
  const skinLower = identity.skin.toLowerCase();
  if (!skinLower.includes('freckle')) negatives.push('no freckles');
  if (!skinLower.includes('beard') && !skinLower.includes('facial hair')) {
    negatives.push('no beard', 'no facial hair');
  }

  // Accessory negatives
  const allText = JSON.stringify(identity).toLowerCase();
  if (!allText.includes('glass')) negatives.push('no glasses');
  if (!allText.includes('earring')) negatives.push('no earrings');

  return negatives;
}

/**
 * Format an identity header block for prompt injection (Layer 2)
 */
export function formatIdentityHeader(profile: CharacterProfile): string {
  if (!profile.identityHeader) {
    // Fallback for profiles without structured identity header
    let result = `
CHARACTER: ${profile.name}
- Face: ${profile.faceDescription}
- Build: ${profile.bodyType}
- Clothing: ${profile.clothing}
- Colors: ${profile.colorPalette}
- Distinguishing: ${profile.distinguishingFeatures}`;
    if (profile.emblemDescription) {
      result += `\n- EMBLEM/LOGO: ${profile.emblemDescription} [MUST BE VISIBLE]`;
    }
    if (profile.maskDescription) {
      result += `\n- MASK: ${profile.maskDescription} [MUST ALWAYS WEAR THIS MASK]`;
    }
    if (profile.hairDetails) {
      result += `\n- HAIR: ${profile.hairDetails.length} ${profile.hairDetails.color} ${profile.hairDetails.type} hair, ${profile.hairDetails.style}`;
    }
    if (profile.weaponDescription) {
      result += `\n- WEAPON: ${profile.weaponDescription} [SIGNATURE WEAPON]`;
    }
    return result.trim();
  }

  const { identityHeader, hardNegatives, name, emblemDescription, maskDescription, hairDetails, weaponDescription } = profile;
  const negativesStr = hardNegatives?.length ? hardNegatives.join(', ') : 'none specified';
  const emblemStr = emblemDescription ? `\n- EMBLEM/LOGO: ${emblemDescription} [MUST ALWAYS BE VISIBLE ON THIS CHARACTER]` : '';
  const maskStr = maskDescription ? `\n- MASK: ${maskDescription} [CHARACTER MUST ALWAYS WEAR THIS MASK]` : '';
  const hairStr = hairDetails ? `\n- HAIR DETAILS: ${hairDetails.length} ${hairDetails.color} ${hairDetails.type} hair, worn ${hairDetails.style}` : '';
  const weaponStr = weaponDescription ? `\n- SIGNATURE WEAPON: ${weaponDescription}` : '';

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
- Signature elements: ${identityHeader.signature.join(', ')}${emblemStr}${maskStr}${hairStr}${weaponStr}

HARD NEGATIVES (never include): ${negativesStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Safely convert a value to string before splitting
 * Handles cases where AI returns objects instead of strings
 */
function safeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(val);
}

/**
 * Generate scene description with character reinforcement (Layer 3)
 */
export function formatReinforcedScene(
  profile: CharacterProfile,
  action: string,
  environment: string
): string {
  const keyFeatures: string[] = [];

  if (profile.identityHeader) {
    // Use structured data
    const firstHairPart = profile.identityHeader.hair.split(',')[0];
    if (firstHairPart) keyFeatures.push(firstHairPart);
    if (profile.identityHeader.signature[0]) keyFeatures.push(profile.identityHeader.signature[0]);
  } else {
    // Fallback to legacy fields - use safeString to handle object values
    const colorStr = safeString(profile.colorPalette);
    const featuresStr = safeString(profile.distinguishingFeatures);
    if (colorStr) keyFeatures.push(colorStr.split(',')[0]);
    if (featuresStr) keyFeatures.push(featuresStr.split(',')[0]);
  }

  const featuresText = keyFeatures.length > 0
    ? `recognizable by their ${keyFeatures.join(' and ')}, `
    : '';

  return `${profile.name}, ${featuresText}${action} in ${environment}.`;
}

/**
 * Generate consistency instruction (Layer 4)
 */
export function formatConsistencyInstruction(
  profile: CharacterProfile,
  artStyle: string
): string {
  const mustBeVisible: string[] = [];

  if (profile.identityHeader?.signature) {
    mustBeVisible.push(...profile.identityHeader.signature.slice(0, 2));
  }
  if (profile.distinguishingFeatures) {
    // Use safeString to handle object values from AI
    const featuresStr = safeString(profile.distinguishingFeatures);
    if (featuresStr) mustBeVisible.push(featuresStr.split(',')[0].trim());
  }

  const visibleText = mustBeVisible.length > 0
    ? `The following MUST be visible: ${mustBeVisible.join(', ')}.`
    : '';

  return `
CONSISTENCY REQUIREMENT: Maintain ${profile.name}'s exact appearance from the reference image.
${visibleText}
Art style: ${artStyle} (maintain consistently throughout).
Do not alter facial structure, eye color, hair style, or distinguishing features.
`.trim();
}

// ============================================================================
// COMIC FUNDAMENTALS TYPES (Based on McCloud's Understanding Comics)
// ============================================================================

/**
 * McCloud's 6 Panel Transition Types
 * These define how panels relate to each other temporally and spatially.
 */
export type TransitionType =
  | 'moment-to-moment'    // Tiny time gap, slow-motion effect (rare: ~2%)
  | 'action-to-action'    // Single subject progressing through action (most common: ~65%)
  | 'subject-to-subject'  // Same scene, different subject (dialogue scenes: ~20%)
  | 'scene-to-scene'      // Time/location jump (narrative advancement: ~10%)
  | 'aspect-to-aspect'    // Different aspects of same place/mood (atmospheric: ~2%)
  | 'non-sequitur';       // No logical connection (surreal/experimental: ~1%)

/**
 * Camera/Shot Types for Panel Composition
 * Controls how characters are framed in the panel.
 */
export type ShotType =
  | 'extreme-close-up'    // Eyes/detail only - maximum emotional impact
  | 'close-up'            // Face fills frame - emotion focus
  | 'medium'              // Waist-up - balance of character and context
  | 'full'                // Complete figure - body language emphasis
  | 'wide'                // Environment prominent with characters
  | 'extreme-wide';       // Establishing shot - vast environment, small figures

/**
 * Panel Layout Options for Page Composition
 * Determines how panels are arranged on a page.
 */
export type PanelLayout =
  | 'splash'              // Full page single panel (dramatic moments, reveals)
  | 'horizontal-split'    // 2 wide panels stacked (landscapes, calm moments)
  | 'vertical-split'      // 2 tall panels side-by-side (simultaneous events)
  | 'grid-2x2'            // 4 panels (fast pacing, quick moments)
  | 'grid-2x3'            // 6 panels (standard narrative, dialogue - MOST COMMON)
  | 'grid-3x3'            // 9 panels (dense, tension building, detailed)
  | 'asymmetric';         // Mixed sizes (dynamic action, small-small-small-LARGE)

/**
 * Emotional Beat Types for Narrative Flow
 * Helps AI understand the purpose of each page in the story.
 */
export type EmotionalBeat =
  | 'establishing'        // Scene setup, introduce setting
  | 'action'              // Physical activity, movement
  | 'dialogue'            // Conversation focus
  | 'reaction'            // Character response to events
  | 'climax'              // Peak dramatic moment
  | 'transition'          // Scene change, time passage
  | 'reveal';             // Surprise, twist, important information

/**
 * Balloon Shape Types for Dialogue
 * Different shapes convey different voice qualities.
 */
export type BalloonShape =
  | 'oval'                // Normal speech (default)
  | 'burst'               // Shouting, excitement, anger
  | 'wavy'                // Weak, distressed, injured
  | 'dashed'              // Whisper, quiet
  | 'cloud'               // Thought (deprecated but available)
  | 'rectangle'           // Robotic, electronic, AI
  | 'jagged'              // Radio, phone, broadcast
  | 'inverted';           // Alien, otherworldly (black bg, white text)

/**
 * Caption Box Types for Narration
 */
export type CaptionType =
  | 'narration'           // Third-person storytelling (yellow default)
  | 'internal-monologue'  // Character thoughts (character-colored)
  | 'location-time'       // Setting info ("Meanwhile...", "Later that night...")
  | 'flashback'           // Past events (sepia styling)
  | 'editorial';          // Writer/editor notes

/**
 * Pacing Intent for Reading Speed Control
 */
export type PacingIntent = 'slow' | 'medium' | 'fast';

// ============================================================================
// ENHANCED OUTLINE & PAGE PLANNING TYPES
// ============================================================================

/**
 * Per-page plan that includes comic fundamentals.
 * Generated as part of the enhanced outline.
 */
export interface PageCharacterPlan {
  /** Page number (1-indexed) */
  pageIndex: number;

  /** Characters who appear on this page (IDs: 'hero', 'friend', or additionalCharacter.id) */
  primaryCharacters: string[];

  /** Characters who may appear but aren't focus */
  secondaryCharacters?: string[];

  /** The main focus character for this page */
  focusCharacter: string;

  /** Brief scene description from outline */
  sceneDescription?: string;

  /** Whether this is a decision/choice page (Novel Mode) */
  isDecisionPage: boolean;

  // === Comic Fundamentals ===

  /** How the page panels should be arranged */
  panelLayout: PanelLayout;

  /** Override panel count for asymmetric layouts */
  panelCount?: number;

  /** How this page transitions to the next */
  transitionType: TransitionType;

  /** Suggested camera framing */
  suggestedShot: ShotType;

  /** Type of story beat */
  emotionalBeat: EmotionalBeat;

  /** Reading speed intent */
  pacingIntent: PacingIntent;

  /** Caption styling type */
  captionType?: CaptionType;

  /** Whether to apply flashback visual styling (sepia, soft edges) */
  isFlashback?: boolean;

  /** Dialogue volume hint for balloon shape */
  dialogueVolume?: 'whisper' | 'normal' | 'loud' | 'shouting';
}

/**
 * Enhanced story outline with per-page breakdown.
 */
export interface EnhancedStoryOutline {
  /** Full narrative text */
  content: string;

  /** Per-page character and comic fundamentals plans */
  pageBreakdown: PageCharacterPlan[];

  /** Whether outline is ready for generation */
  isReady: boolean;

  /** Whether outline is currently being generated */
  isGenerating: boolean;

  /** Timestamp of last edit */
  lastEditedAt?: number;

  /** Version number for conflict detection */
  version?: number;

  /** Whether the outline has been enhanced with comic fundamentals */
  isEnhanced?: boolean;
}

/**
 * Enhanced persona with mid-project addition support
 */
export interface EnhancedPersona extends Persona {
  /** Timestamp when character was added */
  addedAt?: number;

  /** Whether character has appeared in the comic yet */
  isIntroduced?: boolean;

  /** Which page the character first appears on */
  firstAppearancePage?: number;

  /** All pages where this character appears */
  appearancePages?: number[];
}

// ============================================================================
// COMIC FUNDAMENTALS HELPER FUNCTIONS
// ============================================================================

/**
 * Get balloon shape based on dialogue context
 */
export function selectBalloonShape(
  volume?: 'whisper' | 'normal' | 'loud' | 'shouting',
  emotion?: 'calm' | 'angry' | 'sad' | 'weak' | 'frightened',
  medium?: 'phone' | 'radio' | 'telepathy' | 'robotic'
): BalloonShape {
  if (medium === 'phone' || medium === 'radio') return 'jagged';
  if (medium === 'robotic') return 'rectangle';
  if (medium === 'telepathy') return 'cloud';
  if (volume === 'shouting') return 'burst';
  if (volume === 'whisper') return 'dashed';
  if (emotion === 'weak' || emotion === 'frightened') return 'wavy';
  return 'oval';
}

/**
 * Get caption color based on type and character
 */
export interface CaptionColorScheme {
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  fontStyle?: 'normal' | 'italic';
}

export const CAPTION_COLORS: Record<CaptionType, CaptionColorScheme> = {
  'narration': { backgroundColor: '#F5E050', textColor: '#000', fontStyle: 'italic' },
  'internal-monologue': { backgroundColor: '#FFE4B5', textColor: '#000', fontStyle: 'italic' },
  'location-time': { backgroundColor: '#333', textColor: '#FFF', fontStyle: 'normal' },
  'flashback': { backgroundColor: '#D4A574', textColor: '#3D2914', fontStyle: 'italic' },
  'editorial': { backgroundColor: '#E0E0E0', textColor: '#333', fontStyle: 'italic' },
};

/**
 * Get layout prompt instructions based on panel layout type
 */
export function getLayoutInstructions(layout: PanelLayout): string {
  const instructions: Record<PanelLayout, string> = {
    'splash': 'FULL PAGE SPLASH: Single dramatic image filling the entire page. This is a KEY MOMENT - maximum visual impact. Leave space at top for title/credits if needed.',
    'horizontal-split': 'TWO HORIZONTAL PANELS: Two wide panels stacked vertically. Good for panoramic scenes or showing cause-and-effect.',
    'vertical-split': 'TWO VERTICAL PANELS: Two tall panels side-by-side. Good for showing simultaneous events or character comparison.',
    'grid-2x2': 'FOUR-PANEL GRID (2×2): Quick, punchy pacing. Each panel should be a distinct beat in a rapid sequence.',
    'grid-2x3': 'SIX-PANEL GRID (2×3): Standard comic layout. Balanced pacing for dialogue and narrative progression.',
    'grid-3x3': 'NINE-PANEL GRID (3×3): Dense, controlled pacing. Each small panel builds tension. Used for suspense or detailed sequences.',
    'asymmetric': 'ASYMMETRIC LAYOUT: Mix of panel sizes. Use the "small-small-small-LARGE" pattern: buildup panels leading to a dramatic payoff panel.',
  };
  return instructions[layout];
}

/**
 * Get shot framing instructions based on shot type
 */
export function getShotInstructions(shot: ShotType): string {
  const instructions: Record<ShotType, string> = {
    'extreme-close-up': 'EXTREME CLOSE-UP: Show only eyes or a single detail. Maximum emotional intensity. Fill frame with the subject.',
    'close-up': 'CLOSE-UP: Face fills most of the frame. Capture subtle emotions clearly. Minimal background visible.',
    'medium': 'MEDIUM SHOT: Waist-up framing. Balance between character expression and environmental context.',
    'full': 'FULL SHOT: Complete figure visible head to toe. Emphasize body language and posture. Some environment context.',
    'wide': 'WIDE SHOT: Environment prominent with characters clearly visible. Establish spatial relationships.',
    'extreme-wide': 'ESTABLISHING SHOT: Vast environment dominates. Characters may be small or silhouetted. Set the scene\'s scope.',
  };
  return instructions[shot];
}

/**
 * Get transition context for narrative flow
 */
export function getTransitionContext(
  transitionType: TransitionType,
  previousScene?: string
): string {
  const prevContext = previousScene ? ` Previous scene: "${previousScene}"` : '';

  const contexts: Record<TransitionType, string> = {
    'moment-to-moment': `SLOW MOTION: This panel shows the very next moment. Minimal time has passed.${prevContext} Keep camera angle similar, show subtle change.`,
    'action-to-action': `ACTION CONTINUATION: This follows the action sequence.${prevContext} Show the next beat in the physical movement.`,
    'subject-to-subject': `SAME SCENE, NEW FOCUS: Same time and place, different subject.${prevContext} Shift attention to another character or element.`,
    'scene-to-scene': `NEW SCENE: Time and/or location has changed.${prevContext} This is a fresh moment - establish the new context.`,
    'aspect-to-aspect': `ATMOSPHERIC: Same location, different aspect.${prevContext} Focus on environmental detail to set mood.`,
    'non-sequitur': `SURREAL CUT: No logical connection required.${prevContext} Abstract or dreamlike transition.`,
  };

  return contexts[transitionType];
}

/**
 * Get flashback styling instructions
 */
export function getFlashbackInstructions(): string {
  return `
FLASHBACK STYLING:
- Apply SEPIA/WARM BROWN color palette
- Add SOFT VIGNETTE around panel edges
- Slightly DESATURATED colors (except sepia tones)
- SOFTER LIGHTING than present-day scenes
- Consider FILM GRAIN or AGED PAPER texture effect
- Memory/nostalgic quality throughout
`.trim();
}
