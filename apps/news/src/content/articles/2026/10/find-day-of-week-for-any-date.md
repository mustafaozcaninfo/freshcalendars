---
title: "How to Find the Day of the Week for Any Date: Zeller, Doomsday and Spreadsheet Codes"
seoTitle: "Find the Day of the Week for Any Date"
description: "Zeller's congruence names the weekday of any Gregorian date. Two worked examples, doomsday anchors and spreadsheet weekday codes, plus the 1582 and 1752 limits."
type: explainer
publishedAt: "2026-10-30T08:21:00-04:00"
authors: [jordan-bennett]
category: calendar-guides
keywords: ["how to find the day of the week for any date", "what day of the week was", "Zeller's congruence", "day of week calculator"]
hero:
  src: ../../../../assets/news/find-day-of-week-for-any-date/find-day-of-week-for-any-date.webp
  alt: "Dial of the Prague Astronomical Clock, used to illustrate how to find the day of the week for any date"
  caption: "File photo of the dial of the Prague Astronomical Clock. Finding a weekday needs only a calendar, a spreadsheet or the arithmetic below."
  credit: "Photo: Uoaei1 / Wikimedia Commons, cropped, edited"
  license:
    name: "CC BY-SA 4.0"
    url: "https://creativecommons.org/licenses/by-sa/4.0"
    source: "https://commons.wikimedia.org/wiki/File:Praha_Astronomical_Clock_Dial_01.jpg"
    author: "Uoaei1"
    authorUrl: "https://commons.wikimedia.org/wiki/User:Uoaei1"
summary:
  - "Zeller's congruence, listed by the National Institute of Standards and Technology (NIST) as an algorithm for the day of the week of any date, gives h = 0 for Saturday through h = 6 for Friday."
  - "July 4, 1776 was a Thursday (h = 5) and Jan. 1, 2000 was a Saturday (h = 0); both come out of the formula in six additions."
  - "In a spreadsheet, the weekday of Jan. 1, 2000 returns 7 with the default return type, because Excel and Google Sheets count Sunday as 1."
  - "The formula is Gregorian. A date before Oct. 15, 1582 (before Sept. 14, 1752 in Britain and its colonies) was written in the Julian calendar and needs the Julian variant."
faq:
  - q: "How can I find what day a date was?"
    a: "Enter the year, month and day in a spreadsheet with its weekday function, look at a printed calendar for that year, or run Zeller's congruence by hand. For a date before 1582, first decide which calendar the source used."
  - q: "Can I calculate a weekday without a calendar?"
    a: "Yes. Zeller's congruence needs six numbers and one remainder after division by 7. The doomsday method gets there with an anchor weekday for the year and the fixed dates 4/4, 6/6, 8/8, 10/10 and 12/12."
  - q: "Does the same date fall on the same weekday every year?"
    a: "No. A common year has 365 days, which is 52 weeks plus 1 day, so a date moves one weekday later; a leap year has 366 days and moves it two. The Gregorian pattern repeats exactly only after 400 years, per NASA."
  - q: "Is Zeller's congruence accurate?"
    a: "For Gregorian dates, yes. We ran the formula in this story against JavaScript's calendar and an independent day count for every date from 1583 to 2400 and found no mismatch. It is wrong for dates that were written in the Julian calendar."
  - q: "Why do historical weekday results differ between websites?"
    a: "Some tools project the Gregorian calendar backward before 1582, while others switch to the Julian calendar at 1582 or at a country's own change date. Britain and its colonies changed in 1752, so the same label can give two weekdays."
sources:
  - title: "Zeller's congruence"
    url: "https://xlinux.nist.gov/dads/HTML/zellersCongruence.html"
    publisher: "National Institute of Standards and Technology (NIST), Dictionary of Algorithms and Data Structures"
    date: "2020-11-23"
  - title: "Weekday function"
    url: "https://support.microsoft.com/en-us/office/weekday-function-60e44483-2ed1-439f-8bd0-e404c190949a"
    publisher: "Microsoft Support"
  - title: "Weekday"
    url: "https://support.google.com/docs/answer/3092975"
    publisher: "Google Docs Editors Help"
  - title: "Leap Years"
    url: "https://aa.usno.navy.mil/faq/leap_years"
    publisher: "U.S. Naval Observatory (USNO)"
  - title: "Introduction to Calendars"
    url: "https://aa.usno.navy.mil/faq/calendars"
    publisher: "U.S. Naval Observatory (USNO)"
  - title: "Calendars and their History"
    url: "https://eclipse.gsfc.nasa.gov/SEhelp/calendars.html"
    publisher: "NASA"
    date: "2012-10-14"
  - title: "Which years are leap years and can you have leap seconds?"
    url: "https://www.rmg.co.uk/stories/time/which-years-are-leap-years-can-you-have-leap-seconds"
    publisher: "Royal Museums Greenwich"
internalLinks:
  - href: "/printable-yearly-calendar.html"
    label: "Printable yearly calendar"
  - href: "/printable-calendars.html"
    label: "All printable calendars"
related: [how-to-calculate-day-of-year, how-often-does-the-calendar-repeat, what-is-a-leap-year]
draft: false
downloads:
  - group: "Day of the Week Finder Worksheet 2026 printables"
    title: "Day of the Week Finder Worksheet 2026"
    description: "One-page worksheet with the Zeller's congruence steps, two worked checks, doomsday anchor dates and spreadsheet weekday codes for finding the day of the week."
    preview: ../../../../assets/news/day-of-week-guide/day-of-week-finder-worksheet-2026.png
    alt: "Worksheet listing the steps of Zeller's congruence, doomsday anchor dates and spreadsheet weekday codes"
    pdf: "/news/downloads/day-of-week-guide/day-of-week-finder-worksheet-2026.pdf"
    png: "/news/downloads/day-of-week-guide/day-of-week-finder-worksheet-2026.png"
    pages: 1
  - group: "Day of the Week Finder Worksheet 2026 printables"
    title: "Day of the Week Finder Worksheet 2026 (ink saver)"
    description: "One-page worksheet with the Zeller's congruence steps, two worked checks, doomsday anchor dates and spreadsheet weekday codes for finding the day of the week. Ink-saver version."
    preview: ../../../../assets/news/day-of-week-guide/day-of-week-finder-worksheet-2026-ink.png
    alt: "Worksheet listing the steps of Zeller's congruence, doomsday anchor dates and spreadsheet weekday codes, ink-saver version"
    pdf: "/news/downloads/day-of-week-guide/day-of-week-finder-worksheet-2026-ink.pdf"
    png: "/news/downloads/day-of-week-guide/day-of-week-finder-worksheet-2026-ink.png"
    pages: 1
assets:
  overlay: true
  kicker: "Calendar guide · Weekday method"
  card: { top: "Jan. 1, 2000 was a", big: "Saturday", bottom: "Zeller's congruence gives h = 0" }
  printable:
    slug: day-of-week-finder-worksheet-2026
    group: day-of-week-guide
    title: "Day of the Week Finder Worksheet 2026"
    subtitle: "Zeller steps, doomsday anchors and spreadsheet codes"
    rows:
      - ["Step 1", "Write the date as q (day), m (month) and year. Jan. and Feb. count as months 13 and 14 of the previous year."]
      - ["Step 2", "K = last two digits of that year. J = first two digits."]
      - ["Step 3", "h = (q + floor(13(m+1)/5) + K + floor(K/4) + floor(J/4) + 5J) mod 7"]
      - ["Step 4", "h: 0 Saturday, 1 Sunday, 2 Monday, 3 Tuesday, 4 Wednesday, 5 Thursday, 6 Friday"]
      - ["Check 1", "July 4, 1776: 4 + 20 + 76 + 19 + 4 + 85 = 208, and 208 mod 7 = 5, Thursday"]
      - ["Check 2", "Jan. 1, 2000 as 1/13/1999: 1 + 36 + 99 + 24 + 4 + 95 = 259, mod 7 = 0, Saturday"]
      - ["Doomsday dates", "4/4, 6/6, 8/8, 10/10, 12/12, 5/9, 9/5, 7/11 and 11/7 share one weekday in a year"]
      - ["Jan. and Feb.", "Jan. 3 (Jan. 4 in a leap year) and the last day of February share it too"]
      - ["Century anchor", "1800s Friday, 1900s Wednesday, 2000s Tuesday, 2100s Sunday"]
      - ["Year doomsday", "Anchor + floor(yy/12) + (yy mod 12) + floor((yy mod 12)/4), count forward mod 7"]
      - ["2026", "Doomsday is Saturday, so July 4, 2026 is a Saturday"]
      - ["Spreadsheet", "Weekday of DATE(y,m,d): 1 Sunday to 7 Saturday. Type 2: 1 Monday to 7 Sunday"]
      - ["Julian dates", "Before Oct. 15, 1582 (Sept. 14, 1752 in Britain) swap floor(J/4) + 5J for 5 - J"]
    note: "Source: NIST Dictionary of Algorithms and Data Structures (Zeller's congruence); Microsoft Support and Google Docs Editors Help (weekday function); NASA and Royal Museums Greenwich (calendar changes). Formula checked by Fresh Calendars against JavaScript dates, 1583 to 2400."
    inkSaver: true
    description: "One-page worksheet with the Zeller's congruence steps, two worked checks, doomsday anchor dates and spreadsheet weekday codes for finding the day of the week."
    alt: "Worksheet listing the steps of Zeller's congruence, doomsday anchor dates and spreadsheet weekday codes"
---

**The National Institute of Standards and Technology (NIST) lists Zeller's congruence as "an algorithm to find the day of the week for any date," and applied below it gives Thursday for July 4, 1776 and Saturday for Jan. 1, 2000.** The formula below is the Gregorian version. We checked it against JavaScript's calendar and an independent day count for every date from 1583 to 2400, with no mismatch. This page also covers the doomsday anchors, the spreadsheet codes and the dates where the calendar changed.

## The quickest way to look up a weekday

For a modern date, a calendar or a spreadsheet is faster than any formula. Our [printable yearly calendar](/printable-yearly-calendar.html) shows every weekday of a year on one page, and the [other printable calendars](/printable-calendars.html) cover single months.

The arithmetic methods below matter when you have no calendar, when you want to check a result, or when a date is far from the years your calendar shows. Both Gregorian methods assume the Gregorian calendar, which the U.S. Naval Observatory (USNO) says was "first introduced in 1582."

## How a weekday moves from one year to the next

A common year has 365 days, which is 52 weeks and 1 day, so a date lands one weekday later the next year. A leap year has 366 days, and the shift is two weekdays. The leap day sits in February, so a date from March to December moves two weekdays when the later year is a leap year, and a date in January or February moves two when the earlier year is.

Which years are leap years? The USNO rule is that years divisible by 4 are leap years, "with the exception of centurial years that are not evenly divisible by 400." The USNO adds that 1700, 1800, 1900 and 2100 are not leap years, while 1600, 2000 and 2400 are. For the full rule see [what a leap year is](/news/what-is-a-leap-year/).

The table below was computed with the formulas on this page and checked against JavaScript dates.

| Year | Leap year? | Jan. 1 | July 4 | Doomsday weekday |
|---|---|---|---|---|
| 2024 | Yes | Monday | Thursday | Thursday |
| 2025 | No | Wednesday | Friday | Friday |
| 2026 | No | Thursday | Saturday | Saturday |
| 2027 | No | Friday | Sunday | Sunday |
| 2028 | Yes | Saturday | Tuesday | Tuesday |
| 2029 | No | Monday | Wednesday | Wednesday |
| 2030 | No | Tuesday | Thursday | Thursday |

Read down the July 4 column: Thursday, Friday, Saturday, Sunday, then a jump of two to Tuesday in 2028. NASA states that the Gregorian calendar "exactly repeats after 400 years," because its 146,097 days divide evenly by 7. Our story on [how often the calendar repeats](/news/how-often-does-the-calendar-repeat/) lists the years that share a layout.

## How to calculate a weekday with Zeller's congruence

NIST's Dictionary of Algorithms and Data Structures describes Zeller's congruence in one line and gives no formula on its page, so the formula here is stated as arithmetic that you can test. For a Gregorian date:

`h = (q + floor(13(m + 1) / 5) + K + floor(K / 4) + floor(J / 4) + 5J) mod 7`

| Symbol | Meaning |
|---|---|
| q | Day of the month |
| m | Month, with March = 3 through December = 12, and January = 13 and February = 14 of the previous year |
| K | Last two digits of the year (after the January and February shift) |
| J | First two digits of the year (the century) |
| h | 0 Saturday, 1 Sunday, 2 Monday, 3 Tuesday, 4 Wednesday, 5 Thursday, 6 Friday |

Watch the January and February shift. For Jan. 1, 2000, use m = 13 and the year 1999, so K = 99 and J = 19. "Floor" means drop the fraction, and "mod 7" means keep the remainder after dividing by 7.

### Worked example: July 4, 1776

1. q = 4, m = 7, year 1776, so K = 76 and J = 17.
2. floor(13 x 8 / 5) = floor(20.8) = 20.
3. floor(K / 4) = 19 and floor(J / 4) = 4, and 5J = 85.
4. Add: 4 + 20 + 76 + 19 + 4 + 85 = 208.
5. 208 = 7 x 29 + 5, so h = 5, a Thursday.

Britain and its colonies had already moved to the Gregorian calendar in 1752, according to Royal Museums Greenwich, so the Gregorian formula applies to this date.

### Worked example: Jan. 1, 2000

1. q = 1. January counts as month 13 of 1999, so m = 13, K = 99 and J = 19.
2. floor(13 x 14 / 5) = floor(36.4) = 36.
3. floor(K / 4) = 24 and floor(J / 4) = 4, and 5J = 95.
4. Add: 1 + 36 + 99 + 24 + 4 + 95 = 259.
5. 259 = 7 x 37 + 0, so h = 0, a Saturday.

Both results match JavaScript's date calculation. If your answer is off, first check that a January or February date used the previous year and months 13 and 14.

## How the doomsday anchors give a weekday in your head

The doomsday method trades the formula for a handful of dates that share one weekday in any given year. We verified each anchor below for every year from 1800 to 2199, and none failed. Once you know the weekday of those dates for the year, count from the nearest one to your date.

| Anchor dates | Notes |
|---|---|
| 4/4, 6/6, 8/8, 10/10, 12/12 | Even months, day equals month |
| 5/9, 9/5 | Swap day and month |
| 7/11, 11/7 | Swap day and month |
| Jan. 3 | Common years |
| Jan. 4 | Leap years |
| Last day of February | Feb. 28 in a common year, Feb. 29 in a leap year |

To find the year's doomsday weekday, start from the century anchor: Friday for the 1800s, Wednesday for the 1900s, Tuesday for the 2000s and Sunday for the 2100s. Take the last two digits of the year (call them yy), then add floor(yy / 12), the remainder of yy divided by 12, and floor of that remainder divided by 4. Count forward that many days from the anchor, modulo 7.

For 2026: Tuesday plus 2 plus 2 plus 0 is 4 days, and Tuesday plus 4 days is Saturday. So 7/11 is a Saturday, and July 4 is seven days earlier, also a Saturday. For Jan. 1, 2000: the year is a leap year, so Jan. 4 is the doomsday. With yy = 0 nothing is added to the Tuesday anchor, so Jan. 4 is a Tuesday and Jan. 1 is a Saturday, matching Zeller.

## Which spreadsheet formula returns the weekday?

Both Excel and Google Sheets build a date with the date function (DATE), as `DATE(year, month, day)`, and read its weekday with the weekday function (WEEKDAY). Add the choose function (CHOOSE), which picks an item from a list, and the formula spells out the day name:

`=CHOOSE(WEEKDAY(DATE(2000,1,1)),"Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday")`

This returns Saturday. The number that `WEEKDAY` gives depends on the return type, which is the optional second argument.

| Return type | Numbers returned | Jan. 1, 2000 gives |
|---|---|---|
| 1 or omitted | 1 (Sunday) through 7 (Saturday) | 7 |
| 2 | 1 (Monday) through 7 (Sunday) | 6 |
| 3 | 0 (Monday) through 6 (Sunday) | 5 |

Microsoft Support lists these three codes and also codes 11 to 17, which start the week on other days. Google Docs Editors Help describes type 1 as counting from Sunday with Sunday as 1, and type 3 as counting from Monday with Monday as 0. If a result looks one day off, check the return type first.

## Why dates before 1582 and 1752 give two answers

The Gregorian calendar replaced the Julian calendar that Julius Caesar introduced in 45 BC, according to the USNO. NASA writes that ten days were deleted, so "1582 October 4 was followed by 1582 October 15." The days of the week kept their order through the gap: Thursday, Oct. 4, 1582 was followed by Friday, Oct. 15, 1582 (our computation).

Not every country changed then. Royal Museums Greenwich says Britain and its colonies made the change in 1752, when 2 September was followed by 14 September, and 11 days were "lost." The weekday of the same label depends on which calendar wrote it.

| Date as written | Calendar | Weekday | Gregorian formula gives |
|---|---|---|---|
| Oct. 4, 1582 | Julian | Thursday | Monday |
| Oct. 15, 1582 | Gregorian | Friday | Friday |
| Sept. 2, 1752 (Britain and colonies) | Julian | Wednesday | Saturday |
| Sept. 14, 1752 (Britain and colonies) | Gregorian | Thursday | Thursday |

For a Julian date, the same steps work with one change: replace `floor(J / 4) + 5J` with `5 - J`. We verified this variant against an independent Julian day count for every date from 1000 to 1582. When a source gives a date before 1582, find out which country and calendar wrote it before you pick a formula; a tool that projects the Gregorian calendar backward gives a different weekday from one that uses the Julian calendar.

## Print the worksheet

The worksheet puts the Zeller steps, the two checks, the doomsday anchors and the spreadsheet codes on one page, so you can calculate a weekday at a desk with nothing else open.
