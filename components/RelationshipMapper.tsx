/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Tooltip } from './Tooltip';
import { HelpTooltip } from './HelpTooltip';

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

/**
 * Types of relationships between characters
 */
export type RelationshipType =
  | 'ally'
  | 'rival'
  | 'mentor'
  | 'student'
  | 'family'
  | 'friend'
  | 'enemy'
  | 'love-interest'
  | 'colleague'
  | 'nemesis'
  | 'former-ally';

/**
 * Character relationship definition
 */
export interface CharacterRelationship {
  /** ID of the character this relationship is FROM */
  fromCharacterId: string;
  /** ID of the character this relationship is TO */
  toCharacterId: string;
  /** Type of relationship */
  type: RelationshipType;
  /** Optional description of the relationship */
  description?: string;
  /** Intensity of the relationship (1=weak, 2=moderate, 3=strong) */
  intensity: 1 | 2 | 3;
}

/**
 * Simplified character data for the mapper
 */
export interface RelationshipCharacter {
  id: string;
  name: string;
  role: string;
  portraitUrl?: string;
}

// ============================================================================
// RELATIONSHIP METADATA
// ============================================================================

/**
 * Relationship type metadata with icons and colors
 */
interface RelationshipTypeInfo {
  value: RelationshipType;
  label: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
}

const RELATIONSHIP_TYPES: RelationshipTypeInfo[] = [
  { value: 'ally', label: 'Ally', icon: '\uD83D\uDCAA', description: 'Fighting alongside each other', color: 'text-green-700', bgColor: 'bg-green-100' },
  { value: 'rival', label: 'Rival', icon: '\u2694\uFE0F', description: 'Competitive but not hostile', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  { value: 'mentor', label: 'Mentor', icon: '\uD83D\uDCDA', description: 'Teacher and guide', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { value: 'student', label: 'Student', icon: '\uD83C\uDF93', description: 'Learning from another', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  { value: 'family', label: 'Family', icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67', description: 'Blood or chosen family', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  { value: 'friend', label: 'Friend', icon: '\uD83E\uDD1D', description: 'Close personal bond', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  { value: 'enemy', label: 'Enemy', icon: '\uD83D\uDCA2', description: 'Open hostility', color: 'text-red-700', bgColor: 'bg-red-100' },
  { value: 'love-interest', label: 'Love Interest', icon: '\u2764\uFE0F', description: 'Romantic connection', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  { value: 'colleague', label: 'Colleague', icon: '\uD83D\uDC54', description: 'Professional relationship', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  { value: 'nemesis', label: 'Nemesis', icon: '\uD83D\uDD25', description: 'Arch-enemy, deeply personal', color: 'text-red-800', bgColor: 'bg-red-200' },
  { value: 'former-ally', label: 'Former Ally', icon: '\uD83D\uDC94', description: 'Once allies, now estranged', color: 'text-amber-700', bgColor: 'bg-amber-100' },
];

/**
 * Get relationship type info by value
 */
function getRelationshipInfo(type: RelationshipType): RelationshipTypeInfo {
  return RELATIONSHIP_TYPES.find(r => r.value === type) || RELATIONSHIP_TYPES[0];
}

/**
 * Intensity labels
 */
const INTENSITY_LABELS: Record<1 | 2 | 3, { label: string; description: string }> = {
  1: { label: 'Weak', description: 'A casual or new connection' },
  2: { label: 'Moderate', description: 'An established relationship' },
  3: { label: 'Strong', description: 'A deep, significant bond' },
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface RelationshipMapperProps {
  /** List of characters available for relationships */
  characters: RelationshipCharacter[];
  /** Current relationships */
  relationships: CharacterRelationship[];
  /** Handler for adding a new relationship */
  onAddRelationship: (rel: CharacterRelationship) => void;
  /** Handler for removing a relationship */
  onRemoveRelationship: (fromId: string, toId: string) => void;
  /** Handler for updating an existing relationship */
  onUpdateRelationship: (rel: CharacterRelationship) => void;
  /** Whether the component is in read-only mode */
  readOnly?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Character portrait with fallback
 */
const CharacterAvatar: React.FC<{
  character: RelationshipCharacter;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
}> = ({ character, size = 'md', selected = false, onClick }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const borderClasses = selected
    ? 'border-4 border-yellow-400 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]'
    : 'border-2 border-black';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`${sizeClasses[size]} ${borderClasses} overflow-hidden transition-all ${
        onClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default'
      } ${selected ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}`}
      aria-label={`Select ${character.name}`}
      title={character.name}
    >
      {character.portraitUrl ? (
        <img
          src={character.portraitUrl.startsWith('data:') ? character.portraitUrl : `data:image/jpeg;base64,${character.portraitUrl}`}
          alt={character.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-300 flex items-center justify-center font-comic text-lg uppercase text-gray-600">
          {character.name.charAt(0)}
        </div>
      )}
    </button>
  );
};

/**
 * Relationship badge showing type and intensity
 */
const RelationshipBadge: React.FC<{
  relationship: CharacterRelationship;
  toCharacter: RelationshipCharacter;
  onEdit?: () => void;
  onRemove?: () => void;
  readOnly?: boolean;
}> = ({ relationship, toCharacter, onEdit, onRemove, readOnly }) => {
  const info = getRelationshipInfo(relationship.type);
  const intensityDots = Array.from({ length: 3 }, (_, i) => (
    <span
      key={i}
      className={`inline-block w-2 h-2 rounded-full ${
        i < relationship.intensity ? 'bg-yellow-500' : 'bg-gray-300'
      }`}
    />
  ));

  return (
    <div
      className={`${info.bgColor} border-2 border-black p-2 flex items-center gap-2 group transition-all hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)]`}
    >
      {/* To character avatar */}
      <CharacterAvatar character={toCharacter} size="sm" />

      {/* Relationship info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{info.icon}</span>
          <span className={`font-comic text-xs font-bold uppercase ${info.color}`}>
            {info.label}
          </span>
        </div>
        <p className="font-comic text-[10px] text-gray-600 truncate">
          {toCharacter.name}
        </p>
        <div className="flex gap-0.5 mt-0.5">{intensityDots}</div>
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="comic-btn bg-blue-500 text-white text-[10px] px-1.5 py-0.5 border border-black hover:bg-blue-400"
              aria-label={`Edit relationship with ${toCharacter.name}`}
            >
              Edit
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="comic-btn bg-red-500 text-white text-[10px] px-1.5 py-0.5 border border-black hover:bg-red-400"
              aria-label={`Remove relationship with ${toCharacter.name}`}
            >
              X
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Form for adding/editing a relationship
 */
const RelationshipForm: React.FC<{
  fromCharacter: RelationshipCharacter;
  characters: RelationshipCharacter[];
  existingRelationships: CharacterRelationship[];
  initialRelationship?: CharacterRelationship;
  onSave: (rel: CharacterRelationship) => void;
  onCancel: () => void;
}> = ({ fromCharacter, characters, existingRelationships, initialRelationship, onSave, onCancel }) => {
  const [toCharacterId, setToCharacterId] = useState(initialRelationship?.toCharacterId || '');
  const [type, setType] = useState<RelationshipType>(initialRelationship?.type || 'ally');
  const [intensity, setIntensity] = useState<1 | 2 | 3>(initialRelationship?.intensity || 2);
  const [description, setDescription] = useState(initialRelationship?.description || '');

  // Get available characters (exclude self and existing relationships unless editing)
  const availableCharacters = useMemo(() => {
    return characters.filter(c => {
      if (c.id === fromCharacter.id) return false;
      // If editing, allow the current target
      if (initialRelationship && c.id === initialRelationship.toCharacterId) return true;
      // Otherwise, exclude existing relationships
      return !existingRelationships.some(
        r => r.fromCharacterId === fromCharacter.id && r.toCharacterId === c.id
      );
    });
  }, [characters, fromCharacter.id, existingRelationships, initialRelationship]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!toCharacterId) return;

    onSave({
      fromCharacterId: fromCharacter.id,
      toCharacterId,
      type,
      intensity,
      description: description.trim() || undefined,
    });
  }, [fromCharacter.id, toCharacterId, type, intensity, description, onSave]);

  const selectedTypeInfo = getRelationshipInfo(type);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border-2 border-black bg-yellow-50">
      <h4 className="font-comic text-sm font-bold uppercase text-gray-800 flex items-center gap-2">
        {initialRelationship ? 'Edit Relationship' : 'Add Relationship'}
        <span className="text-base">{selectedTypeInfo.icon}</span>
      </h4>

      {/* Target character */}
      <div>
        <label className="font-comic text-xs font-bold text-gray-600 uppercase mb-1 block">
          To Character <span className="text-red-600">*</span>
        </label>
        <select
          value={toCharacterId}
          onChange={(e) => setToCharacterId(e.target.value)}
          className="w-full p-2 border-2 border-black font-comic text-sm bg-white"
          required
          disabled={!!initialRelationship}
          aria-label="Select target character"
        >
          <option value="">Select character...</option>
          {availableCharacters.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.role})
            </option>
          ))}
        </select>
      </div>

      {/* Relationship type */}
      <div>
        <label className="font-comic text-xs font-bold text-gray-600 uppercase mb-1 block">
          Relationship Type <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {RELATIONSHIP_TYPES.map(rt => (
            <button
              key={rt.value}
              type="button"
              onClick={() => setType(rt.value)}
              className={`p-2 border-2 border-black font-comic text-[10px] sm:text-xs transition-all ${
                type === rt.value
                  ? `${rt.bgColor} ${rt.color} font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.2)]`
                  : 'bg-white hover:bg-gray-50'
              }`}
              title={rt.description}
            >
              <span className="text-sm block mb-0.5">{rt.icon}</span>
              {rt.label}
            </button>
          ))}
        </div>
        <p className="font-comic text-[10px] text-gray-500 mt-1">
          {selectedTypeInfo.description}
        </p>
      </div>

      {/* Intensity */}
      <div>
        <label className="font-comic text-xs font-bold text-gray-600 uppercase mb-1 block">
          Intensity
        </label>
        <div className="flex gap-2">
          {([1, 2, 3] as const).map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setIntensity(i)}
              className={`flex-1 p-2 border-2 border-black font-comic text-xs transition-all ${
                intensity === i
                  ? 'bg-yellow-400 font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-center gap-0.5 mb-1">
                {Array.from({ length: 3 }, (_, idx) => (
                  <span
                    key={idx}
                    className={`inline-block w-2 h-2 rounded-full ${
                      idx < i ? 'bg-yellow-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              {INTENSITY_LABELS[i].label}
            </button>
          ))}
        </div>
        <p className="font-comic text-[10px] text-gray-500 mt-1">
          {INTENSITY_LABELS[intensity].description}
        </p>
      </div>

      {/* Optional description */}
      <div>
        <label className="font-comic text-xs font-bold text-gray-600 uppercase mb-1 block">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this relationship... (e.g., 'Met during the war', 'Childhood friends')"
          className="w-full p-2 border-2 border-black font-comic text-xs h-16 resize-none"
          aria-label="Relationship description"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="comic-btn flex-1 bg-gray-400 text-white px-3 py-2 font-bold border-2 border-black hover:bg-gray-300 uppercase text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!toCharacterId}
          className="comic-btn flex-1 bg-green-500 text-white px-3 py-2 font-bold border-2 border-black hover:bg-green-400 uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initialRelationship ? 'Update' : 'Add'} Relationship
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * RelationshipMapper component for defining and visualizing character relationships.
 * Allows users to create, edit, and remove relationships between characters in their cast.
 */
export const RelationshipMapper: React.FC<RelationshipMapperProps> = ({
  characters,
  relationships,
  onAddRelationship,
  onRemoveRelationship,
  onUpdateRelationship,
  readOnly = false,
}) => {
  // State
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<CharacterRelationship | null>(null);

  // Get selected character
  const selectedCharacter = useMemo(() => {
    return characters.find(c => c.id === selectedCharacterId) || null;
  }, [characters, selectedCharacterId]);

  // Get relationships for selected character
  const selectedCharacterRelationships = useMemo(() => {
    if (!selectedCharacterId) return [];
    return relationships.filter(r => r.fromCharacterId === selectedCharacterId);
  }, [relationships, selectedCharacterId]);

  // Get character by ID helper
  const getCharacterById = useCallback((id: string) => {
    return characters.find(c => c.id === id);
  }, [characters]);

  // Handler for selecting a character
  const handleCharacterSelect = useCallback((id: string) => {
    setSelectedCharacterId(prev => prev === id ? null : id);
    setShowAddForm(false);
    setEditingRelationship(null);
  }, []);

  // Handler for saving a relationship
  const handleSaveRelationship = useCallback((rel: CharacterRelationship) => {
    if (editingRelationship) {
      onUpdateRelationship(rel);
    } else {
      onAddRelationship(rel);
    }
    setShowAddForm(false);
    setEditingRelationship(null);
  }, [editingRelationship, onAddRelationship, onUpdateRelationship]);

  // Handler for removing a relationship
  const handleRemoveRelationship = useCallback((toId: string) => {
    if (selectedCharacterId) {
      onRemoveRelationship(selectedCharacterId, toId);
    }
  }, [selectedCharacterId, onRemoveRelationship]);

  // Handler for editing a relationship
  const handleEditRelationship = useCallback((rel: CharacterRelationship) => {
    setEditingRelationship(rel);
    setShowAddForm(true);
  }, []);

  // Cancel form
  const handleCancelForm = useCallback(() => {
    setShowAddForm(false);
    setEditingRelationship(null);
  }, []);

  // Check if we can add more relationships
  const canAddMore = useMemo(() => {
    if (!selectedCharacter) return false;
    // Can add if there are characters without relationships
    const relatedIds = new Set(selectedCharacterRelationships.map(r => r.toCharacterId));
    return characters.some(c => c.id !== selectedCharacterId && !relatedIds.has(c.id));
  }, [selectedCharacter, selectedCharacterRelationships, characters, selectedCharacterId]);

  // Empty state
  if (characters.length < 2) {
    return (
      <div className="p-6 border-4 border-gray-300 bg-gray-50 text-center">
        <p className="font-comic text-lg text-gray-500 uppercase mb-2">
          Relationship Mapper
        </p>
        <p className="font-comic text-sm text-gray-400">
          Add at least 2 characters to define relationships between them.
        </p>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b-4 border-black bg-yellow-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-comic text-lg sm:text-xl uppercase font-bold text-black">
              Character Relationships
            </h3>
            <HelpTooltip
              title="Character Relationships"
              text="Define how your characters relate to each other. These relationships will influence story generation, dialogue, and character interactions."
              position="right"
            />
          </div>
          <span className="font-comic text-xs text-gray-700 bg-white px-2 py-1 border border-black">
            {relationships.length} relationship{relationships.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Character Selection */}
      <div className="p-3 sm:p-4 border-b-2 border-gray-200 bg-gray-50">
        <p className="font-comic text-xs font-bold text-gray-600 uppercase mb-2">
          Select a character to view/edit their relationships
        </p>
        <div className="flex flex-wrap gap-3">
          {characters.map(char => {
            const charRelCount = relationships.filter(r => r.fromCharacterId === char.id).length;
            return (
              <div key={char.id} className="flex flex-col items-center">
                <CharacterAvatar
                  character={char}
                  size="md"
                  selected={selectedCharacterId === char.id}
                  onClick={() => handleCharacterSelect(char.id)}
                />
                <p className="font-comic text-[10px] text-gray-600 mt-1 max-w-[64px] text-center truncate">
                  {char.name}
                </p>
                {charRelCount > 0 && (
                  <span className="font-comic text-[10px] bg-yellow-400 px-1.5 py-0.5 border border-black">
                    {charRelCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Character Relationships */}
      {selectedCharacter && (
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CharacterAvatar character={selectedCharacter} size="sm" />
              <div>
                <p className="font-comic text-sm font-bold uppercase">{selectedCharacter.name}</p>
                <p className="font-comic text-[10px] text-gray-500">{selectedCharacter.role}</p>
              </div>
            </div>
            {!readOnly && canAddMore && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="comic-btn bg-green-500 text-white text-xs px-3 py-1.5 font-bold border-2 border-black hover:bg-green-400 uppercase"
              >
                + Add Relationship
              </button>
            )}
          </div>

          {/* Relationship form */}
          {showAddForm && selectedCharacter && (
            <div className="mb-4">
              <RelationshipForm
                fromCharacter={selectedCharacter}
                characters={characters}
                existingRelationships={relationships}
                initialRelationship={editingRelationship || undefined}
                onSave={handleSaveRelationship}
                onCancel={handleCancelForm}
              />
            </div>
          )}

          {/* Relationships list */}
          {selectedCharacterRelationships.length > 0 ? (
            <div className="space-y-2">
              {selectedCharacterRelationships.map(rel => {
                const toChar = getCharacterById(rel.toCharacterId);
                if (!toChar) return null;
                return (
                  <RelationshipBadge
                    key={`${rel.fromCharacterId}-${rel.toCharacterId}`}
                    relationship={rel}
                    toCharacter={toChar}
                    onEdit={() => handleEditRelationship(rel)}
                    onRemove={() => handleRemoveRelationship(rel.toCharacterId)}
                    readOnly={readOnly}
                  />
                );
              })}
            </div>
          ) : !showAddForm ? (
            <div className="p-4 border-2 border-dashed border-gray-300 text-center bg-gray-50">
              <p className="font-comic text-sm text-gray-500">
                No relationships defined for {selectedCharacter.name}
              </p>
              {!readOnly && canAddMore && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="comic-btn mt-2 bg-yellow-400 text-black text-xs px-3 py-1.5 font-bold border-2 border-black hover:bg-yellow-300 uppercase"
                >
                  Add First Relationship
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* No selection state */}
      {!selectedCharacter && (
        <div className="p-6 text-center">
          <p className="font-comic text-sm text-gray-500">
            Click on a character above to view or edit their relationships
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT HELPERS FOR STORY GENERATION
// ============================================================================

/**
 * Format relationships for story generation prompts.
 * Creates a structured text description of all relationships.
 */
export function formatRelationshipsForPrompt(
  relationships: CharacterRelationship[],
  characters: RelationshipCharacter[]
): string {
  if (relationships.length === 0) return '';

  const getCharName = (id: string) => characters.find(c => c.id === id)?.name || 'Unknown';

  const lines = relationships.map(rel => {
    const fromName = getCharName(rel.fromCharacterId);
    const toName = getCharName(rel.toCharacterId);
    const info = getRelationshipInfo(rel.type);
    const intensityLabel = INTENSITY_LABELS[rel.intensity].label.toLowerCase();

    let line = `${fromName} -> ${toName}: ${info.label} (${intensityLabel})`;
    if (rel.description) {
      line += ` - "${rel.description}"`;
    }
    return line;
  });

  return `
CHARACTER RELATIONSHIPS:
${lines.map(l => `- ${l}`).join('\n')}

Use these relationships to inform character interactions, dialogue tone, and story dynamics.
`.trim();
}

/**
 * Get a summary of relationships for a specific character.
 */
export function getCharacterRelationshipSummary(
  characterId: string,
  relationships: CharacterRelationship[],
  characters: RelationshipCharacter[]
): string {
  const getCharName = (id: string) => characters.find(c => c.id === id)?.name || 'Unknown';
  const charName = getCharName(characterId);

  const outgoing = relationships.filter(r => r.fromCharacterId === characterId);
  const incoming = relationships.filter(r => r.toCharacterId === characterId);

  if (outgoing.length === 0 && incoming.length === 0) {
    return `${charName} has no defined relationships.`;
  }

  const parts: string[] = [];

  outgoing.forEach(rel => {
    const toName = getCharName(rel.toCharacterId);
    const info = getRelationshipInfo(rel.type);
    parts.push(`${info.icon} ${info.label} of ${toName}`);
  });

  incoming.forEach(rel => {
    const fromName = getCharName(rel.fromCharacterId);
    const info = getRelationshipInfo(rel.type);
    // Reverse the relationship description for incoming
    const reverseLabel = rel.type === 'mentor' ? 'Student' :
                         rel.type === 'student' ? 'Mentor' :
                         info.label;
    parts.push(`${fromName}'s ${reverseLabel}`);
  });

  return `${charName}: ${parts.join(', ')}`;
}

export default RelationshipMapper;
