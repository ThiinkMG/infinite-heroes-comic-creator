/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PageCharacterPlan, StoryOutline } from '../types';
import { OutlinePageCard, LAYOUT_ICONS, BEAT_COLORS, PACING_INDICATORS } from './OutlinePageCard';

/**
 * View mode for the grid display.
 */
export type GridViewMode = 'grid' | 'list' | 'compact';

/**
 * Sort options for page ordering.
 */
export type GridSortOption = 'page-asc' | 'page-desc' | 'beat' | 'layout';

/**
 * Filter options for showing/hiding certain page types.
 */
export interface GridFilterOptions {
    /** Show only decision pages */
    decisionPagesOnly?: boolean;
    /** Show only flashback pages */
    flashbacksOnly?: boolean;
    /** Filter by emotional beat type */
    emotionalBeat?: string | null;
    /** Filter by layout type */
    panelLayout?: string | null;
}

/**
 * Props for the OutlinePageGrid component.
 */
export interface OutlinePageGridProps {
    /** The story outline containing page breakdown */
    outline: StoryOutline;
    /** Currently selected page index (if any) */
    selectedPageIndex?: number | null;
    /** Handler when a page card is clicked */
    onPageSelect?: (plan: PageCharacterPlan) => void;
    /** Handler when a page card is double-clicked (for editing) */
    onPageEdit?: (plan: PageCharacterPlan) => void;
    /** Whether drag-and-drop reordering is enabled */
    enableReordering?: boolean;
    /** Handler when pages are reordered (future functionality) */
    onReorder?: (newOrder: PageCharacterPlan[]) => void;
    /** Initial view mode */
    initialViewMode?: GridViewMode;
    /** Whether to show the legend */
    showLegend?: boolean;
    /** Whether to show summary stats */
    showSummary?: boolean;
    /** Whether to show view mode toggle */
    showViewToggle?: boolean;
    /** Whether to show filter controls */
    showFilters?: boolean;
    /** Custom className for the container */
    className?: string;
    /** Maximum height for the grid container (enables scrolling) */
    maxHeight?: string;
}

/**
 * OutlinePageGrid component for displaying all page cards in a grid or list layout.
 * Supports filtering, sorting, view mode switching, and shows legend/summary stats.
 */
export const OutlinePageGrid: React.FC<OutlinePageGridProps> = ({
    outline,
    selectedPageIndex = null,
    onPageSelect,
    onPageEdit,
    enableReordering = false,
    onReorder,
    initialViewMode = 'grid',
    showLegend = true,
    showSummary = true,
    showViewToggle = true,
    showFilters = false,
    className = '',
    maxHeight,
}) => {
    const [viewMode, setViewMode] = useState<GridViewMode>(initialViewMode);
    const [filters, setFilters] = useState<GridFilterOptions>({});
    const [draggedPage, setDraggedPage] = useState<PageCharacterPlan | null>(null);

    const pageBreakdown = outline.pageBreakdown || [];
    const hasPages = pageBreakdown.length > 0;

    // Apply filters to page breakdown
    const filteredPages = useMemo(() => {
        let pages = [...pageBreakdown];

        if (filters.decisionPagesOnly) {
            pages = pages.filter(p => p.isDecisionPage);
        }
        if (filters.flashbacksOnly) {
            pages = pages.filter(p => p.isFlashback);
        }
        if (filters.emotionalBeat) {
            pages = pages.filter(p => p.emotionalBeat === filters.emotionalBeat);
        }
        if (filters.panelLayout) {
            pages = pages.filter(p => p.panelLayout === filters.panelLayout);
        }

        return pages;
    }, [pageBreakdown, filters]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        if (!hasPages) return null;

        return {
            totalPages: pageBreakdown.length,
            splashPages: pageBreakdown.filter(p => p.panelLayout === 'splash').length,
            flashbacks: pageBreakdown.filter(p => p.isFlashback).length,
            decisionPoints: pageBreakdown.filter(p => p.isDecisionPage).length,
            beatCounts: {
                action: pageBreakdown.filter(p => p.emotionalBeat === 'action').length,
                dialogue: pageBreakdown.filter(p => p.emotionalBeat === 'dialogue').length,
                climax: pageBreakdown.filter(p => p.emotionalBeat === 'climax').length,
                reveal: pageBreakdown.filter(p => p.emotionalBeat === 'reveal').length,
            },
        };
    }, [pageBreakdown, hasPages]);

    // Drag and drop handlers (for future reordering)
    const handleDragStart = (plan: PageCharacterPlan, e: React.DragEvent) => {
        setDraggedPage(plan);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(plan.pageIndex));
    };

    const handleDragEnd = () => {
        setDraggedPage(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (targetPlan: PageCharacterPlan, e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedPage || !onReorder) return;

        const newOrder = [...pageBreakdown];
        const draggedIndex = newOrder.findIndex(p => p.pageIndex === draggedPage.pageIndex);
        const targetIndex = newOrder.findIndex(p => p.pageIndex === targetPlan.pageIndex);

        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
            const [removed] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, removed);
            onReorder(newOrder);
        }

        setDraggedPage(null);
    };

    // Grid layout classes based on view mode
    const gridClasses = {
        grid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4',
        list: 'flex flex-col gap-2',
        compact: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2',
    };

    if (!hasPages) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <p className="font-comic text-gray-500 text-sm sm:text-base">
                    No page breakdown available. Generate an outline to see page cards.
                </p>
            </div>
        );
    }

    return (
        <div className={`outline-page-grid ${className}`}>
            {/* Controls Row: View Toggle + Filters */}
            {(showViewToggle || showFilters) && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    {/* View Mode Toggle */}
                    {showViewToggle && (
                        <div className="flex gap-1 border-2 border-black">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 font-comic text-xs sm:text-sm font-bold transition-colors ${
                                    viewMode === 'grid' ? 'bg-yellow-400 text-black' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                aria-pressed={viewMode === 'grid'}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 font-comic text-xs sm:text-sm font-bold transition-colors ${
                                    viewMode === 'list' ? 'bg-yellow-400 text-black' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                aria-pressed={viewMode === 'list'}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                className={`px-3 py-1.5 font-comic text-xs sm:text-sm font-bold transition-colors ${
                                    viewMode === 'compact' ? 'bg-yellow-400 text-black' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                aria-pressed={viewMode === 'compact'}
                            >
                                Compact
                            </button>
                        </div>
                    )}

                    {/* Filter Controls */}
                    {showFilters && (
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="flex items-center gap-1.5 font-comic text-xs">
                                <input
                                    type="checkbox"
                                    checked={filters.decisionPagesOnly || false}
                                    onChange={(e) => setFilters(f => ({ ...f, decisionPagesOnly: e.target.checked }))}
                                    className="w-4 h-4"
                                />
                                Decisions Only
                            </label>
                            <label className="flex items-center gap-1.5 font-comic text-xs">
                                <input
                                    type="checkbox"
                                    checked={filters.flashbacksOnly || false}
                                    onChange={(e) => setFilters(f => ({ ...f, flashbacksOnly: e.target.checked }))}
                                    className="w-4 h-4"
                                />
                                Flashbacks
                            </label>
                            {Object.keys(filters).some(k => filters[k as keyof GridFilterOptions]) && (
                                <button
                                    onClick={() => setFilters({})}
                                    className="px-2 py-1 bg-red-100 border border-red-300 rounded font-comic text-xs text-red-600 hover:bg-red-200"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            {showLegend && (
                <div className="mb-4 p-3 sm:p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                    <p className="font-comic text-sm sm:text-base font-bold mb-2">Legend:</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm font-comic">
                        {/* Layout Icons */}
                        <span title={LAYOUT_ICONS['splash'].description}>{LAYOUT_ICONS['splash'].icon} Splash</span>
                        <span title={LAYOUT_ICONS['grid-2x3'].description}>{LAYOUT_ICONS['grid-2x3'].icon} 6-Panel</span>
                        <span title={LAYOUT_ICONS['grid-3x3'].description}>{LAYOUT_ICONS['grid-3x3'].icon} 9-Panel</span>
                        <span title={LAYOUT_ICONS['asymmetric'].description}>{LAYOUT_ICONS['asymmetric'].icon} Dynamic</span>
                        <span className="text-gray-400">|</span>
                        {/* Pacing */}
                        <span className={PACING_INDICATORS['slow'].color}>{PACING_INDICATORS['slow'].icon} Slow</span>
                        <span className={PACING_INDICATORS['fast'].color}>{PACING_INDICATORS['fast'].icon} Fast</span>
                        <span className="text-gray-400">|</span>
                        {/* Special indicators */}
                        <span className="text-purple-600 font-bold">{'\u26A1'} Decision</span>
                        <span>{'\uD83D\uDCDC'} Flashback</span>
                    </div>
                </div>
            )}

            {/* Page Cards Grid */}
            <div
                className={`${gridClasses[viewMode]} ${maxHeight ? 'overflow-y-auto pr-1' : ''}`}
                style={maxHeight ? { maxHeight } : undefined}
                onDragOver={enableReordering ? handleDragOver : undefined}
            >
                {filteredPages.map((plan) => (
                    <div
                        key={plan.pageIndex}
                        onDrop={enableReordering ? (e) => handleDrop(plan, e) : undefined}
                        onDragOver={enableReordering ? handleDragOver : undefined}
                    >
                        <OutlinePageCard
                            plan={plan}
                            totalPages={pageBreakdown.length}
                            isSelected={selectedPageIndex === plan.pageIndex}
                            isDraggable={enableReordering}
                            isDragging={draggedPage?.pageIndex === plan.pageIndex}
                            onClick={onPageSelect}
                            onDoubleClick={onPageEdit}
                            onDragStart={enableReordering ? handleDragStart : undefined}
                            onDragEnd={enableReordering ? handleDragEnd : undefined}
                            compact={viewMode === 'compact'}
                        />
                    </div>
                ))}
            </div>

            {/* Filter Results Info */}
            {showFilters && (filters.decisionPagesOnly || filters.flashbacksOnly) && (
                <div className="mt-3 text-center font-comic text-xs text-gray-500">
                    Showing {filteredPages.length} of {pageBreakdown.length} pages
                </div>
            )}

            {/* Summary Statistics */}
            {showSummary && summaryStats && (
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                    <p className="font-comic text-sm sm:text-base font-bold">
                        {'\uD83D\uDCC8'} Summary: {summaryStats.totalPages} pages |
                        {' '}{summaryStats.splashPages} splash |
                        {' '}{summaryStats.flashbacks} flashbacks |
                        {' '}{summaryStats.decisionPoints} decisions
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-comic text-gray-600">
                        <span className={BEAT_COLORS['action'].text}>Action: {summaryStats.beatCounts.action}</span>
                        <span className={BEAT_COLORS['dialogue'].text}>Dialogue: {summaryStats.beatCounts.dialogue}</span>
                        <span className={BEAT_COLORS['climax'].text}>Climax: {summaryStats.beatCounts.climax}</span>
                        <span className={BEAT_COLORS['reveal'].text}>Reveal: {summaryStats.beatCounts.reveal}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutlinePageGrid;
