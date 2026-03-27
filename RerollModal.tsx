/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RegenerationMode, ShotType, BalloonShape, RerollOptions, CharacterProfile } from './types';
import {
    RegenerationModeSelector,
    ReferenceImageGallery,
    ProfileSelector,
    InstructionInput,
    ComicFundamentalsOverrides,
    TipsPanel,
    type RefImage
} from './components/reroll';

interface RerollModalProps {
    pageIndex: number;
    outline: string;
    allRefImages: RefImage[];
    availableProfiles: { id: string, name: string }[];
    fullProfiles: CharacterProfile[];  // Full profile data for editing
    originalPrompt?: string;  // For debugging/reference
    /** Initial selected profile IDs (for preserving selection across modal open/close) */
    initialSelectedProfileIds?: string[];
    /** Callback when profile selection changes (for preserving state in parent) */
    onProfileSelectionChange?: (selectedIds: string[]) => void;
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
    initialSelectedProfileIds,
    onProfileSelectionChange,
    onSubmit,
    onClose,
    onUploadRef,
    onDeleteRef,
    onProfileUpdate,
    onAnalyzeProfile,
    onAddNewCharacter,
    onImproveText
}) => {
    // Instruction state
    const [instruction, setInstruction] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [isImprovingInstruction, setIsImprovingInstruction] = useState(false);
    const [isImprovingNegative, setIsImprovingNegative] = useState(false);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(allRefImages.map(r => r.id)));
    // Use initial selection from parent if provided, otherwise select all
    const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(() => {
        if (initialSelectedProfileIds && initialSelectedProfileIds.length > 0) {
            return new Set(initialSelectedProfileIds);
        }
        return new Set(availableProfiles.map(p => p.id));
    });
    const [deleteMode, setDeleteMode] = useState(false);

    // Regeneration mode state
    const [regenerationModes, setRegenerationModes] = useState<Set<RegenerationMode>>(new Set(['full']));

    // Reference image options
    const [useReferenceImages, setUseReferenceImages] = useState(false);
    const [useSelectedRefsOnly, setUseSelectedRefsOnly] = useState(false);

    // Location and pose
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [selectedPoseId, setSelectedPoseId] = useState<string>('');

    // Comic fundamentals overrides
    const [shotTypeOverride, setShotTypeOverride] = useState<ShotType | undefined>(undefined);
    const [balloonShapeOverride, setBalloonShapeOverride] = useState<BalloonShape | undefined>(undefined);
    const [applyFlashbackStyle, setApplyFlashbackStyle] = useState(false);

    // UI state
    const [showTips, setShowTips] = useState(false);
    const [showOriginalPrompt, setShowOriginalPrompt] = useState(false);

    // Image selection handlers
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
            // Notify parent of selection change
            onProfileSelectionChange?.(Array.from(next));
            return next;
        });
    };

    const handleToggleMode = (mode: RegenerationMode) => {
        setRegenerationModes((prev: Set<RegenerationMode>) => {
            const next = new Set(prev);
            if (next.has(mode)) {
                next.delete(mode);
            } else {
                next.add(mode);
            }
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
            reinforceWithReferenceImages: useReferenceImages || undefined,
            useSelectedRefsOnly: useSelectedRefsOnly || undefined,
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

    const selectAllImages = () => setSelectedIds(new Set(allRefImages.map(r => r.id)));
    const selectNoneImages = () => setSelectedIds(new Set());
    const selectAllProfiles = () => setSelectedProfileIds(new Set(availableProfiles.map(p => p.id)));
    const selectNoneProfiles = () => setSelectedProfileIds(new Set());

    const handleImproveInstruction = async () => {
        if (!onImproveText || !instruction.trim()) return;
        setIsImprovingInstruction(true);
        try {
            const improved = await onImproveText(instruction, undefined, 'regeneration_instruction');
            setInstruction(improved);
        } catch (e) {
            console.error('Failed to improve instruction:', e);
        } finally {
            setIsImprovingInstruction(false);
        }
    };

    const handleImproveNegative = async () => {
        if (!onImproveText || !negativePrompt.trim()) return;
        setIsImprovingNegative(true);
        try {
            const improved = await onImproveText(
                `Convert this to a concise negative prompt list (comma-separated items to EXCLUDE from image): ${negativePrompt}`,
                undefined,
                'regeneration_instruction'
            );
            setNegativePrompt(improved);
        } catch (e) {
            console.error('Failed to improve negative prompt:', e);
        } finally {
            setIsImprovingNegative(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="reroll-modal-title">
            <div
                className="bg-white border-0 sm:border-[6px] border-black shadow-none sm:shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-[750px] w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto m-0 sm:m-4 rounded-none sm:rounded-lg relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - sticky on all screen sizes */}
                <div className="bg-yellow-400 border-b-[4px] border-black px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10 flex-shrink-0">
                    <h2 id="reroll-modal-title" className="font-comic text-base sm:text-lg md:text-2xl font-bold uppercase tracking-wider text-black">
                        🎲 Reroll #{pageIndex}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTips(!showTips)}
                            className={`comic-btn ${showTips ? 'bg-green-600' : 'bg-blue-600'} text-white min-w-[44px] min-h-[44px] px-3 py-2 flex items-center justify-center gap-1 font-bold text-sm border-[3px] border-black hover:opacity-90 touch-manipulation`}
                            title="Show regeneration tips and best practices"
                            aria-label={showTips ? "Hide tips" : "Show tips"}
                        >
                            <span className="hidden sm:inline">💡 Tips</span>
                            <span className="sm:hidden">💡</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="comic-btn bg-red-600 text-white min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500 touch-manipulation"
                            aria-label="Close reroll modal"
                        >✕</button>
                    </div>
                </div>

                {/* Tips Panel */}
                {showTips && <TipsPanel onClose={() => setShowTips(false)} />}

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 pb-24 sm:pb-5 flex flex-col gap-4 sm:gap-5">

                    {/* Story Outline Section - Collapsible on mobile */}
                    {outline && (
                        <details className="border-[3px] border-black bg-blue-50 group">
                            <summary className="p-3 sm:p-4 cursor-pointer flex justify-between items-center list-none touch-manipulation min-h-[44px]">
                                <p className="font-comic text-sm sm:text-base font-bold uppercase text-blue-900">📖 Story Outline</p>
                                <span className="text-blue-600 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t-2 border-blue-200">
                                <div className="flex gap-2 mt-3 mb-2 flex-wrap">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(outline);
                                            const btn = document.activeElement as HTMLButtonElement;
                                            const originalText = btn.textContent;
                                            btn.textContent = '✓ Copied!';
                                            setTimeout(() => { btn.textContent = originalText; }, 1500);
                                        }}
                                        className="comic-btn bg-blue-500 text-white text-xs sm:text-sm min-h-[44px] px-4 py-2 border-[2px] border-black hover:bg-blue-400 font-bold touch-manipulation"
                                    >📋 Copy</button>
                                    <button
                                        onClick={handleDownloadOutline}
                                        className="comic-btn bg-blue-600 text-white text-xs sm:text-sm min-h-[44px] px-4 py-2 border-[2px] border-black hover:bg-blue-500 font-bold touch-manipulation"
                                    >⬇ Download</button>
                                </div>
                                <pre className="text-xs font-mono bg-white border-2 border-gray-300 p-3 max-h-32 overflow-y-auto whitespace-pre-wrap text-gray-700 -webkit-overflow-scrolling-touch">
                                    {outline}
                                </pre>
                            </div>
                        </details>
                    )}

                    {/* Regeneration Mode Selector */}
                    <RegenerationModeSelector
                        selectedModes={regenerationModes}
                        onToggleMode={handleToggleMode}
                    />

                    {/* Comic Fundamentals Overrides */}
                    <ComicFundamentalsOverrides
                        shotTypeOverride={shotTypeOverride}
                        balloonShapeOverride={balloonShapeOverride}
                        applyFlashbackStyle={applyFlashbackStyle}
                        onShotTypeChange={setShotTypeOverride}
                        onBalloonShapeChange={setBalloonShapeOverride}
                        onFlashbackStyleChange={setApplyFlashbackStyle}
                    />

                    {/* Instruction Input */}
                    <InstructionInput
                        instruction={instruction}
                        negativePrompt={negativePrompt}
                        useReferenceImages={useReferenceImages}
                        useSelectedRefsOnly={useSelectedRefsOnly}
                        selectedLocationId={selectedLocationId}
                        selectedPoseId={selectedPoseId}
                        isImprovingInstruction={isImprovingInstruction}
                        isImprovingNegative={isImprovingNegative}
                        onInstructionChange={setInstruction}
                        onNegativePromptChange={setNegativePrompt}
                        onUseReferenceImagesChange={setUseReferenceImages}
                        onUseSelectedRefsOnlyChange={setUseSelectedRefsOnly}
                        onLocationChange={setSelectedLocationId}
                        onPoseChange={setSelectedPoseId}
                        onImproveInstruction={onImproveText ? handleImproveInstruction : undefined}
                        onImproveNegative={onImproveText ? handleImproveNegative : undefined}
                    />

                    {/* Original Prompt for This Page (Debug) - Collapsible */}
                    {originalPrompt && (
                        <details className="border-[3px] border-black bg-gray-50 group">
                            <summary className="p-3 sm:p-4 cursor-pointer flex items-center justify-between list-none touch-manipulation min-h-[44px]">
                                <span className="font-comic text-sm sm:text-base font-bold uppercase text-gray-700">
                                    🔍 Original Prompt (Debug)
                                </span>
                                <span className="text-gray-600 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t-2 border-gray-200">
                                <div className="flex gap-2 mt-3 mb-2 flex-wrap">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(originalPrompt);
                                            const btn = document.activeElement as HTMLButtonElement;
                                            const originalText = btn.textContent;
                                            btn.textContent = '✓ Copied!';
                                            setTimeout(() => { btn.textContent = originalText; }, 1500);
                                        }}
                                        className="comic-btn bg-blue-500 text-white text-xs sm:text-sm min-h-[44px] px-4 py-2 border-2 border-black hover:bg-blue-400 font-bold touch-manipulation"
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
                                        className="comic-btn bg-gray-600 text-white text-xs sm:text-sm min-h-[44px] px-4 py-2 border-2 border-black hover:bg-gray-500 font-bold touch-manipulation"
                                        title="Download prompt as text file"
                                    >
                                        ⬇ Download
                                    </button>
                                </div>
                                <pre className="mt-2 text-[10px] sm:text-xs font-mono bg-white border-2 border-gray-300 p-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-gray-600 -webkit-overflow-scrolling-touch">
                                    {originalPrompt}
                                </pre>
                            </div>
                        </details>
                    )}

                    {/* Reference Image Gallery */}
                    <ReferenceImageGallery
                        allRefImages={allRefImages}
                        selectedIds={selectedIds}
                        deleteMode={deleteMode}
                        onToggleImage={toggleImage}
                        onToggleDeleteMode={() => setDeleteMode(!deleteMode)}
                        onSelectAll={selectAllImages}
                        onSelectNone={selectNoneImages}
                        onDeleteRef={onDeleteRef}
                        onUploadRef={onUploadRef}
                    />

                    {/* Character Profiles */}
                    <ProfileSelector
                        availableProfiles={availableProfiles}
                        fullProfiles={fullProfiles}
                        selectedProfileIds={selectedProfileIds}
                        onToggleProfile={toggleProfile}
                        onSelectAll={selectAllProfiles}
                        onSelectNone={selectNoneProfiles}
                        onProfileUpdate={onProfileUpdate}
                        onAnalyzeProfile={onAnalyzeProfile}
                        onAddNewCharacter={onAddNewCharacter}
                    />

                    {/* Desktop Submit Button (hidden on mobile) */}
                    <button
                        onClick={handleSubmit}
                        className="hidden sm:block comic-btn w-full bg-yellow-400 text-black py-4 text-xl md:text-2xl font-bold uppercase tracking-wider border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:-translate-y-1 transition-transform"
                        aria-label={`Reroll panel ${pageIndex}`}
                    >
                        🎲 Reroll Panel #{pageIndex}
                    </button>
                </div>

                {/* Mobile Sticky Footer with Submit Button */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.2)] z-20">
                    <button
                        onClick={handleSubmit}
                        className="comic-btn w-full bg-yellow-400 text-black py-4 text-lg font-bold uppercase tracking-wider border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all touch-manipulation"
                        aria-label={`Reroll panel ${pageIndex}`}
                    >
                        🎲 Reroll #{pageIndex}
                    </button>
                </div>
            </div>
        </div>
    );
};
