/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CMYK Export Utility
 * Provides print-ready CMYK color conversion and export functionality
 * for the Infinite Heroes Comic Creator app.
 *
 * IMPORTANT NOTES:
 * - True CMYK conversion requires ICC color profiles which are not available in browsers
 * - This utility provides "CMYK-safe" approximation that simulates how colors will print
 * - For professional printing, the output should be verified in design software like
 *   Adobe InDesign, Photoshop, or Affinity Publisher
 * - The gamut warning system helps identify colors that may not print as expected
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * CMYK color representation (0-100 scale, matching print industry standard)
 */
export interface CMYKColor {
  /** Cyan component (0-100) */
  c: number;
  /** Magenta component (0-100) */
  m: number;
  /** Yellow component (0-100) */
  y: number;
  /** Key/Black component (0-100) */
  k: number;
}

/**
 * RGB color representation (0-255 scale)
 */
export interface RGBColor {
  /** Red component (0-255) */
  r: number;
  /** Green component (0-255) */
  g: number;
  /** Blue component (0-255) */
  b: number;
}

/**
 * Options for print export
 */
export interface PrintExportOptions {
  /** Output resolution in DPI (300 for standard print, 600 for high quality) */
  resolution: 300 | 600;
  /** Color space mode */
  colorSpace: 'rgb' | 'cmyk-safe';
  /** Bleed area in millimeters (typically 3mm for professional printing) */
  bleed: number;
  /** Output format */
  format: 'pdf' | 'tiff';
  /** Include printer marks (crop marks, registration marks) */
  includeMarks: boolean;
  /** Page size in inches */
  pageSize?: { width: number; height: number };
}

/**
 * Result of gamut analysis
 */
export interface GamutAnalysisResult {
  /** Total number of pixels analyzed */
  totalPixels: number;
  /** Number of pixels outside CMYK gamut */
  outOfGamutPixels: number;
  /** Percentage of out-of-gamut pixels */
  outOfGamutPercentage: number;
  /** Whether the image needs significant color adjustment */
  needsAdjustment: boolean;
  /** Dominant colors that are out of gamut */
  problematicColors: RGBColor[];
}

/**
 * Print export result
 */
export interface PrintExportResult {
  /** Whether export was successful */
  success: boolean;
  /** The exported blob */
  blob?: Blob;
  /** Error message if failed */
  error?: string;
  /** Gamut analysis results for each page */
  gamutAnalysis?: GamutAnalysisResult[];
  /** Warnings for the user */
  warnings: string[];
}

// ============================================================================
// COLOR CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert RGB color to CMYK color
 *
 * This uses the standard RGB to CMYK conversion formula.
 * Note: This is an approximation; true CMYK conversion requires ICC profiles.
 *
 * @param rgb - RGB color to convert
 * @returns CMYK color representation
 *
 * @example
 * const cmyk = rgbToCmyk({ r: 255, g: 0, b: 0 });
 * // Returns { c: 0, m: 100, y: 100, k: 0 } for pure red
 */
export function rgbToCmyk(rgb: RGBColor): CMYKColor {
  // Normalize RGB values to 0-1 range
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  // Calculate K (black) component
  const k = 1 - Math.max(r, g, b);

  // Handle pure black case to avoid division by zero
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  // Calculate CMY components
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  // Convert to 0-100 scale and round
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

/**
 * Convert CMYK color back to RGB
 *
 * @param cmyk - CMYK color to convert
 * @returns RGB color representation
 *
 * @example
 * const rgb = cmykToRgb({ c: 0, m: 100, y: 100, k: 0 });
 * // Returns { r: 255, g: 0, b: 0 } for pure red
 */
export function cmykToRgb(cmyk: CMYKColor): RGBColor {
  // Normalize CMYK values to 0-1 range
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  // Convert to RGB
  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));

  return { r, g, b };
}

/**
 * Check if an RGB color is within the printable CMYK gamut
 *
 * Highly saturated RGB colors (especially neon greens, bright cyans, and
 * electric blues) often fall outside the CMYK gamut.
 *
 * @param rgb - RGB color to check
 * @returns true if the color is within CMYK gamut
 */
export function isInCmykGamut(rgb: RGBColor): boolean {
  // Convert to CMYK and back
  const cmyk = rgbToCmyk(rgb);
  const roundTrip = cmykToRgb(cmyk);

  // Calculate the color difference (simple Euclidean distance)
  const deltaR = Math.abs(rgb.r - roundTrip.r);
  const deltaG = Math.abs(rgb.g - roundTrip.g);
  const deltaB = Math.abs(rgb.b - roundTrip.b);

  // If the round-trip difference is small, the color is in gamut
  // Threshold of 5 allows for rounding errors
  return deltaR <= 5 && deltaG <= 5 && deltaB <= 5;
}

/**
 * Clamp an RGB color to fit within the CMYK gamut
 *
 * This function adjusts out-of-gamut colors to their nearest printable equivalent
 * by converting to CMYK and back to RGB.
 *
 * @param rgb - RGB color to clamp
 * @returns Gamut-clamped RGB color
 */
export function clampToGamut(rgb: RGBColor): RGBColor {
  // Convert to CMYK and back - this naturally clamps to gamut
  const cmyk = rgbToCmyk(rgb);
  return cmykToRgb(cmyk);
}

/**
 * Apply a desaturation adjustment to bring colors closer to CMYK gamut
 *
 * This provides a softer approach than hard clamping, preserving more
 * of the original color relationship while reducing vibrancy.
 *
 * @param rgb - RGB color to adjust
 * @param amount - Desaturation amount (0 = no change, 1 = full desaturation)
 * @returns Desaturated RGB color
 */
export function desaturateForPrint(rgb: RGBColor, amount: number = 0.15): RGBColor {
  // Calculate luminance (perceived brightness)
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;

  // Blend toward gray based on amount
  const clampedAmount = Math.max(0, Math.min(1, amount));
  return {
    r: Math.round(rgb.r + (luminance - rgb.r) * clampedAmount),
    g: Math.round(rgb.g + (luminance - rgb.g) * clampedAmount),
    b: Math.round(rgb.b + (luminance - rgb.b) * clampedAmount),
  };
}

// ============================================================================
// CANVAS CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert an entire canvas to use CMYK-safe colors
 *
 * This processes every pixel in the canvas and adjusts colors that fall
 * outside the CMYK gamut to their nearest printable equivalent.
 *
 * @param canvas - HTMLCanvasElement to convert
 * @returns New HTMLCanvasElement with CMYK-safe colors
 *
 * @example
 * const printCanvas = convertToCmykSafe(originalCanvas);
 * const dataUrl = printCanvas.toDataURL('image/png');
 */
export function convertToCmykSafe(canvas: HTMLCanvasElement): HTMLCanvasElement {
  // Create output canvas with same dimensions
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;

  const sourceCtx = canvas.getContext('2d');
  const outputCtx = outputCanvas.getContext('2d');

  if (!sourceCtx || !outputCtx) {
    throw new Error('Failed to get canvas context');
  }

  // Get image data
  const imageData = sourceCtx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Process each pixel (RGBA format, 4 values per pixel)
  for (let i = 0; i < data.length; i += 4) {
    const rgb: RGBColor = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    };

    // Convert to CMYK-safe color
    const safeColor = clampToGamut(rgb);

    // Apply slight desaturation for more predictable print results
    const printColor = desaturateForPrint(safeColor, 0.08);

    // Update pixel data
    data[i] = printColor.r;
    data[i + 1] = printColor.g;
    data[i + 2] = printColor.b;
    // Alpha channel (data[i + 3]) remains unchanged
  }

  // Put the modified image data onto output canvas
  outputCtx.putImageData(imageData, 0, 0);

  return outputCanvas;
}

/**
 * Analyze an image for out-of-gamut colors
 *
 * This function scans the image and identifies colors that may not
 * print accurately in CMYK.
 *
 * @param canvas - Canvas containing the image to analyze
 * @returns Analysis results including percentage of problematic colors
 */
export function analyzeGamut(canvas: HTMLCanvasElement): GamutAnalysisResult {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let outOfGamutPixels = 0;
  const problematicColors: Map<string, RGBColor> = new Map();

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const rgb: RGBColor = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    };

    if (!isInCmykGamut(rgb)) {
      outOfGamutPixels++;

      // Track unique problematic colors (quantized to reduce count)
      const quantized: RGBColor = {
        r: Math.round(rgb.r / 16) * 16,
        g: Math.round(rgb.g / 16) * 16,
        b: Math.round(rgb.b / 16) * 16,
      };
      const key = `${quantized.r},${quantized.g},${quantized.b}`;
      if (!problematicColors.has(key)) {
        problematicColors.set(key, quantized);
      }
    }
  }

  const totalPixels = data.length / 4;
  const outOfGamutPercentage = (outOfGamutPixels / totalPixels) * 100;

  // Get top 5 most problematic colors (by appearance frequency would be better,
  // but for simplicity we just take the first 5 unique ones)
  const topProblematicColors = Array.from(problematicColors.values()).slice(0, 5);

  return {
    totalPixels,
    outOfGamutPixels,
    outOfGamutPercentage,
    needsAdjustment: outOfGamutPercentage > 5, // More than 5% out of gamut
    problematicColors: topProblematicColors,
  };
}

// ============================================================================
// PREVIEW FUNCTIONS
// ============================================================================

/**
 * Generate a CMYK preview simulation from an image URL
 *
 * This loads the image, converts it to CMYK-safe colors, and returns
 * a data URL that shows how the image will look when printed.
 *
 * @param imageUrl - URL or data URL of the image
 * @returns Promise resolving to a data URL of the CMYK preview
 *
 * @example
 * const previewUrl = await simulateCmykPreview(myImageUrl);
 * previewImage.src = previewUrl;
 */
export async function simulateCmykPreview(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Create canvas from image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Convert to CMYK-safe
        const cmykCanvas = convertToCmykSafe(canvas);

        // Return as data URL
        resolve(cmykCanvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for CMYK preview'));
    };

    img.src = imageUrl;
  });
}

// ============================================================================
// BLEED AND MARKS FUNCTIONS
// ============================================================================

/**
 * Convert millimeters to pixels at a given DPI
 */
export function mmToPixels(mm: number, dpi: number): number {
  // 1 inch = 25.4 mm
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Convert inches to pixels at a given DPI
 */
export function inchesToPixels(inches: number, dpi: number): number {
  return Math.round(inches * dpi);
}

/**
 * Add bleed area to a canvas
 *
 * Bleed extends the image beyond the trim area so that printing can
 * extend to the edge without white borders.
 *
 * @param canvas - Source canvas
 * @param bleedMm - Bleed size in millimeters
 * @param dpi - Output resolution
 * @returns New canvas with bleed area added
 */
export function addBleedArea(
  canvas: HTMLCanvasElement,
  bleedMm: number,
  dpi: number
): HTMLCanvasElement {
  const bleedPx = mmToPixels(bleedMm, dpi);

  // Create new canvas with bleed area
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = canvas.width + bleedPx * 2;
  outputCanvas.height = canvas.height + bleedPx * 2;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill bleed area with edge-extended content
  // First, fill with white as fallback
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  // Draw the main image centered
  ctx.drawImage(canvas, bleedPx, bleedPx);

  // Extend edges into bleed area
  const sourceCtx = canvas.getContext('2d');
  if (sourceCtx) {
    // Top edge
    const topStrip = sourceCtx.getImageData(0, 0, canvas.width, 1);
    for (let y = 0; y < bleedPx; y++) {
      ctx.putImageData(topStrip, bleedPx, y);
    }

    // Bottom edge
    const bottomStrip = sourceCtx.getImageData(0, canvas.height - 1, canvas.width, 1);
    for (let y = 0; y < bleedPx; y++) {
      ctx.putImageData(bottomStrip, bleedPx, outputCanvas.height - 1 - y);
    }

    // Left edge
    const leftStrip = sourceCtx.getImageData(0, 0, 1, canvas.height);
    for (let x = 0; x < bleedPx; x++) {
      ctx.putImageData(leftStrip, x, bleedPx);
    }

    // Right edge
    const rightStrip = sourceCtx.getImageData(canvas.width - 1, 0, 1, canvas.height);
    for (let x = 0; x < bleedPx; x++) {
      ctx.putImageData(rightStrip, outputCanvas.width - 1 - x, bleedPx);
    }
  }

  return outputCanvas;
}

/**
 * Draw crop marks on a canvas
 *
 * Crop marks show where the paper should be trimmed after printing.
 *
 * @param canvas - Canvas to draw marks on
 * @param trimX - X position of trim area start
 * @param trimY - Y position of trim area start
 * @param trimWidth - Width of trim area
 * @param trimHeight - Height of trim area
 * @param markLength - Length of crop marks in pixels
 */
export function drawCropMarks(
  canvas: HTMLCanvasElement,
  trimX: number,
  trimY: number,
  trimWidth: number,
  trimHeight: number,
  markLength: number = 20
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;

  const offset = 10; // Offset from trim edge

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(trimX - offset - markLength, trimY);
  ctx.lineTo(trimX - offset, trimY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(trimX, trimY - offset - markLength);
  ctx.lineTo(trimX, trimY - offset);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(trimX + trimWidth + offset, trimY);
  ctx.lineTo(trimX + trimWidth + offset + markLength, trimY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(trimX + trimWidth, trimY - offset - markLength);
  ctx.lineTo(trimX + trimWidth, trimY - offset);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(trimX - offset - markLength, trimY + trimHeight);
  ctx.lineTo(trimX - offset, trimY + trimHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(trimX, trimY + trimHeight + offset);
  ctx.lineTo(trimX, trimY + trimHeight + offset + markLength);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(trimX + trimWidth + offset, trimY + trimHeight);
  ctx.lineTo(trimX + trimWidth + offset + markLength, trimY + trimHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(trimX + trimWidth, trimY + trimHeight + offset);
  ctx.lineTo(trimX + trimWidth, trimY + trimHeight + offset + markLength);
  ctx.stroke();
}

/**
 * Draw registration marks on a canvas
 *
 * Registration marks are used to align multiple print plates (CMYK).
 *
 * @param canvas - Canvas to draw marks on
 * @param trimX - X position of trim area start
 * @param trimY - Y position of trim area start
 * @param trimWidth - Width of trim area
 * @param trimHeight - Height of trim area
 */
export function drawRegistrationMarks(
  canvas: HTMLCanvasElement,
  trimX: number,
  trimY: number,
  trimWidth: number,
  trimHeight: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const markSize = 12;
  const offset = 40; // Distance from trim edge

  // Draw a registration mark (circle with crosshair)
  const drawMark = (x: number, y: number) => {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;

    // Circle
    ctx.beginPath();
    ctx.arc(x, y, markSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - markSize, y);
    ctx.lineTo(x + markSize, y);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - markSize);
    ctx.lineTo(x, y + markSize);
    ctx.stroke();
  };

  // Draw marks at center of each edge
  drawMark(trimX + trimWidth / 2, trimY - offset); // Top center
  drawMark(trimX + trimWidth / 2, trimY + trimHeight + offset); // Bottom center
  drawMark(trimX - offset, trimY + trimHeight / 2); // Left center
  drawMark(trimX + trimWidth + offset, trimY + trimHeight / 2); // Right center
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Prepare an image for print export with all print-ready features
 *
 * This is a helper function that prepares a single image for print export
 * by applying CMYK conversion, adding bleed, and optionally adding marks.
 *
 * @param imageUrl - Source image URL or data URL
 * @param options - Print export options
 * @returns Promise resolving to a canvas ready for export
 */
export async function prepareImageForPrint(
  imageUrl: string,
  options: PrintExportOptions
): Promise<{ canvas: HTMLCanvasElement; gamutAnalysis: GamutAnalysisResult }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Create canvas from image
        let canvas = document.createElement('canvas');

        // Calculate target dimensions based on page size and DPI
        if (options.pageSize) {
          canvas.width = inchesToPixels(options.pageSize.width, options.resolution);
          canvas.height = inchesToPixels(options.pageSize.height, options.resolution);
        } else {
          // Use image dimensions scaled to DPI
          // Assume source is 72 DPI screen resolution
          const scaleFactor = options.resolution / 72;
          canvas.width = Math.round(img.width * scaleFactor);
          canvas.height = Math.round(img.height * scaleFactor);
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Analyze gamut before conversion
        const gamutAnalysis = analyzeGamut(canvas);

        // Apply CMYK-safe conversion if requested
        if (options.colorSpace === 'cmyk-safe') {
          canvas = convertToCmykSafe(canvas);
        }

        // Add bleed if specified
        if (options.bleed > 0) {
          canvas = addBleedArea(canvas, options.bleed, options.resolution);
        }

        // Add printer marks if requested
        if (options.includeMarks && options.bleed > 0) {
          const bleedPx = mmToPixels(options.bleed, options.resolution);
          const trimWidth = canvas.width - bleedPx * 2;
          const trimHeight = canvas.height - bleedPx * 2;

          drawCropMarks(canvas, bleedPx, bleedPx, trimWidth, trimHeight);
          drawRegistrationMarks(canvas, bleedPx, bleedPx, trimWidth, trimHeight);
        }

        resolve({ canvas, gamutAnalysis });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for print preparation'));
    };

    img.src = imageUrl;
  });
}

/**
 * Export comic pages for professional printing
 *
 * This is the main export function that processes all pages and creates
 * a print-ready output with CMYK-safe colors, bleed, and printer marks.
 *
 * NOTE: True PDF with CMYK color space requires external libraries like
 * jsPDF or pdf-lib. This function prepares the images and returns a blob
 * that can be used with those libraries.
 *
 * @param pages - Array of image URLs (data URLs or http URLs)
 * @param options - Print export options
 * @returns Promise resolving to print export result
 *
 * @example
 * const result = await exportForPrint(
 *   comicPages.map(p => p.imageUrl),
 *   {
 *     resolution: 300,
 *     colorSpace: 'cmyk-safe',
 *     bleed: 3,
 *     format: 'pdf',
 *     includeMarks: true,
 *   }
 * );
 *
 * if (result.success && result.blob) {
 *   downloadBlob(result.blob, 'comic-print-ready.pdf');
 * }
 */
export async function exportForPrint(
  pages: string[],
  options: PrintExportOptions
): Promise<PrintExportResult> {
  const warnings: string[] = [];
  const gamutAnalyses: GamutAnalysisResult[] = [];

  // Add informational warnings about limitations
  warnings.push(
    'This export uses CMYK-safe color approximation. For true CMYK conversion, ' +
    'import into Adobe InDesign or Photoshop and convert using proper ICC profiles.'
  );

  if (options.colorSpace === 'cmyk-safe') {
    warnings.push(
      'Colors have been adjusted to fit within the CMYK printable gamut. ' +
      'Some vibrant colors may appear less saturated in print.'
    );
  }

  try {
    const processedCanvases: HTMLCanvasElement[] = [];

    // Process each page
    for (const pageUrl of pages) {
      const { canvas, gamutAnalysis } = await prepareImageForPrint(pageUrl, options);
      processedCanvases.push(canvas);
      gamutAnalyses.push(gamutAnalysis);

      // Add warning if significant out-of-gamut content
      if (gamutAnalysis.needsAdjustment) {
        const pageIndex = pages.indexOf(pageUrl) + 1;
        warnings.push(
          `Page ${pageIndex}: ${gamutAnalysis.outOfGamutPercentage.toFixed(1)}% of pixels ` +
          'are outside the CMYK gamut and have been adjusted.'
        );
      }
    }

    // For now, return the first page as a PNG blob
    // Full PDF/TIFF export would require additional libraries
    if (options.format === 'tiff') {
      // TIFF export is not natively supported in browsers
      // Return PNG as fallback with a warning
      warnings.push(
        'TIFF export requires server-side processing. Exporting as PNG instead. ' +
        'For true TIFF output, use the PNG files in professional software.'
      );
    }

    // Create a simple image blob from the first processed canvas
    // In a full implementation, this would create a multi-page PDF/TIFF
    const blob = await new Promise<Blob>((resolve, reject) => {
      processedCanvases[0].toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        1.0
      );
    });

    // Add note about multi-page export
    if (pages.length > 1) {
      warnings.push(
        `Prepared ${pages.length} pages. For multi-page PDF export, ` +
        'integrate with jsPDF or pdf-lib library.'
      );
    }

    return {
      success: true,
      blob,
      gamutAnalysis: gamutAnalyses,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Print export failed: ${message}`,
      warnings,
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a printability report for a set of images
 *
 * This analyzes all images and provides a summary of potential print issues.
 *
 * @param pages - Array of image URLs
 * @returns Promise resolving to a printability report
 */
export async function generatePrintabilityReport(
  pages: string[]
): Promise<{
  overallScore: 'excellent' | 'good' | 'fair' | 'poor';
  pageAnalyses: { pageNumber: number; analysis: GamutAnalysisResult }[];
  recommendations: string[];
}> {
  const pageAnalyses: { pageNumber: number; analysis: GamutAnalysisResult }[] = [];
  const recommendations: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    const analysis = await new Promise<GamutAnalysisResult>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(analyzeGamut(canvas));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = pages[i];
    });

    pageAnalyses.push({ pageNumber: i + 1, analysis });
  }

  // Calculate average out-of-gamut percentage
  const avgOutOfGamut =
    pageAnalyses.reduce((sum, p) => sum + p.analysis.outOfGamutPercentage, 0) /
    pageAnalyses.length;

  // Determine overall score
  let overallScore: 'excellent' | 'good' | 'fair' | 'poor';
  if (avgOutOfGamut < 1) {
    overallScore = 'excellent';
  } else if (avgOutOfGamut < 5) {
    overallScore = 'good';
  } else if (avgOutOfGamut < 15) {
    overallScore = 'fair';
  } else {
    overallScore = 'poor';
  }

  // Generate recommendations
  if (overallScore === 'excellent') {
    recommendations.push('Your comic is ready for print with minimal color adjustments needed.');
  } else if (overallScore === 'good') {
    recommendations.push('Most colors will print accurately. Minor adjustments may occur.');
  } else if (overallScore === 'fair') {
    recommendations.push('Consider reviewing pages with high out-of-gamut content.');
    recommendations.push('Use the CMYK preview to see how colors will appear in print.');
  } else {
    recommendations.push('Many colors in your comic may not print as expected.');
    recommendations.push('Consider adjusting the art style to use more print-friendly colors.');
    recommendations.push('Avoid neon greens, electric blues, and highly saturated colors.');
  }

  return {
    overallScore,
    pageAnalyses,
    recommendations,
  };
}

/**
 * Get a human-readable description of a CMYK color
 */
export function describeCmykColor(cmyk: CMYKColor): string {
  const parts: string[] = [];

  if (cmyk.c > 0) parts.push(`${cmyk.c}% Cyan`);
  if (cmyk.m > 0) parts.push(`${cmyk.m}% Magenta`);
  if (cmyk.y > 0) parts.push(`${cmyk.y}% Yellow`);
  if (cmyk.k > 0) parts.push(`${cmyk.k}% Black`);

  if (parts.length === 0) return 'White (no ink)';
  return parts.join(', ');
}

/**
 * Calculate total ink coverage for a CMYK color
 *
 * Many printers have a maximum total ink coverage (typically 300-340%).
 * This helps identify colors that might cause print quality issues.
 *
 * @param cmyk - CMYK color to check
 * @returns Total ink coverage as percentage (0-400)
 */
export function getTotalInkCoverage(cmyk: CMYKColor): number {
  return cmyk.c + cmyk.m + cmyk.y + cmyk.k;
}

/**
 * Check if a CMYK color exceeds the maximum ink coverage
 *
 * @param cmyk - CMYK color to check
 * @param maxCoverage - Maximum allowed coverage (default: 300%)
 * @returns true if color exceeds maximum
 */
export function exceedsInkCoverage(cmyk: CMYKColor, maxCoverage: number = 300): boolean {
  return getTotalInkCoverage(cmyk) > maxCoverage;
}

/**
 * Reduce ink coverage by increasing black (GCR - Gray Component Replacement)
 *
 * This technique replaces equal parts of CMY with black ink to reduce
 * total ink coverage while maintaining similar appearance.
 *
 * @param cmyk - CMYK color to adjust
 * @param targetCoverage - Target maximum coverage (default: 300%)
 * @returns Adjusted CMYK color
 */
export function reduceInkCoverage(cmyk: CMYKColor, targetCoverage: number = 300): CMYKColor {
  const currentCoverage = getTotalInkCoverage(cmyk);

  if (currentCoverage <= targetCoverage) {
    return { ...cmyk };
  }

  // Find the minimum of CMY (gray component)
  const grayComponent = Math.min(cmyk.c, cmyk.m, cmyk.y);

  // Calculate how much we need to reduce
  const excess = currentCoverage - targetCoverage;

  // Replace gray component with black
  const blackIncrease = Math.min(grayComponent, excess);

  return {
    c: cmyk.c - blackIncrease,
    m: cmyk.m - blackIncrease,
    y: cmyk.y - blackIncrease,
    k: Math.min(100, cmyk.k + blackIncrease),
  };
}
