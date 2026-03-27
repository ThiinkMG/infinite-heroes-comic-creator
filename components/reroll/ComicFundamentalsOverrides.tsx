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
    // Determine if any advanced options are active for summary display
    const hasShot = shotTypeOverride !== undefined;
    const hasBalloon = balloonShapeOverride !== undefined;
    const activeCount = [hasShot, hasBalloon, applyFlashbackStyle].filter(Boolean).length;

    return (
        <>
            {/* Collapsible Advanced Options on Mobile */}
            <details className="border-[3px] border-black bg-slate-50 group sm:hidden">
                <summary className="p-3 cursor-pointer flex justify-between items-center list-none touch-manipulation min-h-[48px]">
                    <span className="font-comic text-sm font-bold uppercase text-slate-900">
                        🎬 Visual Style Options
                        {activeCount > 0 && (
                            <span className="ml-2 bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {activeCount} active
                            </span>
                        )}
                    </span>
                    <span className="text-slate-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-3 pt-0 border-t-2 border-slate-200 space-y-4">
                    {/* Shot Type - Mobile */}
                    <div className="bg-cyan-50 p-3 rounded border-2 border-cyan-200">
                        <p className="font-comic text-sm font-bold uppercase text-cyan-900 mb-2">
                            📷 Camera Shot
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {SHOT_OPTIONS.map(opt => (
                                <button
                                    key={opt.shot}
                                    onClick={() => onShotTypeChange(shotTypeOverride === opt.shot ? undefined : opt.shot)}
                                    className={`flex flex-col items-center p-3 border-2 transition-colors touch-manipulation min-h-[56px] ${
                                        shotTypeOverride === opt.shot
                                            ? 'border-cyan-500 bg-cyan-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                            : 'border-gray-300 bg-white active:bg-cyan-50'
                                    }`}
                                    title={`${opt.shot} - Click again to deselect`}
                                >
                                    <span className="text-xl">{opt.icon}</span>
                                    <span className="font-comic text-xs font-bold">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        {shotTypeOverride === undefined && (
                            <p className="text-xs text-cyan-600 font-comic mt-2 italic">Auto</p>
                        )}
                    </div>

                    {/* Balloon Shape - Mobile */}
                    <div className="bg-pink-50 p-3 rounded border-2 border-pink-200">
                        <p className="font-comic text-sm font-bold uppercase text-pink-900 mb-2">
                            💬 Dialogue Style
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {BALLOON_OPTIONS.map(opt => (
                                <button
                                    key={opt.shape}
                                    onClick={() => onBalloonShapeChange(balloonShapeOverride === opt.shape ? undefined : opt.shape)}
                                    className={`flex flex-col p-3 border-2 transition-colors touch-manipulation min-h-[56px] ${
                                        balloonShapeOverride === opt.shape
                                            ? 'border-pink-500 bg-pink-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                            : 'border-gray-300 bg-white active:bg-pink-50'
                                    }`}
                                    title={`${opt.desc} - Click again to deselect`}
                                >
                                    <span className="font-comic text-sm font-bold">{opt.label}</span>
                                    <span className="font-comic text-xs text-gray-500">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                        {balloonShapeOverride === undefined && (
                            <p className="text-xs text-pink-600 font-comic mt-2 italic">Auto</p>
                        )}
                    </div>

                    {/* Flashback Toggle - Mobile */}
                    <div className="bg-amber-50 p-3 rounded border-2 border-amber-200">
                        <label className="flex items-center gap-3 cursor-pointer touch-manipulation min-h-[48px]">
                            <input
                                type="checkbox"
                                checked={applyFlashbackStyle}
                                onChange={(e) => onFlashbackStyleChange(e.target.checked)}
                                className="w-6 h-6 accent-amber-600 cursor-pointer flex-shrink-0"
                                aria-label="Apply flashback styling"
                            />
                            <div>
                                <p className="font-comic text-sm font-bold uppercase text-amber-900">
                                    📜 Flashback Styling
                                </p>
                                <p className="font-comic text-xs text-amber-700">
                                    Sepia tones, soft vignette edges
                                </p>
                            </div>
                        </label>
                    </div>
                </div>
            </details>

            {/* Desktop: Show all sections expanded */}
            <div className="hidden sm:block space-y-4">
                {/* Shot Type Selector - Desktop */}
                <div className="border-[3px] border-black bg-cyan-50 p-4">
                    <p className="font-comic text-sm font-bold uppercase text-cyan-900 mb-2">
                        📷 Camera Shot Override
                        <span className="font-normal text-[10px] text-cyan-600 ml-2">(Click selected to uncheck for None)</span>
                    </p>
                    <p className="font-comic text-[10px] text-cyan-700 mb-2">
                        Override the default camera framing for this panel
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                        {SHOT_OPTIONS.map(opt => (
                            <button
                                key={opt.shot}
                                onClick={() => onShotTypeChange(shotTypeOverride === opt.shot ? undefined : opt.shot)}
                                className={`flex flex-col items-center p-2 border-2 transition-colors ${
                                    shotTypeOverride === opt.shot
                                        ? 'border-cyan-500 bg-cyan-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                        : 'border-gray-300 bg-white hover:border-cyan-300'
                                }`}
                                title={`${opt.shot} - Click again to deselect`}
                            >
                                <span className="text-lg">{opt.icon}</span>
                                <span className="font-comic text-[10px] font-bold">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    {shotTypeOverride === undefined && (
                        <p className="text-[10px] text-cyan-600 font-comic mt-2 italic">None selected - will use outline/auto</p>
                    )}
                </div>

                {/* Balloon Shape Selector - Desktop */}
                <div className="border-[3px] border-black bg-pink-50 p-4">
                    <p className="font-comic text-sm font-bold uppercase text-pink-900 mb-2">
                        💬 Dialogue Style Override
                        <span className="font-normal text-[10px] text-pink-600 ml-2">(Click selected to uncheck for None)</span>
                    </p>
                    <p className="font-comic text-[10px] text-pink-700 mb-2">
                        Change how speech bubbles appear in this panel
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                        {BALLOON_OPTIONS.map(opt => (
                            <button
                                key={opt.shape}
                                onClick={() => onBalloonShapeChange(balloonShapeOverride === opt.shape ? undefined : opt.shape)}
                                className={`flex flex-col p-2 border-2 transition-colors ${
                                    balloonShapeOverride === opt.shape
                                        ? 'border-pink-500 bg-pink-100 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                        : 'border-gray-300 bg-white hover:border-pink-300'
                                }`}
                                title={`${opt.desc} - Click again to deselect`}
                            >
                                <span className="font-comic text-xs font-bold">{opt.label}</span>
                                <span className="font-comic text-[9px] text-gray-500">{opt.desc}</span>
                            </button>
                        ))}
                    </div>
                    {balloonShapeOverride === undefined && (
                        <p className="text-[10px] text-pink-600 font-comic mt-2 italic">None selected - will use context/auto</p>
                    )}
                </div>

                {/* Flashback Toggle - Desktop */}
                <div className="border-[3px] border-black bg-amber-50 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={applyFlashbackStyle}
                            onChange={(e) => onFlashbackStyleChange(e.target.checked)}
                            className="w-5 h-5 accent-amber-600 cursor-pointer"
                            aria-label="Apply flashback styling"
                        />
                        <div>
                            <p className="font-comic text-sm font-bold uppercase text-amber-900">
                                📜 Apply Flashback Styling
                            </p>
                            <p className="font-comic text-[10px] text-amber-700">
                                Sepia tones, soft vignette edges, desaturated colors - memory/nostalgic quality
                            </p>
                        </div>
                    </label>
                </div>
            </div>
        </>
    );
};
