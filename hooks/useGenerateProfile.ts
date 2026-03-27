/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Custom hook for generating character profiles.
 * Extracted from App.tsx as part of Batch 2.2 decomposition.
 */

import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import {
  Persona,
  CharacterProfile,
  IdentityHeader,
  generateHardNegatives,
} from '../types';
import {
  createTextContent,
  createImageContent,
  extractJsonFromResponse,
  ClaudeContentBlock,
} from '../claudeHelpers';
import { useCharacterStore } from '../stores/useCharacterStore';

// ============================================================================
// TYPES
// ============================================================================

/** Configuration for the useGenerateProfile hook */
export interface GenerateProfileConfig {
  /** Get GoogleGenAI client */
  getAI: () => GoogleGenAI;
  /** Get Anthropic client (returns null if not configured) */
  getClaude: () => Anthropic | null;
  /** Handle Gemini API errors */
  onAPIError: (e: unknown) => void;
  /** Handle Anthropic API errors */
  onAnthropicError: (e: unknown) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL_TEXT_NAME = "gemini-2.5-pro";
const MODEL_TEXT_NAME_CLAUDE = "claude-sonnet-4-5-20250929";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook that provides character profile generation functionality.
 * Reads character data from Zustand stores.
 */
export const useGenerateProfile = (config: GenerateProfileConfig) => {
  const { getAI, getClaude, onAPIError, onAnthropicError } = config;

  // Store getters (for use in async callbacks)
  const getHero = () => useCharacterStore.getState().hero;
  const getFriend = () => useCharacterStore.getState().friend;
  const getAdditionalChars = () => useCharacterStore.getState().additionalCharacters;

  /**
   * Helper to ensure string fields are actually strings (AI sometimes returns objects)
   */
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

  /**
   * Helper to process parsed JSON into CharacterProfile
   */
  const processProfileResponse = (parsed: Record<string, unknown>, persona: Persona): CharacterProfile => {
    const identityHeader: IdentityHeader = (parsed.identityHeader as IdentityHeader) || {
      face: (parsed.faceDescription as string) || '',
      eyes: ((parsed.faceDescription as string)?.match(/eye[s]?[:\s]+([^,.]+)/i)?.[1] || '').trim(),
      hair: (ensureString(parsed.colorPalette)?.match(/hair[:\s]+([^,.]+)/i)?.[1] || '').trim(),
      skin: (ensureString(parsed.colorPalette)?.match(/skin[:\s]+([^,.]+)/i)?.[1] || '').trim(),
      build: (parsed.bodyType as string) || '',
      signature: ensureString(parsed.distinguishingFeatures)?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    };

    const hardNegatives = (parsed.hardNegatives as string[]) || generateHardNegatives(identityHeader);

    // Parse hair details if present
    const parsedHairDetails = parsed.hairDetails as Record<string, unknown> | undefined;
    const hairDetails = parsedHairDetails ? {
      length: ensureString(parsedHairDetails.length),
      type: ensureString(parsedHairDetails.type),
      color: ensureString(parsedHairDetails.color),
      style: ensureString(parsedHairDetails.style),
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
      emblemPlacement,
      maskDescription: parsed.maskDescription ? ensureString(parsed.maskDescription) : undefined,
      hairDetails,
      weaponDescription: parsed.weaponDescription ? ensureString(parsed.weaponDescription) : undefined,
      identityHeader,
      hardNegatives,
      contrastFeatures: [],
    };
  };

  /**
   * Generate a character profile from persona data.
   * Uses Claude as primary, falls back to Gemini.
   */
  const generateCharacterProfile = async (persona: Persona, forceAnalysis = false): Promise<CharacterProfile> => {
    // Build content for both Claude and Gemini
    const claudeContent: ClaudeContentBlock[] = [];
    const geminiContent: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
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
      claudeContent.push(createTextContent(`Additional reference ${i + 1}:`));
      claudeContent.push(createImageContent(ref, 'image/jpeg'));
      geminiContent.push({ text: `Additional reference ${i + 1}:` });
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
          } catch {
            // Skip malformed base64
          }
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
        faceDescription: '',
        bodyType: '',
        clothing: '',
        colorPalette: '',
        distinguishingFeatures: ''
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
        return processProfileResponse(parsed, persona);
      } catch (e) {
        console.warn(`[Claude] Failed for ${persona.name}, falling back to Gemini:`, e);
        onAnthropicError(e);
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
      return processProfileResponse(parsed, persona);
    } catch (e) {
      console.warn('Failed to generate character profile for', persona.name, e);
      onAPIError(e);
      return {
        id: persona.id,
        name: persona.name || 'Unknown',
        faceDescription: '',
        bodyType: '',
        clothing: '',
        colorPalette: '',
        distinguishingFeatures: ''
      };
    }
  };

  /**
   * Generate profiles for all characters (hero, friend, additional characters).
   * Syncs results to the Zustand store.
   */
  const generateAllProfiles = async (): Promise<CharacterProfile[]> => {
    const personas: Persona[] = [];
    const hero = getHero();
    const friend = getFriend();
    const additionalChars = getAdditionalChars();

    if (hero) personas.push(hero);
    if (friend) personas.push(friend);
    personas.push(...additionalChars.filter(c =>
      c.base64 ||
      (c.desc && c.desc.trim().length > 0) ||
      (c.backstoryFiles && c.backstoryFiles.length > 0)
    ));

    const profiles: CharacterProfile[] = [];
    for (const p of personas) {
      profiles.push(await generateCharacterProfile(p));
    }

    // Sync all profiles to Zustand store
    useCharacterStore.getState().setAllProfiles(profiles);
    console.log('[Character Profiles Generated]', profiles);
    return profiles;
  };

  /**
   * Generate blank profiles for manual entry (when skipProfileAnalysis is enabled).
   */
  const generateBlankProfiles = (): CharacterProfile[] => {
    const personas: Persona[] = [];
    const hero = getHero();
    const friend = getFriend();
    const additionalChars = getAdditionalChars();

    if (hero) personas.push(hero);
    if (friend) personas.push(friend);
    personas.push(...additionalChars.filter(c => c.base64 || c.backstoryText));

    const profiles: CharacterProfile[] = personas.map(p => ({
      id: p.id,
      name: p.name || 'Unknown',
      faceDescription: '',
      bodyType: '',
      clothing: '',
      colorPalette: '',
      distinguishingFeatures: '',
    }));

    // Sync blank profiles to Zustand store
    useCharacterStore.getState().setAllProfiles(profiles);
    console.log('[Blank Profiles Generated]', profiles);
    return profiles;
  };

  return {
    generateCharacterProfile,
    generateAllProfiles,
    generateBlankProfiles,
  };
};

export default useGenerateProfile;
