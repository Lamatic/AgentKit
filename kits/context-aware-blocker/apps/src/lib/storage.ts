// ** PRODUCTION LEVEL STORAGE: Isomorphic Storage Adapter ** //
// Safely wraps chrome.storage.local for the extension environment,
// while falling back to window.localStorage for local Next.js dev.

/**
 * Safely determines if the code is executing within a Chrome Extension context.
 * Useful for bridging isomorphic APIs.
 */
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

/**
 * An isomorphic storage adapter that seamlessly abstracts away the difference 
 * between the Chrome Extension environment (chrome.storage.local) and the standard 
 * web environment (window.localStorage).
 * 
 * NOTE: chrome.storage.local is asynchronous, while window.localStorage is synchronous. 
 * To normalize the API, all methods on this object are Promisified.
 */
export const storage = {
  /**
   * Retrieves a value from the active storage backend.
   * 
   * @template T
   * @param {string} key - The unique identifier of the stored item.
   * @param {T} defaultValue - The fallback value returned if the key does not exist.
   * @returns {Promise<T>} A promise resolving to the retrieved value or the default.
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    // NOTE: Extension Storage Retrieval
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve((result[key] !== undefined ? result[key] : defaultValue) as T);
        });
      });
    } else {
      if (typeof window === 'undefined') return defaultValue;
      const item = window.localStorage.getItem(key);
      if (item) {
        try {
          return JSON.parse(item) as T;
        } catch (e) {
          console.error(`Error parsing localStorage key "${key}":`, e);
          return defaultValue;
        }
      }
      return defaultValue;
    }
  },

  /**
   * Persists a value to the active storage backend.
   * 
   * @template T
   * @param {string} key - The unique identifier for the item.
   * @param {T} value - The JSON-serializable data to store.
   * @returns {Promise<void>} A promise resolving when the write completes.
   */
  async set<T>(key: string, value: T): Promise<void> {
    // NOTE: Extension Storage Persistence
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    } else {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  },
};
