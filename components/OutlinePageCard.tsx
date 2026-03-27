/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
    PageCharacterPlan,
    PanelLayout,
    ShotType,
    EmotionalBeat,
    PacingIntent,
} from '../types';

/**
 * Layout icons for visual representation of panel layouts.
 * Icons visually suggest the panel arrangement.
 */
export const LAYOUT_ICONS: Record<PanelLayout, { icon: string; label: string; description: string }> = {
    'splash': { icon: '\u25A3', label: 'Splash', description: 'Full page single panel' },
    'horizontal-split': { icon: '\u25A4', label: '2H', description: 'Two horizontal panels' },
    'vertical-split': { icon: '\u25A5', label: '2V', description: 'Two vertical panels' },
    'grid-2x2': { icon: '\u229E', label: '4P', description: 'Four panel grid (2x2)' },
    'grid-2x3': { icon: '\u229F', label: '6P', description: 'Six panel grid (2x3)' },
    'grid-3x3': { icon: '\u25A6', label: '9P', description: 'Nine panel grid (3x3)' },
    'asymmetric': { icon: '\u22A0', label: 'Dyn', description: 'Dynamic/asymmetric layout' },
};

/**
 * Shot type icons for camera framing indication.
 */
export const SHOT_ICONS: Record<ShotType, { icon: string; label: string; description: string }> = {
    'extreme-close-up': { icon: 'XCU', label: 'XCU', description: 'Extreme close-up (eyes/detail)' },
    'close-up': { icon: 'CU', label: 'CU', description: 'Close-up (face)' },
    'medium': { icon: 'MED', label: 'Med', description: 'Medium shot (waist-up)' },
    'full': { icon: 'FULL', label: 'Full', description: 'Full body shot' },
    'wide': { icon: 'WIDE', label: 'Wide', description: 'Wide shot (environment)' },
    'extreme-wide': { icon: 'EST', label: 'Est.', description: 'Establishing/extreme wide' },
};

/**
 * Beat type colors for visual differentiation by emotional beat.
 */
export const BEAT_COLORS: Record<EmotionalBeat, { bg: string; border: string; text: string }> = {
    'establishing': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
    'action': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700' },
    'dialogue': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
    'reaction': { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
    'climax': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
    'transition': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
    'reveal': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
};

/**
 * Pacing indicators for reading speed visualization.
 */
export const PACING_INDICATORS: Record<PacingIntent, { icon: string; label: string; color: string }> = {
    'slow': { icon: '\u{1F422}', label: 'Slow', color: 'text-blue-600' },
    'medium': { icon: '\u{1F6B6}', label: 'Medium', color: 'text-green-600' },
    'fast': { icon: '\u{1F3C3}', label: 'Fast', color: 'text-red-600' },
};

/**
 * Page type determination based on page index and total pages.
 */
export type OutlinePageType = 'cover' | 'story' | 'back';

/**
 * Props for the OutlinePageCard component.
 */
export interface OutlinePageCardProps {
    /** The page character plan data */
    plan: PageCharacterPlan;
    /** Total number of pages (used to determine back cover) */
    totalPages?: number;
    /** Whether this card is currently selected */
    isSelected?: boolean;
    /** Whether drag functionality is enabled */
    isDraggable?: boolean;
    /** Whether this card is being dragged */
    isDragging?: boolean;
    /** Click handler for selecting this card */
    onClick?: (plan: PageCharacterPlan) => void;
    /** Double-click handler for editing this card */
    onDoubleClick?: (plan: PageCharacterPlan) => void;
    /** Drag start handler (for future reordering) */
    onDragStart?: (plan: PageCharacterPlan, e: React.DragEvent) => void;
    /** Drag end handler */
    onDragEnd?: (e: React.DragEvent) => void;
    /** Custom className for additional styling */
    className?: string;
    /** Whether to show compact version (less detail) */
    compact?: boolean;
}

/**
 * Determines the page type based on index and total pages.
 */
export function getPageType(pageIndex: number, totalPages?: number): OutlinePageType {
    if (pageIndex === 0) return 'cover';
    if (totalPages && pageIndex === totalPages - 1) return 'back';
    return 'story';
}

/**
 * OutlinePageCard component for displaying individual page cards in the outline editor.
 * Shows page number, type, description preview, layout, shot type, and other comic fundamentals.
 * Supports drag handle for future reordering functionality.
 */
export const OutlinePageCard: React.FC<OutlinePageCardProps> = ({
    plan,
    totalPages,
    isSelected = false,
    isDraggable = false,
    isDragging = false,
    onClick,
    onDoubleClick,
    onDragStart,
    onDragEnd,
    className = '',
    compact = false,
}) => {
    const layout = LAYOUT_ICONS[plan.panelLayout] || LAYOUT_ICONS['grid-2x3'];
    const shot = SHOT_ICONS[plan.suggestedShot] || SHOT_ICONS['medium'];
    const beatColor = BEAT_COLORS[plan.emotionalBeat] || BEAT_COLORS['action'];
    const pacing = PACING_INDICATORS[plan.pacingIntent] || PACING_INDICATORS['medium'];
    const pageType = getPageType(plan.pageIndex, totalPages);

    // Page type badge styling
    const pageTypeBadge = {
        cover: { bg: 'bg-amber-200', border: 'border-amber-500', text: 'COVER' },
        story: { bg: 'bg-white', border: 'border-gray-300', text: 'STORY' },
        back: { bg: 'bg-slate-200', border: 'border-slate-500', text: 'BACK' },
    };

    const handleClick = () => {
        if (onClick) onClick(plan);
    };

    const handleDoubleClick = () => {
        if (onDoubleClick) onDoubleClick(plan);
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (onDragStart) onDragStart(plan, e);
    };

    return (
        <div
            className={`
                relative border-3 ${beatColor.bg} ${beatColor.border}
                ${compact ? 'p-2' : 'p-3 sm:p-4'}
                rounded-lg transition-all
                hover:shadow-lg hover:scale-[1.02]
                ${plan.isFlashback ? 'bg-amber-50/80' : ''}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${isDragging ? 'opacity-50 scale-95' : ''}
                ${onClick || onDoubleClick ? 'cursor-pointer' : ''}
                ${className}
            `}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            draggable={isDraggable}
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`Page ${plan.pageIndex}: ${plan.sceneDescription || 'No description'}`}
            aria-pressed={isSelected}
        >
            {/* Drag Handle (shown when draggable) */}
            {isDraggable && (
                <div
                    className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                    title="Drag to reorder"
                    aria-label="Drag handle"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <circle cx="3" cy="2" r="1.5" />
                        <circle cx="9" cy="2" r="1.5" />
                        <circle cx="3" cy="6" r="1.5" />
                        <circle cx="9" cy="6" r="1.5" />
                        <circle cx="3" cy="10" r="1.5" />
                        <circle cx="9" cy="10" r="1.5" />
                    </svg>
                </div>
            )}

            {/* Header Row */}
            <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-2'}`}>
                <div className="flex items-center gap-2">
                    <span className={`font-comic font-bold ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
                        Page {plan.pageIndex}
                    </span>
                    {plan.isDecisionPage && (
                        <span className="text-purple-600 text-lg" title="Decision Page">
                            {'\u26A1'}
                        </span>
                    )}
                </div>
                <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5 sm:gap-2'}`}>
                    <span
                        title={layout.description}
                        className={`${compact ? 'text-lg' : 'text-xl sm:text-2xl'} cursor-help`}
                    >
                        {layout.icon}
                    </span>
                    <span
                        title={shot.description}
                        className={`${compact ? 'text-[10px]' : 'text-xs sm:text-sm'} font-comic font-bold bg-gray-200 px-1.5 py-0.5 rounded cursor-help`}
                    >
                        {shot.label}
                    </span>
                    <span
                        title={`Pacing: ${pacing.label}`}
                        className={`${compact ? 'text-base' : 'text-base sm:text-lg'} ${pacing.color}`}
                    >
                        {pacing.icon}
                    </span>
                </div>
            </div>

            {/* Scene Description */}
            {!compact && (
                <p
                    className="font-comic text-xs sm:text-sm text-gray-700 line-clamp-3 mb-2 leading-relaxed"
                    title={plan.sceneDescription || 'No description'}
                >
                    {plan.sceneDescription || 'No description'}
                </p>
            )}
            {compact && plan.sceneDescription && (
                <p
                    className="font-comic text-[10px] text-gray-600 line-clamp-1 mb-1"
                    title={plan.sceneDescription}
                >
                    {plan.sceneDescription}
                </p>
            )}

            {/* Footer Badges */}
            <div className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-1.5'}`}>
                {/* Page Type Badge */}
                <span className={`
                    px-1.5 py-0.5 ${pageTypeBadge[pageType].bg} border-2 ${pageTypeBadge[pageType].border}
                    rounded ${compact ? 'text-[8px]' : 'text-[10px] sm:text-xs'} font-comic font-bold uppercase
                `}>
                    {pageTypeBadge[pageType].text}
                </span>

                {/* Emotional Beat Badge */}
                <span className={`
                    px-1.5 py-0.5 bg-white border-2 border-gray-300
                    rounded ${compact ? 'text-[8px]' : 'text-[10px] sm:text-xs'} font-comic font-bold uppercase ${beatColor.text}
                `}>
                    {plan.emotionalBeat}
                </span>

                {/* Flashback Indicator */}
                {plan.isFlashback && (
                    <span className={`
                        px-1.5 py-0.5 bg-amber-200 border-2 border-amber-400
                        rounded ${compact ? 'text-[8px]' : 'text-[10px] sm:text-xs'} font-comic font-bold
                    `}>
                        {'\uD83D\uDCDC'} Flashback
                    </span>
                )}

                {/* Transition Type */}
                {!compact && (
                    <span
                        className="px-1.5 py-0.5 bg-gray-200 border-2 border-gray-400 rounded text-[10px] sm:text-xs font-comic"
                        title={plan.transitionType}
                    >
                        {'\u2192'} {plan.transitionType.split('-')[0]}
                    </span>
                )}
            </div>

            {/* Characters Row */}
            {!compact && (
                <div className="mt-2 text-[11px] sm:text-xs text-gray-600 font-comic">
                    {'\uD83D\uDC65'} {plan.primaryCharacters.slice(0, 3).join(', ')}
                    {plan.primaryCharacters.length > 3 ? '...' : ''} | Focus: {plan.focusCharacter}
                </div>
            )}
        </div>
    );
};

export default OutlinePageCard;
