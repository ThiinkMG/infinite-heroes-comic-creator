
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import jsPDF from 'jspdf';
import { getComicConfig, ART_STYLES, GENRES, TONES, LANGUAGES, ComicFace, Beat, Persona, StoryContext, StoryOutline, CharacterProfile, NOVEL_MODE_BATCH_SIZE, generateHardNegatives, formatIdentityHeader, formatReinforcedScene, formatConsistencyInstruction, IdentityHeader, RegenerationMode, PageCharacterPlan, TransitionType, ShotType, PanelLayout, EmotionalBeat, PacingIntent, BalloonShape, RerollOptions, getLayoutInstructions, getShotInstructions, getTransitionContext, getFlashbackInstructions, NovelModeState } from './types';
import { COMIC_PRESETS, ComicPreset } from './data/comicPresets';
import { Setup } from './Setup';
import { Book } from './Book';
import { RerollModal } from './RerollModal';
import { OutlineDialog } from './OutlineDialog';
import { GalleryModal } from './GalleryModal';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { ExportDialog, ExportOptions, PAGE_SIZES, RESOLUTION_OPTIONS } from './ExportDialog';
import { ProfilesDialog } from './ProfilesDialog';
import { SettingsDialog } from './SettingsDialog';
import { OutlineStepDialog } from './OutlineStepDialog';
import { ModeSelectionScreen } from './ModeSelectionScreen';
import { CoverVariantSelector } from './components';
import { createImageContent, createTextContent, extractJsonFromResponse, getTextFromClaudeResponse, ClaudeContentBlock, detectImageMimeType } from './claudeHelpers';

// --- Zustand Stores ---
import { useCharacterStore } from './stores/useCharacterStore';
import { useComicStore } from './stores/useComicStore';
import { useSettingsStore } from './stores/useSettingsStore';

// --- Generation Hooks ---
import { useGenerateBeat } from './hooks/useGenerateBeat';
import { useGenerateImage } from './hooks/useGenerateImage';
import { useGenerateProfile } from './hooks/useGenerateProfile';
import { useGenerateOutline } from './hooks/useGenerateOutline';
import { useExportImport } from './hooks/useExportImport';

// --- Constants ---
const MODEL_IMAGE_GEN_NAME = "gemini-3-pro-image-preview";
const MODEL_TEXT_NAME = "gemini-2.5-pro"; // Gemini fallback
const MODEL_TEXT_NAME_CLAUDE = "claude-sonnet-4-5-20250929";

// --- Storage Constants ---
const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB typical localStorage limit
const STORAGE_SAFE_LIMIT = 4 * 1024 * 1024; // 4MB safe limit for cast data
const STORAGE_WARNING_THRESHOLD = 3 * 1024 * 1024; // 3MB - warn user

// --- Storage Usage Helper ---
interface StorageUsageInfo {
  currentBytes: number;
  percentUsed: number;
  imagesStripped: boolean;
  isApproachingLimit: boolean;
  isOverLimit: boolean;
}

const checkStorageUsage = (payload: string, wasStripped: boolean = false): StorageUsageInfo => {
  const currentBytes = new Blob([payload]).size;
  const percentUsed = Math.round((currentBytes / STORAGE_SAFE_LIMIT) * 100);

  return {
    currentBytes,
    percentUsed: Math.min(percentUsed, 100),
    imagesStripped: wasStripped,
    isApproachingLimit: currentBytes > STORAGE_WARNING_THRESHOLD,
    isOverLimit: currentBytes > STORAGE_SAFE_LIMIT
  };
};

const App: React.FC = () => {
  // --- API Key Hook ---
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  const isCastLoadedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('infinite_heroes_cast');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hero) {
          setHeroState(parsed.hero);
          // Sync to Zustand store (store is now the source of truth)
          useCharacterStore.getState().setHero(parsed.hero);
        }
        if (parsed.friend) {
          setFriendState(parsed.friend);
          // Sync to Zustand store (store is now the source of truth)
          useCharacterStore.getState().setFriend(parsed.friend);
        }
        if (parsed.additionalCharacters) {
          setAdditionalCharacters(parsed.additionalCharacters);
          // Sync to Zustand store (store is now the source of truth)
          parsed.additionalCharacters.forEach((char: Persona) => {
            useCharacterStore.getState().addCharacter(char);
          });
        }
      } catch(e){ console.error("Failed to load cast", e); }
    }
    isCastLoadedRef.current = true;
  }, []);

  const [hero, setHeroState] = useState<Persona | null>(null);
  const [friend, setFriendState] = useState<Persona | null>(null);
  const [additionalCharacters, setAdditionalCharacters] = useState<Persona[]>([]);
  const [storyContext, setStoryContext] = useState<StoryContext>({
    title: "",
    descriptionText: "",
    descriptionFiles: [],
    publisherName: "Marvel",
    seriesTitle: "Infinite Heroes",
    issueNumber: "1",
    useOverlayLogo: true,
    artStyle: ART_STYLES[0],
    pageLength: 10
  });

  const [generateFromOutline, setGenerateFromOutline] = useState(false);
  const [storyOutline, setStoryOutline] = useState<StoryOutline>({
    content: "",
    isReady: false,
    isGenerating: false
  });
  const [outlineNotes, setOutlineNotes] = useState("");
  const [showOutlineStep, setShowOutlineStep] = useState(false);

  // --- Sync storyOutline to Zustand comic store ---
  useEffect(() => {
    useComicStore.getState().setStoryOutline({
      text: storyOutline.content,
      isReady: storyOutline.isReady,
      isGenerating: storyOutline.isGenerating,
    });
  }, [storyOutline]);

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);

  // --- Sync settings to Zustand store ---
  useEffect(() => {
    useSettingsStore.getState().setSelectedGenre(selectedGenre);
  }, [selectedGenre]);

  useEffect(() => {
    useSettingsStore.getState().setSelectedLanguage(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    useSettingsStore.getState().setCustomPremise(customPremise);
  }, [customPremise]);

  useEffect(() => {
    useSettingsStore.getState().setGenerateFromOutline(generateFromOutline);
  }, [generateFromOutline]);

  // --- Store Getters (replace refs with Zustand store reads) ---
  // These are convenience functions that read from the Zustand store
  // They replace the previous ref pattern for accessing character data in async callbacks
  const getHero = () => useCharacterStore.getState().hero;
  const getFriend = () => useCharacterStore.getState().friend;
  const getAdditionalChars = () => useCharacterStore.getState().additionalCharacters;
  const getProfilesArray = () => useCharacterStore.getState().getProfilesArray();

  useEffect(() => {
    if (!isCastLoadedRef.current) return;
    const payload = JSON.stringify({ hero, friend, additionalCharacters });
    const payloadSize = new Blob([payload]).size;

    // Check if approaching or exceeding limit
    if (payloadSize > STORAGE_SAFE_LIMIT) {
      // Must strip images
      console.warn("Payload exceeds local storage safe limits. Stripping images to persist text metadata.");
      const stripStr = (p: Persona|null) => p ? { ...p, base64: '', referenceImage: '', referenceImages: [], backstoryFiles: [] } : null;
      const strippedPayload = JSON.stringify({
        hero: stripStr(hero),
        friend: stripStr(friend),
        additionalCharacters: additionalCharacters.map(c => stripStr(c)!)
      });

      try {
        localStorage.setItem('infinite_heroes_cast', strippedPayload);
        // Show warning that images were stripped
        setStorageWarning(checkStorageUsage(payload, true));
        setDismissedStorageWarning(false); // Reset dismissal on new stripping event
      } catch (err) {
        console.error("Even text metadata failed to save:", err);
      }
    } else {
      try {
        localStorage.setItem('infinite_heroes_cast', payload);
        // Check if approaching limit (warn at 75%+)
        if (payloadSize > STORAGE_WARNING_THRESHOLD) {
          setStorageWarning(checkStorageUsage(payload, false));
        } else {
          // Clear warning if under threshold
          setStorageWarning(null);
        }
      } catch (e) {
        console.error("Storage save failed:", e);
      }
    }
  }, [hero, friend, additionalCharacters]);

  // --- Character State Setters (synced to Zustand stores) ---
  const setHero = (p: Persona | null) => {
    setHeroState(p);
    // Sync to Zustand store (store is now the source of truth for refs)
    if (p) {
      useCharacterStore.getState().setHero(p);
    }
  };
  const setFriend = (p: Persona | null) => {
    setFriendState(p);
    // Sync to Zustand store (store is now the source of truth for refs)
    if (p) {
      useCharacterStore.getState().setFriend(p);
    } else {
      useCharacterStore.getState().clearFriend();
    }
  };

  const handleAddCharacter = () => {
    const newChar: Persona = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Character ${additionalCharacters.length + 3}`,
      base64: "",
      desc: "Additional Character",
      backstoryFiles: []
    };
    setAdditionalCharacters(prev => [...prev, newChar]);
    // Sync to Zustand store (store is now the source of truth for refs)
    useCharacterStore.getState().addCharacter(newChar);
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Persona>) => {
    setAdditionalCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    // Sync to Zustand store (store is now the source of truth for refs)
    useCharacterStore.getState().updateCharacter(id, updates);
  };

  const handleDeleteCharacter = (id: string) => {
    setAdditionalCharacters(prev => prev.filter(c => c.id !== id));
    // Sync to Zustand store (store is now the source of truth for refs)
    useCharacterStore.getState().removeCharacter(id);
  };

  const processFiles = async (files: FileList) => {
    const results: { base64: string; mimeType: string; name: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      results.push({ base64, mimeType: file.type, name: file.name });
    }
    return results;
  };
  
  const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  // --- Sync comicFaces to Zustand store ---
  useEffect(() => {
    useComicStore.getState().setComicFaces(comicFaces);
  }, [comicFaces]);

  // --- Sync currentSheetIndex to Zustand store ---
  useEffect(() => {
    // Convert sheet index to page index (sheet 0 = cover, sheet 1 = pages 1-2, etc.)
    const pageIndex = currentSheetIndex === 0 ? 0 : (currentSheetIndex - 1) * 2 + 1;
    useComicStore.getState().setCurrentPageIndex(pageIndex);
  }, [currentSheetIndex]);

  // --- Transition States ---
  const [showSetup, setShowSetup] = useState(true);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGeneratingProfiles, setIsGeneratingProfiles] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showOutlineDialog, setShowOutlineDialog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('is_admin') === 'true');
  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('user_api_key') || '');
  const [userAnthropicKey, setUserAnthropicKey] = useState(localStorage.getItem('user_anthropic_api_key') || '');
  const [dismissedKeyAlert, setDismissedKeyAlert] = useState(false);
  const [storageWarning, setStorageWarning] = useState<StorageUsageInfo | null>(null);
  const [dismissedStorageWarning, setDismissedStorageWarning] = useState(false);
  const [showProfilesStep, setShowProfilesStep] = useState(false);
  const [tempProfiles, setTempProfiles] = useState<CharacterProfile[]>([]);
  const [skipProfileAnalysis, setSkipProfileAnalysis] = useState(false);
  const [useSavedProfiles, setUseSavedProfiles] = useState(true); // Use saved profiles if available
  const [extraPages, setExtraPages] = useState(0);

  // Novel Mode page-by-page interactive state
  const [novelModeState, setNovelModeState] = useState<NovelModeState>({
    isWrappingUp: false,
    originalTargetPages: 6, // Will be set on story start
    hasExceededTarget: false,
    customActionHistory: [],
    outlineDriftDetected: false
  });
  const cachedChoicesRef = useRef<Map<number, string[]>>(new Map());

  // Cover variant generation state
  const [coverVariants, setCoverVariants] = useState<{ imageUrl: string; prompt: string }[]>([]);
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null);

  const [showGlobalReroll, setShowGlobalReroll] = useState(false);
  const [globalRerollPageInput, setGlobalRerollPageInput] = useState<string>('1');
  const [showPageNav, setShowPageNav] = useState(true);
  const [pageNavInput, setPageNavInput] = useState<string>('Cover');

  useEffect(() => {
     if (currentSheetIndex === 0) {
         setPageNavInput('Cover');
     } else {
         setPageNavInput(`${currentSheetIndex * 2 - 1}-${currentSheetIndex * 2}`);
     }
  }, [currentSheetIndex]);

  const generatingPages = useRef(new Set<number>());
  const historyRef = useRef<ComicFace[]>([]);
  const isStoppedRef = useRef(false);

  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom(z => Math.min(z + 0.5, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.5, 0.5));
  const resetZoom = () => setZoom(1);

  const [rerollTarget, setRerollTarget] = useState<number | null>(null);
  // Persisted profile selection for RerollModal (so it doesn't reset when modal closes)
  const [rerollProfileSelection, setRerollProfileSelection] = useState<string[]>([]);

  // --- AI Helpers ---
  // Key priority: admin (server key) → user key (localStorage) → env fallback
  const getActiveApiKey = (): string => {
    if (isAdmin && process.env.API_KEY) return process.env.API_KEY;
    if (userApiKey) return userApiKey;
    return process.env.API_KEY || '';
  };

  const getAI = () => {
    const key = getActiveApiKey();
    if (!key) {
      setShowSettings(true);
      throw new Error('No API key configured. Please add one in Settings.');
    }
    return new GoogleGenAI({ apiKey: key });
  };

  // --- Claude/Anthropic API Helpers ---
  const getAnthropicApiKey = (): string => {
    if (isAdmin && process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
    if (userAnthropicKey) return userAnthropicKey;
    return process.env.ANTHROPIC_API_KEY || '';
  };

  const getClaude = (): Anthropic | null => {
    const key = getAnthropicApiKey();
    if (!key) return null; // Claude not available, will fallback to Gemini
    return new Anthropic({
      apiKey: key,
      dangerouslyAllowBrowser: true // Required for browser usage
    });
  };

  const hasClaudeAccess = (): boolean => !!getAnthropicApiKey();

  /**
   * AI Text Improvement Function
   * Uses Claude if available, otherwise falls back to Gemini
   * @param text - The original text to improve
   * @param context - Optional character descriptions or context to use
   * @param purpose - What the text is for (e.g., 'story description', 'regeneration instruction')
   */
  const improveTextWithAI = async (
    text: string,
    context?: string,
    purpose: 'story_description' | 'regeneration_instruction' | 'backstory' = 'story_description'
  ): Promise<string> => {
    const claude = getClaude();

    const purposeInstructions = {
      story_description: `You are a creative writing assistant helping craft compelling comic book story descriptions.
        Enhance this story premise/description to be more engaging, dramatic, and visually interesting while maintaining the original intent.
        Make it suitable for AI image generation - include vivid visual details, action beats, and dramatic moments.
        Keep it concise but impactful (2-4 paragraphs max).`,
      regeneration_instruction: `You are helping improve a regeneration instruction for an AI comic panel generator.
        Make this instruction clearer, more specific, and more effective for guiding image generation.
        Include visual details, composition suggestions, and emotional tone.
        Keep it focused and actionable (1-2 paragraphs max).`,
      backstory: `You are helping enhance a character backstory for a comic book.
        Make it more compelling and interesting while keeping the core character traits.
        Add depth, motivations, and visual details that will help AI image generation.
        Keep it concise but rich (2-3 paragraphs max).`
    };

    const systemPrompt = purposeInstructions[purpose];
    const contextSection = context ? `\n\nRELEVANT CHARACTER/STORY CONTEXT:\n${context}` : '';
    const userPrompt = `${contextSection}\n\nORIGINAL TEXT TO IMPROVE:\n${text}\n\nPlease provide an improved version. Return ONLY the improved text, no explanations or markdown.`;

    try {
      if (claude) {
        // Use Claude
        const response = await claude.messages.create({
          model: MODEL_TEXT_NAME_CLAUDE,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        });
        return getTextFromClaudeResponse(response.content).trim();
      } else {
        // Fallback to Gemini
        const ai = getAI();
        const model = ai.models.generateContent({
          model: MODEL_TEXT_NAME,
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
        });
        const result = await model;
        return result.text?.trim() || text;
      }
    } catch (e) {
      console.error('AI text improvement failed:', e);
      if (claude) handleAnthropicError(e);
      else handleAPIError(e);
      throw new Error('Failed to improve text with AI. Please try again.');
    }
  };

  const handleSettingsKeyChange = (geminiKey: string | null, anthropicKey: string | null, admin: boolean) => {
    setIsAdmin(admin);
    setUserApiKey(geminiKey || '');
    setUserAnthropicKey(anthropicKey || '');
    // Reset alert dismissal when admin logs in (they now have server keys)
    if (admin) setDismissedKeyAlert(false);
  };

  const handleAPIError = (e: any) => {
    const msg = String(e);
    console.error("API Error:", msg);
    if (
      msg.includes('Requested entity was not found') ||
      msg.includes('API_KEY_INVALID') ||
      msg.toLowerCase().includes('permission denied')
    ) {
      setShowSettings(true);
    }
  };

  const handleAnthropicError = (e: any) => {
    const msg = String(e);
    console.error("Anthropic API Error:", msg);
    if (
      msg.includes('invalid_api_key') ||
      msg.includes('authentication_error') ||
      msg.toLowerCase().includes('permission_denied')
    ) {
      setShowSettings(true);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // =========================================================================
  // GENERATION HOOKS (replace inline implementations)
  // =========================================================================

  const hookConfig = {
    getAI,
    getClaude,
    onAPIError: handleAPIError,
    onAnthropicError: handleAnthropicError,
  };

  const { generateBeat: hookGenerateBeat } = useGenerateBeat(hookConfig);
  const { generateImage: hookGenerateImage } = useGenerateImage(hookConfig);
  const { generateCharacterProfile: hookGenerateProfile } = useGenerateProfile(hookConfig);
  const { generateOutline: hookGenerateOutline } = useGenerateOutline(hookConfig);

  // =========================================================================
  // ADAPTER FUNCTIONS (maintain existing call signatures)
  // =========================================================================

  const generateBeat = async (
    history: ComicFace[],
    isRightPage: boolean,
    pageNum: number,
    isDecisionPage: boolean,
    instruction?: string,
    previousChoices?: string[]
  ): Promise<Beat> => {
    return hookGenerateBeat({
      history,
      isRightPage,
      pageNum,
      isDecisionPage,
      instruction,
      previousChoices,
      storyContext,
      storyOutline,
      storyTone,
      richMode,
      extraPages,
    });
  };

  const generateImage = async (
    beat: Beat,
    type: ComicFace['type'],
    instruction?: string,
    extraRefImages?: string[],
    prevImage?: string,
    prevBeat?: Beat,
    pageIndex?: number,
    comicOverrides?: { shotTypeOverride?: ShotType; balloonShapeOverride?: BalloonShape; applyFlashbackStyle?: boolean },
    useOnlySelectedRefs?: boolean,
    currentImageToPreserve?: string
  ): Promise<{ imageUrl: string; originalPrompt: string }> => {
    return hookGenerateImage({
      beat,
      type,
      instruction,
      extraRefImages,
      prevImage,
      prevBeat,
      pageIndex,
      comicOverrides,
      useOnlySelectedRefs,
      currentImageToPreserve,
      storyContext,
      storyOutline,
    });
  };

  const generateCharacterProfile = async (persona: Persona, forceAnalysis = false): Promise<CharacterProfile> => {
    return hookGenerateProfile(persona, forceAnalysis);
  };

  const generateOutline = async (userNotes?: string) => {
    setStoryOutline(prev => ({ ...prev, isGenerating: true }));
    const result = await hookGenerateOutline({
      userNotes,
      storyContext,
      extraPages,
    });
    setStoryOutline({
      content: result.content,
      isReady: true,
      isGenerating: false,
      pageBreakdown: result.pageBreakdown,
      isEnhanced: result.isEnhanced,
      lastEditedAt: Date.now(),
      version: 1,
    });
  };

  // =========================================================================
  // REMOVED: Old inline implementations (now in hooks/)
  // - generateBeat: hooks/useGenerateBeat.ts
  // - generateImage: hooks/useGenerateImage.ts
  // - generateCharacterProfile: hooks/useGenerateProfile.ts
  // - generateOutline: hooks/useGenerateOutline.ts
  // =========================================================================


  const generatePersona = async (desc: string): Promise<Persona> => {
      const style = selectedGenre === 'Custom' ? "Modern American comic book art" : `${selectedGenre} comic`;
      try {
          const ai = getAI();
          const res = await ai.models.generateContent({
              model: MODEL_IMAGE_GEN_NAME,
              contents: { text: `STYLE: Masterpiece ${style} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}` },
              config: { imageConfig: { aspectRatio: '1:1' } }
          });
          const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (part?.inlineData?.data) return { id: Math.random().toString(36).substr(2, 9), name: desc, base64: part.inlineData.data, desc, backstoryText: '', backstoryFiles: [] };
          throw new Error("Failed");
      } catch (e) { 
        handleAPIError(e);
        throw e; 
      }
  };



  const generateAllProfiles = async () => {
      const personas: Persona[] = [];
      if (getHero()) personas.push(getHero());
      if (getFriend()) personas.push(getFriend());
      personas.push(...getAdditionalChars().filter(c => c.base64 || (c.desc && c.desc.trim().length > 0) || (c.backstoryFiles && c.backstoryFiles.length > 0)));
      
      const profiles: CharacterProfile[] = [];
      for (const p of personas) {
          profiles.push(await generateCharacterProfile(p));
      }
      
      // Sync all profiles to Zustand store
      useCharacterStore.getState().setAllProfiles(profiles);
      console.log('[Character Profiles Generated]', profiles);
      return profiles;
  };

  // Generate blank profiles for manual entry (when skipProfileAnalysis is enabled)
  const generateBlankProfiles = (): CharacterProfile[] => {
      const personas: Persona[] = [];
      if (getHero()) personas.push(getHero());
      if (getFriend()) personas.push(getFriend());
      personas.push(...getAdditionalChars().filter(c => c.base64 || c.backstoryText));

      return personas.map(p => ({
          id: p.id,
          name: p.name || 'Unknown Character',
          faceDescription: '',
          bodyType: '',
          clothing: '',
          colorPalette: '',
          distinguishingFeatures: '',
          emblemDescription: '',
          emblemPlacement: p.emblemPlacement === 'other'
              ? p.emblemPlacementCustom || ''
              : p.emblemPlacement?.replace(/-/g, ' ') || '',
          maskDescription: '',
          weaponDescription: '',
      }));
  };

  const handleAnalyzeProfile = async (index: number) => {
      const personas: Persona[] = [];
      if (getHero()) personas.push(getHero());
      if (getFriend()) personas.push(getFriend());
      personas.push(...getAdditionalChars().filter(c => c.base64 || (c.desc && c.desc.trim().length > 0) || (c.backstoryFiles && c.backstoryFiles.length > 0)));

      const persona = personas[index];
      if (!persona) return;

      try {
          const newProfile = await generateCharacterProfile(persona, true); // force analysis on manual click
          setTempProfiles(prev => {
              const arr = [...prev];
              arr[index] = newProfile;
              return arr;
          });
      } catch (e) {
          console.error("Manual reanalyze failed:", e);
      }
  };

  const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
      setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      const idx = historyRef.current.findIndex(f => f.id === id);
      if (idx !== -1) historyRef.current[idx] = { ...historyRef.current[idx], ...updates };
  };

  // Comic fundamentals overrides for reroll
  interface ComicOverrides {
      shotTypeOverride?: ShotType;
      balloonShapeOverride?: BalloonShape;
      applyFlashbackStyle?: boolean;
  }

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type'], instruction?: string, extraRefImages?: string[], previousChoices?: string[], comicOverrides?: ComicOverrides, useOnlySelectedRefs?: boolean, currentImageToPreserve?: string) => {
      const isNovelMode = !generateFromOutline;
      const config = getComicConfig(storyContext.pageLength, extraPages, isNovelMode);
      const isDecision = isNovelMode ? (type === 'story') : config.DECISION_PAGES.includes(pageNum);
      let beat: Beat = { scene: "", choices: [], focus_char: 'other' };

      if (type === 'cover') {
           // Cover beat is handled in generateImage
      } else if (type === 'back_cover') {
           beat = { scene: "Thematic teaser image", choices: [], focus_char: 'other' };
      } else {
           beat = await generateBeat(historyRef.current, pageNum % 2 === 0, pageNum, isDecision, instruction, previousChoices);
      }

      if (beat.focus_char === 'friend' && !getFriend() && type === 'story') {
          try {
              const newSidekick = await generatePersona(selectedGenre === 'Custom' ? "A fitting sidekick for this story" : `Sidekick for ${selectedGenre} story.`);
              setFriend(newSidekick);
          } catch (e) { beat.focus_char = 'other'; }
      }

      updateFaceState(faceId, { narrative: beat, choices: beat.choices, isDecisionPage: isDecision });

      // Retrieve previous context - use historyRef for synchronous access (important for Novel Mode page-by-page flow)
      let prevImage: string | undefined;
      let prevBeat: Beat | undefined;
      if (pageNum > 0) {
          // Use historyRef.current instead of comicFaces (React state) to avoid stale closure data
          const prevFace = historyRef.current.find(f => f.pageIndex === pageNum - 1);
          if (prevFace?.imageUrl) {
              prevImage = prevFace.imageUrl;
              prevBeat = prevFace.narrative;
          }
      }

      const result = await generateImage(beat, type, instruction, extraRefImages, prevImage, prevBeat, pageNum, comicOverrides, useOnlySelectedRefs, currentImageToPreserve);
      if (isStoppedRef.current) return;
      if (!result.imageUrl) {
          updateFaceState(faceId, { isLoading: false, hasFailed: true, originalPrompt: result.originalPrompt });
      } else {
          updateFaceState(faceId, { imageUrl: result.imageUrl, isLoading: false, hasFailed: false, originalPrompt: result.originalPrompt });
      }
  };

  /**
   * Generate multiple cover variants for user selection
   * @param variantCount Number of variants to generate (default 3)
   */
  const generateCoverVariants = async (variantCount: number = 3): Promise<void> => {
    setIsGeneratingVariants(true);
    setCoverVariants([]);
    setSelectedCoverIndex(null);

    const variants: { imageUrl: string; prompt: string }[] = [];
    const coverBeat: Beat = { scene: "", choices: [], focus_char: 'other' };

    // Different cover style variations
    const styleVariations = [
      '', // Default style
      'dramatic lighting with bold shadows',
      'dynamic action pose composition',
      'heroic portrait style with logo treatment',
      'cinematic widescreen composition'
    ];

    try {
      // Generate variants in parallel (max 3 concurrent)
      const variantPromises = [];
      for (let i = 0; i < variantCount; i++) {
        const styleHint = styleVariations[i % styleVariations.length];
        const instruction = styleHint ? `Cover style: ${styleHint}` : undefined;

        variantPromises.push(
          generateImage(coverBeat, 'cover', instruction, undefined, undefined, undefined, 0)
            .then(result => {
              if (result.imageUrl) {
                variants.push({ imageUrl: result.imageUrl, prompt: result.originalPrompt });
                // Update variants progressively
                setCoverVariants([...variants]);
              }
              return result;
            })
            .catch(e => {
              console.error(`Cover variant ${i + 1} failed:`, e);
              return null;
            })
        );
      }

      await Promise.all(variantPromises);

      if (variants.length > 0) {
        setCoverVariants(variants);
        setShowCoverSelector(true);
      }
    } catch (e) {
      console.error('Cover variant generation failed:', e);
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  /**
   * Apply selected cover variant to the comic
   */
  const selectCoverVariant = (index: number) => {
    if (index >= 0 && index < coverVariants.length) {
      const selected = coverVariants[index];
      setSelectedCoverIndex(index);

      // Update the cover face with selected variant
      updateFaceState('cover', {
        imageUrl: selected.imageUrl,
        originalPrompt: selected.prompt,
        isLoading: false,
        hasFailed: false
      });

      setShowCoverSelector(false);
    }
  };

  const generateBatch = async (startPage: number, count: number) => {
      // Pass isNovelMode flag - Novel Mode is when NOT generating from outline
      const isNovelMode = !generateFromOutline;
      const config = getComicConfig(storyContext.pageLength, extraPages, isNovelMode);
      const pagesToGen: number[] = [];
      for (let i = 0; i < count; i++) {
          const p = startPage + i;
          if (p <= config.TOTAL_PAGES && !generatingPages.current.has(p)) {
              pagesToGen.push(p);
          }
      }
      
      if (pagesToGen.length === 0) return;
      pagesToGen.forEach(p => generatingPages.current.add(p));

      const newFaces: ComicFace[] = [];
      pagesToGen.forEach(pageNum => {
          const type = pageNum === config.BACK_COVER_PAGE ? 'back_cover' : 'story';
          newFaces.push({ id: `page-${pageNum}`, type, choices: [], isLoading: true, pageIndex: pageNum });
      });

      setComicFaces(prev => {
          const existing = new Set(prev.map(f => f.id));
          return [...prev, ...newFaces.filter(f => !existing.has(f.id))];
      });
      newFaces.forEach(f => { if (!historyRef.current.find(h => h.id === f.id)) historyRef.current.push(f); });

      try {
          for (const pageNum of pagesToGen) {
               if (isStoppedRef.current) break;
               await generateSinglePage(`page-${pageNum}`, pageNum, pageNum === config.BACK_COVER_PAGE ? 'back_cover' : 'story');
               generatingPages.current.delete(pageNum);
          }
      } catch (e) {
          console.error("Batch generation error", e);
      } finally {
          if (isStoppedRef.current) {
              setComicFaces(prev => prev.filter(f => !f.isLoading || !!f.imageUrl || f.id === 'cover'));
          }
          pagesToGen.forEach(p => generatingPages.current.delete(p));

          // Auto-continue in Outline Mode: generate next batch if more pages remain
          if (!isStoppedRef.current && generateFromOutline) {
              const maxGenerated = Math.max(...pagesToGen, 0);
              if (maxGenerated < config.TOTAL_PAGES) {
                  // Schedule next batch after a small delay
                  setTimeout(() => {
                      if (!isStoppedRef.current) {
                          generateBatch(maxGenerated + 1, config.BATCH_SIZE);
                      }
                  }, 100);
              }
          }
      }
  }

  const handleStoryContextUpdate = (updates: Partial<StoryContext>) => {
    setStoryContext(prev => ({ ...prev, ...updates }));
  };

  // Handle preset selection - updates genre, art style, page length, and story description
  const handlePresetSelect = (preset: ComicPreset) => {
    // Update genre
    setSelectedGenre(preset.genre);

    // Update story context with art style, page length, and story hint
    setStoryContext(prev => ({
      ...prev,
      artStyle: preset.artStyle,
      pageLength: preset.pageLength,
      // Use outline template for story description if available, otherwise use story hint
      descriptionText: preset.outlineTemplate || preset.storyHint
    }));
  };

  const handleOutlineUpload = async (file: File) => {
    if (file.type && !file.type.startsWith('text/') && !file.name.match(/\.(txt|md)$/i)) {
       console.warn("Please upload standard .txt or .md text files only. PDFs are not supported and may crash the editor.");
       return;
    }
    try {
      const content = await file.text();
      setStoryOutline({
        content,
        isReady: true,
        isGenerating: false
      });
    } catch (e) {
      console.error("Failed to read outline file.");
    }
  };


  /**
   * Parse enhanced outline text into structured PageCharacterPlan array
   * Robust implementation with multiple fallback strategies
   */

  // Mode Selection Handlers
  const handleStartAdventure = () => {
    // Validate basic requirements before showing mode selection
    if (!getHero()) {
      console.warn("Please upload a hero portrait first.");
      return;
    }
    if (selectedGenre === 'Custom' && !customPremise.trim()) {
      console.warn("Please enter a custom story premise.");
      return;
    }
    setShowModeSelection(true);
  };

  const handleModeSelect = (mode: 'novel' | 'outline') => {
    setGenerateFromOutline(mode === 'outline');
    // Reset outline state when selecting Outline mode to ensure the modal appears
    if (mode === 'outline') {
      setStoryOutline({ content: "", isReady: false, isGenerating: false });
    }
    setShowModeSelection(false);
    launchStory();
  };

  const handleModeSelectionBack = () => {
    setShowModeSelection(false);
  };

  const launchStory = async () => {
    const hasKey = await validateApiKey();
    if (!hasKey) return;

    // Basic validation already done in handleStartAdventure
    if (!getHero()) return;

    if (skipProfileAnalysis) {
        // Skip AI analysis - use blank profiles for manual entry
        const profiles = generateBlankProfiles();
        setTempProfiles(profiles);
        setShowProfilesStep(true);
    } else if (useSavedProfiles) {
        // Check for existing saved profiles and use them if available
        setIsGeneratingProfiles(true);
        try {
            const store = useCharacterStore.getState();
            const allChars = [getHero(), getFriend(), ...additionalCharacters].filter(Boolean) as Persona[];
            const existingProfiles = store.getProfilesArray();

            // Find which characters already have profiles
            const existingProfileIds = new Set(existingProfiles.map(p => p.id));
            const charsWithProfiles = allChars.filter(c => existingProfileIds.has(c.id));
            const charsWithoutProfiles = allChars.filter(c => !existingProfileIds.has(c.id));

            let finalProfiles: CharacterProfile[] = [];

            // Reuse existing profiles
            for (const char of charsWithProfiles) {
                const existingProfile = existingProfiles.find(p => p.id === char.id);
                if (existingProfile) {
                    finalProfiles.push(existingProfile);
                }
            }

            // Generate missing profiles
            if (charsWithoutProfiles.length > 0) {
                console.log(`[Profile] Generating ${charsWithoutProfiles.length} missing profile(s)...`);
                for (const char of charsWithoutProfiles) {
                    try {
                        const profile = await generateCharacterProfile(char);
                        finalProfiles.push(profile);
                        // Save to store immediately for future use
                        store.setCharacterProfile(char.id, profile);
                    } catch (e) {
                        console.error(`Failed to generate profile for ${char.name}:`, e);
                        // Create a blank profile as fallback
                        const blankProfile: CharacterProfile = {
                            id: char.id,
                            name: char.name,
                            faceDescription: '',
                            bodyType: '',
                            clothing: '',
                            colorPalette: '',
                            distinguishingFeatures: ''
                        };
                        finalProfiles.push(blankProfile);
                        store.setCharacterProfile(char.id, blankProfile);
                    }
                }
            }

            // Sort profiles to match character order
            const charOrder = allChars.map(c => c.id);
            finalProfiles.sort((a, b) => charOrder.indexOf(a.id) - charOrder.indexOf(b.id));

            // Set profiles and skip to generation (no ProfilesDialog)
            setTempProfiles(finalProfiles);
            store.setAllProfiles(finalProfiles);

            // Skip ProfilesDialog and proceed directly
            if (generateFromOutline && !storyOutline.isReady) {
                setShowOutlineStep(true);
                generateOutline();
            } else {
                proceedToComicGeneration();
            }
        } catch (e) {
            console.error("Profile handling failed:", e);
            // Fallback to manual entry
            const profiles = generateBlankProfiles();
            setTempProfiles(profiles);
            setShowProfilesStep(true);
        } finally {
            setIsGeneratingProfiles(false);
        }
    } else {
        // Original flow - AI analysis with ProfilesDialog review
        setIsGeneratingProfiles(true);
        try {
            const profiles = await generateAllProfiles();
            setTempProfiles(profiles);
            setShowProfilesStep(true);
        } catch (e) {
            console.error("Profile generation failed before starting:", e);
            console.error("Failed to analyze character portraits. Check network or API key.");
        } finally {
            setIsGeneratingProfiles(false);
        }
    }
  };

  const continueAfterProfiles = () => {
    // Sync all profiles to Zustand store
    useCharacterStore.getState().setAllProfiles(tempProfiles);
    setShowProfilesStep(false);

    if (generateFromOutline && !storyOutline.isReady) {
        setShowOutlineStep(true);
        generateOutline();
        return;
    }

    proceedToComicGeneration();
  };

  const proceedToComicGeneration = () => {
    const isNovelMode = !generateFromOutline;
    const config = getComicConfig(storyContext.pageLength, extraPages, isNovelMode);
    setIsTransitioning(true);
    isStoppedRef.current = false;
    
    let availableTones = TONES;
    if (selectedGenre === "Teen Drama / Slice of Life" || selectedGenre === "Lighthearted Comedy") {
        availableTones = TONES.filter(t => t.includes("CASUAL") || t.includes("WHOLESOME") || t.includes("QUIPPY"));
    } else if (selectedGenre === "Classic Horror") {
        availableTones = TONES.filter(t => t.includes("INNER-MONOLOGUE") || t.includes("OPERATIC"));
    }
    
    setStoryTone(availableTones[Math.floor(Math.random() * availableTones.length)]);

    const coverFace: ComicFace = { id: 'cover', type: 'cover', choices: [], isLoading: true, pageIndex: 0 };
    setComicFaces([coverFace]);
    historyRef.current = [coverFace];
    generatingPages.current.add(0);

    generateSinglePage('cover', 0, 'cover').finally(() => generatingPages.current.delete(0));
    
    setTimeout(async () => {
        setIsStarted(true);
        setShowSetup(false);
        setIsTransitioning(false);
        // Initialize Novel Mode state with target pages
        setNovelModeState(prev => ({
            ...prev,
            originalTargetPages: storyContext.pageLength,
            isWrappingUp: false,
            hasExceededTarget: false,
            customActionHistory: [],
            outlineDriftDetected: false,
            driftSummary: undefined
        }));
        cachedChoicesRef.current.clear();
        // Both modes now use batching to reduce hallucination/character drift
        // Outline mode just doesn't have decision pauses
        await generateBatch(1, config.INITIAL_PAGES);
        generateBatch(config.INITIAL_PAGES + 1, config.BATCH_SIZE);
    }, 1100);
  };

  // Detect if custom action diverges significantly from the story outline
  const detectOutlineDrift = (customAction: string, currentPage: number): { isDrifting: boolean; summary?: string } => {
      if (!storyOutline.content || !storyOutline.isReady) {
          return { isDrifting: false };
      }

      // Extract relevant outline section for current page range
      const outlineLines = storyOutline.content.split('\n');
      const pagePattern = new RegExp(`PAGE\\s*${currentPage}|Page\\s*${currentPage}`, 'i');

      let relevantSection = '';
      let foundPage = false;
      for (const line of outlineLines) {
          if (pagePattern.test(line)) {
              foundPage = true;
          }
          if (foundPage) {
              relevantSection += line + '\n';
              if (/PAGE\s*\d+/i.test(line) && !pagePattern.test(line)) {
                  break;
              }
          }
      }

      if (!relevantSection) {
          return { isDrifting: false };
      }

      // Extract keywords from both action and outline section
      const extractKeywords = (text: string): string[] => {
          const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by', 'this', 'that', 'it'];
          return text.toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter(word => word.length > 3 && !stopWords.includes(word));
      };

      const outlineKeywords = extractKeywords(relevantSection);
      const actionKeywords = extractKeywords(customAction);

      // Check for significant divergence
      const overlap = outlineKeywords.filter(k => actionKeywords.includes(k));
      const overlapRatio = overlap.length / Math.max(outlineKeywords.length, 1);

      // Check for location/character contradictions
      const actionLower = customAction.toLowerCase();
      const contradictions: string[] = [];

      if ((actionLower.includes('leave') || actionLower.includes('go to') || actionLower.includes('travel')) &&
          !relevantSection.toLowerCase().includes('leave') && !relevantSection.toLowerCase().includes('travel')) {
          contradictions.push('Unexpected location change');
      }

      if (overlapRatio < 0.15 || contradictions.length > 0) {
          return {
              isDrifting: true,
              summary: contradictions.length > 0
                  ? `Your action "${customAction.substring(0, 40)}..." may diverge from the outline: ${contradictions.join(', ')}`
                  : `Your action "${customAction.substring(0, 40)}..." diverges from the planned story direction.`
          };
      }

      return { isDrifting: false };
  };

  const handleChoice = async (pageIndex: number, choice: string, isCustomAction: boolean = false) => {
      const isNovelMode = !generateFromOutline;
      const config = getComicConfig(storyContext.pageLength, extraPages, isNovelMode);

      // Mark the choice on the current page
      updateFaceState(`page-${pageIndex}`, { resolvedChoice: choice, customActionUsed: isCustomAction ? choice : undefined });

      // If skipped, just dismiss the dialogue - don't generate new pages
      if (choice === '[SKIPPED]') return;

      if (isNovelMode) {
          // Track custom actions for potential drift detection
          if (isCustomAction) {
              setNovelModeState(prev => ({
                  ...prev,
                  customActionHistory: [
                      ...prev.customActionHistory,
                      { pageIndex, action: choice, timestamp: Date.now() }
                  ]
              }));

              // Check for outline drift if we have an outline
              if (storyOutline.isReady && storyOutline.content) {
                  const driftResult = detectOutlineDrift(choice, pageIndex);
                  if (driftResult.isDrifting) {
                      setNovelModeState(prev => ({
                          ...prev,
                          outlineDriftDetected: true,
                          driftSummary: driftResult.summary
                      }));
                      // Don't block - just flag for user notification
                  }
              }
          }

          const currentPage = Math.max(...historyRef.current.map(f => f.pageIndex || 0));
          const nextPage = currentPage + 1;

          // Check if we've reached/exceeded target
          if (nextPage > novelModeState.originalTargetPages && !novelModeState.hasExceededTarget) {
              setNovelModeState(prev => ({ ...prev, hasExceededTarget: true }));
          }

          // Generate exactly 1 page in Novel Mode (page-by-page flow)
          if (nextPage <= config.TOTAL_PAGES) {
              // Create placeholder face
              const faceId = `page-${nextPage}`;
              const type: ComicFace['type'] = nextPage === config.BACK_COVER_PAGE ? 'back_cover' : 'story';
              const isExtra = nextPage > novelModeState.originalTargetPages;

              const newFace: ComicFace = {
                  id: faceId,
                  type,
                  choices: [],
                  isLoading: true,
                  pageIndex: nextPage,
                  isExtraPage: isExtra,
                  isDecisionPage: type === 'story' // Every story page is a decision page in Novel Mode
              };

              setComicFaces(prev => {
                  const existing = prev.find(f => f.id === faceId);
                  if (existing) return prev;
                  return [...prev, newFace];
              });
              historyRef.current.push(newFace);
              generatingPages.current.add(nextPage);

              // Generate single page with the user's choice as context
              await generateSinglePage(faceId, nextPage, type, `User chose: "${choice}". Continue the story based on this choice.`);
              generatingPages.current.delete(nextPage);

              // Cache choices for reroll preservation after generation
              const generatedFace = historyRef.current.find(f => f.pageIndex === nextPage);
              if (generatedFace?.choices && generatedFace.choices.length > 0) {
                  cachedChoicesRef.current.set(nextPage, [...generatedFace.choices]);
                  // Also update face state with originalChoices for reroll
                  updateFaceState(faceId, { originalChoices: [...generatedFace.choices] });
              }
          }
      } else {
          // Outline Mode: Use batch generation
          const maxPage = Math.max(...historyRef.current.map(f => f.pageIndex || 0));
          if (maxPage + 1 <= config.TOTAL_PAGES) {
              generateBatch(maxPage + 1, config.BATCH_SIZE);
          }
      }
  }

  // Get wrap-up instruction for final story page
  const getWrapUpInstruction = (): string => {
      // Collect significant user choices for narrative closure
      const significantChoices = novelModeState.customActionHistory
          .slice(-3) // Last 3 custom actions
          .map(c => c.action)
          .join(', ');

      return `
[WRAP-UP PAGE - FINAL PAGE OF STORY]
This is the FINAL PAGE. The user has chosen to end the story here.

INSTRUCTIONS:
1. Bring the current narrative thread to a SATISFYING CONCLUSION
2. Reference the user's key choices: ${significantChoices || 'their journey throughout the story'}
3. End with either:
   - A clear resolution (if the story feels complete)
   - A meaningful cliffhanger with "TO BE CONTINUED..." (if tension remains)
4. Make the ending feel EARNED - don't rush, but don't drag
5. The tone should match the story's established mood
6. DO NOT generate any choices - this is the final page

Create a powerful, memorable conclusion that honors the user's story path.
      `.trim();
  };

  // Handle "Stop Here" - wrap up story with final page
  const handleStopHere = async () => {
      setNovelModeState(prev => ({ ...prev, isWrappingUp: true }));

      const currentPage = Math.max(...historyRef.current.map(f => f.pageIndex || 0));
      const wrapUpPage = currentPage + 1;
      const config = getComicConfig(storyContext.pageLength, extraPages, true);

      // Generate final wrap-up page (not a decision page)
      const faceId = `page-${wrapUpPage}`;
      const newFace: ComicFace = {
          id: faceId,
          type: 'story',
          choices: [],
          isLoading: true,
          pageIndex: wrapUpPage,
          isDecisionPage: false // Final page has no choices
      };

      setComicFaces(prev => [...prev.filter(f => f.id !== faceId), newFace]);
      historyRef.current = historyRef.current.filter(f => f.id !== faceId);
      historyRef.current.push(newFace);
      generatingPages.current.add(wrapUpPage);

      try {
          await generateSinglePage(faceId, wrapUpPage, 'story', getWrapUpInstruction());
      } catch (e) {
          console.error('[handleStopHere] Wrap-up page generation failed:', e);
          updateFaceState(faceId, { isLoading: false, hasFailed: true });
      } finally {
          generatingPages.current.delete(wrapUpPage);
      }

      // Check if wrap-up page succeeded before generating back cover
      const wrapUpResult = historyRef.current.find(f => f.id === faceId);
      if (wrapUpResult?.hasFailed) {
          console.warn('[handleStopHere] Wrap-up page failed, skipping back cover');
          setNovelModeState(prev => ({ ...prev, isWrappingUp: false }));
          return;
      }

      // Generate back cover
      const backCoverPage = wrapUpPage + 1;
      const backCoverId = `page-${backCoverPage}`;
      const backCoverFace: ComicFace = {
          id: backCoverId,
          type: 'back_cover',
          choices: [],
          isLoading: true,
          pageIndex: backCoverPage,
          isDecisionPage: false
      };

      setComicFaces(prev => [...prev.filter(f => f.id !== backCoverId), backCoverFace]);
      historyRef.current.push(backCoverFace);
      generatingPages.current.add(backCoverPage);

      try {
          await generateSinglePage(backCoverId, backCoverPage, 'back_cover');
      } catch (e) {
          console.error('[handleStopHere] Back cover generation failed:', e);
          updateFaceState(backCoverId, { isLoading: false, hasFailed: true });
      } finally {
          generatingPages.current.delete(backCoverPage);
      }

      // Update extra pages count
      setExtraPages(wrapUpPage - storyContext.pageLength);
      setNovelModeState(prev => ({ ...prev, isWrappingUp: false }));
  };

  const handleReroll = (pageIndex: number) => {
      setRerollTarget(pageIndex);
  };

  // Quick retry with enhanced context (emblem/weapon refs + outline)
  const handleQuickRetry = async (pageIndex: number) => {
      const config = getComicConfig(storyContext.pageLength, extraPages);
      const faceId = pageIndex === 0 ? 'cover' : `page-${pageIndex}`;
      const type: ComicFace['type'] = pageIndex === 0 ? 'cover' : (pageIndex === config.BACK_COVER_PAGE ? 'back_cover' : 'story');

      // Collect all emblem and weapon reference images
      const enhancedRefImages: string[] = [];
      const collectRefs = (p: Persona | null) => {
          if (!p) return;
          if (p.emblemImage) enhancedRefImages.push(p.emblemImage);
          if (p.weaponImage) enhancedRefImages.push(p.weaponImage);
          // Also include portrait and character refs for better consistency
          if (p.base64) enhancedRefImages.push(p.base64);
          const refs = p.referenceImages || (p.referenceImage ? [p.referenceImage] : []);
          refs.forEach(r => enhancedRefImages.push(r));
      };
      collectRefs(getHero());
      collectRefs(getFriend());
      getAdditionalChars().forEach(c => collectRefs(c));

      // Build enhanced instruction with page context
      let enhancedInstruction = `[RETRY WITH ENHANCED CONTEXT] This is a retry for page ${pageIndex}.`;

      // Add outline context if available
      if (storyOutline.content && generateFromOutline) {
          // Try to extract the relevant page section from outline
          const outlineLines = storyOutline.content.split('\n');
          const pagePattern = new RegExp(`(page\\s*${pageIndex}|panel\\s*${pageIndex})`, 'i');
          let pageOutline = '';
          let capturing = false;
          for (const line of outlineLines) {
              if (pagePattern.test(line)) {
                  capturing = true;
                  pageOutline = line + '\n';
              } else if (capturing) {
                  if (/^(page|panel)\s*\d+/i.test(line)) break;
                  pageOutline += line + '\n';
              }
          }
          if (pageOutline.trim()) {
              enhancedInstruction += `\n\nOUTLINE FOR THIS PAGE:\n${pageOutline.trim()}`;
          }
      }

      enhancedInstruction += `\n\nPay special attention to character emblems, logos, and weapons. Use the provided reference images to ensure accuracy.`;

      // Set loading state
      updateFaceState(faceId, { isLoading: true, hasFailed: false });

      // Generate with enhanced context
      try {
          await generateSinglePage(faceId, pageIndex, type, enhancedInstruction, enhancedRefImages.length > 0 ? enhancedRefImages : undefined);
      } catch (e) {
          console.error('Quick retry failed:', e);
          updateFaceState(faceId, { isLoading: false, hasFailed: true });
      }
  };

  const getRerollGallery = () => {
      const items: { id: string; base64: string; label: string; charId: string }[] = [];
      const addPersona = (p: Persona | null, label: string) => {
          if (!p) return;
          if (p.base64) items.push({ id: `${p.id}-portrait`, base64: p.base64, label: `${label} Portrait`, charId: p.id });
          const refs = p.referenceImages || (p.referenceImage ? [p.referenceImage] : []);
          refs.forEach((r, i) => items.push({ id: `${p.id}-ref-${i}`, base64: r, label: `${label} Ref ${i+1}`, charId: p.id }));
      };
      addPersona(hero, hero?.name || 'Hero');
      addPersona(friend, friend?.name || 'Co-Star');
      additionalCharacters.forEach(c => addPersona(c, c.name || 'Char'));
      return items;
  };

  const handleRerollSubmit = (options: RerollOptions) => {
      if (rerollTarget === null) return;
      const { instruction, negativePrompt, selectedRefImages, selectedProfileIds, regenerationModes, shotTypeOverride, balloonShapeOverride, applyFlashbackStyle, reinforceWithReferenceImages, useSelectedRefsOnly } = options;

      const pageIndex = rerollTarget;
      setRerollTarget(null);
      const faceId = pageIndex === 0 ? 'cover' : `page-${pageIndex}`;
      const type = pageIndex === 0 ? 'cover' : 'story';

      // Get previous choices from the face being rerolled (for Novel Mode choice reroll)
      const currentFace = comicFaces.find(f => f.id === faceId);
      const previousChoices = currentFace?.isDecisionPage ? currentFace.choices : undefined;

      // Store previous choices in face state for potential future rerolls
      const existingPreviousChoices = currentFace?.previousChoices || [];
      const allPreviousChoices = previousChoices
          ? [...existingPreviousChoices, ...previousChoices]
          : existingPreviousChoices;

      // Build final instruction based on regeneration modes (supports multiple)
      let finalInstruction = instruction || '';
      const modeInstructions: Record<RegenerationMode, string> = {
          'full': '',
          'characters_only': '[CHARACTERS ONLY - PRESERVE SCENE] Study the CURRENT PANEL IMAGE below. Keep the EXACT same background, environment, lighting, and scene composition. ONLY regenerate the character(s) with improved consistency to their reference images. The background MUST remain identical.',
          'expression_only': '[EXPRESSION ONLY - PRESERVE EVERYTHING] Study the CURRENT PANEL IMAGE below. Keep EVERYTHING exactly the same (pose, clothing, background, lighting). ONLY change the facial expression of the character(s).',
          'outfit_only': '[OUTFIT ONLY - PRESERVE SCENE] Study the CURRENT PANEL IMAGE below. Keep the face, pose, background, and lighting exactly the same. ONLY change the clothing/outfit of the character(s).',
          'emblem_only': '[EMBLEM ONLY - PRESERVE SCENE] Study the CURRENT PANEL IMAGE below. Keep everything exactly the same EXCEPT the emblem/logo. Reproduce the EMBLEM/LOGO reference EXACTLY - same shape, colors, proportions, and placement.',
          'weapon_only': '[WEAPON ONLY - PRESERVE SCENE] Study the CURRENT PANEL IMAGE below. Keep everything exactly the same EXCEPT the weapon. Reproduce the WEAPON reference EXACTLY - same design, shape, details, and style.'
      };

      // BATCH 1.4.1: Pass current image for non-full modes to help preserve scene
      const isNonFullMode = regenerationModes && regenerationModes.some(m => m !== 'full');
      const currentImage = isNonFullMode && currentFace?.imageUrl ? currentFace.imageUrl : undefined;

      // Combine instructions from all selected modes (excluding 'full')
      if (regenerationModes && regenerationModes.length > 0) {
          const nonFullModes = regenerationModes.filter(m => m !== 'full');
          if (nonFullModes.length > 0) {
              const combinedModeInstructions = nonFullModes.map(m => modeInstructions[m]).join(' ');
              finalInstruction = combinedModeInstructions + (instruction ? ` Additional: ${instruction}` : '');
          }
      }

      // Add negative prompt if provided - explicitly tell AI what NOT to include
      if (negativePrompt) {
          finalInstruction += ` [IMPORTANT - DO NOT INCLUDE THE FOLLOWING: ${negativePrompt}. These elements must NOT appear in the generated image.]`;
      }

      // Add reference image reinforcement if enabled
      if (reinforceWithReferenceImages && selectedRefImages.length > 0) {
          finalInstruction += ` [CRITICAL REFERENCE IMAGE DIRECTIVE] You MUST carefully study ALL ${selectedRefImages.length} selected reference images. Match character appearances, costumes, accessories, emblems, and weapons EXACTLY as shown in these references. The reference images are your PRIMARY source of truth for visual consistency - copy every visible detail precisely.`;
      }

      // Build comic fundamentals overrides object
      const comicOverrides = {
          shotTypeOverride,
          balloonShapeOverride,
          applyFlashbackStyle,
      };

      updateFaceState(faceId, { isLoading: true, imageUrl: undefined, hasFailed: false, previousChoices: allPreviousChoices });

      const savedProfiles = getProfilesArray();
      const filteredProfiles = savedProfiles.filter(p => selectedProfileIds.includes(p.id));
      // Temporarily set filtered profiles for this regeneration
      useCharacterStore.getState().setAllProfiles(filteredProfiles);

      // In Novel Mode, preserve original choices instead of regenerating them
      const isNovelMode = !generateFromOutline;
      const preservedChoices = isNovelMode && currentFace?.isDecisionPage
          ? (currentFace.originalChoices || cachedChoicesRef.current.get(pageIndex) || currentFace.choices)
          : undefined;

      generateSinglePage(faceId, pageIndex, type, finalInstruction || undefined, selectedRefImages.length > 0 ? selectedRefImages : undefined, allPreviousChoices.length > 0 ? allPreviousChoices : undefined, comicOverrides, useSelectedRefsOnly && selectedRefImages.length > 0, currentImage)
          .then(() => {
              // Restore preserved choices in Novel Mode after image regeneration
              if (preservedChoices && preservedChoices.length > 0 && isNovelMode) {
                  updateFaceState(faceId, {
                      choices: preservedChoices,
                      originalChoices: preservedChoices,
                      isDecisionPage: currentFace?.isDecisionPage
                  });
              }
          })
          .finally(() => {
              // Restore original profiles after regeneration
              useCharacterStore.getState().setAllProfiles(savedProfiles);
          });
  };

  const handleRerollUploadRef = async (files: FileList) => {
      // Upload new refs to the hero by default (they'll appear in the gallery)
      try {
          const newRefs: string[] = [];
          for (let i = 0; i < files.length; i++) {
              newRefs.push(await fileToBase64(files[i]));
          }
          const existing = hero?.referenceImages || (hero?.referenceImage ? [hero.referenceImage] : []);
          handleHeroUpdate({ referenceImages: [...existing, ...newRefs] });
      } catch (e) { console.error('Upload failed'); }
  };

  const handleRerollDeleteRef = (charId: string, refIndex: number) => {
      const getExisting = (p: Persona | null) => p?.referenceImages || (p?.referenceImage ? [p.referenceImage] : []);
      if (charId === 'hero' || charId === hero?.id) {
          handleHeroUpdate({ referenceImages: getExisting(hero).filter((_, i) => i !== refIndex) });
      } else if (charId === 'friend' || charId === friend?.id) {
          handleFriendUpdate({ referenceImages: getExisting(friend).filter((_, i) => i !== refIndex) });
      } else {
          const char = additionalCharacters.find(c => c.id === charId);
          handleUpdateCharacter(charId, { referenceImages: getExisting(char || null).filter((_, i) => i !== refIndex) });
      }
  };

  const handleAddPage = (instruction?: string) => {
      const oldConfig = getComicConfig(storyContext.pageLength, extraPages);
      const newExtraPages = extraPages + 1;
      setExtraPages(newExtraPages);
      
      const newConfig = getComicConfig(storyContext.pageLength, newExtraPages);
      const oldBackCoverId = `page-${oldConfig.BACK_COVER_PAGE}`;
      
      // Convert old back cover to story
      updateFaceState(oldBackCoverId, { type: 'story', isLoading: true, imageUrl: undefined });
      
      // Add the new back cover to state
      const newBackCover: ComicFace = { id: `page-${newConfig.BACK_COVER_PAGE}`, type: 'back_cover', choices: [], isLoading: true, pageIndex: newConfig.BACK_COVER_PAGE };
      setComicFaces(prev => [...prev, newBackCover]);
      historyRef.current.push(newBackCover);
      
      generatingPages.current.add(oldConfig.BACK_COVER_PAGE);
      generateSinglePage(oldBackCoverId, oldConfig.BACK_COVER_PAGE, 'story', instruction).finally(() => {
          generatingPages.current.delete(oldConfig.BACK_COVER_PAGE);
          generatingPages.current.add(newConfig.BACK_COVER_PAGE);
          generateSinglePage(`page-${newConfig.BACK_COVER_PAGE}`, newConfig.BACK_COVER_PAGE, 'back_cover').finally(() => {
              generatingPages.current.delete(newConfig.BACK_COVER_PAGE);
          });
      });
  };

  const handleStop = () => {
      isStoppedRef.current = true;
      setComicFaces(prev => prev.filter(f => !f.isLoading || !!f.imageUrl || f.id === 'cover'));
  };

  const resetApp = () => {
      setIsStarted(false);
      setShowSetup(true);
      setComicFaces([]);
      setCurrentSheetIndex(0);
      historyRef.current = [];
      generatingPages.current.clear();
      setHero(null);
      setFriend(null);
      setAdditionalCharacters([]);
      setExtraPages(0);
  };

  const handleGoHome = () => {
      if (window.confirm("Return to setup? Your current generated pages will be lost, but your characters and settings will be saved. To save your generated comic, use the 'Save Draft' button first.")) {
          setIsStarted(false);
          setShowSetup(true);
          setComicFaces([]);
          historyRef.current = [];
          generatingPages.current.clear();
          setExtraPages(0);
      }
  };

  const handleClearSetup = () => {
      if (!window.confirm("Are you sure you want to completely clear the setup and characters?")) return;
      setHero(null);
      setFriend(null);
      setAdditionalCharacters([]);
      setStoryContext({
        title: "",
        descriptionText: "",
        descriptionFiles: [],
        publisherName: "Marvel",
        seriesTitle: "Infinite Heroes",
        issueNumber: "1",
        useOverlayLogo: true,
        artStyle: ART_STYLES[0],
        pageLength: 10
      });
      setCustomPremise("");
      setSelectedGenre(GENRES[0]);
      setStoryOutline({ content: "", isReady: false, isGenerating: false });
      localStorage.removeItem('infinite_heroes_cast');
  };

  const compositeCover = async (imageUrl: string, context: StoryContext): Promise<string> => {
      return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 720;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(imageUrl);

          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
               ctx.drawImage(img, 0, 0, 480, 720);
               if (context.useOverlayLogo) {
                   ctx.fillStyle = 'white';
                   ctx.fillRect(160, 20, 160, 80);
                   ctx.lineWidth = 4;
                   ctx.strokeStyle = 'black';
                   ctx.strokeRect(160, 20, 160, 80);
                   
                   ctx.fillStyle = context.publisherLogoBgColor || '#DC2626';
                   ctx.fillRect(160, 20, 160, 45);
                   ctx.strokeRect(160, 20, 160, 45);

                   const finishText = () => {
                       ctx.fillStyle = 'black';
                       ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
                       ctx.textAlign = 'center';
                       ctx.textBaseline = 'middle';
                       ctx.fillText(`#${context.issueNumber || '1'}`, 240, 82);

                       ctx.font = 'bold 44px Impact, sans-serif';
                       ctx.textAlign = 'center';
                       ctx.lineWidth = 6;
                       ctx.lineJoin = 'round';
                       ctx.strokeStyle = 'black';
                       ctx.strokeText(context.seriesTitle.toUpperCase(), 240, 150);
                       ctx.fillStyle = '#FFD700';
                       ctx.fillText(context.seriesTitle.toUpperCase(), 240, 150);

                       // Story Title below Series Title
                       if (context.title) {
                           ctx.font = 'bold 22px Impact, sans-serif';
                           ctx.lineWidth = 4;
                           ctx.strokeStyle = 'black';
                           ctx.strokeText(context.title.toUpperCase(), 240, 190);
                           ctx.fillStyle = 'white';
                           ctx.fillText(context.title.toUpperCase(), 240, 190);
                       }

                       resolve(canvas.toDataURL('image/jpeg', 0.9));
                   };

                   if (context.publisherLogo) {
                       const logoImg = new Image();
                       logoImg.crossOrigin = "anonymous";
                       logoImg.onload = () => {
                           if (context.publisherLogoFit === 'cover') {
                               ctx.drawImage(logoImg, 160, 20, 160, 45);
                           } else {
                               const aspect = logoImg.width / logoImg.height;
                               let lw = 160, lh = 45;
                               if (aspect > 160/45) lh = 160 / aspect;
                               else lw = 45 * aspect;
                               ctx.drawImage(logoImg, 160 + (160-lw)/2, 20 + (45-lh)/2, lw, lh);
                           }
                           finishText();
                       };
                       logoImg.onerror = finishText;
                       logoImg.src = `data:image/png;base64,${context.publisherLogo}`;
                   } else {
                       ctx.fillStyle = 'white';
                       ctx.font = 'bold 16px Impact, sans-serif';
                       ctx.textAlign = 'center';
                       ctx.textBaseline = 'middle';
                       ctx.fillText(context.publisherName.substring(0, 15).toUpperCase(), 240, 42);
                       finishText();
                   }
               } else {
                   resolve(imageUrl);
               }
          };
          img.onerror = () => resolve(imageUrl);
          img.src = imageUrl;
      });
  };

  // Apply CMYK-like color adjustment (approximation for browser)
  const applyCmykAdjustment = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Reduce saturation slightly and adjust for print appearance
      // This is an approximation - true CMYK requires professional software
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert to grayscale component
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Blend towards desaturated by ~10% and reduce overall brightness by ~5%
      // This simulates the "duller" look of print vs screen
      const saturationFactor = 0.9;
      const brightnessFactor = 0.95;

      data[i] = Math.round((r * saturationFactor + gray * (1 - saturationFactor)) * brightnessFactor);
      data[i + 1] = Math.round((g * saturationFactor + gray * (1 - saturationFactor)) * brightnessFactor);
      data[i + 2] = Math.round((b * saturationFactor + gray * (1 - saturationFactor)) * brightnessFactor);
    }
    return imageData;
  };

  // Process image with optional CMYK adjustment
  const processImageForPrint = async (imageUrl: string, cmykMode: boolean): Promise<string> => {
    if (!cmykMode) return imageUrl;

    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const adjustedData = applyCmykAdjustment(imageData);
        ctx.putImageData(adjustedData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  // Draw bleed marks on PDF page
  const drawBleedMarks = (doc: jsPDF, pageWidth: number, pageHeight: number, bleedMm: number) => {
    const bleedPt = bleedMm * 2.83465; // Convert mm to points
    const markLength = 12; // Length of crop marks in points
    const markOffset = 3; // Offset from edge in points

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);

    // Top-left corner marks
    doc.line(bleedPt - markOffset - markLength, bleedPt, bleedPt - markOffset, bleedPt); // Horizontal
    doc.line(bleedPt, bleedPt - markOffset - markLength, bleedPt, bleedPt - markOffset); // Vertical

    // Top-right corner marks
    doc.line(pageWidth - bleedPt + markOffset, bleedPt, pageWidth - bleedPt + markOffset + markLength, bleedPt);
    doc.line(pageWidth - bleedPt, bleedPt - markOffset - markLength, pageWidth - bleedPt, bleedPt - markOffset);

    // Bottom-left corner marks
    doc.line(bleedPt - markOffset - markLength, pageHeight - bleedPt, bleedPt - markOffset, pageHeight - bleedPt);
    doc.line(bleedPt, pageHeight - bleedPt + markOffset, bleedPt, pageHeight - bleedPt + markOffset + markLength);

    // Bottom-right corner marks
    doc.line(pageWidth - bleedPt + markOffset, pageHeight - bleedPt, pageWidth - bleedPt + markOffset + markLength, pageHeight - bleedPt);
    doc.line(pageWidth - bleedPt, pageHeight - bleedPt + markOffset, pageWidth - bleedPt, pageHeight - bleedPt + markOffset + markLength);
  };

  const downloadPDF = async (faces: ComicFace[], options: Omit<ExportOptions, 'format'>) => {
    const { cmykMode, addBleedMarks, pageSize, customWidth, customHeight, resolution } = options;

    // Get page dimensions based on selection
    const pageDimensions = pageSize === 'custom'
      ? { width: customWidth, height: customHeight }
      : PAGE_SIZES[pageSize];

    // Convert inches to points (72 points per inch)
    const baseWidthPt = pageDimensions.width * 72;
    const baseHeightPt = pageDimensions.height * 72;

    // Add bleed area if enabled (3mm = ~8.5 points)
    const bleedMm = 3;
    const bleedPt = addBleedMarks ? bleedMm * 2.83465 : 0;
    const PAGE_WIDTH = baseWidthPt + (bleedPt * 2);
    const PAGE_HEIGHT = baseHeightPt + (bleedPt * 2);

    // Get DPI for metadata
    const dpi = RESOLUTION_OPTIONS[resolution].dpi;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [PAGE_WIDTH, PAGE_HEIGHT]
    });

    // Set document properties with resolution info
    doc.setProperties({
      title: storyContext.title || 'Infinite Heroes Comic',
      creator: 'Infinite Heroes Comic Creator',
      keywords: `comic, ${resolution}, ${dpi}DPI`
    });

    const pagesToPrint = faces.filter(face => face.imageUrl && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    for (let index = 0; index < pagesToPrint.length; index++) {
        const face = pagesToPrint[index];
        if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
        if (face.imageUrl) {
            let finalImg = (face.type === 'cover' && storyContext.useOverlayLogo)
                ? await compositeCover(face.imageUrl, storyContext)
                : face.imageUrl;

            // Apply CMYK adjustment if enabled
            if (cmykMode) {
              finalImg = await processImageForPrint(finalImg, true);
            }

            // Add image with bleed offset
            doc.addImage(finalImg, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);

            // Draw bleed/trim marks if enabled
            if (addBleedMarks) {
              drawBleedMarks(doc, PAGE_WIDTH, PAGE_HEIGHT, bleedMm);
            }
        }
    }
    doc.save(`${storyContext.title || 'Infinite-Heroes'}-Issue.pdf`);
  };

  const downloadImages = async (faces: ComicFace[], format: 'webp' | 'png' | 'jpeg') => {
    const pagesToPrint = faces.filter(face => face.imageUrl && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));
    
    for (const face of pagesToPrint) {
      if (!face.imageUrl) continue;
      
      let downloadUrl = face.imageUrl;
      
      if (face.type === 'cover' && storyContext.useOverlayLogo) {
          downloadUrl = await compositeCover(face.imageUrl, storyContext);
      }
      
      // If the requested format is different from the source, we might need to convert
      // But for simplicity and browser compatibility, we'll try to trigger download with the requested extension
      // Most modern browsers will handle the data URL correctly regardless of the extension if it's a valid image
      // However, to be precise, we can use a canvas to convert
      
      if (!face.imageUrl.includes(`image/${format}`)) {
        downloadUrl = await new Promise<string>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL(`image/${format}`));
          };
          img.src = face.imageUrl!;
        });
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${storyContext.title || 'Infinite-Heroes'}-Page-${face.pageIndex}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay to prevent browser from blocking multiple downloads
      await new Promise(r => setTimeout(r, 200));
    }
  };

  const handleExport = async (options: ExportOptions) => {
    setShowExportDialog(false);
    const faces = comicFaces.filter(f => f.imageUrl && !f.isLoading);
    if (faces.length === 0) {
      console.warn("No pages ready to export yet!");
      return;
    }

    if (options.format === 'pdf') {
      const { format, ...pdfOptions } = options;
      await downloadPDF(faces, pdfOptions);
    } else {
      await downloadImages(faces, options.format);
    }
  };

  const handleHeroUpdate = async (updates: Partial<Persona>) => {
    setHero(hero ? { ...hero, ...updates } : { id: 'hero', name: 'Hero', base64: '', desc: 'Main Hero', ...updates });
  };

  const handleFriendUpdate = async (updates: Partial<Persona>) => {
    setFriend(friend ? { ...friend, ...updates } : { id: 'friend', name: 'Co-Star', base64: '', desc: 'Sidekick', ...updates });
  };

  const handlePortraitUpload = async (id: string, file: File) => {
    try {
      const base64 = await fileToBase64(file);
      if (id === 'hero') handleHeroUpdate({ base64 });
      else if (id === 'friend') handleFriendUpdate({ base64 });
      else handleUpdateCharacter(id, { base64 });
    } catch (e) { console.error("Upload failed"); }
  };

  const handleRefUpload = async (id: string, files: FileList) => {
    try {
      const newRefs: string[] = [];
      for (let i = 0; i < files.length; i++) {
        newRefs.push(await fileToBase64(files[i]));
      }
      const getExisting = (p: Persona | null) => p?.referenceImages || (p?.referenceImage ? [p.referenceImage] : []);
      if (id === 'hero') handleHeroUpdate({ referenceImages: [...getExisting(hero), ...newRefs] });
      else if (id === 'friend') handleFriendUpdate({ referenceImages: [...getExisting(friend), ...newRefs] });
      else {
        const char = additionalCharacters.find(c => c.id === id);
        handleUpdateCharacter(id, { referenceImages: [...getExisting(char || null), ...newRefs] });
      }
    } catch (e) { console.error("Upload failed"); }
  };

  const handleRefRemove = (id: string, index: number) => {
    const getExisting = (p: Persona | null) => p?.referenceImages || (p?.referenceImage ? [p.referenceImage] : []);
    if (id === 'hero') handleHeroUpdate({ referenceImages: getExisting(hero).filter((_, i) => i !== index) });
    else if (id === 'friend') handleFriendUpdate({ referenceImages: getExisting(friend).filter((_, i) => i !== index) });
    else {
      const char = additionalCharacters.find(c => c.id === id);
      handleUpdateCharacter(id, { referenceImages: getExisting(char || null).filter((_, i) => i !== index) });
    }
  };

  const handleEmblemUpload = async (id: string, file: File) => {
    try {
      const base64 = await fileToBase64(file);
      if (id === 'hero') handleHeroUpdate({ emblemImage: base64 });
      else if (id === 'friend') handleFriendUpdate({ emblemImage: base64 });
      else handleUpdateCharacter(id, { emblemImage: base64 });
    } catch (e) { console.error("Emblem upload failed"); }
  };

  const handleEmblemRemove = (id: string) => {
    if (id === 'hero') handleHeroUpdate({ emblemImage: undefined, emblemPlacement: undefined, emblemPlacementCustom: undefined });
    else if (id === 'friend') handleFriendUpdate({ emblemImage: undefined, emblemPlacement: undefined, emblemPlacementCustom: undefined });
    else handleUpdateCharacter(id, { emblemImage: undefined, emblemPlacement: undefined, emblemPlacementCustom: undefined });
  };

  const handleWeaponUpload = async (id: string, file: File) => {
    try {
      const base64 = await fileToBase64(file);
      if (id === 'hero') handleHeroUpdate({ weaponImage: base64 });
      else if (id === 'friend') handleFriendUpdate({ weaponImage: base64 });
      else handleUpdateCharacter(id, { weaponImage: base64 });
    } catch (e) { console.error("Weapon image upload failed"); }
  };

  const handleWeaponRemove = (id: string) => {
    if (id === 'hero') handleHeroUpdate({ weaponImage: undefined, weaponDescriptionText: undefined });
    else if (id === 'friend') handleFriendUpdate({ weaponImage: undefined, weaponDescriptionText: undefined });
    else handleUpdateCharacter(id, { weaponImage: undefined, weaponDescriptionText: undefined });
  };

  const handleBackstoryFileUpload = async (id: string, files: FileList) => {
    try {
      const processed = await processFiles(files);
      if (id === 'hero') handleHeroUpdate({ backstoryFiles: [...(hero?.backstoryFiles || []), ...processed] });
      else if (id === 'friend') handleFriendUpdate({ backstoryFiles: [...(friend?.backstoryFiles || []), ...processed] });
      else {
        const char = additionalCharacters.find(c => c.id === id);
        handleUpdateCharacter(id, { backstoryFiles: [...(char?.backstoryFiles || []), ...processed] });
      }
    } catch (e) { console.error("Upload failed"); }
  };

  const handleBackstoryFileRemove = (id: string, index: number) => {
    if (id === 'hero') handleHeroUpdate({ backstoryFiles: hero?.backstoryFiles?.filter((_, i) => i !== index) });
    else if (id === 'friend') handleFriendUpdate({ backstoryFiles: friend?.backstoryFiles?.filter((_, i) => i !== index) });
    else {
      const char = additionalCharacters.find(c => c.id === id);
      handleUpdateCharacter(id, { backstoryFiles: char?.backstoryFiles?.filter((_, i) => i !== index) });
    }
  };

  const handleStoryFileUpload = async (files: FileList) => {
    // Filter out non-text and non-image files
    const validFiles = Array.from(files).filter(f => f.type.startsWith('text/') || f.type.startsWith('image/') || f.name.match(/\.(txt|md)$/i));
    if (validFiles.length < files.length) console.warn("Only text files (.txt, .md) and images are supported.");
    if (validFiles.length === 0) return;
    
    try {
      // Use filtered list
      const dataTransfer = new DataTransfer();
      validFiles.forEach(f => dataTransfer.items.add(f));
      
      const processed = await processFiles(dataTransfer.files);
      handleStoryContextUpdate({ descriptionFiles: [...storyContext.descriptionFiles, ...processed] });
    } catch (e) { console.error("Upload failed"); }
  };

  const handleStoryFileRemove = (index: number) => {
    handleStoryContextUpdate({ descriptionFiles: storyContext.descriptionFiles.filter((_, i) => i !== index) });
  };

  const exportDraft = () => {
    const data = JSON.stringify({ 
        comicFaces, 
        history: historyRef.current, 
        hero, 
        friend, 
        additionalCharacters, 
        storyContext, 
        extraPages,
        storyOutline,
        generateFromOutline,
        richMode,
        selectedGenre,
        selectedLanguage,
        customPremise
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storyContext.title ? storyContext.title.replace(/\s+/g,'_') : 'Infinite_Heroes'}_Draft.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDraft = (file: File) => {
    console.log('[importDraft] Called with file:', file.name, file.size, 'bytes');
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        console.warn('Please select a valid .json draft file.');
        return;
    }
    try {
      const reader = new FileReader();
      reader.onerror = () => { console.error('Failed to read the draft file.'); };
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || !text.trim().startsWith('{')) { console.warn('Invalid draft file format.'); return; }
          const parsed = JSON.parse(text);
          console.log('[importDraft] Parsed keys:', Object.keys(parsed));
          setComicFaces(parsed.comicFaces || []);
          historyRef.current = parsed.history || [];
          setHero(parsed.hero || null);
          setFriend(parsed.friend || null);
          setAdditionalCharacters(parsed.additionalCharacters || []);
          setStoryContext(prev => ({ ...prev, ...(parsed.storyContext || {}) }));
          setExtraPages(parsed.extraPages || 0);

          if (parsed.storyOutline) setStoryOutline(parsed.storyOutline);
          if (parsed.generateFromOutline !== undefined) setGenerateFromOutline(parsed.generateFromOutline);
          if (parsed.richMode !== undefined) setRichMode(parsed.richMode);
          if (parsed.selectedGenre) setSelectedGenre(parsed.selectedGenre);
          if (parsed.selectedLanguage) setSelectedLanguage(parsed.selectedLanguage);
          if (parsed.customPremise !== undefined) setCustomPremise(parsed.customPremise);

          if (parsed.comicFaces && parsed.comicFaces.length > 0) {
              setIsStarted(true);
              setShowSetup(false);
              setIsTransitioning(false);
              setCurrentSheetIndex(1);
          } else {
              console.log("Setup fields populated successfully!");
          }
        } catch(err) {
          console.error('Draft parse error:', err);
          console.error("Invalid draft file. Could not parse JSON."); 
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('Draft import error:', err);
      console.error('Failed to import draft file.');
    }
  };

  const handleSheetClick = (index: number) => {
      if (!isStarted) return;
      if (index === 0 && currentSheetIndex === 0) return;
      
      const config = getComicConfig(storyContext.pageLength, extraPages);
      const maxSheetIndex = Math.ceil((config.TOTAL_PAGES + 2) / 2); // Including covers
      
      if (index < currentSheetIndex) {
          setCurrentSheetIndex(index);
      } else if (index === currentSheetIndex && currentSheetIndex < maxSheetIndex) {
          setCurrentSheetIndex(prev => prev + 1);
      }
  };

  const handleSurpriseMe = () => {
    const randomAdjectives = ["Neon", "Dark", "Savage", "Quantum", "Infinite", "Crimson", "Shadow", "Cosmic", "Neon", "Gothic"];
    const randomNouns = ["Knights", "Syndicate", "Horizon", "Phantom", "Legends", "Vanguard", "Zero", "Wanderer", "Chronicles"];
    const title = `${randomAdjectives[Math.floor(Math.random()*randomAdjectives.length)]} ${randomNouns[Math.floor(Math.random()*randomNouns.length)]}`;
    const genre = GENRES[Math.floor(Math.random()*GENRES.length)];
    const style = ART_STYLES[Math.floor(Math.random()*ART_STYLES.length)];
    
    setStoryContext(prev => ({
      ...prev,
      title: title,
      seriesTitle: title.toUpperCase(),
      artStyle: style,
      descriptionText: "An unpredictable, explosive action story."
    }));
    setSelectedGenre(genre);
    if(genre === 'Custom') setCustomPremise("A mysterious anomaly forces unusual heroes to team up.");
  };

  // Pan/Zoom State
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const scrollPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      setIsDragging(true);
      startPos.current = { x: e.pageX, y: e.pageY };
      scrollPos.current = { x: containerRef.current!.scrollLeft, y: containerRef.current!.scrollTop };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || zoom <= 1) return;
      e.preventDefault();
      const dx = e.pageX - startPos.current.x;
      const dy = e.pageY - startPos.current.y;
      containerRef.current!.scrollLeft = scrollPos.current.x - dx;
      containerRef.current!.scrollTop = scrollPos.current.y - dy;
  };

  const handleMouseUp = () => setIsDragging(false);

  // Determine API key status for alert banner
  const hasGeminiKey = !!(isAdmin && process.env.API_KEY) || !!userApiKey;
  const hasClaudeKey = !!(isAdmin && process.env.ANTHROPIC_API_KEY) || !!userAnthropicKey;

  // Show alert if missing keys and not dismissed
  const showKeyAlert = !dismissedKeyAlert && (!hasGeminiKey || !hasClaudeKey);

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}

      {/* API Key Alert Banner */}
      {showKeyAlert && (
        <div className={`fixed top-0 left-0 right-0 z-[400] ${!hasGeminiKey ? 'bg-red-600' : 'bg-amber-500'} border-b-4 border-black shadow-lg`}>
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white">
              <span className="text-2xl">{!hasGeminiKey ? '🔑' : '💡'}</span>
              <div className="font-comic text-sm sm:text-base">
                {!hasGeminiKey ? (
                  <span><strong>API Key Required!</strong> Add your Gemini key to generate comics.</span>
                ) : !hasClaudeKey ? (
                  <span><strong>Tip:</strong> Add Claude key for better text analysis (optional - Gemini will work for everything)</span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="comic-btn bg-white text-black px-4 py-1.5 text-sm font-bold border-2 border-black hover:bg-gray-100 whitespace-nowrap"
              >
                ⚙️ Open Settings
              </button>
              {hasGeminiKey && !hasClaudeKey && (
                <button
                  onClick={() => setDismissedKeyAlert(true)}
                  className="comic-btn bg-amber-700 text-white px-3 py-1.5 text-sm font-bold border-2 border-black hover:bg-amber-600 whitespace-nowrap"
                >
                  Use Gemini Only
                </button>
              )}
              {!hasGeminiKey && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="comic-btn bg-blue-500 text-white px-3 py-1.5 text-sm font-bold border-2 border-black hover:bg-blue-400 whitespace-nowrap"
                >
                  Get Free Key →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Storage Warning Banner */}
      {storageWarning && !dismissedStorageWarning && (
        <div className={`fixed ${showKeyAlert ? 'top-16' : 'top-0'} left-0 right-0 z-[399] ${storageWarning.imagesStripped ? 'bg-orange-600' : 'bg-yellow-500'} border-b-4 border-black shadow-lg`}>
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white">
              <span className="text-2xl">{storageWarning.imagesStripped ? '!' : '!'}</span>
              <div className="font-comic text-sm sm:text-base">
                {storageWarning.imagesStripped ? (
                  <span><strong>Storage Limit Reached!</strong> Character images were removed to save your data. Export a draft to preserve everything.</span>
                ) : (
                  <span><strong>Storage Warning:</strong> Using {storageWarning.percentUsed}% of storage ({(storageWarning.currentBytes / 1024 / 1024).toFixed(1)}MB). Consider exporting a draft soon.</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportDraft}
                className="comic-btn bg-white text-black px-4 py-1.5 text-sm font-bold border-2 border-black hover:bg-gray-100 whitespace-nowrap"
              >
                Export Draft
              </button>
              <button
                onClick={() => setDismissedStorageWarning(true)}
                className={`comic-btn ${storageWarning.imagesStripped ? 'bg-orange-800' : 'bg-yellow-700'} text-white px-3 py-1.5 text-sm font-bold border-2 border-black hover:opacity-90 whitespace-nowrap`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Gear — always visible */}
      <button 
          onClick={() => setShowSettings(true)}
          className="fixed bottom-20 left-6 z-[250] w-12 h-12 bg-white/90 hover:bg-white border-[3px] border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
          title="Settings"
      >
          <span className="text-2xl">⚙️</span>
      </button>

      {/* Settings Dialog */}
      {showSettings && (
          <SettingsDialog
              serverKeyExists={!!process.env.API_KEY}
              anthropicServerKeyExists={!!process.env.ANTHROPIC_API_KEY}
              adminPasswordHash={process.env.ADMIN_PASSWORD || ''}
              onClose={() => setShowSettings(false)}
              onKeyChange={handleSettingsKeyChange}
          />
      )}
      
      <Setup 
          show={showSetup}
          isTransitioning={isTransitioning}
          isGeneratingProfiles={isGeneratingProfiles}
          hero={hero}
          friend={friend}
          additionalCharacters={additionalCharacters}
          storyContext={storyContext}
          selectedGenre={selectedGenre}
          selectedLanguage={selectedLanguage}
          customPremise={customPremise}
          richMode={richMode}
          onHeroUpdate={handleHeroUpdate}
          onResetHero={() => setHero(null)}
          onFriendUpdate={handleFriendUpdate}
          onResetFriend={() => setFriend(null)}
          onAddCharacter={handleAddCharacter}
          onUpdateCharacter={handleUpdateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onStoryContextUpdate={handleStoryContextUpdate}
          onPortraitUpload={handlePortraitUpload}
          onRefUpload={handleRefUpload}
          onRefRemove={handleRefRemove}
          onEmblemUpload={handleEmblemUpload}
          onEmblemRemove={handleEmblemRemove}
          onWeaponUpload={handleWeaponUpload}
          onWeaponRemove={handleWeaponRemove}
          onBackstoryFileUpload={handleBackstoryFileUpload}
          onBackstoryFileRemove={handleBackstoryFileRemove}
          onStoryFileUpload={handleStoryFileUpload}
          onStoryFileRemove={handleStoryFileRemove}
          onGenreChange={setSelectedGenre}
          onLanguageChange={setSelectedLanguage}
          onPremiseChange={setCustomPremise}
          onRichModeChange={setRichMode}
          onLaunch={handleStartAdventure}
          onSurpriseMe={handleSurpriseMe}
          onExportDraft={exportDraft}
          onImportDraft={importDraft}
          onClearSetup={handleClearSetup}
          onImproveText={improveTextWithAI}
          skipProfileAnalysis={skipProfileAnalysis}
          onSkipProfileAnalysisChange={setSkipProfileAnalysis}
          useSavedProfiles={useSavedProfiles}
          onUseSavedProfilesChange={setUseSavedProfiles}
          onPresetSelect={handlePresetSelect}
      />

      {/* Mode Selection Screen */}
      <ModeSelectionScreen
          show={showModeSelection}
          onSelect={handleModeSelect}
          onBack={handleModeSelectionBack}
      />

      {/* Outline Step Dialog */}
      <OutlineStepDialog 
          show={showOutlineStep}
          storyOutline={storyOutline}
          outlineNotes={outlineNotes}
          onOutlineUpdate={(val) => setStoryOutline(prev => ({ ...prev, content: val }))}
          onOutlineNotesChange={setOutlineNotes}
          onGenerateOutline={generateOutline}
          onOutlineUpload={handleOutlineUpload}
          onProceedWithOutline={() => {
              setShowOutlineStep(false);
              proceedToComicGeneration();
          }}
          onCancelOutline={() => {
              setShowOutlineStep(false);
              setIsTransitioning(false);
          }}
      />
      
      {/* Profiles Review Dialog */}
      {showProfilesStep && (
          <ProfilesDialog 
              profiles={tempProfiles}
              onUpdate={(index, updated) => {
                  setTempProfiles(prev => prev.map((p, i) => i === index ? updated : p));
              }}
              onAnalyze={handleAnalyzeProfile}
              onConfirm={continueAfterProfiles}
              onCancel={() => {
                  setShowProfilesStep(false);
                  setIsTransitioning(false); // Back to setup
              }}
          />
      )}

      {/* Reroll Modal */}
      {rerollTarget !== null && (
          <RerollModal
              pageIndex={rerollTarget}
              outline={storyOutline.content}
              allRefImages={getRerollGallery()}
              availableProfiles={getProfilesArray().map(p => ({ id: p.id, name: p.name }))}
              fullProfiles={getProfilesArray()}
              originalPrompt={comicFaces.find(f => f.pageIndex === rerollTarget)?.originalPrompt}
              initialSelectedProfileIds={rerollProfileSelection}
              onProfileSelectionChange={setRerollProfileSelection}
              onSubmit={handleRerollSubmit}
              onClose={() => setRerollTarget(null)}
              onUploadRef={handleRerollUploadRef}
              onDeleteRef={handleRerollDeleteRef}
              onProfileUpdate={(profileId, updates) => {
                  // Update profile in Zustand store
                  useCharacterStore.getState().updateCharacterProfile(profileId, updates);
              }}
              onAnalyzeProfile={async (profileId) => {
                  // Find corresponding persona and regenerate profile
                  const allPersonas = [getHero(), getFriend(), ...getAdditionalChars()].filter(Boolean) as Persona[];
                  const persona = allPersonas.find(p => p.id === profileId);
                  if (persona) {
                      const newProfile = await generateCharacterProfile(persona, true);
                      // Update profile in Zustand store
                      useCharacterStore.getState().setCharacterProfile(profileId, newProfile);
                  }
              }}
              onImproveText={improveTextWithAI}
          />
      )}

      {/* Page Navigation & Zoom Controls */}
      {isStarted && !showSetup && (
          <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-auto items-end">
              {showPageNav && (
                  <div className="flex bg-white border-[3px] border-black p-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] rounded divide-x-[3px] divide-black items-center">
                      <div className="flex items-center gap-2 px-3">
                          <button 
                              onClick={() => setCurrentSheetIndex(Math.max(0, currentSheetIndex - 1))}
                              disabled={currentSheetIndex === 0}
                              className="comic-btn w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-300 border-[2px] border-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                          >
                              <span className="font-bold text-sm">◀</span>
                          </button>
                      
                          <span className="font-comic font-bold text-sm hidden sm:inline ml-1">PAGE</span>
                          <input 
                              type="text"
                              value={pageNavInput}
                              onChange={(e) => setPageNavInput(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                      let pageNum = parseInt(pageNavInput);
                                      if (isNaN(pageNum) || pageNavInput.toLowerCase() === 'cover') pageNum = 0;
                                      
                                      const config = getComicConfig(storyContext.pageLength, extraPages);
                                      if (pageNum >= 0 && pageNum <= config.TOTAL_PAGES + 1) {
                                          const targetSheet = pageNum === 0 ? 0 : Math.ceil(pageNum / 2);
                                          setCurrentSheetIndex(targetSheet);
                                      }
                                  }
                              }}
                              className="w-16 h-8 text-center border-2 border-black font-bold focus:outline-none"
                          />
                          <span className="font-comic font-bold text-gray-500 text-sm hidden sm:inline">/ {getComicConfig(storyContext.pageLength, extraPages).TOTAL_PAGES}</span>
                          <button 
                              onClick={() => {
                                  let pageNum = parseInt(pageNavInput);
                                  if (isNaN(pageNum) || pageNavInput.toLowerCase() === 'cover') pageNum = 0;
                                  
                                  const config = getComicConfig(storyContext.pageLength, extraPages);
                                  if (pageNum >= 0 && pageNum <= config.TOTAL_PAGES + 1) {
                                      const targetSheet = pageNum === 0 ? 0 : Math.ceil(pageNum / 2);
                                      setCurrentSheetIndex(targetSheet);
                                  }
                              }}
                              className="comic-btn ml-1 bg-blue-600 text-white text-xs font-bold px-2 py-1 border-[2px] border-black hover:bg-blue-500"
                          >
                              GO
                          </button>

                          <button 
                              onClick={() => {
                                  const maxSheet = Math.ceil((getComicConfig(storyContext.pageLength, extraPages).TOTAL_PAGES + 1) / 2);
                                  setCurrentSheetIndex(Math.min(maxSheet, currentSheetIndex + 1));
                              }}
                              disabled={currentSheetIndex >= Math.ceil((getComicConfig(storyContext.pageLength, extraPages).TOTAL_PAGES + 1) / 2)}
                              className="comic-btn w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-300 border-[2px] border-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all ml-2"
                          >
                              <span className="font-bold text-sm">▶</span>
                          </button>
                      </div>
                      <div className="flex gap-1 pl-3">
                          <button onClick={zoomOut} className="comic-btn w-8 h-8 bg-gray-200 hover:bg-gray-300 font-bold text-lg flex items-center justify-center border-[2px] border-black">-</button>
                          <button onClick={resetZoom} className="comic-btn px-2 h-8 bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center border-[2px] border-black text-xs">{Math.round(zoom * 100)}%</button>
                          <button onClick={zoomIn} className="comic-btn w-8 h-8 bg-gray-200 hover:bg-gray-300 font-bold text-lg flex items-center justify-center border-[2px] border-black">+</button>
                      </div>
                  </div>
              )}
              {/* Toggle Page Nav Button */}
              <button 
                  onClick={() => setShowPageNav(!showPageNav)} 
                  className="comic-btn text-xs bg-black text-white px-3 py-1 font-comic tracking-widest border-[2px] border-white shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-gray-800 self-end"
              >
                  {showPageNav ? 'HIDE NAV' : 'SHOW NAV'}
              </button>
          </div>
      )}

      {/* Main Container */}
      <div 
          ref={containerRef}
          className={`absolute inset-0 z-0 overflow-auto flex items-center justify-center ${showSetup && !isTransitioning ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
      >
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: zoom === 1 ? 'transform 0.2s ease-out' : 'none', minWidth: 'max-content', minHeight: 'max-content', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Book 
          comicFaces={comicFaces}
          currentSheetIndex={currentSheetIndex}
          isStarted={isStarted}
          isSetupVisible={showSetup && !isTransitioning}
          storyContext={storyContext}
          extraPages={extraPages}
          generateFromOutline={generateFromOutline}
          onSheetClick={handleSheetClick}
          onChoice={handleChoice}
          onReroll={handleReroll}
          onQuickRetry={handleQuickRetry}
          onAddPage={handleAddPage}
          onStop={handleStop}
          onStopHere={handleStopHere}
          onOpenBook={() => setCurrentSheetIndex(1)}
          onDownload={() => setShowExportDialog(true)}
                  onReset={resetApp}
              />
          </div>
      </div>

      {/* Top Left Mode Badge */}
      {isStarted && !showSetup && (
        <div className="fixed top-4 left-4 z-[100] flex gap-2 items-center pointer-events-none">
            <div className="bg-black/90 px-5 py-2 border-[3px] border-white shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center gap-2 rounded-sm transform -rotate-1">
                <span className="text-yellow-400 font-comic text-xl tracking-wider uppercase font-bold">
                   {generateFromOutline ? "📖 OUTLINE MODE" : "🎲 NOVEL MODE"}
                </span>
            </div>
        </div>
      )}

      {/* Top Right Navigation */}
      {isStarted && !showSetup && (
        <div className="fixed top-4 right-4 z-[100] flex gap-2">
            <button onClick={handleGoHome} className="comic-btn bg-gray-200 text-black font-comic px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-gray-300 hover:scale-105 transition-all outline-none text-sm tracking-widest font-bold">
                🏠 HOME
            </button>
            {storyOutline.content && (
                <button onClick={() => setShowOutlineDialog(true)} className="comic-btn bg-purple-600 text-white font-comic px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all outline-none text-sm tracking-widest font-bold">
                    📖 OUTLINE
                </button>
            )}
            
            {/* Global Reroll Dropdown */}
            <div className="relative">
                <button onClick={() => setShowGlobalReroll(!showGlobalReroll)} className="comic-btn bg-orange-500 text-white font-comic px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all outline-none text-sm tracking-widest font-bold">
                    🎲 REROLL PAGE
                </button>
                {showGlobalReroll && (
                    <div className="absolute top-14 right-0 bg-white border-[3px] border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] z-[200] flex flex-col gap-2 min-w-[200px]">
                        <h3 className="font-comic font-bold text-center border-b-2 border-black pb-1 mb-1 whitespace-nowrap">Reroll Specific Page</h3>
                        <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setGlobalRerollPageInput(String(Math.max(1, parseInt(globalRerollPageInput || '1') - 1)))} className="comic-btn w-8 h-8 bg-yellow-400 font-bold text-lg border-2 border-black flex items-center justify-center">-</button>
                            <input 
                                type="number" 
                                value={globalRerollPageInput} 
                                onChange={e => setGlobalRerollPageInput(e.target.value)}
                                className="w-14 h-8 text-center font-bold text-lg border-2 border-black focus:outline-none"
                            />
                            <button onClick={() => setGlobalRerollPageInput(String(Math.min(getComicConfig(storyContext.pageLength, extraPages).TOTAL_PAGES, parseInt(globalRerollPageInput || '1') + 1)))} className="comic-btn w-8 h-8 bg-yellow-400 font-bold text-lg border-2 border-black flex items-center justify-center">+</button>
                        </div>
                        <button 
                            onClick={() => {
                                const pageNum = parseInt(globalRerollPageInput);
                                const maxPage = getComicConfig(storyContext.pageLength, extraPages).TOTAL_PAGES;
                                if (pageNum >= 1 && pageNum <= maxPage) {
                                    handleReroll(pageNum);
                                    setShowGlobalReroll(false);
                                }
                            }}
                            className="comic-btn w-full bg-red-600 text-white py-1.5 font-bold tracking-widest border-2 border-black hover:bg-red-500 mt-1"
                        >
                            GO
                        </button>
                    </div>
                )}
            </div>

            <button onClick={() => setShowGallery(true)} className="comic-btn bg-yellow-400 text-black font-comic px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all outline-none text-sm tracking-widest font-bold">
                🖼️ GALLERY
            </button>
            <button onClick={exportDraft} className="comic-btn bg-blue-600 text-white font-comic px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all outline-none text-sm tracking-widest font-bold">
                SAVE DRAFT
            </button>
            <button 
                onClick={() => setShowExportDialog(true)}
                className="comic-btn bg-red-600 text-white font-comic px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all uppercase font-bold tracking-widest text-sm"
            >
                Export Comic
            </button>
        </div>
      )}

      {showExportDialog && (
        <ExportDialog 
          onClose={() => setShowExportDialog(false)} 
          onExport={handleExport} 
        />
      )}

      {showOutlineDialog && (
        <OutlineDialog
          outline={storyOutline.content}
          title={storyContext.title || 'Comic Outline'}
          onClose={() => setShowOutlineDialog(false)}
        />
      )}

      {showGallery && (
        <GalleryModal
          faces={comicFaces}
          title={storyContext.title || 'Comic'}
          onClose={() => setShowGallery(false)}
          onReplaceImage={(faceId, newImageUrl) => {
            console.log('[GalleryReplace] Replacing image for face:', faceId, 'new URL length:', newImageUrl.length);

            // Update both state and historyRef to ensure persistence
            setComicFaces(prev => {
              const foundFace = prev.find(f => f.id === faceId);
              console.log('[GalleryReplace] Found face in state:', !!foundFace, 'pageIndex:', foundFace?.pageIndex, 'type:', foundFace?.type);
              const updated = prev.map(face =>
                face.id === faceId
                  ? { ...face, imageUrl: newImageUrl }
                  : face
              );
              return updated;
            });

            // Also update historyRef so exports and other operations use the new image
            const idx = historyRef.current.findIndex(f => f.id === faceId);
            if (idx !== -1) {
              historyRef.current[idx] = { ...historyRef.current[idx], imageUrl: newImageUrl };
              console.log('[GalleryReplace] historyRef updated at index:', idx);
            } else {
              console.warn('[GalleryReplace] Face not found in historyRef:', faceId);
            }
          }}
          onGenerateCoverVariants={() => generateCoverVariants(3)}
          onBatchRegenerate={async (faceIds) => {
            console.log('[BatchRegenerate] Starting batch regeneration for:', faceIds);
            setShowGallery(false);

            // Process each face sequentially to avoid API overload
            for (const faceId of faceIds) {
              const face = comicFaces.find(f => f.id === faceId);
              if (!face) {
                console.warn('[BatchRegenerate] Face not found:', faceId);
                continue;
              }

              // Mark as loading
              updateFaceState(faceId, { isLoading: true, hasFailed: false });

              try {
                const isNovelMode = !generateFromOutline;
                const config = getComicConfig(storyContext.pageLength, extraPages, isNovelMode);
                const type: ComicFace['type'] = face.pageIndex === 0 ? 'cover' : (face.pageIndex === config.BACK_COVER_PAGE ? 'back_cover' : 'story');

                await generateSinglePage(faceId, face.pageIndex ?? 0, type);
                console.log('[BatchRegenerate] Completed:', faceId);
              } catch (e) {
                console.error('[BatchRegenerate] Failed:', faceId, e);
                updateFaceState(faceId, { isLoading: false, hasFailed: true });
              }
            }

            console.log('[BatchRegenerate] Batch complete');
          }}
        />
      )}

      {showCoverSelector && (
        <CoverVariantSelector
          variants={coverVariants}
          selectedIndex={selectedCoverIndex}
          isGenerating={isGeneratingVariants}
          onSelect={selectCoverVariant}
          onClose={() => setShowCoverSelector(false)}
          onGenerateMore={() => generateCoverVariants(3)}
        />
      )}
    </div>
  );
};

export default App;
