import { describe, expect, test } from "bun:test";
import { keyName, noteName } from "./keys";
import { keyFor, scaleFromRoot } from "./scale";

const fmt = (p: { string: number; fret: number } | null) =>
  p ? `${"eBGDAE"[p.string]}${p.fret}` : "-";

describe("keyFor", () => {
  test("there is one key per pitch class and mode", () => {
    for (let pc = 0; pc < 12; pc++) {
      expect(keyFor(pc, "major").tonic.pc).toBe(pc);
      expect(keyFor(pc, "minor").tonic.pc).toBe(pc);
    }
    expect(keyName(keyFor(1, "major"))).toBe("D♭ major");
    expect(keyName(keyFor(1, "minor"))).toBe("C♯ minor");
  });
});

describe("scaleFromRoot", () => {
  test("A major from the low E string, 5th fret never goes below fret 5", () => {
    const { notes } = scaleFromRoot({ string: 5, fret: 5 }, "major");
    expect(notes.map(noteName)).toEqual(["A", "B", "C♯", "D", "E", "F♯", "G♯", "A"]);
    expect(notes.map((n) => fmt(n.position))).toEqual(["E5", "E7", "E9", "A5", "A7", "A9", "D6", "D7"]);
    expect(notes.map((n) => n.midi)).toEqual([45, 47, 49, 50, 52, 54, 56, 57]);
  });

  test("E minor in open position", () => {
    const { notes } = scaleFromRoot({ string: 5, fret: 0 }, "minor");
    expect(notes.map(noteName)).toEqual(["E", "F♯", "G", "A", "B", "C", "D", "E"]);
    expect(notes.map((n) => fmt(n.position))).toEqual(["E0", "E2", "E3", "A0", "A2", "A3", "D0", "D2"]);
  });

  test("notes past fret 12 have no position", () => {
    const { notes } = scaleFromRoot({ string: 0, fret: 12 }, "major");
    expect(fmt(notes[0]!.position)).toBe("e12");
    expect(notes.slice(1).every((n) => n.position === null)).toBe(true);
  });

  test("G major from the low E string, 3rd fret", () => {
    const { notes } = scaleFromRoot({ string: 5, fret: 3 }, "major");
    expect(notes.map((n) => fmt(n.position))).toEqual(["E3", "E5", "E7", "A3", "A5", "A7", "D4", "D5"]);
  });

  test("no note is ever below the root's fret", () => {
    for (const mode of ["major", "minor"] as const) {
      for (let s = 0; s < 6; s++) {
        for (let f = 0; f <= 12; f++) {
          for (const n of scaleFromRoot({ string: s, fret: f }, mode).notes) {
            if (n.position) expect(n.position.fret).toBeGreaterThanOrEqual(f);
          }
        }
      }
    }
  });

  test("pitches always ascend", () => {
    for (let s = 0; s < 6; s++) {
      for (let f = 0; f <= 12; f++) {
        const { notes } = scaleFromRoot({ string: s, fret: f }, "minor");
        for (let i = 1; i < notes.length; i++) expect(notes[i]!.midi).toBeGreaterThan(notes[i - 1]!.midi);
      }
    }
  });
});
