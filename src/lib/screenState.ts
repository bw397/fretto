import { useEffect, useState } from "react";

/**
 * Values kept outside React so a screen's state survives it being unmounted
 * when the user switches screens. (In memory only: resets on page reload.)
 */
const store = new Map<string, unknown>();

/** Like useState, but remembered under `key` across screen switches. */
export function useScreenState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() =>
    store.has(key)
      ? (store.get(key) as T)
      : typeof initial === "function"
        ? (initial as () => T)()
        : initial,
  );
  useEffect(() => {
    store.set(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}
