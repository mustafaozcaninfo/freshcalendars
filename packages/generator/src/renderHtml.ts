import fs from "node:fs";
import path from "node:path";
import {
  buildMonthGrid,
  buildYearMonths,
  holidaysForMonth,
  monthNumberToName,
  schoolYearMonthSpecs,
  schoolYearSpanLabel,
  type MonthGrid,
  type ResolvedHoliday,
} from "@freshcalendars/engine";
import {
  BLANK_VARIANTS,
  MONTHLY_VARIANTS,
  WEEKLY_VARIANTS,
  YEARLY_VARIANTS,
  blankVariantById,
  monthlyVariantById,
  weeklyVariantById,
  yearlyVariantById,
  type BlankVariantId,
  type MonthlyVariant,
  type MonthlyVariantId,
  type WeeklyVariantId,
  type YearlyVariantId,
} from "./catalog.js";
import { TEMPLATES } from "./paths.js";

function readTemplate(rel: string): string {
  return fs.readFileSync(path.join(TEMPLATES, rel), "utf8");
}

function weekdayHeader(weekStartsOn: 0 | 1, weekendClass = false): string {
  const names =
    weekStartsOn === 1
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names
    .map((n, i) => {
      const isWe =
        weekendClass &&
        ((weekStartsOn === 0 && (i === 0 || i === 6)) ||
          (weekStartsOn === 1 && (i === 5 || i === 6)));
      return `<th class="${isWe ? "we" : ""}">${n}</th>`;
    })
    .join("");
}

function miniMonthHtml(
  grid: MonthGrid,
  holidayIsos: Set<string>,
  opts: { weekendAccent?: boolean } = {},
): string {
  const rows = grid.weeks
    .map(
      (week) =>
        `<tr>${week
          .map((c, i) => {
            if (!c) return "<td></td>";
            const hol = holidayIsos.has(c.iso) ? " hol" : "";
            const we =
              opts.weekendAccent &&
              ((grid.weekStartsOn === 0 && (i === 0 || i === 6)) ||
                (grid.weekStartsOn === 1 && (i === 5 || i === 6)))
                ? " we"
                : "";
            return `<td class="${(hol + we).trim()}">${c.day}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");
  return `<div class="month"><h2>${grid.monthName}</h2><table><thead><tr>${weekdayHeader(
    grid.weekStartsOn,
    opts.weekendAccent,
  )}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function holidayMap(holidays: ResolvedHoliday[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const h of holidays) {
    const prev = m.get(h.iso);
    m.set(h.iso, prev ? `${prev}; ${h.name}` : h.name);
  }
  return m;
}

function isWeekend(iso: string, _weekStartsOn: 0 | 1): boolean {
  const d = new Date(`${iso}T12:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function monthlyWeeksHtml(
  grid: MonthGrid,
  variant: MonthlyVariant,
  holNames: Map<string, string>,
): string {
  return grid.weeks
    .map(
      (week) =>
        `<tr>${week
          .map((c) => {
            if (!c) return "<td></td>";
            const holName = holNames.get(c.iso);
            const hol = Boolean(holName);
            const we = variant.weekendAccent && isWeekend(c.iso, grid.weekStartsOn);
            const classes = [hol ? "hol" : "", we ? "we" : ""].filter(Boolean).join(" ");
            const label =
              variant.showHolidayLabels && holName
                ? `<div class="hol-label">${escapeHtml(holName)}</div>`
                : "";
            return `<td class="${classes}"><div class="n">${c.day}</div>${label}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function holidayListHtml(holidays: ResolvedHoliday[]): string {
  if (!holidays.length) {
    return "<div>No US federal holidays this month on the engine list.</div>";
  }
  return holidays
    .map((h) => `<div><strong>${escapeHtml(h.name)}</strong> — ${escapeHtml(h.formatted)}</div>`)
    .join("");
}

export function renderYearlyPrintHtml(
  year: number,
  variantId: YearlyVariantId = "classic",
): string {
  const variant = yearlyVariantById(variantId);
  const months = buildYearMonths(year, variant.weekStartsOn);
  const monthsHtml = months
    .map((g) => {
      const hols = new Set(holidaysForMonth(year, g.month).map((h) => h.iso));
      return miniMonthHtml(g, hols, { weekendAccent: variant.holidayEmphasis });
    })
    .join("");
  return readTemplate(`yearly/${variant.templateFile}`)
    .replaceAll("{{title}}", `${year} Calendar — ${variant.label}`)
    .replaceAll("{{year}}", String(year))
    .replaceAll("{{monthsHtml}}", monthsHtml);
}

export function renderMonthlyPrintHtml(
  year: number,
  month: number,
  variantId: MonthlyVariantId = "classic-bw",
): string {
  const variant = monthlyVariantById(variantId);
  const weekStartsOn = variant.weekStartsOn;
  const grid = buildMonthGrid({ year, month, weekStartsOn });
  const holidays = holidaysForMonth(year, month);
  const holNames = holidayMap(holidays);
  const weeksHtml = monthlyWeeksHtml(grid, variant, holNames);
  const monthName = monthNumberToName(month);
  const subtitles: Record<MonthlyVariantId, string> = {
    "classic-bw": "Print-first minimal grid",
    "color-modern": "Modern accent printable",
    holidays: "US federal holidays labeled",
    "notes-planner": "Handwriting-first planner",
    "landscape-soft": "Wide seasonal landscape",
    "monday-start": "Monday-start workweek grid",
  };

  return readTemplate(`monthly/${variant.templateFile}`)
    .replaceAll("{{title}}", `${monthName} ${year} — ${variant.label}`)
    .replaceAll("{{monthName}}", monthName)
    .replaceAll("{{year}}", String(year))
    .replaceAll("{{subtitle}}", subtitles[variantId])
    .replaceAll("{{weekdayHeader}}", weekdayHeader(weekStartsOn, variant.weekendAccent))
    .replaceAll("{{weeksHtml}}", weeksHtml)
    .replaceAll("{{holidayListHtml}}", holidayListHtml(holidays));
}

export function listMonthlyVariants(): MonthlyVariant[] {
  return MONTHLY_VARIANTS;
}

export function listYearlyVariants() {
  return YEARLY_VARIANTS;
}

export function listWeeklyVariants() {
  return WEEKLY_VARIANTS;
}

function weeklyDayNames(weekStartsOn: 0 | 1): string[] {
  return weekStartsOn === 1
    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
}

function weeklyDaysHtml(weekStartsOn: 0 | 1): string {
  return weeklyDayNames(weekStartsOn)
    .map(
      (d) => `<div class="day"><div class="dow">${d}</div><div class="box"><div class="lines"></div></div></div>`,
    )
    .join("");
}

function weeklyDaysStackedHtml(weekStartsOn: 0 | 1): string {
  return weeklyDayNames(weekStartsOn)
    .map((d) => `<div class="day"><div class="dow">${d.slice(0, 3)}</div><div class="box"></div></div>`)
    .join("");
}

function hourlyTableHtml(weekStartsOn: 0 | 1): string {
  const days = weeklyDayNames(weekStartsOn).map((d) => d.slice(0, 3));
  const hours = Array.from({ length: 13 }, (_, i) => 7 + i);
  const head = `<thead><tr><th class="time"></th>${days.map((d) => `<th>${d}</th>`).join("")}</tr></thead>`;
  const body = hours
    .map((h) => {
      const label = h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`;
      return `<tr><td class="time">${label}</td>${days.map(() => "<td></td>").join("")}</tr>`;
    })
    .join("");
  return `<table>${head}<tbody>${body}</tbody></table>`;
}

function habitTableHtml(weekStartsOn: 0 | 1): string {
  const days = weeklyDayNames(weekStartsOn).map((d) => d.slice(0, 3));
  const habits = ["Habit 1", "Habit 2", "Habit 3", "Habit 4", "Habit 5", "Habit 6", "Habit 7", "Habit 8"];
  const head = `<thead><tr><th class="habit">Habit</th>${days.map((d) => `<th>${d}</th>`).join("")}</tr></thead>`;
  const body = habits
    .map(
      (name) =>
        `<tr><td class="habit">${name}</td>${days.map(() => '<td><span class="box"></span></td>').join("")}</tr>`,
    )
    .join("");
  return `<table>${head}<tbody>${body}</tbody></table>`;
}

export function renderWeeklyPrintHtml(variantId: WeeklyVariantId = "classic-sun"): string {
  const variant = weeklyVariantById(variantId);
  let html = readTemplate(`weekly/${variant.templateFile}`)
    .replaceAll("{{title}}", `Weekly Calendar — ${variant.label}`)
    .replaceAll("{{daysHtml}}", weeklyDaysHtml(variant.weekStartsOn))
    .replaceAll("{{daysHtmlStacked}}", weeklyDaysStackedHtml(variant.weekStartsOn))
    .replaceAll("{{hourlyTableHtml}}", hourlyTableHtml(variant.weekStartsOn))
    .replaceAll("{{habitTableHtml}}", habitTableHtml(variant.weekStartsOn));
  return html;
}

function blankWeeksHtml(rows = 5): string {
  return Array.from({ length: rows }, () =>
    `<tr>${Array.from({ length: 7 }, () => `<td><div class="box"></div></td>`).join("")}</tr>`,
  ).join("");
}

export function renderBlankPrintHtml(variantId: BlankVariantId = "classic"): string {
  const variant = blankVariantById(variantId);
  return readTemplate(`blank/${variant.templateFile}`)
    .replaceAll("{{title}}", `Blank Calendar — ${variant.label}`)
    .replaceAll("{{weekdayHeader}}", weekdayHeader(variant.weekStartsOn))
    .replaceAll("{{weeksHtml}}", blankWeeksHtml(5));
}

export function listBlankVariants() {
  return BLANK_VARIANTS;
}

function blankMiniMonthHtml(monthName: string, weekStartsOn: 0 | 1): string {
  const emptyRows = Array.from({ length: 5 }, () =>
    `<tr>${Array.from({ length: 7 }, () => "<td></td>").join("")}</tr>`,
  ).join("");
  return `<div class="month"><h2>${monthName}</h2><table><thead><tr>${weekdayHeader(
    weekStartsOn,
  )}</tr></thead><tbody>${emptyRows}</tbody></table></div>`;
}

export function renderBlankYearlyPrintHtml(): string {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthsHtml = names.map((n) => blankMiniMonthHtml(n, 0)).join("");
  return readTemplate("blank/yearly-classic.html")
    .replaceAll("{{title}}", "Blank Yearly Calendar")
    .replaceAll("{{monthsHtml}}", monthsHtml);
}

export function renderSchoolOverviewPrintHtml(startYear: number): string {
  const spanLabel = schoolYearSpanLabel(startYear);
  const monthsHtml = schoolYearMonthSpecs(startYear)
    .map(({ month, year }) => {
      const grid = buildMonthGrid({ year, month, weekStartsOn: 0 });
      return miniMonthHtml(grid, new Set());
    })
    .join("");
  return readTemplate("school/overview.html")
    .replaceAll("{{title}}", `School Year ${spanLabel}`)
    .replaceAll("{{spanLabel}}", spanLabel)
    .replaceAll("{{monthsHtml}}", monthsHtml);
}

export function renderOgHtml(opts: {
  title: string;
  subtitle: string;
  mark: string;
  family:
    | "home"
    | "yearly"
    | "monthly"
    | "blank"
    | "holidays"
    | "holiday"
    | "legal"
    | "easter"
    | "guide";
}): string {
  const themes: Record<string, { bg: string; ink: string }> = {
    home: { bg: "linear-gradient(125deg,#1a2730,#314652 55%,#c45c26)", ink: "#f7f1e8" },
    yearly: { bg: "linear-gradient(135deg,#eef3f6,#cfe0ea)", ink: "#0f1f2d" },
    monthly: { bg: "linear-gradient(135deg,#f7f1e8,#efe4d4)", ink: "#1a1714" },
    blank: { bg: "linear-gradient(135deg,#f4f7f3,#dce8df)", ink: "#243028" },
    holidays: { bg: "linear-gradient(135deg,#f6f0ea,#e7d7c8)", ink: "#14212b" },
    holiday: { bg: "linear-gradient(135deg,#f6f0ea,#e7d7c8)", ink: "#14212b" },
    legal: { bg: "linear-gradient(135deg,#f0f2f4,#dde3e8)", ink: "#14212b" },
    easter: { bg: "linear-gradient(135deg,#f7f1e8,#e8f0e9)", ink: "#1a1714" },
    guide: { bg: "linear-gradient(135deg,#f4f7f3,#d3e2d7)", ink: "#1f2e24" },
  };
  const t = themes[opts.family] ?? themes.yearly!;
  return readTemplate("og.html")
    .replaceAll("{{title}}", opts.title)
    .replaceAll("{{subtitle}}", opts.subtitle)
    .replaceAll("{{mark}}", opts.mark)
    .replaceAll("{{bg}}", t.bg)
    .replaceAll("{{ink}}", t.ink);
}
