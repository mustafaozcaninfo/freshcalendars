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
    description: "Contemporary accent header — print-friendly teal and coral.",
  },
  holidays: {
    label: "US Holidays Marked",
    shortLabel: "Holidays",
    description: "Federal holidays labeled in-cell with weekend accents.",
  },
  "notes-planner": {
    label: "Notes Planner",
    shortLabel: "Planner",
    description: "Oversized ruled cells plus a wide notes column.",
  },
  "landscape-soft": {
    label: "Landscape Soft",
    shortLabel: "Landscape",
    description: "Wide landscape sheet with soft seasonal aesthetic.",
  },
  "monday-start": {
    label: "Monday Start",
    shortLabel: "Mon-start",
    description: "Workweek-first Mon–Sun monthly grid for office and school planners.",
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
