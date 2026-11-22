import { describe, expect, test } from "bun:test";
import { KEYS, buildKey, keyName } from "./keys";
import { soundingMidi } from "./music";
import { isCorrectTap, randomScaleRound, rootPositionsForKey, scaleNotes } from "./scaleDrill";

describe("scale drill", () => {
  test("every key has at least one root where the whole scale fits", () => {
    for (const key of KEYS) expect(rootPositionsForKey(key).length).toBeGreaterThan(0);
  });

  test("roots too high up the neck are excluded", () => {
    const eMajor = buildKey("E", null, "major");
    const roots = rootPositionsForKey(eMajor);
    expect(roots).toContainEqual({ string: 5, fret: 0 }); // open low E
    expect(roots).not.toContainEqual({ string: 0, fret: 12 }); // high e, 12th fret
  });

  test("rounds: a fitting root, the six other degrees once each, in random order", () => {
    const orders = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const r = randomScaleRound();
      expect(rootPositionsForKey(r.key)).toContainEqual(r.root);
      expect([...r.order].sort()).toEqual([1, 2, 3, 4, 5, 6]);
      const notes = scaleNotes(r);
      expect(notes.every((n) => n.position && n.position.fret >= r.root.fret)).toBe(true);
      orders.add(r.order.join(""));
    }
    expect(orders.size).toBeGreaterThan(50);
  });

  test("a tap is correct only at the exact pitch above the root, on any string", () => {
    const r = { key: buildKey("C", null, "major"), root: { string: 4, fret: 3 } }; // C3
    const third = scaleNotes(r)[2]!; // E3
    expect(keyName(r.key)).toBe("C major");
    expect(isCorrectTap(third, { string: 4, fret: 7 })).toBe(true); // A string fret 7
    expect(isCorrectTap(third, { string: 5, fret: 12 })).toBe(true); // low E fret 12, same pitch
    expect(isCorrectTap(third, { string: 3, fret: 2 })).toBe(true); // D string fret 2, same pitch
    expect(isCorrectTap(third, { string: 1, fret: 5 })).toBe(false); // E an octave up (E4)
    expect(isCorrectTap(third, { string: 4, fret: 5 })).toBe(false); // D, wrong note
    expect(soundingMidi({ string: 4, fret: 7 })).toBe(third.midi);
  });
});
