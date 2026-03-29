/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SessionMode = 'novel' | 'outline' | 'single';

export interface SessionEntry {
    id: string;
    title: string;
    mode: SessionMode;
    genre?: string;
    artStyle?: string;
    pageCount: number;
    thumbnail?: string; // base64 of first generated page (small)
    createdAt: number;
    updatedAt: number;
}

interface SessionHistoryState {
    sessions: SessionEntry[];
    /** Upsert a session (create or update) */
    upsert: (entry: SessionEntry) => void;
    /** Remove a session by id */
    remove: (id: string) => void;
    /** Remove all sessions */
    clear: () => void;
}

export const useSessionHistoryStore = create<SessionHistoryState>()(
    persist(
        (set) => ({
            sessions: [],

            upsert: (entry) => set(state => {
                const exists = state.sessions.find(s => s.id === entry.id);
                if (exists) {
                    return {
                        sessions: state.sessions.map(s => s.id === entry.id ? entry : s)
                    };
                }
                // Keep last 50 sessions
                const trimmed = [entry, ...state.sessions].slice(0, 50);
                return { sessions: trimmed };
            }),

            remove: (id) => set(state => ({
                sessions: state.sessions.filter(s => s.id !== id)
            })),

            clear: () => set({ sessions: [] })
        }),
        { name: 'infinite-heroes-session-history' }
    )
);
