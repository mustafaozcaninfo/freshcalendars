---
title: "How to Count Days Between Two Dates in Excel and Google Sheets, With 2027 Examples"
seoTitle: "Count Days Between Two Dates in Excel and Sheets"
description: "Subtract the dates for calendar days or use a weekday function: Jan. 1 to Dec. 31, 2027 is 364 days, 261 weekdays and 250 federal workdays."
type: explainer
publishedAt: "2026-11-04T15:07:00-05:00"
authors: [jessica-hartwell]
category: calendar-guides
keywords: ["how to count days between two dates excel", "days between dates google sheets", "networkdays excel holidays", "datedif excel", "days function excel"]
hero:
  src: ../../../../assets/news/count-days-between-dates-excel-google-sheets/count-days-between-dates-excel-google-sheets.webp
  alt: "A laptop on a desk showing charts, used to illustrate how to count days between two dates in Excel and Google Sheets"
  caption: "File photo of a laptop with charts, by Marc Chouinard (CC0). In 2027, Jan. 1 to Dec. 31 is 364 days by subtraction and 250 federal workdays."
  credit: "Photo: Marc Chouinard / stocksnap, edited"
  license:
    name: "CC0 1.0"
    url: "https://creativecommons.org/publicdomain/zero/1.0/"
    source: "https://stocksnap.io/photo/business-working-PHE63L27S6"
    author: "Marc Chouinard"
    authorUrl: "https://twitter.com/codingdog"
summary:
  - "Microsoft says you can subtract one date from the other to get the time between them; Excel and Google Sheets also have the days function (DAYS), written DAYS(end_date, start_date), with the end date first."
  - "The network days function (NETWORKDAYS), written NETWORKDAYS(start_date, end_date, [holidays]), counts weekdays: Monday, Jan. 4 to Friday, Jan. 8, 2027 returns 5, while plain subtraction returns 4."
  - "Jan. 1 to Dec. 31, 2027 is 364 days by subtraction, 365 counting both ends, 261 weekdays and 250 workdays after the 11 U.S. Office of Personnel Management (OPM) holidays."
  - "Microsoft does not recommend the MD unit of the date difference function (DATEDIF) because of known limitations."
faq:
  - q: "How do I count days between two dates in Excel?"
    a: "Subtract the start date from the end date, as in =B2-A2, or use =DAYS(B2,A2). Microsoft says you can simply subtract one date from the other."
  - q: "How do I count days between two dates in Google Sheets?"
    a: "The same two formulas work: subtract the cells, or use DAYS(end_date, start_date). Google's help page says the DAYS function factors in leap days."
  - q: "Does NETWORKDAYS count the start and end date?"
    a: "Yes when they are workdays. A Monday-to-Friday week returns 5 in our check, where plain subtraction returns 4."
  - q: "Why does DATEDIF return #NUM!?"
    a: "Microsoft says the result is #NUM! if the start date is greater than the end date. Swap the cells, or use DAYS, which takes the end date first."
  - q: "How do I leave holidays out of the count?"
    a: "List the holiday dates in cells and give that range to NETWORKDAYS as the third argument."
sources:
  - title: "DATEDIF function"
    url: "https://support.microsoft.com/en-us/excel/functions/datedif-function"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "DAYS function"
    url: "https://support.microsoft.com/en-us/excel/functions/days-function"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "NETWORKDAYS function"
    url: "https://support.microsoft.com/en-us/excel/functions/networkdays-function"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "NETWORKDAYS.INTL function"
    url: "https://support.microsoft.com/en-us/office/networkdays-intl-function-a9b26239-4f20-46a1-9ab8-4e925bfd5e28"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "Calculate the difference between two dates"
    url: "https://support.microsoft.com/en-us/excel/get-started/calculate-the-difference-between-two-dates"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "DAYS function (Google Docs Editors Help)"
    url: "https://support.google.com/docs/answer/9061296"
    publisher: "Google Docs Editors Help"
    date: "2026-11-04"
  - title: "DATEDIF function (Google Docs Editors Help)"
    url: "https://support.google.com/docs/answer/6055612"
    publisher: "Google Docs Editors Help"
    date: "2026-11-04"
  - title: "NETWORKDAYS function (Google Docs Editors Help)"
    url: "https://support.google.com/docs/answer/3092979"
    publisher: "Google Docs Editors Help"
    date: "2026-11-04"
  - title: "NETWORKDAYS.INTL function (Google Docs Editors Help)"
    url: "https://support.google.com/docs/answer/3295902"
    publisher: "Google Docs Editors Help"
    date: "2026-11-04"
  - title: "Federal Holidays"
    url: "https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/"
    publisher: "U.S. Office of Personnel Management"
    date: "2026-11-04"
internalLinks:
  - href: "/printable-yearly-calendar.html"
    label: "Printable yearly calendar"
  - href: "/holidays/"
    label: "Holidays on the Fresh Calendars site"
related: [how-many-business-days-in-a-year, federal-holidays-2027-observed-dates-list, working-days-2027-business-days-by-month-federal-nyse]
assets:
  overlay: true
  kicker: "Calendar guide · Date formulas"
  card: { top: "Jan. 1 to Dec. 31, 2027", big: "250 workdays", bottom: "364 days, 261 weekdays, 11 holidays" }
  printable:
    kit: planner
    slug: date-difference-formulas-2027-federal-holidays
    group: date-difference-formulas
    title: "Date Difference Formulas and 2027 Federal Holidays"
    subtitle: "Excel and Google Sheets syntax, a worksheet and the OPM holiday list"
    data:
      sections:
        - { type: table, title: "Date pair worksheet", columns: ["Start", "End", "Days", "Days +1", "Weekdays", "Workdays"], rows: 8 }
      facts:
        - { text: "Calendar days: subtract the start from the end, or DAYS(end_date, start_date). End date first.", src: 2, quote: "DAYS(end_date, start_date)" }
        - { text: "Weekdays: NETWORKDAYS(start_date, end_date, [holidays]); both ends count when they are workdays.", src: 3, quote: "NETWORKDAYS(start_date, end_date, [holidays])" }
        - { text: "Other weekends: NETWORKDAYS.INTL(start_date, end_date, [weekend], [holidays]).", src: 4, quote: "NETWORKDAYS.INTL(start_date, end_date, [weekend], [holidays])" }
        - { text: "DATEDIF(start_date, end_date, unit) with Y, M or D. Microsoft does not recommend the MD unit.", src: 1, quote: "DATEDIF(start_date,end_date,unit)" }
      rules:
        - { text: "Fri., Jan. 1: New Year's Day", src: 10, quote: "Friday, January 01 New Year's Day" }
        - { text: "Mon., Jan. 18: Birthday of Martin Luther King, Jr.", src: 10, quote: "Monday, January 18 Birthday of Martin Luther King, Jr." }
        - { text: "Mon., Feb. 15: Washington's Birthday", src: 10, quote: "Monday, February 15 Washington's Birthday" }
        - { text: "Mon., May 31: Memorial Day", src: 10, quote: "Monday, May 31 Memorial Day" }
        - { text: "Fri., June 18: Juneteenth National Independence Day", src: 10, quote: "Friday, June 18 Juneteenth National Independence Day" }
        - { text: "Mon., July 5: Independence Day", src: 10, quote: "Monday, July 05 Independence Day" }
        - { text: "Mon., Sept. 6: Labor Day", src: 10, quote: "Monday, September 06 Labor Day" }
        - { text: "Mon., Oct. 11: Columbus Day", src: 10, quote: "Monday, October 11 Columbus Day" }
        - { text: "Thu., Nov. 11: Veterans Day", src: 10, quote: "Thursday, November 11 Veterans Day" }
        - { text: "Thu., Nov. 25: Thanksgiving Day", src: 10, quote: "Thursday, November 25 Thanksgiving Day" }
        - { text: "Fri., Dec. 24: Christmas Day", src: 10, quote: "Friday, December 24 Christmas Day" }
    note: "Source: Microsoft Support (DATEDIF, DAYS, NETWORKDAYS, NETWORKDAYS.INTL); U.S. Office of Personnel Management, Federal Holidays, 2027 table."
    description: "A one-page worksheet for counting days between dates, with the Excel and Google Sheets formulas and the 11 federal holidays of 2027 to paste into NETWORKDAYS."
    alt: "Printable worksheet with eight blank date pairs, the date difference formulas and the 11 federal holidays of 2027"
downloads:
  - group: "Date Difference Formulas and 2027 Federal Holidays printables"
    title: "Date Difference Formulas and 2027 Federal Holidays"
    description: "A one-page worksheet for counting days between dates, with the Excel and Google Sheets formulas and the 11 federal holidays of 2027 to paste into NETWORKDAYS."
    preview: ../../../../assets/news/date-difference-formulas/date-difference-formulas-2027-federal-holidays.png
    alt: "Printable worksheet with eight blank date pairs, the date difference formulas and the 11 federal holidays of 2027"
    pdf: "/news/downloads/date-difference-formulas/date-difference-formulas-2027-federal-holidays.pdf"
    png: "/news/downloads/date-difference-formulas/date-difference-formulas-2027-federal-holidays.png"
    pages: 1
draft: false
---

Microsoft says that to calculate the time between two dates you can simply subtract one from the other, and Google Sheets and Excel also have the days function (DAYS) that does the same with the end date first. For Jan. 1 to Dec. 31, 2027 that gives 364 days. Counting only Monday-Friday gives 261, and leaving out the 11 federal holidays in the U.S. Office of Personnel Management (OPM) 2027 list gives 250. This guide shows the formulas side by side, including the network days function (NETWORKDAYS), its international (INTL) version and the date difference function (DATEDIF), and one table of 2027 date pairs counted four ways. An error value, the number error (NUM), appears as #NUM! when DATEDIF gets dates in the wrong order.

## Which formula counts calendar days between two dates?

Three formulas return calendar days, and they agree when the end date is after the start date.

- **Subtraction:** `=B2-A2`, with the start date in A2 and the end date in B2.
- **DAYS:** `=DAYS(B2,A2)`. Microsoft and Google both print the syntax as DAYS(end_date, start_date), so the end date comes first. Google's page adds that "The DAYS function factors in leap days."
- **DATEDIF with "D":** `=DATEDIF(A2,B2,"D")`. Microsoft lists "D" as "The number of days in the period." Here the start date comes first.

Microsoft's guide to date differences notes that "Excel provides the DATEDIF function in order to support older workbooks from Lotus 1-2-3." If the start date is greater than the end date, DATEDIF returns #NUM!, Microsoft says.

Subtraction leaves out one day. Jan. 4 to Jan. 8, 2027 is 4 days apart but covers 5 calendar days if both ends count. Add 1 when you want the span inclusive, as in `=B2-A2+1`.

## What are the Excel and Google Sheets formulas side by side?

The syntax is the same in both programs, as the Microsoft Support and Google Docs Editors Help pages print it.

| Task | Excel (Microsoft Support) | Google Sheets (Docs Editors Help) |
|---|---|---|
| Calendar days | `DAYS(end_date, start_date)` | `DAYS(end_date,start_date)` |
| Days, complete months or years | `DATEDIF(start_date,end_date,unit)` | `DATEDIF(start_date, end_date, unit)` |
| Weekdays, Saturday and Sunday off | `NETWORKDAYS(start_date, end_date, [holidays])` | `NETWORKDAYS(start_date, end_date, [holidays])` |
| Weekdays, your own weekend | `NETWORKDAYS.INTL(start_date, end_date, [weekend], [holidays])` | `NETWORKDAYS.INTL` (weekend as seven 0s and 1s) |

For NETWORKDAYS.INTL, Microsoft says a weekend of "1 or omitted" means Saturday and Sunday and "11" means Sunday only. It also says 0000011 gives a Saturday-Sunday weekend and "Using 1111111 will always return 0." Google's page says "Weekends can be specified using seven 0s and 1s," where "A zero means that the day is a work day, a 1 means that the day is a weekend." We did not confirm Google's numeric weekend codes, so the table shows only its seven-digit form.

## What does NETWORKDAYS count, and how do holidays work?

Microsoft says NETWORKDAYS "Returns the number of whole working days between start_date and end_date." The page does not say in words that both ends count. A Monday-to-Friday week shows it: Monday, Jan. 4, 2027 to Friday, Jan. 8, 2027 returns 5, so NETWORKDAYS counts both the start and end date when they are workdays.

The third argument is a range of holiday dates, such as `=NETWORKDAYS(A2,B2,E2:E12)`. Put the holidays in their own column once and reuse the range. The 2027 list from OPM is in the next section; for how the observed dates work, see [federal holidays in 2027](/news/federal-holidays-2027-observed-dates-list/).

## Which 2027 date pairs give which counts?

We counted six pairs of dates four ways. Column (a) is the plain subtraction or DAYS result, (b) adds 1 so both ends count, (c) is the NETWORKDAYS result with a Saturday-Sunday weekend and no holidays, and (d) is NETWORKDAYS with the 11 OPM 2027 holidays as the third argument. All numbers are our computation from the OPM list, checked with a script.

| Start | End | (a) Subtract or DAYS | (b) Inclusive | (c) Weekdays | (d) Weekdays minus holidays |
|---|---|---|---|---|---|
| Fri., Jan. 1 | Wed., Mar. 31 | 89 | 90 | 64 | 61 |
| Mon., Jan. 4 | Wed., June 30 | 177 | 178 | 128 | 124 |
| Mon., Feb. 15 | Mon., May 31 | 105 | 106 | 76 | 74 |
| Tue., June 1 | Mon., Sept. 6 | 97 | 98 | 70 | 67 |
| Tue., Sept. 7 | Fri., Dec. 31 | 115 | 116 | 84 | 80 |
| Fri., Jan. 1 | Fri., Dec. 31 | 364 | 365 | 261 | 250 |

Two rows show why the holiday column matters. The Feb. 15 to May 31 row starts on Washington's Birthday and ends on Memorial Day, and both days are weekdays, so (c) counts them and (d) removes them: 76 becomes 74. The June 1 to Sept. 6 row ends on Labor Day, one of three holidays in it, along with Juneteenth and Independence Day.

The last row matches our count in [how many business days are in a year](/news/how-many-business-days-in-a-year/): 261 weekdays minus 11 holidays is 250. The pairs here count only the 11 days in OPM's 2027 table. For a month-by-month version, see [working days in 2027](/news/working-days-2027-business-days-by-month-federal-nyse/).

## Which 2027 federal holidays go in the holiday range?

OPM's 2027 table lists the 11 dates below. Paste them into a column and point NETWORKDAYS at it.

| Date | OPM holiday |
|---|---|
| Fri., Jan. 1 | New Year's Day |
| Mon., Jan. 18 | Birthday of Martin Luther King, Jr. |
| Mon., Feb. 15 | Washington's Birthday |
| Mon., May 31 | Memorial Day |
| Fri., June 18 | Juneteenth National Independence Day |
| Mon., July 5 | Independence Day |
| Mon., Sept. 6 | Labor Day |
| Mon., Oct. 11 | Columbus Day |
| Thu., Nov. 11 | Veterans Day |
| Thu., Nov. 25 | Thanksgiving Day |
| Fri., Dec. 24 | Christmas Day |

Three of these are days off in place of a weekend date. Juneteenth is Saturday, June 19, 2027, Independence Day is Sunday, July 4, and Christmas is Saturday, Dec. 25. OPM's footnote says that "If a holiday falls on a Saturday, for most Federal employees, the preceding Friday will be treated as a holiday for pay and leave purposes," and a Sunday holiday moves to Monday. So the days to list are June 18, July 5 and Dec. 24. Your employer or school may use a different list; replace the range with its dates.

## Why does Microsoft advise against the MD unit of DATEDIF?

DATEDIF takes "Y" for complete years, "M" for complete months and "D" for days, plus "MD", "YM" and "YD". Microsoft's DATEDIF page says "We don't recommend using the "MD" argument, as there are known limitations with it" and that it "may result in a negative number, a zero, or an inaccurate result." Its date-difference guide gives the same advice. Google's DATEDIF page, which has the same syntax, carries no such warning, and we did not confirm how its "YD" unit is worded, so we do not describe it here.

Use "D" for days, or use DAYS. For complete months or years, "M" and "Y" are the units Microsoft lists without that warning.

## Print the formulas and the 2027 holiday list

The free one-page worksheet below has eight blank date pairs with columns for the four counts, the formulas from this guide and the 11 federal holidays for 2027. It is a planner sheet, so it works with any spreadsheet or by hand. For a wall view of the year, see the [printable yearly calendar](/printable-yearly-calendar.html) and the [holidays pages](/holidays/).
