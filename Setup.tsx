
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { GENRES, LANGUAGES, ART_STYLES, PAGE_LENGTHS, CHARACTER_ROLES, CharacterRole, Persona, StoryContext, EMBLEM_PLACEMENTS, EmblemPlacement } from './types';
// @ts-ignore
import thiinkLogo from './assets/thiink_mg_logo.svg';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative group inline-block ml-1 cursor-help align-middle">
        <span className="font-comic text-[10px] bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold border border-black hover:bg-blue-500 hover:scale-110 transition-transform">?</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56 p-2 bg-white text-black text-xs font-comic border-2 border-black drop-shadow-md z-[500] pointer-events-none" style={{ textTransform: 'none' }}>
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black"></div>
        </div>
    </div>
);

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    isGeneratingProfiles: boolean;
    hero: Persona | null;
    friend: Persona | null;
    additionalCharacters: Persona[];
    storyContext: StoryContext;
    selectedGenre: string;
    selectedLanguage: string;
    customPremise: string;
    richMode: boolean;
    onHeroUpdate: (updates: Partial<Persona>) => void;
    onResetHero: () => void;
    onFriendUpdate: (updates: Partial<Persona>) => void;
    onResetFriend: () => void;
    onAddCharacter: () => void;
    onUpdateCharacter: (id: string, updates: Partial<Persona>) => void;
    onDeleteCharacter: (id: string) => void;
    onStoryContextUpdate: (updates: Partial<StoryContext>) => void;
    onPortraitUpload: (id: string, file: File) => void;
    onRefUpload: (id: string, files: FileList) => void;
    onRefRemove: (id: string, index: number) => void;
    onEmblemUpload: (id: string, file: File) => void;
    onEmblemRemove: (id: string) => void;
    onWeaponUpload: (id: string, file: File) => void;
    onWeaponRemove: (id: string) => void;
    onBackstoryFileUpload: (id: string, files: FileList) => void;
    onBackstoryFileRemove: (id: string, index: number) => void;
    onStoryFileUpload: (files: FileList) => void;
    onStoryFileRemove: (index: number) => void;
    onGenreChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onLaunch: () => void;
    onSurpriseMe: () => void;
    onExportDraft: () => void;
    onImportDraft: (file: File) => void;
    onClearSetup: () => void;
}

const Footer = () => {
  const [remixIndex, setRemixIndex] = useState(0);
  const remixes = [
    "Add sounds to panels",
    "Animate panels with Veo 3",
    "Localize to Klingon",
    "Add a villain generator",
    "Print physical copies",
    "Add voice narration",
    "Create a shared universe"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRemixIndex(prev => (prev + 1) % remixes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-yellow-400 font-comic">
        <div className="flex items-center gap-2 text-lg md:text-xl">
            <span className="text-yellow-400 font-bold">REMIX IDEA:</span>
            <span className="animate-pulse">{remixes[remixIndex]}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span className="text-gray-500 text-sm hidden md:inline">Built with Gemini</span>
            <div className="flex items-center gap-3 border-r-2 border-gray-700 pr-4">
                <span className="text-gray-400 text-sm hidden sm:inline">Contributed by</span>
                <a href="https://thiinkmediagraphics.com" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
                    <img src={thiinkLogo} alt="Thiink Media Graphics" className="h-6 object-contain filter invert opacity-90" />
                </a>
            </div>
            <a href="https://x.com/ammaar" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors text-xl">Created by @ammaar</a>
        </div>
    </div>
  );
};

const MultimodalInput: React.FC<{
    label: string;
    textValue: string;
    files: { name: string; base64?: string; mimeType?: string }[];
    onTextChange: (val: string) => void;
    onFileUpload: (files: FileList) => void;
    onFileRemove: (index: number) => void;
    placeholder?: string;
}> = ({ label, textValue, files, onTextChange, onFileUpload, onFileRemove, placeholder }) => (
    <div className="mb-3">
        <p className="font-comic text-base mb-1 font-bold text-gray-800 uppercase">{label}</p>
        <textarea 
            value={textValue} 
            onChange={(e) => onTextChange(e.target.value)} 
            placeholder={placeholder} 
            className="w-full p-2 border-2 border-black font-comic text-sm h-20 resize-none shadow-[3px_3px_0px_rgba(0,0,0,0.1)] mb-2" 
        />
        <div className="flex flex-wrap gap-2 items-center">
            <label className="comic-btn bg-gray-200 text-black text-xs px-2 py-1 hover:bg-gray-300 cursor-pointer border-2 border-black">
                UPLOAD FILES
                <input 
                    type="file" 
                    multiple 
                    accept=".txt,.md,image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && onFileUpload(e.target.files)} 
                />
            </label>
            {files.map((f, i) => (
                <div key={i} className="bg-yellow-100 border border-black p-1 text-[10px] flex items-center gap-2">
                    {f.mimeType?.startsWith('image/') && f.base64 ? (
                        <img src={`data:${f.mimeType};base64,${f.base64}`} alt={f.name} className="w-8 h-8 object-cover border border-black" />
                    ) : (
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-200 border border-black text-gray-500 font-bold">DOC</div>
                    )}
                    <span className="truncate max-w-[80px]">{f.name}</span>
                    <button onClick={() => onFileRemove(i)} className="text-red-600 font-bold hover:scale-110 text-lg leading-none">×</button>
                </div>
            ))}
        </div>
    </div>
);

const CharacterCard: React.FC<{
    title: string;
    persona: Persona | null;
    isFixed?: boolean;
    onUpdate: (updates: Partial<Persona>) => void;
    onDelete?: () => void;
    onReset?: () => void;
    onPortraitUpload: (file: File) => void;
    onRefUpload: (files: FileList) => void;
    onRefRemove: (index: number) => void;
    onEmblemUpload: (file: File) => void;
    onEmblemRemove: () => void;
    onWeaponUpload: (file: File) => void;
    onWeaponRemove: () => void;
    onBackstoryFileUpload: (files: FileList) => void;
    onBackstoryFileRemove: (index: number) => void;
}> = ({ title, persona, isFixed, onUpdate, onDelete, onReset, onPortraitUpload, onRefUpload, onRefRemove, onEmblemUpload, onEmblemRemove, onWeaponUpload, onWeaponRemove, onBackstoryFileUpload, onBackstoryFileRemove }) => {
    const [showExpandedBackstory, setShowExpandedBackstory] = useState(false);

    return (
    <div className={`p-3 border-4 ${persona ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50'} transition-colors relative mb-4`}>
        <div className="flex justify-between items-center mb-2">
            <p className="font-comic text-lg uppercase font-bold text-blue-900">{title}</p>
            <div className="flex gap-2">
                {persona && <span className="text-green-600 font-bold font-comic text-sm animate-pulse">✓ READY</span>}
                {isFixed && persona && onReset && (
                    <button onClick={onReset} className="bg-orange-500 text-white text-xs px-2 py-1 font-comic border-2 border-black hover:bg-orange-400">RESET</button>
                )}
                {!isFixed && onDelete && (
                    <button onClick={onDelete} className="bg-red-600 text-white text-xs px-2 py-1 font-comic border-2 border-black hover:bg-red-500">DELETE</button>
                )}
            </div>
        </div>

        {/* Role Dropdown */}
        <div className="mb-3">
            <p className="font-comic text-xs mb-1 font-bold text-gray-600 uppercase">Character Role</p>
            <select
                value={persona?.role || ''}
                onChange={(e) => onUpdate({ role: e.target.value as CharacterRole, customRole: e.target.value === 'Custom' || e.target.value === 'Family/Friend' ? persona?.customRole || '' : undefined })}
                className="w-full p-1 border-2 border-black font-comic text-sm bg-white"
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
                    className="w-full p-1 border-2 border-black font-comic text-sm mt-1"
                />
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <p className="font-comic text-xs mb-1 font-bold text-gray-600 uppercase">Portrait (Required)</p>
                {persona?.base64 ? (
                    <div className="flex gap-3 items-center">
                        <img src={`data:image/jpeg;base64,${persona.base64}`} alt="Portrait" className="w-20 h-20 object-cover border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)] bg-white" />
                        <div className="flex flex-col gap-1">
                            <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-xs px-2 py-1 hover:bg-yellow-300 border-2 border-black uppercase">
                                REPLACE
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPortraitUpload(e.target.files[0])} />
                            </label>
                            <button onClick={() => onUpdate({ base64: '' })} className="comic-btn bg-red-500 text-white text-xs px-2 py-1 hover:bg-red-400 border-2 border-black uppercase">
                                CLEAR
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="comic-btn bg-blue-500 text-white text-sm px-3 py-2 block w-full hover:bg-blue-400 cursor-pointer text-center border-2 border-black">
                        UPLOAD PORTRAIT
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPortraitUpload(e.target.files[0])} />
                    </label>
                )}

                <div className="mt-3">
                    <div className="font-comic text-xs mb-1 font-bold text-gray-600 uppercase">
                        Reference Images (Optional)<Tooltip text="Upload multiple reference images to guide the AI (e.g. character sheets, style references, costume details). More refs = more consistency." />
                    </div>
                    {/* Gallery of existing reference images */}
                    {(persona?.referenceImages && persona.referenceImages.length > 0) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {persona.referenceImages.map((img, i) => (
                                <div key={i} className="relative group">
                                    <img src={`data:image/jpeg;base64,${img}`} alt={`Ref ${i+1}`} className="w-16 h-16 object-cover border-2 border-black bg-white" />
                                    <button
                                        onClick={() => onRefRemove(i)}
                                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center border border-black opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <label className="comic-btn bg-gray-400 text-white text-sm px-3 py-2 block w-full hover:bg-gray-500 cursor-pointer text-center border-2 border-black">
                        + ADD REFERENCE{(persona?.referenceImages?.length || 0) > 0 ? ` (${persona!.referenceImages!.length})` : ''}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && e.target.files.length > 0 && onRefUpload(e.target.files)} />
                    </label>
                </div>

                {/* Emblem/Logo Section */}
                <div className="mt-3">
                    <div className="font-comic text-xs mb-1 font-bold text-gray-600 uppercase">
                        Emblem / Logo (Optional)<Tooltip text="Upload an emblem or logo that should appear consistently on this character (e.g., superhero symbol, team badge, tattoo). Select placement for AI consistency." />
                    </div>
                    {persona?.emblemImage ? (
                        <div className="flex gap-2 items-start mb-2">
                            <img src={`data:image/jpeg;base64,${persona.emblemImage}`} alt="Emblem" className="w-16 h-16 object-contain border-2 border-black bg-white" />
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-xs px-2 py-1 hover:bg-yellow-300 border-2 border-black uppercase text-center">
                                    REPLACE
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onEmblemUpload(e.target.files[0])} />
                                </label>
                                <button onClick={onEmblemRemove} className="comic-btn bg-red-500 text-white text-xs px-2 py-1 hover:bg-red-400 border-2 border-black uppercase">
                                    CLEAR
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="comic-btn bg-purple-500 text-white text-sm px-3 py-2 block w-full hover:bg-purple-400 cursor-pointer text-center border-2 border-black mb-2">
                            + ADD EMBLEM/LOGO
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onEmblemUpload(e.target.files[0])} />
                        </label>
                    )}
                    {/* Placement dropdown - only show if emblem exists */}
                    {persona?.emblemImage && (
                        <div className="space-y-1">
                            <select
                                value={persona?.emblemPlacement || ''}
                                onChange={(e) => onUpdate({ emblemPlacement: e.target.value as EmblemPlacement || undefined, emblemPlacementCustom: e.target.value === 'other' ? persona?.emblemPlacementCustom : undefined })}
                                className="w-full p-1 border-2 border-black font-comic text-xs bg-white"
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
                                    className="w-full p-1 border-2 border-black font-comic text-xs"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Weapon Reference Section */}
                <div className="mt-3">
                    <div className="font-comic text-xs mb-1 font-bold text-gray-600 uppercase">
                        Signature Weapon (Optional)<Tooltip text="Upload a reference image of the character's signature weapon (sword, gun, staff, etc.) for AI consistency. Add a description for better results." />
                    </div>
                    {persona?.weaponImage ? (
                        <div className="flex gap-2 items-start mb-2">
                            <img src={`data:image/jpeg;base64,${persona.weaponImage}`} alt="Weapon" className="w-16 h-16 object-contain border-2 border-black bg-white" />
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-xs px-2 py-1 hover:bg-yellow-300 border-2 border-black uppercase text-center">
                                    REPLACE
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onWeaponUpload(e.target.files[0])} />
                                </label>
                                <button onClick={onWeaponRemove} className="comic-btn bg-red-500 text-white text-xs px-2 py-1 hover:bg-red-400 border-2 border-black uppercase">
                                    CLEAR
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="comic-btn bg-amber-600 text-white text-sm px-3 py-2 block w-full hover:bg-amber-500 cursor-pointer text-center border-2 border-black mb-2">
                            + ADD WEAPON REF
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onWeaponUpload(e.target.files[0])} />
                        </label>
                    )}
                    {/* Weapon description - only show if weapon image exists */}
                    {persona?.weaponImage && (
                        <textarea
                            value={persona?.weaponDescriptionText || ''}
                            onChange={(e) => onUpdate({ weaponDescriptionText: e.target.value })}
                            placeholder="Describe the weapon: type, size, material, colors, engravings, glowing effects, unique features..."
                            className="w-full p-1 border-2 border-black font-comic text-xs h-14 resize-none"
                        />
                    )}
                </div>
            </div>

            <div>
                <div className="mb-2">
                    <p className="font-comic text-xs mb-1 font-bold text-gray-600 uppercase">Name</p>
                    <input
                        type="text"
                        value={persona?.name || ''}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        placeholder="Character Name"
                        className="w-full p-1 border-2 border-black font-comic text-sm"
                    />
                </div>
                {/* Backstory with Expand Button */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <p className="font-comic text-base font-bold text-gray-800 uppercase">Character Backstory</p>
                        <button
                            onClick={() => setShowExpandedBackstory(true)}
                            className="comic-btn bg-blue-500 text-white text-[10px] px-2 py-0.5 hover:bg-blue-400 border-2 border-black uppercase"
                            title="Expand backstory editor"
                        >
                            ⤢ EXPAND
                        </button>
                    </div>
                    <textarea
                        value={persona?.backstoryText || ''}
                        onChange={(e) => onUpdate({ backstoryText: e.target.value })}
                        placeholder="Origins, personality, notes..."
                        className="w-full p-2 border-2 border-black font-comic text-sm h-20 resize-none shadow-[3px_3px_0px_rgba(0,0,0,0.1)] mb-2"
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                        <label className="comic-btn bg-gray-200 text-black text-xs px-2 py-1 hover:bg-gray-300 cursor-pointer border-2 border-black">
                            UPLOAD FILES
                            <input
                                type="file"
                                multiple
                                accept=".txt,.md,image/*"
                                className="hidden"
                                onChange={(e) => e.target.files && onBackstoryFileUpload(e.target.files)}
                            />
                        </label>
                        {(persona?.backstoryFiles || []).map((f, i) => (
                            <div key={i} className="bg-yellow-100 border border-black p-1 text-[10px] flex items-center gap-2">
                                {f.mimeType?.startsWith('image/') && f.base64 ? (
                                    <img src={`data:${f.mimeType};base64,${f.base64}`} alt={f.name} className="w-8 h-8 object-cover border border-black" />
                                ) : (
                                    <div className="w-8 h-8 flex items-center justify-center bg-gray-200 border border-black text-gray-500 font-bold">DOC</div>
                                )}
                                <span className="truncate max-w-[80px]">{f.name}</span>
                                <button onClick={() => onBackstoryFileRemove(i)} className="text-red-600 font-bold hover:scale-110 text-lg leading-none">×</button>
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
                                {persona?.name ? `${persona.name}'s Backstory` : 'Character Backstory'}
                            </h3>
                            <button
                                onClick={() => setShowExpandedBackstory(false)}
                                className="shrink-0 bg-red-600 text-white w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-4 border-black font-bold text-lg sm:text-xl flex items-center justify-center hover:scale-110 hover:bg-red-500"
                            >×</button>
                        </div>
                        <textarea
                            value={persona?.backstoryText || ''}
                            onChange={(e) => onUpdate({ backstoryText: e.target.value })}
                            placeholder="Enter detailed character backstory: origins, personality traits, motivations, relationships, powers/abilities, weaknesses, key events in their history..."
                            className="flex-1 w-full p-3 sm:p-4 border-2 sm:border-4 border-black font-comic text-sm resize-none shadow-inner min-h-[250px] sm:min-h-[300px] leading-relaxed"
                            autoFocus
                        />
                        <div className="mt-3 sm:mt-4 flex justify-between items-center gap-2">
                            <p className="font-comic text-[10px] sm:text-xs text-gray-500">
                                {(persona?.backstoryText || '').length} chars
                            </p>
                            <button
                                onClick={() => setShowExpandedBackstory(false)}
                                className="comic-btn bg-green-600 text-white px-4 sm:px-6 py-2 font-bold border-2 sm:border-[3px] border-black hover:bg-green-500 uppercase text-sm sm:text-base"
                            >
                                ✓ DONE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
};

export const Setup: React.FC<SetupProps> = (props) => {
    const [showTutorial, setShowTutorial] = useState(false);

    if (!props.show && !props.isTransitioning && !showTutorial) {
        return null;
    }

    return (
        <>
        <style>{`
             @keyframes knockout-exit {
                0% { transform: scale(1) rotate(1deg); }
                15% { transform: scale(1.1) rotate(-5deg); }
                100% { transform: translateY(-200vh) rotate(1080deg) scale(0.5); opacity: 1; }
             }
             @keyframes pow-enter {
                 0% { transform: translate(-50%, -50%) scale(0) rotate(-45deg); opacity: 0; }
                 30% { transform: translate(-50%, -50%) scale(1.5) rotate(10deg); opacity: 1; }
                 100% { transform: translate(-50%, -50%) scale(1.8) rotate(0deg); opacity: 0; }
             }
          `}</style>
        {props.isTransitioning && (
            <div className="fixed top-1/2 left-1/2 z-[210] pointer-events-none" style={{ animation: 'pow-enter 1s forwards ease-out' }}>
                <svg viewBox="0 0 200 150" className="w-[500px] h-[400px] drop-shadow-[0_10px_0_rgba(0,0,0,0.5)]">
                    <path d="M95.7,12.8 L110.2,48.5 L148.5,45.2 L125.6,74.3 L156.8,96.8 L119.4,105.5 L122.7,143.8 L92.5,118.6 L60.3,139.7 L72.1,103.2 L34.5,108.8 L59.9,79.9 L24.7,57.3 L62.5,54.4 L61.2,16.5 z" fill="#FFD700" stroke="black" strokeWidth="4"/>
                    <text x="100" y="95" textAnchor="middle" fontFamily="'Bangers', cursive" fontSize="70" fill="#DC2626" stroke="black" strokeWidth="2" transform="rotate(-5 100 75)">POW!</text>
                </svg>
            </div>
        )}
        
        <div className={`fixed inset-0 z-[200] overflow-y-auto`}
             style={{
                 background: props.isTransitioning ? 'transparent' : 'rgba(0,0,0,0.85)', 
                 backdropFilter: props.isTransitioning ? 'none' : 'blur(6px)',
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          <div className="min-h-full flex items-center justify-center p-4 pb-32 md:pb-24">
            {/* Compacted width and internal spacing */}
            <div className="max-w-[900px] w-full bg-white p-4 md:p-5 rotate-1 border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,0.6)] text-center relative">
                
                <h1 className="font-comic text-5xl text-red-600 leading-none mb-1 tracking-wide inline-block mr-3" style={{textShadow: '2px 2px 0px black'}}>INFINITE</h1>
                <h1 className="font-comic text-5xl text-yellow-400 leading-none mb-4 tracking-wide inline-block" style={{textShadow: '2px 2px 0px black'}}>HEROES</h1>
                
                <div className="flex flex-col md:flex-row gap-4 mb-4 text-left">
                    
                    {/* Left Column: Cast */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1 flex justify-between items-center">
                            <span>1. THE CAST</span>
                            <button onClick={props.onAddCharacter} className="bg-blue-600 text-white text-xs px-2 py-1 hover:bg-blue-500 border-2 border-black">ADD CHARACTER</button>
                        </div>
                        
                        <div className="max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                            <CharacterCard
                                title="MAIN (REQUIRED)"
                                persona={props.hero}
                                isFixed
                                onUpdate={props.onHeroUpdate}
                                onReset={props.onResetHero}
                                onPortraitUpload={(file) => props.onPortraitUpload('hero', file)}
                                onRefUpload={(files) => props.onRefUpload('hero', files)}
                                onRefRemove={(i) => props.onRefRemove('hero', i)}
                                onEmblemUpload={(file) => props.onEmblemUpload('hero', file)}
                                onEmblemRemove={() => props.onEmblemRemove('hero')}
                                onWeaponUpload={(file) => props.onWeaponUpload('hero', file)}
                                onWeaponRemove={() => props.onWeaponRemove('hero')}
                                onBackstoryFileUpload={(files) => props.onBackstoryFileUpload('hero', files)}
                                onBackstoryFileRemove={(i) => props.onBackstoryFileRemove('hero', i)}
                            />

                            <CharacterCard
                                title="CO-STAR (OPTIONAL)"
                                persona={props.friend}
                                isFixed
                                onUpdate={props.onFriendUpdate}
                                onReset={props.onResetFriend}
                                onPortraitUpload={(file) => props.onPortraitUpload('friend', file)}
                                onRefUpload={(files) => props.onRefUpload('friend', files)}
                                onRefRemove={(i) => props.onRefRemove('friend', i)}
                                onEmblemUpload={(file) => props.onEmblemUpload('friend', file)}
                                onEmblemRemove={() => props.onEmblemRemove('friend')}
                                onWeaponUpload={(file) => props.onWeaponUpload('friend', file)}
                                onWeaponRemove={() => props.onWeaponRemove('friend')}
                                onBackstoryFileUpload={(files) => props.onBackstoryFileUpload('friend', files)}
                                onBackstoryFileRemove={(i) => props.onBackstoryFileRemove('friend', i)}
                            />

                            {props.additionalCharacters.map((char) => (
                                <CharacterCard
                                    key={char.id}
                                    title="ADDITIONAL CHARACTER"
                                    persona={char}
                                    onUpdate={(updates) => props.onUpdateCharacter(char.id, updates)}
                                    onDelete={() => props.onDeleteCharacter(char.id)}
                                    onPortraitUpload={(file) => props.onPortraitUpload(char.id, file)}
                                    onRefUpload={(files) => props.onRefUpload(char.id, files)}
                                    onRefRemove={(i) => props.onRefRemove(char.id, i)}
                                    onEmblemUpload={(file) => props.onEmblemUpload(char.id, file)}
                                    onEmblemRemove={() => props.onEmblemRemove(char.id)}
                                    onWeaponUpload={(file) => props.onWeaponUpload(char.id, file)}
                                    onWeaponRemove={() => props.onWeaponRemove(char.id)}
                                    onBackstoryFileUpload={(files) => props.onBackstoryFileUpload(char.id, files)}
                                    onBackstoryFileRemove={(i) => props.onBackstoryFileRemove(char.id, i)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1 flex justify-between items-center">
                            <span>2. THE STORY</span>
                            <button onClick={props.onSurpriseMe} className="bg-yellow-400 text-black text-xs px-2 py-1 hover:bg-yellow-300 border-2 border-black flex items-center gap-1 font-bold">🎲 SURPRISE ME!</button>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 border-4 border-black h-full flex flex-col">
                            <div className="mb-3">
                                <p className="font-comic text-base mb-1 font-bold text-gray-800 uppercase">Story Title</p>
                                <input 
                                    type="text" 
                                    value={props.storyContext.title} 
                                    onChange={(e) => props.onStoryContextUpdate({ title: e.target.value })} 
                                    placeholder="Enter your story title..."
                                    className="w-full p-2 border-2 border-black font-comic text-lg shadow-[3px_3px_0px_rgba(0,0,0,0.1)]"
                                />
                            </div>

                            <MultimodalInput 
                                label="Describe Your Story"
                                textValue={props.storyContext.descriptionText}
                                files={props.storyContext.descriptionFiles}
                                onTextChange={(val) => props.onStoryContextUpdate({ descriptionText: val })}
                                onFileUpload={props.onStoryFileUpload}
                                onFileRemove={props.onStoryFileRemove}
                                placeholder="Type or paste a synopsis, script, or plot points..."
                            />

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">GENRE</p>
                                    <select value={props.selectedGenre} onChange={(e) => props.onGenreChange(e.target.value)} className="w-full font-comic text-sm p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                                        {GENRES.map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">ART STYLE</p>
                                    <select value={props.storyContext.artStyle} onChange={(e) => props.onStoryContextUpdate({ artStyle: e.target.value })} className="w-full font-comic text-sm p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                                        {ART_STYLES.map(a => <option key={a} value={a} className="text-black">{a}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">ISSUE LENGTH</p>
                                    <select value={props.storyContext.pageLength} onChange={(e) => props.onStoryContextUpdate({ pageLength: Number(e.target.value) })} className="w-full font-comic text-sm p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                                        {PAGE_LENGTHS.map(l => <option key={l.value} value={l.value} className="text-black">{l.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">LANGUAGE</p>
                                    <select value={props.selectedLanguage} onChange={(e) => props.onLanguageChange(e.target.value)} className="w-full font-comic text-sm p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                                        {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-black">{l.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {props.selectedGenre === 'Custom' && (
                                <div className="mb-3">
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">PREMISE</p>
                                    <textarea value={props.customPremise} onChange={(e) => props.onPremiseChange(e.target.value)} placeholder="Enter your story premise..." className="w-full p-1 border-2 border-black font-comic text-sm h-16 resize-none shadow-[2px_2px_0px_rgba(0,0,0,0.1)]" />
                                </div>
                            )}

                            <div className="font-comic text-xl text-black border-b-4 border-black mb-2 mt-2">3. COVER CONFIG</div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="col-span-2">
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">Series Title</p>
                                    <input 
                                        type="text" 
                                        value={props.storyContext.seriesTitle} 
                                        onChange={(e) => props.onStoryContextUpdate({ seriesTitle: e.target.value })} 
                                        className="w-full p-1 border-2 border-black font-comic text-sm"
                                    />
                                </div>
                                <div>
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">Publisher Name</p>
                                    <input 
                                        type="text" 
                                        value={props.storyContext.publisherName} 
                                        onChange={(e) => props.onStoryContextUpdate({ publisherName: e.target.value })} 
                                        className="w-full p-1 border-2 border-black font-comic text-sm"
                                    />
                                </div>
                                <div>
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">Issue #</p>
                                    <input 
                                        type="text" 
                                        value={props.storyContext.issueNumber} 
                                        onChange={(e) => props.onStoryContextUpdate({ issueNumber: e.target.value })} 
                                        placeholder="1"
                                        className="w-full p-1 border-2 border-black font-comic text-sm"
                                    />
                                </div>
                                <div className="col-span-2 flex flex-col gap-2">
                                    <p className="font-comic text-xs mb-1 font-bold text-gray-800 uppercase">Publisher Logo / Branding</p>
                                    <label className="comic-btn bg-gray-200 text-black text-xs px-2 py-1 hover:bg-gray-300 cursor-pointer border-2 border-black flex items-center justify-center gap-2">
                                        {props.storyContext.publisherLogo ? (
                                            <img src={`data:image/jpeg;base64,${props.storyContext.publisherLogo}`} className="max-h-6" />
                                        ) : null}
                                        <span>{props.storyContext.publisherLogo ? 'REPLACE LOGO' : 'UPLOAD LOGO (OPTIONAL)'}</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        const base64 = (reader.result as string).split(',')[1];
                                                        props.onStoryContextUpdate({ publisherLogo: base64 });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} 
                                        />
                                    </label>
                                    <div className="flex gap-2 w-full mt-1">
                                        <div className="flex items-center gap-1">
                                            <input type="color" value={props.storyContext.publisherLogoBgColor || '#DC2626'} onChange={(e) => props.onStoryContextUpdate({ publisherLogoBgColor: e.target.value })} className="h-6 w-6 p-0 border-2 border-black cursor-pointer align-middle" title="Logo Background Color" />
                                            <span className="text-[10px] font-comic font-bold uppercase text-gray-700">BG Color</span>
                                        </div>
                                        <select value={props.storyContext.publisherLogoFit || 'contain'} onChange={(e) => props.onStoryContextUpdate({ publisherLogoFit: e.target.value as 'cover' | 'contain' })} className="font-comic text-[10px] border-2 border-black p-1 flex-1 bg-white cursor-pointer uppercase font-bold">
                                            <option value="contain">Fill (Contain)</option>
                                            <option value="cover">Crop (Cover)</option>
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-1 font-comic text-xs cursor-pointer text-black hover:text-blue-600 transition-colors mt-1">
                                        <input type="checkbox" checked={props.storyContext.useOverlayLogo} onChange={(e) => props.onStoryContextUpdate({ useOverlayLogo: e.target.checked })} className="w-4 h-4 accent-black" />
                                        <span>USE CLASSIC COMIC COVER OVERLAY</span>
                                        <Tooltip text="When ON, the app enforces a clean logo and issue box overlay. When OFF, the AI will attempt to draw the logo natively into the image pixels (often messy)." />
                                    </label>
                                </div>
                            </div>
                            
                            <div className="mt-auto pt-2 border-t-2 border-black">
                                <label className="flex items-center gap-1 font-comic text-sm cursor-pointer text-black p-1 hover:bg-yellow-100 rounded border-2 border-transparent hover:border-yellow-300 transition-colors">
                                    <input type="checkbox" checked={props.richMode} onChange={(e) => props.onRichModeChange(e.target.checked)} className="w-4 h-4 accent-black" />
                                    <span className="text-black">✨ Rich Dialogue Mode</span>
                                    <Tooltip text="Uses longer, descriptive captions and deep internal monologues vs standard punchy comic dialogue. Works with both Novel Mode and Outline Mode." />
                                </label>
                                <p className="font-comic text-[10px] text-gray-500 mt-1 pl-1">
                                    Story mode (Novel/Outline) is selected after clicking "Start Adventure"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Responsive Grid Layout */}
                <div className="flex flex-col gap-2 w-full mt-2">
                    {/* Utility Buttons: 2x2 grid on mobile, row on tablet+ */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                        <button onClick={() => setShowTutorial(true)} className="comic-btn bg-blue-600 text-white text-base sm:text-lg lg:text-xl px-3 py-2.5 sm:py-3 hover:bg-blue-500 uppercase tracking-wider border-[3px] border-black font-bold">
                            📖 PLAY
                        </button>
                        <button onClick={props.onExportDraft} className="comic-btn bg-indigo-600 text-white text-base sm:text-lg lg:text-xl px-3 py-2.5 sm:py-3 hover:bg-indigo-500 uppercase tracking-wider border-[3px] border-black font-bold">
                            💾 SAVE
                        </button>
                        <label className="comic-btn text-center bg-gray-600 text-white text-base sm:text-lg lg:text-xl px-3 py-2.5 sm:py-3 hover:bg-gray-500 uppercase tracking-wider cursor-pointer border-[3px] border-black font-bold">
                            📂 LOAD
                            <input type="file" accept=".json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { props.onImportDraft(e.target.files[0]); e.target.value = ''; } }} />
                        </label>
                        <button onClick={props.onClearSetup} className="comic-btn bg-orange-500 text-white text-base sm:text-lg lg:text-xl px-3 py-2.5 sm:py-3 hover:bg-orange-400 uppercase tracking-wider border-[3px] border-black font-bold">
                            🗑️ CLEAR
                        </button>
                    </div>
                    {/* Start Adventure Button - Always Full Width */}
                    <button onClick={props.onLaunch} disabled={!props.hero || props.isTransitioning || props.isGeneratingProfiles} className="comic-btn bg-red-600 text-white text-2xl sm:text-3xl px-6 py-3 w-full hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-wider font-bold border-[3px] border-black flex items-center justify-center gap-3">
                        {props.isGeneratingProfiles ? (
                            <>
                                <div className="animate-spin w-8 h-8 border-[4px] border-white border-t-transparent rounded-full"></div>
                                <span className="animate-pulse text-xl sm:text-2xl">ANALYZING PORTRAITS...</span>
                            </>
                        ) : props.isTransitioning ? 'LAUNCHING...' : '🚀 START ADVENTURE!'}
                    </button>
                </div>
            </div>
          </div>

          {/* Tutorial Modal */}
          {showTutorial && (
            <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="max-w-[700px] w-full bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] rotate-1 relative">
                    <button onClick={() => setShowTutorial(false)} className="absolute -top-4 -right-4 bg-red-600 text-white w-10 h-10 border-4 border-black font-bold text-xl flex items-center justify-center hover:scale-110 hover:bg-red-500">×</button>
                    
                    <h2 className="font-comic text-4xl text-blue-600 mb-6 uppercase tracking-tighter text-center">How To Play</h2>
                    
                    <div className="space-y-4 font-comic text-sm md:text-base mb-6">
                        <div className="flex gap-3 items-start">
                            <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black">1</span>
                            <div>
                                <p className="font-bold text-lg leading-tight uppercase">Build Your Cast</p>
                                <p className="text-gray-700">Upload portraits (required) and reference images for your Hero and Co-Star. Reference images drastically alter the AI's depiction of the character!</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 items-start">
                            <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black">2</span>
                            <div>
                                <p className="font-bold text-lg leading-tight uppercase">Set The Scene</p>
                                <p className="text-gray-700">Pick a genre, title, and write a detailed premise. You can even upload text documents or scripts to feed the AI rich backstory!</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black">3</span>
                            <div>
                                <p className="font-bold text-lg leading-tight uppercase">Choose A Mode</p>
                                <p className="text-gray-700"><strong>🎲 Novel Mode (Default):</strong> Generates 3 pages at a time, pauses for your narrative choices, then continues. Your decisions shape the story! <br/><strong>📖 Outline Mode:</strong> Generates a full story outline for your review, then fully automates the entire comic from start to finish!</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 items-start">
                            <span className="bg-yellow-400 text-black px-2 py-1 font-bold border-2 border-black">4</span>
                            <div>
                                <p className="font-bold text-lg leading-tight uppercase">Read & Export</p>
                                <p className="text-gray-700">Once generation finishes, read the comic book natively in the app interface! Hit the download button to export the pages to share them online.</p>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={() => setShowTutorial(false)} className="comic-btn bg-green-600 text-white px-8 py-3 text-2xl font-bold w-full hover:bg-green-500">GOT IT!</button>
                </div>
            </div>
          )}
        </div>

        {/* Footer is only visible when setup is active */}
        <Footer />
        </>
    );
}
