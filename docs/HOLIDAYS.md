# Holidays — Fresh Calendars

## Sources

- Legacy: `backup/public_html/templates/holiday-dates.php` + per-holiday content templates
- New: `packages/engine/src/holidays/*` (rules, not static dates)

## Sitemap when-is (v1 — must ship)

| Slug | Rule type |
|------|-----------|
| `new-years-day` | fixed Jan 1 |
| `new-years-eve` | fixed Dec 31 |
| `martin-luther-king-day` | 3rd Monday January |
| `groundhogs-day` | fixed Feb 2 |
| `valentines-day` | fixed Feb 14 |
| `presidents-day` | 3rd Monday February |
| `st-patricks-day` | fixed Mar 17 |
| `easter` | Computus |
| `earth-day` | fixed Apr 22 |
| `cinco-de-mayo` | fixed May 5 |
| `mothers-day` | 2nd Sunday May |
| `memorial-day` | last Monday May |
| `flag-day` | fixed Jun 14 |
| `fathers-day` | 3rd Sunday June |
| `independence-day` | fixed Jul 4 |
| `labor-day` | 1st Monday September |
| `columbus-day` | 2nd Monday October |
| `halloween` | fixed Oct 31 |
| `veterans-day` | fixed Nov 11 |
| `thanksgiving` | 4th Thursday November |
| `black-friday` | day after Thanksgiving |
| `cyber-monday` | Monday after Thanksgiving |
| `christmas-day` | fixed Dec 25 |
| `daylight-savings` | US DST start/end (with `/page/daylight-savings`) |

## Hub

`/holidays` — planning-year list + links into when-is.

## Later (legacy templates exist, not in sitemap)

`christmas-eve`, `good-friday`, `april-fools-day`, `armed-forces-day`, `star-wars-day`, `international-womens-day`, `world-teachers-day`, `indigenous-peoples-day`, `dia-de-los-muertos`, UK/CA/AU/IN holiday pages.
