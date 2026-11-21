import { useRef } from "react";
import { FretRangeToggle } from "../components/FretRangeToggle";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { RoundResult } from "../components/RoundResult";
import { Fretboard } from "../components/Fretboard";
import { Staff, type StaffNote } from "../components/Staff";
import {
  MAX_FRET,
  PITCH_CLASS_OPTIONS,
  accidentalFor,
  diatonicIndex,
  formatSpelling,
  letterAt,
  pitchClass,
  pitchClassLabel,
  randomFrettedNote,
  spellingAtPosition,
  spellings,
  validStaffPositions,
  writtenMidi,
  writtenRange,
  type FrettedNote,
} from "../lib/music";
import { useScore } from "../lib/score";
import { useScreenState } from "../lib/screenState";
import { useScrollTo } from "../lib/scroll";

const RANGE = writtenRange();
// One extra position either side so the extremes aren't at the very edge.
const STAFF_LOW = RANGE.low - 1;
const STAFF_HIGH = RANGE.high + 1;

const USER_X = 180;
const ANSWER_X = 248;

export function SingleNoteTrainer() {
  // Kept across screen switches so the current question isn't lost.
  const [maxFret, setMaxFret] = useScreenState("single-note.maxFret", MAX_FRET);
  const [note, setNote] = useScreenState<FrettedNote>("single-note.note", () =>
    randomFrettedNote(Math.random, MAX_FRET),
  );
  const [chosenPc, setChosenPc] = useScreenState<number | null>("single-note.name", null);
  const [placed, setPlaced] = useScreenState<number | null>("single-note.placed", null);
  const [revealed, setRevealed] = useScreenState("single-note.submitted", false);
  const { score, record } = useScore("single-note");

  const midi = writtenMidi(note);
  const answerPc = pitchClass(midi);
  const ready = chosenPc !== null && placed !== null;

  // Bring the next unanswered step into view (the result scrolls itself).
  const nameRef = useRef<HTMLElement>(null);
  const staffRef = useRef<HTMLElement>(null);
  useScrollTo(
    chosenPc !== null && placed === null ? staffRef : placed !== null && chosenPc === null ? nameRef : null,
  );
  const nameCorrect = chosenPc === answerPc;
  const staffCorrect = placed !== null && validStaffPositions(midi).includes(placed);
  const allCorrect = nameCorrect && staffCorrect;

  function chooseName(pc: number) {
    if (!revealed) setChosenPc(pc);
  }

  function place(pos: number) {
    if (!revealed) setPlaced(pos);
  }

  function submit() {
    if (!ready || revealed) return;
    record(allCorrect);
    setRevealed(true);
  }

  function next(range = maxFret) {
    setNote((prev) => randomFrettedNote(Math.random, range, prev));
    setChosenPc(null);
    setPlaced(null);
    setRevealed(false);
  }

  function changeRange(range: number) {
    setMaxFret(range);
    next(range);
  }

  // The answer's spelling: match the user's staff position when it's a valid
  // enharmonic spelling, otherwise default to the sharp spelling.
  const answerSpelling =
    (placed !== null && spellingAtPosition(midi, placed)) || spellings(midi)[0]!;

  const staffNotes: StaffNote[] = [];
  if (placed !== null) {
    const accidental =
      chosenPc !== null ? accidentalFor(letterAt(placed).letter, chosenPc) ?? null : null;
    staffNotes.push({
      position: placed,
      accidental,
      tone: !revealed ? "neutral" : staffCorrect ? "correct" : "wrong",
      x: USER_X,
    });
  }
  if (revealed && !staffCorrect) {
    staffNotes.push({
      position: diatonicIndex(answerSpelling),
      accidental: answerSpelling.accidental,
      tone: "answer",
      x: ANSWER_X,
    });
  }

  return (
    <div className="trainer">
      <div className="trainer-head">
        <h1>Single Note Trainer</h1>
        <ScoreDisplay score={score} />
      </div>

      <FretRangeToggle value={maxFret} onChange={changeRange} />

      <section className="card">
        <Fretboard markers={[{ ...note, tone: "note" }]} />
      </section>

      <section className="card" ref={nameRef}>
        <h2 className="step-label">
          <span className="step-num">1</span> Name the note
        </h2>
        <div className="note-options" role="radiogroup" aria-label="Note name">
          {PITCH_CLASS_OPTIONS.map((opt) => {
            const isChosen = chosenPc === opt.pc;
            const isAnswer = revealed && opt.pc === answerPc;
            let cls = "note-option";
            if (isChosen) cls += " chosen";
            if (revealed && isChosen) cls += nameCorrect ? " is-correct" : " is-wrong";
            if (isAnswer && !nameCorrect) cls += " is-answer";
            return (
              <label key={opt.pc} className={cls}>
                <input
                  type="radio"
                  name="note-name"
                  value={opt.pc}
                  checked={isChosen}
                  disabled={revealed}
                  onChange={() => chooseName(opt.pc)}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="card" ref={staffRef}>
        <h2 className="step-label">
          <span className="step-num">2</span> Place it on the staff
          <span className="hint">tap or drag</span>
        </h2>
        <Staff
          low={STAFF_LOW}
          high={STAFF_HIGH}
          notes={staffNotes}
          disabled={revealed}
          onPlace={place}
          columns={[USER_X]}
        />
      </section>

      <RoundResult
        ready={ready}
        submitted={revealed}
        onSubmit={submit}
        correct={allCorrect}
        nextLabel="Next note"
        onNext={next}
      >
        {allCorrect ? (
          <>Correct! That's {formatSpelling(answerSpelling)}.</>
        ) : (
          <>
            Not quite. The note is {pitchClassLabel(answerPc)}, written{" "}
            {spellings(midi).map(formatSpelling).join(" or ")}.
            {nameCorrect && " You named it right, but the staff position is off."}
            {staffCorrect && " The staff position is right, but the name is off."}
          </>
        )}
      </RoundResult>
    </div>
  );
}
