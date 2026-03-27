/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcut handling for common actions like undo/redo.
 * Listens at the document level and respects input element focus.
 *
 * Key features:
 * - Ctrl+Z for undo (Cmd+Z on Mac)
 * - Ctrl+Shift+Z or Ctrl+Y for redo (Cmd+Shift+Z or Cmd+Y on Mac)
 * - Automatically disables when user is typing in input/textarea
 * - Prevents default browser undo behavior
 * - Cleanup function returned for proper lifecycle management
 */

import { useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for the useKeyboardShortcuts hook
 */
export interface KeyboardShortcutsOptions {
  /** Callback triggered when undo shortcut is pressed (Ctrl+Z / Cmd+Z) */
  onUndo?: () => void;

  /** Callback triggered when redo shortcut is pressed (Ctrl+Shift+Z / Ctrl+Y) */
  onRedo?: () => void;

  /** Whether keyboard shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Return value from useKeyboardShortcuts
 */
export interface UseKeyboardShortcutsReturn {
  /** Whether shortcuts are currently enabled */
  isEnabled: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if the current active element is an input field where we should
 * allow native browser undo/redo behavior
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();

  // Standard input/textarea elements
  if (tagName === 'input' || tagName === 'textarea') {
    return true;
  }

  // Check for contenteditable elements
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check if element has role="textbox" (for custom input components)
  if (element.getAttribute('role') === 'textbox') {
    return true;
  }

  return false;
}

/**
 * Determine if the event is an undo shortcut
 * - Windows/Linux: Ctrl+Z
 * - Mac: Cmd+Z
 */
function isUndoShortcut(event: KeyboardEvent): boolean {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? event.metaKey : event.ctrlKey;

  return modifier && !event.shiftKey && event.key.toLowerCase() === 'z';
}

/**
 * Determine if the event is a redo shortcut
 * - Windows/Linux: Ctrl+Shift+Z or Ctrl+Y
 * - Mac: Cmd+Shift+Z or Cmd+Y
 */
function isRedoShortcut(event: KeyboardEvent): boolean {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? event.metaKey : event.ctrlKey;

  // Ctrl/Cmd + Shift + Z
  if (modifier && event.shiftKey && event.key.toLowerCase() === 'z') {
    return true;
  }

  // Ctrl/Cmd + Y
  if (modifier && !event.shiftKey && event.key.toLowerCase() === 'y') {
    return true;
  }

  return false;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for handling keyboard shortcuts at the document level
 *
 * @example
 * ```tsx
 * // Basic usage with undo/redo callbacks
 * const { undo, redo } = useHistory();
 *
 * useKeyboardShortcuts({
 *   onUndo: () => {
 *     if (undo()) {
 *       console.log('Undid last action');
 *     }
 *   },
 *   onRedo: () => {
 *     if (redo()) {
 *       console.log('Redid action');
 *     }
 *   },
 * });
 *
 * @example
 * // Disable shortcuts during certain states
 * const [isModalOpen, setIsModalOpen] = useState(false);
 *
 * useKeyboardShortcuts({
 *   onUndo,
 *   onRedo,
 *   enabled: !isModalOpen,
 * });
 * ```
 */
export function useKeyboardShortcuts(
  options: KeyboardShortcutsOptions
): UseKeyboardShortcutsReturn {
  const { onUndo, onRedo, enabled = true } = options;

  // Use refs to always have the latest callback references
  // This prevents the need to re-add event listeners when callbacks change
  const onUndoRef = useRef(onUndo);
  const onRedoRef = useRef(onRedo);
  const enabledRef = useRef(enabled);

  // Keep refs up to date
  useEffect(() => {
    onUndoRef.current = onUndo;
    onRedoRef.current = onRedo;
    enabledRef.current = enabled;
  }, [onUndo, onRedo, enabled]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if shortcuts are disabled
    if (!enabledRef.current) {
      return;
    }

    // Skip if user is typing in an input field
    if (isInputElement(document.activeElement)) {
      return;
    }

    // Check for undo shortcut
    if (isUndoShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();
      onUndoRef.current?.();
      return;
    }

    // Check for redo shortcut
    if (isRedoShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();
      onRedoRef.current?.();
      return;
    }
  }, []);

  // Set up event listener
  useEffect(() => {
    // Add the event listener at document level
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);

  return {
    isEnabled: enabled,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useKeyboardShortcuts;
