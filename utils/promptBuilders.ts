/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Prompt Builders Utility Module
 *
 * This module centralizes all prompt construction functions used for AI generation.
 * It provides a comprehensive set of utilities for building consistent, well-structured
 * prompts for both text (narrative) and image generation in the comic creation workflow.
 *
 * The module implements the 4-Layer Character Consistency System:
 * - Layer 1: Reference images with labels (handled in App.tsx)
 * - Layer 2: formatIdentityHeader() - structured identity blocks
 * - Layer 3: formatReinforcedScene() - scene descriptions with character anchors
 * - Layer 4: formatConsistencyInstruction() - final consistency requirements
 */

import type {
  CharacterProfile,
  IdentityHeader,
  RegenerationMode,
  ShotType,
  PanelLayout,
  TransitionType,
  EmotionalBeat,
  PacingIntent,
  BalloonShape,
  CaptionType,
  PageCharacterPlan,
} from '../types';

// Re-export core prompt functions from types.ts
export {
  // 4-Layer Consistency System Functions
  generateHardNegatives,
  formatIdentityHeader,
  formatReinforcedScene,
  formatConsistencyInstruction,

  // Comic Fundamentals Helper Functions
  selectBalloonShape,
  getLayoutInstructions,
  getShotInstructions,
  getTransitionContext,
  getFlashbackInstructions,
} from '../types';

// Re-export types needed for prompt building
export type {
  CharacterProfile,
  IdentityHeader,
  RegenerationMode,
  ShotType,
  PanelLayout,
  TransitionType,
  EmotionalBeat,
  PacingIntent,
  BalloonShape,
  CaptionType,
  PageCharacterPlan,
} from '../types';

// ============================================================================
// CRITICAL CONSISTENCY DIRECTIVES
// ============================================================================

/**
 * The core consistency directives that must be included in every image generation prompt.
 * These enforce visual consistency across all comic panels.
 *
 * @param styleEra - The style era (e.g., "Classic Horror", "Superhero Action")
 * @param artStyleTag - The art style tag (e.g., ", Modern American Comic style")
 * @param selectedGenre - The selected genre
 * @returns Formatted directive string
 */
export function buildConsistencyDirectives(
  styleEra: string,
  artStyleTag: string,
  selectedGenre: string
): string {
  return `[CRITICAL CONSISTENCY DIRECTIVES - MUST FOLLOW]:
1. [FACE & IDENTITY] Copy EXACT facial features, hairstyle, body type from REFERENCE images. Characters MUST be instantly recognizable. Include all distinguishing features (scars, tattoos, hair color). Reference images are SOURCE OF TRUTH.
2. [ART STYLE] STRICT ${styleEra} comic book art${artStyleTag}, ${selectedGenre} genre. Every pixel must match this style - line work, coloring, shading, environment, lighting.
3. [EMBLEM/LOGO] If character has emblem reference, draw it EXACTLY at specified placement. Match shape, colors, design precisely.
4. [CLOTHING] Copy costume/outfit EXACTLY from references - fabric patterns, armor, accessories, boots, capes. This is their SIGNATURE LOOK.`;
}

// ============================================================================
// REGENERATION MODE INSTRUCTIONS
// ============================================================================

/**
 * Instructions for each regeneration mode. These tell the AI exactly what to preserve
 * and what to regenerate when rerolling a panel.
 */
export const REGENERATION_MODE_INSTRUCTIONS: Record<RegenerationMode, string> = {
  'full': '',
  'characters_only': '[CHARACTERS ONLY - PRESERVE SCENE] Study the CURRENT PANEL IMAGE below. Keep the EXACT same background, environment, lighting, and scene composition. ONLY regenerate the character(s) with improved consistency to their reference images. The background MUST remain identical.',
  'expression_only': '[EXPRESSION ONLY - PRESERVE EVERYTHING] Study the CURRENT PANEL IMAGE below. Keep EVERYTHING exactly the same (pose, clothing, background, lighting). ONLY change the facial expression of the character(s).',
  'outfit_only': '[OUTFIT ONLY - PRESERVE SCENE] Study the CURRENT PANEL IMAGE below. Keep the face, pose, background, and lighting exactly the same. ONLY change the clothing/outfit of the character(s).',
  'emblem_only': '[EMBLEM ONLY - PRESERVE SCENE] Study the CURRENT PANEL IMAGE below. Keep everything exactly the same EXCEPT the emblem/logo. Reproduce the EMBLEM/LOGO reference EXACTLY - same shape, colors, proportions, and placement.',
  'weapon_only': '[WEAPON ONLY - PRESERVE SCENE] Study the CURRENT PANEL IMAGE below. Keep everything exactly the same EXCEPT the weapon. Reproduce the WEAPON reference EXACTLY - same design, shape, details, and style.'
};

/**
 * Build the combined instruction string for multiple regeneration modes.
 *
 * @param modes - Array of regeneration modes selected by the user
 * @param baseInstruction - Optional additional instruction text
 * @returns Combined instruction string
 */
export function buildRegenerationModeInstruction(
  modes: RegenerationMode[] | undefined,
  baseInstruction: string = ''
): string {
  if (!modes || modes.length === 0) {
    return baseInstruction;
  }

  const nonFullModes = modes.filter(m => m !== 'full');
  if (nonFullModes.length === 0) {
    return baseInstruction;
  }

  const combinedModeInstructions = nonFullModes
    .map(m => REGENERATION_MODE_INSTRUCTIONS[m])
    .join(' ');

  return combinedModeInstructions + (baseInstruction ? ` Additional: ${baseInstruction}` : '');
}

// ============================================================================
// BALLOON SHAPE INSTRUCTIONS
// ============================================================================

/**
 * Instructions for different speech balloon shapes in comic panels.
 * These guide the AI in rendering appropriate dialogue styling.
 */
export const BALLOON_SHAPE_INSTRUCTIONS: Record<BalloonShape, string> = {
  'oval': 'DIALOGUE STYLE: Use standard oval speech bubbles for normal conversation.',
  'burst': 'DIALOGUE STYLE: Use BURST/EXPLOSION speech bubbles - spiky edges indicating SHOUTING or excitement!',
  'wavy': 'DIALOGUE STYLE: Use WAVY/WOBBLY speech bubbles indicating weak, distressed, or injured speech...',
  'dashed': 'DIALOGUE STYLE: Use DASHED-OUTLINE speech bubbles indicating whispered or quiet speech.',
  'cloud': 'DIALOGUE STYLE: Use CLOUD/THOUGHT bubbles for internal thoughts.',
  'rectangle': 'DIALOGUE STYLE: Use RECTANGULAR speech boxes for robotic, electronic, or AI voices.',
  'jagged': 'DIALOGUE STYLE: Use JAGGED/ELECTRIC speech bubbles for radio, phone, or broadcast transmissions.',
  'inverted': 'DIALOGUE STYLE: Use INVERTED (black background, white text) speech bubbles for alien or otherworldly voices.',
};

/**
 * Get the balloon instruction string for a given balloon shape.
 *
 * @param shape - The balloon shape type
 * @returns Instruction string for the AI
 */
export function getBalloonInstruction(shape: BalloonShape): string {
  return BALLOON_SHAPE_INSTRUCTIONS[shape];
}

// ============================================================================
// EMOTIONAL BEAT GUIDANCE
// ============================================================================

/**
 * Guidance text for different emotional beats in the narrative.
 * Used in beat generation to guide the AI's storytelling.
 */
export const EMOTIONAL_BEAT_GUIDANCE: Record<EmotionalBeat, string> = {
  'establishing': 'BEAT: ESTABLISHING - Set the scene, introduce the location/mood.',
  'action': 'BEAT: ACTION - Focus on physical movement, dynamic poses, kinetic energy.',
  'dialogue': 'BEAT: DIALOGUE - Conversation focus, reaction shots, character interplay.',
  'reaction': 'BEAT: REACTION - Show emotional response to what just happened.',
  'climax': 'BEAT: CLIMAX - This is the PEAK MOMENT. Maximum drama and stakes!',
  'transition': 'BEAT: TRANSITION - Bridge scene, moving from one situation to next.',
  'reveal': 'BEAT: REVEAL - Important information disclosed. Dramatic impact moment.',
};

/**
 * Get the emotional beat guidance string.
 *
 * @param beat - The emotional beat type
 * @returns Guidance string for the AI
 */
export function getEmotionalBeatGuidance(beat: EmotionalBeat): string {
  return EMOTIONAL_BEAT_GUIDANCE[beat];
}

// ============================================================================
// PACING GUIDANCE
// ============================================================================

/**
 * Guidance text for different pacing intents.
 * Controls the narrative flow speed.
 */
export const PACING_GUIDANCE: Record<PacingIntent, string> = {
  'slow': 'PACING: SLOW - Take time with this moment. Detailed descriptions, contemplative tone.',
  'medium': 'PACING: MEDIUM - Standard narrative flow. Balance action and reflection.',
  'fast': 'PACING: FAST - Quick, punchy beats. Short sentences, rapid progression.',
};

/**
 * Get the pacing guidance string.
 *
 * @param intent - The pacing intent
 * @returns Guidance string for the AI
 */
export function getPacingGuidance(intent: PacingIntent): string {
  return PACING_GUIDANCE[intent];
}

// ============================================================================
// NARRATIVE ARC INSTRUCTIONS
// ============================================================================

/**
 * Get narrative arc instruction based on page number and position in the story.
 * These guide the pacing and tone of each page.
 *
 * @param pageNum - Current page number (1-indexed)
 * @param maxPages - Maximum story pages
 * @param isDecisionPage - Whether this is a decision page
 * @param isFinalPage - Whether this is the final page
 * @returns Instruction string for the narrative arc position
 */
export function getNarrativeArcInstruction(
  pageNum: number,
  maxPages: number,
  isDecisionPage: boolean,
  isFinalPage: boolean
): string {
  if (isFinalPage) {
    return " FINAL PAGE. KARMIC CLIFFHANGER REQUIRED. You MUST explicitly reference the User's choice from PAGE 3 in the narrative and show how that specific philosophy led to this conclusion. Text must end with 'TO BE CONTINUED...' (or localized equivalent).";
  }

  if (isDecisionPage) {
    return " End with a PSYCHOLOGICAL choice about VALUES, RELATIONSHIPS, or RISK. (e.g., Truth vs. Safety, Forgive vs. Avenge). The choices MUST be a brief descriptive summary of the action the user is taking (e.g. 'Confront the suspect at the warehouse' vs 'Follow from a distance'). NEVER use generic 'Option A' or 'Option B'.";
  }

  // Standard narrative arc based on page position
  if (pageNum === 1) {
    return " INCITING INCIDENT. An event disrupts the status quo. Establish the genre's intended mood. (If Slice of Life: A social snag/surprise. If Adventure: A call to action).";
  } else if (pageNum <= 4) {
    return " RISING ACTION. The heroes engage with the new situation. Focus on dialogue, character dynamics, and initial challenges.";
  } else if (pageNum <= 8) {
    return " COMPLICATION. A twist occurs! A secret is revealed, a misunderstanding deepens, or the path is blocked. (Keep intensity appropriate to Genre - e.g. Social awkwardness for Comedy, Danger for Horror).";
  } else {
    return " CLIMAX. The confrontation with the main conflict. The truth comes out, the contest ends, or the battle is fought.";
  }
}

// ============================================================================
// COVER AND PANEL TYPE PROMPTS
// ============================================================================

/**
 * Build the cover prompt text based on cover type settings.
 *
 * @param options - Cover generation options
 * @returns Prompt text for cover generation
 */
export function buildCoverPrompt(options: {
  useOverlayLogo: boolean;
  seriesTitle: string;
  storyTitle: string;
  publisherName: string;
  issueNumber: string;
  hasPublisherLogo: boolean;
}): string {
  const { useOverlayLogo, seriesTitle, storyTitle, publisherName, issueNumber } = options;

  if (useOverlayLogo) {
    return `TYPE: Comic Book Cover Art. Main visual: Dynamic action shot of [HERO] (Use REFERENCE 1). LEAVE ROOM AT TOP FOR LOGO AND TITLE OVERLAY. DO NOT DRAW ANY LOGOS, TITLES, OR TEXT ON THE ARTWORK. WE WILL ADD IT DIGITALLY OVER THE IMAGE.`;
  }

  return `TYPE: Comic Book Cover. SERIES TITLE: "${seriesTitle.toUpperCase()}". STORY TITLE: "${storyTitle || 'Untitled'}". PUBLISHER: "${publisherName.toUpperCase()}". ISSUE: "#${issueNumber || '1'}". Draw the series title and story title prominently on the cover. Main visual: Dynamic action shot of [HERO] (Use REFERENCE 1).`;
}

/**
 * Build the back cover prompt text.
 *
 * @returns Prompt text for back cover generation
 */
export function buildBackCoverPrompt(): string {
  return `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser. Text: "NEXT ISSUE SOON".`;
}

/**
 * Build panel composition hint based on layout type.
 *
 * @param layout - The panel layout type
 * @returns Composition hint string
 */
export function getPanelCompositionHint(layout: PanelLayout): string {
  switch (layout) {
    case 'splash':
      return `COMPOSITION: This is a SPLASH PAGE - full dramatic composition, maximum visual impact. `;
    case 'grid-2x3':
    case 'grid-3x3':
      return `COMPOSITION: Design as part of a multi-panel page - tighter framing, efficient use of space. `;
    case 'asymmetric':
      return `COMPOSITION: Dynamic layout - this may be the dramatic payoff panel (larger) or a quick beat (smaller). `;
    default:
      return '';
  }
}

// ============================================================================
// STYLE AND GENRE PREFIX
// ============================================================================

/**
 * Build the style prefix that opens every image generation prompt.
 * This establishes the genre and art style context.
 *
 * @param options - Style options
 * @returns Formatted style prefix string
 */
export function buildStylePrefix(options: {
  selectedGenre: string;
  artStyle: string;
  storyTitle: string;
  storyDescription: string;
}): string {
  const { selectedGenre, artStyle, storyTitle, storyDescription } = options;
  const styleEra = selectedGenre === 'Custom' ? "Modern American" : selectedGenre;
  const artStyleTag = artStyle ? `, ${artStyle} style` : '';

  let prefix = `[STRICT GENRE: ${selectedGenre}] [STRICT ART STYLE: ${artStyle || 'Comic Book'}]\n`;
  prefix += `STYLE: ${styleEra} comic book art${artStyleTag}, detailed ink, vibrant colors. `;
  prefix += `STORY TITLE: ${storyTitle || 'Untitled'}. STORY DESC: ${storyDescription || 'Adventure'}. `;

  return prefix;
}

/**
 * Build the final visual anchor that closes every image generation prompt.
 * This reinforces the style at the end to combat context dilution.
 *
 * @param selectedGenre - The selected genre
 * @param artStyle - The art style
 * @returns Final anchor string
 */
export function buildFinalVisualAnchor(selectedGenre: string, artStyle: string): string {
  return `\n[FINAL VISUAL ANCHOR]: REMEMBER, THIS PROJECT IS A ${selectedGenre.toUpperCase()} COMIC IN ${artStyle.toUpperCase()} STYLE. EVERY PIXEL MUST REFLECT THIS.`;
}

// ============================================================================
// SEQUENTIAL CONTEXT
// ============================================================================

/**
 * Build sequential context instruction for maintaining continuity with previous page.
 *
 * @param prevScene - The previous page's scene description
 * @returns Sequential context instruction string
 */
export function buildSequentialContext(prevScene: string): string {
  return ` \n[SEQUENTIAL CONTEXT]: This panel follows the scene where: "${prevScene}". You MUST maintain continuity with the background, lighting, and character positions from the PREVIOUS PAGE VISUAL REFERENCE provided.`;
}

// ============================================================================
// CHARACTER BINDING
// ============================================================================

/**
 * Build character-to-image binding instruction.
 * This explicitly tells the AI which reference image corresponds to which character.
 *
 * @param characters - Array of character names
 * @returns Binding instruction string
 */
export function buildCharacterImageBinding(characters: Array<{ name: string; isHero?: boolean; isFriend?: boolean }>): string {
  const mappings = characters.map(c =>
    `${c.name}'s face MUST match the image labeled '${c.name.toUpperCase()} PORTRAIT'.`
  ).join(' ');

  return `\n[CHARACTER-TO-IMAGE BINDING]: ${mappings}\n`;
}

// ============================================================================
// REROLL INSTRUCTIONS
// ============================================================================

/**
 * Build the user reroll instruction wrapper.
 *
 * @param instruction - The user's instruction text
 * @returns Formatted reroll instruction string
 */
export function buildUserRerollInstruction(instruction: string): string {
  let result = ` \nUSER REROLL INSTRUCTION: "${instruction}". Ensure this explicit instruction is followed perfectly in the visual!`;
  result += ` \nWhen regenerating a character or scene, reference all selected character profiles, uploaded reference images, and attached visual assets to maintain visual consistency. Prioritize matching defining features (face, build, clothing, color palette) from the selected references before applying any stylistic changes from the user's text input.`;
  return result;
}

/**
 * Build negative prompt instruction.
 * Tells the AI what NOT to include in the generation.
 *
 * @param negativePrompt - Elements to exclude
 * @returns Negative prompt instruction string
 */
export function buildNegativePromptInstruction(negativePrompt: string): string {
  return ` [IMPORTANT - DO NOT INCLUDE THE FOLLOWING: ${negativePrompt}. These elements must NOT appear in the generated image.]`;
}

/**
 * Build reference image reinforcement instruction.
 * Used when user explicitly wants to enforce reference image matching.
 *
 * @param refCount - Number of selected reference images
 * @returns Reinforcement instruction string
 */
export function buildReferenceImageReinforcement(refCount: number): string {
  return ` [CRITICAL REFERENCE IMAGE DIRECTIVE] You MUST carefully study ALL ${refCount} selected reference images. Match character appearances, costumes, accessories, emblems, and weapons EXACTLY as shown in these references. The reference images are your PRIMARY source of truth for visual consistency - copy every visible detail precisely.`;
}

// ============================================================================
// REJECTED CHOICES (Novel Mode)
// ============================================================================

/**
 * Build instruction to avoid previously rejected choices in Novel Mode.
 *
 * @param previousChoices - Array of choices that were previously rejected
 * @returns Instruction string to avoid these choices
 */
export function buildRejectedChoicesInstruction(previousChoices: string[]): string {
  if (!previousChoices || previousChoices.length === 0) {
    return '';
  }
  return ` REJECTED CHOICES (DO NOT REUSE): ${previousChoices.map(c => `"${c}"`).join(', ')}. Generate COMPLETELY DIFFERENT choices that explore alternative story directions.`;
}

// ============================================================================
// AI TEXT IMPROVEMENT PROMPTS
// ============================================================================

/**
 * System prompts for different AI text improvement purposes.
 */
export const AI_IMPROVEMENT_SYSTEM_PROMPTS = {
  story_description: `You are a creative writing assistant helping craft compelling comic book story descriptions.
Enhance this story premise/description to be more engaging, dramatic, and visually interesting while maintaining the original intent.
Make it suitable for AI image generation - include vivid visual details, action beats, and dramatic moments.
Keep it concise but impactful (2-4 paragraphs max).`,

  regeneration_instruction: `You are helping improve a regeneration instruction for an AI comic panel generator.
Make this instruction clearer, more specific, and more effective for guiding image generation.
Include visual details, composition suggestions, and emotional tone.
Keep it focused and actionable (1-2 paragraphs max).`,

  backstory: `You are helping enhance a character backstory for a comic book.
Make it more compelling and interesting while keeping the core character traits.
Add depth, motivations, and visual details that will help AI image generation.
Keep it concise but rich (2-3 paragraphs max).`
} as const;

export type AIImprovementPurpose = keyof typeof AI_IMPROVEMENT_SYSTEM_PROMPTS;

/**
 * Build the user prompt for AI text improvement.
 *
 * @param text - Original text to improve
 * @param context - Optional character/story context
 * @returns Formatted user prompt
 */
export function buildAIImprovementUserPrompt(text: string, context?: string): string {
  const contextSection = context ? `\n\nRELEVANT CHARACTER/STORY CONTEXT:\n${context}` : '';
  return `${contextSection}\n\nORIGINAL TEXT TO IMPROVE:\n${text}\n\nPlease provide an improved version. Return ONLY the improved text, no explanations or markdown.`;
}

// ============================================================================
// COMIC FUNDAMENTALS CONTEXT BUILDER
// ============================================================================

/**
 * Build the comic fundamentals context section for beat generation.
 * This includes layout, shot, transition, and emotional guidance.
 *
 * @param pagePlan - The page plan from the story outline
 * @param pageNum - Current page number
 * @param previousScene - Optional previous scene description for transition context
 * @returns Formatted comic fundamentals context string
 */
export function buildComicFundamentalsContext(
  pagePlan: PageCharacterPlan,
  pageNum: number,
  previousScene?: string
): string {
  // Import the functions if not already available
  const {
    getLayoutInstructions,
    getShotInstructions,
    getTransitionContext
  } = require('../types');

  let context = `\n\n=== COMIC FUNDAMENTALS FOR PAGE ${pageNum} ===`;
  context += `\n${getLayoutInstructions(pagePlan.panelLayout)}`;
  context += `\n${getShotInstructions(pagePlan.suggestedShot)}`;

  // Transition from previous page
  if (pageNum > 1) {
    context += `\n${getTransitionContext(pagePlan.transitionType, previousScene)}`;
  }

  // Emotional beat guidance
  context += `\n${EMOTIONAL_BEAT_GUIDANCE[pagePlan.emotionalBeat]}`;

  // Pacing guidance
  context += `\n${PACING_GUIDANCE[pagePlan.pacingIntent]}`;

  // Flashback indicator
  if (pagePlan.isFlashback) {
    context += `\nFLASHBACK: This scene takes place in the PAST. Use nostalgic/memory tone in narration.`;
  }

  // Specified characters
  if (pagePlan.primaryCharacters.length > 0) {
    context += `\nPLANNED CHARACTERS: Focus on ${pagePlan.primaryCharacters.join(', ')}.`;
  }

  context += `\n=== END COMIC FUNDAMENTALS ===\n`;

  return context;
}

// ============================================================================
// REFERENCE LABEL BUILDERS
// ============================================================================

/**
 * Priority levels for reference images.
 */
export type ReferencePriority = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Build a portrait reference label.
 *
 * @param characterName - The character's name
 * @param priority - Priority level (default: HIGH)
 * @returns Formatted label string
 */
export function buildPortraitLabel(characterName: string, priority: ReferencePriority = 'HIGH'): string {
  return `\n[PRIORITY: ${priority}] ${characterName.toUpperCase()} PORTRAIT - COPY THIS FACE EXACTLY:`;
}

/**
 * Build a costume reference label.
 *
 * @param characterName - The character's name
 * @param refIndex - Reference index (1-based)
 * @param priority - Priority level (default: MEDIUM)
 * @returns Formatted label string
 */
export function buildCostumeRefLabel(characterName: string, refIndex: number, priority: ReferencePriority = 'MEDIUM'): string {
  return `[PRIORITY: ${priority}] ${characterName.toUpperCase()} COSTUME REF ${refIndex}:`;
}

/**
 * Build an emblem reference label.
 *
 * @param characterName - The character's name
 * @param placement - Where the emblem should be placed
 * @param priority - Priority level (default: MEDIUM)
 * @returns Formatted label string
 */
export function buildEmblemRefLabel(characterName: string, placement: string, priority: ReferencePriority = 'MEDIUM'): string {
  return `[PRIORITY: ${priority}] ${characterName.toUpperCase()} EMBLEM (place on ${placement}):`;
}

/**
 * Build a weapon reference label.
 *
 * @param characterName - The character's name
 * @param description - Weapon description
 * @param priority - Priority level (default: LOW)
 * @returns Formatted label string
 */
export function buildWeaponRefLabel(characterName: string, description: string, priority: ReferencePriority = 'LOW'): string {
  return `[PRIORITY: ${priority}] ${characterName.toUpperCase()} WEAPON (${description}):`;
}

/**
 * Build a selected reference label (for reroll).
 *
 * @param refIndex - Reference index (1-based)
 * @param priority - Priority level (default: HIGH)
 * @returns Formatted label string
 */
export function buildSelectedRefLabel(refIndex: number, priority: ReferencePriority = 'HIGH'): string {
  return `[PRIORITY: ${priority}] SELECTED REFERENCE ${refIndex} - MATCH THIS EXACTLY:`;
}

/**
 * Build an additional reference label.
 *
 * @param refIndex - Reference index (1-based)
 * @param priority - Priority level (default: MEDIUM)
 * @returns Formatted label string
 */
export function buildAdditionalRefLabel(refIndex: number, priority: ReferencePriority = 'MEDIUM'): string {
  return `[PRIORITY: ${priority}] ADDITIONAL REF ${refIndex}:`;
}

// ============================================================================
// SECTION HEADERS
// ============================================================================

/**
 * Section header for character visual references.
 */
export const SECTION_CHARACTER_REFS = "\n=== CHARACTER VISUAL REFERENCES (Match these EXACTLY) ===";

/**
 * Section header for selected character references (reroll only mode).
 */
export const SECTION_SELECTED_REFS_ONLY = "\n=== SELECTED CHARACTER REFERENCES (Use ONLY these for this regeneration) ===";

/**
 * Section header for current panel image (preserve scene).
 */
export const SECTION_CURRENT_PANEL = "\n=== CURRENT PANEL IMAGE (PRESERVE THIS SCENE) ===";

/**
 * Critical instruction for preserving current panel.
 */
export const INSTRUCTION_PRESERVE_PANEL = "[CRITICAL] This is the CURRENT panel. Preserve the background, environment, lighting, and composition. Only modify what the regeneration mode specifies.";

/**
 * Section header for previous page visual context.
 */
export const SECTION_PREVIOUS_PAGE = "CONTEXT: PREVIOUS PAGE VISUAL REFERENCE (PAGE BEFORE THIS ONE):";

/**
 * Section headers for identity blocks in prompt.
 */
export const SECTION_IDENTITY_BLOCKS_START = '\n--- CHARACTER IDENTITY BLOCKS (LAYER 2) ---\n';
export const SECTION_IDENTITY_BLOCKS_END = '--- END CHARACTER IDENTITY BLOCKS ---\n';

/**
 * Section headers for consistency requirements in prompt.
 */
export const SECTION_CONSISTENCY_START = '\n--- CONSISTENCY REQUIREMENTS (LAYER 4) ---\n';
export const SECTION_CONSISTENCY_END = '--- END CONSISTENCY REQUIREMENTS ---\n';
