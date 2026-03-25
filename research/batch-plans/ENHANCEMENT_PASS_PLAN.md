# Enhancement Pass: 4-Layer Consistency System Implementation

**Status:** ⏳ Queued (After Batches 1 & 2 complete)
**Based On:** [Gemini Character Consistency Research](../gemini/character-consistency-guide.md)

## Executive Summary

This enhancement pass transforms the character consistency system from a "hope-based" approach (send refs, hope AI remembers) to a **disciplined 4-layer prompt engineering system** that enforces consistency through structured prompts.

## The Problem

Current implementation in `generateImage()`:
```
❌ Sends reference images (necessary but not sufficient)
❌ Adds brief profile text (too weak)
❌ No structured identity enforcement
❌ No hard negatives to prevent AI drift
❌ No scene-specific reinforcement
❌ No explicit consistency instructions
```

## The Solution: 4-Layer Consistency System

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: Reference Images                                       │
│ • Character portraits                                           │
│ • Additional reference sheets                                   │
│ • Most recent "good" panel (reference chaining)                │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 2: Identity Header                                        │
│ • Structured visual description (face, eyes, hair, skin, build)│
│ • Signature elements (always present)                          │
│ • Hard negatives (what to NEVER include)                       │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 3: Scene-Specific Reinforcement                          │
│ • Repeat 2-3 key identifying features IN the scene description │
│ • Use character NAME, not pronouns                             │
│ • Connect features to action                                   │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 4: Explicit Consistency Instruction                       │
│ • "Maintain exact appearance from reference"                   │
│ • Specify which features MUST be visible                       │
│ • Art style consistency statement                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Type System Updates (types.ts)

#### 1.1 New IdentityHeader Interface

```typescript
interface IdentityHeader {
  face: string;        // "Oval shape, high cheekbones, small rounded chin, slight dimple on left cheek"
  eyes: string;        // "Emerald green, almond-shaped, slightly wide-set, determined expression"
  hair: string;        // "Curly auburn, shoulder-length, usually loose with volume"
  skin: string;        // "Light olive tone, small scar above left eyebrow (always visible)"
  build: string;       // "Athletic, medium height, confident posture"
  signature: string[]; // ["silver pendant necklace", "leather jacket", "combat boots"]
}
```

#### 1.2 Enhanced CharacterProfile

```typescript
interface EnhancedCharacterProfile {
  // Core identity
  id: string;
  name: string;

  // Visual identity (Layer 2)
  identityHeader: IdentityHeader;
  hardNegatives: string[];        // ["no bangs", "no freckles", "no glasses", "no beard"]

  // For multi-character scenes
  contrastFeatures: string[];     // What makes them distinct from other characters
  spatialLabel: string;           // "CHARACTER A" for labeling in prompts

  // Color reference
  colorPalette: {
    primary: string;    // "Auburn red (#8B4513)"
    secondary: string;  // "Emerald green (#50C878)"
    skin: string;       // "Light olive (#C4A484)"
    accent: string;     // "Silver (#C0C0C0)"
  };

  // Reference tracking
  canonicalImageIndex: number;    // Which ref image is the "canonical" one
  lastGoodPanelIndex?: number;    // For reference chaining

  // Legacy compatibility
  faceDescription: string;        // Computed from identityHeader
  bodyType: string;               // Computed from identityHeader
  clothing: string;               // Current outfit (can change)
  distinguishingFeatures: string; // Computed from identityHeader.signature
}
```

#### 1.3 Prompt Template Types

```typescript
interface PromptLayer1 {
  referenceImages: Array<{
    data: string;       // base64
    label: string;      // "HERO PORTRAIT", "CO-STAR REF SHEET 1"
    type: 'portrait' | 'reference' | 'previous_panel';
  }>;
}

interface PromptLayer2 {
  characterName: string;
  identityHeader: IdentityHeader;
  hardNegatives: string[];
}

interface PromptLayer3 {
  sceneDescription: string;       // Includes character name + 2-3 key features
  action: string;
  environment: string;
}

interface PromptLayer4 {
  consistencyInstruction: string;
  mustBeVisible: string[];        // Features that MUST appear
  artStyleAnchor: string;
}

interface FullPromptStructure {
  layer1: PromptLayer1;
  layer2: PromptLayer2[];         // One per character in scene
  layer3: PromptLayer3;
  layer4: PromptLayer4;
}
```

---

### Phase 2: Prompt Generation Functions (App.tsx)

#### 2.1 Identity Header Generator

```typescript
/**
 * Generates a formatted identity header block for a character
 */
function generateIdentityHeaderBlock(profile: EnhancedCharacterProfile): string {
  const { identityHeader, hardNegatives, name } = profile;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER IDENTITY - ${name.toUpperCase()}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MUST-MATCH VISUALS:
- Face: ${identityHeader.face}
- Eyes: ${identityHeader.eyes}
- Hair: ${identityHeader.hair}
- Skin: ${identityHeader.skin}
- Build: ${identityHeader.build}
- Signature elements: ${identityHeader.signature.join(', ')}

HARD NEGATIVES (never include): ${hardNegatives.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}
```

#### 2.2 Scene Reinforcement Generator (Layer 3)

```typescript
/**
 * Generates scene description with character features woven in
 */
function generateReinforcedSceneDescription(
  profile: EnhancedCharacterProfile,
  baseScene: string,
  action: string
): string {
  // Pick 2-3 most distinctive features to reinforce
  const distinctiveFeatures = [
    profile.identityHeader.hair.split(',')[0],  // First part of hair description
    profile.identityHeader.signature[0],         // Primary signature element
  ].filter(Boolean);

  return `${profile.name}, recognizable by their ${distinctiveFeatures.join(' and ')}, ${action} in ${baseScene}.`;
}
```

#### 2.3 Consistency Instruction Generator (Layer 4)

```typescript
/**
 * Generates the explicit consistency instruction
 */
function generateConsistencyInstruction(
  profile: EnhancedCharacterProfile,
  artStyle: string
): string {
  const mustBeVisible = [
    ...profile.identityHeader.signature.slice(0, 2),
    profile.identityHeader.hair.split(',')[0],
  ];

  return `
CONSISTENCY REQUIREMENT: Maintain ${profile.name}'s exact appearance from the reference image.
The following features MUST be visible: ${mustBeVisible.join(', ')}.
Art style must remain consistent: ${artStyle}.
Do not alter ${profile.name}'s facial structure, eye color, hair style, or distinguishing features.
`.trim();
}
```

#### 2.4 Full Prompt Assembler

```typescript
/**
 * Assembles all 4 layers into a complete prompt
 */
function assembleFullPrompt(
  characters: EnhancedCharacterProfile[],
  scene: { description: string; action: string; environment: string },
  artStyle: string,
  panelType: 'single' | 'multi' | 'cover'
): { contents: any[]; promptText: string } {
  const contents: any[] = [];
  let promptText = '';

  // LAYER 1: Reference Images
  characters.forEach((char, idx) => {
    // Add portrait
    if (char.portrait) {
      contents.push({ text: `REFERENCE ${idx + 1} [${char.name.toUpperCase()}]:` });
      contents.push({ inlineData: { mimeType: 'image/jpeg', data: char.portrait } });
    }
    // Add reference sheets
    char.referenceImages?.forEach((ref, refIdx) => {
      contents.push({ text: `${char.name.toUpperCase()} REF SHEET ${refIdx + 1}:` });
      contents.push({ inlineData: { mimeType: 'image/jpeg', data: ref } });
    });
  });

  // Style header
  promptText += `STYLE: ${artStyle}\n\n`;

  // LAYER 2: Identity Headers
  characters.forEach(char => {
    promptText += generateIdentityHeaderBlock(char) + '\n\n';
  });

  // LAYER 3: Reinforced Scene Description
  if (panelType === 'single' || panelType === 'cover') {
    const char = characters[0];
    promptText += `SCENE: ${generateReinforcedSceneDescription(char, scene.environment, scene.action)}\n`;
    promptText += `${scene.description}\n\n`;
  } else {
    // Multi-character: describe each with position
    promptText += `SCENE OVERVIEW: ${scene.description}\n\n`;
    characters.forEach((char, idx) => {
      const position = idx === 0 ? 'LEFT/FOREGROUND' : 'RIGHT/BACKGROUND';
      promptText += `${char.name} (Position: ${position}): ${scene.action}\n`;
    });
    promptText += '\n';
  }

  // LAYER 4: Consistency Instructions
  characters.forEach(char => {
    promptText += generateConsistencyInstruction(char, artStyle) + '\n';
  });

  contents.push({ text: promptText });

  return { contents, promptText };
}
```

---

### Phase 3: Profile Analysis Enhancement

#### 3.1 Enhanced generateCharacterProfile()

Update the existing function to extract identity header components:

```typescript
const generateCharacterProfile = async (
  persona: Persona,
  forceAnalysis = false
): Promise<EnhancedCharacterProfile> => {
  const contents: any[] = [];

  // ... existing image/file collection code ...

  // NEW: Request structured identity header
  contents.push({ text: `
Analyze this character and produce a detailed visual identity profile.

OUTPUT STRICT JSON (no markdown):
{
  "identityHeader": {
    "face": "Shape, distinctive features, cheekbones, chin, any scars/marks on face",
    "eyes": "Color, shape, spacing, typical expression",
    "hair": "Color, style, length, texture, any distinctive styling",
    "skin": "Tone, texture, any visible marks (scars, tattoos, moles)",
    "build": "Height impression, body type, posture, physical presence",
    "signature": ["item1 always worn/visible", "item2", "item3"]
  },
  "hardNegatives": ["feature to never include 1", "feature 2", "feature 3"],
  "contrastFeatures": ["what makes them visually unique"],
  "colorPalette": {
    "primary": "dominant color with hex",
    "secondary": "second color with hex",
    "skin": "skin tone with hex",
    "accent": "accent color with hex"
  }
}

For hardNegatives, consider:
- If they have a specific hairstyle, add "no [opposite style]"
- If they don't wear glasses, add "no glasses"
- If they have specific eye color, add "no [other colors] eyes"
- If clean-shaven, add "no beard", "no facial hair"
`});

  // ... AI call and parsing ...
};
```

---

### Phase 4: Reference Chaining System

#### 4.1 Track Last Good Panel

```typescript
// In App.tsx state
const [lastGoodPanels, setLastGoodPanels] = useState<{
  [characterId: string]: {
    pageIndex: number;
    imageUrl: string;
  }
}>({});

// Update when user approves a panel (doesn't reroll)
const markPanelAsGood = (pageIndex: number, characterIds: string[]) => {
  const panel = comicFaces.find(f => f.pageIndex === pageIndex);
  if (panel?.imageUrl) {
    characterIds.forEach(charId => {
      setLastGoodPanels(prev => ({
        ...prev,
        [charId]: { pageIndex, imageUrl: panel.imageUrl }
      }));
    });
  }
};
```

#### 4.2 Include in Generation

```typescript
// In generateImage(), add previous panel reference
const addPreviousPanelReference = (
  contents: any[],
  characterId: string
) => {
  const lastGood = lastGoodPanels[characterId];
  if (lastGood?.imageUrl) {
    contents.push({ text: `PREVIOUS PANEL REFERENCE (maintain consistency with this):` });
    const base64 = lastGood.imageUrl.includes('base64,')
      ? lastGood.imageUrl.split('base64,')[1]
      : lastGood.imageUrl;
    contents.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
  }
};
```

---

### Phase 5: Inpainting/Regeneration Modes

#### 5.1 Regeneration Mode Types

```typescript
type RegenerationMode =
  | 'full'              // Regenerate entire panel
  | 'characters_only'   // Keep scene, regenerate all characters
  | 'single_character'  // Keep scene + other chars, regenerate one
  | 'expression_only'   // Keep everything, change expression
  | 'outfit_only'       // Keep everything, change clothing
  | 'background_only';  // Keep characters, change background
```

#### 5.2 Constraint-Heavy Regeneration Prompts

```typescript
function generateRegenerationPrompt(
  mode: RegenerationMode,
  originalImage: string,
  targetCharacter: EnhancedCharacterProfile,
  preserveList: string[]
): string {
  const preserveBlock = preserveList.map(p => `- ${p}`).join('\n');

  switch (mode) {
    case 'characters_only':
      return `
INSTRUCTION: Regenerate ONLY the characters in this image to match their references exactly.

PRESERVE (do not modify):
${preserveBlock}
- Entire background and environment
- Lighting direction, color, and intensity
- Camera angle and composition
- All objects and props not held by characters

REGENERATE:
- All character appearances to match their reference images precisely
- Maintain same poses and positions

${generateIdentityHeaderBlock(targetCharacter)}

CRITICAL: The background must remain IDENTICAL. Only the characters should change.
`;

    case 'expression_only':
      return `
INSTRUCTION: Change ONLY ${targetCharacter.name}'s expression.

PRESERVE (do not modify):
- ${targetCharacter.name}'s face shape, eye color, hair, and all features
- Entire background, lighting, and composition
- All other characters (if any)
- ${targetCharacter.name}'s pose and clothing

CHANGE ONLY:
- Facial expression

The image should be nearly identical except for the expression change.
`;

    // ... other modes ...
  }
}
```

---

### Phase 6: Integration Points

#### 6.1 Files to Modify

| File | Changes |
|------|---------|
| `types.ts` | Add `IdentityHeader`, `EnhancedCharacterProfile`, prompt types |
| `App.tsx` | New prompt assembly functions, reference chaining, regeneration modes |
| `RerollModal.tsx` | Add regeneration mode selector |
| `Panel.tsx` | "Refresh Characters Only" button uses new system |
| `ProfilesDialog.tsx` | Display/edit identity headers and hard negatives |

#### 6.2 Migration Strategy

```typescript
// Convert existing CharacterProfile to EnhancedCharacterProfile
function migrateCharacterProfile(
  old: CharacterProfile
): EnhancedCharacterProfile {
  return {
    ...old,
    identityHeader: {
      face: old.faceDescription || '',
      eyes: extractEyeDescription(old.faceDescription) || '',
      hair: extractFromText(old.colorPalette, 'hair') || '',
      skin: extractFromText(old.colorPalette, 'skin') || '',
      build: old.bodyType || '',
      signature: old.distinguishingFeatures?.split(',').map(s => s.trim()) || [],
    },
    hardNegatives: generateDefaultNegatives(old),
    contrastFeatures: [],
    spatialLabel: `CHARACTER ${old.name?.charAt(0) || 'X'}`,
    colorPalette: parseColorPalette(old.colorPalette),
    canonicalImageIndex: 0,
  };
}
```

---

## Testing Checklist

### Consistency Tests
- [ ] Single character appears identical across 5 consecutive panels
- [ ] Two characters remain distinct in shared scenes
- [ ] Character features don't drift after 10+ generations
- [ ] Hard negatives prevent unwanted additions (glasses, freckles, etc.)

### Regeneration Tests
- [ ] "Refresh Characters Only" preserves background exactly
- [ ] Expression change doesn't alter other features
- [ ] Reference chaining uses most recent approved panel

### Edge Cases
- [ ] New character added mid-project gets proper identity header
- [ ] Draft import migrates old profiles correctly
- [ ] Multiple reference images all contribute to consistency

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Character recognition across panels | ~60% | >90% |
| Feature drift after 10 pages | High | Minimal |
| User reroll rate due to consistency | ~40% | <15% |
| "Refresh Characters Only" success | N/A | >80% |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Types | 30 min | None |
| Phase 2: Prompt Functions | 1 hr | Phase 1 |
| Phase 3: Profile Analysis | 45 min | Phases 1-2 |
| Phase 4: Reference Chaining | 30 min | Phase 2 |
| Phase 5: Regeneration Modes | 45 min | Phases 1-4 |
| Phase 6: Integration | 30 min | All phases |
| **Total** | **~4 hours** | |

---

*This enhancement pass should be executed after Batches 1 & 2 complete, building on whatever foundation they establish.*
