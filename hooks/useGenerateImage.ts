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
import { useMetricsStore } from '../stores/useMetricsStore';
import type { CharacterLockState, CharacterReferenceObject } from '../types';

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
  /** Use compact prompt mode (shorter prompts, less text before images) */
  compactMode?: boolean;
  /** Adjacent page images for scene/outfit continuity (placed before character portraits) */
  adjacentPageImages?: Array<{ base64: string; label: string }>;
  /** Feature F: Reroll consistency mode — forces maximum strength for this call */
  consistencyMode?: boolean;
  /** Override profiles for this call only — avoids mutating the global store (DISCONNECT-6 fix) */
  profileOverrides?: CharacterProfile[];
}

/** Result from image generation */
export interface GenerateImageResult {
  imageUrl: string;
  originalPrompt: string;
  /** Failure reason if image generation failed */
  failureReason?: 'safety' | 'rate_limit' | 'quota' | 'content_policy' | 'timeout' | 'unknown' | string;
}

// ============================================================================
// PROFILE LOOKUP HELPER (Task 5.3.3 - Partial name match fallback)
// ============================================================================

/**
 * Find profile by name with fallback to partial matching.
 * Tries: exact match -> case-insensitive -> partial match -> first name only
 */
const findProfileByName = (name: string, profiles: CharacterProfile[]): CharacterProfile | undefined => {
  if (!name) return undefined;
  const nameLower = name.toLowerCase().trim();

  // Strategy 1: Exact match
  const exact = profiles.find(p => p.name === name);
  if (exact) return exact;

  // Strategy 2: Case-insensitive match
  const caseInsensitive = profiles.find(p => p.name.toLowerCase() === nameLower);
  if (caseInsensitive) {
    console.log(`[Profile Lookup] Fuzzy matched "${name}" to "${caseInsensitive.name}" (case-insensitive)`);
    return caseInsensitive;
  }

  // Strategy 3: Partial match (profile name contains search or vice versa)
  const partial = profiles.find(p =>
    p.name.toLowerCase().includes(nameLower) ||
    nameLower.includes(p.name.toLowerCase())
  );
  if (partial) {
    console.log(`[Profile Lookup] Fuzzy matched "${name}" to "${partial.name}" (partial match)`);
    return partial;
  }

  // Strategy 4: First name only match
  const firstName = nameLower.split(' ')[0];
  const firstNameMatch = profiles.find(p =>
    p.name.toLowerCase().split(' ')[0] === firstName
  );
  if (firstNameMatch) {
    console.log(`[Profile Lookup] Fuzzy matched "${name}" to "${firstNameMatch.name}" (first name match)`);
    return firstNameMatch;
  }

  return undefined;
};

// ============================================================================
// CRITICAL DIRECTIVES V2 - Focused and concise (Task 5.2.2)
// ============================================================================

/**
 * Generate per-character critical directives with specific face anchors.
 * More targeted than generic "copy EXACT" — gives the model the actual values to lock onto.
 */
const buildCriticalDirectivesV2 = (profiles: CharacterProfile[]): string => {
  // Collect all hardNegatives from all profiles
  const allNegatives: string[] = [];
  profiles.forEach(p => {
    if (p.hardNegatives?.length) allNegatives.push(...p.hardNegatives);
  });
  const uniqueNegatives = [...new Set(allNegatives)];
  const negativesList = uniqueNegatives.length > 0 ? uniqueNegatives.join(', ') : 'nothing specific';

  let result = '\n[CHARACTER CONSISTENCY — CRITICAL]\n';

  // Per-character face anchor: specific values give the model something concrete to lock onto
  profiles.forEach(p => {
    const ih = p.identityHeader;
    if (ih) {
      result += `• ${p.name.toUpperCase()}: ${ih.face} | eyes: ${ih.eyes} | hair: ${ih.hair} | skin: ${ih.skin} → copy from PORTRAIT above.\n`;
    } else if (p.faceDescription) {
      result += `• ${p.name.toUpperCase()}: ${p.faceDescription} → copy from PORTRAIT above.\n`;
    }
  });

  result += `• COSTUME: Match reference images exactly — same colors, emblems, accessories, no simplification.\n`;
  result += `\nNEVER DRAW: ${negativesList}\n`;

  return result;
};

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
  const getCharacterLocks = () => useCharacterStore.getState().characterLocks;
  const getReferencesArray = () => useCharacterStore.getState().getReferencesArray();

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
      compactMode = false,
      adjacentPageImages,
      consistencyMode = false,
      profileOverrides,
    } = params;

    const startTime = Date.now();
    console.log(`[generateImage] Starting - Type: ${type}, Page: ${pageIndex ?? 'N/A'}, Instruction: ${instruction ? 'Yes' : 'No'}`);

    // Read settings from store (including consistency settings)
    const {
      selectedGenre,
      selectedLanguage,
      reAnchorEveryN = 2,
      referenceImagePriority = true,
    } = useSettingsStore.getState();
    // Feature F: consistencyMode forces maximum strength for this generation call
    const consistencyStrength = consistencyMode ? 1.0 : (useSettingsStore.getState().consistencyStrength ?? 1.0);

    const hero = getHero();
    const friend = getFriend();
    const additionalChars = getAdditionalChars();
    // Use profileOverrides when provided (e.g. reroll with filtered characters) to avoid global store mutation
    const profiles = profileOverrides ?? getProfilesArray();

    // DISCONNECT-4 FIX: Filter profiles to only characters appearing on this page
    // when PageCharacterPlan data is available. This reduces prompt tokens and
    // prevents absent characters from appearing in generated images.
    const pagePlanForFilter = storyOutline.pageBreakdown?.find(p => p.pageIndex === pageIndex);
    const activeProfiles = (pagePlanForFilter && (pagePlanForFilter.primaryCharacters.length > 0 || (pagePlanForFilter.secondaryCharacters?.length ?? 0) > 0))
      ? profiles.filter(p =>
          pagePlanForFilter.primaryCharacters.includes(p.id) ||
          (pagePlanForFilter.secondaryCharacters ?? []).includes(p.id)
        )
      : profiles;

    // Feature A: compiled reference objects (built once after profile generation)
    const compiledRefs = getReferencesArray();

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

    // Max costume ref images per character — more than 1 dilutes the portrait signal.
    // Users can upload many refs for profile analysis (more = better profile),
    // but for image generation fewer focused refs work better than many.
    const MAX_COSTUME_REFS = 1;

    // Helper to get character's actual role label (Villain, Sidekick, etc.) from Persona
    const getRoleLabel = (p: { role?: string; customRole?: string }): string => {
      if (!p.role) return '';
      if (p.role === 'Family/Friend' || p.role === 'Custom') return p.customRole || p.role;
      return p.role;
    };

    // Helper to get inline identity from profile — all 5 fields to minimize guessing
    // characterRoleDesc: actual Persona role (Villain, Sidekick, etc.) for visual context
    const getInlineIdentity = (name: string, role: 'HERO' | 'CO-STAR' | 'CHARACTER' = 'CHARACTER', characterRoleDesc?: string): string => {
      const profile = findProfileByName(name, profiles);
      const roleTag = characterRoleDesc ? ` — ${characterRoleDesc}` : '';
      if (profile) {
        const ih = profile.identityHeader;
        if (ih) {
          const sigStr = ih.signature?.length ? `\nSignature: ${ih.signature.slice(0, 2).join(', ')}` : '';
          return `[${role}: ${profile.name.toUpperCase()}${roleTag}]\nFace: ${ih.face} | Eyes: ${ih.eyes} | Hair: ${ih.hair} | Skin: ${ih.skin} | Build: ${ih.build}${sigStr}\n[PORTRAIT — COPY THIS FACE EXACTLY]:`;
        }
        const hairInfo = profile.hairDetails
          ? `${profile.hairDetails.style} ${profile.hairDetails.color} hair`
          : 'match portrait';
        return `[${role}: ${profile.name.toUpperCase()}${roleTag}]\nFace: ${profile.faceDescription || 'match portrait'} | Hair: ${hairInfo} | Skin: match portrait\n[PORTRAIT — COPY THIS FACE EXACTLY]:`;
      }
      return `[${role}: ${name.toUpperCase()}${roleTag}]\n[PORTRAIT — COPY THIS FACE EXACTLY]:`;
    };

    // Push character references with inline identity headers (Task 5.2.3 - identity immediately before each image)
    const pushCharacterReferences = () => {
      contents.push({ text: "\n=== CHARACTER VISUAL REFERENCES (Match these EXACTLY) ===" });

      if (hero?.base64) {
        // Inline identity immediately before portrait image (Task 5.2.3)
        contents.push({ text: `\n${getInlineIdentity(hero.name, 'HERO', getRoleLabel(hero) || undefined)}` });
        contents.push(createInlineImage(hero.base64));
        getAllRefs(hero).slice(0, MAX_COSTUME_REFS).forEach((ref, i) => {
          contents.push({ text: `[${hero.name.toUpperCase()} COSTUME REF ${i + 1}]:` });
          contents.push(createInlineImage(ref));
        });
        const heroEmblem = getEmblemDesc(hero);
        if (heroEmblem) {
          contents.push({ text: `[${hero.name.toUpperCase()} EMBLEM - place on ${heroEmblem.placement}]:` });
          contents.push(createInlineImage(heroEmblem.image));
        }
        const heroWeapon = getWeaponDesc(hero);
        if (heroWeapon) {
          contents.push({ text: `[${hero.name.toUpperCase()} WEAPON - ${heroWeapon.description}]:` });
          contents.push(createInlineImage(heroWeapon.image));
        }
      }

      if (friend?.base64) {
        // Inline identity immediately before portrait image (Task 5.2.3)
        contents.push({ text: `\n${getInlineIdentity(friend.name, 'CO-STAR', getRoleLabel(friend) || undefined)}` });
        contents.push(createInlineImage(friend.base64));
        getAllRefs(friend).slice(0, MAX_COSTUME_REFS).forEach((ref, i) => {
          contents.push({ text: `[${friend.name.toUpperCase()} COSTUME REF ${i + 1}]:` });
          contents.push(createInlineImage(ref));
        });
        const friendEmblem = getEmblemDesc(friend);
        if (friendEmblem) {
          contents.push({ text: `[${friend.name.toUpperCase()} EMBLEM - place on ${friendEmblem.placement}]:` });
          contents.push(createInlineImage(friendEmblem.image));
        }
        const friendWeapon = getWeaponDesc(friend);
        if (friendWeapon) {
          contents.push({ text: `[${friend.name.toUpperCase()} WEAPON - ${friendWeapon.description}]:` });
          contents.push(createInlineImage(friendWeapon.image));
        }
      }

      additionalChars.forEach((c) => {
        if (c.base64) {
          // Inline identity immediately before portrait image (Task 5.2.3)
          contents.push({ text: `\n${getInlineIdentity(c.name, 'CHARACTER', getRoleLabel(c) || undefined)}` });
          contents.push(createInlineImage(c.base64));
        }
        getAllRefs(c).slice(0, MAX_COSTUME_REFS).forEach((ref, ri) => {
          contents.push({ text: `[${c.name.toUpperCase()} COSTUME REF ${ri + 1}]:` });
          contents.push(createInlineImage(ref));
        });
        const charEmblem = getEmblemDesc(c);
        if (charEmblem) {
          contents.push({ text: `[${c.name.toUpperCase()} EMBLEM - place on ${charEmblem.placement}]:` });
          contents.push(createInlineImage(charEmblem.image));
        }
        const charWeapon = getWeaponDesc(c);
        if (charWeapon) {
          contents.push({ text: `[${c.name.toUpperCase()} WEAPON - ${charWeapon.description}]:` });
          contents.push(createInlineImage(charWeapon.image));
        }
      });
    };

    // ==========================================================================
    // OPTIMIZED PROMPT STRUCTURE (Tasks 5.2.1-5.2.4)
    // ==========================================================================
    // NEW ORDER:
    // 1. Character Summary (compact)
    // 2. CHARACTER IMAGES WITH INLINE IDENTITY (moved up!)
    // 3. Style/Genre tags (short)
    // 4. Scene description
    // 5. CRITICAL DIRECTIVES V2 (2 focused)
    // 6. Caption/dialogue
    // 7. Previous page context
    // ==========================================================================

    const styleEra = selectedGenre === 'Custom' ? "Modern American" : selectedGenre;
    const artStyleTag = storyContext.artStyle ? `, ${storyContext.artStyle}` : '';

    // Build compact character identity summary for front-loading (most critical info first).
    // Include all 5 identity fields so the model has specific values to lock onto before seeing images.
    const buildCharacterSummary = (): string => {
      const summaries: string[] = [];
      profiles.forEach(profile => {
        const ih = profile.identityHeader;
        if (ih) {
          const negatives = profile.hardNegatives?.length ? ` | NEVER: ${profile.hardNegatives.slice(0, 3).join(', ')}` : '';
          summaries.push(`[${profile.name.toUpperCase()}] face: ${ih.face} | eyes: ${ih.eyes} | hair: ${ih.hair} | skin: ${ih.skin} | build: ${ih.build}${negatives}`);
        } else {
          summaries.push(`[${profile.name.toUpperCase()}]: ${profile.faceDescription || 'standard'}, ${profile.colorPalette || 'standard colors'}`);
        }
      });
      return summaries.length > 0
        ? `=== CHARACTER IDENTITIES (memorize before drawing) ===\n${summaries.join('\n')}\n===\n`
        : '';
    };

    // STEP 1: Character Summary (compact, text-only header)
    const preImageText = buildCharacterSummary();
    contents.push({ text: preImageText });

    // -------------------------------------------------------------------------
    // Feature D: Build locked-attribute constraints to prepend as hard rules.
    // Read from useCharacterStore.characterLocks and matching profiles.
    // -------------------------------------------------------------------------
    const buildLockedConstraints = (): string => {
      const locks = getCharacterLocks();
      if (locks.size === 0) return '';

      const lines: string[] = [];
      locks.forEach((lock: CharacterLockState, charId: string) => {
        const anyLocked = lock.lockFace || lock.lockOutfit || lock.lockWeapon || lock.lockEmblem;
        if (!anyLocked) return;

        const profile = profiles.find(p => p.id === charId);
        const charName = profile?.name ?? charId;

        if (lock.lockFace && profile?.identityHeader) {
          const ih = profile.identityHeader;
          lines.push(`[ABSOLUTE CONSTRAINT — ${charName.toUpperCase()} FACE] Face: ${ih.face} | Eyes: ${ih.eyes} | Hair: ${ih.hair} | Skin: ${ih.skin} — MUST NOT CHANGE across any page.`);
        }
        if (lock.lockOutfit && profile?.clothing) {
          lines.push(`[ABSOLUTE CONSTRAINT — ${charName.toUpperCase()} OUTFIT] ${profile.clothing} — MUST NOT CHANGE. Same colors, materials, and accessories as reference.`);
        }
        if (lock.lockEmblem && profile?.emblemDescription) {
          const placement = profile.emblemPlacement ? ` at ${profile.emblemPlacement}` : '';
          lines.push(`[ABSOLUTE CONSTRAINT — ${charName.toUpperCase()} EMBLEM] ${profile.emblemDescription}${placement} — MUST BE PRESENT AND UNCHANGED.`);
        }
        if (lock.lockWeapon && profile?.weaponDescription) {
          lines.push(`[ABSOLUTE CONSTRAINT — ${charName.toUpperCase()} WEAPON] ${profile.weaponDescription} — MUST BE PRESENT AND UNCHANGED.`);
        }
      });

      if (lines.length === 0) return '';
      return `\n=== LOCKED CHARACTER ATTRIBUTES (IMMUTABLE — DO NOT CHANGE) ===\n${lines.join('\n')}\n===\n`;
    };

    // When referenceImagePriority=true (default): portraits appear LAST (highest weight).
    // When false: scene context images appear last (prioritize scene continuity over face accuracy).
    if (!referenceImagePriority) {
      // Scene-first order: portraits go before context images
      if (useOnlySelectedRefs && extraRefImages && extraRefImages.length > 0) {
        contents.push({ text: "\n=== SELECTED REFERENCES (Use ONLY these) ===" });
        extraRefImages.forEach((ref, i) => {
          contents.push({ text: `[SELECTED REF ${i + 1}]:` });
          contents.push(createInlineImage(ref));
        });
      } else {
        pushCharacterReferences();
        if (extraRefImages && extraRefImages.length > 0) {
          extraRefImages.forEach((ref, i) => {
            contents.push({ text: `[ADDITIONAL REF ${i + 1}]:` });
            contents.push(createInlineImage(ref));
          });
        }
      }
    }

    // STEP 2: Previous page image — scene context only, placed before portraits when referenceImagePriority=true.
    if (prevImage && prevBeat) {
      contents.push({ text: "\n[SCENE CONTEXT — previous page. For background/lighting/pose continuity ONLY.]\n⚠️ Do NOT copy face, hair, or skin from this. Faces come from the CHARACTER PORTRAITS below." });
      contents.push(createInlineImage(prevImage.split(',')[1] || prevImage));
    }

    // STEP 2b: Adjacent page images (prev/next) for scene/outfit continuity.
    if (adjacentPageImages && adjacentPageImages.length > 0) {
      for (const adj of adjacentPageImages) {
        contents.push({ text: `\n[${adj.label} — SCENE & OUTFIT CONTINUITY ONLY. Do NOT copy faces, hair, or skin from this. Faces come from character portraits below.]\n` });
        contents.push(createInlineImage(adj.base64));
      }
    }

    // STEP 3: CHARACTER PORTRAITS (last images when referenceImagePriority=true — highest weight)
    if (referenceImagePriority) {
      if (useOnlySelectedRefs && extraRefImages && extraRefImages.length > 0) {
        contents.push({ text: "\n=== SELECTED REFERENCES (Use ONLY these) ===" });
        extraRefImages.forEach((ref, i) => {
          contents.push({ text: `[SELECTED REF ${i + 1}]:` });
          contents.push(createInlineImage(ref));
        });
      } else {
        pushCharacterReferences();

        // Configurable re-anchor interval (Feature E): uses reAnchorEveryN from settings
        if (pageIndex !== undefined && pageIndex >= reAnchorEveryN && pageIndex % reAnchorEveryN === 0) {
          const charList = profiles.map(p => p.name.toUpperCase()).join(', ');
          contents.push({ text: `\n[RE-ANCHOR — Page ${pageIndex}] Faces MUST match the PORTRAIT images immediately above for ${charList}.` });
        }

        if (extraRefImages && extraRefImages.length > 0) {
          extraRefImages.forEach((ref, i) => {
            contents.push({ text: `[ADDITIONAL REF ${i + 1}]:` });
            contents.push(createInlineImage(ref));
          });
        }
      }
    } else {
      // Scene-first: re-anchor still fires but after scene images
      if (!useOnlySelectedRefs && pageIndex !== undefined && pageIndex >= reAnchorEveryN && pageIndex % reAnchorEveryN === 0) {
        const charList = profiles.map(p => p.name.toUpperCase()).join(', ');
        contents.push({ text: `\n[RE-ANCHOR — Page ${pageIndex}] Faces MUST match the PORTRAIT images shown above for ${charList}.` });
      }
    }

    // Current image to preserve (for partial regeneration)
    if (currentImageToPreserve) {
      const preserveData = currentImageToPreserve.includes(',')
        ? currentImageToPreserve.split(',')[1]
        : currentImageToPreserve;
      contents.push({ text: "\n=== CURRENT PANEL (PRESERVE SCENE) ===" });
      contents.push({ text: "[PRESERVE] Keep background, lighting, composition. Only modify as specified." });
      contents.push(createInlineImage(preserveData));
    }

    // Publisher logo for cover (if applicable, add near other images)
    let publisherLogoAdded = false;
    if (type === 'cover' && !storyContext.useOverlayLogo && storyContext.publisherLogo) {
      contents.push({ text: "[PUBLISHER LOGO]:" });
      contents.push(createInlineImage(storyContext.publisherLogo));
      publisherLogoAdded = true;
    }

    // ==========================================================================
    // STEP 3-7: POST-IMAGE TEXT (Style, Scene, Directives, Caption, Context)
    // ==========================================================================

    let promptText = '';

    // STEP 3: Style/Genre tags (SHORT - Task 5.2.4 compact mode uses minimal)
    if (compactMode) {
      promptText += `\n[STYLE: ${styleEra}${artStyleTag}]\n`;
    } else {
      promptText += `\n[GENRE: ${selectedGenre}] [STYLE: ${storyContext.artStyle || 'Comic Book'}]\n`;
      promptText += `${styleEra} comic art${artStyleTag}, detailed ink, vibrant colors.\n`;
    }

    // Feature D: Inject locked attribute constraints immediately after style tag.
    // These are the highest-priority rules — prepended before any scene description.
    const lockedConstraints = buildLockedConstraints();
    if (lockedConstraints) {
      promptText += lockedConstraints;
    }

    // STEP 4: Scene description (varies by page type)
    if (type === 'cover') {
      if (storyContext.useOverlayLogo) {
        promptText += `TYPE: Comic Cover Art. Dynamic action shot of HERO. LEAVE ROOM AT TOP FOR LOGO OVERLAY. DO NOT DRAW TEXT/LOGOS.`;
      } else {
        promptText += `TYPE: Comic Cover. SERIES: "${storyContext.seriesTitle.toUpperCase()}". TITLE: "${storyContext.title || 'Untitled'}". PUBLISHER: "${storyContext.publisherName.toUpperCase()}". ISSUE: #${storyContext.issueNumber || '1'}. Draw titles prominently. Dynamic action shot of HERO.`;
      }
    } else if (type === 'back_cover') {
      promptText += `TYPE: Back Cover. FULL PAGE ART. Dramatic teaser. Text: "NEXT ISSUE SOON".`;
    } else {
      // Story page - Scene Reinforcement
      let sceneText = beat.scene;
      // Use fuzzy matching for focus character lookup (Task 5.3.3)
      let focusProfile: CharacterProfile | undefined;
      if (beat.focus_char === 'hero' && hero?.name) {
        focusProfile = findProfileByName(hero.name, profiles);
      } else if (beat.focus_char === 'friend' && friend?.name) {
        focusProfile = findProfileByName(friend.name, profiles);
      } else if (beat.focus_char) {
        focusProfile = findProfileByName(beat.focus_char, profiles);
      }

      if (focusProfile) {
        const envMatch = sceneText.match(/\b(in|at|on|near|inside|outside|within)\b.*/i);
        const environment = envMatch ? envMatch[0] : 'the scene';
        const action = sceneText.replace(environment, '').trim() || 'poses';
        sceneText = formatReinforcedScene(focusProfile, action, environment);
      }

      promptText += `TYPE: Vertical comic panel.\nSCENE: ${sceneText}\n`;

      // Comic fundamentals (Task 5.2.4 - minimal in compact mode)
      const pagePlan = pageIndex !== undefined
        ? storyOutline.pageBreakdown?.find(p => p.pageIndex === pageIndex)
        : undefined;

      const effectiveShotType = comicOverrides?.shotTypeOverride || pagePlan?.suggestedShot;
      const effectiveFlashback = comicOverrides?.applyFlashbackStyle ?? pagePlan?.isFlashback;
      const effectiveBalloonShape = comicOverrides?.balloonShapeOverride;

      if (effectiveShotType) {
        if (compactMode) {
          promptText += `[SHOT: ${effectiveShotType}] `;
        } else {
          promptText += `${getShotInstructions(effectiveShotType)} `;
        }
      }

      if (!compactMode && pagePlan) {
        if (pagePlan.panelLayout === 'splash') {
          promptText += `SPLASH PAGE - maximum visual impact. `;
        } else if (pagePlan.panelLayout === 'grid-2x3' || pagePlan.panelLayout === 'grid-3x3') {
          promptText += `Multi-panel page - tighter framing. `;
        } else if (pagePlan.panelLayout === 'asymmetric') {
          promptText += `Dynamic layout. `;
        }
      }

      if (effectiveFlashback) {
        if (compactMode) {
          promptText += `[FLASHBACK: sepia/faded edges] `;
        } else {
          promptText += `${getFlashbackInstructions()} `;
        }
      }

      if (effectiveBalloonShape && !compactMode) {
        const balloonInstructions: Record<BalloonShape, string> = {
          'oval': 'Oval speech bubbles.',
          'burst': 'BURST bubbles - spiky edges for shouting!',
          'wavy': 'WAVY bubbles - weak/distressed speech.',
          'dashed': 'DASHED bubbles - whispered speech.',
          'cloud': 'CLOUD bubbles for thoughts.',
          'rectangle': 'RECTANGLE boxes for robotic/AI voices.',
          'jagged': 'JAGGED bubbles for radio/transmissions.',
          'inverted': 'INVERTED (black bg, white text) for alien voices.',
        };
        promptText += `[DIALOGUE: ${balloonInstructions[effectiveBalloonShape]}] `;
      }

      // STEP 6: Caption/dialogue
      if (beat.caption) promptText += `\nCAPTION: "${beat.caption}"`;
      if (beat.dialogue) promptText += `\nSPEECH: "${beat.dialogue}"`;

      // User reroll instruction
      if (instruction) {
        promptText += `\n[USER INSTRUCTION]: "${instruction}" - Follow this precisely!`;
        if (!compactMode) {
          promptText += ` Maintain visual consistency with all character references.`;
        }
      }
    }

    // STEP 5: CRITICAL DIRECTIVES V2 (Task 5.2.2 - 2 focused directives, not 4 verbose)
    if (type !== 'back_cover') {
      promptText += buildCriticalDirectivesV2(profiles);

      // Face drift prevention reminder (reinforces the scene-context warning already in the image block)
      if (prevImage && pageIndex !== undefined && pageIndex >= 2) {
        promptText += `\n[FACE ANCHOR — Page ${pageIndex}] The scene-context image shown at the start is for background/pose ONLY. All character faces MUST match the portrait images shown last in the reference block above.\n`;
      }

      // Feature A: Inject compiled reference descriptors (outfit, weapon, emblem, colors).
      // These are pre-compiled at session start from persona + profile — injected at every page.
      if (compiledRefs.length > 0 && consistencyStrength >= 0.5) {
        promptText += '\n--- COMPILED CHARACTER REFERENCES ---\n';
        compiledRefs.forEach((ref: CharacterReferenceObject) => {
          promptText += ref.compiledDescriptor + '\n';
        });
        promptText += '--- END COMPILED REFERENCES ---\n';
      }

      // Layer 2/4 blocks in non-compact mode, gated by consistencyStrength (Feature E).
      // strength >= 0.5: include full identity blocks. strength < 0.5: skip verbose layers.
      // Uses activeProfiles (page-scoped) to reduce tokens and avoid absent character bleed.
      if (!compactMode && activeProfiles.length > 0 && consistencyStrength >= 0.5) {
        promptText += '\n--- CHARACTER IDENTITY BLOCKS ---\n';
        activeProfiles.forEach(cp => {
          promptText += formatIdentityHeader(cp) + '\n';
        });
        promptText += '--- END IDENTITY BLOCKS ---\n';

        // GAP-17 FIX: Inject extractedColors as a dedicated color enforcement block.
        // Color drift is a common failure — explicit palette reinforcement anchors the model.
        const colorBlocks = activeProfiles
          .filter(cp => cp.extractedColors && (
            cp.extractedColors.skin || cp.extractedColors.hair || cp.extractedColors.eyes ||
            cp.extractedColors.outfit.length > 0 || cp.extractedColors.emblem.length > 0
          ))
          .map(cp => {
            const c = cp.extractedColors!;
            const outfitStr = c.outfit.length > 0 ? c.outfit.join(', ') : '—';
            const emblemStr = c.emblem.length > 0 ? c.emblem.join(', ') : '—';
            return `COLOR PALETTE — ${cp.name.toUpperCase()}: Skin: ${c.skin || '—'} | Hair: ${c.hair || '—'} | Eyes: ${c.eyes || '—'} | Outfit: ${outfitStr} | Emblem: ${emblemStr}`;
          });
        if (colorBlocks.length > 0) {
          promptText += '\n--- CHARACTER COLOR PALETTES (match exactly) ---\n';
          promptText += colorBlocks.join('\n') + '\n';
          promptText += '--- END COLOR PALETTES ---\n';
        }

        promptText += '\n--- CONSISTENCY REQUIREMENTS ---\n';
        activeProfiles.forEach(cp => {
          promptText += formatConsistencyInstruction(cp, storyContext.artStyle || 'Comic Book') + '\n';
        });
        promptText += '---\n';

        // GAP-13: CHARACTER DISAMBIGUATION — inject contrastFeatures when multiple profiles present.
        // Helps model distinguish characters in shared scenes (e.g., "only one with red suit").
        if (activeProfiles.length > 1) {
          const contrastLines = activeProfiles
            .filter(p => p.contrastFeatures && p.contrastFeatures.length > 0)
            .map(p => `• ${p.name.toUpperCase()}: ${p.contrastFeatures!.slice(0, 2).join('; ')}`);
          if (contrastLines.length > 0) {
            promptText += `\n[CHARACTER DISAMBIGUATION]\n${contrastLines.join('\n')}\nDo not mix up these characters.\n`;
          }
        }
      }

      // Maximum consistency: add extra face-lock reinforcement line (Feature E, strength = 1.0)
      if (consistencyStrength >= 1.0 && profiles.length > 0) {
        const faceList = profiles.map(p => {
          const ih = p.identityHeader;
          return ih ? `${p.name.toUpperCase()} (${ih.face}, ${ih.hair})` : p.name.toUpperCase();
        }).join('; ');
        promptText += `\n[MAXIMUM CONSISTENCY] Every character's face MUST be an EXACT visual match to their portrait reference: ${faceList}. No exceptions.\n`;
      }

      // Final anchor (shortened)
      promptText += `\n[ANCHOR: ${selectedGenre.toUpperCase()} comic, ${storyContext.artStyle.toUpperCase()} style]`;
    }

    // STEP 7: Previous page context (text reference)
    if (prevImage && prevBeat) {
      promptText += `\n[CONTINUITY]: Previous scene: "${prevBeat.scene}". Maintain background, lighting, positions.`;
    }

    // Push the post-image prompt text
    contents.push({ text: promptText });

    // Log contents summary
    const imageCount = contents.filter(c => 'inlineData' in c).length;
    const textCount = contents.filter(c => 'text' in c).length;
    console.log(`[generateImage] Preparing API call - Images: ${imageCount}, Text blocks: ${textCount}, Prompt length: ${promptText.length} chars`);

    try {
      const ai = getAI();
      console.log(`[generateImage] Calling Gemini API (model: ${MODEL_IMAGE_GEN_NAME})...`);
      const apiStartTime = Date.now();

      // 2-minute timeout guard — Gemini can hang on complex prompts
      const TIMEOUT_MS = 120_000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('GENERATION_TIMEOUT')), TIMEOUT_MS)
      );

      const res = await Promise.race([
        ai.models.generateContent({
          model: MODEL_IMAGE_GEN_NAME,
          contents: contents,
          config: { imageConfig: { aspectRatio: '2:3' } }
        }),
        timeoutPromise,
      ]);

      const apiDuration = Date.now() - apiStartTime;
      const totalDuration = Date.now() - startTime;

      const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const imageUrl = part?.inlineData?.data
        ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        : '';

      console.log(`[generateImage] Complete - API: ${apiDuration}ms, Total: ${totalDuration}ms, Success: ${imageUrl ? 'Yes' : 'No (empty)'}`);

      if (!imageUrl) {
        const candidate = res.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const safetyRatings = candidate?.safetyRatings;

        console.warn(`[generateImage] Empty image response:`, {
          candidateCount: res.candidates?.length ?? 0,
          finishReason,
          safetyRatings,
          contentParts: candidate?.content?.parts?.map(p => 'text' in p ? 'text' : 'inlineData' in p ? 'image' : 'unknown'),
        });

        // Determine failure reason from API response
        let failureReason: GenerateImageResult['failureReason'] = 'unknown';

        if (finishReason === 'SAFETY' || finishReason === 'BLOCKLIST') {
          failureReason = 'safety';
        } else if (finishReason === 'PROHIBITED_CONTENT' || finishReason === 'OTHER') {
          failureReason = 'content_policy';
        } else if (safetyRatings?.some(r => r.blocked)) {
          failureReason = 'safety';
        }

        useMetricsStore.getState().recordGeneration('image', false, Date.now() - startTime, 'gemini');
        return { imageUrl: '', originalPrompt: promptText, failureReason };
      }

      useMetricsStore.getState().recordGeneration('image', true, Date.now() - startTime, 'gemini');
      return { imageUrl, originalPrompt: promptText };
    } catch (e) {
      const totalDuration = Date.now() - startTime;
      console.error(`[generateImage] FAILED after ${totalDuration}ms:`, e);
      onAPIError(e);

      // Determine failure reason from error message
      const errorMsg = String(e).toLowerCase();
      let failureReason: GenerateImageResult['failureReason'] = 'unknown';

      if (errorMsg.includes('generation_timeout')) {
        console.warn(`[generateImage] Timed out after 120s`);
        failureReason = 'timeout';
      } else if (errorMsg.includes('rate') || errorMsg.includes('429') || errorMsg.includes('too many')) {
        failureReason = 'rate_limit';
      } else if (errorMsg.includes('quota') || errorMsg.includes('resource exhausted')) {
        failureReason = 'quota';
      } else if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
        failureReason = 'safety';
      } else if (errorMsg.includes('permission') || errorMsg.includes('invalid')) {
        failureReason = 'api_key';
      }

      useMetricsStore.getState().recordGeneration('image', false, totalDuration, 'gemini');
      return { imageUrl: '', originalPrompt: promptText, failureReason };
    }
  };

  return { generateImage };
};

export default useGenerateImage;
