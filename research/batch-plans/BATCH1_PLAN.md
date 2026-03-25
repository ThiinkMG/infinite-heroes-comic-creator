# Batch 1 Implementation Plan: Core Generation Pipeline

**Status:** 🔄 In Progress (Agent implementing)

## Issues Covered

- **B.** Character Consistency Workflow Overhaul
- **H.** Gemini Consistency Degradation Fix + Hybrid Fallback

## Objectives

### Issue B: Character Consistency Workflow Overhaul

1. **Audit generation pipeline** - Ensure all character profiles/refs passed to every call
2. **Show original prompt on reroll** - Store and display what was sent to AI
3. **Rebuild/optimize pipeline** - Enforce consistency from first to last page

### Issue H: Gemini Consistency Degradation Fix

1. **Reinforce character data** - Add explicit reinforcement in EVERY image prompt
2. **"Refresh Characters Only" feature** - Keep scene, regenerate only characters
3. **Hybrid fallback exploration** - Document secondary model integration points

## Key Changes

### New Fields in types.ts

```typescript
interface ComicFace {
  // ... existing
  originalPrompt?: string;  // Store full prompt for debugging/reroll
}
```

### New Functions in App.tsx

- `refreshCharactersOnly(pageIndex)` - Regenerate characters without changing scene
- Enhanced `generateImage()` with stronger character reinforcement

### UI Changes

- Panel.tsx: "Refresh Characters Only" button (hover state)
- RerollModal.tsx: Display original prompt with "Copy" button

## Implementation Notes

*This plan is being actively implemented by a background agent.*
*Details will be updated upon completion.*
