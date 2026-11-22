import { useRef } from "react";
import { FretRangeToggle } from "../components/FretRangeToggle";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { RoundResult } from "../components/RoundResult";
import { Fretboard, type FretMarker } from "../components/Fretboard";
import { Staff, type StaffNote } from "../components/Staff";
import {
  keyName,
  nearestMidiWithPc,
  nearestPosition,
  noteName,
  pcAt,
  randomKeyRound,
  staffPositionInKey,
  type KeyRound,
} from "../lib/keys";
import { MAX_FRET, writtenMidi, writtenRange, type FrettedNote } from "../lib/music";
import { useScore } from "../lib/score";
import { useScreenState } from "../lib/screenState";
import { useScrollTo } from "../lib/scroll";

const RANGE = writtenRange();
const STAFF_LOW = RANGE.low - 1;
const STAFF_HIGH = RANGE.high + 1;

const ROOT_X = 150;
const COLUMNS = [196, 242, 288];

type Slots<T> = [T | null, T | null, T | null];
const emptySlots = <T,>(): Slots<T> => [null, null, null];

const samePos = (a: FrettedNote | null, b: FrettedNote) =>
  !!a && a.string === b.string && a.fret === b.fret;

export function KeyTrainer() {
  // Kept across screen switches so the current question isn't lost.
  const [maxFret, setMaxFret] = useScreenState("key.maxFret", MAX_FRET);
  const [round, setRound] = useScreenState<KeyRound>("key.round", () => randomKeyRound(MAX_FRET));
  const [taps, setTaps] = useScreenState<Slots<FrettedNote>>("key.taps", emptySlots);
  const [placed, setPlaced] = useScreenState<Slots<number>>("key.placed", emptySlots);
  const [revealed, setRevealed] = useScreenState("key.submitted", false);
  const { score, record } = useScore("key");

  const { key, rootPosition, targets } = round;
  const fretDone = taps.every(Boolean);
  const staffDone = placed.every((p) => p !== null);
  const ready = fretDone && staffDone;

  // Bring the next unfinished step into view (the result scrolls itself).
  const fretRef = useRef<HTMLElement>(null);
  const staffRef = useRef<HTMLElement>(null);
  useScrollTo(fretDone && !staffDone ? staffRef : staffDone && !fretDone ? fretRef : null);

  /** Grade one slot given the user's fretboard tap and staff position. */
  function grade(i: number, tap: FrettedNote, pos: number) {
    const target = targets[i]!;
    const fretOk = pcAt(tap) === target.pc;
    // The staff answer is the target note in the octave the user tapped
    // (or the nearest one, if they tapped the wrong note).
    const staffMidi = nearestMidiWithPc(writtenMidi(tap), target.pc);
    const staffAnswer = staffPositionInKey(staffMidi, target);
    return { fretOk, staffOk: pos === staffAnswer, staffAnswer };
  }

  function submit() {
    if (!ready || revealed) return;
    record(taps.every((t, i) => {
      const g = grade(i, t!, placed[i]!);
      return g.fretOk && g.staffOk;
    }));
    setRevealed(true);
  }

  function tapFretboard(pos: FrettedNote) {
    if (revealed || samePos(rootPosition, pos)) return;
    const existing = taps.findIndex((t) => samePos(t, pos));
    const next = [...taps] as Slots<FrettedNote>;
    if (existing >= 0) {
      next[existing] = null; // tapping a marker removes it
    } else {
      const free = next.indexOf(null);
      if (free < 0) return;
      next[free] = pos;
    }
    setTaps(next);
  }

  function placeOnStaff(position: number, column: number) {
    if (revealed) return;
    const next = [...placed] as Slots<number>;
    next[column] = position;
    setPlaced(next);
  }

  function newRound(range = maxFret) {
    setRound((prev) => randomKeyRound(range, Math.random, prev.key));
    setTaps(emptySlots());
    setPlaced(emptySlots());
    setRevealed(false);
  }

  function changeRange(range: number) {
    setMaxFret(range);
    newRound(range);
  }

  const grades = revealed ? taps.map((t, i) => grade(i, t!, placed[i]!)) : null;

  // ----- Fretboard markers -----
  const markers: FretMarker[] = [{ ...rootPosition, tone: "note", label: noteName(key.tonic) }];
  taps.forEach((t, i) => {
    if (!t) return;
    const label = noteName(targets[i]!);
    if (!grades) {
      markers.push({ ...t, tone: "placed", label });
    } else if (grades[i]!.fretOk) {
      markers.push({ ...t, tone: "correct", label });
    } else {
      markers.push({ ...t, tone: "wrong", label });
      markers.push({ ...nearestPosition(targets[i]!.pc, t), tone: "answer", label });
    }
  });

  // ----- Staff notes -----
  const staffNotes: StaffNote[] = [
    {
      position: staffPositionInKey(writtenMidi(rootPosition), key.tonic),
      accidental: null,
      tone: "given",
      x: ROOT_X,
    },
  ];
  placed.forEach((p, i) => {
    if (p === null) return;
    const x = COLUMNS[i]!;
    const g = grades?.[i];
    if (!g) {
      staffNotes.push({ position: p, accidental: null, tone: "neutral", x });
    } else if (g.staffOk) {
      staffNotes.push({ position: p, accidental: null, tone: "correct", x });
    } else {
      // Same column as the user's note; the answer is drawn on top.
      staffNotes.push({ position: p, accidental: null, tone: "wrong", x });
      staffNotes.push({ position: g.staffAnswer, accidental: null, tone: "answer", x });
    }
  });

  const staffLabels = [
    { x: ROOT_X, text: noteName(key.tonic) },
    ...targets.map((t, i) => ({ x: COLUMNS[i]!, text: noteName(t) })),
  ];

  const nextSlot = taps.indexOf(null);
  const fretHint =
    nextSlot >= 0 ? `tap ${noteName(targets[nextSlot]!)}` : revealed ? "" : "tap to remove";

  const fretScore = grades?.filter((g) => g.fretOk).length ?? 0;
  const staffScore = grades?.filter((g) => g.staffOk).length ?? 0;
  const allCorrect = fretScore === 3 && staffScore === 3;

  return (
    <div className="trainer">
      <ScoreDisplay score={score} />

      <FretRangeToggle value={maxFret} onChange={changeRange} />

      <section className="card key-card">
        <div className="key-name">{keyName(key)}</div>
        <div className="key-notes">
          <span className="key-chip root">
            <small>root</small>
            {noteName(key.tonic)}
          </span>
          {targets.map((t, i) => (
            <span key={i} className={`key-chip${i === nextSlot && !revealed ? " next" : ""}`}>
              {noteName(t)}
            </span>
          ))}
        </div>
      </section>

      <section className="card" ref={fretRef}>
        <h2 className="step-label">
          <span className="step-num">1</span> Find on the fretboard
          <span className="hint">{fretHint}</span>
        </h2>
        <Fretboard
          markers={markers}
          onTap={revealed ? undefined : tapFretboard}
          label={`Fretboard showing ${noteName(key.tonic)}. Tap to place the other notes.`}
        />
      </section>

      <section className="card" ref={staffRef}>
        <h2 className="step-label">
          <span className="step-num">2</span> Write on the staff
          <span className="hint">tap above names</span>
        </h2>
        <Staff
          low={STAFF_LOW}
          high={STAFF_HIGH}
          notes={staffNotes}
          disabled={revealed}
          onPlace={placeOnStaff}
          columns={COLUMNS}
          keySignature={key.signature}
          labels={staffLabels}
        />
      </section>

      <RoundResult
        ready={ready}
        submitted={revealed}
        onSubmit={submit}
        correct={allCorrect}
        nextLabel="Next key"
        onNext={() => newRound()}
      >
        {allCorrect
          ? `Correct! ${targets.map(noteName).join(", ")} are all in the right places.`
          : `Not quite. Fretboard ${fretScore}/3, staff ${staffScore}/3. The correct answers are shown in red.`}
      </RoundResult>
    </div>
  );
}
