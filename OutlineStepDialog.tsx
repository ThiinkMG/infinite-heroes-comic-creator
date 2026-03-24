import React from 'react';

interface Props {
    show: boolean;
    storyOutline: { content: string; isReady: boolean; isGenerating: boolean };
    outlineNotes: string;
    onOutlineUpdate: (content: string) => void;
    onOutlineNotesChange: (val: string) => void;
    onGenerateOutline: (notes?: string) => void;
    onOutlineUpload: (file: File) => void;
    onProceedWithOutline: () => void;
    onCancelOutline: () => void;
}

export const OutlineStepDialog: React.FC<Props> = ({ 
    show, 
    storyOutline, 
    outlineNotes, 
    onOutlineUpdate, 
    onOutlineNotesChange, 
    onGenerateOutline, 
    onOutlineUpload, 
    onProceedWithOutline, 
    onCancelOutline 
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-[800px] w-full bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,0.5)] rotate-1">
                <h2 className="font-comic text-4xl text-red-600 mb-4 uppercase tracking-tighter">Story Outline</h2>
                
                {storyOutline.isGenerating ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="font-comic text-xl animate-pulse">AI is crafting your epic outline...</p>
                    </div>
                ) : (
                    <>
                        <textarea 
                            value={storyOutline.content}
                            onChange={(e) => onOutlineUpdate(e.target.value)}
                            className="w-full h-[300px] p-4 border-4 border-black font-comic text-sm mb-4 resize-none bg-yellow-50 shadow-inner"
                            placeholder="Generated outline will appear here..."
                        />
                        
                        <div className="mb-4 text-left">
                            <p className="font-comic text-xs font-bold mb-1 uppercase">Regenerate with Context/Notes:</p>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={outlineNotes}
                                    onChange={(e) => onOutlineNotesChange(e.target.value)}
                                    placeholder="Add notes for regeneration..."
                                    className="flex-1 p-2 border-2 border-black font-comic text-sm"
                                />
                                <button 
                                    onClick={() => onGenerateOutline(outlineNotes)}
                                    className="comic-btn bg-blue-600 text-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-blue-500"
                                >
                                    REGENERATE
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <button 
                                onClick={onProceedWithOutline}
                                className="comic-btn bg-green-600 text-white py-3 font-bold border-2 border-black hover:bg-green-500 text-xs"
                            >
                                APPROVE & PROCEED
                            </button>
                            <label className="comic-btn bg-gray-200 text-black py-3 font-bold border-2 border-black hover:bg-gray-300 text-xs text-center cursor-pointer">
                                UPLOAD OUTLINE
                                <input 
                                    type="file" 
                                    accept=".txt,.md" 
                                    className="hidden" 
                                    onChange={(e) => e.target.files?.[0] && onOutlineUpload(e.target.files[0])} 
                                />
                            </label>
                            <button 
                                onClick={onCancelOutline}
                                className="comic-btn bg-red-600 text-white py-3 font-bold border-2 border-black hover:bg-red-500 text-xs"
                            >
                                CANCEL
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
