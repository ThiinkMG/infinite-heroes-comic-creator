/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Feature A: Global Character Reference Object
 * Compiles a persistent, frozen CharacterReferenceObject from a Persona + CharacterProfile.
 * Called once at session start (after profiles are generated), stored in useCharacterStore.
 * All image generation calls read from this compiled reference rather than raw profile data.
 */

import { Persona, CharacterProfile, CharacterReferenceObject } from '../types';

/**
 * Build a compiled CharacterReferenceObject from a Persona and its AI-generated profile.
 * This is a pure, deterministic transformation — no AI calls.
 *
 * @param persona - The character's Persona (user-supplied data: portrait, refs, emblem, weapon)
 * @param profile - The AI-analyzed CharacterProfile
 * @returns A frozen reference object ready for prompt injection
 */
export function buildCharacterReference(
  persona: Persona,
  profile: CharacterProfile
): CharacterReferenceObject {
  // --- Outfit summary ---
  const outfitParts: string[] = [];
  if (profile.clothing) outfitParts.push(profile.clothing);
  if (profile.colorPalette) {
    // Extract outfit-specific colors from colorPalette string (e.g. "Skin: olive, Outfit: red and gold")
    const outfitColorMatch = profile.colorPalette.match(/outfit[:\s]+([^;]+)/i)?.[1]?.trim();
    if (outfitColorMatch) outfitParts.push(`Colors: ${outfitColorMatch}`);
  }
  if (profile.extractedColors?.outfit?.length) {
    outfitParts.push(`Palette: ${profile.extractedColors.outfit.join(', ')}`);
  }
  const outfitSummary = outfitParts.filter(Boolean).join(' | ') || 'See portrait reference';

  // --- Weapon summary ---
  const weaponParts: string[] = [];
  if (profile.weaponDescription) weaponParts.push(profile.weaponDescription);
  if (persona.weaponDescriptionText) weaponParts.push(persona.weaponDescriptionText);
  const weaponSummary = weaponParts.filter(Boolean).join(' — ') || '';

  // --- Emblem summary ---
  const emblemParts: string[] = [];
  if (profile.emblemDescription) emblemParts.push(profile.emblemDescription);
  if (profile.emblemPlacement) emblemParts.push(`at ${profile.emblemPlacement}`);
  if (profile.extractedColors?.emblem?.length) {
    emblemParts.push(`Colors: ${profile.extractedColors.emblem.join(', ')}`);
  }
  const emblemSummary = emblemParts.filter(Boolean).join(', ') || '';

  // --- Primary colors (for drift detection) ---
  const primaryColors: string[] = [];
  if (profile.extractedColors) {
    const ec = profile.extractedColors;
    if (ec.skin) primaryColors.push(ec.skin);
    if (ec.hair) primaryColors.push(ec.hair);
    if (ec.eyes) primaryColors.push(ec.eyes);
    ec.outfit.forEach(c => primaryColors.push(c));
  } else if (profile.colorPalette) {
    // Fallback: parse the colorPalette string into an array
    profile.colorPalette.split(/[,;]/).forEach(part => {
      const value = part.replace(/^[^:]+:/, '').trim();
      if (value) primaryColors.push(value);
    });
  }

  // --- Full compiled descriptor (injected at prompt start) ---
  const ih = profile.identityHeader;
  let compiledDescriptor = `[CHARACTER: ${profile.name.toUpperCase()}]`;

  if (ih) {
    compiledDescriptor += `\nFace: ${ih.face}`;
    compiledDescriptor += ` | Eyes: ${ih.eyes}`;
    compiledDescriptor += ` | Hair: ${ih.hair}`;
    compiledDescriptor += ` | Skin: ${ih.skin}`;
    compiledDescriptor += ` | Build: ${ih.build}`;
    if (ih.signature?.length) {
      compiledDescriptor += `\nSignature: ${ih.signature.join(', ')}`;
    }
  } else {
    if (profile.faceDescription) compiledDescriptor += `\nFace: ${profile.faceDescription}`;
    if (profile.bodyType) compiledDescriptor += ` | Build: ${profile.bodyType}`;
  }

  if (outfitSummary) compiledDescriptor += `\nOutfit: ${outfitSummary}`;
  if (weaponSummary) compiledDescriptor += `\nWeapon: ${weaponSummary}`;
  if (emblemSummary) compiledDescriptor += `\nEmblem: ${emblemSummary}`;

  if (profile.hardNegatives?.length) {
    compiledDescriptor += `\nNEVER DRAW: ${profile.hardNegatives.slice(0, 5).join(', ')}`;
  }

  return {
    characterId: persona.id,
    characterName: persona.name,
    compiledDescriptor,
    primaryColors,
    outfitSummary,
    weaponSummary,
    emblemSummary,
    compiledAt: Date.now(),
  };
}

/**
 * Build compiled references for all characters in a cast.
 * Profiles that don't have a matching persona entry are skipped.
 */
export function buildAllCharacterReferences(
  personas: Persona[],
  profiles: CharacterProfile[]
): CharacterReferenceObject[] {
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const refs: CharacterReferenceObject[] = [];

  for (const persona of personas) {
    const profile = profileMap.get(persona.id);
    if (!profile) continue;
    refs.push(buildCharacterReference(persona, profile));
  }

  return refs;
}
