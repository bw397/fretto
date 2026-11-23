/**
 * Scale Drill: a key and its root on the fretboard; place each other note of
 * the scale (the octave above the root) in random order.
 */
import { KEYS, sameKey, type MusicalKey } from "./keys";
import { MAX_FRET, STANDARD_TUNING, mod, soundingMidi, type FrettedNote } from "./music";
import { scaleFromRoot, type ScaleNote } from "./scale";

export interface ScaleRound {
  key: MusicalKey;
  root: FrettedNote;
  /** Scale degrees to ask (1 = 2nd … 6 = 7th), in question order. */
  order: number[];
}

const ORDINALS = ["root", "2nd", "3rd", "4th", "5th", "6th", "7th", "octave"];
export const degreeName = (degree: number) => ORDINALS[degree]!;

/**
 * Root positions for `key` where the whole ascending octave fits on the
 * fretboard: every note has a position (no lower than the root's fret,
 * within fret 12) using the same fingering as the Scale reference screen.
 */
export function rootPositionsForKey(key: MusicalKey): FrettedNote[] {
  const out: FrettedNote[] = [];
  STANDARD_TUNING.forEach((open, string) => {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      if (mod(open + fret, 12) !== key.tonic.pc) continue;
      const root = { string, fret };
      if (scaleFromRoot(root, key.mode).notes.every((n) => n.position)) out.push(root);
    }
  });
  return out;
}

/** The eight notes (root … octave) with their pitches and standard positions. */
export function scaleNotes(round: Pick<ScaleRound, "key" | "root">): ScaleNote[] {
  return scaleFromRoot(round.root, round.key.mode).notes;
}

/** Correct if the tap plays exactly that scale note's pitch (any string). */
export function isCorrectTap(note: ScaleNote, tap: FrettedNote): boolean {
  return soundingMidi(tap) === note.midi;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function randomScaleRound(rand: () => number = Math.random, avoid?: MusicalKey): ScaleRound {
  let key = KEYS[Math.floor(rand() * KEYS.length)]!;
  while (sameKey(key, avoid)) key = KEYS[Math.floor(rand() * KEYS.length)]!;
  const roots = rootPositionsForKey(key);
  const root = roots[Math.floor(rand() * roots.length)]!;
  return { key, root, order: shuffle([1, 2, 3, 4, 5, 6], rand) };
}
