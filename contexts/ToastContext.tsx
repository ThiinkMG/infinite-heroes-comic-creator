/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType, ToastContainer } from '../components/ToastNotification';

// ============================================================================
// Types
// ============================================================================

export interface ShowToastOptions {
  type: ToastType;
  message: string;
  /** Duration in milliseconds. Default: 5000. Use 0 for no auto-dismiss. */
  duration?: number;
}

interface ToastContextValue {
  /** Show a toast notification */
  showToast: (options: ShowToastOptions) => string;
  /** Hide a specific toast by ID */
  hideToast: (id: string) => void;
  /** Hide all toasts */
  hideAllToasts: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
  /** Default duration for toasts in milliseconds. Default: 5000 */
  defaultDuration?: number;
  /** Maximum number of toasts to display at once. Default: 3 */
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  defaultDuration = 5000,
  maxToasts = 3
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate unique ID for each toast
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const showToast = useCallback((options: ShowToastOptions): string => {
    const id = generateId();
    const newToast: Toast = {
      id,
      type: options.type,
      message: options.message,
      duration: options.duration ?? defaultDuration
    };

    setToasts((prev) => {
      // If we exceed maxToasts, remove oldest ones
      const updated = [...prev, newToast];
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    return id;
  }, [generateId, defaultDuration, maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextValue = {
    showToast,
    hideToast,
    hideAllToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access toast notification functionality.
 *
 * @example
 * ```typescript
 * const { showToast, hideToast } = useToast();
 *
 * // Show a success toast (auto-dismisses after 5 seconds by default)
 * showToast({ type: 'success', message: 'Comic saved!' });
 *
 * // Show an error toast with custom duration
 * showToast({ type: 'error', message: 'Generation failed', duration: 8000 });
 *
 * // Show a warning toast that doesn't auto-dismiss
 * const id = showToast({ type: 'warning', message: 'Unsaved changes', duration: 0 });
 *
 * // Manually dismiss a toast
 * hideToast(id);
 * ```
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ============================================================================
// Convenience functions for direct imports
// ============================================================================

export type { ToastType } from '../components/ToastNotification';
