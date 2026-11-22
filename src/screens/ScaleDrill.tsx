import { useEffect, useState } from "react";
import { Fretboard, type FretMarker } from "../components/Fretboard";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { keyName, noteName } from "../lib/keys";
import type { FrettedNote } from "../lib/music";
import { useScore } from "../lib/score";
import {
  degreeName,
  isCorrectTap,
  randomScaleRound,
  scaleNotes,
  type ScaleRound,
} from "../lib/scaleDrill";
import { useScreenState } from "../lib/screenState";

const FEEDBACK_MS = 1000;
const COMPLETE_MS = 1800;

interface Placed {
  degree: number;
  /** Where the note now sits: the user's tap if right, else its standard position. */
  pos: FrettedNote;
  correct: boolean;
}

/** The answer just given, shown briefly before the next question. */
interface Feedback {
  degree: number;
  tap: FrettedNote;
  correct: boolean;
  complete: boolean;
}

const samePos = (a: FrettedNote, b: FrettedNote) => a.string === b.string && a.fret === b.fret;

export function ScaleDrill() {
  const [round, setRound] = useScreenState<ScaleRound>("scale-drill.round", () => randomScaleRound());
  const [placed, setPlaced] = useScreenState<Placed[]>("scale-drill.placed", []);
  // Not persisted: the drill has already moved on, this just delays showing it.
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { score, record } = useScore("scale-drill");

  const { key, root, order } = round;
  const notes = scaleNotes(round);
  const done = placed.length >= order.length;

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), feedback.complete ? COMPLETE_MS : FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [feedback]);

  // A finished round moves on once its feedback has cleared (also covers
  // coming back to the screen after leaving mid-way through the message).
  useEffect(() => {
    if (done && !feedback) {
      setRound((prev) => randomScaleRound(Math.random, prev.key));
      setPlaced([]);
    }
  }, [done, feedback, setRound, setPlaced]);

  function tap(pos: FrettedNote) {
    if (feedback || done) return;
    if (samePos(pos, root) || placed.some((p) => samePos(p.pos, pos))) return;
    const degree = order[placed.length]!;
    const note = notes[degree]!;
    const correct = isCorrectTap(note, pos);
    record(correct);
    setPlaced([...placed, { degree, pos: correct ? pos : note.position!, correct }]);
    setFeedback({ degree, tap: pos, correct, complete: placed.length + 1 === order.length });
  }

  const degree = feedback?.degree ?? order[Math.min(placed.length, order.length - 1)]!;
  const target = notes[degree]!;
  const targetName = noteName(target);

  const markers: FretMarker[] = [{ ...root, tone: "root", label: noteName(key.tonic) }];
  placed.forEach((p, i) => {
    const justMissed = feedback && !feedback.correct && i === placed.length - 1;
    markers.push({
      ...p.pos,
      tone: justMissed ? "answer" : p.correct ? "correct" : "placed",
      label: noteName(notes[p.degree]!),
    });
  });
  if (feedback && !feedback.correct) markers.push({ ...feedback.tap, tone: "wrong" });

  const correctCount = placed.filter((p) => p.correct).length;
  let message: string;
  if (!feedback) message = `Tap the ${degreeName(degree)} above the root`;
  else message = feedback.correct ? "Correct!" : `Not quite: ${targetName} is shown in red`;
  if (feedback?.complete) message += ` Scale complete: ${correctCount}/${order.length}.`;

  return (
    <div className="trainer">
      <ScoreDisplay score={score} />

      <section className="card drill-question">
        <div className="drill-key">{keyName(key)}</div>
        <div className="drill-note" aria-live="polite">
          {targetName}
        </div>
        <div className="drill-where">
          the <strong>{degreeName(degree)}</strong> above the root
        </div>
        <div className="drill-progress" aria-label={`${placed.length} of ${order.length} notes placed`}>
          {order.map((_, i) => (
            <span key={i} className={`drill-dot${i < placed.length ? " done" : ""}`} />
          ))}
        </div>
      </section>

      <section className="card">
        <Fretboard
          markers={markers}
          onTap={feedback || done ? undefined : tap}
          label={`Fretboard with the root of ${keyName(key)} marked. Tap the ${degreeName(degree)}, ${targetName}.`}
        />
        <p
          className={`drill-feedback${feedback ? (feedback.correct ? " ok" : " bad") : ""}`}
          aria-live="polite"
        >
          {message}
        </p>
      </section>
    </div>
  );
}
