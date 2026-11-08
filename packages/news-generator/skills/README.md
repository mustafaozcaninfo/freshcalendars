# news-generator skills

The generator's system prompt is built from layers, in this order
(`src/prompts.ts`):

| Layer | File | What it is |
|---|---|---|
| 1. Core | `elite-english-content-engine/SKILL.md` | The editorial method: three stages, scoring rubric, source integrity. Kept as written; edit it to change how the model works. |
| 2. House rules | `house-rules/*.md` (alphabetical) | Fresh Calendars rules the build and SEO audit enforce. **They override the core where the two disagree.** `{{BANNED_EN}}`, `{{BANNED_NEW}}` and `{{MAX_EM_DASHES}}` are filled from `scripts/lib/writing-rules.mjs`, so the prompt and the audit use one list. |
| 3. Stage | `stages/<n>-<name>.md` | The role and the output sections for one stage (writer, SEO editor, chief editor). |
| 4. Brief | passed per call (user message) | Topic, query, facts and sources, allowed internal links. |

Layers 1 to 3 are the cached system prompt; keep anything that changes per
story out of them, or every call pays for the full prompt again.

## Extending

- A new site rule: add it to `house-rules/10-fresh-calendars.md`, or add a new
  file in `house-rules/` (every `.md` there is loaded, sorted by name: a
  category's rules can go in `20-sports.md`, `20-puzzles.md` and so on).
- A new stage (fact checker, headline tester): add `stages/<n>-<name>.md` and a
  row in `STAGES` in `src/prompts.ts` with its model.
- A rule the audit already checks: change it in `scripts/lib/writing-rules.mjs`;
  the prompt picks it up.

See the composed prompt with `pnpm news-gen prompt writer` (no API call).
