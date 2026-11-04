# Election Night 2026 live blog: how to update it

Story: `apps/news/src/content/articles/2026/11/election-day-2026-results-map.md` (live at `/news/election-day-2026-results-map/`).

The scoreboard, both tile maps, the wave table and the Senate, governor and state tables are generated from two JSON files, so they never disagree. The prose and the live entries are written by hand.

| File | Who edits it |
|---|---|
| `packages/generator/data/election-live-2026.json` | static: states, closing waves, seats, official links. Change only to fix a fact |
| `packages/generator/data/election-live-2026-status.json` | the editor, all night: data time, headline, race calls, House seats called |
| `packages/generator/data/election-live-2026-updates.json` | the editor, all night: the live entries, newest first. `visible` is how many stay open on the page (4); the rest become one-line disclosures under "Earlier updates" |
| `packages/generator/src/electionLive.ts` | the generator and its validation |

## One update, step by step

1. Add the entry at the top of `election-live-2026-updates.json`: `{ "time": "9:14 p.m. ET", "headline": "...", "body": "two to four plain sentences ending with Sources: [NBC News](url) and [Fox News](url)." }`. Newest entry first. Time is Eastern and is the time the source reported (after midnight: "12:35 a.m. ET"). The body is Markdown and needs at least one source link; the generator checks it. Do not edit the entries inside the story file: the generator writes them.
2. Edit `election-live-2026-status.json`:
   - `asOf`: ISO time with offset (`2026-11-03T21:20:00-05:00`). Polls count as closed when their wave time is at or before `asOf`.
   - `headline`: one sentence shown above the scoreboard ("Polls have closed in 23 states; 2 Senate races have been called.").
   - `races`: one key per race, `GA-S` (Senate) or `GA-G` (governor). `status` is `counting`, `called` or `close`; leave a race out to keep it "awaiting".
   - `house`: called seats per state, `"GA": { "D": 3, "R": 5, "O": 0 }`.
3. Run `pnpm fc news-electionlive` (it validates first and prints every problem). It rewrites only the generated blocks of the story.
4. Set `updatedAt` in the story frontmatter to the current Eastern time.
5. `pnpm news:abbrev` (a second), then `git add`, commit, `git pull --rebase origin main`, push to `main`. CI runs the full checks and publishes; the page is live about 5-6 minutes later. A red CI run is never published: fix it with a new commit.

## Race entry examples

```json
"GA-S": {
  "status": "called",
  "winner": "Jon Ossoff",
  "winnerParty": "D",
  "calledBy": ["The Associated Press", "NBC News"],
  "at": "2026-11-03T21:14:00-05:00"
},
"MI-G": { "status": "close", "calledBy": ["The Associated Press", "NBC News"] },
"PA-S": { "status": "counting" },
"TX-G": { "status": "called", "winner": "Name", "winnerParty": "R", "official": true, "at": "2026-11-03T22:05:00-05:00" }
```

## Rules the tool enforces and the page promises

- **A call needs two sources.** `called` and `close` need two distinct names in `calledBy`, or `official: true` for a result the state election office itself declared. Name the organizations in the entry too. Never copy another outlet's map or numbers; read the call, name who made it.
- **Our words are never "winning", "leading" or "projected".** A candidate's lead appears only in a live entry, with the official source and the time.
- `winnerParty` is `D`, `R`, `I` or `O` (independent or other).
- Nonpartisan: no polls, predictions, ratings or endorsements. Nothing unconfirmed goes on the page; when a source is blocked, use another official one.
- A withdrawn call or a changed count is a new entry. Do not delete earlier entries.
- Only the generated blocks change between the markers `<!-- live:NAME:start -->` and `<!-- live:NAME:end -->` (`updates`, `scoreboard`, the maps and the tables). Do not edit inside them by hand.

## After election night

Leave `status.json` as it is, set `headline` to the final summary, and keep the page as the election-night record. Certification: change statuses to certified wording in prose only after the state certifies. Do not run `wrangler deploy`; publishing is the CI path in `docs/DEPLOY.md`.
