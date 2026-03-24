/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';

interface RefImage {
    id: string;
    base64: string;
    label: string;   // e.g. "Hero Portrait", "Co-Star Ref 2"
    charId: string;   // which persona it belongs to
}

interface RerollModalProps {
    pageIndex: number;
    outline: string;
    allRefImages: RefImage[];
    availableProfiles: { id: string, name: string }[];
    onSubmit: (instruction: string, selectedRefImages: string[], selectedProfileIds: string[]) => void;
    onClose: () => void;
    onUploadRef: (files: FileList) => void;
    onDeleteRef: (charId: string, refIndex: number) => void;
}

export const RerollModal: React.FC<RerollModalProps> = ({
    pageIndex,
    outline,
    allRefImages,
    availableProfiles,
    onSubmit,
    onClose,
    onUploadRef,
    onDeleteRef
}) => {
    const [instruction, setInstruction] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(allRefImages.map(r => r.id)));
    const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set(availableProfiles.map(p => p.id)));
    const [deleteMode, setDeleteMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleImage = (id: string) => {
        if (deleteMode) return;
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleProfile = (id: string) => {
        setSelectedProfileIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSubmit = () => {
        const selected = allRefImages
            .filter(r => selectedIds.has(r.id))
            .map(r => r.base64);
        onSubmit(instruction, selected, Array.from(selectedProfileIds));
    };

    const handleDownloadOutline = () => {
        const blob = new Blob([outline], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comic-outline.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const selectAll = () => setSelectedIds(new Set(allRefImages.map(r => r.id)));
    const selectNone = () => setSelectedIds(new Set());

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-[6px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-[750px] w-full max-h-[90vh] overflow-y-auto m-4 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-yellow-400 border-b-[4px] border-black px-6 py-3 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="font-comic text-2xl font-bold uppercase tracking-wider text-black">
                        🎲 Reroll Panel #{pageIndex}
                    </h2>
                    <button
                        onClick={onClose}
                        className="comic-btn bg-red-600 text-white w-10 h-10 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500"
                    >✕</button>
                </div>

                <div className="p-5 flex flex-col gap-5">

                    {/* Story Outline Section */}
                    {outline && (
                        <div className="border-[3px] border-black bg-blue-50 p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-comic text-sm font-bold uppercase text-blue-900">📖 Story Outline</p>
                                <button
                                    onClick={handleDownloadOutline}
                                    className="comic-btn bg-blue-600 text-white text-xs px-3 py-1 border-[2px] border-black hover:bg-blue-500 font-bold"
                                >⬇ Download</button>
                            </div>
                            <pre className="text-xs font-mono bg-white border-2 border-gray-300 p-3 max-h-32 overflow-y-auto whitespace-pre-wrap text-gray-700">
                                {outline}
                            </pre>
                        </div>
                    )}

                    {/* Instruction Text Input */}
                    <div className="border-[3px] border-black bg-green-50 p-4">
                        <p className="font-comic text-sm font-bold uppercase text-green-900 mb-2">
                            ✍️ Regeneration Instructions
                        </p>
                        <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="e.g. 'Make the hero look determined', 'Change background to a rooftop at sunset', 'Close-up on the villain's face'..."
                            className="w-full p-3 border-2 border-black font-comic text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Reference Image Gallery */}
                    <div className="border-[3px] border-black bg-purple-50 p-4">
                        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                            <p className="font-comic text-sm font-bold uppercase text-purple-900">
                                🖼️ Reference Images ({selectedIds.size}/{allRefImages.length} selected)
                            </p>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="comic-btn bg-green-600 text-white text-xs px-2 py-1 border-[2px] border-black font-bold">All</button>
                                <button onClick={selectNone} className="comic-btn bg-gray-500 text-white text-xs px-2 py-1 border-[2px] border-black font-bold">None</button>
                                <button
                                    onClick={() => setDeleteMode(!deleteMode)}
                                    className={`comic-btn text-xs px-2 py-1 border-[2px] border-black font-bold ${deleteMode ? 'bg-red-600 text-white' : 'bg-gray-300 text-black'}`}
                                >
                                    {deleteMode ? '🗑️ Done Deleting' : '🗑️ Delete Mode'}
                                </button>
                            </div>
                        </div>

                        {allRefImages.length === 0 ? (
                            <p className="text-gray-500 font-comic text-sm text-center py-4">No reference images uploaded yet.</p>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                                {allRefImages.map((img) => (
                                    <div
                                        key={img.id}
                                        className={`relative cursor-pointer group border-[3px] transition-all ${
                                            deleteMode
                                                ? 'border-red-400 hover:border-red-600'
                                                : selectedIds.has(img.id)
                                                    ? 'border-green-500 ring-2 ring-green-400 shadow-[2px_2px_0px_rgba(0,128,0,0.5)]'
                                                    : 'border-gray-300 opacity-50 hover:opacity-80'
                                        }`}
                                        onClick={() => {
                                            if (deleteMode) {
                                                // Find the index within the character's referenceImages
                                                const sameCharImages = allRefImages.filter(r => r.charId === img.charId);
                                                const refIdx = sameCharImages.indexOf(img);
                                                if (refIdx >= 0) onDeleteRef(img.charId, refIdx);
                                            } else {
                                                toggleImage(img.id);
                                            }
                                        }}
                                    >
                                        <img
                                            src={`data:image/jpeg;base64,${img.base64}`}
                                            alt={img.label}
                                            className="w-full aspect-square object-cover"
                                        />
                                        {/* Selection checkmark */}
                                        {!deleteMode && selectedIds.has(img.id) && (
                                            <div className="absolute top-0.5 right-0.5 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-white">✓</div>
                                        )}
                                        {/* Delete overlay */}
                                        {deleteMode && (
                                            <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-2xl font-bold">✕</span>
                                            </div>
                                        )}
                                        {/* Label */}
                                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] font-comic text-center py-0.5 truncate px-1">
                                            {img.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload New Reference */}
                        <div className="mt-3">
                            <label className="comic-btn bg-blue-500 text-white text-sm px-4 py-2 border-[2px] border-black hover:bg-blue-400 cursor-pointer font-bold inline-block">
                                ⬆️ Upload New Reference
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            onUploadRef(e.target.files);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Character Profiles Toggle */}
                    {availableProfiles.length > 0 && (
                        <div className="border-[3px] border-black bg-orange-50 p-4">
                            <div className="mb-2 border-b-2 border-orange-200 pb-2">
                                <p className="font-comic font-bold text-sm uppercase text-orange-900">
                                    🧬 Enforce AI Character Profiles
                                </p>
                                <p className="font-comic text-xs text-orange-700 mt-0.5">
                                    Inject character face/clothing descriptions into the prompt for consistency.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {availableProfiles.map(p => (
                                    <label key={p.id} className={`flex items-center gap-2 p-2 border-2 cursor-pointer transition-colors ${selectedProfileIds.has(p.id) ? 'border-orange-500 bg-orange-100' : 'border-gray-300 bg-white opacity-70 hover:opacity-100'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedProfileIds.has(p.id)}
                                            onChange={() => toggleProfile(p.id)}
                                            className="w-4 h-4 accent-orange-600 cursor-pointer"
                                        />
                                        <span className="font-comic text-xs font-bold truncate" title={p.name}>{p.name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setSelectedProfileIds(new Set(availableProfiles.map(p => p.id)))} className="text-[10px] font-comic font-bold text-orange-700 hover:text-orange-900 uppercase">Select All</button>
                                <span className="text-[10px] text-orange-300">|</span>
                                <button onClick={() => setSelectedProfileIds(new Set())} className="text-[10px] font-comic font-bold text-orange-700 hover:text-orange-900 uppercase">Select None</button>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        className="comic-btn w-full bg-yellow-400 text-black py-4 text-2xl font-bold uppercase tracking-wider border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:-translate-y-1 transition-transform"
                    >
                        🎲 Reroll Panel #{pageIndex}
                    </button>
                </div>
            </div>
        </div>
    );
};
