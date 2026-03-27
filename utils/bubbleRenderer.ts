/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Speech Bubble Renderer Utility
 *
 * This module provides utilities for rendering speech bubbles as SVG elements.
 * It handles bubble positioning, text wrapping, and tail pointing calculations.
 */

import {
  BubbleShapeType,
  TailDirection,
  BubbleShapeDefinition,
  getBubbleShape,
  generateTailPath,
  generateThoughtTailBubbles,
} from '../data/bubbleShapes';

/**
 * Speech bubble data structure
 */
export interface SpeechBubble {
  /** Unique identifier for the bubble */
  id: string;

  /** Text content to display in the bubble */
  text: string;

  /** Shape of the bubble */
  shape: BubbleShapeType;

  /** Position as percentage of panel dimensions (0-100) */
  position: {
    x: number; // Left edge percentage
    y: number; // Top edge percentage
  };

  /** Size as percentage of panel dimensions */
  size: {
    width: number;  // Width percentage (e.g., 30 = 30% of panel width)
    height: number; // Height percentage
  };

  /** Direction the tail points */
  tailDirection: TailDirection;

  /** Target position for tail (percentage, relative to panel) */
  tailTarget?: {
    x: number;
    y: number;
  };

  /** Font size in pixels */
  fontSize: number;

  /** Associated character ID (for color coding) */
  characterId?: string;

  /** Custom fill color (overrides shape default) */
  fillColor?: string;

  /** Custom stroke color (overrides shape default) */
  strokeColor?: string;

  /** Font family override */
  fontFamily?: string;

  /** Z-index for layering multiple bubbles */
  zIndex?: number;

  /** Whether this is a thought bubble (uses small bubble tail) */
  isThought?: boolean;
}

/**
 * Options for rendering a speech bubble
 */
export interface RenderOptions {
  /** Panel width in pixels */
  panelWidth: number;

  /** Panel height in pixels */
  panelHeight: number;

  /** Whether to include animations */
  animated?: boolean;

  /** Scale factor for high-DPI displays */
  scaleFactor?: number;
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
 * Calculate the absolute position and size of a bubble
 */
export function calculateBubbleDimensions(
  bubble: SpeechBubble,
  options: RenderOptions
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { panelWidth, panelHeight } = options;

  return {
    x: (bubble.position.x / 100) * panelWidth,
    y: (bubble.position.y / 100) * panelHeight,
    width: (bubble.size.width / 100) * panelWidth,
    height: (bubble.size.height / 100) * panelHeight,
  };
}

/**
 * Calculate tail target position relative to bubble
 * Converts panel-relative coordinates to bubble-relative coordinates
 */
export function calculateTailTarget(
  bubble: SpeechBubble,
  options: RenderOptions
): { x: number; y: number } | undefined {
  if (!bubble.tailTarget || bubble.tailDirection === 'none') {
    return undefined;
  }

  const { panelWidth, panelHeight } = options;
  const dims = calculateBubbleDimensions(bubble, options);

  // Convert panel percentage to absolute position
  const targetAbsX = (bubble.tailTarget.x / 100) * panelWidth;
  const targetAbsY = (bubble.tailTarget.y / 100) * panelHeight;

  // Convert to bubble-relative percentage
  // The tail target is expressed as a position outside the bubble bounds
  const relativeX = ((targetAbsX - dims.x) / dims.width) * 100;
  const relativeY = ((targetAbsY - dims.y) / dims.height) * 100;

  return { x: relativeX, y: relativeY };
}

/**
 * Wrap text to fit within bubble dimensions
 * Uses a simple word-wrapping algorithm
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string = 'Comic Sans MS, cursive'
): TextMeasurement {
  // Approximate character width (varies by font, but good estimate)
  const avgCharWidth = fontSize * 0.55;
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  const lineHeight = fontSize * 1.3;

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
 * Generate SVG string for a speech bubble
 */
export function renderBubbleToSVG(
  bubble: SpeechBubble,
  options: RenderOptions
): string {
  const shape = getBubbleShape(bubble.shape);
  const dims = calculateBubbleDimensions(bubble, options);
  const tailTarget = calculateTailTarget(bubble, options);

  // Wrap text
  const padding = 10;
  const textArea = dims.width - padding * 2;
  const wrapped = wrapText(
    bubble.text,
    textArea,
    bubble.fontSize,
    bubble.fontFamily
  );

  // Colors
  const fillColor = bubble.fillColor || shape.fillColor;
  const strokeColor = bubble.strokeColor || shape.strokeColor;
  const strokeWidth = shape.strokeWidth;

  // Generate tail
  let tailSVG = '';
  if (bubble.isThought || bubble.shape === 'cloud') {
    // Thought bubble uses small circles
    const tailBubbles = generateThoughtTailBubbles(
      bubble.tailDirection,
      dims.width,
      dims.height,
      tailTarget?.x,
      tailTarget?.y
    );
    tailSVG = tailBubbles
      .map(
        (b) =>
          `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`
      )
      .join('\n');
  } else {
    const tailPath = generateTailPath(
      bubble.tailDirection,
      dims.width,
      dims.height,
      tailTarget?.x,
      tailTarget?.y
    );
    if (tailPath) {
      tailSVG = `<path d="${tailPath}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    }
  }

  // Stroke dash array for dashed bubbles
  const dashArray = shape.strokeDashed ? `stroke-dasharray="${shape.strokeDasharray}"` : '';

  // Calculate text positioning
  const textStartY = (dims.height - wrapped.totalHeight) / 2 + bubble.fontSize;

  // Generate text elements
  const textElements = wrapped.lines
    .map((line, index) => {
      const y = textStartY + index * wrapped.lineHeight;
      return `<text x="${dims.width / 2}" y="${y}" text-anchor="middle" font-size="${bubble.fontSize}" font-family="${bubble.fontFamily || 'Comic Sans MS, cursive'}" fill="#000000">${escapeXML(line)}</text>`;
    })
    .join('\n');

  // Build SVG
  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${dims.width}"
  height="${dims.height}"
  viewBox="0 0 ${dims.width} ${dims.height}"
  style="position: absolute; left: ${dims.x}px; top: ${dims.y}px; z-index: ${bubble.zIndex || 10}; overflow: visible;"
>
  <!-- Bubble shape -->
  <g transform="scale(${dims.width / 100}, ${dims.height / 100})">
    <path
      d="${shape.svgPath}"
      fill="${fillColor}"
      stroke="${strokeColor}"
      stroke-width="${strokeWidth / Math.min(dims.width, dims.height) * 100}"
      ${dashArray}
    />
  </g>

  <!-- Tail -->
  ${tailSVG}

  <!-- Text content -->
  ${textElements}
</svg>
`.trim();
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
 * Generate React-compatible props for rendering a bubble
 * Use this instead of renderBubbleToSVG when working with React components
 */
export function getBubbleRenderProps(
  bubble: SpeechBubble,
  options: RenderOptions
): {
  shape: BubbleShapeDefinition;
  dimensions: { x: number; y: number; width: number; height: number };
  tailTarget: { x: number; y: number } | undefined;
  wrappedText: TextMeasurement;
  fillColor: string;
  strokeColor: string;
  tailPath: string;
  thoughtBubbles: Array<{ cx: number; cy: number; r: number }>;
} {
  const shape = getBubbleShape(bubble.shape);
  const dims = calculateBubbleDimensions(bubble, options);
  const tailTarget = calculateTailTarget(bubble, options);

  const padding = 10;
  const textArea = dims.width - padding * 2;
  const wrappedText = wrapText(
    bubble.text,
    textArea,
    bubble.fontSize,
    bubble.fontFamily
  );

  const fillColor = bubble.fillColor || shape.fillColor;
  const strokeColor = bubble.strokeColor || shape.strokeColor;

  // Generate tail elements
  let tailPath = '';
  let thoughtBubbles: Array<{ cx: number; cy: number; r: number }> = [];

  if (bubble.isThought || bubble.shape === 'cloud') {
    thoughtBubbles = generateThoughtTailBubbles(
      bubble.tailDirection,
      dims.width,
      dims.height,
      tailTarget?.x,
      tailTarget?.y
    );
  } else {
    tailPath = generateTailPath(
      bubble.tailDirection,
      dims.width,
      dims.height,
      tailTarget?.x,
      tailTarget?.y
    );
  }

  return {
    shape,
    dimensions: dims,
    tailTarget,
    wrappedText,
    fillColor,
    strokeColor,
    tailPath,
    thoughtBubbles,
  };
}

/**
 * Create a default speech bubble with sensible defaults
 */
export function createDefaultBubble(
  id: string,
  text: string,
  overrides?: Partial<Omit<SpeechBubble, 'id' | 'text'>>
): SpeechBubble {
  return {
    id,
    text,
    shape: 'oval',
    position: { x: 10, y: 10 },
    size: { width: 30, height: 20 },
    tailDirection: 'bottom',
    fontSize: 14,
    ...overrides,
  };
}

/**
 * Calculate optimal bubble position to avoid overlapping
 * Simple algorithm that tries to place bubbles in available space
 */
export function calculateOptimalPosition(
  existingBubbles: SpeechBubble[],
  newBubbleSize: { width: number; height: number },
  preferredDirection: 'top' | 'bottom' = 'top'
): { x: number; y: number } {
  // Start positions based on preference
  const startY = preferredDirection === 'top' ? 5 : 95 - newBubbleSize.height;
  const positions = [
    { x: 10, y: startY },
    { x: 60, y: startY },
    { x: 35, y: startY + 25 },
    { x: 10, y: startY + 25 },
    { x: 60, y: startY + 25 },
  ];

  // Find first position that doesn't overlap
  for (const pos of positions) {
    const overlaps = existingBubbles.some((bubble) => {
      const bubbleRight = bubble.position.x + bubble.size.width;
      const bubbleBottom = bubble.position.y + bubble.size.height;
      const newRight = pos.x + newBubbleSize.width;
      const newBottom = pos.y + newBubbleSize.height;

      return !(
        pos.x >= bubbleRight ||
        newRight <= bubble.position.x ||
        pos.y >= bubbleBottom ||
        newBottom <= bubble.position.y
      );
    });

    if (!overlaps) {
      return pos;
    }
  }

  // Fallback to first position
  return positions[0];
}

/**
 * Serialize bubbles to JSON for storage
 */
export function serializeBubbles(bubbles: SpeechBubble[]): string {
  return JSON.stringify(bubbles);
}

/**
 * Deserialize bubbles from JSON
 */
export function deserializeBubbles(json: string): SpeechBubble[] {
  try {
    return JSON.parse(json) as SpeechBubble[];
  } catch {
    return [];
  }
}

export default {
  calculateBubbleDimensions,
  calculateTailTarget,
  wrapText,
  renderBubbleToSVG,
  getBubbleRenderProps,
  createDefaultBubble,
  calculateOptimalPosition,
  serializeBubbles,
  deserializeBubbles,
};
