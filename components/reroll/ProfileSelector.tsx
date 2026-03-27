/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CharacterProfile } from '../../types';

interface ProfileSelectorProps {
    availableProfiles: { id: string; name: string }[];
    fullProfiles: CharacterProfile[];
    selectedProfileIds: Set<string>;
    onToggleProfile: (id: string) => void;
    onSelectAll: () => void;
    onSelectNone: () => void;
    onProfileUpdate?: (profileId: string, updates: Partial<CharacterProfile>) => void;
    onAnalyzeProfile?: (profileId: string) => Promise<void>;
    onAddNewCharacter?: () => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
    availableProfiles,
    fullProfiles,
    selectedProfileIds,
    onToggleProfile,
    onSelectAll,
    onSelectNone,
    onProfileUpdate,
    onAnalyzeProfile,
    onAddNewCharacter
}) => {
    const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
    const [analyzingProfileId, setAnalyzingProfileId] = useState<string | null>(null);

    const getFullProfile = (id: string) => fullProfiles.find(p => p.id === id);

    const handleProfileClick = (id: string) => {
        setExpandedProfileId(expandedProfileId === id ? null : id);
    };

    const handleDownloadProfile = (profile: CharacterProfile) => {
        const data = JSON.stringify(profile, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Profile-${profile.name.replace(/\s+/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleUploadProfile = (profileId: string, file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                if (parsed && typeof parsed === 'object' && onProfileUpdate) {
                    // Keep original id and name, update the rest
                    const { id, name, ...rest } = parsed;
                    onProfileUpdate(profileId, rest);
                }
            } catch (err) {
                console.error('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
    };

    const handleAnalyze = async (profileId: string) => {
        if (!onAnalyzeProfile) return;
        setAnalyzingProfileId(profileId);
        try {
            await onAnalyzeProfile(profileId);
        } finally {
            setAnalyzingProfileId(null);
        }
    };

    return (
        <div className="border-[3px] border-black bg-orange-50 p-3 sm:p-4">
            <div className="mb-3 border-b-2 border-orange-200 pb-2">
                <p className="font-comic font-bold text-sm sm:text-base uppercase text-orange-900">
                    🧬 Character Profiles
                </p>
                <p className="font-comic text-xs text-orange-700 mt-0.5">
                    Tap to view/edit. Controls AI consistency.
                </p>
            </div>

            {availableProfiles.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                    {availableProfiles.map(p => {
                        const fullProfile = getFullProfile(p.id);
                        const isExpanded = expandedProfileId === p.id;
                        const isAnalyzing = analyzingProfileId === p.id;

                        return (
                            <div key={p.id} className={`border-2 transition-all rounded-sm ${selectedProfileIds.has(p.id) ? 'border-orange-500 bg-orange-100' : 'border-gray-300 bg-white'}`}>
                                {/* Profile Header Row - larger touch target */}
                                <div className="flex items-center gap-3 p-3 sm:p-4 min-h-[56px]">
                                    <input
                                        type="checkbox"
                                        checked={selectedProfileIds.has(p.id)}
                                        onChange={() => onToggleProfile(p.id)}
                                        className="w-6 h-6 sm:w-5 sm:h-5 accent-orange-600 cursor-pointer shrink-0 touch-manipulation"
                                        aria-label={`Include ${p.name} profile`}
                                    />
                                    <button
                                        onClick={() => handleProfileClick(p.id)}
                                        className="flex-1 text-left font-comic text-sm sm:text-base font-bold text-orange-900 hover:text-orange-600 active:text-orange-700 transition-colors truncate touch-manipulation min-h-[44px] flex items-center"
                                        title="Click to expand/edit profile"
                                        aria-expanded={isExpanded}
                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${p.name} profile`}
                                    >
                                        <span className="truncate">{p.name}</span>
                                        <span className="ml-2 flex-shrink-0">{isExpanded ? '▼' : '▶'}</span>
                                    </button>
                                </div>

                                {/* Expanded Profile Editor */}
                                {isExpanded && fullProfile && (
                                    <div className="border-t-2 border-orange-200 p-3 sm:p-4 bg-white space-y-4">
                                        {/* Profile Fields - single column on mobile */}
                                        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                                            <div>
                                                <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">Face Description</label>
                                                <textarea
                                                    className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-24 sm:h-20 resize-none focus:border-orange-400 focus:outline-none touch-manipulation"
                                                    value={fullProfile.faceDescription || ''}
                                                    onChange={e => onProfileUpdate?.(p.id, { faceDescription: e.target.value })}
                                                    placeholder="Eye color, face shape, expression..."
                                                />
                                            </div>
                                            <div>
                                                <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">Body Type</label>
                                                <textarea
                                                    className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-24 sm:h-20 resize-none focus:border-orange-400 focus:outline-none touch-manipulation"
                                                    value={fullProfile.bodyType || ''}
                                                    onChange={e => onProfileUpdate?.(p.id, { bodyType: e.target.value })}
                                                    placeholder="Height, build, posture..."
                                                />
                                            </div>
                                            <div>
                                                <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">Clothing & Armor</label>
                                                <textarea
                                                    className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-24 sm:h-20 resize-none focus:border-orange-400 focus:outline-none touch-manipulation"
                                                    value={fullProfile.clothing || ''}
                                                    onChange={e => onProfileUpdate?.(p.id, { clothing: e.target.value })}
                                                    placeholder="Outfit details, accessories..."
                                                />
                                            </div>
                                            <div>
                                                <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">Color Palette</label>
                                                <textarea
                                                    className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-24 sm:h-20 resize-none focus:border-orange-400 focus:outline-none touch-manipulation"
                                                    value={fullProfile.colorPalette || ''}
                                                    onChange={e => onProfileUpdate?.(p.id, { colorPalette: e.target.value })}
                                                    placeholder="Primary colors, skin tone, hair..."
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">Distinguishing Features</label>
                                                <textarea
                                                    className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-20 sm:h-16 resize-none focus:border-orange-400 focus:outline-none touch-manipulation"
                                                    value={fullProfile.distinguishingFeatures || ''}
                                                    onChange={e => onProfileUpdate?.(p.id, { distinguishingFeatures: e.target.value })}
                                                    placeholder="Scars, tattoos, unique traits..."
                                                />
                                            </div>

                                            {/* Collapsible Advanced Fields on Mobile */}
                                            <details className="sm:col-span-2 sm:contents group">
                                                <summary className="sm:hidden font-comic text-sm font-bold text-purple-700 uppercase cursor-pointer touch-manipulation min-h-[44px] flex items-center list-none">
                                                    <span>🎭 More Fields (Mask, Emblem, Weapon)</span>
                                                    <span className="ml-2 group-open:rotate-180 transition-transform">▼</span>
                                                </summary>

                                                <div className="mt-3 sm:mt-0 sm:contents space-y-4 sm:space-y-0">
                                                    {/* Mask Description */}
                                                    <div className="sm:col-span-1">
                                                        <label className="font-comic text-xs sm:text-sm font-bold text-purple-700 uppercase block mb-1">
                                                            🎭 Mask <span className="text-[10px] text-gray-500 font-normal normal-case">(if worn)</span>
                                                        </label>
                                                        <textarea
                                                            className="w-full p-3 border-2 border-purple-300 font-comic text-sm h-20 sm:h-16 resize-none focus:border-purple-500 focus:outline-none bg-purple-50 touch-manipulation"
                                                            value={fullProfile.maskDescription || ''}
                                                            onChange={e => onProfileUpdate?.(p.id, { maskDescription: e.target.value })}
                                                            placeholder="Full face mask with white eye lenses..."
                                                        />
                                                    </div>

                                                    {/* Emblem/Logo Description */}
                                                    <div className="sm:col-span-1">
                                                        <label className="font-comic text-xs sm:text-sm font-bold text-amber-700 uppercase block mb-1">
                                                            ⭐ Emblem <span className="text-[10px] text-gray-500 font-normal normal-case">(chest symbol)</span>
                                                        </label>
                                                        <textarea
                                                            className="w-full p-3 border-2 border-amber-300 font-comic text-sm h-20 sm:h-16 resize-none focus:border-amber-500 focus:outline-none bg-amber-50 touch-manipulation"
                                                            value={fullProfile.emblemDescription || ''}
                                                            onChange={e => onProfileUpdate?.(p.id, { emblemDescription: e.target.value })}
                                                            placeholder="Red spider emblem on chest..."
                                                        />
                                                    </div>

                                                    {/* Weapon Description */}
                                                    <div className="sm:col-span-2">
                                                        <label className="font-comic text-xs sm:text-sm font-bold text-red-700 uppercase block mb-1">
                                                            ⚔️ Weapon <span className="text-[10px] text-gray-500 font-normal normal-case">(if any)</span>
                                                        </label>
                                                        <textarea
                                                            className="w-full p-3 border-2 border-red-300 font-comic text-sm h-20 sm:h-16 resize-none focus:border-red-500 focus:outline-none bg-red-50 touch-manipulation"
                                                            value={fullProfile.weaponDescription || ''}
                                                            onChange={e => onProfileUpdate?.(p.id, { weaponDescription: e.target.value })}
                                                            placeholder="Glowing green energy sword..."
                                                        />
                                                    </div>

                                                    {/* Hard Negatives / Things to Avoid */}
                                                    <div className="sm:col-span-2">
                                                        <label className="font-comic text-xs sm:text-sm font-bold text-gray-600 uppercase block mb-1">
                                                            🚫 Avoid <span className="text-[10px] text-gray-500 font-normal normal-case">(comma-separated)</span>
                                                        </label>
                                                        <textarea
                                                            className="w-full p-3 border-2 border-gray-400 font-comic text-sm h-20 sm:h-16 resize-none focus:border-gray-600 focus:outline-none bg-gray-100 touch-manipulation"
                                                            value={(fullProfile.hardNegatives || []).join(', ')}
                                                            onChange={e => {
                                                                const negatives = e.target.value
                                                                    .split(',')
                                                                    .map(s => s.trim())
                                                                    .filter(s => s.length > 0);
                                                                onProfileUpdate?.(p.id, { hardNegatives: negatives });
                                                            }}
                                                            placeholder="no glasses, no beard, avoid purple..."
                                                        />
                                                    </div>
                                                </div>
                                            </details>
                                        </div>

                                        {/* Profile Actions - larger touch targets */}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200">
                                            <button
                                                onClick={() => handleAnalyze(p.id)}
                                                disabled={isAnalyzing}
                                                className="comic-btn bg-blue-600 text-white text-sm min-h-[48px] px-4 py-2 border-2 border-black hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 font-bold touch-manipulation"
                                            >
                                                {isAnalyzing ? '⏳ Analyzing...' : '🤖 Re-Analyze'}
                                            </button>
                                            <div className="flex gap-2 flex-1">
                                                <button
                                                    onClick={() => handleDownloadProfile(fullProfile)}
                                                    className="comic-btn bg-yellow-500 text-black text-sm min-h-[48px] px-4 py-2 border-2 border-black hover:bg-yellow-400 active:bg-yellow-600 font-bold flex-1 touch-manipulation"
                                                >
                                                    ⬇️ Export
                                                </button>
                                                <label className="comic-btn bg-gray-500 text-white text-sm min-h-[48px] px-4 py-2 border-2 border-black hover:bg-gray-400 active:bg-gray-600 font-bold cursor-pointer flex-1 flex items-center justify-center touch-manipulation">
                                                    ⬆️ Import
                                                    <input
                                                        type="file"
                                                        accept=".json"
                                                        className="hidden"
                                                        aria-label="Upload profile JSON"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                handleUploadProfile(p.id, e.target.files[0]);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-500 font-comic text-sm sm:text-base text-center py-6">No character profiles available.</p>
            )}

            {/* Select All / None + Add New - larger touch targets on mobile */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-orange-200">
                <button
                    onClick={onSelectAll}
                    className="min-h-[44px] px-4 py-2 font-comic text-sm font-bold text-orange-700 hover:text-orange-900 active:bg-orange-200 uppercase touch-manipulation rounded"
                    aria-label="Select all profiles"
                >
                    Select All
                </button>
                <span className="text-orange-300 hidden sm:inline">|</span>
                <button
                    onClick={onSelectNone}
                    className="min-h-[44px] px-4 py-2 font-comic text-sm font-bold text-orange-700 hover:text-orange-900 active:bg-orange-200 uppercase touch-manipulation rounded"
                    aria-label="Deselect all profiles"
                >
                    Select None
                </button>
                {onAddNewCharacter && (
                    <button
                        onClick={onAddNewCharacter}
                        className="comic-btn bg-green-600 text-white text-sm min-h-[48px] px-4 py-2 border-2 border-black hover:bg-green-500 active:bg-green-700 font-bold touch-manipulation ml-auto"
                    >
                        ➕ Add Character
                    </button>
                )}
            </div>
        </div>
    );
};
