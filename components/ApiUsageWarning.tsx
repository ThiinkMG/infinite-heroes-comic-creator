/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Toast-style warning component for API usage alerts.
 * Shows warnings when session cost exceeds threshold or error rate is high.
 */

import React, { useEffect, useState } from 'react';
import { useMetricsStore, formatCost } from '../stores/useMetricsStore';

// ============================================================================
// TYPES
// ============================================================================

type WarningType = 'cost' | 'error';

interface WarningState {
  type: WarningType;
  isVisible: boolean;
  isExiting: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ApiUsageWarning: React.FC = () => {
  const [warnings, setWarnings] = useState<WarningState[]>([]);

  // Store selectors
  const shouldShowCostWarning = useMetricsStore((s) => s.shouldShowCostWarning);
  const shouldShowErrorWarning = useMetricsStore((s) => s.shouldShowErrorWarning);
  const dismissCostWarning = useMetricsStore((s) => s.dismissCostWarning);
  const dismissErrorWarning = useMetricsStore((s) => s.dismissErrorWarning);
  const getEstimatedCost = useMetricsStore((s) => s.getEstimatedCost);
  const getSuccessRate = useMetricsStore((s) => s.getSuccessRate);
  const costWarningThreshold = useMetricsStore((s) => s.costWarningThreshold);
  const errorRateWarningThreshold = useMetricsStore((s) => s.errorRateWarningThreshold);

  // Check for new warnings
  useEffect(() => {
    const showCost = shouldShowCostWarning();
    const showError = shouldShowErrorWarning();

    const newWarnings: WarningState[] = [];

    if (showCost && !warnings.find((w) => w.type === 'cost')) {
      newWarnings.push({ type: 'cost', isVisible: false, isExiting: false });
    }

    if (showError && !warnings.find((w) => w.type === 'error')) {
      newWarnings.push({ type: 'error', isVisible: false, isExiting: false });
    }

    if (newWarnings.length > 0) {
      setWarnings((prev) => [...prev, ...newWarnings]);
      // Trigger entrance animation
      setTimeout(() => {
        setWarnings((prev) =>
          prev.map((w) =>
            newWarnings.find((nw) => nw.type === w.type) ? { ...w, isVisible: true } : w
          )
        );
      }, 10);
    }
  }, [shouldShowCostWarning, shouldShowErrorWarning, warnings]);

  const handleDismiss = (type: WarningType) => {
    // Start exit animation
    setWarnings((prev) =>
      prev.map((w) => (w.type === type ? { ...w, isExiting: true } : w))
    );

    // Remove after animation and update store
    setTimeout(() => {
      setWarnings((prev) => prev.filter((w) => w.type !== type));
      if (type === 'cost') {
        dismissCostWarning();
      } else {
        dismissErrorWarning();
      }
    }, 300);
  };

  // Nothing to show
  if (warnings.length === 0) {
    return null;
  }

  const estimatedCost = getEstimatedCost();
  const successRate = getSuccessRate();
  const errorRate = 100 - successRate;

  return (
    <div
      className="fixed top-16 right-4 z-[9998] flex flex-col gap-3"
      aria-label="API Usage Warnings"
    >
      {warnings.map((warning) => {
        const isCostWarning = warning.type === 'cost';

        return (
          <div
            key={warning.type}
            role="alert"
            aria-live="polite"
            className={`
              ${isCostWarning ? 'bg-yellow-100 border-yellow-600' : 'bg-red-100 border-red-600'}
              border-4 border-black
              shadow-[4px_4px_0px_black]
              p-4 pr-10
              min-w-[300px] max-w-[400px]
              transform transition-all duration-300 ease-out
              ${warning.isVisible && !warning.isExiting
                ? 'translate-x-0 opacity-100'
                : 'translate-x-full opacity-0'
              }
            `}
            style={{ fontFamily: "'Comic Neue', sans-serif" }}
          >
            {/* Icon and Title */}
            <div className="flex items-start gap-3">
              <div
                className={`
                  ${isCostWarning ? 'text-yellow-600 border-yellow-600' : 'text-red-600 border-red-600'}
                  w-8 h-8
                  flex items-center justify-center
                  border-3 border-black
                  font-comic text-lg font-bold
                  bg-white
                  flex-shrink-0
                `}
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                {isCostWarning ? '$' : '!'}
              </div>

              <div className="flex-1">
                {/* Title */}
                <div
                  className="font-bold text-sm mb-1"
                  style={{ fontFamily: "'Bangers', cursive" }}
                >
                  {isCostWarning ? 'Cost Threshold Reached' : 'High Error Rate Detected'}
                </div>

                {/* Message */}
                <p className="text-black text-sm leading-tight">
                  {isCostWarning ? (
                    <>
                      Session cost has reached{' '}
                      <span className="font-bold">{formatCost(estimatedCost)}</span>, exceeding
                      your threshold of{' '}
                      <span className="font-bold">{formatCost(costWarningThreshold)}</span>.
                    </>
                  ) : (
                    <>
                      Error rate is at <span className="font-bold">{errorRate.toFixed(0)}%</span>,
                      exceeding your threshold of{' '}
                      <span className="font-bold">{errorRateWarningThreshold}%</span>.
                      Consider checking your API configuration.
                    </>
                  )}
                </p>

                {/* Action hint */}
                <p className="text-xs text-gray-600 mt-1 italic">
                  {isCostWarning
                    ? 'You can adjust the threshold in metrics settings.'
                    : 'Try reducing image complexity or checking API limits.'}
                </p>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(warning.type)}
              className={`
                absolute top-2 right-2
                w-6 h-6
                flex items-center justify-center
                bg-white border-2 border-black
                font-comic text-black text-sm font-bold
                hover:bg-gray-200
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
              style={{ fontFamily: "'Bangers', cursive" }}
              aria-label="Dismiss warning"
            >
              X
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// STANDALONE WARNING COMPONENTS
// ============================================================================

interface CostWarningBannerProps {
  currentCost: number;
  threshold: number;
  onDismiss: () => void;
  className?: string;
}

/**
 * Standalone cost warning banner (for inline use)
 */
export const CostWarningBanner: React.FC<CostWarningBannerProps> = ({
  currentCost,
  threshold,
  onDismiss,
  className = '',
}) => {
  if (currentCost < threshold) return null;

  return (
    <div
      className={`
        bg-yellow-100 border-2 border-yellow-500
        p-3 rounded flex items-center justify-between gap-3
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="text-yellow-600 font-bold text-lg">$</span>
        <span className="text-sm">
          Session cost ({formatCost(currentCost)}) has exceeded your threshold (
          {formatCost(threshold)}).
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="text-sm font-bold text-yellow-700 hover:text-yellow-900"
      >
        Dismiss
      </button>
    </div>
  );
};

interface ErrorRateWarningBannerProps {
  errorRate: number;
  threshold: number;
  onDismiss: () => void;
  className?: string;
}

/**
 * Standalone error rate warning banner (for inline use)
 */
export const ErrorRateWarningBanner: React.FC<ErrorRateWarningBannerProps> = ({
  errorRate,
  threshold,
  onDismiss,
  className = '',
}) => {
  if (errorRate < threshold) return null;

  return (
    <div
      className={`
        bg-red-100 border-2 border-red-500
        p-3 rounded flex items-center justify-between gap-3
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="text-red-600 font-bold text-lg">!</span>
        <span className="text-sm">
          High error rate detected ({errorRate.toFixed(0)}%). Consider checking your API
          configuration.
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="text-sm font-bold text-red-700 hover:text-red-900"
      >
        Dismiss
      </button>
    </div>
  );
};

export default ApiUsageWarning;
