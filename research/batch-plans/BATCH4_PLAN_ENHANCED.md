# Batch 4 Implementation Plan: Reroll & Prompt Enhancements (ENHANCED)

> **Updated:** March 2026
> **Enhancement Source:** Comic Fundamentals Research

## Original Issues
- **C.** AI-Enhanced Outline Generation + Reroll Prompt Assistance
- **D.** Editable Character Description on Reroll

## NEW: Comic Fundamentals Integration

The reroll modal should allow users to control comic-specific visual elements.

---

## Enhanced Reroll Modal Features

### 1. Panel Type Override

```typescript
interface RerollOptions {
  // Existing
  instruction: string;
  selectedRefImages: string[];
  selectedProfileIds: string[];
  regenerationMode: RegenerationMode;

  // NEW: Comic Fundamentals
  panelLayoutOverride?: PanelLayout;
  shotTypeOverride?: ShotType;
  applyFlashbackStyle?: boolean;
  balloonShapeOverride?: BalloonShape;
}
```

### 2. Shot Type Selector

Allow users to control camera framing during reroll:

```tsx
<div className="shot-selector">
  <p className="font-comic text-sm font-bold uppercase">📷 Camera Shot</p>
  <div className="grid grid-cols-3 gap-2">
    {[
      { shot: 'extreme-close-up', icon: '👁️', label: 'Extreme Close-up' },
      { shot: 'close-up', icon: '😊', label: 'Close-up' },
      { shot: 'medium', icon: '🧍', label: 'Medium' },
      { shot: 'full', icon: '🧑', label: 'Full Body' },
      { shot: 'wide', icon: '🏙️', label: 'Wide' },
      { shot: 'extreme-wide', icon: '🌆', label: 'Establishing' },
    ].map(opt => (
      <button
        key={opt.shot}
        className={`shot-btn ${selectedShot === opt.shot ? 'selected' : ''}`}
        onClick={() => setSelectedShot(opt.shot)}
      >
        <span className="icon">{opt.icon}</span>
        <span className="label">{opt.label}</span>
      </button>
    ))}
  </div>
</div>
```

### 3. Balloon Shape Override

For pages with dialogue, allow balloon shape customization:

```tsx
<div className="balloon-selector">
  <p className="font-comic text-sm font-bold uppercase">💬 Dialogue Style</p>
  <div className="flex flex-wrap gap-2">
    {[
      { shape: 'oval', label: 'Normal' },
      { shape: 'burst', label: 'Shouting!' },
      { shape: 'wavy', label: 'Weak...' },
      { shape: 'dashed', label: 'Whisper' },
      { shape: 'jagged', label: 'Radio/Phone' },
      { shape: 'rectangle', label: 'Robot/AI' },
    ].map(opt => (
      <button
        key={opt.shape}
        className={`balloon-btn ${selectedBalloon === opt.shape ? 'selected' : ''}`}
        onClick={() => setSelectedBalloon(opt.shape)}
      >
        {opt.label}
      </button>
    ))}
  </div>
</div>
```

### 4. Flashback Toggle

```tsx
<label className="flashback-toggle flex items-center gap-2 p-2 border-2 cursor-pointer">
  <input
    type="checkbox"
    checked={applyFlashback}
    onChange={(e) => setApplyFlashback(e.target.checked)}
  />
  <span className="font-comic text-sm font-bold">📜 Apply Flashback Styling</span>
  <span className="text-xs text-gray-500">(Sepia tones, soft edges)</span>
</label>
```

### 5. AI Enhance Button (Enhanced)

The AI enhancement now considers comic fundamentals:

```typescript
const enhanceRerollPrompt = async (
  userPrompt: string,
  sceneContext: Beat,
  characters: CharacterProfile[],
  pagePlan?: PageCharacterPlan
): Promise<EnhancedPromptSuggestion> => {
  const prompt = `
You are a comic book art director helping refine a panel regeneration request.

USER'S REQUEST: "${userPrompt}"

SCENE CONTEXT: ${sceneContext.scene}
CHARACTERS PRESENT: ${characters.map(c => c.name).join(', ')}
${pagePlan ? `
PLANNED LAYOUT: ${pagePlan.panelLayout}
SUGGESTED SHOT: ${pagePlan.suggestedShot}
EMOTIONAL BEAT: ${pagePlan.emotionalBeat}
` : ''}

Provide:
1. Enhanced prompt (clearer, more specific, comic-appropriate)
2. Recommended shot type (extreme-close-up, close-up, medium, full, wide)
3. Recommended balloon style if dialogue present
4. Any additional visual suggestions

FORMAT AS JSON:
{
  "enhancedPrompt": "...",
  "recommendedShot": "...",
  "recommendedBalloon": "...",
  "visualSuggestions": ["...", "..."]
}
`;

  // ... API call
};
```

---

## Enhanced UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ 🎲 REROLL PAGE 5                                      [✕]  │
├─────────────────────────────────────────────────────────────┤
│ 🔄 Regeneration Mode                                        │
│ [● Full Reroll] [○ Characters] [○ Expression] [○ Outfit]   │
├─────────────────────────────────────────────────────────────┤
│ 📷 Camera Shot                                              │
│ [👁️ XCU] [😊 CU] [🧍 Med] [🧑 Full] [🏙️ Wide] [🌆 Est]    │
├─────────────────────────────────────────────────────────────┤
│ 💬 Dialogue Style (if applicable)                           │
│ [Normal] [Shouting!] [Weak...] [Whisper] [Radio] [Robot]   │
├─────────────────────────────────────────────────────────────┤
│ ☐ 📜 Apply Flashback Styling (sepia, soft edges)           │
├─────────────────────────────────────────────────────────────┤
│ ✍️ Regeneration Instructions                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Make the hero look more determined, add dramatic        │ │
│ │ shadows on his face...                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [✨ AI Enhance Prompt]                                      │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Original Prompt (Debug)  [▶ Expand]                     │
├─────────────────────────────────────────────────────────────┤
│ 👥 Characters                                               │
│ ☑ Hero ▼ (click to edit profile)                           │
│ ☑ Co-Star                                                   │
│ ☐ Villain                                                   │
├─────────────────────────────────────────────────────────────┤
│ 🖼️ Reference Images (5/8 selected)                         │
│ [thumbnails...]                                             │
├─────────────────────────────────────────────────────────────┤
│              [🎲 REGENERATE PAGE 5]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. **Phase 1: Data Types** (15 min)
   - Add shot type and balloon shape to reroll options
   - Update handleRerollSubmit signature

2. **Phase 2: Shot Selector UI** (30 min)
   - Add shot type buttons to RerollModal
   - Style with comic-themed icons

3. **Phase 3: Balloon Selector UI** (30 min)
   - Add balloon shape buttons
   - Only show when page has dialogue

4. **Phase 4: Flashback Toggle** (15 min)
   - Add checkbox for flashback styling
   - Pass to image generation

5. **Phase 5: Image Prompt Integration** (30 min)
   - Inject shot type into prompts
   - Inject balloon shape instructions
   - Apply flashback styling

6. **Phase 6: AI Enhancement** (45 min)
   - Update enhancement prompt
   - Parse structured suggestions
   - Auto-apply recommendations

---

## Files Changed

| File | Changes |
|------|---------|
| `types.ts` | Add `ShotType`, `BalloonShape` to reroll options |
| `RerollModal.tsx` | Shot selector, balloon selector, flashback toggle |
| `App.tsx` | Pass new options through handleRerollSubmit → generateImage |
