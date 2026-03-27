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

                <div className="space-y-3 font-comic text-sm md:text-base mb-6 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">1</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Build Your Cast</p>
                            <p className="text-gray-700">Upload <strong>portraits</strong> (required) and <strong>reference images</strong> for your Hero and Co-Star. Add emblems, weapons, and detailed descriptions to help the AI maintain character consistency!</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">2</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Set The Scene</p>
                            <p className="text-gray-700">Pick a <strong>genre</strong>, <strong>art style</strong>, and write a detailed premise. Upload scripts or backstory documents to give the AI rich context!</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">3</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Review Character Profiles</p>
                            <p className="text-gray-700">After clicking Start, review and edit AI-generated visual profiles for each character. Edit face, clothing, emblem, mask, and weapon descriptions to ensure consistency!</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">4</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Choose A Mode</p>
                            <p className="text-gray-700"><strong>🎲 Novel Mode:</strong> Generates pages in batches, pauses for your narrative choices. Your decisions shape the story!<br/><strong>📖 Outline Mode:</strong> Generates a full story outline for review, then automates the entire comic.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">5</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Reroll & Refine</p>
                            <p className="text-gray-700">Not happy with a page? Use the <strong>reroll system</strong> to regenerate with custom instructions. Add <strong>negative prompts</strong> to exclude unwanted elements!</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black flex-shrink-0">6</span>
                        <div>
                            <p className="font-bold text-lg leading-tight uppercase">Read & Export</p>
                            <p className="text-gray-700">Read your comic in the built-in reader with page-flip animations! Export as <strong>PDF</strong> or individual <strong>PNG/WEBP/JPEG</strong> images.</p>
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3">
                        <p className="font-bold text-sm text-purple-700 uppercase">Pro Tips</p>
                        <ul className="text-gray-600 text-xs space-y-1 mt-1 list-disc list-inside">
                            <li>More reference images = better character consistency</li>
                            <li>Upload emblem/logo images for iconic symbols (like Superman's S)</li>
                            <li>Use the Gallery to replace individual pages with your own images</li>
                            <li>Save your draft often - you can reload and continue later!</li>
                        </ul>
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
