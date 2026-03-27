/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generation Progress Types
 *
 * These types support the GenerationProgress component (Batch 3.2.1) which displays
 * detailed status during comic generation. The system tracks:
 * - Overall generation stage (outline, profiles, cover, pages)
 * - Per-page generation status (beat generation, image generation)
 * - Timing information for progress estimation
 * - Batch tracking for grouped page generation
 *
 * @example
 * ```typescript
 * // Initialize progress when starting generation
 * const initialProgress: GenerationProgress = {
 *   stage: 'generating_profiles',
 *   currentPage: 0,
 *   totalPages: 9,
 *   pagesStatus: [],
 *   startTime: Date.now(),
 * };
 *
 * // Update as generation progresses
 * progress.stage = 'generating_pages';
 * progress.currentPage = 3;
 * progress.pagesStatus[2] = {
 *   pageIndex: 2,
 *   status: 'generating_image',
 *   startTime: Date.now(),
 * };
 * ```
 */

// ============================================================================
// GENERATION STAGE TYPES
// ============================================================================

/**
 * High-level stages of the comic generation process.
 * These stages occur in order (except 'error' which can happen at any point).
 *
 * - `idle`: No generation in progress
 * - `generating_outline`: Creating story outline (Outline Mode only)
 * - `generating_profiles`: Analyzing character portraits to create consistency profiles
 * - `generating_cover`: Creating the comic cover image
 * - `generating_pages`: Creating story pages (beat + image for each)
 * - `complete`: All generation finished successfully
 * - `error`: Generation failed at some stage
 */
export type GenerationStage =
  | 'idle'
  | 'generating_outline'
  | 'generating_profiles'
  | 'generating_cover'
  | 'generating_pages'
  | 'complete'
  | 'error';

/**
 * Display labels for each generation stage.
 * Used by UI components to show human-readable status.
 */
export const GENERATION_STAGE_LABELS: Record<GenerationStage, string> = {
  idle: 'Ready',
  generating_outline: 'Creating Story Outline...',
  generating_profiles: 'Analyzing Characters...',
  generating_cover: 'Generating Cover...',
  generating_pages: 'Generating Pages...',
  complete: 'Complete!',
  error: 'Error',
};

/**
 * Descriptive text for each generation stage.
 * Provides more context about what's happening.
 */
export const GENERATION_STAGE_DESCRIPTIONS: Record<GenerationStage, string> = {
  idle: 'Click generate to start creating your comic.',
  generating_outline: 'AI is crafting the story structure and plot points.',
  generating_profiles: 'Analyzing character portraits for visual consistency.',
  generating_cover: 'Creating an eye-catching cover for your comic.',
  generating_pages: 'Generating narrative and artwork for each page.',
  complete: 'Your comic is ready to read!',
  error: 'Something went wrong. Please try again.',
};

// ============================================================================
// PAGE STATUS TYPES
// ============================================================================

/**
 * Status of a single page's generation.
 * Pages go through: pending -> generating_beat -> generating_image -> complete
 *
 * - `pending`: Page hasn't started generating yet
 * - `generating_beat`: AI is creating the narrative (caption, dialogue, scene)
 * - `generating_image`: AI is creating the panel artwork
 * - `complete`: Page generation finished successfully
 * - `error`: Page generation failed
 */
export type PageGenerationState =
  | 'pending'
  | 'generating_beat'
  | 'generating_image'
  | 'complete'
  | 'error';

/**
 * Detailed status for a single page's generation.
 * Tracks timing information to enable progress estimation.
 *
 * @example
 * ```typescript
 * const pageStatus: PageGenerationStatus = {
 *   pageIndex: 3,
 *   status: 'generating_image',
 *   startTime: 1679900000000,
 *   beatEndTime: 1679900005000, // Beat took 5 seconds
 * };
 * ```
 */
export interface PageGenerationStatus {
  /** Page index (0-based). Note: Cover is index 0, story pages start at 1 */
  pageIndex: number;

  /** Current generation status for this page */
  status: PageGenerationState;

  /** Unix timestamp when page generation started (ms) */
  startTime?: number;

  /** Unix timestamp when beat generation completed (ms). Used to separate beat vs image time. */
  beatEndTime?: number;

  /** Unix timestamp when page generation completed (ms) */
  endTime?: number;

  /** Error message if status is 'error' */
  errorMessage?: string;

  /** Number of retry attempts for this page */
  retryCount?: number;
}

// ============================================================================
// MAIN PROGRESS INTERFACE
// ============================================================================

/**
 * Complete generation progress state.
 * This is the main interface used by the GenerationProgress component.
 *
 * @example
 * ```typescript
 * // In a React component
 * const [progress, setProgress] = useState<GenerationProgress>({
 *   stage: 'idle',
 *   currentPage: 0,
 *   totalPages: 0,
 *   pagesStatus: [],
 *   startTime: 0,
 * });
 *
 * // Update progress during generation
 * setProgress(prev => ({
 *   ...prev,
 *   stage: 'generating_pages',
 *   currentPage: 4,
 *   estimatedTimeRemaining: calculateETA(prev),
 * }));
 * ```
 */
export interface GenerationProgress {
  /** Current high-level generation stage */
  stage: GenerationStage;

  /** Current page being generated (1-indexed for display, 0 = cover) */
  currentPage: number;

  /** Total number of pages to generate (including cover and back cover) */
  totalPages: number;

  /** Detailed status for each page */
  pagesStatus: PageGenerationStatus[];

  /** Unix timestamp when generation started (ms) */
  startTime: number;

  /** Estimated milliseconds remaining until completion. Calculated from average page time. */
  estimatedTimeRemaining?: number;

  /** Error message if stage is 'error' */
  errorMessage?: string;

  /** Current batch information (when generating pages in batches) */
  currentBatch?: BatchProgress;

  /** Whether generation was cancelled by user */
  wasCancelled?: boolean;
}

// ============================================================================
// BATCH PROGRESS TYPES
// ============================================================================

/**
 * Progress tracking for batch generation.
 * Pages are generated in batches (typically 3 at a time in Outline Mode).
 * This helps track which batch is currently being processed.
 *
 * @example
 * ```typescript
 * // Generating pages 4, 5, 6 out of batches [1,2,3], [4,5,6], [7,8,9]
 * const batch: BatchProgress = {
 *   batchIndex: 1,      // Second batch (0-indexed)
 *   totalBatches: 3,
 *   pagesInBatch: [4, 5, 6],
 *   batchStartTime: Date.now(),
 * };
 * ```
 */
export interface BatchProgress {
  /** Current batch index (0-based) */
  batchIndex: number;

  /** Total number of batches */
  totalBatches: number;

  /** Page indices included in this batch (1-indexed page numbers) */
  pagesInBatch: number[];

  /** Unix timestamp when this batch started (ms) */
  batchStartTime?: number;
}

// ============================================================================
// TIMING & ESTIMATION TYPES
// ============================================================================

/**
 * Historical timing data for estimation calculations.
 * Stored to improve time estimates across sessions.
 */
export interface GenerationTimingHistory {
  /** Average time to generate character profiles (ms) */
  avgProfileTime: number;

  /** Average time to generate a cover (ms) */
  avgCoverTime: number;

  /** Average time to generate a beat/narrative (ms) */
  avgBeatTime: number;

  /** Average time to generate an image (ms) */
  avgImageTime: number;

  /** Number of samples used for averages */
  sampleCount: number;

  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Default timing estimates (in milliseconds).
 * Used before we have historical data.
 */
export const DEFAULT_TIMING_ESTIMATES: GenerationTimingHistory = {
  avgProfileTime: 8000,   // ~8 seconds per profile
  avgCoverTime: 25000,    // ~25 seconds for cover
  avgBeatTime: 5000,      // ~5 seconds per beat
  avgImageTime: 20000,    // ~20 seconds per image
  sampleCount: 0,
  lastUpdated: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create initial progress state for a new generation.
 *
 * @param totalPages - Total pages to generate (including cover/back cover)
 * @param isOutlineMode - Whether generating in Outline Mode (affects stages)
 * @returns Initial GenerationProgress state
 */
export function createInitialProgress(
  totalPages: number,
  isOutlineMode: boolean = true
): GenerationProgress {
  const pagesStatus: PageGenerationStatus[] = Array.from(
    { length: totalPages },
    (_, i) => ({
      pageIndex: i,
      status: 'pending' as PageGenerationState,
    })
  );

  return {
    stage: isOutlineMode ? 'generating_outline' : 'generating_profiles',
    currentPage: 0,
    totalPages,
    pagesStatus,
    startTime: Date.now(),
  };
}

/**
 * Calculate estimated time remaining based on current progress.
 *
 * @param progress - Current generation progress
 * @param timing - Historical timing data (optional)
 * @returns Estimated milliseconds remaining
 */
export function calculateEstimatedTimeRemaining(
  progress: GenerationProgress,
  timing: GenerationTimingHistory = DEFAULT_TIMING_ESTIMATES
): number {
  const { stage, currentPage, totalPages, pagesStatus } = progress;

  // Calculate remaining based on stage
  let remaining = 0;

  switch (stage) {
    case 'idle':
    case 'complete':
    case 'error':
      return 0;

    case 'generating_outline':
      // Outline + profiles + cover + all pages
      remaining += timing.avgProfileTime * 2; // Assume 2 characters
      remaining += timing.avgCoverTime;
      remaining += totalPages * (timing.avgBeatTime + timing.avgImageTime);
      break;

    case 'generating_profiles':
      // profiles + cover + all pages
      remaining += timing.avgCoverTime;
      remaining += totalPages * (timing.avgBeatTime + timing.avgImageTime);
      break;

    case 'generating_cover':
      // Cover (partial) + all pages
      remaining += timing.avgCoverTime / 2; // Assume halfway done
      remaining += totalPages * (timing.avgBeatTime + timing.avgImageTime);
      break;

    case 'generating_pages': {
      // Calculate based on completed pages
      const completedCount = pagesStatus.filter(p => p.status === 'complete').length;
      const remainingPages = totalPages - completedCount;
      remaining += remainingPages * (timing.avgBeatTime + timing.avgImageTime);

      // Adjust for current page in progress
      const currentStatus = pagesStatus[currentPage];
      if (currentStatus?.status === 'generating_beat') {
        remaining -= timing.avgBeatTime / 2;
      } else if (currentStatus?.status === 'generating_image') {
        remaining -= timing.avgBeatTime + (timing.avgImageTime / 2);
      }
      break;
    }
  }

  return Math.max(0, remaining);
}

/**
 * Get a human-readable progress summary.
 *
 * @param progress - Current generation progress
 * @returns Summary string like "Generating page 3 of 9..."
 */
export function getProgressSummary(progress: GenerationProgress): string {
  const { stage, currentPage, totalPages } = progress;

  switch (stage) {
    case 'idle':
      return 'Ready to generate';
    case 'generating_outline':
      return 'Creating story outline...';
    case 'generating_profiles':
      return 'Analyzing character portraits...';
    case 'generating_cover':
      return 'Generating cover art...';
    case 'generating_pages':
      return `Generating page ${currentPage} of ${totalPages}...`;
    case 'complete':
      return `Complete! ${totalPages} pages generated.`;
    case 'error':
      return progress.errorMessage || 'Generation failed';
    default:
      return 'Processing...';
  }
}

/**
 * Calculate overall progress percentage.
 *
 * @param progress - Current generation progress
 * @returns Progress percentage (0-100)
 */
export function calculateProgressPercentage(progress: GenerationProgress): number {
  const { stage, currentPage, totalPages, pagesStatus } = progress;

  // Stage weights (rough estimates of time distribution)
  const stageWeights = {
    generating_outline: 5,
    generating_profiles: 10,
    generating_cover: 10,
    generating_pages: 75,
  };

  let percentage = 0;

  switch (stage) {
    case 'idle':
      return 0;
    case 'complete':
      return 100;
    case 'error':
      // Return progress up to error point
      break;

    case 'generating_outline':
      percentage = stageWeights.generating_outline / 2;
      break;

    case 'generating_profiles':
      percentage = stageWeights.generating_outline + (stageWeights.generating_profiles / 2);
      break;

    case 'generating_cover':
      percentage = stageWeights.generating_outline + stageWeights.generating_profiles +
        (stageWeights.generating_cover / 2);
      break;

    case 'generating_pages': {
      const basePercentage = stageWeights.generating_outline +
        stageWeights.generating_profiles + stageWeights.generating_cover;

      // Calculate page progress
      const completedPages = pagesStatus.filter(p => p.status === 'complete').length;
      const pageProgress = totalPages > 0 ? (completedPages / totalPages) : 0;

      percentage = basePercentage + (stageWeights.generating_pages * pageProgress);
      break;
    }
  }

  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Format milliseconds into a human-readable duration string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "2m 30s" or "45s"
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}
