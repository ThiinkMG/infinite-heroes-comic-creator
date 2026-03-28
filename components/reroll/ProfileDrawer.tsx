/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CharacterProfile } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** The profile being edited */
  profile: CharacterProfile | null;
  /** Callback when profile is saved */
  onSave: (profileId: string, updates: Partial<CharacterProfile>) => void;
  /** Callback to trigger AI re-analysis of the profile */
  onReAnalyze?: (profileId: string) => Promise<void>;
  /** Whether re-analysis is currently running */
  isAnalyzing?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onReAnalyze,
  isAnalyzing = false,
}) => {
  // Local state for form fields (allows cancellation)
  const [localProfile, setLocalProfile] = useState<Partial<CharacterProfile>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Reset local state when profile changes or drawer opens
  useEffect(() => {
    if (profile && isOpen) {
      setLocalProfile({
        faceDescription: profile.faceDescription ?? '',
        bodyType: profile.bodyType ?? '',
        clothing: profile.clothing ?? '',
        colorPalette: profile.colorPalette ?? '',
        distinguishingFeatures: profile.distinguishingFeatures ?? '',
        maskDescription: profile.maskDescription ?? '',
        emblemDescription: profile.emblemDescription ?? '',
        emblemPlacement: profile.emblemPlacement ?? '',
        weaponDescription: profile.weaponDescription ?? '',
        hardNegatives: profile.hardNegatives ?? [],
      });
      setHasChanges(false);
    }
  }, [profile, isOpen]);

  // Handle field changes
  const handleFieldChange = useCallback(
    (field: keyof CharacterProfile, value: string | string[]) => {
      setLocalProfile((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  // Handle hard negatives (comma-separated string to array)
  const handleNegativesChange = useCallback((value: string) => {
    const negatives = value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setLocalProfile((prev) => ({ ...prev, hardNegatives: negatives }));
    setHasChanges(true);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (profile?.id) {
      onSave(profile.id, localProfile);
      setHasChanges(false);
      onClose();
    }
  }, [profile?.id, localProfile, onSave, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setHasChanges(false);
    onClose();
  }, [onClose]);

  // Handle re-analyze
  const handleReAnalyze = useCallback(async () => {
    if (profile?.id && onReAnalyze) {
      await onReAnalyze(profile.id);
    }
  }, [profile?.id, onReAnalyze]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleCancel]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!profile) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-orange-100">
          <h2
            id="drawer-title"
            className="font-comic font-bold text-lg sm:text-xl uppercase text-orange-900 truncate"
          >
            Edit: {profile.name}
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 min-w-[48px] min-h-[48px] text-2xl text-gray-600 hover:text-gray-900 hover:bg-orange-200 rounded transition-colors touch-manipulation"
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto h-[calc(100%-160px)] p-4 space-y-4">
          {/* Face Description */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">
              Face Description
            </label>
            <textarea
              className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-24 resize-none focus:border-orange-400 focus:outline-none touch-manipulation rounded"
              value={(localProfile.faceDescription as string) ?? ''}
              onChange={(e) => handleFieldChange('faceDescription', e.target.value)}
              placeholder="Eye color, face shape, expression..."
            />
          </div>

          {/* Body Type */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">
              Body Type
            </label>
            <textarea
              className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-24 resize-none focus:border-orange-400 focus:outline-none touch-manipulation rounded"
              value={(localProfile.bodyType as string) ?? ''}
              onChange={(e) => handleFieldChange('bodyType', e.target.value)}
              placeholder="Height, build, posture..."
            />
          </div>

          {/* Clothing & Armor */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">
              Clothing & Armor
            </label>
            <textarea
              className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-24 resize-none focus:border-orange-400 focus:outline-none touch-manipulation rounded"
              value={(localProfile.clothing as string) ?? ''}
              onChange={(e) => handleFieldChange('clothing', e.target.value)}
              placeholder="Outfit details, accessories..."
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">
              Color Palette
            </label>
            <textarea
              className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-24 resize-none focus:border-orange-400 focus:outline-none touch-manipulation rounded"
              value={(localProfile.colorPalette as string) ?? ''}
              onChange={(e) => handleFieldChange('colorPalette', e.target.value)}
              placeholder="Primary colors, skin tone, hair..."
            />
          </div>

          {/* Distinguishing Features */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-gray-700 uppercase block mb-1">
              Distinguishing Features
            </label>
            <textarea
              className="w-full p-3 border-2 border-gray-300 font-comic text-sm h-20 resize-none focus:border-orange-400 focus:outline-none touch-manipulation rounded"
              value={(localProfile.distinguishingFeatures as string) ?? ''}
              onChange={(e) => handleFieldChange('distinguishingFeatures', e.target.value)}
              placeholder="Scars, tattoos, unique traits..."
            />
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200 pt-2" />

          {/* Mask Description */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-purple-700 uppercase block mb-1">
              Mask <span className="text-[10px] text-gray-500 font-normal normal-case">(if worn)</span>
            </label>
            <textarea
              className="w-full p-3 border-2 border-purple-300 font-comic text-sm h-20 resize-none focus:border-purple-500 focus:outline-none bg-purple-50 touch-manipulation rounded"
              value={(localProfile.maskDescription as string) ?? ''}
              onChange={(e) => handleFieldChange('maskDescription', e.target.value)}
              placeholder="Full face mask with white eye lenses..."
            />
          </div>

          {/* Emblem Description */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-amber-700 uppercase block mb-1">
              Emblem{' '}
              <span className="text-[10px] text-gray-500 font-normal normal-case">(chest symbol)</span>
            </label>
            <textarea
              className="w-full p-3 border-2 border-amber-300 font-comic text-sm h-20 resize-none focus:border-amber-500 focus:outline-none bg-amber-50 touch-manipulation rounded"
              value={(localProfile.emblemDescription as string) ?? ''}
              onChange={(e) => handleFieldChange('emblemDescription', e.target.value)}
              placeholder="Red spider emblem on chest..."
            />
          </div>

          {/* Emblem Placement */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-amber-700 uppercase block mb-1">
              Emblem Placement
            </label>
            <input
              type="text"
              className="w-full p-3 border-2 border-amber-300 font-comic text-sm focus:border-amber-500 focus:outline-none bg-amber-50 touch-manipulation rounded"
              value={(localProfile.emblemPlacement as string) ?? ''}
              onChange={(e) => handleFieldChange('emblemPlacement', e.target.value)}
              placeholder="chest-center, back, shoulder..."
            />
          </div>

          {/* Weapon Description */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-red-700 uppercase block mb-1">
              Weapon <span className="text-[10px] text-gray-500 font-normal normal-case">(if any)</span>
            </label>
            <textarea
              className="w-full p-3 border-2 border-red-300 font-comic text-sm h-20 resize-none focus:border-red-500 focus:outline-none bg-red-50 touch-manipulation rounded"
              value={(localProfile.weaponDescription as string) ?? ''}
              onChange={(e) => handleFieldChange('weaponDescription', e.target.value)}
              placeholder="Glowing green energy sword..."
            />
          </div>

          {/* Hard Negatives */}
          <div>
            <label className="font-comic text-xs sm:text-sm font-bold text-gray-600 uppercase block mb-1">
              Avoid{' '}
              <span className="text-[10px] text-gray-500 font-normal normal-case">(comma-separated)</span>
            </label>
            <textarea
              className="w-full p-3 border-2 border-gray-400 font-comic text-sm h-20 resize-none focus:border-gray-600 focus:outline-none bg-gray-100 touch-manipulation rounded"
              value={(localProfile.hardNegatives as string[] | undefined)?.join(', ') ?? ''}
              onChange={(e) => handleNegativesChange(e.target.value)}
              placeholder="no glasses, no beard, avoid purple..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-4 border-black bg-orange-50 flex flex-col sm:flex-row gap-2">
          {/* Re-Analyze Button */}
          {onReAnalyze && (
            <button
              onClick={handleReAnalyze}
              disabled={isAnalyzing}
              className="comic-btn bg-blue-600 text-white text-sm min-h-[48px] px-4 py-2 border-2 border-black hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 font-bold touch-manipulation flex-1 sm:flex-none"
            >
              {isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}
            </button>
          )}

          <div className="flex gap-2 flex-1 sm:ml-auto">
            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="comic-btn bg-gray-400 text-white text-sm min-h-[48px] px-4 py-2 border-2 border-black hover:bg-gray-300 active:bg-gray-500 font-bold touch-manipulation flex-1"
            >
              Cancel
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="comic-btn bg-green-600 text-white text-sm min-h-[48px] px-4 py-2 border-2 border-black hover:bg-green-500 active:bg-green-700 disabled:opacity-50 font-bold touch-manipulation flex-1"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDrawer;
