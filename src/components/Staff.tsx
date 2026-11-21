import { useRef, useState } from "react";
import { FLAT_POSITIONS, SHARP_POSITIONS, type KeySignature } from "../lib/keys";
import {
  STAFF_BOTTOM_LINE,
  STAFF_TOP_LINE,
  ledgerLines,
  type Accidental,
} from "../lib/music";

/** Half a line-spacing: the vertical distance between adjacent positions. */
const STEP = 9;
const DEFAULT_WIDTH = 320;
const PAD_Y = 14;
const STAFF_X1 = 8;
const G4 = STAFF_BOTTOM_LINE + 2;

export type NoteTone =
  | "neutral"
  | "given"
  | "correct"
  | "wrong"
  | "answer"
  | "ghost"
  /** Octave colour (Octaves screen), matching the fretboard markers. */
  | `oct-${number}`;

export interface StaffNote {
  position: number;
  accidental: Accidental;
  tone: NoteTone;
  x: number;
}

interface Props {
  /** Lowest and highest selectable diatonic positions. */
  low: number;
  high: number;
  notes: StaffNote[];
  disabled?: boolean;
  /**
   * Called with the staff position and the index of the column (from
   * `columns`) nearest the tap.
   */
  onPlace?: (position: number, column: number) => void;
  /** X coordinates where notes can be placed. The nearest one to a tap wins. */
  columns?: number[];
  keySignature?: KeySignature | null;
  /** Text drawn under the staff, e.g. note names. Passing any array (even empty) reserves the space. */
  labels?: { x: number; text: string }[];
  /** ViewBox width; widen it to fit more notes. */
  width?: number;
}

interface Target {
  position: number;
  column: number;
}

export function Staff({
  low,
  high,
  notes,
  disabled,
  onPlace,
  columns = [180],
  keySignature,
  labels,
  width: W = DEFAULT_WIDTH,
}: Props) {
  const STAFF_X2 = W - 8;
  const svgRef = useRef<SVGSVGElement>(null);
  const [ghost, setGhost] = useState<Target | null>(null);
  const dragging = useRef(false);

  const labelSpace = labels ? 22 : 0;
  const staffHeight = (high - low) * STEP + PAD_Y * 2;
  const height = staffHeight + labelSpace;
  const y = (d: number) => PAD_Y + (high - d) * STEP;

  function targetFromEvent(e: React.PointerEvent): Target | null {
    const svg = svgRef.current;
    if (!svg || columns.length === 0) return null;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const svgY = ((e.clientY - rect.top) / rect.height) * height;
    const d = Math.round(high - (svgY - PAD_Y) / STEP);
    let column = 0;
    columns.forEach((cx, i) => {
      if (Math.abs(cx - svgX) < Math.abs(columns[column]! - svgX)) column = i;
    });
    return { position: Math.max(low, Math.min(high, d)), column };
  }

  const handlers = disabled
    ? {}
    : {
        onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setGhost(targetFromEvent(e));
        },
        onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
          // Mouse users get a hover preview; touch users see it while dragging.
          if (dragging.current || e.pointerType === "mouse") setGhost(targetFromEvent(e));
        },
        onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
          if (!dragging.current) return;
          dragging.current = false;
          const t = targetFromEvent(e);
          setGhost(null);
          if (t) onPlace?.(t.position, t.column);
        },
        onPointerCancel() {
          dragging.current = false;
          setGhost(null);
        },
        onPointerLeave(e: React.PointerEvent<SVGSVGElement>) {
          if (e.pointerType === "mouse" && !dragging.current) setGhost(null);
        },
      };

  const allNotes: StaffNote[] =
    ghost !== null && !disabled
      ? [
          ...notes,
          { position: ghost.position, accidental: null, tone: "ghost", x: columns[ghost.column]! },
        ]
      : notes;

  const staffLines = [0, 2, 4, 6, 8].map((i) => STAFF_BOTTOM_LINE + i);

  return (
    <svg
      ref={svgRef}
      className={`staff${disabled ? " staff-disabled" : ""}`}
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={disabled ? "Treble clef staff" : "Treble clef staff. Tap or drag to place a note."}
      {...handlers}
    >
      {staffLines.map((d) => (
        <line key={d} className="staff-line" x1={STAFF_X1} x2={STAFF_X2} y1={y(d)} y2={y(d)} />
      ))}
      <line
        className="staff-line"
        x1={STAFF_X1}
        x2={STAFF_X1}
        y1={y(STAFF_TOP_LINE)}
        y2={y(STAFF_BOTTOM_LINE)}
      />

      <TrebleClef x={34} gLineY={y(G4)} spacing={STEP * 2} />

      {keySignature &&
        (keySignature.type === "sharp" ? SHARP_POSITIONS : FLAT_POSITIONS)
          .slice(0, keySignature.count)
          .map((d, i) => (
            <text
              key={i}
              className={`key-sig key-sig-${keySignature.type}`}
              x={64 + i * 11}
              y={y(d)}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {keySignature.type === "sharp" ? "♯" : "♭"}
            </text>
          ))}

      {labels?.map((l, i) => (
        <text key={i} className="staff-label" x={l.x} y={staffHeight + 8} textAnchor="middle">
          {l.text}
        </text>
      ))}

      {/* Two passes so every line sits under every note head, even when
          notes in a column overlap: all ledger lines first, then the heads. */}
      {allNotes.map((n, i) => (
        <NoteHead key={`l${i}`} note={n} cy={y(n.position)} layer="lines" />
      ))}
      {allNotes.map((n, i) => (
        <NoteHead key={`h${i}`} note={n} cy={y(n.position)} layer="head" />
      ))}
    </svg>
  );
}

interface NoteHeadProps {
  note: StaffNote;
  cy: number;
  /** "lines" draws the note's ledger lines; "head" draws the head and accidental. */
  layer: "lines" | "head";
}

function NoteHead({ note, cy, layer }: NoteHeadProps) {
  const rx = STEP * 1.3;
  const ry = STEP * 0.95;
  if (layer === "lines") {
    return (
      <g className={`staff-note tone-${note.tone}`}>
        {ledgerLines(note.position).map((d) => {
          const ly = cy + (note.position - d) * STEP;
          return (
            <line
              key={d}
              className="ledger-line"
              x1={note.x - rx - 7}
              x2={note.x + rx + 7}
              y1={ly}
              y2={ly}
            />
          );
        })}
      </g>
    );
  }
  return (
    <g className={`staff-note tone-${note.tone}`}>
      <ellipse
        cx={note.x}
        cy={cy}
        rx={rx}
        ry={ry}
        transform={`rotate(-20 ${note.x} ${cy})`}
      />
      {note.accidental && (
        <text
          className="accidental"
          x={note.x - rx - 6}
          y={cy}
          textAnchor="end"
          dominantBaseline="central"
        >
          {note.accidental === "sharp" ? "♯" : "♭"}
        </text>
      )}
    </g>
  );
}

/**
 * Hand-drawn treble (G) clef with the small "8" below, marking guitar's
 * octave transposition. Drawn in units where the staff line spacing is 10
 * and the G line sits at y = 0.
 */
function TrebleClef({ x, gLineY, spacing }: { x: number; gLineY: number; spacing: number }) {
  const s = spacing / 10;
  return (
    <g className="clef" transform={`translate(${x} ${gLineY}) scale(${s})`}>
      <path
        d="M 1.5 3.2
           C -3.5 3.2 -4.6 -4.6 1.2 -5.6
           C 8.8 -6.6 10.6 5.6 2.4 8.6
           C -7.4 11.4 -12.6 1.4 -8.6 -7.4
           C -5.8 -13.6 3.6 -19.6 5.6 -28.6
           C 7.4 -37 4.6 -45 1.4 -43.6
           C -3.8 -41.6 -4.2 -30 -1.6 -16
           L 3.6 17.4
           C 4.6 23.6 -1.8 25.6 -4.4 21.6"
      />
      <circle cx={-3.2} cy={20.8} r={2.6} className="clef-dot" />
      <text className="clef-8" x={-1} y={33} textAnchor="middle">
        8
      </text>
    </g>
  );
}
