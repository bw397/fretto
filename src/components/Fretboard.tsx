import { MAX_FRET, STANDARD_TUNING, STRING_NAMES, type FrettedNote } from "../lib/music";

const W = 480;
const H = 186;
const NUT_X = 44;
const END_X = W - 10;
const TOP_Y = 22;
const STRING_GAP = 26;
const BOTTOM_Y = TOP_Y + STRING_GAP * (STANDARD_TUNING.length - 1);
const INLAYS = [3, 5, 7, 9];

/**
 * X position of fret wire `n`. Blends real guitar spacing with equal spacing
 * so higher frets stay large enough to read on a phone.
 */
function fretX(n: number, frets: number): number {
  const real = (1 - 2 ** (-n / 12)) / (1 - 2 ** (-frets / 12));
  const equal = n / frets;
  return NUT_X + (END_X - NUT_X) * (0.55 * real + 0.45 * equal);
}

function noteX(fret: number, frets: number): number {
  if (fret === 0) return NUT_X - 22;
  return (fretX(fret - 1, frets) + fretX(fret, frets)) / 2;
}

const stringY = (s: number) => TOP_Y + s * STRING_GAP;

export type MarkerTone = "note" | "root" | "placed" | "correct" | "wrong" | "answer";

export interface FretMarker extends FrettedNote {
  tone: MarkerTone;
  label?: string;
}

interface Props {
  markers: FretMarker[];
  frets?: number;
  /** When set, every string/fret cell becomes tappable. */
  onTap?: (pos: FrettedNote) => void;
  label?: string;
}

function cellX(fret: number, frets: number): [number, number] {
  return fret === 0 ? [0, NUT_X - 3] : [fretX(fret - 1, frets), fretX(fret, frets)];
}

export function Fretboard({ markers, frets = MAX_FRET, onTap, label }: Props) {
  const midY = (TOP_Y + BOTTOM_Y) / 2;
  const fretNums = Array.from({ length: frets }, (_, i) => i + 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`fretboard${onTap ? " fretboard-tappable" : ""}`}
      role="img"
      aria-label={label ?? markers.map(describe).join("; ")}
    >
      <rect
        className="fb-wood"
        x={NUT_X}
        y={TOP_Y - 12}
        width={END_X - NUT_X}
        height={BOTTOM_Y - TOP_Y + 24}
        rx={3}
      />

      {INLAYS.filter((f) => f <= frets).map((f) => (
        <circle key={f} className="fb-inlay" cx={noteX(f, frets)} cy={midY} r={6} />
      ))}
      {frets >= 12 && (
        <>
          <circle className="fb-inlay" cx={noteX(12, frets)} cy={midY - STRING_GAP} r={6} />
          <circle className="fb-inlay" cx={noteX(12, frets)} cy={midY + STRING_GAP} r={6} />
        </>
      )}

      {fretNums.map((f) => (
        <line
          key={f}
          className="fb-fret"
          x1={fretX(f, frets)}
          x2={fretX(f, frets)}
          y1={TOP_Y - 12}
          y2={BOTTOM_Y + 12}
        />
      ))}
      <rect className="fb-nut" x={NUT_X - 4} y={TOP_Y - 12} width={6} height={BOTTOM_Y - TOP_Y + 24} />

      {STANDARD_TUNING.map((_, s) => (
        <g key={s}>
          {!markers.some((m) => m.string === s && m.fret === 0) && (
            <text className="fb-string-name" x={8} y={stringY(s)} dominantBaseline="central">
              {STRING_NAMES[s]}
            </text>
          )}
          <line
            className="fb-string"
            x1={NUT_X - 26}
            x2={END_X}
            y1={stringY(s)}
            y2={stringY(s)}
            strokeWidth={0.9 + s * 0.38}
          />
        </g>
      ))}

      {[3, 5, 7, 9, 12]
        .filter((f) => f <= frets)
        .map((f) => (
          <text key={f} className="fb-fret-num" x={noteX(f, frets)} y={H - 6} textAnchor="middle">
            {f}
          </text>
        ))}

      {markers.map((m, i) => (
        <g key={i} className={`fb-marker tone-${m.tone}`}>
          <circle cx={noteX(m.fret, frets)} cy={stringY(m.string)} r={m.label ? 11 : 9.5} />
          {m.label && (
            <text
              x={noteX(m.fret, frets)}
              y={stringY(m.string)}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {m.label}
            </text>
          )}
        </g>
      ))}

      {onTap &&
        STANDARD_TUNING.map((_, s) =>
          Array.from({ length: frets + 1 }, (_, f) => {
            const [x1, x2] = cellX(f, frets);
            return (
              <rect
                key={`${s}-${f}`}
                className="fb-hit"
                x={x1}
                y={stringY(s) - STRING_GAP / 2}
                width={x2 - x1}
                height={STRING_GAP}
                onClick={() => onTap({ string: s, fret: f })}
              />
            );
          }),
        )}
    </svg>
  );
}

function describe(m: FretMarker): string {
  const where = m.fret === 0 ? "open" : `fret ${m.fret}`;
  return `${m.label ?? "Note"} on the ${STRING_NAMES[m.string]} string, ${where}`;
}
