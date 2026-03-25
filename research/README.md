# Research & Planning

This folder contains research documents, implementation plans, and architectural decisions for the Infinite Heroes Comic Creator.

## Folder Structure

```
research/
├── batch-plans/                    # Implementation plans for each batch
│   ├── BATCH1_PLAN.md              # Core Pipeline: Character Consistency (COMPLETED)
│   ├── BATCH2_PLAN.md              # Novel Mode: Choice Reroll + Batch (COMPLETED)
│   ├── BATCH3_PLAN.md              # Character & Outline Management (Original)
│   ├── BATCH3_PLAN_ENHANCED.md     # Character & Outline (+ Comic Fundamentals) ⭐
│   ├── BATCH4_PLAN.md              # Reroll & Prompt Enhancements (Original)
│   ├── BATCH4_PLAN_ENHANCED.md     # Reroll (+ Shot/Balloon Selection) ⭐
│   ├── BATCH5_PLAN.md              # UI/UX: Responsive + Mode Selection
│   ├── BATCH6_PLAN.md              # Multi-Panel & Advanced Comic Features ⭐ NEW
│   └── ENHANCEMENT_PASS_PLAN.md    # 4-Layer Consistency System (COMPLETED)
├── comic-fundamentals/             # Comic book theory & conventions ⭐ NEW
│   └── comic-pages-panels-layouts-guide.md
├── gemini/                         # Gemini-specific research
│   └── character-consistency-guide.md
├── drafts/                         # Code drafts for review
│   └── enhanced-types.ts
├── 01.project/                     # Project management
│   └── chat-sessions/              # Session logs
└── README.md
```

## Batch Overview

| Batch | Issues | Focus | Status |
|-------|--------|-------|--------|
| 1 | B, H | Core generation pipeline, 4-layer consistency | ✅ **Completed** |
| 2 | I, J | Novel Mode batch-of-3, choice reroll fix | ✅ **Completed** |
| 3 | E, F, G | Character & outline management | 🔄 **Ready** (Enhanced with comic fundamentals) |
| 4 | C, D | Reroll enhancements, AI prompt assist | 📋 Planned (Enhanced) |
| 5 | A, K | Responsive design, mode selection cards | ⏳ Pending |
| **6** | **L, M, N, O** | **Multi-panel layouts, advanced lettering** | 📋 **Planned (NEW)** |

---

## Key Research Documents

### Comic Fundamentals Guide ⭐ NEW
**Location:** `comic-fundamentals/comic-pages-panels-layouts-guide.md`

Comprehensive guide covering professional comic conventions:
- **Panel Types**: Regular, splash, horizontal, vertical, inset, diagonal, borderless
- **Page Layouts**: 2x2, 2x3, 3x3 grids, asymmetric compositions
- **McCloud's 6 Transitions**: moment-to-moment, action-to-action, subject-to-subject, scene-to-scene, aspect-to-aspect, non-sequitur
- **Pacing Control**: Panel density affects reading speed
- **Balloon Shapes**: Oval (normal), burst (shouting), wavy (weak), dashed (whisper)
- **Caption Colors**: Yellow (narration), character-specific, sepia (flashback)
- **Flashback Styling**: Sepia tones, soft vignette edges

### Gemini Character Consistency Guide
**Location:** `gemini/character-consistency-guide.md`

Critical findings:
- Gemini has **NO true identity lock** - consistency must be enforced through prompting
- **4-Layer System** required: References → Identity Headers → Scene Reinforcement → Consistency Instructions
- **Hard Negatives** prevent AI drift (e.g., "no bangs", "no glasses")
- **Reference Chaining** - use most recent "good" panel, not just original portrait
- Facial drift occurs after 5-10 generations without mitigation

---

## Issue Reference

### Completed (Batch 1+2)
- ✅ **B** - Character Consistency Workflow Overhaul (4-layer system)
- ✅ **H** - Gemini Consistency Degradation Fix + Hybrid Fallback
- ✅ **I** - Novel Mode Choice Page Reroll Fix (previousChoices tracking)
- ✅ **J** - Novel Mode Batch-of-3 Generation

### Batch 3: Character & Outline Management (Enhanced)
- **E** - Smart Character-to-Panel Assignment
  - Now includes: panel layout selection, shot type, transition type
- **F** - Editable Outline at Any Time
  - Now includes: per-page comic fundamentals (layout, shot, flashback toggle)
- **G** - Add Characters Anytime + AI Analysis

### Batch 4: Reroll Enhancements (Enhanced)
- **C** - AI-Enhanced Outline + Reroll Prompt Assistance
- **D** - Editable Character Description on Reroll
  - Now includes: shot type selector, balloon shape override, flashback toggle

### Batch 5: UI/UX Polish
- **A** - Responsive Design (Desktop/Tablet/Mobile)
- **K** - Mode Selection Card-Based Workflow

### Batch 6: Multi-Panel & Advanced Features (NEW)
- **L** - Multi-Panel Page Generation (2x2, 2x3, 3x3, asymmetric)
- **M** - Dynamic Panel Composition (tension patterns, knocked walls)
- **N** - Advanced Lettering (balloon shapes, caption colors, SFX)
- **O** - Sequential Context (reference chaining, transition awareness)

---

## Implementation Timeline

```
Week 1: Batch 3 (Enhanced) - Character & Outline with Comic Fundamentals
        ├── Panel layout types
        ├── Shot type selection
        ├── Transition-aware outlines
        └── Flashback support

Week 2: Batch 4 (Enhanced) - Reroll with Visual Controls
        ├── Shot type in reroll
        ├── Balloon shape override
        └── AI prompt enhancement

Week 3: Batch 5 - Responsive & Mode Selection
        ├── Mobile/tablet layouts
        └── Mode selection cards

Week 4+: Batch 6 - Multi-Panel (Ambitious)
        ├── Panel-by-panel generation
        ├── Page compositing
        └── Advanced lettering
```

---

## Technical Decisions Made

### 4-Layer Consistency (Implemented)
1. **Layer 1**: Reference images attached to every generation
2. **Layer 2**: `formatIdentityHeader()` - structured visual identity
3. **Layer 3**: `formatReinforcedScene()` - key features in scene description
4. **Layer 4**: `formatConsistencyInstruction()` - hard negatives at prompt end

### Novel Mode Batch Size
- Fixed at 3 pages per batch (`NOVEL_MODE_BATCH_SIZE = 3`)
- Allows meaningful choice impact before next decision point

### Regeneration Modes
- `full`: Complete regeneration
- `characters_only`: Keep background, refresh characters
- `expression_only`: Same everything, change face
- `outfit_only`: Same everything, change clothes

### Comic Fundamentals Integration
- **Enhanced outlines** include: layout, shot, transition, beat type, pacing
- **Image prompts** receive: shot framing, flashback styling
- **Reroll modal** offers: shot override, balloon shape, flashback toggle

---

## Files Changed (Cumulative)

| File | Batch | Changes |
|------|-------|---------|
| `types.ts` | 1+2 | IdentityHeader, RegenerationMode, helper functions |
| `App.tsx` | 1+2 | 4-layer system, Novel Mode batch, choice reroll |
| `RerollModal.tsx` | 1+2 | Regeneration modes, original prompt display |
| `Setup.tsx` | 1+2 | Tutorial updates, mode labels |

---

*Document Version: 2.0*
*Last Updated: March 2026*
