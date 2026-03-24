
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface ExportDialogProps {
    onClose: () => void;
    onExport: (format: 'pdf' | 'webp' | 'png' | 'jpeg') => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose, onExport }) => {
    const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'webp' | 'png' | 'jpeg'>('pdf');

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="max-w-[400px] w-full bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] rotate-1">
                <h2 className="font-comic text-3xl text-red-600 mb-4 uppercase tracking-tighter" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>Export Adventure</h2>
                
                <p className="font-comic text-lg mb-6 text-gray-700">Choose your preferred format to save your comic book:</p>
                
                <div className="grid grid-cols-1 gap-3 mb-8">
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
                
                <div className="flex gap-3">
                    <button onClick={onClose} className="comic-btn flex-1 bg-gray-200 py-3 font-bold hover:bg-gray-300 border-2 border-black">CANCEL</button>
                    <button onClick={() => onExport(selectedFormat)} className="comic-btn flex-[2] bg-red-600 text-white py-3 font-bold hover:bg-red-500 border-2 border-black uppercase tracking-widest">EXPORT NOW!</button>
                </div>
            </div>
        </div>
    );
};
