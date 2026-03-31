import React from 'react';

interface CharacterFocusSelectorProps {
  characters: Array<{ id: string; name: string }>;
  preserveIds: string[];
  onToggle: (id: string) => void;
}

export const CharacterFocusSelector: React.FC<CharacterFocusSelectorProps> = ({
  characters,
  preserveIds,
  onToggle,
}) => {
  if (characters.length < 2) return null;

  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Character Fix Targeting
      </div>
      <div className="flex flex-wrap gap-2">
        {characters.map(char => {
          const isPreserved = preserveIds.includes(char.id);
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => onToggle(char.id)}
              title={isPreserved ? `${char.name}: preserved from current panel` : `${char.name}: will be regenerated`}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                isPreserved
                  ? 'bg-gray-700 border-gray-500 text-gray-400 opacity-70'
                  : 'bg-orange-900/40 border-orange-500/60 text-orange-200 hover:bg-orange-800/50',
              ].join(' ')}
            >
              {isPreserved && <span className="text-xs">🔒</span>}
              {char.name}
            </button>
          );
        })}
      </div>
      {preserveIds.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Locked characters are copied from the current panel. Others are regenerated to match their portraits.
        </p>
      )}
    </div>
  );
};
