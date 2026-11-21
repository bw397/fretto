import { describe, expect, test } from "bun:test";
import { advance, answerNear, fretsForPc, randomDrillNote } from "./drill";

describe("string drill progress", () => {
  test("progression: N per string, high e to low E, then back to high e", () => {
    let p = { string: 0, done: 0 };
    const visited: number[] = [];
    for (let i = 0; i < 6 * 3 + 1; i++) {
      visited.push(p.string);
      p = advance(p, { order: "progression", perString: 3 });
    }
    expect(visited).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 0]);
  });

  test("questions per string is respected", () => {
    let p = { string: 2, done: 0 };
    for (let i = 0; i < 9; i++) p = advance(p, { order: "progression", perString: 10 });
    expect(p).toEqual({ string: 2, done: 9 });
    expect(advance(p, { order: "progression", perString: 10 })).toEqual({ string: 3, done: 0 });
  });

  test("random order always moves to a different string, and reaches them all", () => {
    const seen = new Set<number>();
    let p = { string: 0, done: 0 };
    for (let i = 0; i < 300; i++) {
      const next = advance(p, { order: "random", perString: 1 });
      expect(next.string).not.toBe(p.string);
      expect(next.done).toBe(0);
      seen.add(next.string);
      p = next;
    }
    expect(seen.size).toBe(6);
  });
});

describe("notes and frets", () => {
  test("frets for a pitch class on a string", () => {
    expect(fretsForPc(0, 4)).toEqual([0, 12]); // E on high e: open and 12th
    expect(fretsForPc(0, 4, 5)).toEqual([0]);
    expect(fretsForPc(0, 7)).toEqual([3]); // G on high e
    expect(fretsForPc(0, 2, 5)).toEqual([]); // D on high e is fret 10
  });

  test("answer shown nearest the wrong tap", () => {
    expect(answerNear(5, 4, 9)).toEqual({ string: 5, fret: 12 });
    expect(answerNear(5, 4, 9, 5)).toEqual({ string: 5, fret: 0 });
  });

  test("random notes are naturals playable in range, never repeating", () => {
    for (const maxFret of [5, 12]) {
      for (let string = 0; string < 6; string++) {
        let prev: number | undefined;
        for (let i = 0; i < 200; i++) {
          const n = randomDrillNote(string, maxFret, prev);
          expect(n.pc).not.toBe(prev);
          expect(n.name).toMatch(/^[A-G]$/);
          expect(fretsForPc(string, n.pc, maxFret).length).toBeGreaterThan(0);
          prev = n.pc;
        }
      }
    }
  });
});
