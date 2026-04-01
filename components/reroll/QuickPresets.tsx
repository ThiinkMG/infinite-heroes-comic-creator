/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * QuickPresets - Fast action presets for common regeneration scenarios
 * Task 1.1.2 from V2 Batch Plan
 *
 * Optimized for Gemini's text-based image generation (no inpainting support)
 */

import React from 'react';
import { RegenerationMode } from '../../types';

export interface QuickPreset {
    id: string;
    icon: string;
    label: string;
    description: string;
    modes: RegenerationMode[];
    useRefs: boolean;
    prompt: string;
}

// Gemini-optimized presets (text-based targeting, no inpainting)
export const QUICK_PRESETS: QuickPreset[] = [
    {
        id: 'fix-face',
        icon: '😊',
        label: 'Fix Face',
        description: 'Regenerate with better facial accuracy',
        modes: ['expression_only'],
        useRefs: true,
        prompt: 'Keep the exact same scene, background, and pose. Only adjust facial features to better match the reference portrait. Maintain all other elements identically.'
    },
    {
        id: 'keep-scene',
        icon: '👥',
        label: 'Keep Background',
        description: 'Fix characters while preserving background',
        modes: ['characters_only'],
        useRefs: true,
        prompt: 'Preserve the background, environment, and scene composition exactly. Regenerate only the characters to match their reference images more accurately.'
    },
    {
        id: 'fix-costume',
        icon: '⭐',
        label: 'Fix Outfit',
        description: 'Correct outfit, emblem, and accessories',
        modes: ['outfit_only', 'emblem_only'],
        useRefs: true,
        prompt: 'Keep the face, pose, and scene identical. Update only the costume, emblem placement, and accessories to match the character references exactly.'
    },
    {
        id: 'full-redo',
        icon: '🎲',
        label: 'Full Redo',
        description: 'Completely regenerate the panel',
        modes: ['full'],
        useRefs: true,
        prompt: ''
    },
    {
        id: 'consistency-mode',
        icon: '🔒',
        label: 'Lock Everything',
        description: 'Enforce all locked character attributes as hard constraints',
        modes: ['full'],
        useRefs: true,
        prompt: 'Maintain all character appearances EXACTLY as shown in reference images. Same face, same outfit, same emblem, same weapon. No creative changes to character appearance.',
    },
    {
        id: 'fix-background',
        icon: '🌆',
        label: 'Fix Background',
        description: 'Improve environment and lighting while keeping all characters unchanged',
        modes: ['full'],
        useRefs: false,
        prompt: 'Preserve all characters exactly as-is — same face, same outfit, same pose. Only improve the background, environment, lighting, and scene atmosphere to better match the story context. Do NOT change any character\'s appearance.',
    }
];

interface QuickPresetsProps {
    /** Currently selected preset IDs (multi-select) */
    selectedPresetIds: string[];
    /** Callback when a preset is selected */
    onSelectPreset: (preset: QuickPreset) => void;
    /** Whether presets are disabled (e.g., during generation) */
    disabled?: boolean;
}

export const QuickPresets: React.FC<QuickPresetsProps> = ({
    selectedPresetIds,
    onSelectPreset,
    disabled = false
}) => {
    return (
        <div className="border-[3px] border-black bg-purple-50 p-3 sm:p-4">
            <div className="mb-3 border-b-2 border-purple-200 pb-2">
                <p className="font-comic font-bold text-sm sm:text-base uppercase text-purple-900">
                    ⚡ Quick Presets
                </p>
                <p className="font-comic text-xs text-purple-700 mt-0.5">
                    One-click fixes for common issues
                </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                {QUICK_PRESETS.map((preset) => {
                    const isSelected = selectedPresetIds.includes(preset.id);

                    return (
                        <button
                            key={preset.id}
                            onClick={() => onSelectPreset(preset)}
                            disabled={disabled}
                            className={`
                                relative flex flex-col items-center justify-center
                                p-3 sm:p-4 min-h-[80px] sm:min-h-[90px]
                                border-[3px] border-black rounded-sm
                                font-comic text-center
                                transition-all duration-150
                                touch-manipulation
                                ${isSelected
                                    ? 'bg-yellow-400 shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                    : 'bg-white hover:bg-purple-100 shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)]'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:translate-y-0 active:shadow-[1px_1px_0px_rgba(0,0,0,1)]'}
                            `}
                            title={preset.description}
                            aria-pressed={isSelected}
                            aria-label={`${preset.label}: ${preset.description}`}
                        >
                            <span className="text-2xl sm:text-3xl mb-1">{preset.icon}</span>
                            <span className="text-xs sm:text-sm font-bold uppercase tracking-tight">
                                {preset.label}
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

            {/* Selected preset descriptions — one chip per selected preset */}
            {selectedPresetIds.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                    {selectedPresetIds.map(id => {
                        const preset = QUICK_PRESETS.find(p => p.id === id);
                        if (!preset) return null;
                        return (
                            <div key={id} className="p-2 bg-yellow-100 border-2 border-yellow-400 rounded-sm">
                                <p className="font-comic text-xs sm:text-sm text-yellow-800">
                                    <strong>{preset.icon} {preset.label}:</strong>{' '}
                                    {preset.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuickPresets;
