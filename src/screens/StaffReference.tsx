import { Staff, type StaffNote } from "../components/Staff";
import { KEYS, keyName, noteAtPosition, noteName } from "../lib/keys";
import { writtenRange } from "../lib/music";
import { useScreenState } from "../lib/screenState";

const RANGE = writtenRange();
const STAFF_LOW = RANGE.low - 1;
const STAFF_HIGH = RANGE.high + 1;

const NOTE_COUNT = 8;
const STAFF_WIDTH = 440;
const COLUMNS = Array.from({ length: NOTE_COUNT }, (_, i) => 150 + i * 38);

const empty = () => Array<number | null>(NOTE_COUNT).fill(null);

export function StaffReference() {
  const [keyIndex, setKeyIndex] = useScreenState("staff.key", 0); // C major
  const [placed, setPlaced] = useScreenState<(number | null)[]>("staff.notes", empty);
  const key = KEYS[keyIndex]!;

  function place(position: number, column: number) {
    setPlaced((prev) => {
      const next = [...prev];
      // Tapping a note again removes it; otherwise place or move it.
      next[column] = prev[column] === position ? null : position;
      return next;
    });
  }

  const notes: StaffNote[] = [];
  const labels: { x: number; text: string }[] = [];
  placed.forEach((p, i) => {
    if (p === null) return;
    notes.push({ position: p, accidental: null, tone: "neutral", x: COLUMNS[i]! });
    labels.push({ x: COLUMNS[i]!, text: noteName(noteAtPosition(p, key)) });
  });

  return (
    <div className="trainer">
      <label className="key-select">
        <span>Key</span>
        <select value={keyIndex} onChange={(e) => setKeyIndex(Number(e.target.value))}>
          {(["major", "minor"] as const).map((mode) => (
            <optgroup key={mode} label={mode === "major" ? "Major" : "Minor"}>
              {KEYS.map((k, i) =>
                k.mode === mode ? (
                  <option key={i} value={i}>
                    {keyName(k)}
                  </option>
                ) : null,
              )}
            </optgroup>
          ))}
        </select>
      </label>

      <section className="card">
        <h2 className="step-label">
          {keyName(key)}
          <span className="hint">tap to add or remove</span>
        </h2>
        <Staff
          low={STAFF_LOW}
          high={STAFF_HIGH}
          notes={notes}
          onPlace={place}
          columns={COLUMNS}
          keySignature={key.signature}
          labels={labels}
          width={STAFF_WIDTH}
        />
        <div className="staff-actions">
          <button
            className="text-btn"
            onClick={() => setPlaced(empty())}
            disabled={placed.every((p) => p === null)}
          >
            Clear
          </button>
        </div>
      </section>
    </div>
  );
}
