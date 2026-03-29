/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShotType, BalloonShape } from '../../types';

// Shot type options with icons
const SHOT_OPTIONS: { shot: ShotType; icon: string; label: string }[] = [
    { shot: 'extreme-close-up', icon: '👁️', label: 'XCU' },
    { shot: 'close-up', icon: '😊', label: 'Close-up' },
    { shot: 'medium', icon: '🧍', label: 'Medium' },
    { shot: 'full', icon: '🧑', label: 'Full' },
    { shot: 'wide', icon: '🏙️', label: 'Wide' },
    { shot: 'extreme-wide', icon: '🌆', label: 'Establishing' },
];

// Balloon shape options
const BALLOON_OPTIONS: { shape: BalloonShape; label: string; desc: string }[] = [
    { shape: 'oval', label: 'Normal', desc: 'Standard speech' },
    { shape: 'burst', label: 'Shouting!', desc: 'Loud, excited' },
    { shape: 'wavy', label: 'Weak...', desc: 'Distressed, injured' },
    { shape: 'dashed', label: 'Whisper', desc: 'Quiet, secretive' },
    { shape: 'jagged', label: 'Radio/Phone', desc: 'Electronic' },
    { shape: 'rectangle', label: 'Robot/AI', desc: 'Mechanical voice' },
];

interface ComicFundamentalsOverridesProps {
    shotTypeOverride: ShotType | undefined;
    balloonShapeOverride: BalloonShape | undefined;
    applyFlashbackStyle: boolean;
    onShotTypeChange: (shot: ShotType | undefined) => void;
    onBalloonShapeChange: (shape: BalloonShape | undefined) => void;
    onFlashbackStyleChange: (apply: boolean) => void;
}

export const ComicFundamentalsOverrides: React.FC<ComicFundamentalsOverridesProps> = ({
    shotTypeOverride,
    balloonShapeOverride,
    applyFlashbackStyle,
    onShotTypeChange,
    onBalloonShapeChange,
    onFlashbackStyleChange
}) => {
    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Camera Shot */}
            <div className="border-[3px] border-black bg-cyan-50 p-3 sm:p-4">
                <p className="font-comic text-sm font-bold uppercase text-cyan-900 mb-2">
                    📷 Camera Shot
                    <span className="font-normal text-[10px] text-cyan-600 ml-2 hidden sm:inline">(click again to deselect)</span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {SHOT_OPTIONS.map(opt => (
                        <button
                            key={opt.shot}
                            onClick={() => onShotTypeChange(shotTypeOverride === opt.shot ? undefined : opt.shot)}
                            className={`flex flex-col items-center p-2 sm:p-2 border-2 transition-colors touch-manipulation min-h-[56px] sm:min-h-0 ${
                                shotTypeOverride === opt.shot
                                    ? 'border-cyan-500 bg-cyan-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                    : 'border-gray-300 bg-white hover:border-cyan-300 active:bg-cyan-50'
                            }`}
                            title={`${opt.shot} — click again to deselect`}
                        >
                            <span className="text-xl sm:text-lg">{opt.icon}</span>
                            <span className="font-comic text-xs font-bold">{opt.label}</span>
                        </button>
                    ))}
                </div>
                {shotTypeOverride === undefined && (
                    <p className="text-[10px] text-cyan-600 font-comic mt-2 italic">Auto</p>
                )}
            </div>

            {/* Dialogue Style */}
            <div className="border-[3px] border-black bg-pink-50 p-3 sm:p-4">
                <p className="font-comic text-sm font-bold uppercase text-pink-900 mb-2">
                    💬 Dialogue Style
                    <span className="font-normal text-[10px] text-pink-600 ml-2 hidden sm:inline">(click again to deselect)</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BALLOON_OPTIONS.map(opt => (
                        <button
                            key={opt.shape}
                            onClick={() => onBalloonShapeChange(balloonShapeOverride === opt.shape ? undefined : opt.shape)}
                            className={`flex flex-col p-2 sm:p-2 border-2 transition-colors touch-manipulation min-h-[56px] sm:min-h-0 ${
                                balloonShapeOverride === opt.shape
                                    ? 'border-pink-500 bg-pink-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                    : 'border-gray-300 bg-white hover:border-pink-300 active:bg-pink-50'
                            }`}
                            title={`${opt.desc} — click again to deselect`}
                        >
                            <span className="font-comic text-sm font-bold">{opt.label}</span>
                            <span className="font-comic text-xs text-gray-500">{opt.desc}</span>
                        </button>
                    ))}
                </div>
                {balloonShapeOverride === undefined && (
                    <p className="text-[10px] text-pink-600 font-comic mt-2 italic">Auto</p>
                )}
            </div>

            {/* Flashback Style */}
            <div className="border-[3px] border-black bg-amber-50 p-3 sm:p-4">
                <label className="flex items-center gap-3 cursor-pointer touch-manipulation min-h-[48px]">
                    <input
                        type="checkbox"
                        checked={applyFlashbackStyle}
                        onChange={(e) => onFlashbackStyleChange(e.target.checked)}
                        className="w-5 h-5 accent-amber-600 cursor-pointer flex-shrink-0"
                        aria-label="Apply flashback styling"
                    />
                    <div>
                        <p className="font-comic text-sm font-bold uppercase text-amber-900">
                            📜 Flashback Styling
                        </p>
                        <p className="font-comic text-xs text-amber-700">
                            Sepia tones, soft vignette, desaturated colors
                        </p>
                    </div>
                </label>
            </div>
        </div>
    );
};
