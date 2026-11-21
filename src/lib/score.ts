import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-screen scores kept in memory outside React, so they survive a screen
 * being unmounted when the user switches screens. (They reset on page reload.)
 */
export interface Score {
  correct: number;
  total: number;
  /** Consecutive correct answers. */
  streak: number;
}

const EMPTY: Score = { correct: 0, total: 0, streak: 0 };
const scores = new Map<string, Score>();
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getScore(id: string): Score {
  return scores.get(id) ?? EMPTY;
}

export function recordAnswer(id: string, ok: boolean) {
  const s = getScore(id);
  scores.set(id, {
    correct: s.correct + (ok ? 1 : 0),
    total: s.total + 1,
    streak: ok ? s.streak + 1 : 0,
  });
  listeners.forEach((fn) => fn());
}

export function useScore(id: string) {
  const score = useSyncExternalStore(subscribe, () => getScore(id));
  const record = useCallback((ok: boolean) => recordAnswer(id, ok), [id]);
  return { score, record };
}
