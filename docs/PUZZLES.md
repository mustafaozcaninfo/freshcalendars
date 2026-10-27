# Daily puzzle stories: games, release times and where answers come from

Reference for writing the daily puzzle hint pages on /news/ (category `puzzles`). Checked Oct. 24-25, 2026. "Official" means the publisher's own page or data; everything else is a cross-check. Re-verify anything marked unconfirmed before relying on it.

## Summary

| Game | Publisher | New puzzle | Answer source we use | Data ahead of time? | Free? |
|---|---|---|---|---|---|
| Wordle | The New York Times (editor Tracy Bennett) | Daily, midnight local time | NYT puzzle data (official) | **Yes, 10+ days ahead** | Yes (NYT Help Center) |
| Connections | NYT (editor Wyna Liu) | Daily, midnight local time | NYT puzzle data (official) | **Yes, 10+ days ahead** | Yes |
| Strands | NYT | Daily, midnight local time | NYT puzzle data (official) | **Yes, 10+ days ahead** | Yes |
| Pips | NYT (editor Ian Livengood) | Daily, midnight local time (NYT Help Center) | NYT puzzle data (official), solved and checked with `puzzlemd.py` | **Yes, 10+ days ahead** | Yes |
| Spelling Bee | NYT (editor Sam Ezersky) | Daily, overnight ET (about 3 a.m. ET in practice; unconfirmed officially) | Puzzle data embedded in the Spelling Bee page (official): today and yesterday only | No | Limited free access |
| The Mini | NYT (editor Joel Fagliano) | Daily; reported 10 p.m. ET the evening before (6 p.m. ET Saturday for Sunday) | NYT puzzle data for the current day (official) | No (current day only) | Subscriber-only per NYT Help Center |
| Connections: Sports Edition | The Athletic with NYT Games | Daily, midnight local time (MediaPost) | Two published solutions (Beebom, Mashable/Parade/Technobezz) | No source found | Yes |
| Quordle | Merriam-Webster (bought it in Jan. 2023) | Daily (time unconfirmed) | Two published solutions | No | Yes |
| Blossom | Merriam-Webster | Daily (time unconfirmed) | Two solver sites for letters and pangrams (Connections Solver, Word.Tips, Beebom) | No | Yes |
| Contexto | contexto.me (creator unconfirmed) | Daily, 11 p.m. ET the evening before (as our pages say) | The game's own API (official): `api.contexto.me/machado/en/giveup/<n>` (answer) and `/top/<n>` (its closest-words ranking) | **Yes, days ahead** | Yes |
| Letter Boxed | NYT (editor Sam Ezersky) | Daily | NYT puzzle data (official), including the Times' own solution (`ourSolution`) | **Yes, about a week ahead** | Yes (data says `is_free`) |
| Waffle | wafflegame.net (Waffle Studio Ltd) | Daily, midnight GMT by default | The game's daily file (official): `wafflegame.net/daily1.txt` (base64 of UTF-16 JSON: `puzzle`, `solution`, `words`, `number`) | No (today only) | Yes |
| LinkedIn games (Queens, Tango, Zip, Mini Sudoku, Pinpoint, Crossclimb, Patches, Wend) | LinkedIn | Daily at midnight Pacific Time, 3 a.m. ET (LinkedIn Help) | Two published solutions; grid games often appear only as images, so only text answers agreed by two sources are printed | No | Yes, no account needed (LinkedIn Help) |

None of these publishers was found to post official daily hint articles that we could read. The NYT Help Center says Wordle Bot and similar companion tools need a subscription. So the hints on our pages are always our own, written from the confirmed answer.

## Numbering (as of Sunday, Oct. 25, 2026)

Counted one per day; each matches several independent sources, but none is printed on an NYT page we can read.

- Wordle #1954 (the puzzle data's `days_since_launch` field gives the number).
- Connections #1232 (#1 was June 12, 2023).
- Strands #966.
- Connections: Sports Edition #762 (launched Feb. 9, 2025).
- Quordle #1735.
- Contexto #1498 (not confirmed; sources conflict).
- LinkedIn: Queens and Crossclimb #908, Zip #587, Tango #748, Mini Sudoku #440 are expected for Oct. 25 by counting from Oct. 24; confirm each day.
- Spelling Bee, Pips and the Mini have no public puzzle number. Do not invent one; the IDs in the data are internal.

## Official data, how to read it

All of these return JSON or HTML to a plain request (no login, no bot challenge). Use them as the publisher's own data; do not try to get around a page that blocks you.

- Wordle: `https://www.nytimes.com/svc/wordle/v2/YYYY-MM-DD.json` (`solution`, `days_since_launch`, `editor`).
- Connections: `https://www.nytimes.com/svc/connections/v2/YYYY-MM-DD.json` (`categories[].title`, `cards[].content`, in yellow, green, blue, purple order; `id` is internal, not the public number).
- Strands: `https://www.nytimes.com/svc/strands/v2/YYYY-MM-DD.json` (`clue`, `spangram`, `themeWords`, `editor`, `constructors`).
- Pips: `https://www.nytimes.com/svc/pips/v1/YYYY-MM-DD.json` (`easy`/`medium`/`hard` with `dominoes`, `regions`, `solution`, `constructors`). The `solution` pairs follow the order of `dominoes`; still solve and check every region before printing.
- The Mini: `https://www.nytimes.com/svc/crosswords/v6/puzzle/mini.json` (current puzzle only; clues and `answer` per cell).
- Spelling Bee, also by date: `https://www.nytimes.com/svc/spelling-bee/v1/YYYY-MM-DD.json` (`center_letter`, `outer_letters`, `pangrams`, `answers`; `answers` can leave the pangrams out, so use the union), available about 10 days ahead.
- Letter Boxed: `https://www.nytimes.com/svc/letter-boxed/v1/YYYY-MM-DD.json` (`sides`, `par`, `ourSolution`, `dictionary`). Write sides as "C/D/I" and words in Title case: runs of capitals fail 08-ABBREV.
- Spelling Bee: `https://www.nytimes.com/puzzles/spelling-bee` has `window.gameData` with `today` and `yesterday` (`centerLetter`, `outerLetters`, `pangrams`, `answers`, `editor`). Total points: 4-letter words 1 point, longer words 1 per letter, pangrams +7; Genius is 70% of the total (matches NYTBee).

A date returns a "404 page not found" body (with HTTP 200) until NYT publishes it, so check the body, not the status code.

## Saved data and the answer check

Every page for Wordle, Connections, Strands, Pips and Spelling Bee has its official data saved in `apps/news/src/content/puzzles/<game>/<date>.json` (`pnpm news:puzzle-data <from> [to]`). `pnpm news:puzzle-check` compares each page with it and CI runs it on every push, so a wrong answer or placement cannot publish. The build draws the solved boards from the same files. Method: `.claude/skills/news-puzzles/SKILL.md`.

## Workflow that keeps traffic steady

1. **Wordle, Connections, Strands, Pips:** build pages several days ahead from the official data and set `publishedAt` to the evening before the puzzle date (ET). Auto-publish puts each one live at that time.
2. **The Mini:** write it once the current puzzle is the target date (after about 10 p.m. ET the evening before).
3. **Spelling Bee:** the target date appears in the page data overnight (about 3 a.m. ET). Open the page the evening before with the rules and yesterday's solution, then fill in hints and answers when the data turns over.
4. **Sports Edition, Quordle, Blossom, Contexto, LinkedIn:** publish only when two independent published solutions agree. LinkedIn goes live at 3 a.m. ET.
5. Every page: answers only in the spoiler section and spoiler FAQ, never in the title, description, summary or hero. Link the day's other puzzle pages.

## Cross-check sources that worked

- Sports Edition: Beebom (`beebom.com/puzzle/sports-connections-hint-today`), Mashable (also republished by WDC News 6), Parade via Yahoo Tech, Technobezz (often 403).
- Blossom: Connections Solver, Word.Tips, Beebom.
- Quordle and Contexto: Try Hard Guides, Analytics Insight, Beebom; check the date and number on each page, because several sites recycle last year's posts.
- LinkedIn: Sportsdunia, Try Hard Guides, TechWiser, Bloxodes (numbers only), FandomWire (often 403).

## Not usable

- Squaredle: the word lists in `squaredle.app/api/today-puzzle-config.js` are obfuscated; decoding them would get around the site's protection, so no answer pages.
- Washington Post Keyword, The Atlantic Bracket City, USA Today games: blocked or paywalled to plain requests (checked Oct. 26, 2026).

## Checks that catch scheduled pages

`pnpm news:build` leaves out stories with a future `publishedAt`, so verify and most of the audit never see them, but 12-HERO-UNIQUE in CI does. Before pushing scheduled pages: compare every hero with `duplicateHeroes(storyHeroes())` from `scripts/lib/hero-hash.mjs` (it includes scheduled stories; recolors do not change the hash, a different layout seed does: `heroes5.ts` rows take an optional 8th seed), and make sure no page links a story that goes live later than itself (news:verify reports it as broken until then).
