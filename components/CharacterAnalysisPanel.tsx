/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { CharacterProfile, Persona } from '../types';

interface CharacterAnalysisPanelProps {
    /** All characters (hero, friend, additional) */
    characters: Persona[];
    /** Character profiles keyed by character ID */
    profiles: Map<string, CharacterProfile>;
    /** Callback to view full profile details */
    onViewProfile?: (profileId: string) => void;
}

/**
 * Displays AI-generated character analysis (CharacterProfile) for each character
 * on the home screen. Shows a collapsed preview that can be expanded.
 */
export const CharacterAnalysisPanel: React.FC<CharacterAnalysisPanelProps> = ({
    characters,
    profiles,
    onViewProfile
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filter characters that have profiles
    const charactersWithProfiles = characters.filter(char => profiles.has(char.id));

    if (charactersWithProfiles.length === 0) {
        return null;
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="border-[3px] border-purple-400 bg-purple-50 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-comic text-sm sm:text-base font-bold text-purple-900 uppercase flex items-center gap-2">
                    <span>🧬</span> Character Analysis
                    <span className="text-xs font-normal text-purple-600">({charactersWithProfiles.length})</span>
                </h3>
            </div>

            <p className="font-comic text-xs text-purple-700 mb-3">
                AI-generated visual profiles used for consistency
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {charactersWithProfiles.map(character => {
                    const profile = profiles.get(character.id);
                    if (!profile) return null;

                    const isExpanded = expandedId === character.id;

                    return (
                        <div
                            key={character.id}
                            className="bg-white border-2 border-purple-300 rounded overflow-hidden"
                        >
                            {/* Header - always visible */}
                            <button
                                onClick={() => toggleExpand(character.id)}
                                className="w-full flex items-center gap-2 p-2 hover:bg-purple-100 transition-colors text-left"
                            >
                                {/* Character thumbnail */}
                                {character.base64 ? (
                                    <img
                                        src={`data:image/png;base64,${character.base64}`}
                                        alt={character.name}
                                        className="w-10 h-10 object-cover border-2 border-purple-400 rounded"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-purple-200 border-2 border-purple-400 rounded flex items-center justify-center text-purple-600 text-lg">
                                        ?
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="font-comic text-sm font-bold text-purple-900 truncate">
                                        {profile.name || character.name || 'Unknown'}
                                    </p>
                                    <p className="font-comic text-xs text-purple-600 truncate">
                                        {profile.faceDescription?.slice(0, 50) || 'No face description'}...
                                    </p>
                                </div>

                                <span className={`text-purple-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="border-t-2 border-purple-200 p-3 space-y-2 bg-purple-50/50">
                                    <ProfileField label="Face" value={profile.faceDescription} />
                                    <ProfileField label="Body" value={profile.bodyType} />
                                    <ProfileField label="Clothing" value={profile.clothing} />
                                    <ProfileField label="Colors" value={profile.colorPalette} />
                                    <ProfileField label="Distinctive" value={profile.distinguishingFeatures} />

                                    {profile.emblemDescription && (
                                        <ProfileField
                                            label="Emblem"
                                            value={`${profile.emblemDescription}${profile.emblemPlacement ? ` (${profile.emblemPlacement})` : ''}`}
                                        />
                                    )}

                                    {profile.maskDescription && (
                                        <ProfileField label="Mask" value={profile.maskDescription} />
                                    )}

                                    {profile.weaponDescription && (
                                        <ProfileField label="Weapon" value={profile.weaponDescription} />
                                    )}

                                    {profile.hairDetails && (
                                        <ProfileField
                                            label="Hair"
                                            value={`${profile.hairDetails.color} ${profile.hairDetails.type}, ${profile.hairDetails.length}, ${profile.hairDetails.style}`}
                                        />
                                    )}

                                    {profile.hardNegatives && profile.hardNegatives.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-purple-200">
                                            <p className="font-comic text-xs font-bold text-red-700 mb-1">
                                                Hard Negatives (Never Include):
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {profile.hardNegatives.map((neg, i) => (
                                                    <span
                                                        key={i}
                                                        className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded border border-red-300"
                                                    >
                                                        {neg}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {onViewProfile && (
                                        <button
                                            onClick={() => onViewProfile(character.id)}
                                            className="mt-2 w-full comic-btn bg-purple-600 text-white text-xs py-1.5 border-2 border-black hover:bg-purple-500 uppercase"
                                        >
                                            Edit Full Profile
                                        </button>
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
 * Helper component for displaying a profile field
 */
const ProfileField: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
    if (!value) return null;

    return (
        <div>
            <span className="font-comic text-xs font-bold text-purple-800">{label}: </span>
            <span className="font-comic text-xs text-purple-700">{value}</span>
        </div>
    );
};

export default CharacterAnalysisPanel;
