import { useState } from "react";
import { FretRangeToggle } from "../components/FretRangeToggle";
import { RoundResult } from "../components/RoundResult";
import { Fretboard, type FretMarker } from "../components/Fretboard";
import { ScoreDisplay } from "../components/ScoreDisplay";
import {
  PROMPT_COUNT,
  nearestPositionForMidi,
  randomIntervalRound,
  type IntervalRound,
} from "../lib/intervals";
import { MAX_FRET, mod, soundingMidi, type FrettedNote } from "../lib/music";
import { useScore } from "../lib/score";

type Taps = (FrettedNote | null)[];
const emptyTaps = (): Taps => Array(PROMPT_COUNT).fill(null);

const samePos = (a: FrettedNote | null, b: FrettedNote) =>
  !!a && a.string === b.string && a.fret === b.fret;

export function IntervalTrainer() {
  const [maxFret, setMaxFret] = useState(MAX_FRET);
  const [round, setRound] = useState<IntervalRound>(() => randomIntervalRound(MAX_FRET));
  const [taps, setTaps] = useState<Taps>(emptyTaps);
  const { score, record } = useScore("interval");

  const { root, intervals } = round;
  const rootMidi = soundingMidi(root);
  const revealed = taps.every(Boolean);

  const targetMidi = (i: number) => rootMidi + intervals[i]!.semitones;
  const isCorrect = (i: number, tap: FrettedNote) => soundingMidi(tap) === targetMidi(i);

  function tapFretboard(pos: FrettedNote) {
    if (revealed || samePos(root, pos)) return;
    const next = [...taps];
    const existing = next.findIndex((t) => samePos(t, pos));
    if (existing >= 0) {
      next[existing] = null; // tapping a marker removes it
    } else {
      const free = next.indexOf(null);
      if (free < 0) return;
      next[free] = pos;
    }
    setTaps(next);
    if (next.every(Boolean)) record(next.every((t, i) => isCorrect(i, t!)));
  }

  function newRound(range = maxFret) {
    setRound((prev) => randomIntervalRound(range, Math.random, prev.root));
    setTaps(emptyTaps());
  }

  function changeRange(range: number) {
    setMaxFret(range);
    newRound(range);
  }

  const markers: FretMarker[] = [{ ...root, tone: "note", label: "R" }];
  taps.forEach((t, i) => {
    if (!t) return;
    const label = intervals[i]!.short;
    if (!revealed) {
      markers.push({ ...t, tone: "placed", label });
    } else if (isCorrect(i, t)) {
      markers.push({ ...t, tone: "correct", label });
    } else {
      markers.push({ ...t, tone: "wrong", label });
      const answer = nearestPositionForMidi(targetMidi(i), t);
      if (answer) markers.push({ ...answer, tone: "answer", label });
    }
  });

  const nextSlot = taps.indexOf(null);
  const hint =
    nextSlot >= 0 ? `tap the ${intervals[nextSlot]!.name}` : revealed ? "" : "tap to remove";

  const correctCount = revealed ? taps.filter((t, i) => isCorrect(i, t!)).length : 0;
  // Right note name, wrong octave: a common slip worth calling out.
  const wrongOctave = revealed
    ? taps.filter(
        (t, i) => !isCorrect(i, t!) && mod(soundingMidi(t!) - targetMidi(i), 12) === 0,
      ).length
    : 0;

  return (
    <div className="trainer">
      <div className="trainer-head">
        <h1>Interval Trainer</h1>
        <ScoreDisplay score={score} />
      </div>

      <FretRangeToggle value={maxFret} onChange={changeRange} />

      <section className="card key-card">
        <div className="key-notes">
          {intervals.map((iv, i) => (
            <span key={iv.semitones} className={`key-chip${i === nextSlot ? " next" : ""}`}>
              {iv.name}
              <small>{iv.short}</small>
            </span>
          ))}
        </div>
        <p className="interval-help">Find each interval above the root (R), on any string.</p>
      </section>

      <section className="card">
        <h2 className="step-label">
          Fretboard
          <span className="hint">{hint}</span>
        </h2>
        <Fretboard
          markers={markers}
          onTap={revealed ? undefined : tapFretboard}
          label="Fretboard with a root note. Tap to place each interval above it."
        />
      </section>

      <RoundResult
        revealed={revealed}
        correct={correctCount === PROMPT_COUNT}
        nextLabel="Next root"
        onNext={() => newRound()}
      >
        {correctCount === PROMPT_COUNT ? (
          "Correct! All four intervals are in the right places."
        ) : (
          <>
            Not quite. {correctCount}/{PROMPT_COUNT} correct
            {wrongOctave > 0 &&
              ` (${wrongOctave === 1 ? "one was" : `${wrongOctave} were`} the right note in the wrong octave)`}
            . The correct notes are shown in red.
          </>
        )}
      </RoundResult>
    </div>
  );
}
