/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Tooltip component that displays helpful information on hover.
 * Shows a question mark icon that reveals a tooltip with the provided text.
 */
export const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative group inline-block ml-1 cursor-help align-middle">
        <span className="font-comic text-[10px] bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold border border-black hover:bg-blue-500 hover:scale-110 transition-transform">?</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56 p-2 bg-white text-black text-xs font-comic border-2 border-black drop-shadow-md z-[500] pointer-events-none" style={{ textTransform: 'none' }}>
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black"></div>
        </div>
    </div>
);

export default Tooltip;
