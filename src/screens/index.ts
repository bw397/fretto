import type { ComponentType } from "react";
import { IntervalTrainer } from "./IntervalTrainer";
import { KeyTrainer } from "./KeyTrainer";
import { OctaveReference } from "./OctaveReference";
import { ScaleDrill } from "./ScaleDrill";
import { ScaleReference } from "./ScaleReference";
import { StaffReference } from "./StaffReference";
import { StringDrill } from "./StringDrill";
import { SingleNoteTrainer } from "./SingleNoteTrainer";

export const CATEGORIES = ["Practice", "Drills", "Reference"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ScreenDef {
  /** URL hash slug, e.g. #/single-note */
  id: string;
  title: string;
  category: Category;
  component: ComponentType;
}

/** All screens, in menu order (grouped by category in the menu). The first one is the default. */
export const SCREENS: ScreenDef[] = [
  { id: "single-note", title: "Single Note Trainer", category: "Practice", component: SingleNoteTrainer },
  { id: "key", title: "Key Trainer", category: "Practice", component: KeyTrainer },
  { id: "interval", title: "Interval Trainer", category: "Practice", component: IntervalTrainer },
  { id: "string-drill", title: "String Drill", category: "Drills", component: StringDrill },
  { id: "scale-drill", title: "Scale Drill", category: "Drills", component: ScaleDrill },
  { id: "scale", title: "Scale", category: "Reference", component: ScaleReference },
  { id: "staff", title: "Staff", category: "Reference", component: StaffReference },
  { id: "octaves", title: "Octaves", category: "Reference", component: OctaveReference },
];

export const DEFAULT_SCREEN = SCREENS[0]!;
