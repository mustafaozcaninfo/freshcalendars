# Daily puzzle routines

Two scheduled routines write every daily puzzle page on /news/. They split the games by where the answers come from, so each one runs when its answers exist and they never write the same files. Method: `.claude/skills/news-puzzles/SKILL.md`; games and sources: `docs/PUZZLES.md`; cost rules: `docs/NEWS-COST-GUIDE.md` section 6.

| Routine | Games | Runs | Why then |
|---|---|---|---|
| A. Puzzles: official data | Wordle, Connections, Strands, Pips, Spelling Bee, Mini Crossword, Letter Boxed, Contexto | Every day, 10:23 p.m. ET | The Mini for the next day appears at about 10 p.m. ET (6 p.m. on Saturday). The other games publish their data many days ahead, so each run tops up the schedule. |
| B. Puzzles: published solutions | Quordle, Blossom, Waffle, Connections: Sports Edition, LinkedIn games | Every day, 7:17 a.m. ET | These have no official data we can read; a page needs two published solutions that agree, and those sites post them between about 4 and 7 a.m. ET (LinkedIn games open at 3 a.m. ET). |

Both start a **new session on every run** (never the same session), use the strongest model for the main session (choose it in the Routines screen; without a choice the routine runs on the default model), research with `news-researcher` (Haiku) and write with `news-writer` (Sonnet). They ship one pull request per run and merge it when CI is green. The news routine's prompt must say "Do not write or edit daily puzzle pages." The monthly roundups and new games stay with the separate routine "Puzzles: new games and monthly roundups".

## Setting them up (claude.ai, Routines)

For each routine: New routine, paste the name and prompt below, repository `mustafaozcaninfo/freshcalendars`, the same cloud environment as the news routine, schedule as given (time zone America/New_York), **start a new session each run**, model: the strongest available, notifications on. From a Claude session the same is `create_trigger` with `create_new_session_on_fire: true`, `cron_expression` as given and the prompt below.

- A: name `Puzzles: official data (daily)`, cron `CRON_TZ=America/New_York 23 22 * * *`
- B: name `Puzzles: published solutions (daily)`, cron `CRON_TZ=America/New_York 17 7 * * *`

To pause, disable the routine; to change what it does, edit its prompt (it keeps its history).

## Prompt A: official data (daily, 10:23 p.m. ET)

```text
You are the Fresh Calendars daily puzzle round for games with OFFICIAL data (/news/, category `puzzles`, byline `news-desk`). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`; if `status` is not `allowed` or `isUsingOverage` is true, write one line with the reset time and stop. If the tool is not available in this session, skip this step and continue (routine sessions often do not have it).

1. Setup. First call `add_repo` (claude-code-remote) with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push`, and follow what it returns: a routine session does not have the repository attached, and without this every push is refused (403). Then clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/NEWS-COST-GUIDE.md`, `docs/PUZZLES.md` and the `news-puzzles` skill (follow it exactly), plus the `news-article` skill. List open pull requests if GitHub tools are available; do not touch files another open PR changes. Routine sessions start outside the repo, so the repo's agents and skills may not be loaded: read the skill files directly (`.claude/skills/news-puzzles/SKILL.md`, `.claude/skills/news-article/SKILL.md`), and if the `news-researcher` or `news-writer` agent types are not available, use `general-purpose` agents with the same briefs.

2. Scope, in this order. Never write or edit pages of Quordle, Blossom, Waffle, Connections: Sports Edition or LinkedIn games (routine B does those), monthly roundups or non-puzzle stories.
   a) Tomorrow's Mini Crossword (tomorrow = the next date in America/New_York). Run `pnpm news:puzzle-data <tomorrow> --games mini`. If it saves, write the page now with `publishedAt` = the current time ET. If it says "not published", report it and go on.
   b) Top up the schedule. For Wordle, Connections, Strands, Pips and Spelling Bee, find every date from tomorrow through today + 12 days that has no page yet. Run `pnpm news:puzzle-data <first missing date> <today+12>` once; it saves only what NYT has published. Write a page for each date whose data saved, oldest first, at most 3 dates per game in one run. A Spelling Bee page also needs the previous day's Bee data (it shows yesterday's solution); save it if missing. `publishedAt` is 12:05 a.m. ET the day before the puzzle.
   c) Letter Boxed and Contexto: keep their schedule at least 5 days ahead, using the same source and method as their newest page (Letter Boxed from the puzzle data on the NYT Letter Boxed page, Contexto from contexto.me). If the official source is blocked or has no data for a date, do not write that date.
   Model every page on the newest page of the same game (headings, answer line formats, FAQ, related links). Answers, numbers, weekdays and counts come only from the saved data, computed by script; never guess. Hints must be true for the data: check each one against the answer.

3. Writing. Give each game's pages to a `news-writer` agent (Sonnet) in the background, all in one message, with a complete brief: the slugs, the data file paths, the newest page of that game as the model, and the rules above. Writers write files only. Then read every hint against the data yourself before checks.

4. Heroes. One row per page in `PUZZLE_HEROES` in `packages/generator/src/heroes5.ts` (vary the accent from the day before), then `pnpm fc news-heroes5 --only <date-part>` per date.

5. Checks, all must pass:
   - `pnpm news:puzzle-check` (answers vs saved official data; run after every fix).
   - Scheduled pages are not in a normal build, so preview them once: set every puzzle page whose `publishedAt` is in the future to the current time, run `pnpm news:build && pnpm news:verify && pnpm news:seo-audit`, then restore them with `git checkout -- apps/news/src/content/articles` and confirm `git status` shows only your new files. Never commit the preview times.
   - `pnpm test`.
   Fix failures in the pages, never in the data or the checks. Quote official wording (group names, entries, clues) exactly; write our own text around it.

6. Ship. One branch, one commit (pages, their `apps/news/src/content/puzzles/` data files, hero images, `heroes5.ts`), one pull request for the round using `.github/pull_request_template.md`. Subscribe to it and merge when CI is green; if CI fails, fix with a new commit. If this session has no GitHub tools to open or merge a pull request, push the commit straight to `main` instead (`git fetch origin main && git rebase origin/main && git push origin HEAD:main`, allowed for stories by CLAUDE.md) and check that CI goes green. Never deploy, never force-push.

7. Report in Turkish, under 10 lines: pages written per game and date range, what NYT had not published yet (for example "Spelling Bee Nov. 20 not out"), anything held and why, the PR link. Do not wait for replies.
```

## Prompt B: published solutions (daily, 7:17 a.m. ET)

```text
You are the Fresh Calendars daily puzzle round for games WITHOUT official data (/news/, category `puzzles`, byline `news-desk`). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`; if `status` is not `allowed` or `isUsingOverage` is true, write one line with the reset time and stop. If the tool is not available in this session, skip this step and continue (routine sessions often do not have it).

1. Setup. First call `add_repo` (claude-code-remote) with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push`, and follow what it returns: a routine session does not have the repository attached, and without this every push is refused (403). Then clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/NEWS-COST-GUIDE.md`, `docs/PUZZLES.md` and the `news-puzzles` skill, plus the `news-article` skill. List open pull requests if GitHub tools are available; do not touch files another open PR changes. Routine sessions start outside the repo, so the repo's agents and skills may not be loaded: read the skill files directly (`.claude/skills/news-puzzles/SKILL.md`, `.claude/skills/news-article/SKILL.md`), and if the `news-researcher` or `news-writer` agent types are not available, use `general-purpose` agents with the same briefs.

2. Scope: today's pages (today = the current date in America/New_York) for Quordle, Blossom, Waffle, Connections: Sports Edition and the LinkedIn games page, skipping any that already exist. Never write or edit pages of Wordle, Connections, Strands, Pips, Spelling Bee, Mini, Letter Boxed or Contexto (routine A does those), roundups or non-puzzle stories.

3. Research. One message, one `news-researcher` agent (Haiku) per game, in the background. Each brief asks for the day's answers on at least TWO independent published solution pages that print today's date (and the puzzle number when given), with URL, page title, publisher and printed date, and AGREE / CONFLICT / ONLY ONE SOURCE / NOT YET. Give the source lists from docs/PUZZLES.md and the newest page of the game. Tell it: ignore pages that say TBA, check the date on every page (sites recycle old posts), never get around a 403 or bot challenge.

4. Decide. Write a game only when two independent sources agree on every answer you print. Print only what they agree on: if they do not give board positions (Quordle) or clue words (Pinpoint), do not invent them. Hold a game with a conflict or a single source and say so in the report. The LinkedIn page needs at least Pinpoint and Crossclimb confirmed; otherwise hold it.

5. Writing. Give the confirmed games to `news-writer` agents (Sonnet) in one message, each with the fact sheet, the slug and the newest page of that game as the model. `publishedAt` is the current time ET. List the agreeing sources under `sources:` with "(answer cross-check)" in the title, as the existing pages do. Read every hint against the confirmed answers yourself.

6. Heroes: one row per page in `PUZZLE_HEROES` in `packages/generator/src/heroes5.ts`, then `pnpm fc news-heroes5 --only <today's date-part>`.

7. Checks, all must pass: `pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm news:puzzle-check && pnpm test`. Fix failures in the pages; never weaken a check.

8. Ship. One branch, one commit, one pull request using `.github/pull_request_template.md`; subscribe and merge when CI is green; fix a red CI with a new commit. If this session has no GitHub tools to open or merge a pull request, push the commit straight to `main` instead (`git fetch origin main && git rebase origin/main && git push origin HEAD:main`, allowed for stories by CLAUDE.md) and check that CI goes green. Never deploy, never force-push.

9. Report in Turkish, under 10 lines: what was published, what was held and why (with the source counts), the PR link. Do not wait for replies.
```
