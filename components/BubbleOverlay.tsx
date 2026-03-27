/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BubbleOverlay Component
 *
 * Renders speech bubbles on top of a comic panel.
 * Supports percentage-based positioning, text wrapping, and various bubble shapes.
 */

import React, { useMemo, useCallback } from 'react';
import {
  BubbleShapeType,
  TailDirection,
  getBubbleShape,
  generateTailPath,
  generateThoughtTailBubbles,
} from '../data/bubbleShapes';
import {
  SpeechBubble,
  calculateBubbleDimensions,
  calculateTailTarget,
  wrapText,
  RenderOptions,
} from '../utils/bubbleRenderer';

/**
 * Props for the BubbleOverlay component
 */
interface BubbleOverlayProps {
  /** Array of speech bubbles to render */
  bubbles: SpeechBubble[];

  /** Width of the panel in pixels */
  panelWidth: number;

  /** Height of the panel in pixels */
  panelHeight: number;

  /** Whether bubbles are editable (shows edit controls) */
  editable?: boolean;

  /** Callback when a bubble is clicked (for editing) */
  onBubbleClick?: (bubbleId: string) => void;

  /** Callback when a bubble is updated */
  onBubbleUpdate?: (bubble: SpeechBubble) => void;

  /** Callback when a bubble is deleted */
  onBubbleDelete?: (bubbleId: string) => void;

  /** Additional CSS class for the overlay container */
  className?: string;
}

/**
 * Props for individual bubble rendering
 */
interface SingleBubbleProps {
  bubble: SpeechBubble;
  options: RenderOptions;
  editable?: boolean;
  onClick?: () => void;
}

/**
 * Render a single speech bubble as SVG
 */
const SingleBubble: React.FC<SingleBubbleProps> = ({
  bubble,
  options,
  editable = false,
  onClick,
}) => {
  const shape = getBubbleShape(bubble.shape);
  const dims = calculateBubbleDimensions(bubble, options);
  const tailTarget = calculateTailTarget(bubble, options);

  // Calculate text wrapping
  const padding = 12;
  const textArea = dims.width - padding * 2;
  const wrapped = useMemo(
    () => wrapText(bubble.text, textArea, bubble.fontSize, bubble.fontFamily),
    [bubble.text, textArea, bubble.fontSize, bubble.fontFamily]
  );

  // Colors
  const fillColor = bubble.fillColor || shape.fillColor;
  const strokeColor = bubble.strokeColor || shape.strokeColor;
  const strokeWidth = shape.strokeWidth;

  // Generate tail elements
  const isThoughtBubble = bubble.isThought || bubble.shape === 'cloud';

  const tailPath = useMemo(() => {
    if (isThoughtBubble) return '';
    return generateTailPath(
      bubble.tailDirection,
      dims.width,
      dims.height,
      tailTarget?.x,
      tailTarget?.y
    );
  }, [bubble.tailDirection, dims.width, dims.height, tailTarget, isThoughtBubble]);

  const thoughtBubbles = useMemo(() => {
    if (!isThoughtBubble) return [];
    return generateThoughtTailBubbles(
      bubble.tailDirection,
      dims.width,
      dims.height,
      tailTarget?.x,
      tailTarget?.y
    );
  }, [bubble.tailDirection, dims.width, dims.height, tailTarget, isThoughtBubble]);

  // Calculate text positioning (centered vertically)
  const textStartY = (dims.height - wrapped.totalHeight) / 2 + bubble.fontSize * 0.8;

  // Scale factor for transforming the 100x100 path to actual dimensions
  const scaleX = dims.width / 100;
  const scaleY = dims.height / 100;

  // Stroke dash array for dashed bubbles
  const strokeDasharray = shape.strokeDashed ? shape.strokeDasharray : undefined;

  // Cursor style based on editability
  const cursorStyle = editable ? 'cursor-pointer hover:opacity-80' : '';

  return (
    <svg
      width={dims.width + 40} // Extra space for tail overflow
      height={dims.height + 40}
      viewBox={`-20 -20 ${dims.width + 40} ${dims.height + 40}`}
      style={{
        position: 'absolute',
        left: dims.x - 20,
        top: dims.y - 20,
        zIndex: bubble.zIndex || 10,
        overflow: 'visible',
        pointerEvents: editable ? 'auto' : 'none',
      }}
      className={cursorStyle}
      onClick={onClick}
      role={editable ? 'button' : undefined}
      aria-label={editable ? `Edit speech bubble: ${bubble.text.substring(0, 30)}...` : undefined}
    >
      {/* Drop shadow filter */}
      <defs>
        <filter id={`shadow-${bubble.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Tail (rendered first so bubble covers the joint) */}
      {tailPath && (
        <path
          d={tailPath}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}

      {/* Thought bubble tail (small circles) */}
      {thoughtBubbles.map((tb, index) => (
        <circle
          key={`thought-${bubble.id}-${index}`}
          cx={tb.cx}
          cy={tb.cy}
          r={tb.r}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      ))}

      {/* Main bubble shape */}
      <g transform={`scale(${scaleX}, ${scaleY})`}>
        <path
          d={shape.svgPath}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth / Math.min(scaleX, scaleY)}
          strokeDasharray={strokeDasharray}
          strokeLinejoin="round"
          filter={`url(#shadow-${bubble.id})`}
        />
      </g>

      {/* Text content */}
      <g>
        {wrapped.lines.map((line, index) => (
          <text
            key={`text-${bubble.id}-${index}`}
            x={dims.width / 2}
            y={textStartY + index * wrapped.lineHeight}
            textAnchor="middle"
            fontSize={bubble.fontSize}
            fontFamily={bubble.fontFamily || 'Comic Sans MS, cursive'}
            fontWeight="bold"
            fill="#000000"
            style={{ userSelect: 'none' }}
          >
            {line}
          </text>
        ))}
      </g>

      {/* Edit indicator (small icon in corner when editable) */}
      {editable && (
        <g transform={`translate(${dims.width - 15}, 5)`}>
          <circle cx="8" cy="8" r="10" fill="rgba(59, 130, 246, 0.9)" />
          <text x="8" y="12" textAnchor="middle" fontSize="10" fill="white">

          </text>
        </g>
      )}
    </svg>
  );
};

/**
 * BubbleOverlay Component
 *
 * Container that renders multiple speech bubbles over a panel.
 * Uses percentage-based positioning relative to panel dimensions.
 */
export const BubbleOverlay: React.FC<BubbleOverlayProps> = ({
  bubbles,
  panelWidth,
  panelHeight,
  editable = false,
  onBubbleClick,
  onBubbleUpdate,
  onBubbleDelete,
  className = '',
}) => {
  const options: RenderOptions = useMemo(
    () => ({
      panelWidth,
      panelHeight,
    }),
    [panelWidth, panelHeight]
  );

  const handleBubbleClick = useCallback(
    (bubbleId: string) => {
      if (editable && onBubbleClick) {
        onBubbleClick(bubbleId);
      }
    },
    [editable, onBubbleClick]
  );

  // Sort bubbles by z-index for proper layering
  const sortedBubbles = useMemo(
    () => [...bubbles].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [bubbles]
  );

  if (bubbles.length === 0) {
    return null;
  }

  return (
    <div
      className={`bubble-overlay ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: panelWidth,
        height: panelHeight,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-label="Speech bubbles overlay"
    >
      {sortedBubbles.map((bubble) => (
        <SingleBubble
          key={bubble.id}
          bubble={bubble}
          options={options}
          editable={editable}
          onClick={() => handleBubbleClick(bubble.id)}
        />
      ))}
    </div>
  );
};

/**
 * Hook for managing speech bubbles state
 */
export function useSpeechBubbles(initialBubbles: SpeechBubble[] = []) {
  const [bubbles, setBubbles] = React.useState<SpeechBubble[]>(initialBubbles);

  const addBubble = useCallback((bubble: SpeechBubble) => {
    setBubbles((prev) => [...prev, bubble]);
  }, []);

  const updateBubble = useCallback((updatedBubble: SpeechBubble) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === updatedBubble.id ? updatedBubble : b))
    );
  }, []);

  const deleteBubble = useCallback((bubbleId: string) => {
    setBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
  }, []);

  const clearBubbles = useCallback(() => {
    setBubbles([]);
  }, []);

  const reorderBubble = useCallback((bubbleId: string, newZIndex: number) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === bubbleId ? { ...b, zIndex: newZIndex } : b))
    );
  }, []);

  return {
    bubbles,
    setBubbles,
    addBubble,
    updateBubble,
    deleteBubble,
    clearBubbles,
    reorderBubble,
  };
}

/**
 * Quick bubble creation helpers
 */
export const BubblePresets = {
  /**
   * Create a standard speech bubble
   */
  speech: (
    id: string,
    text: string,
    position: { x: number; y: number },
    tailDirection: TailDirection = 'bottom'
  ): SpeechBubble => ({
    id,
    text,
    shape: 'oval',
    position,
    size: { width: 30, height: 20 },
    tailDirection,
    fontSize: 14,
  }),

  /**
   * Create a shouting bubble
   */
  shout: (
    id: string,
    text: string,
    position: { x: number; y: number },
    tailDirection: TailDirection = 'bottom'
  ): SpeechBubble => ({
    id,
    text,
    shape: 'burst',
    position,
    size: { width: 35, height: 25 },
    tailDirection,
    fontSize: 16,
  }),

  /**
   * Create a thought bubble
   */
  thought: (
    id: string,
    text: string,
    position: { x: number; y: number },
    tailDirection: TailDirection = 'bottom'
  ): SpeechBubble => ({
    id,
    text,
    shape: 'cloud',
    position,
    size: { width: 35, height: 22 },
    tailDirection,
    fontSize: 13,
    isThought: true,
  }),

  /**
   * Create a whisper bubble
   */
  whisper: (
    id: string,
    text: string,
    position: { x: number; y: number },
    tailDirection: TailDirection = 'bottom'
  ): SpeechBubble => ({
    id,
    text,
    shape: 'dashed',
    position,
    size: { width: 28, height: 18 },
    tailDirection,
    fontSize: 12,
  }),

  /**
   * Create a robotic/electronic speech bubble
   */
  robotic: (
    id: string,
    text: string,
    position: { x: number; y: number },
    tailDirection: TailDirection = 'bottom'
  ): SpeechBubble => ({
    id,
    text,
    shape: 'rectangle',
    position,
    size: { width: 32, height: 20 },
    tailDirection,
    fontSize: 13,
    fontFamily: 'Courier New, monospace',
  }),
};

export default BubbleOverlay;
