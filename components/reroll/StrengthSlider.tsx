/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * StrengthSlider - Intensity/strength control for regeneration
 * Task 1.1.3 from V2 Batch Plan
 *
 * Since Gemini doesn't support traditional denoise strength,
 * this maps to prompt intensity language instead.
 */

import React from 'react';

// Strength levels mapped to prompt language
export const STRENGTH_LEVELS = [
    { value: 0.3, label: 'Subtle', prompt: 'Make subtle, minimal adjustments to', color: 'bg-blue-400' },
    { value: 0.5, label: 'Moderate', prompt: 'Moderately update and refine', color: 'bg-green-400' },
    { value: 0.7, label: 'Strong', prompt: 'Significantly change and improve', color: 'bg-orange-400' },
    { value: 1.0, label: 'Full', prompt: 'Completely redesign and recreate', color: 'bg-red-400' }
];

interface StrengthSliderProps {
    /** Current strength value (0.3, 0.5, 0.7, or 1.0) */
    value: number;
    /** Callback when strength changes */
    onChange: (value: number) => void;
    /** Whether the slider is disabled */
    disabled?: boolean;
}

export const StrengthSlider: React.FC<StrengthSliderProps> = ({
    value,
    onChange,
    disabled = false
}) => {
    const currentLevel = STRENGTH_LEVELS.find(l => l.value === value) || STRENGTH_LEVELS[3];
    const currentIndex = STRENGTH_LEVELS.findIndex(l => l.value === value);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const index = parseInt(e.target.value, 10);
        onChange(STRENGTH_LEVELS[index].value);
    };

    return (
        <div className="border-[3px] border-black bg-gradient-to-r from-blue-50 via-green-50 via-orange-50 to-red-50 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="font-comic font-bold text-sm sm:text-base uppercase text-gray-800">
                        🎚️ Change Intensity
                    </p>
                    <p className="font-comic text-xs text-gray-600 mt-0.5">
                        How much should the image change?
                    </p>
                </div>
                <div className={`px-3 py-1 ${currentLevel.color} border-2 border-black font-comic text-xs sm:text-sm font-bold uppercase`}>
                    {currentLevel.label}
                </div>
            </div>

            {/* Slider track */}
            <div className="relative px-2">
                <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={currentIndex >= 0 ? currentIndex : 3}
                    onChange={handleSliderChange}
                    disabled={disabled}
                    className={`
                        w-full h-3 appearance-none rounded-full cursor-pointer
                        bg-gradient-to-r from-blue-300 via-green-300 via-orange-300 to-red-300
                        border-2 border-black
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-6
                        [&::-webkit-slider-thumb]:h-6
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-yellow-400
                        [&::-webkit-slider-thumb]:border-3
                        [&::-webkit-slider-thumb]:border-black
                        [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_rgba(0,0,0,1)]
                        [&::-webkit-slider-thumb]:cursor-grab
                        [&::-webkit-slider-thumb]:active:cursor-grabbing
                        [&::-moz-range-thumb]:w-6
                        [&::-moz-range-thumb]:h-6
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-yellow-400
                        [&::-moz-range-thumb]:border-3
                        [&::-moz-range-thumb]:border-black
                        [&::-moz-range-thumb]:shadow-[2px_2px_0px_rgba(0,0,0,1)]
                        [&::-moz-range-thumb]:cursor-grab
                    `}
                    aria-label="Change intensity"
                    aria-valuetext={currentLevel.label}
                />

                {/* Labels under slider */}
                <div className="flex justify-between mt-2">
                    {STRENGTH_LEVELS.map((level, index) => (
                        <button
                            key={level.value}
                            onClick={() => !disabled && onChange(level.value)}
                            disabled={disabled}
                            className={`
                                font-comic text-[10px] sm:text-xs font-bold uppercase
                                px-1 py-0.5 rounded
                                transition-colors
                                ${value === level.value
                                    ? 'text-black underline'
                                    : 'text-gray-500 hover:text-gray-800'
                                }
                                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Current instruction preview */}
            <div className="mt-3 p-2 bg-white border-2 border-gray-300 rounded-sm">
                <p className="font-comic text-xs text-gray-600">
                    <span className="font-bold">AI will:</span> "{currentLevel.prompt} the selected elements"
                </p>
            </div>
        </div>
    );
};

/**
 * Get the prompt prefix for a given strength value
 */
export const getStrengthPrompt = (value: number): string => {
    const level = STRENGTH_LEVELS.find(l => l.value === value);
    return level?.prompt || STRENGTH_LEVELS[3].prompt;
};

export default StrengthSlider;
