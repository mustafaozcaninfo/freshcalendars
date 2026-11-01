# Daily puzzle routines

Three scheduled routines cover the puzzles on /news/ so no day and no game is missed, and a fourth (D) works through the /news/ work queue in the hours between them. A and B write every daily page and split the games by where the answers come from, so each runs when its answers exist and they never write the same files; each runs more than once a day, and every run fills whatever an earlier run missed. C finds new games and writes the monthly roundups. Method: `.claude/skills/news-puzzles/SKILL.md`; games and sources: `docs/PUZZLES.md`; cost rules: `docs/NEWS-COST-GUIDE.md` section 6.

| Routine | Games | Runs | Why then |
|---|---|---|---|
| A. Puzzles: official data | Wordle, Connections, Strands, Pips, Spelling Bee, Mini Crossword, Letter Boxed, Contexto | Every day, 10:23 p.m. and 5:23 a.m. ET | The Mini for the next day appears at about 10 p.m. ET (6 p.m. on Saturday). Wordle, Connections, Strands, Pips and Spelling Bee publish their data many days ahead and Letter Boxed about two days ahead, so each run tops up the schedule; the morning run catches anything the evening run missed. |
| B. Puzzles: published solutions | Quordle, Blossom, Waffle, Connections: Sports Edition, LinkedIn games | Every day, 7:17 a.m., 10:17 a.m. and 2:17 p.m. ET | These have no official data we can read; a page needs two published solutions that agree, and those sites post them between about 4 and 7 a.m. ET (LinkedIn games open at 3 a.m. ET), some later. Each run writes only what is still missing for today. |
| C. Puzzles: new games and monthly roundups | New games with official answer data; one roundup per game at the end of each month | Every day, 12:47 p.m. ET | Away from A and B, so their pull requests never overlap. |
| D. Work queue (hourly) | One item from `docs/NEWS-BACKLOG.md` per run (tools, checks, evergreen stories) | Every hour at :41 ET, except the hours A, B and C run (5, 7, 10, 12, 14 and 22) | Uses the rest of each five-hour usage window. Its usage gate stops it whenever the window is spent or extra usage would start, so A, B and C always have room. |

Both start a **new session on every run** (never the same session), use the strongest model for the main session (choose it in the Routines screen; without a choice the routine runs on the default model), research with `news-researcher` (Haiku) and write with `news-writer` (Sonnet). They ship one pull request per run and merge it when CI is green. The news routine's prompt must say "Do not write or edit daily puzzle pages." The monthly roundups and new games stay with the separate routine "Puzzles: new games and monthly roundups".

D never writes daily puzzle pages or roundups. It claims an item by pushing a `claude/backlog-<id>` branch before any other work, so two runs never take the same item (method: `docs/NEWS-BACKLOG.md`).

## Setting them up (claude.ai, Routines)

**The repository must be selected on the routine itself.** A routine created from a Claude session with `create_trigger` has no repository attached (its runs show `no-git-repo`), cannot attach one later, and every push is refused with 403. Create or edit the routine in the Routines screen and select `mustafaozcaninfo/freshcalendars` as its repository.

For each routine: New routine, paste the name and prompt below, repository `mustafaozcaninfo/freshcalendars`, the same cloud environment as the news routine, schedule as given (time zone America/New_York), **start a new session each run**, model: the strongest available, notifications on. From a Claude session the same is `create_trigger` with `create_new_session_on_fire: true`, `cron_expression` as given and the prompt below.

- A: name `Puzzles: official data (daily)`, cron `CRON_TZ=America/New_York 23 5,22 * * *`
- B: name `Puzzles: published solutions (daily)`, cron `CRON_TZ=America/New_York 17 7,10,14 * * *`
- C: name `Puzzles: new games and monthly roundups`, cron `CRON_TZ=America/New_York 47 12 * * *`
- D: name `News: work queue (hourly)`, cron `CRON_TZ=America/New_York 41 0-4,6,8,9,11,13,15-21,23 * * *`

To pause, disable the routine; to change what it does, edit its prompt (it keeps its history).

## Prompt A: official data (daily, 10:23 p.m. and 5:23 a.m. ET)

```text
You are the Fresh Calendars daily puzzle round for games with OFFICIAL data (/news/, category `puzzles`, byline `news-desk`). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`; if `status` is not `allowed` or `isUsingOverage` is true, write one line with the reset time and stop. If the tool is not available in this session, skip this step and continue (routine sessions often do not have it).

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected (Routines screen); without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; if it is not available, finish the pages and checks, then report that the repository must be added to the routine. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/NEWS-COST-GUIDE.md`, `docs/PUZZLES.md` and the `news-puzzles` skill (follow it exactly), plus the `news-article` skill. List open pull requests if GitHub tools are available; do not touch files another open PR changes. Routine sessions start outside the repo, so the repo's agents and skills may not be loaded: read the skill files directly (`.claude/skills/news-puzzles/SKILL.md`, `.claude/skills/news-article/SKILL.md`), and if the `news-researcher` or `news-writer` agent types are not available, use `general-purpose` agents with the same briefs.

2. Scope, in this order. Never write or edit pages of Quordle, Blossom, Waffle, Connections: Sports Edition or LinkedIn games (routine B does those), monthly roundups or non-puzzle stories.
   a) The Mini Crossword. NYT serves the Mini for any past day and today, and tomorrow's from about 10 p.m. ET (dates in America/New_York). For the two previous days, today and tomorrow, if no page exists, run `pnpm news:puzzle-data <date> --games mini`; if it saves, write the page now with `publishedAt` = the current time ET, and point the neighbouring days' "previous/next grid" links at it. Report any date that cannot be saved and go on.
   b) Top up the schedule. For Wordle, Connections, Strands, Pips and Spelling Bee, find every date from today through today + 12 days that has no page yet (a missing page for today is written first, with `publishedAt` = the current time ET). Run `pnpm news:puzzle-data <first missing date> <today+12>` once; it saves only what NYT has published. Write a page for each date whose data saved, oldest first, at most 3 dates per game in one run. A Spelling Bee page also needs the previous day's Bee data (it shows yesterday's solution); save it if missing. `publishedAt` is 12:05 a.m. ET the day before the puzzle.
   c) Letter Boxed: NYT publishes its data only about two days ahead, so keep it as far ahead as the data goes (normally through today + 2). Run `pnpm news:puzzle-data <first missing date> <today+3> --games letterboxed` and write a page for each date that saved; `news:puzzle-check` compares it with the data. (On a checkout from before Letter Boxed joined the check, the script says the game is unknown: read the data URL in `docs/PUZZLES.md` instead.) Contexto: keep it at least 5 days ahead from contexto.me, as its newest page does; save each date's data first with `pnpm news:puzzle-data <first missing date> <last date> --games contexto` and write only the dates that saved (`news:puzzle-check` compares the pages with it). If the official source is blocked or has no data for a date, do not write that date.
   d) Any other game listed in routine A's row of the table at the top of `docs/PUZZLE-ROUTINES.md` (routine C adds new games there): keep its schedule as far ahead as its official data allows, by the method its first page and `docs/PUZZLES.md` describe.
   Model every page on the newest page of the same game (headings, answer line formats, FAQ, related links). Answers, numbers, weekdays and counts come only from the saved data, computed by script; never guess. Hints must be true for the data: check each one against the answer.

3. Writing. Give each game's pages to a `news-writer` agent (Sonnet) in the background, all in one message, with a complete brief: the slugs, the data file paths, the newest page of that game as the model, and the rules above. Writers write files only. Then read every hint against the data yourself before checks.

4. Heroes. One row per page in `PUZZLE_HEROES` in `packages/generator/src/heroes5.ts` (vary the accent from the day before), then `pnpm fc news-heroes5 --only <date-part>` per date.

5. Checks, all must pass:
   - `pnpm news:puzzle-check` (answers vs saved official data; run after every fix).
   - Scheduled pages are not in a normal build, so preview them once: set every puzzle page whose `publishedAt` is in the future to the current time, run `pnpm news:build && pnpm news:verify && pnpm news:seo-audit`, then restore them with `git checkout -- apps/news/src/content/articles` and confirm `git status` shows only your new files. Never commit the preview times.
   - `pnpm test`.
   Fix failures in the pages, never in the data or the checks. Quote official wording (group names, entries, clues) exactly; write our own text around it.

6. Ship. One branch, one commit (pages, their `apps/news/src/content/puzzles/` data files, hero images, `heroes5.ts`), one pull request for the round using `.github/pull_request_template.md`. Subscribe to it and merge when CI is green; if CI fails, fix with a new commit. If this session has no GitHub tools to open or merge a pull request, push the commit straight to `main` instead (`git fetch origin main && git rebase origin/main && git push origin HEAD:main`, allowed for stories by CLAUDE.md) and check that CI goes green. If the rebase conflicts in `packages/generator/src/heroes5.ts` (another routine added hero rows), keep both sides' rows. Never deploy, never force-push.

7. Report in Turkish, under 10 lines: pages written per game and date range, what NYT had not published yet (for example "Spelling Bee Nov. 20 not out"), anything held and why, the PR link. Do not wait for replies.
```

## Prompt B: published solutions (daily, 7:17 a.m., 10:17 a.m. and 2:17 p.m. ET)

```text
You are the Fresh Calendars daily puzzle round for games WITHOUT official data (/news/, category `puzzles`, byline `news-desk`). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`; if `status` is not `allowed` or `isUsingOverage` is true, write one line with the reset time and stop. If the tool is not available in this session, skip this step and continue (routine sessions often do not have it).

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected (Routines screen); without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; if it is not available, finish the pages and checks, then report that the repository must be added to the routine. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/NEWS-COST-GUIDE.md`, `docs/PUZZLES.md` and the `news-puzzles` skill, plus the `news-article` skill. List open pull requests if GitHub tools are available; do not touch files another open PR changes. Routine sessions start outside the repo, so the repo's agents and skills may not be loaded: read the skill files directly (`.claude/skills/news-puzzles/SKILL.md`, `.claude/skills/news-article/SKILL.md`), and if the `news-researcher` or `news-writer` agent types are not available, use `general-purpose` agents with the same briefs.

2. Scope: today's pages (today = the current date in America/New_York) for Quordle, Blossom, Waffle, Connections: Sports Edition, the LinkedIn games page and any other game listed in routine B's row of the table at the top of `docs/PUZZLE-ROUTINES.md` (routine C adds new games there), skipping any that already exist. Never write or edit pages of Wordle, Connections, Strands, Pips, Spelling Bee, Mini, Letter Boxed or Contexto (routine A does those), roundups or non-puzzle stories.

3. Research. One message, one `news-researcher` agent (Haiku) per game, in the background. Each brief asks for the day's answers on at least TWO independent published solution pages that print today's date (and the puzzle number when given), with URL, page title, publisher and printed date, and AGREE / CONFLICT / ONLY ONE SOURCE / NOT YET. Give the source lists from docs/PUZZLES.md and the newest page of the game. Tell it: ignore pages that say TBA, check the date on every page (sites recycle old posts), never get around a 403 or bot challenge.

3a. Waffle: save the official data first, `pnpm news:puzzle-data <today> --games waffle` (the game's own daily file; it serves today only and turns over at midnight GMT, 7 or 8 p.m. ET), and write the page from that file; `news:puzzle-check` compares the page with it.

4. Decide. Write a game only when two independent sources agree on every answer you print. Print only what they agree on: if they do not give board positions (Quordle) or clue words (Pinpoint), do not invent them. Hold a game with a conflict or a single source and say so in the report. The LinkedIn page needs at least Pinpoint and Crossclimb confirmed; otherwise hold it.

5. Writing. Give the confirmed games to `news-writer` agents (Sonnet) in one message, each with the fact sheet, the slug and the newest page of that game as the model. `publishedAt` is the current time ET. List the agreeing sources under `sources:` with "(answer cross-check)" in the title, as the existing pages do. Read every hint against the confirmed answers yourself.

6. Heroes: one row per page in `PUZZLE_HEROES` in `packages/generator/src/heroes5.ts`, then `pnpm fc news-heroes5 --only <today's date-part>`.

7. Checks, all must pass: `pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm news:puzzle-check && pnpm test`. Fix failures in the pages; never weaken a check.

8. Ship. One branch, one commit, one pull request using `.github/pull_request_template.md`; subscribe and merge when CI is green; fix a red CI with a new commit. If this session has no GitHub tools to open or merge a pull request, push the commit straight to `main` instead (`git fetch origin main && git rebase origin/main && git push origin HEAD:main`, allowed for stories by CLAUDE.md) and check that CI goes green. If the rebase conflicts in `packages/generator/src/heroes5.ts` (another routine added hero rows), keep both sides' rows. Never deploy, never force-push.

9. Report in Turkish, under 10 lines: what was published, what was held and why (with the source counts), the PR link. Do not wait for replies.
```

## Prompt C: new games and monthly roundups (daily, 12:47 p.m. ET)

```text
You are the Fresh Calendars puzzles round for NEW GAMES and MONTHLY ROUNDUPS on /news/ (category `puzzles`, byline `news-desk`). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`; if `status` is not `allowed` or `isUsingOverage` is true, write one line with the reset time and stop. If the tool is not available in this session, skip this step and continue (routine sessions often do not have it).

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected (Routines screen); without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; if it is not available, finish the work and checks, then report that the repository must be added to the routine. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/NEWS-COST-GUIDE.md`, `docs/PUZZLES.md`, `docs/PUZZLE-ROUTINES.md` and the skill files `.claude/skills/news-puzzles/SKILL.md`, `.claude/skills/news-article/SKILL.md`, `.claude/skills/news-seo/SKILL.md` and `.claude/skills/news-visuals/SKILL.md`. List open pull requests if GitHub tools are available; do not touch files another open PR changes. If the `news-researcher` or `news-writer` agent types are not available, use `general-purpose` agents with the same briefs.

2. Scope. Write ONLY:
   a) Monthly roundups. On the second-to-last day of a month, write one roundup per game with official data for that month (Wordle, Connections, Strands, Spelling Bee, Pips, Letter Boxed, Contexto), modeled on the `*-answers-october-2026-*` stories in `apps/news/src/content/articles/2026/10/` (for example `wordle-answers-october-2026-all-words.md`): answer table, stats computed by script from the saved official data (`apps/news/src/content/puzzles/`, `pnpm news:puzzle-data` for any day still missing), tips from those stats only, a one-page printable via `pnpm fc news-assets`, `publishedAt` 12:10 to 12:35 a.m. ET on the month's last day. On other days, update `wordle-answers-2026-full-list-repeat-answers` with the new days (recompute repeats) only if 7 or more days were added since its `updatedAt`.
   b) New games. Look for a daily puzzle game with real US search interest that /news/ does not cover yet AND whose answers come from the publisher's own data or page. Research with `news-researcher` agents (Haiku) in one message. Hold any game whose answer source is blocked, obfuscated or needs a login (see docs/PUZZLES.md for games already ruled out). For a new game: add it to the table in `docs/PUZZLES.md` with its official source and release time, write its first page(s) modeled on the closest existing game, add a topic hub entry in `apps/news/src/lib/topics.ts` and a motif in `packages/generator/src/heroes5.ts`, and add its name to the Games column of routine A's row (official data) or routine B's row (published solutions) in the table at the top of `docs/PUZZLE-ROUTINES.md`; both routines read that table, so its daily pages are written from the next run on.
   Never write or edit the daily pages that routines A and B write. Never write election content.

3. Batch: at most 5 stories. Facts and answers only from official data, computed by script; never guess. Writers write files only; read every story yourself before checks.

4. Checks, all must pass: `pnpm news:puzzle-check`, `pnpm news:build && pnpm news:verify && pnpm news:seo-audit`, `pnpm test`. For a story with a future `publishedAt`, preview it as routine A does (temporary `publishedAt`, build, audit, then `git checkout -- apps/news/src/content/articles`; never commit preview times). Fix failures at the source; never weaken a check.

5. Ship. One branch, one commit, one pull request using `.github/pull_request_template.md`; merge when CI is green; fix a red CI with a new commit. If this session has no GitHub tools to open or merge a pull request, push the commit straight to `main` (`git fetch origin main && git rebase origin/main && git push origin HEAD:main`) and check that CI goes green. If the rebase conflicts in `packages/generator/src/heroes5.ts` (another routine added hero rows), keep both sides' rows. Never deploy, never force-push. If there is nothing to write today, say so in one line and stop.

6. Report in Turkish, under 10 lines: what was published or scheduled, any new game found or ruled out and why, the PR link. Do not wait for replies.
```

## Prompt D: work queue (hourly at :41 ET, except 5, 7, 10, 12, 14 and 22)

```text
You are the Fresh Calendars work-queue round (/news/). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish. Do ONE item from the queue, finish it properly, and stop.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`. Stop with one line (the reset time) if `status` is not `allowed`, if `isUsingOverage` is true, or if `rateLimitType` is anything other than `five_hour` (a weekly limit is close: leave the room to the puzzle routines). If the tool is not available, continue. Also stop with one line if the current time in America/New_York is within 15 minutes before a puzzle routine (5:23, 7:17, 10:17, 12:47, 14:17, 22:23).

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected (Routines screen); without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/NEWS-COST-GUIDE.md` and `docs/NEWS-BACKLOG.md` (its rules are part of this prompt). Read the skill files the item needs directly (`.claude/skills/news-article/SKILL.md`, `news-seo`, `news-visuals`, `news-puzzles`); if the `news-researcher` or `news-writer` agent types are not available, use `general-purpose` agents with the same briefs. List open pull requests if GitHub tools are available; never touch a file an open pull request changes.

2. Pick. `git fetch origin '+refs/heads/claude/backlog-*:refs/remotes/origin/claude/backlog-*'`. Walk the queue top to bottom and take the first item that is unticked and either has no `claude/backlog-<id>` branch on origin, or has one with no open pull request and no commit in the last 3 hours (stalled: continue from that branch). If every item is ticked, taken or blocked, say "kuyruk boş" in one line and stop. Never invent an item.

3. Claim. For a new item: `git checkout -b claude/backlog-<id> origin/main`, an empty commit "backlog: claim <id>", `git push -u origin claude/backlog-<id>`. If the push is refused because the branch exists, another run took it: go back to step 2 for the next item.

4. Work. Do exactly what the item says, nothing more. Research with `news-researcher` (Haiku), write stories with `news-writer` (Sonnet), both with full briefs. Facts only from official data or authoritative sources; if the item depends on a fact you cannot confirm, mark the item blocked in the queue file (`- [ ] **id** [kind] (blocked: reason, date) ...`), ship that one-line change and stop. Commit and push to the branch after each meaningful step, so a run cut off by the usage limit can be continued.

5. Checks, all must pass: `pnpm news:puzzle-check`, `pnpm news:build && pnpm news:verify && pnpm news:seo-audit`, `pnpm test`. For a story with a future `publishedAt`, preview it as routine A does and never commit preview times. Fix failures at the source; never weaken a check.

6. Ship. In the same branch, tick the item in `docs/NEWS-BACKLOG.md` (`- [x]`, with the date). Open one pull request using `.github/pull_request_template.md`. `content` items: subscribe and merge when CI is green; fix a red CI with a new commit. `code` items: leave the pull request open for the owner and say so. If this session has no GitHub tools to open a pull request, push the branch and report its name; never push to `main` from this routine. Never deploy, never force-push.

7. Report in Turkish, under 8 lines: the item, what changed, the checks, the pull request link and whether it was merged or waits for review.
```
