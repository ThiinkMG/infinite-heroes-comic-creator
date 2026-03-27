/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Caption Renderer Utility
 *
 * This module provides utilities for rendering caption boxes as SVG elements.
 * It handles caption positioning, text wrapping, character color coding,
 * and supports both narrator captions and character thoughts.
 */

import {
  CaptionStyleType,
  CaptionPosition,
  CaptionStyleDefinition,
  getCaptionStyle,
  getCharacterColor,
  getCharacterThoughtStyle,
} from '../data/captionStyles';

/**
 * Caption box data structure
 */
export interface CaptionBox {
  /** Unique identifier for the caption */
  id: string;

  /** Text content to display in the caption */
  text: string;

  /** Position of the caption on the panel */
  position: CaptionPosition;

  /** Style type of the caption */
  style: CaptionStyleType;

  /** Associated character ID for thought captions (enables color coding) */
  characterId?: string;

  /** Character role for color coding fallback */
  characterRole?: string;

  /** Custom position override (percentage of panel dimensions) */
  customPosition?: {
    x: number; // Left edge percentage (0-100)
    y: number; // Top edge percentage (0-100)
  };

  /** Size as percentage of panel dimensions */
  size?: {
    width: number;  // Width percentage (e.g., 40 = 40% of panel width)
    height?: number; // Height percentage (auto if not specified)
  };

  /** Font size in pixels */
  fontSize?: number;

  /** Custom background color override */
  backgroundColor?: string;

  /** Custom text color override */
  textColor?: string;

  /** Custom border color override */
  borderColor?: string;

  /** Z-index for layering multiple captions */
  zIndex?: number;

  /** Whether this is a thought caption (italic, character-colored) */
  isThought?: boolean;
}

/**
 * Options for rendering a caption
 */
export interface CaptionRenderOptions {
  /** Panel width in pixels */
  panelWidth: number;

  /** Panel height in pixels */
  panelHeight: number;

  /** Whether to include animations */
  animated?: boolean;

  /** Scale factor for high-DPI displays */
  scaleFactor?: number;

  /** Default font size if not specified on caption */
  defaultFontSize?: number;
}

/**
 * Result of text measurement for wrapping
 */
interface TextMeasurement {
  lines: string[];
  lineHeight: number;
  totalHeight: number;
  maxLineWidth: number;
}

/**
 * Position offsets for predefined caption positions
 */
const POSITION_OFFSETS: Record<CaptionPosition, { x: number; y: number }> = {
  'top-left': { x: 3, y: 3 },
  'top-center': { x: 50, y: 3 },
  'top-right': { x: 97, y: 3 },
  'bottom-left': { x: 3, y: 97 },
  'bottom-center': { x: 50, y: 97 },
  'bottom-right': { x: 97, y: 97 },
};

/**
 * Calculate the absolute position and size of a caption
 */
export function calculateCaptionDimensions(
  caption: CaptionBox,
  options: CaptionRenderOptions
): {
  x: number;
  y: number;
  width: number;
  height: number | 'auto';
} {
  const { panelWidth, panelHeight } = options;
  const defaultWidth = 40; // Default 40% of panel width

  // Get width
  const widthPercent = caption.size?.width || defaultWidth;
  const width = (widthPercent / 100) * panelWidth;

  // Get height (auto-calculated based on text if not specified)
  const height = caption.size?.height
    ? (caption.size.height / 100) * panelHeight
    : 'auto';

  // Get position
  let x: number;
  let y: number;

  if (caption.customPosition) {
    x = (caption.customPosition.x / 100) * panelWidth;
    y = (caption.customPosition.y / 100) * panelHeight;
  } else {
    const posOffset = POSITION_OFFSETS[caption.position];
    x = (posOffset.x / 100) * panelWidth;
    y = (posOffset.y / 100) * panelHeight;

    // Adjust for anchor point based on position
    if (caption.position.includes('center')) {
      x -= width / 2;
    } else if (caption.position.includes('right')) {
      x -= width;
    }

    if (caption.position.includes('bottom')) {
      // Will be adjusted after height is calculated
    }
  }

  return { x, y, width, height };
}

/**
 * Wrap text to fit within caption dimensions
 * Uses a simple word-wrapping algorithm
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: 'normal' | 'bold' = 'normal'
): TextMeasurement {
  // Approximate character width (varies by font and weight)
  const charWidthMultiplier = fontWeight === 'bold' ? 0.6 : 0.55;
  const avgCharWidth = fontSize * charWidthMultiplier;
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  const lineHeight = fontSize * 1.4; // Slightly more spacing for captions

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= charsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      // Handle words longer than line width
      if (word.length > charsPerLine) {
        // Break long words
        let remaining = word;
        while (remaining.length > charsPerLine) {
          lines.push(remaining.substring(0, charsPerLine - 1) + '-');
          remaining = remaining.substring(charsPerLine - 1);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return {
    lines,
    lineHeight,
    totalHeight: lines.length * lineHeight,
    maxLineWidth: Math.max(...lines.map(l => l.length * avgCharWidth)),
  };
}

/**
 * Get the effective style for a caption, including character color overrides
 */
export function getEffectiveCaptionStyle(
  caption: CaptionBox
): CaptionStyleDefinition {
  // Get base style
  let style = getCaptionStyle(caption.style);

  // For thought captions, apply character colors
  if (caption.style === 'thought' && (caption.characterId || caption.characterRole)) {
    const characterKey = caption.characterId || caption.characterRole || 'default';
    style = getCharacterThoughtStyle(characterKey);
  }

  // Apply custom overrides
  if (caption.backgroundColor) {
    style = { ...style, backgroundColor: caption.backgroundColor };
  }
  if (caption.textColor) {
    style = { ...style, textColor: caption.textColor };
  }
  if (caption.borderColor) {
    style = { ...style, borderColor: caption.borderColor };
  }

  return style;
}

/**
 * Escape XML special characters in text
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate SVG string for a caption box
 */
export function renderCaptionToSVG(
  caption: CaptionBox,
  options: CaptionRenderOptions
): string {
  const style = getEffectiveCaptionStyle(caption);
  const fontSize = caption.fontSize || options.defaultFontSize || 12;
  const dims = calculateCaptionDimensions(caption, options);

  // Calculate padding
  const paddingValues = style.padding.split(' ').map(p => parseInt(p) || 8);
  const paddingY = paddingValues[0];
  const paddingX = paddingValues.length > 1 ? paddingValues[1] : paddingValues[0];

  // Wrap text
  const textArea = dims.width - paddingX * 2;
  const wrapped = wrapText(caption.text, textArea, fontSize, style.fontWeight);

  // Calculate actual height
  const actualHeight = typeof dims.height === 'number'
    ? dims.height
    : wrapped.totalHeight + paddingY * 2;

  // Adjust Y position for bottom-aligned captions
  let finalY = dims.y;
  if (caption.position.includes('bottom') && !caption.customPosition) {
    finalY = dims.y - actualHeight;
  }

  // Generate text elements
  const textStartY = paddingY + fontSize * 0.85;
  const fontStyleAttr = style.fontStyle === 'italic' ? 'font-style="italic"' : '';
  const textTransformAttr = style.textTransform === 'uppercase' ? 'text-transform: uppercase;' : '';
  const letterSpacingAttr = style.letterSpacing ? `letter-spacing: ${style.letterSpacing};` : '';

  const textElements = wrapped.lines
    .map((line, index) => {
      const y = textStartY + index * wrapped.lineHeight;
      const displayLine = style.textTransform === 'uppercase' ? line.toUpperCase() : line;
      return `<text
        x="${paddingX}"
        y="${y}"
        font-size="${fontSize}"
        font-family="'Comic Sans MS', 'Segoe UI', Arial, sans-serif"
        font-weight="${style.fontWeight}"
        ${fontStyleAttr}
        fill="${style.textColor}"
        style="${textTransformAttr}${letterSpacingAttr} user-select: none;"
      >${escapeXML(displayLine)}</text>`;
    })
    .join('\n');

  // Border/stroke attributes
  const strokeAttr = style.borderColor && style.borderWidth > 0
    ? `stroke="${style.borderColor}" stroke-width="${style.borderWidth}"`
    : '';

  // Box shadow filter (simplified for SVG)
  const shadowFilter = style.boxShadow
    ? `<filter id="shadow-${caption.id}" x="-10%" y="-10%" width="120%" height="120%">
         <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3" />
       </filter>`
    : '';
  const filterAttr = style.boxShadow ? `filter="url(#shadow-${caption.id})"` : '';

  // Build SVG
  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${dims.width}"
  height="${actualHeight}"
  viewBox="0 0 ${dims.width} ${actualHeight}"
  style="position: absolute; left: ${dims.x}px; top: ${finalY}px; z-index: ${caption.zIndex || 15}; overflow: visible;"
>
  <defs>
    ${shadowFilter}
  </defs>

  <!-- Caption box background -->
  <rect
    x="0"
    y="0"
    width="${dims.width}"
    height="${actualHeight}"
    rx="${style.borderRadius}"
    ry="${style.borderRadius}"
    fill="${style.backgroundColor}"
    ${strokeAttr}
    ${filterAttr}
  />

  <!-- Text content -->
  <g>
    ${textElements}
  </g>
</svg>
`.trim();
}

/**
 * Generate React-compatible props for rendering a caption
 * Use this instead of renderCaptionToSVG when working with React components
 */
export function getCaptionRenderProps(
  caption: CaptionBox,
  options: CaptionRenderOptions
): {
  style: CaptionStyleDefinition;
  dimensions: { x: number; y: number; width: number; height: number };
  wrappedText: TextMeasurement;
  fontSize: number;
} {
  const style = getEffectiveCaptionStyle(caption);
  const fontSize = caption.fontSize || options.defaultFontSize || 12;
  const dims = calculateCaptionDimensions(caption, options);

  // Calculate padding
  const paddingValues = style.padding.split(' ').map(p => parseInt(p) || 8);
  const paddingX = paddingValues.length > 1 ? paddingValues[1] : paddingValues[0];
  const paddingY = paddingValues[0];

  // Wrap text
  const textArea = dims.width - paddingX * 2;
  const wrappedText = wrapText(caption.text, textArea, fontSize, style.fontWeight);

  // Calculate actual height
  const actualHeight = typeof dims.height === 'number'
    ? dims.height
    : wrappedText.totalHeight + paddingY * 2;

  // Adjust Y position for bottom-aligned captions
  let finalY = dims.y;
  if (caption.position.includes('bottom') && !caption.customPosition) {
    finalY = dims.y - actualHeight;
  }

  return {
    style,
    dimensions: { x: dims.x, y: finalY, width: dims.width, height: actualHeight },
    wrappedText,
    fontSize,
  };
}

/**
 * Create a default caption box with sensible defaults
 */
export function createDefaultCaption(
  id: string,
  text: string,
  overrides?: Partial<Omit<CaptionBox, 'id' | 'text'>>
): CaptionBox {
  return {
    id,
    text,
    position: 'top-left',
    style: 'narrator',
    fontSize: 12,
    ...overrides,
  };
}

/**
 * Create a narrator caption
 */
export function createNarratorCaption(
  id: string,
  text: string,
  position: CaptionPosition = 'top-left'
): CaptionBox {
  return createDefaultCaption(id, text, {
    position,
    style: 'narrator',
  });
}

/**
 * Create a character thought caption
 */
export function createThoughtCaption(
  id: string,
  text: string,
  characterId: string,
  characterRole?: string,
  position: CaptionPosition = 'top-left'
): CaptionBox {
  return createDefaultCaption(id, text, {
    position,
    style: 'thought',
    characterId,
    characterRole,
    isThought: true,
  });
}

/**
 * Create a location caption
 */
export function createLocationCaption(
  id: string,
  text: string,
  position: CaptionPosition = 'top-left'
): CaptionBox {
  return createDefaultCaption(id, text, {
    position,
    style: 'location',
    size: { width: 35 }, // Location captions are typically narrower
    fontSize: 11,
  });
}

/**
 * Create a time caption
 */
export function createTimeCaption(
  id: string,
  text: string,
  position: CaptionPosition = 'top-right'
): CaptionBox {
  return createDefaultCaption(id, text, {
    position,
    style: 'time',
    size: { width: 30 },
    fontSize: 11,
  });
}

/**
 * Create a flashback caption
 */
export function createFlashbackCaption(
  id: string,
  text: string,
  position: CaptionPosition = 'top-left'
): CaptionBox {
  return createDefaultCaption(id, text, {
    position,
    style: 'flashback',
  });
}

/**
 * Calculate optimal caption position to avoid overlapping
 */
export function calculateOptimalPosition(
  existingCaptions: CaptionBox[],
  newCaptionSize: { width: number },
  preferredPosition: 'top' | 'bottom' = 'top'
): CaptionPosition {
  const topPositions: CaptionPosition[] = ['top-left', 'top-right', 'top-center'];
  const bottomPositions: CaptionPosition[] = ['bottom-left', 'bottom-right', 'bottom-center'];

  const positions = preferredPosition === 'top'
    ? [...topPositions, ...bottomPositions]
    : [...bottomPositions, ...topPositions];

  // Find first position not already used
  for (const pos of positions) {
    const isOccupied = existingCaptions.some(
      (cap) => cap.position === pos && !cap.customPosition
    );
    if (!isOccupied) {
      return pos;
    }
  }

  // Fallback to top-left
  return 'top-left';
}

/**
 * Serialize captions to JSON for storage
 */
export function serializeCaptions(captions: CaptionBox[]): string {
  return JSON.stringify(captions);
}

/**
 * Deserialize captions from JSON
 */
export function deserializeCaptions(json: string): CaptionBox[] {
  try {
    return JSON.parse(json) as CaptionBox[];
  } catch {
    return [];
  }
}

export default {
  calculateCaptionDimensions,
  wrapText,
  getEffectiveCaptionStyle,
  renderCaptionToSVG,
  getCaptionRenderProps,
  createDefaultCaption,
  createNarratorCaption,
  createThoughtCaption,
  createLocationCaption,
  createTimeCaption,
  createFlashbackCaption,
  calculateOptimalPosition,
  serializeCaptions,
  deserializeCaptions,
};
