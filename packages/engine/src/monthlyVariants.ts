/** Shared monthly printable variant ids (generator owns HTML/CSS). */

export const MONTHLY_VARIANT_IDS = [
  "classic-bw",
  "color-modern",
  "holidays",
  "notes-planner",
  "landscape-soft",
  "monday-start",
] as const;

export type MonthlyVariantId = (typeof MONTHLY_VARIANT_IDS)[number];

export const DEFAULT_MONTHLY_VARIANT: MonthlyVariantId = "classic-bw";

export const MONTHLY_VARIANT_META: Record<
  MonthlyVariantId,
  { label: string; shortLabel: string; description: string }
> = {
  "classic-bw": {
    label: "Classic Black & White",
    shortLabel: "Classic B&W",
    description:
      "High-contrast minimal grid for crisp laser or ink-jet printing.",
  },
  "color-modern": {
    label: "Modern Color",
    shortLabel: "Color",
    description: "A color header in teal and coral, light on ink.",
  },
  holidays: {
    label: "US Holidays Marked",
    shortLabel: "Holidays",
    description: "US holidays named in the date boxes, with the weekend columns tinted.",
  },
  "notes-planner": {
    label: "Notes Planner",
    shortLabel: "Planner",
    description: "Large ruled date boxes and a wide notes column.",
  },
  "landscape-soft": {
    label: "Landscape Soft",
    shortLabel: "Landscape",
    description: "A wide landscape sheet with a soft seasonal tint.",
  },
  "monday-start": {
    label: "Monday Start",
    shortLabel: "Mon-start",
    description: "A month with weeks that run Monday to Sunday.",
  },
};

export function monthlyVariantAssetPaths(
  year: number,
  monthSlug: string,
  variantId: MonthlyVariantId,
): { png: string; pdf: string } {
  return {
    png: `/assets/${year}/monthly/${monthSlug}/${variantId}/calendar.png`,
    pdf: `/assets/${year}/monthly/${monthSlug}/${variantId}/calendar.pdf`,
  };
}
