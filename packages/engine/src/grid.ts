import { monthNumberToName } from "./months.js";

export type DayCell = {
  day: number;
  iso: string;
  weekday: number;
};

export type MonthGrid = {
  year: number;
  month: number;
  monthName: string;
  weekStartsOn: 0 | 1;
  weeks: (DayCell | null)[][];
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildMonthGrid(opts: {
  year: number;
  month: number;
  weekStartsOn?: 0 | 1;
}): MonthGrid {
  const weekStartsOn = opts.weekStartsOn ?? 0;
  const { year, month } = opts;
  const first = new Date(year, month - 1, 1);
  const firstWeekday = first.getDay();
  const offset = (firstWeekday - weekStartsOn + 7) % 7;
  const total = daysInMonth(year, month);
  const cells: (DayCell | null)[] = [];

  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= total; day++) {
    const d = new Date(year, month - 1, day);
    cells.push({
      day,
      iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      weekday: d.getDay(),
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (DayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return {
    year,
    month,
    monthName: monthNumberToName(month),
    weekStartsOn,
    weeks,
  };
}

export function buildYearMonths(year: number, weekStartsOn: 0 | 1 = 0): MonthGrid[] {
  return Array.from({ length: 12 }, (_, i) =>
    buildMonthGrid({ year, month: i + 1, weekStartsOn }),
  );
}
