/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EXAMPLE_COMICS, ExampleComic, getSettingsFromExample } from '../data/exampleComics';

/**
 * Props for the ExampleComicsGallery component
 */
export interface ExampleComicsGalleryProps {
  /** Callback when user wants to create a similar comic */
  onSelectExample?: (example: ExampleComic) => void;
  /** Callback to pre-fill settings from an example */
  onTrySimilar?: (settings: ReturnType<typeof getSettingsFromExample>) => void;
  /** Whether to show in compact mode (fewer details) */
  compact?: boolean;
  /** Custom class name for styling */
  className?: string;
}

/**
 * Card component for displaying a single example comic
 */
const ExampleComicCard: React.FC<{
  example: ExampleComic;
  onSelect?: (example: ExampleComic) => void;
  onTrySimilar?: (settings: ReturnType<typeof getSettingsFromExample>) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ example, onSelect, onTrySimilar, isExpanded, onToggleExpand }) => {
  const handleTrySimilar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTrySimilar) {
      onTrySimilar(getSettingsFromExample(example));
    } else if (onSelect) {
      onSelect(example);
    }
  };

  return (
    <div
      className={`
        border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.3)]
        transition-all duration-200 cursor-pointer
        ${isExpanded ? 'col-span-full md:col-span-2' : ''}
        hover:shadow-[6px_6px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5
      `}
      onClick={onToggleExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleExpand();
        }
      }}
      aria-expanded={isExpanded}
      aria-label={`${example.title} - ${isExpanded ? 'Click to collapse' : 'Click for details'}`}
    >
      {/* Thumbnail with gradient background */}
      <div
        className="h-32 relative overflow-hidden"
        style={{ background: example.thumbnailUrl }}
      >
        {/* Genre badge */}
        <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-comic px-2 py-0.5 uppercase">
          {example.genre}
        </div>

        {/* Page count badge */}
        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-comic px-2 py-0.5 border border-black">
          {example.pageCount} PAGES
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
          <h3 className="font-comic text-white text-lg font-bold leading-tight drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
            {example.title}
          </h3>
          {example.tagline && (
            <p className="text-white/80 text-[10px] font-comic italic mt-0.5">
              "{example.tagline}"
            </p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="p-3">
        {/* Hero and style info */}
        <div className="flex items-center gap-2 text-[10px] font-comic text-gray-600 mb-2">
          <span className="bg-gray-100 px-1.5 py-0.5 border border-gray-300">
            {example.artStyle}
          </span>
          <span className="truncate" title={example.heroName}>
            Hero: {example.heroName}
          </span>
        </div>

        {/* Description - truncated or full based on expansion */}
        <p className={`text-xs font-comic text-gray-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {example.description}
        </p>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {/* Themes */}
            {example.themes && example.themes.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] font-comic text-gray-500 uppercase">Themes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {example.themes.map((theme) => (
                    <span
                      key={theme}
                      className="bg-purple-100 text-purple-800 text-[9px] font-comic px-1.5 py-0.5 border border-purple-200"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Creation date */}
            <div className="text-[10px] font-comic text-gray-400 mb-3">
              Created: {new Date(example.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            {/* Action button */}
            <button
              onClick={handleTrySimilar}
              className="w-full comic-btn bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs py-2 px-3
                       border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)]
                       hover:from-blue-400 hover:to-purple-500 hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)]
                       active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,0.3)]
                       font-comic uppercase font-bold"
              aria-label={`Create a comic similar to ${example.title}`}
            >
              Try Similar
            </button>
          </div>
        )}

        {/* Expand hint when collapsed */}
        {!isExpanded && (
          <div className="mt-2 text-[9px] font-comic text-gray-400 text-center">
            Click for details
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ExampleComicsGallery component displays a grid of example comics
 * to inspire new users and demonstrate what the app can create.
 */
export const ExampleComicsGallery: React.FC<ExampleComicsGalleryProps> = ({
  onSelectExample,
  onTrySimilar,
  compact = false,
  className = '',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (compact) {
    // Compact mode: horizontal scrollable list
    return (
      <div className={`${className}`}>
        <h3 className="font-comic text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
          <span>Example Comics for Inspiration</span>
          <span className="text-[10px] font-normal text-gray-500">({EXAMPLE_COMICS.length} examples)</span>
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
          {EXAMPLE_COMICS.map((example) => (
            <button
              key={example.id}
              onClick={() => {
                if (onTrySimilar) {
                  onTrySimilar(getSettingsFromExample(example));
                } else if (onSelectExample) {
                  onSelectExample(example);
                }
              }}
              className="flex-shrink-0 w-40 border-2 border-black bg-white p-2 text-left
                       shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.3)]
                       transition-all hover:-translate-y-0.5"
              aria-label={`Try similar to ${example.title}`}
            >
              <div
                className="h-16 mb-2 border border-black"
                style={{ background: example.thumbnailUrl }}
              />
              <div className="font-comic text-[11px] font-bold truncate">{example.title}</div>
              <div className="font-comic text-[9px] text-gray-500 truncate">{example.genre}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full mode: responsive grid
  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <h2 className="font-comic text-lg font-bold text-gray-800 uppercase flex items-center gap-2">
          <span className="text-2xl">&#128214;</span>
          Example Comics Gallery
        </h2>
        <p className="font-comic text-xs text-gray-600 mt-1">
          Explore these examples to see what you can create. Click "Try Similar" to start with pre-filled settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {EXAMPLE_COMICS.map((example) => (
          <ExampleComicCard
            key={example.id}
            example={example}
            onSelect={onSelectExample}
            onTrySimilar={onTrySimilar}
            isExpanded={expandedId === example.id}
            onToggleExpand={() => handleToggleExpand(example.id)}
          />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-4 p-3 bg-yellow-50 border-2 border-dashed border-yellow-400 text-center">
        <p className="font-comic text-[11px] text-yellow-800">
          <strong>Note:</strong> These are sample stories to inspire your creativity.
          Your comics will be uniquely generated based on your characters and story settings!
        </p>
      </div>
    </div>
  );
};

export default ExampleComicsGallery;
