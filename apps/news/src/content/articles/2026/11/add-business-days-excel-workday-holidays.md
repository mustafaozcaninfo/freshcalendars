---
title: "How to Add Business Days in Excel, Skipping Weekends and Holidays"
seoTitle: "Add Business Days in Excel With WORKDAY"
description: "The workday function (WORKDAY) skips weekends and holidays: Jan. 4, 2027 plus 90 business days is May 12 with 11 Office of Personnel Management (OPM) dates."
type: explainer
publishedAt: "2026-11-04T15:00:00-05:00"
authors: [jessica-hartwell]
category: calendar-guides
keywords: ["add business days excel", "workday function excel", "excel add working days excluding holidays", "google sheets add business days", "workday.intl weekend codes"]
hero:
  src: ../../../../assets/news/add-business-days-excel-workday-holidays/add-business-days-excel-workday-holidays.webp
  alt: "Hands on a calculator in front of a laptop showing a spreadsheet, the setup for adding business days in Excel with WORKDAY"
  caption: "File photo of a calculator and a laptop spreadsheet. In our worked example, 90 business days from Jan. 4, 2027 is May 12, 2027."
  credit: "Photo: Wilfred Iven / stocksnap, edited"
  license:
    name: "CC0 1.0"
    url: "https://creativecommons.org/publicdomain/zero/1.0/"
    source: "https://stocksnap.io/photo/accounting-finance-JONMP7TPGK"
    author: "Wilfred Iven"
    authorUrl: "https://firmbee.com"
summary:
  - "Per Microsoft Support, WORKDAY(start_date, days, [holidays]) returns a date that skips weekends and any dates listed as holidays."
  - "Our worked example: starting Monday, Jan. 4, 2027, 90 business days is Monday, May 10 without holidays and Wednesday, May 12 with the 11 federal observed dates."
  - "the international version (INTL), WORKDAY.INTL, adds a weekend argument, such as code 7 for Friday and Saturday, and Google Sheets has the same functions."
  - "Dates typed as text can fail: Microsoft says to enter them with the date function (DATE) or as results of other formulas, and Google says WORKDAY does not autoconvert formats."
faq:
  - q: "Does WORKDAY count the start date?"
    a: "In our worked example it does not. Starting Monday, Jan. 4, 2027, WORKDAY with 10 days and no holidays returns Monday, Jan. 18, which is 10 weekdays later. Microsoft's page does not describe this in words, so test your own start date."
  - q: "Can WORKDAY go backward?"
    a: "Yes. Microsoft says a negative days value yields a past date."
  - q: "Why does WORKDAY return #VALUE! or #NUM!?"
    a: "Microsoft says the value error (#VALUE!) appears when any argument is not a valid date, and the number error (#NUM!) when start_date plus days yields an invalid date."
  - q: "How do I count business days between two dates instead?"
    a: "Use NETWORKDAYS(start_date, end_date, [holidays]), which Microsoft says returns the number of whole working days between the two dates. In our worked example, NETWORKDAYS(DATE(2027,1,4),DATE(2027,1,8)) returns 5, so both end dates are counted."
sources:
  - title: "WORKDAY function"
    url: "https://support.microsoft.com/en-us/Excel/functions/workday-function"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "WORKDAY.INTL function"
    url: "https://support.microsoft.com/en-us/Excel/workday-intl-function"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "NETWORKDAYS function"
    url: "https://support.microsoft.com/en-us/Excel/functions/networkdays-function"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "NETWORKDAYS.INTL function"
    url: "https://support.microsoft.com/en-us/Excel/networkdays-intl-function"
    publisher: "Microsoft Support"
    date: "2026-11-04"
  - title: "WORKDAY"
    url: "https://support.google.com/docs/answer/3093059"
    publisher: "Google Docs Editors Help"
    date: "2026-11-04"
  - title: "WORKDAY.INTL"
    url: "https://support.google.com/docs/answer/3294972"
    publisher: "Google Docs Editors Help"
    date: "2026-11-04"
  - title: "NETWORKDAYS"
    url: "https://support.google.com/docs/answer/3092979"
    publisher: "Google Docs Editors Help"
    date: "2026-11-04"
  - title: "Federal Holidays"
    url: "https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/"
    publisher: "U.S. Office of Personnel Management"
    date: "2026-11-04"
internalLinks:
  - href: "/printable-yearly-calendar.html"
    label: "2027 printable yearly calendar"
  - href: "/january-calendars.html"
    label: "January 2027 printable calendar"
  - href: "/holidays/"
    label: "US holiday list"
related: [how-many-business-days-in-a-year, working-days-2027-business-days-by-month-federal-nyse, federal-holidays-2027-observed-dates-list]
assets:
  overlay: true
  kicker: "Excel · Business days"
  date: "2027-01-04"
  card: { top: "=WORKDAY(start, 90, holidays)", big: "May 12", bottom: "90 business days from Jan. 4, 2027" }
  printable:
    kit: planner
    slug: workday-formula-cheat-sheet-2027
    group: excel-business-days
    title: "WORKDAY Formula Cheat Sheet With 2027 Holidays"
    subtitle: "Excel and Google Sheets formulas, weekend codes and 2027 federal observed dates"
    note: "Source: Microsoft Support (WORKDAY, WORKDAY.INTL, NETWORKDAYS); Google Docs Editors Help; U.S. Office of Personnel Management, Federal Holidays."
    description: "One-page cheat sheet for the WORKDAY, WORKDAY.INTL and NETWORKDAYS formulas, with weekend codes and the 11 observed federal holiday dates for 2027."
    alt: "Printable cheat sheet of WORKDAY formulas, weekend codes and 2027 federal observed holiday dates"
    data:
      sections:
        - { type: table, title: "Your calculations", columns: ["Start date", "Days", "Result"], rows: 4 }
      rules:
        - { text: "=WORKDAY(start_date, days, [holidays]) skips weekends and listed holidays", src: 1, quote: "WORKDAY(start_date, days, [holidays])" }
        - { text: "=WORKDAY.INTL(start_date, days, [weekend], [holidays]) sets the weekend", src: 2, quote: "WORKDAY.INTL(start_date, days, [weekend], [holidays])" }
        - { text: "=NETWORKDAYS(start_date, end_date, [holidays]) counts working days between dates", src: 3, quote: "NETWORKDAYS(start_date, end_date, [holidays])" }
        - { text: "Weekend code 1 or blank: Saturday, Sunday. 7: Friday, Saturday. 11: Sunday only", src: 2, quote: "7 Friday, Saturday" }
        - { text: "Weekend string 0000011 (starts Monday) is Saturday and Sunday", src: 2, quote: "0000011 would result in a weekend that is Saturday and Sunday" }
        - { text: "Google Sheets: a zero is a work day, a 1 is a weekend day in the string", src: 6, quote: "A zero means that the day is a work day, a 1 means that the day is a weekend." }
        - { text: "Enter dates with DATE(2027,1,4) or a cell, not as typed text", src: 1, quote: "should be entered by using the DATE function" }
      facts:
        - { text: "Fri., Jan. 1, 2027", src: 8, quote: "Friday, January 1" }
        - { text: "Mon., Jan. 18, 2027", src: 8, quote: "Monday, January 18" }
        - { text: "Mon., Feb. 15, 2027", src: 8, quote: "Monday, February 15" }
        - { text: "Mon., May 31, 2027", src: 8, quote: "Monday, May 31" }
        - { text: "Fri., June 18, 2027 (Juneteenth observed)", src: 8, quote: "Friday, June 18" }
        - { text: "Mon., July 5, 2027 (Independence Day observed)", src: 8, quote: "Monday, July 5" }
        - { text: "Mon., Sept. 6, 2027", src: 8, quote: "Monday, September 6" }
        - { text: "Mon., Oct. 11, 2027", src: 8, quote: "Monday, October 11" }
        - { text: "Thu., Nov. 11, 2027", src: 8, quote: "Thursday, November 11" }
        - { text: "Thu., Nov. 25, 2027", src: 8, quote: "Thursday, November 25" }
        - { text: "Fri., Dec. 24, 2027 (Christmas observed)", src: 8, quote: "Friday, December 24" }
downloads:
  - group: "WORKDAY Formula Cheat Sheet With 2027 Holidays printables"
    title: "WORKDAY Formula Cheat Sheet With 2027 Holidays"
    description: "One-page cheat sheet for the WORKDAY, WORKDAY.INTL and NETWORKDAYS formulas, with weekend codes and the 11 observed federal holiday dates for 2027."
    preview: ../../../../assets/news/excel-business-days/workday-formula-cheat-sheet-2027.png
    alt: "Printable cheat sheet of WORKDAY formulas, weekend codes and 2027 federal observed holiday dates"
    pdf: "/news/downloads/excel-business-days/workday-formula-cheat-sheet-2027.pdf"
    png: "/news/downloads/excel-business-days/workday-formula-cheat-sheet-2027.png"
    pages: 1
draft: false
---

The workday function (WORKDAY), written =WORKDAY(start_date, days, holidays), adds business days to a date and, per Microsoft Support's WORKDAY page, skips Saturdays, Sundays and any dates you list as holidays. Starting Monday, Jan. 4, 2027, adding 90 business days returns Monday, May 10 with no holiday list and Wednesday, May 12 with the 11 federal observed dates from the U.S. Office of Personnel Management (OPM). Those results are our calculation. This guide gives the formula, a paste-ready 2027 holiday range, a weekend-code table and the differences in Google Sheets.

## How does the WORKDAY formula add business days in Excel?

Microsoft gives the syntax as WORKDAY(start_date, days, [holidays]). The first two arguments are required and the holiday list is optional. Microsoft says working days exclude weekends and any dates identified as holidays, and that a negative value yields a past date.

A basic version, with a start date in cell A1 and a day count in B1:

`=WORKDAY(A1, B1)`

To type the date inside the formula, use the date function (DATE) so Excel reads it correctly: `=WORKDAY(DATE(2027,1,4), 90)`. Microsoft explains that Excel stores dates as sequential serial numbers, and that dates should be entered by using the DATE function or as results of other formulas or functions. A date typed as plain text can return an error.

Microsoft lists two errors. If any argument is not a valid date, WORKDAY returns the value error (VALUE), shown as `#VALUE!`. If start_date plus days yields an invalid date, it returns the number error (NUM), shown as `#NUM!`.

## How do I skip holidays with WORKDAY?

Put each holiday in its own cell, then pass that range as the third argument. Microsoft's own example starts on 10/1/2008, adds 151 days and gets 4/30/2009; with holidays on 11/26/2008, 12/4/2008 and 1/21/2009 the result is 5/5/2009.

For 2027, the observed federal dates from OPM are below. OPM's page says that if a holiday falls on a Saturday, for most federal employees the preceding Friday is treated as a holiday for pay and leave purposes. That is why Juneteenth, a Saturday in 2027, shows as Friday, June 18.

| Observed date, 2027 | Day |
|---|---|
| Jan. 1 | Fri. |
| Jan. 18 | Mon. |
| Feb. 15 | Mon. |
| May 31 | Mon. |
| June 18 (Juneteenth observed) | Fri. |
| July 5 (Independence Day observed) | Mon. |
| Sept. 6 | Mon. |
| Oct. 11 | Mon. |
| Nov. 11 | Thu. |
| Nov. 25 | Thu. |
| Dec. 24 (Christmas observed) | Fri. |

Enter them in cells A2 to A12 as `=DATE(2027,1,1)`, `=DATE(2027,1,18)` and so on down to `=DATE(2027,12,24)`. Then use the range:

`=WORKDAY(DATE(2027,1,4), 90, A2:A12)`

If your employer, school or contract uses another list, replace the 11 dates; the function only knows the dates you give it. OPM's observed dates also move with the year, so a range built for 2027 should not be reused for 2028. For the full list and the reasons for each shift, see [federal holidays in 2027](/news/federal-holidays-2027-observed-dates-list/).

## What does WORKDAY return from Jan. 4, 2027?

We computed four results from Monday, Jan. 4, 2027 with a Saturday-Sunday weekend, once with no holidays and once with the 11 dates above.

| Business days added | No holidays | With the 2027 holiday list |
|---|---|---|
| 10 | Mon., Jan. 18 | Tue., Jan. 19 |
| 30 | Mon., Feb. 15 | Wed., Feb. 17 |
| 60 | Mon., March 29 | Wed., March 31 |
| 90 | Mon., May 10 | Wed., May 12 |

The holiday list adds one day to the 10-day result because Jan. 18 is on the list, and two days to the later results. Check your own sheet against these four rows before you rely on a longer formula.

To count the other way, Microsoft's network days function (NETWORKDAYS), written NETWORKDAYS(start_date, end_date, [holidays]), returns the number of whole working days between two dates. As our worked example, NETWORKDAYS(DATE(2027,1,4), DATE(2027,1,8)) returns 5, Monday through Friday, so both end dates are counted. The same counting idea is behind [how many business days are in a year](/news/how-many-business-days-in-a-year/): 2027 has 261 weekdays, and 250 of them are not one of the 11 dates above, by our count. Our [month-by-month 2027 working days story](/news/working-days-2027-business-days-by-month-federal-nyse/) shows 249 federal working days because it also counts Friday, Dec. 31, 2027, the observed date for New Year's Day 2028.

## Which weekend codes can WORKDAY change for a Friday-Saturday week?

When your week is not Saturday and Sunday, use the international version (INTL), WORKDAY.INTL(start_date, days, [weekend], [holidays]). Microsoft's weekend codes are:

| Code | Weekend days |
|---|---|
| 1 or omitted | Saturday, Sunday |
| 2 | Sunday, Monday |
| 3 | Monday, Tuesday |
| 4 | Tuesday, Wednesday |
| 5 | Wednesday, Thursday |
| 6 | Thursday, Friday |
| 7 | Friday, Saturday |
| 11 | Sunday only |
| 12 | Monday only |
| 13 | Tuesday only |
| 14 | Wednesday only |
| 15 | Thursday only |
| 16 | Friday only |
| 17 | Saturday only |

Instead of a code you can give a weekend string. Microsoft says weekend string values are seven characters long, and that 0000011 gives a Saturday-Sunday weekend; the string starts on Monday. For a Friday-Saturday weekend, `=WORKDAY.INTL(DATE(2027,1,4), 90, 7, A2:A12)` uses code 7, and the matching string is 0000110. Microsoft's NETWORKDAYS.INTL(start_date, end_date, [weekend], [holidays]) takes the same weekend argument for counting.

## Does Google Sheets add business days the same way?

Mostly. Google Docs Editors Help says WORKDAY calculates the end date after a specified number of working days, and gives the syntax as WORKDAY(start_date, num_days, [holidays]). WORKDAY.INTL adds [weekend] and NETWORKDAYS counts working days with the same [holidays] argument.

| | Excel | Google Sheets |
|---|---|---|
| Add business days | WORKDAY(start_date, days, [holidays]) | WORKDAY(start_date, num_days, [holidays]) |
| Custom weekend | WORKDAY.INTL(start_date, days, [weekend], [holidays]) | WORKDAY.INTL(start_date, num_days, [weekend], [holidays]) |
| Count between dates | NETWORKDAYS(start_date, end_date, [holidays]) | NETWORKDAYS(start_date, end_date, [holidays]) |

Google adds a note: WORKDAY does not autoconvert number formats in the same way that Google Sheets does upon direct entry into cells. In practice, use DATE(2027,1,4) or a cell reference rather than typing a date inside the formula. Google's WORKDAY.INTL page also describes a weekend string in which a zero means a work day and a 1 means a weekend day.

## Print the WORKDAY formula cheat sheet

The one-page printable holds the three formulas, the weekend codes, the Google string rule and the 11 observed 2027 dates, with a small table for your own start dates and results. Mark the start date on a [2027 printable yearly calendar](/printable-yearly-calendar.html) or the [January 2027 printable calendar](/january-calendars.html), and see the [US holiday list](/holidays/) if you need dates beyond the federal ones.
