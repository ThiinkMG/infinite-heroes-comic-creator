/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pre-generation cost estimator component for the Setup page.
 * Shows estimated API costs based on page count, mode, and character count.
 */

import React, { useMemo } from 'react';
import { estimateGenerationCost, formatCost, ESTIMATED_COSTS } from '../stores/useMetricsStore';

// ============================================================================
// TYPES
// ============================================================================

interface CostEstimatorProps {
  /** Number of story pages to generate */
  pageCount: number;
  /** Number of characters (hero + friend + additional) */
  characterCount: number;
  /** Whether using outline mode */
  isOutlineMode: boolean;
  /** Optional custom class name */
  className?: string;
  /** Whether to show detailed breakdown */
  showBreakdown?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CostEstimator: React.FC<CostEstimatorProps> = ({
  pageCount,
  characterCount,
  isOutlineMode,
  className = '',
  showBreakdown = false,
}) => {
  // Calculate estimated cost
  const estimate = useMemo(() => {
    const totalCost = estimateGenerationCost(pageCount, characterCount, isOutlineMode);

    // Breakdown for detailed view
    const coverCost = 2 * ESTIMATED_COSTS.image; // cover + back cover
    const storyImageCost = pageCount * ESTIMATED_COSTS.image;
    const narrativeCost = pageCount * ESTIMATED_COSTS.beat;
    const profileCost = characterCount * ESTIMATED_COSTS.profile;
    const outlineCost = isOutlineMode ? ESTIMATED_COSTS.outline : 0;

    return {
      total: totalCost,
      breakdown: {
        covers: coverCost,
        storyImages: storyImageCost,
        narratives: narrativeCost,
        profiles: profileCost,
        outline: outlineCost,
      },
    };
  }, [pageCount, characterCount, isOutlineMode]);

  // Don't show if no generations expected
  if (pageCount === 0 && characterCount === 0) {
    return null;
  }

  return (
    <div
      className={`
        bg-purple-50 border-2 border-purple-300
        p-3 rounded
        ${className}
      `}
      style={{ fontFamily: "'Comic Neue', sans-serif" }}
    >
      {/* Main estimate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-purple-600 text-lg">$</span>
          <span className="text-sm font-bold text-gray-700">
            Estimated API Cost:
          </span>
        </div>
        <span
          className="text-lg font-bold text-purple-700"
          style={{ fontFamily: "'Bangers', cursive" }}
        >
          ~{formatCost(estimate.total)}
        </span>
      </div>

      {/* Configuration summary */}
      <div className="mt-1 text-xs text-gray-500">
        {pageCount} pages, {characterCount} character{characterCount !== 1 ? 's' : ''}, {isOutlineMode ? 'Outline' : 'Novel'} mode
      </div>

      {/* Detailed breakdown */}
      {showBreakdown && estimate.total > 0 && (
        <div className="mt-3 pt-2 border-t border-purple-200 space-y-1 text-xs">
          <div className="font-bold text-gray-600 mb-1">Cost Breakdown:</div>

          {estimate.breakdown.covers > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Cover + Back Cover (2 images):</span>
              <span>{formatCost(estimate.breakdown.covers)}</span>
            </div>
          )}

          {estimate.breakdown.storyImages > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Story Page Images ({pageCount}):</span>
              <span>{formatCost(estimate.breakdown.storyImages)}</span>
            </div>
          )}

          {estimate.breakdown.narratives > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Narrative Generation ({pageCount}):</span>
              <span>{formatCost(estimate.breakdown.narratives)}</span>
            </div>
          )}

          {estimate.breakdown.profiles > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Profile Analysis ({characterCount}):</span>
              <span>{formatCost(estimate.breakdown.profiles)}</span>
            </div>
          )}

          {estimate.breakdown.outline > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Outline Generation:</span>
              <span>{formatCost(estimate.breakdown.outline)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-gray-700 pt-1 border-t border-purple-200">
            <span>Total Estimate:</span>
            <span>{formatCost(estimate.total)}</span>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-2 text-xs text-gray-400 italic">
        * Estimates based on typical usage. Actual costs may vary.
      </div>
    </div>
  );
};

// ============================================================================
// COMPACT VERSION
// ============================================================================

interface CostEstimatorCompactProps {
  /** Number of story pages to generate */
  pageCount: number;
  /** Number of characters */
  characterCount: number;
  /** Whether using outline mode */
  isOutlineMode: boolean;
  /** Optional custom class name */
  className?: string;
}

/**
 * Compact version of the cost estimator - just shows the estimate inline
 */
export const CostEstimatorCompact: React.FC<CostEstimatorCompactProps> = ({
  pageCount,
  characterCount,
  isOutlineMode,
  className = '',
}) => {
  const totalCost = useMemo(() => {
    return estimateGenerationCost(pageCount, characterCount, isOutlineMode);
  }, [pageCount, characterCount, isOutlineMode]);

  if (pageCount === 0 && characterCount === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-purple-600 ${className}`}
      title={`Estimated API cost: ~${formatCost(totalCost)}`}
    >
      <span>$</span>
      <span className="font-bold">~{formatCost(totalCost)}</span>
    </span>
  );
};

export default CostEstimator;
