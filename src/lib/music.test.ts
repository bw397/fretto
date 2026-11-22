import { describe, expect, test } from "bun:test";
import {
  accidentalFor,
  diatonicIndex,
  formatSpelling,
  ledgerLines,
  octaveOf,
  pitchClass,
  isNaturalPc,
  randomFrettedNote,
  soundingMidi,
  spellingAtPosition,
  spellings,
  validStaffPositions,
  writtenMidi,
  writtenRange,
} from "./music";

describe("fretboard pitches", () => {
  test("open strings in standard tuning", () => {
    expect(soundingMidi({ string: 5, fret: 0 })).toBe(40); // E2
    expect(soundingMidi({ string: 0, fret: 0 })).toBe(64); // E4
  });

  test("guitar is written an octave above sounding pitch", () => {
    // Low E open sounds E2 but is written E3
    expect(spellings(writtenMidi({ string: 5, fret: 0 })).map(formatSpelling)).toEqual(["E3"]);
    // A string, 3rd fret sounds C3, written C4 (middle C)
    expect(spellings(writtenMidi({ string: 4, fret: 3 })).map(formatSpelling)).toEqual(["C4"]);
  });

  test("pitch class", () => {
    expect(pitchClass(soundingMidi({ string: 2, fret: 1 }))).toBe(8); // G♯
  });
});

describe("spellings", () => {
  test("black keys spell as sharp and flat in the same octave", () => {
    expect(spellings(61).map(formatSpelling)).toEqual(["C♯4", "D♭4"]);
    expect(spellings(70).map(formatSpelling)).toEqual(["A♯4", "B♭4"]);
  });

  test("valid staff positions", () => {
    expect(validStaffPositions(64)).toEqual([30]); // E4 = bottom line
    expect(validStaffPositions(66)).toEqual([31, 32]); // F♯4 / G♭4
  });

  test("spelling at position", () => {
    expect(spellingAtPosition(66, 32)?.accidental).toBe("flat");
    expect(spellingAtPosition(66, 31)?.accidental).toBe("sharp");
    expect(spellingAtPosition(66, 33)).toBeNull();
  });
});

describe("ledger lines", () => {
  test("none on the staff", () => {
    expect(ledgerLines(30)).toEqual([]);
    expect(ledgerLines(38)).toEqual([]);
  });

  test("middle C needs one", () => {
    expect(ledgerLines(diatonicIndex({ letter: "C", octave: 4 }))).toEqual([28]);
    expect(ledgerLines(diatonicIndex({ letter: "B", octave: 3 }))).toEqual([28]);
  });

  test("low E (written E3) needs three below", () => {
    expect(ledgerLines(23)).toEqual([28, 26, 24]);
  });

  test("notes above the staff", () => {
    expect(ledgerLines(40)).toEqual([40]); // A5
    expect(ledgerLines(44)).toEqual([40, 42, 44]); // E6
  });
});

describe("random notes", () => {
  test("stay in range and avoid repeats", () => {
    const avoid = { string: 0, fret: 0 };
    for (let i = 0; i < 500; i++) {
      const n = randomFrettedNote(Math.random, 12, avoid);
      expect(n.string).toBeGreaterThanOrEqual(0);
      expect(n.string).toBeLessThanOrEqual(5);
      expect(n.fret).toBeGreaterThanOrEqual(0);
      expect(n.fret).toBeLessThanOrEqual(12);
      expect(n).not.toEqual(avoid);
      const natural = randomFrettedNote(Math.random, 5, avoid, true);
      expect(natural.fret).toBeLessThanOrEqual(5);
      expect(isNaturalPc(soundingMidi(natural))).toBe(true);
    }
  });

  test("written range covers E3 to E6 at 12 frets", () => {
    expect(writtenRange(12)).toEqual({ low: 23, high: 44 });
  });
});

describe("accidentalFor", () => {
  test("black keys on neighbouring letters", () => {
    expect(accidentalFor("F", 6)).toBe("sharp");
    expect(accidentalFor("G", 6)).toBe("flat");
    expect(accidentalFor("G", 7)).toBeNull();
  });
  test("no E♯ / C♭ style spellings or far letters", () => {
    expect(accidentalFor("E", 5)).toBeUndefined();
    expect(accidentalFor("C", 11)).toBeUndefined();
    expect(accidentalFor("A", 6)).toBeUndefined();
  });
});

describe("octaveOf", () => {
  test("octaves start on C", () => {
    expect(octaveOf(40)).toBe(2); // low E open
    expect(octaveOf(59)).toBe(3); // B3
    expect(octaveOf(60)).toBe(4); // middle C
    expect(octaveOf(76)).toBe(5); // high E, 12th fret
  });
});
