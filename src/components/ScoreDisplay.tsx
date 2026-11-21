import { useEffect, useRef, useState } from "react";
import type { Score } from "../lib/score";
import { HeaderSlot } from "./HeaderSlot";

const STREAK_TARGET = 3;
const CELEBRATE_MS = 2500;

export function ScoreDisplay({ score }: { score: Score }) {
  const [celebrating, setCelebrating] = useState(false);
  // Start from the current streak so remounting (switching screens back)
  // doesn't replay a celebration that already happened.
  const prevStreak = useRef(score.streak);

  useEffect(() => {
    const reached = score.streak === STREAK_TARGET && prevStreak.current !== STREAK_TARGET;
    prevStreak.current = score.streak;
    if (!reached) return;
    setCelebrating(true);
    const t = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(t);
  }, [score.streak]);

  return (
    <HeaderSlot>
      <div className="score-wrap">
        {celebrating && (
          <span className="streak-badge" role="status">
            Three in a row!
          </span>
        )}
        <div className="score" aria-label={`Score: ${score.correct} correct out of ${score.total}`}>
          {score.correct} / {score.total}
        </div>
      </div>
    </HeaderSlot>
  );
}
