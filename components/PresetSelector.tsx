/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { COMIC_PRESETS, ComicPreset } from '../data/comicPresets';
import { Tooltip } from './Tooltip';

/**
 * Interface for user-saved custom presets.
 */
export interface CustomPreset {
    id: string;
    name: string;
    description: string;
    genre: string;
    artStyle: string;
    pageLength: number;
    samplePlotOutline: string;
    createdAt: number;
}

/**
 * Props for the PresetSelector component.
 */
export interface PresetSelectorProps {
    /** Array of user's custom presets */
    customPresets: CustomPreset[];
    /** Handler for selecting a built-in preset */
    onPresetSelect?: (preset: ComicPreset) => void;
    /** Handler for selecting a custom preset */
    onCustomPresetSelect: (preset: CustomPreset) => void;
    /** Handler for deleting a custom preset */
    onDeleteCustomPreset: (presetId: string) => void;
    /** Handler for opening the save preset modal */
    onOpenSavePresetModal: () => void;
}

/**
 * PresetSelector component for choosing quick start presets.
 * Displays both built-in and custom user presets.
 */
export const PresetSelector: React.FC<PresetSelectorProps> = ({
    customPresets,
    onPresetSelect,
    onCustomPresetSelect,
    onDeleteCustomPreset,
    onOpenSavePresetModal
}) => {
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        // Check if it's a custom preset
        if (value.startsWith('custom-')) {
            const customPreset = customPresets.find(p => p.id === value);
            if (customPreset) {
                onCustomPresetSelect(customPreset);
            }
        } else {
            // Built-in preset
            const preset = COMIC_PRESETS.find(p => p.id === value);
            if (preset && onPresetSelect) {
                onPresetSelect(preset);
            }
        }
    };

    return (
        <div className="mb-3">
            <div className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase flex items-center justify-between">
                <div className="flex items-center">
                    QUICK START PRESET
                    <Tooltip text="Select a preset to auto-fill genre, art style, page length, and story description. You can still customize everything after selection." />
                </div>
                <button
                    onClick={onOpenSavePresetModal}
                    className="comic-btn bg-green-600 text-white text-[10px] px-2 py-0.5 hover:bg-green-500 border-2 border-black uppercase"
                    title="Save current configuration as a custom preset"
                    aria-label="Save current configuration as preset"
                >
                    + SAVE AS PRESET
                </button>
            </div>
            <select
                value=""
                onChange={handleSelectChange}
                className="w-full font-comic text-sm p-1.5 border-2 border-black bg-gradient-to-r from-yellow-50 to-orange-50 text-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:from-yellow-100 hover:to-orange-100"
                aria-label="Select a preset"
            >
                <option value="" className="text-gray-500">-- Select a preset to get started --</option>
                {customPresets.length > 0 && (
                    <optgroup label="--- MY CUSTOM PRESETS ---">
                        {customPresets.map(p => (
                            <option key={p.id} value={p.id} className="text-black" title={p.description || `${p.genre} - ${p.artStyle}`}>
                                {p.name} ({p.pageLength} pages)
                            </option>
                        ))}
                    </optgroup>
                )}
                <optgroup label="--- BUILT-IN PRESETS ---">
                    {COMIC_PRESETS.map(p => (
                        <option key={p.id} value={p.id} className="text-black" title={p.description}>
                            {p.name} ({p.pageLength} pages)
                        </option>
                    ))}
                </optgroup>
            </select>
            {/* Custom preset management - show delete option when custom presets exist */}
            {customPresets.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                    {customPresets.map(p => (
                        <div key={p.id} className="bg-yellow-100 border border-black px-1.5 py-0.5 text-[9px] font-comic flex items-center gap-1">
                            <span className="truncate max-w-[80px]" title={p.name}>{p.name}</span>
                            <button
                                onClick={() => onDeleteCustomPreset(p.id)}
                                className="text-red-600 font-bold hover:scale-110 text-sm leading-none"
                                title={`Delete "${p.name}" preset`}
                                aria-label={`Delete ${p.name} preset`}
                            >×</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PresetSelector;
