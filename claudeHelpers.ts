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
 * Creates an image content block for Claude's vision capability
 */
export function createImageContent(base64Data: string, mimeType: string = 'image/jpeg'): ClaudeImageContent {
    // Claude accepts: image/jpeg, image/png, image/gif, image/webp
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const safeMimeType = validMimeTypes.includes(mimeType)
        ? mimeType as ClaudeImageContent['source']['media_type']
        : 'image/jpeg';

    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const cleanData = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

    return {
        type: 'image',
        source: {
            type: 'base64',
            media_type: safeMimeType,
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
