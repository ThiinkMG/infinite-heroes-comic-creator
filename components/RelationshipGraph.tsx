/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Character node data for the relationship graph.
 */
export interface RelationshipCharacter {
    /** Unique identifier for the character */
    id: string;
    /** Display name */
    name: string;
    /** Character role determining node color */
    role: 'hero' | 'costar' | 'supporting' | 'villain';
    /** Optional portrait image URL or base64 data */
    portraitUrl?: string;
}

/**
 * Relationship edge connecting two characters.
 */
export interface Relationship {
    /** Source character ID */
    fromCharacterId: string;
    /** Target character ID */
    toCharacterId: string;
    /** Relationship type (determines color) */
    type: string;
    /** Relationship intensity (1=weak, 2=moderate, 3=strong) */
    intensity: 1 | 2 | 3;
}

/**
 * Props for the RelationshipGraph component.
 */
export interface RelationshipGraphProps {
    /** Array of characters to display as nodes */
    characters: RelationshipCharacter[];
    /** Array of relationships to display as edges */
    relationships: Relationship[];
    /** Callback when a character node is clicked */
    onCharacterClick?: (characterId: string) => void;
    /** Callback when a relationship edge is clicked */
    onRelationshipClick?: (fromId: string, toId: string) => void;
    /** Graph width in pixels */
    width?: number;
    /** Graph height in pixels */
    height?: number;
    /** Additional CSS class names */
    className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Node border colors by character role.
 */
const ROLE_COLORS: Record<RelationshipCharacter['role'], { border: string; fill: string; text: string }> = {
    hero: { border: '#F59E0B', fill: '#FEF3C7', text: '#D97706' },     // Yellow/gold
    costar: { border: '#3B82F6', fill: '#DBEAFE', text: '#2563EB' },   // Blue
    supporting: { border: '#10B981', fill: '#D1FAE5', text: '#059669' }, // Green
    villain: { border: '#EF4444', fill: '#FEE2E2', text: '#DC2626' },  // Red
};

/**
 * Relationship type categories for edge coloring.
 */
const POSITIVE_TYPES = ['ally', 'friend', 'family', 'love', 'partner', 'sibling', 'parent', 'child'];
const NEGATIVE_TYPES = ['enemy', 'rival', 'nemesis', 'adversary', 'antagonist'];
const NEUTRAL_TYPES = ['mentor', 'student', 'colleague', 'acquaintance', 'unknown'];

/**
 * Edge colors by relationship category.
 */
const EDGE_COLORS = {
    positive: '#10B981', // Green
    negative: '#EF4444', // Red
    neutral: '#6B7280',  // Gray
};

/**
 * Edge thickness by intensity level.
 */
const EDGE_THICKNESS: Record<1 | 2 | 3, number> = {
    1: 2,
    2: 4,
    3: 6,
};

/**
 * Node configuration.
 */
const NODE_RADIUS = 35;
const NODE_RADIUS_HERO = 45;
const PORTRAIT_RADIUS = 28;
const PORTRAIT_RADIUS_HERO = 38;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get edge color based on relationship type.
 */
function getEdgeColor(type: string): string {
    const lowerType = type.toLowerCase();
    if (POSITIVE_TYPES.some(t => lowerType.includes(t))) return EDGE_COLORS.positive;
    if (NEGATIVE_TYPES.some(t => lowerType.includes(t))) return EDGE_COLORS.negative;
    return EDGE_COLORS.neutral;
}

/**
 * Get relationship category for legend display.
 */
function getRelationshipCategory(type: string): 'positive' | 'negative' | 'neutral' {
    const lowerType = type.toLowerCase();
    if (POSITIVE_TYPES.some(t => lowerType.includes(t))) return 'positive';
    if (NEGATIVE_TYPES.some(t => lowerType.includes(t))) return 'negative';
    return 'neutral';
}

/**
 * Calculate node positions in a circular layout with hero at center.
 */
function calculateNodePositions(
    characters: RelationshipCharacter[],
    width: number,
    height: number
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = width / 2;
    const centerY = height / 2;

    // Find the hero (if any)
    const heroIndex = characters.findIndex(c => c.role === 'hero');
    const hero = heroIndex >= 0 ? characters[heroIndex] : null;
    const otherCharacters = characters.filter(c => c.role !== 'hero');

    // Place hero at center
    if (hero) {
        positions.set(hero.id, { x: centerX, y: centerY });
    }

    // Calculate radius for other characters (smaller if few characters)
    const numOthers = otherCharacters.length;
    if (numOthers === 0) return positions;

    const maxRadius = Math.min(width, height) / 2 - NODE_RADIUS_HERO - 20;
    const minRadius = 100;
    const radius = Math.max(minRadius, Math.min(maxRadius, 120 + numOthers * 10));

    // Place other characters in a circle
    otherCharacters.forEach((char, index) => {
        const angle = (2 * Math.PI * index) / numOthers - Math.PI / 2; // Start from top
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.set(char.id, { x, y });
    });

    // If no hero, place first character at center and others around
    if (!hero && characters.length > 0) {
        const firstChar = characters[0];
        positions.set(firstChar.id, { x: centerX, y: centerY });

        const remainingChars = characters.slice(1);
        remainingChars.forEach((char, index) => {
            const angle = (2 * Math.PI * index) / remainingChars.length - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            positions.set(char.id, { x, y });
        });
    }

    return positions;
}

/**
 * Get initials from a character name.
 */
function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Calculate edge path between two nodes (curved for better visibility).
 */
function calculateEdgePath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromRadius: number,
    toRadius: number,
    curveOffset: number = 0
): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return '';

    // Calculate start and end points at node edges
    const unitX = dx / distance;
    const unitY = dy / distance;

    const startX = from.x + unitX * fromRadius;
    const startY = from.y + unitY * fromRadius;
    const endX = to.x - unitX * toRadius;
    const endY = to.y - unitY * toRadius;

    // Calculate control point for curve
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Perpendicular offset for curve
    const perpX = -unitY * curveOffset;
    const perpY = unitX * curveOffset;

    const controlX = midX + perpX;
    const controlY = midY + perpY;

    if (curveOffset === 0) {
        return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * RelationshipGraph displays an interactive SVG visualization of character
 * relationships. Characters are shown as circular nodes with portraits or
 * initials, and relationships are shown as colored edges between nodes.
 *
 * Features:
 * - Hero character centered, others arranged in a circle
 * - Node colors by role (hero=gold, costar=blue, supporting=green, villain=red)
 * - Edge colors by relationship type (positive=green, negative=red, neutral=gray)
 * - Edge thickness by relationship intensity
 * - Hover effects to highlight connections
 * - Click handlers for nodes and edges
 * - Legend showing relationship types
 */
export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
    characters,
    relationships,
    onCharacterClick,
    onRelationshipClick,
    width = 500,
    height = 400,
    className = '',
}) => {
    // State for hover effects
    const [hoveredCharacterId, setHoveredCharacterId] = useState<string | null>(null);
    const [hoveredEdge, setHoveredEdge] = useState<{ from: string; to: string } | null>(null);
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

    // Tooltip state
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        x: number;
        y: number;
        content: string;
    }>({ visible: false, x: 0, y: 0, content: '' });

    const svgRef = useRef<SVGSVGElement>(null);

    // Calculate node positions
    const nodePositions = useMemo(
        () => calculateNodePositions(characters, width, height),
        [characters, width, height]
    );

    // Build character lookup map
    const characterMap = useMemo(() => {
        const map = new Map<string, RelationshipCharacter>();
        characters.forEach(char => map.set(char.id, char));
        return map;
    }, [characters]);

    // Get connections for a character (for hover highlighting)
    const getConnectedCharacterIds = useCallback((characterId: string): Set<string> => {
        const connected = new Set<string>();
        relationships.forEach(rel => {
            if (rel.fromCharacterId === characterId) {
                connected.add(rel.toCharacterId);
            } else if (rel.toCharacterId === characterId) {
                connected.add(rel.fromCharacterId);
            }
        });
        return connected;
    }, [relationships]);

    // Handle character node click
    const handleCharacterClick = useCallback((characterId: string) => {
        setSelectedCharacterId(prev => prev === characterId ? null : characterId);
        if (onCharacterClick) {
            onCharacterClick(characterId);
        }
    }, [onCharacterClick]);

    // Handle edge click
    const handleEdgeClick = useCallback((fromId: string, toId: string) => {
        if (onRelationshipClick) {
            onRelationshipClick(fromId, toId);
        }
    }, [onRelationshipClick]);

    // Handle tooltip display
    const showTooltip = useCallback((content: string, event: React.MouseEvent) => {
        if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            setTooltip({
                visible: true,
                x: event.clientX - rect.left,
                y: event.clientY - rect.top - 10,
                content,
            });
        }
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);

    // Determine if an edge should be highlighted
    const isEdgeHighlighted = useCallback((fromId: string, toId: string): boolean => {
        if (hoveredCharacterId) {
            return fromId === hoveredCharacterId || toId === hoveredCharacterId;
        }
        if (selectedCharacterId) {
            return fromId === selectedCharacterId || toId === selectedCharacterId;
        }
        if (hoveredEdge) {
            return (fromId === hoveredEdge.from && toId === hoveredEdge.to) ||
                   (fromId === hoveredEdge.to && toId === hoveredEdge.from);
        }
        return false;
    }, [hoveredCharacterId, selectedCharacterId, hoveredEdge]);

    // Determine if a node should be dimmed
    const isNodeDimmed = useCallback((characterId: string): boolean => {
        if (!hoveredCharacterId && !selectedCharacterId) return false;

        const activeId = hoveredCharacterId || selectedCharacterId;
        if (!activeId || characterId === activeId) return false;

        const connected = getConnectedCharacterIds(activeId);
        return !connected.has(characterId);
    }, [hoveredCharacterId, selectedCharacterId, getConnectedCharacterIds]);

    // If no characters, show placeholder
    if (characters.length === 0) {
        return (
            <div className={`p-4 bg-gray-100 border-2 border-gray-300 rounded-lg ${className}`}>
                <p className="font-comic text-sm text-gray-500 text-center">
                    No characters to display. Add characters to see the relationship graph.
                </p>
            </div>
        );
    }

    // Group edges by character pairs to handle multiple relationships
    const edgeGroups = useMemo(() => {
        const groups = new Map<string, Relationship[]>();
        relationships.forEach(rel => {
            const key = [rel.fromCharacterId, rel.toCharacterId].sort().join('-');
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(rel);
        });
        return groups;
    }, [relationships]);

    return (
        <div className={`relative ${className}`}>
            {/* SVG Graph */}
            <svg
                ref={svgRef}
                width={width}
                height={height}
                className="bg-white border-2 border-black rounded-lg overflow-visible"
                style={{ touchAction: 'none' }}
            >
                {/* Defs for patterns and filters */}
                <defs>
                    {/* Drop shadow filter for nodes */}
                    <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
                    </filter>

                    {/* Glow filter for highlighted elements */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Clip paths for portrait images */}
                    {characters.map(char => {
                        const isHero = char.role === 'hero';
                        const radius = isHero ? PORTRAIT_RADIUS_HERO : PORTRAIT_RADIUS;
                        return (
                            <clipPath key={`clip-${char.id}`} id={`clip-${char.id}`}>
                                <circle r={radius} />
                            </clipPath>
                        );
                    })}
                </defs>

                {/* Render edges first (below nodes) */}
                <g className="edges">
                    {Array.from(edgeGroups.entries()).map(([key, rels]) => {
                        const [id1, id2] = key.split('-');
                        const pos1 = nodePositions.get(id1);
                        const pos2 = nodePositions.get(id2);

                        if (!pos1 || !pos2) return null;

                        const char1 = characterMap.get(id1);
                        const char2 = characterMap.get(id2);

                        const radius1 = char1?.role === 'hero' ? NODE_RADIUS_HERO : NODE_RADIUS;
                        const radius2 = char2?.role === 'hero' ? NODE_RADIUS_HERO : NODE_RADIUS;

                        // Render each relationship in the group with offset curves
                        return rels.map((rel, idx) => {
                            const isHighlighted = isEdgeHighlighted(rel.fromCharacterId, rel.toCharacterId);
                            const color = getEdgeColor(rel.type);
                            const thickness = EDGE_THICKNESS[rel.intensity];

                            // Calculate curve offset for multiple edges
                            const curveOffset = rels.length > 1
                                ? (idx - (rels.length - 1) / 2) * 30
                                : 0;

                            const path = calculateEdgePath(pos1, pos2, radius1, radius2, curveOffset);

                            return (
                                <g key={`edge-${rel.fromCharacterId}-${rel.toCharacterId}-${idx}`}>
                                    {/* Invisible wider path for easier click/hover */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="transparent"
                                        strokeWidth={thickness + 10}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleEdgeClick(rel.fromCharacterId, rel.toCharacterId)}
                                        onMouseEnter={(e) => {
                                            setHoveredEdge({ from: rel.fromCharacterId, to: rel.toCharacterId });
                                            const fromChar = characterMap.get(rel.fromCharacterId);
                                            const toChar = characterMap.get(rel.toCharacterId);
                                            showTooltip(
                                                `${fromChar?.name || 'Unknown'} - ${rel.type} - ${toChar?.name || 'Unknown'}`,
                                                e
                                            );
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredEdge(null);
                                            hideTooltip();
                                        }}
                                    />
                                    {/* Visible edge path */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={thickness}
                                        strokeLinecap="round"
                                        opacity={isHighlighted ? 1 : 0.6}
                                        filter={isHighlighted ? 'url(#glow)' : undefined}
                                        style={{
                                            transition: 'opacity 0.2s, stroke-width 0.2s',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                </g>
                            );
                        });
                    })}
                </g>

                {/* Render nodes */}
                <g className="nodes">
                    {characters.map(char => {
                        const pos = nodePositions.get(char.id);
                        if (!pos) return null;

                        const isHero = char.role === 'hero';
                        const radius = isHero ? NODE_RADIUS_HERO : NODE_RADIUS;
                        const portraitRadius = isHero ? PORTRAIT_RADIUS_HERO : PORTRAIT_RADIUS;
                        const colors = ROLE_COLORS[char.role];

                        const isHovered = hoveredCharacterId === char.id;
                        const isSelected = selectedCharacterId === char.id;
                        const isDimmed = isNodeDimmed(char.id);

                        return (
                            <g
                                key={char.id}
                                transform={`translate(${pos.x}, ${pos.y})`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleCharacterClick(char.id)}
                                onMouseEnter={(e) => {
                                    setHoveredCharacterId(char.id);
                                    showTooltip(`${char.name} (${char.role})`, e);
                                }}
                                onMouseLeave={() => {
                                    setHoveredCharacterId(null);
                                    hideTooltip();
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`${char.name}, ${char.role} character`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleCharacterClick(char.id);
                                    }
                                }}
                            >
                                {/* Node background circle */}
                                <circle
                                    r={radius}
                                    fill={colors.fill}
                                    stroke={colors.border}
                                    strokeWidth={isSelected ? 4 : 3}
                                    filter="url(#nodeShadow)"
                                    opacity={isDimmed ? 0.4 : 1}
                                    style={{
                                        transition: 'opacity 0.2s, r 0.2s, stroke-width 0.2s',
                                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                        transformOrigin: 'center',
                                    }}
                                />

                                {/* Selection ring */}
                                {isSelected && (
                                    <circle
                                        r={radius + 6}
                                        fill="none"
                                        stroke={colors.border}
                                        strokeWidth={2}
                                        strokeDasharray="6 3"
                                        opacity={0.8}
                                    />
                                )}

                                {/* Portrait image or initials */}
                                {char.portraitUrl ? (
                                    <g clipPath={`url(#clip-${char.id})`}>
                                        <image
                                            href={char.portraitUrl}
                                            x={-portraitRadius}
                                            y={-portraitRadius}
                                            width={portraitRadius * 2}
                                            height={portraitRadius * 2}
                                            preserveAspectRatio="xMidYMid slice"
                                            opacity={isDimmed ? 0.4 : 1}
                                            style={{ transition: 'opacity 0.2s' }}
                                        />
                                    </g>
                                ) : (
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill={colors.text}
                                        fontSize={isHero ? 20 : 16}
                                        fontWeight="bold"
                                        fontFamily="Comic Sans MS, cursive, sans-serif"
                                        opacity={isDimmed ? 0.4 : 1}
                                        style={{
                                            transition: 'opacity 0.2s',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {getInitials(char.name)}
                                    </text>
                                )}

                                {/* Character name label below node */}
                                <text
                                    y={radius + 14}
                                    textAnchor="middle"
                                    fill="#374151"
                                    fontSize={11}
                                    fontWeight="600"
                                    fontFamily="Comic Sans MS, cursive, sans-serif"
                                    opacity={isDimmed ? 0.4 : 1}
                                    style={{
                                        transition: 'opacity 0.2s',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {char.name.length > 12 ? char.name.slice(0, 10) + '...' : char.name}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Tooltip */}
            {tooltip.visible && (
                <div
                    className="absolute pointer-events-none z-50"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <div className="bg-black text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-comic whitespace-nowrap">
                        {tooltip.content}
                        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="mt-3 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <h4 className="font-comic text-xs font-bold text-gray-700 uppercase mb-2">Legend</h4>

                {/* Role colors */}
                <div className="flex flex-wrap gap-3 mb-2">
                    <span className="font-comic text-[10px] text-gray-500 font-bold">ROLES:</span>
                    {Object.entries(ROLE_COLORS).map(([role, colors]) => (
                        <div key={role} className="flex items-center gap-1">
                            <span
                                className="w-3 h-3 rounded-full border-2"
                                style={{
                                    backgroundColor: colors.fill,
                                    borderColor: colors.border,
                                }}
                            />
                            <span className="font-comic text-[10px] text-gray-600 capitalize">
                                {role === 'costar' ? 'Co-star' : role}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Relationship type colors */}
                <div className="flex flex-wrap gap-3 mb-2">
                    <span className="font-comic text-[10px] text-gray-500 font-bold">RELATIONSHIPS:</span>
                    <div className="flex items-center gap-1">
                        <span
                            className="w-4 h-0.5"
                            style={{ backgroundColor: EDGE_COLORS.positive }}
                        />
                        <span className="font-comic text-[10px] text-gray-600">
                            Positive (ally, friend, family)
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span
                            className="w-4 h-0.5"
                            style={{ backgroundColor: EDGE_COLORS.negative }}
                        />
                        <span className="font-comic text-[10px] text-gray-600">
                            Negative (enemy, rival)
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span
                            className="w-4 h-0.5"
                            style={{ backgroundColor: EDGE_COLORS.neutral }}
                        />
                        <span className="font-comic text-[10px] text-gray-600">
                            Neutral (mentor, colleague)
                        </span>
                    </div>
                </div>

                {/* Intensity indicator */}
                <div className="flex flex-wrap gap-3">
                    <span className="font-comic text-[10px] text-gray-500 font-bold">INTENSITY:</span>
                    <div className="flex items-center gap-1">
                        <span
                            className="w-4"
                            style={{ height: '2px', backgroundColor: '#6B7280' }}
                        />
                        <span className="font-comic text-[10px] text-gray-600">Weak</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span
                            className="w-4"
                            style={{ height: '4px', backgroundColor: '#6B7280' }}
                        />
                        <span className="font-comic text-[10px] text-gray-600">Moderate</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span
                            className="w-4"
                            style={{ height: '6px', backgroundColor: '#6B7280' }}
                        />
                        <span className="font-comic text-[10px] text-gray-600">Strong</span>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <p className="mt-2 font-comic text-[10px] text-gray-400 text-center">
                Click a character to highlight their connections. Hover over edges to see relationship details.
            </p>
        </div>
    );
};

export default RelationshipGraph;
