/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Props for the GoBackButton component.
 */
export interface GoBackButtonProps {
    /** Handler called when the go back button is clicked */
    onGoBack: () => void;
    /** Whether the go back action is available (false if at first page or no previous choices) */
    canGoBack: boolean;
    /** Whether the app is in Novel Mode (button only visible in Novel Mode) */
    isNovelMode: boolean;
    /** Optional size variant */
    size?: 'small' | 'medium' | 'large';
    /** Optional className for custom styling */
    className?: string;
    /** Optional description of what going back will do */
    goBackDescription?: string;
}

/**
 * GoBackButton component - Navigate back to a previous decision point in Novel Mode.
 *
 * Features:
 * - Only visible in Novel Mode (interactive story mode)
 * - Disabled when at the first page or when no previous choices exist
 * - Comic book themed styling with bold borders and shadow effects
 * - Tooltip showing action description on hover
 *
 * Usage:
 * ```tsx
 * <GoBackButton
 *     onGoBack={handleGoBack}
 *     canGoBack={currentPage > 1 && hasPreviousChoices}
 *     isNovelMode={!generateFromOutline}
 *     goBackDescription="Return to previous choice"
 * />
 * ```
 */
export const GoBackButton: React.FC<GoBackButtonProps> = ({
    onGoBack,
    canGoBack,
    isNovelMode,
    size = 'medium',
    className = '',
    goBackDescription,
}) => {
    // Only render in Novel Mode
    if (!isNovelMode) {
        return null;
    }

    // Size-based styling (matching UndoRedoButtons pattern)
    const sizeClasses = {
        small: {
            button: 'px-3 py-1.5 text-xs',
            icon: 'text-sm',
            border: 'border-[2px]',
            shadow: 'shadow-[2px_2px_0px_rgba(0,0,0,1)]',
        },
        medium: {
            button: 'px-4 py-2 text-sm',
            icon: 'text-base',
            border: 'border-[3px]',
            shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,1)]',
        },
        large: {
            button: 'px-5 py-2.5 text-base',
            icon: 'text-lg',
            border: 'border-[3px]',
            shadow: 'shadow-[4px_4px_0px_rgba(0,0,0,1)]',
        },
    };

    const sizeStyle = sizeClasses[size];

    const defaultDescription = 'Go back to previous choice';
    const tooltipText = goBackDescription || defaultDescription;

    return (
        <div className={`relative group ${className}`}>
            <button
                onClick={onGoBack}
                disabled={!canGoBack}
                className={`comic-btn ${sizeStyle.button} ${sizeStyle.border} ${sizeStyle.shadow}
                    rounded-md bg-amber-500 hover:bg-amber-400
                    text-white border-black flex items-center justify-center gap-2
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500
                    active:translate-y-0.5 active:shadow-none
                    transition-all font-bold font-comic tracking-wider uppercase`}
                aria-label={tooltipText}
                title={tooltipText}
            >
                <span className={sizeStyle.icon} aria-hidden="true">
                    &#8592;
                </span>
                <span>GO BACK</span>
            </button>

            {/* Tooltip */}
            {goBackDescription && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200 w-48 p-2
                        bg-white text-black text-xs font-comic
                        border-2 border-black drop-shadow-md z-[500] pointer-events-none
                        text-center"
                >
                    {goBackDescription}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black"></div>
                </div>
            )}
        </div>
    );
};

export default GoBackButton;
