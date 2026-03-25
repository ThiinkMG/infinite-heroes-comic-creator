/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Claude AI Helper Functions
 * Provides utilities for text/analysis generation using Anthropic's Claude API
 */

// Types for Claude message content
export interface ClaudeImageContent {
    type: 'image';
    source: {
        type: 'base64';
        media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        data: string;
    };
}

export interface ClaudeTextContent {
    type: 'text';
    text: string;
}

export type ClaudeContentBlock = ClaudeImageContent | ClaudeTextContent;

/**
 * Detects the actual image mime type from base64 data by checking magic bytes
 */
export function detectImageMimeType(base64Data: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    // Remove data URL prefix if present
    const cleanData = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // Check first few characters of base64 which represent magic bytes
    // PNG: starts with iVBORw0KGgo (decodes to \x89PNG)
    // JPEG: starts with /9j/ (decodes to \xFF\xD8)
    // GIF: starts with R0lGOD (decodes to GIF)
    // WebP: starts with UklGR (decodes to RIFF)

    if (cleanData.startsWith('iVBORw0KGgo')) return 'image/png';
    if (cleanData.startsWith('/9j/')) return 'image/jpeg';
    if (cleanData.startsWith('R0lGOD')) return 'image/gif';
    if (cleanData.startsWith('UklGR')) return 'image/webp';

    // Default to jpeg if unknown
    return 'image/jpeg';
}

/**
 * Creates an image content block for Claude's vision capability
 * Auto-detects mime type if 'auto' is specified or if provided type doesn't match actual image
 */
export function createImageContent(base64Data: string, mimeType: string = 'auto'): ClaudeImageContent {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const cleanData = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

    // Auto-detect the actual mime type from the image data
    const detectedMimeType = detectImageMimeType(cleanData);

    // Use detected type if 'auto' or if there's a mismatch (prevents Claude 400 errors)
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    let finalMimeType: ClaudeImageContent['source']['media_type'];

    if (mimeType === 'auto' || !validMimeTypes.includes(mimeType)) {
        finalMimeType = detectedMimeType;
    } else {
        // Use detected type to prevent mime type mismatch errors
        finalMimeType = detectedMimeType;
    }

    return {
        type: 'image',
        source: {
            type: 'base64',
            media_type: finalMimeType,
            data: cleanData
        }
    };
}

/**
 * Creates a text content block
 */
export function createTextContent(text: string): ClaudeTextContent {
    return {
        type: 'text',
        text
    };
}

/**
 * Extracts JSON from Claude's response, handling potential markdown formatting
 */
export function extractJsonFromResponse(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Find JSON object boundaries
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    return cleaned;
}

/**
 * Safely ensures a value is a string (handles AI returning objects instead of strings)
 */
export function ensureString(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        return Object.entries(val as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
    }
    return String(val);
}

/**
 * Extracts text from Claude's response content array
 */
export function getTextFromClaudeResponse(content: Array<{ type: string; text?: string }>): string {
    const textBlock = content.find(block => block.type === 'text');
    return textBlock?.text || '';
}
