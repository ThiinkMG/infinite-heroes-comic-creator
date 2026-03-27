/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import thiinkLogo from '../assets/thiink_mg_logo.svg';
// @ts-ignore
import githubLogo from '../assets/GitHub_Invertocat_White.svg';

/**
 * Footer component displaying attribution links.
 * Shows at the bottom of the setup screen.
 */
export const Footer: React.FC = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-yellow-400 font-comic">
            <div className="flex items-center gap-2 mb-2 md:mb-0">
                <a
                    href="https://github.com/ThiinkMG/infinite-heroes-comic-creator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white hover:text-yellow-400 transition-colors group"
                >
                    <img src={githubLogo} alt="GitHub" className="h-5 w-5 group-hover:opacity-80 transition-opacity" />
                    <span className="text-sm font-bold">View on GitHub</span>
                </a>
            </div>
            <div className="flex items-center gap-4">
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
