/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RegenerationMode } from '../../types';
import { HelpTooltip } from '../HelpTooltip';

interface RegenerationModeOption {
    mode: RegenerationMode;
    label: string;
    desc: string;
    tooltip: string;
}

const REGENERATION_OPTIONS: RegenerationModeOption[] = [
    { mode: 'full', label: '🎲 Full Reroll', desc: 'Regenerate entire panel from scratch', tooltip: 'Completely regenerates the panel with new composition, characters, and background' },
    { mode: 'characters_only', label: '👥 Characters Only', desc: 'Keep scene/background, refresh characters', tooltip: 'Keeps the same scene and background, but regenerates how characters appear' },
    { mode: 'expression_only', label: '😊 Expression Only', desc: 'Keep everything, change facial expression', tooltip: 'Minimal change - only adjusts character facial expressions' },
    { mode: 'outfit_only', label: '👔 Outfit Only', desc: 'Keep everything, change clothing', tooltip: 'Keeps poses and scene, but changes what characters are wearing' },
    { mode: 'emblem_only', label: '⭐ Update Emblem', desc: 'Fix/update emblem or logo', tooltip: 'Updates the emblem/logo using your uploaded emblem reference or instructions. Can combine with other modes.' },
    { mode: 'weapon_only', label: '⚔️ Update Weapon', desc: 'Fix/update signature weapon', tooltip: 'Updates the weapon using your uploaded weapon reference or instructions. Can combine with other modes.' }
];

interface RegenerationModeSelectorProps {
    selectedModes: Set<RegenerationMode>;
    onToggleMode: (mode: RegenerationMode) => void;
}

export const RegenerationModeSelector: React.FC<RegenerationModeSelectorProps> = ({
    selectedModes,
    onToggleMode
}) => {
    const showWarning = selectedModes.has('characters_only') || (selectedModes as Set<string>).has('background_only');

    return (
        <div className="border-[3px] border-black bg-indigo-50 p-3 sm:p-4">
            <div className="font-comic text-sm sm:text-base font-bold uppercase text-indigo-900 mb-1 sm:mb-2 flex items-center flex-wrap gap-1">
                🔄 Regeneration Mode
                <HelpTooltip
                    title="Regeneration Modes"
                    text="Full Reroll creates a new panel. Other modes try to preserve parts of the scene. Combine modes (e.g., Characters + Emblem) for targeted fixes."
                    position="right"
                />
            </div>
            <p className="font-comic text-xs text-indigo-600 mb-3">(Select one or more options)</p>
            {/* Grid: 1 column on mobile, 2 columns on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {REGENERATION_OPTIONS.map(opt => (
                    <button
                        key={opt.mode}
                        type="button"
                        title={opt.tooltip}
                        onClick={() => onToggleMode(opt.mode)}
                        className={`flex items-start gap-3 p-3 sm:p-4 border-2 cursor-pointer transition-all text-left touch-manipulation min-h-[56px] sm:min-h-[64px] ${
                            selectedModes.has(opt.mode)
                                ? 'border-indigo-500 bg-indigo-100 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]'
                                : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100'
                        }`}
                    >
                        {/* Larger checkbox for touch */}
                        <div className={`w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            selectedModes.has(opt.mode) ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400 bg-white'
                        }`}>
                            {selectedModes.has(opt.mode) && <span className="text-white text-sm sm:text-xs font-bold">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="font-comic text-sm sm:text-base font-bold block">{opt.label}</span>
                            <span className="font-comic text-xs sm:text-sm text-gray-500 block mt-0.5">{opt.desc}</span>
                        </div>
                    </button>
                ))}
            </div>
            {selectedModes.size === 0 && (
                <p className="text-xs text-indigo-600 font-comic mt-3 italic">No mode selected - will use default behavior</p>
            )}

            {/* Scene Preservation Warning */}
            {showWarning && (
                <div className="mt-3 p-3 bg-amber-100 border-2 border-amber-400 rounded flex items-start gap-2">
                    <span className="text-amber-700 text-base font-bold flex-shrink-0">⚠️</span>
                    <div>
                        <p className="text-xs sm:text-sm text-amber-800 font-comic">
                            <span className="font-bold">Note:</span> Background may change slightly. Gemini cannot truly preserve scenes.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
