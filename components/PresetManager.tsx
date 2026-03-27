/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { CustomPreset } from './PresetSelector';

interface PresetManagerProps {
    /** Array of user's custom presets */
    presets: CustomPreset[];
    /** Handler for selecting/applying a preset */
    onSelectPreset: (preset: CustomPreset) => void;
    /** Handler for deleting a preset */
    onDeletePreset: (presetId: string) => void;
    /** Handler for updating a preset */
    onUpdatePreset: (presetId: string, updates: Partial<CustomPreset>) => void;
    /** Handler for creating a new preset */
    onCreateNew?: () => void;
}

/**
 * Displays and manages saved presets with full-screen edit modal.
 */
export const PresetManager: React.FC<PresetManagerProps> = ({
    presets,
    onSelectPreset,
    onDeletePreset,
    onUpdatePreset,
    onCreateNew
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null);
    const [editForm, setEditForm] = useState<Partial<CustomPreset>>({});
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Handle escape key to close edit modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && editingPreset) {
                setEditingPreset(null);
                setEditForm({});
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingPreset]);

    if (presets.length === 0) {
        return null; // Don't show empty panel
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
        setDeleteConfirmId(null);
    };

    const startEditing = (preset: CustomPreset) => {
        setEditingPreset(preset);
        setEditForm({
            name: preset.name,
            description: preset.description,
            samplePlotOutline: preset.samplePlotOutline
        });
    };

    const cancelEditing = () => {
        setEditingPreset(null);
        setEditForm({});
    };

    const saveEditing = () => {
        if (editingPreset && editForm.name?.trim()) {
            onUpdatePreset(editingPreset.id, editForm);
        }
        setEditingPreset(null);
        setEditForm({});
    };

    const confirmDelete = (presetId: string) => {
        onDeletePreset(presetId);
        setDeleteConfirmId(null);
        setExpandedId(null);
    };

    return (
        <>
            {/* Preset List */}
            <div className="border-[3px] border-blue-400 bg-blue-50 p-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-comic text-sm font-bold text-blue-900 uppercase flex items-center gap-2">
                        📚 My Presets
                        <span className="text-xs font-normal text-blue-600">({presets.length})</span>
                    </h3>
                    {onCreateNew && (
                        <button
                            onClick={onCreateNew}
                            className="comic-btn bg-green-600 text-white text-[10px] px-2 py-1 hover:bg-green-500 border-2 border-black uppercase"
                        >
                            + NEW
                        </button>
                    )}
                </div>

                <div className="space-y-1.5">
                    {presets.map(preset => {
                        const isExpanded = expandedId === preset.id;
                        const isConfirmingDelete = deleteConfirmId === preset.id;

                        return (
                            <div key={preset.id} className="bg-white border-2 border-blue-300 rounded overflow-hidden">
                                {/* Compact header */}
                                <div className="flex items-center gap-2 p-2">
                                    <button
                                        onClick={() => toggleExpand(preset.id)}
                                        className="flex-1 flex items-center gap-2 text-left hover:bg-blue-50 rounded p-1 -m-1 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-200 to-blue-400 border-2 border-blue-500 rounded flex items-center justify-center text-blue-800 font-bold text-sm">
                                            {preset.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-comic text-sm font-bold text-blue-900 truncate">
                                                {preset.name}
                                            </p>
                                            <p className="font-comic text-[10px] text-blue-600 truncate">
                                                {preset.genre} • {preset.pageLength}pg
                                            </p>
                                        </div>
                                        <span className={`text-blue-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </button>

                                    {/* Quick action buttons */}
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => onSelectPreset(preset)}
                                            className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded border border-blue-700 hover:bg-blue-500 font-bold"
                                            title="Apply this preset"
                                        >
                                            ▶
                                        </button>
                                        <button
                                            onClick={() => startEditing(preset)}
                                            className="bg-yellow-500 text-black text-[10px] px-2 py-1 rounded border border-yellow-600 hover:bg-yellow-400"
                                            title="Edit preset"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(preset.id)}
                                            className="bg-red-500 text-white text-[10px] px-2 py-1 rounded border border-red-600 hover:bg-red-400"
                                            title="Delete preset"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && !isConfirmingDelete && (
                                    <div className="border-t border-blue-200 p-2 bg-blue-50/50 text-xs">
                                        <div className="grid grid-cols-2 gap-1 text-blue-700 font-comic">
                                            <span><b>Art:</b> {preset.artStyle}</span>
                                            <span><b>Pages:</b> {preset.pageLength}</span>
                                        </div>
                                        {preset.samplePlotOutline && (
                                            <p className="mt-1.5 text-gray-600 font-comic line-clamp-2">
                                                {preset.samplePlotOutline}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Delete confirmation */}
                                {isConfirmingDelete && (
                                    <div className="border-t border-red-200 p-2 bg-red-50 flex items-center justify-between">
                                        <span className="font-comic text-xs text-red-700">Delete this preset?</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => confirmDelete(preset.id)}
                                                className="bg-red-600 text-white text-[10px] px-2 py-1 rounded border border-red-700 hover:bg-red-500 font-bold"
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="bg-gray-400 text-white text-[10px] px-2 py-1 rounded border border-gray-500 hover:bg-gray-300"
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Full-screen Edit Modal */}
            {editingPreset && (
                <div
                    className="fixed inset-0 z-[800] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={cancelEditing}
                >
                    <div
                        className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-blue-100">
                            <h2 className="font-comic text-xl font-bold text-blue-900 uppercase">
                                ✏️ Edit Preset
                            </h2>
                            <button
                                onClick={cancelEditing}
                                className="w-8 h-8 bg-red-600 text-white border-2 border-black rounded font-bold hover:bg-red-500 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block font-comic text-sm font-bold text-gray-800 mb-1">
                                    Preset Name
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name || ''}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-3 border-3 border-black font-comic text-lg rounded shadow-[3px_3px_0px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="My Awesome Preset"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block font-comic text-sm font-bold text-gray-800 mb-1">
                                    Description <span className="font-normal text-gray-500">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={editForm.description || ''}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full p-3 border-3 border-black font-comic text-base rounded shadow-[3px_3px_0px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="A brief description of this preset..."
                                />
                            </div>

                            {/* Story Outline - Large textarea */}
                            <div className="flex-1">
                                <label className="block font-comic text-sm font-bold text-gray-800 mb-1">
                                    Story Outline
                                </label>
                                <textarea
                                    value={editForm.samplePlotOutline || ''}
                                    onChange={(e) => setEditForm({ ...editForm, samplePlotOutline: e.target.value })}
                                    className="w-full p-3 border-3 border-black font-comic text-sm rounded shadow-[3px_3px_0px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[200px] resize-y"
                                    placeholder="Your story outline, plot points, character descriptions..."
                                />
                                <p className="mt-1 font-comic text-xs text-gray-500">
                                    {(editForm.samplePlotOutline || '').length} characters
                                </p>
                            </div>

                            {/* Read-only info */}
                            <div className="bg-gray-100 border-2 border-gray-300 rounded p-3">
                                <p className="font-comic text-xs text-gray-600 mb-1 font-bold uppercase">Preset Settings (read-only)</p>
                                <div className="grid grid-cols-3 gap-2 font-comic text-sm">
                                    <div><span className="text-gray-500">Genre:</span> {editingPreset.genre}</div>
                                    <div><span className="text-gray-500">Style:</span> {editingPreset.artStyle}</div>
                                    <div><span className="text-gray-500">Pages:</span> {editingPreset.pageLength}</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-4 border-t-4 border-black bg-gray-100">
                            <button
                                onClick={saveEditing}
                                disabled={!editForm.name?.trim()}
                                className="flex-1 comic-btn bg-green-600 text-white py-3 text-base font-bold border-3 border-black hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                            >
                                ✓ Save Changes
                            </button>
                            <button
                                onClick={cancelEditing}
                                className="comic-btn bg-gray-500 text-white px-6 py-3 text-base font-bold border-3 border-black hover:bg-gray-400 uppercase"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PresetManager;
