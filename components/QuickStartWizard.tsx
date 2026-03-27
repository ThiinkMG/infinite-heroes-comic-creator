/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Persona } from '../types';
import { GENRES, ART_STYLES, PAGE_LENGTHS } from '../types';

export interface QuickStartWizardProps {
  onClose: () => void;
  onComplete: (config: QuickStartConfig) => void;
}

export interface QuickStartConfig {
  heroName: string;
  heroPortrait: string | null;
  genre: string;
  artStyle: string;
  pageLength: number;
  storyPremise: string;
}

type WizardStep = 'welcome' | 'hero' | 'genre' | 'story' | 'confirm';

const STEP_ORDER: WizardStep[] = ['welcome', 'hero', 'genre', 'story', 'confirm'];

const QUICK_STORY_TEMPLATES = [
  { label: 'Origin Story', prompt: 'Tell the origin story of how the hero got their powers and first battle against evil.' },
  { label: 'Save the City', prompt: 'The hero must stop a villain\'s plan to destroy the city before it\'s too late.' },
  { label: 'Team Up', prompt: 'Two heroes meet for the first time and must learn to work together.' },
  { label: 'Mysterious Threat', prompt: 'A new mysterious enemy appears and the hero must uncover their identity.' },
  { label: 'Custom', prompt: '' },
];

/**
 * Quick Start Wizard - 5-step guided setup for new users
 */
export const QuickStartWizard: React.FC<QuickStartWizardProps> = ({
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [config, setConfig] = useState<QuickStartConfig>({
    heroName: '',
    heroPortrait: null,
    genre: GENRES[0] || 'Superhero Action',
    artStyle: ART_STYLES[0] || 'Modern American Comic',
    pageLength: PAGE_LENGTHS[1]?.value || 6,
    storyPremise: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = Math.round(((currentStepIndex + 1) / STEP_ORDER.length) * 100);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex]);
    }
  }, [currentStepIndex]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex]);
    }
  }, [currentStepIndex]);

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setConfig(prev => ({ ...prev, heroPortrait: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateSelect = (index: number) => {
    setSelectedTemplate(index);
    if (QUICK_STORY_TEMPLATES[index].prompt) {
      setConfig(prev => ({ ...prev, storyPremise: QUICK_STORY_TEMPLATES[index].prompt }));
    }
  };

  const handleComplete = () => {
    onComplete(config);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'hero':
        return config.heroName.trim().length > 0;
      case 'genre':
        return true;
      case 'story':
        return config.storyPremise.trim().length > 0;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="text-8xl mb-6">🦸</div>
            <h2 className="font-comic text-3xl font-bold text-white mb-4">
              Create Your First Comic!
            </h2>
            <p className="text-indigo-200 text-lg mb-6 max-w-md mx-auto">
              Let's get you started with a quick 5-step setup.
              You can always customize more details later.
            </p>
            <div className="flex justify-center gap-4 text-indigo-300 text-sm">
              <span>1. Name Hero</span>
              <span>→</span>
              <span>2. Pick Genre</span>
              <span>→</span>
              <span>3. Write Story</span>
              <span>→</span>
              <span>4. Launch!</span>
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="py-6">
            <h2 className="font-comic text-2xl font-bold text-white mb-2 text-center">
              Step 1: Create Your Hero
            </h2>
            <p className="text-indigo-300 text-center mb-6">
              Give your hero a name and optionally upload a portrait
            </p>

            <div className="max-w-md mx-auto space-y-6">
              {/* Hero Name */}
              <div>
                <label className="block text-white font-comic font-bold mb-2">
                  Hero Name *
                </label>
                <input
                  type="text"
                  value={config.heroName}
                  onChange={(e) => setConfig(prev => ({ ...prev, heroName: e.target.value }))}
                  placeholder="e.g., Captain Thunder, The Shadow"
                  className="w-full px-4 py-3 bg-indigo-800 text-white border-3 border-black rounded font-comic placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  autoFocus
                />
              </div>

              {/* Portrait Upload */}
              <div>
                <label className="block text-white font-comic font-bold mb-2">
                  Hero Portrait (Optional)
                </label>
                <div className="flex gap-4 items-center">
                  {config.heroPortrait ? (
                    <div className="relative">
                      <img
                        src={config.heroPortrait}
                        alt="Hero portrait"
                        className="w-24 h-24 object-cover rounded-lg border-3 border-black"
                      />
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, heroPortrait: null }))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold border-2 border-black"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 flex flex-col items-center justify-center bg-indigo-800 border-3 border-dashed border-indigo-500 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                      <span className="text-2xl">📷</span>
                      <span className="text-xs text-indigo-300">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePortraitUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-indigo-400 text-sm flex-1">
                    A portrait helps the AI maintain consistent character appearance.
                    You can add more references later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'genre':
        return (
          <div className="py-6">
            <h2 className="font-comic text-2xl font-bold text-white mb-2 text-center">
              Step 2: Choose Your Style
            </h2>
            <p className="text-indigo-300 text-center mb-6">
              Select a genre and art style for your comic
            </p>

            <div className="max-w-lg mx-auto space-y-6">
              {/* Genre */}
              <div>
                <label className="block text-white font-comic font-bold mb-2">
                  Genre
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GENRES.slice(0, 6).map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setConfig(prev => ({ ...prev, genre }))}
                      className={`px-4 py-3 rounded border-3 border-black font-comic text-sm transition-all ${
                        config.genre === genre
                          ? 'bg-yellow-400 text-black'
                          : 'bg-indigo-800 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Art Style */}
              <div>
                <label className="block text-white font-comic font-bold mb-2">
                  Art Style
                </label>
                <select
                  value={config.artStyle}
                  onChange={(e) => setConfig(prev => ({ ...prev, artStyle: e.target.value }))}
                  className="w-full px-4 py-3 bg-indigo-800 text-white border-3 border-black rounded font-comic focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {ART_STYLES.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              {/* Page Length */}
              <div>
                <label className="block text-white font-comic font-bold mb-2">
                  Story Length
                </label>
                <div className="flex gap-2">
                  {PAGE_LENGTHS.map((pl) => (
                    <button
                      key={pl.value}
                      onClick={() => setConfig(prev => ({ ...prev, pageLength: pl.value }))}
                      className={`flex-1 px-3 py-2 rounded border-2 border-black font-comic text-sm transition-all ${
                        config.pageLength === pl.value
                          ? 'bg-yellow-400 text-black'
                          : 'bg-indigo-800 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {pl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'story':
        return (
          <div className="py-6">
            <h2 className="font-comic text-2xl font-bold text-white mb-2 text-center">
              Step 3: Your Story
            </h2>
            <p className="text-indigo-300 text-center mb-6">
              Choose a template or write your own story premise
            </p>

            <div className="max-w-lg mx-auto space-y-6">
              {/* Story Templates */}
              <div>
                <label className="block text-white font-comic font-bold mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_STORY_TEMPLATES.map((template, index) => (
                    <button
                      key={template.label}
                      onClick={() => handleTemplateSelect(index)}
                      className={`px-4 py-2 rounded border-2 border-black font-comic text-sm transition-all ${
                        selectedTemplate === index
                          ? 'bg-yellow-400 text-black'
                          : 'bg-indigo-800 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Story Premise */}
              <div>
                <label className="block text-white font-comic font-bold mb-2">
                  Story Premise *
                </label>
                <textarea
                  value={config.storyPremise}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, storyPremise: e.target.value }));
                    setSelectedTemplate(null);
                  }}
                  placeholder="Describe your story idea in a few sentences..."
                  rows={4}
                  className="w-full px-4 py-3 bg-indigo-800 text-white border-3 border-black rounded font-comic placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
                <p className="text-indigo-400 text-xs mt-1">
                  {config.storyPremise.length} characters
                </p>
              </div>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="py-6">
            <h2 className="font-comic text-2xl font-bold text-white mb-2 text-center">
              Step 4: Ready to Create!
            </h2>
            <p className="text-indigo-300 text-center mb-6">
              Review your settings and launch your comic
            </p>

            <div className="max-w-md mx-auto bg-indigo-800/50 rounded-lg p-6 border-2 border-indigo-600">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-300">Hero:</span>
                  <span className="text-white font-bold">{config.heroName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-300">Genre:</span>
                  <span className="text-white">{config.genre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-300">Art Style:</span>
                  <span className="text-white">{config.artStyle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-300">Pages:</span>
                  <span className="text-white">{config.pageLength}</span>
                </div>
                <div className="pt-3 border-t border-indigo-600">
                  <span className="text-indigo-300 text-sm">Story:</span>
                  <p className="text-white text-sm mt-1 line-clamp-3">{config.storyPremise}</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <div className="text-6xl mb-2">🚀</div>
              <p className="text-indigo-200">
                Click "Create Comic" to start generating!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickstart-title"
    >
      <div
        className="bg-indigo-950 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-indigo-900 border-b-4 border-black px-6 py-4 flex justify-between items-center shrink-0">
          <h1 id="quickstart-title" className="font-comic text-xl font-bold text-white uppercase tracking-wider">
            Quick Start
          </h1>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-white text-2xl"
            aria-label="Close wizard"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-indigo-900/50">
          <div className="flex justify-between text-xs text-indigo-300 mb-1 font-comic">
            <span>Step {currentStepIndex + 1} of {STEP_ORDER.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-indigo-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-indigo-900 border-t-4 border-black flex justify-between items-center shrink-0">
          <button
            onClick={currentStepIndex === 0 ? onClose : goBack}
            className="comic-btn bg-gray-600 text-white px-6 py-2 border-3 border-black font-bold uppercase tracking-wider text-sm hover:bg-gray-500"
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {currentStep === 'confirm' ? (
            <button
              onClick={handleComplete}
              className="comic-btn bg-green-500 text-white px-8 py-3 border-3 border-black font-bold uppercase tracking-wider hover:bg-green-400"
            >
              Create Comic!
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={`comic-btn px-6 py-2 border-3 border-black font-bold uppercase tracking-wider text-sm ${
                canProceed()
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickStartWizard;
