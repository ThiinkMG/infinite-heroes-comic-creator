/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LOCATION_LIBRARY, CATEGORY_DISPLAY_NAMES, getAllCategories } from '../../data/locationLibrary';
import { POSE_LIBRARY, POSE_CATEGORY_LABELS } from '../../data/poseLibrary';

interface InstructionInputProps {
    instruction: string;
    negativePrompt: string;
    selectedLocationId: string;
    selectedPoseId: string;
    isImprovingInstruction: boolean;
    isImprovingNegative: boolean;
    onInstructionChange: (value: string) => void;
    onNegativePromptChange: (value: string) => void;
    onLocationChange: (locationId: string) => void;
    onPoseChange: (poseId: string) => void;
    onImproveInstruction?: () => void;
    onImproveNegative?: () => void;
}

export const InstructionInput: React.FC<InstructionInputProps> = ({
    instruction,
    negativePrompt,
    selectedLocationId,
    selectedPoseId,
    isImprovingInstruction,
    isImprovingNegative,
    onInstructionChange,
    onNegativePromptChange,
    onLocationChange,
    onPoseChange,
    onImproveInstruction,
    onImproveNegative
}) => {
    const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const locationId = e.target.value;
        onLocationChange(locationId);

        if (locationId) {
            const location = LOCATION_LIBRARY.find(loc => loc.id === locationId);
            if (location) {
                // Append location prompt to existing instruction
                const locationPrompt = `Set in: ${location.promptDescription}`;
                const currentInstruction = instruction.trim();
                const newInstruction = currentInstruction
                    ? `${currentInstruction}\n\n${locationPrompt}`
                    : locationPrompt;
                onInstructionChange(newInstruction);
            }
        }
    };

    const handlePoseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const poseId = e.target.value;
        onPoseChange(poseId);

        if (poseId) {
            const pose = POSE_LIBRARY.find(p => p.id === poseId);
            if (pose) {
                // Append pose prompt to existing instruction
                const posePrompt = `Character pose: ${pose.promptDescription}`;
                const currentInstruction = instruction.trim();
                const newInstruction = currentInstruction
                    ? `${currentInstruction}\n\n${posePrompt}`
                    : posePrompt;
                onInstructionChange(newInstruction);
            }
        }
    };

    return (
        <>
            {/* Instruction Text Input - MOST IMPORTANT, placed first */}
            <div className="border-[3px] border-black bg-green-50 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className="font-comic text-sm sm:text-base font-bold uppercase text-green-900">
                        ✍️ Regeneration Instructions
                    </p>
                    {onImproveInstruction && (
                        <button
                            onClick={onImproveInstruction}
                            disabled={isImprovingInstruction || !instruction.trim()}
                            className="comic-btn bg-purple-600 text-white text-xs sm:text-sm min-h-[44px] px-4 py-2 hover:bg-purple-500 active:bg-purple-700 border-2 border-black uppercase disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation self-start sm:self-auto"
                            title="Improve instruction with AI"
                        >
                            {isImprovingInstruction ? '⏳ IMPROVING...' : '✨ AI IMPROVE'}
                        </button>
                    )}
                </div>
                <textarea
                    value={instruction}
                    onChange={(e) => onInstructionChange(e.target.value)}
                    placeholder="e.g. 'Make the hero look determined', 'Change background to a rooftop at sunset'..."
                    className="w-full p-3 sm:p-4 border-2 border-black font-comic text-sm sm:text-base resize-none h-28 sm:h-24 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    aria-label="Regeneration instructions"
                />

                {/* Hint about reference images */}
                <p className="mt-2 font-comic text-xs text-green-700 italic">
                    💡 Selected images in the gallery below will be sent to AI
                </p>
            </div>

            {/* Negative Prompt - Second most used */}
            <div className="border-[3px] border-black bg-red-50 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className="font-comic text-sm sm:text-base font-bold uppercase text-red-900">
                        🚫 Exclude From Image
                    </p>
                    {onImproveNegative && (
                        <button
                            onClick={onImproveNegative}
                            disabled={isImprovingNegative || !negativePrompt.trim()}
                            className="comic-btn bg-purple-600 text-white text-xs sm:text-sm min-h-[44px] px-4 py-2 hover:bg-purple-500 active:bg-purple-700 border-2 border-black uppercase disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation self-start sm:self-auto"
                            title="Improve negative prompt with AI"
                        >
                            {isImprovingNegative ? '⏳ IMPROVING...' : '✨ AI IMPROVE'}
                        </button>
                    )}
                </div>
                <p className="font-comic text-xs text-red-700 mb-2">
                    What should NOT appear in the image
                </p>
                <textarea
                    value={negativePrompt}
                    onChange={(e) => onNegativePromptChange(e.target.value)}
                    placeholder="e.g. 'no mask, no helmet, no cape, no glowing eyes'..."
                    className="w-full p-3 sm:p-4 border-2 border-black font-comic text-sm sm:text-base resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                    aria-label="Negative prompt - elements to exclude"
                />
            </div>

            {/* Pose & Location - Collapsible on mobile */}
            <details className="border-[3px] border-black bg-teal-50 group sm:border-0 sm:bg-transparent sm:p-0">
                <summary className="sm:hidden p-3 cursor-pointer flex justify-between items-center list-none touch-manipulation min-h-[48px]">
                    <span className="font-comic text-sm font-bold uppercase text-teal-900">
                        🧍 Pose & Location (Optional)
                    </span>
                    <span className="text-teal-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>

                <div className="sm:contents p-3 pt-0 sm:p-0 border-t-2 border-teal-200 sm:border-0 space-y-4 sm:space-y-0">
                    {/* Pose Selector */}
                    <div className="sm:border-[3px] sm:border-black sm:bg-teal-50 sm:p-4 sm:mb-4">
                        <label className="block">
                            <p className="font-comic text-sm sm:text-base font-bold uppercase text-teal-900 mb-2 hidden sm:block">
                                🧍 Character Pose (Optional)
                            </p>
                            <p className="font-comic text-xs text-teal-700 mb-2">
                                Select a predefined pose
                            </p>
                            <select
                                value={selectedPoseId}
                                onChange={handlePoseSelect}
                                className="w-full p-3 sm:p-2 border-2 border-black font-comic text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[48px] touch-manipulation"
                                aria-label="Character pose"
                            >
                                <option value="">Select a pose (optional)</option>
                                {Object.entries(POSE_CATEGORY_LABELS).map(([category, label]) => {
                                    const posesInCategory = POSE_LIBRARY.filter(p => p.category === category);
                                    if (posesInCategory.length === 0) return null;
                                    return (
                                        <optgroup key={category} label={label}>
                                            {posesInCategory.map(pose => (
                                                <option key={pose.id} value={pose.id}>
                                                    {pose.label}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                })}
                            </select>
                        </label>
                    </div>

                    {/* Location Selector */}
                    <div className="sm:border-[3px] sm:border-black sm:bg-teal-50 sm:p-4">
                        <p className="font-comic text-sm sm:text-base font-bold uppercase text-teal-900 mb-2 hidden sm:block">
                            📍 Location/Setting (Optional)
                        </p>
                        <p className="font-comic text-xs text-teal-700 mb-2">
                            Select a pre-defined location
                        </p>
                        <select
                            value={selectedLocationId}
                            onChange={handleLocationSelect}
                            className="w-full p-3 sm:p-2 border-2 border-black font-comic text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white min-h-[48px] touch-manipulation"
                            aria-label="Location setting"
                        >
                            <option value="">Select a location (optional)</option>
                            {getAllCategories().map(category => {
                                const locationsInCategory = LOCATION_LIBRARY.filter(loc => loc.category === category);
                                return (
                                    <optgroup key={category} label={CATEGORY_DISPLAY_NAMES[category]}>
                                        {locationsInCategory.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                );
                            })}
                        </select>
                        {selectedLocationId && (
                            <div className="mt-2 p-2 bg-white border-2 border-teal-300 rounded">
                                <p className="font-comic text-xs text-teal-800">
                                    <span className="font-bold">Added:</span> {LOCATION_LIBRARY.find(loc => loc.id === selectedLocationId)?.promptDescription}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </details>
        </>
    );
};
