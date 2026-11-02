/** Kit registry for `assets.printable.kit` (docs/PRINTABLE-DESIGN-PLAN.md). */
import type { Kit } from "./kit.js";
import { deadlineMatrix } from "./deadlineMatrix.js";
import { schoolYear } from "./schoolYear.js";
import { watchGuide } from "./watchGuide.js";

export const KITS: Record<string, Kit<any>> = {
  [schoolYear.name]: schoolYear,
  [watchGuide.name]: watchGuide,
  [deadlineMatrix.name]: deadlineMatrix,
};

export function kitFor(name: string): Kit<any> {
  const k = KITS[name];
  if (!k) throw new Error(`assets.printable.kit "${name}" is not one of: ${Object.keys(KITS).join(", ")} (leave kit out for the list, month, timeline and checklist layouts)`);
  return k;
}
export type { KitPrintable, KitContext, Source } from "./kit.js";
