# /news/ work queue

Routine D (`docs/PUZZLE-ROUTINES.md`) takes one item from this list per run, highest first. Each item fits in one session. Anyone can add, reorder or remove items; keep the format, because the routine reads it.

**Format.** `- [ ] **ID** [kind] Title.` plus the details below it. `kind` is `content` (stories: the routine merges its pull request when CI is green) or `code` (scripts, components, the build: the routine opens a pull request and leaves it for the owner to review and merge).

**Claiming.** An item is taken when a branch `claude/backlog-<id>` exists on `origin`; the routine pushes that branch before any other work, so two runs never take the same item. An item whose branch exists with no open pull request and no commit for 3 hours is stalled: the next run continues it from that branch. The routine ticks the box (`- [x]`) in its own pull request.

**Rules.** Everything in `CLAUDE.md` applies: facts only from official data or authoritative sources, all checks pass, never deploy. Never write or edit the daily puzzle pages that routines A and B write, the monthly roundups of routine C, or files an open pull request changes.

## Queue

- [ ] **contexto-check** [code] Contexto joins the official answer check.
  Save Contexto's own data (`api.contexto.me/machado/en/giveup/<n>` for the answer, as `docs/PUZZLES.md` says) with `news-puzzle-data.mjs` (`--games contexto`, number from the date as on the existing pages), add a `GAMES` entry and a `CHECK.contexto` in `scripts/news-puzzle-check.mjs` (answer, number, date), save data for every existing Contexto page, and test by breaking a page on purpose. Update `docs/PUZZLES.md` and the skill. Done when `news:puzzle-check` covers every Contexto page and all match.

- [x] **past-wordle-answers** [content] (done 2026-10-31) Evergreen story: every past Wordle answer since 2021, by date and A to Z.
  Target query "past Wordle answers" / "Wordle answers list". Built from `apps/news/src/content/puzzles/wordle-history.json` (official NYT data, #0 to yesterday) by script: a table per year, the repeated answers, letter stats computed from the data, and the used-word checker (the build already draws it on Wordle pages; reuse `wordleChecker` in `apps/news/src/lib/puzzle-boards.mjs` if the slug is not a daily page, or link to a daily page). Must not cannibalize `wordle-answers-2026-full-list-repeat-answers`: that one is 2026 only, this one is all years; link both ways. Follow `news-seo` and `news-article`; byline `news-desk`, category `puzzles`.

- [ ] **connections-reveal** [code] Connections spoiler: one group at a time.
  In the answers (spoilers) section, each `- **Color, Group:** words` line becomes a tap-to-reveal: the color and group name show, the four words open on tap (reuse `revealHints` style in `puzzle-boards.mjs`). The solved board under it stays. Words remain in the HTML (crawlable). Beebom does this; most sites do not.

- [ ] **waffle-check** [code] Waffle joins the official answer check.
  Waffle's daily file (`wafflegame.net/daily1.txt`, `docs/PUZZLES.md`) serves today only, so the data must be saved the day it is out: add `--games waffle` to `news-puzzle-data.mjs` (decode as the doc says), a `CHECK.waffle`, save today's file, and add "save Waffle data first" to routine B's Waffle step in `docs/PUZZLE-ROUTINES.md` (the doc only; tell the owner the live routine prompt needs the same line). Pages before the first saved day are skipped with a `since` date, like the Mini.

- [ ] **pips-region-hints** [code] Pips: tap-to-reveal hints per region, from the data.
  Before the spoiler, for each level, a list of the regions with their rule ("Sum 8, 2 cells", "All equal, 3 cells") as hints, and a stronger hint per region giving one domino value, all generated from `pips` data at build time in `puzzle-boards.mjs`. No competitor gives region-by-region hints (competitor review, Oct. 30).

- [ ] **strands-reveal** [code] Strands: the spangram one letter at a time.
  In the spangram hints, a nested tap-to-reveal that opens one more letter per tap (no JavaScript: nested `<details>`), generated from the data. Beebom has a letter-by-letter reveal; we have only first letter and length.

- [x] **sports-who-is-who** [content] (done 2026-10-31) Connections: Sports Edition: one line per group on who the names are, for the last 3 published days.
  Add a short "Who they are" line per group to the 3 newest Sports Edition pages, each fact confirmed on a league, team or other authoritative page (cite it under `sources:`). Set `updatedAt`. Routine B writes new pages with this line from now on (skill rule added Oct. 30).

- [ ] **bee-ranks** [content] (blocked: no NYT page with the rank names and percentages could be read; help.nytimes.com and the game page refuse automated requests, and no two newsrooms print the ladder (only fan and gaming sites, which disagree on Genius), 2026-10-31) Evergreen explainer: how Spelling Bee points, ranks and Genius work.
  Only if NYT publishes the rank names and percentages on a page we can read (Help Center or the game's rules); otherwise hold the item and note why. Points rules (1 point for a four-letter word, one per letter above that, +7 per pangram) and Genius at 70% are already in `docs/PUZZLES.md`. A worked example table from one saved day (`apps/news/src/content/puzzles/bee/`). Link the daily Spelling Bee pages and the tracker.

- [ ] **letterboxed-roundup-link** [code] (blocked: the shortcut bar lives in `apps/news/src/lib/puzzle-boards.mjs` and the hub in `apps/news/src/pages/topic/[topic]/index.astro`, which open pull requests #149, #159, #162, #165, #171 and #177 change; wait until they are merged or closed, 2026-11-01) Letter Boxed hub and daily pages link the month's roundup once it is live.
  The shortcut bar (`shortcuts` in `puzzle-boards.mjs`) gets "This month's answers" when a live `<game>-answers-<month>-<year>` story exists for that game and month, for every game that has roundups. Check by building and following the link.

- [ ] **puzzle-hub-table** [code] Game hubs show a date, number and link table of every page.
  `/news/topic/<game>/` lists stories as cards; add a compact table above them for puzzle hubs (date, puzzle number, link to hints page; no answers, so the hub never spoils). Built from the stories, server-rendered.

- [x] **missing-days-audit** [content] (done 2026-10-31) Find and report puzzle days with no page since Oct. 21, 2026.
  Result (Oct. 21-31): no NYT-data game misses a page in the last 3 days (Oct. 28-30), so no page was written. Older gaps, report only, and NYT still serves the data for each: Wordle, Connections, Strands and the Mini Oct. 22-24; Pips and Spelling Bee Oct. 21-24; Letter Boxed Oct. 21-26. Routine B's games (not touched): Sports Edition Oct. 21-24, 27, 28, 31; Waffle Oct. 21-25, 27; Blossom Oct. 22-24, 28; LinkedIn Oct. 21-24, 27, 28; Quordle and Contexto Oct. 22-24.
  List every game and date with no page (scripted from the slugs), note which still have official data that NYT serves (past days: Wordle, Connections, Strands, Pips, Mini, Spelling Bee, Letter Boxed), and write pages only for dates in the last 3 days whose data is served (routine A writes today and later, so past days are this item's). Older days: report only. Do not touch routine B's games.
