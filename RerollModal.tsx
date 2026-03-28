/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RerollModal - Regeneration interface for comic panels
 * V2 Batch Plan: Restructured with new Phase 1 components
 */

import React, { useState, useRef, useEffect } from 'react';
import { RegenerationMode, ShotType, BalloonShape, RerollOptions, CharacterProfile } from './types';
import {
    RegenerationModeSelector,
    ReferenceImageGallery,
    ProfileSelector,
    InstructionInput,
    ComicFundamentalsOverrides,
    TipsPanel,
    CurrentImagePreview,
    QuickPresets,
    StrengthSlider,
    FocusAreaSelector,
    QUICK_PRESETS,
    getStrengthPrompt,
    getFocusAreaPrompt,
    type RefImage,
    type QuickPreset
} from './components/reroll';
import { usePageHistory, type RerollHistoryEntry } from './stores/useRerollHistory';

interface RerollModalProps {
    pageIndex: number;
    outline: string;
    allRefImages: RefImage[];
    availableProfiles: { id: string, name: string }[];
    fullProfiles: CharacterProfile[];
    originalPrompt?: string;
    /** Current panel image URL for preview */
    currentImageUrl?: string;
    /** Optional caption for current image */
    currentCaption?: string;
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
    /** Callback to revert to a previous attempt's image */
    onRevert?: (imageUrl: string, entry: RerollHistoryEntry) => void;
}

export const RerollModal: React.FC<RerollModalProps> = ({
    pageIndex,
    outline,
    allRefImages,
    availableProfiles,
    fullProfiles,
    originalPrompt,
    currentImageUrl,
    currentCaption,
    initialSelectedProfileIds,
    onProfileSelectionChange,
    onSubmit,
    onClose,
    onUploadRef,
    onDeleteRef,
    onProfileUpdate,
    onAnalyzeProfile,
    onAddNewCharacter,
    onImproveText,
    onRevert
}) => {
    // === HISTORY HOOK (2.3.x) ===
    const pageHistory = usePageHistory(pageIndex);
    // Ref for scrolling to submit button
    const submitRef = useRef<HTMLButtonElement>(null);
    // Track initial mount to avoid calling onProfileSelectionChange on first render
    const isInitialMount = useRef(true);

    // === INSTRUCTION STATE ===
    const [instruction, setInstruction] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [isImprovingInstruction, setIsImprovingInstruction] = useState(false);
    const [isImprovingNegative, setIsImprovingNegative] = useState(false);

    // === PHASE 1 NEW STATE (V2 Batch Plan) ===
    const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
    const [strengthValue, setStrengthValue] = useState(1.0); // Full by default
    const [focusAreas, setFocusAreas] = useState<Set<string>>(new Set());

    // === SELECTION STATE ===
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(allRefImages.map(r => r.id)));
    const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(() => {
        if (initialSelectedProfileIds && initialSelectedProfileIds.length > 0) {
            return new Set(initialSelectedProfileIds);
        }
        return new Set(availableProfiles.map(p => p.id));
    });
    const [deleteMode, setDeleteMode] = useState(false);

    // === REGENERATION MODE STATE ===
    const [regenerationModes, setRegenerationModes] = useState<Set<RegenerationMode>>(new Set(['full']));

    // === REFERENCE IMAGE OPTIONS ===
    // Simplified: Gallery selection directly controls what gets sent
    // - Selected refs = refs sent to AI
    // - No selection = no refs sent (implicit off)

    // === LOCATION AND POSE ===
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [selectedPoseId, setSelectedPoseId] = useState<string>('');

    // === COMIC FUNDAMENTALS OVERRIDES ===
    const [shotTypeOverride, setShotTypeOverride] = useState<ShotType | undefined>(undefined);
    const [balloonShapeOverride, setBalloonShapeOverride] = useState<BalloonShape | undefined>(undefined);
    const [applyFlashbackStyle, setApplyFlashbackStyle] = useState(false);

    // === UI STATE ===
    const [showTips, setShowTips] = useState(false);
    const [expertMode, setExpertMode] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // === SMART BEHAVIOR: Auto-select all refs when preset uses them (1.3.1) ===
    useEffect(() => {
        if (selectedPresetId) {
            const preset = QUICK_PRESETS.find(p => p.id === selectedPresetId);
            if (preset?.useRefs && selectedIds.size === 0) {
                // Auto-select all refs if none selected and preset needs refs
                setSelectedIds(new Set(allRefImages.map(r => r.id)));
            }
        }
    }, [selectedPresetId, allRefImages]);

    // === HANDLERS ===

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

    // Sync profile selection changes to parent (separate from setState to avoid update loop)
    useEffect(() => {
        // Skip initial mount to prevent triggering parent re-render loop
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        // Only notify parent when user actually changes selection
        if (onProfileSelectionChange) {
            onProfileSelectionChange(Array.from(selectedProfileIds));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProfileIds]);

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

    const toggleFocusArea = (areaId: string) => {
        setFocusAreas(prev => {
            const next = new Set(prev);
            if (next.has(areaId)) next.delete(areaId);
            else next.add(areaId);
            return next;
        });
    };

    const handlePresetSelect = (preset: QuickPreset) => {
        setSelectedPresetId(preset.id);
        // Apply preset's regeneration modes
        setRegenerationModes(new Set(preset.modes));
        // Set preset's instruction if provided
        if (preset.prompt) {
            setInstruction(preset.prompt);
        }
        // Smart behavior: Auto-scroll to submit (1.3.2)
        setTimeout(() => {
            submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const handleSubmit = () => {
        const selectedRefImages = allRefImages
            .filter(r => selectedIds.has(r.id))
            .map(r => r.base64);

        // Build final instruction with strength and focus area prompts
        let finalInstruction = instruction;

        // Prepend strength modifier if not full
        if (strengthValue < 1.0) {
            const strengthPrompt = getStrengthPrompt(strengthValue);
            finalInstruction = `${strengthPrompt} the following: ${finalInstruction}`;
        }

        // Append focus area instruction
        if (focusAreas.size > 0) {
            const focusPrompt = getFocusAreaPrompt(focusAreas);
            finalInstruction = `${finalInstruction}\n\n${focusPrompt}`;
        }

        const options: RerollOptions = {
            regenerationModes: regenerationModes.size > 0 ? Array.from(regenerationModes) : undefined,
            instruction: finalInstruction.trim(),
            negativePrompt: negativePrompt.trim() || undefined,
            selectedRefImages,
            selectedProfileIds: Array.from(selectedProfileIds),
            shotTypeOverride,
            balloonShapeOverride,
            applyFlashbackStyle: applyFlashbackStyle || undefined,
            // Simplified: selection IS the control
            reinforceWithReferenceImages: selectedIds.size > 0 || undefined,
            useSelectedRefsOnly: selectedIds.size > 0 || undefined, // Always use only selected
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
                className="bg-white border-0 sm:border-[6px] border-black shadow-none sm:shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-[750px] w-full max-h-[100dvh] sm:max-h-[90vh] overflow-hidden m-0 sm:m-4 rounded-none sm:rounded-lg relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - sticky */}
                <div className="bg-yellow-400 border-b-[4px] border-black px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10 flex-shrink-0">
                    <h2 id="reroll-modal-title" className="font-comic text-base sm:text-lg md:text-2xl font-bold uppercase tracking-wider text-black">
                        🎲 Reroll #{pageIndex}
                    </h2>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Expert Mode Toggle (2.1.2) */}
                        <button
                            onClick={() => setExpertMode(!expertMode)}
                            className={`comic-btn ${expertMode ? 'bg-purple-600' : 'bg-gray-500'} text-white min-w-[48px] min-h-[48px] px-2 sm:px-3 py-2 flex items-center justify-center gap-1 font-bold text-xs sm:text-sm border-[3px] border-black hover:opacity-90 touch-manipulation`}
                            title={expertMode ? "Switch to Simple mode" : "Switch to Expert mode"}
                            aria-pressed={expertMode}
                        >
                            <span className="hidden sm:inline">{expertMode ? '🔧 Expert' : '✨ Simple'}</span>
                            <span className="sm:hidden">{expertMode ? '🔧' : '✨'}</span>
                        </button>
                        {/* History Toggle (2.3.2) */}
                        {pageHistory.length > 0 && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`comic-btn ${showHistory ? 'bg-amber-600' : 'bg-amber-500'} text-white min-w-[48px] min-h-[48px] px-2 sm:px-3 py-2 flex items-center justify-center gap-1 font-bold text-xs sm:text-sm border-[3px] border-black hover:opacity-90 touch-manipulation relative`}
                                title={`${pageHistory.length} previous attempts`}
                                aria-label={showHistory ? "Hide history" : "Show history"}
                            >
                                <span className="hidden sm:inline">📜 History</span>
                                <span className="sm:hidden">📜</span>
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-black">
                                    {pageHistory.length}
                                </span>
                            </button>
                        )}
                        {/* Tips Toggle */}
                        <button
                            onClick={() => setShowTips(!showTips)}
                            className={`comic-btn ${showTips ? 'bg-green-600' : 'bg-blue-600'} text-white min-w-[48px] min-h-[48px] px-2 sm:px-3 py-2 flex items-center justify-center gap-1 font-bold text-xs sm:text-sm border-[3px] border-black hover:opacity-90 touch-manipulation`}
                            title="Show regeneration tips"
                            aria-label={showTips ? "Hide tips" : "Show tips"}
                        >
                            <span className="hidden sm:inline">💡 Tips</span>
                            <span className="sm:hidden">💡</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="comic-btn bg-red-600 text-white min-w-[48px] min-h-[48px] w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500 touch-manipulation"
                            aria-label="Close reroll modal"
                        >✕</button>
                    </div>
                </div>

                {/* Tips Panel */}
                {showTips && <TipsPanel onClose={() => setShowTips(false)} />}

                {/* History Panel (2.3.2) */}
                {showHistory && pageHistory.length > 0 && (
                    <div className="border-b-4 border-amber-400 bg-amber-50 p-3 sm:p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-comic text-sm sm:text-base font-bold uppercase text-amber-900">
                                📜 Previous Attempts ({pageHistory.length})
                            </h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-amber-700 hover:text-amber-900 text-xl"
                                aria-label="Close history"
                            >✕</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
                            {pageHistory.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className="flex-shrink-0 border-2 border-amber-400 bg-white rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                    style={{ width: '100px' }}
                                >
                                    <img
                                        src={entry.imageUrl}
                                        alt={`Attempt ${pageHistory.length - index}`}
                                        className="w-full h-[130px] object-cover"
                                    />
                                    <div className="p-1.5 text-center">
                                        <p className="font-comic text-[10px] text-gray-600 truncate" title={entry.instruction}>
                                            {entry.instruction || 'Full regen'}
                                        </p>
                                        <button
                                            onClick={() => {
                                                onRevert?.(entry.imageUrl, entry);
                                                setShowHistory(false);
                                            }}
                                            disabled={!onRevert}
                                            className="mt-1 w-full comic-btn bg-amber-500 text-white text-[10px] py-1 px-2 border border-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                        >
                                            ↩️ Revert
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 font-comic text-[10px] text-amber-700 text-center">
                            Click "Revert" to restore a previous version. Max 10 attempts stored.
                        </p>
                    </div>
                )}

                {/* Scrollable content area - NEW SECTION ORDER */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 pb-24 sm:pb-5 flex flex-col gap-4 sm:gap-5">

                    {/* 1. CURRENT IMAGE PREVIEW (Context) */}
                    {currentImageUrl && (
                        <CurrentImagePreview
                            imageUrl={currentImageUrl}
                            pageIndex={pageIndex}
                            caption={currentCaption}
                        />
                    )}

                    {/* 2. QUICK PRESETS (Speed) */}
                    <QuickPresets
                        selectedPresetId={selectedPresetId}
                        onSelectPreset={handlePresetSelect}
                    />

                    {/* 3. INSTRUCTION + STRENGTH (Primary action) */}
                    <InstructionInput
                        instruction={instruction}
                        negativePrompt={negativePrompt}
                        selectedLocationId={selectedLocationId}
                        selectedPoseId={selectedPoseId}
                        isImprovingInstruction={isImprovingInstruction}
                        isImprovingNegative={isImprovingNegative}
                        onInstructionChange={setInstruction}
                        onNegativePromptChange={setNegativePrompt}
                        onLocationChange={setSelectedLocationId}
                        onPoseChange={setSelectedPoseId}
                        onImproveInstruction={onImproveText ? handleImproveInstruction : undefined}
                        onImproveNegative={onImproveText ? handleImproveNegative : undefined}
                    />

                    {/* STRENGTH SLIDER */}
                    <StrengthSlider
                        value={strengthValue}
                        onChange={setStrengthValue}
                    />

                    {/* 4. FOCUS AREA (Targeting) */}
                    <FocusAreaSelector
                        selectedAreas={focusAreas}
                        onToggleArea={toggleFocusArea}
                        multiSelect={true}
                    />

                    {/* 5. REFERENCE IMAGES (Moved up) */}
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

                    {/* 6. ADVANCED OPTIONS - Only visible in Expert Mode (2.1.2) */}
                    {expertMode && (
                        <details className="border-[3px] border-purple-400 bg-purple-50 group" open>
                            <summary className="p-3 sm:p-4 cursor-pointer flex justify-between items-center list-none touch-manipulation min-h-[48px]">
                                <p className="font-comic text-sm sm:text-base font-bold uppercase text-purple-800">
                                    🔧 Expert Options
                                </p>
                                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t-2 border-purple-200 space-y-4 mt-3">
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
                            </div>
                        </details>
                    )}

                    {/* Simple mode hint when not in expert mode */}
                    {!expertMode && (
                        <div className="text-center py-2">
                            <button
                                onClick={() => setExpertMode(true)}
                                className="font-comic text-xs text-gray-500 hover:text-purple-600 underline"
                            >
                                Need more control? Switch to Expert Mode →
                            </button>
                        </div>
                    )}

                    {/* 7. DEBUG INFO - Only visible in Expert Mode */}
                    {expertMode && (outline || originalPrompt) && (
                        <details className="border-[3px] border-black bg-gray-100 group">
                            <summary className="p-3 sm:p-4 cursor-pointer flex justify-between items-center list-none touch-manipulation min-h-[48px]">
                                <p className="font-comic text-sm sm:text-base font-bold uppercase text-gray-600">
                                    🔍 Debug Info
                                </p>
                                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t-2 border-gray-300 space-y-4 mt-3">
                                {/* Story Outline */}
                                {outline && (
                                    <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-comic text-sm font-bold text-blue-900">📖 Story Outline</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(outline);
                                                    }}
                                                    className="text-xs px-2 py-1 bg-blue-500 text-white border border-black rounded hover:bg-blue-400"
                                                >📋</button>
                                                <button
                                                    onClick={handleDownloadOutline}
                                                    className="text-xs px-2 py-1 bg-blue-600 text-white border border-black rounded hover:bg-blue-500"
                                                >⬇</button>
                                            </div>
                                        </div>
                                        <pre className="text-xs font-mono bg-white border border-gray-300 p-2 max-h-24 overflow-y-auto whitespace-pre-wrap text-gray-700">
                                            {outline}
                                        </pre>
                                    </div>
                                )}

                                {/* Original Prompt */}
                                {originalPrompt && (
                                    <div className="bg-gray-50 border-2 border-gray-300 p-3 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-comic text-sm font-bold text-gray-700">🔧 Original Prompt</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(originalPrompt);
                                                    }}
                                                    className="text-xs px-2 py-1 bg-gray-500 text-white border border-black rounded hover:bg-gray-400"
                                                >📋</button>
                                                <button
                                                    onClick={() => {
                                                        const blob = new Blob([originalPrompt], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `page-${pageIndex}-prompt.txt`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="text-xs px-2 py-1 bg-gray-600 text-white border border-black rounded hover:bg-gray-500"
                                                >⬇</button>
                                            </div>
                                        </div>
                                        <pre className="text-[10px] font-mono bg-white border border-gray-300 p-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-gray-600">
                                            {originalPrompt}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </details>
                    )}

                    {/* 8. DESKTOP SUBMIT BUTTON */}
                    <button
                        ref={submitRef}
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
