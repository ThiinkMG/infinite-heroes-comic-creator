/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ComicFace, getComicConfig, StoryContext } from './types';
import { LoadingFX } from './LoadingFX';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[];
    storyContext: StoryContext;
    generateFromOutline: boolean;
    onChoice: (pageIndex: number, choice: string, isCustomAction?: boolean) => void;
    onReroll: (pageIndex: number) => void;
    onQuickRetry?: (pageIndex: number) => void;
    onAddPage?: (instruction?: string) => void;
    onStop?: () => void;
    onStopHere?: () => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
}

export const Panel: React.FC<PanelProps> = ({ face, allFaces, storyContext, generateFromOutline, onChoice, onReroll, onQuickRetry, onAddPage, onStop, onStopHere, onOpenBook, onDownload, onReset }) => {
    const [showCustomChoice, setShowCustomChoice] = useState(false);
    const [customChoiceText, setCustomChoiceText] = useState('');

    if (!face) return <div className="w-full h-full bg-gray-950" />;
    if (face.isLoading && !face.imageUrl) return <LoadingFX />;
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';
    const hasFailed = face.hasFailed === true;

    // In Novel Mode, only show decision overlay on the MOST RECENT unresolved decision page
    // This prevents multiple overlays from appearing on different pages simultaneously
    const latestUnresolvedDecision = allFaces
        .filter(f => f.isDecisionPage && !f.resolvedChoice && f.choices && f.choices.length > 0 && !f.isLoading)
        .reduce((max, f) => Math.max(max, f.pageIndex || 0), 0);
    const isLatestDecisionPage = face.pageIndex === latestUnresolvedDecision;

    return (
        <div className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''}`}>
            <div className="gloss"></div>
            {face.imageUrl && <img src={face.imageUrl} alt="Comic panel" className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />}
            
            {/* Failed Generation State */}
            {hasFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10">
                    <p className="font-comic text-2xl mb-2 text-red-400">⚠️ GENERATION FAILED</p>
                    <p className="font-comic text-sm text-gray-400 mb-4">Panel couldn't be generated.</p>
                    <div className="flex flex-col gap-3 w-64">
                        {onQuickRetry && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onQuickRetry(face.pageIndex as number); }}
                                className="comic-btn bg-green-500 text-white px-6 py-3 text-lg font-bold border-[3px] border-black hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] w-full"
                                title="Quick retry with enhanced context (emblem, weapon, outline)"
                            >
                                🔄 Continue (Quick Retry)
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onReroll(face.pageIndex as number); }}
                            className="comic-btn bg-yellow-400 text-black px-6 py-3 text-lg font-bold border-[3px] border-black hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] w-full"
                        >
                            🎲 Reroll (Full Options)
                        </button>
                    </div>
                    <p className="font-comic text-[10px] text-gray-500 mt-3 max-w-xs text-center">
                        Quick Retry uses outline + emblem/weapon refs automatically
                    </p>
                </div>
            )}

            {/* Reroll Button — shows on any non-loading story/cover panel */}
            {!face.isLoading && (face.type === 'story' || face.type === 'cover') && face.pageIndex !== undefined && face.imageUrl && (
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onReroll(face.pageIndex as number);
                    }} 
                    className="absolute top-4 right-4 bg-yellow-400 text-black border-[3px] border-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl hover:scale-110 shadow-[2px_2px_0px_rgba(0,0,0,1)] z-30 opacity-0 group-hover:opacity-100 transition-opacity" 
                    title="Re-roll Panel"
                >
                    🎲
                </button>
            )}
            
            {/* Target Reached Indicator - Novel Mode only */}
            {face.isDecisionPage && face.isExtraPage && !face.resolvedChoice && !generateFromOutline && (
                <div className="absolute top-4 left-4 right-4 bg-purple-600/95 text-white px-4 py-3 rounded-lg z-30 flex flex-col sm:flex-row items-center justify-between gap-2 border-2 border-purple-400 shadow-lg">
                    <span className="font-comic text-sm text-center sm:text-left">
                        🎯 Target length reached! Continue your adventure or wrap up?
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); /* continue normally via choices below */ }}
                            className="px-3 py-1.5 bg-green-500 rounded text-xs font-bold hover:bg-green-400 border border-white/30 transition-colors"
                        >
                            Keep Going
                        </button>
                        {onStopHere && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onStopHere(); }}
                                className="px-3 py-1.5 bg-red-500 rounded text-xs font-bold hover:bg-red-400 border border-white/30 transition-colors"
                            >
                                Wrap Up
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Decision Buttons - Only show on the MOST RECENT unresolved decision page */}
            {face.isDecisionPage && face.choices.length > 0 && isLatestDecisionPage && (
                <div className={`absolute bottom-0 inset-x-0 p-6 pb-12 flex flex-col gap-3 items-center justify-end transition-opacity duration-500 ${face.resolvedChoice ? 'opacity-0 pointer-events-none' : 'opacity-100'} bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20`}>
                    <p className="text-white font-comic text-2xl uppercase tracking-widest animate-pulse">What drives you?</p>

                    {!showCustomChoice ? (
                        <>
                            {face.choices.map((choice, i) => (
                                <button key={i} onClick={(e) => { e.stopPropagation(); if(face.pageIndex) onChoice(face.pageIndex, choice, false); }}
                                  className={`comic-btn w-full py-3 text-lg leading-tight font-bold tracking-wider ${i===0?'bg-yellow-400 hover:bg-yellow-300':'bg-blue-500 text-white hover:bg-blue-400'}`}>
                                    {choice}
                                </button>
                            ))}
                            <button onClick={(e) => { e.stopPropagation(); setShowCustomChoice(true); }}
                              className="comic-btn w-full py-2 text-lg bg-green-600 text-white hover:bg-green-500 font-bold tracking-wider border-2 border-black">
                                ✍️ Custom Action
                            </button>
                            {/* Choose for me - AI picks one of the options */}
                            {!generateFromOutline && face.choices.length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(face.pageIndex) {
                                            // Pick a random choice from available options
                                            const randomChoice = face.choices[Math.floor(Math.random() * face.choices.length)];
                                            onChoice(face.pageIndex, randomChoice, false);
                                        }
                                    }}
                                    className="comic-btn w-full py-2 text-sm bg-purple-600 text-white hover:bg-purple-500 font-bold tracking-wider border-2 border-black"
                                    title="Let AI randomly pick one of the choices"
                                >
                                    🎲 Choose For Me
                                </button>
                            )}
                            {/* Skip - Dismiss stale dialogue without action */}
                            {!generateFromOutline && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Mark as resolved without generating - just dismiss the dialogue
                                        if(face.pageIndex) onChoice(face.pageIndex, '[SKIPPED]', true);
                                    }}
                                    className="comic-btn w-full py-2 text-xs bg-gray-400 text-white hover:bg-gray-300 font-bold tracking-wider border-2 border-black"
                                    title="Dismiss this dialogue (for stale/out-of-sync prompts)"
                                >
                                    ⏭️ Skip (Dismiss)
                                </button>
                            )}
                            {/* Stop Here Button - Novel Mode only */}
                            {onStopHere && !generateFromOutline && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onStopHere(); }}
                                    className="comic-btn w-full py-2 text-sm bg-red-600 text-white hover:bg-red-500 font-bold tracking-wider border-2 border-black mt-1"
                                >
                                    🏁 Stop Here (Wrap Up Story)
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="w-full flex gap-2" onClick={e => e.stopPropagation()}>
                            <input
                                type="text"
                                value={customChoiceText}
                                onChange={e => setCustomChoiceText(e.target.value)}
                                placeholder="Type your action..."
                                className="flex-1 p-3 font-comic text-black border-2 border-black focus:outline-none"
                                autoFocus
                                onKeyDown={e => {
                                    if(e.key === 'Enter' && customChoiceText.trim() && face.pageIndex) {
                                        onChoice(face.pageIndex, customChoiceText.trim(), true);
                                        setShowCustomChoice(false);
                                        setCustomChoiceText('');
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); if(customChoiceText.trim() && face.pageIndex) { onChoice(face.pageIndex, customChoiceText.trim(), true); setShowCustomChoice(false); setCustomChoiceText(''); } }}
                                className="comic-btn bg-green-600 text-white px-4 font-bold border-2 border-black hover:bg-green-500"
                            >
                                GO
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowCustomChoice(false); setCustomChoiceText(''); }}
                                className="comic-btn bg-red-600 text-white px-4 font-bold border-2 border-black hover:bg-red-500"
                            >
                                X
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Cover Action and Overlays */}
            {face.type === 'cover' && (
                 <>
                     {/* Comic Overlay UI */}
                     {storyContext.useOverlayLogo && (
                         <div className="absolute inset-0 pointer-events-none z-10 p-4 drop-shadow-md">
                             <div className="w-24 bg-white border-[3px] border-black flex flex-col items-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                 <div 
                                      className="w-full flex justify-center border-b-[3px] border-black overflow-hidden h-12 relative"
                                      style={{ backgroundColor: storyContext.publisherLogoBgColor || '#DC2626' }}
                                 >
                                     {storyContext.publisherLogo ? (
                                         <img src={`data:image/png;base64,${storyContext.publisherLogo}`} alt="Publisher" className={`w-full h-full object-${storyContext.publisherLogoFit || 'contain'}`} />
                                     ) : (
                                         <span className="font-comic text-white font-bold tracking-tighter text-sm uppercase self-center leading-none px-1 overflow-hidden pointer-events-none line-clamp-2">{storyContext.publisherName}</span>
                                     )}
                                 </div>
                                 <div className="text-xl font-bold font-comic w-full text-center py-1">{storyContext.issueNumber ? `#${storyContext.issueNumber}` : '#1'}</div>
                             </div>
                             
                             <div className="absolute top-6 left-0 right-0 flex flex-col items-center px-32 text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                                 <h1 className="font-comic text-[2.5rem] md:text-[3.5rem] tracking-tight uppercase leading-none" 
                                     style={{ 
                                         WebkitTextStroke: '2px black', 
                                         color: '#FFD700',
                                         textShadow: '0 4px 0 black, 4px 4px 0 black'
                                     }}>
                                     {storyContext.seriesTitle}
                                 </h1>
                                 {storyContext.title && (
                                     <h2 className="font-comic text-lg md:text-xl tracking-wide uppercase leading-none mt-1" 
                                         style={{ 
                                             WebkitTextStroke: '1px black', 
                                             color: 'white',
                                             textShadow: '0 2px 0 black, 2px 2px 0 black'
                                         }}>
                                         {storyContext.title}
                                     </h2>
                                 )}
                             </div>
                         </div>
                     )}

                     <div className="absolute bottom-20 inset-x-0 flex flex-col items-center gap-2 z-20 px-8">
                         {(() => {
                             const config = getComicConfig(storyContext.pageLength);
                             const isReady = !!allFaces.find(f => f.pageIndex === config.GATE_PAGE)?.imageUrl;
                             
                             if (!isReady) {
                                 // Calculate progress
                                 const loadedCount = allFaces.filter(f => f.imageUrl).length;
                                 const totalToWait = generateFromOutline ? config.TOTAL_PAGES + 2 : config.INITIAL_PAGES + 1; // +cover
                                 const progressPercent = Math.min(100, Math.round((loadedCount / totalToWait) * 100));

                                 return (
                                     <div className="w-full max-w-sm flex flex-col items-center gap-2">
                                         <button disabled className="comic-btn w-full bg-gray-400 px-10 py-4 text-2xl md:text-3xl font-bold border-[3px] border-black cursor-wait">
                                             PRINTING... {loadedCount}/{totalToWait}
                                         </button>
                                         <div className="w-full h-6 bg-gray-300 border-[3px] border-black overflow-hidden relative">
                                             <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }}></div>
                                             {/* Shine effect for comic feel */}
                                             <div className="absolute top-0 left-0 right-0 h-2 bg-white/30"></div>
                                         </div>
                                         {onStop && (
                                              <button onClick={(e) => { e.stopPropagation(); onStop(); }} className="mt-2 comic-btn w-full bg-red-600 text-white font-bold tracking-wider hover:bg-red-500 hover:-translate-y-1 transition-transform border-[3px] border-black p-2 uppercase text-sm shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                                  🛑 Stop Generating (Save Partial)
                                              </button>
                                         )}
                                     </div>
                                 );
                             } else {
                                 const remainingGenerating = allFaces.filter(f => f.isLoading).length;
                                 return (
                                     <div className="flex flex-col items-center gap-2">
                                         <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                                          className="comic-btn bg-yellow-400 px-10 py-4 text-3xl font-bold hover:scale-105 animate-bounce border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black">
                                             READ ISSUE #{storyContext.issueNumber || '1'}
                                         </button>
                                         {remainingGenerating > 0 && generateFromOutline && (
                                             <div className="bg-black/80 px-4 py-1 rounded text-white font-comic text-xs flex items-center gap-2">
                                                 <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                                 Generating remaining pages ({allFaces.filter(f => f.imageUrl).length}/{config.TOTAL_PAGES + 2})
                                             </div>
                                         )}
                                         {remainingGenerating > 0 && onStop && (
                                              <button onClick={(e) => { e.stopPropagation(); onStop(); }} className="mt-2 comic-btn w-full bg-red-600 text-white font-bold tracking-wider hover:bg-red-500 hover:-translate-y-1 transition-transform border-[3px] border-black p-2 uppercase text-sm shadow-[4px_4px_0px_rgba(0,0,0,1)] pointer-events-auto">
                                                  🛑 Stop Generating (Save Partial)
                                              </button>
                                         )}
                                     </div>
                                 );
                             }
                         })()}
                     </div>
                 </>
            )}

            {/* Back Cover Actions */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-3 z-20 px-8">
                    <div className="flex flex-col gap-2 w-full max-w-sm">
                        <button onClick={(e) => { e.stopPropagation(); if(onAddPage) onAddPage(); }} className="comic-btn bg-purple-600 text-white w-full py-3 text-lg font-bold hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] text-center border-[3px] border-black text-shadow-sm transition-transform">
                            ➕ Continue Story (Auto)
                        </button>
                        <button onClick={(e) => { 
                            e.stopPropagation(); 
                            const p = window.prompt("What should happen on the next page?");
                            if(p && onAddPage) onAddPage(p);
                        }} className="comic-btn bg-indigo-600 text-white w-full py-3 text-lg font-bold hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] text-center border-[3px] border-black text-shadow-sm transition-transform">
                            ✍️ Continue (Custom Input)
                        </button>
                    </div>
                    <div className="flex gap-2 w-full max-w-sm mt-2">
                        <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="comic-btn bg-blue-600 text-white flex-1 py-3 text-sm font-bold hover:scale-105 text-center border-[3px] border-black">DOWNLOAD</button>
                        <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="comic-btn bg-green-600 text-white flex-1 py-3 text-sm font-bold hover:scale-105 text-center border-[3px] border-black">NEW ISSUE</button>
                    </div>
                </div>
            )}
        </div>
    );
}
