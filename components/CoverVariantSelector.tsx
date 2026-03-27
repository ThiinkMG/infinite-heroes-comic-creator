/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { COVER_STYLES, CoverStyle, getCoverStyleById } from '../data/coverStyles';

// ============================================================================
// TYPES
// ============================================================================

export interface CoverVariant {
  imageUrl: string;
  prompt: string;
  styleId?: string;
}

export interface CoverVariantSelectorProps {
  variants: CoverVariant[];
  selectedIndex: number | null;
  isGenerating: boolean;
  onSelect: (index: number) => void;
  onClose: () => void;
  onGenerateMore?: () => void;
}

export interface CoverStyleSelectorProps {
  selectedStyleId: string | null;
  onSelectStyle: (styleId: string) => void;
  onGenerate: (styleId: string) => void;
  onCancel: () => void;
  isGenerating?: boolean;
  recommendedGenre?: string;
}

// ============================================================================
// COVER STYLE SELECTOR (Pre-generation)
// ============================================================================

/**
 * Component for selecting a cover style before generation
 * Displays 4 cover style options in a compact grid layout
 */
export const CoverStyleSelector: React.FC<CoverStyleSelectorProps> = ({
  selectedStyleId,
  onSelectStyle,
  onGenerate,
  onCancel,
  isGenerating = false,
  recommendedGenre
}) => {
  // Get recommended styles for the current genre
  const recommendedStyles = recommendedGenre
    ? COVER_STYLES.filter(style => style.recommendedFor?.includes(recommendedGenre))
    : [];

  const isRecommended = (styleId: string): boolean => {
    return recommendedStyles.some(s => s.id === styleId);
  };

  return (
    <div className="cover-style-selector">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-comic text-lg font-bold text-gray-800">
          Choose Cover Style
        </h3>
        {recommendedGenre && recommendedStyles.length > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Recommended for {recommendedGenre}
          </span>
        )}
      </div>

      {/* Style Grid - 2x2 layout */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {COVER_STYLES.map((style) => (
          <CoverStyleCard
            key={style.id}
            style={style}
            isSelected={selectedStyleId === style.id}
            isRecommended={isRecommended(style.id)}
            onSelect={() => onSelectStyle(style.id)}
            disabled={isGenerating}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={isGenerating}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-comic font-bold text-sm text-gray-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => selectedStyleId && onGenerate(selectedStyleId)}
          disabled={!selectedStyleId || isGenerating}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-comic font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Cover'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COVER STYLE CARD
// ============================================================================

interface CoverStyleCardProps {
  style: CoverStyle;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Individual cover style card with icon, label, and description
 */
const CoverStyleCard: React.FC<CoverStyleCardProps> = ({
  style,
  isSelected,
  isRecommended,
  onSelect,
  disabled = false
}) => {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative p-3 rounded-lg border-2 text-left transition-all
        ${isSelected
          ? 'border-red-600 bg-red-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
      `}
      aria-pressed={isSelected}
      aria-label={`${style.label} cover style: ${style.description}`}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
          Rec
        </span>
      )}

      {/* Icon and Label */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl" role="img" aria-hidden="true">
          {style.icon}
        </span>
        <span className="font-comic font-bold text-sm text-gray-800">
          {style.label}
        </span>
        {isSelected && (
          <span className="ml-auto text-red-600 text-sm">✓</span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-tight">
        {style.description}
      </p>
    </button>
  );
};

// ============================================================================
// COVER VARIANT SELECTOR (Post-generation)
// ============================================================================

/**
 * Modal component for selecting from multiple cover variants
 * Used after cover images have been generated to pick the final one
 */
export const CoverVariantSelector: React.FC<CoverVariantSelectorProps> = ({
  variants,
  selectedIndex,
  isGenerating,
  onSelect,
  onClose,
  onGenerateMore
}) => {
  return (
    <div
      className="cover-variant-overlay fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-[1000] p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-selector-title"
    >
      <div className="bg-[#1a1a2e] rounded-2xl p-8 max-w-[90vw] max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2
            id="cover-selector-title"
            className="m-0 text-white text-2xl font-bold"
          >
            Select Your Cover
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-gray-400 text-2xl cursor-pointer p-2 hover:text-white transition-colors"
            aria-label="Close cover selector"
          >
            ✕
          </button>
        </div>

        {/* Loading state */}
        {isGenerating && variants.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">⏳</div>
            <p>Generating cover variants...</p>
          </div>
        )}

        {/* Variants grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-6">
          {variants.map((variant, index) => {
            const style = variant.styleId ? getCoverStyleById(variant.styleId) : null;

            return (
              <div
                key={index}
                onClick={() => onSelect(index)}
                className={`
                  relative cursor-pointer rounded-xl overflow-hidden transition-all
                  ${selectedIndex === index
                    ? 'ring-4 ring-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]'
                    : 'ring-2 ring-transparent hover:ring-gray-600 shadow-lg'
                  }
                `}
                role="button"
                tabIndex={0}
                aria-label={`Cover variant ${index + 1}${style ? ` (${style.label})` : ''}${selectedIndex === index ? ' (selected)' : ''}`}
                aria-pressed={selectedIndex === index}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(index);
                  }
                }}
              >
                <img
                  src={variant.imageUrl}
                  alt={`Cover variant ${index + 1}`}
                  className="w-full h-auto aspect-[2/3] object-cover block"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-sm font-medium flex justify-between items-center">
                  <span>
                    {style ? `${style.icon} ${style.label}` : `Variant ${index + 1}`}
                  </span>
                  {selectedIndex === index && (
                    <span className="text-indigo-400">✓ Selected</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading placeholder */}
          {isGenerating && variants.length < 3 && (
            <div className="aspect-[2/3] rounded-xl bg-[#2a2a3e] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-3xl mb-2">⏳</div>
                <span>Generating...</span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 justify-end">
          {onGenerateMore && (
            <button
              onClick={onGenerateMore}
              disabled={isGenerating}
              className="px-6 py-3 rounded-lg border border-indigo-500 bg-transparent text-indigo-400 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500/10"
            >
              {isGenerating ? 'Generating...' : 'Generate More'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border-none bg-gray-700 text-white font-medium cursor-pointer hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          {selectedIndex !== null && (
            <button
              onClick={() => onSelect(selectedIndex)}
              className="px-6 py-3 rounded-lg border-none bg-indigo-600 text-white font-medium cursor-pointer hover:bg-indigo-500 transition-colors"
            >
              Use This Cover
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMBINED COVER WORKFLOW MODAL
// ============================================================================

export interface CoverWorkflowModalProps {
  /** Current mode: 'style' for selection, 'variants' for picking result */
  mode: 'style' | 'variants';
  /** Generated variants (for variants mode) */
  variants: CoverVariant[];
  /** Currently selected variant index */
  selectedVariantIndex: number | null;
  /** Whether currently generating */
  isGenerating: boolean;
  /** Current genre for recommendations */
  genre?: string;
  /** Called when a style is selected and generation requested */
  onGenerateWithStyle: (styleId: string) => void;
  /** Called when a variant is selected */
  onSelectVariant: (index: number) => void;
  /** Called when user confirms selection */
  onConfirm: () => void;
  /** Called when modal is closed/cancelled */
  onClose: () => void;
  /** Called to generate more variants */
  onGenerateMore?: () => void;
}

/**
 * Combined modal that handles both style selection and variant picking
 */
export const CoverWorkflowModal: React.FC<CoverWorkflowModalProps> = ({
  mode,
  variants,
  selectedVariantIndex,
  isGenerating,
  genre,
  onGenerateWithStyle,
  onSelectVariant,
  onConfirm,
  onClose,
  onGenerateMore
}) => {
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  if (mode === 'style') {
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-4 border-black">
          <CoverStyleSelector
            selectedStyleId={selectedStyleId}
            onSelectStyle={setSelectedStyleId}
            onGenerate={(styleId) => {
              onGenerateWithStyle(styleId);
            }}
            onCancel={onClose}
            isGenerating={isGenerating}
            recommendedGenre={genre}
          />
        </div>
      </div>
    );
  }

  // Variants mode
  return (
    <CoverVariantSelector
      variants={variants}
      selectedIndex={selectedVariantIndex}
      isGenerating={isGenerating}
      onSelect={onSelectVariant}
      onClose={onClose}
      onGenerateMore={onGenerateMore}
    />
  );
};

export default CoverVariantSelector;
