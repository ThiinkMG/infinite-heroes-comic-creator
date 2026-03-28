/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import type { RerollOptions } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Entry in the reroll history for a specific page
 */
export interface RerollHistoryEntry {
  /** Unique identifier for this entry */
  id: string;
  /** Timestamp when this reroll was performed */
  timestamp: number;
  /** Page index this reroll was applied to */
  pageIndex: number;
  /** Resulting image URL/base64 after reroll */
  imageUrl: string;
  /** User instruction used for this reroll */
  instruction: string;
  /** Full reroll options used */
  options: RerollOptions;
  /** Optional thumbnail (smaller version for UI) */
  thumbnail?: string;
}

/**
 * History store state
 */
export interface RerollHistoryState {
  /**
   * Map of page index to array of history entries
   * Each page stores up to MAX_ENTRIES_PER_PAGE entries
   */
  historyByPage: Record<number, RerollHistoryEntry[]>;
}

/**
 * History store actions
 */
export interface RerollHistoryActions {
  /**
   * Add a new history entry for a page
   * Automatically trims to keep only last MAX_ENTRIES_PER_PAGE entries
   */
  addEntry: (entry: Omit<RerollHistoryEntry, 'id' | 'timestamp'>) => void;

  /**
   * Revert to a previous attempt by returning the entry's image URL
   * Does NOT modify the history - the caller should handle updating the comic face
   */
  getEntryById: (pageIndex: number, entryId: string) => RerollHistoryEntry | undefined;

  /**
   * Get all history entries for a specific page (most recent first)
   */
  getPageHistory: (pageIndex: number) => RerollHistoryEntry[];

  /**
   * Clear all history for a specific page
   */
  clearPageHistory: (pageIndex: number) => void;

  /**
   * Clear all history (all pages)
   */
  clearAllHistory: () => void;

  /**
   * Get the most recent entry for a page
   */
  getLatestEntry: (pageIndex: number) => RerollHistoryEntry | undefined;

  /**
   * Get entry count for a page
   */
  getEntryCount: (pageIndex: number) => number;
}

export type RerollHistoryStore = RerollHistoryState & RerollHistoryActions;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of history entries to keep per page */
const MAX_ENTRIES_PER_PAGE = 10;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique ID for history entries
 */
function generateId(): string {
  return `reroll-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// STORE
// ============================================================================

export const useRerollHistoryStore = create<RerollHistoryStore>()((set, get) => ({
  // === Initial State ===
  historyByPage: {},

  // === Actions ===
  addEntry: (entry) => {
    const newEntry: RerollHistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };

    set((state) => {
      const pageHistory = state.historyByPage[entry.pageIndex] ?? [];

      // Add new entry at the beginning (most recent first)
      const updatedHistory = [newEntry, ...pageHistory];

      // Trim to keep only last MAX_ENTRIES_PER_PAGE entries
      const trimmedHistory = updatedHistory.slice(0, MAX_ENTRIES_PER_PAGE);

      return {
        historyByPage: {
          ...state.historyByPage,
          [entry.pageIndex]: trimmedHistory,
        },
      };
    });
  },

  getEntryById: (pageIndex, entryId) => {
    const state = get();
    const pageHistory = state.historyByPage[pageIndex] ?? [];
    return pageHistory.find((entry) => entry.id === entryId);
  },

  getPageHistory: (pageIndex) => {
    const state = get();
    return state.historyByPage[pageIndex] ?? [];
  },

  clearPageHistory: (pageIndex) => {
    set((state) => {
      const { [pageIndex]: _, ...rest } = state.historyByPage;
      return { historyByPage: rest };
    });
  },

  clearAllHistory: () => {
    set({ historyByPage: {} });
  },

  getLatestEntry: (pageIndex) => {
    const state = get();
    const pageHistory = state.historyByPage[pageIndex] ?? [];
    return pageHistory[0];
  },

  getEntryCount: (pageIndex) => {
    const state = get();
    return (state.historyByPage[pageIndex] ?? []).length;
  },
}));

// ============================================================================
// SELECTOR HOOKS (for optimized re-renders)
// ============================================================================

/** Stable empty array to avoid creating new references */
const EMPTY_HISTORY: RerollHistoryEntry[] = [];

/** Select history entries for a specific page */
export const usePageHistory = (pageIndex: number) =>
  useRerollHistoryStore((state) => state.historyByPage[pageIndex] ?? EMPTY_HISTORY);

/** Select whether a page has any history */
export const useHasPageHistory = (pageIndex: number) =>
  useRerollHistoryStore((state) => (state.historyByPage[pageIndex]?.length ?? 0) > 0);

/** Select entry count for a page */
export const usePageHistoryCount = (pageIndex: number) =>
  useRerollHistoryStore((state) => state.historyByPage[pageIndex]?.length ?? 0);

/** Select the latest entry for a page */
export const useLatestEntry = (pageIndex: number) =>
  useRerollHistoryStore((state) => state.historyByPage[pageIndex]?.[0]);
