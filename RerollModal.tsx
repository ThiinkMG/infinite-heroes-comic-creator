/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { RegenerationMode, ShotType, BalloonShape, RerollOptions, CharacterProfile } from './types';

// Shot type options with icons
const SHOT_OPTIONS: { shot: ShotType; icon: string; label: string }[] = [
    { shot: 'extreme-close-up', icon: '👁️', label: 'XCU' },
    { shot: 'close-up', icon: '😊', label: 'Close-up' },
    { shot: 'medium', icon: '🧍', label: 'Medium' },
    { shot: 'full', icon: '🧑', label: 'Full' },
    { shot: 'wide', icon: '🏙️', label: 'Wide' },
    { shot: 'extreme-wide', icon: '🌆', label: 'Establishing' },
];

// Balloon shape options
const BALLOON_OPTIONS: { shape: BalloonShape; label: string; desc: string }[] = [
    { shape: 'oval', label: 'Normal', desc: 'Standard speech' },
    { shape: 'burst', label: 'Shouting!', desc: 'Loud, excited' },
    { shape: 'wavy', label: 'Weak...', desc: 'Distressed, injured' },
    { shape: 'dashed', label: 'Whisper', desc: 'Quiet, secretive' },
    { shape: 'jagged', label: 'Radio/Phone', desc: 'Electronic' },
    { shape: 'rectangle', label: 'Robot/AI', desc: 'Mechanical voice' },
];

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
    fullProfiles: CharacterProfile[];  // Full profile data for editing
    originalPrompt?: string;  // For debugging/reference
    onSubmit: (options: RerollOptions) => void;
    onClose: () => void;
    onUploadRef: (files: FileList) => void;
    onDeleteRef: (charId: string, refIndex: number) => void;
    onProfileUpdate?: (profileId: string, updates: Partial<CharacterProfile>) => void;
    onAnalyzeProfile?: (profileId: string) => Promise<void>;
    onAddNewCharacter?: () => void;
    onImproveText?: (text: string, context?: string, purpose?: 'story_description' | 'regeneration_instruction' | 'backstory') => Promise<string>;
}

export const RerollModal: React.FC<RerollModalProps> = ({
    pageIndex,
    outline,
    allRefImages,
    availableProfiles,
    fullProfiles,
    originalPrompt,
    onSubmit,
    onClose,
    onUploadRef,
    onDeleteRef,
    onProfileUpdate,
    onAnalyzeProfile,
    onAddNewCharacter,
    onImproveText
}) => {
    const [instruction, setInstruction] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(allRefImages.map(r => r.id)));
    const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set(availableProfiles.map(p => p.id)));
    const [deleteMode, setDeleteMode] = useState(false);
    const [regenerationModes, setRegenerationModes] = useState<Set<RegenerationMode>>(new Set(['full']));
    const [showOriginalPrompt, setShowOriginalPrompt] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImprovingInstruction, setIsImprovingInstruction] = useState(false);

    // Profile editor state
    const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
    const [analyzingProfileId, setAnalyzingProfileId] = useState<string | null>(null);

    // Comic fundamentals overrides
    const [shotTypeOverride, setShotTypeOverride] = useState<ShotType | undefined>(undefined);
    const [balloonShapeOverride, setBalloonShapeOverride] = useState<BalloonShape | undefined>(undefined);
    const [applyFlashbackStyle, setApplyFlashbackStyle] = useState(false);

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
        const selectedRefImages = allRefImages
            .filter(r => selectedIds.has(r.id))
            .map(r => r.base64);

        const options: RerollOptions = {
            regenerationModes: regenerationModes.size > 0 ? Array.from(regenerationModes) : undefined,
            instruction,
            negativePrompt: negativePrompt.trim() || undefined,
            selectedRefImages,
            selectedProfileIds: Array.from(selectedProfileIds),
            shotTypeOverride,
            balloonShapeOverride,
            applyFlashbackStyle: applyFlashbackStyle || undefined,
        };

        onSubmit(options);
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

    // Profile editor helpers
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
                alert('Failed to parse JSON file.');
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

    const handleImproveInstruction = async () => {
        if (!onImproveText || !instruction.trim()) return;
        setIsImprovingInstruction(true);
        try {
            const improved = await onImproveText(instruction, undefined, 'regeneration_instruction');
            setInstruction(improved);
        } catch (e) {
            console.error('Failed to improve instruction:', e);
            alert('Failed to improve text. Please try again.');
        } finally {
            setIsImprovingInstruction(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-[6px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-[750px] w-full max-h-[90vh] md:max-h-[90vh] overflow-y-auto m-0 md:m-4 rounded-t-lg md:rounded-none relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-yellow-400 border-b-[4px] border-black px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="font-comic text-lg md:text-2xl font-bold uppercase tracking-wider text-black">
                        🎲 Reroll Panel #{pageIndex}
                    </h2>
                    <button
                        onClick={onClose}
                        className="comic-btn bg-red-600 text-white w-10 h-10 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500"
                    >✕</button>
                </div>

                <div className="p-3 md:p-5 flex flex-col gap-4 md:gap-5">

                    {/* Story Outline Section */}
                    {outline && (
                        <div className="border-[3px] border-black bg-blue-50 p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-comic text-sm font-bold uppercase text-blue-900">📖 Story Outline</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(outline);
                                            const btn = document.activeElement as HTMLButtonElement;
                                            const originalText = btn.textContent;
                                            btn.textContent = '✓ Copied!';
                                            setTimeout(() => { btn.textContent = originalText; }, 1500);
                                        }}
                                        className="comic-btn bg-blue-500 text-white text-xs px-3 py-1 border-[2px] border-black hover:bg-blue-400 font-bold"
                                    >📋 Copy</button>
                                    <button
                                        onClick={handleDownloadOutline}
                                        className="comic-btn bg-blue-600 text-white text-xs px-3 py-1 border-[2px] border-black hover:bg-blue-500 font-bold"
                                    >⬇ Download</button>
                                </div>
                            </div>
                            <pre className="text-xs font-mono bg-white border-2 border-gray-300 p-3 max-h-32 overflow-y-auto whitespace-pre-wrap text-gray-700">
                                {outline}
                            </pre>
                        </div>
                    )}

                    {/* Regeneration Mode Selector - Multiple Selection */}
                    <div className="border-[3px] border-black bg-indigo-50 p-4">
                        <p className="font-comic text-sm font-bold uppercase text-indigo-900 mb-2">
                            🔄 Regeneration Mode
                            <span className="font-normal text-[10px] text-indigo-600 ml-2">(Select one or more options)</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { mode: 'full' as RegenerationMode, label: '🎲 Full Reroll', desc: 'Regenerate entire panel from scratch', tooltip: 'Completely regenerates the panel with new composition, characters, and background' },
                                { mode: 'characters_only' as RegenerationMode, label: '👥 Characters Only', desc: 'Keep scene/background, refresh characters', tooltip: 'Keeps the same scene and background, but regenerates how characters appear' },
                                { mode: 'expression_only' as RegenerationMode, label: '😊 Expression Only', desc: 'Keep everything, change facial expression', tooltip: 'Minimal change - only adjusts character facial expressions' },
                                { mode: 'outfit_only' as RegenerationMode, label: '👔 Outfit Only', desc: 'Keep everything, change clothing', tooltip: 'Keeps poses and scene, but changes what characters are wearing' }
                            ].map(opt => (
                                <button
                                    key={opt.mode}
                                    type="button"
                                    title={opt.tooltip}
                                    onClick={() => {
                                        setRegenerationModes((prev: Set<RegenerationMode>) => {
                                            const next = new Set(prev);
                                            if (next.has(opt.mode)) {
                                                next.delete(opt.mode);
                                            } else {
                                                next.add(opt.mode);
                                            }
                                            return next;
                                        });
                                    }}
                                    className={`flex flex-col p-2 sm:p-3 border-2 cursor-pointer transition-all text-left ${
                                        regenerationModes.has(opt.mode)
                                            ? 'border-indigo-500 bg-indigo-100 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]'
                                            : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                            regenerationModes.has(opt.mode) ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400 bg-white'
                                        }`}>
                                            {regenerationModes.has(opt.mode) && <span className="text-white text-xs">✓</span>}
                                        </div>
                                        <span className="font-comic text-xs sm:text-sm font-bold">{opt.label}</span>
                                    </div>
                                    <span className="font-comic text-[10px] sm:text-xs text-gray-500 ml-7 mt-1">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                        {regenerationModes.size === 0 && (
                            <p className="text-[10px] text-indigo-600 font-comic mt-2 italic">No mode selected - will use default behavior</p>
                        )}
                    </div>

                    {/* Shot Type Selector - Comic Fundamentals */}
                    <div className="border-[3px] border-black bg-cyan-50 p-4">
                        <p className="font-comic text-sm font-bold uppercase text-cyan-900 mb-2">
                            📷 Camera Shot Override
                            <span className="font-normal text-[10px] text-cyan-600 ml-2">(Click selected to uncheck for None)</span>
                        </p>
                        <p className="font-comic text-[10px] text-cyan-700 mb-2">
                            Override the default camera framing for this panel
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {SHOT_OPTIONS.map(opt => (
                                <button
                                    key={opt.shot}
                                    onClick={() => setShotTypeOverride(shotTypeOverride === opt.shot ? undefined : opt.shot)}
                                    className={`flex flex-col items-center p-2 border-2 transition-colors ${
                                        shotTypeOverride === opt.shot
                                            ? 'border-cyan-500 bg-cyan-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                            : 'border-gray-300 bg-white hover:border-cyan-300'
                                    }`}
                                    title={`${opt.shot} - Click again to deselect`}
                                >
                                    <span className="text-lg">{opt.icon}</span>
                                    <span className="font-comic text-[10px] font-bold">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        {shotTypeOverride === undefined && (
                            <p className="text-[10px] text-cyan-600 font-comic mt-2 italic">None selected - will use outline/auto</p>
                        )}
                    </div>

                    {/* Balloon Shape Selector - Comic Fundamentals */}
                    <div className="border-[3px] border-black bg-pink-50 p-4">
                        <p className="font-comic text-sm font-bold uppercase text-pink-900 mb-2">
                            💬 Dialogue Style Override
                            <span className="font-normal text-[10px] text-pink-600 ml-2">(Click selected to uncheck for None)</span>
                        </p>
                        <p className="font-comic text-[10px] text-pink-700 mb-2">
                            Change how speech bubbles appear in this panel
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {BALLOON_OPTIONS.map(opt => (
                                <button
                                    key={opt.shape}
                                    onClick={() => setBalloonShapeOverride(balloonShapeOverride === opt.shape ? undefined : opt.shape)}
                                    className={`flex flex-col p-2 border-2 transition-colors ${
                                        balloonShapeOverride === opt.shape
                                            ? 'border-pink-500 bg-pink-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                            : 'border-gray-300 bg-white hover:border-pink-300'
                                    }`}
                                    title={`${opt.desc} - Click again to deselect`}
                                >
                                    <span className="font-comic text-xs font-bold">{opt.label}</span>
                                    <span className="font-comic text-[9px] text-gray-500">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                        {balloonShapeOverride === undefined && (
                            <p className="text-[10px] text-pink-600 font-comic mt-2 italic">None selected - will use context/auto</p>
                        )}
                    </div>

                    {/* Flashback Toggle - Comic Fundamentals */}
                    <div className="border-[3px] border-black bg-amber-50 p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applyFlashbackStyle}
                                onChange={(e) => setApplyFlashbackStyle(e.target.checked)}
                                className="w-5 h-5 accent-amber-600 cursor-pointer"
                            />
                            <div>
                                <p className="font-comic text-sm font-bold uppercase text-amber-900">
                                    📜 Apply Flashback Styling
                                </p>
                                <p className="font-comic text-[10px] text-amber-700">
                                    Sepia tones, soft vignette edges, desaturated colors - memory/nostalgic quality
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Instruction Text Input */}
                    <div className="border-[3px] border-black bg-green-50 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-comic text-sm font-bold uppercase text-green-900">
                                ✍️ Regeneration Instructions
                            </p>
                            {onImproveText && (
                                <button
                                    onClick={handleImproveInstruction}
                                    disabled={isImprovingInstruction || !instruction.trim()}
                                    className="comic-btn bg-purple-600 text-white text-[10px] px-2 py-0.5 hover:bg-purple-500 border-2 border-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Improve instruction with AI"
                                >
                                    {isImprovingInstruction ? '⏳ IMPROVING...' : '✨ AI IMPROVE'}
                                </button>
                            )}
                        </div>
                        <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="e.g. 'Make the hero look determined', 'Change background to a rooftop at sunset', 'Close-up on the villain's face'..."
                            className="w-full p-3 border-2 border-black font-comic text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Negative Prompt - Things to EXCLUDE */}
                    <div className="border-[3px] border-black bg-red-50 p-4">
                        <p className="font-comic text-sm font-bold uppercase text-red-900 mb-2">
                            🚫 Exclude From Image (Negative Prompt)
                        </p>
                        <p className="font-comic text-[10px] text-red-700 mb-2">
                            Specify what should NOT appear in the regenerated image. Helps with character consistency.
                        </p>
                        <textarea
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="e.g. 'no mask, no helmet, no cape, no glowing eyes, no beard'..."
                            className="w-full p-3 border-2 border-black font-comic text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                        />
                    </div>

                    {/* Original Prompt for This Page (Debug) */}
                    {originalPrompt && (
                        <div className="border-[3px] border-black bg-gray-50 p-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <button
                                    onClick={() => setShowOriginalPrompt(!showOriginalPrompt)}
                                    className="flex items-center gap-2 font-comic text-sm font-bold uppercase text-gray-700 hover:text-gray-900"
                                >
                                    <span>{showOriginalPrompt ? '▼' : '▶'}</span>
                                    🔍 Original Prompt for Page {pageIndex} (Debug)
                                </button>
                                {showOriginalPrompt && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(originalPrompt);
                                                const btn = document.activeElement as HTMLButtonElement;
                                                const originalText = btn.textContent;
                                                btn.textContent = '✓ Copied!';
                                                setTimeout(() => { btn.textContent = originalText; }, 1500);
                                            }}
                                            className="comic-btn bg-blue-500 text-white text-xs px-3 py-1 border-2 border-black hover:bg-blue-400 font-bold"
                                            title="Copy prompt to clipboard"
                                        >
                                            📋 Copy
                                        </button>
                                        <button
                                            onClick={() => {
                                                const blob = new Blob([originalPrompt], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `page-${pageIndex}-original-prompt.txt`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="comic-btn bg-gray-600 text-white text-xs px-3 py-1 border-2 border-black hover:bg-gray-500 font-bold"
                                            title="Download prompt as text file"
                                        >
                                            ⬇ Download
                                        </button>
                                    </div>
                                )}
                            </div>
                            {showOriginalPrompt && (
                                <pre className="mt-2 text-[10px] sm:text-xs font-mono bg-white border-2 border-gray-300 p-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-gray-600">
                                    {originalPrompt}
                                </pre>
                            )}
                        </div>
                    )}

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

                    {/* Character Profiles - Enhanced with Inline Editor */}
                    <div className="border-[3px] border-black bg-orange-50 p-4">
                        <div className="mb-3 border-b-2 border-orange-200 pb-2">
                            <p className="font-comic font-bold text-sm sm:text-base uppercase text-orange-900">
                                🧬 Enforce AI Character Profiles
                            </p>
                            <p className="font-comic text-xs sm:text-sm text-orange-700 mt-0.5">
                                Click a character name to view/edit profile. Inject descriptions for consistency.
                            </p>
                        </div>

                        {availableProfiles.length > 0 ? (
                            <div className="space-y-2">
                                {availableProfiles.map(p => {
                                    const fullProfile = getFullProfile(p.id);
                                    const isExpanded = expandedProfileId === p.id;
                                    const isAnalyzing = analyzingProfileId === p.id;

                                    return (
                                        <div key={p.id} className={`border-2 transition-all ${selectedProfileIds.has(p.id) ? 'border-orange-500 bg-orange-100' : 'border-gray-300 bg-white'}`}>
                                            {/* Profile Header Row */}
                                            <div className="flex items-center gap-2 p-2 sm:p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProfileIds.has(p.id)}
                                                    onChange={() => toggleProfile(p.id)}
                                                    className="w-5 h-5 accent-orange-600 cursor-pointer shrink-0"
                                                />
                                                <button
                                                    onClick={() => handleProfileClick(p.id)}
                                                    className="flex-1 text-left font-comic text-sm sm:text-base font-bold text-orange-900 hover:text-orange-600 transition-colors truncate"
                                                    title="Click to expand/edit profile"
                                                >
                                                    {p.name} {isExpanded ? '▼' : '▶'}
                                                </button>
                                                <span className="text-xs text-orange-500 hidden sm:inline">Click to edit</span>
                                            </div>

                                            {/* Expanded Profile Editor */}
                                            {isExpanded && fullProfile && (
                                                <div className="border-t-2 border-orange-200 p-3 sm:p-4 bg-white space-y-3">
                                                    {/* Profile Fields */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="font-comic text-xs font-bold text-gray-700 uppercase block mb-1">Face Description</label>
                                                            <textarea
                                                                className="w-full p-2 border-2 border-gray-300 font-comic text-xs sm:text-sm h-20 resize-none focus:border-orange-400 focus:outline-none"
                                                                value={fullProfile.faceDescription || ''}
                                                                onChange={e => onProfileUpdate?.(p.id, { faceDescription: e.target.value })}
                                                                placeholder="Eye color, face shape, expression..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="font-comic text-xs font-bold text-gray-700 uppercase block mb-1">Body Type</label>
                                                            <textarea
                                                                className="w-full p-2 border-2 border-gray-300 font-comic text-xs sm:text-sm h-20 resize-none focus:border-orange-400 focus:outline-none"
                                                                value={fullProfile.bodyType || ''}
                                                                onChange={e => onProfileUpdate?.(p.id, { bodyType: e.target.value })}
                                                                placeholder="Height, build, posture..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="font-comic text-xs font-bold text-gray-700 uppercase block mb-1">Clothing & Armor</label>
                                                            <textarea
                                                                className="w-full p-2 border-2 border-gray-300 font-comic text-xs sm:text-sm h-20 resize-none focus:border-orange-400 focus:outline-none"
                                                                value={fullProfile.clothing || ''}
                                                                onChange={e => onProfileUpdate?.(p.id, { clothing: e.target.value })}
                                                                placeholder="Outfit details, accessories..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="font-comic text-xs font-bold text-gray-700 uppercase block mb-1">Color Palette</label>
                                                            <textarea
                                                                className="w-full p-2 border-2 border-gray-300 font-comic text-xs sm:text-sm h-20 resize-none focus:border-orange-400 focus:outline-none"
                                                                value={fullProfile.colorPalette || ''}
                                                                onChange={e => onProfileUpdate?.(p.id, { colorPalette: e.target.value })}
                                                                placeholder="Primary colors, skin tone, hair..."
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="font-comic text-xs font-bold text-gray-700 uppercase block mb-1">Distinguishing Features</label>
                                                            <textarea
                                                                className="w-full p-2 border-2 border-gray-300 font-comic text-xs sm:text-sm h-16 resize-none focus:border-orange-400 focus:outline-none"
                                                                value={fullProfile.distinguishingFeatures || ''}
                                                                onChange={e => onProfileUpdate?.(p.id, { distinguishingFeatures: e.target.value })}
                                                                placeholder="Scars, tattoos, unique traits..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Profile Actions */}
                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                                                        <button
                                                            onClick={() => handleAnalyze(p.id)}
                                                            disabled={isAnalyzing}
                                                            className="comic-btn bg-blue-600 text-white text-xs px-3 py-1.5 border-2 border-black hover:bg-blue-500 disabled:opacity-50 font-bold"
                                                        >
                                                            {isAnalyzing ? '⏳ Analyzing...' : '🤖 Re-Analyze with AI'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadProfile(fullProfile)}
                                                            className="comic-btn bg-yellow-500 text-black text-xs px-3 py-1.5 border-2 border-black hover:bg-yellow-400 font-bold"
                                                        >
                                                            ⬇️ Download JSON
                                                        </button>
                                                        <label className="comic-btn bg-gray-500 text-white text-xs px-3 py-1.5 border-2 border-black hover:bg-gray-400 font-bold cursor-pointer">
                                                            ⬆️ Upload JSON
                                                            <input
                                                                type="file"
                                                                accept=".json"
                                                                className="hidden"
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
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 font-comic text-sm text-center py-4">No character profiles available.</p>
                        )}

                        {/* Select All / None + Add New */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-orange-200">
                            <button onClick={() => setSelectedProfileIds(new Set(availableProfiles.map(p => p.id)))} className="text-xs font-comic font-bold text-orange-700 hover:text-orange-900 uppercase">Select All</button>
                            <span className="text-xs text-orange-300">|</span>
                            <button onClick={() => setSelectedProfileIds(new Set())} className="text-xs font-comic font-bold text-orange-700 hover:text-orange-900 uppercase">Select None</button>
                            {onAddNewCharacter && (
                                <>
                                    <span className="text-xs text-orange-300">|</span>
                                    <button
                                        onClick={onAddNewCharacter}
                                        className="comic-btn bg-green-600 text-white text-xs px-3 py-1 border-2 border-black hover:bg-green-500 font-bold"
                                    >
                                        ➕ Add New Character
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

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
