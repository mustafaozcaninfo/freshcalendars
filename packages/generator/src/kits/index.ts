/** Kit registry for `assets.printable.kit` (docs/PRINTABLE-DESIGN-PLAN.md). */
import type { Kit } from "./kit.js";
import { bankHolidays } from "./bankHolidays.js";
import { clockChange } from "./clockChange.js";
import { deadlineMatrix } from "./deadlineMatrix.js";
import { holidayPlanner } from "./holidayPlanner.js";
import { puzzleMonth } from "./puzzleMonth.js";
import { releaseTracker } from "./releaseTracker.js";
import { schoolYear } from "./schoolYear.js";
import { skyNight } from "./skyNight.js";
import { watchGuide } from "./watchGuide.js";
import { yearReference } from "./yearReference.js";

export const KITS: Record<string, Kit<any>> = Object.fromEntries(
  [schoolYear, watchGuide, deadlineMatrix, holidayPlanner, bankHolidays, skyNight, clockChange, puzzleMonth, releaseTracker, yearReference].map((k) => [k.name, k]),
);

export function kitFor(name: string): Kit<any> {
  const k = KITS[name];
  if (!k) throw new Error(`assets.printable.kit "${name}" is not one of: ${Object.keys(KITS).join(", ")} (leave kit out for the list, month, timeline and checklist layouts)`);
  return k;
}
export type { KitPrintable, KitContext, Source } from "./kit.js";
