---
title: "Date Format by Country: MM/DD vs DD/MM in 27 Locales"
description: "Date formats by country: in Common Locale Data Repository (CLDR) 48, Jan. 2, 2027 is 01/02/2027 in U.S. English and 02/01/2027 in British English."
type: explainer
publishedAt: "2026-11-04T15:57:00-05:00"
updatedAt: "2026-11-04T15:57:00-05:00"
authors: [jessica-hartwell]
category: calendar-guides
keywords: ["date format by country", "01/02/2027 meaning", "mm/dd/yyyy vs dd/mm/yyyy", "which countries use mm dd yyyy"]
hero:
  src: ../../../../assets/news/date-formats-by-country-mm-dd-dd-mm/date-formats-by-country-mm-dd-dd-mm.webp
  alt: "An office date stamp with an ink pad, illustrating date formats by country"
  caption: "A Czech office date stamp with an ink pad, photographed by Jiří Sedláček (Frettie). Our table shows how 27 locales write Jan. 2, 2027."
  credit: "Photo: Jiří Sedláček (Frettie) / Wikimedia Commons, cropped, edited"
  license:
    name: "CC BY 3.0"
    url: "https://creativecommons.org/licenses/by/3.0"
    source: "https://commons.wikimedia.org/wiki/File:Czech_office_time_stamp_with_inkpillow.jpg"
    author: "Jiří Sedláček (Frettie)"
summary:
  - "In CLDR 48 locale data, Jan. 2, 2027 is 01/02/2027 for U.S. English and 02/01/2027 for the United Kingdom, so the text 01/02/2027 means Jan. 2 to one reader and Feb. 1 to another."
  - "Of 27 locales we computed, 2 write the month first, 16 write the day first and 9 write the year first."
  - "By our count, 132 of the 144 month-and-day pairs from 01/01 to 12/12 read two ways; only 12, such as 03/03, read the same either way."
  - "The International Organization for Standardization (ISO) writes the date as YYYY-MM-DD, so Jan. 2, 2027 is 2027-01-02 and has one reading."
faq:
  - q: "What does 01/02/2027 mean?"
    a: "A month-first reader, as in U.S. English locale data, takes it as Jan. 2, 2027. A day-first reader, as in British English locale data, takes it as Feb. 1, 2027. The text alone does not say which."
  - q: "Which countries use MM/DD/YYYY?"
    a: "In the 27 locales we computed from CLDR 48, only U.S. English and Philippine English put the month first. Locale defaults are not laws, and people and agencies in any country may use other forms."
  - q: "Which date format avoids confusion?"
    a: "The ISO date, YYYY-MM-DD, as in 2027-01-02. A four-digit number in first place can only be the year, so the date has one reading."
  - q: "Does U.S. government style require month first?"
    a: "The U.S. Government Publishing Office (GPO) Style Manual 2016 shows written-out dates such as June 29, 1985. It gives no rule for all-numeric order, so we do not claim it requires MM/DD."
  - q: "Do all locales use the Gregorian calendar by default?"
    a: "No. In our run, the Persian locale fa-IR showed the Solar Hijri date 1405/10/12 for Jan. 2, 2027 by default."
sources:
  - title: "CLDR 48 charts: Date and time, Gregorian calendar"
    url: "https://www.unicode.org/cldr/charts/48/by_type/date_&_time.gregorian.html"
    publisher: "Unicode Consortium"
  - title: "Unicode Common Locale Data Repository (CLDR)"
    url: "https://cldr.unicode.org/"
    publisher: "Unicode Consortium"
  - title: "ISO 8601: international standard for date and time format"
    url: "https://help.iso.org/en/articles/376284-iso-8601-international-standard-for-date-and-time-format"
    publisher: "International Organization for Standardization"
    date: "2025-07-31"
  - title: "GPO Style Manual 2016, chapter 12: Numerals"
    url: "https://www.govinfo.gov/content/pkg/GPO-STYLEMANUAL-2016/pdf/GPO-STYLEMANUAL-2016-14.pdf"
    publisher: "U.S. Government Publishing Office"
    date: "2016-01-01"
  - title: "A to Z style guide"
    url: "https://www.gov.uk/guidance/style-guide/a-to-z-of-gov-uk-style"
    publisher: "GOV.UK"
internalLinks:
  - href: "/january-calendars.html"
    label: "January printable calendar"
  - href: "/printable-yearly-calendar.html"
    label: "Printable yearly calendar"
related: [what-is-iso-8601, iso-week-numbers-explained]
downloads:
  - group: "Date Formats by Country Reference Card printables"
    title: "Date Formats by Country Reference Card, 2027"
    description: "One-page reference card of how 27 locales write Jan. 2, 2027 from CLDR 48 data, grouped by month-first, day-first and year-first order, with the ISO date."
    preview: ../../../../assets/news/date-formats-2027/date-formats-by-country-reference-card-2027.png
    alt: "Printable date formats by country reference card for 2027 with locales grouped by month-first, day-first and year-first order"
    pdf: "/news/downloads/date-formats-2027/date-formats-by-country-reference-card-2027.pdf"
    png: "/news/downloads/date-formats-2027/date-formats-by-country-reference-card-2027.png"
    pages: 1
draft: false
assets:
  overlay: true
  kicker: "Date formats · 01/02/2027"
  card: { top: "Jan. 2 in the US", big: "01/02", bottom: "1 Feb in the UK" }
  printable:
    kit: planner
    slug: date-formats-by-country-reference-card-2027
    group: date-formats-2027
    title: "Date Formats by Country Reference Card, 2027"
    subtitle: "How 27 locales write Jan. 2, 2027, and the year-first fix"
    data:
      sections:
        - type: checklist
          title: "Month first: MM/DD/YYYY (CLDR 48)"
          groups:
            - title: "Locales that write the month first"
              items:
                - "United States (en-US): 1/2/27 or 01/02/2027"
                - "Philippines (en-PH): 1/2/27 or 01/02/2027"
        - type: checklist
          title: "Day first: DD/MM/YYYY (CLDR 48)"
          groups:
            - title: "Locales that write the day first"
              items:
                - "United Kingdom (en-GB): 02/01/2027"
                - "Australia (en-AU): 2/1/27 or 02/01/2027"
                - "India (en-IN): 02/01/27 or 02/01/2027"
                - "New Zealand (en-NZ) and Ireland (en-IE): 02/01/2027"
                - "Germany (de-DE) and Switzerland (de-CH): 02.01.27"
                - "France (fr-FR) and Brazil (pt-BR): 02/01/2027"
                - "Italy (it-IT) and Mexico (es-MX): 02/01/27"
                - "Spain (es-ES): 2/1/27 or 02/01/2027"
                - "Netherlands (nl-NL): 02-01-2027"
                - "Poland (pl-PL) and Turkey (tr-TR): 2.01.2027"
                - "Russia (ru-RU): 02.01.2027"
        - type: checklist
          title: "Year first: YYYY-MM-DD (CLDR 48)"
          groups:
            - title: "Locales that write the year first"
              items:
                - "Canada (en-CA and fr-CA), Sweden (sv-SE), Lithuania (lt-LT): 2027-01-02"
                - "South Africa (en-ZA) and Japan (ja-JP): 2027/01/02"
                - "China (zh-CN): 2027/1/2"
                - "South Korea (ko-KR): 27. 1. 2. or 2027. 01. 02."
                - "Hungary (hu-HU): 2027. 01. 02."
        - type: table
          title: "Dates I write often"
          columns: ["Date I mean", "Month first", "Day first", "ISO form"]
          rows: 5
      rules:
        - { text: "ISO writes the date as YYYY-MM-DD (year-month-day); Sept. 6, 2022 is 2022-09-06.", src: 3, quote: "Date expressed as YYYY-MM-DD (year-month-day)." }
    note: "Source: Unicode CLDR 48 locale data, short date for Jan. 2, 2027, computed by Fresh Calendars; ISO help center, ISO 8601 (July 31, 2025). Locale defaults are not laws."
    description: "One-page reference card of how 27 locales write Jan. 2, 2027 from CLDR 48 data, grouped by month-first, day-first and year-first order, with the ISO date."
    alt: "Printable date formats by country reference card for 2027 with locales grouped by month-first, day-first and year-first order"
---

**Computed from CLDR 48 locale data, 01/02/2027 means Jan. 2, 2027 in U.S. English and Feb. 1, 2027 in the United Kingdom (UK), because month/day (MM/DD) and day/month (DD/MM) orders look the same on the page.** CLDR is the Common Locale Data Repository published by the Unicode Consortium; operating systems and browsers draw on locale data like it. We computed the short date for Jan. 2, 2027 in 27 locales and grouped them by order below. The fix, the International Organization for Standardization (ISO) date `2027-01-02`, follows the tables, and a one-page reference card to print is at the end.

## How do 27 locales write Jan. 2, 2027?

We formatted Jan. 2, 2027 with CLDR 48 data through International Components for Unicode (ICU) 78.3, using the `short` date style of the JavaScript `Intl.DateTimeFormat` application programming interface (API) in Node.js, and again with a two-digit month, two-digit day and four-digit year. These are locale defaults, not laws. A country's people and agencies may also use other forms, and the result depends on the locale, not on the country alone.

### Month first (MM/DD/YYYY)

| Locale | Short style | Two-digit style |
|---|---|---|
| United States (en-US) | 1/2/27 | 01/02/2027 |
| Philippines (en-PH) | 1/2/27 | 01/02/2027 |

### Day first (DD/MM/YYYY)

| Locale | Short style | Two-digit style |
|---|---|---|
| United Kingdom (en-GB) | 02/01/2027 | 02/01/2027 |
| Australia (en-AU) | 2/1/27 | 02/01/2027 |
| India (en-IN) | 02/01/27 | 02/01/2027 |
| New Zealand (en-NZ) | 02/01/2027 | 02/01/2027 |
| Ireland (en-IE) | 02/01/2027 | 02/01/2027 |
| Germany (de-DE) | 02.01.27 | 02.01.2027 |
| Switzerland (de-CH) | 02.01.27 | 02.01.2027 |
| France (fr-FR) | 02/01/2027 | 02/01/2027 |
| Italy (it-IT) | 02/01/27 | 02/01/2027 |
| Spain (es-ES) | 2/1/27 | 02/01/2027 |
| Mexico (es-MX) | 02/01/27 | 02/01/2027 |
| Brazil (pt-BR) | 02/01/2027 | 02/01/2027 |
| Netherlands (nl-NL) | 02-01-2027 | 02-01-2027 |
| Poland (pl-PL) | 2.01.2027 | 02.01.2027 |
| Russia (ru-RU) | 02.01.2027 | 02.01.2027 |
| Turkey (tr-TR) | 2.01.2027 | 02.01.2027 |

### Year first (YYYY-MM-DD)

| Locale | Short style | Two-digit style |
|---|---|---|
| Canada, English (en-CA) | 2027-01-02 | 2027-01-02 |
| Canada, French (fr-CA) | 2027-01-02 | 2027-01-02 |
| Sweden (sv-SE) | 2027-01-02 | 2027-01-02 |
| Lithuania (lt-LT) | 2027-01-02 | 2027-01-02 |
| South Africa (en-ZA) | 2027/01/02 | 2027/01/02 |
| Japan (ja-JP) | 2027/01/02 | 2027/01/02 |
| China (zh-CN) | 2027/1/2 | 2027/01/02 |
| South Korea (ko-KR) | 27. 1. 2. | 2027. 01. 02. |
| Hungary (hu-HU) | 2027. 01. 02. | 2027. 01. 02. |

Of the 27 locales, 2 put the month first, 16 put the day first and 9 put the year first. Short styles that drop the leading zero, such as `2/1/27` in Spain and Australia, read the same way as the two-digit forms; the order is what matters. Canada appears only as the CLDR defaults for Canadian English and French. We did not confirm any Canadian government rule for date format, so this story does not state one.

Some locales default to another calendar altogether. In our run, the Persian locale fa-IR showed the Solar Hijri date `1405/10/12` for Jan. 2, 2027, so a date can differ by calendar as well as by order.

## Which dates read two ways in 2027?

Any day number from 13 to 31 can only be a day, so a date such as 13/01/2027 has one reading. A date is ambiguous when both numbers are 12 or lower and they differ. By our computation, there are 144 pairs from 01/01 to 12/12, and every one is a real date in 2027. Of those, 132 read two ways. The other 12, from 01/01 to 12/12 with matching numbers, read the same either way.

| Written as | Month first reads | Day first reads |
|---|---|---|
| 01/02/2027 | Jan. 2, 2027 | Feb. 1, 2027 |
| 03/04/2027 | Mar. 4, 2027 | Apr. 3, 2027 |
| 05/06/2027 | May 6, 2027 | June 5, 2027 |
| 07/08/2027 | July 8, 2027 | Aug. 7, 2027 |
| 11/12/2027 | Nov. 12, 2027 | Dec. 11, 2027 |
| 03/03/2027 | Mar. 3, 2027 | Mar. 3, 2027 (same) |

The same slash-style trap shows up in [what ISO 8601 is](/news/what-is-iso-8601/), where `05/01/2026` is May 1 or Jan. 5 depending on the reader.

## What is the ISO fix for MM/DD versus DD/MM?

ISO's help center describes the date as "YYYY-MM-DD (year-month-day)" and gives the example "2022-09-06" for Sept. 6, 2022 (July 31, 2025). Under that rule, Jan. 2, 2027 is `2027-01-02`. A four-digit number in first place can only be the year, so the text has one reading whatever the reader's habit. Several locales in our table already default to year-first forms, including Canadian English and French, Sweden, Lithuania and Hungary.

The wider format, including times and the `Z` suffix, is in our [ISO 8601 guide](/news/what-is-iso-8601/). Week dates such as `2026-W53-5` for Jan. 1, 2027 are in [ISO week numbers explained](/news/iso-week-numbers-explained/).

## What do U.S. and U.K. government style guides say?

Two style guides settle the written-out form, not the all-numeric one.

| Guide | What it says |
|---|---|
| U.S. Government Publishing Office (GPO) Style Manual 2016, rule 12.9c | Examples: "June 29, 1985 (not June 29th, 1985)" and "June 1985 (not June, 1985)" |
| GOV.UK A to Z style guide | "Do not use ordinal numbers for the day", as in "2 June and not 2nd June"; "do not use a comma between the month and year", as in "4 June 2017" |

The GPO manual gives no rule for all-numeric order, so we do not claim it requires MM/DD. We also did not confirm style rules from other governments, such as those of Canada, Australia or the European Union, because the pages were not reachable for us.

## How do you write a date so nobody misreads it?

1. Spell out the month when space allows: Jan. 2, 2027 in U.S. style or 2 January 2027 in the day-first style that GOV.UK uses.
2. In tables, filenames and data that cross borders, use `2027-01-02`.
3. Treat any slash date with both numbers at 12 or lower as ambiguous, and add the month name.
4. Keep the year at four digits, since `1/2/27` adds a second question about the century.

For planning, our [January printable calendar](/january-calendars.html) and [printable yearly calendar](/printable-yearly-calendar.html) show every date with its month name.

## Date formats reference card to print

The free one-page card lists the 27 locales by order, adds the ISO rule and leaves five blank rows for the dates you write most often, with room for the month-first, day-first and ISO forms. It follows the table above and carries the CLDR 48 and ISO sources.
