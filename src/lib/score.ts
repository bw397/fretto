import { useCallback, useSyncExternalStore } from "react";
import { persist } from "./persist";

/**
 * Per-screen scores kept outside React, so they survive a screen being
 * unmounted when the user switches screens. Saved to IndexedDB (see
 * `persist.ts`), so they survive a reload too.
 */
export interface Score {
  correct: number;
  total: number;
  /** Consecutive correct answers. */
  streak: number;
}

const EMPTY: Score = { correct: 0, total: 0, streak: 0 };
/** After this many questions the count starts again from 1. */
export const MAX_TOTAL = 999;
const PREFIX = "score:";
const scores = new Map<string, Score>();
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Fill the scores from saved data. Call once, before the first render. */
export function restoreScores(saved: Map<string, unknown>) {
  for (const [k, v] of saved) {
    if (k.startsWith(PREFIX)) scores.set(k.slice(PREFIX.length), v as Score);
  }
}

export function getScore(id: string): Score {
  return scores.get(id) ?? EMPTY;
}

export function recordAnswer(id: string, ok: boolean) {
  const s = getScore(id);
  // Question 1000 starts a fresh count at 1/1 or 0/1; the streak carries on.
  const restart = s.total >= MAX_TOTAL;
  const next: Score = {
    correct: (restart ? 0 : s.correct) + (ok ? 1 : 0),
    total: (restart ? 0 : s.total) + 1,
    streak: ok ? s.streak + 1 : 0,
  };
  scores.set(id, next);
  persist(PREFIX + id, next);
  listeners.forEach((fn) => fn());
}

export function useScore(id: string) {
  const score = useSyncExternalStore(subscribe, () => getScore(id));
  const record = useCallback((ok: boolean) => recordAnswer(id, ok), [id]);
  return { score, record };
}
