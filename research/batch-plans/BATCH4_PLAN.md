# Batch 4 Implementation Plan: Reroll & Prompt Enhancements

**Status:** ⏳ Pending (Waiting for Batches 1-3)

## Issues Covered

- **C.** AI-Enhanced Outline Generation + Reroll Prompt Assistance
- **D.** Editable Character Description on Reroll

## Objectives

### Issue C: AI-Enhanced Prompts

1. **Outline quality improvement** - Route through Claude for richer output
2. **"AI Enhance" button in reroll modal** - Help users write better prompts
3. **Contextual suggestions** - AI suggests based on scene + characters

### Issue D: Editable Character Description on Reroll

1. **Expandable character checkbox** - Click to view full description
2. **Inline editing** - Edit and save character profile from reroll modal
3. **Real-time update** - Changes apply to current reroll and future generations

## Planned Changes

### New Components

```
RerollModal.tsx enhancements:
├── AI Enhance button
├── Expandable character cards
└── Inline profile editor
```

### New Functions

```typescript
// Enhance user's reroll prompt with AI suggestions
const enhanceRerollPrompt = async (
  userPrompt: string,
  sceneContext: Beat,
  characters: CharacterProfile[]
): Promise<string> => {
  // Call Claude to improve prompt clarity and detail
};

// Update character profile from reroll modal
const updateCharacterFromReroll = (
  characterId: string,
  updates: Partial<CharacterProfile>
) => {
  // Update both Persona and cached CharacterProfile
};
```

### UI Mockup

```
┌─────────────────────────────────────────────┐
│ REROLL PAGE 5                               │
├─────────────────────────────────────────────┤
│ Original Prompt: [collapsed, click to view] │
├─────────────────────────────────────────────┤
│ Your Instructions:                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Make the hero look more determined...   │ │
│ └─────────────────────────────────────────┘ │
│ [✨ AI Enhance]                             │
├─────────────────────────────────────────────┤
│ Characters:                                 │
│ ☑ Hero ▼ (click to expand/edit)           │
│   ┌─────────────────────────────────────┐   │
│   │ Face: Square jaw, blue eyes...      │   │
│   │ Body: Athletic build, 6'2"...       │   │
│   │ [Edit] [Save]                       │   │
│   └─────────────────────────────────────┘   │
│ ☑ Co-Star                                   │
│ ☐ Villain                                   │
├─────────────────────────────────────────────┤
│        [REGENERATE]  [CANCEL]               │
└─────────────────────────────────────────────┘
```

## Dependencies

- Requires Batch 1 (original prompt storage)
- Requires Batch 3 (character profile system enhancements)

## Implementation Notes

*Detailed implementation will begin after Batch 3 completes.*
