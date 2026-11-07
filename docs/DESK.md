# The /news/ desk: one manager, four writers, a research desk, an update desk and a search desk

Eight Claude accounts work on /news/. All of them are signed in to GitHub as the same user (`mustafaozcaninfo`), so GitHub cannot tell them apart: who did what is read from the branch name and the pull request title, never from the GitHub user. This file is the rulebook every desk session reads; its rules are part of each routine's prompt.

| Account | Code | Beat | Byline | Runs |
|---|---|---|---|---|
| Manager | `M` | plans, queues, review, code changes, the phase decision | – | by hand (the owner's own sessions) |
| Writer 1 | `w1` | holidays, elections, government and civic deadlines, UK and Canada (categories `holidays`, `elections`, `planning`, `uk-canada`) | `christina-gerland` | writer routine, below |
| Writer 2 | `w2` | school calendars, test dates, family planning, money and benefits: Social Security, SNAP, taxes, wages (categories `school-calendars`, `money-benefits`) | `aaron-kessler` | writer routine, below |
| Writer 3 | `w3` | time and clock changes, sky events, calendar guides, retail dates, entertainment and streaming, gaming and tech, all sports, every league and country (categories `time-change`, `sky-events`, `calendar-guides`, `retail-dates`, `entertainment`, `gaming-tech`, `sports`) | `jessica-hartwell` | writer routine, below |
| Writer 4 | `w4` | the puzzle desk: daily puzzle pages and monthly roundups, nothing else | `news-desk` | routines A, B and C (`docs/PUZZLE-ROUTINES.md`) |
| Research | `r` | finds topics for w1 to w3 and keeps their queues full, unblocks items whose source has posted; writes no story | – | research routine, below |
| Update | `u` | every update of an existing story, in every beat: facts and `updatedAt` only; writes no new story | the story's own editor | update routine, below |
| Search | `s` | reads Search Console (web, image, Discover) once a day, decides which pages to improve and how, files the briefs for `u`, measures what each change did; writes no story and edits none | – | search routine, below |

One category, one editor, one writer account: the byline is the editor who owns the story's category (`categories` in `apps/news/src/content/authors/<id>.json`), and a writer only files stories in its own categories. A money story is `money-benefits`, not `planning`.

## Volume and growth policy

/news/ started on Oct. 17, 2026 and published up to 89 stories a day in its second week. A young section that swings between bursts and silence looks like scaled content to Google; a steady, slowly rising daily output of useful stories, spread over the day, does not. So the desk publishes the same amount every day, in every beat, around the clock, and steps up only when Search Console shows Google is keeping up.

**CURRENT PHASE: 1**

**SPRINT ENDED on Nov. 4, 2026 (owner's decision on Nov. 5: too many stories in a burst risks a Google penalty).** The phase line above applies again today: 2 new stories per writer run, 24 new a day for the desk. Update items (`upd-`) are not new stories and continue at the normal pace.

| Phase | Per writer run | Per writer per day (4 runs) | Desk total per day (3 writers) | Starts |
|---|---|---|---|---|
| 1 | 2 new stories | 8 new | **24 new** | Nov. 2, 2026 (now) |
| 2 | 3 new stories | 12 new | **36 new** | when the gate passes, earliest Nov. 17, 2026 |

Updates come from the update desk (`u`, since Nov. 3, 2026), not from the writers: up to 3 per run, as many runs as its usage allows.

Puzzle pages (routines A to C, about 6 to 10 a day) come on top and do not count.

- **36 new stories a day is the ceiling.** There is no phase 3. Growth after that comes from better stories and updates, not more of them.
- **Fewer is allowed, padding is not.** A run that finds only one topic worth writing (information gain, `CLAUDE.md`) writes one. A run never writes a thin story to reach the number.
- **The gate** (`docs/desk/search-console.md` holds its numbers, read daily from Search Console by `scripts/news-gsc.mjs`; the owner checks the manual-action and security part and the manager changes the phase line above, every Monday):
  1. no manual action and no security issue;
  2. at least 60% of the /news/ URLs published 7 to 21 days earlier are indexed (Pages report, or URL Inspection on a sample of 20);
  3. /news/ clicks and impressions did not fall two weeks in a row.

  All three pass: move up one phase (two weeks in a phase at least). Any one fails: move down one phase; in phase 1, drop to "1 new per run" until the gate passes again.
- **Updates count as much as new stories.** A silent update (facts and `updatedAt` only, `CLAUDE.md`) of a story whose date is coming up keeps it ranking and costs a fraction of a new story.

## Search Console data

`.github/workflows/search-console.yml` reads Search Console every day at 09:10 UTC (read-only service account) and commits `docs/desk/search-console.md` (for people) and `docs/desk/search-console.json` (the same, as data) straight to `main`. They hold: the gate numbers (indexed share of a sample of stories published 7 to 21 days ago, whether /news/ clicks or impressions fell two weeks in a row), weekly totals for /news/ and the calendar site, the **opportunities** (query and page pairs ranking 2.5 to 20 whose click rate is below what that position earns, ranked by the clicks missing) and the top pages. It covers web, image and Discover results separately, pages that lost or gained clicks (14 days against the 14 before), queries that show two of our pages, news pages missing from image results, an indexing sample with Google's reasons, the sitemaps and the **experiments** (title and snippet changes of the search desk, 14 days before against 14 days after). The data is 2 to 3 days late. Nobody edits these files by hand.

- **The search desk (`s`)** turns this data into work: it files an update item (an SEO brief) for each page worth improving, and measures what each change did. Updates driven by search performance are its alone; the research desk does not add them.
- **The research desk** reads the queries with impressions but no story that answers them, when it picks new topics. An item it adds from this data says so: "Search Console: <query>, <impressions> impressions at position <n>".
- **The update desk** takes the search desk's items like any other update item.
- **The manager** reads the gate section on Mondays instead of asking the owner for numbers. The API cannot see manual actions or security issues: the owner still checks Search Console > Security & Manual Actions.
- A file older than 3 days means the job failed: the watchdog reports it.

## Schedule and cost

Each account has a five-hour usage window. The four runs of a writer are 6 hours apart, so every run starts in a fresh window and gets its full budget. The three writers are 2 hours apart, so a pull request reaches CI and the deploy queue every 2 hours, never two at once.

| Writer | Runs (ET) | Runs (Türkiye, winter) | Cron |
|---|---|---|---|
| w1 | 12:35 a.m., 6:35 a.m., 12:35 p.m., 6:35 p.m. | 08:35, 14:35, 20:35, 02:35 | `CRON_TZ=America/New_York 35 0,6,12,18 * * *` |
| w2 | 2:35 a.m., 8:35 a.m., 2:35 p.m., 8:35 p.m. | 10:35, 16:35, 22:35, 04:35 | `CRON_TZ=America/New_York 35 2,8,14,20 * * *` |
| w3 | 4:35 a.m., 10:35 a.m., 4:35 p.m., 10:35 p.m. | 12:35, 18:35, 00:35, 06:35 | `CRON_TZ=America/New_York 35 4,10,16,22 * * *` |
| r | every 4 hours at :50, 1:50 a.m. to 9:50 p.m. | 09:50, 13:50, 17:50, 21:50, 01:50, 05:50 | `CRON_TZ=America/New_York 50 1,5,9,13,17,21 * * *` |
| u | every 2 hours at :20, 1:20 a.m. to 11:20 p.m. | 09:20, 11:20, ... (every 2 h) | `CRON_TZ=America/New_York 20 1,3,5,7,9,11,13,15,17,19,21,23 * * *` |
| s | once a day, 5:40 a.m. | 13:40 | `CRON_TZ=America/New_York 40 5 * * *` |

`s` runs once a day because Search Console publishes once a day: the data job reads it at 09:10 UTC (4:10 a.m. ET) and `s` starts 90 minutes later, so a second run would read the same numbers.

The writers' pull requests reach CI between about :05 and :20 past odd hours, so `r` (docs straight to `main`) starts at :50 and `u` at :20, and their pushes land in the gaps. `u` runs often on purpose: its usage gate ends a run at once when the account's window is spent, so it works as much as the limit allows and no more.

Where the cost goes and how a run keeps it low (`docs/NEWS-COST-GUIDE.md`):

- **Batch.** Setup, the site build, the checks, the pull request and CI cost the same for one story or three, so a run writes all its items together: one build, one commit, one pull request.
- **Cheap models for volume.** Research on Haiku, writing on Sonnet, always; the strongest model only decides, picks photos and ships. When the `news-researcher` or `news-writer` agent types are missing, a `general-purpose` agent gets `model: haiku` or `model: sonnet` explicitly, never the session's model.
- **Read little.** The main session reads `CLAUDE.md`, this file, its queue file and the `news-seo` and `news-visuals` skills. The writers read `news-article`; the main session does not.
- **Stop at the limit.** The usage gate runs at the start and again before writing; a limit costs nothing because the next run starts in a new window.

## Queues

Each writer has one queue file: `docs/desk/w1.md`, `docs/desk/w2.md`, `docs/desk/w3.md`. The code and puzzle-feature items in `docs/NEWS-BACKLOG.md` belong to the manager (routine D is paused). A writer reads and edits only its own file, and only its "Queue" items. The research desk (`r`) and the manager add, reorder and remove items in every file, committing straight to `main` (docs only). The search desk (`s`) adds "Updates" items (SEO briefs) at the top of the "Updates" section in every file and, since Nov. 3, 2026, new-story items from search data at the top of the "Queue" section ("Search routine"). The update desk (`u`) takes and ticks the "Updates" items of every file. `docs/desk/research-log.md` is the research desk's record: what each run added, unblocked or turned down, so no run checks the same topic twice.

**Where new stories come from, in order:** (1) unticked items in the "Queue" section of the writer's file; (2) a due installment from its "Standing" section; (3) a topic the writer finds in its own beat with the `news-seo` skill, added to its file as a new item in the claim commit. A topic is never written when a story on `main`, an open pull request or a `claude/desk-*` branch already covers it.

**Where updates come from** (the update desk's list; writers take none), in order: (1) items under an "Updates" heading in any queue file, the oldest "by" date first; (2) a story that says a fact is "not yet announced" (or similar) when the official source has announced it since; (3) a story whose date falls in the next 30 days and whose `updatedAt` is older than 14 days, checked against its sources. An update that finds nothing changed is not committed and does not count. A self-found update goes in the queue file of the story's beat (its category's writer), already ticked, in the update desk's pull request.

**Item format.** `- [ ] **<id>** Working headline.` then indented lines: target query, category and byline, publish by, what we add. The id is short kebab-case and unique across all queue files. An update's id is `upd-<slug>`.

**Claiming.** An item is taken when a branch `claude/desk-<id>` exists on `origin`. The writer (or the update desk) pushes a claim branch (one empty commit, "desk: claim <id>") for each item before any other work, so two runs never take the same item. A claim whose newest commit is older than 3 hours, whose item is still unticked and has no open pull request, is stalled: the next run deletes it, claims the item again and starts it fresh. A claim counts only while its item is unticked and has no blocked note: a branch left behind for a ticked or blocked item is ignored, and the run that sees it deletes it.

**Done.** The writer ticks each item in its pull request: `- [x] **<id>** (done 2026-11-03, <slug>) ...`. A self-found topic or update is added already ticked.

**Blocked.** When a fact cannot be confirmed or the story needs a change in shared code (a story's own printable generator is not shared code, "Writer rules"): `- [ ] **<id>** (blocked: reason, date) ...`, in the same pull request. The writer deletes the item's claim branch, then takes the next item; after two blocked items in one run it stops looking. The manager unblocks an item by deleting the note (and any claim branch still left for it).

## Other routines

- **NFL pick'em hub weekly update** (account w2, Tuesdays 1:23 p.m. ET, September to December): refreshes the hub `printable-nfl-pickem-sheets-2026` and the schedule tables from the generator (`docs/NFL-PICKEM.md`). Writers never edit the hub or `packages/generator/data/nfl-2026/`; w3 still writes the weekly "NFL Week N schedule" stories.

## Starting a desk by hand

Every desk routine has an API trigger next to its schedule (claude.ai → Routines → the routine → Add another trigger → API → Generate token). The workflow **Desk fire** (`.github/workflows/desk-fire.yml`, `scripts/desk-fire.mjs`) starts one desk with it: Actions → Desk fire → Run workflow → desk code, mode, optional note. The run's summary shows its `RUN_ID` and the session link, and the start is logged as a comment on the issue "Desk run log" (created on the first start).

- **Modes.** `run` is the desk's normal run (its saved prompt, plus the run id and the note). `test` is the same trigger with a line asking the session to run only its usage gate and stop, for checking a new trigger without a full run. `dry` checks the registry and the secrets and sends nothing.
- **Adding a desk.** Generate its API token, add the two secrets `FIRE_<DESK>_URL` and `FIRE_<DESK>_TOKEN` (`FIRE_W3_URL`, `FIRE_R_TOKEN`, ...), then set `"armed": true` on its line in `docs/desk/desks.json`. The workflow itself does not change. Run it once in `test` mode.
- **Secrets.** GitHub Actions only: never in the repository, a file or a chat. A token starts that one routine and reads nothing. Generating a new token revokes the old one; rotate by updating the secret. The workflow passes all repository secrets to the script as one JSON value so that a new desk needs no edit; the script keeps only that desk's `FIRE_` pair and drops the rest at once. Anyone who can change `scripts/desk-fire.mjs` on a branch can dispatch it from that branch, which is the same reach they already have with the deploy workflow.
- **Limits** (experimental endpoint, `platform.claude.com/docs/en/api/claude-code/routines-fire`): 30 fires an hour per routine (the Run now button counts too) and 100 an hour per account. A fire uses that account's usage like any session; the usage gate in the prompts cannot run in routine sessions (no `get_session` there), so a spent window ends the session at the limit instead.
- **No double starts.** The endpoint has no idempotency key. The script retries only a 429; a 500, 503 or timeout is reported and never repeated, because the session may already have started. A paused routine answers 400. One start at a time per desk (workflow concurrency).
- **What it cannot do.** It starts a session; it cannot read it, stop it or change the routine's schedule or prompt. Progress shows in the repository (claim branches, pull requests, the watchdog issue), in the session link and in the "Desk run log" issue.

## Watchdog

`.github/workflows/desk-watchdog.yml` (`scripts/desk-watchdog.mjs`) runs after every CI run and every 30 minutes, so a run that ended early never leaves stories waiting:

- A desk pull request (`[W1]`..., `[U]`, `Puzzles ...`) that conflicts with `main` only in queue files gets `main` merged in with both sides' lines kept; any other conflict is reported.
- One with no CI run gets one started; one green for 20 minutes is merged, and CI on `main` is started so it publishes (merges by the Actions token start no workflow of their own).
- Claim branches whose item is ticked, blocked or stalled (see "Claiming") are deleted, and so are claims with no queue item that are older than 3 hours (a self-found update that found nothing to change), and so are branches already in `main`, including run branches whose pull request was squash-merged (tip equal to the merged head).
- What needs a person goes to the open issue "Desk watchdog": red CI, other conflicts, a writer with no pull request or claim for 8 hours, a research or update desk with no run on record for 8 hours (the search desk: 30 hours), and the blocked items.

- Only pull requests from this repository's own branches are handled. One from a fork (anyone can open one on a public repository, with any title) is listed by number under "Needs a person" and never merged, rebased or started by the watchdog: read it and decide by hand.
- A desk pull request that changes a file in "Files you never change" (`.github/`, `.githooks/`, `.claude/`, `scripts/`, `cloudflare/`, any `package.json`, the lock and workspace files, `wrangler.jsonc`, `CLAUDE.md`; the list is `PROTECTED` in `scripts/desk-scope.mjs`) is not merged and is reported; CI also turns it red (job `desk-scope`). Such a change goes in its own pull request without a desk title, which the owner merges.
- An error on one pull request is reported and skipped; the rest of the run (merges, publish, cleanup, report) goes on. The report goes only to the "Desk watchdog" issue the Actions bot opened.

Writers still merge and clean up their own runs; the watchdog is the backstop. Dry run: `node scripts/desk-watchdog.mjs --dry-run`.

## Writer rules

Everything in `CLAUDE.md` applies. On top of it:

- **The phase sets the batch.** Read "CURRENT PHASE" above at the start of every run; never write more than the phase allows. Writers write new stories only: updates belong to the update desk, so a writer never takes an "Updates" item or an `upd-` claim.
- **Block only as a last resort.** Before marking an item blocked for a missing fact, try in this order: (1) the official source; (2) another page of the same official body (a calendar or rule page when a PDF returns 403; a date computed from the rule the agency states counts as official); (3) two or more independent reputable sites that agree on the fact, all listed under `sources:` and named in the text, as `CLAUDE.md` allows. Sites that copy each other, Wikipedia, aggregators and forums do not count as independent. If they disagree, print only what they agree on. Block only when none of the three gives the fact; a value nobody has published yet is written as "not yet announced" with last year's value labeled, not blocked, unless the whole story depends on it.
- **Read what search taught.** Before you choose a headline or a lede, read "Learned" in `docs/desk/search-log.md`: the search desk records which title and first-sentence patterns won clicks and which lost.
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

9. Ship. Tick every finished item in your queue file and add blocked notes. One commit, one pull request titled `[<your code in capitals>] <n> new, <n> update: <short headlines>` using `.github/pull_request_template.md`; subscribe and merge when CI is green; fix a red CI with a new commit. If no CI starts or the pull request says it has conflicts, `git merge origin/main`, keep both sides' lines, push, and wait for CI again: a conflicting pull request never runs CI, so its scheduled stories stay off the site. If this session has no GitHub tools to open a pull request, `git fetch origin main && git rebase origin/main && git push origin HEAD:main` and check that CI goes green. After the merge, delete this run's claim branches (done and blocked items) and work branch (`git push origin --delete ...`); a claim left behind hides its item from the next run, so this step is part of the run. Never deploy, never force-push. The pre-push hook builds /news/ and runs the full audit (about 2-3 minutes) when the push changes the news site; if it stops the push, fix the lines it prints (for example a printable name missing from the story text) and push again; never skip it with `--no-verify` or `FC_SKIP_AUDIT=1` (owner's decision, Nov. 5, 2026: no red CI on pull requests).

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

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected; without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing and start from `origin/main` (no `pnpm install`: this desk builds nothing). Read `CLAUDE.md` (the content rules), `docs/DESK.md` (its rules are part of this prompt; note CURRENT PHASE and each writer's beat), `docs/desk/w1.md`, `w2.md`, `w3.md`, `docs/desk/research-log.md` (the owner's notes at its top come first), `docs/desk/search-console.md` (Search Console: queries with impressions, top pages) and `.claude/skills/news-seo/SKILL.md`.

2. What is already covered. List every story slug and title on main (`apps/news/src/content/articles`), the open pull requests, the `claude/desk-*` branches (`git fetch origin '+refs/heads/claude/desk-*:refs/remotes/origin/claude/desk-*'`), every item in the three queue files and the topics the log turned down. A topic covered by any of them is never added again.

3. Targets. Per writer, count the open items in its "Queue" section (unticked, not blocked). The target is two days of its phase output (phase 1: 16 items, phase 2: 24), at most four days. Each "Updates" section should hold at least 6 open items. Work on the writer furthest below target first; add at most 12 new items and 6 update items in this run.

4. Find. Candidates in each writer's own beat that people will search for in the next 7 to 45 days: announced dates, deadlines, schedules, releases, seasonal peaks, the owner's notes. Apply `news-seo`: one query per item, a new story only when it adds what the top results lack (CLAUDE.md, "Every story adds something"), otherwise an update of the story that already ranks. For updates: stories whose date is in the next 30 days and whose `updatedAt` is older than 14 days, and stories that say "not yet announced" for something an official source may have posted since. For new stories: queries in that file that bring impressions to a page that does not answer them. Search-performance updates (titles, snippets, images) are the search desk's; never add them.

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
- **Files it may change:** existing stories in any category, their images and printables (and the printable generator a story owns, as in "Writer rules"), their `apps/news/key-dates/<slug>.json` files, and the "Updates" items of the three queue files. Never a new story, a "Queue" item, a puzzle page or roundup (W4), or shared code; "needs code" notes go to the manager as for the writers. The byline of an updated story stays as it is. An item that starts "SEO brief" is the search desk's: make exactly the change it names (title, `seoTitle`, `description`, first sentence, a section, hero alt text or caption; the frontmatter limits and the headline rules of `CLAUDE.md` still apply), keep the slug, byline and hero picture, and tick it with the old and new title: `(done YYYY-MM-DD, title: "old" → "new")`. The search desk measures the change from that line.

**Prompt:**

```text
You are the Fresh Calendars update desk (account u, /news/). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish. Do one batch of up to 3 updates of existing stories, finished properly, in one pull request, then stop. You never write a new story.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`. Stop with one line (the reset time) if `status` is not `allowed` or `isUsingOverage` is true. If the tool is not available, continue.

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected; without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/DESK.md` (its rules are part of this prompt; "Where updates come from" is your list, and "Update routine" your file rules), the "Updates" sections of `docs/desk/w1.md`, `w2.md`, `w3.md`, `docs/desk/search-console.md` (what Search Console says about each page) and section 4 of `docs/NEWS-COST-GUIDE.md`. List open pull requests if GitHub tools are available. If an earlier `[U]` pull request is still open, finish it first (fix it, or merge it when CI is green) and count its updates toward this run.

2. Pick up to 3 updates as "Where updates come from" says, in its order: open "Updates" items of any file (oldest "by" date first), then stories that say "not yet announced" for a fact that may have posted, then stories whose date is in the next 30 days and whose `updatedAt` is older than 14 days. Skip ticked, blocked and claimed items (`git fetch origin '+refs/heads/claude/desk-*:refs/remotes/origin/claude/desk-*'`; a stalled claim is free again) and any story an open pull request changes.

3. Claim each one (`claude/desk-upd-<slug>`, the id is `upd-<slug>`) exactly as step 3 of the writer prompt says; a self-found update gets its queue line, already ticked, in the beat's file in this run's branch. Work branch: `claude/desk-run-u-<YYYYMMDD-HHMM ET>`.

4. Research. One message, one `news-researcher` agent (Haiku) per update, all in the background, each asked exactly what to check against the story's own sources and what may have changed. A story where nothing changed is dropped: delete its claim, no commit, and it does not count.

5. Usage gate again, as in step 0. If the limit is reached, check and ship only what is already done (steps 7 and 8) and stop.

6. Edit. One `news-writer` agent (Sonnet) per update that changed, all in the background, each with the fact sheet and these closing lines: "Silent update: change the facts and updatedAt only (CLAUDE.md); keep the title's query, the byline, the hero and the slug. Regenerate the printable if its facts changed. Other writers work in parallel: do not run `pnpm news:build`; run `pnpm news:abbrev` only. Do not commit." If that agent type is missing, use `general-purpose` with `model: sonnet`.

7. Checks once for the whole batch, all must pass: `pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test` (pull request CI also builds scheduled stories). Fix the failing line in the story; never weaken a check.

8. Ship. Tick each finished item (`- [x] **upd-<slug>** (done YYYY-MM-DD, what changed) ...`). One commit, one pull request titled `[U] <n> update: <short headlines>`; merge it when CI is green, fix a red CI with a new commit; on a conflict `git merge origin/main`, keep both sides' lines, push. Then delete this run's claim branches and work branch. If nothing changed in this run, push no branch: instead append one line to `docs/desk/research-log.md` under "Update desk" ("YYYY-MM-DD HH:MM ET: checked <slugs>, nothing changed"), commit it as `desk(u): checked, nothing changed` and push it straight to main after `git rebase origin/main` (it is the desk's heartbeat for the watchdog). Never deploy, never force-push.

9. Report in Turkish, under 8 lines: each update with its URL and what changed, the pull request and whether it merged, anything blocked and why.
```

## Search routine (account `s`)

Decides, every day, which published pages Search Console says are worth improving and how, and learns from what each change did. It writes no story and edits none: it files briefs for the update desk, keeps the experiment record and tells the manager what only code can fix.

- **Name:** `Search desk`. **Repository**, **cloud environment**, **new session each run**: as for the writers. Model: the strongest available (it judges what a searcher wants). It may run up to 5 web searches a run to see how the top results answer a query; nothing else needs a sub-agent.
- **Schedule:** `CRON_TZ=America/New_York 40 5 * * *`, once a day (see "Schedule and cost").
- **Files it may change:** `docs/desk/search-log.md`, `docs/desk/search-experiments.json`, `docs/desk/search-calendar-site.md`, the "Updates" and "Queue" sections of `docs/desk/w1.md`, `w2.md`, `w3.md` (add items at the top; never tick, edit or delete another desk's item) and the "Owner's notes" of `docs/desk/research-log.md`. Never a story, code or any other file.
- **Owner's mandate (Nov. 3, 2026):** the owner gave this desk the search decisions for /news/: which pages to improve and how (title, `seoTitle`, description, first sentence, sections, alt text), which new stories search data calls for, and which layout or template changes would raise clicks. Three surfaces, one desk:
  1. **Briefs** (below), the core of every run.
  2. **New stories from search data:** up to 5 "Queue" items a run, at the top of the beat's queue, each marked "(search desk, <date>)" and naming the pattern or query that calls for it. Before adding, check that no story on `main`, queue item or `claude/desk-*` branch covers it, and never a topic the calendar site already serves. These count inside the writers' phase volume; they never raise it.
  3. **Layout and templates** (story page, news home, hubs, the calendar site): ideas go to `docs/desk/search-calendar-site.md` for the manager with the page, the data behind it and how to measure it; the desk never changes code.

**What it decides, in order** (at most 10 new briefs a run, the largest gain first):

1. **Web opportunities** (ranking 2.5 to 20, click rate below what the position earns): read the story, diagnose why searchers pass it by (the title does not carry the query, the answer is not in the first sentence, the description is generic, the page answers a neighbouring question) and write the change. A query Google answers in its own box (a date, a time, a score) will not be won by a title: skip it and note it in "Learned".
2. **Pages that lost clicks** (last 14 days against the 14 before): a dated story decays after its event (a puzzle, a game day), so skip those; for the rest find the cause (a newer page took the query, the facts went stale, the snippet changed) and brief the fix.
3. **Pages that compete** (one query, two of our pages): pick the page that should win; brief the other to target a different query, or to link to the winner. A merge or redirect is the manager's decision: write it to the manager, not as an item. A dated series competes with itself by nature: leave it.
4. **Images:** news pages that rank on the web but have no image impressions, and the image pages with impressions but no clicks: brief the hero's alt text, title and caption (describe the picture and the story, never stuff keywords; never change the picture, `12-HERO-UNIQUE` owns that).
5. **Discover:** never change the headline of a story that earns Discover traffic (the headline rules of `CLAUDE.md` and audit `11-*` apply); keep it current, and record in "Learned" what the Discover winners have in common.
6. **Indexing:** a story 7 or more days old that is not indexed: brief what makes it thin or a near-copy. Many stories "Discovered, not indexed" is a volume signal: tell the manager (the phase policy). A sitemap with errors goes to the manager.
7. **Calendar site** (pages outside `/news/`): never an item (the generator is shared code). Write the page, the query, the position and click rate, and the title, description or H1 template change you would make, to `docs/desk/search-calendar-site.md` for the manager.

**Rules that keep the measurement honest:** no brief for a story updated in the last 3 days (Search Console data ends 3 days before the read, so an earlier change is not in the numbers yet; it was 7 days until 2026-11-04, when that rule left no candidate for a week because the update desk touches almost every story), with an experiment running, or with an open item; one search change per story per 14 days; no brief for a story ranking 2.5 or better with a click rate at or above what the position earns. Each brief is an item at the top of the story's beat file:

`- [ ] **upd-<slug>** SEO brief (by <today + 5 days>). Search Console: "<query>", <impressions> impressions at position <p>, <clicks> clicks in 28 days. Diagnosis: <one sentence>. Change: <title to "...", seoTitle, description, first sentence, section, alt text: exact text>. Keep slug, byline, hero. Measured 14 days after it is done.`

**Experiments.** When a brief is ticked, add `{ "slug", "changedAt": "<done date>", "what": "<title: old → new>" }` to `docs/desk/search-experiments.json` (at most 40 at once). The data job measures each one: the 14 days before against the 14 days after (the change day left out) once the data is in. When `after` is present: **win** (clicks up by 25% or CTR up by 20% with impressions not down by more than 25%), **loss** (the reverse) or **flat**; under 100 impressions in either window is "too small to judge". Record the result in "Results" of `docs/desk/search-log.md`, add a general lesson to "Learned" only when two results agree, and remove the experiment from the file.

**Prompt:**

```text
You are the Fresh Calendars search desk (account s, /news/). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish. Do one daily pass: read Search Console's data, close finished experiments, start new ones, file the briefs that will win the most clicks, record it, then stop. You never write or edit a story, and you never touch code.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`. Stop with one line (the reset time) if `status` is not `allowed` or `isUsingOverage` is true. If the tool is not available, continue.

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected; without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing and start from `origin/main` (no `pnpm install`: this desk builds nothing). Read `CLAUDE.md` (the content and headline rules), `docs/DESK.md` (its rules, above all "Search routine", are part of this prompt), `docs/desk/search-console.md` and `docs/desk/search-console.json`, `docs/desk/search-log.md` ("Learned" first), `docs/desk/search-experiments.json`, the "Updates" sections of `docs/desk/w1.md`, `w2.md`, `w3.md` and `.claude/skills/news-seo/SKILL.md`. If `generatedAt` in `search-console.json` is older than 30 hours, stop and report that the data job failed (the watchdog will say so too).

2. Close experiments. For each experiment in `search-console.json` whose `after` is present, judge it as "Experiments" in `docs/DESK.md` says, write the line to "Results", add a lesson to "Learned" only when two results agree, and remove it from `docs/desk/search-experiments.json`.

3. Start experiments. For each SEO brief in the three queue files that is now ticked (`- [x] **upd-...** SEO brief ... (done YYYY-MM-DD, title: "old" → "new")`) and not yet in `search-experiments.json` or "Results", add its experiment (done date as `changedAt`).

4. Decide the briefs, in the order of "Search routine" (web opportunities, losers, pages that compete, images, Discover, indexing, calendar site), at most 10 new briefs. For each candidate read the story file (title, seoTitle, description, the first 150 words, the headings) and, for at most 5 of the largest, run a web search for the query and note how the top results title and open. Skip every candidate the rules exclude (updated in the last 3 days, experiment running, open item, healthy click rate, dated series, a query Google answers itself). Write each brief as the item format of "Search routine" says, at the top of the "Updates" section of the story's beat file (holidays, elections, planning, uk-canada: w1; school-calendars, money-benefits: w2; every other category: w3), with the exact new text, within the frontmatter limits (title 20 to 110 characters and at most 90 for a new headline pattern, seoTitle 20 to 60, description 120 to 160) and without clickbait.

5. Calendar site and the manager. Append the calendar-site observations and anything only code or the manager can decide (a merge, a redirect, a sitemap error, a volume signal) to `docs/desk/search-calendar-site.md`, newest first, one dated entry each.

6. Record. Append one line to "Runs" in `docs/desk/search-log.md`: "YYYY-MM-DD HH:MM ET: +n briefs (slugs), closed n experiments, started n, to the manager: n". Keep "Runs" to the last 60 lines. On Mondays also write "Week of YYYY-MM-DD" under "Weekly": the week's clicks and impressions for /news/ in web, image and Discover with the change on the week before, the best and worst page, the gate (as `docs/desk/search-console.md` states it, noting that manual actions and security issues need the owner's check) and a recommendation for the CURRENT PHASE line in `docs/DESK.md` with the reason.

7. Ship. `git add docs/desk && git commit -m "desk(s): <what changed>"`, then `git fetch origin main && git rebase origin/main && git push origin HEAD:main` (docs only, straight to main; on a rebase conflict in a queue file keep both sides' lines). Never touch a story, code or another file; never force-push. Commit even when nothing was filed: the log line is the desk's heartbeat for the watchdog.

8. Report in Turkish, under 10 lines: the briefs filed (page, query, the change), experiments closed with their result, what the manager should decide, and the one thing in the data that surprised you.
```

## Manager (account M)

The owner's own sessions. The writers find their own topics, so the manager steers instead of feeding every story:

1. **Every day: read the "Desk watchdog" issue** and act on "Needs a person". Then **check what went live.** List the day's writer pull requests (`gh pr list --state merged --search "[W in:title"`), read a sample of the stories, check one with `pnpm news:verify-live <slug>`. A problem goes back as a new item at the top of the same writer's queue ("fix: ...").
2. **Unblocking and queue filling are the research desk's daily work** (below). The manager reads `docs/desk/research-log.md` once a day, removes a topic that should not be written, and moves the ones that matter most to the top; items marked "needs code" stay the manager's own work (branch and pull request).
3. **Every week: steer.** Search Console's opportunities reach the research desk by themselves ("Search Console data"); the owner's own priorities (a topic to push or avoid) go at the top of `docs/desk/research-log.md` ("Owner's notes").
4. **Every Monday: the phase decision.** Read the gate section of `docs/desk/search-console.md`, add the owner's check of manual actions and security issues, apply the gate in "Volume and growth policy" and change the CURRENT PHASE line if needed.
5. **Watch the puzzle desk.** Routines A, B and C run on account W4; their pull requests show whether a day was missed. Routine D is paused, so `docs/NEWS-BACKLOG.md` items are done by hand in manager sessions.

## Do not

- Do not add a second all-beats news routine: it would pick the same topics as the writers. The research desk only queues topics, the update desk only updates stories and the search desk only files briefs; none of them writes a new story.
- Do not raise the volume above the phase table, and do not skip days: steady output is the policy.
- Do not require pull request approvals on `main`: every pull request is opened by the same GitHub user, who cannot approve their own, so nothing would merge.
