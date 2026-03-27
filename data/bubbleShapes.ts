/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Speech Bubble Shape Definitions
 *
 * This module defines the visual shapes for comic book speech bubbles.
 * Each shape has SVG path data for scalable rendering.
 *
 * Shape conventions:
 * - All paths are designed for a normalized 100x100 viewBox
 * - Paths should be centered and leave margin for tail attachment
 * - Tail directions indicate where the pointer extends from the bubble
 */

/**
 * Supported bubble shape types
 */
export type BubbleShapeType =
  | 'oval'       // Normal speech (most common)
  | 'burst'      // Shouting, excitement, anger
  | 'wavy'       // Weak, distressed, injured voice
  | 'dashed'     // Whisper, quiet speech
  | 'cloud'      // Thought bubble
  | 'rectangle'; // Robotic, electronic, AI speech

/**
 * Tail direction options for bubble pointer
 */
export type TailDirection = 'left' | 'right' | 'bottom' | 'none';

/**
 * Definition for a single bubble shape
 */
export interface BubbleShapeDefinition {
  /** Unique identifier for the shape */
  id: BubbleShapeType;

  /** Display name for UI */
  label: string;

  /** SVG path data for the bubble outline (100x100 viewBox) */
  svgPath: string;

  /** CSS class name for additional styling */
  cssClass: string;

  /** Default fill color */
  fillColor: string;

  /** Default stroke color */
  strokeColor: string;

  /** Default stroke width */
  strokeWidth: number;

  /** Whether the stroke should be dashed */
  strokeDashed?: boolean;

  /** Dash array pattern if dashed */
  strokeDasharray?: string;

  /** Corner radius for rectangle shapes */
  borderRadius?: number;

  /** Description for accessibility/tooltips */
  description: string;

  /** When to use this shape */
  useCase: string;
}

/**
 * Tail point definition for bubble pointer calculation
 */
export interface TailPoint {
  /** Starting point on bubble edge (percentage 0-100) */
  startX: number;
  startY: number;

  /** Control point for curved tail (percentage 0-100) */
  controlX: number;
  controlY: number;

  /** Endpoint of tail (will be overridden by tailTarget) */
  endX: number;
  endY: number;
}

/**
 * Default tail configurations for each direction
 */
export const DEFAULT_TAIL_POINTS: Record<TailDirection, TailPoint | null> = {
  left: {
    startX: 10,
    startY: 75,
    controlX: -5,
    controlY: 85,
    endX: -15,
    endY: 95,
  },
  right: {
    startX: 90,
    startY: 75,
    controlX: 105,
    controlY: 85,
    endX: 115,
    endY: 95,
  },
  bottom: {
    startX: 50,
    startY: 95,
    controlX: 50,
    controlY: 105,
    endX: 50,
    endY: 115,
  },
  none: null,
};

/**
 * SVG path for oval/ellipse bubble shape
 * Rounded ellipse with soft edges - most common speech bubble
 */
const OVAL_PATH = `
  M 50 5
  C 85 5 95 20 95 50
  C 95 80 85 95 50 95
  C 15 95 5 80 5 50
  C 5 20 15 5 50 5
  Z
`.trim().replace(/\s+/g, ' ');

/**
 * SVG path for burst/explosion bubble shape
 * Jagged starburst edges - for shouting/excitement
 */
const BURST_PATH = `
  M 50 2
  L 58 18 L 75 5 L 72 25 L 95 22
  L 82 38 L 98 50 L 82 62 L 95 78
  L 72 75 L 75 95 L 58 82 L 50 98
  L 42 82 L 25 95 L 28 75 L 5 78
  L 18 62 L 2 50 L 18 38 L 5 22
  L 28 25 L 25 5 L 42 18 L 50 2
  Z
`.trim().replace(/\s+/g, ' ');

/**
 * SVG path for wavy bubble shape
 * Wavy/trembling edges - for weak/distressed speech
 */
const WAVY_PATH = `
  M 50 5
  Q 65 8 75 10 Q 85 15 90 25
  Q 95 35 95 50 Q 95 65 90 75
  Q 85 85 75 90 Q 65 95 50 95
  Q 35 95 25 90 Q 15 85 10 75
  Q 5 65 5 50 Q 5 35 10 25
  Q 15 15 25 10 Q 35 8 50 5
  Z
`.trim().replace(/\s+/g, ' ');

/**
 * SVG path for cloud/thought bubble shape
 * Puffy cloud edges - for internal thoughts
 */
const CLOUD_PATH = `
  M 25 50
  C 25 35 35 25 50 25
  C 55 20 60 15 70 18
  C 80 15 90 25 90 40
  C 95 45 95 55 90 60
  C 90 75 80 85 65 85
  C 55 90 45 90 35 85
  C 20 80 15 65 20 55
  C 15 50 20 45 25 50
  Z
`.trim().replace(/\s+/g, ' ');

/**
 * SVG path for rectangle bubble shape
 * Sharp corners with slight rounding - for robotic/electronic speech
 */
const RECTANGLE_PATH = `
  M 10 10
  L 90 10
  Q 95 10 95 15
  L 95 85
  Q 95 90 90 90
  L 10 90
  Q 5 90 5 85
  L 5 15
  Q 5 10 10 10
  Z
`.trim().replace(/\s+/g, ' ');

/**
 * Library of all bubble shape definitions
 */
export const BUBBLE_SHAPES: Record<BubbleShapeType, BubbleShapeDefinition> = {
  oval: {
    id: 'oval',
    label: 'Oval',
    svgPath: OVAL_PATH,
    cssClass: 'bubble-oval',
    fillColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    description: 'Standard oval speech bubble for normal dialogue',
    useCase: 'Normal speech, conversation',
  },

  burst: {
    id: 'burst',
    label: 'Burst',
    svgPath: BURST_PATH,
    cssClass: 'bubble-burst',
    fillColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2.5,
    description: 'Jagged starburst bubble for shouting or excitement',
    useCase: 'Shouting, anger, excitement, surprise',
  },

  wavy: {
    id: 'wavy',
    label: 'Wavy',
    svgPath: WAVY_PATH,
    cssClass: 'bubble-wavy',
    fillColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    description: 'Wavy-edged bubble for weak or distressed speech',
    useCase: 'Weak voice, injury, fear, trembling',
  },

  dashed: {
    id: 'dashed',
    label: 'Dashed',
    svgPath: OVAL_PATH, // Same shape as oval, but with dashed stroke
    cssClass: 'bubble-dashed',
    fillColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    strokeDashed: true,
    strokeDasharray: '5,3',
    description: 'Dashed outline bubble for whispers or quiet speech',
    useCase: 'Whisper, quiet, secretive',
  },

  cloud: {
    id: 'cloud',
    label: 'Cloud',
    svgPath: CLOUD_PATH,
    cssClass: 'bubble-cloud',
    fillColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    description: 'Puffy cloud bubble for internal thoughts',
    useCase: 'Thoughts, inner monologue, memories',
  },

  rectangle: {
    id: 'rectangle',
    label: 'Rectangle',
    svgPath: RECTANGLE_PATH,
    cssClass: 'bubble-rectangle',
    fillColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    borderRadius: 5,
    description: 'Rectangular bubble for robotic or electronic speech',
    useCase: 'Robot, AI, computer, radio transmission',
  },
};

/**
 * Get bubble shape definition by type
 */
export function getBubbleShape(type: BubbleShapeType): BubbleShapeDefinition {
  return BUBBLE_SHAPES[type];
}

/**
 * Get all available bubble shapes as an array
 */
export function getAllBubbleShapes(): BubbleShapeDefinition[] {
  return Object.values(BUBBLE_SHAPES);
}

/**
 * Get bubble shape appropriate for a given voice/emotion context
 */
export function selectBubbleShape(
  volume?: 'whisper' | 'normal' | 'loud' | 'shouting',
  emotion?: 'calm' | 'angry' | 'sad' | 'weak' | 'frightened',
  medium?: 'speech' | 'thought' | 'robotic' | 'phone'
): BubbleShapeType {
  // Medium takes priority
  if (medium === 'thought') return 'cloud';
  if (medium === 'robotic' || medium === 'phone') return 'rectangle';

  // Volume next
  if (volume === 'shouting') return 'burst';
  if (volume === 'loud') return 'burst';
  if (volume === 'whisper') return 'dashed';

  // Emotion
  if (emotion === 'angry') return 'burst';
  if (emotion === 'weak' || emotion === 'frightened') return 'wavy';

  // Default
  return 'oval';
}

/**
 * Generate tail SVG path for a bubble
 * @param direction - Direction the tail points
 * @param bubbleWidth - Width of the bubble in pixels
 * @param bubbleHeight - Height of the bubble in pixels
 * @param targetX - Target X position (percentage 0-100, relative to bubble)
 * @param targetY - Target Y position (percentage 0-100, relative to bubble)
 * @returns SVG path string for the tail, or empty string if no tail
 */
export function generateTailPath(
  direction: TailDirection,
  bubbleWidth: number,
  bubbleHeight: number,
  targetX?: number,
  targetY?: number
): string {
  const tailConfig = DEFAULT_TAIL_POINTS[direction];
  if (!tailConfig) return '';

  // Calculate actual positions based on bubble dimensions
  const startX = (tailConfig.startX / 100) * bubbleWidth;
  const startY = (tailConfig.startY / 100) * bubbleHeight;

  // Use target position if provided, otherwise use default
  const endX = targetX !== undefined
    ? (targetX / 100) * bubbleWidth
    : (tailConfig.endX / 100) * bubbleWidth;
  const endY = targetY !== undefined
    ? (targetY / 100) * bubbleHeight
    : (tailConfig.endY / 100) * bubbleHeight;

  // Calculate control point for smooth curve
  const controlX = (startX + endX) / 2;
  const controlY = (startY + endY) / 2;

  // Create a tapered tail with two curves
  const tailWidth = 8; // Width at the base of the tail

  // Calculate perpendicular offset for tail width
  const angle = Math.atan2(endY - startY, endX - startX);
  const perpX = Math.sin(angle) * tailWidth;
  const perpY = -Math.cos(angle) * tailWidth;

  return `
    M ${startX - perpX} ${startY - perpY}
    Q ${controlX} ${controlY} ${endX} ${endY}
    Q ${controlX} ${controlY} ${startX + perpX} ${startY + perpY}
    Z
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Generate small bubbles for thought bubble tail
 * Returns array of {cx, cy, r} for SVG circles
 */
export function generateThoughtTailBubbles(
  direction: TailDirection,
  bubbleWidth: number,
  bubbleHeight: number,
  targetX?: number,
  targetY?: number
): Array<{ cx: number; cy: number; r: number }> {
  if (direction === 'none') return [];

  const tailConfig = DEFAULT_TAIL_POINTS[direction];
  if (!tailConfig) return [];

  const startX = (tailConfig.startX / 100) * bubbleWidth;
  const startY = (tailConfig.startY / 100) * bubbleHeight;

  const endX = targetX !== undefined
    ? (targetX / 100) * bubbleWidth
    : (tailConfig.endX / 100) * bubbleWidth;
  const endY = targetY !== undefined
    ? (targetY / 100) * bubbleHeight
    : (tailConfig.endY / 100) * bubbleHeight;

  // Create 3 bubbles decreasing in size
  const bubbles: Array<{ cx: number; cy: number; r: number }> = [];
  const steps = 3;

  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / (steps + 1); // Position along the line
    bubbles.push({
      cx: startX + (endX - startX) * t,
      cy: startY + (endY - startY) * t,
      r: 6 - i * 1.5, // Decreasing radius: 6, 4.5, 3
    });
  }

  return bubbles;
}

export default BUBBLE_SHAPES;
