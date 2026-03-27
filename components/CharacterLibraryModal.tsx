/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCharacterLibraryStore, LibraryCharacter } from '../stores/useCharacterLibraryStore';
import { Persona, CharacterProfile } from '../types';

export interface CharacterLibraryModalProps {
  onClose: () => void;
  onSelectCharacter: (persona: Persona, profile?: CharacterProfile) => void;
  title?: string;
}

/**
 * Modal for browsing and selecting characters from the library
 */
export const CharacterLibraryModal: React.FC<CharacterLibraryModalProps> = ({
  onClose,
  onSelectCharacter,
  title = 'Character Library'
}) => {
  const { savedCharacters, deleteCharacter, searchCharacters, getAllTags } = useCharacterLibraryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => getAllTags(), [getAllTags]);

  // Filter characters based on search and tag
  const filteredCharacters = useMemo(() => {
    let results = searchQuery ? searchCharacters(searchQuery) : savedCharacters;

    if (selectedTag) {
      results = results.filter(c => c.tags?.includes(selectedTag));
    }

    // Sort by savedAt (most recent first)
    return [...results].sort((a, b) => b.savedAt - a.savedAt);
  }, [savedCharacters, searchQuery, selectedTag, searchCharacters]);

  const selectedCharacter = selectedCharacterId
    ? savedCharacters.find(c => c.id === selectedCharacterId)
    : null;

  const handleLoadCharacter = () => {
    if (selectedCharacter) {
      onSelectCharacter(selectedCharacter.persona, selectedCharacter.profile);
      onClose();
    }
  };

  const handleDeleteCharacter = (id: string) => {
    deleteCharacter(id);
    setConfirmDeleteId(null);
    if (selectedCharacterId === id) {
      setSelectedCharacterId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-title"
    >
      <div
        className="bg-indigo-950 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-indigo-900 border-b-4 border-black px-6 py-4 flex justify-between items-center shrink-0">
          <h2 id="library-title" className="font-comic text-2xl font-bold uppercase tracking-wider text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="comic-btn bg-red-600 text-white w-10 h-10 flex items-center justify-center font-bold text-xl border-3 border-black hover:bg-red-500"
            aria-label="Close library"
          >
            X
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 py-4 bg-indigo-900/50 border-b-2 border-black/50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-4 py-2 bg-indigo-800 text-white border-2 border-black rounded font-comic placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label="Search characters"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-white text-sm font-comic">Tag:</label>
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="px-3 py-2 bg-indigo-800 text-white border-2 border-black rounded font-comic focus:outline-none focus:ring-2 focus:ring-yellow-400"
                aria-label="Filter by tag"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-indigo-300 text-sm font-comic self-center">
            {filteredCharacters.length} character{filteredCharacters.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Character Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-indigo-300 font-comic text-lg">
                {savedCharacters.length === 0
                  ? 'Your library is empty. Save characters from the setup screen!'
                  : 'No characters match your search.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredCharacters.map(character => (
                <div
                  key={character.id}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    selectedCharacterId === character.id ? 'scale-105' : ''
                  }`}
                  onClick={() => setSelectedCharacterId(character.id)}
                >
                  <div
                    className={`border-4 shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden bg-gray-900 rounded-sm transition-colors ${
                      selectedCharacterId === character.id
                        ? 'border-yellow-400 ring-4 ring-yellow-400/50'
                        : 'border-white hover:border-indigo-400'
                    }`}
                  >
                    {/* Portrait */}
                    <div className="aspect-square bg-indigo-900 flex items-center justify-center overflow-hidden">
                      {character.persona.portrait ? (
                        <img
                          src={character.persona.portrait}
                          alt={character.persona.name || 'Character'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-6xl">👤</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-indigo-800">
                      <h3 className="font-comic font-bold text-white text-sm truncate">
                        {character.persona.name || 'Unnamed'}
                      </h3>
                      <p className="text-indigo-300 text-xs font-comic truncate">
                        {character.persona.role || 'No role'}
                      </p>
                      <p className="text-indigo-400 text-xs mt-1">
                        {formatDate(character.savedAt)}
                      </p>
                    </div>

                    {/* Tags */}
                    {character.tags && character.tags.length > 0 && (
                      <div className="px-3 pb-2 flex flex-wrap gap-1 bg-indigo-800">
                        {character.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded font-comic"
                          >
                            {tag}
                          </span>
                        ))}
                        {character.tags.length > 2 && (
                          <span className="text-xs text-indigo-400">+{character.tags.length - 2}</span>
                        )}
                      </div>
                    )}

                    {/* Profile indicator */}
                    {character.profile && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold border-2 border-black">
                        Profile
                      </div>
                    )}

                    {/* Selection indicator */}
                    {selectedCharacterId === character.id && (
                      <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                        <span className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-full font-comic text-sm border-2 border-black">
                          SELECTED
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(character.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-black hover:bg-red-400 z-10"
                    aria-label={`Delete ${character.persona.name || 'character'}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="px-6 py-4 bg-indigo-900 border-t-4 border-black flex justify-between items-center shrink-0">
          <div className="text-indigo-300 text-sm font-comic">
            {selectedCharacter && (
              <span>
                Selected: <strong className="text-white">{selectedCharacter.persona.name || 'Unnamed'}</strong>
                {selectedCharacter.profile && ' (with profile)'}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="comic-btn bg-gray-600 text-white px-6 py-2 border-3 border-black font-bold uppercase tracking-wider text-sm hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleLoadCharacter}
              disabled={!selectedCharacter}
              className={`comic-btn px-6 py-2 border-3 border-black font-bold uppercase tracking-wider text-sm ${
                selectedCharacter
                  ? 'bg-green-500 text-white hover:bg-green-400'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              aria-disabled={!selectedCharacter}
            >
              Load Character
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-indigo-950 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] p-6 max-w-sm">
            <h3 className="font-comic text-xl font-bold text-white mb-4">Delete Character?</h3>
            <p className="text-indigo-300 mb-6">
              This will permanently remove this character from your library.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="comic-btn bg-gray-600 text-white px-4 py-2 border-2 border-black font-bold text-sm hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCharacter(confirmDeleteId)}
                className="comic-btn bg-red-500 text-white px-4 py-2 border-2 border-black font-bold text-sm hover:bg-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterLibraryModal;
