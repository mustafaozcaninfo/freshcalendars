/**
 * Category themes for printable kits: a palette and a vector motif per /news/ category, so a
 * school calendar, a TV guide and a shipping planner do not share one look.
 *
 * Every text/background pair a kit uses is checked at 4.5:1 in newsRules.test.ts, so a theme can
 * never be the reason printCheck fails. Motifs are plain SVG shapes (no <pattern>, filter or
 * gradient, which Chromium prints as bitmaps) and carry no text, so they may sit in the header band.
 */
export type Theme = {
  id: string;
  /** headings, rules, filled marks; white text on it */
  primary: string;
  /** second mark color (early release, highlights); used as a line or fill, never alone for meaning */
  accent: string;
  /** light fill behind tiles and boxes; body text on it */
  soft: string;
  /** hairlines and empty boxes */
  line: string;
  /** body text */
  ink: string;
  /** muted text (weekends, notes); still 4.5:1 on white and on soft */
  muted: string;
  /** header icon name in art.ts ICONS */
  icon: string;
  /** decorative SVG for the header's right side, drawn in a 200 x 60 box */
  motif: (t: Theme) => string;
};

const dots = (t: Theme) => Array.from({ length: 24 }, (_, i) => `<circle cx="${12 + (i % 8) * 25}" cy="${10 + Math.floor(i / 8) * 20}" r="${2 + ((i * 7) % 3)}" fill="${t.primary}" opacity="${0.12 + ((i * 5) % 4) * 0.05}"/>`).join("");
const stars = (t: Theme) => Array.from({ length: 14 }, (_, i) => {
  const x = 10 + ((i * 53) % 190), y = 8 + ((i * 29) % 46), r = 2 + (i % 3);
  return `<path d="M${x} ${y - r * 2} L${x + r * 0.6} ${y - r * 0.6} L${x + r * 2} ${y} L${x + r * 0.6} ${y + r * 0.6} L${x} ${y + r * 2} L${x - r * 0.6} ${y + r * 0.6} L${x - r * 2} ${y} L${x - r * 0.6} ${y - r * 0.6}Z" fill="${t.primary}" opacity="${0.18 + (i % 3) * 0.08}"/>`;
}).join("");
const pitch = (t: Theme) => `<g fill="none" stroke="${t.primary}" stroke-opacity=".28" stroke-width="2"><rect x="10" y="6" width="180" height="48" rx="3"/><path d="M100 6 V54"/><circle cx="100" cy="30" r="11"/><rect x="10" y="18" width="20" height="24"/><rect x="170" y="18" width="20" height="24"/></g>`;
const rays = (t: Theme) => Array.from({ length: 9 }, (_, i) => `<path d="M100 62 L${10 + i * 22.5} 0" stroke="${t.primary}" stroke-opacity="${0.1 + (i % 3) * 0.06}" stroke-width="${6 + (i % 2) * 4}" stroke-linecap="round"/>`).join("");
const ribbon = (t: Theme) => `<g fill="none" stroke="${t.primary}" stroke-opacity=".3" stroke-width="2.4"><path d="M0 40 C40 10 60 60 100 30 S160 10 200 36"/><path d="M0 52 C40 22 60 72 100 42 S160 22 200 48" stroke-dasharray="6 6"/></g>`;
const ticks = (t: Theme) => Array.from({ length: 6 }, (_, i) => `<g transform="translate(${14 + i * 32} ${12 + (i % 2) * 14})"><rect width="22" height="22" rx="4" fill="none" stroke="${t.primary}" stroke-opacity=".35" stroke-width="2"/><path d="M5 11 l4 5 l8 -10" fill="none" stroke="${t.primary}" stroke-opacity=".45" stroke-width="2.4"/></g>`).join("");
const coins = (t: Theme) => Array.from({ length: 6 }, (_, i) => `<circle cx="${20 + i * 32}" cy="${30 + (i % 2 ? -8 : 8)}" r="13" fill="none" stroke="${t.primary}" stroke-opacity=".3" stroke-width="2.4"/>`).join("");
const pencils = (t: Theme) => Array.from({ length: 5 }, (_, i) => `<g transform="translate(${16 + i * 38} 8) rotate(${-14 + i * 7} 8 22)" fill="none" stroke="${t.primary}" stroke-opacity=".32" stroke-width="2"><rect x="3" y="0" width="10" height="34"/><path d="M3 34 L8 46 L13 34"/></g>`).join("");

const base = { soft: "#f1f5f9", line: "#cbd5e1", ink: "#1f2937", muted: "#475569" };
export const THEMES: Record<string, Theme> = {
  "school-calendars": { id: "school", primary: "#0f766e", accent: "#b45309", ...base, soft: "#ecfdf5", icon: "book", motif: pencils },
  sports: { id: "sports", primary: "#1d4f7a", accent: "#b91c1c", ...base, soft: "#eff6ff", icon: "star", motif: pitch },
  entertainment: { id: "stage", primary: "#6b21a8", accent: "#b45309", ...base, soft: "#faf5ff", icon: "star", motif: rays },
  "gaming-tech": { id: "tech", primary: "#312e81", accent: "#0e7490", ...base, soft: "#eef2ff", icon: "star", motif: dots },
  "retail-dates": { id: "retail", primary: "#be123c", accent: "#0f766e", ...base, soft: "#fff1f2", icon: "bag", motif: ribbon },
  "money-benefits": { id: "money", primary: "#166534", accent: "#1e3a8a", ...base, soft: "#f0fdf4", icon: "money", motif: coins },
  elections: { id: "vote", primary: "#1e3a8a", accent: "#7f1d1d", ...base, soft: "#eff6ff", icon: "ballot", motif: ticks },
  planning: { id: "plan", primary: "#1e3a8a", accent: "#b45309", ...base, soft: "#eff6ff", icon: "calendar", motif: dots },
  holidays: { id: "holiday", primary: "#9a3412", accent: "#166534", ...base, soft: "#fff7ed", icon: "calendar", motif: dots },
  "uk-canada": { id: "ukca", primary: "#9f1239", accent: "#1e3a8a", ...base, soft: "#fff1f2", icon: "calendar", motif: dots },
  "sky-events": { id: "sky", primary: "#312e81", accent: "#b45309", ...base, soft: "#eef2ff", icon: "moon", motif: stars },
  "time-change": { id: "time", primary: "#6d28d9", accent: "#0f766e", ...base, soft: "#f5f3ff", icon: "clock", motif: dots },
  "calendar-guides": { id: "guide", primary: "#155e75", accent: "#b45309", ...base, soft: "#ecfeff", icon: "calendar", motif: dots },
  puzzles: { id: "puzzle", primary: "#4c1d95", accent: "#0f766e", ...base, soft: "#f5f3ff", icon: "star", motif: dots },
};

export const themeFor = (category: string): Theme => THEMES[category] ?? THEMES.planning!;

/** WCAG relative-luminance contrast of two #rrggbb colors. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** The pairs kits print text in: [foreground, background, what]. */
export const textPairs = (t: Theme): [string, string, string][] => [
  [t.primary, "#ffffff", "primary on white"], ["#ffffff", t.primary, "white on primary"], [t.primary, t.soft, "primary on soft"],
  [t.ink, t.soft, "ink on soft"], [t.muted, "#ffffff", "muted on white"], [t.muted, t.soft, "muted on soft"], [t.accent, "#ffffff", "accent on white"],
];
