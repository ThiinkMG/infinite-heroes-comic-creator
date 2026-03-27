/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Caption Style Definitions
 *
 * This module defines the visual styles for comic book caption boxes.
 * Captions are rectangular text boxes used for narration, thoughts,
 * location/time indicators, and editorial notes.
 *
 * Style conventions:
 * - Narrator captions: Yellow/beige background (classic comic style)
 * - Character thoughts: Character-colored borders/backgrounds
 * - Location/time: Bold, scene-setting with dark backgrounds
 * - Flashback: Sepia tones for memory sequences
 */

import { CaptionType } from '../types';

/**
 * Caption style type identifiers
 */
export type CaptionStyleType =
  | 'narrator'        // Third-person narration (yellow/beige)
  | 'thought'         // Character internal monologue (character-colored)
  | 'location'        // Location caption (bold, scene-setting)
  | 'time'            // Temporal caption (italic, time indicator)
  | 'flashback'       // Memory/past events (sepia styling)
  | 'editorial';      // Editor/writer notes (gray)

/**
 * Caption position options
 */
export type CaptionPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Definition for a single caption style
 */
export interface CaptionStyleDefinition {
  /** Unique identifier for the style */
  id: CaptionStyleType;

  /** Display name for UI */
  label: string;

  /** Background color (supports gradients as CSS string) */
  backgroundColor: string;

  /** Text color */
  textColor: string;

  /** Border color (optional) */
  borderColor?: string;

  /** Border width in pixels */
  borderWidth: number;

  /** Border radius for corners */
  borderRadius: number;

  /** Font style (normal or italic) */
  fontStyle: 'normal' | 'italic';

  /** Font weight */
  fontWeight: 'normal' | 'bold';

  /** Letter spacing adjustment */
  letterSpacing?: string;

  /** Text transform (uppercase, capitalize, etc.) */
  textTransform?: 'none' | 'uppercase' | 'capitalize';

  /** Box shadow for depth effect */
  boxShadow?: string;

  /** Padding inside the caption (CSS shorthand) */
  padding: string;

  /** Description for accessibility/tooltips */
  description: string;

  /** When to use this style */
  useCase: string;
}

/**
 * Character color palette for thought bubbles
 * Maps character roles to their signature colors
 */
export const CHARACTER_COLORS: Record<string, { background: string; border: string; text: string }> = {
  // Hero colors - typically warm, bold colors
  'hero': { background: '#FFE4B5', border: '#FF8C00', text: '#333' },
  'Hero': { background: '#FFE4B5', border: '#FF8C00', text: '#333' },

  // Co-star/friend colors - complementary but distinct
  'friend': { background: '#E6E6FA', border: '#9370DB', text: '#333' },
  'co-star': { background: '#E6E6FA', border: '#9370DB', text: '#333' },
  'Co-Star': { background: '#E6E6FA', border: '#9370DB', text: '#333' },

  // Antagonist colors - darker, more intense
  'antagonist': { background: '#FFE0E0', border: '#DC143C', text: '#333' },
  'Antagonist': { background: '#FFE0E0', border: '#DC143C', text: '#333' },
  'villain': { background: '#2D1B2D', border: '#8B0000', text: '#FFF' },
  'Villain': { background: '#2D1B2D', border: '#8B0000', text: '#FFF' },

  // Sidekick - energetic, youthful
  'sidekick': { background: '#E0FFE0', border: '#32CD32', text: '#333' },
  'Sidekick': { background: '#E0FFE0', border: '#32CD32', text: '#333' },

  // Anti-hero - gray, morally ambiguous
  'anti-hero': { background: '#D3D3D3', border: '#696969', text: '#333' },
  'Anti-Hero': { background: '#D3D3D3', border: '#696969', text: '#333' },

  // Family/Friend - warm, homey colors
  'family': { background: '#FFEFD5', border: '#DEB887', text: '#333' },
  'Family/Friend': { background: '#FFEFD5', border: '#DEB887', text: '#333' },

  // Default fallback
  'default': { background: '#F5F5F5', border: '#999', text: '#333' },
  'other': { background: '#F5F5F5', border: '#999', text: '#333' },
};

/**
 * Get character color scheme by role or ID
 */
export function getCharacterColor(characterIdOrRole: string): { background: string; border: string; text: string } {
  // Try exact match first
  if (CHARACTER_COLORS[characterIdOrRole]) {
    return CHARACTER_COLORS[characterIdOrRole];
  }

  // Try lowercase match
  const lowerKey = characterIdOrRole.toLowerCase();
  for (const [key, value] of Object.entries(CHARACTER_COLORS)) {
    if (key.toLowerCase() === lowerKey) {
      return value;
    }
  }

  // Return default
  return CHARACTER_COLORS['default'];
}

/**
 * Narrator caption style - classic yellow/beige
 */
const NARRATOR_STYLE: CaptionStyleDefinition = {
  id: 'narrator',
  label: 'Narrator',
  backgroundColor: '#F5E050',
  textColor: '#000',
  borderColor: '#C4A000',
  borderWidth: 2,
  borderRadius: 4,
  fontStyle: 'italic',
  fontWeight: 'normal',
  padding: '8px 12px',
  boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
  description: 'Classic yellow narrator box for third-person storytelling',
  useCase: 'Third-person narration, scene descriptions, story progression',
};

/**
 * Thought caption style - character-colored, cloud-like feel
 */
const THOUGHT_STYLE: CaptionStyleDefinition = {
  id: 'thought',
  label: 'Thought',
  backgroundColor: '#FFE4B5', // Default, will be overridden by character color
  textColor: '#333',
  borderColor: '#DEB887',
  borderWidth: 2,
  borderRadius: 12, // More rounded for softer feel
  fontStyle: 'italic',
  fontWeight: 'normal',
  padding: '10px 14px',
  boxShadow: '1px 1px 3px rgba(0,0,0,0.15)',
  description: 'Internal monologue caption with character-specific colors',
  useCase: 'Character thoughts, internal monologue, first-person reflections',
};

/**
 * Location caption style - bold, scene-setting
 */
const LOCATION_STYLE: CaptionStyleDefinition = {
  id: 'location',
  label: 'Location',
  backgroundColor: '#333',
  textColor: '#FFF',
  borderColor: '#000',
  borderWidth: 0,
  borderRadius: 0, // Sharp edges for dramatic effect
  fontStyle: 'normal',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '6px 14px',
  boxShadow: '3px 3px 0px rgba(0,0,0,0.5)',
  description: 'Bold location caption for establishing scenes',
  useCase: 'Location establishment, scene headers, setting introductions',
};

/**
 * Time caption style - italic, temporal indicator
 */
const TIME_STYLE: CaptionStyleDefinition = {
  id: 'time',
  label: 'Time',
  backgroundColor: '#1a1a2e',
  textColor: '#E0E0E0',
  borderColor: '#4a4a6a',
  borderWidth: 1,
  borderRadius: 2,
  fontStyle: 'italic',
  fontWeight: 'normal',
  letterSpacing: '0.02em',
  padding: '6px 12px',
  boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  description: 'Italic time indicator for temporal context',
  useCase: 'Time indicators, "Meanwhile...", "Later that night...", temporal jumps',
};

/**
 * Flashback caption style - sepia, nostalgic
 */
const FLASHBACK_STYLE: CaptionStyleDefinition = {
  id: 'flashback',
  label: 'Flashback',
  backgroundColor: '#D4A574',
  textColor: '#3D2914',
  borderColor: '#8B6914',
  borderWidth: 2,
  borderRadius: 4,
  fontStyle: 'italic',
  fontWeight: 'normal',
  padding: '8px 12px',
  boxShadow: 'inset 0 0 8px rgba(139,105,20,0.3), 2px 2px 4px rgba(0,0,0,0.2)',
  description: 'Sepia-toned caption for memory sequences',
  useCase: 'Flashbacks, memories, historical narration, past events',
};

/**
 * Editorial caption style - gray, meta-commentary
 */
const EDITORIAL_STYLE: CaptionStyleDefinition = {
  id: 'editorial',
  label: 'Editorial',
  backgroundColor: '#E8E8E8',
  textColor: '#555',
  borderColor: '#AAA',
  borderWidth: 1,
  borderRadius: 4,
  fontStyle: 'italic',
  fontWeight: 'normal',
  padding: '6px 10px',
  boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
  description: 'Gray editorial box for writer/editor notes',
  useCase: 'Editor notes, footnotes, meta-commentary, issue references',
};

/**
 * Library of all caption style definitions
 */
export const CAPTION_STYLES: Record<CaptionStyleType, CaptionStyleDefinition> = {
  narrator: NARRATOR_STYLE,
  thought: THOUGHT_STYLE,
  location: LOCATION_STYLE,
  time: TIME_STYLE,
  flashback: FLASHBACK_STYLE,
  editorial: EDITORIAL_STYLE,
};

/**
 * Get caption style definition by type
 */
export function getCaptionStyle(type: CaptionStyleType): CaptionStyleDefinition {
  return CAPTION_STYLES[type];
}

/**
 * Get all available caption styles as an array
 */
export function getAllCaptionStyles(): CaptionStyleDefinition[] {
  return Object.values(CAPTION_STYLES);
}

/**
 * Map CaptionType from types.ts to CaptionStyleType
 */
export function mapCaptionTypeToStyle(captionType: CaptionType): CaptionStyleType {
  const mapping: Record<CaptionType, CaptionStyleType> = {
    'narration': 'narrator',
    'internal-monologue': 'thought',
    'location-time': 'location', // Location takes precedence
    'flashback': 'flashback',
    'editorial': 'editorial',
  };
  return mapping[captionType] || 'narrator';
}

/**
 * Select caption style based on context
 */
export function selectCaptionStyle(
  isNarration?: boolean,
  isThought?: boolean,
  isLocation?: boolean,
  isTime?: boolean,
  isFlashback?: boolean
): CaptionStyleType {
  // Priority order: flashback > location > time > thought > narration
  if (isFlashback) return 'flashback';
  if (isLocation) return 'location';
  if (isTime) return 'time';
  if (isThought) return 'thought';
  if (isNarration) return 'narrator';
  return 'narrator'; // Default
}

/**
 * Get thought caption style with character-specific colors
 */
export function getCharacterThoughtStyle(
  characterIdOrRole: string
): CaptionStyleDefinition {
  const colors = getCharacterColor(characterIdOrRole);
  return {
    ...THOUGHT_STYLE,
    backgroundColor: colors.background,
    borderColor: colors.border,
    textColor: colors.text,
  };
}

export default CAPTION_STYLES;
