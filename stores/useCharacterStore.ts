/**
 * Zustand store for character state management
 * Manages hero, friend (co-star), and additional characters along with their AI-generated profiles
 */

import { create } from 'zustand';
import { Persona, CharacterProfile } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface CharacterState {
  /** Main character (hero) */
  hero: Persona | null;
  /** Co-star character (optional) */
  friend: Persona | null;
  /** Additional cast members */
  additionalCharacters: Persona[];
  /** AI-analyzed character profiles, keyed by character ID */
  characterProfiles: Map<string, CharacterProfile>;
}

export interface CharacterActions {
  // Hero actions
  setHero: (persona: Persona) => void;
  updateHero: (partial: Partial<Persona>) => void;

  // Friend (co-star) actions
  setFriend: (persona: Persona) => void;
  updateFriend: (partial: Partial<Persona>) => void;
  clearFriend: () => void;

  // Additional characters actions
  addCharacter: (persona: Persona) => void;
  updateCharacter: (id: string, partial: Partial<Persona>) => void;
  removeCharacter: (id: string) => void;

  // Character profile actions
  setCharacterProfile: (id: string, profile: CharacterProfile) => void;
  updateCharacterProfile: (id: string, partial: Partial<CharacterProfile>) => void;
  clearCharacterProfile: (id: string) => void;
  /** Bulk set all profiles from an array (clears existing and sets new) */
  setAllProfiles: (profiles: CharacterProfile[]) => void;

  // Utility actions
  resetCharacters: () => void;
}

export interface CharacterSelectors {
  /** Get all characters as an array: [hero, friend, ...additionalCharacters] */
  getAllCharacters: () => Persona[];
  /** Find a character by their ID */
  getCharacterById: (id: string) => Persona | null;
  /** Get profile for a specific character */
  getProfileById: (id: string) => CharacterProfile | undefined;
  /** Get all profiles as an array (for compatibility with existing code) */
  getProfilesArray: () => CharacterProfile[];
  /** Check if all main characters have profiles generated */
  hasAllProfiles: () => boolean;
}

export type CharacterStore = CharacterState & CharacterActions & CharacterSelectors;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: CharacterState = {
  hero: null,
  friend: null,
  additionalCharacters: [],
  characterProfiles: new Map(),
};

// ============================================================================
// STORE
// ============================================================================

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  // Initial state
  ...initialState,

  // -------------------------------------------------------------------------
  // HERO ACTIONS
  // -------------------------------------------------------------------------

  setHero: (persona: Persona) => {
    set({ hero: persona });
  },

  updateHero: (partial: Partial<Persona>) => {
    const { hero } = get();
    if (hero) {
      set({ hero: { ...hero, ...partial } });
    }
  },

  // -------------------------------------------------------------------------
  // FRIEND (CO-STAR) ACTIONS
  // -------------------------------------------------------------------------

  setFriend: (persona: Persona) => {
    set({ friend: persona });
  },

  updateFriend: (partial: Partial<Persona>) => {
    const { friend } = get();
    if (friend) {
      set({ friend: { ...friend, ...partial } });
    }
  },

  clearFriend: () => {
    const { characterProfiles, friend } = get();
    if (friend) {
      // Also remove the friend's profile if it exists
      const newProfiles = new Map(characterProfiles);
      newProfiles.delete(friend.id);
      set({ friend: null, characterProfiles: newProfiles });
    } else {
      set({ friend: null });
    }
  },

  // -------------------------------------------------------------------------
  // ADDITIONAL CHARACTERS ACTIONS
  // -------------------------------------------------------------------------

  addCharacter: (persona: Persona) => {
    set((state) => ({
      additionalCharacters: [...state.additionalCharacters, persona],
    }));
  },

  updateCharacter: (id: string, partial: Partial<Persona>) => {
    set((state) => ({
      additionalCharacters: state.additionalCharacters.map((char) =>
        char.id === id ? { ...char, ...partial } : char
      ),
    }));
  },

  removeCharacter: (id: string) => {
    set((state) => {
      // Also remove the character's profile if it exists
      const newProfiles = new Map(state.characterProfiles);
      newProfiles.delete(id);
      return {
        additionalCharacters: state.additionalCharacters.filter(
          (char) => char.id !== id
        ),
        characterProfiles: newProfiles,
      };
    });
  },

  // -------------------------------------------------------------------------
  // CHARACTER PROFILE ACTIONS
  // -------------------------------------------------------------------------

  setCharacterProfile: (id: string, profile: CharacterProfile) => {
    set((state) => {
      const newProfiles = new Map(state.characterProfiles);
      newProfiles.set(id, profile);
      return { characterProfiles: newProfiles };
    });
  },

  updateCharacterProfile: (id: string, partial: Partial<CharacterProfile>) => {
    set((state) => {
      const existing = state.characterProfiles.get(id);
      if (existing) {
        const newProfiles = new Map(state.characterProfiles);
        newProfiles.set(id, { ...existing, ...partial });
        return { characterProfiles: newProfiles };
      }
      return state;
    });
  },

  clearCharacterProfile: (id: string) => {
    set((state) => {
      const newProfiles = new Map(state.characterProfiles);
      newProfiles.delete(id);
      return { characterProfiles: newProfiles };
    });
  },

  setAllProfiles: (profiles: CharacterProfile[]) => {
    set(() => {
      const newProfiles = new Map<string, CharacterProfile>();
      profiles.forEach((p) => {
        newProfiles.set(p.id, p);
      });
      return { characterProfiles: newProfiles };
    });
  },

  // -------------------------------------------------------------------------
  // UTILITY ACTIONS
  // -------------------------------------------------------------------------

  resetCharacters: () => {
    set({
      hero: null,
      friend: null,
      additionalCharacters: [],
      characterProfiles: new Map(),
    });
  },

  // -------------------------------------------------------------------------
  // SELECTORS
  // -------------------------------------------------------------------------

  getAllCharacters: () => {
    const { hero, friend, additionalCharacters } = get();
    const characters: Persona[] = [];

    if (hero) {
      characters.push(hero);
    }
    if (friend) {
      characters.push(friend);
    }
    characters.push(...additionalCharacters);

    return characters;
  },

  getCharacterById: (id: string) => {
    const { hero, friend, additionalCharacters } = get();

    // Check hero
    if (hero && hero.id === id) {
      return hero;
    }

    // Check friend
    if (friend && friend.id === id) {
      return friend;
    }

    // Check additional characters
    const found = additionalCharacters.find((char) => char.id === id);
    return found || null;
  },

  getProfileById: (id: string) => {
    const { characterProfiles } = get();
    return characterProfiles.get(id);
  },

  getProfilesArray: () => {
    const { characterProfiles } = get();
    return Array.from(characterProfiles.values());
  },

  hasAllProfiles: () => {
    const { hero, friend, additionalCharacters, characterProfiles } = get();

    // Check hero has profile
    if (hero && !characterProfiles.has(hero.id)) {
      return false;
    }

    // Check friend has profile (if exists)
    if (friend && !characterProfiles.has(friend.id)) {
      return false;
    }

    // Check all additional characters have profiles
    for (const char of additionalCharacters) {
      if (!characterProfiles.has(char.id)) {
        return false;
      }
    }

    return true;
  },
}));

// ============================================================================
// SELECTOR HOOKS (for optimized re-renders)
// ============================================================================

/** Select just the hero */
export const useHero = () => useCharacterStore((state) => state.hero);

/** Select just the friend/co-star */
export const useFriend = () => useCharacterStore((state) => state.friend);

/** Select additional characters array */
export const useAdditionalCharacters = () =>
  useCharacterStore((state) => state.additionalCharacters);

/** Select character profiles map */
export const useCharacterProfiles = () =>
  useCharacterStore((state) => state.characterProfiles);

/** Select a specific character by ID */
export const useCharacterById = (id: string) =>
  useCharacterStore((state) => state.getCharacterById(id));

/** Select a specific profile by character ID */
export const useProfileById = (id: string) =>
  useCharacterStore((state) => state.characterProfiles.get(id));

// ============================================================================
// ACTION HOOKS (for components that only need actions)
// ============================================================================

export const useCharacterActions = () =>
  useCharacterStore((state) => ({
    setHero: state.setHero,
    updateHero: state.updateHero,
    setFriend: state.setFriend,
    updateFriend: state.updateFriend,
    clearFriend: state.clearFriend,
    addCharacter: state.addCharacter,
    updateCharacter: state.updateCharacter,
    removeCharacter: state.removeCharacter,
    setCharacterProfile: state.setCharacterProfile,
    updateCharacterProfile: state.updateCharacterProfile,
    clearCharacterProfile: state.clearCharacterProfile,
    setAllProfiles: state.setAllProfiles,
    resetCharacters: state.resetCharacters,
  }));

export default useCharacterStore;
