---
title: "Why Excel Shows Dates as Numbers, and How to Fix It: 46388 Is Jan. 1, 2027"
seoTitle: "Excel Date Showing as a Number: How to Fix It"
description: "Excel stores dates as serial numbers counted from Jan. 1, 1900, per Microsoft, so 46388 shows instead of Jan. 1, 2027. Press Ctrl+1 and pick Date to fix it."
type: explainer
publishedAt: "2026-11-04T15:03:00-05:00"
authors: [jessica-hartwell]
category: calendar-guides
keywords: ["excel date showing as number", "excel serial date", "convert number to date excel", "excel 1904 date system", "excel date format"]
dateline: "New York"
assets:
  overlay: true
  kicker: "Excel dates · Serial numbers"
  date: "2027-01-01"
  card: { top: "Excel serial number for Jan. 1, 2027", big: "46388", bottom: "Format as Date to show it" }
  printable:
    slug: excel-serial-date-numbers-2027
    group: excel-serial-dates-2027
    title: "Excel Serial Date Numbers for 2027: Lookup Card"
    subtitle: "1900 date system serial numbers for the 1st of each month and key dates"
    layout: list
    noKit: "year-reference and deadline-matrix need a source quote that holds each 2027 date, and Microsoft prints none; these serials are our calculation."
    rows:
      - ["Fri., Jan. 1, 2027", "Serial 46388"]
      - ["Mon., Feb. 1, 2027", "Serial 46419"]
      - ["Sun., Feb. 14, 2027", "Serial 46432 (Valentine's Day)"]
      - ["Mon., March 1, 2027", "Serial 46447"]
      - ["Sun., March 28, 2027", "Serial 46474 (Easter)"]
      - ["Thu., April 1, 2027", "Serial 46478"]
      - ["Sat., May 1, 2027", "Serial 46508"]
      - ["Tue., June 1, 2027", "Serial 46539"]
      - ["Thu., July 1, 2027", "Serial 46569"]
      - ["Sun., July 4, 2027", "Serial 46572 (Independence Day)"]
      - ["Sun., Aug. 1, 2027", "Serial 46600"]
      - ["Wed., Sept. 1, 2027", "Serial 46631"]
      - ["Fri., Oct. 1, 2027", "Serial 46661"]
      - ["Mon., Nov. 1, 2027", "Serial 46692"]
      - ["Thu., Nov. 25, 2027", "Serial 46716 (Thanksgiving)"]
      - ["Wed., Dec. 1, 2027", "Serial 46722"]
      - ["Sat., Dec. 25, 2027", "Serial 46746 (Christmas Day)"]
      - ["Fri., Dec. 31, 2027", "Serial 46752"]
    note: "Source: Microsoft Support, Date systems in Excel (1900 system, 1,462-day difference to the 1904 system, Ctrl+1 to open Format Cells). Serial numbers for 2027 are our calculation, checked against Microsoft's anchor: Jan. 1, 2008 is 39448. For the 1904 system, subtract 1,462. Fix steps: select cells, press Ctrl+1, choose Date; if the cell is text, use the text-to-date function (DATEVALUE)."
    description: "Free one-page card with the Excel serial number for the 1st of every month of 2027, plus Easter, July 4, Thanksgiving and Christmas, and the fix steps."
    alt: "Printable lookup card of Excel serial date numbers for 2027, from 46388 for Jan. 1 to 46752 for Dec. 31"
hero:
  src: ../../../../assets/news/excel-dates-showing-as-numbers-serial-dates/excel-dates-showing-as-numbers-serial-dates.webp
  alt: "A tablet showing a year calendar beside a white keyboard on a wooden desk, for Excel dates that show as serial numbers"
  caption: "File photo of a tablet with a year calendar next to a keyboard, by Wilfred Iven. In Excel, Jan. 1, 2027 is stored as 46388."
  credit: "Photo: Wilfred Iven / stocksnap, edited"
  license:
    name: "CC0 1.0"
    url: "https://creativecommons.org/publicdomain/zero/1.0/"
    source: "https://stocksnap.io/photo/ipad-tablet-SKGNYY6PK9"
    author: "Wilfred Iven"
    authorUrl: "https://firmbee.com"
summary:
  - "Excel stores every date as a serial number counted from Jan. 1, 1900 (serial 1), so a cell formatted as a number shows 46388 instead of Jan. 1, 2027."
  - "The fix is usually Ctrl+1, then Date in the Category list; a date stored as text needs the text-to-date function (DATEVALUE) instead."
  - "A workbook in the 1904 date system differs from the 1900 system by 1,462 days, so pasted dates can land 4 years and 1 day off."
  - "Our free card lists the 2027 serial number for the 1st of every month and for Easter, July 4, Thanksgiving and Christmas."
faq:
  - q: "What date is 46388 in Excel?"
    a: "Jan. 1, 2027 in the default 1900 date system. This is our calculation, checked against Microsoft's example that Jan. 1, 2008 is serial number 39448."
  - q: "Why does my date turn into a five-digit number?"
    a: "The cell is formatted as General or Number, so Excel shows the stored serial number. Select the cell, press Ctrl+1 and choose Date."
  - q: "What is the latest date Excel can store?"
    a: "Dec. 31, 9999, according to Microsoft's Excel specifications and limits page. Our calculation gives it the serial number 2958465."
  - q: "How do I switch between the 1900 and 1904 date systems?"
    a: "Click File > Options, click Advanced, and under 'When calculating this workbook' select or clear 'Use 1904 date system.'"
  - q: "How do I show the time part of a serial number?"
    a: "The decimal part is the time of day. Microsoft says 12:00 PM is represented as 0.5 because it is half of a day, so noon on Jan. 1, 2027 is 46388.5."
  - q: "Is the 2027 serial number card free?"
    a: "Yes. It is a free one-page US Letter PDF with selectable text, and there is a PNG image too."
sources:
  - title: "Date systems in Excel"
    url: "https://support.microsoft.com/en-us/office/date-systems-in-excel-e7fe7167-48a9-4b96-bb53-5612a800b487"
    publisher: "Microsoft Support"
  - title: "DATEVALUE function"
    url: "https://support.microsoft.com/en-us/office/datevalue-function-df8b07d4-7761-4a93-bc33-b7471bbff252"
    publisher: "Microsoft Support"
  - title: "Excel incorrectly assumes that the year 1900 is a leap year"
    url: "https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/wrongly-assumes-1900-is-leap-year"
    publisher: "Microsoft Learn"
  - title: "Format numbers as dates or times"
    url: "https://support.microsoft.com/en-us/excel/format-numbers-as-dates-or-times"
    publisher: "Microsoft Support"
  - title: "DATE function"
    url: "https://support.microsoft.com/en-us/office/date-function-e36c0c8c-4104-49da-ab83-82328b832349"
    publisher: "Microsoft Support"
  - title: "TIME function"
    url: "https://support.microsoft.com/en-us/office/time-function-9a5aff99-8f7d-4611-845e-747d0b8d5457"
    publisher: "Microsoft Support"
  - title: "Excel specifications and limits"
    url: "https://support.microsoft.com/en-us/excel/excel-specifications-and-limits"
    publisher: "Microsoft Support"
internalLinks:
  - href: "/printable-yearly-calendar.html"
    label: "2027 printable yearly calendar"
  - href: "/january-calendars.html"
    label: "January 2027 printable calendar"
related: [julian-date-calendar-2027-2026-printable, how-to-calculate-day-of-year, what-is-a-leap-year]
downloads:
  - group: "Excel Serial Date Numbers for 2027 printables"
    title: "Excel Serial Date Numbers for 2027: Lookup Card"
    description: "Free one-page card with the Excel serial number for the 1st of every month of 2027, plus Easter, July 4, Thanksgiving and Christmas, and the fix steps."
    preview: ../../../../assets/news/excel-serial-dates-2027/excel-serial-date-numbers-2027.png
    alt: "Printable lookup card of Excel serial date numbers for 2027, from 46388 for Jan. 1 to 46752 for Dec. 31"
    pdf: "/news/downloads/excel-serial-dates-2027/excel-serial-date-numbers-2027.pdf"
    png: "/news/downloads/excel-serial-dates-2027/excel-serial-date-numbers-2027.png"
    pages: 1
draft: false
---

Excel stores every date as a serial number counted from Jan. 1, 1900, which is serial 1, according to Microsoft, so a cell formatted as a number shows 46388 instead of Jan. 1, 2027. The usual fix takes two steps: select the cells, press Ctrl+1 and choose Date. Below are the three causes, a lookup table of 2027 serial numbers and the 1900 leap-year quirk.

## How does Excel store a date as a number?

Microsoft's "Date systems in Excel" page says that in the 1900 date system, "dates are calculated by using January 1, 1900, as a starting point." Each day after that adds 1. Microsoft's page for the text-to-date function (DATEVALUE) gives two anchors: "By default, January 1, 1900 is serial number 1, and January 1, 2008 is serial number 39448." The date-building function (DATE) "returns the sequential serial number that represents a particular date."

The number after the decimal point is the time. Microsoft's TIME function page says "12:00 PM is represented as 0.5 because it is half of a day," so noon on Jan. 1, 2027 is 46388.5.

## Why does my Excel date show as a number?

Three causes cover most cases. Each has its own fix.

| Cause | What you see | Fix |
|---|---|---|
| The cell is formatted as General or Number | 46388 | Select the cells, press Ctrl+1, choose Date in the Category list |
| The date is stored as text | A date that formatting does not change | Use DATEVALUE(date_text), then format the result as Date |
| A 1904 workbook was pasted into a 1900 workbook | Dates 1,462 days off | Switch the date system or add 1,462 days |

**Cause 1: the cell format.** Microsoft's "Format numbers as dates or times" page says to press Ctrl+1 to open the Format Cells dialog box, then choose "Date" or "Time" in the Category list. The stored number does not change; only the display does. For how countries write the same date differently, see our [date formats by country](/news/date-formats-by-country-mm-dd-dd-mm/) guide.

**Cause 2: a date stored as text.** Microsoft says "The DATEVALUE function converts a date that is stored as text to a serial number that Excel recognizes as a date." The syntax is DATEVALUE(date_text). The result is a serial number, so format that cell as a Date too.

**Cause 3: two date systems.** See the next section.

## What is the 1904 date system in Excel?

Microsoft says "In the 1904 date system, dates are calculated by using January 1, 1904, as a starting point," and "The difference between the two date systems is 1,462 days." The 1900 system is "the default date system in Excel for Windows, Excel 2016 for Mac, and Excel for Mac 2011"; the 1904 system is "the default date system in earlier versions of Excel for Mac."

Microsoft's example: July 5, 2011 is 40729 in the 1900 system and 39267 in the 1904 system. Read 39267 in a 1900 workbook and it is a date 1,462 days earlier, which is 4 years and 1 day. In our calculation that is July 4, 2007. If your pasted dates are about four years off, check the system.

To change it, per Microsoft: click File > Options, click Advanced, and under "When calculating this workbook" select or clear "Use 1904 date system." For Jan. 1, 2027, the 1904 serial number is 44926, which is 46388 minus 1,462 (our calculation).

## What are the Excel serial numbers for 2027 dates?

Our calculation for the 1900 system, checked against Microsoft's anchor of 39448 for Jan. 1, 2008. The rule is the number of days after Dec. 30, 1899, for any date after Feb. 28, 1900.

| Date | 1900 system serial | 1904 system serial |
|---|---|---|
| Fri., Jan. 1, 2027 | 46388 | 44926 |
| Mon., Feb. 1, 2027 | 46419 | 44957 |
| Mon., March 1, 2027 | 46447 | 44985 |
| Thu., April 1, 2027 | 46478 | 45016 |
| Sat., May 1, 2027 | 46508 | 45046 |
| Tue., June 1, 2027 | 46539 | 45077 |
| Thu., July 1, 2027 | 46569 | 45107 |
| Sun., Aug. 1, 2027 | 46600 | 45138 |
| Wed., Sept. 1, 2027 | 46631 | 45169 |
| Fri., Oct. 1, 2027 | 46661 | 45199 |
| Mon., Nov. 1, 2027 | 46692 | 45230 |
| Wed., Dec. 1, 2027 | 46722 | 45260 |

Holidays and year-end:

| Date | 1900 system serial |
|---|---|
| Sun., Feb. 14, 2027 (Valentine's Day) | 46432 |
| Sun., March 28, 2027 (Easter) | 46474 |
| Sun., July 4, 2027 | 46572 |
| Thu., Nov. 25, 2027 (Thanksgiving) | 46716 |
| Sat., Dec. 25, 2027 | 46746 |
| Fri., Dec. 31, 2027 | 46752 |
| Sat., Jan. 1, 2028 | 46753 |
| Tue., Feb. 29, 2028 | 46812 |

The same serial numbers line up with the days of the year in our [Julian date calendar for 2027](/news/julian-date-calendar-2027-2026-printable/): Dec. 31, 2027 is day 365 there and 46752 here, and our [day-of-year guide](/news/how-to-calculate-day-of-year/) shows the counting by hand.

## What is the earliest and latest date Excel can use?

Microsoft's "Excel specifications and limits" page lists the earliest date as "January 1, 1900 (January 1, 1904, if 1904 date system is used)" and the latest as "December 31, 9999." In our calculation, Dec. 31, 9999 is serial 2958465.

The DATE function adds the year to 1900 for small values: "If year is between 0 (zero) and 1899 (inclusive), Excel adds that value to 1900."

## Why does Excel think 1900 was a leap year?

Microsoft Learn explains: "When Lotus 1-2-3 was first released, the program assumed that the year 1900 was a leap year, even though it actually was not a leap year." That choice "allowed Microsoft Multiplan and Microsoft Excel to use the same serial date system used by Lotus 1-2-3 and provide greater compatibility with Lotus 1-2-3."

Microsoft adds that Excel "correctly handles all other leap years, including century years that are not leap years (for example, 2100). Only the year 1900 is incorrectly handled." Our serial numbers for 2027 and 2028 count real days, and Feb. 29, 2028 is serial 46812. For how leap years work, see [what is a leap year](/news/what-is-a-leap-year/).

## Print the 2027 Excel serial date card

The free one-page card lists the 1900 system serial number for the 1st of every month of 2027 and for Easter, July 4, Thanksgiving and Christmas, with the fix steps in the note. Keep it next to a spreadsheet, or print a [2027 yearly calendar](/printable-yearly-calendar.html) or the [January 2027 calendar](/january-calendars.html) beside it to check a date by eye.
