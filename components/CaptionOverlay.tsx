/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CaptionOverlay Component
 *
 * Renders caption boxes on top of comic panels.
 * Supports percentage-based positioning, text wrapping, character color coding,
 * and multiple caption styles (narrator, thought, location, time, flashback).
 */

import React, { useMemo, useCallback } from 'react';
import {
  CaptionStyleType,
  CaptionPosition,
  getCharacterColor,
} from '../data/captionStyles';
import {
  CaptionBox,
  CaptionRenderOptions,
  getCaptionRenderProps,
  wrapText,
  getEffectiveCaptionStyle,
} from '../utils/captionRenderer';

/**
 * Props for the CaptionOverlay component
 */
interface CaptionOverlayProps {
  /** Array of caption boxes to render */
  captions: CaptionBox[];

  /** Width of the panel in pixels */
  panelWidth: number;

  /** Height of the panel in pixels */
  panelHeight: number;

  /** Whether captions are editable (shows edit controls) */
  editable?: boolean;

  /** Callback when a caption is clicked (for editing) */
  onCaptionClick?: (captionId: string) => void;

  /** Callback when a caption is updated */
  onCaptionUpdate?: (caption: CaptionBox) => void;

  /** Callback when a caption is deleted */
  onCaptionDelete?: (captionId: string) => void;

  /** Additional CSS class for the overlay container */
  className?: string;

  /** Default font size for captions */
  defaultFontSize?: number;
}

/**
 * Props for individual caption rendering
 */
interface SingleCaptionProps {
  caption: CaptionBox;
  options: CaptionRenderOptions;
  editable?: boolean;
  onClick?: () => void;
}

/**
 * Render a single caption box
 */
const SingleCaption: React.FC<SingleCaptionProps> = ({
  caption,
  options,
  editable = false,
  onClick,
}) => {
  const { style, dimensions, wrappedText, fontSize } = getCaptionRenderProps(
    caption,
    options
  );

  // Parse padding from style
  const paddingValues = style.padding.split(' ').map((p) => parseInt(p) || 8);
  const paddingY = paddingValues[0];
  const paddingX = paddingValues.length > 1 ? paddingValues[1] : paddingValues[0];

  // Calculate text start position
  const textStartY = paddingY + fontSize * 0.85;

  // Cursor style based on editability
  const cursorStyle = editable ? 'cursor-pointer' : '';

  // Generate unique filter ID
  const filterId = `caption-shadow-${caption.id}`;

  return (
    <svg
      width={dimensions.width + 4} // Extra space for shadow
      height={dimensions.height + 4}
      viewBox={`-2 -2 ${dimensions.width + 4} ${dimensions.height + 4}`}
      style={{
        position: 'absolute',
        left: dimensions.x - 2,
        top: dimensions.y - 2,
        zIndex: caption.zIndex || 15,
        overflow: 'visible',
        pointerEvents: editable ? 'auto' : 'none',
      }}
      className={cursorStyle}
      onClick={onClick}
      role={editable ? 'button' : undefined}
      aria-label={
        editable ? `Edit caption: ${caption.text.substring(0, 30)}...` : undefined
      }
    >
      {/* Drop shadow filter */}
      <defs>
        <filter
          id={filterId}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Caption box background */}
      <rect
        x="0"
        y="0"
        width={dimensions.width}
        height={dimensions.height}
        rx={style.borderRadius}
        ry={style.borderRadius}
        fill={style.backgroundColor}
        stroke={style.borderColor}
        strokeWidth={style.borderWidth}
        filter={style.boxShadow ? `url(#${filterId})` : undefined}
      />

      {/* Text content */}
      <g>
        {wrappedText.lines.map((line, index) => {
          const y = textStartY + index * wrappedText.lineHeight;
          const displayLine =
            style.textTransform === 'uppercase' ? line.toUpperCase() : line;
          return (
            <text
              key={`caption-text-${caption.id}-${index}`}
              x={paddingX}
              y={y}
              fontSize={fontSize}
              fontFamily="'Comic Sans MS', 'Segoe UI', Arial, sans-serif"
              fontWeight={style.fontWeight}
              fontStyle={style.fontStyle}
              fill={style.textColor}
              style={{
                userSelect: 'none',
                letterSpacing: style.letterSpacing,
              }}
            >
              {displayLine}
            </text>
          );
        })}
      </g>

      {/* Edit indicator (small icon in corner when editable) */}
      {editable && (
        <g transform={`translate(${dimensions.width - 18}, 3)`}>
          <circle cx="8" cy="8" r="10" fill="rgba(59, 130, 246, 0.9)" />
          <text x="8" y="12" textAnchor="middle" fontSize="10" fill="white">

          </text>
        </g>
      )}
    </svg>
  );
};

/**
 * CaptionOverlay Component
 *
 * Container that renders multiple caption boxes over a panel.
 * Uses percentage-based positioning relative to panel dimensions.
 */
export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  captions,
  panelWidth,
  panelHeight,
  editable = false,
  onCaptionClick,
  onCaptionUpdate,
  onCaptionDelete,
  className = '',
  defaultFontSize = 12,
}) => {
  const options: CaptionRenderOptions = useMemo(
    () => ({
      panelWidth,
      panelHeight,
      defaultFontSize,
    }),
    [panelWidth, panelHeight, defaultFontSize]
  );

  const handleCaptionClick = useCallback(
    (captionId: string) => {
      if (editable && onCaptionClick) {
        onCaptionClick(captionId);
      }
    },
    [editable, onCaptionClick]
  );

  // Sort captions by z-index for proper layering
  const sortedCaptions = useMemo(
    () => [...captions].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [captions]
  );

  if (captions.length === 0) {
    return null;
  }

  return (
    <div
      className={`caption-overlay ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: panelWidth,
        height: panelHeight,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-label="Caption boxes overlay"
    >
      {sortedCaptions.map((caption) => (
        <SingleCaption
          key={caption.id}
          caption={caption}
          options={options}
          editable={editable}
          onClick={() => handleCaptionClick(caption.id)}
        />
      ))}
    </div>
  );
};

/**
 * Hook for managing caption boxes state
 */
export function useCaptionBoxes(initialCaptions: CaptionBox[] = []) {
  const [captions, setCaptions] = React.useState<CaptionBox[]>(initialCaptions);

  const addCaption = useCallback((caption: CaptionBox) => {
    setCaptions((prev) => [...prev, caption]);
  }, []);

  const updateCaption = useCallback((updatedCaption: CaptionBox) => {
    setCaptions((prev) =>
      prev.map((c) => (c.id === updatedCaption.id ? updatedCaption : c))
    );
  }, []);

  const deleteCaption = useCallback((captionId: string) => {
    setCaptions((prev) => prev.filter((c) => c.id !== captionId));
  }, []);

  const clearCaptions = useCallback(() => {
    setCaptions([]);
  }, []);

  const reorderCaption = useCallback((captionId: string, newZIndex: number) => {
    setCaptions((prev) =>
      prev.map((c) => (c.id === captionId ? { ...c, zIndex: newZIndex } : c))
    );
  }, []);

  return {
    captions,
    setCaptions,
    addCaption,
    updateCaption,
    deleteCaption,
    clearCaptions,
    reorderCaption,
  };
}

/**
 * Quick caption creation helpers
 */
export const CaptionPresets = {
  /**
   * Create a standard narrator caption
   */
  narrator: (
    id: string,
    text: string,
    position: CaptionPosition = 'top-left'
  ): CaptionBox => ({
    id,
    text,
    position,
    style: 'narrator',
    fontSize: 12,
  }),

  /**
   * Create a character thought caption
   */
  thought: (
    id: string,
    text: string,
    characterId: string,
    position: CaptionPosition = 'top-left'
  ): CaptionBox => ({
    id,
    text,
    position,
    style: 'thought',
    characterId,
    isThought: true,
    fontSize: 12,
  }),

  /**
   * Create a location caption
   */
  location: (
    id: string,
    text: string,
    position: CaptionPosition = 'top-left'
  ): CaptionBox => ({
    id,
    text,
    position,
    style: 'location',
    size: { width: 35 },
    fontSize: 11,
  }),

  /**
   * Create a time caption
   */
  time: (
    id: string,
    text: string,
    position: CaptionPosition = 'top-right'
  ): CaptionBox => ({
    id,
    text,
    position,
    style: 'time',
    size: { width: 30 },
    fontSize: 11,
  }),

  /**
   * Create a flashback caption
   */
  flashback: (
    id: string,
    text: string,
    position: CaptionPosition = 'top-left'
  ): CaptionBox => ({
    id,
    text,
    position,
    style: 'flashback',
    fontSize: 12,
  }),

  /**
   * Create an editorial caption
   */
  editorial: (
    id: string,
    text: string,
    position: CaptionPosition = 'bottom-right'
  ): CaptionBox => ({
    id,
    text,
    position,
    style: 'editorial',
    size: { width: 45 },
    fontSize: 10,
  }),
};

/**
 * Get character-specific colors for thought caption styling
 * Useful for applying consistent colors to character UI elements
 */
export function useCharacterCaptionColors(characterIdOrRole: string) {
  return useMemo(() => getCharacterColor(characterIdOrRole), [characterIdOrRole]);
}

export default CaptionOverlay;
