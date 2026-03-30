/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Feature F: Consistency Preview
 * Shown in the Reroll Modal — displays which character attributes are currently locked
 * so users can verify before confirming a reroll.
 */

import React from 'react';
import { CharacterLockState, CharacterProfile } from '../../types';

interface ConsistencyPreviewProps {
  /** Character lock states to display */
  characterLocks: Map<string, CharacterLockState>;
  /** Full profiles for name/detail lookup */
  profiles: CharacterProfile[];
}

export const ConsistencyPreview: React.FC<ConsistencyPreviewProps> = ({
  characterLocks,
  profiles,
}) => {
  // Only show if at least one attribute is locked
  const hasAnyLock = Array.from<CharacterLockState>(characterLocks.values()).some(
    lock => lock.lockFace || lock.lockOutfit || lock.lockEmblem || lock.lockWeapon
  );

  if (!hasAnyLock) return null;

  const LOCK_ATTRS: Array<{ key: keyof Omit<CharacterLockState, 'characterId'>; icon: string; label: string }> = [
    { key: 'lockFace', icon: '😊', label: 'Face' },
    { key: 'lockOutfit', icon: '⭐', label: 'Outfit' },
    { key: 'lockEmblem', icon: '🔰', label: 'Emblem' },
    { key: 'lockWeapon', icon: '⚔️', label: 'Weapon' },
  ];

  return (
    <div className="border-[3px] border-blue-500 bg-blue-50 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔒</span>
        <p className="font-comic font-bold text-xs sm:text-sm uppercase text-blue-900">
          Locked Attributes
        </p>
        <span className="font-comic text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
          Immutable constraints active
        </span>
      </div>
      <p className="font-comic text-[10px] text-blue-700 mb-3">
        These attributes are locked and will be prepended as hard constraints in the reroll prompt.
        To unlock, close this modal and edit character lock settings.
      </p>

      <div className="space-y-2">
        {profiles.map(profile => {
          const lock = characterLocks.get(profile.id);
          if (!lock) return null;
          const lockedAttrs = LOCK_ATTRS.filter(a => lock[a.key]);
          if (lockedAttrs.length === 0) return null;

          return (
            <div key={profile.id} className="flex items-start gap-2 p-2 bg-white border-2 border-blue-200 rounded-sm">
              <span className="font-comic text-xs font-bold text-blue-900 w-20 shrink-0 truncate" title={profile.name}>
                {profile.name}
              </span>
              <div className="flex flex-wrap gap-1 flex-1">
                {lockedAttrs.map(attr => (
                  <span
                    key={attr.key}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold font-comic border border-blue-800 rounded-sm"
                    title={`${profile.name}'s ${attr.label} is locked`}
                  >
                    {attr.icon} {attr.label} 🔒
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConsistencyPreview;
