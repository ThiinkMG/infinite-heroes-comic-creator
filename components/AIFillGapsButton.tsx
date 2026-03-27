/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StoryOutline, PageCharacterPlan } from '../types';

/**
 * Props for the AIFillGapsButton component.
 */
interface AIFillGapsButtonProps {
    /** The current story outline */
    outline: StoryOutline;
    /** Callback to update the outline after AI enhancement */
    onOutlineUpdate: (content: string, pageBreakdown?: PageCharacterPlan[]) => void;
    /** Whether outline generation is currently in progress */
    isGenerating: boolean;
    /** Optional callback for AI enhancement (stub for now, will be implemented in App.tsx) */
    onEnhanceWithAI?: (outline: StoryOutline) => Promise<{ content: string; pageBreakdown?: PageCharacterPlan[] }>;
    /** Custom className for additional styling */
    className?: string;
}

/**
 * Analysis result for identifying gaps in the outline.
 */
interface GapAnalysis {
    /** Total number of gaps found */
    totalGaps: number;
    /** Pages with missing or sparse descriptions */
    sparsePages: number[];
    /** Whether the main outline content is sparse */
    isContentSparse: boolean;
    /** Summary message for the user */
    summary: string;
}

/**
 * Minimum character count to consider a page description "complete".
 * Below this threshold, a description is considered sparse.
 */
const MIN_DESCRIPTION_LENGTH = 20;

/**
 * Minimum character count for the main outline content.
 */
const MIN_CONTENT_LENGTH = 100;

/**
 * Analyzes the outline for gaps and sparse descriptions.
 */
function analyzeOutlineGaps(outline: StoryOutline): GapAnalysis {
    const sparsePages: number[] = [];
    let isContentSparse = false;

    // Check main content
    if (!outline.content || outline.content.trim().length < MIN_CONTENT_LENGTH) {
        isContentSparse = true;
    }

    // Check page breakdown
    if (outline.pageBreakdown && outline.pageBreakdown.length > 0) {
        outline.pageBreakdown.forEach((page) => {
            const desc = page.sceneDescription?.trim() || '';
            if (desc.length < MIN_DESCRIPTION_LENGTH) {
                sparsePages.push(page.pageIndex);
            }
        });
    }

    const totalGaps = sparsePages.length + (isContentSparse ? 1 : 0);

    // Generate summary
    let summary = '';
    if (totalGaps === 0) {
        summary = 'Outline looks complete! AI can still enhance descriptions.';
    } else {
        const parts: string[] = [];
        if (isContentSparse) {
            parts.push('main outline needs more detail');
        }
        if (sparsePages.length > 0) {
            if (sparsePages.length === 1) {
                parts.push(`page ${sparsePages[0]} has sparse description`);
            } else if (sparsePages.length <= 3) {
                parts.push(`pages ${sparsePages.join(', ')} have sparse descriptions`);
            } else {
                parts.push(`${sparsePages.length} pages have sparse descriptions`);
            }
        }
        summary = `Found: ${parts.join('; ')}.`;
    }

    return {
        totalGaps,
        sparsePages,
        isContentSparse,
        summary,
    };
}

/**
 * AIFillGapsButton component for analyzing and enhancing outline gaps.
 *
 * When the outline has missing or sparse page descriptions, this button:
 * 1. Analyzes the outline to find gaps
 * 2. Shows a badge with the number of issues found
 * 3. Calls AI to suggest improvements for sparse sections
 */
export const AIFillGapsButton: React.FC<AIFillGapsButtonProps> = ({
    outline,
    onOutlineUpdate,
    isGenerating,
    onEnhanceWithAI,
    className = '',
}) => {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Analyze gaps whenever outline changes
    const gapAnalysis = useMemo(() => analyzeOutlineGaps(outline), [outline]);

    // Handle the enhance button click
    const handleEnhance = async () => {
        if (!outline.content || isEnhancing || isGenerating) return;

        setError(null);
        setIsEnhancing(true);
        setShowAnalysis(false);

        try {
            if (onEnhanceWithAI) {
                // Use provided AI enhancement function
                const result = await onEnhanceWithAI(outline);
                onOutlineUpdate(result.content, result.pageBreakdown);
            } else {
                // Stub implementation - just log for now
                console.log('[AIFillGapsButton] Enhancement requested. Gap analysis:', gapAnalysis);
                console.log('[AIFillGapsButton] Outline to enhance:', outline);

                // Simulate a delay to show the loading state works
                await new Promise(resolve => setTimeout(resolve, 1000));

                // For now, just show a message that this is a stub
                setError('AI enhancement not yet connected. This is a UI placeholder.');
            }
        } catch (e) {
            console.error('[AIFillGapsButton] Enhancement failed:', e);
            setError(e instanceof Error ? e.message : 'Enhancement failed. Please try again.');
        } finally {
            setIsEnhancing(false);
        }
    };

    // Don't render if outline is empty
    if (!outline.content && (!outline.pageBreakdown || outline.pageBreakdown.length === 0)) {
        return null;
    }

    const isDisabled = isEnhancing || isGenerating || !outline.content;
    const hasGaps = gapAnalysis.totalGaps > 0;

    return (
        <div className={`inline-flex flex-col items-start ${className}`}>
            {/* Main Button */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleEnhance}
                    disabled={isDisabled}
                    className={`
                        comic-btn text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2
                        border-[3px] border-black uppercase font-bold
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${hasGaps
                            ? 'bg-amber-600 hover:bg-amber-500'
                            : 'bg-purple-600 hover:bg-purple-500'
                        }
                    `}
                    title={gapAnalysis.summary}
                    aria-label="Enhance outline with AI"
                >
                    {isEnhancing ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ENHANCING...
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5">
                            <span>AI FILL GAPS</span>
                            {hasGaps && (
                                <span className="bg-white text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {gapAnalysis.totalGaps}
                                </span>
                            )}
                        </span>
                    )}
                </button>

                {/* Analysis toggle button */}
                <button
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                    title="Show gap analysis"
                    aria-label="Toggle gap analysis details"
                    aria-expanded={showAnalysis}
                >
                    <svg
                        className={`w-5 h-5 transition-transform ${showAnalysis ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Analysis Details Panel */}
            {showAnalysis && (
                <div className="mt-2 p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-xs sm:text-sm font-comic w-full max-w-md">
                    <p className="font-bold mb-2">Gap Analysis:</p>
                    <p className={`mb-2 ${hasGaps ? 'text-amber-700' : 'text-green-700'}`}>
                        {gapAnalysis.summary}
                    </p>

                    {gapAnalysis.isContentSparse && (
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <span className="text-lg">!</span>
                            <span>Main outline content is sparse (&lt;{MIN_CONTENT_LENGTH} chars)</span>
                        </div>
                    )}

                    {gapAnalysis.sparsePages.length > 0 && (
                        <div className="flex items-start gap-2 text-amber-600">
                            <span className="text-lg">!</span>
                            <span>
                                Sparse page descriptions: {gapAnalysis.sparsePages.map(p => `Page ${p}`).join(', ')}
                            </span>
                        </div>
                    )}

                    {!hasGaps && (
                        <div className="flex items-center gap-2 text-green-600">
                            <span className="text-lg">OK</span>
                            <span>All pages have descriptions. AI can still enhance them.</span>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-2 p-2 bg-red-100 border-2 border-red-300 rounded text-xs text-red-700 font-comic">
                    {error}
                </div>
            )}
        </div>
    );
};

export default AIFillGapsButton;
