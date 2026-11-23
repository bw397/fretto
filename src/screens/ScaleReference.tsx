import { Fretboard, type FretMarker } from "../components/Fretboard";
import { Segmented } from "../components/Segmented";
import { Staff, type StaffNote } from "../components/Staff";
import { INTERVALS } from "../lib/intervals";
import { keyName, noteName, staffPositionInKey, type Mode } from "../lib/keys";
import { mod, writtenRange, type FrettedNote } from "../lib/music";
import { scaleFromRoot } from "../lib/scale";
import { useScreenState } from "../lib/screenState";

const RANGE = writtenRange();
const STAFF_LOW = RANGE.low - 1;
const STAFF_HIGH = RANGE.high + 1;

const STAFF_WIDTH = 440;
const FIRST_X = 150;
const NOTE_SPACING = 38;

const MODES = [
  { value: "major" as Mode, label: "Major" },
  { value: "minor" as Mode, label: "Minor" },
];

type LabelMode = "notes" | "intervals";

const LABEL_MODES = [
  { value: "notes" as LabelMode, label: "Notes" },
  { value: "intervals" as LabelMode, label: "Intervals" },
];

/** Interval above the root for a fretboard marker: R for both roots, else e.g. 2, m3, 5. */
function intervalLabel(semitones: number): string {
  const s = mod(semitones, 12);
  return s === 0 ? "R" : INTERVALS.find((i) => i.semitones === s)!.short;
}

export function ScaleReference() {
  const [mode, setMode] = useScreenState<Mode>("scale.mode", "major");
  const [root, setRoot] = useScreenState<FrettedNote | null>("scale.root", null);
  const [labelMode, setLabelMode] = useScreenState<LabelMode>("scale.labels", "notes");

  const scale = root ? scaleFromRoot(root, mode) : null;

  const markers: FretMarker[] = [];
  const staffNotes: StaffNote[] = [];
  const labels: { x: number; text: string }[] = [];

  scale?.notes.forEach((n, i) => {
    const isRoot = n.degree === 0 || n.degree === 7;
    if (n.position) {
      const label = labelMode === "notes" ? noteName(n) : intervalLabel(n.midi - scale.notes[0]!.midi);
      markers.push({ ...n.position, tone: isRoot ? "root" : "placed", label });
    }
    const x = FIRST_X + i * NOTE_SPACING;
    staffNotes.push({
      position: staffPositionInKey(n.midi + 12, n),
      accidental: null,
      tone: isRoot ? "given" : "neutral",
      x,
    });
    labels.push({ x, text: noteName(n) });
  });

  // Notes past fret 12 are still written on the staff, so they can go above
  // the fretboard's range; grow the staff to fit them.
  const staffHigh = Math.max(STAFF_HIGH, ...staffNotes.map((n) => n.position + 1));

  const missing = scale?.notes.filter((n) => !n.position).length ?? 0;

  return (
    <div className="trainer">
      <div className="segmented-row">
        <Segmented options={MODES} value={mode} onChange={setMode} label="Scale type" />
        <Segmented
          options={LABEL_MODES}
          value={labelMode}
          onChange={setLabelMode}
          label="Fretboard labels"
        />
      </div>

      <section className="card">
        <h2 className="step-label">
          Fretboard
          <span className="hint">{root ? "tap to change root" : "tap a root note"}</span>
        </h2>
        <Fretboard
          markers={markers}
          onTap={setRoot}
          label={
            scale
              ? `${keyName(scale.key)} scale on the fretboard. Tap to choose a different root.`
              : "Empty fretboard. Tap a note to choose the root."
          }
        />
        {missing > 0 && (
          <p className="scale-note">
            {missing === 7 ? "The rest of the scale" : `${missing} note${missing > 1 ? "s" : ""}`}{" "}
            would go past fret 12.
          </p>
        )}
      </section>

      <section className="card">
        {scale ? (
          <>
            <h2 className="scale-title">{keyName(scale.key)}</h2>
            <Staff
              low={STAFF_LOW}
              high={staffHigh}
              notes={staffNotes}
              disabled
              keySignature={scale.key.signature}
              labels={labels}
              width={STAFF_WIDTH}
            />
          </>
        ) : (
          <p className="empty-hint">Tap a root note on the fretboard to see its scale.</p>
        )}
      </section>
    </div>
  );
}
