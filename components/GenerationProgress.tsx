/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  GenerationProgress as GenerationProgressType,
  GenerationStage,
  GENERATION_STAGE_LABELS,
  GENERATION_STAGE_DESCRIPTIONS,
  calculateProgressPercentage,
  formatDuration,
  getProgressSummary,
} from '../types/progressTypes';

/**
 * Props for the GenerationProgress component.
 */
export interface GenerationProgressProps {
  /** Current generation progress state */
  progress: GenerationProgressType;
  /** Whether the component should be visible */
  show: boolean;
  /** Optional callback when user cancels generation */
  onCancel?: () => void;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Stage icon mapping for visual feedback.
 */
const STAGE_ICONS: Record<GenerationStage, string> = {
  idle: '',
  generating_outline: 'O',
  generating_profiles: 'P',
  generating_cover: 'C',
  generating_pages: '#',
  complete: '!',
  error: 'X',
};

/**
 * Stage color mapping for visual distinction.
 */
const STAGE_COLORS: Record<GenerationStage, { bg: string; border: string; text: string }> = {
  idle: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600' },
  generating_outline: { bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-700' },
  generating_profiles: { bg: 'bg-blue-100', border: 'border-blue-600', text: 'text-blue-700' },
  generating_cover: { bg: 'bg-yellow-100', border: 'border-yellow-600', text: 'text-yellow-700' },
  generating_pages: { bg: 'bg-green-100', border: 'border-green-600', text: 'text-green-700' },
  complete: { bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-700' },
  error: { bg: 'bg-red-100', border: 'border-red-600', text: 'text-red-700' },
};

/**
 * GenerationProgress component displays detailed status during comic generation.
 * Shows current stage, page progress, batch info, and animated progress indicators.
 *
 * @example
 * ```tsx
 * <GenerationProgress
 *   progress={generationProgress}
 *   show={isGenerating}
 *   onCancel={() => cancelGeneration()}
 * />
 * ```
 */
export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  show,
  onCancel,
  className = '',
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Handle entrance animation
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  // Update elapsed time every second
  useEffect(() => {
    if (progress.stage === 'idle' || progress.stage === 'complete' || progress.stage === 'error') {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - progress.startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.stage, progress.startTime]);

  if (!show) return null;

  const percentage = calculateProgressPercentage(progress);
  const colors = STAGE_COLORS[progress.stage];
  const stageIcon = STAGE_ICONS[progress.stage];
  const stageLabel = GENERATION_STAGE_LABELS[progress.stage];
  const stageDescription = GENERATION_STAGE_DESCRIPTIONS[progress.stage];

  // Get page status for current page
  const currentPageStatus = progress.pagesStatus[progress.currentPage];
  const isGeneratingBeat = currentPageStatus?.status === 'generating_beat';
  const isGeneratingImage = currentPageStatus?.status === 'generating_image';

  return (
    <div
      className={`
        fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm
        flex items-center justify-center p-4
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generation-progress-title"
      aria-describedby="generation-progress-description"
    >
      <div
        className={`
          max-w-[500px] w-full
          ${colors.bg} ${colors.border}
          border-[6px] border-black
          p-6
          shadow-[12px_12px_0px_rgba(0,0,0,0.6)]
          transform transition-all duration-300
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
      >
        {/* Header with animated icon */}
        <div className="flex items-center gap-4 mb-4">
          {/* Animated spinner/icon container */}
          <div
            className={`
              w-16 h-16 flex-shrink-0
              flex items-center justify-center
              border-4 border-black
              bg-white
              ${progress.stage === 'error' ? 'bg-red-200' : ''}
              ${progress.stage === 'complete' ? 'bg-emerald-200' : ''}
            `}
          >
            {progress.stage !== 'idle' && progress.stage !== 'complete' && progress.stage !== 'error' ? (
              <div className="relative w-10 h-10">
                {/* Spinning ring */}
                <div
                  className="absolute inset-0 border-4 border-black/20 rounded-full"
                />
                <div
                  className="absolute inset-0 border-4 border-t-black border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"
                />
                {/* Stage icon in center */}
                <span
                  className={`
                    absolute inset-0 flex items-center justify-center
                    font-bold text-lg ${colors.text}
                  `}
                  style={{ fontFamily: "'Bangers', cursive" }}
                >
                  {stageIcon}
                </span>
              </div>
            ) : (
              <span
                className={`
                  font-bold text-3xl ${colors.text}
                  ${progress.stage === 'complete' ? 'animate-bounce' : ''}
                `}
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                {stageIcon}
              </span>
            )}
          </div>

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <h2
              id="generation-progress-title"
              className={`
                font-bold text-2xl md:text-3xl uppercase tracking-tight
                ${colors.text}
              `}
              style={{ fontFamily: "'Bangers', cursive" }}
            >
              {stageLabel}
            </h2>
            <p
              id="generation-progress-description"
              className="text-gray-700 text-sm mt-1"
              style={{ fontFamily: "'Comic Neue', sans-serif" }}
            >
              {stageDescription}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-8 bg-white border-4 border-black relative overflow-hidden">
            {/* Progress fill */}
            <div
              className={`
                h-full transition-all duration-500 ease-out
                ${progress.stage === 'error' ? 'bg-red-500' : ''}
                ${progress.stage === 'complete' ? 'bg-emerald-500' : ''}
                ${progress.stage !== 'error' && progress.stage !== 'complete' ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' : ''}
              `}
              style={{ width: `${percentage}%` }}
            />
            {/* Animated stripes overlay for active states */}
            {progress.stage !== 'idle' && progress.stage !== 'complete' && progress.stage !== 'error' && (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px)',
                  animation: 'stripeMove 1s linear infinite',
                }}
              />
            )}
            {/* Percentage text */}
            <span
              className="absolute inset-0 flex items-center justify-center text-black font-bold text-lg mix-blend-difference"
              style={{ fontFamily: "'Bangers', cursive" }}
            >
              {percentage}%
            </span>
          </div>
        </div>

        {/* Page progress details */}
        {progress.stage === 'generating_pages' && progress.totalPages > 0 && (
          <div className="mb-4 space-y-2">
            {/* Page counter */}
            <div className="flex items-center justify-between">
              <span
                className="font-bold text-lg uppercase"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                Page Progress
              </span>
              <span
                className="font-bold text-xl bg-white px-3 py-1 border-2 border-black"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                {progress.currentPage} / {progress.totalPages}
              </span>
            </div>

            {/* Current page sub-status */}
            {currentPageStatus && (
              <div className="flex items-center gap-2">
                {isGeneratingBeat && (
                  <>
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span
                      className="text-purple-700 font-bold text-sm uppercase"
                      style={{ fontFamily: "'Comic Neue', sans-serif" }}
                    >
                      Writing narrative...
                    </span>
                  </>
                )}
                {isGeneratingImage && (
                  <>
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    <span
                      className="text-green-700 font-bold text-sm uppercase"
                      style={{ fontFamily: "'Comic Neue', sans-serif" }}
                    >
                      Generating artwork...
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Page progress dots */}
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {progress.pagesStatus.map((page, index) => (
                <div
                  key={index}
                  className={`
                    w-4 h-4 border-2 border-black
                    transition-all duration-300
                    ${page.status === 'complete' ? 'bg-emerald-500' : ''}
                    ${page.status === 'generating_beat' || page.status === 'generating_image' ? 'bg-yellow-400 animate-pulse' : ''}
                    ${page.status === 'pending' ? 'bg-gray-200' : ''}
                    ${page.status === 'error' ? 'bg-red-500' : ''}
                  `}
                  title={`Page ${index}: ${page.status}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Batch information */}
        {progress.currentBatch && (
          <div
            className="mb-4 bg-white/60 border-2 border-black p-3"
            style={{ fontFamily: "'Comic Neue', sans-serif" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm uppercase text-gray-700">
                Batch {progress.currentBatch.batchIndex + 1} of {progress.currentBatch.totalBatches}
              </span>
              <span className="text-sm text-gray-600">
                Pages: {progress.currentBatch.pagesInBatch.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Time information */}
        <div
          className="flex items-center justify-between text-sm text-gray-600 mb-4"
          style={{ fontFamily: "'Comic Neue', sans-serif" }}
        >
          <span>
            Elapsed: <strong>{formatDuration(elapsedTime)}</strong>
          </span>
          {progress.estimatedTimeRemaining !== undefined && progress.estimatedTimeRemaining > 0 && (
            <span>
              Remaining: <strong>~{formatDuration(progress.estimatedTimeRemaining)}</strong>
            </span>
          )}
        </div>

        {/* Error message */}
        {progress.stage === 'error' && progress.errorMessage && (
          <div className="mb-4 bg-red-200 border-2 border-red-600 p-3">
            <p
              className="text-red-800 font-bold text-sm"
              style={{ fontFamily: "'Comic Neue', sans-serif" }}
            >
              {progress.errorMessage}
            </p>
          </div>
        )}

        {/* Cancel button (only during active generation) */}
        {onCancel && progress.stage !== 'idle' && progress.stage !== 'complete' && progress.stage !== 'error' && (
          <button
            onClick={onCancel}
            className="
              w-full py-3
              bg-gray-600 text-white
              border-4 border-black
              font-bold text-lg uppercase
              hover:bg-gray-500
              transition-colors
              shadow-[4px_4px_0px_black]
              active:shadow-[2px_2px_0px_black]
              active:translate-x-[2px]
              active:translate-y-[2px]
            "
            style={{ fontFamily: "'Bangers', cursive" }}
          >
            Cancel Generation
          </button>
        )}

        {/* Summary text for screen readers */}
        <div className="sr-only" aria-live="polite">
          {getProgressSummary(progress)}
        </div>
      </div>

      {/* CSS animation for stripe movement */}
      <style>{`
        @keyframes stripeMove {
          from { background-position: 0 0; }
          to { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
};

export default GenerationProgress;
