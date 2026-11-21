/**
 * Builds a one-octave ascending scale from a tapped root and lays it out on
 * the fretboard.
 */
import { KEYS, type KeyNote, type Mode, type MusicalKey } from "./keys";
import { MAX_FRET, STANDARD_TUNING, mod, soundingMidi, type FrettedNote } from "./music";

export interface ScaleNote extends KeyNote {
  /** Sounding pitch. */
  midi: number;
  /** 0 = root … 7 = octave root */
  degree: number;
  /** Where it's played, or null if it doesn't fit within MAX_FRET. */
  position: FrettedNote | null;
}

/** The conventionally spelled key for a tonic pitch class (one per pc and mode). */
export function keyFor(pc: number, mode: Mode): MusicalKey {
  return KEYS.find((k) => k.mode === mode && k.tonic.pc === mod(pc, 12))!;
}

function candidates(midi: number): FrettedNote[] {
  return STANDARD_TUNING.map((open, string) => ({ string, fret: midi - open })).filter(
    (p) => p.fret >= 0 && p.fret <= MAX_FRET,
  );
}

/**
 * Pick where to play `midi`, the standard way: never below the root's fret.
 * Prefer the four frets from the root (one finger per fret), then a stretch
 * to a fifth fret, then anything further up the neck. Within the first group
 * that has a match, take the spot nearest the previous note.
 */
export function choosePosition(midi: number, prev: FrettedNote, rootFret: number): FrettedNote | null {
  const all = candidates(midi).filter((p) => p.fret >= rootFret);
  const tiers = [
    all.filter((p) => p.fret <= rootFret + 3),
    all.filter((p) => p.fret <= rootFret + 4),
    all,
  ];
  const pool = tiers.find((t) => t.length > 0);
  if (!pool) return null;
  const cost = (p: FrettedNote) => Math.abs(p.fret - prev.fret) + Math.abs(p.string - prev.string);
  return pool.reduce((best, p) => (cost(p) < cost(best) ? p : best));
}

export function scaleFromRoot(root: FrettedNote, mode: Mode): { key: MusicalKey; notes: ScaleNote[] } {
  const rootMidi = soundingMidi(root);
  const key = keyFor(rootMidi, mode);
  const degrees = [...key.notes, key.notes[0]!];

  const notes: ScaleNote[] = [];
  let prev: FrettedNote = root;
  degrees.forEach((n, degree) => {
    const midi = rootMidi + (degree === 7 ? 12 : mod(n.pc - key.tonic.pc, 12));
    const position = degree === 0 ? root : choosePosition(midi, prev, root.fret);
    if (position) prev = position;
    notes.push({ ...n, midi, degree, position });
  });
  return { key, notes };
}
