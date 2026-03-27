/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Auto-save hook with IndexedDB storage and localStorage fallback.
 * Provides automatic periodic saving with dirty state tracking and debouncing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AutoSaveOptions {
  /** Auto-save interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Debounce delay for rapid changes in milliseconds (default: 2000 = 2 seconds) */
  debounceDelay?: number;
  /** Minimum data size to trigger save (prevents saving empty state) */
  minDataSize?: number;
  /** Callback when save completes successfully */
  onSaveSuccess?: (timestamp: Date) => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

export interface AutoSaveState {
  /** Whether auto-save is currently enabled */
  isEnabled: boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Timestamp of the last successful save */
  lastSaveTime: Date | null;
  /** Error from the last save attempt (null if successful) */
  lastError: Error | null;
  /** Storage method used ('indexeddb' | 'localstorage' | null) */
  storageMethod: 'indexeddb' | 'localstorage' | null;
}

export interface AutoSaveReturn extends AutoSaveState {
  /** Manually trigger a save */
  saveNow: () => Promise<boolean>;
  /** Mark data as dirty (triggers save on next interval) */
  markDirty: () => void;
  /** Clear dirty state without saving */
  clearDirty: () => void;
  /** Enable or disable auto-save */
  setEnabled: (enabled: boolean) => void;
  /** Load saved data (returns null if none exists) */
  loadSavedData: () => Promise<unknown | null>;
  /** Clear all saved data for this key */
  clearSavedData: () => Promise<void>;
}

// ============================================================================
// INDEXEDDB HELPERS
// ============================================================================

const DB_NAME = 'InfiniteHeroesAutoSaveDB';
const DB_VERSION = 1;
const STORE_NAME = 'autosave';

interface AutoSaveRecord {
  key: string;
  data: string;
  timestamp: number;
  size: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Initialize or get the IndexedDB database instance
 */
async function getDB(): Promise<IDBDatabase | null> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!isIndexedDBAvailable()) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('[useAutoSave] IndexedDB open failed:', request.error);
        resolve(null);
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        dbInstance.onclose = () => {
          dbInstance = null;
        };
        resolve(dbInstance);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    } catch (error) {
      console.warn('[useAutoSave] IndexedDB exception:', error);
      resolve(null);
    }
  });
}

/**
 * Save data to IndexedDB
 */
async function saveToIndexedDB(key: string, data: string): Promise<boolean> {
  const db = await getDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: AutoSaveRecord = {
        key,
        data,
        timestamp: Date.now(),
        size: data.length,
      };

      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.warn('[useAutoSave] IndexedDB write failed:', request.error);
        resolve(false);
      };
    } catch (error) {
      console.warn('[useAutoSave] IndexedDB write exception:', error);
      resolve(false);
    }
  });
}

/**
 * Load data from IndexedDB
 */
async function loadFromIndexedDB(key: string): Promise<string | null> {
  const db = await getDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          resolve((request.result as AutoSaveRecord).data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('[useAutoSave] IndexedDB read failed:', request.error);
        resolve(null);
      };
    } catch (error) {
      console.warn('[useAutoSave] IndexedDB read exception:', error);
      resolve(null);
    }
  });
}

/**
 * Delete data from IndexedDB
 */
async function deleteFromIndexedDB(key: string): Promise<boolean> {
  const db = await getDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

const LOCALSTORAGE_PREFIX = 'ih_autosave_';

/**
 * Save data to localStorage (fallback)
 */
function saveToLocalStorage(key: string, data: string): boolean {
  try {
    localStorage.setItem(`${LOCALSTORAGE_PREFIX}${key}`, data);
    return true;
  } catch (error) {
    // localStorage might be full or unavailable
    console.warn('[useAutoSave] localStorage write failed:', error);
    return false;
  }
}

/**
 * Load data from localStorage
 */
function loadFromLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(`${LOCALSTORAGE_PREFIX}${key}`);
  } catch (error) {
    console.warn('[useAutoSave] localStorage read failed:', error);
    return null;
  }
}

/**
 * Delete data from localStorage
 */
function deleteFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(`${LOCALSTORAGE_PREFIX}${key}`);
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Auto-save hook for persisting data with IndexedDB/localStorage fallback.
 *
 * @param data - The data to auto-save (will be JSON stringified)
 * @param key - Unique storage key for this data
 * @param options - Configuration options
 * @returns AutoSaveReturn with state and control functions
 *
 * @example
 * ```tsx
 * const autoSave = useAutoSave(
 *   { characters, storyContext, comicFaces },
 *   'comic-draft',
 *   { interval: 30000, onSaveSuccess: () => console.log('Saved!') }
 * );
 *
 * // Show save indicator
 * {autoSave.isSaving && <span>Saving...</span>}
 * {autoSave.isDirty && <span>Unsaved changes</span>}
 * ```
 */
export function useAutoSave<T>(
  data: T,
  key: string,
  options: AutoSaveOptions = {}
): AutoSaveReturn {
  const {
    interval = 30000,
    debounceDelay = 2000,
    minDataSize = 10,
    onSaveSuccess,
    onSaveError,
    enabled: initialEnabled = true,
  } = options;

  // State
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [storageMethod, setStorageMethod] = useState<'indexeddb' | 'localstorage' | null>(null);

  // Refs for tracking
  const dataRef = useRef<T>(data);
  const lastSavedDataRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, []);

  /**
   * Check if data has meaningful content worth saving
   */
  const hasMinimumData = useCallback((dataString: string): boolean => {
    if (dataString.length < minDataSize) {
      return false;
    }

    // Try to parse and check for actual content
    try {
      const parsed = JSON.parse(dataString);
      // Check if it's an object with some non-null values
      if (typeof parsed === 'object' && parsed !== null) {
        const hasContent = Object.values(parsed).some((value) => {
          if (value === null || value === undefined) return false;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'object') return Object.keys(value).length > 0;
          if (typeof value === 'string') return value.trim().length > 0;
          return true;
        });
        return hasContent;
      }
      return true;
    } catch {
      return dataString.length >= minDataSize;
    }
  }, [minDataSize]);

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async (dataToSave: string): Promise<boolean> => {
    if (!isMountedRef.current) return false;

    // Check if data has changed since last save
    if (dataToSave === lastSavedDataRef.current) {
      setIsDirty(false);
      return true;
    }

    // Check minimum data requirements
    if (!hasMinimumData(dataToSave)) {
      console.log('[useAutoSave] Skipping save - insufficient data');
      return false;
    }

    setIsSaving(true);
    setLastError(null);

    try {
      // Try IndexedDB first
      const indexedDBSuccess = await saveToIndexedDB(key, dataToSave);

      if (indexedDBSuccess) {
        if (isMountedRef.current) {
          setStorageMethod('indexeddb');
          lastSavedDataRef.current = dataToSave;
          setIsDirty(false);
          const now = new Date();
          setLastSaveTime(now);
          onSaveSuccess?.(now);
        }
        console.log('[useAutoSave] Saved to IndexedDB:', key, 'size:', dataToSave.length);
        return true;
      }

      // Fallback to localStorage
      const localStorageSuccess = saveToLocalStorage(key, dataToSave);

      if (localStorageSuccess) {
        if (isMountedRef.current) {
          setStorageMethod('localstorage');
          lastSavedDataRef.current = dataToSave;
          setIsDirty(false);
          const now = new Date();
          setLastSaveTime(now);
          onSaveSuccess?.(now);
        }
        console.log('[useAutoSave] Saved to localStorage:', key, 'size:', dataToSave.length);
        return true;
      }

      throw new Error('Both IndexedDB and localStorage save failed');
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error(String(error));
      console.error('[useAutoSave] Save failed:', saveError);

      if (isMountedRef.current) {
        setLastError(saveError);
        onSaveError?.(saveError);
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [key, hasMinimumData, onSaveSuccess, onSaveError]);

  /**
   * Mark data as dirty and schedule a debounced save
   */
  const markDirty = useCallback(() => {
    setIsDirty(true);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && isEnabled) {
        const dataString = JSON.stringify(dataRef.current);
        performSave(dataString);
      }
    }, debounceDelay);
  }, [debounceDelay, isEnabled, performSave]);

  /**
   * Clear dirty state without saving
   */
  const clearDirty = useCallback(() => {
    setIsDirty(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  /**
   * Manually trigger an immediate save
   */
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const dataString = JSON.stringify(dataRef.current);
    return performSave(dataString);
  }, [performSave]);

  /**
   * Load previously saved data
   */
  const loadSavedData = useCallback(async (): Promise<T | null> => {
    // Try IndexedDB first
    const indexedDBData = await loadFromIndexedDB(key);
    if (indexedDBData) {
      try {
        const parsed = JSON.parse(indexedDBData) as T;
        lastSavedDataRef.current = indexedDBData;
        setStorageMethod('indexeddb');
        console.log('[useAutoSave] Loaded from IndexedDB:', key);
        return parsed;
      } catch (error) {
        console.warn('[useAutoSave] Failed to parse IndexedDB data:', error);
      }
    }

    // Fallback to localStorage
    const localStorageData = loadFromLocalStorage(key);
    if (localStorageData) {
      try {
        const parsed = JSON.parse(localStorageData) as T;
        lastSavedDataRef.current = localStorageData;
        setStorageMethod('localstorage');
        console.log('[useAutoSave] Loaded from localStorage:', key);
        return parsed;
      } catch (error) {
        console.warn('[useAutoSave] Failed to parse localStorage data:', error);
      }
    }

    return null;
  }, [key]);

  /**
   * Clear all saved data for this key
   */
  const clearSavedData = useCallback(async (): Promise<void> => {
    await deleteFromIndexedDB(key);
    deleteFromLocalStorage(key);
    lastSavedDataRef.current = '';
    setLastSaveTime(null);
    setStorageMethod(null);
    console.log('[useAutoSave] Cleared saved data:', key);
  }, [key]);

  /**
   * Enable or disable auto-save
   */
  const setEnabled = useCallback((value: boolean) => {
    setIsEnabled(value);
    if (!value && debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Detect data changes and mark as dirty
  useEffect(() => {
    const currentDataString = JSON.stringify(data);

    // Only mark dirty if data actually changed from last saved version
    if (currentDataString !== lastSavedDataRef.current && isEnabled) {
      setIsDirty(true);
    }
  }, [data, isEnabled]);

  // Set up periodic auto-save interval
  useEffect(() => {
    if (!isEnabled) {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
      return;
    }

    intervalTimerRef.current = setInterval(() => {
      if (isMountedRef.current && isDirty && !isSaving) {
        const dataString = JSON.stringify(dataRef.current);
        performSave(dataString);
      }
    }, interval);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
    };
  }, [isEnabled, interval, isDirty, isSaving, performSave]);

  // Save before unload (browser close/navigate away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty && isEnabled) {
        // Use synchronous localStorage as last resort for beforeunload
        try {
          const dataString = JSON.stringify(dataRef.current);
          if (hasMinimumData(dataString)) {
            saveToLocalStorage(key, dataString);
            console.log('[useAutoSave] Emergency save before unload');
          }
        } catch (error) {
          console.warn('[useAutoSave] Emergency save failed:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, isEnabled, key, hasMinimumData]);

  return {
    // State
    isEnabled,
    isDirty,
    isSaving,
    lastSaveTime,
    lastError,
    storageMethod,
    // Actions
    saveNow,
    markDirty,
    clearDirty,
    setEnabled,
    loadSavedData,
    clearSavedData,
  };
}

export default useAutoSave;
