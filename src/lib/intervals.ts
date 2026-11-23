import { MAX_FRET, STANDARD_TUNING, isNaturalPc, soundingMidi, type FrettedNote } from "./music";

export interface Interval {
  semitones: number;
  name: string;
  /** Compact label for fretboard markers. */
  short: string;
}

export const INTERVALS: Interval[] = [
  { semitones: 1, name: "minor second", short: "m2" },
  { semitones: 2, name: "second", short: "2" },
  { semitones: 3, name: "minor third", short: "m3" },
  { semitones: 4, name: "third", short: "3" },
  { semitones: 5, name: "fourth", short: "4" },
  { semitones: 6, name: "tritone", short: "TT" },
  { semitones: 7, name: "fifth", short: "5" },
  { semitones: 8, name: "minor sixth", short: "m6" },
  { semitones: 9, name: "sixth", short: "6" },
  { semitones: 10, name: "minor seventh", short: "m7" },
  { semitones: 11, name: "seventh", short: "7" },
  { semitones: 12, name: "octave", short: "8" },
];

export const PROMPT_COUNT = 5;

/** Every fretboard position (frets 0..maxFret) that sounds exactly `midi`. */
export function positionsForMidi(midi: number, maxFret: number = MAX_FRET): FrettedNote[] {
  return STANDARD_TUNING.map((open, string) => ({ string, fret: midi - open })).filter(
    (p) => p.fret >= 0 && p.fret <= maxFret,
  );
}

/** The position of `midi` nearest `from` (fret distance + 2× string distance). */
export function nearestPositionForMidi(midi: number, from: FrettedNote): FrettedNote | null {
  const all = positionsForMidi(midi);
  if (all.length === 0) return null;
  const dist = (p: FrettedNote) => Math.abs(p.fret - from.fret) + 2 * Math.abs(p.string - from.string);
  return all.reduce((best, p) => (dist(p) < dist(best) ? p : best));
}

export interface IntervalRound {
  root: FrettedNote;
  intervals: Interval[];
}

/**
 * A random natural-note root (no sharps or flats) within `maxFret` and
 * `PROMPT_COUNT` distinct intervals whose target notes can all be played
 * within `maxFret` as well.
 */
export function randomIntervalRound(
  maxFret: number = MAX_FRET,
  rand: () => number = Math.random,
  avoid?: FrettedNote,
): IntervalRound {
  const highest = Math.max(...STANDARD_TUNING) + maxFret;
  for (;;) {
    const root = {
      string: Math.floor(rand() * STANDARD_TUNING.length),
      fret: Math.floor(rand() * (maxFret + 1)),
    };
    if (avoid && root.string === avoid.string && root.fret === avoid.fret) continue;
    const rootMidi = soundingMidi(root);
    if (!isNaturalPc(rootMidi)) continue;
    const pool = INTERVALS.filter((i) => rootMidi + i.semitones <= highest);
    if (pool.length < PROMPT_COUNT) continue;
    const intervals: Interval[] = [];
    while (intervals.length < PROMPT_COUNT) {
      intervals.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]!);
    }
    return { root, intervals };
  }
}
