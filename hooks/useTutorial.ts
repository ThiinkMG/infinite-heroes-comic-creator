/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * A single step in the tutorial
 */
export interface TutorialStep {
  /** Unique identifier for this step */
  id: string;
  /** Title shown in the tutorial popup */
  title: string;
  /** Description/instructions for this step */
  description: string;
  /** CSS selector for the element to highlight (optional) */
  targetSelector?: string;
  /** Position of the tooltip relative to target */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Action required before advancing (optional) */
  requiredAction?: string;
  /** Whether to show a "Skip" button */
  canSkip?: boolean;
  /** Custom action when step is reached */
  onEnter?: () => void;
  /** Custom action when leaving step */
  onExit?: () => void;
}

/**
 * Tutorial state and controls
 */
export interface TutorialState {
  /** Whether tutorial is currently active */
  isActive: boolean;
  /** Current step index */
  currentStepIndex: number;
  /** Current step data */
  currentStep: TutorialStep | null;
  /** Total number of steps */
  totalSteps: number;
  /** Whether this is the first step */
  isFirstStep: boolean;
  /** Whether this is the last step */
  isLastStep: boolean;
  /** Progress percentage (0-100) */
  progress: number;
}

export interface TutorialControls {
  /** Start the tutorial from the beginning */
  startTutorial: () => void;
  /** End the tutorial */
  endTutorial: () => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Jump to specific step */
  goToStep: (index: number) => void;
  /** Skip to end */
  skipTutorial: () => void;
}

const TUTORIAL_COMPLETED_KEY = 'infinite-heroes-tutorial-completed';
const TUTORIAL_STEP_KEY = 'infinite-heroes-tutorial-step';

/**
 * Hook for managing tutorial state and navigation
 */
export function useTutorial(steps: TutorialStep[]): TutorialState & TutorialControls {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Check if tutorial was previously completed
  const hasCompletedTutorial = useCallback(() => {
    try {
      return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  // Mark tutorial as completed
  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save current step for resume
  const saveStep = useCallback((step: number) => {
    try {
      localStorage.setItem(TUTORIAL_STEP_KEY, String(step));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Get saved step
  const getSavedStep = useCallback(() => {
    try {
      const saved = localStorage.getItem(TUTORIAL_STEP_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  }, []);

  const currentStep = isActive && steps[currentStepIndex] ? steps[currentStepIndex] : null;
  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progress = totalSteps > 0 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0;

  // Call onEnter when step changes
  useEffect(() => {
    if (isActive && currentStep?.onEnter) {
      currentStep.onEnter();
    }
  }, [isActive, currentStepIndex, currentStep]);

  const startTutorial = useCallback(() => {
    const savedStep = getSavedStep();
    setCurrentStepIndex(savedStep < totalSteps ? savedStep : 0);
    setIsActive(true);
  }, [getSavedStep, totalSteps]);

  const endTutorial = useCallback(() => {
    if (currentStep?.onExit) {
      currentStep.onExit();
    }
    setIsActive(false);
    markCompleted();
    saveStep(0);
  }, [currentStep, markCompleted, saveStep]);

  const nextStep = useCallback(() => {
    if (currentStep?.onExit) {
      currentStep.onExit();
    }
    if (currentStepIndex < totalSteps - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      saveStep(newIndex);
    } else {
      endTutorial();
    }
  }, [currentStep, currentStepIndex, totalSteps, saveStep, endTutorial]);

  const prevStep = useCallback(() => {
    if (currentStep?.onExit) {
      currentStep.onExit();
    }
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      saveStep(newIndex);
    }
  }, [currentStep, currentStepIndex, saveStep]);

  const goToStep = useCallback((index: number) => {
    if (currentStep?.onExit) {
      currentStep.onExit();
    }
    if (index >= 0 && index < totalSteps) {
      setCurrentStepIndex(index);
      saveStep(index);
    }
  }, [currentStep, totalSteps, saveStep]);

  const skipTutorial = useCallback(() => {
    endTutorial();
  }, [endTutorial]);

  return {
    // State
    isActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    progress,
    // Controls
    startTutorial,
    endTutorial,
    nextStep,
    prevStep,
    goToStep,
    skipTutorial,
  };
}

/**
 * Check if user should see the tutorial (first visit)
 */
export function shouldShowTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_COMPLETED_KEY) !== 'true';
  } catch {
    return true;
  }
}

/**
 * Reset tutorial completion status
 */
export function resetTutorial(): void {
  try {
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    localStorage.removeItem(TUTORIAL_STEP_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export default useTutorial;
