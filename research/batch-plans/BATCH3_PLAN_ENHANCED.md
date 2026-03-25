# Batch 3 Implementation Plan: Character & Outline Management (ENHANCED)

> **Updated:** March 2026
> **Enhancement Source:** Comic Fundamentals Research

## Original Issues
- **E.** Smart Character-to-Panel Assignment in Outline
- **F.** Editable Outline at Any Time
- **G.** Add Characters Anytime + AI Character Analysis

## NEW: Comic Fundamentals Integration

Based on research, the outline system should be enhanced to include professional comic layout concepts.

---

## Enhanced Data Structures

### 1. PageCharacterPlan (ENHANCED)

```typescript
// McCloud's 6 Panel Transition Types
type TransitionType =
  | 'moment-to-moment'    // Tiny time gap, slow-motion (rare: 2%)
  | 'action-to-action'    // Single subject action (most common: 65%)
  | 'subject-to-subject'  // Same scene, different subject (20%)
  | 'scene-to-scene'      // Time/location jump (10%)
  | 'aspect-to-aspect'    // Mood-setting, same place (rare: 2%)
  | 'non-sequitur';       // Surreal, no connection (rare: 1%)

// Camera/Shot Types
type ShotType =
  | 'extreme-close-up'    // Eyes, detail
  | 'close-up'            // Face only
  | 'medium'              // Waist up
  | 'full'                // Full body
  | 'wide'                // Environment + characters
  | 'extreme-wide';       // Establishing shot

// Panel Layout Options
type PanelLayout =
  | 'splash'              // Full page, 1 panel (dramatic moments)
  | 'horizontal-split'    // 2 wide panels stacked
  | 'vertical-split'      // 2 tall panels side-by-side
  | 'grid-2x2'            // 4 panels (fast pacing)
  | 'grid-2x3'            // 6 panels (standard narrative)
  | 'grid-3x3'            // 9 panels (dense, tension building)
  | 'asymmetric';         // Mixed sizes (dynamic action)

// Emotional Beat Types
type EmotionalBeat =
  | 'establishing'        // Scene setup, wide shots
  | 'action'              // Physical activity
  | 'dialogue'            // Conversation focus
  | 'reaction'            // Character response
  | 'climax'              // Peak moment
  | 'transition'          // Scene change
  | 'reveal';             // Surprise/twist

interface PageCharacterPlan {
  // Original fields
  pageIndex: number;
  primaryCharacters: string[];
  secondaryCharacters?: string[];
  focusCharacter: string;
  sceneDescription?: string;
  isDecisionPage: boolean;

  // NEW: Comic Fundamentals
  panelLayout: PanelLayout;              // How to divide the page
  panelCount?: number;                   // Override for asymmetric
  transitionType: TransitionType;        // How this page connects to next
  suggestedShot: ShotType;               // Camera framing
  emotionalBeat: EmotionalBeat;          // Story beat type
  pacingIntent: 'slow' | 'medium' | 'fast';  // Reading speed

  // Caption/Balloon styling
  captionStyle?: 'narration' | 'internal' | 'flashback' | 'location';
  isFlashback?: boolean;                 // Apply sepia/desaturated
}
```

### 2. Dialogue Context (NEW)

```typescript
interface DialogueContext {
  speaker: string;              // Character ID
  volume: 'whisper' | 'normal' | 'loud' | 'shouting';
  emotion: 'calm' | 'angry' | 'sad' | 'weak' | 'frightened';
  medium?: 'phone' | 'radio' | 'telepathy' | 'robotic';
}

// Balloon shape selection based on context
function selectBalloonShape(context: DialogueContext): BalloonShape {
  if (context.volume === 'shouting') return 'burst';
  if (context.volume === 'whisper') return 'dashed';
  if (context.emotion === 'weak' || context.emotion === 'frightened') return 'wavy';
  if (context.medium === 'phone' || context.medium === 'radio') return 'jagged';
  if (context.medium === 'robotic') return 'rectangle';
  if (context.medium === 'telepathy') return 'cloud';
  return 'oval';
}
```

### 3. Caption Color System (NEW)

```typescript
interface CaptionColorScheme {
  characterId: string;
  backgroundColor: string;    // e.g., '#FFE4B5' for hero
  textColor: string;          // Usually black
  borderColor?: string;
  icon?: string;              // Optional character symbol
}

// Default caption colors by context
const CAPTION_STYLES = {
  narration: { bg: '#F5E050', text: '#000', font: 'italic' },      // Yellow - standard
  internalMonologue: { bg: '#FFE4B5', text: '#000', font: 'italic' },  // Tan - thoughts
  flashback: { bg: '#D4A574', text: '#3D2914', font: 'italic' },   // Sepia - past
  locationTime: { bg: '#333', text: '#FFF', font: 'normal' },      // Dark - setting
};
```

---

## Enhanced Outline Generation Prompt

```typescript
const generateEnhancedOutline = async () => {
  const prompt = `
You are a professional comic book writer planning a ${config.MAX_STORY_PAGES}-page story.

CHARACTERS: ${characterNames.join(', ')}
GENRE: ${selectedGenre}
PREMISE: ${storyContext.descriptionText}

For EACH page, provide:

PAGE [N]:
- Characters: [who appears]
- Focus: [primary character]
- Scene: [1-2 sentence description]
- Layout: [splash|horizontal-split|vertical-split|grid-2x2|grid-2x3|asymmetric]
- Shot: [extreme-close-up|close-up|medium|full|wide|extreme-wide]
- Transition: [moment-to-moment|action-to-action|subject-to-subject|scene-to-scene|aspect-to-aspect]
- Beat: [establishing|action|dialogue|reaction|climax|transition|reveal]
- Pacing: [slow|medium|fast]
- Flashback: [yes|no]

LAYOUT GUIDELINES:
- Use "splash" for: character introductions, major reveals, climaxes (MAX 2-3 per issue)
- Use "grid-2x3" for: dialogue scenes, standard narrative (MOST COMMON)
- Use "grid-3x3" for: building tension, dense information
- Use "asymmetric" for: action sequences, dynamic moments

TRANSITION GUIDELINES:
- action-to-action: Most common (65%) - physical action progression
- subject-to-subject: Dialogue scenes (20%) - switching between speakers
- scene-to-scene: Time/location jumps (10%) - "Meanwhile..." or "Later..."
- moment-to-moment: Slow-motion emphasis (rare) - dramatic pauses
- aspect-to-aspect: Mood/atmosphere (rare) - environmental poetry

PACING RULE: Vary the rhythm!
- Pages 1-2: SLOW (establishing)
- Pages 3-5: MEDIUM (rising action)
- Pages 6-7: FAST (complication)
- Page 8-9: SLOW→FAST (climax build)
- Page 10: SLOW (resolution/cliffhanger)

OUTPUT FORMAT: Structured text as shown above.
`;

  // ... generation logic
};
```

---

## Enhanced Outline Parser

```typescript
const parseEnhancedOutline = (text: string): PageCharacterPlan[] => {
  const plans: PageCharacterPlan[] = [];

  const pageRegex = /PAGE (\d+):\s*\n- Characters: (.+)\n- Focus: (.+)\n- Scene: (.+)\n- Layout: (.+)\n- Shot: (.+)\n- Transition: (.+)\n- Beat: (.+)\n- Pacing: (.+)\n- Flashback: (.+)/gi;

  let match;
  while ((match = pageRegex.exec(text)) !== null) {
    plans.push({
      pageIndex: parseInt(match[1]),
      primaryCharacters: match[2].split(',').map(c => mapNameToId(c.trim())),
      focusCharacter: mapNameToId(match[3].trim()),
      sceneDescription: match[4].trim(),
      isDecisionPage: config.DECISION_PAGES.includes(parseInt(match[1])),

      // NEW fields
      panelLayout: match[5].trim().toLowerCase() as PanelLayout,
      suggestedShot: match[6].trim().toLowerCase() as ShotType,
      transitionType: match[7].trim().toLowerCase() as TransitionType,
      emotionalBeat: match[8].trim().toLowerCase() as EmotionalBeat,
      pacingIntent: match[9].trim().toLowerCase() as 'slow' | 'medium' | 'fast',
      isFlashback: match[10].trim().toLowerCase() === 'yes',
    });
  }

  return plans;
};
```

---

## Beat Generation Enhancement

```typescript
const generateBeat = async (...args) => {
  // Get page plan
  const pagePlan = storyOutline.pageBreakdown?.[pageNum];

  const layoutInstructions = pagePlan ? `
PANEL LAYOUT: ${pagePlan.panelLayout}
${pagePlan.panelLayout === 'grid-2x3' ? 'Design for 6 sequential panels on one page.' : ''}
${pagePlan.panelLayout === 'splash' ? 'This is a SPLASH PAGE - single dramatic image, minimal text.' : ''}
${pagePlan.panelLayout === 'asymmetric' ? 'Use dynamic panel sizes - one large, several small.' : ''}

CAMERA SHOT: ${pagePlan.suggestedShot}
${pagePlan.suggestedShot === 'extreme-close-up' ? 'Focus on eyes/detail only.' : ''}
${pagePlan.suggestedShot === 'wide' ? 'Show full environment with characters.' : ''}

STORY BEAT: ${pagePlan.emotionalBeat}
${pagePlan.emotionalBeat === 'climax' ? 'This is the PEAK MOMENT - maximum drama!' : ''}
${pagePlan.emotionalBeat === 'dialogue' ? 'Focus on conversation, reaction shots.' : ''}

TRANSITION TO NEXT: ${pagePlan.transitionType}
${pagePlan.transitionType === 'scene-to-scene' ? 'End with clear scene break (time/location change next).' : ''}

${pagePlan.isFlashback ? 'FLASHBACK SCENE: This takes place in the PAST. Describe with nostalgic/memory tone.' : ''}
` : '';

  const prompt = `
${layoutInstructions}

... existing prompt content ...
`;
};
```

---

## Image Generation Enhancement

```typescript
const generateImage = async (beat: Beat, pagePlan?: PageCharacterPlan, ...) => {
  // Apply comic fundamentals to image prompt

  let styleModifiers = '';

  // Panel layout affects composition
  if (pagePlan?.panelLayout === 'splash') {
    styleModifiers += 'COMPOSITION: Full page dramatic composition. Leave space for title/credits at top. ';
  } else if (pagePlan?.panelLayout === 'grid-2x3') {
    styleModifiers += 'COMPOSITION: Design as ONE of SIX panels on a page. Tighter framing, less negative space. ';
  }

  // Shot type affects framing
  const shotInstructions: Record<ShotType, string> = {
    'extreme-close-up': 'FRAMING: Extreme close-up. Show only eyes/detail. Maximum emotional impact.',
    'close-up': 'FRAMING: Close-up. Face fills most of the frame. Show emotion clearly.',
    'medium': 'FRAMING: Medium shot. Waist-up framing. Balance character and context.',
    'full': 'FRAMING: Full shot. Complete figure visible. Show body language.',
    'wide': 'FRAMING: Wide shot. Environment prominent. Establish setting.',
    'extreme-wide': 'FRAMING: Establishing shot. Vast environment, small figures. Set the scene.',
  };
  styleModifiers += shotInstructions[pagePlan?.suggestedShot || 'medium'] + ' ';

  // Flashback styling
  if (pagePlan?.isFlashback) {
    styleModifiers += 'FLASHBACK STYLING: Sepia/warm brown tones. Soft vignette edges. Slightly desaturated. Memory/nostalgic quality. ';
  }

  // Add to prompt
  promptText += styleModifiers;
};
```

---

## OutlineStepDialog Enhancement

Add visual layout preview:

```tsx
// Show layout icons in outline review
const LayoutIcon: React.FC<{ layout: PanelLayout }> = ({ layout }) => {
  const icons: Record<PanelLayout, string> = {
    'splash': '▣',           // Full page
    'horizontal-split': '▤', // 2 horizontal
    'vertical-split': '▥',   // 2 vertical
    'grid-2x2': '⊞',         // 4 panels
    'grid-2x3': '⊟',         // 6 panels
    'grid-3x3': '▦',         // 9 panels
    'asymmetric': '⊠',       // Mixed
  };
  return <span title={layout}>{icons[layout]}</span>;
};

// In page breakdown display:
<div className="page-plan">
  <LayoutIcon layout={plan.panelLayout} />
  <span>{plan.sceneDescription}</span>
  <span className="shot-badge">{plan.suggestedShot}</span>
  {plan.isFlashback && <span className="flashback-badge">📜 Flashback</span>}
</div>
```

---

## Implementation Phases

### Phase 1: Enhanced Types (30 min)
- Add `TransitionType`, `ShotType`, `PanelLayout`, `EmotionalBeat` to types.ts
- Enhance `PageCharacterPlan` interface
- Add caption color and balloon shape types

### Phase 2: Outline Generation (1 hr)
- Update outline prompt with comic fundamentals
- Create enhanced parser
- Add fallback for simple outlines

### Phase 3: Beat Generation (45 min)
- Inject layout/shot/transition context into prompts
- Add flashback styling support
- Enhance camera framing instructions

### Phase 4: Image Generation (45 min)
- Apply composition rules based on layout
- Add shot framing to prompts
- Implement flashback visual styling

### Phase 5: UI Updates (1 hr)
- Layout preview icons in OutlineStepDialog
- Shot type selector in outline editor
- Flashback toggle per page

### Phase 6: Testing (30 min)
- Test all layout types
- Verify flashback styling
- Confirm transition logic

---

## Summary: What's New

| Feature | Before | After |
|---------|--------|-------|
| Page Layout | Always splash | 7 layout options |
| Camera Shot | Random | 6 defined shot types |
| Transitions | None | McCloud's 6 types |
| Pacing | Fixed | slow/medium/fast per page |
| Flashbacks | None | Sepia + soft edges |
| Outline Detail | Scene only | Full comic direction |

---

## Files Changed

| File | Changes |
|------|---------|
| `types.ts` | +150 lines (new types, enums, interfaces) |
| `App.tsx` | Enhanced outline generation, beat prompt, image prompt |
| `OutlineStepDialog.tsx` | Layout preview, shot selector, flashback toggle |
| NEW `comic-utils.ts` | Helper functions for comic fundamentals |

---

*This enhanced plan incorporates professional comic book conventions to create more authentic, varied, and dynamic comics.*
