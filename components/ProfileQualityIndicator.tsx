/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ProfileQualityIndicator - Visual indicator for character profile quality.
 * Warns users about incomplete profiles that may cause character drift.
 */

import React, { useState, useRef, useEffect, useId } from 'react';
import { CharacterProfile } from '../types';
import { validateProfileCompleteness, ProfileQuality } from '../utils/profileValidation';

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileQualityIndicatorProps {
  /** The character profile to evaluate */
  profile: CharacterProfile;
  /** If true, show the list of warnings below the indicator */
  showDetails?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the color classes based on the quality score
 */
function getQualityColorClasses(score: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (score >= 80) {
    return {
      bg: 'bg-green-500',
      text: 'text-green-700',
      border: 'border-green-600',
      label: 'Good',
    };
  }
  if (score >= 50) {
    return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-700',
      border: 'border-yellow-600',
      label: 'Warnings',
    };
  }
  return {
    bg: 'bg-red-500',
    text: 'text-red-700',
    border: 'border-red-600',
    label: 'Low Quality',
  };
}

/**
 * Get an icon for the quality level
 */
function getQualityIcon(score: number): string {
  if (score >= 80) return '\u2713'; // Checkmark
  if (score >= 50) return '!';
  return '\u2717'; // X mark
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ProfileQualityIndicator component - Displays a visual indicator of profile completeness.
 *
 * - Green (80-100%): Good profile, minimal risk of character drift
 * - Yellow (50-79%): Warnings present, some fields missing
 * - Red (<50%): Low quality, likely to cause character drift
 *
 * Includes tooltip on hover showing the quality assessment and warnings.
 */
export const ProfileQualityIndicator: React.FC<ProfileQualityIndicatorProps> = ({
  profile,
  showDetails = false,
  className = '',
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Validate the profile
  const quality: ProfileQuality = validateProfileCompleteness(profile);
  const colors = getQualityColorClasses(quality.score);
  const icon = getQualityIcon(quality.score);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isTooltipVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsTooltipVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTooltipVisible]);

  // Close on Escape key
  useEffect(() => {
    if (!isTooltipVisible) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTooltipVisible(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isTooltipVisible]);

  return (
    <div ref={containerRef} className={`inline-flex flex-col ${className}`}>
      {/* Quality Badge with Tooltip */}
      <div className="relative inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsTooltipVisible(!isTooltipVisible)}
          onMouseEnter={() => setIsTooltipVisible(true)}
          onMouseLeave={() => setIsTooltipVisible(false)}
          onFocus={() => setIsTooltipVisible(true)}
          onBlur={() => setIsTooltipVisible(false)}
          aria-describedby={isTooltipVisible ? tooltipId : undefined}
          aria-label={`Profile quality: ${quality.score}% - ${colors.label}`}
          className={`
            inline-flex items-center gap-1
            px-2 py-0.5
            rounded-full
            border-2 border-black
            font-comic text-xs font-bold
            text-white
            ${colors.bg}
            hover:scale-105
            transition-transform
            cursor-help
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
          `}
        >
          <span className="text-[10px]">{icon}</span>
          <span>{quality.score}%</span>
        </button>

        {/* Tooltip */}
        {isTooltipVisible && (
          <div
            id={tooltipId}
            role="tooltip"
            className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              w-64 p-3
              bg-white text-black text-xs font-comic
              border-2 border-black
              drop-shadow-[3px_3px_0px_rgba(0,0,0,0.3)]
              z-[500]
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300">
              <span className="font-bold text-sm">Profile Quality</span>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-[10px] font-bold text-white
                  ${colors.bg}
                `}
              >
                {colors.label}
              </span>
            </div>

            {/* Score */}
            <div className="mb-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span>Completeness:</span>
                <span className={`font-bold ${colors.text}`}>{quality.score}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full border border-gray-300 overflow-hidden">
                <div
                  className={`h-full ${colors.bg} transition-all duration-300`}
                  style={{ width: `${quality.score}%` }}
                />
              </div>
            </div>

            {/* Warnings */}
            {quality.warnings.length > 0 && (
              <div className="mt-2">
                <p className="font-bold text-[10px] uppercase text-gray-600 mb-1">
                  Warnings ({quality.warnings.length})
                </p>
                <ul className="space-y-1">
                  {quality.warnings.slice(0, 4).map((warning, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-1 text-[11px] text-gray-700"
                    >
                      <span className="text-yellow-600 flex-shrink-0">!</span>
                      <span style={{ textTransform: 'none' }}>{warning}</span>
                    </li>
                  ))}
                  {quality.warnings.length > 4 && (
                    <li className="text-[10px] text-gray-500 italic pl-3">
                      +{quality.warnings.length - 4} more warnings...
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Good status message */}
            {quality.warnings.length === 0 && (
              <p className="text-[11px] text-green-700 mt-1">
                Profile is complete and well-defined. Low risk of character drift.
              </p>
            )}

            {/* Arrow */}
            <div
              className="
                absolute top-full left-1/2 -translate-x-1/2
                border-[6px] border-transparent border-t-black
              "
            />
          </div>
        )}
      </div>

      {/* Inline Details (when showDetails is true) */}
      {showDetails && quality.warnings.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <p className={`font-bold text-[11px] mb-1 ${colors.text}`}>
            {colors.label} - {quality.warnings.length} issue{quality.warnings.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-1">
            {quality.warnings.map((warning, index) => (
              <li
                key={index}
                className="flex items-start gap-1.5 text-gray-700"
                style={{ textTransform: 'none' }}
              >
                <span className={`${colors.text} flex-shrink-0`}>-</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileQualityIndicator;
