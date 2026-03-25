import React, { useState, useRef } from 'react';
import { ComicFace } from './types';

interface GalleryModalProps {
    faces: ComicFace[];
    title: string;
    onClose: () => void;
    onReplaceImage?: (faceId: string, newImageUrl: string) => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({ faces, title, onClose, onReplaceImage }) => {
    const validFaces = faces.filter(f => f.imageUrl && !f.isLoading);
    const [expandedFaceId, setExpandedFaceId] = useState<string | null>(null);
    const [replacingFaceId, setReplacingFaceId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const expandedIndex = expandedFaceId ? validFaces.findIndex(f => f.id === expandedFaceId) : -1;

    const downloadImage = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    const downloadAll = async () => {
        // Sequential download with a small delay to prevent browser blocking
        for (let i = 0; i < validFaces.length; i++) {
            const face = validFaces[i];
            const safeTitle = (title || 'Comic').replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
            const pName = face.type === 'cover' ? '00-Cover' : face.type === 'back_cover' ? '99-BackCover' : `Page-${String(face.pageIndex).padStart(2, '0')}`;
            downloadImage(face.imageUrl!, `${safeTitle}-${pName}.png`);
            await new Promise(r => setTimeout(r, 500));
        }
    };

    const handleReplaceClick = (faceId: string) => {
        setReplacingFaceId(faceId);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !replacingFaceId || !onReplaceImage) {
            setReplacingFaceId(null);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, etc.)');
            setReplacingFaceId(null);
            e.target.value = '';
            return;
        }

        // Convert to base64 data URL
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            onReplaceImage(replacingFaceId, dataUrl);
            setReplacingFaceId(null);
        };
        reader.onerror = () => {
            alert('Failed to read image file.');
            setReplacingFaceId(null);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    return (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-start bg-black/95 backdrop-blur-md overflow-hidden" onClick={onClose}>
            {/* Hidden file input for image replacement */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Header */}
            <div className="w-full bg-indigo-900 border-b-[4px] border-black px-6 py-4 flex justify-between items-center shrink-0 shadow-[0_8px_0_rgba(0,0,0,1)] z-10" onClick={e => e.stopPropagation()}>
                <h2 className="font-comic text-2xl md:text-3xl font-bold uppercase tracking-wider text-white flex items-center gap-3">
                    🖼️ Image Gallery
                    <span className="text-sm bg-black/50 px-3 py-1 rounded-full text-indigo-300 border-[2px] border-indigo-500">{validFaces.length} Images</span>
                </h2>
                <div className="flex gap-4">
                    <button onClick={downloadAll} className="comic-btn bg-blue-500 text-white px-6 py-2 border-[3px] border-black font-bold uppercase tracking-wider text-sm hover:bg-blue-400">
                        📦 Download All
                    </button>
                    <button onClick={onClose} className="comic-btn bg-red-600 text-white w-12 h-12 flex items-center justify-center font-bold text-2xl border-[3px] border-black hover:bg-red-500">
                        ✕
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
                {expandedFaceId !== null && expandedIndex >= 0 ? (
                    // EXPANDED VIEW
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="relative max-h-full max-w-full flex">
                            <img src={validFaces[expandedIndex].imageUrl} alt="Expanded panel" className="max-h-[75vh] object-contain border-[6px] border-white shadow-[12px_12px_0_rgba(0,0,0,1)] bg-gray-900" />
                        </div>
                        <div className="mt-8 flex flex-wrap gap-3 w-full max-w-2xl justify-center relative z-10">
                            <button
                                onClick={() => setExpandedFaceId(expandedIndex > 0 ? validFaces[expandedIndex - 1].id : null)}
                                disabled={expandedIndex === 0}
                                className="comic-btn bg-gray-200 px-6 py-3 border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 uppercase"
                            >
                                ⬅ Prev
                            </button>
                            <button
                                onClick={() => downloadImage(validFaces[expandedIndex].imageUrl!, `Comic-${validFaces[expandedIndex].id}.png`)}
                                className="comic-btn bg-green-500 text-white px-6 py-3 border-[3px] border-black font-bold hover:bg-green-400 uppercase tracking-wide"
                            >
                                ↓ Download
                            </button>
                            {onReplaceImage && (
                                <button
                                    onClick={() => handleReplaceClick(validFaces[expandedIndex].id)}
                                    className="comic-btn bg-orange-500 text-white px-6 py-3 border-[3px] border-black font-bold hover:bg-orange-400 uppercase tracking-wide"
                                >
                                    🔄 Replace
                                </button>
                            )}
                            <button
                                onClick={() => setExpandedFaceId(expandedIndex < validFaces.length - 1 ? validFaces[expandedIndex + 1].id : null)}
                                disabled={expandedIndex === validFaces.length - 1}
                                className="comic-btn bg-gray-200 px-6 py-3 border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 uppercase"
                            >
                                Next ➡
                            </button>
                        </div>
                        <button 
                            onClick={() => setExpandedFaceId(null)} 
                            className="absolute top-0 right-0 lg:right-10 bg-black text-white px-4 py-2 border-2 border-white font-comic hover:bg-gray-800"
                        >
                            Back to Grid
                        </button>
                    </div>
                ) : (
                    // GRID VIEW
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 max-w-7xl mx-auto pb-20">
                        {validFaces.map((face) => (
                            <div key={face.id} className="relative group flex flex-col items-center">
                                <div 
                                    className="relative cursor-pointer hover:scale-105 transition-transform duration-200 w-full aspect-[2/3] border-[4px] border-white shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden bg-gray-900"
                                    onClick={() => setExpandedFaceId(face.id)}
                                >
                                    <img src={face.imageUrl} className="w-full h-full object-cover" alt="Thumbnail" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 bg-black/80 text-white font-bold px-4 py-2 rounded-full font-comic tracking-wider border-2 border-white scale-90 group-hover:scale-100 transition-all">
                                            🔍 VIEW
                                        </span>
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-yellow-400 text-black px-2 flex items-center justify-center font-bold border-2 border-black text-xs font-comic shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                        {face.type === 'cover' ? 'COVER' : face.type === 'back_cover' ? 'BACK' : `PG ${face.pageIndex}`}
                                    </div>
                                </div>
                                <div className="mt-3 w-full flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); downloadImage(face.imageUrl!, `Comic-${face.id}.png`); }}
                                        className="flex-1 bg-blue-600 text-white py-2 font-comic text-xs uppercase font-bold tracking-wider hover:bg-blue-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                                    >
                                        ↓ Save
                                    </button>
                                    {onReplaceImage && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReplaceClick(face.id); }}
                                            className="flex-1 bg-orange-500 text-white py-2 font-comic text-xs uppercase font-bold tracking-wider hover:bg-orange-400 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                                            title="Replace this image with your own"
                                        >
                                            🔄 Replace
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {validFaces.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <p className="font-comic text-2xl text-gray-400">No images generated yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
