import { monthNumberToName } from "../months.js";
import type { ResolvedHoliday } from "../holidays/engine.js";

export type FaqItem = { q: string; a: string };

export type MonthEditorial = {
  /** Hero lead, unique per month */
  lead: (year: number) => string;
  /** Meta description seed */
  description: (year: number) => string;
  /** Short overview paragraphs (plain text) */
  overview: (year: number) => string[];
  /** Practical planning tips unique to the month */
  planningTips: (year: number) => string[];
  /** History / culture framing */
  historyTitle: string;
  historyBlurb: (year: number) => string;
  historyFacts: { label: string; text: string }[];
  /** Base FAQ; caller merges holiday/start-day facts */
  faqBase: (year: number) => FaqItem[];
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function startWeekday(year: number, month: number): string {
  return WEEKDAYS[new Date(year, month - 1, 1).getDay()]!;
}

const EDITORIAL: Record<number, MonthEditorial> = {
  1: {
    lead: (y) =>
      `January ${y} on one page, with New Year's Day and Martin Luther King Jr. Day in place for the first plans of the year.`,
    description: (y) =>
      `Free January ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. New Year's Day and Martin Luther King Jr. Day are marked.`,
    overview: (y) => [
      `January ${y} has 31 days and two federal holidays: New Year's Day on the 1st and Martin Luther King Jr. Day on the third Monday.`,
      `It is the month most people start a new calendar, so print it before the holidays end and write in what is already fixed.`,
    ],
    planningTips: (y) => [
      `Write this year's fixed dates first: birthdays, school terms and renewals.`,
      `Check which offices and schools close on Martin Luther King Jr. Day.`,
      `Print the ${y} yearly calendar too, so the whole year sits beside the month.`,
    ],
    historyTitle: "January in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in January ${y}:`,
    historyFacts: [
      { label: "Jan 27, 1756", text: "Wolfgang Amadeus Mozart born in Salzburg." },
      { label: "Jan 1, 1892", text: "Ellis Island immigration station opens." },
      { label: "Jan 15, 1929", text: "Martin Luther King Jr. born in Atlanta." },
      { label: "Jan 9, 2007", text: "Apple introduces the first iPhone." },
    ],
    faqBase: (y) => [
      { q: `Why print a January ${y} calendar with dates instead of a blank one?`, a: `The dates and weekdays are already in the right boxes, with New Year's Day and Martin Luther King Jr. Day marked in the Holidays design.` },
      { q: `When is Martin Luther King Jr. Day in ${y}?`, a: `It is the third Monday of January. The Holidays design names it in its date box.` },
    ],
  },
  2: {
    lead: (y) =>
      `February ${y} with Valentine's Day and Presidents' Day, in a grid sized for the shortest month of the year.`,
    description: (y) =>
      `Free February ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. Valentine's Day and Presidents' Day are marked.`,
    overview: (y) => [
      `February ${y} has ${daysInMonth(y, 2)} days. Groundhog Day is on the 2nd, Valentine's Day on the 14th and Presidents' Day on the third Monday.`,
      `A short month often fits in four or five rows, which leaves larger boxes to write in.`,
    ],
    planningTips: (y) => [
      `Mark the Presidents' Day long weekend before you book anything around it.`,
      `Note Valentine's Day reservations early; the 14th fills up.`,
      `In a leap year, check deadlines that fall on the 29th.`,
    ],
    historyTitle: "February in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in February ${y}:`,
    historyFacts: [
      { label: "Feb 2", text: "Groundhog Day tradition in Punxsutawney, PA." },
      { label: "Feb 14", text: "Valentine’s Day." },
      { label: "Feb 19, 1942", text: "Executive Order 9066 signed (historical remembrance)." },
      { label: "Feb 1", text: "Start of Black History Month in the United States." },
    ],
    faqBase: (y) => [
      { q: `How many days does February ${y} have?`, a: `February ${y} has ${daysInMonth(y, 2)} days, and the printed grid matches.` },
      { q: `Does the February ${y} calendar show Presidents' Day?`, a: `Yes, in the Holidays design. Presidents' Day is the third Monday of February.` },
    ],
  },
  3: {
    lead: (y) =>
      `March ${y} with the start of daylight saving time and St. Patrick's Day, ready for spring plans.`,
    description: (y) =>
      `Free March ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. St. Patrick's Day and the clock change are marked.`,
    overview: (y) => [
      `March ${y} has 31 days. Clocks spring forward on the second Sunday, and St. Patrick's Day is on the 17th.`,
      `Spring break and the end of the first quarter often land here, so the month fills quickly.`,
    ],
    planningTips: (y) => [
      `Circle the second Sunday: clocks move forward one hour at 2:00 a.m.`,
      `Write spring break dates from your school's calendar.`,
      `Mark the last working day of the quarter if you report on it.`,
    ],
    historyTitle: "March in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in March ${y}:`,
    historyFacts: [
      { label: "Mar 15", text: "Ides of March, a classical date associated with Caesar." },
      { label: "Mar 8", text: "International Women’s Day." },
      { label: "Mar 10, 1876", text: "First telephone transmission credited to Bell." },
      { label: "Mar 26, 1953", text: "Jonas Salk announces polio vaccine success." },
    ],
    faqBase: (y) => [
      { q: `When do clocks change in March ${y}?`, a: `Daylight saving time starts on the second Sunday of March, when clocks move forward one hour at 2:00 a.m. Hawaii and most of Arizona do not change.` },
      { q: `Can I print March ${y} in black and white?`, a: `Yes. The Minimal design uses black lines only, and every design prints cleanly in grayscale.` },
    ],
  },
  4: {
    lead: (y) =>
      `April ${y} with Earth Day and the tax deadline, and Easter when it falls in the month.`,
    description: (y) =>
      `Free April ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. Earth Day is marked, and Easter when it falls in April.`,
    overview: (y) => [
      `April ${y} has 30 days. April Fools' Day is on the 1st and Earth Day on the 22nd; Easter falls in April in some years and March in others.`,
      `US income tax returns are normally due on April 15, or the next working day when that is a weekend or holiday.`,
    ],
    planningTips: (y) => [
      `Check this year's tax filing deadline before you write it in.`,
      `Look up Easter on its own page: the date moves every year.`,
      `Add school testing dates as soon as they are announced.`,
    ],
    historyTitle: "April in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in April ${y}:`,
    historyFacts: [
      { label: "Apr 22, 1970", text: "First Earth Day observed in the United States." },
      { label: "Apr 15", text: "Traditional US Tax Day (shifts when it falls on a weekend/holiday)." },
      { label: "Apr 12, 1961", text: "Yuri Gagarin becomes first human in space." },
      { label: "Apr 23", text: "UNESCO World Book Day / Shakespeare commemorations." },
    ],
    faqBase: (y) => [
      { q: `Does the April ${y} calendar show Easter?`, a: `When Easter Sunday falls in April ${y}, the Holidays design names it. The Easter page has the date for each year.` },
      { q: `Which April ${y} design suits a classroom?`, a: `Landscape reads well on a bulletin board, and Planner has a notes column for homework and trips.` },
    ],
  },
  5: {
    lead: (y) =>
      `May ${y} with Mother's Day and the Memorial Day weekend, the unofficial start of summer.`,
    description: (y) =>
      `Free May ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. Mother's Day and Memorial Day are marked.`,
    overview: (y) => [
      `May ${y} has 31 days. Cinco de Mayo is on the 5th, Mother's Day on the second Sunday and Memorial Day on the last Monday.`,
      `Graduations and the end of the school year crowd the second half of the month.`,
    ],
    planningTips: (y) => [
      `Book Mother's Day plans early: it is always the second Sunday.`,
      `Mark the Memorial Day long weekend before travel prices rise.`,
      `Write graduation and exam dates as soon as schools publish them.`,
    ],
    historyTitle: "May in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in May ${y}:`,
    historyFacts: [
      { label: "May 1", text: "International Workers’ Day / May Day observances." },
      { label: "May 5", text: "Cinco de Mayo commemorations in many US communities." },
      { label: "May 20, 1927", text: "Lindbergh begins solo New York–Paris flight." },
      { label: "May 25, 1961", text: "Kennedy announces Moon landing goal." },
    ],
    faqBase: (y) => [
      { q: `When is Memorial Day in May ${y}?`, a: `Memorial Day is the last Monday of May. The Holidays design names it in its date box.` },
      { q: `When is Mother's Day in ${y}?`, a: `In the United States it is the second Sunday of May.` },
    ],
  },
  6: {
    lead: (y) =>
      `June ${y} with Flag Day, Juneteenth and Father's Day, as school ends and summer plans begin.`,
    description: (y) =>
      `Free June ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. Flag Day, Juneteenth and Father's Day are marked.`,
    overview: (y) => [
      `June ${y} has 30 days. Flag Day is on the 14th, Juneteenth on the 19th and Father's Day on the third Sunday.`,
      `The longest days of the year in the Northern Hemisphere fall around the 21st.`,
    ],
    planningTips: (y) => [
      `Line up camp and childcare dates against work days.`,
      `Check whether your employer closes for Juneteenth.`,
      `Mark the last day of school and the first day of any trip.`,
    ],
    historyTitle: "June in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in June ${y}:`,
    historyFacts: [
      { label: "Jun 6, 1944", text: "D-Day Allied landings in Normandy." },
      { label: "Jun 19, 1865", text: "News of emancipation reaches Galveston, Texas, the origin of Juneteenth." },
      { label: "Jun 21", text: "Summer solstice in the Northern Hemisphere, on or near this date." },
      { label: "Jun 26, 2015", text: "US Supreme Court decides Obergefell v. Hodges." },
    ],
    faqBase: (y) => [
      { q: `Is Juneteenth on the June ${y} calendar?`, a: `Yes. Juneteenth is a federal holiday on June 19 and the Holidays design names it.` },
      { q: `When is Father's Day in ${y}?`, a: `In the United States it is the third Sunday of June.` },
    ],
  },
  7: {
    lead: (y) =>
      `July ${y} with Independence Day and the middle of summer, for travel, camps and time off.`,
    description: (y) =>
      `Free July ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start, on Letter or A4. Independence Day is marked.`,
    overview: (y) => [
      `July ${y} has 31 days and one federal holiday: Independence Day on the 4th.`,
      `When July 4 falls on a weekend, federal offices close on the nearest weekday.`,
    ],
    planningTips: (y) => [
      `Check which day your workplace observes Independence Day this year.`,
      `Block out vacation weeks so the whole household can see them.`,
      `Note camp start and pickup times in the day boxes.`,
    ],
    historyTitle: "July in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in July ${y}:`,
    historyFacts: [
      { label: "Jul 4, 1776", text: "Declaration of Independence adopted." },
      { label: "Jul 20, 1969", text: "Apollo 11 Moon landing." },
      { label: "Jul 14", text: "Bastille Day commemorations (France; observed by many US communities)." },
      { label: "Jul 1, 1867", text: "Canadian Confederation, now Canada Day." },
    ],
    faqBase: (y) => [
      { q: `Does the July ${y} calendar mark Independence Day?`, a: `Yes. July 4 is a federal holiday and the Holidays design names it.` },
      { q: `Can I share the July ${y} calendar online?`, a: `Please link to this page instead of uploading the file. The calendars are free for personal and classroom use.` },
    ],
  },
  8: {
    lead: (y) =>
      `August ${y}, a month with no federal holidays, for back-to-school dates and the last trips of summer.`,
    description: (y) =>
      `Free August ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start, on Letter or A4, with room for back-to-school dates.`,
    overview: (y) => [
      `August ${y} has 31 days and no US federal holidays.`,
      `Many school districts start the new year this month, so first days, orientations and supply lists belong here.`,
    ],
    planningTips: (y) => [
      `Write the first day of school from your district's calendar.`,
      `Schedule physicals and haircuts before the first week of term.`,
      `Start a school-year calendar now: it runs August to July.`,
    ],
    historyTitle: "August in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in August ${y}:`,
    historyFacts: [
      { label: "Aug 15, 1914", text: "Panama Canal opens." },
      { label: "Aug 26, 1920", text: "The 19th Amendment is certified; the date is now Women’s Equality Day." },
      { label: "Aug 28, 1963", text: "March on Washington / “I Have a Dream” speech." },
      { label: "Aug 12, 1981", text: "IBM introduces its first personal computer." },
    ],
    faqBase: (y) => [
      { q: `Are there US federal holidays in August ${y}?`, a: `No. August has no federal holidays; the next one is Labor Day on the first Monday of September.` },
      { q: `Which calendar covers a whole school year?`, a: `The school year calendar shows August to July on one page, and each month has its own sheet.` },
    ],
  },
  9: {
    lead: (y) =>
      `September ${y} with Labor Day and the first full month of school, as routines settle in.`,
    description: (y) =>
      `Free September ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. Labor Day and Patriot Day are marked.`,
    overview: (y) => [
      `September ${y} has 30 days. Labor Day is the first Monday, and Patriot Day is observed on the 11th.`,
      `Autumn begins in the Northern Hemisphere around the 22nd.`,
    ],
    planningTips: (y) => [
      `Mark the Labor Day long weekend first.`,
      `Add weekly activities once the school timetable is fixed.`,
      `Set a reminder for the end of the third quarter on the 30th.`,
    ],
    historyTitle: "September in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in September ${y}:`,
    historyFacts: [
      { label: "First Monday", text: "Labor Day (US federal holiday)." },
      { label: "~Sep 22", text: "Northern Hemisphere autumn equinox (date varies)." },
      { label: "Sep 11, 2001", text: "Patriot Day remembrances across the US." },
      { label: "Sep 17, 1787", text: "US Constitution signed." },
    ],
    faqBase: (y) => [
      { q: `When is Labor Day in September ${y}?`, a: `Labor Day is the first Monday of September. The Holidays design names it in its date box.` },
      { q: `When does fall start in ${y}?`, a: `The autumn equinox in the Northern Hemisphere falls around September 22; the exact date varies by year.` },
    ],
  },
  10: {
    lead: (y) =>
      `October ${y} with Columbus Day and Halloween, and the first month of the federal fiscal year.`,
    description: (y) =>
      `Free October ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. Columbus Day and Halloween are marked.`,
    overview: (y) => [
      `October ${y} has 31 days. Columbus Day, also Indigenous Peoples' Day in many places, is the second Monday, and Halloween is on the 31st.`,
      `The US federal fiscal year starts on October 1.`,
    ],
    planningTips: (y) => [
      `Check whether your school or bank closes on the second Monday.`,
      `Note the weekday Halloween falls on before you plan a party.`,
      `Daylight saving time ends early in November: add a reminder.`,
    ],
    historyTitle: "October in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in October ${y}:`,
    historyFacts: [
      { label: "Oct 1, 1958", text: "NASA begins operations." },
      { label: "Oct 4, 1957", text: "Sputnik 1 launches." },
      { label: "Oct 29, 1929", text: "Black Tuesday stock market crash." },
      { label: "Oct 31", text: "Halloween." },
    ],
    faqBase: (y) => [
      { q: `Does the October ${y} calendar include Columbus Day?`, a: `Yes, in the Holidays design. The federal holiday is the second Monday of October; add Indigenous Peoples' Day where it is observed.` },
      { q: `Which October ${y} design suits Halloween planning?`, a: `Planner: ruled date boxes and a notes column for costume and party lists.` },
    ],
  },
  11: {
    lead: (y) =>
      `November ${y} with Veterans Day and Thanksgiving, and the end of daylight saving time.`,
    description: (y) =>
      `Free November ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. Veterans Day and Thanksgiving are marked.`,
    overview: (y) => [
      `November ${y} has 30 days. Clocks fall back on the first Sunday, Veterans Day is on the 11th and Thanksgiving is the fourth Thursday.`,
      `Black Friday follows Thanksgiving, and the holiday season starts from there.`,
    ],
    planningTips: (y) => [
      `Shade Thanksgiving week first, then book travel around it.`,
      `Check local school and bank closures for Veterans Day.`,
      `Circle the first Sunday: clocks go back one hour at 2:00 a.m.`,
    ],
    historyTitle: "November in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in November ${y}:`,
    historyFacts: [
      { label: "Nov 11", text: "Veterans Day (fixed federal holiday)." },
      { label: "Fourth Thursday", text: "Thanksgiving Day (US)." },
      { label: "Nov 19, 1863", text: "Lincoln delivers the Gettysburg Address." },
      { label: "Nov 9, 1989", text: "Berlin Wall opens." },
    ],
    faqBase: (y) => [
      { q: `When is Thanksgiving ${y}?`, a: `Thanksgiving is the fourth Thursday of November. The Holidays design names it in its date box.` },
      { q: `When do clocks go back in November ${y}?`, a: `Daylight saving time ends on the first Sunday of November, when clocks go back one hour at 2:00 a.m.` },
    ],
  },
  12: {
    lead: (y) =>
      `December ${y} with Christmas Eve, Christmas Day and New Year's Eve, for the busiest weeks of the year.`,
    description: (y) =>
      `Free December ${y} calendar to print in seven designs, PDF or PNG, Sunday or Monday start. Christmas Day and New Year's Eve are marked.`,
    overview: (y) => [
      `December ${y} has 31 days. Christmas Day on the 25th is a federal holiday; Christmas Eve and New Year's Eve are not, though many workplaces close early.`,
      `Winter begins in the Northern Hemisphere around the 21st.`,
    ],
    planningTips: (y) => [
      `Write shipping deadlines from each carrier's own page before you order gifts.`,
      `Mark the days your workplace and school are closed between Christmas and New Year's Day.`,
      `Print January now so the first week of the new year is ready.`,
    ],
    historyTitle: "December in history",
    historyBlurb: (y) =>
      `Four dates to know as you fill in December ${y}:`,
    historyFacts: [
      { label: "Dec 17, 1903", text: "Wright brothers’ first powered flight." },
      { label: "Dec 25", text: "Christmas Day (US federal holiday)." },
      { label: "Dec 26", text: "Boxing Day / start of Kwanzaa (cultural observances)." },
      { label: "Dec 31", text: "New Year’s Eve." },
    ],
    faqBase: (y) => [
      { q: `Is Christmas marked on the December ${y} calendar?`, a: `Yes. Christmas Day is a federal holiday on December 25 and the Holidays design names it.` },
      { q: `Can I print December ${y} and January together?`, a: `Yes. Print December here, then open the January page for the next year's sheet.` },
    ],
  },
};

export function getMonthEditorial(month: number): MonthEditorial {
  const e = EDITORIAL[month];
  if (!e) throw new Error(`No editorial for month ${month}`);
  return e;
}

export function buildMonthlyFaq(
  year: number,
  month: number,
  holidays: ResolvedHoliday[],
): FaqItem[] {
  const name = monthNumberToName(month);
  const ed = getMonthEditorial(month);
  const start = startWeekday(year, month);
  const dim = daysInMonth(year, month);
  const holLine =
    holidays.length > 0
      ? `${holidays.map((h) => `${h.name} (${h.formatted})`).join("; ")}.`
      : `None of the holidays on our US list falls in ${name} ${year}.`;

  const dynamic: FaqItem[] = [
    {
      q: `What day does ${name} ${year} start on?`,
      a: `${name} ${year} starts on a ${start} and has ${dim} days.`,
    },
    {
      q: `Which US holidays fall in ${name} ${year}?`,
      a: holLine,
    },
    {
      q: `Which designs does the ${name} ${year} calendar come in?`,
      a: `Seven: Classic, Modern, Minimal, Floral, Landscape, Holidays and Planner. Each one has a Sunday or a Monday start, on US Letter or A4, as a PDF and a PNG.`,
    },
  ];

  return [...ed.faqBase(year), ...dynamic];
}

export function buildYearlyFaq(year: number): FaqItem[] {
  return [
    {
      q: `What is on the ${year} yearly calendar?`,
      a: `All twelve months of ${year} on one page, with the correct weekdays and US holidays tinted.`,
    },
    {
      q: `How is the yearly calendar different from the month pages?`,
      a: `The yearly calendar shows the whole of ${year} at once. A month page gives one month with large date boxes to write in.`,
    },
    {
      q: `Is the ${year} calendar free to print?`,
      a: `Yes. The PDF and PNG are free for personal and classroom use, with no sign-up.`,
    },
    {
      q: `Does the ${year} yearly calendar show US holidays?`,
      a: `Yes, as tinted dates. To see each holiday named, print a month in the Holidays design.`,
    },
  ];
}

export function buildBlankFaq(): FaqItem[] {
  return [
    {
      q: "What is a blank calendar?",
      a: "A month grid with the weekday names printed and the date boxes empty. You write in the month and the dates, so one print works for any month.",
    },
    {
      q: "When should I print a blank calendar instead of a month with dates?",
      a: "Print a blank one to reuse the same sheet or to teach how a calendar works. Print a month page when you want the dates and holidays already in place.",
    },
    {
      q: "Are the blank calendars free?",
      a: "Yes. Every PDF and PNG is free for personal and classroom use, with no sign-up.",
    },
    {
      q: "Do the blank calendars show holidays?",
      a: "No. They have no dates, so there is nothing to mark. For holidays, print a month page in the Holidays design.",
    },
  ];
}
