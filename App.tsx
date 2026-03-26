
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import jsPDF from 'jspdf';
import { getComicConfig, ART_STYLES, GENRES, TONES, LANGUAGES, ComicFace, Beat, Persona, StoryContext, StoryOutline, CharacterProfile, NOVEL_MODE_BATCH_SIZE, generateHardNegatives, formatIdentityHeader, formatReinforcedScene, formatConsistencyInstruction, IdentityHeader, RegenerationMode, PageCharacterPlan, TransitionType, ShotType, PanelLayout, EmotionalBeat, PacingIntent, BalloonShape, RerollOptions, getLayoutInstructions, getShotInstructions, getTransitionContext, getFlashbackInstructions, NovelModeState } from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { RerollModal } from './RerollModal';
import { OutlineDialog } from './OutlineDialog';
import { GalleryModal } from './GalleryModal';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { ExportDialog } from './ExportDialog';
import { ProfilesDialog } from './ProfilesDialog';
import { SettingsDialog } from './SettingsDialog';
import { OutlineStepDialog } from './OutlineStepDialog';
import { ModeSelectionScreen } from './ModeSelectionScreen';
import { createImageContent, createTextContent, extractJsonFromResponse, getTextFromClaudeResponse, ClaudeContentBlock, detectImageMimeType } from './claudeHelpers';

// --- Constants ---
const MODEL_IMAGE_GEN_NAME = "gemini-3-pro-image-preview";
const MODEL_TEXT_NAME = "gemini-2.5-pro"; // Gemini fallback
const MODEL_TEXT_NAME_CLAUDE = "claude-sonnet-4-5-20250929";

const App: React.FC = () => {
  // --- API Key Hook ---
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  const isCastLoadedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('infinite_heroes_cast');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hero) setHeroState(parsed.hero); heroRef.current = parsed.hero || null;
        if (parsed.friend) setFriendState(parsed.friend); friendRef.current = parsed.friend || null;
        if (parsed.additionalCharacters) {
             setAdditionalCharacters(parsed.additionalCharacters);
             additionalCharsRef.current = parsed.additionalCharacters;
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

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  
  const heroRef = useRef<Persona | null>(null);
  const friendRef = useRef<Persona | null>(null);
  const additionalCharsRef = useRef<Persona[]>([]);

  useEffect(() => {
    if (!isCastLoadedRef.current) return;
      const payload = JSON.stringify({ hero, friend, additionalCharacters });
      if (payload.length > 4000000) { // ~4MB safe limit
          console.warn("Payload exceeds local storage safe limits. Stripping images to persist text metadata.");
          const stripStr = (p: Persona|null) => p ? { ...p, base64: '', referenceImage: '', referenceImages: [], backstoryFiles: [] } : null;
          try {
              localStorage.setItem('infinite_heroes_cast', JSON.stringify({ 
                  hero: stripStr(hero), 
                  friend: stripStr(friend), 
                  additionalCharacters: additionalCharacters.map(c => stripStr(c)!) 
              }));
          } catch (err) {
              console.error("Even text metadata failed to save:", err);
          }
      } else {
          try {
              localStorage.setItem('infinite_heroes_cast', payload);
          } catch (e) {
              console.error("Storage save failed:", e);
          }
      }
  }, [hero, friend, additionalCharacters]);

  const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
  const setFriend = (p: Persona | null) => { setFriendState(p); friendRef.current = p; };

  const handleAddCharacter = () => {
    const newChar: Persona = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Character ${additionalCharacters.length + 3}`,
      base64: "",
      desc: "Additional Character",
      backstoryFiles: []
    };
    setAdditionalCharacters(prev => {
      const updated = [...prev, newChar];
      additionalCharsRef.current = updated;
      return updated;
    });
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Persona>) => {
    setAdditionalCharacters(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      additionalCharsRef.current = updated;
      return updated;
    });
  };

  const handleDeleteCharacter = (id: string) => {
    setAdditionalCharacters(prev => {
      const updated = prev.filter(c => c.id !== id);
      additionalCharsRef.current = updated;
      return updated;
    });
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
  const [showProfilesStep, setShowProfilesStep] = useState(false);
  const [tempProfiles, setTempProfiles] = useState<CharacterProfile[]>([]);
  const [skipProfileAnalysis, setSkipProfileAnalysis] = useState(false);
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

  const characterProfilesRef = useRef<CharacterProfile[]>([]);
  const [rerollTarget, setRerollTarget] = useState<number | null>(null);

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

  const generateBeat = async (history: ComicFace[], isRightPage: boolean, pageNum: number, isDecisionPage: boolean, instruction?: string, previousChoices?: string[]): Promise<Beat> => {
    if (!heroRef.current) throw new Error("No Hero");
    const config = getComicConfig(storyContext.pageLength, extraPages);
    const isFinalPage = pageNum === config.MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";

    // Get relevant history and last focus to prevent repetition
    const relevantHistory = history
        .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    const lastBeat = relevantHistory[relevantHistory.length - 1]?.narrative;
    const lastFocus = lastBeat?.focus_char || 'none';

    const historyText = relevantHistory.map(p => 
      `[Page ${p.pageIndex}] [Focus: ${p.narrative?.focus_char}] (Caption: "${p.narrative?.caption || ''}") (Dialogue: "${p.narrative?.dialogue || ''}") (Scene: ${p.narrative?.scene}) ${p.resolvedChoice ? `-> USER CHOICE: "${p.resolvedChoice}"` : ''}`
    ).join('\n');

    // Aggressive Co-Star Injection Logic
    let friendInstruction = "Not yet introduced.";
    if (friendRef.current) {
        friendInstruction = "ACTIVE and PRESENT (User Provided).";
        // If the last panel wasn't the friend, strongly suggest switching to them to maintain balance.
        if (lastFocus !== 'friend' && Math.random() > 0.4) {
             friendInstruction += " MANDATORY: FOCUS ON THE CO-STAR FOR THIS PANEL.";
        } else {
             friendInstruction += " Ensure they are woven into the scene even if not the main focus.";
        }
    }

    // Determine Core Story Driver (Genre vs Custom Premise)
    let coreDriver = `GENRE: ${selectedGenre}. TONE: ${storyTone}.`;
    if (selectedGenre === 'Custom') {
        coreDriver = `STORY PREMISE: ${customPremise || "A totally unique, unpredictable adventure"}. (Follow this premise strictly over standard genre tropes).`;
    }
    
    const isSliceOfLife = selectedGenre.includes("Comedy") || selectedGenre.includes("Teen") || selectedGenre.includes("Slice");

    // Guardrails to prevent everything becoming "Quantum Sci-Fi"
    const guardrails = `
    NEGATIVE CONSTRAINTS:
    1. UNLESS GENRE IS "Dark Sci-Fi" OR "Superhero Action" OR "Custom": DO NOT use technical jargon like "Quantum", "Timeline", "Portal", "Multiverse", or "Singularity".
    2. IF GENRE IS "Teen Drama" OR "Lighthearted Comedy": The "stakes" must be SOCIAL, EMOTIONAL, or PERSONAL (e.g., a rumor, a competition, a broken promise, being late, embarrassing oneself). Do NOT make it life-or-death. Keep it grounded.
    3. Avoid "The artifact" or "The device" unless established earlier.
    `;

    const getRoleLabel = (p: Persona) => {
        if (!p.role) return '';
        if (p.role === 'Family/Friend' || p.role === 'Custom') return p.customRole || p.role;
        return p.role;
    };

    // Character Context
    const charContext = [
        `HERO: ${heroRef.current.name || 'Main Hero'}. Role: ${getRoleLabel(heroRef.current) || 'Hero'}. Backstory: ${heroRef.current.backstoryText || 'Unknown'}.`,
        friendRef.current ? `CO-STAR: ${friendRef.current.name || 'Sidekick'}. Role: ${getRoleLabel(friendRef.current) || 'Sidekick'}. Backstory: ${friendRef.current.backstoryText || 'Unknown'}.` : null,
        ...additionalCharsRef.current.map(c => `${c.name}: Role: ${getRoleLabel(c) || 'Supporting'}. ${c.backstoryText || 'Unknown'}.`)
    ].filter(Boolean).join('\n');

    // Story Context
    const storyInfo = `
    STORY TITLE: ${storyContext.title || 'Untitled Adventure'}
    STORY DESCRIPTION: ${storyContext.descriptionText || 'A new adventure begins.'}
    ${storyOutline.isReady ? `STORY OUTLINE: ${storyOutline.content}` : ''}
    `;

    // Batch-of-3 generation context for narrative continuity
    const batchPosition = ((pageNum - 1) % 3) + 1; // 1, 2, or 3
    const batchStart = pageNum - batchPosition + 1;
    const batchContext = `
=== BATCH GENERATION CONTEXT ===
This is page ${batchPosition} of a 3-page narrative batch (Pages ${batchStart}-${batchStart + 2}).
- Page 1 of batch: SETUP - Establish the scene, introduce the situation
- Page 2 of batch: DEVELOPMENT - Build tension, advance the conflict, character interactions
- Page 3 of batch: PAYOFF - Mini-climax, resolution of this beat, or cliffhanger for next batch
MAINTAIN STRONG CONTINUITY with the other pages in this batch. The 3 pages should feel like a cohesive mini-chapter.`;

    // BASE INSTRUCTION: Strictly enforce language for output text.
    let baseInstruction = `You are the Lead Writer for a mature comic book. Write ONE single, vivid, narrative beat for the NEXT page. ALL OUTPUT TEXT (Captions, Dialogue, Choices) MUST BE IN ${langName.toUpperCase()}. ${coreDriver} ${guardrails}`;
    baseInstruction += `\nCONTEXT: ${storyInfo}\nCHARACTERS:\n${charContext}`;
    baseInstruction += batchContext;
    if (richMode) {
        baseInstruction += " RICH/NOVEL MODE ENABLED. Prioritize deeper character thoughts, descriptive captions, and meaningful dialogue exchanges over short punchlines.";
    }
    if (instruction) {
        baseInstruction += `\nUSER REROLL INSTRUCTION: "${instruction}". (YOU MUST FOLLOW THIS OVER THE NORMAL NARRATIVE FLOW!).`;
    }

    if (isFinalPage) {
        baseInstruction += " FINAL PAGE. KARMIC CLIFFHANGER REQUIRED. You MUST explicitly reference the User's choice from PAGE 3 in the narrative and show how that specific philosophy led to this conclusion. Text must end with 'TO BE CONTINUED...' (or localized equivalent).";
    } else if (isDecisionPage) {
        baseInstruction += " End with a PSYCHOLOGICAL choice about VALUES, RELATIONSHIPS, or RISK. (e.g., Truth vs. Safety, Forgive vs. Avenge). The choices MUST be a brief descriptive summary of the action the user is taking (e.g. 'Confront the suspect at the warehouse' vs 'Follow from a distance'). NEVER use generic 'Option A' or 'Option B'.";
        // Novel Mode reroll: avoid previously rejected choices
        if (previousChoices && previousChoices.length > 0) {
            baseInstruction += ` REJECTED CHOICES (DO NOT REUSE): ${previousChoices.map(c => `"${c}"`).join(', ')}. Generate COMPLETELY DIFFERENT choices that explore alternative story directions.`;
        }
    } else {
        // Neutralized Narrative Arc to avoid forcing "scary mystery" tones if the genre doesn't call for it.
        if (pageNum === 1) {
            baseInstruction += " INCITING INCIDENT. An event disrupts the status quo. Establish the genre's intended mood. (If Slice of Life: A social snag/surprise. If Adventure: A call to action).";
        } else if (pageNum <= 4) {
            baseInstruction += " RISING ACTION. The heroes engage with the new situation. Focus on dialogue, character dynamics, and initial challenges.";
        } else if (pageNum <= 8) {
            baseInstruction += " COMPLICATION. A twist occurs! A secret is revealed, a misunderstanding deepens, or the path is blocked. (Keep intensity appropriate to Genre - e.g. Social awkwardness for Comedy, Danger for Horror).";
        } else {
            baseInstruction += " CLIMAX. The confrontation with the main conflict. The truth comes out, the contest ends, or the battle is fought.";
        }
    }

    // === COMIC FUNDAMENTALS CONTEXT ===
    // Inject layout, shot, transition guidance from page breakdown if available
    const pagePlan = storyOutline.pageBreakdown?.find(p => p.pageIndex === pageNum);
    if (pagePlan) {
      // Layout instructions
      baseInstruction += `\n\n=== COMIC FUNDAMENTALS FOR PAGE ${pageNum} ===`;
      baseInstruction += `\n${getLayoutInstructions(pagePlan.panelLayout)}`;
      baseInstruction += `\n${getShotInstructions(pagePlan.suggestedShot)}`;

      // Transition from previous page
      if (pageNum > 1) {
        const prevScene = relevantHistory[relevantHistory.length - 1]?.narrative?.scene;
        baseInstruction += `\n${getTransitionContext(pagePlan.transitionType, prevScene)}`;
      }

      // Emotional beat guidance
      const beatGuidance: Record<EmotionalBeat, string> = {
        'establishing': 'BEAT: ESTABLISHING - Set the scene, introduce the location/mood.',
        'action': 'BEAT: ACTION - Focus on physical movement, dynamic poses, kinetic energy.',
        'dialogue': 'BEAT: DIALOGUE - Conversation focus, reaction shots, character interplay.',
        'reaction': 'BEAT: REACTION - Show emotional response to what just happened.',
        'climax': 'BEAT: CLIMAX - This is the PEAK MOMENT. Maximum drama and stakes!',
        'transition': 'BEAT: TRANSITION - Bridge scene, moving from one situation to next.',
        'reveal': 'BEAT: REVEAL - Important information disclosed. Dramatic impact moment.',
      };
      baseInstruction += `\n${beatGuidance[pagePlan.emotionalBeat]}`;

      // Pacing guidance
      const pacingGuidance: Record<PacingIntent, string> = {
        'slow': 'PACING: SLOW - Take time with this moment. Detailed descriptions, contemplative tone.',
        'medium': 'PACING: MEDIUM - Standard narrative flow. Balance action and reflection.',
        'fast': 'PACING: FAST - Quick, punchy beats. Short sentences, rapid progression.',
      };
      baseInstruction += `\n${pacingGuidance[pagePlan.pacingIntent]}`;

      // Flashback indicator
      if (pagePlan.isFlashback) {
        baseInstruction += `\nFLASHBACK: This scene takes place in the PAST. Use nostalgic/memory tone in narration.`;
      }

      // Specified characters
      if (pagePlan.primaryCharacters.length > 0) {
        baseInstruction += `\nPLANNED CHARACTERS: Focus on ${pagePlan.primaryCharacters.join(', ')}.`;
      }
      baseInstruction += `\n=== END COMIC FUNDAMENTALS ===\n`;
    }

    // Dynamic text limits based on richMode
    const capLimit = richMode ? "max 35 words. Detailed narration or internal monologue" : "max 15 words";
    const diaLimit = richMode ? "max 30 words. Rich, character-driven speech" : "max 12 words";

    const prompt = `
You are writing a comic book script. PAGE ${pageNum} of ${config.MAX_STORY_PAGES}.
TARGET LANGUAGE FOR TEXT: ${langName} (CRITICAL: CAPTIONS, DIALOGUE, CHOICES MUST BE IN THIS LANGUAGE).
${coreDriver}

CHARACTERS:
- HERO: Active.
- CO-STAR: ${friendInstruction}

PREVIOUS PANELS (READ CAREFULLY):
${historyText.length > 0 ? historyText : "Start the adventure."}

RULES:
1. NO REPETITION. Do not use the same captions or dialogue from previous pages.
2. IF CO-STAR IS ACTIVE, THEY MUST APPEAR FREQUENTLY.
3. VARIETY. If page ${pageNum-1} was an action shot, make this one a reaction or wide shot.
4. LANGUAGE: All user-facing text MUST be in ${langName}.
5. Avoid saying "CO-star" and "hero" in the text captions. Use names if established, or generic descriptors.

INSTRUCTION: ${baseInstruction}

OUTPUT STRICT JSON ONLY (No markdown formatting):
{
  "caption": "Unique narrator text in ${langName}. (${capLimit}).",
  "dialogue": "Unique speech in ${langName}. (${diaLimit}). Optional.",
  "scene": "Vivid visual description (ALWAYS IN ENGLISH for the artist model). MUST explicitly name EVERY character present in the scene (Hero, Co-Star, or their exact given names).",
  "focus_char": "hero" OR "friend" OR "other",
  "choices": ["Descriptive Action A in ${langName}", "Descriptive Action B in ${langName}"] (Only if decision page)
}
`;

    const parts: any[] = [{ text: prompt }];

    // Add Story Description Files
    storyContext.descriptionFiles.forEach(f => {
        parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } });
    });

    // Add Character Backstory Files
    if (heroRef.current?.backstoryFiles) {
        heroRef.current.backstoryFiles.forEach(f => parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } }));
    }
    if (friendRef.current?.backstoryFiles) {
        friendRef.current.backstoryFiles.forEach(f => parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } }));
    }
    additionalCharsRef.current.forEach(c => {
        c.backstoryFiles?.forEach(f => parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } }));
    });

    // Helper to clean and validate the beat response
    const cleanBeatResponse = (parsed: any): Beat => {
        if (parsed.dialogue) parsed.dialogue = String(Array.isArray(parsed.dialogue) ? parsed.dialogue.join(' ') : parsed.dialogue).replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = String(Array.isArray(parsed.caption) ? parsed.caption.join(' ') : parsed.caption).replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!isDecisionPage) parsed.choices = [];
        if (isDecisionPage && !isFinalPage && (!parsed.choices || parsed.choices.length < 2)) parsed.choices = ["Option A", "Option B"];
        if (!['hero', 'friend', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';
        return parsed as Beat;
    };

    // Try Claude first for text analysis
    const claude = getClaude();
    if (claude) {
        try {
            // Build Claude content blocks
            const claudeContent: ClaudeContentBlock[] = [createTextContent(prompt)];

            // Add Story Description Files (images/documents)
            storyContext.descriptionFiles.forEach(f => {
                if (f.mimeType.startsWith('image/')) {
                    claudeContent.push(createImageContent(f.base64, f.mimeType));
                }
            });

            // Add Character Backstory Files
            if (heroRef.current?.backstoryFiles) {
                heroRef.current.backstoryFiles.forEach(f => {
                    if (f.mimeType.startsWith('image/')) {
                        claudeContent.push(createImageContent(f.base64, f.mimeType));
                    }
                });
            }
            if (friendRef.current?.backstoryFiles) {
                friendRef.current.backstoryFiles.forEach(f => {
                    if (f.mimeType.startsWith('image/')) {
                        claudeContent.push(createImageContent(f.base64, f.mimeType));
                    }
                });
            }
            additionalCharsRef.current.forEach(c => {
                c.backstoryFiles?.forEach(f => {
                    if (f.mimeType.startsWith('image/')) {
                        claudeContent.push(createImageContent(f.base64, f.mimeType));
                    }
                });
            });

            const response = await claude.messages.create({
                model: MODEL_TEXT_NAME_CLAUDE,
                max_tokens: 1024,
                messages: [{ role: 'user', content: claudeContent }]
            });

            const responseText = getTextFromClaudeResponse(response.content);
            const rawText = extractJsonFromResponse(responseText);
            const parsed = JSON.parse(rawText);

            return cleanBeatResponse(parsed);
        } catch (e) {
            console.error("Claude beat generation failed, falling back to Gemini", e);
            const errMsg = String(e).toLowerCase();
            const isAuthError = errMsg.includes('invalid_api_key') ||
                errMsg.includes('authentication_error') ||
                errMsg.includes('permission_denied');
            if (isAuthError) {
                handleAnthropicError(e);
                // Auth error - don't fallback, let user fix settings
                return {
                    caption: pageNum === 1 ? "It began..." : "...",
                    scene: `Generic scene for page ${pageNum}.`,
                    focus_char: 'hero',
                    choices: []
                };
            }
            // Other errors - continue to Gemini fallback
        }
    }

    // Gemini fallback (or primary if no Claude key)
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
            model: MODEL_TEXT_NAME,
            contents: { parts },
            config: { responseMimeType: 'application/json' }
        });
        let rawText = res.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(rawText);
        return cleanBeatResponse(parsed);
    } catch (e) {
        console.error("Beat generation failed", e);
        handleAPIError(e);
        return {
            caption: pageNum === 1 ? "It began..." : "...",
            scene: `Generic scene for page ${pageNum}.`,
            focus_char: 'hero',
            choices: []
        };
    }
  };

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

  const generateImage = async (beat: Beat, type: ComicFace['type'], instruction?: string, extraRefImages?: string[], prevImage?: string, prevBeat?: Beat, pageIndex?: number, comicOverrides?: { shotTypeOverride?: ShotType; balloonShapeOverride?: BalloonShape; applyFlashbackStyle?: boolean }): Promise<{ imageUrl: string; originalPrompt: string }> => {
    const startTime = Date.now();
    console.log(`[generateImage] Starting - Type: ${type}, Page: ${pageIndex ?? 'N/A'}, Instruction: ${instruction ? 'Yes' : 'No'}`);

    const contents: any[] = [];
    const getAllRefs = (p: Persona) => p.referenceImages || (p.referenceImage ? [p.referenceImage] : []);
    const getEmblemDesc = (p: Persona) => {
        if (!p.emblemImage) return null;
        const placement = p.emblemPlacement === 'other'
            ? p.emblemPlacementCustom || 'custom location'
            : p.emblemPlacement?.replace('-', ' ') || 'visible';
        return { image: p.emblemImage, placement };
    };
    const getWeaponDesc = (p: Persona) => {
        if (!p.weaponImage) return null;
        return { image: p.weaponImage, description: p.weaponDescriptionText || 'signature weapon' };
    };

    if (heroRef.current?.base64) {
        contents.push({ text: "REFERENCE 1 [HERO]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
        getAllRefs(heroRef.current).forEach((ref, i) => {
            contents.push({ text: `HERO REF SHEET ${i+1}:` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
        });
        const heroEmblem = getEmblemDesc(heroRef.current);
        if (heroEmblem) {
            contents.push({ text: `HERO EMBLEM/LOGO (MUST appear on ${heroEmblem.placement}):` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroEmblem.image } });
        }
        const heroWeapon = getWeaponDesc(heroRef.current);
        if (heroWeapon) {
            contents.push({ text: `HERO SIGNATURE WEAPON (${heroWeapon.description}):` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroWeapon.image } });
        }
    }
    if (friendRef.current?.base64) {
        contents.push({ text: "REFERENCE 2 [CO-STAR]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendRef.current.base64 } });
        getAllRefs(friendRef.current).forEach((ref, i) => {
            contents.push({ text: `CO-STAR REF SHEET ${i+1}:` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
        });
        const friendEmblem = getEmblemDesc(friendRef.current);
        if (friendEmblem) {
            contents.push({ text: `CO-STAR EMBLEM/LOGO (MUST appear on ${friendEmblem.placement}):` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendEmblem.image } });
        }
        const friendWeapon = getWeaponDesc(friendRef.current);
        if (friendWeapon) {
            contents.push({ text: `CO-STAR SIGNATURE WEAPON (${friendWeapon.description}):` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendWeapon.image } });
        }
    }
    additionalCharsRef.current.forEach((c, i) => {
        if (c.base64) {
            contents.push({ text: `REFERENCE ${i + 3} [${c.name}]:` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: c.base64 } });
        }
        getAllRefs(c).forEach((ref, ri) => {
            contents.push({ text: `${c.name} REF SHEET ${ri+1}:` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
        });
        const charEmblem = getEmblemDesc(c);
        if (charEmblem) {
            contents.push({ text: `${c.name} EMBLEM/LOGO (MUST appear on ${charEmblem.placement}):` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: charEmblem.image } });
        }
        const charWeapon = getWeaponDesc(c);
        if (charWeapon) {
            contents.push({ text: `${c.name} SIGNATURE WEAPON (${charWeapon.description}):` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: charWeapon.image } });
        }
    });

    const styleEra = selectedGenre === 'Custom' ? "Modern American" : selectedGenre;
    const artStyleTag = storyContext.artStyle ? `, ${storyContext.artStyle} style` : '';
    
    // 1. PREFIX REINFORCEMENT
    let promptText = `[STRICT GENRE: ${selectedGenre}] [STRICT ART STYLE: ${storyContext.artStyle || 'Comic Book'}]\n`;
    promptText += `STYLE: ${styleEra} comic book art${artStyleTag}, detailed ink, vibrant colors. `;
    promptText += `STORY TITLE: ${storyContext.title || 'Untitled'}. STORY DESC: ${storyContext.descriptionText || 'Adventure'}. `;

    if (type === 'cover') {
        const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
        
        if (storyContext.useOverlayLogo) {
            promptText += `TYPE: Comic Book Cover Art. Main visual: Dynamic action shot of [HERO] (Use REFERENCE 1). LEAVE ROOM AT TOP FOR LOGO AND TITLE OVERLAY. DO NOT DRAW ANY LOGOS, TITLES, OR TEXT ON THE ARTWORK. WE WILL ADD IT DIGITALLY OVER THE IMAGE.`;
        } else {
            promptText += `TYPE: Comic Book Cover. SERIES TITLE: "${storyContext.seriesTitle.toUpperCase()}". STORY TITLE: "${storyContext.title || 'Untitled'}". PUBLISHER: "${storyContext.publisherName.toUpperCase()}". ISSUE: "#${storyContext.issueNumber || '1'}". Draw the series title and story title prominently on the cover. Main visual: Dynamic action shot of [HERO] (Use REFERENCE 1).`;
            if (storyContext.publisherLogo) {
                contents.push({ text: "PUBLISHER LOGO REFERENCE:" });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: storyContext.publisherLogo } });
            }
        }
    } else if (type === 'back_cover') {
        promptText += `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser. Text: "NEXT ISSUE SOON".`;
    } else {
        // LAYER 3: Scene Reinforcement - Embed key visual features into scene description
        let sceneText = beat.scene;
        const focusProfile = characterProfilesRef.current.find(cp => {
            if (beat.focus_char === 'hero') return cp.name === heroRef.current?.name;
            if (beat.focus_char === 'friend') return cp.name === friendRef.current?.name;
            return cp.name.toLowerCase() === beat.focus_char.toLowerCase();
        });

        if (focusProfile) {
            // Extract environment from scene (everything after character action)
            const envMatch = sceneText.match(/\b(in|at|on|near|inside|outside|within)\b.*/i);
            const environment = envMatch ? envMatch[0] : 'the scene';
            const action = sceneText.replace(environment, '').trim() || 'poses';
            sceneText = formatReinforcedScene(focusProfile, action, environment);
        }

        promptText += `TYPE: Vertical comic panel. SCENE: ${sceneText}. `;

        // === COMIC FUNDAMENTALS: Shot framing and layout ===
        const pagePlan = pageIndex !== undefined ? storyOutline.pageBreakdown?.find(p => p.pageIndex === pageIndex) : undefined;

        // Determine effective values (overrides take precedence over page plan)
        const effectiveShotType = comicOverrides?.shotTypeOverride || pagePlan?.suggestedShot;
        const effectiveFlashback = comicOverrides?.applyFlashbackStyle ?? pagePlan?.isFlashback;
        const effectiveBalloonShape = comicOverrides?.balloonShapeOverride;

        // Shot type instructions (from override or page plan)
        if (effectiveShotType) {
          promptText += `\n${getShotInstructions(effectiveShotType)} `;
        }

        // Layout composition hints (only from page plan, not overrideable in reroll)
        if (pagePlan) {
          if (pagePlan.panelLayout === 'splash') {
            promptText += `COMPOSITION: This is a SPLASH PAGE - full dramatic composition, maximum visual impact. `;
          } else if (pagePlan.panelLayout === 'grid-2x3' || pagePlan.panelLayout === 'grid-3x3') {
            promptText += `COMPOSITION: Design as part of a multi-panel page - tighter framing, efficient use of space. `;
          } else if (pagePlan.panelLayout === 'asymmetric') {
            promptText += `COMPOSITION: Dynamic layout - this may be the dramatic payoff panel (larger) or a quick beat (smaller). `;
          }
        }

        // Flashback styling (from override or page plan)
        if (effectiveFlashback) {
          promptText += `\n${getFlashbackInstructions()} `;
        }

        // Balloon shape override instructions
        if (effectiveBalloonShape) {
          const balloonInstructions: Record<BalloonShape, string> = {
            'oval': 'DIALOGUE STYLE: Use standard oval speech bubbles for normal conversation.',
            'burst': 'DIALOGUE STYLE: Use BURST/EXPLOSION speech bubbles - spiky edges indicating SHOUTING or excitement!',
            'wavy': 'DIALOGUE STYLE: Use WAVY/WOBBLY speech bubbles indicating weak, distressed, or injured speech...',
            'dashed': 'DIALOGUE STYLE: Use DASHED-OUTLINE speech bubbles indicating whispered or quiet speech.',
            'cloud': 'DIALOGUE STYLE: Use CLOUD/THOUGHT bubbles for internal thoughts.',
            'rectangle': 'DIALOGUE STYLE: Use RECTANGULAR speech boxes for robotic, electronic, or AI voices.',
            'jagged': 'DIALOGUE STYLE: Use JAGGED/ELECTRIC speech bubbles for radio, phone, or broadcast transmissions.',
            'inverted': 'DIALOGUE STYLE: Use INVERTED (black background, white text) speech bubbles for alien or otherworldly voices.',
          };
          promptText += `\n${balloonInstructions[effectiveBalloonShape]} `;
        }

        let mappings = `If scene mentions 'HERO' or '${heroRef.current?.name}', you MUST use REFERENCE 1. If scene mentions 'CO-STAR' or 'SIDEKICK' or '${friendRef.current?.name}', you MUST use REFERENCE 2.`;
        additionalCharsRef.current.forEach((c, i) => {
             mappings += ` If scene mentions '${c.name}', you MUST use REFERENCE ${i + 3}.`;
        });
        promptText += `\nINSTRUCTIONS: Maintain strict character likeness. ${mappings}\n`;
        
        if (beat.caption) promptText += ` INCLUDE CAPTION BOX: "${beat.caption}"`;
        if (beat.dialogue) promptText += ` INCLUDE SPEECH BUBBLE: "${beat.dialogue}"`;
        
        if (instruction) {
             promptText += ` \nUSER REROLL INSTRUCTION: "${instruction}". Ensure this explicit instruction is followed perfectly in the visual!`;
             // Automatic background instruction for rerolls
             promptText += ` \nWhen regenerating a character or scene, reference all selected character profiles, uploaded reference images, and attached visual assets to maintain visual consistency. Prioritize matching defining features (face, build, clothing, color palette) from the selected references before applying any stylistic changes from the user's text input.`;
        }
    }

    if (type !== 'back_cover') {
        promptText += ` \n[CRITICAL CONSISTENCY DIRECTIVES]:
1. You MUST strictly copy the exact physical appearance, facial features, hairstyle, body type, and clothing from the provided REFERENCE images AND the CHARACTER VISUAL PROFILES below.
2. The characters in the output MUST be instantly recognizable as the characters in the references. Do not invent new character designs, outfits, or hairstyles unless explicitly asked.
3. Pay close attention to distinguishing features (scars, tattoos, specific hair colors) mentioned in the profiles and ensure they are visible.
4. [ART STYLE & GENRE ENFORCEMENT] The overall visual style of every panel MUST be: ${styleEra} comic book art${artStyleTag}. The GENRE is: ${selectedGenre}. Do NOT deviate from this art style or genre under any circumstances. THE ENVIRONMENT, LIGHTING, AND AESTHETIC MUST MATCH THE ${selectedGenre.toUpperCase()} GENRE. The line work, coloring technique, shading, and overall aesthetic must consistently match the specified style throughout.
5. [EMBLEM/LOGO ENFORCEMENT] If a character has an EMBLEM/LOGO reference image provided, you MUST include that exact emblem design at the specified placement location on the character. The emblem must be clearly visible and match the reference exactly in shape, colors, and design. This is a signature visual element that must appear consistently.
6. [CLOTHING & ARMOR ENFORCEMENT] Each character's costume, outfit, or armor MUST match their reference images EXACTLY. Do not simplify, modify, or redesign any clothing elements. Copy all details including: fabric patterns, armor segments, belt designs, gloves, boots, capes, and accessories. The outfit shown in the reference is the character's SIGNATURE LOOK and must remain consistent across all panels.
7. [BATCH VISUAL CONTINUITY] Pages are generated in batches of 3. This page is part of a mini-chapter. Maintain STRONG visual continuity with surrounding pages: consistent lighting, color palette, character positioning flow, and environmental details across the batch.
8. [REFERENCE IMAGE FALLBACK] If a character's profile does NOT include emblem/logo description OR clothing/suit description, you MUST rely HEAVILY on their uploaded reference images (portrait, emblem reference, character references) to accurately reproduce these visual elements. Study the reference images carefully and copy every detail of the costume, emblem, and accessories exactly as shown. The reference images are the SOURCE OF TRUTH when text descriptions are incomplete.\n`;

        // LAYER 2: Structured Identity Headers for each character
        if (characterProfilesRef.current.length > 0) {
            promptText += '\n--- CHARACTER IDENTITY BLOCKS (LAYER 2) ---\n';
            characterProfilesRef.current.forEach(cp => {
                promptText += formatIdentityHeader(cp) + '\n\n';
            });
            promptText += '--- END CHARACTER IDENTITY BLOCKS ---\n';

            // LAYER 4: Consistency Instructions for characters appearing in this scene
            promptText += '\n--- CONSISTENCY REQUIREMENTS (LAYER 4) ---\n';
            characterProfilesRef.current.forEach(cp => {
                promptText += formatConsistencyInstruction(cp, storyContext.artStyle || 'Comic Book') + '\n\n';
            });
            promptText += '--- END CONSISTENCY REQUIREMENTS ---\n';
        }

        // 5. FINAL VISUAL ANCHOR (to catch context dilution)
        promptText += `\n[FINAL VISUAL ANCHOR]: REMEMBER, THIS PROJECT IS A ${selectedGenre.toUpperCase()} COMIC IN ${storyContext.artStyle.toUpperCase()} STYLE. EVERY PIXEL MUST REFLECT THIS.`;
    }

    // 6. PREVIOUS PAGE CONTEXT (Sequential Context)
    if (prevImage && prevBeat) {
        contents.push({ text: "CONTEXT: PREVIOUS PAGE VISUAL REFERENCE (PAGE BEFORE THIS ONE):" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: prevImage.split(',')[1] || prevImage } });
        promptText += ` \n[SEQUENTIAL CONTEXT]: This panel follows the scene where: "${prevBeat.scene}". You MUST maintain continuity with the background, lighting, and character positions from the PREVIOUS PAGE VISUAL REFERENCE provided.`;
    }

    contents.push({ text: promptText });

    // Inject extra reference images selected from the reroll modal
    if (extraRefImages && extraRefImages.length > 0) {
        extraRefImages.forEach((ref, i) => {
            contents.push({ text: `REROLL EXTRA REF ${i+1}:` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
        });
    }

    // Debug: Log contents summary before API call
    const imageCount = contents.filter(c => c.inlineData).length;
    const textCount = contents.filter(c => c.text).length;
    console.log(`[generateImage] Preparing API call - Images: ${imageCount}, Text blocks: ${textCount}, Prompt length: ${promptText.length} chars`);

    try {
        const ai = getAI();
        console.log(`[generateImage] Calling Gemini API (model: ${MODEL_IMAGE_GEN_NAME})...`);
        const apiStartTime = Date.now();

        const res = await ai.models.generateContent({
          model: MODEL_IMAGE_GEN_NAME,
          contents: contents,
          config: { imageConfig: { aspectRatio: '2:3' } }
        });

        const apiDuration = Date.now() - apiStartTime;
        const totalDuration = Date.now() - startTime;

        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        const imageUrl = part?.inlineData?.data ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : '';

        console.log(`[generateImage] Complete - API: ${apiDuration}ms, Total: ${totalDuration}ms, Success: ${imageUrl ? 'Yes' : 'No (empty)'}`);
        if (!imageUrl) {
            const candidate = res.candidates?.[0];
            console.warn(`[generateImage] Empty image response:`, {
                candidateCount: res.candidates?.length ?? 0,
                finishReason: candidate?.finishReason,
                safetyRatings: candidate?.safetyRatings,
                contentParts: candidate?.content?.parts?.map(p => p.text ? 'text' : p.inlineData ? 'image' : 'unknown'),
                promptFeedback: (res as any).promptFeedback
            });
        }

        return { imageUrl, originalPrompt: promptText };
    } catch (e: any) {
        const totalDuration = Date.now() - startTime;
        console.error(`[generateImage] FAILED after ${totalDuration}ms:`, e?.message || e);
        console.error(`[generateImage] Error details:`, {
            name: e?.name,
            status: e?.status,
            statusText: e?.statusText,
            response: e?.response?.data || e?.response
        });
        handleAPIError(e);
        return { imageUrl: '', originalPrompt: promptText };
    }
  };

  const generateCharacterProfile = async (persona: Persona, forceAnalysis = false): Promise<CharacterProfile> => {
      // Build content for both Claude and Gemini
      const claudeContent: ClaudeContentBlock[] = [];
      const geminiContent: any[] = [];
      let hasData = false;

      if (persona.base64) {
          claudeContent.push(createTextContent(`Analyze this character portrait for: ${persona.name || 'Unknown'}`));
          claudeContent.push(createImageContent(persona.base64, 'image/jpeg'));
          geminiContent.push({ text: `Analyze this character portrait for: ${persona.name || 'Unknown'}` });
          geminiContent.push({ inlineData: { mimeType: 'image/jpeg', data: persona.base64 } });
          hasData = true;
      }

      const allRefs = persona.referenceImages || (persona.referenceImage ? [persona.referenceImage] : []);
      allRefs.forEach((ref, i) => {
          claudeContent.push(createTextContent(`Additional reference ${i+1}:`));
          claudeContent.push(createImageContent(ref, 'image/jpeg'));
          geminiContent.push({ text: `Additional reference ${i+1}:` });
          geminiContent.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
          hasData = true;
      });

      // Include emblem/logo if provided
      if (persona.emblemImage) {
          const placementDesc = persona.emblemPlacement === 'other'
              ? persona.emblemPlacementCustom || 'custom location'
              : persona.emblemPlacement?.replace('-', ' ') || 'unspecified location';
          claudeContent.push(createTextContent(`EMBLEM/LOGO (placed on ${placementDesc}):`));
          claudeContent.push(createImageContent(persona.emblemImage, 'image/jpeg'));
          geminiContent.push({ text: `EMBLEM/LOGO (placed on ${placementDesc}):` });
          geminiContent.push({ inlineData: { mimeType: 'image/jpeg', data: persona.emblemImage } });
          hasData = true;
      }

      // Include weapon reference if provided
      if (persona.weaponImage) {
          const weaponDesc = persona.weaponDescriptionText || 'signature weapon';
          claudeContent.push(createTextContent(`SIGNATURE WEAPON (${weaponDesc}):`));
          claudeContent.push(createImageContent(persona.weaponImage, 'image/jpeg'));
          geminiContent.push({ text: `SIGNATURE WEAPON (${weaponDesc}):` });
          geminiContent.push({ inlineData: { mimeType: 'image/jpeg', data: persona.weaponImage } });
          hasData = true;
      }

      // Include character description/backstory text (check both fields for compatibility)
      const descriptionText = persona.backstoryText || persona.desc || '';
      if (descriptionText.trim().length > 0) {
          claudeContent.push(createTextContent(`Character Description/Backstory: ${descriptionText}`));
          geminiContent.push({ text: `Character Description/Backstory: ${descriptionText}` });
          hasData = true;
      }

      if (persona.backstoryFiles && persona.backstoryFiles.length > 0) {
          persona.backstoryFiles.forEach(file => {
              if (file.mimeType.startsWith('text/')) {
                  try {
                      const text = atob(file.base64);
                      claudeContent.push(createTextContent(`Additional Details (${file.name}): ${text}`));
                      geminiContent.push({ text: `Additional Details (${file.name}): ${text}` });
                      hasData = true;
                  } catch (err) {}
              } else if (file.mimeType.startsWith('image/')) {
                  claudeContent.push(createImageContent(file.base64, file.mimeType));
                  geminiContent.push({ inlineData: { mimeType: file.mimeType, data: file.base64 } });
                  hasData = true;
              }
          });
      }

      if (!hasData && !forceAnalysis) {
          console.log(`Skipping profile generation for ${persona.name} (no data provided)`);
          return {
              id: persona.id,
              name: persona.name || 'Unknown',
              faceDescription: '', bodyType: '', clothing: '', colorPalette: '', distinguishingFeatures: ''
          };
      }

      const analysisPrompt = `
Analyze the character based on the images and text provided above. Produce a STRICT JSON visual profile.
If only text is provided, infer the visual details based on the description.
If an EMBLEM/LOGO image is provided, describe it accurately and note its placement.

OUTPUT JSON ONLY (no markdown):
{
  "faceDescription": "Shape, eye color, nose, jawline, expression, any scars/markings",
  "bodyType": "Height, build (slim/athletic/muscular/heavy), proportions",
  "clothing": "Exact outfit description with all details, armor, accessories",
  "colorPalette": "Primary and secondary colors of skin, hair, eyes, outfit",
  "distinguishingFeatures": "Unique traits: tattoos, glowing eyes, tail, pointed ears, scars, etc.",
  "emblemDescription": "If emblem/logo provided: describe the emblem design, colors, and its placement on the character. Include this in EVERY panel featuring this character.",
  "maskDescription": "If character wears a mask: describe the mask type (full face, half face, domino, bandana, etc.), material, colors, patterns, and any distinctive features. If NO MASK, leave empty string.",
  "hairDetails": {
    "length": "Describe length (bald, buzz cut, short, medium, long, very long, floor-length)",
    "type": "Straight, wavy, curly, coily, braided, dreadlocks, etc.",
    "color": "Exact color(s) including highlights, ombre, tips, roots if different",
    "style": "How it's worn (loose, ponytail, bun, pigtails, mohawk, spikes, slicked back, parted, messy, neat)"
  },
  "weaponDescription": "If character has a signature weapon: describe weapon type (sword, gun, staff, etc.), size, material, colors, engravings, glowing effects, and any unique features. If no weapon, leave empty string.",
  "identityHeader": {
    "face": "Face shape, cheekbones, chin, distinctive facial features",
    "eyes": "Eye color, shape, spacing, typical expression",
    "hair": "DETAILED: [length] [color] [type] hair worn [style] - e.g., 'long crimson wavy hair worn loose with side-swept bangs'",
    "skin": "Skin tone, any visible marks (scars, tattoos, moles)",
    "build": "Body type, height impression, posture",
    "signature": ["item1 always worn/visible", "emblem/logo if provided", "mask if worn", "item3 if any"]
  },
  "hardNegatives": ["feature to never include based on what you see - e.g. if no glasses, add 'no glasses'"]
}

For hardNegatives, analyze the image and add negatives for:
- If they have a specific hairstyle, add "no [opposite style]" (e.g., curly hair -> "no straight hair")
- If specific hair length, add "no [opposite length] hair" (e.g., long hair -> "no short hair")
- If specific hair color, add "no [other colors] hair"
- If they don't wear glasses, add "no glasses"
- If specific eye color, add "no [other colors] eyes"
- If clean-shaven, add "no beard", "no facial hair"
- If no bangs, add "no bangs"
- If NO MASK in reference, add "no mask", "no face covering"
- If character HAS a mask, add "must always wear [mask type]"
- If no helmet in reference, add "no helmet"
`;
      claudeContent.push(createTextContent(analysisPrompt));
      geminiContent.push({ text: analysisPrompt });

      // Helper to ensure string fields are actually strings (AI sometimes returns objects)
      const ensureString = (val: unknown): string => {
          if (val === null || val === undefined) return '';
          if (typeof val === 'string') return val;
          if (typeof val === 'object') {
              return Object.entries(val as Record<string, unknown>)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ');
          }
          return String(val);
      };

      // Helper to process parsed JSON into CharacterProfile
      const processProfileResponse = (parsed: any): CharacterProfile => {
          const identityHeader = parsed.identityHeader || {
              face: parsed.faceDescription || '',
              eyes: (parsed.faceDescription?.match(/eye[s]?[:\s]+([^,.]+)/i)?.[1] || '').trim(),
              hair: (ensureString(parsed.colorPalette)?.match(/hair[:\s]+([^,.]+)/i)?.[1] || '').trim(),
              skin: (ensureString(parsed.colorPalette)?.match(/skin[:\s]+([^,.]+)/i)?.[1] || '').trim(),
              build: parsed.bodyType || '',
              signature: ensureString(parsed.distinguishingFeatures)?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
          };
          const hardNegatives = parsed.hardNegatives || generateHardNegatives(identityHeader);
          // Parse hair details if present
          const hairDetails = parsed.hairDetails ? {
              length: ensureString(parsed.hairDetails.length),
              type: ensureString(parsed.hairDetails.type),
              color: ensureString(parsed.hairDetails.color),
              style: ensureString(parsed.hairDetails.style),
          } : undefined;

          // Get emblem placement from persona (user's selection)
          const emblemPlacement = persona.emblemPlacement === 'other'
              ? persona.emblemPlacementCustom || 'custom location'
              : persona.emblemPlacement?.replace(/-/g, ' ') || undefined;

          return {
              id: persona.id,
              name: persona.name || 'Unknown',
              faceDescription: ensureString(parsed.faceDescription),
              bodyType: ensureString(parsed.bodyType),
              clothing: ensureString(parsed.clothing),
              colorPalette: ensureString(parsed.colorPalette),
              distinguishingFeatures: ensureString(parsed.distinguishingFeatures),
              emblemDescription: parsed.emblemDescription ? ensureString(parsed.emblemDescription) : undefined,
              emblemPlacement, // User's selected placement from Persona
              maskDescription: parsed.maskDescription ? ensureString(parsed.maskDescription) : undefined,
              hairDetails,
              weaponDescription: parsed.weaponDescription ? ensureString(parsed.weaponDescription) : undefined,
              identityHeader,
              hardNegatives,
              contrastFeatures: [],
          };
      };

      // Try Claude first
      const claude = getClaude();
      if (claude) {
          try {
              console.log(`[Claude] Generating profile for ${persona.name}...`);
              const response = await claude.messages.create({
                  model: MODEL_TEXT_NAME_CLAUDE,
                  max_tokens: 2048,
                  messages: [{ role: 'user', content: claudeContent }]
              });
              const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
              const cleaned = extractJsonFromResponse(text);
              const parsed = JSON.parse(cleaned);
              console.log(`[Claude] Profile generated for ${persona.name}`);
              return processProfileResponse(parsed);
          } catch (e) {
              console.warn(`[Claude] Failed for ${persona.name}, falling back to Gemini:`, e);
              handleAnthropicError(e);
          }
      }

      // Gemini fallback
      try {
          console.log(`[Gemini] Generating profile for ${persona.name}...`);
          const ai = getAI();
          const res = await ai.models.generateContent({
              model: MODEL_TEXT_NAME,
              contents: geminiContent,
          });
          const text = res.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);
          console.log(`[Gemini] Profile generated for ${persona.name}`);
          return processProfileResponse(parsed);
      } catch (e) {
          console.warn('Failed to generate character profile for', persona.name, e);
          handleAPIError(e);
          return {
              id: persona.id,
              name: persona.name || 'Unknown',
              faceDescription: '', bodyType: '', clothing: '', colorPalette: '', distinguishingFeatures: ''
          };
      }
  };

  const generateAllProfiles = async () => {
      const personas: Persona[] = [];
      if (heroRef.current) personas.push(heroRef.current);
      if (friendRef.current) personas.push(friendRef.current);
      personas.push(...additionalCharsRef.current.filter(c => c.base64 || (c.desc && c.desc.trim().length > 0) || (c.backstoryFiles && c.backstoryFiles.length > 0)));
      
      const profiles: CharacterProfile[] = [];
      for (const p of personas) {
          profiles.push(await generateCharacterProfile(p));
      }
      
      characterProfilesRef.current = profiles;
      console.log('[Character Profiles Generated]', profiles);
      return profiles;
  };

  // Generate blank profiles for manual entry (when skipProfileAnalysis is enabled)
  const generateBlankProfiles = (): CharacterProfile[] => {
      const personas: Persona[] = [];
      if (heroRef.current) personas.push(heroRef.current);
      if (friendRef.current) personas.push(friendRef.current);
      personas.push(...additionalCharsRef.current.filter(c => c.base64 || c.backstoryText));

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
      if (heroRef.current) personas.push(heroRef.current);
      if (friendRef.current) personas.push(friendRef.current);
      personas.push(...additionalCharsRef.current.filter(c => c.base64 || (c.desc && c.desc.trim().length > 0) || (c.backstoryFiles && c.backstoryFiles.length > 0)));

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

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type'], instruction?: string, extraRefImages?: string[], previousChoices?: string[], comicOverrides?: ComicOverrides) => {
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

      if (beat.focus_char === 'friend' && !friendRef.current && type === 'story') {
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

      const result = await generateImage(beat, type, instruction, extraRefImages, prevImage, prevBeat, pageNum, comicOverrides);
      if (isStoppedRef.current) return;
      if (!result.imageUrl) {
          updateFaceState(faceId, { isLoading: false, hasFailed: true, originalPrompt: result.originalPrompt });
      } else {
          updateFaceState(faceId, { imageUrl: result.imageUrl, isLoading: false, hasFailed: false, originalPrompt: result.originalPrompt });
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

  const handleOutlineUpload = async (file: File) => {
    if (file.type && !file.type.startsWith('text/') && !file.name.match(/\.(txt|md)$/i)) {
       alert("Please upload standard .txt or .md text files only. PDFs are not supported and may crash the editor.");
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
      alert("Failed to read outline file.");
    }
  };

  const generateOutline = async (userNotes?: string) => {
    setStoryOutline(prev => ({ ...prev, isGenerating: true }));

    const config = getComicConfig(storyContext.pageLength, extraPages);
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";

    // Build character names list for the prompt
    const characterNames: string[] = [];
    if (heroRef.current?.name) characterNames.push(heroRef.current.name);
    if (friendRef.current?.name) characterNames.push(friendRef.current.name);
    additionalCharsRef.current.forEach(c => { if (c.name) characterNames.push(c.name); });

    const charContext = [
        `HERO: ${heroRef.current?.name || 'Main Hero'}. Backstory: ${heroRef.current?.backstoryText || 'Unknown'}.`,
        friendRef.current ? `CO-STAR: ${friendRef.current.name || 'Sidekick'}. Backstory: ${friendRef.current.backstoryText || 'Unknown'}.` : null,
        ...additionalCharsRef.current.map(c => `${c.name}: ${c.backstoryText || 'Unknown'}.`)
    ].filter(Boolean).join('\n');

    // Enhanced outline prompt with comic fundamentals
    const prompt = `
You are a professional comic book writer planning a ${config.MAX_STORY_PAGES}-page story.

STORY TITLE: ${storyContext.title}
GENRE: ${selectedGenre}
LANGUAGE: ${langName}
ART STYLE: ${storyContext.artStyle}
CHARACTERS: ${characterNames.join(', ')}
${charContext}
STORY DESCRIPTION: ${storyContext.descriptionText}
${userNotes ? `USER NOTES: ${userNotes}` : ''}

For EACH page, provide the following structured breakdown:

PAGE [N]:
- Characters: [who appears, comma-separated]
- Focus: [primary character name]
- Scene: [1-2 sentence visual description]
- Layout: [splash|horizontal-split|vertical-split|grid-2x2|grid-2x3|grid-3x3|asymmetric]
- Shot: [extreme-close-up|close-up|medium|full|wide|extreme-wide]
- Transition: [moment-to-moment|action-to-action|subject-to-subject|scene-to-scene|aspect-to-aspect]
- Beat: [establishing|action|dialogue|reaction|climax|transition|reveal]
- Pacing: [slow|medium|fast]
- Flashback: [yes|no]

=== COMIC LAYOUT GUIDELINES ===
- Use "splash" for: character introductions, major reveals, climaxes (MAX 2-3 per issue)
- Use "grid-2x3" for: dialogue scenes, standard narrative (MOST COMMON - 60%+)
- Use "grid-3x3" for: building tension, dense information
- Use "asymmetric" for: action sequences, dynamic moments (small-small-small-LARGE pattern)
- Use "horizontal-split" for: panoramic environments, cause-and-effect
- Use "vertical-split" for: simultaneous events, character comparisons

=== SHOT TYPE GUIDELINES ===
- extreme-close-up: Eyes/detail only, maximum emotional impact
- close-up: Face fills frame, emotion focus
- medium: Waist-up, balance of character and context (MOST COMMON)
- full: Full body visible, body language emphasis
- wide: Environment prominent with characters
- extreme-wide: Establishing shots, vast environments

=== TRANSITION GUIDELINES (McCloud's Types) ===
- action-to-action: Physical action progression (~65% of panels - MOST COMMON)
- subject-to-subject: Same scene, different subject - dialogue/reactions (~20%)
- scene-to-scene: Time/location jump - "Meanwhile..." or "Later..." (~10%)
- moment-to-moment: Slow-motion emphasis - dramatic pauses (rare)
- aspect-to-aspect: Mood/atmosphere - environmental poetry (rare)

=== PACING RHYTHM ===
- Pages 1-2: SLOW (establishing, setting the scene)
- Pages 3-5: MEDIUM (rising action, character dynamics)
- Pages 6-7: FAST (complication, tension building)
- Page 8-9: SLOW→FAST (climax build)
- Page ${config.MAX_STORY_PAGES}: SLOW (resolution/cliffhanger)

=== CRITICAL RULES ===
1. DO NOT REPEAT poses, locations, or camera angles between consecutive pages
2. VARY layouts - don't use the same layout more than 3 times in a row
3. SHOW character development through interactions
4. Decision pages (${config.DECISION_PAGES.join(', ')}) should use dramatic layouts (splash or asymmetric)

OUTPUT: Structured text EXACTLY as shown above for each page.
`;

    // Helper to process outline response
    const processOutlineResponse = (outlineText: string) => {
      const pageBreakdown = parseEnhancedOutline(outlineText, config);
      setStoryOutline({
        content: outlineText,
        isReady: true,
        isGenerating: false,
        pageBreakdown: pageBreakdown.length > 0 ? pageBreakdown : undefined,
        isEnhanced: pageBreakdown.length > 0,
        lastEditedAt: Date.now(),
        version: 1
      });
    };

    // Try Claude first
    const claude = getClaude();
    if (claude) {
      try {
        console.log('[Claude] Generating story outline...');
        const response = await claude.messages.create({
          model: MODEL_TEXT_NAME_CLAUDE,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        });
        const outlineText = response.content[0].type === 'text' ? response.content[0].text : '';
        console.log('[Claude] Outline generated');
        processOutlineResponse(outlineText);
        return;
      } catch (e) {
        console.warn('[Claude] Outline generation failed, falling back to Gemini:', e);
        handleAnthropicError(e);
      }
    }

    // Gemini fallback
    try {
      console.log('[Gemini] Generating story outline...');
      const ai = getAI();
      const res = await ai.models.generateContent({
        model: MODEL_TEXT_NAME,
        contents: { text: prompt }
      });
      const outlineText = res.text || "";
      console.log('[Gemini] Outline generated');
      processOutlineResponse(outlineText);
    } catch (e) {
      handleAPIError(e);
      setStoryOutline(prev => ({ ...prev, isGenerating: false }));
    }
  };

  /**
   * Parse enhanced outline text into structured PageCharacterPlan array
   */
  const parseEnhancedOutline = (
    text: string,
    config: ReturnType<typeof getComicConfig>
  ): PageCharacterPlan[] => {
    const plans: PageCharacterPlan[] = [];

    // Regex to match each page block
    const pageRegex = /PAGE\s*(\d+):\s*\n-\s*Characters:\s*(.+)\n-\s*Focus:\s*(.+)\n-\s*Scene:\s*(.+)\n-\s*Layout:\s*(.+)\n-\s*Shot:\s*(.+)\n-\s*Transition:\s*(.+)\n-\s*Beat:\s*(.+)\n-\s*Pacing:\s*(.+)\n-\s*Flashback:\s*(.+)/gi;

    let match;
    while ((match = pageRegex.exec(text)) !== null) {
      const pageIndex = parseInt(match[1]);

      // Map character names to IDs
      const charNames = match[2].split(',').map(c => c.trim().toLowerCase());
      const primaryCharacters: string[] = [];
      charNames.forEach(name => {
        if (name.includes('hero') || name === heroRef.current?.name?.toLowerCase()) {
          primaryCharacters.push('hero');
        } else if (name.includes('co-star') || name.includes('sidekick') || name === friendRef.current?.name?.toLowerCase()) {
          primaryCharacters.push('friend');
        } else {
          // Check additional characters
          const found = additionalCharsRef.current.find(c => c.name.toLowerCase() === name);
          if (found) primaryCharacters.push(found.id);
        }
      });

      // Map focus character
      const focusName = match[3].trim().toLowerCase();
      let focusCharacter = 'hero';
      if (focusName.includes('co-star') || focusName.includes('sidekick') || focusName === friendRef.current?.name?.toLowerCase()) {
        focusCharacter = 'friend';
      } else {
        const found = additionalCharsRef.current.find(c => c.name.toLowerCase() === focusName);
        if (found) focusCharacter = found.id;
      }

      // Parse layout
      const layoutStr = match[5].trim().toLowerCase();
      const validLayouts: PanelLayout[] = ['splash', 'horizontal-split', 'vertical-split', 'grid-2x2', 'grid-2x3', 'grid-3x3', 'asymmetric'];
      const panelLayout: PanelLayout = validLayouts.includes(layoutStr as PanelLayout)
        ? (layoutStr as PanelLayout)
        : 'grid-2x3'; // default

      // Parse shot
      const shotStr = match[6].trim().toLowerCase();
      const validShots: ShotType[] = ['extreme-close-up', 'close-up', 'medium', 'full', 'wide', 'extreme-wide'];
      const suggestedShot: ShotType = validShots.includes(shotStr as ShotType)
        ? (shotStr as ShotType)
        : 'medium'; // default

      // Parse transition
      const transStr = match[7].trim().toLowerCase();
      const validTransitions: TransitionType[] = ['moment-to-moment', 'action-to-action', 'subject-to-subject', 'scene-to-scene', 'aspect-to-aspect', 'non-sequitur'];
      const transitionType: TransitionType = validTransitions.includes(transStr as TransitionType)
        ? (transStr as TransitionType)
        : 'action-to-action'; // default

      // Parse beat
      const beatStr = match[8].trim().toLowerCase();
      const validBeats: EmotionalBeat[] = ['establishing', 'action', 'dialogue', 'reaction', 'climax', 'transition', 'reveal'];
      const emotionalBeat: EmotionalBeat = validBeats.includes(beatStr as EmotionalBeat)
        ? (beatStr as EmotionalBeat)
        : 'action'; // default

      // Parse pacing
      const pacingStr = match[9].trim().toLowerCase();
      const pacingIntent: PacingIntent = ['slow', 'medium', 'fast'].includes(pacingStr)
        ? (pacingStr as PacingIntent)
        : 'medium'; // default

      // Parse flashback
      const isFlashback = match[10].trim().toLowerCase() === 'yes';

      plans.push({
        pageIndex,
        primaryCharacters: primaryCharacters.length > 0 ? primaryCharacters : ['hero'],
        focusCharacter,
        sceneDescription: match[4].trim(),
        isDecisionPage: config.DECISION_PAGES.includes(pageIndex),
        panelLayout,
        suggestedShot,
        transitionType,
        emotionalBeat,
        pacingIntent,
        isFlashback
      });
    }

    return plans;
  };

  // Mode Selection Handlers
  const handleStartAdventure = () => {
    // Validate basic requirements before showing mode selection
    if (!heroRef.current) {
      alert("Please upload a hero portrait first.");
      return;
    }
    if (selectedGenre === 'Custom' && !customPremise.trim()) {
      alert("Please enter a custom story premise.");
      return;
    }
    setShowModeSelection(true);
  };

  const handleModeSelect = (mode: 'novel' | 'outline') => {
    setGenerateFromOutline(mode === 'outline');
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
    if (!heroRef.current) return;

    if (skipProfileAnalysis) {
        // Skip AI analysis - use blank profiles for manual entry
        const profiles = generateBlankProfiles();
        setTempProfiles(profiles);
        setShowProfilesStep(true);
    } else {
        // Original flow - AI analysis
        setIsGeneratingProfiles(true);
        try {
            const profiles = await generateAllProfiles();
            setTempProfiles(profiles);
            setShowProfilesStep(true);
        } catch (e) {
            console.error("Profile generation failed before starting:", e);
            alert("Failed to analyze character portraits. Check network or API key.");
        } finally {
            setIsGeneratingProfiles(false);
        }
    }
  };

  const continueAfterProfiles = () => {
    characterProfilesRef.current = tempProfiles;
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
      collectRefs(heroRef.current);
      collectRefs(friendRef.current);
      additionalCharsRef.current.forEach(c => collectRefs(c));

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
      const { instruction, negativePrompt, selectedRefImages, selectedProfileIds, regenerationModes, shotTypeOverride, balloonShapeOverride, applyFlashbackStyle, reinforceWithReferenceImages } = options;

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
          'characters_only': '[CHARACTERS ONLY] Keep the exact same background, environment, and scene composition. ONLY regenerate the character(s) with improved consistency to their reference images.',
          'expression_only': '[EXPRESSION ONLY] Keep everything exactly the same (pose, clothing, background). ONLY change the facial expression of the character(s).',
          'outfit_only': '[OUTFIT ONLY] Keep everything exactly the same (face, pose, background). ONLY change the clothing/outfit of the character(s).',
          'emblem_only': '[UPDATE EMBLEM/LOGO] Keep everything exactly the same EXCEPT the emblem/logo. Study the EMBLEM/LOGO reference image carefully and reproduce it EXACTLY - same shape, colors, proportions, and placement. If no emblem reference is uploaded, use the regeneration instructions to guide the emblem update.',
          'weapon_only': '[UPDATE WEAPON] Keep everything exactly the same EXCEPT the weapon. Study the WEAPON reference image carefully and reproduce it EXACTLY - same design, shape, details, and style. If no weapon reference is uploaded, use the regeneration instructions to guide the weapon update.'
      };

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

      const savedProfiles = characterProfilesRef.current;
      characterProfilesRef.current = savedProfiles.filter(p => selectedProfileIds.includes(p.id));

      // In Novel Mode, preserve original choices instead of regenerating them
      const isNovelMode = !generateFromOutline;
      const preservedChoices = isNovelMode && currentFace?.isDecisionPage
          ? (currentFace.originalChoices || cachedChoicesRef.current.get(pageIndex) || currentFace.choices)
          : undefined;

      generateSinglePage(faceId, pageIndex, type, finalInstruction || undefined, selectedRefImages.length > 0 ? selectedRefImages : undefined, allPreviousChoices.length > 0 ? allPreviousChoices : undefined, comicOverrides)
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
              characterProfilesRef.current = savedProfiles;
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
      } catch (e) { alert('Upload failed'); }
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

  const downloadPDF = async (faces: ComicFace[]) => {
    const PAGE_WIDTH = 480;
    const PAGE_HEIGHT = 720;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
    const pagesToPrint = faces.filter(face => face.imageUrl && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    for (let index = 0; index < pagesToPrint.length; index++) {
        const face = pagesToPrint[index];
        if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
        if (face.imageUrl) {
            const finalImg = (face.type === 'cover' && storyContext.useOverlayLogo) 
                ? await compositeCover(face.imageUrl, storyContext) 
                : face.imageUrl;
            doc.addImage(finalImg, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
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

  const handleExport = async (format: 'pdf' | 'webp' | 'png' | 'jpeg') => {
    setShowExportDialog(false);
    const faces = comicFaces.filter(f => f.imageUrl && !f.isLoading);
    if (faces.length === 0) {
      alert("No pages ready to export yet!");
      return;
    }

    if (format === 'pdf') {
      await downloadPDF(faces);
    } else {
      await downloadImages(faces, format);
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
    } catch (e) { alert("Upload failed"); }
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
    } catch (e) { alert("Upload failed"); }
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
    } catch (e) { alert("Emblem upload failed"); }
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
    } catch (e) { alert("Weapon image upload failed"); }
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
    } catch (e) { alert("Upload failed"); }
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
    if (validFiles.length < files.length) alert("Only text files (.txt, .md) and images are supported.");
    if (validFiles.length === 0) return;
    
    try {
      // Use filtered list
      const dataTransfer = new DataTransfer();
      validFiles.forEach(f => dataTransfer.items.add(f));
      
      const processed = await processFiles(dataTransfer.files);
      handleStoryContextUpdate({ descriptionFiles: [...storyContext.descriptionFiles, ...processed] });
    } catch (e) { alert("Upload failed"); }
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
        alert('Please select a valid .json draft file.');
        return;
    }
    try {
      const reader = new FileReader();
      reader.onerror = () => { alert('Failed to read the draft file.'); };
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || !text.trim().startsWith('{')) { alert('Invalid draft file format.'); return; }
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
              alert("Setup fields populated successfully!");
          }
        } catch(err) { 
          console.error('Draft parse error:', err);
          alert("Invalid draft file. Could not parse JSON."); 
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('Draft import error:', err);
      alert('Failed to import draft file.');
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
              availableProfiles={characterProfilesRef.current.map(p => ({ id: p.id, name: p.name }))}
              fullProfiles={characterProfilesRef.current}
              originalPrompt={comicFaces.find(f => f.pageIndex === rerollTarget)?.originalPrompt}
              onSubmit={handleRerollSubmit}
              onClose={() => setRerollTarget(null)}
              onUploadRef={handleRerollUploadRef}
              onDeleteRef={handleRerollDeleteRef}
              onProfileUpdate={(profileId, updates) => {
                  const idx = characterProfilesRef.current.findIndex(p => p.id === profileId);
                  if (idx !== -1) {
                      characterProfilesRef.current[idx] = { ...characterProfilesRef.current[idx], ...updates };
                  }
              }}
              onAnalyzeProfile={async (profileId) => {
                  // Find corresponding persona and regenerate profile
                  const allPersonas = [heroRef.current, friendRef.current, ...additionalCharsRef.current].filter(Boolean) as Persona[];
                  const persona = allPersonas.find(p => p.id === profileId);
                  if (persona) {
                      const newProfile = await generateCharacterProfile(persona, true);
                      const idx = characterProfilesRef.current.findIndex(p => p.id === profileId);
                      if (idx !== -1) characterProfilesRef.current[idx] = newProfile;
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
        />
      )}
    </div>
  );
};

export default App;
