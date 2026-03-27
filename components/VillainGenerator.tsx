/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { VillainPersona, VillainRelationship, ThreatLevel, CHARACTER_ROLES, CharacterRole, EmblemPlacement, EMBLEM_PLACEMENTS } from '../types';
import {
  VILLAIN_ARCHETYPES,
  VillainArchetype,
  getMotivationsForRelationship,
  getWeaknessesForThreatLevel,
  getArchetypeById
} from '../data/villainTemplates';
import { Tooltip } from './Tooltip';
import { HelpTooltip } from './HelpTooltip';

/**
 * Props for the VillainGenerator component
 */
export interface VillainGeneratorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Handler when a villain is created */
  onVillainCreated: (villain: VillainPersona) => void;
  /** Optional: Handler for uploading portrait */
  onPortraitUpload?: (file: File) => Promise<string>;
  /** Optional: Handler for AI text improvement */
  onImproveText?: (text: string, context?: string, purpose?: 'backstory') => Promise<string>;
  /** The hero's name (for relationship context) */
  heroName?: string;
}

/**
 * Relationship type labels and descriptions
 */
const RELATIONSHIP_OPTIONS: { value: VillainRelationship; label: string; description: string; icon: string }[] = [
  { value: 'rival', label: 'Rival', description: 'Competitive relationship with similar goals but different methods', icon: '🤜' },
  { value: 'nemesis', label: 'Nemesis', description: 'Arch-enemy with a personal vendetta against the hero', icon: '💀' },
  { value: 'former-ally', label: 'Former Ally', description: 'Once friends, now enemies due to betrayal or ideology', icon: '💔' },
  { value: 'mirror', label: 'Mirror', description: 'Dark reflection of the hero with similar powers but different choices', icon: '🪞' },
  { value: 'oppressor', label: 'Oppressor', description: 'Powerful tyrant that the hero must stand against', icon: '👑' }
];

/**
 * Threat level labels and descriptions
 */
const THREAT_LEVEL_OPTIONS: { value: ThreatLevel; label: string; description: string; color: string }[] = [
  { value: 'minion', label: 'Minion', description: 'Low-level threat, easily defeated, serves a greater villain', color: 'bg-gray-400' },
  { value: 'lieutenant', label: 'Lieutenant', description: 'Mid-tier threat, commands minions, answers to the boss', color: 'bg-yellow-500' },
  { value: 'boss', label: 'Boss', description: 'Major threat for a story arc, significant challenge', color: 'bg-orange-500' },
  { value: 'arch-nemesis', label: 'Arch-Nemesis', description: 'Ultimate enemy, recurring threat across stories', color: 'bg-red-600' }
];

/**
 * Generate a unique ID for the villain
 */
function generateId(): string {
  return `villain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * VillainGenerator Modal Component
 * Allows users to create villain personas with archetypes, relationships, and motivations
 */
export const VillainGenerator: React.FC<VillainGeneratorProps> = ({
  isOpen,
  onClose,
  onVillainCreated,
  onPortraitUpload,
  onImproveText,
  heroName
}) => {
  // Form state
  const [name, setName] = useState('');
  const [portraitBase64, setPortraitBase64] = useState('');
  const [backstoryText, setBackstoryText] = useState('');
  const [relationshipToHero, setRelationshipToHero] = useState<VillainRelationship>('nemesis');
  const [motivation, setMotivation] = useState('');
  const [weakness, setWeakness] = useState('');
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('boss');
  const [primaryPower, setPrimaryPower] = useState('');
  const [catchphrase, setCatchphrase] = useState('');
  const [role, setRole] = useState<CharacterRole>('Villain');
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string | null>(null);

  // Reference images
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [emblemImage, setEmblemImage] = useState<string>('');
  const [emblemPlacement, setEmblemPlacement] = useState<EmblemPlacement | undefined>(undefined);
  const [weaponImage, setWeaponImage] = useState<string>('');
  const [weaponDescriptionText, setWeaponDescriptionText] = useState('');

  // UI state
  const [isImprovingText, setIsImprovingText] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get suggestions based on current selections
  const motivationSuggestions = getMotivationsForRelationship(relationshipToHero);
  const weaknessSuggestions = getWeaknessesForThreatLevel(threatLevel);
  const selectedArchetype = selectedArchetypeId ? getArchetypeById(selectedArchetypeId) : null;

  /**
   * Handle archetype selection - prefill fields
   */
  const handleArchetypeSelect = useCallback((archetype: VillainArchetype) => {
    setSelectedArchetypeId(archetype.id);
    setBackstoryText(archetype.backstoryTemplate);
    setRelationshipToHero(archetype.suggestedRelationship);
    setThreatLevel(archetype.suggestedThreatLevel);
    // Pick a random motivation and weakness from the archetype
    const randomMotivation = archetype.commonMotivations[Math.floor(Math.random() * archetype.commonMotivations.length)];
    const randomWeakness = archetype.commonWeaknesses[Math.floor(Math.random() * archetype.commonWeaknesses.length)];
    setMotivation(randomMotivation || '');
    setWeakness(randomWeakness || '');
    setPrimaryPower(archetype.typicalPowers[0] || '');
  }, []);

  /**
   * Handle portrait file upload
   */
  const handlePortraitUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onPortraitUpload) {
      const base64 = await onPortraitUpload(file);
      setPortraitBase64(base64);
    } else {
      // Fallback: read file directly
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        setPortraitBase64(base64);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [onPortraitUpload]);

  /**
   * Handle reference image upload
   */
  const handleRefUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        setReferenceImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  /**
   * Handle emblem upload
   */
  const handleEmblemUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      setEmblemImage(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  /**
   * Handle weapon upload
   */
  const handleWeaponUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      setWeaponImage(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  /**
   * Handle AI text improvement
   */
  const handleImproveBackstory = useCallback(async () => {
    if (!onImproveText || !backstoryText.trim()) return;

    setIsImprovingText(true);
    try {
      const context = heroName ? `This villain is the ${relationshipToHero} of ${heroName}.` : undefined;
      const improved = await onImproveText(backstoryText, context, 'backstory');
      setBackstoryText(improved);
    } catch (error) {
      console.error('Failed to improve backstory:', error);
    } finally {
      setIsImprovingText(false);
    }
  }, [onImproveText, backstoryText, heroName, relationshipToHero]);

  /**
   * Validate form before submission
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Villain name is required';
    }
    if (!motivation.trim()) {
      errors.motivation = 'Motivation is required';
    }
    if (!weakness.trim()) {
      errors.weakness = 'Weakness is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, motivation, weakness]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const villain: VillainPersona = {
      id: generateId(),
      name: name.trim(),
      base64: portraitBase64,
      desc: backstoryText.trim(),
      backstoryText: backstoryText.trim(),
      role,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      emblemImage: emblemImage || undefined,
      emblemPlacement,
      weaponImage: weaponImage || undefined,
      weaponDescriptionText: weaponDescriptionText || undefined,
      relationshipToHero,
      motivation: motivation.trim(),
      weakness: weakness.trim(),
      threatLevel,
      primaryPower: primaryPower.trim() || undefined,
      catchphrase: catchphrase.trim() || undefined
    };

    onVillainCreated(villain);
    handleReset();
    onClose();
  }, [
    name, portraitBase64, backstoryText, role, referenceImages, emblemImage,
    emblemPlacement, weaponImage, weaponDescriptionText, relationshipToHero,
    motivation, weakness, threatLevel, primaryPower, catchphrase,
    onVillainCreated, onClose, validateForm
  ]);

  /**
   * Reset form to initial state
   */
  const handleReset = useCallback(() => {
    setName('');
    setPortraitBase64('');
    setBackstoryText('');
    setRelationshipToHero('nemesis');
    setMotivation('');
    setWeakness('');
    setThreatLevel('boss');
    setPrimaryPower('');
    setCatchphrase('');
    setRole('Villain');
    setSelectedArchetypeId(null);
    setReferenceImages([]);
    setEmblemImage('');
    setEmblemPlacement(undefined);
    setWeaponImage('');
    setWeaponDescriptionText('');
    setValidationErrors({});
    setShowAdvanced(false);
    setShowPreview(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-[900px] w-full max-h-[95vh] bg-white border-[4px] sm:border-[6px] border-black shadow-[8px_8px_0px_rgba(0,0,0,0.5)] sm:shadow-[12px_12px_0px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b-4 border-black bg-red-600">
          <div>
            <h2 className="font-comic text-2xl sm:text-4xl text-white uppercase tracking-tighter flex items-center gap-2">
              <span>Villain Generator</span>
              <span className="text-3xl sm:text-4xl">💀</span>
            </h2>
            <p className="font-comic text-xs sm:text-sm text-red-100 mt-1">
              Create a formidable antagonist for your story
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 bg-black text-white w-8 h-8 sm:w-10 sm:h-10 border-2 border-white font-bold text-lg sm:text-xl flex items-center justify-center hover:scale-110 hover:bg-gray-800 transition-transform"
            aria-label="Close villain generator"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Archetype Selection */}
          <div>
            <p className="font-comic text-sm sm:text-base font-bold text-gray-700 uppercase mb-3 flex items-center">
              Quick Start: Choose an Archetype
              <HelpTooltip
                title="Villain Archetypes"
                text="Select a pre-built villain template to quickly fill in backstory, powers, and suggested relationship. You can customize everything after selection."
                position="right"
              />
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {VILLAIN_ARCHETYPES.map(archetype => (
                <button
                  key={archetype.id}
                  onClick={() => handleArchetypeSelect(archetype)}
                  className={`p-3 border-2 border-black font-comic text-left transition-all hover:scale-[1.02] ${
                    selectedArchetypeId === archetype.id
                      ? 'bg-red-100 border-red-600 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-2xl mb-1">{archetype.icon}</div>
                  <div className="font-bold text-xs sm:text-sm uppercase">{archetype.name}</div>
                  <div className="text-[10px] sm:text-xs text-gray-600 mt-1 line-clamp-2">{archetype.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left Column: Portrait and Basic Info */}
            <div className="space-y-4">

              {/* Portrait Upload */}
              <div>
                <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase flex items-center">
                  Villain Portrait
                  <HelpTooltip
                    title="Villain Portrait"
                    text="Upload a clear image of your villain. Front-facing with good lighting works best for AI consistency."
                    position="right"
                  />
                </p>
                {portraitBase64 ? (
                  <div className="flex gap-4 items-center">
                    <img
                      src={`data:image/jpeg;base64,${portraitBase64}`}
                      alt="Villain Portrait"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover border-4 border-red-600 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
                    />
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-xs sm:text-sm px-3 py-1.5 hover:bg-yellow-300 border-2 border-black uppercase text-center">
                        REPLACE
                        <input type="file" accept="image/*" className="hidden" onChange={handlePortraitUpload} />
                      </label>
                      <button
                        onClick={() => setPortraitBase64('')}
                        className="comic-btn bg-red-500 text-white text-xs sm:text-sm px-3 py-1.5 hover:bg-red-400 border-2 border-black uppercase"
                      >
                        CLEAR
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="comic-btn bg-red-600 text-white text-sm px-4 py-3 block w-full hover:bg-red-500 cursor-pointer text-center font-bold border-2 border-black">
                    UPLOAD VILLAIN PORTRAIT
                    <input type="file" accept="image/*" className="hidden" onChange={handlePortraitUpload} />
                  </label>
                )}
              </div>

              {/* Name */}
              <div>
                <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                  Villain Name <span className="text-red-600">*</span>
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Doctor Chaos, The Shadow King..."
                  className={`w-full p-2.5 font-comic text-sm ${validationErrors.name ? 'border-[3px] border-red-600' : 'border-2 border-black'}`}
                  aria-label="Villain name"
                  aria-invalid={!!validationErrors.name}
                />
                {validationErrors.name && (
                  <p className="font-comic text-xs text-red-600 mt-1">{validationErrors.name}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                  Character Role
                </p>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as CharacterRole)}
                  className="w-full p-2 border-2 border-black font-comic text-sm bg-white"
                  aria-label="Character role"
                >
                  {CHARACTER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Reference Images */}
              <div>
                <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase flex items-center">
                  Reference Images (Optional)
                  <Tooltip text="Upload costume designs, pose references, or style guides to help the AI maintain visual consistency." />
                </p>
                {referenceImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {referenceImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={`data:image/jpeg;base64,${img}`} alt={`Ref ${i+1}`} className="w-14 h-14 object-cover border-2 border-black" />
                        <button
                          onClick={() => setReferenceImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center border border-black opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="comic-btn bg-gray-400 text-white text-sm px-4 py-2 block w-full hover:bg-gray-500 cursor-pointer text-center border-2 border-black">
                  + ADD REFERENCE
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleRefUpload} />
                </label>
              </div>
            </div>

            {/* Right Column: Villain-Specific Fields */}
            <div className="space-y-4">

              {/* Relationship to Hero */}
              <div>
                <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase flex items-center">
                  Relationship to Hero <span className="text-red-600">*</span>
                  <HelpTooltip
                    title="Villain Relationship"
                    text="Defines how the villain relates to your hero narratively. This affects their interactions, motivations, and story dynamics."
                    position="right"
                  />
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RELATIONSHIP_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRelationshipToHero(opt.value)}
                      className={`p-2 border-2 border-black font-comic text-left transition-all text-xs sm:text-sm ${
                        relationshipToHero === opt.value
                          ? 'bg-red-100 border-red-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-1">{opt.icon}</span>
                      <span className="font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-comic">
                  {RELATIONSHIP_OPTIONS.find(o => o.value === relationshipToHero)?.description}
                </p>
              </div>

              {/* Threat Level */}
              <div>
                <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase flex items-center">
                  Threat Level <span className="text-red-600">*</span>
                  <Tooltip text="How dangerous is this villain? This affects their role in the story hierarchy." />
                </p>
                <div className="flex flex-wrap gap-2">
                  {THREAT_LEVEL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setThreatLevel(opt.value)}
                      className={`flex-1 min-w-[80px] p-2 border-2 border-black font-comic text-center transition-all text-xs sm:text-sm ${
                        threatLevel === opt.value
                          ? `${opt.color} text-white`
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-comic">
                  {THREAT_LEVEL_OPTIONS.find(o => o.value === threatLevel)?.description}
                </p>
              </div>

              {/* Motivation */}
              <div>
                <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                  Motivation <span className="text-red-600">*</span>
                </p>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="What drives this villain? What do they want?"
                  className={`w-full p-2 font-comic text-sm h-20 resize-none ${validationErrors.motivation ? 'border-[3px] border-red-600' : 'border-2 border-black'}`}
                  aria-label="Villain motivation"
                />
                {validationErrors.motivation && (
                  <p className="font-comic text-xs text-red-600 mt-1">{validationErrors.motivation}</p>
                )}
                {motivationSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-500 font-comic mb-1">Suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {motivationSuggestions.slice(0, 3).map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => setMotivation(suggestion)}
                          className="text-[10px] px-2 py-0.5 bg-gray-100 border border-gray-300 rounded font-comic hover:bg-gray-200 truncate max-w-[150px]"
                          title={suggestion}
                        >
                          {suggestion.slice(0, 30)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Weakness */}
              <div>
                <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                  Weakness / Fatal Flaw <span className="text-red-600">*</span>
                </p>
                <textarea
                  value={weakness}
                  onChange={(e) => setWeakness(e.target.value)}
                  placeholder="What is the villain's vulnerability?"
                  className={`w-full p-2 font-comic text-sm h-20 resize-none ${validationErrors.weakness ? 'border-[3px] border-red-600' : 'border-2 border-black'}`}
                  aria-label="Villain weakness"
                />
                {validationErrors.weakness && (
                  <p className="font-comic text-xs text-red-600 mt-1">{validationErrors.weakness}</p>
                )}
                {weaknessSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-500 font-comic mb-1">Suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {weaknessSuggestions.slice(0, 3).map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => setWeakness(suggestion)}
                          className="text-[10px] px-2 py-0.5 bg-gray-100 border border-gray-300 rounded font-comic hover:bg-gray-200 truncate max-w-[150px]"
                          title={suggestion}
                        >
                          {suggestion.slice(0, 30)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Backstory Section */}
          <div>
            <div className="flex items-start justify-between mb-2 gap-2">
              <p className="font-comic text-sm sm:text-base font-bold text-gray-800 uppercase flex items-center">
                Backstory / Description
                <Tooltip text="Provide the villain's history, origin, personality traits, and any other relevant details for the AI." />
              </p>
              {onImproveText && (
                <button
                  onClick={handleImproveBackstory}
                  disabled={isImprovingText || !backstoryText.trim()}
                  className="comic-btn bg-purple-600 text-white text-xs px-2.5 py-1 hover:bg-purple-500 border-2 border-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  title={backstoryText.trim() ? 'Improve backstory with AI' : 'Enter backstory text first'}
                >
                  {isImprovingText ? 'Improving...' : 'AI Improve'}
                </button>
              )}
            </div>
            <textarea
              value={backstoryText}
              onChange={(e) => setBackstoryText(e.target.value)}
              placeholder="Describe the villain's origin, powers, personality, history with the hero, key events that shaped them..."
              className="w-full p-3 border-2 border-black font-comic text-sm h-32 resize-none shadow-[3px_3px_0px_rgba(0,0,0,0.1)]"
            />
            {selectedArchetype && (
              <p className="text-[10px] text-gray-500 font-comic mt-1">
                Visual style suggestion: {selectedArchetype.visualStyle}
              </p>
            )}
          </div>

          {/* Advanced Options (Collapsible) */}
          <div className="border-2 border-gray-300 rounded">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3 bg-gray-100 font-comic text-sm font-bold uppercase flex items-center justify-between hover:bg-gray-200 transition-colors"
            >
              <span>Advanced Options</span>
              <span className="text-lg">{showAdvanced ? '−' : '+'}</span>
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-4 border-t-2 border-gray-300">

                {/* Primary Power */}
                <div>
                  <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                    Primary Power / Method
                  </p>
                  <input
                    type="text"
                    value={primaryPower}
                    onChange={(e) => setPrimaryPower(e.target.value)}
                    placeholder="e.g., Dark magic, Mind control, Super strength..."
                    className="w-full p-2 border-2 border-black font-comic text-sm"
                  />
                  {selectedArchetype && selectedArchetype.typicalPowers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedArchetype.typicalPowers.slice(0, 5).map((power, i) => (
                        <button
                          key={i}
                          onClick={() => setPrimaryPower(power)}
                          className="text-[10px] px-2 py-0.5 bg-red-50 border border-red-200 rounded font-comic hover:bg-red-100"
                        >
                          {power}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Catchphrase */}
                <div>
                  <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                    Signature Catchphrase (Optional)
                  </p>
                  <input
                    type="text"
                    value={catchphrase}
                    onChange={(e) => setCatchphrase(e.target.value)}
                    placeholder="e.g., 'You cannot escape your fate!' or 'Chaos is the only truth!'"
                    className="w-full p-2 border-2 border-black font-comic text-sm italic"
                  />
                </div>

                {/* Emblem Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                      Villain Symbol / Emblem
                    </p>
                    {emblemImage ? (
                      <div className="flex gap-2 items-center">
                        <img src={`data:image/jpeg;base64,${emblemImage}`} alt="Emblem" className="w-14 h-14 object-contain border-2 border-black" />
                        <div className="flex flex-col gap-1">
                          <label className="comic-btn bg-yellow-400 text-black text-[10px] px-2 py-1 cursor-pointer border border-black uppercase text-center">
                            Replace
                            <input type="file" accept="image/*" className="hidden" onChange={handleEmblemUpload} />
                          </label>
                          <button onClick={() => setEmblemImage('')} className="comic-btn bg-red-500 text-white text-[10px] px-2 py-1 border border-black uppercase">
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="comic-btn bg-purple-500 text-white text-xs px-3 py-2 block w-full hover:bg-purple-400 cursor-pointer text-center border-2 border-black">
                        + Add Emblem
                        <input type="file" accept="image/*" className="hidden" onChange={handleEmblemUpload} />
                      </label>
                    )}
                    {emblemImage && (
                      <select
                        value={emblemPlacement || ''}
                        onChange={(e) => setEmblemPlacement(e.target.value as EmblemPlacement || undefined)}
                        className="w-full p-1.5 border-2 border-black font-comic text-xs bg-white mt-2"
                      >
                        <option value="">Select Placement...</option>
                        {EMBLEM_PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    )}
                  </div>

                  <div>
                    <p className="font-comic text-xs sm:text-sm mb-2 font-bold text-gray-600 uppercase">
                      Signature Weapon
                    </p>
                    {weaponImage ? (
                      <div className="flex gap-2 items-center">
                        <img src={`data:image/jpeg;base64,${weaponImage}`} alt="Weapon" className="w-14 h-14 object-contain border-2 border-black" />
                        <div className="flex flex-col gap-1">
                          <label className="comic-btn bg-yellow-400 text-black text-[10px] px-2 py-1 cursor-pointer border border-black uppercase text-center">
                            Replace
                            <input type="file" accept="image/*" className="hidden" onChange={handleWeaponUpload} />
                          </label>
                          <button onClick={() => setWeaponImage('')} className="comic-btn bg-red-500 text-white text-[10px] px-2 py-1 border border-black uppercase">
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="comic-btn bg-amber-600 text-white text-xs px-3 py-2 block w-full hover:bg-amber-500 cursor-pointer text-center border-2 border-black">
                        + Add Weapon
                        <input type="file" accept="image/*" className="hidden" onChange={handleWeaponUpload} />
                      </label>
                    )}
                    {weaponImage && (
                      <textarea
                        value={weaponDescriptionText}
                        onChange={(e) => setWeaponDescriptionText(e.target.value)}
                        placeholder="Describe the weapon..."
                        className="w-full p-1.5 border-2 border-black font-comic text-xs h-16 resize-none mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="border-4 border-red-600 bg-red-50 p-4">
              <h3 className="font-comic text-lg font-bold uppercase text-red-800 mb-3">Villain Preview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-comic">
                <div>
                  <p><span className="font-bold">Name:</span> {name || '(Not set)'}</p>
                  <p><span className="font-bold">Relationship:</span> {RELATIONSHIP_OPTIONS.find(o => o.value === relationshipToHero)?.label}</p>
                  <p><span className="font-bold">Threat Level:</span> {THREAT_LEVEL_OPTIONS.find(o => o.value === threatLevel)?.label}</p>
                </div>
                <div>
                  <p><span className="font-bold">Motivation:</span> {motivation || '(Not set)'}</p>
                  <p><span className="font-bold">Weakness:</span> {weakness || '(Not set)'}</p>
                  {primaryPower && <p><span className="font-bold">Power:</span> {primaryPower}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t-4 border-black bg-gray-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="comic-btn bg-gray-500 text-white px-4 py-2 font-bold border-2 border-black hover:bg-gray-400 uppercase text-sm flex-none"
          >
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={handleReset}
            className="comic-btn bg-yellow-500 text-black px-4 py-2 font-bold border-2 border-black hover:bg-yellow-400 uppercase text-sm flex-none"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="comic-btn bg-gray-600 text-white px-4 py-2 font-bold border-2 border-black hover:bg-gray-500 uppercase text-sm flex-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="comic-btn flex-1 bg-red-600 text-white px-6 py-3 font-bold border-[3px] border-black hover:bg-red-500 uppercase text-lg shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
          >
            Create Villain
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillainGenerator;
