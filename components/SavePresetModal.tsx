/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

/**
 * Props for the SavePresetModal component.
 */
export interface SavePresetModalProps {
    /** Whether the modal is visible */
    show: boolean;
    /** Currently selected genre (for preview) */
    selectedGenre: string;
    /** Currently selected art style (for preview) */
    artStyle: string;
    /** Currently selected page length (for preview) */
    pageLength: number;
    /** Current story description text (for preview) */
    storyDescriptionText: string;
    /** Handler for closing the modal */
    onClose: () => void;
    /** Handler for saving the preset */
    onSave: (name: string, description: string) => void;
}

/**
 * SavePresetModal component for saving current configuration as a custom preset.
 * Shows a preview of what will be saved.
 */
export const SavePresetModal: React.FC<SavePresetModalProps> = ({
    show,
    selectedGenre,
    artStyle,
    pageLength,
    storyDescriptionText,
    onClose,
    onSave
}) => {
    const [presetName, setPresetName] = useState('');
    const [presetDescription, setPresetDescription] = useState('');

    if (!show) return null;

    const handleSave = () => {
        if (!presetName.trim()) return;
        onSave(presetName.trim(), presetDescription.trim());
        setPresetName('');
        setPresetDescription('');
    };

    const handleClose = () => {
        setPresetName('');
        setPresetDescription('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={handleClose}>
            <div className="max-w-[400px] w-full bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={handleClose}
                    className="absolute -top-4 -right-4 bg-red-600 text-white w-10 h-10 border-4 border-black font-bold text-xl flex items-center justify-center hover:scale-110 hover:bg-red-500"
                    aria-label="Close save preset modal"
                >×</button>

                <h2 className="font-comic text-2xl text-yellow-600 mb-4 uppercase tracking-tighter text-center" style={{textShadow: '1px 1px 0px black'}}>Save as Preset</h2>

                <div className="space-y-4">
                    <div>
                        <label className="font-comic text-sm font-bold text-gray-800 uppercase block mb-1">
                            Preset Name <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="My Awesome Preset"
                            className="w-full p-2 border-2 border-black font-comic text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
                            autoFocus
                            aria-label="Preset name"
                        />
                    </div>

                    <div>
                        <label className="font-comic text-sm font-bold text-gray-800 uppercase block mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={presetDescription}
                            onChange={(e) => setPresetDescription(e.target.value)}
                            placeholder="A brief description of this preset..."
                            className="w-full p-2 border-2 border-black font-comic text-sm h-16 resize-none shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
                            aria-label="Preset description"
                        />
                    </div>

                    <div className="bg-yellow-50 border-2 border-black p-3 text-xs font-comic">
                        <p className="font-bold text-gray-700 uppercase mb-2">This preset will save:</p>
                        <ul className="text-gray-600 space-y-1">
                            <li>Genre: <span className="text-black font-bold">{selectedGenre}</span></li>
                            <li>Art Style: <span className="text-black font-bold">{artStyle}</span></li>
                            <li>Page Length: <span className="text-black font-bold">{pageLength} pages</span></li>
                            <li>Story Description: <span className="text-black font-bold">{storyDescriptionText ? `${storyDescriptionText.substring(0, 50)}...` : '(empty)'}</span></li>
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleClose}
                            className="flex-1 comic-btn bg-gray-400 text-white px-4 py-2 font-bold border-2 border-black hover:bg-gray-300 uppercase text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!presetName.trim()}
                            className="flex-1 comic-btn bg-green-600 text-white px-4 py-2 font-bold border-2 border-black hover:bg-green-500 uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Preset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavePresetModal;
