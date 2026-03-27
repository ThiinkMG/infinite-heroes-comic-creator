/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Represents a single variation generated from a reroll request
 */
export interface Variation {
    /** Unique identifier for this variation */
    id: string;
    /** Base64 image data */
    imageData: string;
    /** Seed used for generation (for reproducibility) */
    seed: number;
    /** Whether this variation is currently loading */
    isLoading?: boolean;
    /** Error message if generation failed */
    error?: string;
    /** Generation timestamp */
    generatedAt: number;
}

/**
 * Generation options passed to the variation generator
 */
export interface VariationGenerationOptions {
    /** Number of variations to generate */
    count: number;
    /** Whether to include the original image for comparison */
    includeOriginal?: boolean;
}

/**
 * Props for the VariationGallery component
 */
export interface VariationGalleryProps {
    /** Current/original image (base64) */
    originalImage?: string;
    /** Generated variations */
    variations: Variation[];
    /** Whether variations are currently being generated */
    isGenerating: boolean;
    /** Generation progress (0-100) */
    progress?: number;
    /** Page index being regenerated */
    pageIndex: number;
    /** Callback when user selects a variation */
    onSelectVariation: (variation: Variation) => void;
    /** Callback to generate new variations */
    onGenerateVariations: (options: VariationGenerationOptions) => void;
    /** Callback to retry a failed variation */
    onRetryVariation?: (variationId: string) => void;
    /** Callback to close the gallery */
    onClose: () => void;
    /** Number of variations to generate (default: 4) */
    variationCount?: number;
}

/**
 * Comparison mode state
 */
type ComparisonMode = 'grid' | 'compare' | 'fullscreen';

// ============================================================================
// VARIATION GALLERY COMPONENT
// ============================================================================

export const VariationGallery: React.FC<VariationGalleryProps> = ({
    originalImage,
    variations,
    isGenerating,
    progress = 0,
    pageIndex,
    onSelectVariation,
    onGenerateVariations,
    onRetryVariation,
    onClose,
    variationCount = 4
}) => {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------

    // View mode
    const [viewMode, setViewMode] = useState<ComparisonMode>('grid');

    // Selected variation for comparison
    const [compareVariationId, setCompareVariationId] = useState<string | null>(null);

    // Fullscreen variation
    const [fullscreenVariationId, setFullscreenVariationId] = useState<string | null>(null);

    // Compare slider position (0-100)
    const [comparePosition, setComparePosition] = useState(50);

    // -------------------------------------------------------------------------
    // COMPUTED VALUES
    // -------------------------------------------------------------------------

    const selectedVariation = variations.find(v => v.id === compareVariationId);
    const fullscreenVariation = variations.find(v => v.id === fullscreenVariationId);

    const successfulVariations = variations.filter(v => !v.error && !v.isLoading);
    const failedVariations = variations.filter(v => v.error);
    const loadingVariations = variations.filter(v => v.isLoading);

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------

    const handleGenerateClick = () => {
        onGenerateVariations({ count: variationCount, includeOriginal: true });
    };

    const handleVariationClick = (variation: Variation) => {
        if (variation.error) {
            onRetryVariation?.(variation.id);
        } else if (variation.isLoading) {
            // Do nothing for loading variations
        } else {
            // Toggle selection or open comparison
            if (viewMode === 'compare') {
                setCompareVariationId(variation.id);
            } else {
                setFullscreenVariationId(variation.id);
                setViewMode('fullscreen');
            }
        }
    };

    const handleSelectAndClose = (variation: Variation) => {
        onSelectVariation(variation);
    };

    const handleCompareSliderChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setComparePosition(percentage);
    }, []);

    const handleTouchCompare = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setComparePosition(percentage);
    }, []);

    // -------------------------------------------------------------------------
    // RENDER HELPERS
    // -------------------------------------------------------------------------

    const renderLoadingState = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-20 h-20 mb-4">
                {/* Spinning loader */}
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                <div
                    className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"
                    style={{ animationDuration: '1s' }}
                />
                {/* Progress percentage */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-comic font-bold text-lg text-gray-700">{Math.round(progress)}%</span>
                </div>
            </div>
            <p className="font-comic text-base font-bold text-gray-800 mb-2">
                Generating {variationCount} variations...
            </p>
            <p className="font-comic text-sm text-gray-500">
                {loadingVariations.length} of {variationCount} in progress
            </p>

            {/* Progress bar */}
            <div className="w-64 h-3 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <p className="font-comic text-lg font-bold text-gray-800 mb-2">
                Generate Multiple Variations
            </p>
            <p className="font-comic text-sm text-gray-500 text-center max-w-sm mb-6">
                Create {variationCount} different versions of this panel and pick your favorite.
            </p>
            <button
                onClick={handleGenerateClick}
                className="comic-btn bg-yellow-400 text-black min-h-[56px] px-8 py-3 border-[4px] border-black font-bold uppercase tracking-wider shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:-translate-y-1 transition-transform touch-manipulation"
            >
                🎲 Generate {variationCount} Variations
            </button>
        </div>
    );

    const renderGridView = () => (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Original Image (if available) */}
            {originalImage && (
                <div className="relative border-4 border-blue-500 rounded-lg overflow-hidden bg-blue-50">
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                        ORIGINAL
                    </div>
                    <img
                        src={`data:image/png;base64,${originalImage}`}
                        alt="Original panel"
                        className="w-full aspect-[3/4] object-cover"
                    />
                </div>
            )}

            {/* Variation Cards */}
            {variations.map((variation, index) => (
                <div
                    key={variation.id}
                    className={`
                        relative border-4 rounded-lg overflow-hidden cursor-pointer
                        transition-all touch-manipulation
                        ${variation.error
                            ? 'border-red-400 bg-red-50'
                            : variation.isLoading
                                ? 'border-gray-300 bg-gray-100'
                                : 'border-gray-400 bg-white hover:border-green-500 hover:shadow-[4px_4px_0px_rgba(0,0,0,0.2)]'
                        }
                    `}
                    onClick={() => handleVariationClick(variation)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleVariationClick(variation);
                        }
                    }}
                    aria-label={`Variation ${index + 1}${variation.error ? ' - failed' : variation.isLoading ? ' - loading' : ''}`}
                >
                    {/* Variation number badge */}
                    <div className={`
                        absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold z-10
                        ${variation.error
                            ? 'bg-red-500 text-white'
                            : variation.isLoading
                                ? 'bg-gray-400 text-white'
                                : 'bg-gray-700 text-white'
                        }
                    `}>
                        #{index + 1}
                    </div>

                    {variation.isLoading ? (
                        /* Loading state */
                        <div className="w-full aspect-[3/4] flex items-center justify-center bg-gray-100">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 border-4 border-gray-300 border-t-yellow-400 rounded-full animate-spin mb-2" />
                                <span className="font-comic text-sm text-gray-500">Generating...</span>
                            </div>
                        </div>
                    ) : variation.error ? (
                        /* Error state */
                        <div className="w-full aspect-[3/4] flex items-center justify-center bg-red-50 p-4">
                            <div className="flex flex-col items-center text-center">
                                <span className="text-4xl mb-2">⚠️</span>
                                <span className="font-comic text-sm text-red-700 font-bold mb-2">Failed</span>
                                <span className="font-comic text-xs text-red-600">{variation.error}</span>
                                {onRetryVariation && (
                                    <button
                                        className="mt-3 px-3 py-1 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-400"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRetryVariation(variation.id);
                                        }}
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Successful variation */
                        <>
                            <img
                                src={`data:image/png;base64,${variation.imageData}`}
                                alt={`Variation ${index + 1}`}
                                className="w-full aspect-[3/4] object-cover"
                            />
                            {/* Select button overlay */}
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectAndClose(variation);
                                    }}
                                    className="comic-btn bg-green-500 text-white px-4 py-2 border-2 border-black font-bold text-sm hover:bg-green-400"
                                >
                                    ✓ Select
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Placeholder cards while generating */}
            {isGenerating && variations.length < variationCount && (
                Array.from({ length: variationCount - variations.length }).map((_, i) => (
                    <div
                        key={`placeholder-${i}`}
                        className="relative border-4 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50"
                    >
                        <div className="w-full aspect-[3/4] flex items-center justify-center">
                            <div className="flex flex-col items-center text-gray-400">
                                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin mb-2" />
                                <span className="font-comic text-xs">Waiting...</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderCompareView = () => {
        if (!originalImage || !selectedVariation) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="font-comic text-base text-gray-600 mb-4">
                        Select a variation to compare with the original
                    </p>
                    <div className="flex gap-2 flex-wrap justify-center">
                        {successfulVariations.map((v, i) => (
                            <button
                                key={v.id}
                                onClick={() => setCompareVariationId(v.id)}
                                className="comic-btn bg-gray-200 text-black min-h-[44px] px-4 py-2 border-2 border-black font-bold touch-manipulation hover:bg-gray-300"
                            >
                                Variation #{i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="relative w-full aspect-[3/4] max-w-lg mx-auto overflow-hidden rounded-lg border-4 border-black">
                {/* Original image (full width) */}
                <img
                    src={`data:image/png;base64,${originalImage}`}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Variation image (clipped) */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${comparePosition}%` }}
                >
                    <img
                        src={`data:image/png;base64,${selectedVariation.imageData}`}
                        alt="Variation"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ width: `${10000 / comparePosition}%` }}
                    />
                </div>

                {/* Slider handle */}
                <div
                    className="absolute inset-y-0 w-full cursor-ew-resize"
                    onMouseMove={handleCompareSliderChange}
                    onTouchMove={handleTouchCompare}
                >
                    <div
                        className="absolute inset-y-0 w-1 bg-white shadow-lg"
                        style={{ left: `${comparePosition}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center cursor-grab">
                            <span className="text-xs font-bold">↔</span>
                        </div>
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                    VARIATION
                </div>
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                    ORIGINAL
                </div>
            </div>
        );
    };

    const renderFullscreenView = () => {
        if (!fullscreenVariation) return null;

        return (
            <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center" onClick={() => setViewMode('grid')}>
                <div className="relative max-w-3xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
                    <img
                        src={`data:image/png;base64,${fullscreenVariation.imageData}`}
                        alt="Fullscreen variation"
                        className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />

                    {/* Action buttons */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                        <button
                            onClick={() => handleSelectAndClose(fullscreenVariation)}
                            className="comic-btn bg-green-500 text-white min-h-[48px] px-6 py-2 border-[3px] border-black font-bold uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-green-400"
                        >
                            ✓ Select This
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className="comic-btn bg-gray-500 text-white min-h-[48px] px-6 py-2 border-[3px] border-black font-bold hover:bg-gray-400"
                        >
                            Back to Grid
                        </button>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => setViewMode('grid')}
                        className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl border-2 border-white hover:bg-red-400"
                        aria-label="Close fullscreen"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    };

    // -------------------------------------------------------------------------
    // MAIN RENDER
    // -------------------------------------------------------------------------

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-0 sm:border-[6px] border-black shadow-none sm:shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-[700px] w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto m-0 sm:m-4 rounded-none sm:rounded-lg relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="variation-gallery-title"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 border-b-[4px] border-black px-4 py-3 flex justify-between items-center sticky top-0 z-10 flex-shrink-0">
                    <h2 id="variation-gallery-title" className="font-comic text-lg font-bold uppercase tracking-wider text-white">
                        🎨 Variations for #{pageIndex}
                    </h2>
                    <button
                        onClick={onClose}
                        className="comic-btn bg-red-600 text-white min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500 touch-manipulation"
                        aria-label="Close variation gallery"
                    >
                        ✕
                    </button>
                </div>

                {/* View Mode Tabs (if we have variations) */}
                {variations.length > 0 && (
                    <div className="border-b-2 border-gray-200 px-4 py-2 flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-4 py-2 font-comic text-sm font-bold rounded-t transition-colors ${
                                viewMode === 'grid'
                                    ? 'bg-purple-100 text-purple-800 border-b-2 border-purple-500'
                                    : 'text-gray-600 hover:text-purple-600'
                            }`}
                        >
                            Grid View
                        </button>
                        <button
                            onClick={() => setViewMode('compare')}
                            disabled={!originalImage || successfulVariations.length === 0}
                            className={`px-4 py-2 font-comic text-sm font-bold rounded-t transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                viewMode === 'compare'
                                    ? 'bg-purple-100 text-purple-800 border-b-2 border-purple-500'
                                    : 'text-gray-600 hover:text-purple-600'
                            }`}
                        >
                            Compare
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 pb-24 sm:pb-4">
                    {isGenerating && variations.length === 0 ? (
                        renderLoadingState()
                    ) : variations.length === 0 ? (
                        renderEmptyState()
                    ) : viewMode === 'compare' ? (
                        renderCompareView()
                    ) : (
                        renderGridView()
                    )}
                </div>

                {/* Footer Actions */}
                {variations.length > 0 && !isGenerating && viewMode !== 'fullscreen' && (
                    <div className="border-t-4 border-black p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 sticky bottom-0 z-10">
                        <div className="font-comic text-sm text-gray-600">
                            {successfulVariations.length} of {variationCount} generated
                            {failedVariations.length > 0 && (
                                <span className="text-red-600 ml-2">({failedVariations.length} failed)</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleGenerateClick}
                                className="comic-btn bg-purple-600 text-white min-h-[48px] px-6 py-2 border-[3px] border-black font-bold hover:bg-purple-500 touch-manipulation"
                            >
                                🔄 Try Again
                            </button>
                            {successfulVariations.length > 0 && (
                                <button
                                    onClick={() => handleSelectAndClose(successfulVariations[0])}
                                    className="comic-btn bg-green-600 text-white min-h-[48px] px-6 py-2 border-[3px] border-black font-bold hover:bg-green-500 touch-manipulation"
                                >
                                    ✓ Select Best
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Fullscreen overlay */}
                {viewMode === 'fullscreen' && renderFullscreenView()}
            </div>
        </div>
    );
};

export default VariationGallery;
