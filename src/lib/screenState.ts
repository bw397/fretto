import { useEffect, useState } from "react";
import { persist } from "./persist";

/**
 * Values kept outside React so a screen's state survives it being unmounted
 * when the user switches screens. Saved to IndexedDB (see `persist.ts`), so
 * they survive a reload too.
 */
const store = new Map<string, unknown>();
const PREFIX = "state:";

/** Fill the store from saved data. Call once, before the first render. */
export function restoreScreenState(saved: Map<string, unknown>) {
  for (const [k, v] of saved) {
    if (k.startsWith(PREFIX)) store.set(k.slice(PREFIX.length), v);
  }
}

export function readScreenState<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function writeScreenState(key: string, value: unknown) {
  store.set(key, value);
  persist(PREFIX + key, value);
}

/**
 * Like useState, but remembered under `key` across screen switches and
 * reloads. Values must be plain data (they're saved with structured clone).
 */
export function useScreenState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() =>
    store.has(key)
      ? (store.get(key) as T)
      : typeof initial === "function"
        ? (initial as () => T)()
        : initial,
  );
  useEffect(() => {
    if (store.get(key) !== value) writeScreenState(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}
