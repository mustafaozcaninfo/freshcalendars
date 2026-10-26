# Writing /news/ stories at low cost

This guide is for every editor who writes /news/ stories from a Claude session. It explains which model does which job and the habits that keep token use (and cost) down without lowering quality. The full story checklist stays in the `news-article` skill; this page is only about cost.

## 1. Three models, three jobs

| Job | Who does it | Model | Why |
|---|---|---|---|
| Research: find the official source, read it, list dates, times, names and URLs, flag what is unconfirmed | `news-researcher` agent (`.claude/agents/news-researcher.md`) | **Haiku** | Reading many web pages costs the most tokens. Haiku is the cheapest model and is good at extracting facts. |
| Writing: the Markdown story, the `assets:` block, `pnpm fc news-assets`, and the checks until they pass | `news-writer` agent (`.claude/agents/news-writer.md`) | **Sonnet** | Good writing at a mid price. It passes the audit on the first or second run most of the time. |
| Editing: topic and angle, checking key facts, the hero photo, fixes, commit, pull request, merge | Your main session | The strongest model you have (Opus) | Short, high-value decisions. Keep this part small. |

The models are set in the agent files (`model: haiku`, `model: sonnet`). Do not change them to save money: a Haiku writer fails the audit more often, and every rerun costs more than the saving.

## 2. The cheap workflow, step by step

1. **One fresh session per batch.** Start from an up-to-date `main`. A long session re-reads its whole history on every turn, so cost grows with session length. After about 3 to 5 stories, or once the session feels long, start a new one.
2. **Pick 3 to 5 topics in the main session.** Run `ls apps/news/src/content/articles/2026/*/` once and drop anything already on the site or covered by a `/when-is/` page. Do not research in the main session.
3. **Send one `news-researcher` per topic, all in one message, in the background.** Give it exact questions (date, time with zone, venue, TV, last year's value, sources). Ask for a short answer with three parts: confirmed facts with URLs, UNCONFIRMED, and BLOCKED.
4. **Decide per fact sheet: write, or hold.** If the official source is blocked or the key fact (the date) is missing, hold the topic. Do not send a second researcher to dig. Holding is free, and a thin story fails the audit or needs updates later.
5. **Check only the one or two facts the story stands on**, with a quick `curl` of the official page from the main session (`curl -sS -A "Mozilla/5.0" <url> | ...grep...`). Do not re-read the whole page in the conversation. If the page blocks automated access, attribute the fact and say so; never work around a block.
6. **Send one `news-writer` per story, in the background, with the full fact sheet pasted in.** Include the slug, target query, category, byline, a model story to copy, internal links, related slugs, and the abbreviations to expand. A complete brief means one writer run; a vague brief means two or three.
7. **Tell writers not to choose the hero photo.** The main session does it once per story: run `pnpm fc news-photo search "a|b|c" --source commons`, read the one contact-sheet image, then run `pnpm fc news-photo use <slug> <n>` (see `news-visuals`). Use the index from that same search only.
8. **Run the checks once for the whole batch**, after every story is in: `pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test`.
9. **One commit and one pull request per batch, not per story.** Each CI run takes 5 to 15 minutes of runner time and one round of waiting.

## 3. Habits that cost the most (avoid them)

- **Parallel builds.** Two writers running `pnpm news:build` at the same time break each other's `dist` folder, and both rerun. Tell writers: "Other writers may build at the same time; on a lock or missing-dist error, wait a minute and rerun." Better still, run the final build yourself once.
- **Reading big files or outputs into the conversation.** Use `grep -n`, `head`, `sed -n 'a,bp'`. Never read an agent's full transcript file; its final message is the result.
- **Loops on blocked sources.** If a page returns 403, 503 or a Cloudflare challenge, record it as blocked and move on.
- **Rewriting a story to pass the audit by trial and error.** Read the audit line: it names the failing check and the exact word. The usual fixes are:
  - `08-ABBREV`: write "Full Name (ABBR)" before the first use.
  - `02-BANNED-WORDS`: change the one word.
- **Polling.** Do not loop on `sleep` while waiting for CI or agents; background agents and CI events wake the session.
- **Lighthouse.** Never run `news:lighthouse` or `smoke:lighthouse` (see `CLAUDE.md`).
- **Re-checking stories that did not change.** An update pass touches only stories with a pending fact or an update note.

## 4. Writing briefs that work the first time

A good `news-writer` brief has:

- **The basics:** the file path, the target query plus 2 or 3 variants, the category, the byline and the type.
- **`publishedAt`:** "5 minutes before you finish, America/New_York, in the past". A future time hides the story.
- **A model story to copy:** the same kind of page, for example the Mexico City Grand Prix story for any schedule with time zones.
- **The fact sheet:**
  - every fact with its quote, URL, title and date;
  - what is reported (from news, not an official source), labeled as such;
  - what is not announced;
  - what must not be stated.
- **The "information gain":** the table or printable that other sites lack.
- **Abbreviations to expand on first use**, especially in the `description`.
- **Links:** `internalLinks` (at least two calendar pages) and `related` (up to three /news/ slugs).
- **Closing instructions:** "Leave the hero to me." "Run the four checks." "Do not commit."

## 5. Where the money goes, roughly

| Step | Share of a batch's tokens |
|---|---|
| Main session reading and deciding | Largest; it grows with session length (step 1) |
| Research agents (Haiku) | Large in volume, low in price |
| Writer agents (Sonnet) | Medium; each rerun after a failed check adds a full pass |
| Photo search and CI | Small |

The two biggest savings are short sessions and complete briefs.

## 6. Scheduled rounds: a fresh session every time

If you publish on a schedule (for example, a round every two hours overnight), the session setup decides most of the cost.

- **Never run a schedule inside one long session.** A routine that wakes the same session keeps adding to its history, and every round and every CI notice re-reads all of it. One such session ran for five days, and its context grew to about 485,000 tokens. That re-reading, not the writing, was the largest cost.
- **Make the routine start a fresh session on every run.** In the claude.ai Routines screen, choose to start a new session each time. From a session, call `create_trigger` with `create_new_session_on_fire: true`. Each round then starts from an empty history, does its 3 to 5 stories, ships one pull request, and ends.
- **Write the routine prompt so it stands alone.** A fresh session knows nothing else, so the prompt must say:
  1. Usage gate: check the usage limit first (step 0 below).
  2. Setup: clone the repo if it is missing, read `CLAUDE.md`, this guide and the `news-article` skill, start from `origin/main`, and list open pull requests.
  3. Topics: pick 3 to 5, research them with Haiku agents, and hold any topic whose official source is blocked.
  4. Writing: Sonnet agents, with complete briefs (section 4).
  5. Heroes, checks and shipping: one pull request per round, merged on green CI.
  6. Updates: which pending stories to refresh.
  7. Report: a short summary for the editor.
- **Usage gate (step 0 of the prompt).** First, the session calls `get_session` (claude-code-remote tools) and reads `external_metadata.rate_limit_info`.
  - If `status` is not `allowed`, or `isUsingOverage` is true, it writes one line with the reset time and stops.
  - It checks again before writing. If the limit was reached, it finishes only the stories already written.
  - Writing then never stops for long: the next scheduled round starts by itself once the limit resets, and a full limit costs nothing.
- **Keep the strongest model as the round's main session.** Only the main session, the one that decides, uses it; research stays on Haiku and writing on Sonnet (section 1).
- **One routine for news and a separate one for puzzles.** Two sessions writing the same day's puzzle pages caused duplicate work and a merge conflict. The news routine's prompt says: "Do not write or edit daily puzzle pages."
- **One news routine for the whole team.** If two editors each run a routine, they pick the same topics. Agree on one routine, and run anything extra by hand in a fresh session.
- **Do not chat in the routine's sessions.** Read each round's report in its own session in the Claude app. Open a new session for questions instead of asking in an old one.
