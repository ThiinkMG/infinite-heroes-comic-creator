/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Subtle auto-save status indicator component.
 * Shows saving state, last save time, and any errors.
 */

import React, { useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type IndicatorPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface AutoSaveIndicatorProps {
  /** Whether a save is currently in progress */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Timestamp of the last successful save */
  lastSaveTime: Date | null;
  /** Error from the last save attempt */
  lastError: Error | null;
  /** Position of the indicator */
  position?: IndicatorPosition;
  /** Whether to show the indicator (useful for conditional display) */
  show?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format relative time (e.g., "Just now", "2 min ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) {
    return 'Just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get position classes based on position prop
 */
function getPositionClasses(position: IndicatorPosition): string {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'top-right':
      return 'top-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-right':
    default:
      return 'bottom-4 right-4';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Subtle auto-save indicator that shows save status.
 *
 * States:
 * - Saving: Shows spinning indicator
 * - Dirty: Shows subtle "unsaved" indicator
 * - Saved: Shows checkmark with relative time
 * - Error: Shows error icon with message
 */
export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  isDirty,
  lastSaveTime,
  lastError,
  position,
  show = true,
  className = '',
}) => {
  // Resolve position with default
  const resolvedPosition: IndicatorPosition = position ?? 'bottom-right';

  // Memoize relative time string (updates on each render, but that's fine for UI)
  const lastSaveTimeStr = useMemo(() => {
    return lastSaveTime ? formatRelativeTime(lastSaveTime) : null;
  }, [lastSaveTime]);

  // Don't render if show is false
  if (!show) {
    return null;
  }

  // Don't render if there's nothing to show
  if (!isSaving && !isDirty && !lastSaveTime && !lastError) {
    return null;
  }

  const positionClasses = getPositionClasses(resolvedPosition);

  // Error state
  if (lastError) {
    return (
      <div
        className={`fixed ${positionClasses} z-[100] flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-300 rounded-lg shadow-sm text-sm text-red-700 transition-opacity duration-300 ${className}`}
        role="status"
        aria-live="polite"
      >
        <svg
          className="w-4 h-4 text-red-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-medium">Save failed</span>
      </div>
    );
  }

  // Saving state
  if (isSaving) {
    return (
      <div
        className={`fixed ${positionClasses} z-[100] flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm text-sm text-blue-700 transition-opacity duration-300 ${className}`}
        role="status"
        aria-live="polite"
      >
        <svg
          className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="font-medium">Saving...</span>
      </div>
    );
  }

  // Dirty state (unsaved changes)
  if (isDirty && !isSaving) {
    return (
      <div
        className={`fixed ${positionClasses} z-[100] flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm text-sm text-yellow-700 transition-opacity duration-300 ${className}`}
        role="status"
        aria-live="polite"
      >
        <svg
          className="w-4 h-4 text-yellow-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
        <span className="font-medium">Unsaved changes</span>
      </div>
    );
  }

  // Saved state (show last save time)
  if (lastSaveTime && !isDirty && !isSaving) {
    return (
      <div
        className={`fixed ${positionClasses} z-[100] flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg shadow-sm text-sm text-green-700 transition-opacity duration-300 opacity-75 hover:opacity-100 ${className}`}
        role="status"
        aria-live="polite"
      >
        <svg
          className="w-4 h-4 text-green-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="font-medium">Saved {lastSaveTimeStr}</span>
      </div>
    );
  }

  return null;
};

export default AutoSaveIndicator;
