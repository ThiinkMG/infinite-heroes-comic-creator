/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export { RegenerationModeSelector } from './RegenerationModeSelector';
export { ReferenceImageGallery, type RefImage } from './ReferenceImageGallery';
export { ProfileSelector } from './ProfileSelector';
export { InstructionInput } from './InstructionInput';
export { ComicFundamentalsOverrides } from './ComicFundamentalsOverrides';
export { TipsPanel } from './TipsPanel';
export { ProfileDrawer } from './ProfileDrawer';

// Phase 1 - V2 Batch Plan components (Task 1.1.x)
export { CurrentImagePreview } from './CurrentImagePreview';
export { QuickPresets, QUICK_PRESETS, type QuickPreset } from './QuickPresets';
export { StrengthSlider, STRENGTH_LEVELS, getStrengthPrompt } from './StrengthSlider';
export { FocusAreaSelector, FOCUS_AREAS, getFocusAreaPrompt, type FocusArea } from './FocusAreaSelector';

// Phase 2 - V2 Batch Plan components (Task 2.1.x, 2.2.x)
export {
    WizardMode,
    type WizardModeProps,
    type WizardStep
} from './WizardMode';

export {
    VariationGallery,
    type VariationGalleryProps,
    type Variation,
    type VariationGenerationOptions
} from './VariationGallery';
