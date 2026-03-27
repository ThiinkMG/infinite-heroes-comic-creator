/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
 * Displays and manages saved presets with edit/delete functionality.
 * Shows presets as expandable cards on the home screen.
 */
export const PresetManager: React.FC<PresetManagerProps> = ({
    presets,
    onSelectPreset,
    onDeletePreset,
    onUpdatePreset,
    onCreateNew
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<CustomPreset>>({});
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    if (presets.length === 0) {
        return (
            <div className="border-[3px] border-blue-400 bg-blue-50 p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-comic text-sm sm:text-base font-bold text-blue-900 uppercase flex items-center gap-2">
                        <span>📚</span> My Saved Presets
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
                <p className="font-comic text-xs text-blue-700 italic">
                    No saved presets yet. Configure your story settings and click "Save as Preset" to create one.
                </p>
            </div>
        );
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
        setEditingId(null);
        setDeleteConfirmId(null);
    };

    const startEditing = (preset: CustomPreset) => {
        setEditingId(preset.id);
        setEditForm({
            name: preset.name,
            description: preset.description,
            samplePlotOutline: preset.samplePlotOutline
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEditing = (presetId: string) => {
        if (editForm.name?.trim()) {
            onUpdatePreset(presetId, editForm);
        }
        setEditingId(null);
        setEditForm({});
    };

    const confirmDelete = (presetId: string) => {
        onDeletePreset(presetId);
        setDeleteConfirmId(null);
        setExpandedId(null);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="border-[3px] border-blue-400 bg-blue-50 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-comic text-sm sm:text-base font-bold text-blue-900 uppercase flex items-center gap-2">
                    <span>📚</span> My Saved Presets
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

            <p className="font-comic text-xs text-blue-700 mb-3">
                Click a preset to view details, apply, edit, or delete
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {presets.map(preset => {
                    const isExpanded = expandedId === preset.id;
                    const isEditing = editingId === preset.id;
                    const isConfirmingDelete = deleteConfirmId === preset.id;

                    return (
                        <div
                            key={preset.id}
                            className="bg-white border-2 border-blue-300 rounded overflow-hidden"
                        >
                            {/* Header - always visible */}
                            <button
                                onClick={() => toggleExpand(preset.id)}
                                className="w-full flex items-center gap-2 p-2 hover:bg-blue-100 transition-colors text-left"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-400 border-2 border-blue-500 rounded flex items-center justify-center text-blue-800 text-lg font-bold">
                                    {preset.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-comic text-sm font-bold text-blue-900 truncate">
                                        {preset.name}
                                    </p>
                                    <p className="font-comic text-xs text-blue-600">
                                        {preset.genre} • {preset.artStyle} • {preset.pageLength} pages
                                    </p>
                                </div>

                                <span className={`text-blue-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="border-t-2 border-blue-200 p-3 bg-blue-50/50">
                                    {isEditing ? (
                                        /* Edit mode */
                                        <div className="space-y-2">
                                            <div>
                                                <label className="font-comic text-xs font-bold text-blue-800 block mb-1">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.name || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="w-full p-2 border-2 border-blue-300 font-comic text-sm rounded"
                                                    placeholder="Preset name"
                                                />
                                            </div>

                                            <div>
                                                <label className="font-comic text-xs font-bold text-blue-800 block mb-1">
                                                    Description
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.description || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="w-full p-2 border-2 border-blue-300 font-comic text-sm rounded"
                                                    placeholder="Brief description"
                                                />
                                            </div>

                                            <div>
                                                <label className="font-comic text-xs font-bold text-blue-800 block mb-1">
                                                    Story Outline
                                                </label>
                                                <textarea
                                                    value={editForm.samplePlotOutline || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, samplePlotOutline: e.target.value })}
                                                    className="w-full p-2 border-2 border-blue-300 font-comic text-xs rounded resize-none h-20"
                                                    placeholder="Story outline / plot description"
                                                />
                                            </div>

                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => saveEditing(preset.id)}
                                                    className="flex-1 comic-btn bg-green-600 text-white text-xs py-1.5 border-2 border-black hover:bg-green-500 uppercase"
                                                >
                                                    ✓ Save
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="flex-1 comic-btn bg-gray-400 text-white text-xs py-1.5 border-2 border-black hover:bg-gray-300 uppercase"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : isConfirmingDelete ? (
                                        /* Delete confirmation */
                                        <div className="text-center p-2">
                                            <p className="font-comic text-sm text-red-700 mb-3">
                                                Delete "{preset.name}"?
                                            </p>
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => confirmDelete(preset.id)}
                                                    className="comic-btn bg-red-600 text-white text-xs px-4 py-1.5 border-2 border-black hover:bg-red-500 uppercase"
                                                >
                                                    Yes, Delete
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="comic-btn bg-gray-400 text-white text-xs px-4 py-1.5 border-2 border-black hover:bg-gray-300 uppercase"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View mode */
                                        <>
                                            {preset.description && (
                                                <p className="font-comic text-xs text-blue-700 mb-2">
                                                    {preset.description}
                                                </p>
                                            )}

                                            <div className="space-y-1 mb-3">
                                                <PresetField label="Genre" value={preset.genre} />
                                                <PresetField label="Art Style" value={preset.artStyle} />
                                                <PresetField label="Pages" value={`${preset.pageLength} pages`} />
                                                <PresetField label="Created" value={formatDate(preset.createdAt)} />
                                            </div>

                                            {preset.samplePlotOutline && (
                                                <div className="bg-white border border-blue-200 p-2 rounded mb-3 max-h-24 overflow-y-auto">
                                                    <p className="font-comic text-[10px] font-bold text-blue-800 mb-1">Story Outline:</p>
                                                    <p className="font-comic text-xs text-gray-700 whitespace-pre-wrap">
                                                        {preset.samplePlotOutline}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onSelectPreset(preset)}
                                                    className="flex-1 comic-btn bg-blue-600 text-white text-xs py-1.5 border-2 border-black hover:bg-blue-500 uppercase"
                                                >
                                                    ▶ Apply
                                                </button>
                                                <button
                                                    onClick={() => startEditing(preset)}
                                                    className="comic-btn bg-yellow-500 text-black text-xs px-3 py-1.5 border-2 border-black hover:bg-yellow-400 uppercase"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(preset.id)}
                                                    className="comic-btn bg-red-600 text-white text-xs px-3 py-1.5 border-2 border-black hover:bg-red-500 uppercase"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Helper component for displaying a preset field
 */
const PresetField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <span className="font-comic text-xs font-bold text-blue-800">{label}: </span>
        <span className="font-comic text-xs text-blue-700">{value}</span>
    </div>
);

export default PresetManager;
