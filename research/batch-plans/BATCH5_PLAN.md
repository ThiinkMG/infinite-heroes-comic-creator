# Batch 5 Implementation Plan: UI/UX Polish

**Status:** ⏳ Pending (Final batch)

## Issues Covered

- **A.** Responsive Design (Desktop/Tablet/Mobile)
- **K.** Mode Selection Card-Based Workflow

## Objectives

### Issue A: Responsive Design

Optimize entire application for three breakpoints:
- **Desktop:** 1024px+ (current primary target)
- **Tablet:** 768px - 1023px
- **Mobile:** < 768px

### Issue K: Mode Selection Workflow

Replace checkbox-based mode selection with polished card-based flow:
1. Click "Start Adventure" → Mode selection screen
2. Visual cards with descriptions
3. Confirmation popup before proceeding

## Planned Changes

### Issue A: Responsive Breakpoints

```css
/* Tailwind breakpoint strategy */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Components Requiring Responsive Updates

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Setup.tsx | 2-column | 2-column stacked | 1-column |
| Book.tsx | Full book view | Full book | Single page |
| Panel.tsx | Hover controls | Touch controls | Touch + bottom bar |
| RerollModal.tsx | Wide modal | Full width | Full screen |
| Modals (all) | Centered | Centered | Bottom sheet |
| Navigation | Top-right | Top-right | Bottom bar |

### Issue K: Mode Selection Cards

```tsx
interface ModeCard {
  id: 'novel' | 'outline';
  title: string;
  description: string;
  features: string[];
  icon: string;
}

const modes: ModeCard[] = [
  {
    id: 'novel',
    title: 'Novel Mode',
    description: 'Interactive story with choices',
    features: [
      'Generate 3 pages at a time',
      'Make decisions that shape the story',
      'Rich dialogue and character moments'
    ],
    icon: '🎲'
  },
  {
    id: 'outline',
    title: 'Outline Mode',
    description: 'Full automation from plot outline',
    features: [
      'AI generates complete story outline',
      'Review and edit before generation',
      'Fully automated comic creation'
    ],
    icon: '📖'
  }
];
```

### New Component: ModeSelectionScreen

```tsx
// Shown after clicking "Start Adventure"
const ModeSelectionScreen: React.FC<{
  onSelect: (mode: 'novel' | 'outline') => void;
  onBack: () => void;
}> = ({ onSelect, onBack }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="mode-selection">
      <h2>Choose Your Adventure Style</h2>
      <div className="mode-cards">
        {modes.map(mode => (
          <ModeCard
            key={mode.id}
            {...mode}
            isSelected={selected === mode.id}
            onClick={() => {
              setSelected(mode.id);
              setShowConfirm(true);
            }}
          />
        ))}
      </div>
      {showConfirm && (
        <ConfirmDialog
          mode={selected}
          onConfirm={() => onSelect(selected as any)}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};
```

### Confirmation Dialog

```
┌─────────────────────────────────────┐
│                                     │
│   Continue with Novel Mode? 🎲      │
│                                     │
│   You'll generate 3 pages at a      │
│   time and make story choices.      │
│                                     │
│   [Continue]              [✕]       │
│                                     │
└─────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Mode Selection (Issue K)
1. Create `ModeSelectionScreen.tsx`
2. Modify `Setup.tsx` launch flow
3. Add confirmation dialog
4. Remove checkbox from setup

### Phase 2: Responsive Foundation (Issue A)
1. Audit all components for hardcoded widths
2. Add responsive utility classes
3. Create mobile navigation component

### Phase 3: Component-by-Component Responsive
1. Setup.tsx responsive layout
2. Book.tsx touch gestures + single-page mobile
3. All modals → bottom sheets on mobile
4. Panel controls → touch-friendly

### Phase 4: Testing & Polish
1. Test all breakpoints
2. Touch target sizing (min 44px)
3. Font scaling
4. Animation performance on mobile

## Dependencies

- Should be done last (UI changes on stable codebase)
- Can parallelize A and K with separate agents

## Implementation Notes

*Detailed implementation will begin after Batch 4 completes.*
*This batch can be parallelized internally (A and K are independent).*
