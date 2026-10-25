import { monthNumberToName } from "../months.js";
import type { ResolvedHoliday } from "../holidays/engine.js";

export type FaqItem = { q: string; a: string };

export type MonthEditorial = {
  /** Hero lead — unique per month */
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
      `Start ${y} on paper — a Fresh Calendars January sheet for resolutions, MLK Day, and Q1 deadlines.`,
    description: (y) =>
      `January ${y} printable calendar in six free designs, PNG and PDF. Correct weekdays, with New Year's Day and MLK Day on the holidays template. No signup.`,
    overview: (y) => [
      `January ${y} is the reset month on Fresh Calendars: 31 dated cells, New Year’s Day, and Martin Luther King Jr. Day placed by our holiday engine.`,
      `Print a classic ink-saver for binders or the holidays layout when federal days need to jump out on the fridge.`,
    ],
    planningTips: (y) => [
      `Park three ${y} goals in the notes-planner side band before meetings fill the first week.`,
      `Flag MLK Day closures for banks and schools even if your office stays open.`,
      `Pair January with the ${y} yearly poster so Q1 stays visible wall-to-wall.`,
    ],
    historyTitle: "January on the timeline",
    historyBlurb: (y) =>
      `From Mozart’s birth to the first iPhone announcement, January has hosted openings that redefined culture and technology. Use these anchors as conversation starters when you fill your January ${y} sheet.`,
    historyFacts: [
      { label: "Jan 27, 1756", text: "Wolfgang Amadeus Mozart born in Salzburg." },
      { label: "Jan 1, 1892", text: "Ellis Island immigration station opens." },
      { label: "Jan 15, 1929", text: "Martin Luther King Jr. born in Atlanta." },
      { label: "Jan 9, 2007", text: "Apple introduces the first iPhone." },
    ],
    faqBase: (y) => [
      {
        q: `Why download a January ${y} calendar instead of a blank one?`,
        a: `Dated January ${y} templates already place weekdays correctly, so New Year’s Day and MLK Day land on the right cells without manual counting.`,
      },
      {
        q: `Is January a good month for goal tracking?`,
        a: `Yes — January’s “reset” energy pairs well with our notes-planner layout: large ruled cells for habits plus a side band for quarterly priorities.`,
      },
    ],
  },
  2: {
    lead: (y) =>
      `February ${y} is short — lock Valentine’s and Presidents’ Day on a Fresh Calendars month grid before the weeks collide.`,
    description: (y) =>
      `February ${y} printable calendar with the real ${y} day count, Presidents' Day marked on the holidays template, and six free designs in PNG and PDF.`,
    overview: (y) => [
      `February ${y} gets the correct day count on Fresh Calendars — including leap years — so weekday placement never drifts.`,
      `Use the holidays sheet for Presidents’ Day (third Monday) and keep Valentine’s dinner plans on the planner layout.`,
    ],
    planningTips: (y) => [
      `Confirm leap length before booking trips that cross month-end.`,
      `Reserve Valentine’s weekend early; the 14th fills fast.`,
      `Black History Month notes fit cleanly on the notes-planner variant.`,
    ],
    historyTitle: "February checkpoints",
    historyBlurb: (y) =>
      `Groundhog Day folklore, landmark civil-rights moments, and leap-day quirks all live in February. Stamp a few on your February ${y} printable if you teach or share family trivia.`,
    historyFacts: [
      { label: "Feb 2", text: "Groundhog Day tradition in Punxsutawney, PA." },
      { label: "Feb 14", text: "Valentine’s Day — widely observed gift & dinner date." },
      { label: "Feb 19, 1942", text: "Executive Order 9066 signed (historical remembrance)." },
      { label: "Feb 1", text: "Start of Black History Month in the United States." },
    ],
    faqBase: (y) => [
      {
        q: `How many days does February ${y} have?`,
        a: `February ${y} has ${daysInMonth(y, 2)} days. Our printable grids are generated for that exact length.`,
      },
      {
        q: `Does the February ${y} calendar include Presidents’ Day?`,
        a: `Yes on the holidays variant — Presidents’ Day is the third Monday in February and is calculated by the holiday engine for ${y}.`,
      },
    ],
  },
  3: {
    lead: (y) =>
      `March ${y} from Fresh Calendars — spring-forward energy, school breaks, and a dated grid before daylight stretches.`,
    description: (y) =>
      `March ${y} printable calendar in six free designs, PNG and PDF, with accurate weekdays and room for spring break and March planning notes.`,
    overview: (y) => [
      `March ${y} is when schedules reopen outdoors and spring break windows appear. Fresh Calendars keeps every weekday locked for the month.`,
      `Pin the landscape sheet near a mudroom or classroom; use Monday-start if your week is work-first.`,
    ],
    planningTips: (y) => [
      `Note DST changes when you meet remote teammates across regions.`,
      `Block spring-break coverage on the classic or planner sheet early.`,
      `Cross-link St. Patrick’s Day from the holidays list if you host events.`,
    ],
    historyTitle: "March highlights",
    historyBlurb: (y) =>
      `Ides of March lore, women’s history observances, and famous launches make March a storytelling month. Pair a fact with your March ${y} download when you share it.`,
    historyFacts: [
      { label: "Mar 15", text: "Ides of March — classical date associated with Caesar." },
      { label: "Mar 8", text: "International Women’s Day (widely observed)." },
      { label: "Mar 10, 1876", text: "First telephone transmission credited to Bell." },
      { label: "Mar 26, 1953", text: "Jonas Salk announces polio vaccine success." },
    ],
    faqBase: (y) => [
      {
        q: `What makes the March ${y} printable different from other months?`,
        a: `Editorial copy, FAQs, and holiday callouts are written specifically for March ${y} — not reused from January or April pages.`,
      },
      {
        q: `Can I print March ${y} in color and black & white?`,
        a: `Yes. Classic B&W needs no color ink; Modern Color and Landscape Soft use restrained accents when you want a wall-ready look.`,
      },
    ],
  },
  4: {
    lead: (y) =>
      `April ${y} on Fresh Calendars — showers, tax timing, Earth Day, and Easter-aware holiday cells when the Sunday lands here.`,
    description: (y) =>
      `April ${y} printable calendar in six free designs, PNG and PDF, with Easter-aware holiday marks, accurate weekdays, and April planning tips.`,
    overview: (y) => [
      `April’s thirty days pack testing windows, outdoor reopenings, and Earth Day projects. Fresh Calendars dates the grid so nothing slips a weekday.`,
      `When Easter falls in April ${y}, the holidays template labels Sunday from the same computus as our when-is page.`,
    ],
    planningTips: (y) => [
      `Mark early-April US tax deadlines on the planner before weekend trips.`,
      `Circle Earth Day (April 22) for classroom or community work.`,
      `Open the Easter when-is page for the exact Sunday in ${y}.`,
    ],
    historyTitle: "April anchors",
    historyBlurb: (y) =>
      `From the first MLB opening days to Earth Day’s founding story, April is full of public rituals. Note one on your April ${y} sheet for students or newsletters.`,
    historyFacts: [
      { label: "Apr 22, 1970", text: "First Earth Day observed in the United States." },
      { label: "Apr 15", text: "Traditional US Tax Day (shifts when it falls on a weekend/holiday)." },
      { label: "Apr 12, 1961", text: "Yuri Gagarin becomes first human in space." },
      { label: "Apr 23", text: "UNESCO World Book Day / Shakespeare commemorations." },
    ],
    faqBase: (y) => [
      {
        q: `Does the April ${y} calendar show Easter?`,
        a: `When Easter Sunday falls in April ${y}, the holidays template labels it using our Gregorian computus. Check the Easter page for the exact date.`,
      },
      {
        q: `Which April ${y} template is best for classrooms?`,
        a: `Landscape Soft reads well on a bulletin board; Notes Planner works for homework and field-trip logistics.`,
      },
    ],
  },
  5: {
    lead: (y) =>
      `May ${y} Fresh Calendars sheets for graduations, Mother’s Day, and Memorial Day weekend logistics.`,
    description: (y) =>
      `May ${y} printable calendar with Memorial Day calculated, six free designs in PNG and PDF, and layouts that work for families and classrooms.`,
    overview: (y) => [
      `May ${y} bridges spring and summer: Mother’s Day, finales, and Memorial Day as the unofficial US summer start.`,
      `Because Memorial Day moves, Fresh Calendars regenerates May ${y} instead of recycling last year’s grid.`,
    ],
    planningTips: (y) => [
      `Book Memorial Day travel once the holidays template shows the Monday.`,
      `Lock Mother’s Day brunch in the first week of May.`,
      `Classic B&W photocopies cleanly into end-of-year school packets.`,
    ],
    historyTitle: "May notes from history",
    historyBlurb: (y) =>
      `May Day labor traditions, aviation firsts, and Memorial Day’s evolution from Decoration Day give the month depth beyond cookouts.`,
    historyFacts: [
      { label: "May 1", text: "International Workers’ Day / May Day observances." },
      { label: "May 5", text: "Cinco de Mayo commemorations in many US communities." },
      { label: "May 20, 1927", text: "Lindbergh begins solo New York–Paris flight." },
      { label: "May 25, 1961", text: "Kennedy announces Moon landing goal." },
    ],
    faqBase: (y) => [
      {
        q: `When is Memorial Day in May ${y}?`,
        a: `Memorial Day is the last Monday in May. Our holidays template places the ${y} date automatically from the federal rules engine.`,
      },
      {
        q: `Are May ${y} downloads free for personal printing?`,
        a: `Yes — PNG and PDF for all five May ${y} designs are free for personal use from Fresh Calendars.`,
      },
    ],
  },
  6: {
    lead: (y) =>
      `June ${y} Fresh Calendars printables — solstice daylight, Juneteenth, and Father’s Day on one month page.`,
    description: (y) =>
      `June ${y} printable calendar with Juneteenth marked, six free designs in PNG and PDF, and tips for summer schedules and camp weeks.`,
    overview: (y) => [
      `June ${y} brings peak Northern Hemisphere daylight plus Juneteenth (June 19) and Father’s Day on the third Sunday.`,
      `Households and teams both benefit from a Fresh Calendars wall sheet before camp and vacation PTO overlap.`,
    ],
    planningTips: (y) => [
      `Mark Juneteenth before scheduling client work that week.`,
      `Align camp drop-offs on the notes-planner variant.`,
      `Landscape soft works above a kitchen command center.`,
    ],
    historyTitle: "June memory lane",
    historyBlurb: (y) =>
      `From D-Day anniversaries to pride-month community events, June carries both solemn and celebratory public memory.`,
    historyFacts: [
      { label: "Jun 6, 1944", text: "D-Day Allied landings in Normandy." },
      { label: "Jun 19, 1865", text: "News of emancipation reaches Galveston — Juneteenth root." },
      { label: "Jun 21", text: "Approx. Northern Hemisphere summer solstice." },
      { label: "Jun 26, 2015", text: "US Supreme Court decides Obergefell v. Hodges." },
    ],
    faqBase: (y) => [
      {
        q: `Is Juneteenth shown on the June ${y} holidays calendar?`,
        a: `Yes. Juneteenth is a fixed US federal holiday on June 19 and is labeled on our holidays variant for ${y}.`,
      },
      {
        q: `Why are there five June ${y} templates?`,
        a: `Each design has its own HTML/CSS root — classic B&W, modern color, holidays, notes planner, and landscape — so you can match print ink, wall space, or handwriting needs.`,
      },
    ],
  },
  7: {
    lead: (y) =>
      `July ${y} Fresh Calendars grids for Independence Day travel, cookouts, and mid-week holiday bridges.`,
    description: (y) =>
      `July ${y} printable calendar with Independence Day labeled, six free designs in PNG and PDF, and room for midsummer travel plans.`,
    overview: (y) => [
      `July ${y} is defined in the US by Independence Day. Fresh Calendars places the 4th correctly so group plans stop asking “what day is it?”`,
      `Vacations and special retail hours pile up — a dated month sheet keeps the chaos readable.`,
    ],
    planningTips: (y) => [
      `Decide bridge days early if July 4 lands mid-week.`,
      `Log heat-wave backups on the planner sheet.`,
      `Classic B&W photocopies well for neighborhood flyers.`,
    ],
    historyTitle: "July anchors",
    historyBlurb: (y) =>
      `Apollo 11, the Declaration’s anniversary, and summer cultural festivals give July ${y} planners more than cookout dates to note.`,
    historyFacts: [
      { label: "Jul 4, 1776", text: "Declaration of Independence adopted." },
      { label: "Jul 20, 1969", text: "Apollo 11 Moon landing." },
      { label: "Jul 14", text: "Bastille Day commemorations (France; observed by many US communities)." },
      { label: "Jul 1, 1867", text: "Canadian Confederation — Canada Day." },
    ],
    faqBase: (y) => [
      {
        q: `Does the July ${y} holidays calendar mark Independence Day?`,
        a: `Yes — July 4 is a fixed federal holiday and appears in-cell on the holidays template for ${y}.`,
      },
      {
        q: `Can I use the July ${y} PNG online?`,
        a: `Personal use and linking to our HTML pages is fine. Prefer CDN PNG/PDF URLs from the download buttons for embeds.`,
      },
    ],
  },
  8: {
    lead: (y) =>
      `August ${y} Fresh Calendars month — last vacations, supply lists, and back-to-school dates without a federal holiday buffer.`,
    description: (y) =>
      `August ${y} printable calendar in six free designs, PNG and PDF, with weekend tints and room for back-to-school dates. No federal holidays this month.`,
    overview: (y) => [
      `August ${y} is often the last full stretch of summer break. Fresh Calendars still ships a full dated grid even with no US federal holiday.`,
      `Use notes-planner for first-day-of-school announcements the week they drop.`,
    ],
    planningTips: (y) => [
      `Write school start dates as soon as districts publish them.`,
      `Modern color suits dorm or office pinboards.`,
      `Monday-start helps workweek-first classrooms.`,
    ],
    historyTitle: "August flashbacks",
    historyBlurb: (y) =>
      `Canal openings, voting-rights milestones, and late-summer speeches punctuate August. A few facts turn an August ${y} printable into a mini teaching aid.`,
    historyFacts: [
      { label: "Aug 15, 1914", text: "Panama Canal opens." },
      { label: "Aug 26, 1920", text: "19th Amendment certified — Women’s Equality Day root." },
      { label: "Aug 28, 1963", text: "March on Washington / “I Have a Dream” speech." },
      { label: "Aug 12, 1981", text: "IBM introduces its first personal computer." },
    ],
    faqBase: (y) => [
      {
        q: `Are there US federal holidays in August ${y}?`,
        a: `Usually none. Our holidays template still marks weekends and any engine-listed observances so August ${y} stays scannable.`,
      },
      {
        q: `Which August ${y} design matches Google Image “calendar” styles?`,
        a: `We ship five independent roots: high-contrast B&W, modern color header, holidays/weekend red, notes planner, and soft landscape — reflecting common search-result aesthetics without cloning any one site.`,
      },
    ],
  },
  9: {
    lead: (y) =>
      `September ${y} Fresh Calendars reset — Labor Day weekend, school rhythm, and early Q4 prep on one printable.`,
    description: (y) =>
      `September ${y} printable calendar with Labor Day placed, six free designs in PNG and PDF, and tips for the back-to-routine month.`,
    overview: (y) => [
      `September ${y} is the practical new year for many US households. Fresh Calendars anchors Labor Day (first Monday) then the busier weeks that follow.`,
      `Meeting density climbs after the holiday weekend — keep it visible on a wall sheet.`,
    ],
    planningTips: (y) => [
      `Treat Labor Day week as a soft launch for autumn goals.`,
      `Schedule wardrobe and HVAC swaps on quieter mid-month days.`,
      `Classic B&W handouts work for PTA and teams.`,
    ],
    historyTitle: "September bookmarks",
    historyBlurb: (y) =>
      `From Labor Day’s labor-movement roots to autumn equinox science, September rewards a calendar that is both practical and curious.`,
    historyFacts: [
      { label: "First Monday", text: "Labor Day (US federal holiday)." },
      { label: "~Sep 22", text: "Northern Hemisphere autumn equinox (date varies)." },
      { label: "Sep 11, 2001", text: "Patriot Day remembrances across the US." },
      { label: "Sep 17, 1787", text: "US Constitution signed." },
    ],
    faqBase: (y) => [
      {
        q: `When is Labor Day in September ${y}?`,
        a: `Labor Day is the first Monday in September. The holidays template computes the exact ${y} date from federal rules.`,
      },
      {
        q: `Is September ${y} content duplicated from other months?`,
        a: `No. Overview, tips, history blurbs, and FAQs are authored for September specifically so search and AI systems see unique page substance.`,
      },
    ],
  },
  10: {
    lead: (y) =>
      `October ${y} Fresh Calendars planning — federal Monday observance, Halloween, and Q4 sprint weeks.`,
    description: (y) =>
      `October ${y} printable calendar with holiday marks, room to plan Halloween, and six free designs to download as PNG or PDF.`,
    overview: (y) => [
      `October ${y} packs earlier sunsets, school events, and Halloween on the 31st. Fresh Calendars follows the federal second-Monday rule for Columbus Day while you note local Indigenous Peoples’ Day practice.`,
      `Notes-planner is the costume-and-party workhorse by mid-month.`,
    ],
    planningTips: (y) => [
      `Park costume logistics on the notes sheet by the 15th.`,
      `Mirror office closures on the holidays variant.`,
      `Landscape soft suits a hallway countdown.`,
    ],
    historyTitle: "October bite-size history",
    historyBlurb: (y) =>
      `From the 1929 market crash anniversary discussions to space-age firsts, October is dense with teachable moments for an October ${y} wall calendar.`,
    historyFacts: [
      { label: "Oct 1, 1958", text: "NASA begins operations." },
      { label: "Oct 4, 1957", text: "Sputnik 1 launches." },
      { label: "Oct 29, 1929", text: "Black Tuesday stock market crash." },
      { label: "Oct 31", text: "Halloween — widely celebrated in the US." },
    ],
    faqBase: (y) => [
      {
        q: `Does the October ${y} calendar include Columbus Day?`,
        a: `The holidays variant marks the federal Columbus Day (second Monday in October) for ${y}. Add local Indigenous Peoples’ Day notes as needed.`,
      },
      {
        q: `Best October ${y} template for Halloween planning?`,
        a: `Notes Planner — ruled day cells plus a side notes column for costume lists and candy runs.`,
      },
    ],
  },
  11: {
    lead: (y) =>
      `November ${y} Fresh Calendars — Veterans Day, Thanksgiving week math, and travel locks before the fourth Thursday.`,
    description: (y) =>
      `November ${y} printable calendar with Thanksgiving calculated and Veterans Day marked. Six free designs to download as PNG or PDF.`,
    overview: (y) => [
      `November ${y} concentrates Veterans Day (11th) and Thanksgiving (fourth Thursday). Fresh Calendars regenerates the month so Wednesday travel never inherits last year’s weekday.`,
      `Shade the holiday week early, then cook prep two days prior on the planner.`,
    ],
    planningTips: (y) => [
      `Circle Thanksgiving week on the holidays template first.`,
      `Verify local Veterans Day school/bank closures.`,
      `Classic B&W sticks well to fridge magnet sheets.`,
    ],
    historyTitle: "November remembrances on paper",
    historyBlurb: (y) =>
      `Armistice roots of Veterans Day and the evolving Thanksgiving story give November ${y} more gravity than shopping alone.`,
    historyFacts: [
      { label: "Nov 11", text: "Veterans Day (fixed federal holiday)." },
      { label: "Fourth Thursday", text: "Thanksgiving Day (US)." },
      { label: "Nov 19, 1863", text: "Lincoln delivers the Gettysburg Address." },
      { label: "Nov 9, 1989", text: "Berlin Wall opens." },
    ],
    faqBase: (y) => [
      {
        q: `When is Thanksgiving ${y}?`,
        a: `Thanksgiving is the fourth Thursday of November. Our holiday engine computes the exact November ${y} date and labels it on the holidays template.`,
      },
      {
        q: `Do November ${y} FAQs match other month pages?`,
        a: `No. Each month ships original questions and answers so pages do not share identical FAQ blocks.`,
      },
    ],
  },
  12: {
    lead: (y) =>
      `December ${y} Fresh Calendars sheets for Christmas Day, shipping cutoffs, and year-end office closures.`,
    description: (y) =>
      `December ${y} printable calendar with Christmas marked, six free designs in PNG and PDF, and space for year-end planning notes.`,
    overview: (y) => [
      `December ${y} compresses concerts, religious observances, and Christmas Day on the 25th. Fresh Calendars keeps the grid honest while fiscal close and family travel compete.`,
      `Mark shipping cutoffs before gift orders slip past carrier deadlines.`,
    ],
    planningTips: (y) => [
      `Log carrier cutoffs on the planner variant early.`,
      `Shade workplace closures between Christmas and New Year’s.`,
      `Landscape soft is a gentle dining-room wall piece.`,
    ],
    historyTitle: "December checkpoints",
    historyBlurb: (y) =>
      `From Wright brothers flight anniversary chatter to year-end cultural releases, December ${y} is more than countdown candy.`,
    historyFacts: [
      { label: "Dec 17, 1903", text: "Wright brothers’ first powered flight." },
      { label: "Dec 25", text: "Christmas Day (US federal holiday)." },
      { label: "Dec 26", text: "Boxing Day / start of Kwanzaa (cultural observances)." },
      { label: "Dec 31", text: "New Year’s Eve — unofficial planning checkpoint." },
    ],
    faqBase: (y) => [
      {
        q: `Is Christmas labeled on the December ${y} holidays calendar?`,
        a: `Yes. Christmas Day is a fixed federal holiday on December 25 and appears in-cell for ${y}.`,
      },
      {
        q: `Can I print December ${y} and January together?`,
        a: `Download December ${y} here and January ${y + 1} from the January page, which shows ${y + 1} from February ${y} onward.`,
      },
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
      ? holidays.map((h) => `${h.name} (${h.formatted})`).join("; ")
      : `No US federal holidays fall in ${name} ${year} on our engine list.`;

  const dynamic: FaqItem[] = [
    {
      q: `What day does ${name} ${year} start on?`,
      a: `${name} ${year} begins on ${start} and contains ${dim} days. Fresh Calendars print files match that weekday layout exactly.`,
    },
    {
      q: `Which US holidays fall in ${name} ${year}?`,
      a: holLine,
    },
    {
      q: `How do I download all five ${name} ${year} templates?`,
      a: `On each ${name} ${year} Fresh Calendars page you’ll find Classic B&W, Modern Color, US Holidays, Notes Planner, Landscape Soft, and Monday-start — each with its own PNG/PDF on our CDN.`,
    },
  ];

  return [...ed.faqBase(year), ...dynamic];
}

export function buildYearlyFaq(year: number): FaqItem[] {
  return [
    {
      q: `What is included in the ${year} yearly printable?`,
      a: `Fresh Calendars ships a year-at-a-glance poster with all twelve ${year} mini-months, weekdays generated for the full span.`,
    },
    {
      q: `How is the ${year} yearly page different from monthly pages?`,
      a: `The yearly hub is the full ${year} overview; monthly Fresh Calendars pages add large-cell templates, holiday marks, and month-only editorial.`,
    },
    {
      q: `Can I print the ${year} calendar for free?`,
      a: `Yes — Fresh Calendars yearly PNG/PDF packs for ${year} are free for personal printing.`,
    },
    {
      q: `Do yearly downloads include US holidays?`,
      a: `Mini-months tint federal dates for ${year}. For named in-cell labels, open a monthly holidays variant on Fresh Calendars.`,
    },
  ];
}

export function buildBlankFaq(): FaqItem[] {
  return [
    {
      q: "What is a blank printable calendar?",
      a: "An undated Fresh Calendars monthly grid with room to write. Pencil the month name and dates yourself — great for classrooms and bullet journals.",
    },
    {
      q: "When should I use blank instead of dated months?",
      a: "Pick blank to reuse one PDF all year or teach calendar skills. Pick dated Fresh Calendars months when weekdays and holidays must be correct.",
    },
    {
      q: "Are blank calendars free?",
      a: "Yes — blank Fresh Calendars PNG/PDF files are free to print for personal use.",
    },
    {
      q: "Does the blank template include holidays?",
      a: "No — blanks stay undated on purpose. Switch to a dated holidays month when you need engine-calculated US federal days.",
    },
  ];
}
