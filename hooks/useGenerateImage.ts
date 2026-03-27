/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Custom hook for generating comic panel images.
 * Extracted from App.tsx as part of Batch 2.2 decomposition.
 */

import { GoogleGenAI } from '@google/genai';
import {
  Beat,
  ComicFace,
  Persona,
  StoryContext,
  StoryOutline,
  CharacterProfile,
  ShotType,
  BalloonShape,
  LANGUAGES,
  formatIdentityHeader,
  formatReinforcedScene,
  formatConsistencyInstruction,
  getShotInstructions,
  getFlashbackInstructions,
} from '../types';
import { detectImageMimeType } from '../claudeHelpers';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useSettingsStore } from '../stores/useSettingsStore';

// ============================================================================
// TYPES
// ============================================================================

const MODEL_IMAGE_GEN_NAME = "gemini-3-pro-image-preview";

/** Configuration for the useGenerateImage hook */
export interface GenerateImageConfig {
  /** Get GoogleGenAI client */
  getAI: () => GoogleGenAI;
  /** Handle API errors */
  onAPIError: (e: unknown) => void;
}

/** Comic fundamentals override options */
export interface ComicOverrides {
  shotTypeOverride?: ShotType;
  balloonShapeOverride?: BalloonShape;
  applyFlashbackStyle?: boolean;
}

/** Parameters for the generateImage function */
export interface GenerateImageParams {
  /** Narrative beat to visualize */
  beat: Beat;
  /** Type of page (cover, story, back_cover) */
  type: ComicFace['type'];
  /** Story context */
  storyContext: StoryContext;
  /** Story outline state */
  storyOutline: StoryOutline;
  /** Optional user instruction for reroll */
  instruction?: string;
  /** Extra reference images to include */
  extraRefImages?: string[];
  /** Previous page image for context */
  prevImage?: string;
  /** Previous page beat for context */
  prevBeat?: Beat;
  /** Current page index */
  pageIndex?: number;
  /** Comic fundamentals overrides */
  comicOverrides?: ComicOverrides;
  /** Use only selected refs (skip default character refs) */
  useOnlySelectedRefs?: boolean;
  /** Current image to preserve (for non-full regeneration) */
  currentImageToPreserve?: string;
}

/** Result from image generation */
export interface GenerateImageResult {
  imageUrl: string;
  originalPrompt: string;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook that provides image generation functionality.
 * Reads character and settings data from Zustand stores.
 */
export const useGenerateImage = (config: GenerateImageConfig) => {
  const { getAI, onAPIError } = config;

  // Store getters (for use in async callbacks)
  const getHero = () => useCharacterStore.getState().hero;
  const getFriend = () => useCharacterStore.getState().friend;
  const getAdditionalChars = () => useCharacterStore.getState().additionalCharacters;
  const getProfilesArray = () => useCharacterStore.getState().getProfilesArray();

  /**
   * Generate a comic panel image.
   * Uses Gemini image generation model.
   */
  const generateImage = async (params: GenerateImageParams): Promise<GenerateImageResult> => {
    const {
      beat,
      type,
      storyContext,
      storyOutline,
      instruction,
      extraRefImages,
      prevImage,
      prevBeat,
      pageIndex,
      comicOverrides,
      useOnlySelectedRefs,
      currentImageToPreserve,
    } = params;

    const startTime = Date.now();
    console.log(`[generateImage] Starting - Type: ${type}, Page: ${pageIndex ?? 'N/A'}, Instruction: ${instruction ? 'Yes' : 'No'}`);

    // Read settings from store
    const { selectedGenre, selectedLanguage } = useSettingsStore.getState();

    const hero = getHero();
    const friend = getFriend();
    const additionalChars = getAdditionalChars();
    const profiles = getProfilesArray();

    const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Helper functions
    const getAllRefs = (p: Persona) => p.referenceImages || (p.referenceImage ? [p.referenceImage] : []);

    const createInlineImage = (base64Data: string) => ({
      inlineData: { mimeType: detectImageMimeType(base64Data), data: base64Data }
    });

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

    // Helper to get inline identity from profile
    const getInlineIdentity = (name: string): string => {
      const profile = profiles.find(cp => cp.name === name);
      if (profile) {
        const ih = profile.identityHeader;
        if (ih) {
          return `[${profile.name.toUpperCase()} IDENTITY: ${ih.face}, ${ih.skin}, ${ih.hair}, ${ih.build}]`;
        }
        const hairInfo = profile.hairDetails
          ? `${profile.hairDetails.style} ${profile.hairDetails.color} hair`
          : 'styled hair';
        return `[${profile.name.toUpperCase()} IDENTITY: ${profile.faceDescription || 'standard face'}, ${hairInfo}, ${profile.distinguishingFeatures || 'no notable features'}]`;
      }
      return '';
    };

    // Push character references with inline identity headers
    const pushCharacterReferences = () => {
      contents.push({ text: "\n=== CHARACTER VISUAL REFERENCES (Match these EXACTLY) ===" });

      if (hero?.base64) {
        const heroIdentity = getInlineIdentity(hero.name);
        contents.push({ text: `\n[PRIORITY: HIGH] ${hero.name.toUpperCase()} PORTRAIT - COPY THIS FACE EXACTLY:\n${heroIdentity}` });
        contents.push(createInlineImage(hero.base64));
        getAllRefs(hero).forEach((ref, i) => {
          contents.push({ text: `[PRIORITY: MEDIUM] ${hero.name.toUpperCase()} COSTUME REF ${i + 1}:` });
          contents.push(createInlineImage(ref));
        });
        const heroEmblem = getEmblemDesc(hero);
        if (heroEmblem) {
          contents.push({ text: `[PRIORITY: MEDIUM] ${hero.name.toUpperCase()} EMBLEM (place on ${heroEmblem.placement}):` });
          contents.push(createInlineImage(heroEmblem.image));
        }
        const heroWeapon = getWeaponDesc(hero);
        if (heroWeapon) {
          contents.push({ text: `[PRIORITY: LOW] ${hero.name.toUpperCase()} WEAPON (${heroWeapon.description}):` });
          contents.push(createInlineImage(heroWeapon.image));
        }
      }

      if (friend?.base64) {
        const friendIdentity = getInlineIdentity(friend.name);
        contents.push({ text: `\n[PRIORITY: HIGH] ${friend.name.toUpperCase()} PORTRAIT - COPY THIS FACE EXACTLY:\n${friendIdentity}` });
        contents.push(createInlineImage(friend.base64));
        getAllRefs(friend).forEach((ref, i) => {
          contents.push({ text: `[PRIORITY: MEDIUM] ${friend.name.toUpperCase()} COSTUME REF ${i + 1}:` });
          contents.push(createInlineImage(ref));
        });
        const friendEmblem = getEmblemDesc(friend);
        if (friendEmblem) {
          contents.push({ text: `[PRIORITY: MEDIUM] ${friend.name.toUpperCase()} EMBLEM (place on ${friendEmblem.placement}):` });
          contents.push(createInlineImage(friendEmblem.image));
        }
        const friendWeapon = getWeaponDesc(friend);
        if (friendWeapon) {
          contents.push({ text: `[PRIORITY: LOW] ${friend.name.toUpperCase()} WEAPON (${friendWeapon.description}):` });
          contents.push(createInlineImage(friendWeapon.image));
        }
      }

      additionalChars.forEach((c) => {
        if (c.base64) {
          const charIdentity = getInlineIdentity(c.name);
          contents.push({ text: `\n[PRIORITY: HIGH] ${c.name.toUpperCase()} PORTRAIT - COPY THIS FACE EXACTLY:\n${charIdentity}` });
          contents.push(createInlineImage(c.base64));
        }
        getAllRefs(c).forEach((ref, ri) => {
          contents.push({ text: `[PRIORITY: MEDIUM] ${c.name.toUpperCase()} COSTUME REF ${ri + 1}:` });
          contents.push(createInlineImage(ref));
        });
        const charEmblem = getEmblemDesc(c);
        if (charEmblem) {
          contents.push({ text: `[PRIORITY: MEDIUM] ${c.name.toUpperCase()} EMBLEM (place on ${charEmblem.placement}):` });
          contents.push(createInlineImage(charEmblem.image));
        }
        const charWeapon = getWeaponDesc(c);
        if (charWeapon) {
          contents.push({ text: `[PRIORITY: LOW] ${c.name.toUpperCase()} WEAPON (${charWeapon.description}):` });
          contents.push(createInlineImage(charWeapon.image));
        }
      });
    };

    // Build prompt text
    const styleEra = selectedGenre === 'Custom' ? "Modern American" : selectedGenre;
    const artStyleTag = storyContext.artStyle ? `, ${storyContext.artStyle} style` : '';

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
          contents.push(createInlineImage(storyContext.publisherLogo));
        }
      }
    } else if (type === 'back_cover') {
      promptText += `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser. Text: "NEXT ISSUE SOON".`;
    } else {
      // Story page - Scene Reinforcement
      let sceneText = beat.scene;
      const focusProfile = profiles.find(cp => {
        if (beat.focus_char === 'hero') return cp.name === hero?.name;
        if (beat.focus_char === 'friend') return cp.name === friend?.name;
        return cp.name.toLowerCase() === beat.focus_char.toLowerCase();
      });

      if (focusProfile) {
        const envMatch = sceneText.match(/\b(in|at|on|near|inside|outside|within)\b.*/i);
        const environment = envMatch ? envMatch[0] : 'the scene';
        const action = sceneText.replace(environment, '').trim() || 'poses';
        sceneText = formatReinforcedScene(focusProfile, action, environment);
      }

      promptText += `TYPE: Vertical comic panel. SCENE: ${sceneText}. `;

      // Comic fundamentals
      const pagePlan = pageIndex !== undefined
        ? storyOutline.pageBreakdown?.find(p => p.pageIndex === pageIndex)
        : undefined;

      const effectiveShotType = comicOverrides?.shotTypeOverride || pagePlan?.suggestedShot;
      const effectiveFlashback = comicOverrides?.applyFlashbackStyle ?? pagePlan?.isFlashback;
      const effectiveBalloonShape = comicOverrides?.balloonShapeOverride;

      if (effectiveShotType) {
        promptText += `\n${getShotInstructions(effectiveShotType)} `;
      }

      if (pagePlan) {
        if (pagePlan.panelLayout === 'splash') {
          promptText += `COMPOSITION: This is a SPLASH PAGE - full dramatic composition, maximum visual impact. `;
        } else if (pagePlan.panelLayout === 'grid-2x3' || pagePlan.panelLayout === 'grid-3x3') {
          promptText += `COMPOSITION: Design as part of a multi-panel page - tighter framing, efficient use of space. `;
        } else if (pagePlan.panelLayout === 'asymmetric') {
          promptText += `COMPOSITION: Dynamic layout - this may be the dramatic payoff panel (larger) or a quick beat (smaller). `;
        }
      }

      if (effectiveFlashback) {
        promptText += `\n${getFlashbackInstructions()} `;
      }

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

      const heroName = hero?.name || 'HERO';
      const friendName = friend?.name || 'CO-STAR';
      let mappings = `${heroName}'s face MUST match the image labeled '${heroName.toUpperCase()} PORTRAIT'. ${friendName}'s face MUST match the image labeled '${friendName.toUpperCase()} PORTRAIT'.`;
      additionalChars.forEach((c) => {
        mappings += ` ${c.name}'s face MUST match the image labeled '${c.name.toUpperCase()} PORTRAIT'.`;
      });
      promptText += `\n[CHARACTER-TO-IMAGE BINDING]: ${mappings}\n`;

      if (beat.caption) promptText += ` INCLUDE CAPTION BOX: "${beat.caption}"`;
      if (beat.dialogue) promptText += ` INCLUDE SPEECH BUBBLE: "${beat.dialogue}"`;

      if (instruction) {
        promptText += ` \nUSER REROLL INSTRUCTION: "${instruction}". Ensure this explicit instruction is followed perfectly in the visual!`;
        promptText += ` \nWhen regenerating a character or scene, reference all selected character profiles, uploaded reference images, and attached visual assets to maintain visual consistency. Prioritize matching defining features (face, build, clothing, color palette) from the selected references before applying any stylistic changes from the user's text input.`;
      }
    }

    // Critical consistency directives
    if (type !== 'back_cover') {
      promptText += ` \n[CRITICAL CONSISTENCY DIRECTIVES - MUST FOLLOW]:
1. [FACE & IDENTITY] Copy EXACT facial features, hairstyle, body type from REFERENCE images. Characters MUST be instantly recognizable. Include all distinguishing features (scars, tattoos, hair color). Reference images are SOURCE OF TRUTH.
2. [ART STYLE] STRICT ${styleEra} comic book art${artStyleTag}, ${selectedGenre} genre. Every pixel must match this style - line work, coloring, shading, environment, lighting.
3. [EMBLEM/LOGO] If character has emblem reference, draw it EXACTLY at specified placement. Match shape, colors, design precisely.
4. [CLOTHING] Copy costume/outfit EXACTLY from references - fabric patterns, armor, accessories, boots, capes. This is their SIGNATURE LOOK.\n`;

      // Identity blocks (Layer 2)
      if (profiles.length > 0) {
        promptText += '\n--- CHARACTER IDENTITY BLOCKS (LAYER 2) ---\n';
        profiles.forEach(cp => {
          promptText += formatIdentityHeader(cp) + '\n\n';
        });
        promptText += '--- END CHARACTER IDENTITY BLOCKS ---\n';

        // Consistency requirements (Layer 4)
        promptText += '\n--- CONSISTENCY REQUIREMENTS (LAYER 4) ---\n';
        profiles.forEach(cp => {
          promptText += formatConsistencyInstruction(cp, storyContext.artStyle || 'Comic Book') + '\n\n';
        });
        promptText += '--- END CONSISTENCY REQUIREMENTS ---\n';
      }

      promptText += `\n[FINAL VISUAL ANCHOR]: REMEMBER, THIS PROJECT IS A ${selectedGenre.toUpperCase()} COMIC IN ${storyContext.artStyle.toUpperCase()} STYLE. EVERY PIXEL MUST REFLECT THIS.`;
    }

    // Previous page context
    if (prevImage && prevBeat) {
      promptText += ` \n[SEQUENTIAL CONTEXT]: This panel follows the scene where: "${prevBeat.scene}". You MUST maintain continuity with the background, lighting, and character positions from the PREVIOUS PAGE VISUAL REFERENCE provided.`;
    }

    // Push prompt text first
    contents.push({ text: promptText });

    // Push character references
    if (useOnlySelectedRefs && extraRefImages && extraRefImages.length > 0) {
      contents.push({ text: "\n=== SELECTED CHARACTER REFERENCES (Use ONLY these for this regeneration) ===" });
      extraRefImages.forEach((ref, i) => {
        contents.push({ text: `[PRIORITY: HIGH] SELECTED REFERENCE ${i + 1} - MATCH THIS EXACTLY:` });
        contents.push(createInlineImage(ref));
      });
    } else {
      pushCharacterReferences();
      if (extraRefImages && extraRefImages.length > 0) {
        extraRefImages.forEach((ref, i) => {
          contents.push({ text: `[PRIORITY: MEDIUM] ADDITIONAL REF ${i + 1}:` });
          contents.push(createInlineImage(ref));
        });
      }
    }

    // Current image to preserve
    if (currentImageToPreserve) {
      const preserveData = currentImageToPreserve.includes(',')
        ? currentImageToPreserve.split(',')[1]
        : currentImageToPreserve;
      contents.push({ text: "\n=== CURRENT PANEL IMAGE (PRESERVE THIS SCENE) ===" });
      contents.push({ text: "[CRITICAL] This is the CURRENT panel. Preserve the background, environment, lighting, and composition. Only modify what the regeneration mode specifies." });
      contents.push(createInlineImage(preserveData));
    }

    // Previous page visual context
    if (prevImage && prevBeat) {
      contents.push({ text: "CONTEXT: PREVIOUS PAGE VISUAL REFERENCE (PAGE BEFORE THIS ONE):" });
      contents.push(createInlineImage(prevImage.split(',')[1] || prevImage));
    }

    // Log contents summary
    const imageCount = contents.filter(c => 'inlineData' in c).length;
    const textCount = contents.filter(c => 'text' in c).length;
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
      const imageUrl = part?.inlineData?.data
        ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        : '';

      console.log(`[generateImage] Complete - API: ${apiDuration}ms, Total: ${totalDuration}ms, Success: ${imageUrl ? 'Yes' : 'No (empty)'}`);

      if (!imageUrl) {
        const candidate = res.candidates?.[0];
        console.warn(`[generateImage] Empty image response:`, {
          candidateCount: res.candidates?.length ?? 0,
          finishReason: candidate?.finishReason,
          safetyRatings: candidate?.safetyRatings,
          contentParts: candidate?.content?.parts?.map(p => 'text' in p ? 'text' : 'inlineData' in p ? 'image' : 'unknown'),
        });
      }

      return { imageUrl, originalPrompt: promptText };
    } catch (e) {
      const totalDuration = Date.now() - startTime;
      console.error(`[generateImage] FAILED after ${totalDuration}ms:`, e);
      onAPIError(e);
      return { imageUrl: '', originalPrompt: promptText };
    }
  };

  return { generateImage };
};

export default useGenerateImage;
