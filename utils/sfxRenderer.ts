/**
 * SFX Renderer Utility for Infinite Heroes Comic Creator
 *
 * Provides functions for rendering comic-style sound effects (SFX)
 * on canvas elements with proper styling, outlines, and effects.
 */

import { SFXEntry, SFXFont, SFXStyle, getSFXById } from '../data/sfxLibrary';

/**
 * Position coordinates using percentage-based values (0-100)
 * for responsive placement across different panel sizes
 */
export interface SFXPosition {
  /** X position as percentage (0-100) from left */
  x: number;
  /** Y position as percentage (0-100) from top */
  y: number;
}

/**
 * A placed SFX element on a comic panel
 */
export interface SFXElement {
  /** Unique identifier for this placed element */
  id: string;
  /** Reference to SFX library entry ID, or null for custom text */
  sfxId: string | null;
  /** The actual text to display (can override library text) */
  text: string;
  /** SFX style category */
  style: SFXStyle;
  /** Position on the panel (percentage-based) */
  position: SFXPosition;
  /** Rotation in degrees */
  rotation: number;
  /** Scale factor (1.0 = normal size) */
  scale: number;
  /** Primary fill color */
  color: string;
  /** Outline/stroke color */
  outlineColor: string;
  /** Font family to use */
  font: SFXFont;
  /** Optional opacity (0-1) */
  opacity?: number;
  /** Whether this element is currently selected in editor */
  isSelected?: boolean;
}

/**
 * Render options for SFX drawing
 */
export interface SFXRenderOptions {
  /** Base font size in pixels (will be scaled) */
  baseFontSize?: number;
  /** Outline width in pixels */
  outlineWidth?: number;
  /** Enable drop shadow */
  dropShadow?: boolean;
  /** Shadow offset in pixels */
  shadowOffset?: number;
  /** Shadow blur radius */
  shadowBlur?: number;
  /** Shadow color */
  shadowColor?: string;
  /** Enable 3D/depth effect with multiple outlines */
  enable3DEffect?: boolean;
  /** 3D effect depth in pixels */
  depth3D?: number;
}

const DEFAULT_RENDER_OPTIONS: Required<SFXRenderOptions> = {
  baseFontSize: 48,
  outlineWidth: 4,
  dropShadow: true,
  shadowOffset: 4,
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  enable3DEffect: true,
  depth3D: 3,
};

/**
 * Create an SFXElement from a library entry
 */
export function createSFXElement(
  sfxEntry: SFXEntry,
  position: SFXPosition,
  overrides?: Partial<Omit<SFXElement, 'id' | 'sfxId'>>
): SFXElement {
  return {
    id: `sfx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sfxId: sfxEntry.id,
    text: overrides?.text ?? sfxEntry.text,
    style: overrides?.style ?? sfxEntry.style,
    position,
    rotation: overrides?.rotation ?? sfxEntry.defaultRotation ?? 0,
    scale: overrides?.scale ?? 1,
    color: overrides?.color ?? sfxEntry.color,
    outlineColor: overrides?.outlineColor ?? sfxEntry.outlineColor,
    font: overrides?.font ?? sfxEntry.font,
    opacity: overrides?.opacity ?? 1,
    isSelected: overrides?.isSelected ?? false,
  };
}

/**
 * Create a custom SFXElement (not from library)
 */
export function createCustomSFXElement(
  text: string,
  position: SFXPosition,
  options?: Partial<Omit<SFXElement, 'id' | 'sfxId' | 'text' | 'position'>>
): SFXElement {
  return {
    id: `sfx-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sfxId: null,
    text: text.toUpperCase(),
    style: options?.style ?? 'impact',
    position,
    rotation: options?.rotation ?? 0,
    scale: options?.scale ?? 1,
    color: options?.color ?? '#FF0000',
    outlineColor: options?.outlineColor ?? '#000000',
    font: options?.font ?? 'Bangers',
    opacity: options?.opacity ?? 1,
    isSelected: options?.isSelected ?? false,
  };
}

/**
 * Get font string for canvas context
 */
function getFontString(font: SFXFont, size: number, bold: boolean = true): string {
  const weight = bold ? 'bold' : 'normal';
  // Provide fallbacks for web fonts
  const fontFamilies: Record<SFXFont, string> = {
    'Bangers': '"Bangers", "Impact", "Arial Black", sans-serif',
    'Comic Neue': '"Comic Neue", "Comic Sans MS", cursive',
    'Impact': 'Impact, "Arial Black", sans-serif',
  };
  return `${weight} ${size}px ${fontFamilies[font]}`;
}

/**
 * Render a single SFX element to a canvas context
 */
export function renderSFXToContext(
  ctx: CanvasRenderingContext2D,
  element: SFXElement,
  canvasWidth: number,
  canvasHeight: number,
  options?: SFXRenderOptions
): void {
  const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };

  // Calculate actual pixel position from percentage
  const x = (element.position.x / 100) * canvasWidth;
  const y = (element.position.y / 100) * canvasHeight;

  // Calculate scaled font size
  const fontSize = opts.baseFontSize * element.scale;

  // Save context state
  ctx.save();

  // Apply opacity
  ctx.globalAlpha = element.opacity ?? 1;

  // Move to position and rotate
  ctx.translate(x, y);
  ctx.rotate((element.rotation * Math.PI) / 180);

  // Set font
  ctx.font = getFontString(element.font, fontSize);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = element.text;

  // Draw drop shadow if enabled
  if (opts.dropShadow) {
    ctx.fillStyle = opts.shadowColor;
    ctx.fillText(text, opts.shadowOffset, opts.shadowOffset);
  }

  // Draw 3D depth effect if enabled
  if (opts.enable3DEffect && opts.depth3D > 0) {
    ctx.fillStyle = darkenColor(element.color, 0.5);
    for (let i = opts.depth3D; i > 0; i--) {
      ctx.fillText(text, i, i);
    }
  }

  // Draw outline (stroke)
  if (opts.outlineWidth > 0) {
    ctx.strokeStyle = element.outlineColor;
    ctx.lineWidth = opts.outlineWidth;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(text, 0, 0);
  }

  // Draw main text fill
  ctx.fillStyle = element.color;
  ctx.fillText(text, 0, 0);

  // Draw selection indicator if selected
  if (element.isSelected) {
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    const metrics = ctx.measureText(text);
    const textHeight = fontSize;
    const padding = 10;
    ctx.strokeRect(
      -metrics.width / 2 - padding,
      -textHeight / 2 - padding,
      metrics.width + padding * 2,
      textHeight + padding * 2
    );
    ctx.setLineDash([]);
  }

  // Restore context state
  ctx.restore();
}

/**
 * Render multiple SFX elements to a canvas
 */
export function renderSFXToCanvas(
  canvas: HTMLCanvasElement,
  elements: SFXElement[],
  options?: SFXRenderOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2D context from canvas');
    return;
  }

  const { width, height } = canvas;

  // Clear only the areas where we'll draw (preserve background)
  // Note: This function assumes the canvas already has content
  // and we're overlaying SFX on top

  // Render each element
  elements.forEach(element => {
    renderSFXToContext(ctx, element, width, height, options);
  });
}

/**
 * Create a transparent canvas with SFX overlay
 * Returns a new canvas element with only the SFX rendered
 */
export function createSFXOverlayCanvas(
  width: number,
  height: number,
  elements: SFXElement[],
  options?: SFXRenderOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not create canvas context');
    return canvas;
  }

  // Canvas is transparent by default
  elements.forEach(element => {
    renderSFXToContext(ctx, element, width, height, options);
  });

  return canvas;
}

/**
 * Merge SFX overlay with a base image
 * Returns a data URL of the combined image
 */
export async function mergeSFXWithImage(
  baseImageSrc: string,
  elements: SFXElement[],
  options?: SFXRenderOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Render SFX on top
      elements.forEach(element => {
        renderSFXToContext(ctx, element, canvas.width, canvas.height, options);
      });

      // Return as data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load base image'));
    };

    img.src = baseImageSrc;
  });
}

/**
 * Helper function to darken a hex color
 */
function darkenColor(hex: string, factor: number): string {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Darken
  const newR = Math.floor(r * (1 - factor));
  const newG = Math.floor(g * (1 - factor));
  const newB = Math.floor(b * (1 - factor));

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Get bounding box of an SFX element (for hit testing)
 */
export function getSFXBoundingBox(
  element: SFXElement,
  canvasWidth: number,
  canvasHeight: number,
  baseFontSize: number = 48
): { x: number; y: number; width: number; height: number } {
  const x = (element.position.x / 100) * canvasWidth;
  const y = (element.position.y / 100) * canvasHeight;
  const fontSize = baseFontSize * element.scale;

  // Estimate text width (roughly 0.6 * fontSize * character count)
  const estimatedWidth = element.text.length * fontSize * 0.6;
  const estimatedHeight = fontSize * 1.2;

  return {
    x: x - estimatedWidth / 2,
    y: y - estimatedHeight / 2,
    width: estimatedWidth,
    height: estimatedHeight,
  };
}

/**
 * Check if a point is inside an SFX element's bounding box
 */
export function isPointInSFX(
  pointX: number,
  pointY: number,
  element: SFXElement,
  canvasWidth: number,
  canvasHeight: number,
  baseFontSize: number = 48
): boolean {
  const box = getSFXBoundingBox(element, canvasWidth, canvasHeight, baseFontSize);

  // Simple bounding box check (ignoring rotation for simplicity)
  return (
    pointX >= box.x &&
    pointX <= box.x + box.width &&
    pointY >= box.y &&
    pointY <= box.y + box.height
  );
}

/**
 * Get SFX element at a given point (for selection)
 */
export function getSFXAtPoint(
  pointX: number,
  pointY: number,
  elements: SFXElement[],
  canvasWidth: number,
  canvasHeight: number,
  baseFontSize: number = 48
): SFXElement | null {
  // Check in reverse order (top elements first)
  for (let i = elements.length - 1; i >= 0; i--) {
    if (isPointInSFX(pointX, pointY, elements[i], canvasWidth, canvasHeight, baseFontSize)) {
      return elements[i];
    }
  }
  return null;
}

/**
 * Update an SFX element's position (for drag & drop)
 */
export function updateSFXPosition(
  element: SFXElement,
  newX: number,
  newY: number,
  canvasWidth: number,
  canvasHeight: number
): SFXElement {
  return {
    ...element,
    position: {
      x: Math.max(0, Math.min(100, (newX / canvasWidth) * 100)),
      y: Math.max(0, Math.min(100, (newY / canvasHeight) * 100)),
    },
  };
}

/**
 * Serialize SFX elements for storage
 */
export function serializeSFXElements(elements: SFXElement[]): string {
  return JSON.stringify(elements);
}

/**
 * Deserialize SFX elements from storage
 */
export function deserializeSFXElements(json: string): SFXElement[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as SFXElement[];
  } catch {
    console.error('Failed to deserialize SFX elements');
    return [];
  }
}

export default {
  createSFXElement,
  createCustomSFXElement,
  renderSFXToCanvas,
  renderSFXToContext,
  createSFXOverlayCanvas,
  mergeSFXWithImage,
  getSFXBoundingBox,
  isPointInSFX,
  getSFXAtPoint,
  updateSFXPosition,
  serializeSFXElements,
  deserializeSFXElements,
};
