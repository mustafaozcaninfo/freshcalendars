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
```

## Models (`.env` overrides)

| Variable | Default | Used for |
|---|---|---|
| `NEWS_GEN_MODEL` | `claude-opus-5-5` | default model, writer and chief editor |
| `NEWS_GEN_WRITER_MODEL` | `NEWS_GEN_MODEL` | stage 1 |
| `NEWS_GEN_EDITOR_MODEL` | `claude-sonnet-5-5` | stage 2 |
| `NEWS_GEN_CHIEF_MODEL` | `NEWS_GEN_MODEL` | stage 3 |
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

Not built yet: the stage-to-stage pipeline, writing the story file with
frontmatter, and running `pnpm news:abbrev` / the audit on the output.
