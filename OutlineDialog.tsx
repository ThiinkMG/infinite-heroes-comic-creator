/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import jsPDF from 'jspdf';

interface OutlineDialogProps {
    outline: string;
    title: string;
    onClose: () => void;
}

export const OutlineDialog: React.FC<OutlineDialogProps> = ({ outline, title, onClose }) => {
    const [copied, setCopied] = useState(false);

    const safeName = (title || 'Comic-Outline').replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');

    const exportAsText = () => {
        const blob = new Blob([outline], { type: 'text/plain' });
        download(blob, `${safeName}.txt`);
    };

    const exportAsMarkdown = () => {
        const md = `# ${title || 'Comic Outline'}\n\n${outline}`;
        const blob = new Blob([md], { type: 'text/markdown' });
        download(blob, `${safeName}.md`);
    };

    const exportAsJSON = () => {
        const json = JSON.stringify({
            title: title || 'Comic Outline',
            outline: outline,
            exportedAt: new Date().toISOString()
        }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        download(blob, `${safeName}.json`);
    };

    const exportAsPDF = () => {
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(title || 'Comic Outline', 20, 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        const lines = doc.splitTextToSize(outline, 170);
        let y = 35;
        lines.forEach((line: string) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 20, y);
            y += 6;
        });

        doc.save(`${safeName}.pdf`);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(outline).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const download = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-[6px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-[700px] w-full max-h-[85vh] overflow-hidden flex flex-col m-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-purple-600 border-b-[4px] border-black px-6 py-3 flex justify-between items-center shrink-0">
                    <h2 className="font-comic text-2xl font-bold uppercase tracking-wider text-white">
                        📖 Story Outline
                    </h2>
                    <button
                        onClick={onClose}
                        className="comic-btn bg-red-600 text-white w-10 h-10 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500"
                    >✕</button>
                </div>

                {/* Outline Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {outline ? (
                        <pre className="text-sm font-mono bg-gray-50 border-[3px] border-gray-300 p-4 whitespace-pre-wrap text-gray-800 leading-relaxed">
                            {outline}
                        </pre>
                    ) : (
                        <div className="text-center py-12">
                            <p className="font-comic text-xl text-gray-400 uppercase">No outline generated</p>
                            <p className="font-comic text-sm text-gray-400 mt-2">Generate from outline mode to see content here.</p>
                        </div>
                    )}
                </div>

                {/* Export Buttons */}
                {outline && (
                    <div className="border-t-[4px] border-black px-5 py-4 bg-gray-100 flex flex-wrap gap-2 justify-center shrink-0">
                        <button onClick={copyToClipboard} className={`comic-btn text-sm px-4 py-2 border-[3px] border-black font-bold ${copied ? 'bg-green-500 text-white' : 'bg-gray-300 text-black hover:bg-gray-400'}`}>
                            {copied ? '✓ Copied!' : '📋 Copy'}
                        </button>
                        <button onClick={exportAsText} className="comic-btn bg-blue-500 text-white text-sm px-4 py-2 border-[3px] border-black font-bold hover:bg-blue-400">
                            📄 .TXT
                        </button>
                        <button onClick={exportAsMarkdown} className="comic-btn bg-indigo-500 text-white text-sm px-4 py-2 border-[3px] border-black font-bold hover:bg-indigo-400">
                            📝 .MD
                        </button>
                        <button onClick={exportAsJSON} className="comic-btn bg-yellow-500 text-black text-sm px-4 py-2 border-[3px] border-black font-bold hover:bg-yellow-400">
                            🔧 .JSON
                        </button>
                        <button onClick={exportAsPDF} className="comic-btn bg-red-600 text-white text-sm px-4 py-2 border-[3px] border-black font-bold hover:bg-red-500">
                            📕 .PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
