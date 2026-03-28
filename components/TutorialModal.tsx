/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Props for the TutorialModal component.
 */
export interface TutorialModalProps {
    /** Whether the modal is visible */
    show: boolean;
    /** Handler for closing the modal */
    onClose: () => void;
}

/**
 * TutorialModal component displaying how-to-use instructions for the app.
 * Shows a step-by-step guide with pro tips.
 */
export const TutorialModal: React.FC<TutorialModalProps> = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-[700px] w-full bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] relative">
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 bg-red-600 text-white w-10 h-10 border-4 border-black font-bold text-xl flex items-center justify-center hover:scale-110 hover:bg-red-500"
                    aria-label="Close tutorial"
                >×</button>

                <h2 className="font-comic text-4xl text-blue-600 mb-6 uppercase tracking-tighter text-center">How To Use</h2>

                <div className="space-y-4 font-comic text-sm md:text-base mb-6 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">1</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Build Your Cast</p>
                            <p className="text-gray-700 mb-1">Upload <strong>portraits</strong> (required) for your Hero and Co-Star. Click the portrait to add more reference images.</p>
                            <ul className="text-gray-600 text-xs list-disc list-inside space-y-0.5">
                                <li><strong>Portrait:</strong> Clear face shot, front-facing works best</li>
                                <li><strong>Emblem:</strong> Upload logo/symbol images (like Superman's S)</li>
                                <li><strong>Weapon:</strong> Add weapon references for consistency</li>
                                <li><strong>Backstory:</strong> Write detailed descriptions - the AI uses this!</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">2</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Set The Scene</p>
                            <p className="text-gray-700 mb-1">Configure your story settings - these affect every page generated.</p>
                            <ul className="text-gray-600 text-xs list-disc list-inside space-y-0.5">
                                <li><strong>Genre:</strong> Sets narrative tone (superhero, horror, romance, etc.)</li>
                                <li><strong>Art Style:</strong> Visual style for all panels (manga, golden age, etc.)</li>
                                <li><strong>Premise:</strong> Write a detailed setup - more detail = better story!</li>
                                <li><strong>Page Length:</strong> Short (8-12), Standard (16-20), or Long (24-32)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">3</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Review Character Profiles</p>
                            <p className="text-gray-700 mb-1">After clicking Start, the AI analyzes your portraits and creates visual profiles.</p>
                            <ul className="text-gray-600 text-xs list-disc list-inside space-y-0.5">
                                <li><strong>Edit profiles</strong> if the AI gets features wrong (hair color, skin tone)</li>
                                <li><strong>Hard Negatives:</strong> Add things to NEVER include (glasses, beard, etc.)</li>
                                <li>Profiles are saved and reused - edit once, affects all pages!</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">4</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Choose A Mode</p>
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-2 rounded border border-purple-200 mb-1">
                                <p className="text-purple-800 text-xs"><strong>🎲 Novel Mode:</strong> Interactive! Story pauses at key moments for YOU to make choices. Great for exploring "what if" scenarios. Pages generate in batches.</p>
                            </div>
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-2 rounded border border-amber-200">
                                <p className="text-amber-800 text-xs"><strong>📖 Outline Mode:</strong> AI creates a full story outline first - you review and edit it before generation. Then the entire comic generates automatically. Best for planned stories.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">5</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Reroll & Refine</p>
                            <p className="text-gray-700 mb-1">Click any page to open the <strong>Reroll panel</strong> and regenerate it.</p>
                            <ul className="text-gray-600 text-xs list-disc list-inside space-y-0.5">
                                <li><strong>Modes:</strong> Full Reroll, Characters Only, Outfit Only, Expression, Emblem, Weapon</li>
                                <li><strong>Instructions:</strong> Tell the AI exactly what to change</li>
                                <li><strong>AI Improve:</strong> One-click to enhance your instructions</li>
                                <li><strong>History:</strong> Each page keeps 10 versions - revert anytime!</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">6</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Read & Export</p>
                            <p className="text-gray-700 mb-1">Your comic has a built-in reader with page-flip animations!</p>
                            <ul className="text-gray-600 text-xs list-disc list-inside space-y-0.5">
                                <li><strong>Gallery:</strong> View all pages, drag to reorder, replace with your own images</li>
                                <li><strong>Export PDF:</strong> High-quality print-ready comic book</li>
                                <li><strong>Export Images:</strong> Individual pages as PNG, WEBP, or JPEG</li>
                                <li><strong>Save Draft:</strong> Download your work to continue later</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3">
                        <p className="font-bold text-sm text-purple-700 uppercase mb-2">Pro Tips</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="bg-purple-50 p-2 rounded border border-purple-200">
                                <p className="text-purple-800"><strong>🎯 Consistency:</strong> More reference images = better character accuracy. Upload 2-3 angles of your character's face.</p>
                            </div>
                            <div className="bg-green-50 p-2 rounded border border-green-200">
                                <p className="text-green-800"><strong>💾 Save Often:</strong> Click "Save Draft" before closing. Your presets, profiles, and pages are all saved!</p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                <p className="text-blue-800"><strong>🖼️ Gallery Power:</strong> Drag pages to reorder. Click to replace with your own art. Mix AI + hand-drawn!</p>
                            </div>
                            <div className="bg-amber-50 p-2 rounded border border-amber-200">
                                <p className="text-amber-800"><strong>⚡ Quick Fix:</strong> Wrong colors? Edit the character profile's "Hard Negatives" to ban unwanted features permanently.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="comic-btn bg-green-600 text-white px-8 py-3 text-2xl font-bold w-full hover:bg-green-500"
                >GOT IT!</button>
            </div>
        </div>
    );
};

export default TutorialModal;
