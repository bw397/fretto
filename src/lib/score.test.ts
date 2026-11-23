import { expect, test } from "bun:test";
import { getScore, recordAnswer, restoreScores } from "./score";

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

test("the count starts again at 1 after 999 questions, keeping the streak", () => {
  for (let i = 0; i < 999; i++) recordAnswer("cap", i % 2 === 0);
  expect(getScore("cap")).toEqual({ correct: 500, total: 999, streak: 1 });
  recordAnswer("cap", true);
  expect(getScore("cap")).toEqual({ correct: 1, total: 1, streak: 2 });
  recordAnswer("cap", false);
  expect(getScore("cap")).toEqual({ correct: 1, total: 2, streak: 0 });
});

test("saved scores are restored", () => {
  restoreScores(new Map<string, unknown>([["score:r", { correct: 4, total: 7, streak: 2 }], ["state:x", 1]]));
  expect(getScore("r")).toEqual({ correct: 4, total: 7, streak: 2 });
  expect(getScore("x")).toEqual({ correct: 0, total: 0, streak: 0 });
});
