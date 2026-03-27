/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

// Page size presets in inches
export const PAGE_SIZES = {
    'us-comic': { name: 'US Comic (6.625 x 10.25 in)', width: 6.625, height: 10.25 },
    'manga': { name: 'Manga (5 x 7.5 in)', width: 5, height: 7.5 },
    'graphic-novel': { name: 'Graphic Novel (6 x 9 in)', width: 6, height: 9 },
    'custom': { name: 'Custom', width: 6.625, height: 10.25 }
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;

// Resolution presets
export const RESOLUTION_OPTIONS = {
    'screen': { name: 'Screen (72 DPI)', dpi: 72, description: 'Best for digital viewing' },
    'print-standard': { name: 'Print Standard (300 DPI)', dpi: 300, description: 'Standard print quality' },
    'print-high': { name: 'High Quality Print (600 DPI)', dpi: 600, description: 'Professional print quality' }
} as const;

export type ResolutionKey = keyof typeof RESOLUTION_OPTIONS;

export interface ExportOptions {
    format: 'pdf' | 'webp' | 'png' | 'jpeg';
    // Print options
    cmykMode: boolean;
    addBleedMarks: boolean;
    pageSize: PageSizeKey;
    customWidth: number;
    customHeight: number;
    resolution: ResolutionKey;
}

interface ExportDialogProps {
    onClose: () => void;
    onExport: (options: ExportOptions) => void;
}

// Tooltip component
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="relative group inline-block">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 max-w-[250px] text-center">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

// Info icon component
const InfoIcon: React.FC = () => (
    <span className="inline-block w-4 h-4 text-xs leading-4 text-center bg-gray-400 text-white rounded-full cursor-help ml-1">?</span>
);

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose, onExport }) => {
    const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'webp' | 'png' | 'jpeg'>('pdf');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Advanced print options
    const [cmykMode, setCmykMode] = useState(false);
    const [addBleedMarks, setAddBleedMarks] = useState(false);
    const [pageSize, setPageSize] = useState<PageSizeKey>('us-comic');
    const [customWidth, setCustomWidth] = useState(6.625);
    const [customHeight, setCustomHeight] = useState(10.25);
    const [resolution, setResolution] = useState<ResolutionKey>('screen');

    const handleExport = () => {
        onExport({
            format: selectedFormat,
            cmykMode,
            addBleedMarks,
            pageSize,
            customWidth,
            customHeight,
            resolution
        });
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="max-w-[480px] w-full bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] rotate-1 max-h-[90vh] overflow-y-auto">
                <h2 className="font-comic text-3xl text-red-600 mb-4 uppercase tracking-tighter" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>Export Adventure</h2>

                <p className="font-comic text-lg mb-6 text-gray-700">Choose your preferred format to save your comic book:</p>

                <div className="grid grid-cols-1 gap-3 mb-6">
                    <button
                        onClick={() => setSelectedFormat('pdf')}
                        className={`comic-btn py-3 px-4 text-left flex justify-between items-center border-2 ${selectedFormat === 'pdf' ? 'bg-yellow-400 border-black' : 'bg-gray-100 border-transparent hover:bg-gray-200'}`}
                    >
                        <span className="font-comic font-bold">SINGLE PDF FILE</span>
                        {selectedFormat === 'pdf' && <span className="text-xl">✓</span>}
                    </button>

                    <div className="border-t-2 border-dashed border-gray-300 my-1"></div>
                    <p className="font-comic text-xs font-bold text-gray-500 uppercase">Separate Images</p>

                    <button
                        onClick={() => setSelectedFormat('webp')}
                        className={`comic-btn py-3 px-4 text-left flex justify-between items-center border-2 ${selectedFormat === 'webp' ? 'bg-blue-500 text-white border-black' : 'bg-gray-100 border-transparent hover:bg-gray-200'}`}
                    >
                        <span className="font-comic font-bold">WEBP IMAGES</span>
                        {selectedFormat === 'webp' && <span className="text-xl">✓</span>}
                    </button>

                    <button
                        onClick={() => setSelectedFormat('png')}
                        className={`comic-btn py-3 px-4 text-left flex justify-between items-center border-2 ${selectedFormat === 'png' ? 'bg-blue-500 text-white border-black' : 'bg-gray-100 border-transparent hover:bg-gray-200'}`}
                    >
                        <span className="font-comic font-bold">PNG IMAGES</span>
                        {selectedFormat === 'png' && <span className="text-xl">✓</span>}
                    </button>

                    <button
                        onClick={() => setSelectedFormat('jpeg')}
                        className={`comic-btn py-3 px-4 text-left flex justify-between items-center border-2 ${selectedFormat === 'jpeg' ? 'bg-blue-500 text-white border-black' : 'bg-gray-100 border-transparent hover:bg-gray-200'}`}
                    >
                        <span className="font-comic font-bold">JPEG IMAGES</span>
                        {selectedFormat === 'jpeg' && <span className="text-xl">✓</span>}
                    </button>
                </div>

                {/* Advanced Print Options - Collapsible */}
                {selectedFormat === 'pdf' && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between py-2 px-3 bg-gray-100 border-2 border-gray-300 rounded hover:bg-gray-200 transition-colors"
                        >
                            <span className="font-comic font-bold text-sm text-gray-700">ADVANCED PRINT OPTIONS</span>
                            <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </button>

                        {showAdvanced && (
                            <div className="mt-3 p-4 border-2 border-gray-300 rounded bg-gray-50 space-y-4">
                                {/* CMYK Mode */}
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="cmyk-mode"
                                        checked={cmykMode}
                                        onChange={(e) => setCmykMode(e.target.checked)}
                                        className="mt-1 w-5 h-5 accent-red-600 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="cmyk-mode" className="font-comic font-bold text-sm cursor-pointer flex items-center">
                                            Print-ready (CMYK color space)
                                            <Tooltip text="Colors will be adjusted to better represent print output. For true CMYK conversion, use professional design software.">
                                                <InfoIcon />
                                            </Tooltip>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">Colors optimized for print. For true CMYK, use professional software.</p>
                                    </div>
                                </div>

                                {/* Bleed/Trim Marks */}
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="bleed-marks"
                                        checked={addBleedMarks}
                                        onChange={(e) => setAddBleedMarks(e.target.checked)}
                                        className="mt-1 w-5 h-5 accent-red-600 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="bleed-marks" className="font-comic font-bold text-sm cursor-pointer flex items-center">
                                            Add bleed and trim marks
                                            <Tooltip text="Adds 3mm bleed area and crop marks at corners for professional printing.">
                                                <InfoIcon />
                                            </Tooltip>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">Adds 3mm bleed area with crop marks for professional printing.</p>
                                    </div>
                                </div>

                                {/* Page Size */}
                                <div>
                                    <label className="font-comic font-bold text-sm flex items-center mb-2">
                                        Page Size
                                        <Tooltip text="Standard comic book page dimensions. US Comic is the most common format.">
                                            <InfoIcon />
                                        </Tooltip>
                                    </label>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(e.target.value as PageSizeKey)}
                                        className="w-full p-2 border-2 border-gray-300 rounded font-comic text-sm bg-white"
                                    >
                                        {Object.entries(PAGE_SIZES).map(([key, value]) => (
                                            <option key={key} value={key}>{value.name}</option>
                                        ))}
                                    </select>

                                    {/* Custom size inputs */}
                                    {pageSize === 'custom' && (
                                        <div className="flex gap-3 mt-2">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-600 block mb-1">Width (in)</label>
                                                <input
                                                    type="number"
                                                    value={customWidth}
                                                    onChange={(e) => setCustomWidth(Math.max(1, parseFloat(e.target.value) || 1))}
                                                    min="1"
                                                    max="20"
                                                    step="0.125"
                                                    className="w-full p-2 border-2 border-gray-300 rounded font-comic text-sm"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-600 block mb-1">Height (in)</label>
                                                <input
                                                    type="number"
                                                    value={customHeight}
                                                    onChange={(e) => setCustomHeight(Math.max(1, parseFloat(e.target.value) || 1))}
                                                    min="1"
                                                    max="20"
                                                    step="0.125"
                                                    className="w-full p-2 border-2 border-gray-300 rounded font-comic text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Resolution */}
                                <div>
                                    <label className="font-comic font-bold text-sm flex items-center mb-2">
                                        Resolution
                                        <Tooltip text="Higher DPI produces better print quality but larger file sizes. 300 DPI is standard for print.">
                                            <InfoIcon />
                                        </Tooltip>
                                    </label>
                                    <select
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value as ResolutionKey)}
                                        className="w-full p-2 border-2 border-gray-300 rounded font-comic text-sm bg-white"
                                    >
                                        {Object.entries(RESOLUTION_OPTIONS).map(([key, value]) => (
                                            <option key={key} value={key}>{value.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">{RESOLUTION_OPTIONS[resolution].description}</p>
                                    <p className="text-xs text-amber-600 mt-1 italic">Note: Resolution affects PDF metadata. Source images maintain original quality.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onClose} className="comic-btn flex-1 bg-gray-200 py-3 font-bold hover:bg-gray-300 border-2 border-black">CANCEL</button>
                    <button onClick={handleExport} className="comic-btn flex-[2] bg-red-600 text-white py-3 font-bold hover:bg-red-500 border-2 border-black uppercase tracking-widest">EXPORT NOW!</button>
                </div>
            </div>
        </div>
    );
};
