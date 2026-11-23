/**
 * Major / natural-minor keys, spelled correctly (one letter per scale degree),
 * plus helpers for the Key Trainer.
 */
import {
  LETTERS,
  LETTER_SEMITONES,
  MAX_FRET,
  STANDARD_TUNING,
  mod,
  soundingMidi,
  type Accidental,
  type FrettedNote,
  type Letter,
} from "./music";

export type Mode = "major" | "minor";

export interface KeyNote {
  letter: Letter;
  accidental: Accidental;
  /** 0–11, C = 0 */
  pc: number;
}

export interface KeySignature {
  type: "sharp" | "flat";
  count: number;
}

export interface MusicalKey {
  tonic: KeyNote;
  mode: Mode;
  /** The seven scale degrees, tonic first. */
  notes: KeyNote[];
  signature: KeySignature | null;
}

const SCALE_STEPS: Record<Mode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const accOffset = (a: Accidental) => (a === "sharp" ? 1 : a === "flat" ? -1 : 0);

export function noteName(n: { letter: Letter; accidental: Accidental }): string {
  return n.letter + (n.accidental === "sharp" ? "♯" : n.accidental === "flat" ? "♭" : "");
}

export function keyName(k: MusicalKey): string {
  return `${noteName(k.tonic)} ${k.mode}`;
}

export function buildKey(letter: Letter, accidental: Accidental, mode: Mode): MusicalKey {
  const tonicPc = mod(LETTER_SEMITONES[letter] + accOffset(accidental), 12);
  const start = LETTERS.indexOf(letter);
  const notes = SCALE_STEPS[mode].map((step, i): KeyNote => {
    const l = LETTERS[(start + i) % 7]!;
    const pc = mod(tonicPc + step, 12);
    // Signed distance from the natural letter, in -6..5
    const diff = mod(pc - LETTER_SEMITONES[l] + 6, 12) - 6;
    if (Math.abs(diff) > 1) throw new Error(`Key needs a double accidental: ${letter} ${mode}`);
    return { letter: l, accidental: diff === 1 ? "sharp" : diff === -1 ? "flat" : null, pc };
  });
  const sharps = notes.filter((n) => n.accidental === "sharp").length;
  const flats = notes.filter((n) => n.accidental === "flat").length;
  const signature: KeySignature | null =
    sharps > 0 ? { type: "sharp", count: sharps } : flats > 0 ? { type: "flat", count: flats } : null;
  return { tonic: notes[0]!, mode, notes, signature };
}

/** Every key with up to six sharps or flats. */
export const KEYS: MusicalKey[] = [
  ...(
    [
      ["C", null], ["G", null], ["D", null], ["A", null], ["E", null], ["B", null],
      ["F", "sharp"], ["D", "flat"], ["A", "flat"], ["E", "flat"], ["B", "flat"], ["F", null],
    ] as [Letter, Accidental][]
  ).map(([l, a]) => buildKey(l, a, "major")),
  ...(
    [
      ["A", null], ["E", null], ["B", null], ["F", "sharp"], ["C", "sharp"], ["G", "sharp"],
      ["E", "flat"], ["B", "flat"], ["F", null], ["C", null], ["G", null], ["D", null],
    ] as [Letter, Accidental][]
  ).map(([l, a]) => buildKey(l, a, "minor")),
];

/** Treble-clef staff positions (diatonic indices) for key signature symbols. */
export const SHARP_POSITIONS = [38, 35, 39, 36, 33, 37, 34]; // F C G D A E B
export const FLAT_POSITIONS = [34, 37, 33, 36, 32, 35, 31]; // B E A D G C F

/** Staff position of `midi` when spelled as `note` (pitch classes must match). */
export function staffPositionInKey(midi: number, note: KeyNote): number {
  if (mod(midi, 12) !== note.pc) throw new Error("Pitch does not match note");
  const octave = (midi - LETTER_SEMITONES[note.letter] - accOffset(note.accidental)) / 12 - 1;
  return octave * 7 + LETTERS.indexOf(note.letter);
}

/** The pitch with pitch class `pc` closest to `midi` (ties resolve downward). */
export function nearestMidiWithPc(midi: number, pc: number): number {
  const up = mod(pc - midi, 12);
  return up < 6 ? midi + up : midi + up - 12;
}

export function positionsForPc(pc: number, maxFret: number = MAX_FRET): FrettedNote[] {
  const out: FrettedNote[] = [];
  STANDARD_TUNING.forEach((open, string) => {
    for (let fret = 0; fret <= maxFret; fret++) {
      if (mod(open + fret, 12) === pc) out.push({ string, fret });
    }
  });
  return out;
}

/** The fretboard position of `pc` closest to `from` (fret distance + 2× string distance). */
export function nearestPosition(pc: number, from: FrettedNote, maxFret: number = MAX_FRET): FrettedNote {
  const dist = (p: FrettedNote) => Math.abs(p.fret - from.fret) + 2 * Math.abs(p.string - from.string);
  return positionsForPc(pc, maxFret).reduce((best, p) => (dist(p) < dist(best) ? p : best));
}

export interface KeyRound {
  key: MusicalKey;
  rootPosition: FrettedNote;
  /** Three distinct non-tonic notes from the key, in prompt order. */
  targets: KeyNote[];
}

function pick<T>(items: T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)]!;
}

/** Keys whose tonic is a natural note (no sharp or flat): the Key Trainer's questions. */
export const NATURAL_KEYS: MusicalKey[] = KEYS.filter((k) => k.tonic.accidental === null);

export function randomKeyRound(
  maxFret: number = MAX_FRET,
  rand: () => number = Math.random,
  avoid?: MusicalKey,
): KeyRound {
  let key = pick(NATURAL_KEYS, rand);
  while (avoid && key === avoid) key = pick(NATURAL_KEYS, rand);
  const rootPosition = pick(positionsForPc(key.tonic.pc, maxFret), rand);
  const pool = key.notes.slice(1);
  const targets: KeyNote[] = [];
  while (targets.length < 3) {
    const n = pool.splice(Math.floor(rand() * pool.length), 1)[0]!;
    targets.push(n);
  }
  return { key, rootPosition, targets };
}

export function pcAt(pos: FrettedNote): number {
  return mod(soundingMidi(pos), 12);
}

/** The note written at a staff position, with the key signature applied. */
export function noteAtPosition(diatonic: number, key: MusicalKey): KeyNote {
  const letter = LETTERS[mod(diatonic, 7)]!;
  return key.notes.find((n) => n.letter === letter)!;
}
