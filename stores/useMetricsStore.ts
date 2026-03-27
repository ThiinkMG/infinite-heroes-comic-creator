/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Metrics store for tracking API usage and cost estimates.
 * Stores session metrics in memory only (not persisted).
 */

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

/** Types of generation operations */
export type GenerationType = 'image' | 'beat' | 'profile' | 'outline';

/** API provider types */
export type ApiProvider = 'gemini' | 'claude';

/** Token usage for a single request */
export interface TokenUsage {
  input: number;
  output: number;
}

/** Single generation record */
export interface GenerationRecord {
  id: string;
  type: GenerationType;
  success: boolean;
  durationMs: number;
  timestamp: number;
  tokens?: TokenUsage;
  provider: ApiProvider;
}

/** Aggregated API call counts */
export interface ApiCallCounts {
  gemini: number;
  claude: number;
}

/** Aggregated token usage */
export interface TotalTokens {
  input: number;
  output: number;
}

/** Session metrics state */
export interface MetricsState {
  // Session tracking
  sessionStartTime: number;

  // Generation counts
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;

  // API usage
  totalApiCalls: ApiCallCounts;
  totalTokensUsed: TotalTokens;

  // Timing
  averageGenerationTime: number;
  totalGenerationTime: number;

  // Detailed records (last N for debugging)
  recentRecords: GenerationRecord[];

  // Generation type breakdown
  generationsByType: Record<GenerationType, { total: number; success: number; failed: number }>;

  // User-configurable thresholds
  costWarningThreshold: number;
  errorRateWarningThreshold: number;

  // Warning state
  hasDismissedCostWarning: boolean;
  hasDismissedErrorWarning: boolean;
}

/** Metrics store actions */
export interface MetricsActions {
  /** Record a generation attempt */
  recordGeneration: (
    type: GenerationType,
    success: boolean,
    durationMs: number,
    provider: ApiProvider,
    tokens?: TokenUsage
  ) => void;

  /** Reset all session metrics */
  resetSessionMetrics: () => void;

  /** Get current success rate (0-100) */
  getSuccessRate: () => number;

  /** Get estimated cost in USD */
  getEstimatedCost: () => number;

  /** Get session duration in milliseconds */
  getSessionDuration: () => number;

  /** Set cost warning threshold */
  setCostWarningThreshold: (threshold: number) => void;

  /** Set error rate warning threshold (0-100) */
  setErrorRateWarningThreshold: (threshold: number) => void;

  /** Dismiss cost warning for this session */
  dismissCostWarning: () => void;

  /** Dismiss error warning for this session */
  dismissErrorWarning: () => void;

  /** Check if cost warning should show */
  shouldShowCostWarning: () => boolean;

  /** Check if error rate warning should show */
  shouldShowErrorWarning: () => boolean;
}

export type MetricsStore = MetricsState & MetricsActions;

// ============================================================================
// PRICING CONSTANTS (approximate)
// ============================================================================

/**
 * Estimated API costs (USD)
 * Based on public pricing as of 2025:
 * - Gemini image generation: ~$0.00025 per image
 * - Gemini text (2.5 Pro): ~$0.00125 per 1K input tokens, ~$0.005 per 1K output tokens
 * - Claude Sonnet: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
 */
export const PRICING = {
  gemini: {
    imagePerCall: 0.00025,
    textInputPer1K: 0.00125,
    textOutputPer1K: 0.005,
  },
  claude: {
    textInputPer1K: 0.003,
    textOutputPer1K: 0.015,
  },
} as const;

/** Estimated costs for pre-generation estimation */
export const ESTIMATED_COSTS = {
  /** Single image generation */
  image: 0.00025,
  /** Single beat/narrative generation (assuming ~500 input, ~200 output tokens) */
  beat: 0.0045,
  /** Profile generation (assuming ~300 input, ~150 output tokens) */
  profile: 0.002,
  /** Outline generation (assuming ~800 input, ~500 output tokens) */
  outline: 0.01,
} as const;

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (): MetricsState => ({
  sessionStartTime: Date.now(),
  totalGenerations: 0,
  successfulGenerations: 0,
  failedGenerations: 0,
  totalApiCalls: { gemini: 0, claude: 0 },
  totalTokensUsed: { input: 0, output: 0 },
  averageGenerationTime: 0,
  totalGenerationTime: 0,
  recentRecords: [],
  generationsByType: {
    image: { total: 0, success: 0, failed: 0 },
    beat: { total: 0, success: 0, failed: 0 },
    profile: { total: 0, success: 0, failed: 0 },
    outline: { total: 0, success: 0, failed: 0 },
  },
  costWarningThreshold: 1.0, // $1.00 default
  errorRateWarningThreshold: 20, // 20% default
  hasDismissedCostWarning: false,
  hasDismissedErrorWarning: false,
});

// Max records to keep for debugging
const MAX_RECENT_RECORDS = 50;

// ============================================================================
// STORE
// ============================================================================

export const useMetricsStore = create<MetricsStore>((set, get) => ({
  ...createInitialState(),

  recordGeneration: (type, success, durationMs, provider, tokens) => {
    const record: GenerationRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      success,
      durationMs,
      timestamp: Date.now(),
      tokens,
      provider,
    };

    set((state) => {
      const newTotalGenerations = state.totalGenerations + 1;
      const newSuccessful = success ? state.successfulGenerations + 1 : state.successfulGenerations;
      const newFailed = success ? state.failedGenerations : state.failedGenerations + 1;
      const newTotalTime = state.totalGenerationTime + durationMs;

      // Update type-specific stats
      const typeStats = { ...state.generationsByType[type] };
      typeStats.total += 1;
      if (success) {
        typeStats.success += 1;
      } else {
        typeStats.failed += 1;
      }

      // Update API call counts
      const newApiCalls = { ...state.totalApiCalls };
      newApiCalls[provider] += 1;

      // Update token counts
      const newTokens = { ...state.totalTokensUsed };
      if (tokens) {
        newTokens.input += tokens.input;
        newTokens.output += tokens.output;
      }

      // Keep only recent records
      const newRecords = [...state.recentRecords, record].slice(-MAX_RECENT_RECORDS);

      return {
        totalGenerations: newTotalGenerations,
        successfulGenerations: newSuccessful,
        failedGenerations: newFailed,
        totalGenerationTime: newTotalTime,
        averageGenerationTime: newTotalTime / newTotalGenerations,
        totalApiCalls: newApiCalls,
        totalTokensUsed: newTokens,
        recentRecords: newRecords,
        generationsByType: {
          ...state.generationsByType,
          [type]: typeStats,
        },
      };
    });
  },

  resetSessionMetrics: () => {
    set(createInitialState());
  },

  getSuccessRate: () => {
    const state = get();
    if (state.totalGenerations === 0) return 100;
    return Math.round((state.successfulGenerations / state.totalGenerations) * 100);
  },

  getEstimatedCost: () => {
    const state = get();
    let cost = 0;

    // Image generation costs (Gemini only)
    cost += state.generationsByType.image.total * PRICING.gemini.imagePerCall;

    // Token-based costs
    const geminiCalls = state.totalApiCalls.gemini - state.generationsByType.image.total;
    const claudeCalls = state.totalApiCalls.claude;

    // Estimate text generation costs based on tokens if available
    if (state.totalTokensUsed.input > 0 || state.totalTokensUsed.output > 0) {
      // Approximate split between Gemini and Claude based on call counts
      const totalTextCalls = geminiCalls + claudeCalls;
      if (totalTextCalls > 0) {
        const geminiRatio = geminiCalls / totalTextCalls;
        const claudeRatio = claudeCalls / totalTextCalls;

        const geminiInputTokens = state.totalTokensUsed.input * geminiRatio;
        const geminiOutputTokens = state.totalTokensUsed.output * geminiRatio;
        const claudeInputTokens = state.totalTokensUsed.input * claudeRatio;
        const claudeOutputTokens = state.totalTokensUsed.output * claudeRatio;

        cost += (geminiInputTokens / 1000) * PRICING.gemini.textInputPer1K;
        cost += (geminiOutputTokens / 1000) * PRICING.gemini.textOutputPer1K;
        cost += (claudeInputTokens / 1000) * PRICING.claude.textInputPer1K;
        cost += (claudeOutputTokens / 1000) * PRICING.claude.textOutputPer1K;
      }
    } else {
      // Fall back to estimated per-call costs
      const beatCalls = state.generationsByType.beat.total;
      const profileCalls = state.generationsByType.profile.total;
      const outlineCalls = state.generationsByType.outline.total;

      cost += beatCalls * ESTIMATED_COSTS.beat;
      cost += profileCalls * ESTIMATED_COSTS.profile;
      cost += outlineCalls * ESTIMATED_COSTS.outline;
    }

    return cost;
  },

  getSessionDuration: () => {
    return Date.now() - get().sessionStartTime;
  },

  setCostWarningThreshold: (threshold) => {
    set({ costWarningThreshold: threshold, hasDismissedCostWarning: false });
  },

  setErrorRateWarningThreshold: (threshold) => {
    set({ errorRateWarningThreshold: threshold, hasDismissedErrorWarning: false });
  },

  dismissCostWarning: () => {
    set({ hasDismissedCostWarning: true });
  },

  dismissErrorWarning: () => {
    set({ hasDismissedErrorWarning: true });
  },

  shouldShowCostWarning: () => {
    const state = get();
    if (state.hasDismissedCostWarning) return false;
    return state.getEstimatedCost() >= state.costWarningThreshold;
  },

  shouldShowErrorWarning: () => {
    const state = get();
    if (state.hasDismissedErrorWarning) return false;
    if (state.totalGenerations < 5) return false; // Need minimum samples
    const errorRate = 100 - state.getSuccessRate();
    return errorRate >= state.errorRateWarningThreshold;
  },
}));

// ============================================================================
// SELECTORS (for optimized re-renders)
// ============================================================================

export const selectTotalGenerations = (state: MetricsStore) => state.totalGenerations;
export const selectSuccessfulGenerations = (state: MetricsStore) => state.successfulGenerations;
export const selectFailedGenerations = (state: MetricsStore) => state.failedGenerations;
export const selectAverageGenerationTime = (state: MetricsStore) => state.averageGenerationTime;
export const selectTotalApiCalls = (state: MetricsStore) => state.totalApiCalls;
export const selectGenerationsByType = (state: MetricsStore) => state.generationsByType;

// ============================================================================
// COST ESTIMATION HELPERS
// ============================================================================

/**
 * Estimate the cost of generating a comic before starting.
 * @param pageCount Number of story pages
 * @param characterCount Number of characters (affects profile generation)
 * @param isOutlineMode Whether using outline mode (adds outline generation)
 * @returns Estimated cost in USD
 */
export function estimateGenerationCost(
  pageCount: number,
  characterCount: number,
  isOutlineMode: boolean
): number {
  let cost = 0;

  // Cover + back cover
  cost += 2 * ESTIMATED_COSTS.image;

  // Story pages (each page = 1 image + 1 beat)
  cost += pageCount * ESTIMATED_COSTS.image;
  cost += pageCount * ESTIMATED_COSTS.beat;

  // Profile generation per character
  cost += characterCount * ESTIMATED_COSTS.profile;

  // Outline generation (if outline mode)
  if (isOutlineMode) {
    cost += ESTIMATED_COSTS.outline;
  }

  return cost;
}

/**
 * Format a cost value as a currency string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `< $0.01`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
