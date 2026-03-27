/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastNotificationProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: {
    bg: 'bg-green-100',
    border: 'border-green-600',
    icon: '\u2713', // Checkmark
    iconColor: 'text-green-600'
  },
  error: {
    bg: 'bg-red-100',
    border: 'border-red-600',
    icon: '\u2717', // X mark
    iconColor: 'text-red-600'
  },
  warning: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-600',
    icon: '!',
    iconColor: 'text-yellow-600'
  },
  info: {
    bg: 'bg-blue-100',
    border: 'border-blue-600',
    icon: 'i',
    iconColor: 'text-blue-600'
  }
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const styles = TOAST_STYLES[toast.type];

  // Handle entrance animation
  useEffect(() => {
    // Trigger entrance animation after mount
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(enterTimer);
  }, []);

  // Handle auto-dismiss
  useEffect(() => {
    if (toast.duration > 0) {
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
      return () => clearTimeout(dismissTimer);
    }
  }, [toast.duration, toast.id]);

  const handleDismiss = () => {
    setIsExiting(true);
    // Wait for exit animation before removing
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        ${styles.bg} ${styles.border}
        border-4 border-black
        shadow-[4px_4px_0px_black]
        p-4 pr-10
        min-w-[280px] max-w-[400px]
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
        }
      `}
      style={{ fontFamily: "'Comic Neue', sans-serif" }}
    >
      {/* Icon */}
      <div className="flex items-start gap-3">
        <div
          className={`
            ${styles.iconColor} ${styles.border}
            w-8 h-8
            flex items-center justify-center
            border-3 border-black
            font-comic text-lg font-bold
            bg-white
            flex-shrink-0
          `}
          style={{ fontFamily: "'Bangers', cursive" }}
        >
          {styles.icon}
        </div>

        {/* Message */}
        <p className="text-black font-bold text-sm leading-tight flex-1 pt-1">
          {toast.message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
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
        aria-label="Dismiss notification"
      >
        X
      </button>

      {/* Progress bar for auto-dismiss */}
      {toast.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-black opacity-30"
          style={{
            animation: `shrink ${toast.duration}ms linear forwards`
          }}
        />
      )}

      {/* CSS animation for progress bar */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  // Only show max 3 toasts at a time
  const visibleToasts = toasts.slice(-3);

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3"
      aria-label="Notifications"
    >
      {visibleToasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default ToastNotification;
