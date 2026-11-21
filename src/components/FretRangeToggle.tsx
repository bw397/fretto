import { MAX_FRET } from "../lib/music";
import { Segmented } from "./Segmented";

const FRET_RANGES = [
  { value: 5, label: "Frets 0–5" },
  { value: MAX_FRET, label: `Frets 0–${MAX_FRET}` },
];

interface Props {
  value: number;
  onChange: (maxFret: number) => void;
}

export function FretRangeToggle({ value, onChange }: Props) {
  return <Segmented options={FRET_RANGES} value={value} onChange={onChange} label="Fret range" />;
}
