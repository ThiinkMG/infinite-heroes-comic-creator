/**
 * IndexedDB Storage Utility for Large Image Storage
 *
 * LocalStorage has ~5MB limit which is insufficient for comic images.
 * IndexedDB provides significantly more storage (typically 50MB-unlimited depending on browser).
 *
 * This module provides a simple API for storing/retrieving base64 images with
 * automatic fallback to localStorage if IndexedDB is unavailable.
 */

// Database configuration
const DB_NAME = 'InfiniteHeroesDB';
const DB_VERSION = 1;
const IMAGES_STORE = 'images';

// Type definitions
export interface StoredImage {
  key: string;
  data: string;
  timestamp: number;
  size: number;
}

export interface StorageUsage {
  imageCount: number;
  estimatedBytes: number;
  estimatedMB: number;
}

export interface IndexedDBResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  usedFallback?: boolean;
}

// Database instance (cached after first initialization)
let dbInstance: IDBDatabase | null = null;

/**
 * Check if IndexedDB is available in the current environment
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Initialize the IndexedDB database
 * Creates the database and object store if they don't exist
 */
export async function initDB(): Promise<IndexedDBResult<IDBDatabase>> {
  // Return cached instance if available
  if (dbInstance) {
    return { success: true, data: dbInstance };
  }

  // Check if IndexedDB is available
  if (!isIndexedDBAvailable()) {
    return {
      success: false,
      error: 'IndexedDB is not available in this environment',
      usedFallback: true
    };
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        resolve({
          success: false,
          error: `Failed to open database: ${request.error?.message || 'Unknown error'}`,
          usedFallback: true
        });
      };

      request.onsuccess = () => {
        dbInstance = request.result;

        // Handle database connection closing unexpectedly
        dbInstance.onclose = () => {
          dbInstance = null;
        };

        resolve({ success: true, data: dbInstance });
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create the images object store if it doesn't exist
        if (!db.objectStoreNames.contains(IMAGES_STORE)) {
          const store = db.createObjectStore(IMAGES_STORE, { keyPath: 'key' });
          // Create index for timestamp to allow sorting by date
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    } catch (error) {
      resolve({
        success: false,
        error: `Exception during database initialization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        usedFallback: true
      });
    }
  });
}

/**
 * Calculate the byte size of a base64 string
 */
function calculateBase64Size(base64: string): number {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  // Base64 encodes 3 bytes as 4 characters, so actual size is roughly 3/4 of string length
  return Math.ceil((base64Data.length * 3) / 4);
}

/**
 * Save an image to IndexedDB storage
 * Falls back to localStorage if IndexedDB is unavailable
 */
export async function saveImage(key: string, base64: string): Promise<IndexedDBResult<void>> {
  const dbResult = await initDB();

  // Fallback to localStorage if IndexedDB unavailable
  if (!dbResult.success || !dbResult.data) {
    try {
      localStorage.setItem(`ih_img_${key}`, base64);
      return { success: true, usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error: `localStorage fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        usedFallback: true
      };
    }
  }

  const db = dbResult.data;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);

      const imageData: StoredImage = {
        key,
        data: base64,
        timestamp: Date.now(),
        size: calculateBase64Size(base64)
      };

      const request = store.put(imageData);

      request.onsuccess = () => {
        resolve({ success: true });
      };

      request.onerror = () => {
        // Try localStorage fallback on IndexedDB write failure
        try {
          localStorage.setItem(`ih_img_${key}`, base64);
          resolve({ success: true, usedFallback: true });
        } catch (fallbackError) {
          resolve({
            success: false,
            error: `Failed to save image: ${request.error?.message || 'Unknown error'}`,
            usedFallback: true
          });
        }
      };

      transaction.onerror = () => {
        resolve({
          success: false,
          error: `Transaction failed: ${transaction.error?.message || 'Unknown error'}`
        });
      };
    } catch (error) {
      resolve({
        success: false,
        error: `Exception during save: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}

/**
 * Retrieve an image from IndexedDB storage
 * Falls back to localStorage if IndexedDB is unavailable
 */
export async function getImage(key: string): Promise<IndexedDBResult<string>> {
  const dbResult = await initDB();

  // Fallback to localStorage if IndexedDB unavailable
  if (!dbResult.success || !dbResult.data) {
    try {
      const data = localStorage.getItem(`ih_img_${key}`);
      if (data) {
        return { success: true, data, usedFallback: true };
      }
      return { success: false, error: 'Image not found', usedFallback: true };
    } catch (error) {
      return {
        success: false,
        error: `localStorage fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        usedFallback: true
      };
    }
  }

  const db = dbResult.data;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([IMAGES_STORE], 'readonly');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          const storedImage = request.result as StoredImage;
          resolve({ success: true, data: storedImage.data });
        } else {
          // Check localStorage fallback
          try {
            const fallbackData = localStorage.getItem(`ih_img_${key}`);
            if (fallbackData) {
              resolve({ success: true, data: fallbackData, usedFallback: true });
            } else {
              resolve({ success: false, error: 'Image not found' });
            }
          } catch {
            resolve({ success: false, error: 'Image not found' });
          }
        }
      };

      request.onerror = () => {
        resolve({
          success: false,
          error: `Failed to retrieve image: ${request.error?.message || 'Unknown error'}`
        });
      };
    } catch (error) {
      resolve({
        success: false,
        error: `Exception during retrieval: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}

/**
 * Delete an image from IndexedDB storage
 * Also removes any localStorage fallback copy
 */
export async function deleteImage(key: string): Promise<IndexedDBResult<void>> {
  // Always try to remove from localStorage fallback
  try {
    localStorage.removeItem(`ih_img_${key}`);
  } catch {
    // Ignore localStorage errors
  }

  const dbResult = await initDB();

  if (!dbResult.success || !dbResult.data) {
    return { success: true, usedFallback: true };
  }

  const db = dbResult.data;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve({ success: true });
      };

      request.onerror = () => {
        resolve({
          success: false,
          error: `Failed to delete image: ${request.error?.message || 'Unknown error'}`
        });
      };
    } catch (error) {
      resolve({
        success: false,
        error: `Exception during deletion: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}

/**
 * Clear all images from IndexedDB storage
 * Also clears any localStorage fallback images
 */
export async function clearAllImages(): Promise<IndexedDBResult<void>> {
  // Clear localStorage fallback images
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ih_img_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore localStorage errors
  }

  const dbResult = await initDB();

  if (!dbResult.success || !dbResult.data) {
    return { success: true, usedFallback: true };
  }

  const db = dbResult.data;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        resolve({ success: true });
      };

      request.onerror = () => {
        resolve({
          success: false,
          error: `Failed to clear images: ${request.error?.message || 'Unknown error'}`
        });
      };
    } catch (error) {
      resolve({
        success: false,
        error: `Exception during clear: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}

/**
 * Get storage usage statistics
 * Returns estimated storage used by all images
 */
export async function getStorageUsage(): Promise<IndexedDBResult<StorageUsage>> {
  const dbResult = await initDB();

  // Calculate localStorage fallback usage
  let localStorageBytes = 0;
  let localStorageCount = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ih_img_')) {
        const value = localStorage.getItem(key);
        if (value) {
          localStorageBytes += value.length * 2; // UTF-16 = 2 bytes per char
          localStorageCount++;
        }
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  if (!dbResult.success || !dbResult.data) {
    return {
      success: true,
      data: {
        imageCount: localStorageCount,
        estimatedBytes: localStorageBytes,
        estimatedMB: localStorageBytes / (1024 * 1024)
      },
      usedFallback: true
    };
  }

  const db = dbResult.data;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([IMAGES_STORE], 'readonly');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const images = request.result as StoredImage[];
        let totalBytes = 0;

        images.forEach(img => {
          // Use stored size if available, otherwise calculate
          totalBytes += img.size || calculateBase64Size(img.data);
        });

        // Add localStorage fallback bytes
        totalBytes += localStorageBytes;

        resolve({
          success: true,
          data: {
            imageCount: images.length + localStorageCount,
            estimatedBytes: totalBytes,
            estimatedMB: totalBytes / (1024 * 1024)
          }
        });
      };

      request.onerror = () => {
        resolve({
          success: false,
          error: `Failed to get storage usage: ${request.error?.message || 'Unknown error'}`
        });
      };
    } catch (error) {
      resolve({
        success: false,
        error: `Exception during usage calculation: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}

/**
 * Get all image keys stored in IndexedDB
 * Useful for debugging or migration
 */
export async function getAllImageKeys(): Promise<IndexedDBResult<string[]>> {
  const dbResult = await initDB();

  // Get localStorage fallback keys
  const localKeys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ih_img_')) {
        localKeys.push(key.replace('ih_img_', ''));
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  if (!dbResult.success || !dbResult.data) {
    return {
      success: true,
      data: localKeys,
      usedFallback: true
    };
  }

  const db = dbResult.data;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([IMAGES_STORE], 'readonly');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const indexedDBKeys = request.result as string[];
        // Combine and deduplicate keys from both sources
        const allKeys = [...new Set([...indexedDBKeys, ...localKeys])];
        resolve({ success: true, data: allKeys });
      };

      request.onerror = () => {
        resolve({
          success: false,
          error: `Failed to get image keys: ${request.error?.message || 'Unknown error'}`
        });
      };
    } catch (error) {
      resolve({
        success: false,
        error: `Exception during key retrieval: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}

/**
 * Close the database connection
 * Useful for cleanup or testing
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Check if a specific image exists in storage
 */
export async function imageExists(key: string): Promise<boolean> {
  const result = await getImage(key);
  return result.success && !!result.data;
}

/**
 * Save multiple images in a batch operation
 * More efficient than individual saves for bulk operations
 */
export async function saveImagesBatch(
  images: Array<{ key: string; base64: string }>
): Promise<IndexedDBResult<{ saved: number; failed: number }>> {
  const dbResult = await initDB();

  if (!dbResult.success || !dbResult.data) {
    // Fallback to individual localStorage saves
    let saved = 0;
    let failed = 0;

    for (const img of images) {
      try {
        localStorage.setItem(`ih_img_${img.key}`, img.base64);
        saved++;
      } catch {
        failed++;
      }
    }

    return {
      success: true,
      data: { saved, failed },
      usedFallback: true
    };
  }

  const db = dbResult.data;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);

      let saved = 0;
      let failed = 0;
      let completed = 0;

      images.forEach(img => {
        const imageData: StoredImage = {
          key: img.key,
          data: img.base64,
          timestamp: Date.now(),
          size: calculateBase64Size(img.base64)
        };

        const request = store.put(imageData);

        request.onsuccess = () => {
          saved++;
          completed++;
          if (completed === images.length) {
            resolve({ success: true, data: { saved, failed } });
          }
        };

        request.onerror = () => {
          failed++;
          completed++;
          if (completed === images.length) {
            resolve({ success: true, data: { saved, failed } });
          }
        };
      });

      // Handle empty array
      if (images.length === 0) {
        resolve({ success: true, data: { saved: 0, failed: 0 } });
      }

      transaction.onerror = () => {
        resolve({
          success: false,
          error: `Batch transaction failed: ${transaction.error?.message || 'Unknown error'}`
        });
      };
    } catch (error) {
      resolve({
        success: false,
        error: `Exception during batch save: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
}
