# /news/ printables: topic kits plan

Written 2026-11-02, updated 2026-11-03. Status: **phase 0 and the first three kits built** (branch `feat/printable-kits`); phases 2 and 3 are still proposals.

Owner's decisions (2026-11-03):
- **No ink-saver copies any more.** `news-assets` no longer draws `-ink` sheets; `inkSaver` is ignored with a warning; stories published from 2026-11-14 may not list an `-ink` PDF (`10-PDF-NO-INK`). Published `-ink` files stay as they are.
- **`10-PDF-FACTS` is an error from day one** for every story whose printable has a `.print.json` record (every `news-assets` run writes one) and for every story published from 2026-11-14 (`PRINT_SINCE`, the day after the last story already scheduled on `main`).
- **Landscape is the default** for `watch-guide` and `deadline-matrix`; `landscape: false` turns it off.
- **Kits are required** (2026-11-03, second decision) in the categories that have one: `school-calendars` (`school-year`), `sports` and `entertainment` (`watch-guide`), `retail-dates`, `money-benefits`, `elections` and `planning` (`deadline-matrix`). `noKit: "<why>"` is the only way out. Enforced by `news-assets` and `10-PDF-KIT` for every record drawn from then on (`v: 2`); `KIT_FOR_CATEGORY` in `scripts/lib/print-record.mjs` grows as new kits land.

The problem: every story's printable comes out of the same four layouts in `packages/generator/src/newsPrintable.ts`, so a Social Security payment sheet, a CMA Awards watch sheet and a Wordle answer list look like the same page with different words. The goal is a printable designed for its subject and filled from the story's researched facts, with every accuracy and print-safety guarantee we have today kept, and a few new ones added.

## 1. The current pipeline

### What it does

| Piece | Job |
|---|---|
| `assets.printable` in frontmatter | `title`, `subtitle`, `rows`, `note`, optional `layout`, `columns`, `inkSaver`, `notesLabel` |
| `newsAssets.ts` (`pnpm fc news-assets <slug>`) | reads the block, picks the color (`assets.color`, scene color or `CATEGORY_COLOR`) and the header icon (`SCENE_ICON`), calls `printableHtml`, renders through `renderPrintables`, prints the `downloads:` entry |
| `newsPrintable.ts` | one data shape (`when` + `what` strings, optional `date`, `section`), four layouts: `list`, `month`, `timeline`, `checklist`, plus `auto`. Checks typed weekdays ("Sat., Nov. 21" must be a Saturday), max 40 rows, cells under 140 characters, a year in the title, a "Source:" note. A fit script scales the content between 80% and 130% and fills what is left with a ruled notes box |
| `printables.ts` `renderPrintables()` | Chromium render, `assertPrintable`, PDF + PNG, keeps the old file when only the dates changed (`samePdf`) |
| `printCheck.ts` | measures every text node: 24 px safe area, footer collision, clipping by a box, type under 8 px, contrast under 3:1 (error) and 4.5:1 (warning), glyphs from a system font (through CDP), raster images in the PDF, empty bottom quarter (warning) |
| `apps/news/src/lib/pdf-meta.mjs` | at build: PDF metadata, license, top-right link to the story, canonical map |
| `scripts/lib/pdf-print.mjs` + audit `10-PDF-*` | re-checks the shipped PDF: Letter size, embedded fonts, safe area (12 pt), overlapping lines, text layer, raster images, title vs heading |

### What it is used for (counted on `main`, 2026-11-02)

- 720 stories; 457 have `assets.printable`, 521 have `downloads:`.
- Layouts set by hand: `list` 218, `checklist` 60, `timeline` 47, `month` 8, `auto` 6; the other ~118 leave it to `auto`, which mostly gives `list`. **About three in four printables are a two-column table.**
- By category: sports 104, holidays 69, uk-canada 57, entertainment 45, retail-dates 30, money-benefits 27, calendar-guides 27, school-calendars 21, elections 19, gaming-tech 15, sky-events 13, time-change 12, planning 10, puzzles 8.
- About 30 one-off generators (`news-sky`, `news-shopping`, `news-pickem`, `news-ssa`, `news-election2026`, `news-nyballot`, `news-txcalendar`, ...) show what a themed sheet looks like when someone writes it by hand: the Orionid viewing-times sheet (`sky2026.ts`) has a city table of moonset times, a checklist and a tally grid; the Black Friday planner (`shopping2026.ts`) has store hours, a list and a budget. Each is 50 to 400 lines of single-use code, copies CSS from the last one, and is out of reach for a writer session.

### What it cannot do

1. **The data model is two strings per row.** Everything is flattened into `when` / `what`. Real examples on `main`:
   - The CMA Awards watch sheet stores "Entertainer of the Year pick" / `"____________________"` as a row to fake a fill-in field.
   - The FedEx/UPS/USPS sheet packs three carriers into one `what` cell ("FedEx Ground 4-day; USPS Priority Mail; UPS: ..."), where a carrier-by-date grid is what a reader wants.
   - The soccer TV sheet packs league, match and channel into one cell, and times exist in Eastern Time (ET) only.
   - The Wordle month sheet uses `checklist` with tick boxes next to answers nobody needs to tick.
2. **No computed content.** Weekdays, day counts, time-zone conversions, moonset per city, "days of school off" are typed by the writer (or not shown). The data to compute them is already in the repo: `packages/engine` (holidays, dates), `packages/generator/src/data/usno-2026-27.json` (sunrise, sunset, moonrise, moonset, illumination per city), `nflData.ts` (schedule CSV), `apps/news/src/content/puzzles/` (official puzzle data).
3. **No per-topic design.** One color and one 44 px icon per sheet; the same header, rule and notes box everywhere. No palettes, motifs, stat tiles, mini calendars, grids, charts, fill-in fields, cut lines or multi-page.
4. **No link between a printed fact and its source.** The `note` names sources for the whole sheet; rule 11 ("nothing on a printable that the story does not support") is checked by review only.
5. **Gaps in the checks** found while reading the code and building the prototype (section 6):
   - `parseWhen` only checks a weekday written *before* the month ("Mon., Jan. 18"). The trailing form many stories use, "Jan. 18, 2027 (Mon.)", is not checked at all. The Cobb County story's own source printed Jan. 4, 2027 as a Friday (it is a Monday); a typed weekday after the date would have passed.
   - The "bottom quarter is empty" warning measures from the lowest text above the footer. A sheet that puts its source note at the bottom with `position:absolute` hides a large empty band: the prototype had about 25% of the page empty and got no warning.
   - The fit script lives only in `newsPrintable.ts`; custom generators get no auto-scaling.

## 2. The proposal in one paragraph

Replace "four layouts over two strings" with **kits**: one TypeScript module per kind of printable (a school year at a glance, a viewing night, a watch guide, a deadline matrix, ...). A kit declares a typed data schema, validates the data (dates real, ranges ordered, weekdays and counts computed by code, every fact tied to a source), computes what can be computed from repo data, and draws the sheet from a shared component library with a category theme. The writer fills a structured `data:` block instead of strings; the researcher returns that block already shaped. `printCheck.ts` stays the print gate, the audit gains fact and freshness checks. Old stories keep their PDFs; the four current layouts stay as the fallback kit `list`.

## 3. Kit catalog by category

Each kit: what the sheet is, the data it needs, where the data comes from (**F** = fact sheet from `news-researcher`, with a source; **C** = computed by the kit from repo data; **U** = the reader fills it in). "Unconfirmed" values are always allowed and render as "Not yet announced" (with last year's value labeled as last year if the story gives it); they are never drawn on a grid or in a count.

### school-calendars (21 stories)

| Kit | Sheet | Data |
|---|---|---|
| `school-year` (**prototyped**) | year at a glance, 10 to 12 mini months, breaks filled, holidays ringed, remote days dashed, early releases underlined, a key, stat tiles ("26 weekdays of breaks"), "not yet confirmed" box, "my family's dates" lines | F: first/last day, each event `{from, to?, kind, label, src}`; C: weekdays, counts, month spans; U: family dates |
| `school-compare` | two to four districts side by side, one row per break, columns per district | F: per district the same event kinds; C: overlaps ("both off Nov. 23-27") |
| `break-planner` | one break (Thanksgiving, winter, spring) as a week strip with child-care / travel plan boxes | F: break dates per district; U: plans |

### holidays (69) and uk-canada (57)

| Kit | Sheet | Data |
|---|---|---|
| `holiday-countdown` | numbered day tiles to the date (Advent-style without art), one task per day | F: holiday date, observance rules; C: day numbers, weekdays; U: tasks |
| `observance-card` | a holiday's facts: date this year and next 3 years, what is closed, what is open, a short "how it is set" rule | F: closures (agency, bank, post office), the rule; C: future dates from `packages/engine` |
| `menu-timeline` (Thanksgiving, Christmas, Diwali, Hanukkah) | cooking or prep schedule counted back from a meal time, with oven/thaw times | F: thaw and cook times from USDA FSIS; C: clock times from the reader's chosen meal time, printed for 3 common times; U: guest list |
| `bank-holiday-year` (uk-canada) | the year's bank or statutory holidays by nation/province as a matrix | F: GOV.UK / provincial pages; C: weekdays, substitute days |

### elections (19), nonpartisan only

| Kit | Sheet | Data |
|---|---|---|
| `voter-plan` | registration deadline, early voting window per day with hours, mail ballot request/return dates, Election Day hours, ID rules, "my polling place / my plan / what I will bring" fields | F: every deadline and hour from the state election office, per county when hours differ; C: days left between deadlines, weekdays; U: plan fields. No candidates, no polls |
| `ballot-measure-list` | measures on the ballot with number and official title, a blank box next to each (not "yes/no" suggestions) | F: Secretary of State measure list, official titles only |

### money-benefits (27)

| Kit | Sheet | Data |
|---|---|---|
| `payment-calendar` | a year of payment dates as 12 mini months with the rule that sets them (birth-date groups for Social Security, SSI on the 1st or the business day before) | F: the agency's published schedule; C: the business-day shift checked against the engine's federal holidays (warn if F and C disagree) |
| `deadline-matrix` (shared with retail and planning) | rows = dates, columns = programs or carriers, filled cells name the action | F: each cell with its source |

### sky-events (13)

| Kit | Sheet | Data |
|---|---|---|
| `sky-night` | viewing log: peak night banner, per-city table of moonset, dark-sky window, sunrise for 2 to 3 mornings, moon phase drawn as a vector disc, where to look (compass rose drawn in SVG), 15-minute tally grid, checklist | F: peak date and rate (American Meteor Society, NASA); C: moon and sun times from `usno-2026-27.json` (refresh with the USNO API when a date is missing, never typed), twilight from the NOAA formulas `sky2026.ts` already uses |
| `eclipse-local` | contact times per city, a sun disc diagram of coverage, safety box | F: NASA eclipse tables; C: time-zone conversions |

### time-change (12) and calendar-guides (27)

| Kit | Sheet | Data |
|---|---|---|
| `clock-change` | before/after clock faces drawn in SVG, sunrise/sunset the day before and after for 8 cities, "clocks to change" checklist | F: the rule (Energy Policy Act); C: dates from the engine, sun times from USNO data |
| `year-reference` | year grid with week numbers, day-of-year, or Julian dates (the existing `news-julian` and `news-weeks` sheets become kit instances) | C only |

### retail-dates (30)

| Kit | Sheet | Data |
|---|---|---|
| `store-hours` | store-by-day grid (Thanksgiving, Black Friday, Christmas Eve, Christmas Day) with open/close times, "closed" in words, the year the hours are from in each cell, a shopping list and budget column | F: hours from each chain's newsroom; last year's hours labeled "2025" per cell; U: list, budget |
| `deadline-matrix` | last ship dates: rows = dates, columns = FedEx, UPS, USPS service levels; cell = service name | F: each carrier's own page; C: weekdays, "days before Dec. 25" |
| `deal-tracker` | items, target price, where, date checked (all blank fields, no prices of ours) | U only, framed by the event dates (F) |

### sports (104) and entertainment (45)

| Kit | Sheet | Data |
|---|---|---|
| `watch-guide` | events grouped by day, each with start time in ET, CT, MT and PT columns, channel and stream as words, a pick or score field per event | F: start time in one zone with its source, channel and stream; C: the other three zones (and the date change after midnight), weekdays; U: picks, scores |
| `pickem` / `bracket` | the existing NFL pick'em sheets become a kit; brackets for playoffs and tournaments drawn as SVG lines, team names as text | F: schedule (`nflData.ts` CSV or league page); U: picks, tiebreaker |
| `awards-ballot` | categories with nominees as tick boxes, "my pick" and "winner" columns, show time in four zones | F: the academy's nominee list, broadcast details |
| `season-tracker` | a team's games in a grid with result and record fields | F: schedule; U: results |

### gaming-tech (15)

| Kit | Sheet | Data |
|---|---|---|
| `release-tracker` | games or devices by release date with platform columns (words, never logos), preorder and "got it" boxes | F: publisher pages; unconfirmed dates in words only |
| `launch-times` | one global release time converted to US zones and a few world cities | F: the publisher's time; C: conversions |

### puzzles (8 stories, plus the daily pages)

| Kit | Sheet | Data |
|---|---|---|
| `puzzle-sheet` | a blank solving sheet in the game's shape: Wordle 6 x 5 grid with a letter tracker, Connections 4 x 4 grid with group lines, Strands letter board, Spelling Bee hive drawn in SVG with a word list; answers on page 2, upside down, behind a cut line | F: official data from `apps/news/src/content/puzzles/<game>/<date>.json` (already saved and checked by `news:puzzle-check`); never typed |
| `answer-archive` | a month of answers as a calendar grid (answer in the cell) instead of a checklist | F: the same saved data |

## 4. Design capabilities to add, checked against the hard rules

| Capability | How it stays inside the rules |
|---|---|
| **Category themes**: a palette per category (primary, accent, soft fill, line, text on primary); no ink-saver twin (retired) | Palettes are tokens in one file; a unit test computes every text/background pair at 4.5:1, so `printCheck` never fails on theme colors. Meaning never by color alone: every marked state also has a shape (fill, ring, dash, underline) and a word in the key |
| **Vector motifs**: a header band or corner ornament per category (stars for sky, leaves for autumn holidays, ballot ticks for elections, a pitch for soccer) | Drawn as plain SVG `<path>` / `<circle>` in our code, repeated by a loop, never SVG `<pattern>`, `filter`, `box-shadow` or a repeating gradient (those rasterize; the raster check catches it). Kept out of the safe area only if they contain text; decoration may bleed to the edge, which home printers trim harmlessly |
| **Icons**: extend `ICONS` in `art.ts` (tv, ticket, trophy, ship-box, school bus, telescope, sun, moon phases, compass, scissors, check) | Our own drawings; no brand marks. Network and store names stay text |
| **Components**: header, stat tiles, data table, mini month, year grid, week strip, clock face, moon disc, compass rose, bar chart (SVG rects with labeled values), tally boxes, tick boxes, fill-in lines, cut line with scissors icon, key/legend, "not yet confirmed" box, source note | One `components.ts` shared by every kit; all text in HTML (Sora/Manrope), shapes in SVG. Charts carry their numbers as text labels, so the value is never only a bar length |
| **Fill-in fields** | Lines are borders, boxes are borders; no glyphs like underscores repeated as text (the CMA "_____" hack goes away) |
| **Multi-page** | Several `.page` sections in one `doc()`; `printCheck` already loops pages. Use for answers-on-page-2 and long schedules; one page stays the default |
| **Landscape** | `LETTER_LANDSCAPE` exists; matrices and brackets use it |
| **Cut lines / fold lines** | Dashed border plus a drawn scissors icon; labels "cut here" in Manrope |
| **Auto-fit for every kit** | Move the `__fit` script from `newsPrintable.ts` into `renderPrintables` as an option, so kits scale between 80% and 130% and never overflow |

Hard rules, unchanged: real vector text; US Letter (A4 only as an extra `-a4` file); 0.25 in safe area, top-right band free for the build's link; only embedded Sora and Manrope (symbols as SVG, "to" instead of arrows); type at least 8 px (6 pt), body 10 px, cells 9 px; contrast at least 3:1, aim 4.5:1; no third-party art, logos or map data we have not checked the license of; under 2 MB.

## 5. Research to printable: structured data with a source on every fact

### Hand-off format

The researcher's fact sheet gets a fifth section, **PRINTABLE DATA**, asked for by the main session when it names the kit. It is YAML the writer copies, not prose:

```yaml
kit: school-year
sources:                       # ids point at the story's sources: list
  imp: { url: "https://www.cobbk12.org/aspire/important-dates", publisher: "Cobb County School District" }
  bts: { url: "https://www.cobbk12.org/duewest/back-to-school-info-2026-2027.130408", publisher: "Cobb County School District" }
data:
  start: "2026-08"
  events:
    - { from: "2026-08-03", kind: first, label: "First day of school", src: bts }
    - { from: "2026-12-21", to: "2027-01-04", kind: break, label: "Holiday Break and staff workdays", src: imp,
        quote: "Holiday Break and staff workdays Dec. 21 - Jan. 4" }
  unconfirmed:
    - { label: "Thanksgiving week", why: "not on the Important Dates list" }
    - { label: "Last day of school", why: "not on the list" }
```

Rules for this block:

- **ISO dates and 24-hour times with a zone, never weekday words.** The kit writes "Mon., Dec. 21" itself. A typed weekday cannot be wrong if nobody types it.
- **`src` on every fact**, pointing at a source that is in the story's `sources:`. `quote` holds the exact cell or sentence for numbers, dates and times (the researcher already returns it).
- **Computed values are not in the data.** Time-zone conversions, moonset, day counts, business-day shifts come from code and repo data. If the researcher's value disagrees with the computed one (a payment date the engine would shift), the kit stops with both values so a human checks.
- **Unconfirmed is a first-class value**, rendered in words and excluded from grids and counts.

Where it lives: in `assets.printable.data` for short sheets; in `apps/news/src/content/printables/<slug>.yaml` when it is long (store hours, a season schedule), the same way puzzle data lives in `apps/news/src/content/puzzles/`. The writer agent's job shrinks: pick the kit, paste the data, run `pnpm fc news-assets <slug>`.

### Gates that keep it error-free

At draw time (`news-assets`, errors stop the sheet):

1. Schema per kit (zod, the same library as `content.config.ts`): required fields, enums for `kind`, ISO formats.
2. Kit validators: dates exist, ranges ordered, no day carrying two conflicting kinds, events inside the sheet's span, counts recomputed, every `src` resolves to a story source.
3. Computed cross-checks (C vs F) as above.
4. `printCheck.ts`, unchanged rules, plus two fixes:
   - empty-space warning measured as the largest vertical gap between any two text blocks on the page, not only the gap above the footer;
   - weekday check also for the trailing "(Mon.)" form in the legacy `list` kit.

At build/audit time (new checks next to `10-PDF-*`):

| Check | What it does |
|---|---|
| `10-PDF-FACTS` (error) | extracts the PDF text (pdfjs is already used) and every date, clock time, dollar amount and percentage in it; each must also appear in the story body or its frontmatter data. Catches a printable that drifts from an updated story |
| `10-PDF-FRESH` (error) | `news-assets` writes `<slug>.print.json` with the kit, a hash of the data and the generator version (like `<slug>.hero.json`). If the story's printable data changed and the PDF did not, the build fails: an update to the facts must regenerate the sheet |
| `10-PDF-KIT` (warning) | a story in a category with a kit that still uses the plain `list` layout; and two printables in the same category this month that are the same kit with the same theme variant |

## 6. Feasibility: the `school-year` prototype

Built outside the repo (nothing committed) from the Cobb County story's own facts, rendered with the real `doc()`, `fontFaces()`, `icon()` and `assertPrintable()`:

- **Print checks pass**, 0 raster images in the PDF. All marks (filled break days, ringed holidays, dashed digital learning days, underlined early releases) are CSS borders and fills, so they stay vector.
- Stat tiles computed from the dates: 26 weekdays of breaks, 3 single-day holidays, 4 digital learning days, 9 early-release days (checked by hand against the district list).
- The two facts the district does not list (Thanksgiving week, last day of school) are in a "Not yet confirmed" box, not on the grid.
- It found the empty-space gap in `printCheck.ts` described in section 1: about a quarter of the page was empty and only a "5 px above the footer" warning fired. The real kit would use the shared fit script and a third row of content (a "days off by month" bar chart or a larger family-dates box).

Prototype files (scratch, not in the repo): `school-year.mts`, `school-year-proto.pdf` and `.png` in the session's scratchpad `proto/` folder.

## 7. Phased plan

### Phase 0: foundation (one PR, shared code)

- `packages/generator/src/kits/` with `types.ts` (`Kit<D>` = `{ name, schema, validate(d, story), compute(d), render(d, theme, page) }`), `components.ts`, `themes.ts` (category palettes + ink twins, contrast unit test), `kits/list.ts` wrapping today's four layouts so nothing breaks.
- `newsAssets.ts`: `assets.printable.kit` selects the kit; no `kit` means today's behavior. `inkSaver` is retired.
- Fit script into `renderPrintables`; the two `printCheck` fixes; `<slug>.print.json` record.
- Audit: `10-PDF-FRESH`, then `10-PDF-FACTS` as a warning for two weeks on old stories, error for stories published after it lands.
- Docs: kit list and data format in the `news-article` skill ("Printable PDF rules" keeps its numbering), `news-visuals` section 5, a PRINTABLE DATA section in `.claude/agents/news-researcher.md`, the kit step in `news-writer.md`.

### Phase 1: the first three kits (chosen by reach and data already in the repo)

1. **`watch-guide`** for sports and entertainment (149 stories, the two biggest printable categories and the most cramped `list` sheets). Day groups, four time-zone columns computed from one sourced time, channel/stream as words, pick and score fields; landscape option for busy weekends. Converts the CMA, soccer-on-TV and game-time sheets.
2. **`deadline-matrix`** for retail-dates, money-benefits, elections and planning (86 stories). Dates as rows, programs/carriers/deadline types as columns, computed weekdays and "days before" the target date, unconfirmed cells in words. Converts the shipping-deadline and early-voting sheets; `voter-plan` is a variant with plan fields.
3. **`school-year`** for school-calendars (21 stories, but each one is a district's whole year and readers keep it on the fridge). Already prototyped; adds district comparisons later.

Each kit ships with a test fixture from a real story, a unit test for its validator (a wrong range, an unknown `src`, a conflicting day), and one regenerated story as the example.

### Phase 2

`sky-night` (USNO data already saved), `puzzle-sheet` + `answer-archive` (official data already saved and checked), `store-hours`, `payment-calendar`, `awards-ballot`, `holiday-countdown`. Fold `sky2026.ts`, `shopping2026.ts`, `pickem.ts` and `ssa*.ts` into kits as they are next touched, not all at once.

### Phase 3

`menu-timeline`, `bracket`, `clock-change`, `school-compare`, `release-tracker`; A4 variants for uk-canada kits; a contact sheet of every kit (`pnpm fc news-kits`) like `news-scenes`, so writers pick by eye.

### What does not change

Published PDFs stay as they are until their story is updated (`samePdf` keeps unchanged files, so a redeploy does not purge them); file names change only when the content changes a lot (rule 14). No Lighthouse. Writers keep committing only their story's files; kits and components change through a branch and pull request.

## 8. What was built (2026-11-03)

| Piece | Where |
|---|---|
| Kit interface, date helpers, source resolution, problem list | `packages/generator/src/kits/kit.ts` |
| Category themes and motifs, contrast test | `kits/themes.ts`, `newsRules.test.ts` |
| Shared components (header, tiles, boxes, fill-in lines, notes, page with fit script) | `kits/components.ts` |
| `school-year`, `watch-guide`, `deadline-matrix` | `kits/schoolYear.ts`, `kits/watchGuide.ts`, `kits/deadlineMatrix.ts`, registry `kits/index.ts` |
| `news-assets`: `kit:` + `data:`, `.print.json` record, ink saver retired | `newsAssets.ts` |
| Weekday check after the date ("(Mon.)", "(Mon. to Fri.)"), years across New Year and after the weekday | `parseWhen` in `newsPrintable.ts` (all 457 existing printables still pass) |
| Empty-band warning between two blocks of text | `printCheck.ts` |
| `10-PDF-FACTS`, `10-PDF-FRESH`, `10-PDF-NO-INK`; full PDF text | `scripts/news-seo-audit.mjs`, `scripts/lib/pdf-print.mjs`, `scripts/lib/print-record.mjs` |
| Writer, researcher and skill instructions | `.claude/skills/news-article`, `news-visuals`, `.claude/agents/news-researcher.md`, `news-writer.md` |

`src` on kit data is the 1-based number of the story's source, or its URL or publisher; the researcher hands over URLs so the order of `sources:` does not matter.
