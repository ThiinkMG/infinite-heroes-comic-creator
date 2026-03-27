/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Floating metrics dashboard showing API usage and cost estimates.
 * Toggleable panel that shows generation statistics.
 */

import React, { useState } from 'react';
import {
  useMetricsStore,
  formatCost,
  formatDuration,
  GenerationType,
} from '../stores/useMetricsStore';

// ============================================================================
// TYPES
// ============================================================================

interface MetricsDashboardProps {
  /** Position of the dashboard */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Initial expanded state */
  defaultExpanded?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  position = 'bottom-left',
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isVisible, setIsVisible] = useState(true);

  // Store selectors
  const totalGenerations = useMetricsStore((s) => s.totalGenerations);
  const successfulGenerations = useMetricsStore((s) => s.successfulGenerations);
  const failedGenerations = useMetricsStore((s) => s.failedGenerations);
  const averageGenerationTime = useMetricsStore((s) => s.averageGenerationTime);
  const totalApiCalls = useMetricsStore((s) => s.totalApiCalls);
  const generationsByType = useMetricsStore((s) => s.generationsByType);
  const sessionStartTime = useMetricsStore((s) => s.sessionStartTime);
  const getSuccessRate = useMetricsStore((s) => s.getSuccessRate);
  const getEstimatedCost = useMetricsStore((s) => s.getEstimatedCost);
  const getSessionDuration = useMetricsStore((s) => s.getSessionDuration);
  const resetSessionMetrics = useMetricsStore((s) => s.resetSessionMetrics);

  // Position classes
  const positionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Don't render if hidden
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`
          fixed ${positionClasses[position]} z-50
          w-10 h-10
          bg-white border-4 border-black
          shadow-[3px_3px_0px_black]
          flex items-center justify-center
          hover:bg-yellow-100
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
        style={{ fontFamily: "'Bangers', cursive" }}
        aria-label="Show metrics dashboard"
        title="Show API Metrics"
      >
        <span className="text-lg">$</span>
      </button>
    );
  }

  // Only show if there have been any generations
  if (totalGenerations === 0 && !isExpanded) {
    return null;
  }

  const successRate = getSuccessRate();
  const estimatedCost = getEstimatedCost();
  const sessionDuration = getSessionDuration();

  const typeLabels: Record<GenerationType, string> = {
    image: 'Images',
    beat: 'Narratives',
    profile: 'Profiles',
    outline: 'Outlines',
  };

  return (
    <div
      className={`
        fixed ${positionClasses[position]} z-50
        bg-white border-4 border-black
        shadow-[4px_4px_0px_black]
        transition-all duration-200
        ${isExpanded ? 'w-72' : 'w-auto'}
      `}
      style={{ fontFamily: "'Comic Neue', sans-serif" }}
    >
      {/* Header - always visible */}
      <div
        className="
          flex items-center justify-between gap-3
          p-2 border-b-2 border-black
          bg-yellow-100
          cursor-pointer
          select-none
        "
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse metrics' : 'Expand metrics'}
      >
        <div className="flex items-center gap-2">
          <span
            className="font-bold text-sm"
            style={{ fontFamily: "'Bangers', cursive" }}
          >
            API METRICS
          </span>
          {!isExpanded && (
            <span className="text-xs font-bold text-gray-700">
              {formatCost(estimatedCost)} | {successRate}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="
              w-5 h-5 flex items-center justify-center
              text-xs font-bold
              hover:bg-red-200 rounded
            "
            aria-label="Hide metrics dashboard"
            title="Hide"
          >
            X
          </button>
          <span className="text-xs font-bold">{isExpanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 p-2 border-2 border-black">
              <div className="font-bold text-gray-600">Generations</div>
              <div className="text-lg font-bold" style={{ fontFamily: "'Bangers', cursive" }}>
                {totalGenerations}
              </div>
            </div>
            <div className="bg-green-50 p-2 border-2 border-black">
              <div className="font-bold text-gray-600">Success Rate</div>
              <div
                className={`text-lg font-bold ${
                  successRate >= 80 ? 'text-green-600' : successRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                {successRate}%
              </div>
            </div>
          </div>

          {/* Cost estimate */}
          <div className="bg-purple-50 p-2 border-2 border-black">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-600 text-xs">Est. Cost</span>
              <span
                className="text-xl font-bold text-purple-700"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                {formatCost(estimatedCost)}
              </span>
            </div>
          </div>

          {/* Session info */}
          <div className="text-xs space-y-1 border-t-2 border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Session Duration:</span>
              <span className="font-bold">{formatDuration(sessionDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Generation Time:</span>
              <span className="font-bold">
                {averageGenerationTime > 0 ? formatDuration(Math.round(averageGenerationTime)) : '-'}
              </span>
            </div>
          </div>

          {/* API calls breakdown */}
          <div className="text-xs border-t-2 border-gray-200 pt-2">
            <div className="font-bold text-gray-600 mb-1">API Calls</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex justify-between bg-gray-50 px-2 py-1">
                <span>Gemini:</span>
                <span className="font-bold">{totalApiCalls.gemini}</span>
              </div>
              <div className="flex justify-between bg-gray-50 px-2 py-1">
                <span>Claude:</span>
                <span className="font-bold">{totalApiCalls.claude}</span>
              </div>
            </div>
          </div>

          {/* Type breakdown */}
          <div className="text-xs border-t-2 border-gray-200 pt-2">
            <div className="font-bold text-gray-600 mb-1">By Type</div>
            <div className="space-y-1">
              {(Object.keys(typeLabels) as GenerationType[]).map((type) => {
                const stats = generationsByType[type];
                if (stats.total === 0) return null;
                return (
                  <div key={type} className="flex justify-between bg-gray-50 px-2 py-1">
                    <span>{typeLabels[type]}:</span>
                    <span className="font-bold">
                      {stats.success}/{stats.total}
                      {stats.failed > 0 && (
                        <span className="text-red-500 ml-1">({stats.failed} failed)</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              if (confirm('Reset all session metrics?')) {
                resetSessionMetrics();
              }
            }}
            className="
              w-full py-1 px-2
              text-xs font-bold
              bg-gray-100 border-2 border-black
              hover:bg-gray-200
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            Reset Session
          </button>
        </div>
      )}
    </div>
  );
};

export default MetricsDashboard;
