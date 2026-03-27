/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Props for the UndoRedoButtons component.
 */
export interface UndoRedoButtonsProps {
    /** Handler called when undo button is clicked */
    onUndo: () => void;
    /** Handler called when redo button is clicked */
    onRedo: () => void;
    /** Whether undo action is available */
    canUndo: boolean;
    /** Whether redo action is available */
    canRedo: boolean;
    /** Optional description of the action that would be undone */
    undoDescription?: string;
    /** Optional description of the action that would be redone */
    redoDescription?: string;
    /** Optional size variant */
    size?: 'small' | 'medium' | 'large';
    /** Optional className for custom styling */
    className?: string;
}

/**
 * UndoRedoButtons component - Undo and Redo action buttons with comic book styling.
 *
 * Features:
 * - Two buttons with arrow icons for undo (left) and redo (right)
 * - Disabled state with reduced opacity when action is unavailable
 * - Tooltip showing action description on hover
 * - Matches comic book theme with bold borders and shadow effects
 *
 * Usage:
 * ```tsx
 * <UndoRedoButtons
 *     onUndo={handleUndo}
 *     onRedo={handleRedo}
 *     canUndo={historyAvailability.canUndo}
 *     canRedo={historyAvailability.canRedo}
 *     undoDescription="Revert panel regeneration"
 *     redoDescription="Restore panel regeneration"
 * />
 * ```
 */
export const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    size = 'medium',
    className = '',
}) => {
    // Size-based styling
    const sizeClasses = {
        small: {
            button: 'w-8 h-8 text-sm',
            icon: 'text-lg',
            border: 'border-[2px]',
            shadow: 'shadow-[2px_2px_0px_rgba(0,0,0,1)]',
            container: 'gap-1',
        },
        medium: {
            button: 'w-10 h-10 text-base',
            icon: 'text-xl',
            border: 'border-[3px]',
            shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,1)]',
            container: 'gap-2',
        },
        large: {
            button: 'w-12 h-12 text-lg',
            icon: 'text-2xl',
            border: 'border-[3px]',
            shadow: 'shadow-[4px_4px_0px_rgba(0,0,0,1)]',
            container: 'gap-2',
        },
    };

    const sizeStyle = sizeClasses[size];

    return (
        <div
            className={`flex items-center ${sizeStyle.container} ${className}`}
            role="group"
            aria-label="Undo and redo actions"
        >
            {/* Undo Button */}
            <div className="relative group">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`comic-btn ${sizeStyle.button} ${sizeStyle.border} ${sizeStyle.shadow}
                        rounded-md bg-yellow-400 hover:bg-yellow-300
                        border-black flex items-center justify-center
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-yellow-400
                        active:translate-y-0.5 active:shadow-none
                        transition-all font-bold`}
                    aria-label={undoDescription ? `Undo: ${undoDescription}` : 'Undo'}
                    title={undoDescription || 'Undo'}
                >
                    <span className={sizeStyle.icon} aria-hidden="true">
                        &#8592;
                    </span>
                </button>

                {/* Tooltip for undo */}
                {undoDescription && (
                    <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                            transition-all duration-200 w-48 p-2
                            bg-white text-black text-xs font-comic
                            border-2 border-black drop-shadow-md z-[500] pointer-events-none
                            text-center"
                    >
                        <span className="font-bold">Undo:</span> {undoDescription}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black"></div>
                    </div>
                )}
            </div>

            {/* Redo Button */}
            <div className="relative group">
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`comic-btn ${sizeStyle.button} ${sizeStyle.border} ${sizeStyle.shadow}
                        rounded-md bg-yellow-400 hover:bg-yellow-300
                        border-black flex items-center justify-center
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-yellow-400
                        active:translate-y-0.5 active:shadow-none
                        transition-all font-bold`}
                    aria-label={redoDescription ? `Redo: ${redoDescription}` : 'Redo'}
                    title={redoDescription || 'Redo'}
                >
                    <span className={sizeStyle.icon} aria-hidden="true">
                        &#8594;
                    </span>
                </button>

                {/* Tooltip for redo */}
                {redoDescription && (
                    <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                            transition-all duration-200 w-48 p-2
                            bg-white text-black text-xs font-comic
                            border-2 border-black drop-shadow-md z-[500] pointer-events-none
                            text-center"
                    >
                        <span className="font-bold">Redo:</span> {redoDescription}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UndoRedoButtons;
