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
                    className="text-gray-500 hover:text-black active:text-black text-xl min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation -mr-2"
                    aria-label="Close tips panel"
                >
                    ✕
                </button>
            </div>

            {/* Mobile: Show only most important tips in accordion style */}
            <div className="space-y-3 text-sm font-comic">
                {/* Pro Tips - Most Important, shown first on mobile */}
                <div className="bg-yellow-100 border-2 border-yellow-400 p-3 sm:p-4 rounded sm:order-last">
                    <p className="font-bold text-yellow-800 mb-2 text-sm sm:text-base">⚡ Quick Tips</p>
                    <ul className="list-disc ml-4 text-yellow-900 space-y-2 text-xs sm:text-sm">
                        <li><strong>Combine modes</strong> for targeted fixes</li>
                        <li><strong>Be specific</strong> in instructions</li>
                        <li>Use <strong>AI Improve</strong> button</li>
                        <li>Edit profiles if AI gets features wrong</li>
                    </ul>
                </div>

                {/* Collapsible sections on mobile */}
                <details className="bg-white border-2 border-green-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-green-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>🎭 Fix Characters (Keep Scene)</span>
                        <span className="group-open:rotate-180 transition-transform text-green-500">▼</span>
                    </summary>
                    <ul className="list-disc ml-6 text-gray-700 space-y-2 px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm">
                        <li>Select <strong>"Characters Only"</strong> mode</li>
                        <li>Enable reference images</li>
                        <li>Describe what's wrong in instructions</li>
                    </ul>
                </details>

                <details className="bg-white border-2 border-amber-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-amber-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>⭐ Fix Emblem / ⚔️ Weapon</span>
                        <span className="group-open:rotate-180 transition-transform text-amber-500">▼</span>
                    </summary>
                    <ul className="list-disc ml-6 text-gray-700 space-y-2 px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm">
                        <li>Select <strong>"Update Emblem"</strong> or <strong>"Update Weapon"</strong></li>
                        <li>Upload reference image if needed</li>
                        <li>Combine with "Characters Only" to keep background</li>
                    </ul>
                </details>

                <details className="bg-white border-2 border-purple-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-purple-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>👕 Change Outfit</span>
                        <span className="group-open:rotate-180 transition-transform text-purple-500">▼</span>
                    </summary>
                    <ul className="list-disc ml-6 text-gray-700 space-y-2 px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm">
                        <li>Select <strong>"Outfit Only"</strong> mode</li>
                        <li>Describe the change</li>
                        <li>Use negative prompt: "no cape, no mask"</li>
                    </ul>
                </details>

                <details className="bg-white border-2 border-blue-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-blue-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>🖼️ Use Panels as References</span>
                        <span className="group-open:rotate-180 transition-transform text-blue-500">▼</span>
                    </summary>
                    <ul className="list-disc ml-6 text-gray-700 space-y-2 px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm">
                        <li>Download a good panel and upload as reference</li>
                        <li>Helps maintain consistent poses & lighting</li>
                        <li>Great for keeping scene composition</li>
                    </ul>
                </details>

                <details className="bg-white border-2 border-pink-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-pink-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>😊 Change Expression</span>
                        <span className="group-open:rotate-180 transition-transform text-pink-500">▼</span>
                    </summary>
                    <ul className="list-disc ml-6 text-gray-700 space-y-2 px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm">
                        <li>Select <strong>"Expression Only"</strong> mode</li>
                        <li>Describe the emotion clearly</li>
                        <li>Best for subtle changes</li>
                    </ul>
                </details>

                <details className="bg-white border-2 border-gray-300 rounded group">
                    <summary className="p-3 sm:p-4 cursor-pointer font-bold text-gray-700 text-sm sm:text-base list-none flex justify-between items-center touch-manipulation min-h-[48px]">
                        <span>🎲 Full Reroll Tips</span>
                        <span className="group-open:rotate-180 transition-transform text-gray-500">▼</span>
                    </summary>
                    <ul className="list-disc ml-6 text-gray-700 space-y-2 px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm">
                        <li>Always enable reference images</li>
                        <li>Use camera shot override</li>
                        <li>Edit character profiles if needed</li>
                        <li>Use negative prompts for unwanted elements</li>
                    </ul>
                </details>
            </div>
        </div>
    );
};
