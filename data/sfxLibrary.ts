/**
 * SFX Library for Infinite Heroes Comic Creator
 *
 * A collection of classic comic book sound effects (onomatopoeia) with
 * styling information for visual rendering on comic panels.
 *
 * Based on comic book conventions: bold, expressive lettering with
 * dramatic colors and positioning.
 */

/**
 * Style categories for SFX elements
 * Each style has different visual characteristics
 */
export type SFXStyle = 'impact' | 'explosion' | 'motion' | 'energy' | 'emotional' | 'ambient';

/**
 * Font options for SFX rendering
 * - Bangers: Bold, impactful comic-style font (primary choice)
 * - Comic Neue: Cleaner, more readable comic font
 * - Impact: System fallback for bold effects
 */
export type SFXFont = 'Bangers' | 'Comic Neue' | 'Impact';

/**
 * Individual SFX entry with visual styling data
 */
export interface SFXEntry {
  /** Unique identifier */
  id: string;
  /** The sound effect text (e.g., "POW!", "BANG!") */
  text: string;
  /** Visual style category */
  style: SFXStyle;
  /** Primary fill color (hex) */
  color: string;
  /** Outline/stroke color (hex) */
  outlineColor: string;
  /** Recommended font family */
  font: SFXFont;
  /** Default rotation in degrees (for dynamic placement) */
  defaultRotation?: number;
  /** Description for UI tooltips */
  description?: string;
}

/**
 * Main SFX library with 25+ classic comic book sound effects
 * Organized by style category
 */
export const SFX_LIBRARY: SFXEntry[] = [
  // === IMPACT SOUNDS ===
  {
    id: 'pow',
    text: 'POW!',
    style: 'impact',
    color: '#FF0000',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: -5,
    description: 'Classic punch/hit impact',
  },
  {
    id: 'bam',
    text: 'BAM!',
    style: 'impact',
    color: '#FF4400',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 3,
    description: 'Heavy strike or collision',
  },
  {
    id: 'wham',
    text: 'WHAM!',
    style: 'impact',
    color: '#FF6600',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: -8,
    description: 'Powerful body blow',
  },
  {
    id: 'crack',
    text: 'CRACK!',
    style: 'impact',
    color: '#8B4513',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 5,
    description: 'Breaking or snapping sound',
  },
  {
    id: 'thud',
    text: 'THUD!',
    style: 'impact',
    color: '#8B0000',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 0,
    description: 'Heavy landing or fall',
  },
  {
    id: 'crunch',
    text: 'CRUNCH!',
    style: 'impact',
    color: '#A0522D',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: -3,
    description: 'Crushing or grinding impact',
  },
  {
    id: 'smack',
    text: 'SMACK!',
    style: 'impact',
    color: '#DC143C',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 7,
    description: 'Slap or open-hand hit',
  },

  // === EXPLOSION SOUNDS ===
  {
    id: 'bang',
    text: 'BANG!',
    style: 'explosion',
    color: '#FF6600',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: -10,
    description: 'Gunshot or explosion',
  },
  {
    id: 'boom',
    text: 'BOOM!',
    style: 'explosion',
    color: '#FF3300',
    outlineColor: '#FFCC00',
    font: 'Bangers',
    defaultRotation: 5,
    description: 'Large explosion',
  },
  {
    id: 'kaboom',
    text: 'KABOOM!',
    style: 'explosion',
    color: '#FF0000',
    outlineColor: '#FFCC00',
    font: 'Bangers',
    defaultRotation: -7,
    description: 'Massive explosion',
  },
  {
    id: 'crash',
    text: 'CRASH!',
    style: 'explosion',
    color: '#FFCC00',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 8,
    description: 'Destructive collision',
  },
  {
    id: 'blast',
    text: 'BLAST!',
    style: 'explosion',
    color: '#FF4500',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: -5,
    description: 'Energy or weapon discharge',
  },

  // === MOTION SOUNDS ===
  {
    id: 'whoosh',
    text: 'WHOOSH!',
    style: 'motion',
    color: '#0066FF',
    outlineColor: '#000000',
    font: 'Comic Neue',
    defaultRotation: -15,
    description: 'Fast movement through air',
  },
  {
    id: 'zoom',
    text: 'ZOOM!',
    style: 'motion',
    color: '#00CCFF',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: -20,
    description: 'Super-speed movement',
  },
  {
    id: 'swish',
    text: 'SWISH!',
    style: 'motion',
    color: '#4169E1',
    outlineColor: '#000000',
    font: 'Comic Neue',
    defaultRotation: 10,
    description: 'Quick slicing or cutting motion',
  },
  {
    id: 'woosh',
    text: 'WOOSH!',
    style: 'motion',
    color: '#1E90FF',
    outlineColor: '#FFFFFF',
    font: 'Comic Neue',
    defaultRotation: -12,
    description: 'Rushing wind or flight',
  },
  {
    id: 'zip',
    text: 'ZIP!',
    style: 'motion',
    color: '#00FF00',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 15,
    description: 'Quick, precise movement',
  },
  {
    id: 'fwoosh',
    text: 'FWOOSH!',
    style: 'motion',
    color: '#FF6347',
    outlineColor: '#000000',
    font: 'Comic Neue',
    defaultRotation: -8,
    description: 'Fire or flame burst movement',
  },

  // === ENERGY SOUNDS ===
  {
    id: 'zap',
    text: 'ZAP!',
    style: 'energy',
    color: '#00FFFF',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: -5,
    description: 'Electric discharge',
  },
  {
    id: 'bzzt',
    text: 'BZZT!',
    style: 'energy',
    color: '#FFFF00',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 3,
    description: 'Electrical buzzing',
  },
  {
    id: 'crackle',
    text: 'CRACKLE!',
    style: 'energy',
    color: '#9400D3',
    outlineColor: '#FFFFFF',
    font: 'Bangers',
    defaultRotation: -8,
    description: 'Energy crackling',
  },
  {
    id: 'fzzt',
    text: 'FZZT!',
    style: 'energy',
    color: '#00FF7F',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 5,
    description: 'Static or short circuit',
  },
  {
    id: 'sizzle',
    text: 'SIZZLE!',
    style: 'energy',
    color: '#FF4500',
    outlineColor: '#FFFF00',
    font: 'Comic Neue',
    defaultRotation: 0,
    description: 'Heat or burning energy',
  },

  // === EMOTIONAL SOUNDS ===
  {
    id: 'gasp',
    text: 'GASP!',
    style: 'emotional',
    color: '#87CEEB',
    outlineColor: '#000000',
    font: 'Comic Neue',
    defaultRotation: 0,
    description: 'Surprise or shock',
  },
  {
    id: 'argh',
    text: 'ARGH!',
    style: 'emotional',
    color: '#FF0000',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: -10,
    description: 'Pain or frustration',
  },
  {
    id: 'nooo',
    text: 'NOOO!',
    style: 'emotional',
    color: '#DC143C',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 5,
    description: 'Despair or denial',
  },
  {
    id: 'haha',
    text: 'HA HA!',
    style: 'emotional',
    color: '#FFD700',
    outlineColor: '#000000',
    font: 'Comic Neue',
    defaultRotation: 8,
    description: 'Laughter',
  },

  // === AMBIENT SOUNDS ===
  {
    id: 'thump',
    text: 'THUMP!',
    style: 'ambient',
    color: '#696969',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 0,
    description: 'Heartbeat or heavy step',
  },
  {
    id: 'click',
    text: 'CLICK!',
    style: 'ambient',
    color: '#808080',
    outlineColor: '#000000',
    font: 'Comic Neue',
    defaultRotation: 0,
    description: 'Mechanical or switch sound',
  },
  {
    id: 'rumble',
    text: 'RUMBLE!',
    style: 'ambient',
    color: '#4A4A4A',
    outlineColor: '#FFFFFF',
    font: 'Bangers',
    defaultRotation: -3,
    description: 'Distant thunder or earthquake',
  },
  {
    id: 'splat',
    text: 'SPLAT!',
    style: 'ambient',
    color: '#228B22',
    outlineColor: '#000000',
    font: 'Bangers',
    defaultRotation: 5,
    description: 'Liquid or soft impact',
  },
  {
    id: 'splash',
    text: 'SPLASH!',
    style: 'ambient',
    color: '#1E90FF',
    outlineColor: '#FFFFFF',
    font: 'Comic Neue',
    defaultRotation: -5,
    description: 'Water impact',
  },
];

/**
 * Style category labels for UI display
 */
export const SFX_STYLE_LABELS: Record<SFXStyle, string> = {
  impact: 'Impact',
  explosion: 'Explosion',
  motion: 'Motion',
  energy: 'Energy',
  emotional: 'Emotional',
  ambient: 'Ambient',
};

/**
 * Style category colors for UI grouping
 */
export const SFX_STYLE_COLORS: Record<SFXStyle, string> = {
  impact: '#FF0000',
  explosion: '#FF6600',
  motion: '#0066FF',
  energy: '#00FFFF',
  emotional: '#FFD700',
  ambient: '#808080',
};

/**
 * Get SFX entries filtered by style
 */
export function getSFXByStyle(style: SFXStyle): SFXEntry[] {
  return SFX_LIBRARY.filter(sfx => sfx.style === style);
}

/**
 * Get an SFX entry by its ID
 */
export function getSFXById(id: string): SFXEntry | undefined {
  return SFX_LIBRARY.find(sfx => sfx.id === id);
}

/**
 * Get all unique SFX style categories
 */
export function getSFXStyles(): SFXStyle[] {
  return ['impact', 'explosion', 'motion', 'energy', 'emotional', 'ambient'];
}

/**
 * Create a custom SFX entry (for user-defined effects)
 */
export function createCustomSFX(
  text: string,
  style: SFXStyle = 'impact',
  color: string = '#FF0000',
  outlineColor: string = '#000000',
  font: SFXFont = 'Bangers'
): SFXEntry {
  return {
    id: `custom-${Date.now()}`,
    text: text.toUpperCase(),
    style,
    color,
    outlineColor,
    font,
    description: 'Custom sound effect',
  };
}

export default SFX_LIBRARY;
