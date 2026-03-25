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

// Page Card Component
const PageCard: React.FC<{ plan: PageCharacterPlan }> = ({ plan }) => {
    const layout = LAYOUT_ICONS[plan.panelLayout] || LAYOUT_ICONS['grid-2x3'];
    const shot = SHOT_ICONS[plan.suggestedShot] || SHOT_ICONS['medium'];
    const beatColor = BEAT_COLORS[plan.emotionalBeat] || BEAT_COLORS['action'];
    const pacing = PACING_INDICATORS[plan.pacingIntent] || PACING_INDICATORS['medium'];

    return (
        <div className={`border-2 ${beatColor} p-2 rounded transition-all hover:shadow-md ${plan.isFlashback ? 'bg-amber-50' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <span className="font-comic font-bold text-sm">
                    Page {plan.pageIndex}
                    {plan.isDecisionPage && <span className="ml-1 text-purple-600">⚡</span>}
                </span>
                <div className="flex items-center gap-1">
                    <span title={layout.label} className="text-lg cursor-help">{layout.icon}</span>
                    <span title={shot.label} className="text-sm cursor-help">{shot.icon}</span>
                    <span title={`Pacing: ${plan.pacingIntent}`} className={`text-sm ${pacing.color}`}>{pacing.icon}</span>
                </div>
            </div>

            {/* Scene description */}
            <p className="font-comic text-[10px] text-gray-700 line-clamp-2 mb-1" title={plan.sceneDescription}>
                {plan.sceneDescription || 'No description'}
            </p>

            {/* Footer badges */}
            <div className="flex flex-wrap gap-1">
                <span className="px-1 py-0.5 bg-white border border-gray-300 rounded text-[8px] font-comic font-bold uppercase">
                    {plan.emotionalBeat}
                </span>
                {plan.isFlashback && (
                    <span className="px-1 py-0.5 bg-amber-200 border border-amber-400 rounded text-[8px] font-comic font-bold">
                        📜 Flashback
                    </span>
                )}
                <span className="px-1 py-0.5 bg-gray-200 border border-gray-400 rounded text-[8px] font-comic" title={plan.transitionType}>
                    → {plan.transitionType.split('-')[0]}
                </span>
            </div>

            {/* Characters */}
            <div className="mt-1 text-[9px] text-gray-500 font-comic truncate">
                👥 {plan.primaryCharacters.join(', ')} | Focus: {plan.focusCharacter}
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
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-[900px] w-full bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-comic text-3xl text-red-600 uppercase tracking-tighter">Story Outline</h2>
                    {hasPageBreakdown && !storyOutline.isGenerating && (
                        <div className="flex gap-1 border-2 border-black">
                            <button
                                onClick={() => setViewMode('visual')}
                                className={`px-3 py-1 font-comic text-xs font-bold transition-colors ${
                                    viewMode === 'visual' ? 'bg-yellow-400 text-black' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                📊 Visual
                            </button>
                            <button
                                onClick={() => setViewMode('text')}
                                className={`px-3 py-1 font-comic text-xs font-bold transition-colors ${
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
                            <div className="flex-1 overflow-y-auto mb-4">
                                {/* Legend */}
                                <div className="mb-3 p-2 bg-gray-50 border-2 border-gray-300 rounded">
                                    <p className="font-comic text-xs font-bold mb-1">Legend:</p>
                                    <div className="flex flex-wrap gap-2 text-[10px] font-comic">
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
                                        <span>⚡ Decision Page</span>
                                    </div>
                                </div>

                                {/* Page Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {storyOutline.pageBreakdown!.map((plan) => (
                                        <PageCard key={plan.pageIndex} plan={plan} />
                                    ))}
                                </div>

                                {/* Summary Stats */}
                                <div className="mt-3 p-2 bg-blue-50 border-2 border-blue-300 rounded">
                                    <p className="font-comic text-xs font-bold">
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
                                className="flex-1 w-full p-4 border-4 border-black font-comic text-sm mb-4 resize-none bg-yellow-50 shadow-inner min-h-[250px]"
                                placeholder="Generated outline will appear here..."
                            />
                        )}

                        {/* Regenerate controls */}
                        <div className="mb-4 text-left">
                            <p className="font-comic text-xs font-bold mb-1 uppercase">Regenerate with Context/Notes:</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={outlineNotes}
                                    onChange={(e) => onOutlineNotesChange(e.target.value)}
                                    placeholder="Add notes for regeneration... (e.g., 'more action scenes', 'add a flashback on page 5')"
                                    className="flex-1 p-2 border-2 border-black font-comic text-sm"
                                />
                                <button
                                    onClick={() => onGenerateOutline(outlineNotes)}
                                    className="comic-btn bg-blue-600 text-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-blue-500"
                                >
                                    REGENERATE
                                </button>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <button
                                onClick={onProceedWithOutline}
                                className="comic-btn bg-green-600 text-white py-3 font-bold border-2 border-black hover:bg-green-500 text-xs"
                            >
                                ✅ APPROVE & PROCEED
                            </button>
                            <label className="comic-btn bg-gray-200 text-black py-3 font-bold border-2 border-black hover:bg-gray-300 text-xs text-center cursor-pointer">
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
                                className="comic-btn bg-red-600 text-white py-3 font-bold border-2 border-black hover:bg-red-500 text-xs"
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
