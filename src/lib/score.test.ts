import { expect, test } from "bun:test";
import { getScore, recordAnswer } from "./score";

test("scores are tracked per screen with a streak that resets on a miss", () => {
  recordAnswer("a", true);
  recordAnswer("a", true);
  recordAnswer("b", false);
  expect(getScore("a")).toEqual({ correct: 2, total: 2, streak: 2 });
  expect(getScore("b")).toEqual({ correct: 0, total: 1, streak: 0 });
  recordAnswer("a", false);
  recordAnswer("a", true);
  expect(getScore("a")).toEqual({ correct: 3, total: 4, streak: 1 });
});
