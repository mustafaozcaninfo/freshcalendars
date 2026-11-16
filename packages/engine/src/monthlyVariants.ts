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
      "Black ink only: a heavy title, big dates and US holidays named in the boxes.",
  },
  "color-modern": {
    label: "Modern Color",
    shortLabel: "Color",
    description: "A blue title band, rounded date boxes and US holidays named in red.",
  },
  holidays: {
    label: "US Holidays Marked",
    shortLabel: "Holidays",
    description: "US holidays named in the date boxes and listed below the grid, with the weekend columns tinted.",
  },
  "notes-planner": {
    label: "Notes Planner",
    shortLabel: "Planner",
    description: "Ruled date boxes with big dates and a notes column.",
  },
  "landscape-soft": {
    label: "Landscape Soft",
    shortLabel: "Landscape",
    description: "US Letter on its side: a green title band, full weekday names and big dates.",
  },
  "monday-start": {
    label: "Monday Start",
    shortLabel: "Mon-start",
    description: "A black-and-white month with weeks that run Monday to Sunday.",
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
