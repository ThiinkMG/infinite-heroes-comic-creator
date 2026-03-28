/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';

export interface RefImage {
    id: string;
    base64: string;
    label: string;   // e.g. "Hero Portrait", "Co-Star Ref 2"
    charId: string;  // which persona it belongs to
}

interface ReferenceImageGalleryProps {
    allRefImages: RefImage[];
    selectedIds: Set<string>;
    deleteMode: boolean;
    onToggleImage: (id: string) => void;
    onToggleDeleteMode: () => void;
    onSelectAll: () => void;
    onSelectNone: () => void;
    onDeleteRef: (charId: string, refIndex: number) => void;
    onUploadRef: (files: FileList) => void;
}

export const ReferenceImageGallery: React.FC<ReferenceImageGalleryProps> = ({
    allRefImages,
    selectedIds,
    deleteMode,
    onToggleImage,
    onToggleDeleteMode,
    onSelectAll,
    onSelectNone,
    onDeleteRef,
    onUploadRef
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDeleteClick = (img: RefImage) => {
        // Find the index within the character's referenceImages
        const sameCharImages = allRefImages.filter(r => r.charId === img.charId);
        const refIdx = sameCharImages.indexOf(img);
        if (refIdx >= 0) onDeleteRef(img.charId, refIdx);
    };

    return (
        <div className="border-[3px] border-black bg-purple-50 p-3 sm:p-4">
            {/* Header with selection count */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <p className="font-comic text-sm sm:text-base font-bold uppercase text-purple-900">
                    🖼️ Reference Images ({selectedIds.size}/{allRefImages.length})
                </p>
                {/* Action buttons - full width on mobile */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={onSelectAll}
                        className="comic-btn bg-green-600 text-white text-xs sm:text-sm min-h-[48px] min-w-[48px] px-3 sm:px-4 py-2 border-[2px] border-black font-bold touch-manipulation"
                        aria-label="Select all reference images"
                    >
                        All
                    </button>
                    <button
                        onClick={onSelectNone}
                        className="comic-btn bg-gray-500 text-white text-xs sm:text-sm min-h-[48px] min-w-[48px] px-3 sm:px-4 py-2 border-[2px] border-black font-bold touch-manipulation"
                        aria-label="Deselect all reference images"
                    >
                        None
                    </button>
                    <button
                        onClick={onToggleDeleteMode}
                        className={`comic-btn text-xs sm:text-sm min-h-[44px] px-3 sm:px-4 py-2 border-[2px] border-black font-bold touch-manipulation ${deleteMode ? 'bg-red-600 text-white' : 'bg-gray-300 text-black'}`}
                        aria-label={deleteMode ? "Exit delete mode" : "Enter delete mode"}
                    >
                        {deleteMode ? '🗑️ Done' : '🗑️ Delete'}
                    </button>
                </div>
            </div>

            {allRefImages.length === 0 ? (
                <p className="text-gray-500 font-comic text-sm sm:text-base text-center py-6">No reference images uploaded yet.</p>
            ) : (
                /* Touch-friendly scrollable gallery with larger thumbnails on mobile */
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 max-h-56 sm:max-h-64 overflow-y-auto p-1 -webkit-overflow-scrolling-touch overscroll-contain">
                    {allRefImages.map((img) => (
                        <div
                            key={img.id}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (deleteMode) {
                                        handleDeleteClick(img);
                                    } else {
                                        onToggleImage(img.id);
                                    }
                                }
                            }}
                            className={`relative cursor-pointer group border-[3px] transition-all touch-manipulation rounded-sm ${
                                deleteMode
                                    ? 'border-red-400 active:border-red-600'
                                    : selectedIds.has(img.id)
                                        ? 'border-green-500 ring-2 ring-green-400 shadow-[2px_2px_0px_rgba(0,128,0,0.5)]'
                                        : 'border-gray-300 opacity-60 active:opacity-100 hover:opacity-80'
                            }`}
                            onClick={() => {
                                if (deleteMode) {
                                    handleDeleteClick(img);
                                } else {
                                    onToggleImage(img.id);
                                }
                            }}
                        >
                            <img
                                src={`data:image/jpeg;base64,${img.base64}`}
                                alt={img.label}
                                className="w-full aspect-square object-cover"
                                loading="lazy"
                            />
                            {/* Selection checkmark - larger and more visible on mobile */}
                            {!deleteMode && selectedIds.has(img.id) && (
                                <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center text-sm sm:text-xs font-bold border-2 border-white shadow-md">✓</div>
                            )}
                            {/* Delete overlay - always visible on mobile in delete mode */}
                            {deleteMode && (
                                <div className="absolute inset-0 bg-red-600/40 sm:bg-red-600/30 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-2xl sm:text-xl font-bold drop-shadow-lg">✕</span>
                                </div>
                            )}
                            {/* Label - slightly larger on mobile */}
                            <div className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[9px] sm:text-[8px] font-comic text-center py-1 sm:py-0.5 truncate px-1">
                                {img.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload New Reference - larger touch target */}
            <div className="mt-4">
                <label className="comic-btn bg-blue-500 text-white text-sm sm:text-base min-h-[48px] px-4 sm:px-6 py-3 border-[2px] border-black hover:bg-blue-400 active:bg-blue-600 cursor-pointer font-bold inline-flex items-center justify-center touch-manipulation">
                    ⬆️ Upload New Reference
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        aria-label="Upload reference images"
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
    );
};
