import { StateStorage } from 'zustand/middleware';

const memoryFallback: Record<string, string> = {};

export const safeStateStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {
      // Fallback
    }
    return memoryFallback[name] || null;
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
    } catch {
      // Fallback
    }
    memoryFallback[name] = value;
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
        return;
      }
    } catch {
      // Fallback
    }
    delete memoryFallback[name];
  },
};
