// Safe Storage utility for iOS Safari, Private Browsing, and restricted WebViews

const memoryStore = new Map<string, string>();

function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const storage = window[type];
    if (!storage) return false;
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = isStorageAvailable('localStorage');
const hasSessionStorage = isStorageAvailable('sessionStorage');

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (hasLocalStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fall back to memory
    }
    return memoryStore.get(`local:${key}`) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (hasLocalStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore or fall back
    }
    memoryStore.set(`local:${key}`, value);
  },

  removeItem: (key: string): void => {
    try {
      if (hasLocalStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
    memoryStore.delete(`local:${key}`);
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (hasSessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {
      // Fall back to memory
    }
    return memoryStore.get(`session:${key}`) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (hasSessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch {
      // Ignore or fall back
    }
    memoryStore.set(`session:${key}`, value);
  },

  removeItem: (key: string): void => {
    try {
      if (hasSessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
    memoryStore.delete(`session:${key}`);
  }
};
