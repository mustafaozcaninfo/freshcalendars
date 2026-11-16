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

/**
 * Weekday header cells. Portrait sheets fit three letters, wide sheets the full name, and the
 * twelve small months of a year poster one letter. Weekend columns always carry "we"; a template
 * that does not tint them leaves the class unstyled.
 */
function weekdayHeader(weekStartsOn: 0 | 1, form: "short" | "long" | "min" = "short"): string {
  const names =
    weekStartsOn === 1
      ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names
    .map((n, i) => {
      const isWe = weekStartsOn === 0 ? i === 0 || i === 6 : i >= 5;
      const text = form === "long" ? n : form === "min" ? n[0] : n.slice(0, 3);
      return `<th class="${isWe ? "we" : ""}">${text}</th>`;
    })
    .join("");
}

function miniMonthHtml(grid: MonthGrid, holidayIsos: Set<string>): string {
  // Always six rows, so the twelve months of a poster line up and fill their boxes.
  const weeks = [...grid.weeks, ...Array.from({ length: 6 - grid.weeks.length }, () => Array(7).fill(null))];
  const rows = weeks
    .map(
      (week) =>
        `<tr>${week
          .map((c: MonthGrid["weeks"][number][number], i: number) => {
            const we = (grid.weekStartsOn === 0 ? i === 0 || i === 6 : i >= 5) ? "we" : "";
            if (!c) return `<td class="${we}"></td>`;
            const hol = holidayIsos.has(c.iso) ? "hol" : "";
            return `<td class="${[hol, we].filter(Boolean).join(" ")}"><span>${c.day}</span></td>`;
          })
          .join("")}</tr>`,
    )
    .join("");
  return `<div class="month"><h2>${grid.monthName}</h2><table><thead><tr>${weekdayHeader(
    grid.weekStartsOn,
    "min",
  )}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function holidayMap(holidays: ResolvedHoliday[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const h of holidays) m.set(h.iso, [...(m.get(h.iso) ?? []), h.name]);
  return m;
}

function isWeekend(iso: string, _weekStartsOn: 0 | 1): boolean {
  const d = new Date(`${iso}T12:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Every monthly design names the holiday in its box: it is what a "<month> calendar" search wants to see. */
function monthlyWeeksHtml(grid: MonthGrid, holNames: Map<string, string[]>): string {
  return grid.weeks
    .map(
      (week) =>
        `<tr>${week
          .map((c, i) => {
            const we = (grid.weekStartsOn === 0 ? i === 0 || i === 6 : i >= 5) ? "we" : "";
            if (!c) return `<td class="${["empty", we].filter(Boolean).join(" ")}"></td>`;
            const names = holNames.get(c.iso);
            const classes = [names ? "hol" : "", we].filter(Boolean).join(" ");
            const label = (names ?? []).map((n) => `<div class="hol-label">${escapeHtml(n)}</div>`).join("");
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
    return "<div>No US holidays or observances this month.</div>";
  }
  return holidays
    .map((h) => `<div><strong>${escapeHtml(h.name)}</strong> ${escapeHtml(h.formatted)}</div>`)
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
      return miniMonthHtml(g, hols);
    })
    .join("");
  return readTemplate(`yearly/${variant.templateFile}`)
    .replaceAll("{{title}}", `${year} Calendar, ${variant.label}`)
    .replaceAll("{{year}}", String(year))
    .replaceAll("{{monthsHtml}}", monthsHtml);
}

export function renderMonthlyPrintHtml(
  year: number,
  month: number,
  variantId: MonthlyVariantId = "classic-bw",
  opts: { weekStartsOn?: 0 | 1 } = {},
): string {
  const variant = monthlyVariantById(variantId);
  const weekStartsOn = opts.weekStartsOn ?? variant.weekStartsOn;
  const grid = buildMonthGrid({ year, month, weekStartsOn });
  const holidays = holidaysForMonth(year, month);
  const holNames = holidayMap(holidays);
  const weeksHtml = monthlyWeeksHtml(grid, holNames);
  const monthName = monthNumberToName(month);
  const subtitles: Record<MonthlyVariantId, string> = {
    "classic-bw": "Print-first minimal grid",
    "color-modern": "Modern accent printable",
    holidays: "US holidays and observances labeled",
    "notes-planner": "Handwriting-first planner",
    "landscape-soft": "Wide seasonal landscape",
    "monday-start": "Monday-start workweek grid",
  };

  return readTemplate(`monthly/${variant.templateFile}`)
    .replaceAll("{{title}}", `${monthName} ${year} Calendar, ${variant.label}`)
    .replaceAll("{{monthName}}", monthName)
    .replaceAll("{{year}}", String(year))
    .replaceAll("{{subtitle}}", subtitles[variantId])
    .replaceAll("{{weeks}}", String(grid.weeks.length))
    .replaceAll("{{weekdayHeader}}", weekdayHeader(weekStartsOn))
    .replaceAll("{{weekdayHeaderLong}}", weekdayHeader(weekStartsOn, "long"))
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
    .replaceAll("{{title}}", `Weekly Calendar, ${variant.label}`)
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
    .replaceAll("{{title}}", `Blank Calendar, ${variant.label}`)
    .replaceAll("{{weekdayHeader}}", weekdayHeader(variant.weekStartsOn))
    .replaceAll("{{weekdayHeaderLong}}", weekdayHeader(variant.weekStartsOn, "long"))
    .replaceAll("{{weeksHtml}}", blankWeeksHtml(5));
}

export function listBlankVariants() {
  return BLANK_VARIANTS;
}

function blankMiniMonthHtml(monthName: string, weekStartsOn: 0 | 1): string {
  const emptyRows = Array.from({ length: 6 }, () =>
    `<tr>${Array.from({ length: 7 }, () => "<td></td>").join("")}</tr>`,
  ).join("");
  return `<div class="month"><h2>${monthName}</h2><table><thead><tr>${weekdayHeader(
    weekStartsOn,
    "min",
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
