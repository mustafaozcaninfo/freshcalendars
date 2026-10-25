import type { HolidayDef, HolidayLocale, HolidayRule } from "../holidays/rules.js";
import { usDstFallBack, type ResolvedHoliday } from "../holidays/engine.js";
import { monthNumberToName } from "../months.js";

export type FaqItem = { q: string; a: string };

export type HolidayEditorial = {
  /** Hero lead under the date */
  lead: (h: ResolvedHoliday) => string;
  /** Meta description (full sentence, no trailing period required) */
  description: (h: ResolvedHoliday) => string;
  /** 2–4 unique overview paragraphs */
  overview: (h: ResolvedHoliday) => string[];
  /** Rule / engine explanation unique to this observance */
  howCalculated: (h: ResolvedHoliday) => string;
  /** Meaning / history section */
  meaningTitle: string;
  meaning: (h: ResolvedHoliday) => string[];
  /** Practical planning tips */
  planningTips: (h: ResolvedHoliday) => string[];
  /** Extra FAQ beyond date + evergreen */
  faq: (h: ResolvedHoliday) => FaqItem[];
};

function weekdayWord(rule: HolidayRule): string | undefined {
  if (
    rule.t === "nth_weekday" ||
    rule.t === "last_weekday" ||
    rule.t === "weekday_on_or_before"
  ) {
    return rule.weekday.charAt(0).toUpperCase() + rule.weekday.slice(1);
  }
  return undefined;
}

/** Generic fallback so non-editorial holidays still get rule-aware copy. */
export function ruleHowCalculated(def: HolidayDef, h: ResolvedHoliday): string {
  const rule = def.rule;
  const name = h.name;
  switch (rule.t) {
    case "fixed":
      return `${name} is a fixed calendar date: ${monthNumberToName(rule.m)} ${rule.d} every year. Fresh Calendars resolves the weekday for ${h.year} from that date — in ${h.year} it lands on ${h.weekdayName}.`;
    case "nth_weekday": {
      const ord =
        rule.n === 1
          ? "first"
          : rule.n === 2
            ? "second"
            : rule.n === 3
              ? "third"
              : rule.n === 4
                ? "fourth"
                : `${rule.n}th`;
      return `${name} follows an nth-weekday rule: the ${ord} ${weekdayWord(rule)} of ${monthNumberToName(rule.m)}. For ${h.year} that resolves to ${h.formatted}.`;
    }
    case "last_weekday":
      return `${name} is the last ${weekdayWord(rule)} of ${monthNumberToName(rule.m)}. For ${h.year} that resolves to ${h.formatted}.`;
    case "weekday_on_or_before":
      return `${name} is the ${weekdayWord(rule)} on or before ${monthNumberToName(rule.m)} ${rule.d}. For ${h.year} that resolves to ${h.formatted}.`;
    case "easter_offset": {
      const off = rule.offset;
      const rel =
        off === 0
          ? "Easter Sunday itself"
          : off > 0
            ? `${off} day${off === 1 ? "" : "s"} after Easter Sunday`
            : `${Math.abs(off)} day${Math.abs(off) === 1 ? "" : "s"} before Easter Sunday`;
      return `${name} is tied to Western Easter (${rel}) using the Gregorian computus. In ${h.year} that places ${name} on ${h.formatted}.`;
    }
    case "offset_from":
      return `${name} is calculated as ${rule.days} day${rule.days === 1 ? "" : "s"} from ${rule.base.replace(/-/g, " ")}. In ${h.year} that resolves to ${h.formatted}.`;
    default:
      return `${name} ${h.year} falls on ${h.formatted}, resolved by the Fresh Calendars holiday engine.`;
  }
}

export function printFaqAnswer(
  h: ResolvedHoliday,
  locale: HolidayLocale,
): string {
  const month = monthNumberToName(h.month);
  if (locale === "uk") {
    return `Download the ${month} ${h.year} printable and mark ${h.name} by hand (or note it beside the bank-holiday cluster). UK dates live on our UK holidays hub and this when-is page.`;
  }
  if (locale === "ca") {
    return `Download the ${month} ${h.year} printable and mark ${h.name} on the grid. Canadian statutory dates are listed on our Canada holidays hub with matching when-is pages.`;
  }
  return `Download the ${month} ${h.year} printable and choose the US Holidays Marked template so ${h.name} is labeled in-cell when the engine includes it.`;
}

const EDITORIAL: Record<string, HolidayEditorial> = {
  "april-fools-day": {
    lead: (h) =>
      `April Fools' Day ${h.year} is ${h.weekdayName}, April 1 — plan the pranks (and the “not at work” boundary) before the month grid fills up.`,
    description: (h) =>
      `April Fools' Day ${h.year} falls on ${h.formatted}. History of the April 1 prank tradition, how Fresh Calendars places the date, and a printable April ${h.year} calendar to mark the day.`,
    overview: (h) => [
      `April Fools' Day is observed every year on April 1. In ${h.year} that is a ${h.weekdayName}. Fresh Calendars keeps this when-is URL evergreen: after April 1 ${h.year} passes, the page rolls to the next April 1 automatically.`,
      `Unlike federal holidays, April Fools' is a cultural observance — no banks close — but schools, offices, and media still treat the morning as “joke season.” Putting it on a dated April printable stops the day from sneaking up during spring deadlines.`,
      `Origins are debated (medieval “new year” calendar shifts, French poisson d'avril, British newspaper hoaxes). What matters for planning is the fixed date: always April 1, weekday changing each year.`,
    ],
    howCalculated: (h) =>
      `April Fools' Day uses a fixed-date rule: month 4, day 1. There is no nth-weekday or Easter math. Fresh Calendars simply maps April 1 ${h.year} to ${h.weekdayName} on the Gregorian calendar.`,
    meaningTitle: "Why April 1 stuck",
    meaning: (h) => [
      `By the eighteenth and nineteenth centuries, English-language newspapers and street culture had normalized harmless deceptions on April 1. Modern media still runs elaborate hoaxes; workplaces usually expect light humor before noon and a hard stop on anything cruel or unsafe.`,
      `For families and classrooms, April Fools' is a good “calendar literacy” moment: kids see a fixed observance that is not a day off, sitting beside movable spring holidays like Easter on the same April ${h.year} sheet.`,
    ],
    planningTips: (h) => [
      `Circle April 1 on the April ${h.year} printable the week before — especially if ${h.weekdayName} is a school or meeting-heavy day.`,
      `If you publish content or run a team chat, draft any joke posts the night before so they go live early without colliding with real announcements.`,
      `Pair April Fools' with nearby spring dates (Easter cluster, Earth Day) on the same month grid so the first week of April is visible at a glance.`,
      `Use a weekly planner for March 30–April 5 if travel or exams sit next to the prank day.`,
    ],
    faq: (h) => [
      {
        q: `Is April Fools' Day ${h.year} a public holiday?`,
        a: `No. April Fools' Day is a cultural observance on April 1, not a US federal holiday. Schools and employers normally stay open on ${h.formatted}.`,
      },
      {
        q: `Does April Fools' Day ever move?`,
        a: `The calendar date does not move — it is always April 1. Only the weekday changes; in ${h.year} April 1 is ${h.weekdayName}.`,
      },
    ],
  },

  "ash-wednesday": {
    lead: (h) =>
      `Ash Wednesday ${h.year} is ${h.formatted} — the Western Lent opener, 46 days before Easter Sunday.`,
    description: (h) =>
      `Ash Wednesday ${h.year} falls on ${h.formatted}. How Lent is counted from Easter, what the day means, and which printable month calendar to mark for ${h.year}.`,
    overview: (h) => [
      `Ash Wednesday opens Lent in Western Christian calendars. In ${h.year} it falls on ${h.formatted}. Many churches offer ashes and begin fasting or abstinence practices that run through Holy Saturday.`,
      `The date is not fixed on the civil calendar. It rides on Easter Sunday: Ash Wednesday is always 46 days earlier (Lent’s forty weekdays of fasting plus the Sundays that fall inside the season).`,
      `Fresh Calendars resolves Easter with the Gregorian computus, then applies the −46 day offset — the same engine that powers Good Friday, Palm Sunday, and Easter when-is pages.`,
    ],
    howCalculated: (h) =>
      `Ash Wednesday = Easter Sunday minus 46 days (Gregorian/Western computus). Easter ${h.year} is computed first; stepping back 46 days lands on ${h.formatted}. Eastern Orthodox dates can differ and are not used on this page.`,
    meaningTitle: "Lent, ashes, and the spring calendar",
    meaning: (h) => [
      `The name comes from the custom of marking the forehead with ash as a sign of repentance and mortality. For liturgical churches, Ash Wednesday is a solemn fast day; for planners, it is the signal that Holy Week and Easter are six-and-a-half weeks away.`,
      `Because Easter moves between late March and late April, Ash Wednesday can fall in February or March. Always check the resolved year on this evergreen page rather than copying last year’s February/March assumption.`,
    ],
    planningTips: (h) => [
      `Mark ${h.formatted} on the ${monthNumberToName(h.month)} ${h.year} printable and draw a light line through to Easter so the Lent window is visible.`,
      `Parish schedules, fish-fry nights, and school religion classes often densify after Ash Wednesday — block the first week of Lent on a weekly planner.`,
      `If you track fasting or meatless Fridays, note every Friday from Ash Wednesday through Good Friday on the month grid.`,
      `Cross-check Palm Sunday and Good Friday when-is pages so Holy Week travel is booked against the correct Sundays.`,
    ],
    faq: (h) => [
      {
        q: `Why is Ash Wednesday ${h.year} not the same date every year?`,
        a: `Ash Wednesday is anchored to Easter Sunday (46 days earlier). Easter moves with the Gregorian lunar-based computus, so Ash Wednesday moves with it — in ${h.year} to ${h.formatted}.`,
      },
      {
        q: `Is Ash Wednesday a day off work?`,
        a: `Generally no in the US. It is a religious observance, not a federal holiday. Some schools or workplaces may note it; most calendars treat it as a marked observance only.`,
      },
    ],
  },

  "ca-boxing-day": {
    lead: (h) =>
      `Boxing Day in Canada ${h.year} is ${h.formatted} — December 26, a statutory holiday in several provinces and a major retail day.`,
    description: (h) =>
      `Canadian Boxing Day ${h.year} falls on ${h.formatted}. Provincial holiday status, shopping-week planning, and a printable December ${h.year} calendar from Fresh Calendars.`,
    overview: (h) => [
      `Boxing Day is observed on December 26. In ${h.year} that is a ${h.weekdayName}. In Canada it is a statutory holiday in provinces and territories such as Ontario, British Columbia, and Alberta, while coverage differs elsewhere — always confirm your province’s employment standards.`,
      `Federally regulated workplaces list Boxing Day among general holidays under the Canada Labour Code. Retailers treat the 26th (and often the surrounding weekend) as one of the busiest post-Christmas shopping stretches of the year.`,
      `Do not confuse Canadian Boxing Day with the US calendar: the United States does not observe December 26 as a federal holiday. Canadian Thanksgiving is also a different date from the US holiday.`,
    ],
    howCalculated: (h) =>
      `Boxing Day uses a fixed-date rule: 26 December every year. Fresh Calendars maps that civil date to ${h.weekdayName} in ${h.year}. When the 26th falls on a weekend, some employers substitute an adjacent weekday — check local rules; this page shows the calendar date itself.`,
    meaningTitle: "From servants’ boxes to Boxing Week",
    meaning: (h) => [
      `The English-language name is usually traced to Christmas “boxes” of gifts or tips for servants and tradespeople the day after Christmas. In Canada the day kept the UK/Commonwealth date while growing into a commercial “Boxing Week” that can run past the 26th.`,
      `For families, Boxing Day often means leftover meals, visits, and returns. For planners, it is the bridge between Christmas Day and New Year’s Eve on the December grid.`,
    ],
    planningTips: (h) => [
      `Mark Dec 25 and Dec 26 together on the December ${h.year} printable so the two-day Christmas close is obvious.`,
      `If you manage retail or shipping, block staffing for Boxing Week before Black Friday promotions steal the planning attention.`,
      `Confirm whether your province grants Boxing Day as a paid statutory holiday — federal status does not automatically equal every provincial calendar.`,
      `Use a weekly planner for Dec 22–28 when travel, returns, and store hours collide.`,
    ],
    faq: (h) => [
      {
        q: `Is Boxing Day a holiday everywhere in Canada in ${h.year}?`,
        a: `December 26 is widely observed, and it is a statutory holiday in several provinces plus for many federally regulated employees. Provincial coverage is not universal — verify your jurisdiction for ${h.year}.`,
      },
      {
        q: `Is Canadian Boxing Day the same as the US day after Christmas?`,
        a: `The calendar date is the same (December 26), but the US does not treat it as a federal holiday. Canadian statutory rules and Boxing Week retail culture are distinct.`,
      },
    ],
  },

  "ca-labour-day": {
    lead: (h) =>
      `Canada’s Labour Day ${h.year} is ${h.formatted} — the first Monday of September and the unofficial end of summer.`,
    description: (h) =>
      `Canadian Labour Day ${h.year} falls on ${h.formatted}. First-Monday rule, federal holiday status, back-to-school timing, and a printable September ${h.year} calendar.`,
    overview: (h) => [
      `Labour Day in Canada is the first Monday in September. In ${h.year} that Monday is ${h.formatted}. It is a federal general holiday and is widely observed across provinces as a statutory day.`,
      `Parades and union commemorations still mark the labour movement’s history, but for most households the day functions as a long weekend: final cottage trips, sports tournaments, and the last pause before a full school/work September.`,
      `Spelling matters for searchers: Canada uses “Labour Day”; the US federal holiday in September is “Labor Day” on the same first-Monday rule. Dates usually match, but holiday lists and when-is URLs stay country-specific on Fresh Calendars.`,
    ],
    howCalculated: (h) =>
      `Canadian Labour Day uses an nth-weekday rule: the first Monday of September. Fresh Calendars finds the first Monday in September ${h.year}, which is ${h.formatted}.`,
    meaningTitle: "Workers’ holiday, summer’s bookend",
    meaning: (h) => [
      `Canadian Labour Day traces to nineteenth-century labour demonstrations and was recognized nationally in the 1890s. It sits opposite Victoria Day as a seasonal bookend: late-spring long weekend and late-summer long weekend.`,
      `Retail “Labour Day sales” and university move-in weekends often cluster around this Monday. Putting the federal holiday on a dated September sheet keeps those collisions visible.`,
    ],
    planningTips: (h) => [
      `Block the Labour Day long weekend on the September ${h.year} printable as soon as school supply lists arrive.`,
      `If you travel Friday–Monday, mark Thursday evening packing on a weekly planner so Friday departures stay sane.`,
      `Employers: confirm holiday pay rules for the first Monday of September under federal or provincial standards.`,
      `Scan Canada Day and the civic holiday (early August) on the Canada holidays hub when building a full summer-off calendar.`,
    ],
    faq: (h) => [
      {
        q: `Is Labour Day ${h.year} the same date in Canada and the US?`,
        a: `Usually yes — both countries use the first Monday of September. In ${h.year} that is ${h.formatted}. Always use the Canada-specific when-is page when you need Canadian statutory wording.`,
      },
      {
        q: `Why does Labour Day move each year?`,
        a: `It is defined as the first Monday of September, not a fixed calendar date, so the day-of-month shifts. Fresh Calendars recalculates it every build for the next upcoming Labour Day.`,
      },
    ],
  },

  "ca-national-day-truth": {
    lead: (h) =>
      `National Day for Truth and Reconciliation ${h.year} is ${h.formatted} — September 30, also observed as Orange Shirt Day.`,
    description: (h) =>
      `National Day for Truth and Reconciliation ${h.year} falls on ${h.formatted}. Federal holiday context, Orange Shirt Day, and a printable September ${h.year} calendar from Fresh Calendars.`,
    overview: (h) => [
      `September 30 is Canada’s National Day for Truth and Reconciliation. In ${h.year} it falls on a ${h.weekdayName}. The day honours First Nations, Inuit, and Métis Survivors of the residential school system, their families, and communities.`,
      `Parliament created the federal statutory holiday in 2021 in response to the Truth and Reconciliation Commission’s Call to Action 80. It shares the date with Orange Shirt Day, the Indigenous-led commemorative movement that began with Phyllis Webstad’s story and the message “Every Child Matters.”`,
      `The holiday applies to federally regulated workplaces; provincial and territorial statutory status varies. Treat the day as a time for learning and remembrance, not a generic long weekend.`,
    ],
    howCalculated: (h) =>
      `This observance uses a fixed-date rule: 30 September every year. Fresh Calendars maps September 30 ${h.year} to ${h.weekdayName}. No Easter or weekday-nth math is involved.`,
    meaningTitle: "Orange Shirt Day and Call to Action 80",
    meaning: (h) => [
      `Orange Shirt Day grew from Phyllis Webstad’s account of having her new orange shirt taken on her first day at a residential school. Wearing orange on September 30 is a widespread gesture of solidarity and remembrance.`,
      `The National Day for Truth and Reconciliation elevates that commemorative date into the federal holiday calendar so public remembrance remains part of reconciliation work — not only a grassroots observance.`,
    ],
    planningTips: (h) => [
      `Mark September 30 on the September ${h.year} printable alongside Labour Day so the month’s two major markers are visible.`,
      `Schools and workplaces often schedule learning sessions — block time the week of the 30th rather than treating it as empty leave.`,
      `Confirm whether your employer (federal vs provincial) observes the day as a paid holiday in ${h.year}.`,
      `Link related dates: browse the Canada holidays hub for Remembrance Day and National Indigenous Peoples Day context when building a year view.`,
    ],
    faq: (h) => [
      {
        q: `Is National Day for Truth and Reconciliation the same as Orange Shirt Day?`,
        a: `They share September 30. Orange Shirt Day is the grassroots commemorative movement; the National Day for Truth and Reconciliation is the federal statutory holiday established in 2021. In ${h.year} both fall on ${h.formatted}.`,
      },
      {
        q: `Do all Canadian provinces get September 30 off?`,
        a: `It is a federal general holiday for federally regulated employees. Provincial statutory coverage differs — check your province or territory for ${h.year} rather than assuming a Canada-wide day off.`,
      },
    ],
  },

  "ca-thanksgiving": {
    lead: (h) =>
      `Canadian Thanksgiving ${h.year} is ${h.formatted} — the second Monday of October, not the US Thursday in November.`,
    description: (h) =>
      `Thanksgiving in Canada ${h.year} falls on ${h.formatted}. Second-Monday rule, how it differs from US Thanksgiving, and a printable October ${h.year} calendar.`,
    overview: (h) => [
      `Canadian Thanksgiving is the second Monday of October. In ${h.year} that Monday is ${h.formatted}. It is a federal general holiday and a statutory holiday in most provinces and territories (notable exceptions can apply — verify locally).`,
      `Harvest thanksgiving traditions in Canada predate Confederation; the modern second-Monday date was fixed nationally in 1957. The holiday is earlier than US Thanksgiving because the Canadian harvest season ends sooner in much of the country.`,
      `If you work across the border, never reuse a US November date for Canadian school or payroll calendars. Fresh Calendars keeps separate when-is pages for Canadian and US Thanksgiving.`,
    ],
    howCalculated: (h) =>
      `Canadian Thanksgiving uses an nth-weekday rule: the second Monday of October. For ${h.year} that resolves to ${h.formatted}. US Thanksgiving (fourth Thursday of November) is a different rule on a different when-is URL.`,
    meaningTitle: "A Monday harvest holiday",
    meaning: (h) => [
      `Many Canadian families gather for a turkey dinner on the Sunday or Monday of the long weekend. Parades and football appear in some cities, but the cultural center of gravity is the family meal and autumn travel.`,
      `Because the holiday is a Monday, the planning unit is usually a three-day weekend. October printables should show the Monday holiday clearly so Friday packing and Sunday dinners are scheduled against the correct week.`,
    ],
    planningTips: (h) => [
      `Circle the second Monday of October on the October ${h.year} sheet — do not use the US November Thanksgiving cell.`,
      `Book inter-city travel early; the Thanksgiving Monday weekend fills trains and highways.`,
      `Meal prep: put shopping on the Thursday/Friday before ${h.formatted} on a weekly planner.`,
      `Compare with US Thanksgiving only if you manage binational teams — publish both dates explicitly.`,
    ],
    faq: (h) => [
      {
        q: `Is Canadian Thanksgiving the same day as US Thanksgiving in ${h.year}?`,
        a: `No. Canada observes the second Monday of October (${h.formatted} in ${h.year}). The US observes the fourth Thursday of November. They rarely coincide.`,
      },
      {
        q: `Why is Canadian Thanksgiving on a Monday?`,
        a: `Federal law sets Thanksgiving Day as the second Monday in October, creating a consistent long weekend rather than a mid-week fixed date.`,
      },
    ],
  },

  // The slug resolves to the March start, so the previous November's
  // fall-back always lands inside the window this page is live for.
  "daylight-savings": {
    lead: (h) =>
      `US clocks spring forward at 2:00 a.m. local time. The ${h.year - 1} season ends first, on ${usDstFallBack(h.year - 1).formatted}, when clocks fall back one hour.`,
    description: (h) =>
      `Clocks fall back ${usDstFallBack(h.year - 1).formatted}, at 2:00 a.m. Daylight saving time ${h.year} starts ${h.formatted} in most of the US. Printable March calendar.`,
    overview: (h) => [
      `Under current US federal rules (Energy Policy Act of 2005), daylight saving time ends at 2:00 a.m. on the first Sunday of November and begins at 2:00 a.m. on the second Sunday of March.`,
      `In ${h.year - 1}, clocks fall back on ${usDstFallBack(h.year - 1).formatted}: 2:00 a.m. becomes 1:00 a.m. and standard time returns. In ${h.year}, they spring forward on ${h.formatted}: 2:00 a.m. becomes 3:00 a.m. The ${h.year} season then ends on ${usDstFallBack(h.year).formatted}.`,
      `Arizona (except the Navajo Nation) and Hawaii stay on standard time year-round; some US territories also do not observe DST. The daylight-saving guide page lists both dates for this year and next on one checklist.`,
    ],
    howCalculated: (h) =>
      `Fresh Calendars models both US clock changes with nth-weekday rules: the second Sunday of March (${h.formatted}) and the first Sunday of November (${usDstFallBack(h.year - 1).formatted} for ${h.year - 1}). The engine does not shift the instant by time zone — local 2:00 a.m. still applies wherever DST is observed.`,
    meaningTitle: "Why the clocks still move",
    meaning: (h) => [
      `Daylight saving time stretches evening daylight in warmer months. Congress has debated making DST or standard time permanent; until law changes, the March/November pattern remains the planning default for most states.`,
      `Practical impact is bigger than “lose an hour”: meeting links, medication schedules, observatories, and broadcast times all jump. Marking the Sunday on a March printable prevents Monday chaos.`,
    ],
    planningTips: (h) => [
      `Write “fall back” on ${usDstFallBack(h.year - 1).formatted} and “spring forward” on ${h.formatted}; set phone alarms the night before each.`,
      `Remote teams: announce the change in Slack/email Friday — not everyone notices until the Monday stand-up is empty.`,
      `Parents: bedtime the Saturday night before is often harder; shift routines gradually mid-week if kids are sensitive.`,
      `The November ${h.year} fall-back is ${usDstFallBack(h.year).formatted}; note it on the yearly poster so both DST edges stay visible.`,
    ],
    faq: (h) => [
      {
        q: `When do clocks fall back in ${h.year - 1}?`,
        a: `In most of the US, standard time returns on ${usDstFallBack(h.year - 1).formatted} at 2:00 a.m. local time, when clocks move back one hour.`,
      },
      {
        q: `When do clocks fall back in ${h.year}?`,
        a: `On ${usDstFallBack(h.year).formatted}, the first Sunday of November, at 2:00 a.m. local time.`,
      },
      {
        q: `Does every US state change clocks on ${h.formatted}?`,
        a: `No. Hawaii and most of Arizona do not observe daylight saving time. Confirm local rules if you travel or schedule across those regions.`,
      },
    ],
  },

  "fathers-day": {
    lead: (h) =>
      `Father's Day ${h.year} in the US is ${h.formatted} — the third Sunday of June.`,
    description: (h) =>
      `Father's Day ${h.year} falls on ${h.formatted}. Third-Sunday rule, US observance history, gift and brunch planning, plus a printable June ${h.year} calendar.`,
    overview: (h) => [
      `US Father's Day is the third Sunday of June. In ${h.year} that Sunday is ${h.formatted}. It is a widely observed celebration, not a federal holiday — mail still runs, but brunch reservations and gift shipping deadlines are very real.`,
      `Sonora Smart Dodd promoted the holiday in the early twentieth century; President Nixon signed a permanent national observance in 1972. Many other countries use different weekends (for example, some use March or September), so US planners should stick to the June third-Sunday rule.`,
      `On Fresh Calendars, Father's Day sits on the same June sheet as Flag Day (June 14) and Juneteenth (June 19) — three different kinds of June markers in one month.`,
    ],
    howCalculated: (h) =>
      `Father's Day uses an nth-weekday rule: the third Sunday of June. Fresh Calendars resolves June ${h.year}’s third Sunday to ${h.formatted}.`,
    meaningTitle: "Cards, calls, and a June Sunday",
    meaning: (h) => [
      `The day centers gratitude for fathers and father figures — biological, adoptive, step, or chosen. Schools often schedule crafts the Friday before; retailers push promotions the full first half of June.`,
      `Because it is always a Sunday, the planning constraint is usually restaurant capacity and shipping cutoffs, not workplace closures.`,
    ],
    planningTips: (h) => [
      `Order gifts by the second week of June so they arrive before ${h.formatted}.`,
      `Circle the third Sunday on the June ${h.year} printable next to Juneteenth so the mid-month cluster is clear.`,
      `Brunch: reserve early when ${h.weekdayName} weekends sell out in your city.`,
      `Long-distance families: schedule video calls in a weekly planner so time zones do not erase the evening.`,
    ],
    faq: (h) => [
      {
        q: `Is Father's Day ${h.year} a federal holiday?`,
        a: `No. Father's Day is a US observance on the third Sunday of June (${h.formatted} in ${h.year}). Federal offices stay open.`,
      },
      {
        q: `Is US Father's Day the same weekend worldwide?`,
        a: `No. Many countries use other dates. This page follows the common US rule: third Sunday of June.`,
      },
    ],
  },

  "uk-early-may-bank-holiday": {
    lead: (h) =>
      `Early May bank holiday ${h.year} is ${h.formatted} — the first Monday of May in England, Wales, Scotland, and Northern Ireland (subject to one-off moves).`,
    description: (h) =>
      `UK Early May bank holiday ${h.year} falls on ${h.formatted}. First-Monday rule, rare commemorative moves, and a printable May ${h.year} calendar.`,
    overview: (h) => [
      `The Early May bank holiday is normally the first Monday of May. In ${h.year} that Monday is ${h.formatted}. It is a UK-wide bank holiday, creating a popular long weekend for travel and events.`,
      `Parliament occasionally relocates the holiday for major commemorations (for example, VE Day anniversaries). When that happens, official gov.uk notices override the default first-Monday rule. Fresh Calendars publishes the standard rule unless a special statutory change is modeled.`,
      `Pair this Monday with the Spring bank holiday (last Monday of May) when building a full late-spring UK calendar — two bank-holiday Mondays in the same month are common.`,
    ],
    howCalculated: (h) =>
      `Default rule: first Monday of May (nth-weekday). For ${h.year} Fresh Calendars resolves that to ${h.formatted}. Check gov.uk if a one-off commemorative shift is announced for the year.`,
    meaningTitle: "May Day weekend in modern form",
    meaning: (h) => [
      `The holiday sits near traditional May Day / International Workers’ Day themes but is scheduled as a Monday bank holiday for a reliable three-day weekend rather than always on 1 May.`,
      `For schools and offices, it often lands in the middle of exam or project seasons — marking it early on a May printable prevents surprise closures.`,
    ],
    planningTips: (h) => [
      `Block the first Monday of May on the May ${h.year} printable together with the late-May Spring bank holiday.`,
      `Train and motorway traffic rise on Early May weekends — book seats before the Thursday prior.`,
      `HR teams: confirm whether your nation (England & Wales vs Scotland vs NI) publishes any substitution notices for ${h.year}.`,
      `Use a weekly planner for the Thursday–Monday stretch if DIY or garden projects need daylight.`,
    ],
    faq: (h) => [
      {
        q: `Is the Early May bank holiday always May 1?`,
        a: `No. It is the first Monday of May, which only sometimes coincides with 1 May. In ${h.year} the holiday is ${h.formatted}.`,
      },
      {
        q: `Can the Early May holiday move for special events?`,
        a: `Yes — the UK has occasionally shifted it for commemorations. When in doubt for ${h.year}, confirm against the official bank holiday list.`,
      },
    ],
  },

  "uk-easter-monday": {
    lead: (h) =>
      `Easter Monday ${h.year} in the UK is ${h.formatted} — the bank holiday immediately after Easter Sunday.`,
    description: (h) =>
      `UK Easter Monday ${h.year} falls on ${h.formatted}. Easter computus +1 day, bank-holiday planning, and a printable ${monthNumberToName(h.month)} ${h.year} calendar.`,
    overview: (h) => [
      `Easter Monday is a UK bank holiday on the day after Easter Sunday. In ${h.year} it falls on ${h.formatted}. Together with Good Friday it creates a four-day Easter weekend for much of the country.`,
      `The date moves every year because Western Easter moves. Fresh Calendars computes Easter Sunday with the Gregorian computus, then adds one day for Easter Monday — the same chain used for Good Friday (−2) and Ash Wednesday (−46).`,
      `Scotland’s bank-holiday pattern around Easter can differ in emphasis from England & Wales; always confirm local observance if you schedule staff across nations.`,
    ],
    howCalculated: (h) =>
      `Easter Monday = Easter Sunday + 1 day. Easter ${h.year} is derived from the Gregorian computus; adding one day yields ${h.formatted}.`,
    meaningTitle: "The second half of Easter weekend",
    meaning: (h) => [
      `Liturgically, Easter Monday continues the Easter Octave; culturally in the UK it is the recovery / travel day of the long weekend — football fixtures, garden centres, and coastal roads all busy.`,
      `Planners should treat Good Friday through Easter Monday as one block on the month grid, not isolated single days.`,
    ],
    planningTips: (h) => [
      `Mark Good Friday, Easter Sunday, and Easter Monday as a cluster on the ${monthNumberToName(h.month)} ${h.year} printable.`,
      `Book UK travel early; Easter weekend is one of the busiest domestic getaway periods.`,
      `Retail and hospitality: schedule peak staffing for Friday and Monday, not only Sunday.`,
      `Cross-link the Easter Sunday when-is page so the whole computus chain stays consistent.`,
    ],
    faq: (h) => [
      {
        q: `Is Easter Monday ${h.year} the same in the US?`,
        a: `Easter Sunday’s Western date matches, but Easter Monday is not a US federal holiday. This page is for the UK bank holiday on ${h.formatted}.`,
      },
      {
        q: `Why does UK Easter Monday move each year?`,
        a: `It is defined as the Monday after Easter Sunday, and Easter itself moves with the Gregorian computus.`,
      },
    ],
  },

  "uk-guy-fawkes-night": {
    lead: (h) =>
      `Guy Fawkes Night ${h.year} is ${h.formatted} — Bonfire Night on 5 November.`,
    description: (h) =>
      `Guy Fawkes Night ${h.year} falls on ${h.formatted}. Bonfire Night history, safety planning, and a printable November ${h.year} calendar from Fresh Calendars.`,
    overview: (h) => [
      `Guy Fawkes Night (Bonfire Night) is observed on 5 November. In ${h.year} that is a ${h.weekdayName}. It commemorates the failed Gunpowder Plot of 1605, when Guy Fawkes was arrested guarding explosives beneath Parliament.`,
      `It is a cultural observance, not a bank holiday. Public firework displays and private bonfires often run on the nearest weekend as well as on the 5th itself — check local council dates.`,
      `On UK autumn calendars it sits near Remembrance Sunday and, in some years, close to Diwali firework season — noise and pet-care planning matter.`,
    ],
    howCalculated: (h) =>
      `Bonfire Night uses a fixed-date rule: 5 November. Fresh Calendars maps 5 November ${h.year} to ${h.weekdayName}. Community displays may choose a different nearby evening; the traditional date remains the 5th.`,
    meaningTitle: "Remember, remember the Fifth of November",
    meaning: (h) => [
      `The rhyme and effigy tradition (“the Guy”) grew from early modern thanksgiving for the plot’s failure. Modern events focus on fireworks and community bonfires more than politics.`,
      `For households, the practical story is safety: sparklers, crowd exits, and animals frightened by fireworks. Marking the week on a November printable helps you catch council display announcements.`,
    ],
    planningTips: (h) => [
      `Circle 5 November on the November ${h.year} sheet and note any weekend display substitutes beside it.`,
      `Pets: plan indoor evenings for Nov 4–6 when neighbourhood fireworks peak.`,
      `Travel: expect local road closures near major displays — check the week-of notices.`,
      `Pair with Remembrance Sunday on the same month grid so November’s two cultural anchors are both visible.`,
    ],
    faq: (h) => [
      {
        q: `Is Guy Fawkes Night ${h.year} a bank holiday?`,
        a: `No. It is an observance on 5 November (${h.formatted} in ${h.year}). Banks and most offices stay open.`,
      },
      {
        q: `Do fireworks always happen on 5 November?`,
        a: `The traditional date is the 5th, but many public displays move to the nearest Friday or Saturday. Keep both the calendar date and local listings.`,
      },
    ],
  },

  "uk-new-years-day": {
    lead: (h) =>
      `New Year's Day ${h.year} in the UK is ${h.formatted} — a public / bank holiday on 1 January.`,
    description: (h) =>
      `UK New Year's Day ${h.year} falls on ${h.formatted}. Public holiday rules, Hogmanay context, and a printable January ${h.year} calendar.`,
    overview: (h) => [
      `New Year's Day is a UK public holiday on 1 January. In ${h.year} it falls on a ${h.weekdayName}. When 1 January lands on a weekend, a substitute weekday bank holiday is commonly designated — this page shows the calendar date of New Year’s Day itself.`,
      `Scotland’s Hogmanay celebrations make 1–2 January especially significant; 2 January is also a bank holiday in Scotland. England, Wales, and Northern Ireland focus the statutory holiday on the 1st (plus substitutes when needed).`,
      `Fresh Calendars rolls this evergreen page to the next upcoming 1 January after the date passes — the same next-occurrence logic as monthly calendars.`,
    ],
    howCalculated: (h) =>
      `Fixed-date rule: 1 January. For ${h.year} that is ${h.weekdayName}, ${h.formatted}. Substitute bank holidays for weekend New Year’s dates are published separately by the government and may add an extra weekday off.`,
    meaningTitle: "First public holiday of the civil year",
    meaning: (h) => [
      `New Year’s Day closes Hogmanay night and opens the civil year. Travel, hospitality, and healthcare staffing plans should treat Dec 31–Jan 1 as a single peak period.`,
      `Resolutions and return-to-work emails can wait until January 2 on the printable — keep the 1st visually marked as a holiday cell.`,
    ],
    planningTips: (h) => [
      `Mark 1 January on the January ${h.year} printable and note any substitute weekday if the 1st is a weekend.`,
      `Scotland: also block 2 January when building staff rotas.`,
      `Transport: last-train and night-Tube/Night Tube plans belong on a Dec 31 weekly planner page.`,
      `Pair with UK New Year’s Eve when-is for the full year-end block.`,
    ],
    faq: (h) => [
      {
        q: `Is 2 January a holiday across the UK in ${h.year}?`,
        a: `2 January is a bank holiday in Scotland. England, Wales, and Northern Ireland do not universally observe it. New Year’s Day itself is ${h.formatted}.`,
      },
      {
        q: `What if New Year's Day falls on a Sunday?`,
        a: `1 January remains New Year’s Day; governments typically add a substitute bank holiday on the following weekday. Confirm the official list for ${h.year}.`,
      },
    ],
  },

  "uk-new-years-eve": {
    lead: (h) =>
      `New Year's Eve ${h.year} is ${h.formatted} — 31 December, the countdown day before the New Year’s Day bank holiday.`,
    description: (h) =>
      `UK New Year's Eve ${h.year} falls on ${h.formatted}. Hogmanay and London countdown planning, plus a printable December ${h.year} calendar from Fresh Calendars.`,
    overview: (h) => [
      `New Year's Eve is 31 December every year. In ${h.year} it is a ${h.weekdayName}. It is not a UK bank holiday, but many offices close early and cities run major public events — London fireworks, Edinburgh’s Hogmanay, and local council displays.`,
      `Travel and hospitality demand peaks on the 31st even more than on New Year’s Day. Treat Dec 31–Jan 1 as one logistics block on your December and January printables.`,
      `This evergreen page always shows the next upcoming 31 December after the date passes.`,
    ],
    howCalculated: (h) =>
      `Fixed-date rule: 31 December. Fresh Calendars maps 31 December ${h.year} to ${h.weekdayName}. No substitute-day logic applies because New Year’s Eve is an observance, not a bank holiday.`,
    meaningTitle: "Hogmanay eve and city countdowns",
    meaning: (h) => [
      `In Scotland, Hogmanay traditions (first-footing, street parties) make New Year’s Eve a cultural highlight of the year. Elsewhere in the UK, public fireworks and hospitality bookings dominate planning.`,
      `Safety and transport matter more than ceremony for most households: book tickets, plan night travel, and set meeting-free January 2 calendars in advance.`,
    ],
    planningTips: (h) => [
      `Circle 31 December on the December ${h.year} printable next to Boxing Day and Christmas.`,
      `Ticketed fireworks: buy early; Thames and Edinburgh events sell out.`,
      `Parents: decide babysitting or family-friendly events by mid-December on a weekly planner.`,
      `After the night: mark New Year’s Day (and Scotland’s 2 January) so return-to-work expectations are clear.`,
    ],
    faq: (h) => [
      {
        q: `Is New Year's Eve ${h.year} a bank holiday?`,
        a: `No. 31 December (${h.formatted}) is an observance. The public holiday is New Year’s Day on 1 January (plus any substitute weekday).`,
      },
      {
        q: `When should I plan Hogmanay travel?`,
        a: `For Edinburgh and other major parties, book lodging and transport weeks ahead of ${h.formatted} — New Year’s Eve demand outpaces most bank-holiday weekends.`,
      },
    ],
  },

  "uk-remembrance-sunday": {
    lead: (h) =>
      `Remembrance Sunday ${h.year} is ${h.formatted} — the second Sunday of November, nearest the Armistice date of 11 November.`,
    description: (h) =>
      `Remembrance Sunday ${h.year} falls on ${h.formatted}. Two-minute silence, Cenotaph timing, and a printable November ${h.year} calendar.`,
    overview: (h) => [
      `Remembrance Sunday is observed on the second Sunday of November. In ${h.year} that Sunday is ${h.formatted}. Services across the UK honour the Armed Forces and civilians who died in war, with the national ceremony at the Cenotaph in London.`,
      `Armistice Day remains 11 November every year. When 11 November is not a Sunday, Remembrance Sunday is still kept on the second Sunday; many people also mark a silence on the 11th itself.`,
      `It is not a bank holiday. Employers and schools often facilitate a two-minute silence at 11:00 a.m. — put both the Sunday service and the 11th on your November grid.`,
    ],
    howCalculated: (h) =>
      `Fresh Calendars uses the common civil rule: the second Sunday of November. For ${h.year} that resolves to ${h.formatted}. Armistice Day (11 November) is a separate fixed date on the same month sheet.`,
    meaningTitle: "Poppies, silence, and November",
    meaning: (h) => [
      `The red poppy appeal and local war-memorial services are the public face of the weekend. Coverage usually begins the week before Remembrance Sunday.`,
      `For calendar products, the value is clarity: show Remembrance Sunday and 11 November distinctly so neither the service nor the Armistice silence is missed.`,
    ],
    planningTips: (h) => [
      `Mark the second Sunday of November and write “11:00 silence” on 11 November on the November ${h.year} printable.`,
      `Community groups: publish parade assembly times on a weekly planner the week prior.`,
      `Travel into central London: expect closures around Whitehall on the Sunday morning.`,
      `Bonfire Night (5 November) often precedes Remembrance week — keep both on the same month view.`,
    ],
    faq: (h) => [
      {
        q: `Is Remembrance Sunday the same as Armistice Day?`,
        a: `Armistice Day is always 11 November. Remembrance Sunday is the second Sunday of November (${h.formatted} in ${h.year}). They coincide only when 11 November is a Sunday.`,
      },
      {
        q: `Is Remembrance Sunday ${h.year} a bank holiday?`,
        a: `No. It is a national observance. Most workplaces open, though many pause for the two-minute silence.`,
      },
    ],
  },

  "uk-summer-bank-holiday": {
    lead: (h) =>
      `Summer bank holiday ${h.year} (England & Wales) is ${h.formatted} — the last Monday of August.`,
    description: (h) =>
      `UK Summer bank holiday ${h.year} falls on ${h.formatted} in England & Wales. Last-Monday rule, Scotland difference, and a printable August ${h.year} calendar.`,
    overview: (h) => [
      `In England, Wales, and Northern Ireland the Summer bank holiday is the last Monday of August. In ${h.year} that Monday is ${h.formatted}. It is one of the busiest UK getaway weekends of the year.`,
      `Scotland’s summer holiday pattern differs: the common August holiday there is the first Monday of August, not the last. Do not copy an England & Wales date onto a Scotland staff rota without checking.`,
      `Carnival and festival season (Notting Hill and many local events) often overlaps this weekend — book travel and lodging early.`,
    ],
    howCalculated: (h) =>
      `England & Wales rule: last Monday of August (last-weekday). Fresh Calendars resolves August ${h.year}’s last Monday to ${h.formatted}. Scotland’s first-Monday-of-August holiday is a separate scheduling item.`,
    meaningTitle: "The late-August long weekend",
    meaning: (h) => [
      `Historically tied to bank holiday acts that spread statutory leisure days through the year, the late-August Monday now functions as summer’s last national pause before September routines return.`,
      `For families it is often the final holiday before a new school year; for retailers it is a major sales weekend.`,
    ],
    planningTips: (h) => [
      `Block the last Monday of August on the August ${h.year} printable as soon as school-term dates appear.`,
      `Scotland teams: schedule the early-August Monday separately from this England & Wales date.`,
      `Roads to coasts and national parks congest — depart Saturday morning or travel mid-week either side if you can.`,
      `Pair with Early May and Spring bank holidays when sketching a full UK long-weekend map.`,
    ],
    faq: (h) => [
      {
        q: `Is the Summer bank holiday the same in Scotland?`,
        a: `Not usually. This page follows the England & Wales (and NI) last-Monday-of-August rule (${h.formatted} in ${h.year}). Scotland commonly observes the first Monday of August instead.`,
      },
      {
        q: `Why does the Summer bank holiday date change?`,
        a: `It is defined as the last Monday of August, so the day-of-month moves each year.`,
      },
    ],
  },

  juneteenth: {
    lead: (h) =>
      `Juneteenth ${h.year} is ${h.formatted} — Juneteenth National Independence Day, a US federal holiday on June 19.`,
    description: (h) =>
      `Juneteenth ${h.year} falls on ${h.formatted}. June 19 history (Galveston 1865), federal holiday status since 2021, and a printable June ${h.year} calendar.`,
    overview: (h) => [
      `Juneteenth National Independence Day is a US federal holiday observed on June 19. In ${h.year} that is a ${h.weekdayName}. It commemorates June 19, 1865, when Major General Gordon Granger’s General Order No. 3 announced in Galveston, Texas, that enslaved people were free under the Emancipation Proclamation.`,
      `Congress established the federal holiday in 2021. When June 19 falls on a weekend, federal in-lieu observances may shift the day off for federal employees — this when-is page reports the June 19 calendar date itself.`,
      `Celebrations often include education, music, food, and community gatherings. On a Fresh Calendars June sheet, Juneteenth sits near Flag Day (June 14) and Father's Day (third Sunday).`,
    ],
    howCalculated: (h) =>
      `Juneteenth uses a fixed-date rule: 19 June every year. Fresh Calendars maps June 19 ${h.year} to ${h.weekdayName}. Federal substitute days for weekend holidays are separate from the commemorative date shown here.`,
    meaningTitle: "Freedom Day on the federal calendar",
    meaning: (h) => [
      `Long celebrated in African American communities — especially in Texas — Juneteenth marks a delayed arrival of emancipation news and enforcement, not the Emancipation Proclamation’s 1863 effective date alone. The Thirteenth Amendment later abolished slavery nationwide.`,
      `As a federal holiday, it is a day for remembrance and celebration of freedom. Planners should treat it with the same closure expectations as other June federal holidays when booking travel or school events.`,
    ],
    planningTips: (h) => [
      `Mark June 19 on the June ${h.year} printable; if it is a weekend, also note any federal observed weekday your workplace follows.`,
      `Community events: check city calendars the first two weeks of June — festivals often land on the nearest weekend.`,
      `Pair Juneteenth with Father's Day on the same month grid so mid-June obligations do not collide.`,
      `Educators: reserve lesson time in the week of the 19th on a weekly planner, not only the holiday cell.`,
    ],
    faq: (h) => [
      {
        q: `Is Juneteenth ${h.year} a federal holiday?`,
        a: `Yes. Juneteenth National Independence Day is a US federal holiday on June 19 (${h.formatted} in ${h.year}).`,
      },
      {
        q: `What does Juneteenth commemorate?`,
        a: `It commemorates June 19, 1865, when Union forces in Galveston, Texas, announced that enslaved people were free — a key milestone in the end of slavery in the United States.`,
      },
    ],
  },
};

export function getHolidayEditorial(slug: string): HolidayEditorial | undefined {
  return EDITORIAL[slug];
}

export function buildHolidayFaq(
  def: HolidayDef,
  h: ResolvedHoliday,
  locale: HolidayLocale,
  path: string,
): FaqItem[] {
  const ed = getHolidayEditorial(def.slug);
  const base: FaqItem[] = [
    {
      q: `What date is ${h.name} in ${h.year}?`,
      a: `${h.name} ${h.year} falls on ${h.formatted}.`,
    },
    {
      q: `How is ${h.name} calculated?`,
      a: ed ? ed.howCalculated(h) : ruleHowCalculated(def, h),
    },
    {
      q: `Which printable calendar should I use for ${h.name} ${h.year}?`,
      a: printFaqAnswer(h, locale),
    },
    {
      q: "Does this page change every year?",
      a: `Yes. ${path} is evergreen: after ${h.name} ${h.year} passes, the page rolls to the next occurrence (same rolling logic as our monthly calendar URLs).`,
    },
  ];
  if (ed) base.push(...ed.faq(h));
  return base;
}
