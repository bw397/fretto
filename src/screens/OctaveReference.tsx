import { Fretboard, type FretMarker } from "../components/Fretboard";
import { Staff, type StaffNote } from "../components/Staff";
import {
  LETTERS,
  LETTER_SEMITONES,
  MAX_FRET,
  STANDARD_TUNING,
  diatonicIndex,
  writtenRange,
  formatSpelling,
  octaveOf,
  soundingMidi,
  spellings,
} from "../lib/music";

// Every position on the board, coloured by the octave of the note it sounds.
const MARKERS: FretMarker[] = STANDARD_TUNING.flatMap((_, string) =>
  Array.from({ length: MAX_FRET + 1 }, (_, fret) => {
    const octave = octaveOf(soundingMidi({ string, fret }));
    return { string, fret, tone: `oct-${octave}` as const, label: String(octave) };
  }),
);

/** Each octave on the board with its lowest and highest note, e.g. "E2–B2". */
const LEGEND = (() => {
  const pitches = MARKERS.map(soundingMidi);
  const octaves = [...new Set(pitches.map(octaveOf))].sort((a, b) => a - b);
  return octaves.map((octave) => {
    const inOctave = pitches.filter((m) => octaveOf(m) === octave);
    const name = (m: number) => formatSpelling(spellings(m)[0]!);
    return { octave, range: `${name(Math.min(...inOctave))}–${name(Math.max(...inOctave))}` };
  });
})();

// ----- Staff: one column per octave, stacking its natural notes -----

const RANGE = writtenRange();
const STAFF_LOW = RANGE.low - 1;
const STAFF_HIGH = RANGE.high + 1;
const FIRST_X = 130;
const COLUMN_SPACING = 52;

const BOARD_LOW = Math.min(...MARKERS.map(soundingMidi));
const BOARD_HIGH = Math.max(...MARKERS.map(soundingMidi));

const STAFF_NOTES: StaffNote[] = [];
const STAFF_LABELS = LEGEND.map(({ octave }, i) => {
  const x = FIRST_X + i * COLUMN_SPACING;
  for (const letter of LETTERS) {
    const midi = (octave + 1) * 12 + LETTER_SEMITONES[letter];
    if (midi < BOARD_LOW || midi > BOARD_HIGH) continue;
    // Guitar is written an octave above the sounding pitch.
    const position = diatonicIndex({ letter, octave: octave + 1 });
    STAFF_NOTES.push({ position, accidental: null, tone: `oct-${octave}`, x });
  }
  return { x, text: String(octave) };
});

export function OctaveReference() {
  return (
    <div className="trainer">
      <div className="trainer-head">
        <h1>Octaves</h1>
      </div>

      <section className="card">
        <Fretboard
          markers={MARKERS}
          label={`Fretboard with every position labelled by octave: ${LEGEND.map(
            (l) => `octave ${l.octave} is ${l.range}`,
          ).join(", ")}.`}
        />
      </section>

      <section className="card">
        <ul className="octave-legend">
          {LEGEND.map((l) => (
            <li key={l.octave}>
              <span className={`octave-swatch oct-${l.octave}`}>{l.octave}</span>
              <span>
                Octave {l.octave}
                <small>{l.range}</small>
              </span>
            </li>
          ))}
        </ul>
        <p className="scale-note">
          Each octave starts on C. Numbers are for the note the guitar sounds, so the open low E is
          E2 (it's written an octave higher on the staff).
        </p>
      </section>

      <section className="card">
        <h2 className="step-label">On the staff</h2>
        <Staff
          low={STAFF_LOW}
          high={STAFF_HIGH}
          notes={STAFF_NOTES}
          disabled
          labels={STAFF_LABELS}
        />
        <p className="scale-note">
          The natural notes of each octave on a 12-fret guitar, written an octave above how they
          sound, as usual for guitar music.
        </p>
      </section>
    </div>
  );
}
