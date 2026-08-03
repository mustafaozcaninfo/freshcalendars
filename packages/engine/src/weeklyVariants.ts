/** Weekly printable variant ids (generator owns HTML/CSS). */

export const WEEKLY_VARIANT_IDS = [
  "classic-sun",
  "monday-start",
  "hourly",
  "priorities",
  "habit",
] as const;

export type WeeklyVariantId = (typeof WEEKLY_VARIANT_IDS)[number];

export const DEFAULT_WEEKLY_VARIANT: WeeklyVariantId = "classic-sun";

export const WEEKLY_VARIANT_META: Record<
  WeeklyVariantId,
  { label: string; shortLabel: string; description: string }
> = {
  "classic-sun": {
    label: "Classic Sunday Week",
    shortLabel: "Classic",
    description: "Clean seven-day Sunday-start planner with write-in cells.",
  },
  "monday-start": {
    label: "Monday Start Week",
    shortLabel: "Mon-start",
    description: "Mon–Sun workweek-first weekly planner.",
  },
  hourly: {
    label: "Hourly Week",
    shortLabel: "Hourly",
    description: "Days with 7am–7pm hour blocks for appointments.",
  },
  priorities: {
    label: "Priorities Planner",
    shortLabel: "Priorities",
    description: "Week grid with top-three priorities and notes.",
  },
  habit: {
    label: "Habit Tracker Week",
    shortLabel: "Habits",
    description: "Seven-day habit rows with checkbox tracks.",
  },
};

export function weeklyVariantAssetPaths(variantId: WeeklyVariantId): { png: string; pdf: string } {
  return {
    png: `/assets/weekly/${variantId}/calendar.png`,
    pdf: `/assets/weekly/${variantId}/calendar.pdf`,
  };
}
