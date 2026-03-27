/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { TutorialStep } from '../hooks/useTutorial';

export interface TutorialOverlayProps {
  /** Current tutorial step */
  step: TutorialStep;
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Progress percentage */
  progress: number;
  /** Whether this is the first step */
  isFirstStep: boolean;
  /** Whether this is the last step */
  isLastStep: boolean;
  /** Go to next step */
  onNext: () => void;
  /** Go to previous step */
  onPrev: () => void;
  /** Skip/end tutorial */
  onSkip: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Tutorial overlay component with spotlight effect and tooltip
 */
export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  stepIndex,
  totalSteps,
  progress,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Find and track target element
  useEffect(() => {
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      const element = document.querySelector(step.targetSelector!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updateTargetRect();

    // Update on resize/scroll
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [step.targetSelector]);

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    const position = step.position || 'bottom';
    const padding = 16;
    const tooltipWidth = 320;

    if (!targetRect || position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: tooltipWidth,
      };
    }

    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      maxWidth: tooltipWidth,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: window.innerHeight - targetRect.top + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height / 2,
          right: window.innerWidth - targetRect.left + padding,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left + targetRect.width + padding,
          transform: 'translateY(-50%)',
        };
      default:
        return baseStyle;
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        if (!isFirstStep) onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onSkip, isFirstStep]);

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      {/* Backdrop with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Highlight border around target */}
      {targetRect && (
        <div
          className="absolute border-4 border-yellow-400 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="bg-indigo-900 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] rounded-lg p-6 z-10"
        style={getTooltipStyle()}
      >
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-indigo-300 mb-1 font-comic">
            <span>Step {stepIndex + 1} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-indigo-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <h3
          id="tutorial-title"
          className="font-comic text-xl font-bold text-white mb-2"
        >
          {step.title}
        </h3>
        <p className="text-indigo-200 mb-4 leading-relaxed">
          {step.description}
        </p>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={onSkip}
            className="text-indigo-400 hover:text-white text-sm font-comic underline"
            aria-label="Skip tutorial"
          >
            Skip Tutorial
          </button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                onClick={onPrev}
                className="comic-btn bg-gray-600 text-white px-4 py-2 border-2 border-black font-bold text-sm hover:bg-gray-500"
                aria-label="Previous step"
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="comic-btn bg-yellow-400 text-black px-4 py-2 border-2 border-black font-bold text-sm hover:bg-yellow-300"
              aria-label={isLastStep ? 'Finish tutorial' : 'Next step'}
            >
              {isLastStep ? 'Finish!' : 'Next'}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-indigo-400 text-xs mt-3 text-center font-comic">
          Use arrow keys or Enter to navigate
        </p>
      </div>
    </div>
  );
};

export default TutorialOverlay;
