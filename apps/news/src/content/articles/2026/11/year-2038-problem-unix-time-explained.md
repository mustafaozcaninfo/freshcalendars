---
title: "The Year 2038 Problem: Why Some 32-Bit Clocks Run Out on Jan. 19, 2038"
seoTitle: "Year 2038 Problem: Unix Time Ends Jan. 19, 2038"
description: "A signed 32-bit Unix time counter reaches its limit at 03:14:07 Coordinated Universal Time (UTC) on Jan. 19, 2038. Times by zone, the 2106 limit, a checklist."
type: explainer
publishedAt: "2026-11-04T15:09:00-05:00"
authors: [jessica-hartwell]
category: calendar-guides
keywords: ["year 2038 problem", "unix time 2038", "y2038", "2038 bug date", "32-bit time_t"]
assets:
  overlay: true
  kicker: "Year 2038 problem · Unix time"
  date: "2038-01-19"
  card: { top: "A 32-bit Unix counter ends", big: "Jan. 19, 2038", bottom: "03:14:07 UTC" }
  printable:
    kit: planner
    slug: year-2038-problem-checklist
    group: year-2038-problem
    title: "Year 2038 Problem Checklist: What to Check on 32-Bit Clocks"
    subtitle: "The limit moment, the 2106 limit and six places to look"
    data:
      sections:
        - type: checklist
          title: "Where a 32-bit seconds counter can hide (the list is ours)"
          groups:
            - { title: "Devices and software", items: ["Note the model and age of each device that keeps its own clock", "Ask the maker whether the firmware stores time in 64 bits", "Check whether the software uses a 32-bit time type (on Windows, _USE_32BIT_TIME_T)"] }
            - { title: "Files and records", items: ["Find file formats and databases that store a time as one 32-bit number", "Test a date after Jan. 19, 2038, such as a loan or a lease end date", "Write each answer and the date you asked next to the item"] }
      facts:
        - { text: "Unix time counts from the Epoch: 0:00:00 on Jan. 1, 1970 UTC.", src: 1, quote: "The time zero hours, zero minutes, zero seconds, on January 1, 1970 Coordinated Universal Time (UTC)." }
        - { text: "Microsoft advises against _USE_32BIT_TIME_T because an application may fail after Jan. 18, 2038.", src: 3, quote: "We don't recommend `_USE_32BIT_TIME_T` because your application may fail after January 18, 2038." }
        - { text: "glibc 2.40 widened some login-record fields to hold timestamps until the year 2106.", src: 5, quote: "This allows these fields to store timestamps beyond the year 2038, until the year 2106." }
    note: "Source: The Open Group Base Specifications Issue 7; Microsoft Learn, time, _time32, _time64; glibc 2.40 release notes. The limit moments are our calculation."
    description: "A one-page checklist for the year 2038 problem: the Unix epoch, the signed 32-bit limit on Jan. 19, 2038 and where a 32-bit time counter can hide."
    alt: "Printable year 2038 problem checklist with tick boxes for devices, software, files and records, and three sourced facts"
hero:
  src: ../../../../assets/news/year-2038-problem-unix-time-explained/year-2038-problem-unix-time-explained.webp
  alt: "Rows of server racks with cables in a data center, a place where the year 2038 problem and Unix time matter"
  caption: "File photo: server racks at the NOIRLab headquarters. A signed 32-bit Unix time counter reaches 2,147,483,647 seconds at 03:14:07 UTC on Jan. 19, 2038."
  credit: "Photo: NOIRLab/NSF/AURA/T. Slovinský / Wikimedia Commons, cropped, edited"
  license:
    name: "CC BY 4.0"
    url: "https://creativecommons.org/licenses/by/4.0"
    source: "https://commons.wikimedia.org/wiki/File:NOIRLab_HQ_Server_Racks_(6V6A0395-CC).jpg"
    author: "NOIRLab/NSF/AURA/T. Slovinský"
summary:
  - "A signed 32-bit count of seconds since the Unix epoch (Jan. 1, 1970, per The Open Group) reaches its maximum, 2,147,483,647, at 03:14:07 Coordinated Universal Time (UTC) on Tuesday, Jan. 19, 2038."
  - "That moment is 10:14:07 p.m. Eastern Standard Time (EST) on Monday, Jan. 18, 2038, in the Eastern Time zone."
  - "The next second would wrap the same counter to -2,147,483,648, which reads as Friday, Dec. 13, 1901, 20:45:52 UTC."
  - "An unsigned 32-bit counter lasts until Feb. 7, 2106, 06:28:15 UTC; the glibc 2.40 notes say some fields now hold timestamps until 2106."
faq:
  - q: "What is the year 2038 problem?"
    a: "It is the limit of a 32-bit signed count of seconds since the Unix epoch. The largest value, 2,147,483,647, falls at 03:14:07 UTC on Jan. 19, 2038. The Linux kernel documentation says the tv_sec member overflows in year 2038 on 32-bit architectures."
  - q: "Will my phone or laptop stop working in 2038?"
    a: "We found no confirmed list of devices or systems that will fail, so this story names none. Whether a product is affected depends on how its software stores time, so ask the maker."
  - q: "Does the problem happen on Jan. 18 or Jan. 19?"
    a: "In UTC it is Jan. 19, 2038, at 03:14:07. In U.S. time zones the same moment is still the evening of Monday, Jan. 18. Microsoft says an application using a 32-bit time type may fail after January 18, 2038."
  - q: "Is a 64-bit time fix available?"
    a: "Yes, in some systems. Microsoft's default time type is a 64-bit signed integer that supports dates through 23:59:59, December 31, 3000 UTC, and glibc 2.34 added support for a 64-bit time_t on 32-bit configurations such as x86."
  - q: "What happens in 2106?"
    a: "An unsigned 32-bit counter, which has no negative values, reaches 4,294,967,295 seconds at 06:28:15 UTC on Sunday, Feb. 7, 2106. We computed that date; glibc 2.40 mentions timestamps until the year 2106."
sources:
  - title: "The Open Group Base Specifications Issue 7 (IEEE Std 1003.1-2017), Definitions: 3.150 Epoch"
    url: "https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap03.html"
    publisher: "The Open Group"
  - title: "The Open Group Base Specifications Issue 7, General Concepts: 4.16 Seconds Since the Epoch"
    url: "https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html"
    publisher: "The Open Group"
  - title: "time, _time32, _time64"
    url: "https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/time-time32-time64?view=msvc-170"
    publisher: "Microsoft Learn"
  - title: "glibc 2.34 release notes (release branch copy)"
    url: "https://github.com/bminor/glibc/blob/release/2.34/master/NEWS"
    publisher: "glibc project"
  - title: "glibc release notes (2.40 entry)"
    url: "https://github.com/bminor/glibc/blob/master/NEWS"
    publisher: "glibc project"
  - title: "ReleaseGoals/64bit-time"
    url: "https://wiki.debian.org/ReleaseGoals/64bit-time"
    publisher: "Debian Wiki"
    date: "2025-08-10"
  - title: "ktime accessors"
    url: "https://www.kernel.org/doc/html/latest/core-api/timekeeping.html"
    publisher: "The Linux Kernel documentation"
  - title: "Pull request for Linux 5.6 (y2038 mailing list)"
    url: "https://lists.linaro.org/archives/list/y2038@lists.linaro.org/thread/WE7SLWAPGN4OZ57L5LQ4CBXTSOOUDOVW/"
    publisher: "Arnd Bergmann, y2038 mailing list"
    date: "2020-01-29"
  - title: "The Register report on Linux 5.6 and the year 2038"
    url: "https://www.theregister.com/2020/01/30/linux_5_6_2038/"
    publisher: "The Register"
    date: "2020-01-30"
internalLinks:
  - href: "/printable-yearly-calendar.html"
    label: "Printable yearly calendar"
  - href: "/january-calendars.html"
    label: "January printable calendars"
related: [what-is-iso-8601, what-is-a-leap-year]
downloads:
  - group: "Year 2038 Problem Checklist printables"
    title: "Year 2038 Problem Checklist: What to Check on 32-Bit Clocks"
    description: "A one-page checklist for the year 2038 problem: the Unix epoch, the signed 32-bit limit on Jan. 19, 2038 and where a 32-bit time counter can hide."
    preview: ../../../../assets/news/year-2038-problem/year-2038-problem-checklist.png
    alt: "Printable year 2038 problem checklist with tick boxes for devices, software, files and records, and three sourced facts"
    pdf: "/news/downloads/year-2038-problem/year-2038-problem-checklist.pdf"
    png: "/news/downloads/year-2038-problem/year-2038-problem-checklist.png"
    pages: 1
draft: false
---

A signed 32-bit count of seconds since the Unix epoch reaches its maximum, 2,147,483,647, at 03:14:07 Coordinated Universal Time (UTC) on Tuesday, Jan. 19, 2038. The Open Group, which publishes the Portable Operating System Interface (POSIX) specification, defines the epoch as "The time zero hours, zero minutes, zero seconds, on January 1, 1970 Coordinated Universal Time (UTC)." This explainer gives the limit moment in several time zones, a countdown, and the 2106 limit of an unsigned counter. Our printable checklist is built from the same facts.

## What happens at 03:14:07 UTC on Jan. 19, 2038?

The Open Group describes "seconds since the Epoch" as "A value that approximates the number of seconds that have elapsed since the Epoch." Software that keeps that number in a signed 32-bit integer can count up to 2,147,483,647. The Linux kernel documentation puts the consequence in one line: "the tv_sec member overflows in year 2038 on 32-bit architectures."

We computed the two moments around the limit with a short script and checked them twice:

| Counter value | Moment in UTC |
|---|---|
| 2,147,483,647 (largest signed 32-bit value) | 03:14:07, Tuesday, Jan. 19, 2038 |
| -2,147,483,648 (the next second, if the counter wraps) | 20:45:52, Friday, Dec. 13, 1901 |
| 4,294,967,295 (largest unsigned 32-bit value) | 06:28:15, Sunday, Feb. 7, 2106 |

The wrapped value is the smallest signed 32-bit number, so a clock that wraps jumps back about 136 years, to 1901.

## What time is the limit moment in your time zone?

The moment is fixed. The clock reading and even the calendar day depend on the zone. In January, U.S. zones are on standard time.

| Zone | Local time of the limit moment |
|---|---|
| Eastern Standard Time (EST), UTC-5 | 10:14:07 p.m., Monday, Jan. 18, 2038 |
| Central Standard Time (CST), UTC-6 | 9:14:07 p.m., Monday, Jan. 18, 2038 |
| Mountain Standard Time (MST), UTC-7 | 8:14:07 p.m., Monday, Jan. 18, 2038 |
| Pacific Standard Time (PST), UTC-8 | 7:14:07 p.m., Monday, Jan. 18, 2038 |
| Greenwich Mean Time (GMT), UTC+0 | 3:14:07 a.m., Tuesday, Jan. 19, 2038 |
| Central European Time (CET), UTC+1 | 4:14:07 a.m., Tuesday, Jan. 19, 2038 |
| India Standard Time (IST), UTC+5:30 | 8:44:07 a.m., Tuesday, Jan. 19, 2038 |
| Japan Standard Time (JST), UTC+9 | 12:14:07 p.m., Tuesday, Jan. 19, 2038 |

All conversions are our calculation from UTC. For how the "Z" and offsets in a timestamp work, see our guide to [International Organization for Standardization (ISO) 8601 dates and times](/news/what-is-iso-8601/). For the difference between the two time standards in the table, see our guide to [UTC and GMT](/news/utc-vs-gmt-difference-explained/).

## Why does Microsoft say January 18, 2038?

Microsoft Learn says: "We don't recommend `_USE_32BIT_TIME_T` because your application may fail after January 18, 2038." The page does not say which clock it means. Our inference, not Microsoft's statement, is that this matches the local-time view: 03:14:07 UTC on Jan. 19 is still the evening of Jan. 18 in the Eastern, Central, Mountain and Pacific zones in the table above.

Microsoft also says its default time type "is equivalent to __time64_t by default, which is a 64-bit signed integer that supports dates through 23:59:59, December 31, 3000 UTC."

## How many days are left until Jan. 19, 2038?

From Jan. 1, 2027 to Jan. 19, 2038 is 4,036 days. As of Nov. 4, 2026, the calendar date is 4,094 days away. Both counts are our calculation and include every leap day in between; the [leap year rules](/news/what-is-a-leap-year/) explain which years those are.

## What have operating systems said about 64-bit time?

These are the statements we found from the projects themselves:

- **glibc.** The 2.34 release notes say it will "Add support for 64-bit time_t on configurations like x86 where time_t is traditionally 32-bit." It adds: "Although time_t still defaults to 32-bit on these configurations, this default may change in future versions." It is "enabled with the _TIME_BITS preprocessor macro set to 64."
- **glibc 2.40.** The 2.40 release notes for struct lastlog, utmp and utmpx says: "This allows these fields to store timestamps beyond the year 2038, until the year 2106." That is the unsigned limit in the table above.
- **Debian.** The Debian Wiki says that for the application binary interface (ABI), "it was decided to do an in-architecture ABI transition for all 32-bit architectures except i386 and hurd-i386," and that "The actual transition began on February 27th, 2024." The page was last modified Aug. 10, 2025.
- **Linux kernel.** In a Jan. 29, 2020 pull request, developer Arnd Bergmann wrote that Linux 5.6 "should be the first release that can serve as a base for a 32-bit system designed to run beyond year 2038." The Register reported it on Jan. 30, 2020. That is the developer's stated goal for the release, not a statement that the problem is solved everywhere.

We did not find a statement from the Cybersecurity and Infrastructure Security Agency (CISA) or the National Institute of Standards and Technology (NIST) on this date, and we do not name any product that will fail.

## What should you check before Jan. 19, 2038?

The limit matters wherever software stores a time as one 32-bit number. The printable lists the places to look, and the first three steps are these:

1. Make a list of devices that keep their own clock and note each model and age.
2. Ask each maker whether the software stores time in 64 bits, and write down the answer.
3. Test a date after Jan. 19, 2038 in anything that holds long-term dates, such as a lease, loan or warranty end date.

The sheet also prints the epoch definition, Microsoft's warning and the glibc 2.40 line, each with its source. Mark the day on a [printable yearly calendar](/printable-yearly-calendar.html) or in the [January printable calendars](/january-calendars.html) when you plan the test.
