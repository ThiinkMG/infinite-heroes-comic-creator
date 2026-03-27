/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * History Hook for Undo/Redo Functionality
 *
 * Provides state snapshot capability with undo/redo operations.
 * Uses Zustand for state management with the existing history types.
 *
 * Key features:
 * - Maximum 20 history entries (configurable)
 * - Debounced snapshots to prevent rapid-fire entries
 * - Clear history on new comic generation
 * - Separate from main app state to avoid circular dependencies
 */

import { create } from 'zustand';
import type {
  HistoryState,
  HistoryEntry,
  HistorySnapshot,
  HistoryAvailability,
  HistoryConfig,
} from '../types/historyTypes';
import {
  DEFAULT_HISTORY_CONFIG,
  INITIAL_HISTORY_STATE,
} from '../types/historyTypes';
import { useComicStore } from '../stores/useComicStore';
import type { ComicFace, StoryOutline, NovelModeState } from '../types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID for history entries
 */
function generateHistoryId(): string {
  return `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Deep clone a snapshot to prevent reference issues
 * Note: This is a simple implementation; for large images, consider
 * using a more efficient cloning strategy
 */
function cloneSnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return JSON.parse(JSON.stringify(snapshot));
}

// ============================================================================
// HISTORY STORE
// ============================================================================

interface HistoryStoreState extends HistoryState {
  /** Configuration for the history system */
  config: Required<HistoryConfig>;

  /** Timestamp of last push (for debouncing) */
  lastPushTime: number;

  // === Actions ===

  /**
   * Push a new snapshot to history
   * @param action - Human-readable description of the action
   * @param snapshot - The state snapshot to save
   * @returns true if snapshot was pushed, false if debounced
   */
  pushSnapshot: (action: string, snapshot: HistorySnapshot) => boolean;

  /**
   * Undo to the previous state
   * @returns The snapshot to restore, or null if cannot undo
   */
  undo: () => HistorySnapshot | null;

  /**
   * Redo to the next state
   * @returns The snapshot to restore, or null if cannot redo
   */
  redo: () => HistorySnapshot | null;

  /**
   * Clear all history entries
   * Called when starting a new comic generation
   */
  clearHistory: () => void;

  /**
   * Get the current undo/redo availability status
   */
  getAvailability: () => HistoryAvailability;

  /**
   * Update configuration
   */
  setConfig: (config: Partial<HistoryConfig>) => void;

  /**
   * Get the current snapshot entry (if any)
   */
  getCurrentEntry: () => HistoryEntry | null;
}

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  // Initial state
  ...INITIAL_HISTORY_STATE,
  config: DEFAULT_HISTORY_CONFIG,
  lastPushTime: 0,

  // === Actions ===

  pushSnapshot: (action: string, snapshot: HistorySnapshot): boolean => {
    const state = get();
    const now = Date.now();

    // Debounce rapid pushes
    if (now - state.lastPushTime < state.config.debounceMs) {
      return false;
    }

    // Create the new entry
    const entry: HistoryEntry = {
      id: generateHistoryId(),
      timestamp: now,
      action,
      state: cloneSnapshot(snapshot),
    };

    set((state) => {
      // If we're not at the end of history, truncate forward history
      const truncatedEntries =
        state.currentIndex < state.entries.length - 1
          ? state.entries.slice(0, state.currentIndex + 1)
          : [...state.entries];

      // Add the new entry
      truncatedEntries.push(entry);

      // Enforce max entries limit (remove oldest)
      while (truncatedEntries.length > state.config.maxEntries) {
        truncatedEntries.shift();
      }

      return {
        entries: truncatedEntries,
        currentIndex: truncatedEntries.length - 1,
        lastPushTime: now,
      };
    });

    return true;
  },

  undo: (): HistorySnapshot | null => {
    const state = get();

    // Cannot undo if at the beginning or no entries
    if (state.currentIndex <= 0 || state.entries.length === 0) {
      return null;
    }

    const newIndex = state.currentIndex - 1;
    const entry = state.entries[newIndex];

    if (!entry) {
      return null;
    }

    set({ currentIndex: newIndex });

    return cloneSnapshot(entry.state);
  },

  redo: (): HistorySnapshot | null => {
    const state = get();

    // Cannot redo if at the end or no entries
    if (
      state.currentIndex >= state.entries.length - 1 ||
      state.entries.length === 0
    ) {
      return null;
    }

    const newIndex = state.currentIndex + 1;
    const entry = state.entries[newIndex];

    if (!entry) {
      return null;
    }

    set({ currentIndex: newIndex });

    return cloneSnapshot(entry.state);
  },

  clearHistory: () => {
    set({
      entries: [],
      currentIndex: -1,
      lastPushTime: 0,
    });
  },

  getAvailability: (): HistoryAvailability => {
    const state = get();

    const canUndo = state.currentIndex > 0 && state.entries.length > 0;
    const canRedo =
      state.currentIndex < state.entries.length - 1 &&
      state.entries.length > 0;

    const undoEntry = canUndo ? state.entries[state.currentIndex] : null;
    const redoEntry = canRedo ? state.entries[state.currentIndex + 1] : null;

    return {
      canUndo,
      canRedo,
      undoDescription: undoEntry?.action,
      redoDescription: redoEntry?.action,
    };
  },

  setConfig: (config: Partial<HistoryConfig>) => {
    set((state) => ({
      config: { ...state.config, ...config },
      maxEntries: config.maxEntries ?? state.maxEntries,
    }));
  },

  getCurrentEntry: (): HistoryEntry | null => {
    const state = get();
    if (state.currentIndex < 0 || state.currentIndex >= state.entries.length) {
      return null;
    }
    return state.entries[state.currentIndex];
  },
}));

// ============================================================================
// CONVENIENCE HOOK
// ============================================================================

/**
 * Interface for the useHistory hook return value
 */
export interface UseHistoryReturn {
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Description of the action that would be undone */
  undoDescription?: string;
  /** Description of the action that would be redone */
  redoDescription?: string;
  /** Total number of history entries */
  historyLength: number;
  /** Current position in history */
  currentIndex: number;

  /**
   * Push the current app state as a snapshot
   * @param action - Description of what action was performed
   */
  pushSnapshot: (action: string) => void;

  /**
   * Push a custom snapshot (for when you need specific state)
   * @param action - Description of what action was performed
   * @param snapshot - Custom snapshot to save
   */
  pushCustomSnapshot: (action: string, snapshot: HistorySnapshot) => void;

  /**
   * Undo to the previous state
   * @returns true if undo was successful
   */
  undo: () => boolean;

  /**
   * Redo to the next state
   * @returns true if redo was successful
   */
  redo: () => boolean;

  /**
   * Clear all history (call when starting new comic)
   */
  clearHistory: () => void;
}

/**
 * Create a snapshot from the current comic store state
 */
function createSnapshotFromStore(): HistorySnapshot {
  const comicState = useComicStore.getState();

  const snapshot: HistorySnapshot = {
    comicPages: comicState.comicFaces,
    currentPageIndex: comicState.currentPageIndex,
  };

  // Include story outline if available
  if (comicState.storyOutline.text) {
    snapshot.storyOutline = {
      content: comicState.storyOutline.text,
      isReady: comicState.storyOutline.isReady,
      isGenerating: comicState.storyOutline.isGenerating,
      pageBreakdown: comicState.storyOutline.pageBreakdown,
      lastEditedAt: comicState.storyOutline.lastEditedAt,
      version: comicState.storyOutline.version,
      isEnhanced: comicState.storyOutline.isEnhanced,
    };
  }

  return snapshot;
}

/**
 * Apply a snapshot to the comic store
 */
function applySnapshotToStore(snapshot: HistorySnapshot): void {
  const comicStore = useComicStore.getState();

  // Restore comic pages
  if (snapshot.comicPages !== undefined) {
    comicStore.setComicFaces(snapshot.comicPages);
  }

  // Restore page index
  if (snapshot.currentPageIndex !== undefined) {
    comicStore.setCurrentPageIndex(snapshot.currentPageIndex);
  }

  // Restore story outline
  if (snapshot.storyOutline) {
    comicStore.setStoryOutline({
      text: snapshot.storyOutline.content,
      isReady: snapshot.storyOutline.isReady,
      isGenerating: snapshot.storyOutline.isGenerating,
      pageBreakdown: snapshot.storyOutline.pageBreakdown ?? [],
      lastEditedAt: snapshot.storyOutline.lastEditedAt,
      version: snapshot.storyOutline.version ?? 0,
      isEnhanced: snapshot.storyOutline.isEnhanced ?? false,
    });
  }
}

/**
 * Main hook for undo/redo functionality
 *
 * Usage:
 * ```tsx
 * const { canUndo, canRedo, pushSnapshot, undo, redo, clearHistory } = useHistory();
 *
 * // After generating a page
 * pushSnapshot('Generated page 3');
 *
 * // After user makes a choice
 * pushSnapshot('Selected choice: "Confront the villain"');
 *
 * // When user clicks undo
 * if (undo()) {
 *   console.log('Undid successfully');
 * }
 *
 * // When starting a new comic
 * clearHistory();
 * ```
 */
export function useHistory(): UseHistoryReturn {
  const store = useHistoryStore();
  const availability = store.getAvailability();

  return {
    // Availability flags
    canUndo: availability.canUndo,
    canRedo: availability.canRedo,
    undoDescription: availability.undoDescription,
    redoDescription: availability.redoDescription,
    historyLength: store.entries.length,
    currentIndex: store.currentIndex,

    // Push current app state
    pushSnapshot: (action: string) => {
      const snapshot = createSnapshotFromStore();
      store.pushSnapshot(action, snapshot);
    },

    // Push custom snapshot
    pushCustomSnapshot: (action: string, snapshot: HistorySnapshot) => {
      store.pushSnapshot(action, snapshot);
    },

    // Undo action
    undo: (): boolean => {
      const snapshot = store.undo();
      if (snapshot) {
        applySnapshotToStore(snapshot);
        return true;
      }
      return false;
    },

    // Redo action
    redo: (): boolean => {
      const snapshot = store.redo();
      if (snapshot) {
        applySnapshotToStore(snapshot);
        return true;
      }
      return false;
    },

    // Clear history
    clearHistory: store.clearHistory,
  };
}

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/**
 * Select just the canUndo flag
 */
export const useCanUndo = () =>
  useHistoryStore((state) => state.currentIndex > 0 && state.entries.length > 0);

/**
 * Select just the canRedo flag
 */
export const useCanRedo = () =>
  useHistoryStore(
    (state) =>
      state.currentIndex < state.entries.length - 1 && state.entries.length > 0
  );

/**
 * Select history entry count
 */
export const useHistoryLength = () =>
  useHistoryStore((state) => state.entries.length);

/**
 * Select the current history entry
 */
export const useCurrentHistoryEntry = () =>
  useHistoryStore((state) =>
    state.currentIndex >= 0 && state.currentIndex < state.entries.length
      ? state.entries[state.currentIndex]
      : null
  );

// ============================================================================
// ACTION HOOKS (for components that only need actions)
// ============================================================================

/**
 * Get only the history actions (no state subscriptions)
 */
export const useHistoryActions = () =>
  useHistoryStore((state) => ({
    pushSnapshot: state.pushSnapshot,
    undo: state.undo,
    redo: state.redo,
    clearHistory: state.clearHistory,
    setConfig: state.setConfig,
  }));

export default useHistory;
