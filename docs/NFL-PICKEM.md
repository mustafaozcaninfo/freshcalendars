# NFL pick'em hub: weekly update

The hub is `/news/printable-nfl-pickem-sheets-2026/` (`apps/news/src/content/articles/2026/10/printable-nfl-pickem-sheets-2026.md`). It always carries the week in play and the next three weeks, plus two season sheets, and its tables are written by the generator. Every NFL date and time on the site comes from one file:

`packages/generator/data/nfl-2026/nfl-2026-canonical-schedule.csv` (272 games, reconciled with NFL.com on Oct. 23, 2026; `master-qa-report.txt`).

## The routine (Tuesday, after Monday night's game; about 15 minutes)

```bash
git pull origin main
pnpm fc nfl-sync              # report only: what changed since the last check
pnpm fc nfl-sync --write      # apply confirmed changes to the CSV, writes sync-report.txt
pnpm fc news-pickem           # sheets for the week in play + 3, season sheets, hub tables, downloads, updatedAt
pnpm exec tsx packages/generator/src/nfl2026.ts   # week-by-week tables in printable-nfl-schedule-2026-2027-pdf
pnpm news:build && pnpm news:verify && pnpm news:seo-audit
git add packages/generator/data/nfl-2026 apps/news/public/downloads/nfl-pickem-2026 apps/news/src/assets/news/nfl-pickem-2026 apps/news/src/content/articles
git commit -m "chore(news): NFL pick'em hub, Week N"   # list kickoff changes from sync-report.txt
git push origin main
```

Run it again on any day the NFL announces a flex (Sunday Night Football flexes are usually announced 12 days ahead; Week 18 times after Week 17).

## What `nfl-sync` trusts

| Change | Applied when | Otherwise |
|---|---|---|
| Kickoff time or day | ESPN's feed **and** a club site (schema.org event on the club's `/schedule/` page) agree on the new time | listed under "Differences not applied"; check NFL.com by hand |
| Network | together with a confirmed kickoff change | listed; one source only |
| Final score | ESPN marks the game final | n/a |

Club sites are official (the clubs publish the NFL schedule); 29 of 32 publish the events, so every game is covered by at least one club except the rare game between the three that do not (Panthers, Texans, Dolphins). The CSV keeps a note on every changed row (`notes_or_discrepancy`: old time, new time, which club site, date).

## When a kickoff changes, also fix

`nfl-sync` prints the change. The hub and the season schedule story update themselves; these do not:

1. **The week story** (`nfl-week-N-schedule-2026-*.md`): game table, time-zone table, summary and FAQ counts, its `assets.printable` rows; then `pnpm fc news-assets <slug>` and set `updatedAt`. Add the club schedule page to `sources:`.
2. **Night-game guides** (`sunday-night-football-tonight-*`, `monday-night-football-tonight-*`) when a prime-time game moves.
3. **KEY_DATES** (`apps/news/src/lib/keydates.ts`) if the moved game is listed there.
4. The season PDFs in `public/downloads/nfl-2026-2027/` were drawn outside our generators (`PDF_LEGACY`); they cannot be redrawn here. Note the change for the site owner.

Updates are silent (no "Updated" callout, no corrections entry): change the facts and `updatedAt`.

## Adding a week story

Name it `nfl-week-N-schedule-2026-<anything>.md`. The hub finds it by that prefix and links it from the "This week" block and the season table on the next `pnpm fc news-pickem` run. Put `printable-nfl-pickem-sheets-2026` in its `related:` list.

## Season sheets

`news-pickem` also draws `nfl-survivor-pool-sheet-2026` (Weeks 1-18 and every team's bye week, computed from the CSV) and `nfl-season-pick-em-tracker-2026` (14 players by 18 weeks, landscape). Both redraw only when the data changes. A sheet that fails a print check stops the run; fix the template in `pickem.ts`, never the threshold.

## After Week 18

Set `--weeks 18-18` until the playoffs, then add a playoff bracket sheet (dates in `nfl-playoff-schedule-2027-*`) or retire the hub to the 2027 season (new slug, `printable-nfl-pickem-sheets-2027`).
