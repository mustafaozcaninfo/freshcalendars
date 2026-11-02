# The /news/ desk: one manager, four writer accounts

Five Claude accounts work on /news/. All of them are signed in to GitHub as the same user (`mustafaozcaninfo`), so GitHub cannot tell them apart: who did what is read from the branch name and the pull request title, never from the GitHub user. This file is the rulebook every writer session reads; its rules are part of each writer's prompt.

| Account | Code | Beat | Byline | Runs |
|---|---|---|---|---|
| Manager | `M` | plans, queues, review, code changes | – | by hand (the owner's own sessions) |
| Writer 1 | `w1` | holidays, elections, government deadlines, UK and Canada, UK/Canada sports | `alex-morgan` | writer routine, below |
| Writer 2 | `w2` | school calendars, test dates, family planning, money and benefits (Social Security, SNAP, taxes, wages) | `emily-carter` for school and family, `alex-morgan` for money and government | writer routine, below |
| Writer 3 | `w3` | time and clock changes, sky events, calendar guides, retail dates, US sports, entertainment and streaming | `jordan-bennett` | writer routine, below |
| Writer 4 | `w4` | the puzzle desk: daily puzzle pages, roundups, the work queue | `news-desk` | routines A, B, C and D (`docs/PUZZLE-ROUTINES.md`) |

The byline follows the beat of the story, not the account: a w2 money story is bylined `alex-morgan`. The queue item names the byline.

## Queues

Each writer has one queue file: `docs/desk/w1.md`, `docs/desk/w2.md`, `docs/desk/w3.md`. W4 keeps `docs/NEWS-BACKLOG.md`. A writer reads and edits only its own file. The manager adds, reorders and removes items, committing straight to `main` (docs only).

**Item format.** `- [ ] **<id>** Working headline.` then indented lines: target query, category and byline, publish by, what we add. The id is short kebab-case and unique across all queue files (it becomes the branch name).

**Claiming.** An item is taken when a branch `claude/desk-<id>` exists on `origin`. The writer pushes that branch before any other work, so two runs never take the same item. An item whose branch has no open pull request and no commit for 3 hours is stalled: the same writer's next run continues it from that branch.

**Done.** The writer ticks the item in its pull request: `- [x] **<id>** (done 2026-11-03, <slug>) ...`.

**Blocked.** When a fact cannot be confirmed yet or the story needs a code change: `- [ ] **<id>** (blocked: reason, date) ...`, shipped as a one-line change. The manager unblocks it by deleting the note.

**Queue empty.** Then the writer takes the next due installment from the "Standing" section of its file. If none is due, it picks one story in its own beat with the `news-seo` skill, adds it to its file as a new item in the claim commit, and writes it. It never writes a topic that already has a story on `main`, an open pull request or a `claude/desk-*` branch. With nothing worth writing it reports "kuyruk boş" and stops.

## Writer rules

Everything in `CLAUDE.md` applies. On top of it:

- **One story per run.** Finish it properly or mark it blocked.
- **Stay in your beat.** A good topic in another beat goes in the report for the manager, not into your queue.
- **Files you may change:** your story, its images and printables, your queue file, `KEY_DATES` lines for your story's dates, and the `related` or link lines in the 1-2 existing stories that link back to yours.
- **Files you never change:** daily puzzle pages and roundups (W4), another writer's queue file, `docs/NEWS-BACKLOG.md`, and shared code: `apps/news/src/components`, `apps/news/src/lib` (except `KEY_DATES` lines), `content.config.ts`, `packages/`, `scripts/`, `site-chrome`, `.github/`, `cloudflare/`. If a story needs a code change, mark the item blocked with "needs code: ..." and the manager makes it.
- **Never touch a file an open pull request changes**, except `apps/news/src/lib/keydates.ts`. On a rebase conflict there, keep both sides' lines.
- **Ship through a pull request** titled `[W1] <headline>`, and merge it when CI is green. Push to `main` only when the session has no GitHub tools (rebase first). Never deploy, never force-push.

## Writer routine (one per writer account)

Set up in claude.ai → Routines on each writer's account:

- **Name:** `Writer w1` (or `w2`, `w3`)
- **Repository:** `mustafaozcaninfo/freshcalendars`. It must be selected on the routine itself; without it every push is refused with 403.
- **Cloud environment:** the same one the puzzle routines use
- **Start a new session each run.** Model: the strongest available. Notifications: on.
- **Schedule (America/New_York):**

| Writer | Runs | Cron |
|---|---|---|
| w1 | 8:35 a.m., 12:35 p.m., 4:35 p.m. ET | `CRON_TZ=America/New_York 35 8,12,16 * * *` |
| w2 | 9:05 a.m., 1:05 p.m., 5:05 p.m. ET | `CRON_TZ=America/New_York 5 9,13,17 * * *` |
| w3 | 9:35 a.m., 1:35 p.m., 5:35 p.m. ET | `CRON_TZ=America/New_York 35 9,13,17 * * *` |

The writers are staggered so their pull requests rarely reach CI at the same time. Each account has its own usage limit, so they do not slow each other down. To run a writer by hand, open a new session on its account and paste the same prompt.

**Prompt** (replace `w1` with the writer's code in the first line only):

```text
You are Fresh Calendars writer w1 (/news/). This is a fresh session; nothing else is known. Work in English in the repo; write the final report in Turkish. Write ONE story, finish it properly, and stop.

0. Usage gate. If the `get_session` tool (claude-code-remote) is available, call it with no session_id and read `external_metadata.rate_limit_info`. Stop with one line (the reset time) if `status` is not `allowed` or `isUsingOverage` is true. If the tool is not available, continue.

1. Setup. The routine must have the repository `mustafaozcaninfo/freshcalendars` selected (Routines screen); without it every push is refused (403). If pushes are refused and the `add_repo` tool (claude-code-remote) is available, call it with owner `mustafaozcaninfo`, repo `freshcalendars`, access `push` and follow what it returns; otherwise report that the repository must be added to the routine and stop. Clone https://github.com/mustafaozcaninfo/freshcalendars if it is missing, `pnpm install`, start from `origin/main`. Read `CLAUDE.md`, `docs/NEWS-COST-GUIDE.md`, `docs/DESK.md` (its rules are part of this prompt) and your queue file `docs/desk/<your code>.md`. Read the skill files directly: `.claude/skills/news-article/SKILL.md`, `.claude/skills/news-seo/SKILL.md`, `.claude/skills/news-visuals/SKILL.md`. If the `news-researcher` or `news-writer` agent types are not available, use `general-purpose` agents with the same briefs. List open pull requests if GitHub tools are available.

2. Pick. `git fetch origin '+refs/heads/claude/desk-*:refs/remotes/origin/claude/desk-*'`. Walk your queue top to bottom and take the first item that is unticked, not blocked, and either has no `claude/desk-<id>` branch on origin or has a stalled one (no open pull request, no commit in the last 3 hours: continue from it). If there is none, follow "Queue empty" in `docs/DESK.md`. Never take an item from another writer's file.

3. Claim. For a new item: `git checkout -b claude/desk-<id> origin/main`, a commit "desk: claim <id>" (empty, or the new queue line when you added the item yourself), `git push -u origin claude/desk-<id>`. If the push is refused because the branch exists, another run took it: go back to step 2.

4. Write. Follow the `news-article` skill from its first step, with `news-seo` for the angle and `news-visuals` for the hero and printable. Research with `news-researcher` (Haiku), write with `news-writer` (Sonnet), both with full briefs. Facts only from official or authoritative sources; if the story depends on a fact nobody has confirmed, mark the item blocked in your queue file, ship that one line and stop. Commit and push to the branch after each meaningful step, so a run cut off by the usage limit can be continued.

5. Checks, all must pass: `pnpm news:build && pnpm news:verify && pnpm news:seo-audit`, `pnpm test`. For a story with a future `publishedAt`, preview it as the skill says and never commit preview times. Fix failures in your story; never weaken a check.

6. Ship. In the same branch, tick the item in your queue file (`- [x] **<id>** (done <date>, <slug>)`). Open one pull request titled `[<your code in capitals>] <headline>` using `.github/pull_request_template.md`; subscribe and merge when CI is green; fix a red CI with a new commit. If this session has no GitHub tools to open a pull request, `git fetch origin main && git rebase origin/main && git push origin HEAD:main` and check that CI goes green. Never deploy, never force-push.

7. Report in Turkish, under 8 lines: the story and its URL, the pull request and whether it merged, anything blocked and why, and any good topic you saw in another beat (for the manager).
```

## Manager (account M)

The owner's own sessions. Every day:

1. **Fill the queues.** Keep 5 to 10 items in each writer's file, ordered by publish-by date. Sources: the content plan, the writers' reports, `pnpm news:dashboard`. Before adding an item, check that no story on `main` already covers it (`ls apps/news/src/content/articles/*/*/ | grep <word>`). Commit queue changes straight to `main`.
2. **Read what went live.** List the day's writer pull requests (`gh pr list --state merged --search "[W in:title"`), read the stories, check one with `pnpm news:verify-live <slug>`. A problem goes back as a new item at the top of the same writer's queue ("fix: ...").
3. **Unblock.** Items marked "needs code" are the manager's: make the change in its own branch and pull request, then delete the blocked note.
4. **Watch the puzzle desk.** Routines A to D run on account W4; their reports and pull requests show whether a day was missed.

## Do not

- Do not add a second all-beats news routine: it would pick the same topics as the writers. The old single news routine is retired once the writer routines run.
- Do not require pull request approvals on `main`: every pull request is opened by the same GitHub user, who cannot approve their own, so nothing would merge.
