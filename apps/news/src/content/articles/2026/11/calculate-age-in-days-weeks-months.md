---
title: "How to Calculate Your Age in Days, Weeks and Months, With Leap Years"
seoTitle: "Age in Days: How to Calculate Weeks, Months, Leap Years"
description: "Someone born Jan. 1, 1960 is 24,472 days old on Jan. 1, 2027. Worked age-in-days examples for five birthdays, with leap days counted and Excel formulas."
type: explainer
publishedAt: "2026-11-04T15:00:00-05:00"
authors: [jessica-hartwell]
category: calendar-guides
keywords: ["age in days", "how many days old am i", "how to calculate age in excel", "age in weeks", "leap day birthday age"]
hero:
  src: ../../../../assets/news/calculate-age-in-days-weeks-months/calculate-age-in-days-weeks-months.webp
  alt: "A birthday cake with number candles, the starting point for working out your age in days"
  caption: "File photo of a birthday cake with candles. Our worked examples count every day from five birthdays to Jan. 1, 2027."
  credit: "PLACEHOLDER"
  license:
    name: "CC0"
    url: "http://creativecommons.org/publicdomain/zero/1.0/deed.en"
    source: "https://commons.wikimedia.org/wiki/File:Tim_Tams_and_Nuts_on_a_Birthday_Cake_With_Candles.jpg"
    author: "Brassluff"
    authorUrl: "https://commons.wikimedia.org/wiki/User:Brassluff"
summary:
  - "Born Jan. 1, 1960: 67 years, 0 months, 0 days old on Jan. 1, 2027, which is 24,472 days, or 3,496 weeks exactly, and the span holds 17 leap days."
  - "Whole years first, then whole months, then days: 365 days for each year plus one extra day for each Feb. 29 in the span."
  - "The U.S. Naval Observatory (USNO) says 2000 was a leap year, so a person born Mar. 1, 2000 has lived 6 leap days by Jan. 1, 2027 and one born Feb. 29, 2000 has lived 6 more days than that, 9,803 in all."
  - "Microsoft's Calculate age page uses YEAR(NOW())-YEAR(A2), which gives 47 for a June 15, 1980 birthday on Jan. 1, 2027; the real age is 46."
faq:
  - q: "How many days old am I?"
    a: "Subtract your birth date from today's date. In a spreadsheet, =TODAY()-A2 does it when A2 holds the birth date. By hand, count 365 days for each whole year, add one day for every Feb. 29 in between, then add the days since your last birthday."
  - q: "How do I find my age in weeks?"
    a: "Divide your total days by 7 and drop the remainder. In a spreadsheet, =INT((TODAY()-A2)/7) does it. A person born June 15, 1980 is 17,001 days old on Jan. 1, 2027, which is 2,428 weeks and 5 days."
  - q: "Does a leap year change my age in days?"
    a: "Yes. Each Feb. 29 between your birth date and the day you count to adds one day. From Jan. 1, 1960 to Jan. 1, 2027 there are 17 of them."
  - q: "When does a person born on Feb. 29 turn a year older in a common year?"
    a: "It depends on the place. Scotland's Age of Legal Capacity (Scotland) Act 1991, section 6(2), takes the anniversary to be Mar. 1. We found no written rule for U.S. federal law or for England and Wales, so do not assume Feb. 28 or Mar. 1 applies to a form or a contract."
  - q: "Why does Excel DATEDIF sometimes give a wrong answer?"
    a: "Microsoft says the function may calculate incorrect results in certain scenarios and does not recommend its \"MD\" argument, which may return a negative number, a zero or an inaccurate result."
sources:
  - title: "Calculate age"
    url: "https://support.microsoft.com/en-US/Excel/calculate-age"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "DATEDIF function"
    url: "https://support.microsoft.com/en-us/excel/datedif-function"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "DATEDIF"
    url: "https://support.google.com/docs/answer/6055612"
    publisher: "Google Docs Editors Help"
    date: "2026-11-04"
  - title: "Introduction to Calendars"
    url: "https://aa.usno.navy.mil/faq/calendars"
    publisher: "U.S. Naval Observatory"
    date: "2026-11-04"
  - title: "Age of Legal Capacity (Scotland) Act 1991, section 6"
    url: "https://www.legislation.gov.uk/ukpga/1991/50/section/6"
    publisher: "legislation.gov.uk"
    date: "2026-11-04"
  - title: "POMS GN 00302.400"
    url: "https://secure.ssa.gov/POMS.NSF/lnx/0200302400"
    publisher: "U.S. Social Security Administration"
    date: "2026-03-04"
internalLinks:
  - href: "/january-calendars.html"
    label: "January 2027 printable calendar"
  - href: "/printable-yearly-calendar.html"
    label: "Printable yearly calendar"
related: [count-days-between-dates-excel-google-sheets, what-is-a-leap-year, how-to-calculate-day-of-year]
draft: false
assets:
  overlay: true
  kicker: "Age in days · Worked examples"
  card: { top: "Born Jan. 1, 1960, on Jan. 1, 2027", big: "24,472 days", bottom: "67 years and 17 leap days" }
  printable:
    kit: planner
    slug: age-in-days-worksheet-2027
    group: age-in-days-2027
    title: "Age in Days Worksheet 2027"
    subtitle: "Years, months, days, leap days and weeks, step by step"
    data:
      sections:
        - type: lines
          title: "Your dates"
          labels: ["Birth date", "Date you count to"]
        - type: checklist
          title: "Method"
          groups:
            - title: "Age in years, months and days"
              items: ["Count whole years from the birth date to the last anniversary", "Count whole months from that anniversary", "Count the days left until the count-to date"]
            - title: "Total days and weeks"
              items: ["Whole years x 365", "Add 1 day for each Feb. 29 after the birth date and before the count-to date", "Add the days from the last anniversary to the count-to date", "Divide the total by 7: whole weeks, then days left over"]
        - type: table
          title: "Leap days in your span"
          columns: ["Feb. 29 year", "Divisible by 4?", "Century year? Divisible by 400?"]
          rows: 6
        - type: table
          title: "Your answer"
          columns: ["Years, months, days", "Total days", "Weeks and days", "Complete months"]
          rows: 3
      rules:
        - { text: "Leap year: divisible by 4, except centurial years not divisible by 400 (U.S. Naval Observatory).", src: 4, quote: "Every year that is exactly divisible by four is a leap year, except for years that are exactly divisible by 100, but these centurial years are leap years if they are exactly divisible by 400." }
    note: "Source: U.S. Naval Observatory, Introduction to Calendars. Worked method and examples by Fresh Calendars, counted to Jan. 1, 2027."
    description: "One-page age in days worksheet: whole years, months and days, leap days to count, total days and weeks, with the Gregorian leap year rule."
    alt: "Printable age in days worksheet with lines for dates, a method checklist and blank tables for leap days and totals"
---

Someone born Jan. 1, 1960 is 24,472 days old on Jan. 1, 2027: 67 years of 365 days plus 17 leap days. The leap day rule comes from the U.S. Naval Observatory (USNO), which says every year divisible by four is a leap year, "except for years that are exactly divisible by 100, but these centurial years are leap years if they are exactly divisible by 400." Below are five worked birthdays, the by-hand method, the Microsoft Excel and Google Sheets formulas, and a free printable worksheet.

## Age in days, weeks and months on Jan. 1, 2027

We counted each birthday to Jan. 1, 2027 with a short script on UTC dates and checked each row by hand. Total days is the number of days from the birth date to Jan. 1, 2027. "Leap days" counts each Feb. 29 after the birth date and before Jan. 1, 2027. The two Feb. 29 rows use Mar. 1 as the anniversary in common years, the convention in Scotland's 1991 law (see below); a Feb. 28 anniversary changes only the leftover days, which become 4.

| Birth date | Age (years, months, days) | Total days | Weeks and days | Complete months | Leap days |
|---|---|---|---|---|---|
| Jan. 1, 1960 | 67 y, 0 m, 0 d | 24,472 | 3,496 weeks, 0 days | 804 | 17 |
| June 15, 1980 | 46 y, 6 m, 17 d | 17,001 | 2,428 weeks, 5 days | 558 | 11 |
| Mar. 1, 2000 | 26 y, 10 m, 0 d | 9,802 | 1,400 weeks, 2 days | 322 | 6 |
| Feb. 29, 2000 | 26 y, 10 m, 0 d | 9,803 | 1,400 weeks, 3 days | 322 | 6 |
| Feb. 29, 1960 | 66 y, 10 m, 0 d | 24,413 | 3,487 weeks, 4 days | 802 | 16 |

Born Mar. 1, 2000 and Feb. 29, 2000, two people one day apart, differ by exactly one day lived: 9,802 against 9,803. Jan. 1, 1960 to Jan. 1, 2027 is also an exact multiple of seven days, 3,496 weeks.

## How do you work out age in years, months and days by hand?

Use the June 15, 1980 birthday and Jan. 1, 2027.

1. **Whole years.** June 15, 2026 was the last birthday: 2026 minus 1980 is 46 years.
2. **Whole months.** From June 15, 2026, six months reach Dec. 15, 2026. The seventh month would pass Jan. 1, 2027, so the answer is 6.
3. **Days.** Dec. 15 to Jan. 1 is 16 days to Dec. 31, plus 1 more: 17 days.

The answer is 46 years, 6 months and 17 days. Always finish with the birthday that has already passed this year. Taking this year minus the birth year without checking the date overstates age for anyone whose birthday has not come yet.

## How do you count total days with leap years?

Total days has three parts: 365 for each whole year, one extra day for every Feb. 29 in the span, and the days since the last birthday.

For June 15, 1980 to Jan. 1, 2027:

- 46 whole years x 365 = 16,790 days.
- Feb. 29 fell in 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2016, 2020 and 2024: 11 leap days. Every one of these years divides by 4. By the USNO rule 2000 counts, because it divides by 400.
- June 15, 2026 to Jan. 1, 2027 is 200 days.
- 16,790 + 11 + 200 = 17,001 days.

Weeks come next: 17,001 divided by 7 is 2,428 with 5 left over. Complete months are 46 x 12 + 6 = 558. For the Jan. 1, 1960 row the same steps give 67 x 365 = 24,455, plus 17 leap days (1960 through 2024), which makes 24,472. See what-is-a-leap-year for the rule and the list of leap years, and our [leap year guide](/news/what-is-a-leap-year/) for every one to 2100.

## What formulas calculate age in Excel and Google Sheets?

Put the birth date in cell A2. The formulas below are ours, built from the functions Microsoft documents.

| What you want | Formula | Check |
|---|---|---|
| Complete years | `=DATEDIF(A2,TODAY(),"Y")` | The Jan. 1, 1960 birthday gives 67 on Jan. 1, 2027 |
| Months after the last birthday | `=DATEDIF(A2,TODAY(),"YM")` | Microsoft: "The days and years of the dates are ignored" |
| Total days | `=TODAY()-A2` | Subtracting one date from another gives days |
| Whole weeks | `=INT((TODAY()-A2)/7)` | 2,428 for June 15, 1980 on Jan. 1, 2027 |

Microsoft's DATEDIF page says the function "is useful in formulas where you need to calculate an age", and also says it "may calculate incorrect results under certain scenarios". It adds: "We don't recommend using the "MD" argument, as there are known limitations with it." The "MD" argument "may result in a negative number, a zero, or an inaccurate result." Google Sheets documents "MD" as "the number of days between start_date and end_date after subtracting whole months" and carries no warning on its page. For the leftover days we suggest the by-hand count above, or compare the sheet against it.

Microsoft's separate Calculate age page gives years as `=(YEAR(NOW())-YEAR(A2))` and months as `=(YEAR(NOW())-YEAR(A3))*12+MONTH(NOW())-MONTH(A3)`. Both ignore the day of the month. On Jan. 1, 2027 the years formula gives 47 for a June 15, 1980 birthday against 46 complete years, and the months formula gives 559 against 558 complete months. Our DATEDIF "Y" counts only complete years. For spans between any two dates, see [counting days between dates in Excel and Google Sheets](/news/count-days-between-dates-excel-google-sheets/).

## When does a Feb. 29 birthday count as a year older?

Rules differ by place. The Age of Legal Capacity (Scotland) Act 1991, section 6(2), says: "Where a person has been born on 29th February in a leap year, the relevant anniversary in any year other than a leap year shall be taken to be 1st March." That applies in Scotland only. We found no written rule in U.S. federal law or for England and Wales.

The U.S. Social Security Administration (SSA) uses a general rule in its Program Operations Manual System (POMS GN 00302.400, dated 03/04/2026): "An individual attains a particular age on the first moment of the day preceding the anniversary of his/her birth." The section does not mention Feb. 29. Check the rule that governs your form, benefit or contract before relying on either date. Total days lived does not depend on any convention, which is why the table's totals are the safest number to quote.

## Print the age in days worksheet

The free one-page worksheet has lines for the two dates, the method as a checklist, a table for the Feb. 29 years in your span, and a table for the answer. It prints the USNO leap year rule at the foot. For date-by-year layouts, our [printable yearly calendar](/printable-yearly-calendar.html) and [January 2027 calendar](/january-calendars.html) help count to a birthday.
