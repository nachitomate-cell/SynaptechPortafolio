import { useEffect, useState } from "react";

/**
 * Like useState, but persisted to localStorage under `key`. The initial render
 * reads any stored value (falling back to `initial`), and every change is
 * written back. Safe if storage is unavailable (private mode) — it degrades to
 * plain in-memory state.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / unavailable storage */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
