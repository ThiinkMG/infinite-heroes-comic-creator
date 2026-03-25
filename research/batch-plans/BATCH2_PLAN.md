# Batch 2 Implementation Plan: Novel Mode Fixes

**Status:** 🔄 In Progress (Agent implementing)

## Issues Covered

- **I.** Novel Mode — Choice Page Reroll Fix
- **J.** Novel Mode — Generate in Batches of 3 + Story Panel Update

## Objectives

### Issue I: Choice Page Reroll Fix

**Problem:** Rerolling a choice page regenerates scene but presents the SAME choices.

**Solution:**
1. Pass previous choices to `generateBeat()` with instruction to avoid them
2. Add `previousChoices?: string[]` parameter
3. Prompt: "Generate FRESH, DIFFERENT choices. AVOID: [list]"

### Issue J: Batch-of-3 Generation

**Problem:** Novel Mode generates too many pages at once.

**Solution:**
1. Change batch size to 3 for Novel Mode
2. Pause after each batch for user review
3. Add "Continue Story" button
4. Update Setup tutorial to explain new behavior

## Key Changes

### Constants in types.ts

```typescript
export const NOVEL_MODE_BATCH_SIZE = 3;
```

### State in App.tsx

```typescript
const [awaitingUserContinue, setAwaitingUserContinue] = useState(false);
```

### Modified Functions

- `generateBeat()` - Accept `previousChoices` parameter
- `generateBatch()` - Respect `NOVEL_MODE_BATCH_SIZE` when not in outline mode
- `handleRerollSubmit()` - Pass old choices when rerolling decision pages

### UI Changes

- Panel.tsx: "Continue Story" button after batch of 3
- Setup.tsx: Updated Novel Mode description in tutorial

## Implementation Notes

*This plan is being actively implemented by a background agent.*
*Details will be updated upon completion.*
