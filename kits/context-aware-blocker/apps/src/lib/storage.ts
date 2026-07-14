// ** PRODUCTION LEVEL STORAGE: Isomorphic Storage Adapter ** //
// Safely wraps chrome.storage.local for the extension environment,
// while falling back to window.localStorage for local Next.js dev.

const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

export const storage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    // ** PRODUCTION LEVEL LOGIC: Extension Storage Retrieval ** //
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] !== undefined ? result[key] : defaultValue);
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

  async set<T>(key: string, value: T): Promise<void> {
    // ** PRODUCTION LEVEL LOGIC: Extension Storage Persistence ** //
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
