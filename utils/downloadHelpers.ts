/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Download Helpers Utility
 * Provides utilities for downloading comic pages as ZIP archives or individual files.
 * Uses JSZip for ZIP creation and File System Access API where available.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for downloading images
 */
export interface DownloadOptions {
  /** Format for image files */
  format: 'png' | 'jpeg' | 'webp';
  /** Quality for lossy formats (0-1, default: 0.92) */
  quality?: number;
  /** Prefix for filenames (default: 'page') */
  filenamePrefix?: string;
  /** Include page numbers in filenames (default: true) */
  includePageNumbers?: boolean;
}

/**
 * Image data for download
 */
export interface ImageForDownload {
  /** Base64 image data (with or without data URL prefix) */
  base64: string;
  /** Page number or identifier */
  pageNumber: number;
  /** Optional custom filename (without extension) */
  customName?: string;
  /** MIME type if known */
  mimeType?: string;
}

/**
 * Result of a download operation
 */
export interface DownloadResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Number of files downloaded */
  fileCount: number;
  /** Error message if failed */
  error?: string;
  /** Total size in bytes */
  totalSize?: number;
}

// ============================================================================
// BROWSER CAPABILITY DETECTION
// ============================================================================

/**
 * Check if the File System Access API is available
 * This API allows saving files to user-selected locations with a native picker
 */
export function hasFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/**
 * Check if the browser supports the download attribute
 */
export function hasDownloadAttribute(): boolean {
  return typeof document !== 'undefined' && 'download' in document.createElement('a');
}

/**
 * Check if JSZip is available (must be loaded separately)
 */
export function hasJSZip(): boolean {
  return typeof window !== 'undefined' && 'JSZip' in window;
}

/**
 * Get browser download capabilities summary
 */
export function getDownloadCapabilities(): {
  fileSystemAccess: boolean;
  downloadAttribute: boolean;
  jsZip: boolean;
  recommended: 'fileSystemAccess' | 'downloadAttribute' | 'fallback';
} {
  const fileSystemAccess = hasFileSystemAccess();
  const downloadAttribute = hasDownloadAttribute();
  const jsZip = hasJSZip();

  let recommended: 'fileSystemAccess' | 'downloadAttribute' | 'fallback' = 'fallback';
  if (fileSystemAccess) {
    recommended = 'fileSystemAccess';
  } else if (downloadAttribute) {
    recommended = 'downloadAttribute';
  }

  return {
    fileSystemAccess,
    downloadAttribute,
    jsZip,
    recommended,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clean base64 string by removing data URL prefix if present
 */
function cleanBase64(base64: string): string {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
}

/**
 * Get data URL prefix for a given format
 */
function getDataUrlPrefix(format: 'png' | 'jpeg' | 'webp'): string {
  const mimeTypes = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return `data:${mimeTypes[format]};base64,`;
}

/**
 * Get file extension for a format
 */
function getExtension(format: 'png' | 'jpeg' | 'webp'): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/**
 * Convert base64 to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const cleanData = cleanBase64(base64);
  const byteCharacters = atob(cleanData);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Generate filename for an image
 */
function generateFilename(
  image: ImageForDownload,
  format: 'png' | 'jpeg' | 'webp',
  options: DownloadOptions
): string {
  const ext = getExtension(format);

  if (image.customName) {
    return `${image.customName}.${ext}`;
  }

  const prefix = options.filenamePrefix || 'page';
  const pageNum = options.includePageNumbers !== false
    ? String(image.pageNumber).padStart(2, '0')
    : '';

  return pageNum ? `${prefix}_${pageNum}.${ext}` : `${prefix}.${ext}`;
}

// ============================================================================
// INDIVIDUAL FILE DOWNLOAD
// ============================================================================

/**
 * Download a single image file using the download attribute
 */
export async function downloadSingleImage(
  image: ImageForDownload,
  options: Partial<DownloadOptions> = {}
): Promise<DownloadResult> {
  const opts: DownloadOptions = {
    format: 'png',
    quality: 0.92,
    filenamePrefix: 'page',
    includePageNumbers: true,
    ...options,
  };

  try {
    const mimeType = `image/${opts.format}`;
    const blob = base64ToBlob(image.base64, mimeType);
    const filename = generateFilename(image, opts.format, opts);

    // Try File System Access API first
    if (hasFileSystemAccess()) {
      try {
        const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Image file',
            accept: { [mimeType]: [`.${getExtension(opts.format)}`] },
          }],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        return { success: true, fileCount: 1, totalSize: blob.size };
      } catch (err) {
        // User cancelled or API failed, fall through to download attribute
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: false, fileCount: 0, error: 'Download cancelled' };
        }
      }
    }

    // Fallback to download attribute
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileCount: 1, totalSize: blob.size };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, fileCount: 0, error: `Failed to download image: ${message}` };
  }
}

/**
 * Download multiple images as individual files
 * Note: Most browsers will block multiple automatic downloads, so this prompts for each
 */
export async function downloadImages(
  images: ImageForDownload[],
  options: Partial<DownloadOptions> = {}
): Promise<DownloadResult> {
  const opts: DownloadOptions = {
    format: 'png',
    quality: 0.92,
    filenamePrefix: 'page',
    includePageNumbers: true,
    ...options,
  };

  let successCount = 0;
  let totalSize = 0;
  const errors: string[] = [];

  for (const image of images) {
    const result = await downloadSingleImage(image, opts);
    if (result.success) {
      successCount++;
      totalSize += result.totalSize || 0;
    } else if (result.error) {
      errors.push(result.error);
    }

    // Small delay between downloads to avoid browser blocking
    if (images.indexOf(image) < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return {
    success: successCount === images.length,
    fileCount: successCount,
    totalSize,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

// ============================================================================
// ZIP DOWNLOAD
// ============================================================================

/**
 * Type definition for JSZip (loaded externally)
 */
interface JSZipInstance {
  file(name: string, data: Blob | string, options?: { base64?: boolean }): void;
  generateAsync(options: { type: 'blob' }): Promise<Blob>;
}

interface JSZipConstructor {
  new(): JSZipInstance;
}

/**
 * Download multiple images as a ZIP file using JSZip
 *
 * @param images - Array of images to include in the ZIP
 * @param zipFilename - Name for the ZIP file (default: 'comic-pages.zip')
 * @param options - Download options for image format and naming
 * @returns Promise resolving to download result
 *
 * @example
 * ```typescript
 * const images = pages.map((page, i) => ({
 *   base64: page.imageUrl,
 *   pageNumber: i + 1,
 * }));
 *
 * const result = await downloadAsZip(images, 'my-comic.zip', { format: 'png' });
 * if (result.success) {
 *   console.log(`Downloaded ${result.fileCount} pages`);
 * }
 * ```
 *
 * @throws Error if JSZip is not available
 */
export async function downloadAsZip(
  images: ImageForDownload[],
  zipFilename: string = 'comic-pages.zip',
  options: Partial<DownloadOptions> = {}
): Promise<DownloadResult> {
  const opts: DownloadOptions = {
    format: 'png',
    quality: 0.92,
    filenamePrefix: 'page',
    includePageNumbers: true,
    ...options,
  };

  // Check for JSZip availability
  if (!hasJSZip()) {
    // Try to provide a helpful error message
    return {
      success: false,
      fileCount: 0,
      error: 'JSZip library is not loaded. Please ensure JSZip is included in your project. Install with: npm install jszip',
    };
  }

  try {
    const JSZip = (window as unknown as { JSZip: JSZipConstructor }).JSZip;
    const zip = new JSZip();
    let totalSize = 0;

    // Add each image to the ZIP
    for (const image of images) {
      const mimeType = `image/${opts.format}`;
      const blob = base64ToBlob(image.base64, mimeType);
      const filename = generateFilename(image, opts.format, opts);

      zip.file(filename, blob);
      totalSize += blob.size;
    }

    // Generate the ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Try File System Access API first
    if (hasFileSystemAccess()) {
      try {
        const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: zipFilename,
          types: [{
            description: 'ZIP Archive',
            accept: { 'application/zip': ['.zip'] },
          }],
        });

        const writable = await handle.createWritable();
        await writable.write(zipBlob);
        await writable.close();

        return { success: true, fileCount: images.length, totalSize: zipBlob.size };
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: false, fileCount: 0, error: 'Download cancelled' };
        }
        // Fall through to download attribute
      }
    }

    // Fallback to download attribute
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileCount: images.length, totalSize: zipBlob.size };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, fileCount: 0, error: `Failed to create ZIP: ${message}` };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Download comic pages with automatic method selection
 * Uses ZIP if JSZip is available and multiple pages, otherwise individual downloads
 */
export async function downloadComicPages(
  images: ImageForDownload[],
  comicTitle: string = 'comic',
  options: Partial<DownloadOptions> = {}
): Promise<DownloadResult> {
  // Sanitize title for filename
  const safeTitle = comicTitle.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();

  // For single image, always download directly
  if (images.length === 1) {
    return downloadSingleImage(images[0], {
      ...options,
      filenamePrefix: safeTitle,
    });
  }

  // For multiple images, prefer ZIP if available
  if (hasJSZip()) {
    return downloadAsZip(images, `${safeTitle}.zip`, {
      ...options,
      filenamePrefix: safeTitle,
    });
  }

  // Fallback to individual downloads
  return downloadImages(images, {
    ...options,
    filenamePrefix: safeTitle,
  });
}

/**
 * Format byte size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
