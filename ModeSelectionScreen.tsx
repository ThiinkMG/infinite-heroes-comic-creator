/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type StoryMode = 'novel' | 'outline';

interface ModeCard {
    id: StoryMode;
    title: string;
    description: string;
    features: string[];
    icon: string;
    color: string;
}

const MODES: ModeCard[] = [
    {
        id: 'novel',
        title: 'Novel Mode',
        description: 'Interactive story with choices',
        features: [
            'Generate 3 pages at a time',
            'Make decisions that shape the story',
            'Rich dialogue and character moments',
            'Pause and continue at your pace'
        ],
        icon: '🎲',
        color: 'blue'
    },
    {
        id: 'outline',
        title: 'Outline Mode',
        description: 'Full automation from plot outline',
        features: [
            'AI generates complete story outline',
            'Review and edit before generation',
            'Fully automated comic creation',
            'Includes comic fundamentals (layouts, shots, pacing)'
        ],
        icon: '📖',
        color: 'purple'
    }
];

interface ModeSelectionScreenProps {
    show: boolean;
    onSelect: (mode: StoryMode) => void;
    onBack: () => void;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
    show,
    onSelect,
    onBack
}) => {
    const [selectedMode, setSelectedMode] = useState<StoryMode | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    if (!show) return null;

    const handleModeClick = (mode: StoryMode) => {
        setSelectedMode(mode);
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        if (selectedMode) {
            onSelect(selectedMode);
        }
    };

    const handleCancel = () => {
        setShowConfirm(false);
        setSelectedMode(null);
    };

    const selectedModeData = selectedMode ? MODES.find(m => m.id === selectedMode) : null;

    return (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-[800px] w-full bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] relative">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="font-comic text-3xl md:text-4xl text-red-600 uppercase tracking-tighter mb-2">
                        Choose Your Adventure Style
                    </h2>
                    <p className="font-comic text-sm md:text-base text-gray-600">
                        Select how you want to create your comic
                    </p>
                </div>

                {/* Mode Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => handleModeClick(mode.id)}
                            className={`
                                p-4 md:p-6 border-4 transition-all text-left
                                ${selectedMode === mode.id
                                    ? mode.color === 'blue'
                                        ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-[6px_6px_0px_rgba(0,0,0,0.3)]'
                                        : 'border-purple-500 bg-purple-50 scale-[1.02] shadow-[6px_6px_0px_rgba(0,0,0,0.3)]'
                                    : 'border-gray-300 bg-white hover:border-gray-500 hover:shadow-[4px_4px_0px_rgba(0,0,0,0.2)]'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-4xl md:text-5xl">{mode.icon}</span>
                                <div>
                                    <h3 className={`font-comic text-xl md:text-2xl font-bold uppercase ${
                                        mode.color === 'blue' ? 'text-blue-700' : 'text-purple-700'
                                    }`}>
                                        {mode.title}
                                    </h3>
                                    <p className="font-comic text-sm text-gray-600">{mode.description}</p>
                                </div>
                            </div>
                            <ul className="space-y-1">
                                {mode.features.map((feature, i) => (
                                    <li key={i} className="font-comic text-xs md:text-sm text-gray-700 flex items-start gap-2">
                                        <span className={mode.color === 'blue' ? 'text-blue-500' : 'text-purple-500'}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    ))}
                </div>

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="comic-btn bg-gray-400 text-white px-6 py-3 text-lg font-bold uppercase border-[3px] border-black hover:bg-gray-500 w-full md:w-auto"
                >
                    ← Back to Setup
                </button>

                {/* Confirmation Dialog */}
                {showConfirm && selectedModeData && (
                    <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
                        <div className={`
                            max-w-[450px] w-full bg-white border-[6px] border-black p-6
                            shadow-[8px_8px_0px_rgba(0,0,0,0.4)] text-center
                            ${selectedModeData.color === 'blue' ? 'border-blue-500' : 'border-purple-500'}
                        `}>
                            <span className="text-6xl mb-4 block">{selectedModeData.icon}</span>
                            <h3 className={`font-comic text-2xl md:text-3xl font-bold uppercase mb-2 ${
                                selectedModeData.color === 'blue' ? 'text-blue-700' : 'text-purple-700'
                            }`}>
                                Continue with {selectedModeData.title}?
                            </h3>
                            <p className="font-comic text-sm md:text-base text-gray-600 mb-6">
                                {selectedModeData.id === 'novel'
                                    ? "You'll generate 3 pages at a time and make story choices along the way."
                                    : "The AI will create a full outline for you to review, then generate the entire comic automatically."
                                }
                            </p>
                            <div className="flex flex-col md:flex-row gap-3 justify-center">
                                <button
                                    onClick={handleConfirm}
                                    className={`comic-btn text-white px-8 py-3 text-xl font-bold uppercase border-[3px] border-black ${
                                        selectedModeData.color === 'blue'
                                            ? 'bg-blue-600 hover:bg-blue-500'
                                            : 'bg-purple-600 hover:bg-purple-500'
                                    }`}
                                >
                                    Let's Go!
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="comic-btn bg-gray-400 text-white px-8 py-3 text-xl font-bold uppercase border-[3px] border-black hover:bg-gray-500"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
