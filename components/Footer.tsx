/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
// @ts-ignore
import thiinkLogo from '../assets/thiink_mg_logo.svg';

/**
 * Footer component displaying rotating remix ideas and attribution links.
 * Shows at the bottom of the setup screen.
 */
export const Footer: React.FC = () => {
    const [remixIndex, setRemixIndex] = useState(0);
    const remixes = [
        "Add sounds to panels",
        "Animate panels with Veo 3",
        "Localize to Klingon",
        "Add a villain generator",
        "Print physical copies",
        "Add voice narration",
        "Create a shared universe"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setRemixIndex(prev => (prev + 1) % remixes.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-yellow-400 font-comic">
            <div className="flex items-center gap-2 text-lg md:text-xl">
                <span className="text-yellow-400 font-bold">REMIX IDEA:</span>
                <span className="animate-pulse">{remixes[remixIndex]}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
                <span className="text-gray-500 text-sm hidden md:inline">Built with Gemini</span>
                <div className="flex items-center gap-3 border-r-2 border-gray-700 pr-4">
                    <span className="text-gray-400 text-sm hidden sm:inline">Contributed by</span>
                    <a href="https://thiinkmediagraphics.com" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
                        <img src={thiinkLogo} alt="Thiink Media Graphics" className="h-6 object-contain filter invert opacity-90" />
                    </a>
                </div>
                <a href="https://x.com/ammaar" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors text-xl">Created by @ammaar</a>
            </div>
        </div>
    );
};

export default Footer;
