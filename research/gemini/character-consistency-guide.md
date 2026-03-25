# Gemini Character Consistency Research Guide

> **Research Date:** March 2026
> **Applicable Models:** Gemini 2.5 Flash Image (Nano Banana), Gemini 3 Pro Image (Nano Banana Pro)
> **Project Context:** Infinite Heroes Comic Creator

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Understanding Gemini's Image Generation](#understanding-geminis-image-generation)
3. [Core Concepts](#core-concepts)
4. [Single Character Consistency](#single-character-consistency)
5. [Multiple Character Consistency](#multiple-character-consistency)
6. [Scene Regeneration (Inpainting)](#scene-regeneration-inpainting)
7. [Practical Implementation for Comic Creator](#practical-implementation-for-comic-creator)
8. [Known Limitations & Workarounds](#known-limitations--workarounds)
9. [Optimal Prompt Templates](#optimal-prompt-templates)
10. [Analysis & Recommendations](#analysis--recommendations)
11. [Sources & References](#sources--references)

---

## Executive Summary

Character consistency in AI image generation remains one of the most challenging aspects of creating sequential art like comics. Gemini's image generation models (codenamed "Nano Banana") have made significant strides in this area but require careful prompt engineering to achieve reliable results.

### Key Findings

| Aspect | Capability Level | Notes |
|--------|-----------------|-------|
| Single character across scenes | Good (with techniques) | Requires identity headers and reference images |
| Multiple characters in one scene | Moderate | Needs explicit labeling and positioning |
| Scene regeneration with character swap | Good | Inpainting works well with constraint prompts |
| Facial consistency across many images | Limited | Drift occurs; no true "identity lock" |
| Art style consistency | Excellent | Very reliable with consistent style keywords |

### Critical Insight

**Gemini does NOT guarantee facial consistency** - each generation reinterprets faces from scratch. This is fundamentally different from tools with true identity/face-locking. Success depends entirely on prompt engineering discipline.

---

## Understanding Gemini's Image Generation

### Model Variants

| Model | Codename | Best For |
|-------|----------|----------|
| Gemini 2.5 Flash Image | Nano Banana | Fast generation, iterative editing, conversational refinement |
| Gemini 3 Pro Image | Nano Banana Pro | Higher quality, complex scenes, better text rendering |

### How It Works

1. **Text-to-Image**: Describe a scene in natural language
2. **Image-to-Image**: Provide reference images + text prompt
3. **Conversational Editing**: Multi-turn refinement in same context
4. **Multi-Image Composition**: Combine up to 14 reference images

### Key Differentiator

Gemini excels at **understanding context and natural language instructions**. Unlike other models that work best with keyword stacking, Gemini performs better with **narrative descriptions** that explain the scene as a whole.

---

## Core Concepts

### 1. Identity Header

A reusable block of text that defines a character's canonical appearance. This should be included at the start of EVERY prompt involving that character.

```
IDENTITY HEADER FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER: [Name]
MUST-MATCH VISUALS:
- Face: [shape], [cheekbones], [chin], [distinctive features]
- Eyes: [color], [shape], [spacing], [expression tendency]
- Hair: [color], [style], [length], [texture]
- Skin: [tone], [marks], [texture]
- Build: [body type], [height impression], [posture]
- Signature elements: [scars], [tattoos], [accessories]

HARD NEGATIVES (never include):
- [feature to avoid 1]
- [feature to avoid 2]
- [feature to avoid 3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Hard Negatives

Explicit statements about what the character should NEVER have. These prevent drift toward common AI tendencies.

**Examples:**
- "no bangs" (AI loves adding bangs)
- "no freckles" (common AI addition)
- "no beard/facial hair"
- "no eye color change"
- "no glasses"
- "no piercings"

### 3. Reference Image Anchoring

Using a previously generated or uploaded image as a visual anchor for consistency.

**Best Practices:**
- Use front-facing, well-lit reference images
- Avoid heavy filters or extreme angles
- Include reference with prompt: "Using this image as reference for [CHARACTER]'s appearance..."
- Can reference previous generations: "Maintain the exact appearance from the previous image"

### 4. Iterative Refinement

Making small, controlled changes one at a time rather than large jumps.

**Correct approach:**
1. Generate base image
2. "Keep everything the same, but adjust the lighting"
3. "Maintain the scene, but change expression to determined"
4. "Same image, but add motion blur to the background"

**Incorrect approach:**
- "Change the pose, lighting, background, and add new characters" (too many changes = drift)

---

## Single Character Consistency

### The Challenge

When generating multiple images of the same character across different scenes, the AI tends to:
- Drift facial features gradually
- Change hair style subtly
- Alter body proportions
- Shift skin tone
- Add or remove distinguishing features

### Solution: The 4-Layer Consistency System

#### Layer 1: Reference Image
Provide a canonical reference image with every generation request.

```
[Attach reference image]
"Using this reference image of MAYA as the definitive appearance guide..."
```

#### Layer 2: Identity Header
Include the full identity header in every prompt.

#### Layer 3: Scene-Specific Reinforcement
Repeat key identifying features within the scene description.

```
"MAYA, recognizable by her curly auburn hair and the small scar above her left eyebrow,
stands at the edge of the rooftop..."
```

#### Layer 4: Consistency Instruction
End with an explicit consistency statement.

```
"Maintain MAYA's exact facial structure, hair color, and distinguishing features
from the reference. Do not alter her appearance."
```

### Complete Single Character Prompt Template

```
[REFERENCE IMAGE ATTACHED]

STYLE: Graphic novel illustration with bold ink lines and cel-shaded coloring

CHARACTER IDENTITY - MAYA CHEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MUST-MATCH VISUALS:
- Face: Oval shape, high cheekbones, small rounded chin, slight dimple on left cheek
- Eyes: Emerald green, almond-shaped, slightly wide-set, determined expression
- Hair: Curly auburn, shoulder-length, usually loose with volume
- Skin: Light olive tone, small scar above left eyebrow (always visible)
- Build: Athletic, medium height, confident posture
- Signature: Silver pendant necklace (always worn)

HARD NEGATIVES: No bangs, no straight hair, no blue/brown eyes, no freckles,
no glasses, no tattoos, scar must always be visible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCENE: MAYA CHEN, with her distinctive curly auburn hair catching the wind and
her scar visible above her left eyebrow, stands on a rain-slicked rooftop at night.
She is wearing her leather jacket over a dark green shirt. City lights reflect in
puddles around her feet.

ACTION: Looking over her shoulder with a knowing smirk
CAMERA: Medium shot, slight low angle to convey confidence
LIGHTING: Dramatic noir lighting, neon signs casting colored reflections
MOOD: Mysterious, anticipatory

CONSISTENCY REQUIREMENT: Maintain MAYA's exact appearance from the reference image.
Her facial structure, eye color, hair style, and scar placement must match precisely.
```

### Use Cases for Single Character

| Scenario | Key Considerations |
|----------|-------------------|
| Cover art | Highest detail reference, explicit feature reinforcement |
| Action sequences | Maintain features despite dynamic poses |
| Emotional scenes | Lock features while allowing expression changes |
| Costume changes | Explicitly state "same face/hair, different outfit" |
| Time progression | Note what changes vs. what stays constant |

---

## Multiple Character Consistency

### The Challenge

Multiple characters in one scene compounds the consistency problem:
- Characters may "blend" features
- Positioning gets confused
- One character may dominate the generation
- Interaction dynamics can override individual features

### Solution: Labeled Character Blocks

Structure prompts with distinct, labeled sections for each character.

### Multi-Character Prompt Template

```
STYLE: [Art style] with [specific characteristics]

SCENE OVERVIEW: [Brief description of the overall scene and interaction]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER 1 - [NAME] (Position: [LEFT/RIGHT/CENTER/FOREGROUND/BACKGROUND])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Full identity header for Character 1]
CURRENT OUTFIT: [Description]
POSE/ACTION: [What they're doing]
EXPRESSION: [Emotional state]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER 2 - [NAME] (Position: [LEFT/RIGHT/CENTER/FOREGROUND/BACKGROUND])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Full identity header for Character 2]
CURRENT OUTFIT: [Description]
POSE/ACTION: [What they're doing]
EXPRESSION: [Emotional state]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERACTION: [How the characters relate in this scene]
ENVIRONMENT: [Background and setting details]
LIGHTING: [Light source and mood]
CAMERA: [Shot type, angle, framing]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONSISTENCY REQUIREMENT: Each character must maintain their distinct appearance.
[NAME 1] and [NAME 2] should be clearly distinguishable with their canonical features.
```

### Example: Two Characters

```
[REFERENCE IMAGE 1: MAYA attached]
[REFERENCE IMAGE 2: DRAKE attached]

STYLE: Graphic novel with heavy shadows and dynamic composition

SCENE OVERVIEW: A tense confrontation in an abandoned warehouse

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER 1 - MAYA CHEN (Position: LEFT, slightly foreground)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Face: Oval, high cheekbones, small chin, left cheek dimple
- Eyes: Emerald green, almond-shaped, wide-set
- Hair: Curly auburn, shoulder-length, loose
- Skin: Light olive, scar above left eyebrow
- Build: Athletic, medium height
CURRENT OUTFIT: Black tactical suit, utility belt
POSE: Defensive stance, fists raised
EXPRESSION: Determined, focused

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER 2 - DRAKE MORRISON (Position: RIGHT, slightly background)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Face: Square jaw, strong brow, weathered features
- Eyes: Steel gray, deep-set, intense
- Hair: Bald, clean-shaven head
- Skin: Dark brown, scar across right cheek
- Build: Muscular, tall, imposing
CURRENT OUTFIT: Dark hoodie over body armor
POSE: Arms crossed, standing tall
EXPRESSION: Cold, calculating

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERACTION: Facing each other from 10 feet apart, tension visible
ENVIRONMENT: Abandoned warehouse, broken windows, dust in air
LIGHTING: Single shaft of moonlight between them, dramatic shadows
CAMERA: Wide shot, eye level, both characters fully visible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONSISTENCY: MAYA's auburn curly hair and green eyes must contrast clearly with
DRAKE's bald head and gray eyes. Both characters' scars must be visible.
```

### Multi-Reference Image Technique

Gemini can accept up to **14 reference images** in a single prompt. Use this for complex scenes:

```
[Attach: maya_reference.png, drake_reference.png, warehouse_background.png]

"Using reference image 1 for MAYA's appearance, reference image 2 for DRAKE's
appearance, and reference image 3 for the environment style, create a scene where..."
```

### Tips for Multiple Characters

1. **Contrast is key**: Make characters visually distinct (hair color, build, clothing)
2. **Spatial clarity**: Always specify positions (left, right, foreground, background)
3. **Size relationships**: Note relative heights/scales
4. **Avoid feature bleeding**: Don't describe similar features for different characters
5. **Name reinforcement**: Use character names throughout, not "he/she/they"

---

## Scene Regeneration (Inpainting)

### The Challenge

You want to:
- Keep the exact same background/environment
- Keep the same composition and lighting
- Change ONLY the character (or specific elements)

### Solution: Constraint-Heavy Inpainting Prompts

### Technique 1: Character Swap (Replace One Character with Another)

```
[ORIGINAL IMAGE ATTACHED]

INSTRUCTION: Replace ONLY the character in this image.

PRESERVE (do not modify):
- Entire background and environment
- Lighting direction, color, and intensity
- Camera angle and composition
- Art style and color palette
- All objects and props not held by the character
- Shadow positions and ambient effects

REPLACE:
- Current character → [NEW CHARACTER NAME]
- [Full identity header for new character]
- Match the original character's general pose and position
- New character should occupy the same space in frame

CRITICAL: Change only the character. Everything else must remain pixel-perfect identical.
```

### Technique 2: Update Character Appearance (Same Character, Different Look)

```
[ORIGINAL IMAGE ATTACHED]

INSTRUCTION: Modify ONLY [CHARACTER NAME]'s [specific element to change].

PRESERVE (do not modify):
- [CHARACTER NAME]'s face, hair, and all features not being changed
- Entire background and environment
- Lighting and shadows
- Composition and framing
- Art style

CHANGE ONLY:
- [Specific element]: From [current state] → To [new state]

Example: Change MAYA's outfit from casual clothes (jeans and t-shirt) to her
superhero costume (red and gold bodysuit with flowing cape). Keep her exact
face, hair, pose, expression, and the entire scene unchanged.
```

### Technique 3: Add/Remove Elements While Keeping Character

```
[ORIGINAL IMAGE ATTACHED]

INSTRUCTION: [Add/Remove] [element] [to/from] the scene.

PRESERVE (do not modify):
- [CHARACTER NAME]'s complete appearance
- Character's pose and position
- Core composition

MODIFY:
- [Specific change to environment/props]

Fill any gaps naturally with contextually appropriate content matching the
existing style and lighting.
```

### Inpainting Prompt Patterns

| Goal | Key Phrase |
|------|------------|
| Swap character | "Replace ONLY the character with [new character]. Keep scene identical." |
| Change outfit | "Change only [character]'s clothing to [new outfit]. Preserve face and scene." |
| Change expression | "Keep everything the same, but change [character]'s expression to [emotion]." |
| Add prop | "Add [object] to [character]'s hand. Do not modify anything else." |
| Remove element | "Remove [element] from the image. Fill naturally. Keep character unchanged." |
| Change background | "Replace only the background with [new setting]. Keep character exactly as shown." |

### Example: Complete Character Swap

```
[ORIGINAL PANEL IMAGE ATTACHED - shows MAYA in action pose in city setting]

INSTRUCTION: Replace MAYA with DRAKE in this exact scene.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRESERVE EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- City background with all buildings, signs, and details
- Night lighting with neon reflections
- Rain effects and wet street surfaces
- Camera angle (low angle, dynamic)
- Art style (graphic novel, bold lines)
- All environmental elements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPLACE WITH - DRAKE MORRISON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Face: Square jaw, strong brow, weathered features
- Eyes: Steel gray, deep-set
- Hair: Bald
- Skin: Dark brown, scar across right cheek
- Build: Muscular, tall
- Outfit: Dark tactical gear appropriate for the action scene
- Pose: Match the dynamic action pose from original (adapt for DRAKE's larger build)

DRAKE should occupy the same position in frame as MAYA did, with his appearance
naturally integrated into the existing lighting and environment.

DO NOT modify any part of the background or environmental effects.
```

---

## Practical Implementation for Comic Creator

### Integrating with Infinite Heroes Architecture

Based on the project's current structure in `App.tsx`, here's how to implement these techniques:

### 1. Enhanced CharacterProfile Structure

```typescript
// Extend the existing CharacterProfile type in types.ts
interface EnhancedCharacterProfile {
  // Existing fields
  name: string;
  role: 'hero' | 'costar' | 'supporting';
  portrait: string; // base64 reference image

  // NEW: Consistency fields
  identityHeader: {
    faceDescription: string;
    eyeDescription: string;
    hairDescription: string;
    skinDescription: string;
    buildDescription: string;
    signatureElements: string[];
    hardNegatives: string[];
  };

  // NEW: Visual anchors
  canonicalPose: string; // "front-facing neutral" for consistency
  colorPalette: string[]; // dominant colors for the character

  // NEW: For multi-character scenes
  spatialLabel: string; // "Character A", "Character B" for labeling
  contrastFeatures: string[]; // what makes them visually distinct
}
```

### 2. Prompt Generation Functions

```typescript
// Generate identity header from profile
function generateIdentityHeader(profile: EnhancedCharacterProfile): string {
  const { identityHeader, name } = profile;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER IDENTITY - ${name.toUpperCase()}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MUST-MATCH VISUALS:
- Face: ${identityHeader.faceDescription}
- Eyes: ${identityHeader.eyeDescription}
- Hair: ${identityHeader.hairDescription}
- Skin: ${identityHeader.skinDescription}
- Build: ${identityHeader.buildDescription}
- Signature elements: ${identityHeader.signatureElements.join(', ')}

HARD NEGATIVES (never include): ${identityHeader.hardNegatives.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

// Generate single character panel prompt
function generateSingleCharacterPrompt(
  profile: EnhancedCharacterProfile,
  scene: SceneDescription,
  artStyle: string
): string {
  return `
STYLE: ${artStyle}

${generateIdentityHeader(profile)}

SCENE: ${profile.name}, with ${profile.identityHeader.hairDescription} and
${profile.identityHeader.signatureElements[0]}, ${scene.action} in ${scene.environment}.

ACTION: ${scene.characterAction}
CAMERA: ${scene.cameraAngle}
LIGHTING: ${scene.lighting}
MOOD: ${scene.mood}

CONSISTENCY REQUIREMENT: Maintain ${profile.name}'s exact appearance from the
reference image. All identifying features must match precisely.
`.trim();
}

// Generate multi-character panel prompt
function generateMultiCharacterPrompt(
  characters: Array<{profile: EnhancedCharacterProfile; position: string; action: string}>,
  scene: SceneDescription,
  artStyle: string
): string {
  const characterBlocks = characters.map((char, index) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER ${index + 1} - ${char.profile.name.toUpperCase()} (Position: ${char.position})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generateIdentityHeader(char.profile)}
POSE/ACTION: ${char.action}
`).join('\n');

  return `
STYLE: ${artStyle}

SCENE OVERVIEW: ${scene.description}

${characterBlocks}

INTERACTION: ${scene.interaction}
ENVIRONMENT: ${scene.environment}
LIGHTING: ${scene.lighting}
CAMERA: ${scene.cameraAngle}

CONSISTENCY: Each character must maintain their distinct canonical appearance.
`.trim();
}

// Generate inpainting/regeneration prompt
function generateRegenerationPrompt(
  originalImage: string, // base64
  preserveElements: string[],
  changeDescription: string,
  targetCharacter?: EnhancedCharacterProfile
): string {
  const preserveList = preserveElements.map(e => `- ${e}`).join('\n');

  let characterSection = '';
  if (targetCharacter) {
    characterSection = `
NEW CHARACTER TO INSERT:
${generateIdentityHeader(targetCharacter)}
`;
  }

  return `
INSTRUCTION: ${changeDescription}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRESERVE EXACTLY (do not modify):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${preserveList}

${characterSection}

CRITICAL: Only modify what is explicitly described above. All other elements
must remain identical to the original image.
`.trim();
}
```

### 3. RerollModal Enhancement

Update the `RerollModal` component to support character-specific regeneration:

```typescript
// Add regeneration mode options
type RegenerationMode =
  | 'full'           // Regenerate entire panel
  | 'character_only' // Keep scene, regenerate character
  | 'scene_only'     // Keep character, regenerate background
  | 'expression'     // Keep everything, change expression
  | 'outfit'         // Keep everything, change clothing
  | 'swap_character' // Replace character with different one

interface RerollOptions {
  mode: RegenerationMode;
  targetCharacter?: string;
  newCharacter?: string;
  preserveElements?: string[];
  changeDescription?: string;
}
```

---

## Known Limitations & Workarounds

### Limitation 1: Facial Drift Over Many Generations

**Problem**: After 5-10+ generations, character faces gradually change even with good prompts.

**Workarounds**:
1. **Reset anchor**: Every 3-5 panels, generate a new "canonical" reference image with extra detail
2. **Reference chain**: Always reference the most recent "good" generation, not just the original
3. **Explicit comparison**: "Match the face EXACTLY as shown in the reference, particularly [specific features]"

### Limitation 2: Complex Poses Distort Features

**Problem**: Dynamic action poses can cause facial features to warp.

**Workarounds**:
1. **Two-pass generation**: Generate pose first, then refine face in second pass
2. **Face focus**: Add "maintain facial accuracy despite the dynamic pose"
3. **Avoid extreme foreshortening**: Prefer side/3-4 angles over extreme perspectives for important character shots

### Limitation 3: Multiple Characters Blend Together

**Problem**: In group scenes, characters start sharing features.

**Workarounds**:
1. **Maximum contrast**: Make characters as visually distinct as possible
2. **Generate separately**: Create each character separately, then composite
3. **Explicit separation**: "These are TWO DISTINCT characters who should NOT share any features"

### Limitation 4: Style Inconsistency Across Panels

**Problem**: Art style varies between generations.

**Workarounds**:
1. **Style anchor phrase**: Use identical style description in every prompt
2. **Reference previous panel**: "Match the exact art style of the provided reference panel"
3. **Specific style markers**: Instead of "comic style", use "bold black ink outlines, cel-shaded coloring, halftone dot shading for shadows"

### Limitation 5: Text and Small Details

**Problem**: Text rendering and fine details (jewelry, insignias) are unreliable.

**Workarounds**:
1. **Add text in post**: Use image editing to add speech bubbles/captions
2. **Simplify details**: Use simpler versions of complex accessories
3. **Multiple attempts**: For important details, generate several versions and pick best

---

## Optimal Prompt Templates

### Template 1: Comic Panel - Single Character

```
[REFERENCE IMAGE ATTACHED]

PANEL TYPE: [Action/Dialogue/Establishing/Close-up]
STYLE: [Specific art style with detailed descriptors]

CHARACTER - [NAME]:
[Full identity header]
CURRENT OUTFIT: [Description]
POSE: [Body position and gesture]
EXPRESSION: [Facial expression and emotion]

SCENE:
[NAME], recognizable by [2-3 key identifying features], [action verb] in [environment].
[Additional scene details and atmosphere]

TECHNICAL:
- Camera: [Shot type] from [angle]
- Lighting: [Source and quality]
- Mood: [Emotional tone]
- Panel composition: [Where character sits in frame]

CONSISTENCY: Maintain [NAME]'s canonical appearance. [Specific features to emphasize].
```

### Template 2: Comic Panel - Multiple Characters

```
[REFERENCE IMAGES ATTACHED: Character1.png, Character2.png]

PANEL TYPE: [Interaction/Battle/Dialogue]
STYLE: [Art style]

SCENE: [Brief overall description]

[CHARACTER 1 BLOCK - Full details with position]

[CHARACTER 2 BLOCK - Full details with position]

INTERACTION: [How characters relate spatially and emotionally]

ENVIRONMENT: [Setting details]
LIGHTING: [Unified lighting for scene]
CAMERA: [Shot that captures both characters appropriately]

CONTRAST: [CHARACTER 1] has [distinct features] while [CHARACTER 2] has [different features].
Keep them clearly distinguishable.
```

### Template 3: Regenerate with Character Swap

```
[ORIGINAL PANEL IMAGE ATTACHED]

REGENERATION MODE: Character Swap

REMOVE: [Original character name and brief description]
INSERT: [New character name]
[Full identity header for new character]

PRESERVE UNCHANGED:
- Complete background and environment
- All lighting, shadows, and atmospheric effects
- Camera angle and composition
- Art style (match original exactly)
- Any props or objects in scene (except those held by character)

The new character should:
- Occupy the same screen position as the original
- Adopt a similar (not identical) pose appropriate to their build
- Integrate naturally with existing lighting

CRITICAL: Background must be pixel-perfect identical. Only the character changes.
```

### Template 4: Expression/Outfit Change Only

```
[ORIGINAL PANEL IMAGE ATTACHED]

MODIFICATION: [Expression change / Outfit change]

CHARACTER: [Name]
PRESERVE: [Name]'s face, hair, build, and all identifying features
CHANGE ONLY: [Specific element - expression/clothing]

FROM: [Current state]
TO: [Desired state]

Everything else in the image - background, lighting, composition, other characters,
props - must remain completely unchanged. Only [specific element] should differ.
```

---

## Analysis & Recommendations

### What Works Best

1. **Detailed identity headers**: The single most impactful technique
2. **Reference images**: Essential for any serious consistency work
3. **Iterative refinement**: Small changes beat big jumps
4. **Explicit constraints**: Tell the AI what NOT to change
5. **Consistent style phrases**: Same art style description every time

### What Doesn't Work

1. **Vague descriptions**: "A woman with brown hair" is too generic
2. **Keyword stacking**: Gemini prefers natural language
3. **Too many changes at once**: Causes drift
4. **Assuming memory**: Each generation is somewhat independent
5. **Relying on implicit understanding**: Be explicit about everything

### Recommended Workflow for Infinite Heroes

1. **Character Creation Phase**:
   - Generate detailed identity header from uploaded portrait
   - Create 2-3 canonical reference poses
   - Establish hard negatives based on common AI tendencies
   - Store all consistency data in CharacterProfile

2. **Panel Generation Phase**:
   - Always include reference image + identity header
   - Use structured templates for every panel
   - Generate in batches of 3-5 before checking consistency
   - Flag panels with drift for regeneration

3. **Regeneration Phase**:
   - Use constraint-heavy inpainting prompts
   - Regenerate specific elements, not whole panels
   - Chain reference to most recent "good" panel

4. **Quality Control**:
   - Implement automated drift detection (compare to reference)
   - Allow user to flag inconsistent panels
   - Provide easy regeneration with "keep scene" option

### Priority Implementation Order

1. **High Priority**: Enhanced CharacterProfile with identity headers
2. **High Priority**: Single character prompt templates
3. **Medium Priority**: Multi-character prompt templates
4. **Medium Priority**: Inpainting regeneration modes
5. **Lower Priority**: Automated drift detection

---

## Sources & References

### Official Google Documentation
- [Google Developers Blog - How to prompt Gemini 2.5 Flash Image Generation](https://developers.googleblog.com/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/) - Core prompting best practices
- [Google DeepMind - Nano Banana Prompt Guide](https://deepmind.google/models/gemini-image/prompt-guide/) - Official prompt engineering guide
- [Google Blog - Nano Banana Pro Prompting Tips](https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/) - 7 tips for Nano Banana Pro
- [Google Codelabs - Generating Consistent Imagery](https://codelabs.developers.google.com/gemini-consistent-imagery-notebook) - Hands-on notebook tutorial

### Community & Technical Resources
- [Towards Data Science - Generating Consistent Imagery with Gemini](https://towardsdatascience.com/generating-consistent-imagery-with-gemini/) - Technical deep-dive
- [AIFacefy - Consistent Characters with Nano Banana](https://aifacefy.com/blog/detail/How-to-Generate-Consistent-Characters-with-Nano-Banana-Gemini-2-5-Flash-f04e03416688/) - Step-by-step character consistency
- [Sider AI - Gemini Identity Consistency](https://sider.ai/blog/ai-tools/how-to-write-gemini-prompts-that-keep-subject-identity-consistent-across-edits) - Identity header techniques
- [Media.io - Fix Gemini Face Changes](https://www.media.io/ai-image-generator/fix-gemini-face-change.html) - Preventing facial drift

### Additional Resources
- [Scenario - Craft Prompts for Gemini 2.5](https://www.scenario.com/blog/craft-prompts-gemini-seedream) - Prompt engineering patterns
- [The Daring Creatives - AI Image Consistency](https://www.thedaringcreatives.com/ai-image-consistency/) - Cross-platform consistency techniques
- [Google Discuss - Gemini Image for Character Consistency](https://discuss.google.dev/t/how-to-use-gemini-image-for-veo-character-consistency-doogler-edition/259879) - Community discussion
- [Gemini Apps Community - Consistent Characters Thread](https://support.google.com/gemini/thread/349224285/consistent-characters) - User experiences and tips

---

## Appendix: Quick Reference Cards

### Identity Header Checklist
- [ ] Face shape and distinctive features
- [ ] Eye color, shape, and spacing
- [ ] Hair color, style, length, texture
- [ ] Skin tone and marks (scars, moles)
- [ ] Body build and posture
- [ ] Signature accessories
- [ ] Hard negatives (what to avoid)

### Consistency Prompt Checklist
- [ ] Reference image attached
- [ ] Identity header included
- [ ] Character name used (not pronouns)
- [ ] Key features mentioned in scene description
- [ ] Explicit consistency instruction at end
- [ ] Art style consistently described

### Inpainting Checklist
- [ ] Original image attached
- [ ] PRESERVE list is comprehensive
- [ ] CHANGE description is specific
- [ ] "Keep everything else unchanged" stated
- [ ] New character details (if swapping) complete

---

*Document Version: 1.0*
*Last Updated: March 2026*
*For: Infinite Heroes Comic Creator Project*
