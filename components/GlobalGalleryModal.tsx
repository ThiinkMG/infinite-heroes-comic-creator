/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GalleryImage, GalleryImageType, GalleryMode, galleryGetAll, galleryDelete, galleryDeleteMany, galleryDeleteAll } from '../hooks/useGalleryDB';

// ============================================================================
// TYPES
// ============================================================================

type SortKey = 'date_desc' | 'date_asc' | 'mode' | 'type';
type FilterMode = 'all' | GalleryMode;
type FilterType = 'all' | GalleryImageType;

interface GlobalGalleryModalProps {
    onClose: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const TYPE_LABELS: Record<GalleryImageType, string> = {
    cover: 'Cover',
    story: 'Story Page',
    back_cover: 'Back Cover',
    main: 'Main Image',
    emblem: 'Emblem',
    weapon: 'Weapon',
    reference: 'Reference Sheet'
};

const MODE_LABELS: Record<GalleryMode, string> = {
    novel: 'Novel',
    outline: 'Outline',
    single: 'Single Image'
};

const TYPE_COLORS: Record<GalleryImageType, string> = {
    cover: 'bg-red-500',
    story: 'bg-blue-500',
    back_cover: 'bg-gray-500',
    main: 'bg-green-500',
    emblem: 'bg-purple-500',
    weapon: 'bg-orange-500',
    reference: 'bg-teal-500'
};

const MODE_COLORS: Record<GalleryMode, string> = {
    novel: 'bg-blue-600',
    outline: 'bg-purple-600',
    single: 'bg-green-600'
};

function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function downloadImage(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GlobalGalleryModal: React.FC<GlobalGalleryModalProps> = ({ onClose }) => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('date_desc');
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [confirmClear, setConfirmClear] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const all = await galleryGetAll();
            setImages(all);
        } catch (e) {
            console.error('Failed to load gallery:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Keyboard handler
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (expandedId) setExpandedId(null);
                else onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [expandedId, onClose]);

    // Derived: unique modes and types for filter dropdowns
    const availableModes = useMemo(() => {
        const modes = new Set(images.map(i => i.mode).filter(Boolean) as GalleryMode[]);
        return Array.from(modes);
    }, [images]);

    const availableTypes = useMemo(() => {
        const types = new Set(images.map(i => i.type));
        return Array.from(types);
    }, [images]);

    // Filtered + sorted
    const displayed = useMemo(() => {
        let list = images.filter(img => {
            if (filterMode !== 'all' && img.mode !== filterMode) return false;
            if (filterType !== 'all' && img.type !== filterType) return false;
            return true;
        });

        switch (sortKey) {
            case 'date_desc': list = [...list].sort((a, b) => b.createdAt - a.createdAt); break;
            case 'date_asc': list = [...list].sort((a, b) => a.createdAt - b.createdAt); break;
            case 'mode': list = [...list].sort((a, b) => (a.mode || '').localeCompare(b.mode || '')); break;
            case 'type': list = [...list].sort((a, b) => a.type.localeCompare(b.type)); break;
        }
        return list;
    }, [images, filterMode, filterType, sortKey]);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(displayed.map(i => i.id)));
    const clearSelection = () => setSelected(new Set());

    const handleDeleteSelected = async () => {
        if (selected.size === 0) return;
        await galleryDeleteMany(Array.from(selected));
        setSelected(new Set());
        await load();
    };

    const handleDeleteSingle = async (id: string) => {
        await galleryDelete(id);
        setExpandedId(null);
        await load();
    };

    const handleClearAll = async () => {
        await galleryDeleteAll();
        setConfirmClear(false);
        setSelected(new Set());
        await load();
    };

    const handleDownloadSelected = () => {
        displayed
            .filter(img => selected.has(img.id))
            .forEach((img, i) => {
                const label = `${img.title || 'image'}_${TYPE_LABELS[img.type]}_${i + 1}`.replace(/\s+/g, '_');
                downloadImage(img.imageUrl, `${label}.png`);
            });
    };

    const expandedImage = expandedId ? images.find(i => i.id === expandedId) : null;

    return (
        <div
            className="fixed inset-0 z-[580] bg-black/90 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Global Image Gallery"
        >
            {/* Header */}
            <div className="flex-shrink-0 bg-[#1a1a2e] border-b-4 border-black px-4 py-3 flex flex-wrap items-center gap-3">
                <h2 className="font-comic text-white text-xl md:text-2xl font-bold flex-1 min-w-0">
                    🖼️ Global Gallery
                    <span className="ml-2 text-sm text-gray-400 font-normal">({images.length} images)</span>
                </h2>
                <button
                    onClick={onClose}
                    className="comic-btn bg-gray-600 text-white text-sm px-3 py-1.5 border-2 border-black hover:bg-gray-500 font-bold"
                >
                    ✕ Close
                </button>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 bg-[#0f0f1f] border-b-2 border-gray-700 px-4 py-2 flex flex-wrap items-center gap-2 text-sm">
                {/* Sort */}
                <label className="text-gray-300 font-comic flex items-center gap-1">
                    Sort:
                    <select
                        value={sortKey}
                        onChange={e => setSortKey(e.target.value as SortKey)}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 font-comic text-xs"
                    >
                        <option value="date_desc">Newest first</option>
                        <option value="date_asc">Oldest first</option>
                        <option value="mode">By mode</option>
                        <option value="type">By type</option>
                    </select>
                </label>

                {/* Filter mode */}
                <label className="text-gray-300 font-comic flex items-center gap-1">
                    Mode:
                    <select
                        value={filterMode}
                        onChange={e => setFilterMode(e.target.value as FilterMode)}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 font-comic text-xs"
                    >
                        <option value="all">All modes</option>
                        {availableModes.map(m => (
                            <option key={m} value={m}>{MODE_LABELS[m]}</option>
                        ))}
                    </select>
                </label>

                {/* Filter type */}
                <label className="text-gray-300 font-comic flex items-center gap-1">
                    Type:
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as FilterType)}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 font-comic text-xs"
                    >
                        <option value="all">All types</option>
                        {availableTypes.map(t => (
                            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                        ))}
                    </select>
                </label>

                <span className="text-gray-500">|</span>

                {/* Batch actions */}
                {selected.size === 0 ? (
                    <button
                        onClick={selectAll}
                        disabled={displayed.length === 0}
                        className="text-gray-300 hover:text-white text-xs font-comic disabled:opacity-40"
                    >
                        Select all ({displayed.length})
                    </button>
                ) : (
                    <>
                        <button onClick={clearSelection} className="text-gray-300 hover:text-white text-xs font-comic">
                            Deselect ({selected.size})
                        </button>
                        <button
                            onClick={handleDownloadSelected}
                            className="comic-btn bg-blue-600 text-white text-xs px-2 py-1 border border-black hover:bg-blue-500 font-bold"
                        >
                            ↓ Download {selected.size}
                        </button>
                        <button
                            onClick={handleDeleteSelected}
                            className="comic-btn bg-red-600 text-white text-xs px-2 py-1 border border-black hover:bg-red-500 font-bold"
                        >
                            🗑 Delete {selected.size}
                        </button>
                    </>
                )}

                <div className="ml-auto">
                    <button
                        onClick={() => setConfirmClear(true)}
                        disabled={images.length === 0}
                        className="text-red-400 hover:text-red-300 text-xs font-comic disabled:opacity-40"
                    >
                        Clear all
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400 font-comic text-lg">
                        Loading gallery...
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 font-comic gap-3">
                        <span className="text-5xl">🖼️</span>
                        <p className="text-lg">
                            {images.length === 0 ? 'No images yet — generate a comic to fill this gallery!' : 'No images match the current filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {displayed.map(img => (
                            <GalleryCard
                                key={img.id}
                                image={img}
                                isSelected={selected.has(img.id)}
                                onSelect={() => toggleSelect(img.id)}
                                onExpand={() => setExpandedId(img.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Expanded view */}
            {expandedImage && (
                <div
                    className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setExpandedId(null)}
                >
                    <div
                        className="relative max-w-2xl w-full bg-[#1a1a2e] border-4 border-black rounded-xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={expandedImage.imageUrl}
                            alt={expandedImage.title}
                            className="w-full h-auto max-h-[70vh] object-contain"
                        />
                        <div className="p-4 flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-comic text-white font-bold truncate">{expandedImage.title || 'Untitled'}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <span className={`text-white text-xs px-2 py-0.5 rounded font-comic ${TYPE_COLORS[expandedImage.type]}`}>
                                            {TYPE_LABELS[expandedImage.type]}
                                        </span>
                                        {expandedImage.mode && (
                                            <span className={`text-white text-xs px-2 py-0.5 rounded font-comic ${MODE_COLORS[expandedImage.mode]}`}>
                                                {MODE_LABELS[expandedImage.mode]}
                                            </span>
                                        )}
                                        {expandedImage.artStyle && (
                                            <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded font-comic">
                                                {expandedImage.artStyle}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-xs mt-1 font-comic">{formatDate(expandedImage.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => downloadImage(expandedImage.imageUrl, `${expandedImage.title || 'image'}.png`)}
                                    className="flex-1 comic-btn bg-blue-600 text-white text-sm px-3 py-2 border-2 border-black hover:bg-blue-500 font-bold"
                                >
                                    ↓ Download
                                </button>
                                <button
                                    onClick={() => handleDeleteSingle(expandedImage.id)}
                                    className="comic-btn bg-red-600 text-white text-sm px-3 py-2 border-2 border-black hover:bg-red-500 font-bold"
                                >
                                    🗑 Delete
                                </button>
                                <button
                                    onClick={() => setExpandedId(null)}
                                    className="comic-btn bg-gray-600 text-white text-sm px-3 py-2 border-2 border-black hover:bg-gray-500 font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm clear all */}
            {confirmClear && (
                <div className="fixed inset-0 z-[700] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-black p-6 max-w-sm w-full text-center shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
                        <p className="font-comic text-xl font-bold mb-2">Clear entire gallery?</p>
                        <p className="font-comic text-sm text-gray-600 mb-4">This will permanently delete all {images.length} images. This cannot be undone.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={handleClearAll} className="comic-btn bg-red-600 text-white px-5 py-2 border-2 border-black hover:bg-red-500 font-bold">Delete All</button>
                            <button onClick={() => setConfirmClear(false)} className="comic-btn bg-gray-400 text-white px-5 py-2 border-2 border-black hover:bg-gray-300 font-bold">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// GALLERY CARD
// ============================================================================

interface GalleryCardProps {
    image: GalleryImage;
    isSelected: boolean;
    onSelect: () => void;
    onExpand: () => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ image, isSelected, onSelect, onExpand }) => (
    <div
        className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
            isSelected ? 'border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.5)]' : 'border-gray-700 hover:border-gray-400'
        }`}
        onClick={onExpand}
    >
        <img
            src={image.imageUrl}
            alt={image.title}
            className="w-full aspect-[2/3] object-cover block"
            loading="lazy"
        />

        {/* Select checkbox */}
        <button
            className={`absolute top-1.5 left-1.5 w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-all z-10 ${
                isSelected ? 'bg-yellow-400 border-yellow-600 text-black' : 'bg-black/60 border-gray-500 text-transparent hover:border-white'
            }`}
            onClick={e => { e.stopPropagation(); onSelect(); }}
            aria-label={isSelected ? 'Deselect image' : 'Select image'}
            title={isSelected ? 'Deselect' : 'Select'}
        >
            {isSelected ? '✓' : ''}
        </button>

        {/* Type badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
            <span className={`text-white text-[9px] px-1 py-0.5 rounded font-comic ${TYPE_COLORS[image.type]}`}>
                {TYPE_LABELS[image.type]}
            </span>
        </div>
    </div>
);

export default GlobalGalleryModal;
