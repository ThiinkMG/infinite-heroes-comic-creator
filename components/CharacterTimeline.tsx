/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StoryOutline, Persona, PageCharacterPlan } from '../types';

/**
 * Character data structure used in the timeline.
 */
interface CharacterData {
    id: string;
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    role: 'hero' | 'costar' | 'additional';
}

/**
 * Props for the CharacterTimeline component.
 */
export interface CharacterTimelineProps {
    /** The story outline containing page breakdown */
    outline: StoryOutline;
    /** Character data: hero, co-star (friend), and additional characters */
    characters: {
        hero: Persona | null;
        friend: Persona | null;
        additionalCharacters: Persona[];
    };
    /** Optional callback when a page marker is clicked */
    onPageClick?: (pageIndex: number) => void;
    /** Whether the timeline is in compact mode (smaller markers) */
    compact?: boolean;
    /** Additional class names */
    className?: string;
}

/**
 * Color palette for different character types.
 * Hero gets red (action/power), co-star gets blue (support/trust),
 * additional characters get varied colors.
 */
const CHARACTER_COLORS: Record<string, { color: string; bgColor: string; borderColor: string }> = {
    hero: { color: 'text-red-600', bgColor: 'bg-red-500', borderColor: 'border-red-600' },
    friend: { color: 'text-blue-600', bgColor: 'bg-blue-500', borderColor: 'border-blue-600' },
    // Additional character colors (cycling through)
    additional_0: { color: 'text-purple-600', bgColor: 'bg-purple-500', borderColor: 'border-purple-600' },
    additional_1: { color: 'text-green-600', bgColor: 'bg-green-500', borderColor: 'border-green-600' },
    additional_2: { color: 'text-orange-600', bgColor: 'bg-orange-500', borderColor: 'border-orange-600' },
    additional_3: { color: 'text-pink-600', bgColor: 'bg-pink-500', borderColor: 'border-pink-600' },
    additional_4: { color: 'text-teal-600', bgColor: 'bg-teal-500', borderColor: 'border-teal-600' },
    additional_5: { color: 'text-amber-600', bgColor: 'bg-amber-500', borderColor: 'border-amber-600' },
};

/**
 * Get appearance pages for a character from the outline breakdown.
 */
function getCharacterAppearances(
    characterId: string,
    pageBreakdown: PageCharacterPlan[]
): number[] {
    return pageBreakdown
        .filter(page =>
            page.primaryCharacters.includes(characterId) ||
            page.secondaryCharacters?.includes(characterId) ||
            page.focusCharacter === characterId
        )
        .map(page => page.pageIndex);
}

/**
 * Check if character is the focus on a specific page.
 */
function isCharacterFocus(
    characterId: string,
    pageIndex: number,
    pageBreakdown: PageCharacterPlan[]
): boolean {
    const page = pageBreakdown.find(p => p.pageIndex === pageIndex);
    return page?.focusCharacter === characterId;
}

/**
 * Get page details for tooltip display.
 */
function getPageDetails(
    pageIndex: number,
    pageBreakdown: PageCharacterPlan[]
): PageCharacterPlan | undefined {
    return pageBreakdown.find(p => p.pageIndex === pageIndex);
}

/**
 * CharacterTimeline component displays a visual timeline showing
 * which characters appear on which pages of the comic.
 *
 * Features:
 * - Horizontal timeline with page numbers
 * - Character rows with colored markers
 * - Focus indicators (larger markers for focus pages)
 * - Hover tooltips with page details
 * - Responsive design for mobile
 */
export const CharacterTimeline: React.FC<CharacterTimelineProps> = ({
    outline,
    characters,
    onPageClick,
    compact = false,
    className = '',
}) => {
    const [hoveredPage, setHoveredPage] = useState<{ pageIndex: number; characterId: string } | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // Build character list with colors
    const characterList = useMemo<CharacterData[]>(() => {
        const list: CharacterData[] = [];

        if (characters.hero) {
            list.push({
                id: 'hero',
                name: characters.hero.name || 'Hero',
                ...CHARACTER_COLORS.hero,
                role: 'hero',
            });
        }

        if (characters.friend) {
            list.push({
                id: 'friend',
                name: characters.friend.name || 'Co-Star',
                ...CHARACTER_COLORS.friend,
                role: 'costar',
            });
        }

        characters.additionalCharacters.forEach((char, idx) => {
            const colorKey = `additional_${idx % 6}`;
            list.push({
                id: char.id,
                name: char.name || `Character ${idx + 1}`,
                ...CHARACTER_COLORS[colorKey],
                role: 'additional',
            });
        });

        return list;
    }, [characters]);

    // Get page breakdown or empty array
    const pageBreakdown = outline.pageBreakdown || [];
    const totalPages = pageBreakdown.length;

    // Build appearance map for each character
    const appearanceMap = useMemo(() => {
        const map: Record<string, number[]> = {};
        characterList.forEach(char => {
            map[char.id] = getCharacterAppearances(char.id, pageBreakdown);
        });
        return map;
    }, [characterList, pageBreakdown]);

    // Handle mouse enter on marker
    const handleMarkerHover = (
        pageIndex: number,
        characterId: string,
        event: React.MouseEvent
    ) => {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top,
        });
        setHoveredPage({ pageIndex, characterId });
    };

    // Handle mouse leave
    const handleMarkerLeave = () => {
        setHoveredPage(null);
    };

    // Handle marker click
    const handleMarkerClick = (pageIndex: number) => {
        if (onPageClick) {
            onPageClick(pageIndex);
        }
    };

    // If no page breakdown, show placeholder
    if (totalPages === 0) {
        return (
            <div className={`p-4 bg-gray-100 border-2 border-gray-300 rounded-lg ${className}`}>
                <p className="font-comic text-sm text-gray-500 text-center">
                    No outline data available. Generate an outline to see the character timeline.
                </p>
            </div>
        );
    }

    // Get hovered page details for tooltip
    const hoveredPageDetails = hoveredPage
        ? getPageDetails(hoveredPage.pageIndex, pageBreakdown)
        : null;

    return (
        <div className={`relative ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-comic text-sm sm:text-base font-bold uppercase text-gray-700">
                    Character Timeline
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-comic text-gray-500">
                        {characterList.length} characters | {totalPages} pages
                    </span>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="border-2 border-black rounded-lg bg-white overflow-hidden">
                {/* Page Number Header Row */}
                <div className="flex border-b-2 border-black bg-gray-100">
                    {/* Character name column header */}
                    <div className={`flex-shrink-0 ${compact ? 'w-20' : 'w-24 sm:w-32'} border-r-2 border-black p-1 sm:p-2`}>
                        <span className="font-comic text-[10px] sm:text-xs font-bold text-gray-600 uppercase">
                            Character
                        </span>
                    </div>
                    {/* Page number cells */}
                    <div className="flex-1 flex overflow-x-auto">
                        {pageBreakdown.map((page) => (
                            <div
                                key={page.pageIndex}
                                className={`
                                    flex-shrink-0 ${compact ? 'w-6 sm:w-8' : 'w-8 sm:w-10'}
                                    flex items-center justify-center
                                    border-r border-gray-300 last:border-r-0
                                    ${page.isDecisionPage ? 'bg-purple-100' : ''}
                                `}
                            >
                                <span className={`font-comic ${compact ? 'text-[8px]' : 'text-[10px] sm:text-xs'} font-bold`}>
                                    {page.pageIndex}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Character Rows */}
                {characterList.map((character, charIdx) => (
                    <div
                        key={character.id}
                        className={`
                            flex border-b border-gray-200 last:border-b-0
                            ${charIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        `}
                    >
                        {/* Character Name Cell */}
                        <div className={`
                            flex-shrink-0 ${compact ? 'w-20' : 'w-24 sm:w-32'}
                            border-r-2 border-black p-1 sm:p-2
                            flex items-center gap-1
                        `}>
                            <span
                                className={`
                                    inline-block ${compact ? 'w-2 h-2' : 'w-3 h-3'}
                                    rounded-full ${character.bgColor}
                                `}
                                aria-hidden="true"
                            />
                            <span
                                className={`
                                    font-comic ${compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'}
                                    font-bold ${character.color} truncate
                                `}
                                title={character.name}
                            >
                                {character.name}
                            </span>
                        </div>

                        {/* Page Marker Cells */}
                        <div className="flex-1 flex overflow-x-auto">
                            {pageBreakdown.map((page) => {
                                const appears = appearanceMap[character.id]?.includes(page.pageIndex);
                                const isFocus = isCharacterFocus(character.id, page.pageIndex, pageBreakdown);

                                return (
                                    <div
                                        key={page.pageIndex}
                                        className={`
                                            flex-shrink-0 ${compact ? 'w-6 sm:w-8' : 'w-8 sm:w-10'}
                                            flex items-center justify-center
                                            border-r border-gray-200 last:border-r-0
                                            ${compact ? 'py-1' : 'py-1.5 sm:py-2'}
                                        `}
                                    >
                                        {appears && (
                                            <button
                                                type="button"
                                                className={`
                                                    rounded-full transition-all
                                                    ${isFocus
                                                        ? `${compact ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} ${character.bgColor} border-2 ${character.borderColor} shadow-md`
                                                        : `${compact ? 'w-2.5 h-2.5' : 'w-3 h-3 sm:w-4 sm:h-4'} ${character.bgColor} opacity-60`
                                                    }
                                                    hover:scale-125 hover:opacity-100
                                                    ${onPageClick ? 'cursor-pointer' : 'cursor-default'}
                                                `}
                                                onClick={() => handleMarkerClick(page.pageIndex)}
                                                onMouseEnter={(e) => handleMarkerHover(page.pageIndex, character.id, e)}
                                                onMouseLeave={handleMarkerLeave}
                                                aria-label={`${character.name} appears on page ${page.pageIndex}${isFocus ? ' (focus)' : ''}`}
                                                title={`${character.name} - Page ${page.pageIndex}${isFocus ? ' (Focus)' : ''}`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-comic text-[10px] sm:text-xs text-gray-500 font-bold">Legend:</span>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-400 border-2 border-gray-600 shadow-sm" />
                    <span className="font-comic text-[10px] sm:text-xs text-gray-600">Focus</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-400 opacity-60" />
                    <span className="font-comic text-[10px] sm:text-xs text-gray-600">Appears</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-purple-100 border border-purple-300 rounded" />
                    <span className="font-comic text-[10px] sm:text-xs text-gray-600">Decision</span>
                </div>
            </div>

            {/* Tooltip Portal (positioned absolutely) */}
            {hoveredPage && hoveredPageDetails && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y - 8,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <div className="bg-black text-white px-3 py-2 rounded-lg shadow-lg max-w-[250px]">
                        <div className="font-comic text-xs font-bold mb-1">
                            Page {hoveredPageDetails.pageIndex}
                            {hoveredPageDetails.isDecisionPage && (
                                <span className="ml-1 text-purple-300">(Decision)</span>
                            )}
                        </div>
                        {hoveredPageDetails.sceneDescription && (
                            <p className="font-comic text-[10px] text-gray-300 line-clamp-2 mb-1">
                                {hoveredPageDetails.sceneDescription}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-1 text-[9px]">
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded uppercase">
                                {hoveredPageDetails.emotionalBeat}
                            </span>
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded">
                                {hoveredPageDetails.panelLayout}
                            </span>
                            <span className="bg-gray-700 px-1.5 py-0.5 rounded">
                                {hoveredPageDetails.suggestedShot}
                            </span>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterTimeline;
