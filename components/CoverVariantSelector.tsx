/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface CoverVariant {
  imageUrl: string;
  prompt: string;
}

export interface CoverVariantSelectorProps {
  variants: CoverVariant[];
  selectedIndex: number | null;
  isGenerating: boolean;
  onSelect: (index: number) => void;
  onClose: () => void;
  onGenerateMore?: () => void;
}

/**
 * Modal component for selecting from multiple cover variants
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
      className="cover-variant-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-selector-title"
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 id="cover-selector-title" style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>
            Select Your Cover
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
            aria-label="Close cover selector"
          >
            ✕
          </button>
        </div>

        {isGenerating && variants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>Generating cover variants...</p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          {variants.map((variant, index) => (
            <div
              key={index}
              onClick={() => onSelect(index)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: selectedIndex === index ? '3px solid #4f46e5' : '3px solid transparent',
                transition: 'all 0.2s ease',
                boxShadow: selectedIndex === index ? '0 0 20px rgba(79, 70, 229, 0.5)' : '0 4px 12px rgba(0,0,0,0.3)'
              }}
              role="button"
              tabIndex={0}
              aria-label={`Cover variant ${index + 1}${selectedIndex === index ? ' (selected)' : ''}`}
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
                style={{
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '2/3',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '0.75rem',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Variant {index + 1}</span>
                {selectedIndex === index && (
                  <span style={{ color: '#4f46e5' }}>✓ Selected</span>
                )}
              </div>
            </div>
          ))}

          {/* Loading placeholder for generating variants */}
          {isGenerating && variants.length < 3 && (
            <div
              style={{
                aspectRatio: '2/3',
                borderRadius: '0.75rem',
                backgroundColor: '#2a2a3e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                <span>Generating...</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {onGenerateMore && (
            <button
              onClick={onGenerateMore}
              disabled={isGenerating}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #4f46e5',
                backgroundColor: 'transparent',
                color: '#4f46e5',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.5 : 1,
                fontWeight: 500
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate More'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#333',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          {selectedIndex !== null && (
            <button
              onClick={() => onSelect(selectedIndex)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#4f46e5',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Use This Cover
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverVariantSelector;
