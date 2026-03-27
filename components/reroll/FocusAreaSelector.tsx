/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FocusAreaSelector - Select which area of the image to focus changes on
 * Task 1.1.4 from V2 Batch Plan
 *
 * Uses text-based targeting for Gemini (no mask/region selection support)
 */

import React from 'react';

export interface FocusArea {
    id: string;
    icon: string;
    label: string;
    prompt: string;
}

// Focus areas with Gemini-compatible prompts
export const FOCUS_AREAS: FocusArea[] = [
    {
        id: 'face',
        icon: '😊',
        label: 'Face',
        prompt: 'Focus all changes on the character\'s face, expression, and facial features. Keep body, pose, and background unchanged.'
    },
    {
        id: 'body',
        icon: '🧍',
        label: 'Body',
        prompt: 'Focus changes on the character\'s full body, pose, and proportions. Preserve facial features and background.'
    },
    {
        id: 'costume',
        icon: '👔',
        label: 'Costume',
        prompt: 'Focus changes on clothing, armor, costume details, and accessories. Keep face, body shape, and background intact.'
    },
    {
        id: 'background',
        icon: '🏙️',
        label: 'Background',
        prompt: 'Focus changes on the background, environment, and scenery. Keep all characters and their positions identical.'
    }
];

interface FocusAreaSelectorProps {
    /** Currently selected focus area IDs (supports multi-select) */
    selectedAreas: Set<string>;
    /** Callback when selection changes */
    onToggleArea: (areaId: string) => void;
    /** Whether to allow multiple selections */
    multiSelect?: boolean;
    /** Whether the selector is disabled */
    disabled?: boolean;
}

export const FocusAreaSelector: React.FC<FocusAreaSelectorProps> = ({
    selectedAreas,
    onToggleArea,
    multiSelect = false,
    disabled = false
}) => {
    const handleAreaClick = (areaId: string) => {
        if (disabled) return;
        onToggleArea(areaId);
    };

    const selectedCount = selectedAreas.size;

    return (
        <div className="border-[3px] border-black bg-cyan-50 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 border-b-2 border-cyan-200 pb-2">
                <div>
                    <p className="font-comic font-bold text-sm sm:text-base uppercase text-cyan-900">
                        🎯 Focus Area
                    </p>
                    <p className="font-comic text-xs text-cyan-700 mt-0.5">
                        {multiSelect
                            ? 'Select which parts to change (multi-select)'
                            : 'Where should changes be focused?'
                        }
                    </p>
                </div>
                {selectedCount > 0 && (
                    <span className="px-2 py-1 bg-cyan-200 border-2 border-cyan-400 font-comic text-xs font-bold">
                        {selectedCount} selected
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {FOCUS_AREAS.map((area) => {
                    const isSelected = selectedAreas.has(area.id);

                    return (
                        <button
                            key={area.id}
                            onClick={() => handleAreaClick(area.id)}
                            disabled={disabled}
                            className={`
                                relative flex flex-col items-center justify-center
                                p-3 sm:p-4 min-h-[70px] sm:min-h-[80px]
                                border-[3px] border-black rounded-sm
                                font-comic text-center
                                transition-all duration-150
                                touch-manipulation
                                ${isSelected
                                    ? 'bg-cyan-400 shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                    : 'bg-white hover:bg-cyan-100 shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)]'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:translate-y-0 active:shadow-[1px_1px_0px_rgba(0,0,0,1)]'}
                            `}
                            title={area.prompt}
                            aria-pressed={isSelected}
                            aria-label={`${area.label}: ${area.prompt}`}
                        >
                            <span className="text-2xl sm:text-3xl mb-1">{area.icon}</span>
                            <span className="text-xs sm:text-sm font-bold uppercase tracking-tight">
                                {area.label}
                            </span>

                            {/* Selected indicator */}
                            {isSelected && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    ✓
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* No selection hint */}
            {selectedCount === 0 && (
                <p className="mt-3 font-comic text-xs text-gray-500 text-center italic">
                    No focus selected = changes applied everywhere
                </p>
            )}

            {/* Combined prompt preview */}
            {selectedCount > 0 && (
                <div className="mt-3 p-2 bg-white border-2 border-cyan-300 rounded-sm">
                    <p className="font-comic text-xs text-cyan-800">
                        <strong>Focus:</strong>{' '}
                        {Array.from(selectedAreas)
                            .map(id => FOCUS_AREAS.find(a => a.id === id)?.label)
                            .filter(Boolean)
                            .join(', ')
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * Get combined focus area prompt for selected areas
 */
export const getFocusAreaPrompt = (selectedAreas: Set<string>): string => {
    if (selectedAreas.size === 0) return '';

    const prompts = Array.from(selectedAreas)
        .map(id => FOCUS_AREAS.find(a => a.id === id)?.prompt)
        .filter(Boolean);

    if (prompts.length === 1) return prompts[0] || '';

    // Combine multiple focus areas
    const areas = Array.from(selectedAreas)
        .map(id => FOCUS_AREAS.find(a => a.id === id)?.label.toLowerCase())
        .filter(Boolean);

    return `Focus changes on the ${areas.join(' and ')}. Keep other elements unchanged.`;
};

export default FocusAreaSelector;
