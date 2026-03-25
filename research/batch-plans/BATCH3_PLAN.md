# Batch 3 Implementation Plan: Character & Outline Management

## Overview

Batch 3 addresses three interconnected features:
- **E.** Smart Character-to-Panel Assignment in Outline
- **F.** Editable Outline at Any Time
- **G.** Add Characters Anytime + AI Character Analysis

## Current State (Problems)

| Area | Current Behavior | Problem |
|------|-----------------|---------|
| Characters | ALL characters sent to EVERY page | No control over who appears where |
| Outline | One monolithic text blob | No per-page structure |
| Editing | Locked after launch | Can't iterate mid-project |
| Adding | Only during setup | Can't introduce new characters later |

## New Data Structures

### 1. Enhanced StoryOutline (types.ts)

```typescript
interface PageCharacterPlan {
  pageIndex: number;
  primaryCharacters: string[];      // IDs: 'hero', 'friend', or additionalCharacter.id
  secondaryCharacters?: string[];   // May appear but not focus
  focusCharacter: string;           // Who's the star of this page
  sceneDescription?: string;        // Brief scene summary from outline
  isDecisionPage: boolean;
}

interface StoryOutline {
  content: string;                  // Full narrative text
  pageBreakdown: PageCharacterPlan[]; // NEW: Per-page plans
  isReady: boolean;
  isGenerating: boolean;
  lastEditedAt?: number;            // NEW: Track edits
  version?: number;                 // NEW: For conflict detection
}
```

### 2. Enhanced Persona (types.ts)

```typescript
interface Persona {
  // Existing fields...
  id: string;
  name: string;
  base64: string;
  // ...

  // NEW FIELDS
  addedAt?: number;               // Timestamp when added
  isIntroduced?: boolean;         // Has appeared in comic yet?
  firstAppearancePage?: number;   // Which page first appears
  appearancePages?: number[];     // All pages where they appear
}
```

### 3. Character Profile Cache

```typescript
interface CharacterProfileCache {
  [characterId: string]: {
    profile: CharacterProfile;
    generatedAt: number;
    source: 'initial_setup' | 'mid_project_add' | 'manual_reanalyze';
  };
}
```

---

## Feature E: Smart Character-to-Panel Assignment

### Implementation Steps

#### Step E1: Enhanced Outline Generation
**File:** `App.tsx` - `generateOutline()`

Modify the outline prompt to return structured data:

```typescript
const prompt = `
Generate a ${config.MAX_STORY_PAGES}-page comic outline.

IMPORTANT: For EACH page, specify:
1. Page number
2. Which characters appear (from: ${characterNames.join(', ')})
3. Who is the FOCUS character
4. Brief scene description (1-2 sentences)

FORMAT YOUR RESPONSE AS:
PAGE 1:
- Characters: Hero, Co-Star
- Focus: Hero
- Scene: [description]

PAGE 2:
...
`;
```

#### Step E2: Outline Parser
**File:** `App.tsx` - new function `parseOutlineToPagePlans()`

```typescript
const parseOutlineToPagePlans = (outlineText: string): PageCharacterPlan[] => {
  const plans: PageCharacterPlan[] = [];
  const pageRegex = /PAGE (\d+):\s*\n- Characters: (.+)\n- Focus: (.+)\n- Scene: (.+)/gi;

  let match;
  while ((match = pageRegex.exec(outlineText)) !== null) {
    plans.push({
      pageIndex: parseInt(match[1]),
      primaryCharacters: match[2].split(',').map(c => mapNameToId(c.trim())),
      focusCharacter: mapNameToId(match[3].trim()),
      sceneDescription: match[4].trim(),
      isDecisionPage: config.DECISION_PAGES.includes(parseInt(match[1]))
    });
  }
  return plans;
};
```

#### Step E3: Character Filtering in Generation
**File:** `App.tsx` - `generateImage()`

```typescript
// Get characters for this specific page
const pagePlan = storyOutline.pageBreakdown?.[pageNum];
const charactersForPage = pagePlan?.primaryCharacters || ['hero', 'friend'];

// Only include planned characters
if (charactersForPage.includes('hero') && heroRef.current?.base64) {
  contents.push({ text: "REFERENCE [HERO] - APPEARS THIS PAGE:" });
  contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
}
// Similar for friend and additional characters...
```

#### Step E4: Character Assignment UI in OutlineStepDialog
**File:** `OutlineStepDialog.tsx`

Add per-page character toggles:
- Show each page as a card
- Checkboxes for each character
- AI "Suggest" button to auto-assign based on scene

---

## Feature F: Editable Outline at Any Time

### Implementation Steps

#### Step F1: New Outline Editor Modal
**File:** NEW `OutlineEditorModal.tsx`

```tsx
interface OutlineEditorModalProps {
  outline: StoryOutline;
  onSave: (newOutline: StoryOutline) => void;
  onRegenerate: (fromPage: number) => void;
  onClose: () => void;
  currentPage: number;
}
```

Features:
- Full-text editor for outline
- Per-page breakdown view (tabs or accordion)
- "Regenerate from page X" dropdown
- "Save changes" vs "Save & Regenerate" buttons

#### Step F2: Outline Access Button
**File:** `App.tsx` - add to top-right nav during reading

```tsx
{isStarted && !showSetup && storyOutline.content && (
  <button onClick={() => setShowOutlineEditor(true)}>
    ✏️ EDIT OUTLINE
  </button>
)}
```

#### Step F3: Outline Update Handler
**File:** `App.tsx`

```typescript
const handleOutlineUpdate = async (
  newContent: string,
  regenerateFrom?: number
) => {
  // Update outline
  setStoryOutline(prev => ({
    ...prev,
    content: newContent,
    lastEditedAt: Date.now(),
    version: (prev.version || 0) + 1,
    pageBreakdown: null // Invalidate - will re-parse
  }));

  // Re-parse page plans
  const newPlans = parseOutlineToPagePlans(newContent);
  setStoryOutline(prev => ({ ...prev, pageBreakdown: newPlans }));

  // Optionally regenerate pages
  if (regenerateFrom !== undefined) {
    // Clear pages from regenerateFrom onwards
    setComicFaces(prev => prev.filter(f =>
      f.pageIndex === undefined || f.pageIndex < regenerateFrom
    ));
    // Trigger regeneration
    generateBatch(regenerateFrom, config.TOTAL_PAGES - regenerateFrom + 1);
  }
};
```

#### Step F4: Conflict Resolution Dialog
When user edits outline and pages already exist:

```tsx
<dialog>
  <h3>Outline Changed</h3>
  <p>Pages {affectedPages.join(', ')} may no longer match the outline.</p>
  <button onClick={() => regenerateAffected()}>Regenerate Affected Pages</button>
  <button onClick={() => keepExisting()}>Keep Existing (ignore mismatch)</button>
</dialog>
```

---

## Feature G: Add Characters Anytime

### Implementation Steps

#### Step G1: Mid-Project Add Character Button
**File:** `App.tsx` - top-right nav

```tsx
{isStarted && !showSetup && (
  <button onClick={() => setShowAddCharacterModal(true)}>
    ➕ ADD CHARACTER
  </button>
)}
```

#### Step G2: Quick Add Character Modal
**File:** NEW `AddCharacterModal.tsx`

Simplified version of Setup's CharacterCard:
- Portrait upload (required)
- Name input
- Brief description
- Optional reference images
- "ADD & ANALYZE" button

#### Step G3: On-Demand Profile Analysis
**File:** `App.tsx`

```typescript
const handleAddCharacterMidProject = async (newChar: Persona) => {
  // Add timestamp
  newChar.addedAt = Date.now();
  newChar.isIntroduced = false;

  // Add to state
  setAdditionalCharacters(prev => [...prev, newChar]);
  additionalCharsRef.current = [...additionalCharsRef.current, newChar];

  // Immediately analyze
  setIsAnalyzingNewCharacter(true);
  const profile = await generateCharacterProfile(newChar, true);

  // Add to cache
  characterProfilesRef.current = [
    ...characterProfilesRef.current,
    profile
  ];

  setIsAnalyzingNewCharacter(false);

  // Show success
  toast(`${newChar.name} added! They'll appear in future pages.`);
};
```

#### Step G4: Character Introduction Logic
**File:** `App.tsx` - `generateBeat()`

```typescript
// Check for new characters not yet introduced
const newCharacters = additionalCharsRef.current.filter(c =>
  c.addedAt && !c.isIntroduced
);

if (newCharacters.length > 0) {
  baseInstruction += `
    NEW CHARACTER AVAILABLE: ${newCharacters.map(c => c.name).join(', ')}
    Consider introducing them naturally if it fits the scene.
  `;
}

// After generation, mark as introduced
newCharacters.forEach(c => {
  c.isIntroduced = true;
  c.firstAppearancePage = pageNum;
});
```

#### Step G5: Per-Page Character Toggle in Reroll
**File:** `RerollModal.tsx`

Add section:
```tsx
<div className="character-selection">
  <h4>Characters for this page:</h4>
  {allCharacters.map(char => (
    <label key={char.id}>
      <input
        type="checkbox"
        checked={selectedCharacters.includes(char.id)}
        onChange={() => toggleCharacter(char.id)}
      />
      <img src={char.base64} />
      {char.name}
    </label>
  ))}
</div>
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `types.ts` | Add `PageCharacterPlan`, enhance `StoryOutline`, enhance `Persona` |
| `App.tsx` | Add outline editing handlers, mid-project character add, per-page filtering |
| `OutlineStepDialog.tsx` | Add character assignment UI per page |
| NEW `OutlineEditorModal.tsx` | Full outline editor for mid-project |
| NEW `AddCharacterModal.tsx` | Quick character add during reading |
| `RerollModal.tsx` | Add per-page character toggles |
| `Panel.tsx` | (Minor) Add "Edit Outline" access point |

---

## Implementation Order

1. **Phase 1: Data Structures** (30 min)
   - Update `types.ts` with new interfaces
   - Ensure backward compatibility with existing drafts

2. **Phase 2: Outline Enhancement** (1 hr)
   - Modify `generateOutline()` for structured output
   - Add `parseOutlineToPagePlans()` function
   - Update `OutlineStepDialog` with character assignment UI

3. **Phase 3: Editable Outline** (1 hr)
   - Create `OutlineEditorModal.tsx`
   - Add outline update handlers
   - Implement regeneration logic

4. **Phase 4: Add Characters Anytime** (1 hr)
   - Create `AddCharacterModal.tsx`
   - Add on-demand profile analysis
   - Implement character introduction logic

5. **Phase 5: Integration & Testing** (30 min)
   - Connect all pieces
   - Test edge cases
   - Update draft export/import

---

## Edge Cases to Handle

1. **Outline parse failure** → Fall back to using full outline as context
2. **Character added but outline says "Hero only"** → User can override via reroll
3. **Outline edited to remove character from future pages** → Warn but allow
4. **Draft loaded without pageBreakdown** → Re-parse on load
5. **Character deleted mid-project** → Remove from future plans, keep in past pages
