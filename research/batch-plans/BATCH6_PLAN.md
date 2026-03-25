# Batch 6 Implementation Plan: Multi-Panel Layouts & Advanced Comic Features

> **Created:** March 2026
> **Status:** 📋 Planned (Future)
> **Source:** Comic Fundamentals Research

## Overview

This batch implements the most ambitious comic fundamentals features: multi-panel page generation, dynamic layouts, and advanced lettering.

---

## New Features

### L. Multi-Panel Page Generation
- Generate pages with multiple panels (2x2, 2x3, 3x3, asymmetric)
- AI determines panel content distribution
- Maintain character consistency across panels

### M. Dynamic Panel Composition
- "Small-Small-Small-LARGE" tension patterns
- Knocked-out walls for emphasis
- Broken/borderless panels for special moments

### N. Advanced Lettering System
- Balloon shape per dialogue line
- Caption color coding per character
- Sound effects (SFX) placement

### O. Sequential Context System
- Reference chaining (use last good panel as reference)
- Transition-aware generation
- Gutter timing control

---

## Feature L: Multi-Panel Pages

### The Challenge

Currently, the app generates one full-page image per "page". Real comics use multi-panel pages with 4-9 panels per page. This requires:

1. **Panel Planning**: AI decides what happens in each panel
2. **Panel Generation**: Generate each panel image
3. **Page Composition**: Assemble panels into single page image
4. **Text Placement**: Position balloons/captions

### Approach Options

#### Option 1: All-in-One Image Generation

Ask Gemini to generate the entire multi-panel page as one image.

```typescript
const prompt = `
Generate a 6-PANEL comic page (2x3 grid layout).

PANEL 1 (top-left): Close-up of Hero's face, determined expression
PANEL 2 (top-center): Wide shot of the city skyline
PANEL 3 (top-right): Co-Star pointing at something
PANEL 4 (bottom-left): Hero and Co-Star running
PANEL 5 (bottom-center): Villain watching from shadows
PANEL 6 (bottom-right): Hero's fist about to punch

MAINTAIN CHARACTER CONSISTENCY across all panels.
Include speech bubbles and captions as described.
`;
```

**Pros**: Single generation, natural composition
**Cons**: Harder to reroll individual panels, consistency issues

#### Option 2: Panel-by-Panel + Compositing

Generate each panel separately, then composite into page.

```typescript
// Generate panels
const panels = await Promise.all([
  generatePanel({ content: '...', size: 'small', position: 'top-left' }),
  generatePanel({ content: '...', size: 'small', position: 'top-center' }),
  // ...
]);

// Composite into page
const pageImage = await compositeToPage(panels, 'grid-2x3');
```

**Pros**: Better consistency, individual rerolls, more control
**Cons**: More API calls, compositing complexity

#### Option 3: Hybrid (Recommended)

Generate 2-3 panel groups, then composite.

```typescript
// Generate as groups
const topRow = await generatePanelGroup(['panel1', 'panel2', 'panel3']);
const bottomRow = await generatePanelGroup(['panel4', 'panel5', 'panel6']);

// Composite
const page = verticalComposite([topRow, bottomRow]);
```

**Pros**: Balanced consistency, reasonable API calls
**Cons**: Medium complexity

### Multi-Panel Beat Format

```typescript
interface MultiPanelBeat {
  pageIndex: number;
  layout: PanelLayout;
  panels: SinglePanelBeat[];
}

interface SinglePanelBeat {
  panelIndex: number;          // 1-9
  position: string;            // 'top-left', 'center', etc.
  size: 'small' | 'medium' | 'large';
  scene: string;
  caption?: string;
  dialogue?: DialogueLine[];
  focusCharacter: string;
  shotType: ShotType;
}

interface DialogueLine {
  speaker: string;
  text: string;
  balloonShape: BalloonShape;
  position: 'top' | 'bottom' | 'left' | 'right';
}
```

### Multi-Panel Prompt Template

```typescript
const generateMultiPanelPrompt = (beat: MultiPanelBeat) => `
GENERATE A ${beat.panels.length}-PANEL COMIC PAGE

LAYOUT: ${beat.layout}

${beat.panels.map((p, i) => `
PANEL ${i + 1} (${p.position}, ${p.size}):
- Shot: ${p.shotType}
- Scene: ${p.scene}
- Focus: ${p.focusCharacter}
${p.caption ? `- Caption: "${p.caption}"` : ''}
${p.dialogue?.map(d => `- ${d.speaker} (${d.balloonShape}): "${d.text}"`).join('\n')}
`).join('\n')}

CRITICAL:
- Maintain CHARACTER CONSISTENCY across all panels
- Use consistent lighting and color palette
- Leave appropriate space for text elements
- Panel borders: 3px black, 6px gutters between panels
`;
```

---

## Feature M: Dynamic Panel Composition

### The "Small-Small-Small-LARGE" Pattern

```typescript
const createTensionPattern = (
  buildupBeats: Beat[],  // 3 quick moments
  payoffBeat: Beat       // Dramatic reveal
): PageLayout => {
  return {
    layout: 'asymmetric',
    panels: [
      { beat: buildupBeats[0], size: 'small', position: 'top-left' },
      { beat: buildupBeats[1], size: 'small', position: 'top-center' },
      { beat: buildupBeats[2], size: 'small', position: 'top-right' },
      { beat: payoffBeat, size: 'large', position: 'bottom-full' },
    ]
  };
};
```

### Knocked-Out Walls

When action spills across panel borders:

```typescript
const knockOutWall = (
  panels: Panel[],
  wallsToRemove: [number, number][]  // pairs of adjacent panels
): Panel[] => {
  // Merge specified adjacent panels
  // Return combined panels with shared scene
};
```

### Broken/Borderless Panels

```typescript
interface PanelStyle {
  borderStyle: 'solid' | 'dashed' | 'none' | 'broken';
  overflow: boolean;  // Image extends beyond panel bounds
  vignette?: boolean; // Soft edges for memories
}

// Apply to special moments
if (beat.emotionalBeat === 'reveal' || beat.isFlashback) {
  panelStyle.borderStyle = 'none';
  panelStyle.vignette = true;
}
```

---

## Feature N: Advanced Lettering

### Balloon Shape System

```typescript
const BALLOON_STYLES: Record<BalloonShape, BalloonStyle> = {
  oval: {
    border: '2px solid black',
    borderRadius: '50%',
    tail: 'triangle',
    background: 'white',
  },
  burst: {
    border: '3px solid black',
    borderRadius: '0',
    shape: 'star-polygon',
    tail: 'lightning',
    background: 'white',
  },
  wavy: {
    border: '2px wavy black',
    borderRadius: '50%',
    tail: 'wavy',
    background: 'white',
  },
  dashed: {
    border: '2px dashed black',
    borderRadius: '50%',
    tail: 'dotted-triangle',
    background: 'white',
  },
  jagged: {
    border: '2px solid black',
    borderRadius: '0',
    shape: 'zigzag',
    tail: 'lightning',
    background: 'white',
  },
  rectangle: {
    border: '2px solid black',
    borderRadius: '4px',
    tail: 'angular',
    background: '#e0e0e0',
    font: 'monospace',
  },
  inverted: {
    border: 'none',
    borderRadius: '50%',
    tail: 'triangle',
    background: 'black',
    textColor: 'white',
  },
};
```

### Caption Color Per Character

```typescript
interface CharacterCaptionTheme {
  characterId: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  icon?: string;  // Small symbol to identify narrator
}

const DEFAULT_THEMES: CharacterCaptionTheme[] = [
  { characterId: 'hero', backgroundColor: '#FFE4B5', textColor: '#000', borderColor: '#D4A574' },
  { characterId: 'friend', backgroundColor: '#B5E4FF', textColor: '#000', borderColor: '#74A5D4' },
  // Assign colors dynamically to additional characters
];

const assignCaptionTheme = (characterId: string): CharacterCaptionTheme => {
  const existing = captionThemes.find(t => t.characterId === characterId);
  if (existing) return existing;

  // Auto-assign from palette
  const palette = ['#FFD4E4', '#D4FFD4', '#E4D4FF', '#FFE4D4'];
  const nextColor = palette[captionThemes.length % palette.length];

  return {
    characterId,
    backgroundColor: nextColor,
    textColor: '#000',
    borderColor: darken(nextColor, 20),
  };
};
```

### Sound Effects (SFX)

```typescript
interface SoundEffect {
  text: string;          // "BOOM!", "CRASH!", "WHOOSH!"
  style: 'impact' | 'motion' | 'ambient';
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  rotation?: number;     // Degrees
  color?: string;        // Often matches action
}

const SFX_STYLES: Record<string, SFXStyle> = {
  impact: { font: 'Impact', outline: '4px black', colors: ['#FF0000', '#FFFF00', '#FF6600'] },
  motion: { font: 'Comic Sans', outline: '2px black', colors: ['#00BFFF', '#87CEEB'] },
  ambient: { font: 'cursive', outline: 'none', colors: ['#808080', '#A9A9A9'] },
};
```

---

## Feature O: Sequential Context System

### Reference Chaining

Use the most recent "good" panel as additional reference to prevent drift.

```typescript
interface ReferenceChain {
  characterId: string;
  lastGoodPanelIndex: number;
  lastGoodImage: string;  // Base64
  confidenceScore: number; // User rating or AI assessment
}

const getReferenceForCharacter = (
  characterId: string,
  currentPageIndex: number
): ReferenceImage[] => {
  const chain = referenceChains.find(r => r.characterId === characterId);

  return [
    // Original portrait (always)
    getOriginalPortrait(characterId),
    // Last good panel (if recent and good)
    chain && chain.confidenceScore > 0.7 && currentPageIndex - chain.lastGoodPanelIndex < 5
      ? { image: chain.lastGoodImage, label: 'RECENT GOOD PANEL' }
      : null,
  ].filter(Boolean);
};

// After generation, optionally update chain
const updateReferenceChain = (
  characterId: string,
  pageIndex: number,
  image: string,
  userRating: number
) => {
  if (userRating >= 4) {  // 4-5 stars = "good"
    setReferenceChains(prev => prev.map(c =>
      c.characterId === characterId
        ? { ...c, lastGoodPanelIndex: pageIndex, lastGoodImage: image, confidenceScore: userRating / 5 }
        : c
    ));
  }
};
```

### Transition-Aware Generation

```typescript
const getTransitionContext = (
  prevBeat: Beat,
  currentBeat: Beat,
  transitionType: TransitionType
): string => {
  const contexts: Record<TransitionType, string> = {
    'moment-to-moment': `SLOW MOTION CONTINUATION: This panel shows the NEXT MOMENT after "${prevBeat.scene}". Very small time gap. Same camera angle, minimal change.`,
    'action-to-action': `ACTION CONTINUATION: This follows the action from "${prevBeat.scene}". Show the next beat in the sequence.`,
    'subject-to-subject': `SAME SCENE, DIFFERENT SUBJECT: We're still in the same location/time as "${prevBeat.scene}", but now focusing on a different character/element.`,
    'scene-to-scene': `NEW SCENE: Time and/or location has changed from "${prevBeat.scene}". This is a fresh establishing moment.`,
    'aspect-to-aspect': `ATMOSPHERIC CUT: Same location as "${prevBeat.scene}", but showing a different aspect of the environment to set mood.`,
    'non-sequitur': `SURREAL CUT: No logical connection to previous panel. Dream-like or abstract.`,
  };

  return contexts[transitionType];
};
```

### Gutter Timing in Prompts

```typescript
const gutterTimingContext = (transitionType: TransitionType): string => {
  const timing: Record<TransitionType, string> = {
    'moment-to-moment': 'milliseconds',
    'action-to-action': 'seconds',
    'subject-to-subject': 'simultaneous (same moment)',
    'scene-to-scene': 'hours/days/unspecified',
    'aspect-to-aspect': 'timeless (atmospheric)',
    'non-sequitur': 'undefined (surreal)',
  };

  return `TIME SINCE LAST PANEL: ${timing[transitionType]}`;
};
```

---

## Implementation Phases

### Phase 1: Multi-Panel Infrastructure (2 hr)
- Add MultiPanelBeat type
- Create panel position/size system
- Implement compositing logic

### Phase 2: Multi-Panel Generation (2 hr)
- Create multi-panel prompt templates
- Test all-in-one vs hybrid approaches
- Implement panel group generation

### Phase 3: Dynamic Composition (1 hr)
- Tension pattern helpers
- Knocked-out wall logic
- Borderless panel support

### Phase 4: Lettering System (1.5 hr)
- Balloon shape rendering (CSS or canvas)
- Caption color assignment
- SFX placement

### Phase 5: Reference Chaining (1 hr)
- Reference chain data structure
- User rating system for panels
- Chain update logic

### Phase 6: Transition Context (30 min)
- Inject transition context into prompts
- Gutter timing hints

### Phase 7: UI Updates (1 hr)
- Panel rating stars
- Multi-panel preview
- Layout selector in outline

---

## Files Changed

| File | Changes |
|------|---------|
| `types.ts` | MultiPanelBeat, SFX, ReferenceChain interfaces |
| `App.tsx` | Multi-panel generation, reference chaining |
| NEW `compositing.ts` | Panel assembly logic |
| NEW `lettering.ts` | Balloon/caption rendering |
| `Panel.tsx` | Multi-panel display, rating stars |
| `OutlineStepDialog.tsx` | Layout pattern selector |

---

## Technical Considerations

### Performance
- Multi-panel = more API calls (3-9 per page)
- Consider parallel generation with Promise.all
- Cache intermediate results

### Compositing Options
1. **Server-side (Sharp/Canvas)**: Better quality, requires backend
2. **Client-side (Canvas API)**: No backend, slower
3. **CSS Grid**: Display only, no export support

### Fallback Strategy
- If multi-panel fails, fall back to splash
- If compositing fails, show individual panels

---

*Batch 6 is the most ambitious, transforming the app from "AI splash page generator" to "true AI comic creator."*
