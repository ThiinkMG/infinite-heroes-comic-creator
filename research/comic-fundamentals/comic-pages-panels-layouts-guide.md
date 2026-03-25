# Comic Book Pages, Panels, Layouts & Lettering Conventions

> **Research Date:** March 2026
> **Purpose:** Comprehensive guide for AI-generated comic creation
> **Project Context:** Infinite Heroes Comic Creator

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Panel Types & Their Names](#panel-types--their-names)
3. [Page Layout Systems](#page-layout-systems)
4. [Panel Transitions (McCloud's 6 Types)](#panel-transitions-mcclouds-6-types)
5. [The Gutter: Timing & Pacing](#the-gutter-timing--pacing)
6. [Splash Pages & Spreads](#splash-pages--spreads)
7. [Speech Balloons & Their Shapes](#speech-balloons--their-shapes)
8. [Caption Boxes & Color Conventions](#caption-boxes--color-conventions)
9. [How Artists Plan Comic Pages](#how-artists-plan-comic-pages)
10. [Flashback Visual Conventions](#flashback-visual-conventions)
11. [Implementation for AI Comic Generation](#implementation-for-ai-comic-generation)
12. [Quick Reference Tables](#quick-reference-tables)
13. [Sources & References](#sources--references)

---

## Executive Summary

Comic book page design is a sophisticated visual language that controls pacing, emotion, and reader engagement. This guide covers the fundamental building blocks that professional comic artists use, organized for implementation in AI-generated comics.

### Key Takeaways

| Element | Primary Function | Key Insight |
|---------|-----------------|-------------|
| **Panel Size** | Controls pacing | Larger = slower/more important; Smaller = faster/action |
| **Panel Shape** | Conveys emotion | Irregular = chaos/tension; Rectangular = stability |
| **Gutters** | Control time perception | Wider = more time passed; Narrower = quick succession |
| **Splash Pages** | Maximum impact | Use sparingly for reveals, climaxes, establishing shots |
| **Caption Colors** | Distinguish narration types | Yellow = internal monologue; Character-specific = unique colors |
| **Balloon Shapes** | Convey voice quality | Jagged = shouting; Wavy = weak; Dashed = whisper |

---

## Panel Types & Their Names

### Standard Panel Types

| Panel Type | Description | When to Use |
|------------|-------------|-------------|
| **Strict/Regular Panel** | Rectangular or square, no overlap | Standard storytelling, dialogue |
| **Irregular Panel** | Non-straight or non-parallel sides | Movement, tension, making image stand out |
| **Diagonal Panel** | Set at an angle | Dynamic action, disorientation, excitement |
| **Overlapping Panel** | One image slightly visible in next | Visual continuity, connected moments |
| **Puzzle/Jigsaw Panel** | Image broken into pieces | Action sequences, fragmented time |

### Size-Based Panel Types

| Panel Type | Description | When to Use |
|------------|-------------|-------------|
| **Horizontal Panel** | Long, wide rectangle | Landscapes, establishing wide scenes, calm moments |
| **Vertical Panel** | Tall, narrow rectangle | Simultaneous events, character reactions side-by-side, height emphasis |
| **Full-Width Panel** | Spans entire page width | Expanding scene scope, important moments |
| **Inset Panel** | Small panel contained within larger panel | Details, reactions, flashbacks within action |
| **Splash Panel** | Full-page single image | Dramatic entrances/exits, major reveals |

### Special Panel Types

| Panel Type | Description | When to Use |
|------------|-------------|-------------|
| **Broken Panel** | Image extends beyond borders into gutters | Breaking reality, emphasizing power |
| **Page Panel** | Entire page as background with superimposed panels | Dramatic compositions, establishing environments |
| **Borderless Panel** | No panel border | Dreams, memories, infinite space |
| **Silhouette Panel** | Characters shown as silhouettes | Mystery, dramatic reveals, emotional weight |

---

## Page Layout Systems

### Grid Systems Overview

Comic pages are typically built on grid systems that provide structure while allowing creative variation.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FOUR-PANEL GRID (2×2)                    │
├────────────────────────┬────────────────────────────────────────┤
│                        │                                        │
│       Panel 1          │              Panel 2                   │
│                        │                                        │
├────────────────────────┼────────────────────────────────────────┤
│                        │                                        │
│       Panel 3          │              Panel 4                   │
│                        │                                        │
└────────────────────────┴────────────────────────────────────────┘

Best For: Simple sequences, gag comics, quick moments
Pacing: Fast, punchy, straightforward
```

```
┌─────────────────────────────────────────────────────────────────┐
│                         SIX-PANEL GRID (2×3)                    │
├──────────────────┬──────────────────┬───────────────────────────┤
│     Panel 1      │     Panel 2      │         Panel 3           │
├──────────────────┼──────────────────┼───────────────────────────┤
│     Panel 4      │     Panel 5      │         Panel 6           │
└──────────────────┴──────────────────┴───────────────────────────┘

Best For: Dialogue-heavy scenes, standard narrative progression
Pacing: Balanced, conversational
Most Common: Industry standard for mainstream comics
```

```
┌─────────────────────────────────────────────────────────────────┐
│                        NINE-PANEL GRID (3×3)                    │
├────────────────┬────────────────┬────────────────────────────────┤
│    Panel 1     │    Panel 2     │           Panel 3              │
├────────────────┼────────────────┼────────────────────────────────┤
│    Panel 4     │    Panel 5     │           Panel 6              │
├────────────────┼────────────────┼────────────────────────────────┤
│    Panel 7     │    Panel 8     │           Panel 9              │
└────────────────┴────────────────┴────────────────────────────────┘

Best For: Dense dialogue, building tension, slowing moments
Pacing: Controlled, deliberate, detailed
Famous Example: Watchmen used this extensively
```

### Layout Variation Techniques

**Knocking Out Walls**: Combining adjacent panels into larger ones while maintaining the underlying grid.

```
Standard 6-panel:                With wall knocked out:
┌──────┬──────┬──────┐          ┌──────┬─────────────┐
│  1   │  2   │  3   │          │  1   │     2+3     │  ← Panels combined
├──────┼──────┼──────┤          ├──────┼──────┬──────┤
│  4   │  5   │  6   │          │  4   │  5   │  6   │
└──────┴──────┴──────┘          └──────┴──────┴──────┘
```

### Pacing Through Layout

| Panel Density | Pacing Effect | Reader Experience |
|---------------|---------------|-------------------|
| **1-2 panels/page** | Very slow | Contemplative, epic, emotional weight |
| **3-4 panels/page** | Slow | Dramatic, important scenes |
| **5-6 panels/page** | Medium | Standard narrative flow |
| **7-9 panels/page** | Fast | Dense information, building tension |
| **9+ panels/page** | Very fast | Hectic, overwhelming, chaotic |

### The "Small-Small-Small-LARGE" Pattern

A proven rhythm for building dramatic tension:

```
Page Layout Example:
┌──────┬──────┬──────┐
│ sm 1 │ sm 2 │ sm 3 │    ← Build-up panels (quick reading)
├──────┴──────┴──────┤
│                    │
│      LARGE 4       │    ← Payoff panel (dramatic weight)
│                    │
└────────────────────┘
```

---

## Panel Transitions (McCloud's 6 Types)

Scott McCloud's "Understanding Comics" identified six fundamental ways panels connect. Understanding these is crucial for AI comic generation.

### 1. Moment-to-Moment

**Definition**: Very short intervals showing subtle changes in the same scene.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Eye open  │→ │ Eye closing │→ │  Eye closed │
└─────────────┘  └─────────────┘  └─────────────┘
```

**When to Use**:
- Slow-motion effect
- Heightening tension
- Emphasizing small but significant actions
- Dramatic pauses

**Frequency**: Uncommon (uses many panels for little story progress)

### 2. Action-to-Action

**Definition**: Single subject progressing through a distinct action.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Hero winds  │→ │ Hero throws │→ │ Punch lands │
│    up       │  │   punch     │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

**When to Use**:
- Most common transition type
- Action sequences
- Physical activities
- Clear cause-and-effect storytelling

**Frequency**: Most common (efficient storytelling)

### 3. Subject-to-Subject

**Definition**: Staying in scene but shifting between different subjects.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Character  │→ │  Villain    │→ │  Bystander  │
│  speaking   │  │  reacting   │  │  watching   │
└─────────────┘  └─────────────┘  └─────────────┘
```

**When to Use**:
- Conversations between characters
- Showing reactions
- Building scene comprehensively
- Multiple perspectives on same event

**Frequency**: Second most common

### 4. Scene-to-Scene

**Definition**: Significant transitions in time and/or space.

```
┌─────────────┐  ┌─────────────┐
│  Morning    │→ │  That night │
│  meeting    │  │  rooftop    │
└─────────────┘  └─────────────┘
```

**When to Use**:
- Time jumps (hours, days, years)
- Location changes
- Parallel storylines
- "Meanwhile..." moments

**Frequency**: Common (advances narrative quickly)

### 5. Aspect-to-Aspect

**Definition**: Different aspects of a place, idea, or mood.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Cityscape  │→ │   Rain on   │→ │  Lonely     │
│  at dusk    │  │   window    │  │  streetlamp │
└─────────────┘  └─────────────┘  └─────────────┘
```

**When to Use**:
- Establishing mood/atmosphere
- Contemplative scenes
- Poetry-like sequences
- Setting emotional tone
- Very common in manga

**Frequency**: Uncommon in Western comics, common in manga

### 6. Non-Sequitur

**Definition**: No logical connection between panels.

```
┌─────────────┐  ┌─────────────┐
│   A shoe    │→ │  Exploding  │
│             │  │   planet    │
└─────────────┘  └─────────────┘
```

**When to Use**:
- Surreal/dream sequences
- Comedy/absurdist humor
- Representing madness/confusion
- Artistic experimentation

**Frequency**: Very rare

### Transition Frequency in Western Comics

| Transition Type | Frequency | Notes |
|-----------------|-----------|-------|
| Action-to-Action | ~65% | Dominant in action-oriented Western comics |
| Subject-to-Subject | ~20% | Common for dialogue scenes |
| Scene-to-Scene | ~10% | Narrative advancement |
| Moment-to-Moment | ~2% | Special emphasis only |
| Aspect-to-Aspect | ~2% | More common in indie/art comics |
| Non-Sequitur | ~1% | Experimental use only |

---

## The Gutter: Timing & Pacing

### What Is a Gutter?

The **gutter** is the space between panels. Despite being "empty," it's where the magic happens—readers mentally fill in the action that occurs between panels (a process McCloud calls "closure").

### Gutter Width and Time Perception

| Gutter Width | Time Implied | Reader Experience |
|--------------|--------------|-------------------|
| **Very narrow** | Milliseconds | Rapid succession, almost simultaneous |
| **Standard** | Seconds to minutes | Normal narrative flow |
| **Wide** | Hours to days | Significant time passage |
| **Very wide/blank space** | Extended time | Dramatic pause, contemplation |

```
Narrow gutters = Quick time:
┌────┐┌────┐┌────┐┌────┐
│ 1  ││ 2  ││ 3  ││ 4  │
└────┘└────┘└────┘└────┘

Wide gutters = More time passing:
┌────┐    ┌────┐    ┌────┐
│ 1  │    │ 2  │    │ 3  │
└────┘    └────┘    └────┘
```

### Gutter Styling Variations

| Gutter Style | Effect | When to Use |
|--------------|--------|-------------|
| **Black gutters** | Standard, clean separation | Default choice |
| **White gutters** | Lighter, airier feel | Comedic or light stories |
| **Colored gutters** | Mood enhancement | Match story tone |
| **No gutters (bleeding)** | Panels flow together | Connected action, surreal sequences |
| **Irregular gutters** | Chaos, destruction | Battle scenes, horror |

---

## Splash Pages & Spreads

### Definitions

| Term | Definition | Visual |
|------|------------|--------|
| **Splash Page** | Full-page single panel (often with credits) | One page, one image |
| **Spread** | Image spanning more than one page | Crosses the binding |
| **Double-Page Spread (DPS)** | Image spanning exactly two facing pages | Left + right pages as one |
| **Splash Panel** | Large panel that dominates a page but shares it with smaller panels | Biggest panel on mixed page |

### Types of Spreads

1. **True Splash Spread**: Single continuous image across both pages
2. **Paneled Spread**: Multiple panels arranged across both pages as unified composition
3. **Partial Spread**: Panels on both pages with one dominant cross-gutter element

### When to Use Splash Pages

| Scenario | Why It Works |
|----------|--------------|
| **Character introductions** | Establishes importance and visual design |
| **Major reveals** | Gives weight to surprising information |
| **Establishing shots** | Shows scope of location/setting |
| **Climactic moments** | Emotional/action payoff |
| **Story openings** | Sets tone and hooks reader |
| **Act/chapter endings** | Creates memorable pause point |

### When NOT to Use Splash Pages

- Regular dialogue scenes
- Minor action sequences
- Every character appearance
- Padding page count
- "Showing off" without narrative purpose

### The Golden Rule

> "If big pictures are used too often, even in points of the plot where what is happening isn't very important, then you'll have to use splash pages or double pages to make the difference."

**Use splash pages sparingly** so they retain their impact.

### Technical Considerations for Spreads

**The Gutter Problem**: The binding gutter (where pages meet) consumes 1/4" to 3/8" of content.

**Never place in the center gutter**:
- Faces or eyes
- Text or dialogue
- Small important details
- Critical story information

**Safe for the center gutter**:
- Large continuous elements (sky, water)
- Bodies/large forms
- Vertical architectural elements
- Natural visual break points

---

## Speech Balloons & Their Shapes

### Standard Balloon Types

| Balloon Type | Visual | Meaning | When to Use |
|--------------|--------|---------|-------------|
| **Standard/Oval** | Smooth oval with tail | Normal speech | Default dialogue |
| **Thought Bubble** | Cloud-shaped with bubble trail | Internal thoughts | Character thinking (less common now) |
| **Burst/Jagged** | Spiky, explosive edges | Shouting/screaming | Anger, excitement, loud moments |
| **Wavy** | Wobbly, unstable edges | Weak/distressed voice | Injury, exhaustion, fear |
| **Dashed Outline** | Dotted/dashed border | Whispering | Quiet, secretive speech |
| **Double Outline** | Two concentric borders | Emphasis | Important statements |
| **Square/Rectangular** | Boxy shape | Robotic/mechanical | Computers, AI, radio |

### Special Balloon Types

| Balloon Type | Visual | Meaning | Example Characters |
|--------------|--------|---------|-------------------|
| **Broadcast/Radio** | Jagged outline + lightning tail | Electronic transmission | Phone calls, TV, radio |
| **Telepathic** | Thought bubble with breath marks | Mental communication | Professor X, Martian Manhunter |
| **Rough/Monster** | Distorted, creepy edges | Inhuman voice | Demons, monsters, Venom |
| **Icy** | Crystalline, frost-covered | Cold powers active | Iceman, Mr. Freeze |
| **Flaming** | Fire-edged | Fire powers active | Human Torch, Ghost Rider |
| **Inverted** | Black fill, white text | Alien/otherworldly | Symbiotes, cosmic entities |

### Character-Specific Balloon Styling (Examples)

| Character | Balloon Style | Purpose |
|-----------|--------------|---------|
| **Deadpool** | Yellow tint, handwritten font | Suggests addressing reader/4th wall |
| **Venom** | Black balloon, white text | Represents symbiote dominance |
| **Thor** | Calligraphic lettering | Ancient, godly presence |
| **Thanos** | Double outline, shaky | Immense power + cosmic weariness |
| **The Joker** | Irregular, "graffiti-like" | Chaotic, unpredictable |
| **The Endless** (Sandman) | Each sibling has unique design | Distinct voices beyond human |

### Balloon Reading Order Rules

1. **Top to bottom** within a panel
2. **Left to right** (Western comics) or **right to left** (manga)
3. **Closer to speaker** reads first when ambiguous
4. **Numbered/connected** balloons in indicated order

---

## Caption Boxes & Color Conventions

### Caption Box Types

Captions are text boxes that provide narration, thoughts, or context—distinct from dialogue balloons.

| Caption Type | Purpose | Typical Styling |
|--------------|---------|-----------------|
| **Third-Person Narration** | Omniscient storytelling | Standard box, often italicized |
| **Internal Monologue** | Character's thoughts | Colored box, always italicized |
| **Location/Time** | Setting information | Blocky sans-serif, often lowercase |
| **Spoken (Off-Panel)** | Dialogue from unseen speaker | Uses quotation marks, not italicized |
| **Editorial** | Writer/editor voice | Italicized, often references other issues |

### Color Conventions for Caption Boxes

#### Standard Industry Colors

| Color | Primary Use | Notes |
|-------|-------------|-------|
| **Yellow** | Default narration/internal monologue | Most common, distinguishes from white balloons |
| **White** | Neutral narration | Less common for captions, more for dialogue |
| **Light Blue** | Often for outer space scenes | Silver Age convention |
| **Sepia/Tan** | Flashbacks, historical narration | Indicates past events |
| **Gray** | Muted narration, somber tone | Death, sadness, memory |
| **Character-Specific Colors** | Multiple narrators | Distinguishes who's "speaking" |

#### Character-Specific Caption Coloring (Modern Convention)

DC and Marvel now commonly assign **unique caption colors per character** for easy identification in multi-narrator scenes:

| Example | Caption Color | Symbol/Accent |
|---------|---------------|---------------|
| **Batman** | Dark blue/gray | Bat symbol |
| **Superman** | Blue | S-shield |
| **Wonder Woman** | Red/gold | WW symbol |
| **Green Lantern** | Green | Lantern symbol |
| **Booster Gold** | Yellow | Blue star |
| **Rip Hunter** | Red | Green infinity symbol |

#### New Super-Man Language Color Coding

A unique example of color-coded caption usage:
- **Black text** = Mandarin Chinese
- **Blue text** = English
- **Red text** = Other languages (Cantonese, Korean)

### Caption Styling by Era

| Era | Typical Caption Style |
|-----|----------------------|
| **Golden/Silver Age** | Bright yellow rectangles at panel top |
| **Bronze Age** | Yellow or light blue, more varied placement |
| **Modern Age** | Character-specific colors, shaped boxes |
| **Contemporary** | Highly stylized, sometimes floating without boxes |

### Caption vs. Thought Bubble Evolution

> **Historical shift**: Thought bubbles have largely been replaced by caption boxes for internal monologue in modern comics.

**Why the change?**
1. Caption boxes are more elegant and less cluttered
2. They work better for extended internal narration
3. They can be positioned anywhere on the page
4. They parallel cinematic voice-over techniques

---

## How Artists Plan Comic Pages

### The Professional Workflow

```
1. SCRIPT
   ↓
2. THUMBNAILS (Small rough sketches)
   ↓
3. LAYOUTS (Full-size rough drawings)
   ↓
4. PENCILS (Detailed drawings)
   ↓
5. INKS (Final line art)
   ↓
6. COLORS
   ↓
7. LETTERS (Balloons, captions, SFX)
   ↓
8. FINAL REVIEW/CORRECTIONS
```

### Thumbnailing: The Critical Planning Stage

**What are thumbnails?**
Small (typically 2"×3") rough sketches that plan:
- Panel arrangements
- Basic compositions
- Character positions
- Text/balloon placement
- Reading flow

**Why thumbnails matter:**
- "Saves you time and grief" by testing layouts cheaply
- Faster to draw than full-size pages
- Easy to iterate and experiment
- Identifies flow problems before commitment

### Key Layout Planning Principles

#### 1. Establish Clear Reading Order
> "If you have to stop and think about what panel or speech balloon to read next, that hurts the storytelling."

Western comics: Left → Right, Top → Bottom
Manga: Right → Left, Top → Bottom

#### 2. Plan for Text Placement
Speech balloons and captions should be considered during thumbnailing, not added as an afterthought. Important art elements shouldn't be covered by text.

#### 3. Use Establishing Shots Strategically
> "If you do your establishing shot right, you can get away with drawing very little background on the rest of your page."

A good establishing shot early on allows subsequent panels to focus on characters without confusing readers about location.

#### 4. Vary Panel Sizes and Compositions
Monotonous, uniform panels create visual fatigue. Mix:
- Panel sizes (large/small)
- Shot types (close-up/wide)
- Angles (eye-level/low/high)

#### 5. End Pages on Hooks
End each page (especially right-hand pages) at moments of suspense or interest to encourage page-turning.

### Panel Density Guidelines

| Panels Per Page | Effect | Best For |
|-----------------|--------|----------|
| 1-3 | Epic, dramatic | Reveals, climaxes |
| 4-6 | Balanced | Standard scenes |
| 7-9 | Dense, detailed | Complex dialogue, building tension |
| 10+ | Overwhelming | Special effect only |

**Rule of thumb**: More than 6-9 panels becomes visually taxing; more than 3 speech balloons per panel complicates storytelling.

---

## Flashback Visual Conventions

### How to Signal "This Is the Past"

| Technique | Description | Common Usage |
|-----------|-------------|--------------|
| **Sepia Tones** | Brown/tan color palette | Clear "old photograph" feeling |
| **Desaturated Colors** | Muted, faded palette | Subtle past indication |
| **Monochrome** | Black and white or single color | Strong past/present contrast |
| **Soft/Blurred Edges** | Vignette or fuzzy panel borders | Dream-like memory quality |
| **Clipped Corners** | Panels shaped like photo corners | "Photo album" reference |
| **Different Art Style** | Looser, sketchier, or stylized | Distinct memory rendering |
| **Border Changes** | Wavy or irregular panel edges | Unstable memory |
| **Caption Introduction** | "Years ago..." text | Explicit time indicator |

### Batman: Arkham Asylum Example

Caption boxes with "little chips in them" (jagged, damaged edges) establish a distinct narrative voice and create thematic tone appropriate for the dark story.

### Naruto Example (Manga)

Since manga is typically black and white, Kishimoto uses **compositional framing**: showing an adult character looking toward readers while a younger version gazes into the distance, creating visual contrast without color cues.

### Combining Techniques

Most effective flashbacks combine multiple techniques:
```
Example: Memory flashback
- Sepia color palette (time indicator)
- Soft vignette edges (memory quality)
- Caption: "I remember..." (explicit cue)
- Aspect-to-aspect transitions (mood setting)
```

---

## Implementation for AI Comic Generation

### Prompt Considerations by Panel Type

```typescript
interface PanelLayoutPrompt {
  panelType: 'regular' | 'splash' | 'horizontal' | 'vertical' | 'inset';
  gridPosition: string;  // e.g., "top-left", "full-page", "center"
  importance: 'establishing' | 'action' | 'dialogue' | 'climax' | 'transition';
  cameraShot: 'extreme-close-up' | 'close-up' | 'medium' | 'full' | 'wide' | 'extreme-wide';
  transitionFrom: TransitionType;  // McCloud's 6 types
}

type TransitionType =
  | 'moment-to-moment'
  | 'action-to-action'
  | 'subject-to-subject'
  | 'scene-to-scene'
  | 'aspect-to-aspect'
  | 'non-sequitur';
```

### Page Layout Generation Logic

```typescript
function determinePageLayout(sceneType: string, emotionalBeat: string): LayoutType {
  // Major reveals, climaxes = splash page
  if (emotionalBeat === 'climax' || emotionalBeat === 'reveal') {
    return 'splash';
  }

  // Dialogue-heavy = 6-panel grid
  if (sceneType === 'conversation') {
    return 'six-panel';
  }

  // Action sequences = varied panels with knockout walls
  if (sceneType === 'action') {
    return 'dynamic-mixed';
  }

  // Tension building = 9-panel grid
  if (emotionalBeat === 'suspense') {
    return 'nine-panel';
  }

  return 'six-panel'; // Default
}
```

### Caption Box Styling by Context

```typescript
interface CaptionStyle {
  backgroundColor: string;
  textColor: string;
  borderStyle: 'solid' | 'dashed' | 'none' | 'jagged';
  fontStyle: 'normal' | 'italic';
  position: 'top' | 'bottom' | 'floating';
}

const captionStyles: Record<string, CaptionStyle> = {
  narration: {
    backgroundColor: '#F5E050',  // Yellow
    textColor: '#000000',
    borderStyle: 'solid',
    fontStyle: 'italic',
    position: 'top'
  },
  internalMonologue: {
    backgroundColor: '#FFE4B5',  // Character-specific (example)
    textColor: '#000000',
    borderStyle: 'solid',
    fontStyle: 'italic',
    position: 'floating'
  },
  locationTime: {
    backgroundColor: '#333333',
    textColor: '#FFFFFF',
    borderStyle: 'none',
    fontStyle: 'normal',
    position: 'top'
  },
  flashback: {
    backgroundColor: '#D4A574',  // Sepia
    textColor: '#3D2914',
    borderStyle: 'solid',
    fontStyle: 'italic',
    position: 'top'
  }
};
```

### Balloon Shape Selection

```typescript
type BalloonShape =
  | 'oval'        // Normal speech
  | 'cloud'       // Thought (deprecated but available)
  | 'burst'       // Shouting
  | 'wavy'        // Weak/distressed
  | 'dashed'      // Whisper
  | 'rectangle'   // Robotic/electronic
  | 'jagged'      // Radio transmission
  | 'inverted';   // Alien/otherworldly

function selectBalloonShape(context: DialogueContext): BalloonShape {
  if (context.volume === 'shouting') return 'burst';
  if (context.volume === 'whisper') return 'dashed';
  if (context.emotion === 'weak' || context.emotion === 'injured') return 'wavy';
  if (context.speaker === 'robot' || context.speaker === 'ai') return 'rectangle';
  if (context.medium === 'phone' || context.medium === 'radio') return 'jagged';
  if (context.speaker === 'alien' || context.speaker === 'symbiote') return 'inverted';
  return 'oval';
}
```

---

## Quick Reference Tables

### Panel Type Quick Reference

| Panel Type | Size | Shape | Best For |
|------------|------|-------|----------|
| Regular | Standard | Rectangle | Default storytelling |
| Splash | Full page | Any | Major moments |
| Horizontal | Wide | Rectangle | Landscapes, calm |
| Vertical | Tall | Rectangle | Height, simultaneous events |
| Inset | Small | Any | Details within action |
| Diagonal | Any | Angled | Tension, dynamism |
| Borderless | Any | None | Dreams, memories |

### Grid System Quick Reference

| Grid | Panels | Pacing | Best Scenes |
|------|--------|--------|-------------|
| 2×2 | 4 | Fast | Quick moments |
| 2×3 | 6 | Medium | Dialogue |
| 3×3 | 9 | Slow | Tension, detail |
| 4×4 | 16 | Very slow | Dense information |

### Transition Type Quick Reference

| Transition | Time Gap | Distance | Usage |
|------------|----------|----------|-------|
| Moment-to-moment | Tiny | None | Slow-motion |
| Action-to-action | Small | None | Most common |
| Subject-to-subject | None | Small | Conversations |
| Scene-to-scene | Large | Large | Time jumps |
| Aspect-to-aspect | None | None | Mood setting |
| Non-sequitur | N/A | N/A | Surreal |

### Balloon Shape Quick Reference

| Shape | Meaning | Example |
|-------|---------|---------|
| Oval | Normal speech | Standard dialogue |
| Burst | Shouting | "STOP RIGHT THERE!" |
| Wavy | Weak | "help...me..." |
| Dashed | Whisper | "don't let them hear" |
| Cloud | Thought | (Internal thinking) |
| Rectangle | Electronic | Computer voice |
| Jagged | Broadcast | Phone/radio |
| Inverted | Alien | Venom, demons |

### Caption Color Quick Reference

| Color | Meaning | When to Use |
|-------|---------|-------------|
| Yellow | Narration/thoughts | Default caption color |
| White | Neutral | Generic captions |
| Sepia | Flashback | Past events |
| Blue | Space/cold | Cosmic scenes |
| Gray | Somber | Death, sadness |
| Character-specific | Multiple narrators | Team books |

---

## Sources & References

### Panel Layouts & Composition
- [Storyspread - Comic Panels: Everything You Need to Know](https://www.storyspread.com/blog/comic-panels)
- [Comic Book Co - How Comic Book Panel Layouts Shape Stories](https://comicbookco.com/comics/comic-panel-layouts-grids-gutters-splash-pages-flow/)
- [Making Comics - The Grids (Nine Panel Grid)](https://salgoodsam.com/mc/the-nine-panel-grid/)
- [Multic - Panel Layout Basics](https://www.multic.com/guides/panel-layout-basics/)
- [Multic - Double Page Spreads Guide](https://www.multic.com/guides/double-page-spreads-guide/)
- [Comics for Beginners - Layouts & Sketching](https://comicsforbeginners.com/layouts-sketching-comic-books/)

### Panel Transitions & Theory
- [Understanding Comics 177 - Transition and Gutters](https://understandingcomics177.wordpress.com/about/1-2/2-2/)
- [The Sequential Press - McCloud's 6 Categories of Transitions](https://thesequentialpress.wordpress.com/2012/01/19/transitions/)
- [Comic Book Glossary - Gutter](https://comicbookglossary.wordpress.com/gutter/)

### Lettering & Balloon Conventions
- [Blambot - Comic Book Grammar & Tradition](https://blambot.com/pages/comic-book-grammar-tradition)
- [Wikipedia - Speech Balloon](https://en.wikipedia.org/wiki/Speech_balloon)
- [Popverse - Signature Word Balloons of DC and Marvel](https://www.thepopverse.com/superhero-comic-word-balloons-dc-marvel)

### Caption Boxes & Colors
- [Comic Book Glossary - Captions](https://comicbookglossary.wordpress.com/captions/)
- [TV Tropes - Color-Coded Speech](https://tvtropes.org/pmwiki/pmwiki.php/Main/ColorCodedSpeech)
- [TV Tropes - Thought Caption](https://tvtropes.org/pmwiki/pmwiki.php/Main/ThoughtCaption)

### Flashback Conventions
- [Comic Book Glossary - Flashback](https://comicbookglossary.wordpress.com/flashback/)
- [TV Tropes - Monochrome Past](https://tvtropes.org/pmwiki/pmwiki.php/Main/MonochromePast)

### Professional Workflow
- [Making Comics - Overview of Comic Creation Process](https://makingcomics.com/2014/01/16/overview-comic-creation-process/)
- [Clip Studio - Pro Artist's Guide to Comic & Manga Layouts](https://www.clipstudio.net/how-to-draw/archives/160963)
- [Making Comics - Thumbnailing](https://salgoodsam.com/mc/thumbnailing/)

### Foundational Text
- Scott McCloud, "Understanding Comics: The Invisible Art" (1993) - The essential text on comic theory

---

*Document Version: 1.0*
*Last Updated: March 2026*
*For: Infinite Heroes Comic Creator Project*
