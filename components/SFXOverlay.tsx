/**
 * SFX Overlay Component for Infinite Heroes Comic Creator
 *
 * Renders comic-style sound effects (SFX) on top of a panel image.
 * Uses absolute positioning with percentage-based coordinates for
 * responsive placement across different screen sizes.
 *
 * Supports both SVG-based rendering (for crisp text) and canvas-based
 * rendering (for export/merge with images).
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { SFXElement, SFXRenderOptions, renderSFXToCanvas } from '../utils/sfxRenderer';
import { SFXFont } from '../data/sfxLibrary';

/**
 * Props for the SFXOverlay component
 */
export interface SFXOverlayProps {
  /** Array of SFX elements to render */
  elements: SFXElement[];
  /** Width of the container (for canvas mode) */
  width?: number;
  /** Height of the container (for canvas mode) */
  height?: number;
  /** Render mode: 'svg' for DOM-based, 'canvas' for pixel-based */
  mode?: 'svg' | 'canvas';
  /** Canvas render options */
  renderOptions?: SFXRenderOptions;
  /** Callback when an element is clicked */
  onElementClick?: (element: SFXElement, index: number) => void;
  /** Callback when an element starts being dragged */
  onElementDragStart?: (element: SFXElement, index: number) => void;
  /** Callback when an element is being dragged */
  onElementDrag?: (element: SFXElement, index: number, newPosition: { x: number; y: number }) => void;
  /** Callback when an element drag ends */
  onElementDragEnd?: (element: SFXElement, index: number, finalPosition: { x: number; y: number }) => void;
  /** Whether elements are interactive (clickable/draggable) */
  interactive?: boolean;
  /** Additional CSS class for the container */
  className?: string;
  /** Container styles */
  style?: React.CSSProperties;
}

/**
 * Get CSS font family string
 */
function getFontFamily(font: SFXFont): string {
  const fontFamilies: Record<SFXFont, string> = {
    'Bangers': '"Bangers", "Impact", "Arial Black", sans-serif',
    'Comic Neue': '"Comic Neue", "Comic Sans MS", cursive',
    'Impact': 'Impact, "Arial Black", sans-serif',
  };
  return fontFamilies[font];
}

/**
 * SVG-based SFX element renderer
 * Uses SVG text with filters for outline effects
 */
const SVGSFXElement: React.FC<{
  element: SFXElement;
  index: number;
  interactive: boolean;
  onClick?: (element: SFXElement, index: number) => void;
  onDragStart?: (element: SFXElement, index: number) => void;
  onDrag?: (element: SFXElement, index: number, position: { x: number; y: number }) => void;
  onDragEnd?: (element: SFXElement, index: number, position: { x: number; y: number }) => void;
}> = ({ element, index, interactive, onClick, onDragStart, onDrag, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<SVGGElement>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const filterId = `sfx-outline-${element.id}`;
  const shadowFilterId = `sfx-shadow-${element.id}`;

  // Base font size (will be scaled by element.scale)
  const baseFontSize = 48;
  const fontSize = baseFontSize * element.scale;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };

    // Get container dimensions
    const container = elementRef.current?.closest('.sfx-overlay-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      containerRef.current = { width: rect.width, height: rect.height };
    }

    onDragStart?.(element, index);
  }, [interactive, element, index, onDragStart]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      // Convert pixel delta to percentage
      const newX = element.position.x + (deltaX / containerRef.current.width) * 100;
      const newY = element.position.y + (deltaY / containerRef.current.height) * 100;

      onDrag?.(element, index, {
        x: Math.max(0, Math.min(100, newX)),
        y: Math.max(0, Math.min(100, newY)),
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);

      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      const newX = element.position.x + (deltaX / containerRef.current.width) * 100;
      const newY = element.position.y + (deltaY / containerRef.current.height) * 100;

      onDragEnd?.(element, index, {
        x: Math.max(0, Math.min(100, newX)),
        y: Math.max(0, Math.min(100, newY)),
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, element, index, onDrag, onDragEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onClick?.(element, index);
  }, [interactive, element, index, onClick]);

  return (
    <g
      ref={elementRef}
      transform={`translate(${element.position.x}%, ${element.position.y}%) rotate(${element.rotation})`}
      style={{
        cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
        opacity: element.opacity ?? 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={element.isSelected ? 'sfx-selected' : ''}
    >
      <defs>
        {/* Outline filter */}
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology operator="dilate" radius="3" in="SourceAlpha" result="thicken" />
          <feFlood floodColor={element.outlineColor} result="outlineColor" />
          <feComposite in="outlineColor" in2="thicken" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Drop shadow filter */}
        <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="rgba(0,0,0,0.5)" />
        </filter>
      </defs>

      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: getFontFamily(element.font),
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          fill: element.color,
          filter: `url(#${filterId}) url(#${shadowFilterId})`,
        }}
      >
        {element.text}
      </text>

      {/* Selection indicator */}
      {element.isSelected && (
        <rect
          x={-element.text.length * fontSize * 0.3 - 10}
          y={-fontSize / 2 - 10}
          width={element.text.length * fontSize * 0.6 + 20}
          height={fontSize + 20}
          fill="none"
          stroke="#00FFFF"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      )}
    </g>
  );
};

/**
 * Canvas-based SFX overlay (for export/merge)
 */
const CanvasSFXOverlay: React.FC<{
  elements: SFXElement[];
  width: number;
  height: number;
  renderOptions?: SFXRenderOptions;
}> = ({ elements, width, height, renderOptions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Render SFX
    renderSFXToCanvas(canvas, elements, renderOptions);
  }, [elements, width, height, renderOptions]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

/**
 * Main SFXOverlay component
 *
 * Renders SFX elements on top of a panel using either SVG (for interactive use)
 * or Canvas (for export/high-fidelity rendering).
 */
export const SFXOverlay: React.FC<SFXOverlayProps> = ({
  elements,
  width = 800,
  height = 600,
  mode = 'svg',
  renderOptions,
  onElementClick,
  onElementDragStart,
  onElementDrag,
  onElementDragEnd,
  interactive = false,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize elements to prevent unnecessary re-renders
  const memoizedElements = useMemo(() => elements, [elements]);

  if (memoizedElements.length === 0) {
    return null;
  }

  if (mode === 'canvas') {
    return (
      <div
        ref={containerRef}
        className={`sfx-overlay-container absolute inset-0 pointer-events-none ${className}`}
        style={style}
      >
        <CanvasSFXOverlay
          elements={memoizedElements}
          width={width}
          height={height}
          renderOptions={renderOptions}
        />
      </div>
    );
  }

  // SVG mode (default)
  return (
    <div
      ref={containerRef}
      className={`sfx-overlay-container absolute inset-0 ${interactive ? '' : 'pointer-events-none'} ${className}`}
      style={style}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {memoizedElements.map((element, index) => (
          <SVGSFXElement
            key={element.id}
            element={element}
            index={index}
            interactive={interactive}
            onClick={onElementClick}
            onDragStart={onElementDragStart}
            onDrag={onElementDrag}
            onDragEnd={onElementDragEnd}
          />
        ))}
      </svg>
    </div>
  );
};

/**
 * Hook for managing SFX elements state
 */
export function useSFXElements(initialElements: SFXElement[] = []) {
  const [elements, setElements] = useState<SFXElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addElement = useCallback((element: SFXElement) => {
    setElements(prev => [...prev, element]);
  }, []);

  const removeElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const updateElement = useCallback((id: string, updates: Partial<SFXElement>) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  const selectElement = useCallback((id: string | null) => {
    setSelectedId(id);
    setElements(prev =>
      prev.map(el => ({ ...el, isSelected: el.id === id }))
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setElements(prev => prev.map(el => ({ ...el, isSelected: false })));
  }, []);

  const moveElement = useCallback((id: string, newPosition: { x: number; y: number }) => {
    updateElement(id, { position: newPosition });
  }, [updateElement]);

  const bringToFront = useCallback((id: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;
      return [...prev.filter(el => el.id !== id), element];
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;
      return [element, ...prev.filter(el => el.id !== id)];
    });
  }, []);

  const clearAll = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, []);

  return {
    elements,
    selectedId,
    addElement,
    removeElement,
    updateElement,
    selectElement,
    clearSelection,
    moveElement,
    bringToFront,
    sendToBack,
    clearAll,
    setElements,
  };
}

export default SFXOverlay;
