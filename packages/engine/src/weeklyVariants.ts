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
    description: "Seven days, Sunday first, with room to write in each.",
  },
  "monday-start": {
    label: "Monday Start Week",
    shortLabel: "Mon-start",
    description: "Seven days, Monday first, for a work or school week.",
  },
  hourly: {
    label: "Hourly Week",
    shortLabel: "Hourly",
    description: "Seven days with hour rows from 7 a.m. to 7 p.m. for appointments.",
  },
  priorities: {
    label: "Priorities Planner",
    shortLabel: "Priorities",
    description: "A week with a top-three priorities box and a notes column.",
  },
  habit: {
    label: "Habit Tracker Week",
    shortLabel: "Habits",
    description: "Rows of habits with a checkbox for each day of the week.",
  },
};

export function weeklyVariantAssetPaths(variantId: WeeklyVariantId): { png: string; pdf: string } {
  return {
    png: `/assets/weekly/${variantId}/calendar.png`,
    pdf: `/assets/weekly/${variantId}/calendar.pdf`,
  };
}
