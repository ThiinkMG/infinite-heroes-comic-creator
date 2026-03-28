import React, { useState } from 'react';
import { StoryOutline, PageCharacterPlan, PanelLayout, ShotType, EmotionalBeat, TransitionType } from './types';

interface Props {
    show: boolean;
    storyOutline: StoryOutline;
    outlineNotes: string;
    onOutlineUpdate: (content: string) => void;
    onOutlineNotesChange: (val: string) => void;
    onGenerateOutline: (notes?: string) => void;
    onOutlineUpload: (file: File) => void;
    onProceedWithOutline: () => void;
    onCancelOutline: () => void;
}

// Layout icons for visual representation
const LAYOUT_ICONS: Record<PanelLayout, { icon: string; label: string }> = {
    'splash': { icon: '▣', label: 'Splash Page' },
    'horizontal-split': { icon: '▤', label: '2 Horizontal' },
    'vertical-split': { icon: '▥', label: '2 Vertical' },
    'grid-2x2': { icon: '⊞', label: '4 Panels' },
    'grid-2x3': { icon: '⊟', label: '6 Panels' },
    'grid-3x3': { icon: '▦', label: '9 Panels' },
    'asymmetric': { icon: '⊠', label: 'Dynamic' },
};

// Shot type icons
const SHOT_ICONS: Record<ShotType, { icon: string; label: string }> = {
    'extreme-close-up': { icon: '👁️', label: 'XCU' },
    'close-up': { icon: '😊', label: 'CU' },
    'medium': { icon: '🧍', label: 'Med' },
    'full': { icon: '🧑', label: 'Full' },
    'wide': { icon: '🏙️', label: 'Wide' },
    'extreme-wide': { icon: '🌆', label: 'Est.' },
};

// Beat type colors
const BEAT_COLORS: Record<EmotionalBeat, string> = {
    'establishing': 'bg-blue-100 border-blue-400',
    'action': 'bg-red-100 border-red-400',
    'dialogue': 'bg-green-100 border-green-400',
    'reaction': 'bg-yellow-100 border-yellow-400',
    'climax': 'bg-purple-100 border-purple-400',
    'transition': 'bg-gray-100 border-gray-400',
    'reveal': 'bg-orange-100 border-orange-400',
};

// Pacing indicators
const PACING_INDICATORS: Record<'slow' | 'medium' | 'fast', { icon: string; color: string }> = {
    'slow': { icon: '🐢', color: 'text-blue-600' },
    'medium': { icon: '🚶', color: 'text-green-600' },
    'fast': { icon: '🏃', color: 'text-red-600' },
};

// Page Card Component - Enhanced for readability
const PageCard: React.FC<{ plan: PageCharacterPlan }> = ({ plan }) => {
    const layout = LAYOUT_ICONS[plan.panelLayout] || LAYOUT_ICONS['grid-2x3'];
    const shot = SHOT_ICONS[plan.suggestedShot] || SHOT_ICONS['medium'];
    const beatColor = BEAT_COLORS[plan.emotionalBeat] || BEAT_COLORS['action'];
    const pacing = PACING_INDICATORS[plan.pacingIntent] || PACING_INDICATORS['medium'];

    return (
        <div className={`border-3 ${beatColor} p-3 sm:p-4 rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] ${plan.isFlashback ? 'bg-amber-50' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="font-comic font-bold text-base sm:text-lg">
                    Page {plan.pageIndex}
                    {plan.isDecisionPage && <span className="ml-1 text-purple-600 text-xl">⚡</span>}
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <span title={layout.label} className="text-xl sm:text-2xl cursor-help">{layout.icon}</span>
                    <span title={shot.label} className="text-base sm:text-lg cursor-help">{shot.icon}</span>
                    <span title={`Pacing: ${plan.pacingIntent}`} className={`text-base sm:text-lg ${pacing.color}`}>{pacing.icon}</span>
                </div>
            </div>

            {/* Scene description */}
            <p className="font-comic text-[13px] sm:text-sm text-gray-700 line-clamp-3 mb-2 leading-relaxed" title={plan.sceneDescription}>
                {plan.sceneDescription || 'No description'}
            </p>

            {/* Footer badges */}
            <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 bg-white border-2 border-gray-300 rounded text-[10px] sm:text-xs font-comic font-bold uppercase">
                    {plan.emotionalBeat}
                </span>
                {plan.isFlashback && (
                    <span className="px-2 py-1 bg-amber-200 border-2 border-amber-400 rounded text-[10px] sm:text-xs font-comic font-bold">
                        📜 Moment
                    </span>
                )}
                <span className="px-2 py-1 bg-gray-200 border-2 border-gray-400 rounded text-[10px] sm:text-xs font-comic" title={plan.transitionType}>
                    → {plan.transitionType.split('-')[0]}
                </span>
            </div>

            {/* Characters */}
            <div className="mt-2 text-[11px] sm:text-xs text-gray-600 font-comic">
                👥 {plan.primaryCharacters.slice(0, 2).join(', ')}{plan.primaryCharacters.length > 2 ? '...' : ''} | Focus: {plan.focusCharacter}
            </div>
        </div>
    );
};

export const OutlineStepDialog: React.FC<Props> = ({
    show,
    storyOutline,
    outlineNotes,
    onOutlineUpdate,
    onOutlineNotesChange,
    onGenerateOutline,
    onOutlineUpload,
    onProceedWithOutline,
    onCancelOutline
}) => {
    const [viewMode, setViewMode] = useState<'text' | 'visual'>('visual');

    if (!show) return null;

    const hasPageBreakdown = storyOutline.pageBreakdown && storyOutline.pageBreakdown.length > 0;

    return (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="max-w-[1400px] w-full bg-white border-[4px] sm:border-[6px] border-black p-4 sm:p-6 lg:p-8 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] sm:shadow-[12px_12px_0px_rgba(0,0,0,0.5)] max-h-[95vh] overflow-hidden flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h2 className="font-comic text-2xl sm:text-3xl lg:text-4xl text-red-600 uppercase tracking-tighter">Story Outline</h2>
                    {hasPageBreakdown && !storyOutline.isGenerating && (
                        <div className="flex gap-1 border-2 border-black shrink-0">
                            <button
                                onClick={() => setViewMode('visual')}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 font-comic text-xs sm:text-sm font-bold transition-colors ${
                                    viewMode === 'visual' ? 'bg-yellow-400 text-black' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                📊 Visual
                            </button>
                            <button
                                onClick={() => setViewMode('text')}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 font-comic text-xs sm:text-sm font-bold transition-colors ${
                                    viewMode === 'text' ? 'bg-yellow-400 text-black' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                📝 Text
                            </button>
                        </div>
                    )}
                </div>

                {storyOutline.isGenerating ? (
                    <div className="py-20 text-center flex-1">
                        <div className="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="font-comic text-xl animate-pulse">AI is crafting your epic outline...</p>
                        <p className="font-comic text-sm text-gray-500 mt-2">Including comic fundamentals: layouts, shots, transitions...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {/* Visual View */}
                        {viewMode === 'visual' && hasPageBreakdown ? (
                            <div className="flex-1 overflow-y-auto mb-4 pr-1">
                                {/* Legend */}
                                <div className="mb-4 p-3 sm:p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                                    <p className="font-comic text-sm sm:text-base font-bold mb-2">Legend:</p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs sm:text-sm font-comic">
                                        <span>▣ Splash</span>
                                        <span>⊟ 6-Panel</span>
                                        <span>▦ 9-Panel</span>
                                        <span>⊠ Dynamic</span>
                                        <span className="text-gray-400">|</span>
                                        <span>👁️ Close-up</span>
                                        <span>🏙️ Wide</span>
                                        <span className="text-gray-400">|</span>
                                        <span>🐢 Slow</span>
                                        <span>🏃 Fast</span>
                                        <span className="text-gray-400">|</span>
                                        <span className="text-purple-600 font-bold">⚡ Decision Page</span>
                                    </div>
                                </div>

                                {/* Page Grid - Responsive: 1 col mobile, 2 sm, 3 md, 4 lg, 5 xl */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                                    {storyOutline.pageBreakdown!.map((plan) => (
                                        <PageCard key={plan.pageIndex} plan={plan} />
                                    ))}
                                </div>

                                {/* Summary Stats */}
                                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                                    <p className="font-comic text-sm sm:text-base font-bold">
                                        📈 Summary: {storyOutline.pageBreakdown!.length} pages |
                                        {' '}{storyOutline.pageBreakdown!.filter(p => p.panelLayout === 'splash').length} splash pages |
                                        {' '}{storyOutline.pageBreakdown!.filter(p => p.isFlashback).length} flashbacks |
                                        {' '}{storyOutline.pageBreakdown!.filter(p => p.isDecisionPage).length} decision points
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Text View */
                            <textarea
                                value={storyOutline.content}
                                onChange={(e) => onOutlineUpdate(e.target.value)}
                                className="flex-1 w-full p-4 sm:p-6 border-4 border-black font-comic text-sm sm:text-base mb-4 resize-none bg-yellow-50 shadow-inner min-h-[300px] leading-relaxed"
                                placeholder="Generated outline will appear here..."
                            />
                        )}

                        {/* Regenerate controls */}
                        <div className="mb-4 sm:mb-6 text-left">
                            <p className="font-comic text-sm sm:text-base font-bold mb-2 uppercase">Regenerate with Context/Notes:</p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <input
                                    type="text"
                                    value={outlineNotes}
                                    onChange={(e) => onOutlineNotesChange(e.target.value)}
                                    placeholder="Add notes for regeneration... (e.g., 'more action scenes', 'add a flashback on page 5')"
                                    className="flex-1 p-3 border-2 border-black font-comic text-sm sm:text-base"
                                />
                                <button
                                    onClick={() => onGenerateOutline(outlineNotes)}
                                    className="comic-btn bg-blue-600 text-white px-6 py-3 text-sm sm:text-base font-bold border-[3px] border-black hover:bg-blue-500 whitespace-nowrap"
                                >
                                    REGENERATE
                                </button>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            <button
                                onClick={onProceedWithOutline}
                                className="comic-btn bg-green-600 text-white py-3 sm:py-4 font-bold border-[3px] border-black hover:bg-green-500 text-sm sm:text-base lg:text-lg"
                            >
                                ✅ APPROVE & PROCEED
                            </button>
                            <label className="comic-btn bg-gray-200 text-black py-3 sm:py-4 font-bold border-[3px] border-black hover:bg-gray-300 text-sm sm:text-base lg:text-lg text-center cursor-pointer flex items-center justify-center">
                                📤 UPLOAD OUTLINE
                                <input
                                    type="file"
                                    accept=".txt,.md"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && onOutlineUpload(e.target.files[0])}
                                />
                            </label>
                            <button
                                onClick={onCancelOutline}
                                className="comic-btn bg-red-600 text-white py-3 sm:py-4 font-bold border-[3px] border-black hover:bg-red-500 text-sm sm:text-base lg:text-lg"
                            >
                                ❌ CANCEL
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
