/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export interface UseUndoHistoryReturn<T> {
    value: T;
    /** Push a new value (clears redo stack) */
    push: (newValue: T) => void;
    /** Undo and return the new present value, or null if nothing to undo */
    undo: () => T | null;
    /** Redo and return the new present value, or null if nothing to redo */
    redo: () => T | null;
    canUndo: boolean;
    canRedo: boolean;
    /** Reset to a new present without adding to history */
    reset: (value: T) => void;
}

/**
 * Generic undo/redo history hook.
 * Keeps up to `maxHistory` past states.
 */
export function useUndoHistory<T>(initialValue: T, maxHistory = 5): UseUndoHistoryReturn<T> {
    const [state, setState] = useState<HistoryState<T>>({
        past: [],
        present: initialValue,
        future: []
    });

    const push = useCallback((newValue: T) => {
        setState(s => ({
            past: [...s.past.slice(-(maxHistory - 1)), s.present],
            present: newValue,
            future: []
        }));
    }, [maxHistory]);

    const undoResultRef = { value: null as any };
    const undo = useCallback((): any => {
        let result: any = null;
        setState(s => {
            if (s.past.length === 0) return s;
            const past = s.past.slice(0, -1);
            const present = s.past[s.past.length - 1];
            result = present;
            return { past, present, future: [s.present, ...s.future] };
        });
        undoResultRef.value = result;
        return result;
    }, []);

    const redo = useCallback((): any => {
        let result: any = null;
        setState(s => {
            if (s.future.length === 0) return s;
            const [present, ...future] = s.future;
            result = present;
            return { past: [...s.past, s.present], present, future };
        });
        return result;
    }, []);

    const reset = useCallback((value: T) => {
        setState({ past: [], present: value, future: [] });
    }, []);

    return {
        value: state.present,
        push,
        undo,
        redo,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        reset
    };
}
