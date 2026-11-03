# The /news/ desk: one manager, four writers, a research desk and an update desk

Seven Claude accounts work on /news/. All of them are signed in to GitHub as the same user (`mustafaozcaninfo`), so GitHub cannot tell them apart: who did what is read from the branch name and the pull request title, never from the GitHub user. This file is the rulebook every desk session reads; its rules are part of each routine's prompt.

| Account | Code | Beat | Byline | Runs |
|---|---|---|---|---|
| Manager | `M` | plans, queues, review, code changes, the phase decision | – | by hand (the owner's own sessions) |
| Writer 1 | `w1` | holidays, elections, government and civic deadlines, UK and Canada (categories `holidays`, `elections`, `planning`, `uk-canada`) | `christina-gerland` | writer routine, below |
| Writer 2 | `w2` | school calendars, test dates, family planning, money and benefits: Social Security, SNAP, taxes, wages (categories `school-calendars`, `money-benefits`) | `aaron-kessler` | writer routine, below |
| Writer 3 | `w3` | time and clock changes, sky events, calendar guides, retail dates, entertainment and streaming, gaming and tech, all sports, every league and country (categories `time-change`, `sky-events`, `calendar-guides`, `retail-dates`, `entertainment`, `gaming-tech`, `sports`) | `jessica-hartwell` | writer routine, below |
| Writer 4 | `w4` | the puzzle desk: daily puzzle pages and monthly roundups, nothing else | `news-desk` | routines A, B and C (`docs/PUZZLE-ROUTINES.md`) |
| Research | `r` | finds topics for w1 to w3 and keeps their queues full, unblocks items whose source has posted; writes no story | – | research routine, below |
| Update | `u` | every update of an existing story, in every beat: facts and `updatedAt` only; writes no new story | the story's own editor | update routine, below |

One category, one editor, one writer account: the byline is the editor who owns the story's category (`categories` in `apps/news/src/content/authors/<id>.json`), and a writer only files stories in its own categories. A money story is `money-benefits`, not `planning`.

## Volume and growth policy

/news/ started on Oct. 17, 2026 and published up to 89 stories a day in its second week. A young section that swings between bursts and silence looks like scaled content to Google; a steady, slowly rising daily output of useful stories, spread over the day, does not. So the desk publishes the same amount every day, in every beat, around the clock, and steps up only when Search Console shows Google is keeping up.

**CURRENT PHASE: 1**

| Phase | Per writer run | Per writer per day (4 runs) | Desk total per day (3 writers) | Starts |
|---|---|---|---|---|
| 1 | 2 new stories | 8 new | **24 new** | Nov. 2, 2026 (now) |
| 2 | 3 new stories | 12 new | **36 new** | when the gate passes, earliest Nov. 17, 2026 |

Updates come from the update desk (`u`, since Nov. 3, 2026), not from the writers: up to 3 per run, as many runs as its usage allows.

Puzzle pages (routines A to C, about 6 to 10 a day) come on top and do not count.

- **36 new stories a day is the ceiling.** There is no phase 3. Growth after that comes from better stories and updates, not more of them.
- **Fewer is allowed, padding is not.** A run that finds only one topic worth writing (information gain, `CLAUDE.md`) writes one. A run never writes a thin story to reach the number.
- **The gate** (the owner checks Search Console every Monday; the manager changes the phase line above):
  1. no manual action and no security issue;
  2. at least 60% of the /news/ URLs published 7 to 21 days earlier are indexed (Pages report, or URL Inspection on a sample of 20);
  3. /news/ clicks and impressions did not fall two weeks in a row.

  All three pass: move up one phase (two weeks in a phase at least). Any one fails: move down one phase; in phase 1, drop to "1 new per run" until the gate passes again.
- **Updates count as much as new stories.** A silent update (facts and `updatedAt` only, `CLAUDE.md`) of a story whose date is coming up keeps it ranking and costs a fraction of a new story.

## Schedule and cost

Each account has a five-hour usage window. The four runs of a writer are 6 hours apart, so every run starts in a fresh window and gets its full budget. The three writers are 2 hours apart, so a pull request reaches CI and the deploy queue every 2 hours, never two at once.

| Writer | Runs (ET) | Runs (Türkiye, winter) | Cron |
|---|---|---|---|
| w1 | 12:35 a.m., 6:35 a.m., 12:35 p.m., 6:35 p.m. | 08:35, 14:35, 20:35, 02:35 | `CRON_TZ=America/New_York 35 0,6,12,18 * * *` |
| w2 | 2:35 a.m., 8:35 a.m., 2:35 p.m., 8:35 p.m. | 10:35, 16:35, 22:35, 04:35 | `CRON_TZ=America/New_York 35 2,8,14,20 * * *` |
| w3 | 4:35 a.m., 10:35 a.m., 4:35 p.m., 10:35 p.m. | 12:35, 18:35, 00:35, 06:35 | `CRON_TZ=America/New_York 35 4,10,16,22 * * *` |
| r | every 4 hours at :50, 1:50 a.m. to 9:50 p.m. | 09:50, 13:50, 17:50, 21:50, 01:50, 05:50 | `CRON_TZ=America/New_York 50 1,5,9,13,17,21 * * *` |
| u | every 2 hours at :20, 1:20 a.m. to 11:20 p.m. | 09:20, 11:20, ... (every 2 h) | `CRON_TZ=America/New_York 20 1,3,5,7,9,11,13,15,17,19,21,23 * * *` |

The writers' pull requests reach CI between about :05 and :20 past odd hours, so `r` (docs straight to `main`) starts at :50 and `u` at :20, and their pushes land in the gaps. `u` runs often on purpose: its usage gate ends a run at once when the account's window is spent, so it works as much as the limit allows and no more.

Where the cost goes and how a run keeps it low (`docs/NEWS-COST-GUIDE.md`):

- **Batch.** Setup, the site build, the checks, the pull request and CI cost the same for one story or three, so a run writes all its items together: one build, one commit, one pull request.
- **Cheap models for volume.** Research on Haiku, writing on Sonnet, always; the strongest model only decides, picks photos and ships. When the `news-researcher` or `news-writer` agent types are missing, a `general-purpose` agent gets `model: haiku` or `model: sonnet` explicitly, never the session's model.
- **Read little.** The main session reads `CLAUDE.md`, this file, its queue file and the `news-seo` and `news-visuals` skills. The writers read `news-article`; the main session does not.
- **Stop at the limit.** The usage gate runs at the start and again before writing; a limit costs nothing because the next run starts in a new window.

## Queues

Each writer has one queue file: `docs/desk/w1.md`, `docs/desk/w2.md`, `docs/desk/w3.md`. The code and puzzle-feature items in `docs/NEWS-BACKLOG.md` belong to the manager (routine D is paused). A writer reads and edits only its own file, and only its "Queue" items. The research desk (`r`) and the manager add, reorder and remove items in every file, committing straight to `main` (docs only). The update desk (`u`) takes and ticks the "Updates" items of every file. `docs/desk/research-log.md` is the research desk's record: what each run added, unblocked or turned down, so no run checks the same topic twice.

**Where new stories come from, in order:** (1) unticked items in the "Queue" section of the writer's file; (2) a due installment from its "Standing" section; (3) a topic the writer finds in its own beat with the `news-seo` skill, added to its file as a new item in the claim commit. A topic is never written when a story on `main`, an open pull request or a `claude/desk-*` branch already covers it.

**Where updates come from** (the update desk's list; writers take none), in order: (1) items under an "Updates" heading in any queue file, the oldest "by" date first; (2) a story that says a fact is "not yet announced" (or similar) when the official source has announced it since; (3) a story whose date falls in the next 30 days and whose `updatedAt` is older than 14 days, checked against its sources. An update that finds nothing changed is not committed and does not count. A self-found update goes in the queue file of the story's beat (its category's writer), already ticked, in the update desk's pull request.

**Item format.** `- [ ] **<id>** Working headline.` then indented lines: target query, category and byline, publish by, what we add. The id is short kebab-case and unique across all queue files. An update's id is `upd-<slug>`.

**Claiming.** An item is taken when a branch `claude/desk-<id>` exists on `origin`. The writer (or the update desk) pushes a claim branch (one empty commit, "desk: claim <id>") for each item before any other work, so two runs never take the same item. A claim whose newest commit is older than 3 hours, whose item is still unticked and has no open pull request, is stalled: the next run deletes it, claims the item again and starts it fresh. A claim counts only while its item is unticked and has no blocked note: a branch left behind for a ticked or blocked item is ignored, and the run that sees it deletes it.

**Done.** The writer ticks each item in its pull request: `- [x] **<id>** (done 2026-11-03, <slug>) ...`. A self-found topic or update is added already ticked.

**Blocked.** When a fact cannot be confirmed or the story needs a change in shared code (a story's own printable generator is not shared code, "Writer rules"): `- [ ] **<id>** (blocked: reason, date) ...`, in the same pull request. The writer deletes the item's claim branch, then takes the next item; after two blocked items in one run it stops looking. The manager unblocks an item by deleting the note (and any claim branch still left for it).

## Other routines

- **NFL pick'em hub weekly update** (account w2, Tuesdays 1:23 p.m. ET, September to December): refreshes the hub `printable-nfl-pickem-sheets-2026` and the schedule tables from the generator (`docs/NFL-PICKEM.md`). Writers never edit the hub or `packages/generator/data/nfl-2026/`; w3 still writes the weekly "NFL Week N schedule" stories.

## Watchdog

`.github/workflows/desk-watchdog.yml` (`scripts/desk-watchdog.mjs`) runs after every CI run and every 30 minutes, so a run that ended early never leaves stories waiting:

- A desk pull request (`[W1]`..., `[U]`, `Puzzles ...`) that conflicts with `main` only in queue files gets `main` merged in with both sides' lines kept; any other conflict is reported.
- One with no CI run gets one started; one green for 20 minutes is merged, and CI on `main` is started so it publishes (merges by the Actions token start no workflow of their own).
- Claim branches whose item is ticked, blocked or stalled (see "Claiming") are deleted, and so are claims with no queue item that are older than 3 hours (a self-found update that found nothing to change), and so are branches already in `main`, including run branches whose pull request was squash-merged (tip equal to the merged head).
- What needs a person goes to the open issue "Desk watchdog": red CI, other conflicts, a writer with no pull request or claim for 8 hours, a research or update desk with no run on record for 8 hours, and the blocked items.

Writers still merge and clean up their own runs; the watchdog is the backstop. Dry run: `node scripts/desk-watchdog.mjs --dry-run`.

## Writer rules

Everything in `CLAUDE.md` applies. On top of it:

- **The phase sets the batch.** Read "CURRENT PHASE" above at the start of every run; never write more than the phase allows. Writers write new stories only: updates belong to the update desk, so a writer never takes an "Updates" item or an `upd-` claim.
- **Block only as a last resort.** Before marking an item blocked for a missing fact, try in this order: (1) the official source; (2) another page of the same official body (a calendar or rule page when a PDF returns 403; a date computed from the rule the agency states counts as official); (3) two or more independent reputable sites that agree on the fact, all listed under `sources:` and named in the text, as `CLAUDE.md` allows. Sites that copy each other, Wikipedia, aggregators and forums do not count as independent. If they disagree, print only what they agree on. Block only when none of the three gives the fact; a value nobody has published yet is written as "not yet announced" with last year's value labeled, not blocked, unless the whole story depends on it.
- **Stay in your beat.** A good topic in another beat goes in the report for the manager, not into your queue.
- **Printables use a kit from the category's list** (owner decisions 2026-11-03; every category has one, table in the `news-article` skill, "Printables"): ask `news-researcher` for the PRINTABLE DATA block of that kit, with a `quote:` from the source on every dated or timed item. `noKit: "<why>"` (or `assets.customPrintable` for a story's own generator) only when the sheet is not that kind; name it in your run report. `news-assets` and the audit's `10-PDF-KIT` refuse anything else.
- **Files you may change:** your stories, their images and printables, existing stories in your categories (updates and the `related` or link lines of the 1-2 stories that link back to a new one), your queue file, and the `apps/news/key-dates/<slug>.json` files for your stories' dates.
- **Printable generators you may change too** (owner decision 2026-11-03: CI and the watchdog catch a mistake, and a PDF that disagrees with its story is worse than a code edit):
  - a story's own generator module in `packages/generator/src/` (the file whose top comment names the story, such as `veterans.ts` for `veterans-day-free-meals-discounts`) when the story is in your categories: its data, wording and layout;
  - a new module of that kind for a new story, with its one `news-<name>` line in `packages/generator/src/cli.ts` (the command and its usage line, nothing else in that file);
  - its source data in `packages/generator/data/` (except `nfl-2026/`, which the NFL pick'em routine owns).
  After the edit, regenerate the printable with its `pnpm fc` command (the layout check in `printCheck.ts` runs first), then run `pnpm test` with the other checks. Never touch a module another writer's story uses, and when two stories share one, change only the lines of yours.
- **Files you never change:** daily puzzle pages and roundups (W4), another writer's queue file, `docs/NEWS-BACKLOG.md` (the manager's), and shared code: `apps/news/src/components`, `apps/news/src/lib`, `content.config.ts`, the shared parts of `packages/` (in `packages/generator/src/`: `cli.ts` beyond your command lines, `newsAssets.ts`, `newsPrintable.ts`, `printables.ts`, `printCheck.ts`, `julian.ts`, `art.ts`, `fx.ts`, `news3d.ts`, `newsPhoto.ts`, `newsEmbed.ts`, `newsHeroes.ts`, `newsLinks.ts`, `browser.ts`, `playwrightRender.ts`, `renderHtml.ts`, `render3d/`, `kits/`, tests; and `packages/engine`, `packages/site-chrome`), `scripts/`, `.github/`, `cloudflare/`. If a story needs a change there, mark the item blocked with "needs code: ..." and the manager makes it.
- **Never touch a file an open pull request changes**, except your own queue file (the manager adds items to it while you run); on a conflict there, keep both sides' lines. Key dates never conflict: each story has its own file in `apps/news/key-dates/`.
- **Night runs publish in the morning.** A run between midnight and 5:59 a.m. ET sets `publishedAt` to 6:00 a.m. ET that day, 10 minutes apart per story; otherwise `publishedAt` is 5 minutes before the run finishes. A future `publishedAt` is scheduled by the site (`CLAUDE.md`).
- **Ship through one pull request per run**, titled `[W1] <n> new, <n> update: <short headlines>`, and merge it when CI is green. Push to `main` only when the session has no GitHub tools (rebase first). Never deploy, never force-push.

## Writer routine (one per writer account)

Set up in claude.ai → Routines on each writer's account:

- **Name:** `Writer w1` (or `w2`, `w3`)
- **Repository:** `mustafaozcaninfo/freshcalendars`. It must be selected on the routine itself; without it every push is refused with 403.
- **Cloud environment:** full network access, the same as the puzzle routines
- **Start a new session each run.** Model: the strongest available. Notifications: on.
- **Schedule:** the cron from "Schedule and cost" above.

To run a writer by hand, open a new session on its account and paste the same prompt. The prompt is complete; the only thing it reads from this file that changes over time is the phase line and the queue.

**Prompt** (replace `w1` with the writer's code in the first line only):

```text
You are Fresh Calendars writer w1 (/news/). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish. Do one batch: the new stories the current phase allows (updates belong to the update desk), finished properly, in one pull request, then stop.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`. Stop with one line (the reset time) if `status` is not `allowed` or `isUsingOverage` is true. If the tool is not available, continue.

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected; without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/DESK.md` (its rules are part of this prompt; note CURRENT PHASE), your queue file `docs/desk/<your code>.md`, `.claude/skills/news-seo/SKILL.md`, `.claude/skills/news-visuals/SKILL.md`, and section 4 of `docs/NEWS-COST-GUIDE.md`. Do not read `news-article` yourself; the writer agents do. List open pull requests if GitHub tools are available.

2. Pick. `git fetch origin '+refs/heads/claude/desk-*:refs/remotes/origin/claude/desk-*'`. Choose the new stories for this run as "Queues" in `docs/DESK.md` says, in its order, skipping ticked, blocked and claimed items (a stalled claim is free again). Never take an item from another writer's file.

3. Claim. For each chosen item: `git checkout -b claude/desk-<id> origin/main && git commit --allow-empty -m "desk: claim <id>" && git push -u origin claude/desk-<id>` (for a stalled claim, first `git push origin --delete claude/desk-<id>`). If the push is refused because the branch exists, another run took it: pick the next item. Then create your work branch: `git checkout -b claude/desk-run-<your code>-<YYYYMMDD-HHMM ET> origin/main`. When you added a self-found item, add its queue line in this branch.

4. Research. One message, one `news-researcher` agent (Haiku) per item, all in the background, with exact questions (cost guide section 2, step 3). If that agent type is missing, use `general-purpose` with `model: haiku`. For each fact sheet apply "Block only as a last resort" in `docs/DESK.md`: write, write with "not yet announced", or block (then take the next item; after two blocks stop looking).

5. Usage gate again, as in step 0. If the limit is reached, check and ship only what is already written (steps 8 and 9) and stop.

6. Heroes. Pick the hero for each new story yourself, as `news-visuals` says (a licensed photo with `pnpm fc news-photo`, or an unused illustrated scene). Updates keep their hero.

7. Write. One message, one `news-writer` agent (Sonnet) per story and per update, all in the background, each with the full brief of cost guide section 4, the hero decision, and these closing lines: "Other writers work in parallel: do not run `pnpm news:build`; run `pnpm news:abbrev` only. Do not commit." If that agent type is missing, use `general-purpose` with `model: sonnet`. An update changes facts and `updatedAt` only. Set `publishedAt` as "Night runs publish in the morning" says.

8. Checks once for the whole batch, all must pass: `pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test`. Read the failing line and fix it in the story (yourself, or send it back to the same writer agent); never weaken a check.

9. Ship. Tick every finished item in your queue file and add blocked notes. One commit, one pull request titled `[<your code in capitals>] <n> new, <n> update: <short headlines>` using `.github/pull_request_template.md`; subscribe and merge when CI is green; fix a red CI with a new commit. If no CI starts or the pull request says it has conflicts, `git merge origin/main`, keep both sides' lines, push, and wait for CI again: a conflicting pull request never runs CI, so its scheduled stories stay off the site. If this session has no GitHub tools to open a pull request, `git fetch origin main && git rebase origin/main && git push origin HEAD:main` and check that CI goes green. After the merge, delete this run's claim branches (done and blocked items) and work branch (`git push origin --delete ...`); a claim left behind hides its item from the next run, so this step is part of the run. Never deploy, never force-push.

10. Report in Turkish, under 10 lines: each story and update with its URL, the pull request and whether it merged, anything blocked and why, and any good topic you saw in another beat (for the manager).
```

## Research routine (account `r`)

Keeps every writer's queue two to four days ahead, so a writer never has to find its own topic, and reopens blocked items once their source has posted. It writes no story, opens no pull request and touches no file but the queue files and its log.

- **Name:** `Research desk`. **Repository**, **cloud environment**, **new session each run**: as for the writers. Model: the strongest available (it decides what gets written); its fact checks run on Haiku.
- **Schedule:** `CRON_TZ=America/New_York 50 1,5,9,13,17,21 * * *`.

**Prompt:**

```text
You are the Fresh Calendars research desk (account r, /news/). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish. Do one pass: keep the three writers' queues full with topics worth writing, reopen blocked items whose source has posted, record it, then stop. You never write or edit a story.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`. Stop with one line (the reset time) if `status` is not `allowed` or `isUsingOverage` is true. If the tool is not available, continue.

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected; without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing and start from `origin/main` (no `pnpm install`: this desk builds nothing). Read `CLAUDE.md` (the content rules), `docs/DESK.md` (its rules are part of this prompt; note CURRENT PHASE and each writer's beat), `docs/desk/w1.md`, `w2.md`, `w3.md`, `docs/desk/research-log.md` (the owner's notes at its top come first) and `.claude/skills/news-seo/SKILL.md`.

2. What is already covered. List every story slug and title on main (`apps/news/src/content/articles`), the open pull requests, the `claude/desk-*` branches (`git fetch origin '+refs/heads/claude/desk-*:refs/remotes/origin/claude/desk-*'`), every item in the three queue files and the topics the log turned down. A topic covered by any of them is never added again.

3. Targets. Per writer, count the open items in its "Queue" section (unticked, not blocked). The target is two days of its phase output (phase 1: 16 items, phase 2: 24), at most four days. Each "Updates" section should hold at least 6 open items. Work on the writer furthest below target first; add at most 12 new items and 6 update items in this run.

4. Find. Candidates in each writer's own beat that people will search for in the next 7 to 45 days: announced dates, deadlines, schedules, releases, seasonal peaks, the owner's notes. Apply `news-seo`: one query per item, a new story only when it adds what the top results lack (CLAUDE.md, "Every story adds something"), otherwise an update of the story that already ranks. For updates: stories whose date is in the next 30 days and whose `updatedAt` is older than 14 days, and stories that say "not yet announced" for something an official source may have posted since.

5. Check. One message, one `news-researcher` agent (Haiku) per batch of up to 6 candidates, all in the background (if that agent type is missing, `general-purpose` with `model: haiku`): for each, is the key fact already on an official source (URL and date), or only expected later (when)? A candidate whose key fact is not out yet is not added; it goes in the log as "recheck <date>".

6. Unblock. For every blocked item in the three files whose recheck date has passed, or whose note names a source that may have posted, check it the same way (in the step 5 batches). Delete the blocked note when the fact is now available, and delete the item's claim branch if one is left (`git push origin --delete claude/desk-<id>`). Leave "needs code" items to the manager.

7. Write. Add each item in the format of "Queues" in `docs/DESK.md` (id unique across all files; target query; category and byline; publish by; what we add, with the official source found in step 5), new stories in the right writer's "Queue" section in publish-by order, updates in the "Updates" section of the story's beat. Append one run line to `docs/desk/research-log.md` ("YYYY-MM-DD HH:MM ET: +n w1, +n w2, +n w3, +n updates, unblocked: ids; turned down: topic (why); recheck: topic (date)") and keep its "Runs" list to the last 60 lines.

8. Ship. `git add docs/desk && git commit -m "desk(r): <what changed>"`, then `git fetch origin main && git rebase origin/main && git push origin HEAD:main` (docs only, straight to main; on a rebase conflict in a queue file keep both sides' lines). Never touch a story, code or another file; never force-push. Commit even when nothing was added: the log line is the desk's heartbeat for the watchdog.

9. Report in Turkish, under 8 lines: items added per writer with their ids, items unblocked, the most important topic of the coming week, and anything the manager should decide.
```

## Update routine (account `u`)

Owns every update of an existing story, in every beat: it keeps published stories correct and current, silently (facts and `updatedAt` only, `CLAUDE.md`). It writes no new story.

- **Name:** `Update desk`. **Repository**, **cloud environment**, **new session each run**: as for the writers. Model: the strongest available; fact checks on Haiku, edits on Sonnet.
- **Schedule:** `CRON_TZ=America/New_York 20 1,3,5,7,9,11,13,15,17,19,21,23 * * *`. The usage gate ends a run at once when the window is spent, so the desk runs as often as its limit allows.
- **Files it may change:** existing stories in any category, their images and printables (and the printable generator a story owns, as in "Writer rules"), their `apps/news/key-dates/<slug>.json` files, and the "Updates" items of the three queue files. Never a new story, a "Queue" item, a puzzle page or roundup (W4), or shared code; "needs code" notes go to the manager as for the writers. The byline of an updated story stays as it is.

**Prompt:**

```text
You are the Fresh Calendars update desk (account u, /news/). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish. Do one batch of up to 3 updates of existing stories, finished properly, in one pull request, then stop. You never write a new story.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`. Stop with one line (the reset time) if `status` is not `allowed` or `isUsingOverage` is true. If the tool is not available, continue.

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected; without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/DESK.md` (its rules are part of this prompt; "Where updates come from" is your list, and "Update routine" your file rules), the "Updates" sections of `docs/desk/w1.md`, `w2.md`, `w3.md`, and section 4 of `docs/NEWS-COST-GUIDE.md`. List open pull requests if GitHub tools are available. If an earlier `[U]` pull request is still open, finish it first (fix it, or merge it when CI is green) and count its updates toward this run.

2. Pick up to 3 updates as "Where updates come from" says, in its order: open "Updates" items of any file (oldest "by" date first), then stories that say "not yet announced" for a fact that may have posted, then stories whose date is in the next 30 days and whose `updatedAt` is older than 14 days. Skip ticked, blocked and claimed items (`git fetch origin '+refs/heads/claude/desk-*:refs/remotes/origin/claude/desk-*'`; a stalled claim is free again) and any story an open pull request changes.

3. Claim each one (`claude/desk-upd-<slug>`, the id is `upd-<slug>`) exactly as step 3 of the writer prompt says; a self-found update gets its queue line, already ticked, in the beat's file in this run's branch. Work branch: `claude/desk-run-u-<YYYYMMDD-HHMM ET>`.

4. Research. One message, one `news-researcher` agent (Haiku) per update, all in the background, each asked exactly what to check against the story's own sources and what may have changed. A story where nothing changed is dropped: delete its claim, no commit, and it does not count.

5. Usage gate again, as in step 0. If the limit is reached, check and ship only what is already done (steps 7 and 8) and stop.

6. Edit. One `news-writer` agent (Sonnet) per update that changed, all in the background, each with the fact sheet and these closing lines: "Silent update: change the facts and updatedAt only (CLAUDE.md); keep the title's query, the byline, the hero and the slug. Regenerate the printable if its facts changed. Other writers work in parallel: do not run `pnpm news:build`; run `pnpm news:abbrev` only. Do not commit." If that agent type is missing, use `general-purpose` with `model: sonnet`.

7. Checks once for the whole batch, all must pass: `pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test` (pull request CI also builds scheduled stories). Fix the failing line in the story; never weaken a check.

8. Ship. Tick each finished item (`- [x] **upd-<slug>** (done YYYY-MM-DD, what changed) ...`). One commit, one pull request titled `[U] <n> update: <short headlines>`; merge it when CI is green, fix a red CI with a new commit; on a conflict `git merge origin/main`, keep both sides' lines, push. Then delete this run's claim branches and work branch. If nothing changed in this run, push no branch: instead append one line to `docs/desk/research-log.md` under "Update desk" ("YYYY-MM-DD HH:MM ET: checked <slugs>, nothing changed"), commit it as `desk(u): checked, nothing changed` and push it straight to main after `git rebase origin/main` (it is the desk's heartbeat for the watchdog). Never deploy, never force-push.

9. Report in Turkish, under 8 lines: each update with its URL and what changed, the pull request and whether it merged, anything blocked and why.
```

## Manager (account M)

The owner's own sessions. The writers find their own topics, so the manager steers instead of feeding every story:

1. **Every day: read the "Desk watchdog" issue** and act on "Needs a person". Then **check what went live.** List the day's writer pull requests (`gh pr list --state merged --search "[W in:title"`), read a sample of the stories, check one with `pnpm news:verify-live <slug>`. A problem goes back as a new item at the top of the same writer's queue ("fix: ...").
2. **Unblocking and queue filling are the research desk's daily work** (below). The manager reads `docs/desk/research-log.md` once a day, removes a topic that should not be written, and moves the ones that matter most to the top; items marked "needs code" stay the manager's own work (branch and pull request).
3. **Every week: steer.** Search Console's top queries and pages go to the research desk as a short list at the top of `docs/desk/research-log.md` ("Owner's notes"); it turns them into items.
4. **Every Monday: the phase decision.** With the owner's Search Console numbers, apply the gate in "Volume and growth policy" and change the CURRENT PHASE line if needed.
5. **Watch the puzzle desk.** Routines A, B and C run on account W4; their pull requests show whether a day was missed. Routine D is paused, so `docs/NEWS-BACKLOG.md` items are done by hand in manager sessions.

## Do not

- Do not add a second all-beats news routine: it would pick the same topics as the writers. The research desk only queues topics and the update desk only updates stories; neither writes a new story.
- Do not raise the volume above the phase table, and do not skip days: steady output is the policy.
- Do not require pull request approvals on `main`: every pull request is opened by the same GitHub user, who cannot approve their own, so nothing would merge.
