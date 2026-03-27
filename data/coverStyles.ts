/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cover Styles
 * Defines the different cover style options for comic generation.
 * Each style provides a unique visual approach for the cover page.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cover style definition with prompt guidance for AI generation
 */
export interface CoverStyle {
  /** Unique identifier for the style */
  id: string;
  /** Display label for the style */
  label: string;
  /** Emoji or icon for the style button */
  icon: string;
  /** Brief description shown to users */
  description: string;
  /** Prompt instructions for the AI to generate this style */
  prompt: string;
  /** Additional composition guidance */
  compositionHints: string;
  /** Recommended for certain genres (optional) */
  recommendedFor?: string[];
}

// ============================================================================
// COVER STYLES
// ============================================================================

/**
 * Available cover styles for comic generation
 * Each style provides different visual approaches for the cover page
 */
export const COVER_STYLES: CoverStyle[] = [
  {
    id: 'action',
    label: 'Action',
    icon: '💥',
    description: 'Dynamic battle or action scene with dramatic lighting',
    prompt: 'Dynamic action scene cover. Characters in mid-action pose, dramatic movement and energy. Intense lighting with strong shadows. Show power, speed, or combat. Background should convey momentum with motion lines, energy effects, or explosive elements.',
    compositionHints: 'Use diagonal composition for dynamic energy. Character should be off-center, moving into the frame. Include speed lines, impact effects, or energy trails. Dramatic foreshortening encouraged.',
    recommendedFor: ['Superhero Action', 'Dark Sci-Fi', 'Wasteland Apocalypse'],
  },
  {
    id: 'portrait',
    label: 'Portrait',
    icon: '👤',
    description: 'Character close-up with heroic pose and expression',
    prompt: 'Heroic portrait cover. Focus on the main character\'s face and upper body. Strong, confident expression. Dramatic lighting that emphasizes facial features. Background should be simple or atmospheric, keeping focus on the character. Iconic hero pose.',
    compositionHints: 'Center the character or use rule of thirds for face placement. Eye-level or slightly low angle for heroic feel. Soft background blur or stylized backdrop. Emphasize eyes and expression.',
    recommendedFor: ['Neon Noir Detective', 'Teen Drama / Slice of Life', 'Classic Horror'],
  },
  {
    id: 'ensemble',
    label: 'Ensemble',
    icon: '👥',
    description: 'All main characters together in team composition',
    prompt: 'Team ensemble cover. All main characters arranged together in a group composition. Each character should have a distinct pose and expression that reflects their personality. The hero should be prominent but all characters visible. Dynamic but balanced arrangement.',
    compositionHints: 'Pyramid or triangular composition with hero at apex or center. Vary character heights and poses for visual interest. Each character should face slightly different directions. Background unifies the group.',
    recommendedFor: ['High Fantasy', 'Superhero Action', 'Dark Sci-Fi'],
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    icon: '✨',
    description: 'Simple iconic design with bold colors and shapes',
    prompt: 'Minimalist iconic cover. Simple, bold design with limited color palette. Focus on one striking visual element - a silhouette, symbol, or simplified character pose. High contrast, clean lines. Graphic design approach rather than detailed illustration.',
    compositionHints: 'Use negative space effectively. Limited to 2-4 main colors. Strong geometric shapes or clean silhouettes. Central composition works well. Avoid clutter - every element must be intentional.',
    recommendedFor: ['Lighthearted Comedy', 'Neon Noir Detective', 'Teen Drama / Slice of Life'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a cover style by ID
 */
export function getCoverStyleById(id: string): CoverStyle | undefined {
  return COVER_STYLES.find(style => style.id === id);
}

/**
 * Get the default cover style
 */
export function getDefaultCoverStyle(): CoverStyle {
  return COVER_STYLES[0]; // 'action' is the default
}

/**
 * Get recommended cover styles for a genre
 */
export function getRecommendedStylesForGenre(genre: string): CoverStyle[] {
  return COVER_STYLES.filter(style =>
    style.recommendedFor?.includes(genre)
  );
}

/**
 * Format cover style prompt with additional context
 * @param style - The cover style to use
 * @param additionalContext - Extra context to include (e.g., character names, story summary)
 */
export function formatCoverPrompt(style: CoverStyle, additionalContext?: string): string {
  let prompt = `COVER STYLE: ${style.label.toUpperCase()}\n\n`;
  prompt += `${style.prompt}\n\n`;
  prompt += `COMPOSITION: ${style.compositionHints}`;

  if (additionalContext) {
    prompt += `\n\nSTORY CONTEXT:\n${additionalContext}`;
  }

  return prompt;
}

/**
 * Get all cover style IDs
 */
export function getCoverStyleIds(): string[] {
  return COVER_STYLES.map(style => style.id);
}
