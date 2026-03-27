/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CHARACTER_ROLES, CharacterRole, Persona, CharacterProfile, EMBLEM_PLACEMENTS, EmblemPlacement } from '../types';
import { Tooltip } from './Tooltip';
import { HelpTooltip } from './HelpTooltip';
import { useCharacterLibraryStore } from '../stores/useCharacterLibraryStore';

/**
 * Props for the CharacterCard component.
 */
export interface CharacterCardProps {
    /** Title displayed at the top of the card (e.g., "MAIN (REQUIRED)") */
    title: string;
    /** The character persona data, null if no character set */
    persona: Persona | null;
    /** Whether this is a fixed card (hero/co-star) that can be reset but not deleted */
    isFixed?: boolean;
    /** Handler for updating persona fields */
    onUpdate: (updates: Partial<Persona>) => void;
    /** Handler for deleting the character (only for additional characters) */
    onDelete?: () => void;
    /** Handler for resetting the character (only for fixed characters) */
    onReset?: () => void;
    /** Handler for uploading a portrait image */
    onPortraitUpload: (file: File) => void;
    /** Handler for uploading reference images */
    onRefUpload: (files: FileList) => void;
    /** Handler for removing a reference image by index */
    onRefRemove: (index: number) => void;
    /** Handler for uploading an emblem image */
    onEmblemUpload: (file: File) => void;
    /** Handler for removing the emblem image */
    onEmblemRemove: () => void;
    /** Handler for uploading a weapon image */
    onWeaponUpload: (file: File) => void;
    /** Handler for removing the weapon image */
    onWeaponRemove: () => void;
    /** Handler for uploading backstory files */
    onBackstoryFileUpload: (files: FileList) => void;
    /** Handler for removing a backstory file by index */
    onBackstoryFileRemove: (index: number) => void;
    /** Optional handler for AI text improvement */
    onImproveText?: (text: string, context?: string, purpose?: 'story_description' | 'regeneration_instruction' | 'backstory') => Promise<string>;
    /** Validation error message for name field */
    nameError?: string;
    /** Validation error message for portrait field */
    portraitError?: string;
    /** Handler called when name field loses focus */
    onNameBlur?: () => void;
    /** Handler called when portrait is changed */
    onPortraitBlur?: () => void;
    /** Whether this character is required (shows asterisk) */
    isRequired?: boolean;
    /** Whether to show the "Save to Library" button */
    showLibrarySave?: boolean;
    /** Character profile (if available) for saving to library */
    characterProfile?: CharacterProfile;
    /** Optional callback when character is saved to library */
    onLibrarySave?: (libraryId: string) => void;
}

/**
 * CharacterCard component for creating and editing character personas.
 * Displays portrait upload, reference images, emblem, weapon, name, and description fields.
 */
export const CharacterCard: React.FC<CharacterCardProps> = ({
    title,
    persona,
    isFixed,
    onUpdate,
    onDelete,
    onReset,
    onPortraitUpload,
    onRefUpload,
    onRefRemove,
    onEmblemUpload,
    onEmblemRemove,
    onWeaponUpload,
    onWeaponRemove,
    onBackstoryFileUpload,
    onBackstoryFileRemove,
    onImproveText,
    nameError,
    portraitError,
    onNameBlur,
    onPortraitBlur,
    isRequired,
    showLibrarySave,
    characterProfile,
    onLibrarySave
}) => {
    const [showExpandedBackstory, setShowExpandedBackstory] = useState(false);
    const [isImprovingBackstory, setIsImprovingBackstory] = useState(false);
    const [librarySaveStatus, setLibrarySaveStatus] = useState<'idle' | 'saved'>('idle');

    // Character Library store
    const saveToLibrary = useCharacterLibraryStore((state) => state.saveCharacter);

    // Check if character can be saved to library (has name and portrait)
    const canSaveToLibrary = showLibrarySave && persona?.name?.trim() && persona?.base64;

    const handleSaveToLibrary = () => {
        if (!persona || !canSaveToLibrary) return;

        const libraryId = saveToLibrary(persona, characterProfile);
        setLibrarySaveStatus('saved');

        // Reset status after showing feedback
        setTimeout(() => setLibrarySaveStatus('idle'), 2000);

        // Notify parent if callback provided
        onLibrarySave?.(libraryId);
    };

    const handleImproveBackstory = async () => {
        if (!onImproveText || !persona?.backstoryText?.trim()) return;
        setIsImprovingBackstory(true);
        try {
            const improved = await onImproveText(persona.backstoryText, undefined, 'backstory');
            onUpdate({ backstoryText: improved });
        } catch (e) {
            console.error('Failed to improve backstory:', e);
            console.error('Failed to improve text. Please try again.');
        } finally {
            setIsImprovingBackstory(false);
        }
    };

    return (
    <div className={`p-4 sm:p-5 lg:p-6 border-4 ${persona ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50'} transition-colors relative mb-4`}>
        <div className="flex justify-between items-center mb-4">
            <p className="font-comic text-lg sm:text-xl uppercase font-bold text-blue-900">{title}</p>
            <div className="flex gap-2 items-center">
                {persona && <span className="text-green-600 font-bold font-comic text-sm animate-pulse">✓ READY</span>}
                {canSaveToLibrary && (
                    <button
                        onClick={handleSaveToLibrary}
                        disabled={librarySaveStatus === 'saved'}
                        className={`text-xs px-2 py-1 font-comic border-2 border-black transition-colors ${
                            librarySaveStatus === 'saved'
                                ? 'bg-green-500 text-white cursor-default'
                                : 'bg-indigo-500 text-white hover:bg-indigo-400'
                        }`}
                        title={librarySaveStatus === 'saved' ? 'Saved to library!' : 'Save character to library for reuse in other comics'}
                        aria-label={librarySaveStatus === 'saved' ? 'Character saved to library' : 'Save character to library'}
                    >
                        {librarySaveStatus === 'saved' ? '✓ SAVED' : '📁 SAVE'}
                    </button>
                )}
                {isFixed && persona && onReset && (
                    <button onClick={onReset} className="bg-orange-500 text-white text-xs px-2 py-1 font-comic border-2 border-black hover:bg-orange-400">RESET</button>
                )}
                {!isFixed && onDelete && (
                    <button onClick={onDelete} className="bg-red-600 text-white text-xs px-2 py-1 font-comic border-2 border-black hover:bg-red-500">DELETE</button>
                )}
            </div>
        </div>

        {/* Role Dropdown */}
        <div className="mb-4 sm:mb-5">
            <p className="font-comic text-xs sm:text-sm mb-1.5 font-bold text-gray-600 uppercase">Character Role</p>
            <select
                value={persona?.role || ''}
                onChange={(e) => onUpdate({ role: e.target.value as CharacterRole, customRole: e.target.value === 'Custom' || e.target.value === 'Family/Friend' ? persona?.customRole || '' : undefined })}
                className="w-full p-2 border-2 border-black font-comic text-sm bg-white"
                aria-label="Character role"
            >
                <option value="">Select Role...</option>
                {CHARACTER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {(persona?.role === 'Family/Friend' || persona?.role === 'Custom') && (
                <input
                    type="text"
                    value={persona?.customRole || ''}
                    onChange={(e) => onUpdate({ customRole: e.target.value })}
                    placeholder={persona?.role === 'Family/Friend' ? 'e.g. Mom, Dad, Best Friend...' : 'e.g. Informant, Rival, Mentor...'}
                    className="w-full p-2 border-2 border-black font-comic text-sm mt-2"
                    aria-label="Custom role description"
                />
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            <div className="space-y-4 sm:space-y-5">
                {/* Portrait Section */}
                <div>
                    <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase flex items-center">
                        Portrait{isRequired && <span className="text-red-600 ml-0.5">*</span>}
                        <HelpTooltip
                            title="Good Portraits"
                            text="Use a clear, front-facing image with good lighting. Avoid busy backgrounds. The AI uses this as the primary reference for your character's face."
                            position="right"
                        />
                    </p>
                    {persona?.base64 ? (
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                            <img src={`data:image/jpeg;base64,${persona.base64}`} alt="Portrait" className="w-24 h-24 sm:w-28 sm:h-28 object-cover border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.2)] bg-white shrink-0" />
                            <div className="flex flex-row sm:flex-col gap-2">
                                <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-xs sm:text-sm px-3 py-1.5 hover:bg-yellow-300 border-2 border-black uppercase text-center">
                                    REPLACE
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { e.target.files?.[0] && onPortraitUpload(e.target.files[0]); onPortraitBlur?.(); }} aria-label="Replace portrait image" />
                                </label>
                                <button onClick={() => { onUpdate({ base64: '' }); onPortraitBlur?.(); }} className="comic-btn bg-red-500 text-white text-xs sm:text-sm px-3 py-1.5 hover:bg-red-400 border-2 border-black uppercase" aria-label="Clear portrait image">
                                    CLEAR
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className={`comic-btn bg-blue-500 text-white text-sm px-4 py-3 block w-full hover:bg-blue-400 cursor-pointer text-center font-bold ${portraitError ? 'border-[3px] border-red-600' : 'border-2 border-black'}`}>
                            UPLOAD PORTRAIT
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { e.target.files?.[0] && onPortraitUpload(e.target.files[0]); onPortraitBlur?.(); }} aria-label="Upload character portrait" />
                        </label>
                    )}
                    {portraitError && <p className="font-comic text-xs text-red-600 mt-1 flex items-center gap-1"><span className="font-bold">!</span> {portraitError}</p>}
                </div>

                {/* Reference Images Section */}
                <div>
                    <div className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase flex items-center">
                        Reference Images (Optional)
                        <HelpTooltip
                            title="Reference Images"
                            text="Upload character sheets, costume details, or style references. More refs = better consistency. Include different angles and poses for best results."
                            position="right"
                        />
                    </div>
                    {(persona?.referenceImages && persona.referenceImages.length > 0) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {persona.referenceImages.map((img, i) => (
                                <div key={i} className="relative group">
                                    <img src={`data:image/jpeg;base64,${img}`} alt={`Ref ${i+1}`} className="w-16 h-16 sm:w-18 sm:h-18 object-cover border-2 border-black bg-white" />
                                    <button
                                        onClick={() => onRefRemove(i)}
                                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center border border-black opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                                        aria-label={`Remove reference image ${i + 1}`}
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <label className="comic-btn bg-gray-400 text-white text-sm px-4 py-2.5 block w-full hover:bg-gray-500 cursor-pointer text-center border-2 border-black">
                        + ADD REFERENCE{(persona?.referenceImages?.length || 0) > 0 ? ` (${persona!.referenceImages!.length})` : ''}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && e.target.files.length > 0 && onRefUpload(e.target.files)} aria-label="Add reference images" />
                    </label>
                </div>

                {/* Emblem/Logo Section */}
                <div>
                    <div className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase flex items-center">
                        Emblem / Logo (Optional)
                        <HelpTooltip
                            title="Emblem Placement"
                            text="Upload your character's symbol or logo. Select where it appears (chest, shoulder, etc.) for the AI to place it consistently across panels."
                            position="right"
                        />
                    </div>
                    {persona?.emblemImage ? (
                        <div className="flex gap-3 items-start mb-3">
                            <img src={`data:image/jpeg;base64,${persona.emblemImage}`} alt="Emblem" className="w-16 h-16 sm:w-18 sm:h-18 object-contain border-2 border-black bg-white" />
                            <div className="flex flex-col gap-2 flex-1">
                                <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-xs sm:text-sm px-3 py-1.5 hover:bg-yellow-300 border-2 border-black uppercase text-center">
                                    REPLACE
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onEmblemUpload(e.target.files[0])} aria-label="Replace emblem image" />
                                </label>
                                <button onClick={onEmblemRemove} className="comic-btn bg-red-500 text-white text-xs sm:text-sm px-3 py-1.5 hover:bg-red-400 border-2 border-black uppercase" aria-label="Clear emblem image">
                                    CLEAR
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="comic-btn bg-purple-500 text-white text-sm px-4 py-2.5 block w-full hover:bg-purple-400 cursor-pointer text-center border-2 border-black mb-3">
                            + ADD EMBLEM/LOGO
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onEmblemUpload(e.target.files[0])} aria-label="Upload emblem or logo" />
                        </label>
                    )}
                    {persona?.emblemImage && (
                        <div className="space-y-2">
                            <select
                                value={persona?.emblemPlacement || ''}
                                onChange={(e) => onUpdate({ emblemPlacement: e.target.value as EmblemPlacement || undefined, emblemPlacementCustom: e.target.value === 'other' ? persona?.emblemPlacementCustom : undefined })}
                                className="w-full p-2 border-2 border-black font-comic text-xs sm:text-sm bg-white"
                                aria-label="Emblem placement"
                            >
                                <option value="">Select Placement...</option>
                                {EMBLEM_PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            {persona?.emblemPlacement === 'other' && (
                                <input
                                    type="text"
                                    value={persona?.emblemPlacementCustom || ''}
                                    onChange={(e) => onUpdate({ emblemPlacementCustom: e.target.value })}
                                    placeholder="Describe placement (e.g., 'belt buckle', 'cape clasp')..."
                                    className="w-full p-2 border-2 border-black font-comic text-xs sm:text-sm"
                                    aria-label="Custom emblem placement"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Weapon Reference Section */}
                <div>
                    <div className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase flex items-center">
                        Signature Weapon (Optional)
                        <HelpTooltip
                            title="Signature Weapon"
                            text="Upload your character's weapon image. Add a description (type, material, unique features) for better AI consistency across panels."
                            position="right"
                        />
                    </div>
                    {persona?.weaponImage ? (
                        <div className="flex gap-3 items-start mb-3">
                            <img src={`data:image/jpeg;base64,${persona.weaponImage}`} alt="Weapon" className="w-16 h-16 sm:w-18 sm:h-18 object-contain border-2 border-black bg-white" />
                            <div className="flex flex-col gap-2 flex-1">
                                <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-xs sm:text-sm px-3 py-1.5 hover:bg-yellow-300 border-2 border-black uppercase text-center">
                                    REPLACE
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onWeaponUpload(e.target.files[0])} aria-label="Replace weapon image" />
                                </label>
                                <button onClick={onWeaponRemove} className="comic-btn bg-red-500 text-white text-xs sm:text-sm px-3 py-1.5 hover:bg-red-400 border-2 border-black uppercase" aria-label="Clear weapon image">
                                    CLEAR
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="comic-btn bg-amber-600 text-white text-sm px-4 py-2.5 block w-full hover:bg-amber-500 cursor-pointer text-center border-2 border-black mb-3">
                            + ADD WEAPON REF
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onWeaponUpload(e.target.files[0])} aria-label="Upload weapon reference" />
                        </label>
                    )}
                    {persona?.weaponImage && (
                        <textarea
                            value={persona?.weaponDescriptionText || ''}
                            onChange={(e) => onUpdate({ weaponDescriptionText: e.target.value })}
                            placeholder="Describe the weapon: type, size, material, colors, engravings, glowing effects, unique features..."
                            className="w-full p-2 border-2 border-black font-comic text-xs sm:text-sm h-16 resize-none"
                            aria-label="Weapon description"
                        />
                    )}
                </div>
            </div>

            <div className="space-y-4 sm:space-y-5">
                {/* Name Section */}
                <div>
                    <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                        Name{isRequired && <span className="text-red-600 ml-0.5">*</span>}
                    </p>
                    <input
                        type="text"
                        value={persona?.name || ''}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        onBlur={onNameBlur}
                        placeholder="Character Name"
                        className={`w-full p-2 sm:p-2.5 font-comic text-sm sm:text-base ${nameError ? 'border-[3px] border-red-600' : 'border-2 border-black'}`}
                        aria-label="Character name"
                        aria-invalid={!!nameError}
                    />
                    {nameError && <p className="font-comic text-xs text-red-600 mt-1 flex items-center gap-1"><span className="font-bold">!</span> {nameError}</p>}
                </div>

                {/* Description with Expand Button */}
                <div>
                    <div className="flex items-start justify-between mb-2 gap-2">
                        <p className="font-comic text-sm sm:text-base font-bold text-gray-800 uppercase flex items-center">
                            Description
                            <Tooltip text="Add character details, backstory, powers, personality, appearance notes, or any information to help the AI understand this character better." />
                        </p>
                        <div className="flex flex-col gap-1 shrink-0">
                            {onImproveText && (
                                <button
                                    onClick={handleImproveBackstory}
                                    disabled={isImprovingBackstory || !(persona?.backstoryText?.trim())}
                                    className="comic-btn bg-purple-600 text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 hover:bg-purple-500 border-2 border-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={persona?.backstoryText?.trim() ? "Improve description with AI" : "Enter description text first"}
                                    aria-label="Improve description with AI"
                                >
                                    {isImprovingBackstory ? '⏳...' : '✨ AI'}
                                </button>
                            )}
                            <button
                                onClick={() => setShowExpandedBackstory(true)}
                                className="comic-btn bg-blue-500 text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 hover:bg-blue-400 border-2 border-black uppercase"
                                title="Expand backstory editor"
                                aria-label="Expand description editor"
                            >
                                ⤢ EXPAND
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={persona?.backstoryText || ''}
                        onChange={(e) => onUpdate({ backstoryText: e.target.value })}
                        placeholder="Details, backstory, powers, personality..."
                        className="w-full p-2.5 sm:p-3 border-2 border-black font-comic text-sm h-28 sm:h-32 resize-none shadow-[3px_3px_0px_rgba(0,0,0,0.1)] mb-3"
                        aria-label="Character description and backstory"
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                        <label className="comic-btn bg-gray-200 text-black text-xs sm:text-sm px-3 py-1.5 hover:bg-gray-300 cursor-pointer border-2 border-black">
                            UPLOAD FILES
                            <input
                                type="file"
                                multiple
                                accept=".txt,.md,image/*"
                                className="hidden"
                                onChange={(e) => e.target.files && onBackstoryFileUpload(e.target.files)}
                                aria-label="Upload backstory files"
                            />
                        </label>
                        {(persona?.backstoryFiles || []).map((f, i) => (
                            <div key={i} className="bg-yellow-100 border border-black p-1.5 text-[10px] sm:text-xs flex items-center gap-2">
                                {f.mimeType?.startsWith('image/') && f.base64 ? (
                                    <img src={`data:${f.mimeType};base64,${f.base64}`} alt={f.name} className="w-8 h-8 sm:w-10 sm:h-10 object-cover border border-black" />
                                ) : (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-200 border border-black text-gray-500 font-bold">DOC</div>
                                )}
                                <span className="truncate max-w-[80px] sm:max-w-[100px]">{f.name}</span>
                                <button onClick={() => onBackstoryFileRemove(i)} className="text-red-600 font-bold hover:scale-110 text-lg leading-none" aria-label={`Remove file ${f.name}`}>×</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expanded Backstory Modal */}
            {showExpandedBackstory && (
                <div className="fixed inset-0 z-[700] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4" onClick={() => setShowExpandedBackstory(false)}>
                    <div className="max-w-[800px] w-full bg-white border-[4px] sm:border-[6px] border-black p-4 sm:p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] sm:shadow-[12px_12px_0px_rgba(0,0,0,0.5)] relative max-h-[95vh] sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                            <h3 className="font-comic text-lg sm:text-2xl text-blue-600 uppercase tracking-tighter truncate">
                                {persona?.name ? `${persona.name}'s Description` : 'Character Description'}
                            </h3>
                            <button
                                onClick={() => setShowExpandedBackstory(false)}
                                className="shrink-0 bg-red-600 text-white w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-4 border-black font-bold text-lg sm:text-xl flex items-center justify-center hover:scale-110 hover:bg-red-500"
                            >×</button>
                        </div>
                        <textarea
                            value={persona?.backstoryText || ''}
                            onChange={(e) => onUpdate({ backstoryText: e.target.value })}
                            placeholder="Enter character details: appearance, powers/abilities, personality traits, backstory, motivations, relationships, weaknesses, key events in their history..."
                            className="flex-1 w-full p-3 sm:p-4 border-2 sm:border-4 border-black font-comic text-sm resize-none shadow-inner min-h-[250px] sm:min-h-[300px] leading-relaxed"
                            autoFocus
                        />
                        <div className="mt-3 sm:mt-4 flex justify-between items-center gap-2">
                            <p className="font-comic text-[10px] sm:text-xs text-gray-500">
                                {(persona?.backstoryText || '').length} chars
                            </p>
                            <div className="flex gap-2">
                                {onImproveText && (
                                    <button
                                        onClick={handleImproveBackstory}
                                        disabled={isImprovingBackstory || !persona?.backstoryText?.trim()}
                                        className="comic-btn bg-purple-600 text-white px-3 sm:px-4 py-2 font-bold border-2 sm:border-[3px] border-black hover:bg-purple-500 uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Improve description with AI"
                                    >
                                        {isImprovingBackstory ? '⏳ IMPROVING...' : '✨ AI IMPROVE'}
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowExpandedBackstory(false)}
                                    className="comic-btn bg-green-600 text-white px-4 sm:px-6 py-2 font-bold border-2 sm:border-[3px] border-black hover:bg-green-500 uppercase text-sm sm:text-base"
                                >
                                    ✓ DONE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
};

export default CharacterCard;
