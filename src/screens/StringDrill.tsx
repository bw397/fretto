import { useEffect, useState } from "react";
import { Fretboard, type FretMarker } from "../components/Fretboard";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { Segmented } from "../components/Segmented";
import {
  DEFAULT_SETTINGS,
  QUESTIONS_PER_STRING_OPTIONS,
  advance,
  answerNear,
  fretsForPc,
  randomDrillNote,
  type DrillNote,
  type DrillProgress,
  type DrillSettings,
  type StringOrder,
} from "../lib/drill";
import { MAX_FRET, STRING_NAMES, type FrettedNote } from "../lib/music";
import { useScore } from "../lib/score";
import { useScreenState } from "../lib/screenState";

const FEEDBACK_MS = 1000;

const FRET_OPTIONS = [
  { value: 5, label: "0–5" },
  { value: MAX_FRET, label: `0–${MAX_FRET}` },
];
const ORDER_OPTIONS: { value: StringOrder; label: string }[] = [
  { value: "progression", label: "In order" },
  { value: "random", label: "Random" },
];
const PER_STRING_OPTIONS = QUESTIONS_PER_STRING_OPTIONS.map((n) => ({ value: n, label: String(n) }));

/** The answered question, kept on screen briefly to show right/wrong. */
interface Feedback extends DrillProgress {
  note: DrillNote;
  tap: FrettedNote;
  correct: boolean;
  maxFret: number;
}

const fretText = (frets: number[]) =>
  frets.map((f) => (f === 0 ? "open" : `fret ${f}`)).join(" or ");

export function StringDrill() {
  const [settings, setSettings] = useScreenState<DrillSettings>(
    "string-drill.settings",
    DEFAULT_SETTINGS,
  );
  const [progress, setProgress] = useScreenState<DrillProgress>("string-drill.progress", {
    string: 0,
    done: 0,
  });
  const [note, setNote] = useScreenState<DrillNote>("string-drill.note", () =>
    randomDrillNote(0, DEFAULT_SETTINGS.maxFret),
  );
  // Not persisted: the drill has already moved on, this just delays showing it.
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { score, record } = useScore("string-drill");

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [feedback]);

  /** Changing a setting restarts the count on the current string with a fresh question. */
  function changeSettings(change: Partial<DrillSettings>) {
    const next = { ...settings, ...change };
    setSettings(next);
    setFeedback(null);
    setProgress({ string: progress.string, done: 0 });
    setNote(randomDrillNote(progress.string, next.maxFret, note.pc));
  }

  function tap(pos: FrettedNote) {
    if (feedback) return;
    const correct = fretsForPc(progress.string, note.pc).includes(pos.fret);
    record(correct);
    setFeedback({ ...progress, note, tap: pos, correct, maxFret: settings.maxFret });
    // Advance now; the new question appears when the feedback clears.
    const next = advance(progress, settings);
    setProgress(next);
    setNote(randomDrillNote(next.string, settings.maxFret, note.pc));
  }

  // While feedback is showing, keep displaying the question that was answered.
  const shown = feedback ?? { ...progress, note };
  const stringName = STRING_NAMES[shown.string]!;
  const answered = shown.done + (feedback ? 1 : 0);

  const markers: FretMarker[] = [];
  if (feedback) {
    const { tap: t, correct, note: n, string, maxFret } = feedback;
    markers.push({ ...t, tone: correct ? "correct" : "wrong", label: correct ? n.name : undefined });
    if (!correct) {
      markers.push({ ...answerNear(string, n.pc, t.fret, maxFret), tone: "answer", label: n.name });
    }
  }

  return (
    <div className="trainer">
      <div className="trainer-head">
        <h1>String Drill</h1>
        <ScoreDisplay score={score} />
      </div>

      <div className="settings">
        <div className="setting-row">
          <span>Frets</span>
          <Segmented
            compact
            options={FRET_OPTIONS}
            value={settings.maxFret}
            onChange={(maxFret) => changeSettings({ maxFret })}
            label="Fret range"
          />
        </div>
        <div className="setting-row">
          <span>Strings</span>
          <Segmented
            compact
            options={ORDER_OPTIONS}
            value={settings.order}
            onChange={(order) => changeSettings({ order })}
            label="String order"
          />
        </div>
        <div className="setting-row">
          <span>Per string</span>
          <Segmented
            compact
            options={PER_STRING_OPTIONS}
            value={settings.perString}
            onChange={(perString) => changeSettings({ perString })}
            label="Questions per string"
          />
        </div>
      </div>

      <section className="card drill-question">
        <div className="drill-note" aria-live="polite">
          {shown.note.name}
        </div>
        <div className="drill-where">
          on the <strong>{stringName}</strong> string
        </div>
        <div
          className="drill-progress"
          aria-label={`${answered} of ${settings.perString} on this string`}
        >
          {Array.from({ length: settings.perString }, (_, i) => (
            <span key={i} className={`drill-dot${i < answered ? " done" : ""}`} />
          ))}
        </div>
      </section>

      <section className="card">
        <Fretboard
          markers={markers}
          focusString={shown.string}
          tapMaxFret={settings.maxFret}
          onTap={feedback ? undefined : tap}
          label={`Fretboard with the ${stringName} string highlighted. Tap where ${shown.note.name} is.`}
        />
        <p
          className={`drill-feedback${feedback ? (feedback.correct ? " ok" : " bad") : ""}`}
          aria-live="polite"
        >
          {!feedback
            ? `Tap ${shown.note.name} on the ${stringName} string`
            : feedback.correct
              ? "Correct!"
              : `Not quite: ${feedback.note.name} is ${fretText(
                  fretsForPc(feedback.string, feedback.note.pc, feedback.maxFret),
                )}`}
        </p>
      </section>
    </div>
  );
}
