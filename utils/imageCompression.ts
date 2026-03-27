/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Image Compression Utility
 * Provides image compression and size analysis for the Infinite Heroes Comic Creator app
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for image compression
 */
export interface CompressionOptions {
  /** Quality level from 0 to 1 (default: 0.8 = 80%) */
  quality?: number;
  /** Maximum width in pixels (default: 1200) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1200) */
  maxHeight?: number;
  /** Output format (default: 'jpeg') */
  format?: 'jpeg' | 'webp';
}

/**
 * Default compression options
 */
const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  quality: 0.8,
  maxWidth: 1200,
  maxHeight: 1200,
  format: 'jpeg',
};

/**
 * Result of compression with metadata
 */
export interface CompressionResult {
  /** Compressed image as base64 string (without data URL prefix) */
  base64: string;
  /** Original size in bytes */
  originalSize: number;
  /** Compressed size in bytes */
  compressedSize: number;
  /** Compression ratio (original/compressed) */
  ratio: number;
  /** Final width after compression */
  width: number;
  /** Final height after compression */
  height: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Removes data URL prefix from base64 string if present
 * @param base64 - Base64 string possibly with data URL prefix
 * @returns Clean base64 string without prefix
 */
function cleanBase64(base64: string): string {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
}

/**
 * Creates an HTMLImageElement from a base64 string
 * @param base64 - Base64 encoded image data
 * @returns Promise resolving to loaded image element
 */
function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`));

    // Ensure the base64 has a data URL prefix for loading
    const cleanData = cleanBase64(base64);
    img.src = `data:image/jpeg;base64,${cleanData}`;
  });
}

/**
 * Calculates new dimensions while maintaining aspect ratio
 * @param width - Original width
 * @param height - Original height
 * @param maxWidth - Maximum allowed width
 * @param maxHeight - Maximum allowed height
 * @returns New dimensions that fit within max bounds
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // If image is already within bounds, return original dimensions
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calculate scaling ratios
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;

  // Use the smaller ratio to ensure both dimensions fit
  const scale = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Gets the MIME type string for the canvas API
 * @param format - Output format
 * @returns MIME type string
 */
function getMimeType(format: 'jpeg' | 'webp'): string {
  return format === 'webp' ? 'image/webp' : 'image/jpeg';
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Gets the size of a base64 encoded image in bytes
 *
 * @param base64 - Base64 encoded image string (with or without data URL prefix)
 * @returns Size in bytes
 *
 * @example
 * const size = getImageSize(myBase64Image);
 * console.log(`Image size: ${size} bytes`);
 */
export function getImageSize(base64: string): number {
  // Remove data URL prefix if present
  const cleanData = cleanBase64(base64);

  // Base64 encoding uses 4 characters to represent 3 bytes
  // We also need to account for padding characters ('=')
  const padding = (cleanData.match(/=/g) || []).length;

  // Calculate actual byte size
  return Math.floor((cleanData.length * 3) / 4) - padding;
}

/**
 * Formats byte size to human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compresses an image using the Canvas API
 *
 * @param base64 - Base64 encoded image string (with or without data URL prefix)
 * @param options - Compression options
 * @returns Promise resolving to compressed base64 string (without data URL prefix)
 *
 * @example
 * // Basic usage with defaults (80% quality, max 1200px)
 * const compressed = await compressImage(originalBase64);
 *
 * @example
 * // Custom options
 * const compressed = await compressImage(originalBase64, {
 *   quality: 0.6,
 *   maxWidth: 800,
 *   maxHeight: 600,
 *   format: 'webp'
 * });
 *
 * @throws Error if image loading or compression fails
 */
export async function compressImage(
  base64: string,
  options?: CompressionOptions
): Promise<string> {
  // Merge with defaults
  const opts: Required<CompressionOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Validate quality range
  if (opts.quality < 0 || opts.quality > 1) {
    throw new Error('Quality must be between 0 and 1');
  }

  try {
    // Load the image
    const img = await loadImage(base64);

    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      img.width,
      img.height,
      opts.maxWidth,
      opts.maxHeight
    );

    // Create canvas with new dimensions
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Draw image to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the image scaled to new dimensions
    ctx.drawImage(img, 0, 0, width, height);

    // Export as compressed format
    const mimeType = getMimeType(opts.format);
    const dataUrl = canvas.toDataURL(mimeType, opts.quality);

    // Remove data URL prefix and return clean base64
    const result = cleanBase64(dataUrl);

    return result;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Image compression failed: ${error.message}`);
    }
    throw new Error('Image compression failed: Unknown error');
  }
}

/**
 * Compresses an image and returns detailed result with metadata
 *
 * @param base64 - Base64 encoded image string
 * @param options - Compression options
 * @returns Promise resolving to compression result with metadata
 *
 * @example
 * const result = await compressImageWithMetadata(originalBase64, { quality: 0.7 });
 * console.log(`Compressed from ${formatSize(result.originalSize)} to ${formatSize(result.compressedSize)}`);
 * console.log(`Compression ratio: ${result.ratio.toFixed(2)}x`);
 */
export async function compressImageWithMetadata(
  base64: string,
  options?: CompressionOptions
): Promise<CompressionResult> {
  // Merge with defaults
  const opts: Required<CompressionOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Get original size
  const originalSize = getImageSize(base64);

  try {
    // Load the image to get dimensions
    const img = await loadImage(base64);

    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      img.width,
      img.height,
      opts.maxWidth,
      opts.maxHeight
    );

    // Compress the image
    const compressedBase64 = await compressImage(base64, options);
    const compressedSize = getImageSize(compressedBase64);

    return {
      base64: compressedBase64,
      originalSize,
      compressedSize,
      ratio: compressedSize > 0 ? originalSize / compressedSize : 1,
      width,
      height,
    };
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Image compression with metadata failed: ${error.message}`);
    }
    throw new Error('Image compression with metadata failed: Unknown error');
  }
}

/**
 * Checks if an image should be compressed based on size
 * @param base64 - Base64 encoded image
 * @param thresholdBytes - Size threshold in bytes (default: 500KB)
 * @returns true if image exceeds threshold
 */
export function shouldCompress(base64: string, thresholdBytes: number = 500 * 1024): boolean {
  return getImageSize(base64) > thresholdBytes;
}

/**
 * Compresses an image only if it exceeds the size threshold
 * @param base64 - Base64 encoded image
 * @param options - Compression options
 * @param thresholdBytes - Size threshold in bytes (default: 500KB)
 * @returns Promise resolving to original or compressed base64
 */
export async function compressIfNeeded(
  base64: string,
  options?: CompressionOptions,
  thresholdBytes: number = 500 * 1024
): Promise<string> {
  if (!shouldCompress(base64, thresholdBytes)) {
    // Already small enough, return as-is (but clean the prefix)
    return cleanBase64(base64);
  }

  return compressImage(base64, options);
}
