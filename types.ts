/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Core Configuration Factory
export const getComicConfig = (storyLength: number, extraPages: number = 0) => {
    return {
        MAX_STORY_PAGES: storyLength + extraPages,
        BACK_COVER_PAGE: storyLength + extraPages + 1,
        TOTAL_PAGES: storyLength + extraPages + 1,
        INITIAL_PAGES: Math.min(2, storyLength),
        GATE_PAGE: Math.min(2, storyLength),
        BATCH_SIZE: 3,
        DECISION_PAGES: storyLength <= 5 ? [2, 4] : storyLength <= 10 ? [3, 6, 8] : [4, 8, 12, 16, 19]
    };
};

export const ART_STYLES = [
  "Modern American Comic",
  "Classic 90s Marvel",
  "Black & White Manga",
  "Gritty Noir Horror",
  "Watercolor Fantasy",
  "Cinematic 3D Render"
];

export const PAGE_LENGTHS = [
  { label: "Short Story (5 Pages)", value: 5 },
  { label: "Standard Issue (10 Pages)", value: 10 },
  { label: "Epic Saga (20 Pages)", value: 20 }
];
export const GENRES = ["Classic Horror", "Superhero Action", "Dark Sci-Fi", "High Fantasy", "Neon Noir Detective", "Wasteland Apocalypse", "Lighthearted Comedy", "Teen Drama / Slice of Life", "Custom"];
export const TONES = [
    "ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)",
    "INNER-MONOLOGUE (Heavy captions revealing thoughts.)",
    "QUIPPY (Characters use humor as a defense mechanism.)",
    "OPERATIC (Grand, dramatic declarations and high stakes.)",
    "CASUAL (Natural dialogue, focus on relationships/gossip.)",
    "WHOLESOME (Warm, gentle, optimistic.)"
];

export const LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'ar-EG', name: 'Arabic (Egypt)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'id-ID', name: 'Indonesian (Indonesia)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'ua-UA', name: 'Ukrainian (Ukraine)' },
    { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
    { code: 'zh-CN', name: 'Chinese (China)' }
];

export const CHARACTER_ROLES = [
  'Hero',
  'Anti-Hero',
  'Sidekick',
  'Antagonist',
  'Villain',
  'Family/Friend',
  'Custom'
] as const;

export type CharacterRole = typeof CHARACTER_ROLES[number];

export interface Persona {
  id: string;
  name: string;
  base64: string; // The generated or uploaded portrait
  desc: string;
  referenceImage?: string; // Legacy single reference image base64
  referenceImages?: string[]; // Multiple reference images
  role?: CharacterRole;
  customRole?: string; // Used when role is 'Family/Friend' or 'Custom'
  backstoryText?: string;
  backstoryFiles?: { base64: string; mimeType: string; name: string }[];
}

export interface StoryContext {
  title: string;
  descriptionText: string;
  descriptionFiles: { base64: string; mimeType: string; name: string }[];
  publisherName: string;
  publisherLogo?: string;
  seriesTitle: string;
  issueNumber: string;
  useOverlayLogo: boolean;
  artStyle: string;
  pageLength: number;
  publisherLogoBgColor?: string;
  publisherLogoFit?: 'cover' | 'contain';
}

export interface StoryOutline {
  content: string;
  isReady: boolean;
  isGenerating: boolean;
}

export interface ComicFace {
    id: string;
    type: 'cover' | 'story' | 'back_cover';
    imageUrl?: string;
    isLoading?: boolean;
    hasFailed?: boolean;
    choices: string[];
    isDecisionPage?: boolean;
    resolvedChoice?: string;
    pageIndex?: number;
    narrative?: Beat;
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'other' | string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  faceDescription: string;
  bodyType: string;
  clothing: string;
  colorPalette: string;
  distinguishingFeatures: string;
}

export interface RerollPayload {
  pageIndex: number;
  instruction: string;
  selectedRefImages: string[];  // base64 strings of toggled-on images
  useCharacterProfiles?: boolean;
}
