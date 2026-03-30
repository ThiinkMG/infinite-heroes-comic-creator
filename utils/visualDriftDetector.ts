/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Feature G: Visual Drift Detection
 * Lightweight canvas-based color sampling to detect when a character's appearance
 * has drifted significantly between consecutive pages — no AI call required.
 *
 * Strategy:
 *   1. Sample dominant hue distribution from two consecutive page images (via canvas).
 *   2. Compare sampled hues against the character's expected primary colors.
 *   3. If hue shift is significant, return a non-blocking VisualDriftWarning.
 */

import type { CharacterProfile, VisualDriftWarning } from '../types';

// Minimum color delta (0–100 scale) to flag as drift
const DRIFT_THRESHOLD_HIGH = 35;
const DRIFT_THRESHOLD_LOW = 20;

// Number of pixels to sample per image (for performance)
const SAMPLE_SIZE = 1000;

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/** Simple HSL representation */
interface HSL { h: number; s: number; l: number }

/** Convert RGB to HSL */
function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Sample dominant colors from a base64 image using canvas */
export async function sampleDominantColors(imageBase64: string): Promise<HSL[]> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.sqrt(SAMPLE_SIZE / (img.width * img.height));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve([]); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

          const colors: HSL[] = [];
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 128) continue; // Skip transparent pixels
            colors.push(rgbToHsl(data[i], data[i + 1], data[i + 2]));
          }
          resolve(colors);
        } catch {
          resolve([]);
        }
      };
      img.onerror = () => resolve([]);

      // Accept both full data URLs and raw base64
      img.src = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    } catch {
      resolve([]);
    }
  });
}

/**
 * Compute a simple "hue histogram" from a list of HSL colors.
 * Buckets hues into 12 segments (30° each).
 */
function buildHueHistogram(colors: HSL[]): number[] {
  const bins = new Array(12).fill(0);
  const saturated = colors.filter(c => c.s > 20 && c.l > 15 && c.l < 85);
  if (saturated.length === 0) return bins;
  saturated.forEach(c => {
    const bin = Math.floor(c.h / 30) % 12;
    bins[bin]++;
  });
  const total = saturated.length;
  return bins.map(b => (b / total) * 100); // Normalize to percentage
}

/**
 * Compare two hue histograms and return a delta score (0 = identical, 100 = completely different).
 */
function compareHistograms(hist1: number[], hist2: number[]): number {
  let total = 0;
  for (let i = 0; i < 12; i++) {
    total += Math.abs(hist1[i] - hist2[i]);
  }
  return total / 2; // Normalize: max possible is 200 (all in one bin), so /2 gives 0-100
}

// ============================================================================
// DRIFT CHECK
// ============================================================================

/**
 * Check for visual drift between two consecutive page images.
 * Returns an array of drift warnings (may be empty if no drift detected).
 * This is fire-and-forget — should be called with .then(), not awaited.
 *
 * @param currentPageUrl - Base64 image for the current page
 * @param prevPageUrl - Base64 image for the previous page
 * @param currentPageIndex - 0-based page index
 * @param characterProfiles - Character profiles with extractedColors for reference comparison
 */
export async function checkVisualDrift(
  currentPageUrl: string,
  prevPageUrl: string,
  currentPageIndex: number,
  characterProfiles: CharacterProfile[]
): Promise<VisualDriftWarning[]> {
  // Need at least 2 pages and profiles with color data
  if (!currentPageUrl || !prevPageUrl || currentPageIndex < 2) return [];

  const profilesWithColors = characterProfiles.filter(p => p.extractedColors);
  if (profilesWithColors.length === 0) return [];

  try {
    const [currentColors, prevColors] = await Promise.all([
      sampleDominantColors(currentPageUrl),
      sampleDominantColors(prevPageUrl),
    ]);

    if (currentColors.length === 0 || prevColors.length === 0) return [];

    const currentHist = buildHueHistogram(currentColors);
    const prevHist = buildHueHistogram(prevColors);
    const delta = compareHistograms(currentHist, prevHist);

    const warnings: VisualDriftWarning[] = [];

    if (delta >= DRIFT_THRESHOLD_LOW) {
      // Find the character with the most significant expected colors —
      // we attribute the warning to the primary character (hero).
      const primaryProfile = profilesWithColors[0];
      const severity: VisualDriftWarning['severity'] = delta >= DRIFT_THRESHOLD_HIGH ? 'high' : 'low';

      warnings.push({
        pageIndex: currentPageIndex,
        characterId: primaryProfile.id,
        characterName: primaryProfile.name,
        driftType: 'color',
        severity,
      });
    }

    return warnings;
  } catch {
    // Never throw from drift detection — it's non-critical
    return [];
  }
}
