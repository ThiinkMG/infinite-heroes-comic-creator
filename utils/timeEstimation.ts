/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Time Estimation Utility
 *
 * Tracks generation times and provides estimated time remaining for comic generation.
 * Persists timing data in localStorage for improved estimates across sessions.
 *
 * @example
 * ```typescript
 * import { recordGenerationTime, getEstimatedTimeRemaining, formatTimeRemaining } from '@/utils/timeEstimation';
 *
 * // Record a beat generation time
 * recordGenerationTime('beat', 5200);
 *
 * // Get estimated time remaining
 * const eta = getEstimatedTimeRemaining(3, 9); // Page 3 of 9
 * console.log(formatTimeRemaining(eta)); // "~4 min"
 * ```
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** LocalStorage key for timing history */
const STORAGE_KEY = 'infinite-heroes-timing-history';

/** Maximum number of samples to keep per type */
const MAX_SAMPLES = 50;

/**
 * Default time estimates (in milliseconds).
 * Used when no historical data is available.
 */
export const DEFAULT_ESTIMATES: Record<string, number> = {
  beat: 30000,      // ~30 seconds for narrative generation
  image: 45000,     // ~45 seconds for image generation
  cover: 60000,     // ~60 seconds for cover (more complex)
  profile: 8000,    // ~8 seconds for character profile analysis
  outline: 15000,   // ~15 seconds for story outline
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Stored timing data for a single page type.
 */
interface TimingSamples {
  /** Array of recorded durations (most recent first) */
  samples: number[];
  /** Computed average (for quick access) */
  average: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Complete timing history stored in localStorage.
 */
interface StoredTimingHistory {
  /** Timing data keyed by page type (beat, image, cover, etc.) */
  timings: Record<string, TimingSamples>;
  /** Schema version for future migrations */
  version: number;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Load timing history from localStorage.
 * Returns default structure if not found or invalid.
 */
function loadTimingHistory(): StoredTimingHistory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createEmptyHistory();
    }

    const parsed = JSON.parse(stored) as StoredTimingHistory;

    // Validate structure
    if (!parsed.timings || typeof parsed.version !== 'number') {
      return createEmptyHistory();
    }

    return parsed;
  } catch {
    return createEmptyHistory();
  }
}

/**
 * Save timing history to localStorage.
 */
function saveTimingHistory(history: StoredTimingHistory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage might be full or unavailable - silently fail
    console.warn('[timeEstimation] Failed to save timing history');
  }
}

/**
 * Create empty timing history structure.
 */
function createEmptyHistory(): StoredTimingHistory {
  return {
    timings: {},
    version: 1,
  };
}

/**
 * Calculate average from samples array.
 * Uses a weighted average giving more weight to recent samples.
 */
function calculateWeightedAverage(samples: number[]): number {
  if (samples.length === 0) return 0;
  if (samples.length === 1) return samples[0];

  // Weight recent samples more heavily (linear decay)
  let weightedSum = 0;
  let totalWeight = 0;

  samples.forEach((sample, index) => {
    // Most recent (index 0) gets highest weight
    const weight = samples.length - index;
    weightedSum += sample * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Record a generation time for a specific page type.
 * This data is persisted to localStorage and used for future estimates.
 *
 * @param pageType - Type of generation ('beat', 'image', 'cover', 'profile', 'outline')
 * @param durationMs - Duration of the generation in milliseconds
 *
 * @example
 * ```typescript
 * // After generating a beat
 * const startTime = Date.now();
 * await generateBeat(...);
 * recordGenerationTime('beat', Date.now() - startTime);
 * ```
 */
export function recordGenerationTime(pageType: string, durationMs: number): void {
  // Validate input
  if (!pageType || typeof durationMs !== 'number' || durationMs <= 0) {
    return;
  }

  const history = loadTimingHistory();

  // Get or create timing data for this type
  if (!history.timings[pageType]) {
    history.timings[pageType] = {
      samples: [],
      average: 0,
      lastUpdated: Date.now(),
    };
  }

  const timing = history.timings[pageType];

  // Add new sample at the beginning (most recent first)
  timing.samples.unshift(Math.round(durationMs));

  // Trim to max samples
  if (timing.samples.length > MAX_SAMPLES) {
    timing.samples = timing.samples.slice(0, MAX_SAMPLES);
  }

  // Recalculate average
  timing.average = calculateWeightedAverage(timing.samples);
  timing.lastUpdated = Date.now();

  // Save back to localStorage
  saveTimingHistory(history);
}

/**
 * Get the average generation time for a specific page type.
 * Returns the default estimate if no historical data is available.
 *
 * @param pageType - Type of generation ('beat', 'image', 'cover', 'profile', 'outline')
 * @returns Average duration in milliseconds
 *
 * @example
 * ```typescript
 * const avgBeatTime = getAverageTime('beat'); // e.g., 28500
 * const avgImageTime = getAverageTime('image'); // e.g., 42000
 * ```
 */
export function getAverageTime(pageType: string): number {
  const history = loadTimingHistory();
  const timing = history.timings[pageType];

  if (timing && timing.samples.length > 0) {
    return timing.average;
  }

  // Return default estimate
  return DEFAULT_ESTIMATES[pageType] ?? DEFAULT_ESTIMATES.image;
}

/**
 * Get estimated time remaining for generation.
 * Calculates based on historical averages and remaining pages.
 *
 * @param currentPage - Current page being generated (1-indexed, 0 = cover)
 * @param totalPages - Total number of pages to generate
 * @param currentPhase - Current phase of generation ('beat' | 'image' | 'cover')
 * @returns Estimated milliseconds remaining
 *
 * @example
 * ```typescript
 * // On page 3 of 9, currently generating the image
 * const eta = getEstimatedTimeRemaining(3, 9, 'image');
 * console.log(formatTimeRemaining(eta)); // "~4 min"
 * ```
 */
export function getEstimatedTimeRemaining(
  currentPage: number,
  totalPages: number,
  currentPhase: 'beat' | 'image' | 'cover' = 'beat'
): number {
  const avgBeatTime = getAverageTime('beat');
  const avgImageTime = getAverageTime('image');
  const avgCoverTime = getAverageTime('cover');

  let remaining = 0;

  // Handle cover generation
  if (currentPage === 0) {
    if (currentPhase === 'cover') {
      // Assume halfway through cover
      remaining += avgCoverTime / 2;
    } else {
      remaining += avgCoverTime;
    }
    // Add all story pages (beat + image each)
    remaining += totalPages * (avgBeatTime + avgImageTime);
    return remaining;
  }

  // Calculate completed pages (not including current)
  const completedPages = currentPage - 1;
  const remainingPages = totalPages - completedPages;

  // Add time for current page based on phase
  if (currentPhase === 'beat') {
    // Still generating beat, full page time remaining for current
    remaining += avgBeatTime / 2; // Assume halfway through beat
    remaining += avgImageTime;
  } else if (currentPhase === 'image') {
    // Beat done, generating image
    remaining += avgImageTime / 2; // Assume halfway through image
  }

  // Add time for all remaining pages after current
  const pagesAfterCurrent = remainingPages - 1;
  if (pagesAfterCurrent > 0) {
    remaining += pagesAfterCurrent * (avgBeatTime + avgImageTime);
  }

  return Math.max(0, Math.round(remaining));
}

/**
 * Format milliseconds into a human-readable time remaining string.
 * Uses approximate format for better UX (e.g., "~2 min" instead of "2m 15s").
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "~2 min", "< 1 min", or "~30 sec"
 *
 * @example
 * ```typescript
 * formatTimeRemaining(150000); // "~3 min"
 * formatTimeRemaining(45000);  // "< 1 min"
 * formatTimeRemaining(25000);  // "~30 sec"
 * ```
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) {
    return 'Almost done';
  }

  const seconds = Math.round(ms / 1000);
  const minutes = Math.round(ms / 60000);

  // Less than 30 seconds
  if (seconds < 30) {
    return '< 30 sec';
  }

  // Less than 1 minute
  if (seconds < 60) {
    return '< 1 min';
  }

  // Less than 2 minutes - show as "~1 min"
  if (seconds < 120) {
    return '~1 min';
  }

  // 2+ minutes - round to nearest minute
  return `~${minutes} min`;
}

/**
 * Clear all stored timing history.
 * Useful for testing or when users want to reset estimates.
 */
export function clearTimingHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('[timeEstimation] Failed to clear timing history');
  }
}

/**
 * Get statistics about stored timing data.
 * Useful for debugging or displaying to users.
 *
 * @returns Object with statistics for each page type
 */
export function getTimingStats(): Record<string, {
  average: number;
  sampleCount: number;
  min: number;
  max: number;
}> {
  const history = loadTimingHistory();
  const stats: Record<string, {
    average: number;
    sampleCount: number;
    min: number;
    max: number;
  }> = {};

  for (const [pageType, timing] of Object.entries(history.timings)) {
    stats[pageType] = {
      average: timing.average,
      sampleCount: timing.samples.length,
      min: timing.samples.length > 0 ? Math.min(...timing.samples) : 0,
      max: timing.samples.length > 0 ? Math.max(...timing.samples) : 0,
    };
  }

  return stats;
}

/**
 * Check if we have enough historical data for accurate estimates.
 * Considers estimates "reliable" if we have at least 3 samples for beat and image.
 *
 * @returns true if estimates are based on historical data
 */
export function hasReliableEstimates(): boolean {
  const history = loadTimingHistory();
  const beatSamples = history.timings.beat?.samples.length ?? 0;
  const imageSamples = history.timings.image?.samples.length ?? 0;

  return beatSamples >= 3 && imageSamples >= 3;
}
