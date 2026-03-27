/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * History Types for Undo/Redo Functionality
 *
 * This module defines the state structure for tracking history entries,
 * enabling users to undo/redo their actions during comic creation.
 *
 * Key design decisions:
 * - Only track restorable state (comic pages, outline, page index)
 * - Exclude transient state (API keys, in-progress generation, settings)
 * - Limit history entries to prevent memory bloat
 * - Use snapshots rather than diffs for simplicity
 */

import type { ComicFace, StoryOutline, NovelModeState } from '../types';

// ============================================================================
// HISTORY STATE TYPES
// ============================================================================

/**
 * A snapshot of the application state that can be restored.
 *
 * Contains only the key state that users would want to undo/redo:
 * - Comic pages (the generated panels)
 * - Story outline (the narrative structure)
 * - Current page position
 *
 * Intentionally excludes:
 * - API keys and authentication state
 * - Settings and preferences
 * - In-progress generation state
 * - Character definitions (these are set before generation starts)
 */
export interface HistorySnapshot {
  /**
   * The array of comic pages (covers, story pages, back cover).
   * Each ComicFace contains the image, narrative, and choices.
   */
  comicPages?: ComicFace[];

  /**
   * The current page index in the book view.
   * Used to restore the user's position when undoing.
   */
  currentPageIndex?: number;

  /**
   * The story outline containing narrative structure.
   * Includes per-page breakdown if using enhanced outline mode.
   */
  storyOutline?: StoryOutline;

  /**
   * Novel Mode specific state.
   * Tracks wrap-up status, custom action history, and drift detection.
   */
  novelModeState?: NovelModeState;

  /**
   * Number of extra pages added beyond original target (Novel Mode).
   */
  extraPages?: number;
}

/**
 * A single entry in the history stack.
 *
 * Each entry represents a point-in-time snapshot that can be restored.
 * Entries are created after significant user actions like:
 * - Generating a new page
 * - Making a story choice
 * - Rerolling a panel
 * - Editing the outline
 */
export interface HistoryEntry {
  /**
   * Unique identifier for this history entry.
   * Used for tracking and debugging purposes.
   */
  id: string;

  /**
   * Timestamp when this entry was created.
   * Milliseconds since Unix epoch.
   */
  timestamp: number;

  /**
   * Human-readable description of what action created this entry.
   * Examples:
   * - "Generated page 3"
   * - "Selected choice: 'Confront the villain'"
   * - "Rerolled panel with new instructions"
   * - "Edited story outline"
   */
  action: string;

  /**
   * The state snapshot that can be restored.
   */
  state: HistorySnapshot;
}

/**
 * The complete history state managed by the history system.
 *
 * Uses a linear history model where:
 * - New actions are pushed to the entries array
 * - Undo moves currentIndex backward
 * - Redo moves currentIndex forward
 * - New actions after undo truncate the forward history
 */
export interface HistoryState {
  /**
   * Array of all history entries.
   * Index 0 is the oldest entry, last index is the most recent.
   */
  entries: HistoryEntry[];

  /**
   * Current position in the history stack.
   * - 0 means at the oldest entry
   * - entries.length - 1 means at the most recent
   * - Can be anywhere in between after undo operations
   */
  currentIndex: number;

  /**
   * Maximum number of entries to keep in history.
   * When exceeded, oldest entries are removed.
   * Default: 20 (balances memory usage with useful history depth)
   */
  maxEntries: number;
}

// ============================================================================
// HISTORY ACTIONS
// ============================================================================

/**
 * Actions that can be dispatched to modify history state.
 *
 * Used with a reducer pattern for predictable state updates:
 * - PUSH: Add a new history entry (after user action)
 * - UNDO: Move backward in history
 * - REDO: Move forward in history
 * - CLEAR: Reset history (e.g., when starting new comic)
 */
export type HistoryAction =
  | { type: 'PUSH'; entry: HistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Result of checking if undo/redo is available.
 * Used to enable/disable UI buttons.
 */
export interface HistoryAvailability {
  /** Whether undo is available (currentIndex > 0) */
  canUndo: boolean;

  /** Whether redo is available (currentIndex < entries.length - 1) */
  canRedo: boolean;

  /** Description of the action that would be undone */
  undoDescription?: string;

  /** Description of the action that would be redone */
  redoDescription?: string;
}

/**
 * Configuration options for the history system.
 */
export interface HistoryConfig {
  /**
   * Maximum number of history entries to keep.
   * @default 20
   */
  maxEntries?: number;

  /**
   * Whether to include comic page images in snapshots.
   * Disabling can save memory but prevents full restoration.
   * @default true
   */
  includeImages?: boolean;

  /**
   * Debounce time in milliseconds for rapid actions.
   * Prevents creating too many entries for rapid-fire changes.
   * @default 1000
   */
  debounceMs?: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default configuration for the history system.
 */
export const DEFAULT_HISTORY_CONFIG: Required<HistoryConfig> = {
  maxEntries: 20,
  includeImages: true,
  debounceMs: 1000,
};

/**
 * Initial history state for a new session.
 */
export const INITIAL_HISTORY_STATE: HistoryState = {
  entries: [],
  currentIndex: -1,
  maxEntries: DEFAULT_HISTORY_CONFIG.maxEntries,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a valid HistoryEntry.
 */
export function isHistoryEntry(obj: unknown): obj is HistoryEntry {
  if (typeof obj !== 'object' || obj === null) return false;
  const entry = obj as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.timestamp === 'number' &&
    typeof entry.action === 'string' &&
    typeof entry.state === 'object' &&
    entry.state !== null
  );
}

/**
 * Type guard to check if an object is a valid HistorySnapshot.
 */
export function isHistorySnapshot(obj: unknown): obj is HistorySnapshot {
  if (typeof obj !== 'object' || obj === null) return false;
  const snapshot = obj as Record<string, unknown>;
  // All fields are optional, but if present they should be correct types
  if (snapshot.comicPages !== undefined && !Array.isArray(snapshot.comicPages)) return false;
  if (snapshot.currentPageIndex !== undefined && typeof snapshot.currentPageIndex !== 'number') return false;
  if (snapshot.storyOutline !== undefined && typeof snapshot.storyOutline !== 'object') return false;
  return true;
}
