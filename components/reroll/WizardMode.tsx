/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
    RegenerationMode,
    ShotType,
    BalloonShape,
    RerollOptions,
    CharacterProfile
} from '../../types';
import { RefImage } from './ReferenceImageGallery';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Wizard step enumeration
 */
export type WizardStep = 'instruction' | 'fix-method' | 'references';

/**
 * Quick preset configuration for Step 2
 * These are Gemini-optimized presets that map to regeneration modes
 */
export interface QuickPreset {
    id: string;
    icon: string;
    label: string;
    description: string;
    modes: RegenerationMode[];
    useRefs: boolean;
    defaultStrength: number;
    promptPrefix?: string;
}

/**
 * Focus area option for targeting specific parts of the image
 */
export interface FocusArea {
    id: string;
    icon: string;
    label: string;
    prompt: string;
}

/**
 * Strength level configuration (prompt-based for Gemini)
 */
export interface StrengthLevel {
    value: number;
    label: string;
    prompt: string;
}

/**
 * Props for the WizardMode component
 */
export interface WizardModeProps {
    /** Current page being rerolled */
    pageIndex: number;
    /** All reference images available */
    allRefImages: RefImage[];
    /** Character profiles available */
    availableProfiles: { id: string; name: string }[];
    /** Full profile data for summary display */
    fullProfiles: CharacterProfile[];
    /** Current image being regenerated (base64) */
    currentImage?: string;
    /** Callback to submit reroll options */
    onSubmit: (options: RerollOptions) => void;
    /** Callback to close/cancel wizard */
    onClose: () => void;
    /** AI text improvement function */
    onImproveText?: (text: string, context?: string, purpose?: 'story_description' | 'regeneration_instruction' | 'backstory') => Promise<string>;
    /** Switch to expert mode */
    onSwitchToExpert?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Quick presets optimized for Gemini's capabilities
 */
export const QUICK_PRESETS: QuickPreset[] = [
    {
        id: 'fix-face',
        icon: '😊',
        label: 'Fix Face',
        description: 'Keep scene, only adjust facial features',
        modes: ['expression_only'],
        useRefs: true,
        defaultStrength: 0.3,
        promptPrefix: 'Keep the exact same scene and pose. Only adjust facial features to better match the reference portrait.'
    },
    {
        id: 'keep-scene',
        icon: '👥',
        label: 'Keep Scene',
        description: 'Preserve background, regenerate characters',
        modes: ['characters_only'],
        useRefs: true,
        defaultStrength: 0.5,
        promptPrefix: 'Preserve the background and scene composition. Regenerate characters to match references.'
    },
    {
        id: 'fix-costume',
        icon: '⭐',
        label: 'Fix Costume',
        description: 'Keep face and pose, update outfit/emblem',
        modes: ['outfit_only', 'emblem_only'],
        useRefs: true,
        defaultStrength: 0.5,
        promptPrefix: 'Keep face and pose. Update costume, emblem, and accessories to match references.'
    },
    {
        id: 'full-redo',
        icon: '🎲',
        label: 'Full Redo',
        description: 'Completely regenerate the entire panel',
        modes: ['full'],
        useRefs: true,
        defaultStrength: 1.0
    }
];

/**
 * Focus areas for targeting specific parts of the image
 */
export const FOCUS_AREAS: FocusArea[] = [
    { id: 'face', icon: '😊', label: 'Face', prompt: 'Focus changes on the character\'s face and expression.' },
    { id: 'body', icon: '🧍', label: 'Body', prompt: 'Focus changes on the character\'s full body and pose.' },
    { id: 'costume', icon: '👔', label: 'Costume', prompt: 'Focus changes on clothing, armor, and accessories.' },
    { id: 'background', icon: '🏙️', label: 'Background', prompt: 'Focus changes on the background and environment.' }
];

/**
 * Strength levels (prompt-based for Gemini since it doesn't support true strength parameter)
 */
export const STRENGTH_LEVELS: StrengthLevel[] = [
    { value: 0.3, label: 'Subtle', prompt: 'Make subtle, minimal adjustments to' },
    { value: 0.5, label: 'Moderate', prompt: 'Moderately update and refine' },
    { value: 0.7, label: 'Significant', prompt: 'Significantly change and improve' },
    { value: 1.0, label: 'Complete', prompt: 'Completely redesign and recreate' }
];

// ============================================================================
// WIZARD MODE COMPONENT
// ============================================================================

export const WizardMode: React.FC<WizardModeProps> = ({
    pageIndex,
    allRefImages,
    availableProfiles,
    fullProfiles,
    currentImage,
    onSubmit,
    onClose,
    onImproveText,
    onSwitchToExpert
}) => {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------

    // Current wizard step
    const [currentStep, setCurrentStep] = useState<WizardStep>('instruction');

    // Step 1: Instruction
    const [instruction, setInstruction] = useState('');
    const [isImprovingInstruction, setIsImprovingInstruction] = useState(false);

    // Step 2: Fix method
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [strength, setStrength] = useState(0.5);
    const [selectedFocusAreas, setSelectedFocusAreas] = useState<Set<string>>(new Set());

    // Step 3: References
    const [selectedRefIds, setSelectedRefIds] = useState<Set<string>>(
        new Set(allRefImages.map(r => r.id))
    );
    const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(
        new Set(availableProfiles.map(p => p.id))
    );

    // -------------------------------------------------------------------------
    // STEP NAVIGATION
    // -------------------------------------------------------------------------

    const steps: { key: WizardStep; label: string; icon: string }[] = [
        { key: 'instruction', label: "What's wrong?", icon: '1' },
        { key: 'fix-method', label: 'How to fix?', icon: '2' },
        { key: 'references', label: 'References', icon: '3' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === currentStep);

    const canProceed = useCallback((): boolean => {
        switch (currentStep) {
            case 'instruction':
                // Can proceed with or without instruction (user may just want preset)
                return true;
            case 'fix-method':
                // Must select a preset
                return selectedPreset !== null;
            case 'references':
                // Can always submit from references
                return true;
            default:
                return false;
        }
    }, [currentStep, selectedPreset]);

    const goToNextStep = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length && canProceed()) {
            setCurrentStep(steps[nextIndex].key);
        }
    };

    const goToPreviousStep = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].key);
        }
    };

    const goToStep = (step: WizardStep) => {
        const targetIndex = steps.findIndex(s => s.key === step);
        // Can only go back or to current step freely
        if (targetIndex <= currentStepIndex) {
            setCurrentStep(step);
        }
    };

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------

    const handleImproveInstruction = async () => {
        if (!onImproveText || !instruction.trim()) return;
        setIsImprovingInstruction(true);
        try {
            const improved = await onImproveText(instruction, undefined, 'regeneration_instruction');
            setInstruction(improved);
        } catch (e) {
            console.error('Failed to improve instruction:', e);
        } finally {
            setIsImprovingInstruction(false);
        }
    };

    const handlePresetSelect = (presetId: string) => {
        setSelectedPreset(presetId);
        const preset = QUICK_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setStrength(preset.defaultStrength);
        }
    };

    const handleFocusAreaToggle = (areaId: string) => {
        setSelectedFocusAreas(prev => {
            const next = new Set(prev);
            if (next.has(areaId)) {
                next.delete(areaId);
            } else {
                next.add(areaId);
            }
            return next;
        });
    };

    const handleRefToggle = (refId: string) => {
        setSelectedRefIds(prev => {
            const next = new Set(prev);
            if (next.has(refId)) {
                next.delete(refId);
            } else {
                next.add(refId);
            }
            return next;
        });
    };

    const handleProfileToggle = (profileId: string) => {
        setSelectedProfileIds(prev => {
            const next = new Set(prev);
            if (next.has(profileId)) {
                next.delete(profileId);
            } else {
                next.add(profileId);
            }
            return next;
        });
    };

    const handleSubmit = () => {
        const preset = QUICK_PRESETS.find(p => p.id === selectedPreset);
        const strengthLevel = STRENGTH_LEVELS.find(s => s.value === strength);
        const focusPrompts = Array.from(selectedFocusAreas)
            .map(id => FOCUS_AREAS.find(f => f.id === id)?.prompt)
            .filter(Boolean);

        // Build final instruction
        let finalInstruction = '';

        // Add strength prefix if not full strength
        if (strengthLevel && strength < 1.0) {
            finalInstruction += strengthLevel.prompt + ' ';
        }

        // Add preset prompt prefix
        if (preset?.promptPrefix) {
            finalInstruction += preset.promptPrefix + ' ';
        }

        // Add user instruction
        if (instruction.trim()) {
            finalInstruction += instruction.trim() + ' ';
        }

        // Add focus area prompts
        if (focusPrompts.length > 0) {
            finalInstruction += focusPrompts.join(' ');
        }

        const options: RerollOptions = {
            regenerationModes: preset?.modes,
            instruction: finalInstruction.trim(),
            selectedRefImages: allRefImages
                .filter(r => selectedRefIds.has(r.id))
                .map(r => r.base64),
            selectedProfileIds: Array.from(selectedProfileIds),
            reinforceWithReferenceImages: preset?.useRefs ?? true
        };

        onSubmit(options);
    };

    // -------------------------------------------------------------------------
    // RENDER HELPERS
    // -------------------------------------------------------------------------

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            {steps.map((step, idx) => {
                const isActive = step.key === currentStep;
                const isCompleted = idx < currentStepIndex;
                const isClickable = idx <= currentStepIndex;

                return (
                    <React.Fragment key={step.key}>
                        <button
                            onClick={() => isClickable && goToStep(step.key)}
                            disabled={!isClickable}
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded-full transition-all
                                min-h-[44px] touch-manipulation
                                ${isActive
                                    ? 'bg-yellow-400 border-2 border-black font-bold'
                                    : isCompleted
                                        ? 'bg-green-500 text-white border-2 border-green-700 cursor-pointer hover:bg-green-400'
                                        : 'bg-gray-200 text-gray-500 border-2 border-gray-300'
                                }
                                ${isClickable && !isActive ? 'cursor-pointer' : ''}
                            `}
                            aria-current={isActive ? 'step' : undefined}
                            aria-label={`Step ${idx + 1}: ${step.label}`}
                        >
                            <span className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                                ${isCompleted ? 'bg-white text-green-600' : ''}
                            `}>
                                {isCompleted ? '✓' : step.icon}
                            </span>
                            <span className="hidden sm:inline font-comic text-sm">{step.label}</span>
                        </button>
                        {idx < steps.length - 1 && (
                            <div className={`w-8 h-0.5 ${idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-4">
            {/* Current Image Preview */}
            {currentImage && (
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <img
                            src={`data:image/png;base64,${currentImage}`}
                            alt="Current panel"
                            className="w-40 h-52 sm:w-48 sm:h-64 object-cover border-4 border-black rounded shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                        />
                        <div className="absolute -top-2 -right-2 bg-yellow-400 border-2 border-black rounded-full px-2 py-1 text-xs font-bold">
                            #{pageIndex}
                        </div>
                    </div>
                </div>
            )}

            {/* Instruction Input */}
            <div className="border-[3px] border-black bg-green-50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <p className="font-comic text-base font-bold uppercase text-green-900">
                        What needs to change?
                    </p>
                    {onImproveText && (
                        <button
                            onClick={handleImproveInstruction}
                            disabled={isImprovingInstruction || !instruction.trim()}
                            className="comic-btn bg-purple-600 text-white text-sm min-h-[44px] px-4 py-2 border-2 border-black uppercase disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation self-start"
                        >
                            {isImprovingInstruction ? '⏳ IMPROVING...' : '✨ AI IMPROVE'}
                        </button>
                    )}
                </div>
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Describe the issue... e.g., 'Hero's face doesn't match', 'Wrong costume colors', 'Need more action pose'"
                    className="w-full p-4 border-2 border-black font-comic text-base resize-none h-32 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    aria-label="Describe what's wrong with the current panel"
                />
                <p className="font-comic text-xs text-green-700 mt-2 italic">
                    Tip: Be specific about what's wrong. The more detail, the better the fix.
                </p>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            {/* Quick Presets */}
            <div>
                <p className="font-comic text-base font-bold uppercase text-indigo-900 mb-3">
                    Choose a fix type:
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {QUICK_PRESETS.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => handlePresetSelect(preset.id)}
                            className={`
                                p-4 border-3 rounded transition-all touch-manipulation min-h-[80px]
                                flex flex-col items-center justify-center gap-2 text-center
                                ${selectedPreset === preset.id
                                    ? 'border-indigo-600 bg-indigo-100 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]'
                                    : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
                                }
                            `}
                            aria-pressed={selectedPreset === preset.id}
                        >
                            <span className="text-2xl">{preset.icon}</span>
                            <span className="font-comic font-bold text-sm">{preset.label}</span>
                            <span className="font-comic text-xs text-gray-500 hidden sm:block">{preset.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Strength Slider */}
            <div className="border-[3px] border-black bg-amber-50 p-4">
                <p className="font-comic text-sm font-bold uppercase text-amber-900 mb-3">
                    Change Intensity: <span className="text-amber-600">{STRENGTH_LEVELS.find(s => s.value === strength)?.label}</span>
                </p>
                <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={STRENGTH_LEVELS.findIndex(s => s.value === strength)}
                    onChange={(e) => setStrength(STRENGTH_LEVELS[parseInt(e.target.value)]?.value ?? 0.5)}
                    className="w-full h-3 accent-amber-500 cursor-pointer"
                    aria-label="Change intensity"
                />
                <div className="flex justify-between mt-2">
                    {STRENGTH_LEVELS.map(level => (
                        <span key={level.value} className="font-comic text-xs text-amber-700">{level.label}</span>
                    ))}
                </div>
            </div>

            {/* Focus Areas */}
            <div>
                <p className="font-comic text-sm font-bold uppercase text-teal-900 mb-3">
                    Focus on (optional):
                </p>
                <div className="flex flex-wrap gap-2">
                    {FOCUS_AREAS.map(area => (
                        <button
                            key={area.id}
                            onClick={() => handleFocusAreaToggle(area.id)}
                            className={`
                                px-4 py-2 border-2 rounded-full transition-all touch-manipulation min-h-[44px]
                                flex items-center gap-2 font-comic text-sm font-bold
                                ${selectedFocusAreas.has(area.id)
                                    ? 'border-teal-600 bg-teal-100 text-teal-800'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-teal-400'
                                }
                            `}
                            aria-pressed={selectedFocusAreas.has(area.id)}
                        >
                            <span>{area.icon}</span>
                            <span>{area.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            {/* Reference Images Gallery */}
            <div className="border-[3px] border-black bg-purple-50 p-4">
                <div className="flex justify-between items-center mb-3">
                    <p className="font-comic text-sm font-bold uppercase text-purple-900">
                        Reference Images ({selectedRefIds.size}/{allRefImages.length})
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedRefIds(new Set(allRefImages.map(r => r.id)))}
                            className="font-comic text-xs font-bold text-purple-700 hover:text-purple-900 touch-manipulation min-h-[36px] px-2"
                        >
                            All
                        </button>
                        <button
                            onClick={() => setSelectedRefIds(new Set())}
                            className="font-comic text-xs font-bold text-purple-700 hover:text-purple-900 touch-manipulation min-h-[36px] px-2"
                        >
                            None
                        </button>
                    </div>
                </div>

                {allRefImages.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                        {allRefImages.map(img => (
                            <button
                                key={img.id}
                                onClick={() => handleRefToggle(img.id)}
                                className={`
                                    relative aspect-square border-2 rounded overflow-hidden transition-all touch-manipulation
                                    ${selectedRefIds.has(img.id)
                                        ? 'border-green-500 ring-2 ring-green-400'
                                        : 'border-gray-300 opacity-60'
                                    }
                                `}
                                aria-pressed={selectedRefIds.has(img.id)}
                                aria-label={`${selectedRefIds.has(img.id) ? 'Deselect' : 'Select'} ${img.label}`}
                            >
                                <img
                                    src={`data:image/jpeg;base64,${img.base64}`}
                                    alt={img.label}
                                    className="w-full h-full object-cover"
                                />
                                {selectedRefIds.has(img.id) && (
                                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                        ✓
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="font-comic text-sm text-gray-500 text-center py-4">
                        No reference images uploaded.
                    </p>
                )}
            </div>

            {/* Profiles Summary */}
            <div className="border-[3px] border-black bg-orange-50 p-4">
                <div className="flex justify-between items-center mb-3">
                    <p className="font-comic text-sm font-bold uppercase text-orange-900">
                        Character Profiles ({selectedProfileIds.size}/{availableProfiles.length})
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedProfileIds(new Set(availableProfiles.map(p => p.id)))}
                            className="font-comic text-xs font-bold text-orange-700 hover:text-orange-900 touch-manipulation min-h-[36px] px-2"
                        >
                            All
                        </button>
                        <button
                            onClick={() => setSelectedProfileIds(new Set())}
                            className="font-comic text-xs font-bold text-orange-700 hover:text-orange-900 touch-manipulation min-h-[36px] px-2"
                        >
                            None
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {availableProfiles.map(profile => {
                        const fullProfile = fullProfiles.find(p => p.id === profile.id);
                        return (
                            <button
                                key={profile.id}
                                onClick={() => handleProfileToggle(profile.id)}
                                className={`
                                    px-3 py-2 border-2 rounded transition-all touch-manipulation min-h-[44px]
                                    flex items-center gap-2 font-comic text-sm
                                    ${selectedProfileIds.has(profile.id)
                                        ? 'border-orange-500 bg-orange-100 font-bold'
                                        : 'border-gray-300 bg-white opacity-60'
                                    }
                                `}
                                aria-pressed={selectedProfileIds.has(profile.id)}
                                title={fullProfile?.faceDescription || 'No description'}
                            >
                                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs ${
                                    selectedProfileIds.has(profile.id)
                                        ? 'border-orange-600 bg-orange-600 text-white'
                                        : 'border-gray-400'
                                }`}>
                                    {selectedProfileIds.has(profile.id) && '✓'}
                                </span>
                                <span>{profile.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-100 border-2 border-gray-300 rounded p-4">
                <p className="font-comic text-sm font-bold text-gray-800 mb-2">Summary:</p>
                <ul className="font-comic text-xs text-gray-600 space-y-1">
                    <li>
                        <span className="font-bold">Fix Type:</span>{' '}
                        {QUICK_PRESETS.find(p => p.id === selectedPreset)?.label || 'Not selected'}
                    </li>
                    <li>
                        <span className="font-bold">Intensity:</span>{' '}
                        {STRENGTH_LEVELS.find(s => s.value === strength)?.label}
                    </li>
                    {selectedFocusAreas.size > 0 && (
                        <li>
                            <span className="font-bold">Focus:</span>{' '}
                            {Array.from(selectedFocusAreas).map(id => FOCUS_AREAS.find(f => f.id === id)?.label).join(', ')}
                        </li>
                    )}
                    {instruction.trim() && (
                        <li>
                            <span className="font-bold">Instruction:</span>{' '}
                            {instruction.length > 50 ? instruction.substring(0, 50) + '...' : instruction}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );

    // -------------------------------------------------------------------------
    // MAIN RENDER
    // -------------------------------------------------------------------------

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-0 sm:border-[6px] border-black shadow-none sm:shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-[600px] w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto m-0 sm:m-4 rounded-none sm:rounded-lg relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="wizard-modal-title"
            >
                {/* Header */}
                <div className="bg-yellow-400 border-b-[4px] border-black px-4 py-3 flex justify-between items-center sticky top-0 z-10 flex-shrink-0">
                    <h2 id="wizard-modal-title" className="font-comic text-lg font-bold uppercase tracking-wider text-black">
                        🧙 Reroll Wizard #{pageIndex}
                    </h2>
                    <div className="flex items-center gap-2">
                        {onSwitchToExpert && (
                            <button
                                onClick={onSwitchToExpert}
                                className="comic-btn bg-gray-600 text-white min-h-[44px] px-3 py-2 text-sm border-[3px] border-black hover:bg-gray-500 font-bold touch-manipulation"
                                title="Switch to Expert Mode for full control"
                            >
                                Expert
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="comic-btn bg-red-600 text-white min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500 touch-manipulation"
                            aria-label="Close wizard"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="px-4 pt-4">
                    {renderStepIndicator()}
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-4 pb-24 sm:pb-4">
                    {currentStep === 'instruction' && renderStep1()}
                    {currentStep === 'fix-method' && renderStep2()}
                    {currentStep === 'references' && renderStep3()}
                </div>

                {/* Navigation Footer */}
                <div className="border-t-4 border-black p-4 bg-gray-50 flex justify-between items-center sticky bottom-0 z-10">
                    <button
                        onClick={goToPreviousStep}
                        disabled={currentStepIndex === 0}
                        className="comic-btn bg-gray-400 text-white min-h-[48px] px-6 py-2 border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                        ← Back
                    </button>

                    {currentStep === 'references' ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedPreset}
                            className="comic-btn bg-yellow-400 text-black min-h-[48px] px-8 py-2 border-[3px] border-black font-bold uppercase tracking-wider shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        >
                            🎲 Generate!
                        </button>
                    ) : (
                        <button
                            onClick={goToNextStep}
                            disabled={!canProceed()}
                            className="comic-btn bg-green-600 text-white min-h-[48px] px-6 py-2 border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WizardMode;
