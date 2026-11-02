# The /news/ desk: one manager, four writer accounts

Five Claude accounts work on /news/. All of them are signed in to GitHub as the same user (`mustafaozcaninfo`), so GitHub cannot tell them apart: who did what is read from the branch name and the pull request title, never from the GitHub user. This file is the rulebook every writer session reads; its rules are part of each writer's prompt.

| Account | Code | Beat | Byline | Runs |
|---|---|---|---|---|
| Manager | `M` | plans, queues, review, code changes, the phase decision | – | by hand (the owner's own sessions) |
| Writer 1 | `w1` | holidays, elections, government deadlines (categories `holidays`, `elections`, `planning`, `uk-canada`), UK and Canada sports | `alex-morgan` | writer routine, below |
| Writer 2 | `w2` | school calendars, test dates, family planning, money and benefits: Social Security, SNAP, taxes, wages (categories `school-calendars`, `money-benefits`, money stories in `planning`) | `emily-carter` for school and family, `alex-morgan` for money and government | writer routine, below |
| Writer 3 | `w3` | time and clock changes, sky events, calendar guides, retail dates, entertainment and streaming, gaming and tech, all sports except UK and Canada (categories `time-change`, `sky-events`, `calendar-guides`, `retail-dates`, `entertainment`, `gaming-tech`, `sports`) | `jordan-bennett` | writer routine, below |
| Writer 4 | `w4` | the puzzle desk: daily puzzle pages and monthly roundups, nothing else | `news-desk` | routines A, B and C (`docs/PUZZLE-ROUTINES.md`) |

The byline follows the beat of the story, not the account: a w2 money story is bylined `alex-morgan`. The queue item names the byline.

## Volume and growth policy

/news/ started on Oct. 17, 2026 and published up to 89 stories a day in its second week. A young section that swings between bursts and silence looks like scaled content to Google; a steady, slowly rising daily output of useful stories, spread over the day, does not. So the desk publishes the same amount every day, in every beat, around the clock, and steps up only when Search Console shows Google is keeping up.

**CURRENT PHASE: 1**

| Phase | Per writer run | Per writer per day (4 runs) | Desk total per day (3 writers) | Starts |
|---|---|---|---|---|
| 1 | 2 new stories + 1 update | 8 new + 4 updates | **24 new + 12 updates** | Nov. 3, 2026 |
| 2 | 3 new stories + 1 update | 12 new + 4 updates | **36 new + 12 updates** | when the gate passes, earliest Nov. 17, 2026 |

Puzzle pages (routines A to C, about 6 to 10 a day) come on top and do not count.

- **36 new stories a day is the ceiling.** There is no phase 3. Growth after that comes from better stories and updates, not more of them.
- **Fewer is allowed, padding is not.** A run that finds only one topic worth writing (information gain, `CLAUDE.md`) writes one and uses the free slot for a second update. A run never writes a thin story to reach the number.
- **The gate** (the owner checks Search Console every Monday; the manager changes the phase line above):
  1. no manual action and no security issue;
  2. at least 60% of the /news/ URLs published 7 to 21 days earlier are indexed (Pages report, or URL Inspection on a sample of 20);
  3. /news/ clicks and impressions did not fall two weeks in a row.

  All three pass: move up one phase (two weeks in a phase at least). Any one fails: move down one phase; in phase 1, drop to "1 new + 2 updates per run" until the gate passes again.
- **Updates count as much as new stories.** A silent update (facts and `updatedAt` only, `CLAUDE.md`) of a story whose date is coming up keeps it ranking and costs a fraction of a new story.

## Schedule and cost

Each account has a five-hour usage window. The four runs of a writer are 6 hours apart, so every run starts in a fresh window and gets its full budget. The three writers are 2 hours apart, so a pull request reaches CI and the deploy queue every 2 hours, never two at once.

| Writer | Runs (ET) | Runs (Türkiye, winter) | Cron |
|---|---|---|---|
| w1 | 12:35 a.m., 6:35 a.m., 12:35 p.m., 6:35 p.m. | 08:35, 14:35, 20:35, 02:35 | `CRON_TZ=America/New_York 35 0,6,12,18 * * *` |
| w2 | 2:35 a.m., 8:35 a.m., 2:35 p.m., 8:35 p.m. | 10:35, 16:35, 22:35, 04:35 | `CRON_TZ=America/New_York 35 2,8,14,20 * * *` |
| w3 | 4:35 a.m., 10:35 a.m., 4:35 p.m., 10:35 p.m. | 12:35, 18:35, 00:35, 06:35 | `CRON_TZ=America/New_York 35 4,10,16,22 * * *` |

Where the cost goes and how a run keeps it low (`docs/NEWS-COST-GUIDE.md`):

- **Batch.** Setup, the site build, the checks, the pull request and CI cost the same for one story or three, so a run writes all its items together: one build, one commit, one pull request.
- **Cheap models for volume.** Research on Haiku, writing on Sonnet, always; the strongest model only decides, picks photos and ships. When the `news-researcher` or `news-writer` agent types are missing, a `general-purpose` agent gets `model: haiku` or `model: sonnet` explicitly, never the session's model.
- **Read little.** The main session reads `CLAUDE.md`, this file, its queue file and the `news-seo` and `news-visuals` skills. The writers read `news-article`; the main session does not.
- **Stop at the limit.** The usage gate runs at the start and again before writing; a limit costs nothing because the next run starts in a new window.

## Queues

Each writer has one queue file: `docs/desk/w1.md`, `docs/desk/w2.md`, `docs/desk/w3.md`. The code and puzzle-feature items in `docs/NEWS-BACKLOG.md` belong to the manager (routine D is paused). A writer reads and edits only its own file. The manager adds, reorders and removes items, committing straight to `main` (docs only).

**Where new stories come from, in order:** (1) unticked items in the "Queue" section of the writer's file; (2) a due installment from its "Standing" section; (3) a topic the writer finds in its own beat with the `news-seo` skill, added to its file as a new item in the claim commit. A topic is never written when a story on `main`, an open pull request or a `claude/desk-*` branch already covers it.

**Where updates come from, in order:** (1) items under an "Updates" heading in the queue file; (2) a story in the writer's categories that says a fact is "not yet announced" (or similar) when the official source has announced it since; (3) a story in the writer's categories whose date falls in the next 30 days and whose `updatedAt` is older than 14 days, checked against its sources. An update that finds nothing changed is not committed and does not count.

**Item format.** `- [ ] **<id>** Working headline.` then indented lines: target query, category and byline, publish by, what we add. The id is short kebab-case and unique across all queue files. An update's id is `upd-<slug>`.

**Claiming.** An item is taken when a branch `claude/desk-<id>` exists on `origin`. The writer pushes a claim branch (one empty commit, "desk: claim <id>") for each item before any other work, so two runs never take the same item. A claim whose newest commit is older than 3 hours, whose item is still unticked and has no open pull request, is stalled: the next run deletes it, claims the item again and starts it fresh.

**Done.** The writer ticks each item in its pull request: `- [x] **<id>** (done 2026-11-03, <slug>) ...`. A self-found topic or update is added already ticked.

**Blocked.** When a fact cannot be confirmed or the story needs a code change: `- [ ] **<id>** (blocked: reason, date) ...`, in the same pull request. The writer then takes the next item; after two blocked items in one run it stops looking. The manager unblocks an item by deleting the note.

## Other routines

- **NFL pick'em hub weekly update** (account w2, Tuesdays 1:23 p.m. ET, September to December): refreshes the hub `printable-nfl-pickem-sheets-2026` and the schedule tables from the generator (`docs/NFL-PICKEM.md`). Writers never edit the hub or `packages/generator/data/nfl-2026/`; w3 still writes the weekly "NFL Week N schedule" stories.

## Writer rules

Everything in `CLAUDE.md` applies. On top of it:

- **The phase sets the batch.** Read "CURRENT PHASE" above at the start of every run; never write more than the phase allows.
- **Block only as a last resort.** Before marking an item blocked for a missing fact, try in this order: (1) the official source; (2) another page of the same official body (a calendar or rule page when a PDF returns 403; a date computed from the rule the agency states counts as official); (3) two or more independent reputable sites that agree on the fact, all listed under `sources:` and named in the text, as `CLAUDE.md` allows. Sites that copy each other, Wikipedia, aggregators and forums do not count as independent. If they disagree, print only what they agree on. Block only when none of the three gives the fact; a value nobody has published yet is written as "not yet announced" with last year's value labeled, not blocked, unless the whole story depends on it.
- **Stay in your beat.** A good topic in another beat goes in the report for the manager, not into your queue.
- **Files you may change:** your stories, their images and printables, existing stories in your categories (updates and the `related` or link lines of the 1-2 stories that link back to a new one), your queue file, and `KEY_DATES` lines for your stories' dates.
- **Files you never change:** daily puzzle pages and roundups (W4), another writer's queue file, `docs/NEWS-BACKLOG.md` (the manager's), and shared code: `apps/news/src/components`, `apps/news/src/lib` (except `KEY_DATES` lines), `content.config.ts`, `packages/`, `scripts/`, `site-chrome`, `.github/`, `cloudflare/`. If a story needs a code change, mark the item blocked with "needs code: ..." and the manager makes it.
- **Never touch a file an open pull request changes**, except `apps/news/src/lib/keydates.ts`. On a rebase conflict there, keep both sides' lines.
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
You are Fresh Calendars writer w1 (/news/). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish. Do one batch: the new stories and the update the current phase allows, finished properly, in one pull request, then stop.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`. Stop with one line (the reset time) if `status` is not `allowed` or `isUsingOverage` is true. If the tool is not available, continue.

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected; without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/DESK.md` (its rules are part of this prompt; note CURRENT PHASE), your queue file `docs/desk/<your code>.md`, `.claude/skills/news-seo/SKILL.md`, `.claude/skills/news-visuals/SKILL.md`, and section 4 of `docs/NEWS-COST-GUIDE.md`. Do not read `news-article` yourself; the writer agents do. List open pull requests if GitHub tools are available.

2. Pick. `git fetch origin '+refs/heads/claude/desk-*:refs/remotes/origin/claude/desk-*'`. Choose the new stories and the update for this run as "Queues" in `docs/DESK.md` says, in its order, skipping ticked, blocked and claimed items (a stalled claim is free again). Never take an item from another writer's file.

3. Claim. For each chosen item: `git checkout -b claude/desk-<id> origin/main && git commit --allow-empty -m "desk: claim <id>" && git push -u origin claude/desk-<id>` (for a stalled claim, first `git push origin --delete claude/desk-<id>`). If the push is refused because the branch exists, another run took it: pick the next item. Then create your work branch: `git checkout -b claude/desk-run-<your code>-<YYYYMMDD-HHMM ET> origin/main`. When you added a self-found item, add its queue line in this branch.

4. Research. One message, one `news-researcher` agent (Haiku) per item, all in the background, with exact questions (cost guide section 2, step 3). If that agent type is missing, use `general-purpose` with `model: haiku`. For each fact sheet apply "Block only as a last resort" in `docs/DESK.md`: write, write with "not yet announced", or block (then take the next item; after two blocks stop looking).

5. Usage gate again, as in step 0. If the limit is reached, ship only what is already written (step 8) and stop.

6. Heroes. Pick the hero for each new story yourself, as `news-visuals` says (a licensed photo with `pnpm fc news-photo`, or an unused illustrated scene). Updates keep their hero.

7. Write. One message, one `news-writer` agent (Sonnet) per story and per update, all in the background, each with the full brief of cost guide section 4, the hero decision, and these closing lines: "Other writers work in parallel: do not run `pnpm news:build`; run `pnpm news:abbrev` only. Do not commit." If that agent type is missing, use `general-purpose` with `model: sonnet`. An update changes facts and `updatedAt` only. Set `publishedAt` as "Night runs publish in the morning" says.

8. Checks once for the whole batch, all must pass: `pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test`. Read the failing line and fix it in the story (yourself, or send it back to the same writer agent); never weaken a check.

9. Ship. Tick every finished item in your queue file and add blocked notes. One commit, one pull request titled `[<your code in capitals>] <n> new, <n> update: <short headlines>` using `.github/pull_request_template.md`; subscribe and merge when CI is green; fix a red CI with a new commit. If this session has no GitHub tools to open a pull request, `git fetch origin main && git rebase origin/main && git push origin HEAD:main` and check that CI goes green. After the merge, delete this run's claim branches and work branch (`git push origin --delete ...`). Never deploy, never force-push.

10. Report in Turkish, under 10 lines: each story and update with its URL, the pull request and whether it merged, anything blocked and why, and any good topic you saw in another beat (for the manager).
```

## Manager (account M)

The owner's own sessions. The writers find their own topics, so the manager steers instead of feeding every story:

1. **Every day: check what went live.** List the day's writer pull requests (`gh pr list --state merged --search "[W in:title"`), read a sample of the stories, check one with `pnpm news:verify-live <slug>`. A problem goes back as a new item at the top of the same writer's queue ("fix: ...").
2. **Every day: unblock.** Delete a blocked note when the fact can now be confirmed or a source is known; items marked "needs code" are the manager's own work (branch and pull request).
3. **Every week: steer the queues.** Put the topics that matter most in the coming weeks (seasonal peaks, announced dates) at the top of each queue, 5 to 10 per writer. Check first that no story on `main` covers them. Commit queue changes straight to `main`.
4. **Every Monday: the phase decision.** With the owner's Search Console numbers, apply the gate in "Volume and growth policy" and change the CURRENT PHASE line if needed.
5. **Watch the puzzle desk.** Routines A, B and C run on account W4; their pull requests show whether a day was missed. Routine D is paused, so `docs/NEWS-BACKLOG.md` items are done by hand in manager sessions.

## Do not

- Do not add a second all-beats news routine: it would pick the same topics as the writers.
- Do not raise the volume above the phase table, and do not skip days: steady output is the policy.
- Do not require pull request approvals on `main`: every pull request is opened by the same GitHub user, who cannot approve their own, so nothing would merge.
