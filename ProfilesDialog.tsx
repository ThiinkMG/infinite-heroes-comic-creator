import React, { useRef, useState } from 'react';
import { CharacterProfile } from './types';

interface Props {
    profiles: CharacterProfile[];
    onUpdate: (index: number, updated: CharacterProfile) => void;
    onAnalyze?: (index: number) => Promise<void>;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ProfilesDialog: React.FC<Props> = ({ profiles, onUpdate, onAnalyze, onConfirm, onCancel }) => {
    const [analyzingIdx, setAnalyzingIdx] = useState<number | null>(null);
    
    const handleDownloadIndividual = (profile: CharacterProfile) => {
        const data = JSON.stringify(profile, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Profile-${profile.name.replace(/\s+/g, '-') || 'Unknown'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleUploadIndividual = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string) as CharacterProfile | CharacterProfile[];
                
                // If they uploaded an array (legacy global export) by accident, just grab the first one
                const incoming = Array.isArray(parsed) ? parsed[0] : parsed;
                
                if (incoming && typeof incoming === 'object') {
                    onUpdate(idx, { ...profiles[idx], ...incoming, id: profiles[idx].id, name: profiles[idx].name });
                } else {
                    alert('Invalid JSON format. Expected a single character profile.');
                }
            } catch (err) {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };
    return (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-[800px] w-full max-h-[90vh] bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] flex flex-col">
                <div className="flex justify-between items-end mb-4 border-b-4 border-black pb-2">
                    <div>
                        <h2 className="font-comic text-4xl text-purple-600 uppercase tracking-tighter">Character Profiles</h2>
                        <p className="font-comic text-sm text-gray-600 mt-1">Review and heavily edit the AI's understanding of your characters before generating!</p>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                    {profiles.map((p, idx) => {
                        const isFilled = String(p.faceDescription || '').trim() !== '' || String(p.clothing || '').trim() !== '';
                        const btnText = isFilled ? "REANALYZE" : "ANALYZE";

                        return (
                        <div key={p.id} className="border-4 border-black p-4 bg-gray-50 flex flex-col gap-3">
                            <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-2">
                                <h3 className="font-comic text-2xl font-bold uppercase text-blue-800">{p.name || 'Unknown'}</h3>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleDownloadIndividual(p)}
                                        className="comic-btn bg-yellow-400 text-black text-[10px] px-2 py-1 font-bold border-2 border-black hover:bg-yellow-300 uppercase hidden sm:block"
                                        title="Download this character's profile"
                                    >⬇️ JSON</button>
                                    <label className="comic-btn bg-blue-500 text-white text-[10px] px-2 py-1 font-bold border-2 border-black hover:bg-blue-400 uppercase cursor-pointer hidden sm:block">
                                        ⬆️ JSON
                                        <input 
                                            type="file" 
                                            accept=".json,application/json" 
                                            className="hidden" 
                                            onChange={(e) => handleUploadIndividual(idx, e)}
                                        />
                                    </label>
                                    {onAnalyze && (
                                        <button 
                                            onClick={async () => {
                                               setAnalyzingIdx(idx); 
                                               await onAnalyze(idx); 
                                               setAnalyzingIdx(null);
                                            }}
                                            disabled={analyzingIdx === idx}
                                            className="bg-blue-600 text-white font-comic text-xs font-bold px-3 py-1 border-2 border-black hover:bg-blue-500 disabled:opacity-50 transition-colors"
                                        >
                                            {analyzingIdx === idx ? 'ANALYZING...' : btnText}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-comic text-xs font-bold text-gray-700 uppercase">Face Description</label>
                                    <textarea 
                                        className="w-full p-2 border-2 border-black font-comic text-sm h-24 resize-none"
                                        value={p.faceDescription}
                                        onChange={e => onUpdate(idx, { ...p, faceDescription: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="font-comic text-xs font-bold text-gray-700 uppercase">Body Type</label>
                                    <textarea 
                                        className="w-full p-2 border-2 border-black font-comic text-sm h-24 resize-none"
                                        value={p.bodyType}
                                        onChange={e => onUpdate(idx, { ...p, bodyType: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="font-comic text-xs font-bold text-gray-700 uppercase">Clothing & Armor</label>
                                    <textarea 
                                        className="w-full p-2 border-2 border-black font-comic text-sm h-24 resize-none"
                                        value={p.clothing}
                                        onChange={e => onUpdate(idx, { ...p, clothing: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="font-comic text-xs font-bold text-gray-700 uppercase">Color Palette</label>
                                    <textarea 
                                        className="w-full p-2 border-2 border-black font-comic text-sm h-24 resize-none"
                                        value={p.colorPalette}
                                        onChange={e => onUpdate(idx, { ...p, colorPalette: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="font-comic text-xs font-bold text-gray-700 uppercase">Distinguishing Features (Scars, Tattoos, Aura)</label>
                                    <textarea 
                                        className="w-full p-2 border-2 border-black font-comic text-sm h-16 resize-none"
                                        value={p.distinguishingFeatures}
                                        onChange={e => onUpdate(idx, { ...p, distinguishingFeatures: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        );
                    })}
                    {profiles.length === 0 && (
                        <p className="font-comic text-center p-8 bg-gray-200 border-2 border-black">No characters found to parse.</p>
                    )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={onCancel}
                        className="comic-btn bg-red-600 text-white px-6 py-3 font-bold border-[3px] border-black hover:bg-red-500 uppercase flex-none"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="comic-btn flex-1 bg-green-600 text-white px-6 py-3 font-bold border-[3px] border-black hover:bg-green-500 uppercase text-xl"
                    >
                        APPROVE & START BOOK
                    </button>
                </div>
            </div>
        </div>
    );
};
