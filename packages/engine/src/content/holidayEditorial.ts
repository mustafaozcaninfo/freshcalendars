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
      return `${name} is on the same date every year: ${monthNumberToName(rule.m)} ${rule.d}. In ${h.year} that is a ${h.weekdayName}.`;
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
      return `${name} is the ${ord} ${weekdayWord(rule)} of ${monthNumberToName(rule.m)}, so its date changes each year. In ${h.year} that is ${h.formatted}.`;
    }
    case "last_weekday":
      return `${name} is the last ${weekdayWord(rule)} of ${monthNumberToName(rule.m)}. In ${h.year} that is ${h.formatted}.`;
    case "weekday_on_or_before":
      return `${name} is the ${weekdayWord(rule)} on or before ${monthNumberToName(rule.m)} ${rule.d}. In ${h.year} that is ${h.formatted}.`;
    case "easter_offset": {
      const off = rule.offset;
      const rel =
        off === 0
          ? "Easter Sunday itself"
          : off > 0
            ? `${off} day${off === 1 ? "" : "s"} after Easter Sunday`
            : `${Math.abs(off)} day${Math.abs(off) === 1 ? "" : "s"} before Easter Sunday`;
      return `${name} moves with Western Easter: it is ${rel}. In ${h.year} that is ${h.formatted}.`;
    }
    case "offset_from":
      return `${name} is calculated as ${rule.days} day${rule.days === 1 ? "" : "s"} from ${rule.base.replace(/-/g, " ")}. In ${h.year} that is ${h.formatted}.`;
    default:
      return `${name} ${h.year} falls on ${h.formatted}.`;
  }
}

export function printFaqAnswer(
  h: ResolvedHoliday,
  locale: HolidayLocale,
): string {
  const month = monthNumberToName(h.month);
  if (locale === "uk") {
    return `Print the ${month} ${h.year} calendar and mark ${h.name} by hand. The other UK dates are on the UK holidays page.`;
  }
  if (locale === "ca") {
    return `Print the ${month} ${h.year} calendar and mark ${h.name} by hand. The other Canadian dates are on the Canada holidays page.`;
  }
  return `Print the ${month} ${h.year} calendar in the Holidays design, which names ${h.name} in its date box.`;
}

const EDITORIAL: Record<string, HolidayEditorial> = {
  "april-fools-day": {
    lead: (h) =>
      `April Fools' Day ${h.year} is ${h.weekdayName}, April 1.`,
    description: (h) =>
      `April Fools' Day ${h.year} falls on ${h.formatted}. History of the April 1 prank tradition and a printable April ${h.year} calendar to mark the day.`,
    overview: (h) => [
      `April Fools' Day is always on April 1, so the date is fixed and only the weekday changes from year to year. In ${h.year} it falls on a ${h.weekdayName}.`,
      `It is a cultural observance, not a public holiday, so banks, schools, and offices stay open. The custom is light pranks and hoaxes, mostly in the morning.`,
    ],
    howCalculated: (h) =>
      `April Fools' Day is always on April 1, so the weekday is the only thing that changes from year to year. In ${h.year} April 1 is a ${h.weekdayName}.`,
    meaningTitle: "Why April 1 stuck",
    meaning: (h) => [
      `The origins are debated, with explanations ranging from old calendar changes to early newspaper hoaxes. By the nineteenth century, harmless deception on April 1 was an established habit in English-speaking countries.`,
    ],
    planningTips: (h) => [
      `Circle April 1 ahead of time if it lands on a busy school or work day.`,
      `If you run a team chat or publish online, hold any joke posts until after real announcements go out.`,
      `Keep pranks harmless and avoid anything that could be mistaken for a real emergency.`,
    ],
    faq: (h) => [
      {
        q: `Is April Fools' Day ${h.year} a public holiday?`,
        a: `No. It is a cultural observance on April 1, so schools and employers normally stay open on ${h.formatted}.`,
      },
      {
        q: `Does April Fools' Day ever move?`,
        a: `No. It is always April 1; only the weekday changes, and in ${h.year} April 1 is a ${h.weekdayName}.`,
      },
    ],
  },

  "ash-wednesday": {
    lead: (h) =>
      `Ash Wednesday ${h.year} is ${h.formatted}, the start of Lent in Western churches.`,
    description: (h) =>
      `Ash Wednesday ${h.year} falls on ${h.formatted}. How Lent is counted from Easter and a printable ${monthNumberToName(h.month)} ${h.year} calendar.`,
    overview: (h) => [
      `Ash Wednesday is always 46 days before Easter Sunday, so the date moves each year along with Easter. In ${h.year} it falls on ${h.formatted}.`,
      `It opens Lent in Western Christian churches, and many hold services with ashes and begin fasting. It is a religious observance, not a day off work in the US.`,
    ],
    howCalculated: (h) =>
      `Ash Wednesday falls 46 days before Easter Sunday, so it moves with Easter from year to year. In ${h.year} that lands on ${h.formatted}.`,
    meaningTitle: "Lent, ashes, and the spring calendar",
    meaning: (h) => [
      `The name comes from the custom of marking the forehead with ash as a sign of repentance and mortality. Because Easter moves, Ash Wednesday can fall in February or March, about six and a half weeks before Easter.`,
    ],
    planningTips: (h) => [
      `Check the date each year rather than assuming last year's February or March day.`,
      `If you keep meatless Fridays, note each Friday from Ash Wednesday through Good Friday.`,
      `Confirm your local church's service times, which fill up quickly in the first week of Lent.`,
    ],
    faq: (h) => [
      {
        q: `Why is Ash Wednesday ${h.year} not the same date every year?`,
        a: `It is tied to Easter Sunday, 46 days earlier, and Easter moves each year, so Ash Wednesday reaches ${h.formatted} in ${h.year}.`,
      },
      {
        q: `Is Ash Wednesday a day off work?`,
        a: `Generally no in the US. It is a religious observance, not a federal holiday.`,
      },
    ],
  },

  "ca-boxing-day": {
    lead: (h) =>
      `Boxing Day in Canada ${h.year} is ${h.formatted}, December 26.`,
    description: (h) =>
      `Canadian Boxing Day ${h.year} falls on ${h.formatted}. Provincial holiday status, shopping-week planning, and a printable December ${h.year} calendar.`,
    overview: (h) => [
      `Boxing Day is on December 26 every year, so the date is fixed and the weekday changes. In ${h.year} it falls on a ${h.weekdayName}.`,
      `It is a statutory holiday in several provinces, including Ontario, British Columbia, and Alberta, and for federally regulated workplaces, though coverage differs elsewhere. Retailers treat the 26th and the days around it as one of the busiest shopping stretches after Christmas.`,
    ],
    howCalculated: (h) =>
      `Boxing Day is on December 26 every year, so only the weekday changes. In ${h.year} that is a ${h.weekdayName}.`,
    meaningTitle: "From servants' boxes to Boxing Week",
    meaning: (h) => [
      `The name is usually traced to the Christmas boxes of gifts or tips given to servants and tradespeople the day after Christmas. In Canada the day kept the Commonwealth date and grew into a commercial Boxing Week that can run past the 26th.`,
    ],
    planningTips: (h) => [
      `Mark December 25 and 26 together so the two-day Christmas close is clear.`,
      `Confirm whether your province grants Boxing Day as a paid statutory holiday.`,
      `If you work in retail or shipping, set staffing for Boxing Week early.`,
    ],
    faq: (h) => [
      {
        q: `Is Boxing Day a holiday everywhere in Canada in ${h.year}?`,
        a: `December 26 is widely observed and is statutory in several provinces and for many federally regulated employees, but provincial coverage is not universal. Verify your jurisdiction for ${h.year}.`,
      },
      {
        q: `Is Canadian Boxing Day the same as the US day after Christmas?`,
        a: `The date is the same, December 26, but the US does not treat it as a federal holiday.`,
      },
    ],
  },

  "ca-labour-day": {
    lead: (h) =>
      `Canada's Labour Day ${h.year} is ${h.formatted}, the first Monday of September.`,
    description: (h) =>
      `Canadian Labour Day ${h.year} falls on ${h.formatted}. First-Monday rule, federal holiday status, and a printable September ${h.year} calendar.`,
    overview: (h) => [
      `Canadian Labour Day is the first Monday of September, so the date moves each year. In ${h.year} that Monday is ${h.formatted}.`,
      `It is a federal general holiday and a statutory day across the provinces, widely taken as a long weekend. Canada uses the spelling Labour Day, while the US holiday that falls on the same Monday is Labor Day.`,
    ],
    howCalculated: (h) =>
      `Canadian Labour Day is the first Monday of September, so its date shifts each year. In ${h.year} the first Monday is ${h.formatted}.`,
    meaningTitle: "Workers' holiday, summer's bookend",
    meaning: (h) => [
      `Canadian Labour Day traces to nineteenth-century labour demonstrations and was recognized nationally in the 1890s. Parades and union events still mark the day, but for most households it works as the last long weekend before a full school and work September.`,
    ],
    planningTips: (h) => [
      `Block the long weekend once school supply lists arrive.`,
      `If you travel, expect Friday-to-Monday highways and trains to be busy.`,
      `Employers: confirm holiday pay rules for the first Monday of September.`,
    ],
    faq: (h) => [
      {
        q: `Is Labour Day ${h.year} the same date in Canada and the US?`,
        a: `Usually yes, because both use the first Monday of September. In ${h.year} that is ${h.formatted}.`,
      },
      {
        q: `Why does Labour Day move each year?`,
        a: `It is defined as the first Monday of September rather than a fixed date, so the day of the month shifts.`,
      },
    ],
  },

  "ca-national-day-truth": {
    lead: (h) =>
      `National Day for Truth and Reconciliation ${h.year} is ${h.formatted}, also marked as Orange Shirt Day.`,
    description: (h) =>
      `National Day for Truth and Reconciliation ${h.year} is ${h.formatted}. Federal holiday context, Orange Shirt Day and a printable calendar.`,
    overview: (h) => [
      `Canada's National Day for Truth and Reconciliation is on September 30 every year, so the date is fixed and the weekday changes. In ${h.year} it falls on a ${h.weekdayName}.`,
      `Parliament created the federal statutory holiday in 2021, and it honours First Nations, Inuit, and Métis Survivors of the residential school system, their families, and communities. It applies to federally regulated workplaces, while provincial and territorial status varies.`,
    ],
    howCalculated: (h) =>
      `September 30 is the fixed date every year, so only the weekday changes. In ${h.year} it falls on a ${h.weekdayName}.`,
    meaningTitle: "Orange Shirt Day and Call to Action 80",
    meaning: (h) => [
      `Orange Shirt Day grew from Phyllis Webstad's account of having her new orange shirt taken on her first day at a residential school, and wearing orange on September 30 became a gesture of remembrance. The federal holiday answered the Truth and Reconciliation Commission's Call to Action 80, writing that date into the national calendar.`,
    ],
    planningTips: (h) => [
      `Confirm whether your employer, federal or provincial, observes the day as a paid holiday.`,
      `Expect schools and workplaces to hold learning sessions, so set aside time that week.`,
      `Mark September 30 alongside Labour Day as the month's two main markers.`,
    ],
    faq: (h) => [
      {
        q: `Is National Day for Truth and Reconciliation the same as Orange Shirt Day?`,
        a: `They share September 30. Orange Shirt Day is the grassroots movement; the National Day for Truth and Reconciliation is the federal statutory holiday set in 2021.`,
      },
      {
        q: `Do all Canadian provinces get September 30 off?`,
        a: `It is a federal holiday for federally regulated employees, but provincial coverage differs, so check your province or territory for ${h.year}.`,
      },
    ],
  },

  "ca-thanksgiving": {
    lead: (h) =>
      `Canadian Thanksgiving ${h.year} is ${h.formatted}, the second Monday of October.`,
    description: (h) =>
      `Thanksgiving in Canada ${h.year} falls on ${h.formatted}. Second-Monday rule, how it differs from US Thanksgiving, and a printable October ${h.year} calendar.`,
    overview: (h) => [
      `Canadian Thanksgiving is the second Monday of October, so the date moves each year. In ${h.year} that Monday is ${h.formatted}.`,
      `It is a federal general holiday and statutory in most provinces and territories, with some exceptions, so verify locally. It is earlier than US Thanksgiving, which is the fourth Thursday of November.`,
    ],
    howCalculated: (h) =>
      `Canadian Thanksgiving is the second Monday of October, so its date changes each year. In ${h.year} that is ${h.formatted}.`,
    meaningTitle: "A Monday harvest holiday",
    meaning: (h) => [
      `Harvest thanksgiving traditions in Canada predate Confederation, and the modern second-Monday date was fixed nationally in 1957. Many families gather for a turkey dinner over the three-day weekend.`,
    ],
    planningTips: (h) => [
      `Circle the second Monday of October, not the US November date.`,
      `Book inter-city travel early, since the long weekend fills trains and highways.`,
      `Put grocery shopping on the Thursday or Friday before the dinner.`,
    ],
    faq: (h) => [
      {
        q: `Is Canadian Thanksgiving the same day as US Thanksgiving in ${h.year}?`,
        a: `No. Canada observes the second Monday of October (${h.formatted} in ${h.year}), while the US observes the fourth Thursday of November.`,
      },
      {
        q: `Why is Canadian Thanksgiving on a Monday?`,
        a: `Federal law sets it as the second Monday of October, which creates a consistent long weekend.`,
      },
    ],
  },

  // The slug resolves to the March start, so the previous November's
  // fall-back always lands inside the window this page is live for.
  "daylight-savings": {
    lead: (h) =>
      `Daylight saving time ${h.year} begins ${h.formatted}, when US clocks spring forward one hour at 2:00 a.m.`,
    description: (h) =>
      `Clocks fall back ${usDstFallBack(h.year - 1).formatted}, at 2:00 a.m. Daylight saving time ${h.year} starts ${h.formatted} in most of the US. Printable March calendar.`,
    overview: (h) => [
      `Under current US federal law, daylight saving time begins at 2:00 a.m. on the second Sunday of March and ends at 2:00 a.m. on the first Sunday of November. In ${h.year} it begins ${h.formatted} and ends ${usDstFallBack(h.year).formatted}.`,
      `Clocks last fell back on ${usDstFallBack(h.year - 1).formatted}, when 2:00 a.m. became 1:00 a.m. Arizona (except the Navajo Nation) and Hawaii stay on standard time all year.`,
    ],
    howCalculated: (h) =>
      `Daylight saving time begins on the second Sunday of March and ends on the first Sunday of November, so both dates move each year. In ${h.year} it starts ${h.formatted} at 2:00 a.m. local time, and the clocks had fallen back on ${usDstFallBack(h.year - 1).formatted}.`,
    meaningTitle: "Why the clocks still move",
    meaning: (h) => [
      `Daylight saving time shifts an hour of daylight into warmer evenings. Congress has debated making daylight saving or standard time permanent, but until the law changes the March and November pattern stays the default for most states.`,
    ],
    planningTips: (h) => [
      `Set phone alarms the night before each change so the hour shift does not catch you out.`,
      `Remote teams: announce the change on Friday, since not everyone notices by Monday.`,
      `Parents: shift children's bedtimes gradually in the days before the change.`,
    ],
    faq: (h) => [
      {
        q: `When do clocks fall back in ${h.year}?`,
        a: `On ${usDstFallBack(h.year).formatted}, the first Sunday of November, at 2:00 a.m. local time.`,
      },
      {
        q: `Does every US state change clocks on ${h.formatted}?`,
        a: `No. Hawaii and most of Arizona do not observe daylight saving time, so confirm local rules if you travel.`,
      },
    ],
  },

  "fathers-day": {
    lead: (h) =>
      `Father's Day ${h.year} in the US is ${h.formatted}, the third Sunday of June.`,
    description: (h) =>
      `Father's Day ${h.year} falls on ${h.formatted}. Third-Sunday rule, US observance history, gift and brunch planning, plus a printable June ${h.year} calendar.`,
    overview: (h) => [
      `US Father's Day falls on the third Sunday of June, so the date moves from year to year. In ${h.year} that Sunday is ${h.formatted}.`,
      `It is a widely observed celebration, not a federal holiday, so mail still runs and offices stay open. President Nixon signed a permanent national observance in 1972, and many other countries mark it on different weekends.`,
    ],
    howCalculated: (h) =>
      `Father's Day is the third Sunday of June, so its date changes each year. In ${h.year} the third Sunday is ${h.formatted}.`,
    meaningTitle: "Cards, calls, and a June Sunday",
    meaning: (h) => [
      `Sonora Smart Dodd promoted the holiday in the early twentieth century, and it centers gratitude for fathers and father figures of every kind. Because it always lands on a Sunday, the main planning limits are restaurant capacity and shipping cutoffs rather than closures.`,
    ],
    planningTips: (h) => [
      `Order gifts by the second week of June so they arrive in time.`,
      `Reserve brunch early in cities where the weekend sells out.`,
      `For long-distance families, set a video call so time zones do not erase the evening.`,
    ],
    faq: (h) => [
      {
        q: `Is Father's Day ${h.year} a federal holiday?`,
        a: `No. It is a US observance on the third Sunday of June (${h.formatted} in ${h.year}), and federal offices stay open.`,
      },
      {
        q: `Is US Father's Day the same weekend worldwide?`,
        a: `No. Many countries use other dates; this page follows the US rule of the third Sunday of June.`,
      },
    ],
  },

  "uk-early-may-bank-holiday": {
    lead: (h) =>
      `Early May bank holiday ${h.year} is ${h.formatted}, usually the first Monday of May across the UK.`,
    description: (h) =>
      `UK Early May bank holiday ${h.year} falls on ${h.formatted}. First-Monday rule, rare commemorative moves, and a printable May ${h.year} calendar.`,
    overview: (h) => [
      `The Early May bank holiday is normally the first Monday of May, so the date moves each year. In ${h.year} that Monday is ${h.formatted}.`,
      `It is a UK-wide bank holiday and a popular long weekend. Parliament occasionally moves it for major commemorations such as VE Day anniversaries, so check gov.uk if a shift is announced.`,
    ],
    howCalculated: (h) =>
      `The Early May bank holiday is normally the first Monday of May, so its date shifts each year. In ${h.year} that is ${h.formatted}.`,
    meaningTitle: "May Day weekend in modern form",
    meaning: (h) => [
      `The holiday sits near traditional May Day and International Workers' Day themes but is scheduled as a Monday for a reliable three-day weekend rather than always on 1 May. For schools and offices it often lands in the middle of exam or project season.`,
    ],
    planningTips: (h) => [
      `Book train seats before the Thursday prior, since travel rises on this weekend.`,
      `HR teams: check whether your nation publishes any substitution notices for the year.`,
      `Note the late-May Spring bank holiday too, as two May Mondays are common.`,
    ],
    faq: (h) => [
      {
        q: `Is the Early May bank holiday always May 1?`,
        a: `No. It is the first Monday of May, which only sometimes falls on 1 May. In ${h.year} it is ${h.formatted}.`,
      },
      {
        q: `Can the Early May holiday move for special events?`,
        a: `Yes. The UK has occasionally shifted it for commemorations, so confirm against the official bank holiday list.`,
      },
    ],
  },

  "uk-easter-monday": {
    lead: (h) =>
      `Easter Monday ${h.year} in the UK is ${h.formatted}, the bank holiday after Easter Sunday.`,
    description: (h) =>
      `UK Easter Monday ${h.year} falls on ${h.formatted}. Easter computus +1 day, bank-holiday planning, and a printable ${monthNumberToName(h.month)} ${h.year} calendar.`,
    overview: (h) => [
      `Easter Monday is the day after Easter Sunday, so it moves each year with Easter. In ${h.year} it falls on ${h.formatted}.`,
      `It is a UK bank holiday, and together with Good Friday it makes a four-day Easter weekend for much of the country. Scotland's bank-holiday pattern around Easter can differ, so confirm local observance.`,
    ],
    howCalculated: (h) =>
      `Easter Monday is the day after Easter Sunday, so it moves whenever Easter moves. In ${h.year} that is ${h.formatted}.`,
    meaningTitle: "The second half of Easter weekend",
    meaning: (h) => [
      `In the UK, Easter Monday continues the Easter Octave and is the recovery and travel day of the long weekend, with football fixtures, garden centres, and coastal roads all busy. Planners can treat Good Friday through Easter Monday as one block rather than separate days.`,
    ],
    planningTips: (h) => [
      `Treat Good Friday, Easter Sunday, and Easter Monday as one cluster.`,
      `Book UK travel early, as Easter weekend is a busy domestic getaway period.`,
      `Retail and hospitality: staff up for Friday and Monday, not only Sunday.`,
    ],
    faq: (h) => [
      {
        q: `Is Easter Monday ${h.year} the same in the US?`,
        a: `Easter Sunday's Western date matches, but Easter Monday is a UK bank holiday, not a US federal holiday; in the UK it is ${h.formatted}.`,
      },
      {
        q: `Why does UK Easter Monday move each year?`,
        a: `It is the Monday after Easter Sunday, and Easter itself moves each year.`,
      },
    ],
  },

  "uk-guy-fawkes-night": {
    lead: (h) =>
      `Guy Fawkes Night ${h.year} is ${h.formatted}, Bonfire Night on 5 November.`,
    description: (h) =>
      `Guy Fawkes Night ${h.year} falls on ${h.formatted}. Bonfire Night history, safety planning and a printable November ${h.year} calendar.`,
    overview: (h) => [
      `Guy Fawkes Night, also called Bonfire Night, is on 5 November every year, so the date is fixed and the weekday changes. In ${h.year} it falls on a ${h.weekdayName}.`,
      `It marks the failed Gunpowder Plot of 1605, when Guy Fawkes was arrested guarding explosives beneath Parliament. It is a cultural observance, not a bank holiday, and many displays run on the nearest weekend, so check local council dates.`,
    ],
    howCalculated: (h) =>
      `Guy Fawkes Night is on 5 November every year, so only the weekday changes. In ${h.year} the 5th is a ${h.weekdayName}.`,
    meaningTitle: "Remember, remember the Fifth of November",
    meaning: (h) => [
      `The rhyme and the effigy known as the Guy grew from early thanksgiving for the plot's failure, and modern events focus on fireworks and community bonfires more than politics. For households the practical concern is safety: sparklers, crowd exits, and animals frightened by fireworks.`,
    ],
    planningTips: (h) => [
      `Note any weekend display dates beside the 5th.`,
      `Keep pets indoors from about 4 to 6 November, when fireworks peak.`,
      `Expect local road closures near major displays, so check week-of notices.`,
    ],
    faq: (h) => [
      {
        q: `Is Guy Fawkes Night ${h.year} a bank holiday?`,
        a: `No. It is an observance on 5 November (${h.formatted} in ${h.year}), and banks and most offices stay open.`,
      },
      {
        q: `Do fireworks always happen on 5 November?`,
        a: `The traditional date is the 5th, but many public displays move to the nearest Friday or Saturday.`,
      },
    ],
  },

  "uk-new-years-day": {
    lead: (h) =>
      `New Year's Day ${h.year} in the UK is ${h.formatted}, a public holiday on 1 January.`,
    description: (h) =>
      `UK New Year's Day ${h.year} falls on ${h.formatted}. Public holiday rules, Hogmanay context, and a printable January ${h.year} calendar.`,
    overview: (h) => [
      `New Year's Day is a UK public holiday on 1 January every year, so the date is fixed and the weekday changes. In ${h.year} it falls on a ${h.weekdayName}.`,
      `When 1 January lands on a weekend, a substitute weekday holiday is usually added. In Scotland, 2 January is also a bank holiday, tied to Hogmanay celebrations.`,
    ],
    howCalculated: (h) =>
      `New Year's Day is on 1 January every year, so only the weekday changes. In ${h.year} that is ${h.weekdayName}, ${h.formatted}.`,
    meaningTitle: "First public holiday of the civil year",
    meaning: (h) => [
      `New Year's Day closes Hogmanay night and opens the civil year. Travel, hospitality, and healthcare rotas can treat 31 December and 1 January as a single peak period.`,
    ],
    planningTips: (h) => [
      `Note any substitute weekday if 1 January falls on a weekend.`,
      `In Scotland, also block 2 January in staff rotas.`,
      `Plan last-train or night travel for 31 December in advance.`,
    ],
    faq: (h) => [
      {
        q: `Is 2 January a holiday across the UK in ${h.year}?`,
        a: `2 January is a bank holiday in Scotland; England, Wales, and Northern Ireland do not universally observe it. New Year's Day itself is ${h.formatted}.`,
      },
      {
        q: `What if New Year's Day falls on a Sunday?`,
        a: `1 January remains New Year's Day, and the government usually adds a substitute bank holiday on the next weekday.`,
      },
    ],
  },

  "uk-new-years-eve": {
    lead: (h) =>
      `New Year's Eve ${h.year} is ${h.formatted}, 31 December, the day before the New Year's Day holiday.`,
    description: (h) =>
      `UK New Year's Eve ${h.year} falls on ${h.formatted}. Hogmanay and London countdown planning, plus a printable December ${h.year} calendar.`,
    overview: (h) => [
      `New Year's Eve is on 31 December every year, so the date is fixed and the weekday changes. In ${h.year} it is a ${h.weekdayName}.`,
      `It is not a UK bank holiday, though many offices close early and cities run major events such as the London fireworks and Edinburgh's Hogmanay. Travel and hospitality demand peaks even more than on New Year's Day.`,
    ],
    howCalculated: (h) =>
      `New Year's Eve is on 31 December every year, so only the weekday changes. In ${h.year} that is a ${h.weekdayName}.`,
    meaningTitle: "Hogmanay eve and city countdowns",
    meaning: (h) => [
      `In Scotland, Hogmanay traditions such as first-footing and street parties make New Year's Eve a cultural highlight. Elsewhere in the UK, public fireworks and hospitality bookings dominate, and for most households safety and transport matter more than ceremony.`,
    ],
    planningTips: (h) => [
      `Buy tickets early for Thames and Edinburgh events, which sell out.`,
      `Decide babysitting or family-friendly plans by mid-December.`,
      `Plan night travel home before the evening, since transport fills up.`,
    ],
    faq: (h) => [
      {
        q: `Is New Year's Eve ${h.year} a bank holiday?`,
        a: `No. 31 December (${h.formatted}) is an observance; the public holiday is New Year's Day on 1 January.`,
      },
      {
        q: `When should I plan Hogmanay travel?`,
        a: `Book lodging and transport weeks ahead of ${h.formatted}, as demand outpaces most bank-holiday weekends.`,
      },
    ],
  },

  "uk-remembrance-sunday": {
    lead: (h) =>
      `Remembrance Sunday ${h.year} is ${h.formatted}, the second Sunday of November.`,
    description: (h) =>
      `Remembrance Sunday ${h.year} falls on ${h.formatted}. Two-minute silence, Cenotaph timing, and a printable November ${h.year} calendar.`,
    overview: (h) => [
      `Remembrance Sunday is the second Sunday of November, so the date moves each year. In ${h.year} that Sunday is ${h.formatted}.`,
      `Services across the UK honour those who died in war, with the national ceremony at the Cenotaph in London. It is not a bank holiday, and many people also keep a two-minute silence at 11:00 a.m. on 11 November.`,
    ],
    howCalculated: (h) =>
      `Remembrance Sunday is the second Sunday of November, so its date changes each year. In ${h.year} that is ${h.formatted}.`,
    meaningTitle: "Poppies, silence, and November",
    meaning: (h) => [
      `The red poppy appeal and local war-memorial services are the public face of the weekend, and coverage usually begins the week before. Armistice Day on 11 November and Remembrance Sunday are kept distinct so neither the service nor the silence is missed.`,
    ],
    planningTips: (h) => [
      `Write "11:00 silence" on 11 November as well as the Sunday service.`,
      `Expect closures around Whitehall on the Sunday morning if traveling into central London.`,
      `Note Bonfire Night on 5 November, which precedes Remembrance week.`,
    ],
    faq: (h) => [
      {
        q: `Is Remembrance Sunday the same as Armistice Day?`,
        a: `Armistice Day is always 11 November, while Remembrance Sunday is the second Sunday of November (${h.formatted} in ${h.year}). They coincide only when 11 November is a Sunday.`,
      },
      {
        q: `Is Remembrance Sunday ${h.year} a bank holiday?`,
        a: `No. It is a national observance, and most workplaces stay open, though many pause for the silence.`,
      },
    ],
  },

  "uk-summer-bank-holiday": {
    lead: (h) =>
      `Summer bank holiday ${h.year} in England and Wales is ${h.formatted}, the last Monday of August.`,
    description: (h) =>
      `UK Summer bank holiday ${h.year} falls on ${h.formatted} in England & Wales. Last-Monday rule, Scotland difference, and a printable August ${h.year} calendar.`,
    overview: (h) => [
      `In England, Wales, and Northern Ireland the Summer bank holiday is the last Monday of August, so the date moves each year. In ${h.year} that Monday is ${h.formatted}.`,
      `It is one of the busiest UK getaway weekends. Scotland differs, usually observing the first Monday of August instead, so do not copy this date onto a Scotland rota.`,
    ],
    howCalculated: (h) =>
      `In England and Wales the Summer bank holiday is the last Monday of August, so its date changes each year. In ${h.year} that is ${h.formatted}.`,
    meaningTitle: "The late-August long weekend",
    meaning: (h) => [
      `Tied to the bank holiday acts that spread statutory leisure days through the year, the late-August Monday now works as summer's last national pause before September routines return. For families it is often the final holiday before a new school year, and for retailers a busy sales weekend.`,
    ],
    planningTips: (h) => [
      `Block the last Monday of August once school-term dates appear.`,
      `Scotland teams: schedule the early-August Monday separately.`,
      `Depart Saturday morning or travel mid-week, as roads to the coast congest.`,
    ],
    faq: (h) => [
      {
        q: `Is the Summer bank holiday the same in Scotland?`,
        a: `Not usually. England, Wales, and Northern Ireland use the last Monday of August (${h.formatted} in ${h.year}), while Scotland commonly observes the first Monday of August.`,
      },
      {
        q: `Why does the Summer bank holiday date change?`,
        a: `It is defined as the last Monday of August, so the day of the month moves each year.`,
      },
    ],
  },

  juneteenth: {
    lead: (h) =>
      `Juneteenth ${h.year} is ${h.formatted}, a US federal holiday on June 19.`,
    description: (h) =>
      `Juneteenth ${h.year} falls on ${h.formatted}. June 19 history (Galveston 1865), federal holiday status since 2021, and a printable June ${h.year} calendar.`,
    overview: (h) => [
      `Juneteenth National Independence Day is a US federal holiday on June 19 every year, so the date is fixed and the weekday changes. In ${h.year} it falls on a ${h.weekdayName}.`,
      `It marks June 19, 1865, when General Order No. 3 announced in Galveston, Texas, that enslaved people were free under the Emancipation Proclamation. Congress established the federal holiday in 2021.`,
    ],
    howCalculated: (h) =>
      `Juneteenth is on June 19 every year, so only the weekday changes. In ${h.year} the 19th is a ${h.weekdayName}.`,
    meaningTitle: "Freedom Day on the federal calendar",
    meaning: (h) => [
      `Long celebrated in African American communities, especially in Texas, Juneteenth marks the delayed arrival of emancipation news and enforcement rather than the Emancipation Proclamation's 1863 date alone. The Thirteenth Amendment later abolished slavery nationwide.`,
    ],
    planningTips: (h) => [
      `If June 19 is a weekend, note the observed weekday your workplace follows.`,
      `Check city calendars in early June, as festivals often land on the nearest weekend.`,
      `Educators: reserve lesson time in the week of the 19th.`,
    ],
    faq: (h) => [
      {
        q: `Is Juneteenth ${h.year} a federal holiday?`,
        a: `Yes. Juneteenth National Independence Day is a US federal holiday on June 19 (${h.formatted} in ${h.year}).`,
      },
      {
        q: `What does Juneteenth commemorate?`,
        a: `It marks June 19, 1865, when Union forces in Galveston, Texas, announced that enslaved people were free, a milestone in the end of slavery in the US.`,
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
      a: `Yes. Once ${h.name} ${h.year} has passed, this page shows the next date.`,
    },
  ];
  if (ed) base.push(...ed.faq(h));
  return base;
}
