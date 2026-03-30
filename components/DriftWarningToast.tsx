/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Feature G: Drift Warning Toast
 * Non-blocking notification surfaced in the Book view when visual drift is detected
 * between consecutive page outputs.
 */

import React from 'react';
import { useComicStore } from '../stores/useComicStore';
import { Z_INDEX } from '../types';

interface DriftWarningToastProps {
  /** Called when user clicks "Reroll" on a specific warning */
  onReroll?: (pageIndex: number) => void;
}

export const DriftWarningToast: React.FC<DriftWarningToastProps> = ({ onReroll }) => {
  const visualDriftWarnings = useComicStore((state) => state.visualDriftWarnings);
  const dismissDriftWarning = useComicStore((state) => state.dismissDriftWarning);

  // Only show active (not dismissed) warnings
  const activeWarnings = visualDriftWarnings.filter(w => !w.dismissedAt);

  if (activeWarnings.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 flex flex-col gap-2 max-w-xs w-full"
      style={{ zIndex: Z_INDEX.ALERT }}
    >
      {activeWarnings.map(warning => (
        <div
          key={`${warning.pageIndex}-${warning.characterId}`}
          className={`border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-3 flex flex-col gap-2 ${
            warning.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-50'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <span className="text-xl shrink-0" aria-hidden="true">
              {warning.severity === 'high' ? '⚠️' : 'ℹ️'}
            </span>
            <div className="flex-1">
              <p className="font-comic text-xs font-bold text-gray-900 uppercase">
                Possible visual drift — Page {warning.pageIndex}
              </p>
              <p className="font-comic text-[10px] text-gray-600 mt-0.5">
                <strong>{warning.characterName}</strong>&apos;s appearance{' '}
                {warning.severity === 'high' ? 'may have shifted significantly' : 'has a minor color shift'}{' '}
                compared to the previous page.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            {onReroll && (
              <button
                onClick={() => {
                  dismissDriftWarning(warning.pageIndex, warning.characterId);
                  onReroll(warning.pageIndex);
                }}
                className="comic-btn bg-orange-500 text-white text-[10px] font-bold px-3 py-1 border-2 border-black hover:bg-orange-400 font-comic touch-manipulation"
                aria-label={`Reroll page ${warning.pageIndex} due to drift`}
              >
                🎲 Reroll
              </button>
            )}
            <button
              onClick={() => dismissDriftWarning(warning.pageIndex, warning.characterId)}
              className="comic-btn bg-gray-300 text-gray-800 text-[10px] font-bold px-3 py-1 border-2 border-black hover:bg-gray-200 font-comic touch-manipulation"
              aria-label={`Dismiss drift warning for page ${warning.pageIndex}`}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DriftWarningToast;
