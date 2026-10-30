---
name: news-puzzles
description: Write, schedule, check or improve the daily puzzle pages on Fresh Calendars /news/ (Wordle, Connections, Strands, Pips, Spelling Bee and the other games in docs/PUZZLES.md) so every answer matches the official data and every page gives searchers what they came for. Use whenever someone asks for puzzle hints or answers pages, asks whether the puzzle pages are ready for a date, or wants puzzle pages checked, fixed or enriched.
---

# Daily puzzle pages

Read `CLAUDE.md` and `docs/PUZZLES.md` first (games, release times, where the official data lives). This skill is the house method for the pages; `news-article` covers the general story rules and still applies. Byline: `[news-desk]`, category `puzzles`.

The rule that overrides everything else: **no wrong answer ever publishes.** Every answer, number, weekday and placement comes from the official data saved in the repo, and `pnpm news:puzzle-check` proves it before the commit and again in CI.

## What a searcher wants, and what the page gives them

People arrive from "wordle hint today", "connections answers today", "pips answer", "strands spangram". Most want one of three things, fast, without spoiling the rest:

1. **A nudge.** Graded hints, each behind a tap (`<details>`), so a glance does not give the game away. The build turns every `Label: text` list item in a hints or clues section into a tap-to-reveal hint, so keep that shape: `- **First letter:** T.` or `- Hint 1: ...`.
2. **The answer.** A "Skip to the answer" button at the top jumps to the spoiler section. The answers sit in text there (crawlable), with the solved board drawn under them.
3. **Yesterday's answer or the archive.** The shortcut bar links yesterday's page (only when it exists) and the game's hub (`/news/topic/<game>/`).

The build adds the shortcut bar, the tap-to-reveal hints and the boards (`apps/news/src/lib/puzzle-boards.mjs`), all server-rendered with no client JavaScript:

| Game | Board in the page | Where |
|---|---|---|
| Wordle | the five answer tiles in green | under "The answer to Wordle #N is X." |
| Connections | the four solved groups in the game's colors | under the answer list |
| Strands | the 6×8 board with the spangram (yellow) and theme words (blue) traced | under the answer list |
| Pips | each board (Easy, Medium, Hard) with colored regions, condition badges and every domino with its pips | under each level's placements |
| Spelling Bee | the honeycomb of the day's letters (no answers) | in the hint grid section |
| Mini Crossword | the filled grid with clue numbers | under the answer table |
| Letter Boxed | the box with the Times' solution traced, then every other two-word solution in the puzzle's word list (count and the 10 shortest) | under the route table |

The build also adds, from the saved data:

- **Yesterday's answer** as the last section (`Yesterday's <Game> answer`) for Wordle, Connections, Strands, Letter Boxed and the Mini, with a link to yesterday's page once it is live. Do not write that section by hand. Spelling Bee pages keep their own yesterday section; Pips links yesterday's page in the shortcut bar.
- **Spelling Bee found-words tracker** under the honeycomb: the reader types the words they found, sees words, points, the Genius gap and what is left by first two letters; saved on their device for that date.
- **Wordle used-word checker** above the spoiler: every past answer from `apps/news/src/content/puzzles/wordle-history.json` plus the daily data files, never the day of the build or later. `node scripts/news-puzzle-data.mjs --wordle-history` tops the history up (optional; the daily files fill the gap).

Both tools start hidden and are switched on by the story page's script (`apps/news/src/pages/[slug]/index.astro`), so the page reads the same without JavaScript.

What we add that most results lack: the drawn solved boards, Pips placements checked cell by cell, trap explanations for Connections, the Spelling Bee hint grid with points and Genius and its found-words tracker, the Wordle used-word checker, every two-word Letter Boxed solution, and yesterday's solution on the same page. Connections: Sports Edition readers often do not know the names: after its answers, add one line per group saying who or what each entry is ("quarterbacks who won a Super Bowl with the Rams"), using only facts confirmed on a league, team or other authoritative page. No competitor does this. Keep adding: a fact others missed (a repeated Wordle answer, a double letter, a rare pangram) belongs in the summary.

Two scheduled routines run this workflow every day (`docs/PUZZLE-ROUTINES.md`): official-data games at 10:23 p.m. ET, published-solution games at 7:17 a.m. ET. A hand-run session should check open pull requests first so it does not write the same dates.

## Workflow (one session, a batch of days)

1. **See what is missing.** Pages are scheduled ahead: Wordle, Connections, Strands and Pips several days out; Spelling Bee as far as its data goes. List what exists per game and date, and what NYT has published:

   ```bash
   ls apps/news/src/content/articles/2026/11 | grep -E "^(wordle|nyt-)" | sort
   node scripts/news-puzzle-data.mjs 2026-11-12 2026-11-14     # saves what is published, reports what is not
   ```

2. **Save the official data first** (`pnpm news:puzzle-data <from> [to] [--games a,b]`). It writes `apps/news/src/content/puzzles/<game>/<date>.json`. A Spelling Bee page also shows yesterday's solution, so yesterday's Bee data must be saved too. Never write a page for a date whose data is not saved; the check fails it.

3. **Write the pages from the data**, one file per game and date, copying the shape of the newest page of the same game (headings, answer line formats, FAQ). Slugs: `wordle-hint-answer-today-<month>-<d>-<yyyy>-<number>`, `nyt-connections-hints-answers-…-<number>`, `nyt-strands-hints-answers-…-<number>`, `nyt-pips-hints-answers-…`, `nyt-spelling-bee-hints-answers-…`. `publishedAt` is 12:05 a.m. ET the day before the puzzle (`2026-11-09T00:05:00-05:00` for Nov. 10).
   - Compute, never recall: weekday (`node -e 'console.log(new Date("2026-11-10T12:00:00").toDateString())'`), puzzle numbers (Connections #1 was June 12, 2023; Strands #1 was March 4, 2024; Wordle's number is `days_since_launch` in its data), letter counts, Spelling Bee points (4-letter word 1 point, longer words 1 per letter, +7 per pangram, Genius = 70% rounded half up).
   - Pips: generate the placement lines and the region list from the data (the `pipsValues`/`pipsRegionOk` helpers in `apps/news/src/lib/puzzles.mjs`), never by hand. Each line is `- a-b: <cell of a> = a, <cell of b> = b`, in the data's order. If a domino can be flipped without breaking a rule, say so, and still print the data's placement.
   - Every hint must be true for the data: count letters, check which word repeats a letter, check traps against the actual groups. Read each hint against the answer before moving on.
   - Answers only in the spoiler section and the spoiler FAQ, never in the title, description, summary or hero.
   - The Mini: NYT serves the Mini for any past day and today (the next day's from about 10 p.m. ET), never days ahead, so save it with `pnpm news:puzzle-data <date> --games mini` once it is out; a missed day can be filled in later. Hint lines keep the shape `- **1-Across** (5 letters), *clue as printed*: hint.`; the check compares the quoted clue and the letter count with the data.
   - Letter Boxed: NYT publishes its data about two days ahead (`--games letterboxed`). The check compares the sides table, par, the dictionary size, the Times' solution, its route table (`| Word | F2, L1, … |`) and the warm-up words (each must be in the saved `dictionary` and not in the solution) with the data.
   - Quote official wording exactly (group names, entries, clues). The writing audit skips that quoted text when it is capitalized as printed, but checks every word we write around it.

4. **Hero**: add one row per page to `PUZZLE_HEROES` in `packages/generator/src/heroes5.ts` (vary the accent so no two match) and run `pnpm fc news-heroes5 --only <date-part>`. Look at one or two.

5. **Check**, all must pass:

   ```bash
   pnpm news:puzzle-check          # answers vs saved official data (seconds; run it after every edit)
   pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test
   ```

   Scheduled pages are not in the build until their time, so `news:puzzle-check` is the gate that covers them. If it fails, fix the page, never the data or the check. If the data itself looks wrong, refetch with `--force` and compare.

6. **Commit** the pages, their data files, hero images and `heroes5.ts`; push per `CLAUDE.md`. In the message, list the dates, numbers and anything not yet published (for example "Spelling Bee Nov. 9 not published yet").

## Checking existing dates ("are the Oct. 28 pages ready?")

Run `pnpm news:puzzle-check <date-part>` (for example `october-28`). It lists any page that disagrees with the saved data. A page without saved data fails with the exact `news:puzzle-data` command to run. Games with no official data we can save (Quordle, Blossom, LinkedIn games, Connections: Sports Edition) are not in the check, nor yet Contexto and Waffle; follow `docs/PUZZLES.md` for their sources (two published solutions that agree, or today's data for the Mini).

## Adding a game to the check and the boards

Add it to `GAMES` in `apps/news/src/lib/puzzles.mjs` (slug prefix, hub, numbering), its URL and trim function to `scripts/news-puzzle-data.mjs`, a `CHECK.<game>` function to `scripts/news-puzzle-check.mjs` (parse the page's answer lines, compare with the data, report each difference), and, if a board helps the reader, a drawing function in `puzzle-boards.mjs`. Test the check by breaking a page on purpose and confirming it fails.

## Rules the build and audit enforce on these pages

- No `<div>` inside the story body (the audit reads the prose up to the first `</div>`); boards use `figure`, `ol`, `span` and inline SVG.
- Text on colored tiles keeps WCAG AA contrast (`pnpm smoke:contrast`); SVG text is drawn dark on light fills.
- No in-article ad inside a spoiler section (`01-ADS-SPOILER`); the ad plugin runs after the boards are in place.
- Content works without JavaScript (`02-NO-JS-CONTENT`).
