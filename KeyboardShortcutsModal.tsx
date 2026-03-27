/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';

interface KeyboardShortcutsModalProps {
    onClose: () => void;
}

interface ShortcutGroup {
    title: string;
    icon: string;
    shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: 'Navigation',
        icon: '📖',
        shortcuts: [
            { keys: ['←', '→'], description: 'Previous / Next page' },
            { keys: ['Home'], description: 'Go to first page (cover)' },
            { keys: ['End'], description: 'Go to last page' },
            { keys: ['Page Up'], description: 'Previous page' },
            { keys: ['Page Down'], description: 'Next page' },
        ],
    },
    {
        title: 'General',
        icon: '⌨️',
        shortcuts: [
            { keys: ['Escape'], description: 'Close current modal / dialog' },
            { keys: ['?'], description: 'Show keyboard shortcuts (this modal)' },
        ],
    },
    {
        title: 'Input Fields',
        icon: '✏️',
        shortcuts: [
            { keys: ['Enter'], description: 'Submit page number / custom action' },
        ],
    },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white border-[6px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-[550px] w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-yellow-400 border-b-[4px] border-black px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="font-comic text-lg md:text-2xl font-bold uppercase tracking-wider text-black">
                        ⌨️ Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={onClose}
                        className="comic-btn bg-red-600 text-white w-10 h-10 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-6">
                    {SHORTCUT_GROUPS.map((group) => (
                        <div key={group.title} className="border-[3px] border-black bg-gray-50 p-4">
                            <h3 className="font-comic text-sm md:text-base font-bold uppercase text-gray-900 mb-3 flex items-center gap-2">
                                <span>{group.icon}</span>
                                {group.title}
                            </h3>
                            <div className="space-y-2">
                                {group.shortcuts.map((shortcut, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between gap-4 py-2 border-b border-gray-200 last:border-b-0"
                                    >
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <React.Fragment key={keyIdx}>
                                                    <kbd className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 bg-gray-800 text-white font-mono text-sm rounded border-2 border-gray-600 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                                                        {key}
                                                    </kbd>
                                                    {keyIdx < shortcut.keys.length - 1 && (
                                                        <span className="text-gray-400 font-comic text-xs">/</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <span className="font-comic text-sm text-gray-700 text-right">
                                            {shortcut.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Tip */}
                    <div className="bg-blue-50 border-[3px] border-blue-300 p-4">
                        <p className="font-comic text-sm text-blue-800">
                            <span className="font-bold">Tip:</span> Press{' '}
                            <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-gray-800 text-white font-mono text-xs rounded border border-gray-600">
                                ?
                            </kbd>{' '}
                            anytime to open this shortcuts reference.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-[3px] border-black bg-gray-100 px-4 md:px-6 py-3">
                    <button
                        onClick={onClose}
                        className="comic-btn w-full bg-yellow-400 text-black py-3 font-bold uppercase tracking-wider border-[3px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:-translate-y-0.5 transition-transform"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};
