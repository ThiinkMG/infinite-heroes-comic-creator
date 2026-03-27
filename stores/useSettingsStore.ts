/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GENRES, PAGE_LENGTHS, LANGUAGES, ART_STYLES, getComicConfig } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface PublisherInfo {
  name: string;
  issueNumber: string;
}

export interface SettingsState {
  // Story settings
  selectedGenre: string;
  customPremise: string;
  selectedLanguage: string;
  selectedArtStyle: string;
  selectedPageLength: number;

  // Publisher settings
  publisherInfo: PublisherInfo;

  // Mode settings
  generateFromOutline: boolean;
  skipProfileAnalysis: boolean;

  // UI settings
  showApiCostEstimate: boolean;
}

export interface ComicConfig {
  MAX_STORY_PAGES: number;
  BACK_COVER_PAGE: number;
  TOTAL_PAGES: number;
  INITIAL_PAGES: number;
  GATE_PAGE: number;
  BATCH_SIZE: number;
  DECISION_PAGES: number[];
}

export interface SettingsActions {
  // Setters for each setting
  setSelectedGenre: (genre: string) => void;
  setCustomPremise: (premise: string) => void;
  setSelectedLanguage: (language: string) => void;
  setSelectedArtStyle: (artStyle: string) => void;
  setSelectedPageLength: (pageLength: number) => void;
  setPublisherInfo: (info: Partial<PublisherInfo>) => void;
  setGenerateFromOutline: (value: boolean) => void;
  setSkipProfileAnalysis: (value: boolean) => void;
  setShowApiCostEstimate: (value: boolean) => void;

  // Bulk operations
  resetSettings: () => void;
  loadFromLocalStorage: () => void;

  // Computed
  getComicConfig: (extraPages?: number) => ComicConfig;
}

export type SettingsStore = SettingsState & SettingsActions;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const getDefaultSettings = (): SettingsState => ({
  selectedGenre: GENRES[0] || 'Superhero Action',
  customPremise: '',
  selectedLanguage: LANGUAGES[0]?.code || 'en-US',
  selectedArtStyle: ART_STYLES[0] || 'Modern American Comic',
  selectedPageLength: PAGE_LENGTHS[1]?.value || 6, // Short Story (6 Pages) as default
  publisherInfo: {
    name: '',
    issueNumber: '1',
  },
  generateFromOutline: true, // Outline Mode by default
  skipProfileAnalysis: false,
  showApiCostEstimate: true, // Show by default
});

// ============================================================================
// STORE
// ============================================================================

const STORAGE_KEY = 'infinite-heroes-settings';

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...getDefaultSettings(),

      // Setters
      setSelectedGenre: (genre) => set({ selectedGenre: genre }),

      setCustomPremise: (premise) => set({ customPremise: premise }),

      setSelectedLanguage: (language) => set({ selectedLanguage: language }),

      setSelectedArtStyle: (artStyle) => set({ selectedArtStyle: artStyle }),

      setSelectedPageLength: (pageLength) => set({ selectedPageLength: pageLength }),

      setPublisherInfo: (info) => set((state) => ({
        publisherInfo: { ...state.publisherInfo, ...info },
      })),

      setGenerateFromOutline: (value) => set({ generateFromOutline: value }),

      setSkipProfileAnalysis: (value) => set({ skipProfileAnalysis: value }),

      setShowApiCostEstimate: (value) => set({ showApiCostEstimate: value }),

      // Reset to defaults
      resetSettings: () => set(getDefaultSettings()),

      // Load from localStorage (useful for manual refresh scenarios)
      // Note: With persist middleware, this is typically automatic on store initialization
      loadFromLocalStorage: () => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.state) {
              // Merge stored state with defaults to handle any new fields
              set({
                ...getDefaultSettings(),
                ...parsed.state,
              });
            }
          }
        } catch (error) {
          console.warn('Failed to load settings from localStorage:', error);
        }
      },

      // Compute comic configuration based on current settings
      getComicConfig: (extraPages = 0) => {
        const state = get();
        const isNovelMode = !state.generateFromOutline;
        return getComicConfig(state.selectedPageLength, extraPages, isNovelMode);
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist specific fields (not actions)
      partialize: (state) => ({
        selectedGenre: state.selectedGenre,
        customPremise: state.customPremise,
        selectedLanguage: state.selectedLanguage,
        selectedArtStyle: state.selectedArtStyle,
        selectedPageLength: state.selectedPageLength,
        publisherInfo: state.publisherInfo,
        generateFromOutline: state.generateFromOutline,
        skipProfileAnalysis: state.skipProfileAnalysis,
        showApiCostEstimate: state.showApiCostEstimate,
      }),
    }
  )
);

// ============================================================================
// SELECTOR HOOKS (for optimized re-renders)
// ============================================================================

export const useSelectedGenre = () => useSettingsStore((state) => state.selectedGenre);
export const useCustomPremise = () => useSettingsStore((state) => state.customPremise);
export const useSelectedLanguage = () => useSettingsStore((state) => state.selectedLanguage);
export const useSelectedArtStyle = () => useSettingsStore((state) => state.selectedArtStyle);
export const useSelectedPageLength = () => useSettingsStore((state) => state.selectedPageLength);
export const usePublisherInfo = () => useSettingsStore((state) => state.publisherInfo);
export const useGenerateFromOutline = () => useSettingsStore((state) => state.generateFromOutline);
export const useSkipProfileAnalysis = () => useSettingsStore((state) => state.skipProfileAnalysis);

// Computed selector for novel mode (inverse of generateFromOutline)
export const useIsNovelMode = () => useSettingsStore((state) => !state.generateFromOutline);

// UI settings selectors
export const useShowApiCostEstimate = () => useSettingsStore((state) => state.showApiCostEstimate);
