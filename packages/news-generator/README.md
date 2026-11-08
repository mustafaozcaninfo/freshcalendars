# @freshcalendars/news-generator

Writes /news/ stories through the Claude API. Separate from
`packages/generator` (which draws pages, heroes and PDFs offline): this package
is the only one that calls a paid API.

## Setup

1. Put a key from console.anthropic.com in the repo's `.env` (git-ignored):
   `ANTHROPIC_API_KEY=sk-ant-...`
2. `pnpm install`
3. `pnpm news-gen ping` should print `pong` and a usage/cost line.

## Commands

```bash
pnpm news-gen config                 # resolved settings, key masked (no API call)
pnpm news-gen ping                   # cheapest possible test call
pnpm news-gen prompt writer          # composed skill prompt for a stage (no API call)
pnpm news-gen ask "question"         # free-form call
pnpm news-gen ask --stage writer --file brief.md   # one stage of the skill on a brief
pnpm news-gen run briefs/<brief>.md  # full pipeline: writer -> SEO editor -> chief editor
```

## Pipeline (`run`)

1. **Writer** (Opus, effort medium) drafts from the brief only.
2. **SEO editor** (Sonnet 5.5, effort medium) gets the brief and the full draft.
3. **Chief editor** (Sonnet 5.5, effort medium) gets the brief, the writer's
   sources and open facts, and the edited version; returns `APPROVED`/`REVISE`,
   a score and find-and-replace fixes (not a rewrite). The code applies a fix
   only when its text occurs exactly once; others are reported.
   Below 90 or `REVISE`: one more editor pass with the chief's report, then the
   chief judges again (`--revisions n` to change).
4. The final headline, description and body go through the same checks as
   `pnpm news:abbrev` plus the length rules (headline 40-70, description
   120-155, body 300+ words).

Every reply, `final.md` and `run.json` (verdict, checks, usage, cost per call,
chief's report) land in `out/<brief>-<time>/` (git-ignored). Nothing is written
into `apps/news`; a human editor reads the report before anything is published.
Exit code 2 means not approved or a check failed.

A brief holds the target query, category, verified facts with their sources,
the only internal links the model may use, and what the page adds. Example:
`briefs/test-charlie-brown-christmas-2026.md`.

Cost per story on that brief (Nov. 8, 2026, one run each, list prices):

| Setup | Cost | Time | Result |
|---|---|---|---|
| Opus high / Sonnet medium / Opus high, chief rewrites | $0.52 | 3m 10s | 91/100 (Opus judged), 851 words |
| Opus medium / Sonnet medium / Sonnet medium, chief fixes (default) | $0.28 | 1m 36s | 91/100 (Sonnet judged), 679 words |

The Opus chief caught a sourcing gap the Sonnet chief did not (a newsroom
report that covered only the Thanksgiving weekend). For stories that rest on
newsroom reports, run with `NEWS_GEN_CHIEF_MODEL=claude-opus-5-5`.

## Models (`.env` overrides)

| Variable | Default | Used for |
|---|---|---|
| `NEWS_GEN_MODEL` | `claude-opus-5-5` | default model, writer and chief editor |
| `NEWS_GEN_WRITER_MODEL` | `NEWS_GEN_MODEL` | stage 1 |
| `NEWS_GEN_EDITOR_MODEL` | `claude-sonnet-5-5` | stage 2 |
| `NEWS_GEN_CHIEF_MODEL` | `claude-sonnet-5-5` | stage 3 |
| `NEWS_GEN_WRITER_EFFORT`, `_EDITOR_EFFORT`, `_CHIEF_EFFORT` | `medium` | effort per stage |
| `NEWS_GEN_FAST_MODEL` | `claude-haiku-5-5` | cheap research/extraction steps |
| `NEWS_GEN_EFFORT` | `medium` | effort when a call sets none |

The client always calls `https://api.anthropic.com` (or `NEWS_GEN_BASE_URL`),
never `ANTHROPIC_BASE_URL`, which Claude Code sessions point at their own proxy.
A policy decline is retried server-side on a fallback model (`fallbacks: "default"`).

## Skills

The editorial method and the site rules are in `skills/` (see
`skills/README.md`): the Elite English Content Engine as the core, Fresh
Calendars house rules on top (they win on conflict, banned words come from
`scripts/lib/writing-rules.mjs`), and one role file per stage.

Not built yet: research (briefs are written by hand), writing the story file
with frontmatter into `apps/news`, hero and printable, and the full build audit.
