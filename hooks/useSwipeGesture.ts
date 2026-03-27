/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Swipe Gesture Hook
 *
 * Custom hook for detecting horizontal swipe gestures on touch devices.
 * Used for mobile navigation in the comic book reader.
 *
 * Key features:
 * - Configurable swipe threshold (default 50px)
 * - Velocity-based detection for quick swipes
 * - Horizontal-only detection (ignores vertical scrolling)
 * - Returns touch event handlers for easy integration
 * - Optional visual feedback during swipe
 */

import React, { useRef, useCallback, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Touch point data captured at start of swipe
 */
interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Options for the useSwipeGesture hook
 */
export interface SwipeGestureOptions {
  /** Callback when user swipes left (e.g., go to next page) */
  onSwipeLeft?: () => void;

  /** Callback when user swipes right (e.g., go to previous page) */
  onSwipeRight?: () => void;

  /** Minimum distance in pixels to trigger swipe (default: 50) */
  threshold?: number;

  /** Minimum velocity in px/ms to trigger swipe with shorter distance (default: 0.3) */
  velocityThreshold?: number;

  /** Whether swipe detection is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Return value from useSwipeGesture
 */
export interface UseSwipeGestureReturn {
  /** Touch event handlers to spread on the target element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
  };

  /** Current swipe offset in pixels (positive = swiping right, negative = swiping left) */
  swipeOffset: number;

  /** Whether a swipe is currently in progress */
  isSwiping: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default minimum swipe distance to trigger action */
const DEFAULT_THRESHOLD = 50;

/** Default minimum velocity to trigger action (pixels per millisecond) */
const DEFAULT_VELOCITY_THRESHOLD = 0.3;

/** Maximum vertical movement allowed before swipe is cancelled */
const MAX_VERTICAL_MOVEMENT = 50;

/** Minimum horizontal movement ratio vs vertical to be considered horizontal swipe */
const HORIZONTAL_RATIO = 1.5;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for detecting horizontal swipe gestures
 *
 * @example
 * ```tsx
 * const { handlers, swipeOffset, isSwiping } = useSwipeGesture({
 *   onSwipeLeft: () => goToNextPage(),
 *   onSwipeRight: () => goToPreviousPage(),
 *   threshold: 50,
 * });
 *
 * return (
 *   <div
 *     {...handlers}
 *     style={{
 *       transform: isSwiping ? `translateX(${swipeOffset * 0.3}px)` : undefined,
 *     }}
 *   >
 *     Content
 *   </div>
 * );
 * ```
 */
export function useSwipeGesture(options: SwipeGestureOptions): UseSwipeGestureReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = DEFAULT_THRESHOLD,
    velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
    enabled = true,
  } = options;

  // Track the starting touch point
  const touchStartRef = useRef<TouchPoint | null>(null);

  // Track whether this is a valid horizontal swipe (not cancelled by vertical movement)
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  // State for visual feedback
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  /**
   * Handle touch start - capture initial position and timestamp
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
    isHorizontalSwipeRef.current = null; // Reset direction detection
    setIsSwiping(true);
    setSwipeOffset(0);
  }, [enabled]);

  /**
   * Handle touch move - track swipe direction and provide visual feedback
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStartRef.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // First significant movement - determine if this is a horizontal swipe
    if (isHorizontalSwipeRef.current === null && (absDeltaX > 10 || absDeltaY > 10)) {
      // It's horizontal if X movement is significantly greater than Y
      isHorizontalSwipeRef.current = absDeltaX > absDeltaY * HORIZONTAL_RATIO;
    }

    // If we've determined this is a vertical scroll, don't interfere
    if (isHorizontalSwipeRef.current === false) {
      setSwipeOffset(0);
      return;
    }

    // Check if vertical movement is too much (user is scrolling, not swiping)
    if (absDeltaY > MAX_VERTICAL_MOVEMENT) {
      isHorizontalSwipeRef.current = false;
      setSwipeOffset(0);
      return;
    }

    // If this is a horizontal swipe, update offset for visual feedback
    if (isHorizontalSwipeRef.current) {
      setSwipeOffset(deltaX);
    }
  }, [enabled]);

  /**
   * Handle touch end - check if swipe threshold met and trigger callback
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStartRef.current) {
      resetState();
      return;
    }

    // Get the final touch position from changedTouches (touch has ended)
    const touch = e.changedTouches[0];
    if (!touch) {
      resetState();
      return;
    }

    const startPoint = touchStartRef.current;
    const deltaX = touch.clientX - startPoint.x;
    const deltaY = touch.clientY - startPoint.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const elapsed = Date.now() - startPoint.timestamp;

    // Calculate velocity (pixels per millisecond)
    const velocity = elapsed > 0 ? absDeltaX / elapsed : 0;

    // Only process horizontal swipes
    if (isHorizontalSwipeRef.current !== false && absDeltaY <= MAX_VERTICAL_MOVEMENT) {
      // Check if swipe meets threshold (distance OR velocity)
      const meetsDistanceThreshold = absDeltaX >= threshold;
      const meetsVelocityThreshold = velocity >= velocityThreshold && absDeltaX >= threshold / 2;

      if (meetsDistanceThreshold || meetsVelocityThreshold) {
        if (deltaX < 0) {
          // Swiped left - typically "next page"
          onSwipeLeft?.();
        } else {
          // Swiped right - typically "previous page"
          onSwipeRight?.();
        }
      }
    }

    resetState();
  }, [enabled, threshold, velocityThreshold, onSwipeLeft, onSwipeRight]);

  /**
   * Handle touch cancel - reset state without triggering swipe
   */
  const handleTouchCancel = useCallback(() => {
    resetState();
  }, []);

  /**
   * Reset all swipe tracking state
   */
  function resetState() {
    touchStartRef.current = null;
    isHorizontalSwipeRef.current = null;
    setSwipeOffset(0);
    setIsSwiping(false);
  }

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    swipeOffset,
    isSwiping,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useSwipeGesture;
