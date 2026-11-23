import { describe, expect, test } from "bun:test";
import {
  INTERVALS,
  nearestPositionForMidi,
  positionsForMidi,
  randomIntervalRound,
} from "./intervals";
import { isNaturalPc, soundingMidi } from "./music";

describe("intervals", () => {
  test("cover one octave, one per semitone", () => {
    expect(INTERVALS.map((i) => i.semitones)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test("positions for an exact pitch", () => {
    // A2 (45): low E fret 5, A string open
    expect(positionsForMidi(45)).toEqual([
      { string: 4, fret: 0 },
      { string: 5, fret: 5 },
    ]);
    expect(positionsForMidi(45, 4)).toEqual([{ string: 4, fret: 0 }]);
  });

  test("nearest position for a pitch", () => {
    // E3 (52) from the A string, 5th fret: A string fret 7 beats low E fret 12
    expect(nearestPositionForMidi(52, { string: 4, fret: 5 })).toEqual({ string: 4, fret: 7 });
    expect(nearestPositionForMidi(100, { string: 0, fret: 0 })).toBeNull();
  });
});

describe("randomIntervalRound", () => {
  test("a natural root and five distinct intervals, all reachable within the fret range", () => {
    for (const maxFret of [5, 12]) {
      for (let i = 0; i < 300; i++) {
        const { root, intervals } = randomIntervalRound(maxFret);
        expect(root.fret).toBeLessThanOrEqual(maxFret);
        expect(isNaturalPc(soundingMidi(root))).toBe(true);
        expect(new Set(intervals).size).toBe(5);
        for (const iv of intervals) {
          expect(positionsForMidi(soundingMidi(root) + iv.semitones, maxFret).length).toBeGreaterThan(0);
        }
      }
    }
  });
});
