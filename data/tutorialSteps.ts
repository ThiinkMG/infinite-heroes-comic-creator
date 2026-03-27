/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TutorialStep } from '../hooks/useTutorial';

/**
 * Tutorial steps for the Setup screen
 */
export const SETUP_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Infinite Heroes!',
    description: 'Let me show you how to create your own AI-powered comic book. This quick tour will guide you through the main features.',
    position: 'center',
    canSkip: true,
  },
  {
    id: 'hero-section',
    title: 'Create Your Hero',
    description: 'Start by giving your hero a name and uploading a portrait image. The AI will use this to maintain character consistency throughout your comic.',
    targetSelector: '[data-tutorial="hero-card"]',
    position: 'right',
    canSkip: true,
  },
  {
    id: 'hero-portrait',
    title: 'Hero Portrait',
    description: 'Upload a clear face image of your hero. For best results, use a portrait with good lighting and the face clearly visible. This is the most important reference for character consistency.',
    targetSelector: '[data-tutorial="hero-portrait"]',
    position: 'bottom',
    canSkip: true,
  },
  {
    id: 'reference-images',
    title: 'Reference Images',
    description: 'Add extra reference images showing your character from different angles, in different poses, or with specific costume details. More references = better consistency!',
    targetSelector: '[data-tutorial="hero-refs"]',
    position: 'bottom',
    canSkip: true,
  },
  {
    id: 'emblem-section',
    title: 'Character Emblem',
    description: 'Upload your hero\'s logo or emblem. Choose where it appears (chest, back, shoulder) and the AI will include it in generated panels.',
    targetSelector: '[data-tutorial="hero-emblem"]',
    position: 'bottom',
    canSkip: true,
  },
  {
    id: 'costar-section',
    title: 'Add a Co-Star',
    description: 'Every hero needs a sidekick or supporting character! Add a co-star with their own portrait and references for dynamic duo scenes.',
    targetSelector: '[data-tutorial="costar-card"]',
    position: 'left',
    canSkip: true,
  },
  {
    id: 'story-settings',
    title: 'Story Settings',
    description: 'Choose your genre, art style, and language. Each genre has different narrative tones and visual aesthetics.',
    targetSelector: '[data-tutorial="story-settings"]',
    position: 'top',
    canSkip: true,
  },
  {
    id: 'story-description',
    title: 'Describe Your Story',
    description: 'Write a brief description of your story premise. Be creative! You can also use the AI Improve button to enhance your description.',
    targetSelector: '[data-tutorial="story-description"]',
    position: 'top',
    canSkip: true,
  },
  {
    id: 'generation-mode',
    title: 'Choose Your Mode',
    description: 'Outline Mode: AI creates a full story outline you can edit before generation. Novel Mode: Interactive story where you make choices at key moments.',
    targetSelector: '[data-tutorial="generation-mode"]',
    position: 'top',
    canSkip: true,
  },
  {
    id: 'launch-button',
    title: 'Launch Your Comic!',
    description: 'When you\'re ready, click "Create My Comic" to start generating. The AI will first analyze your characters, then create your comic page by page.',
    targetSelector: '[data-tutorial="launch-button"]',
    position: 'top',
    canSkip: true,
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'That\'s the basics! You can also import/export drafts, use presets, and access the tutorial again from the help menu. Now go create something amazing!',
    position: 'center',
    canSkip: false,
  },
];

/**
 * Tutorial steps for the Book/Reader screen
 */
export const READER_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'reader-intro',
    title: 'Your Comic is Ready!',
    description: 'Your comic pages are displayed in a book format. Use the controls to navigate and interact with your creation.',
    position: 'center',
    canSkip: true,
  },
  {
    id: 'page-navigation',
    title: 'Navigate Pages',
    description: 'Use the arrows or keyboard (Left/Right) to flip through pages. On mobile, you can also swipe!',
    targetSelector: '[data-tutorial="page-nav"]',
    position: 'top',
    canSkip: true,
  },
  {
    id: 'reroll-panel',
    title: 'Regenerate Panels',
    description: 'Not happy with a panel? Click the reroll button to regenerate it with different options, references, or instructions.',
    targetSelector: '[data-tutorial="reroll-button"]',
    position: 'left',
    canSkip: true,
  },
  {
    id: 'gallery-view',
    title: 'Gallery View',
    description: 'Click the gallery button to see all pages at once. You can download individual pages or batch regenerate multiple panels.',
    targetSelector: '[data-tutorial="gallery-button"]',
    position: 'bottom',
    canSkip: true,
  },
  {
    id: 'export-comic',
    title: 'Export Your Comic',
    description: 'When you\'re satisfied, use the export button to download your comic as a PDF or individual images.',
    targetSelector: '[data-tutorial="export-button"]',
    position: 'bottom',
    canSkip: true,
  },
];

/**
 * Quick tips shown during generation
 */
export const GENERATION_TIPS: string[] = [
  'Tip: More reference images = better character consistency',
  'Tip: Use clear, well-lit portraits for best results',
  'Tip: The AI works best with distinct character designs',
  'Tip: You can regenerate any panel you\'re not happy with',
  'Tip: Save your draft to continue working later',
  'Tip: Try different art styles for unique looks',
  'Tip: Add emblems and weapons for superhero authenticity',
  'Tip: The outline mode gives you more control over the story',
];

export default SETUP_TUTORIAL_STEPS;
