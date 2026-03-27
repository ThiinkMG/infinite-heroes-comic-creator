/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CurrentImagePreview - Shows the current panel image at the top of RerollModal
 * Task 1.1.1 from V2 Batch Plan
 */

import React, { useState } from 'react';

interface CurrentImagePreviewProps {
    /** Base64 or URL of the current panel image */
    imageUrl: string;
    /** Page/panel index for display */
    pageIndex: number;
    /** Optional caption or scene description */
    caption?: string;
    /** Optional click handler for zoom */
    onZoom?: () => void;
}

export const CurrentImagePreview: React.FC<CurrentImagePreviewProps> = ({
    imageUrl,
    pageIndex,
    caption,
    onZoom
}) => {
    const [showZoomModal, setShowZoomModal] = useState(false);

    const handleImageClick = () => {
        if (onZoom) {
            onZoom();
        } else {
            setShowZoomModal(true);
        }
    };

    return (
        <>
            <div className="border-[3px] border-black bg-gray-100 p-3 sm:p-4">
                <div className="flex items-start gap-3 sm:gap-4">
                    {/* Thumbnail */}
                    <button
                        onClick={handleImageClick}
                        className="relative flex-shrink-0 group cursor-pointer border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.5)] transition-shadow"
                        title="Click to zoom"
                        aria-label="Zoom current image"
                    >
                        <img
                            src={imageUrl}
                            alt={`Current panel ${pageIndex}`}
                            className="w-24 h-32 sm:w-28 sm:h-36 object-cover"
                        />
                        {/* Zoom indicator overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                                🔍
                            </span>
                        </div>
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-comic text-sm sm:text-base font-bold text-gray-800 uppercase">
                                Current Panel
                            </span>
                            <span className="px-2 py-0.5 bg-yellow-400 border-2 border-black font-comic text-xs font-bold">
                                #{pageIndex}
                            </span>
                        </div>

                        {caption && (
                            <p className="font-comic text-xs sm:text-sm text-gray-600 line-clamp-3 mt-1">
                                {caption}
                            </p>
                        )}

                        <p className="font-comic text-[10px] sm:text-xs text-gray-400 mt-2">
                            Click image to zoom. Changes below will regenerate this panel.
                        </p>
                    </div>
                </div>
            </div>

            {/* Zoom Modal */}
            {showZoomModal && (
                <div
                    className="fixed inset-0 z-[600] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setShowZoomModal(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={imageUrl}
                            alt={`Panel ${pageIndex} zoomed`}
                            className="max-w-full max-h-[85vh] object-contain border-4 border-white shadow-2xl"
                        />
                        <button
                            onClick={() => setShowZoomModal(false)}
                            className="absolute -top-3 -right-3 w-10 h-10 bg-red-600 text-white border-3 border-black rounded-full flex items-center justify-center font-bold text-xl hover:bg-red-500 shadow-lg"
                            aria-label="Close zoom"
                        >
                            ✕
                        </button>
                        <div className="text-center mt-2">
                            <span className="font-comic text-white text-sm bg-black/50 px-3 py-1 rounded">
                                Panel #{pageIndex}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CurrentImagePreview;
