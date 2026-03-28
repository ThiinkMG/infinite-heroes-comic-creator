/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface TipsPanelProps {
    onClose: () => void;
}

export const TipsPanel: React.FC<TipsPanelProps> = ({ onClose }) => {
    return (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b-[4px] border-black p-3 sm:p-5 max-h-[60vh] sm:max-h-none overflow-y-auto -webkit-overflow-scrolling-touch">
            <div className="flex justify-between items-start gap-2 mb-3 sticky top-0 bg-gradient-to-r from-green-50 to-blue-50 pb-2 -mt-3 pt-3 sm:static sm:bg-transparent sm:pb-0 sm:mt-0 sm:pt-0">
                <h3 className="font-comic text-base sm:text-lg font-bold text-green-800 uppercase">💡 Tips</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-black active:text-black text-xl min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation -mr-2"
                    aria-label="Close tips panel"
                >
                    ✕
                </button>
            </div>

            {/* How Reroll Works - Quick Start */}
            <div className="space-y-3 text-sm font-comic">
                <div className="bg-blue-100 border-2 border-blue-400 p-3 sm:p-4 rounded">
                    <p className="font-bold text-blue-800 mb-2 text-sm sm:text-base">🚀 How Reroll Works</p>
                    <ol className="list-decimal ml-4 text-blue-900 space-y-1 text-xs sm:text-sm">
                        <li><strong>Write instructions</strong> describing what you want changed</li>
                        <li><strong>Select a mode</strong> to focus on specific elements</li>
                        <li><strong>Enable references</strong> for better character accuracy</li>
                        <li>Click <strong>Regenerate</strong> and wait ~15 seconds</li>
                    </ol>
                </div>

                {/* Pro Tips - Most Important */}
                <div className="bg-yellow-100 border-2 border-yellow-400 p-3 sm:p-4 rounded">
                    <p className="font-bold text-yellow-800 mb-2 text-sm sm:text-base">⚡ Pro Tips</p>
                    <ul className="list-disc ml-4 text-yellow-900 space-y-2 text-xs sm:text-sm">
                        <li><strong>Click "AI Improve"</strong> to auto-enhance your instructions</li>
                        <li><strong>Combine modes:</strong> "Characters Only" + "Update Emblem" = fix emblem without changing background</li>
                        <li><strong>Be specific:</strong> "shorter brown hair" works better than "fix hair"</li>
                        <li><strong>Edit Hard Negatives</strong> in profiles to permanently exclude unwanted features</li>
                    </ul>
                </div>

                {/* Common Fixes - Collapsible */}
                <details className="bg-white border-2 border-green-300 rounded group" open>
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-green-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>🔧 Common Fixes</span>
                        <span className="group-open:rotate-180 transition-transform text-green-500">▼</span>
                    </summary>
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm space-y-3">
                        <div className="border-l-4 border-green-400 pl-3">
                            <p className="font-bold text-gray-800">Wrong face/hair/skin tone?</p>
                            <p className="text-gray-600">Mode: <strong>Characters Only</strong> + Enable all references + Instruction: "Match the hero's face exactly from reference"</p>
                        </div>
                        <div className="border-l-4 border-amber-400 pl-3">
                            <p className="font-bold text-gray-800">Emblem missing or wrong?</p>
                            <p className="text-gray-600">Mode: <strong>Update Emblem</strong> + Upload emblem reference + Instruction: "Add [emblem name] on chest"</p>
                        </div>
                        <div className="border-l-4 border-purple-400 pl-3">
                            <p className="font-bold text-gray-800">Wrong outfit/costume?</p>
                            <p className="text-gray-600">Mode: <strong>Outfit Only</strong> + Instruction: "Change to [describe outfit], no cape" (use negatives!)</p>
                        </div>
                        <div className="border-l-4 border-blue-400 pl-3">
                            <p className="font-bold text-gray-800">Bad composition/pose?</p>
                            <p className="text-gray-600">Mode: <strong>Full Reroll</strong> + Use Camera Shot Override (e.g., "medium shot", "wide establishing shot")</p>
                        </div>
                    </div>
                </details>

                <details className="bg-white border-2 border-purple-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-purple-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>🎛️ Expert Mode Features</span>
                        <span className="group-open:rotate-180 transition-transform text-purple-500">▼</span>
                    </summary>
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm space-y-2">
                        <p className="text-gray-700"><strong>Camera Shot Override:</strong> Force specific framing - "extreme close-up", "over-the-shoulder shot", "bird's eye view"</p>
                        <p className="text-gray-700"><strong>Negative Prompts:</strong> Add things to avoid - "no beard, no glasses, no background characters"</p>
                        <p className="text-gray-700"><strong>Style Override:</strong> Change art style for this panel only - "watercolor style", "noir with heavy shadows"</p>
                        <p className="text-gray-700"><strong>Temperature:</strong> Higher = more creative/varied, Lower = more consistent/predictable</p>
                    </div>
                </details>

                <details className="bg-white border-2 border-blue-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-blue-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>🖼️ Reference Images</span>
                        <span className="group-open:rotate-180 transition-transform text-blue-500">▼</span>
                    </summary>
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm space-y-2">
                        <p className="text-gray-700"><strong>Portrait:</strong> Always enable for face consistency. More portraits = better accuracy.</p>
                        <p className="text-gray-700"><strong>Emblem/Logo:</strong> Upload clear, isolated emblem images for iconic symbols.</p>
                        <p className="text-gray-700"><strong>Weapon:</strong> Reference images help maintain weapon design across panels.</p>
                        <p className="text-gray-700"><strong>Good panel as reference:</strong> Download a panel you like and upload it to maintain style/composition.</p>
                    </div>
                </details>

                <details className="bg-white border-2 border-gray-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-gray-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>📜 History & Undo</span>
                        <span className="group-open:rotate-180 transition-transform text-gray-500">▼</span>
                    </summary>
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm space-y-2">
                        <p className="text-gray-700">Each page keeps up to <strong>10 previous versions</strong>. Click any thumbnail in History to revert.</p>
                        <p className="text-gray-700">History shows what instructions were used for each version - learn what works!</p>
                        <p className="text-gray-700">Use <strong>"Clear History"</strong> to free memory if needed.</p>
                    </div>
                </details>
            </div>
        </div>
    );
};
