/**
 * Core music theory helpers for Fretto.
 *
 * Pitches are MIDI numbers (C4 = 60). Guitar is notated an octave higher
 * than it sounds (treble clef with an "8" below), so staff work uses the
 * *written* pitch: sounding MIDI + 12.
 *
 * Staff positions are diatonic step indices: octave * 7 + letter index
 * (C=0 … B=6). E.g. E4 = 4*7 + 2 = 30 (bottom line of the treble staff).
 */

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type Letter = (typeof LETTERS)[number];

/** Semitone offset of each natural letter from C. */
export const LETTER_SEMITONES: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export type Accidental = "sharp" | "flat" | null;

export interface Spelling {
  letter: Letter;
  accidental: Accidental;
  octave: number;
}

export interface PitchClassOption {
  /** 0–11, C = 0 */
  pc: number;
  label: string;
}

/** The 12 note-name choices shown to the user. */
export const PITCH_CLASS_OPTIONS: PitchClassOption[] = [
  { pc: 0, label: "C" },
  { pc: 1, label: "C♯/D♭" },
  { pc: 2, label: "D" },
  { pc: 3, label: "D♯/E♭" },
  { pc: 4, label: "E" },
  { pc: 5, label: "F" },
  { pc: 6, label: "F♯/G♭" },
  { pc: 7, label: "G" },
  { pc: 8, label: "G♯/A♭" },
  { pc: 9, label: "A" },
  { pc: 10, label: "A♯/B♭" },
  { pc: 11, label: "B" },
];

/** True for the white-key pitch classes C D E F G A B. */
export function isNaturalPc(pc: number): boolean {
  return LETTERS.some((l) => LETTER_SEMITONES[l] === mod(pc, 12));
}

/** The seven natural note-name choices. */
export const NATURAL_OPTIONS: PitchClassOption[] = PITCH_CLASS_OPTIONS.filter((o) =>
  isNaturalPc(o.pc),
);

export function pitchClassLabel(pc: number): string {
  return PITCH_CLASS_OPTIONS[mod(pc, 12)]!.label;
}

/** Standard tuning, string 1 (high E) first. Sounding MIDI pitches. */
export const STANDARD_TUNING = [64, 59, 55, 50, 45, 40] as const;
export const STRING_NAMES = ["e", "B", "G", "D", "A", "E"] as const;

export const MAX_FRET = 12;

export interface FrettedNote {
  /** 0 = high E string … 5 = low E string */
  string: number;
  fret: number;
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function soundingMidi(note: FrettedNote): number {
  return STANDARD_TUNING[note.string]! + note.fret;
}

export function writtenMidi(note: FrettedNote): number {
  return soundingMidi(note) + 12;
}

export function pitchClass(midi: number): number {
  return mod(midi, 12);
}

/**
 * All conventional spellings of a MIDI pitch using at most one sharp or flat.
 * Naturals have one spelling; black keys have a sharp and a flat spelling.
 */
export function spellings(midi: number): Spelling[] {
  const pc = pitchClass(midi);
  const octave = Math.floor(midi / 12) - 1;
  const natural = LETTERS.find((l) => LETTER_SEMITONES[l] === pc);
  if (natural) return [{ letter: natural, accidental: null, octave }];

  const sharpLetter = LETTERS.find((l) => LETTER_SEMITONES[l] === pc - 1)!;
  const flatLetter = LETTERS.find((l) => LETTER_SEMITONES[l] === pc + 1)!;
  return [
    { letter: sharpLetter, accidental: "sharp", octave },
    { letter: flatLetter, accidental: "flat", octave },
  ];
}

export function diatonicIndex(s: { letter: Letter; octave: number }): number {
  return s.octave * 7 + LETTERS.indexOf(s.letter);
}

export function letterAt(diatonic: number): { letter: Letter; octave: number } {
  return {
    letter: LETTERS[mod(diatonic, 7)]!,
    octave: Math.floor(diatonic / 7),
  };
}

/** Staff positions (diatonic indices) at which a written pitch may be placed. */
export function validStaffPositions(midi: number): number[] {
  return spellings(midi).map(diatonicIndex);
}

/**
 * The spelling a pitch takes when written at a given staff position,
 * or null if that position can't represent the pitch.
 */
export function spellingAtPosition(midi: number, diatonic: number): Spelling | null {
  return spellings(midi).find((s) => diatonicIndex(s) === diatonic) ?? null;
}

/**
 * The accidental needed to write pitch class `pc` on a line/space of `letter`,
 * limited to sharps and flats on black keys (no E♯, F♭, B♯, C♭).
 */
export function accidentalFor(letter: Letter, pc: number): Accidental | undefined {
  const natural = LETTER_SEMITONES[letter];
  const isBlackKey = !LETTERS.some((l) => LETTER_SEMITONES[l] === mod(pc, 12));
  if (mod(pc, 12) === natural) return null;
  if (!isBlackKey) return undefined;
  if (mod(natural + 1, 12) === mod(pc, 12)) return "sharp";
  if (mod(natural - 1, 12) === mod(pc, 12)) return "flat";
  return undefined;
}

export function formatSpelling(s: Spelling): string {
  const acc = s.accidental === "sharp" ? "♯" : s.accidental === "flat" ? "♭" : "";
  return `${s.letter}${acc}${s.octave}`;
}

/** Treble staff reference positions. */
export const STAFF_BOTTOM_LINE = diatonicIndex({ letter: "E", octave: 4 }); // 30
export const STAFF_TOP_LINE = diatonicIndex({ letter: "F", octave: 5 }); // 38

/** Ledger lines required to draw a note at the given diatonic position. */
export function ledgerLines(diatonic: number): number[] {
  const lines: number[] = [];
  for (let d = STAFF_BOTTOM_LINE - 2; d >= diatonic; d -= 2) lines.push(d);
  for (let d = STAFF_TOP_LINE + 2; d <= diatonic; d += 2) lines.push(d);
  return lines;
}

/**
 * A random position within `maxFret`, different from `avoid`. With
 * `naturalOnly`, only positions that play a natural note (no sharps/flats).
 */
export function randomFrettedNote(
  rand: () => number = Math.random,
  maxFret: number = MAX_FRET,
  avoid?: FrettedNote,
  naturalOnly = false,
): FrettedNote {
  for (;;) {
    const note = {
      string: Math.floor(rand() * STANDARD_TUNING.length),
      fret: Math.floor(rand() * (maxFret + 1)),
    };
    if (avoid && note.string === avoid.string && note.fret === avoid.fret) continue;
    if (naturalOnly && !isNaturalPc(soundingMidi(note))) continue;
    return note;
  }
}

/** Diatonic range of every note the trainer can produce (written pitch). */
export function writtenRange(maxFret: number = MAX_FRET): { low: number; high: number } {
  const lowMidi = Math.min(...STANDARD_TUNING) + 12;
  const highMidi = Math.max(...STANDARD_TUNING) + maxFret + 12;
  return {
    low: Math.min(...validStaffPositions(lowMidi)),
    high: Math.max(...validStaffPositions(highMidi)),
  };
}

/** Scientific pitch octave number (C4 = middle C, octaves start on C). */
export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}
