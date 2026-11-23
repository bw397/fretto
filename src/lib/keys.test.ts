import { describe, expect, test } from "bun:test";
import {
  KEYS,
  buildKey,
  keyName,
  nearestMidiWithPc,
  nearestPosition,
  noteAtPosition,
  noteName,
  positionsForPc,
  randomKeyRound,
  staffPositionInKey,
} from "./keys";
import { diatonicIndex } from "./music";

describe("keys", () => {
  test("spellings use one letter per degree", () => {
    expect(buildKey("F", null, "major").notes.map(noteName)).toEqual(["F", "G", "A", "B♭", "C", "D", "E"]);
    expect(buildKey("F", "sharp", "major").notes.map(noteName)).toEqual([
      "F♯", "G♯", "A♯", "B", "C♯", "D♯", "E♯",
    ]);
    expect(buildKey("E", "flat", "minor").notes.map(noteName)).toEqual([
      "E♭", "F", "G♭", "A♭", "B♭", "C♭", "D♭",
    ]);
    expect(buildKey("A", null, "minor").signature).toBeNull();
  });

  test("24 keys, each with a single-type signature of at most six", () => {
    expect(KEYS).toHaveLength(24);
    expect(new Set(KEYS.map(keyName)).size).toBe(24);
    for (const k of KEYS) {
      const types = new Set(k.notes.map((n) => n.accidental).filter(Boolean));
      expect(types.size).toBeLessThanOrEqual(1);
      expect(k.signature?.count ?? 0).toBeLessThanOrEqual(6);
    }
    expect(buildKey("E", "flat", "major").signature).toEqual({ type: "flat", count: 3 });
    expect(buildKey("B", null, "major").signature).toEqual({ type: "sharp", count: 5 });
  });
});

describe("staff positions in key", () => {
  test("E♯ and C♭ land on their own letters", () => {
    const fSharp = buildKey("F", "sharp", "major");
    expect(staffPositionInKey(65, fSharp.notes[6]!)).toBe(diatonicIndex({ letter: "E", octave: 4 }));
    const eFlatMinor = buildKey("E", "flat", "minor");
    expect(staffPositionInKey(71, eFlatMinor.notes[5]!)).toBe(diatonicIndex({ letter: "C", octave: 5 }));
  });

  test("B♭ vs A♯ follows the key", () => {
    const f = buildKey("F", null, "major");
    expect(staffPositionInKey(70, f.notes[3]!)).toBe(diatonicIndex({ letter: "B", octave: 4 }));
  });
});

describe("helpers", () => {
  test("nearest midi with pitch class", () => {
    expect(nearestMidiWithPc(60, 0)).toBe(60);
    expect(nearestMidiWithPc(60, 2)).toBe(62);
    expect(nearestMidiWithPc(60, 11)).toBe(59);
    expect(nearestMidiWithPc(60, 6)).toBe(54); // tie goes down
  });

  test("every pitch class exists in frets 0–5", () => {
    for (let pc = 0; pc < 12; pc++) expect(positionsForPc(pc, 5).length).toBeGreaterThan(0);
  });

  test("nearest position prefers the same area", () => {
    // G on the high E string is fret 3
    expect(nearestPosition(7, { string: 0, fret: 2 })).toEqual({ string: 0, fret: 3 });
  });

  test("rounds have three distinct non-tonic targets in range", () => {
    for (let i = 0; i < 300; i++) {
      const r = randomKeyRound(5);
      expect(r.rootPosition.fret).toBeLessThanOrEqual(5);
      expect(new Set(r.targets).size).toBe(3);
      expect(r.targets).not.toContain(r.key.tonic);
      expect(r.key.tonic.accidental).toBeNull();
      for (const t of r.targets) expect(r.key.notes).toContain(t);
    }
  });
});

describe("noteAtPosition", () => {
  test("applies the key signature", () => {
    const bMinor = buildKey("B", null, "minor"); // F♯, C♯
    expect(noteName(noteAtPosition(diatonicIndex({ letter: "F", octave: 4 }), bMinor))).toBe("F♯");
    expect(noteName(noteAtPosition(diatonicIndex({ letter: "C", octave: 5 }), bMinor))).toBe("C♯");
    expect(noteName(noteAtPosition(diatonicIndex({ letter: "G", octave: 3 }), bMinor))).toBe("G");
    const eFlat = buildKey("E", "flat", "major");
    expect(noteName(noteAtPosition(diatonicIndex({ letter: "A", octave: 4 }), eFlat))).toBe("A♭");
  });
});
