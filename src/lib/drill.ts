/**
 * String Drill: name a natural note, find it on one string. A set number of
 * questions per string, then on to the next string (in order or at random).
 */
import { LETTERS, LETTER_SEMITONES, MAX_FRET, STANDARD_TUNING, mod, type FrettedNote } from "./music";

export interface DrillNote {
  pc: number;
  name: string;
}

export type StringOrder = "progression" | "random";

export interface DrillSettings {
  /** Highest fret questions and answers use (5 or 12). */
  maxFret: number;
  order: StringOrder;
  perString: number;
}

export const QUESTIONS_PER_STRING_OPTIONS = [3, 5, 10, 20];

export const DEFAULT_SETTINGS: DrillSettings = { maxFret: MAX_FRET, order: "progression", perString: 5 };

export interface DrillProgress {
  /** 0 = high e … 5 = low E */
  string: number;
  /** Questions already answered on this string. */
  done: number;
}

/** The drill only asks natural notes (no sharps or flats). */
const NATURALS: DrillNote[] = LETTERS.map((name) => ({ pc: LETTER_SEMITONES[name], name }));

/** Frets on `string` (0 … maxFret) that play pitch class `pc`. */
export function fretsForPc(string: number, pc: number, maxFret: number = MAX_FRET): number[] {
  const first = mod(pc - STANDARD_TUNING[string]!, 12);
  return [first, first + 12].filter((f) => f <= maxFret);
}

/**
 * A random natural note that can be played on `string` within `maxFret`,
 * different from the previous question.
 */
export function randomDrillNote(
  string: number,
  maxFret: number,
  previousPc?: number,
  rand: () => number = Math.random,
): DrillNote {
  const playable = NATURALS.filter((n) => fretsForPc(string, n.pc, maxFret).length > 0);
  const choices = playable.filter((n) => n.pc !== previousPc);
  return choices[Math.floor(rand() * choices.length)]!;
}

/**
 * Progress after answering one question: stay on the string until
 * `perString` questions are done, then move on. "progression" goes high e →
 * low E and loops; "random" jumps to a different random string.
 */
export function advance(
  p: DrillProgress,
  settings: Pick<DrillSettings, "order" | "perString">,
  rand: () => number = Math.random,
): DrillProgress {
  if (p.done + 1 < settings.perString) return { string: p.string, done: p.done + 1 };
  const count = STANDARD_TUNING.length;
  if (settings.order === "progression") return { string: (p.string + 1) % count, done: 0 };
  // Any string but the current one.
  const offset = 1 + Math.floor(rand() * (count - 1));
  return { string: (p.string + offset) % count, done: 0 };
}

/** Where to show the answer after a wrong tap: the matching fret nearest the tap. */
export function answerNear(
  string: number,
  pc: number,
  tappedFret: number,
  maxFret: number = MAX_FRET,
): FrettedNote {
  const fret = fretsForPc(string, pc, maxFret).reduce((best, f) =>
    Math.abs(f - tappedFret) < Math.abs(best - tappedFret) ? f : best,
  );
  return { string, fret };
}
