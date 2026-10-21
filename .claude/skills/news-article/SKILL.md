---
name: news-article
description: Write, update or publish-prepare a Fresh Calendars /news/ story (Astro, apps/news) from research to pull request. Use whenever someone asks for a news article, story, explainer, puzzle hints page, store hours list, holiday or date story, or an update to an existing /news/ story.
---

# Writing a /news/ story

Read `CLAUDE.md` first; its content rules apply to every step. The finished work is a branch with a pull request, not a deploy.

## 1. Decide: new story or update

Search existing stories before writing:

```bash
grep -ril "<main keyword>" apps/news/src/content/articles | head
```

- Same search intent already covered → update that file: edit the facts, set `updatedAt` to now (ET), add a `<p class="callout"><b>Last updated Mon. D, YYYY, H:MM a.m. ET.</b> …</p>` line at the top of the body if the change matters to readers, and add a `corrections` entry if a fact was wrong.
- A question that `/when-is/<holiday>/` already answers ("when is X") → write a different angle (what is open, why this date, deals) and link to the when-is page instead of competing with it.
- Otherwise → new story.

## 2. Research

- Collect facts only from primary or authoritative sources: agencies (.gov), the company's newsroom or press release, official game or puzzle publisher, NASA/USNO, state election offices. Good secondary sources (AP, Reuters, major local news) only when the primary is unavailable, and attribute them in the text.
- Write down every number, date and time with its URL. Anything you cannot confirm stays out or is labeled ("2025 hours; 2026 not announced").
- Respect bot protection: if a site answers with a challenge or 403, use another source and tell the user.
- Dates and weekdays: compute them, don't recall them (`node -e 'console.log(new Date("2026-11-26T12:00:00").toDateString())'`).

## 3. Write the file

Path: `apps/news/src/content/articles/YYYY/MM/<slug>.md`. The slug is lowercase kebab-case and matches the main query ("black-friday-2026-store-hours-walmart-target-best-buy").

```markdown
---
title: "<20-110 chars; the H1; main keyword first>"
seoTitle: "<20-60 chars>"
description: "<120-160 chars; renders as the lede; expand abbreviations: Eastern Time (ET)>"
type: news            # news | explainer | analysis | update
publishedAt: "2026-10-21T09:30:00-04:00"   # now or earlier, America/New_York
authors: [news-desk]
category: holidays    # holidays | planning | puzzles | retail-dates | school-calendars | sky-events | time-change | uk-canada
keywords: ["<main query>", "<variant>", "<variant>"]   # 1-5
dateline: "New York"
hero:
  src: ../../../../assets/news/<slug>/<slug>.jpg
  alt: "<describes the image and contains the main keyword>"
  title: "<short title>"
  caption: "<20-220 chars, a fact, not 'Illustration: Fresh Calendars'>"
summary:              # 2-4 bullets, each a complete fact
  - "..."
faq:                  # optional; visible only, never schema
  - q: "..."
    a: "..."
sources:
  - title: "<page title>"
    url: "https://..."
    publisher: "<organization>"
    date: "YYYY-MM-DD"   # optional
internalLinks:        # at least 2 calendar-site pages, never /news/
  - href: "/november-calendars.html"
    label: "November 2026 printable calendar"
  - href: "/when-is/thanksgiving/"
    label: "When is Thanksgiving?"
related: [<slug>, <slug>, <slug>]   # existing /news/ slugs on the same topic
draft: false
---

**First sentence answers the query with the date, time or number.** Then context and attribution.

## Short, descriptive H2s

Tables for anything structured (dates by state, store hours). Lists for steps.
```

Writing rules the audit enforces: no banned words (list in `scripts/news-seo-audit.mjs`), at most two em dashes, no "not X but Y", no closing summaries ("in conclusion", "overall,"), mixed sentence lengths, abbreviations expanded on first use. Link related /news/ stories and calendar pages inside the body text where they help the reader, not in a link dump.

Valid calendar-site links: check that the page answers on freshcalendars.com before using it. The ones stories use most: `/<month>-calendars.html`, `/printable-weekly-calendar.html`, `/printable-yearly-calendar.html`, `/printable-school-calendar.html`, `/when-is/<holiday>/`. To see what others link: `grep -rhoE 'href: "/[^"]+"' apps/news/src/content/articles | sort | uniq -c | sort -rn | head -20`.

## 4. Hero image and printables

- Hero: 2400×1350 JPEG in `apps/news/src/assets/news/<slug>/`. Draw it with code, like the existing generators (`packages/generator/src/heroes5.ts`): HTML/SVG rendered by Playwright, saved with sharp. Add your script as `packages/generator/src/<topic>.ts` and register a `news-<topic>` command in `cli.ts`, then run `pnpm fc news-<topic>`. No stock photos or images you don't have rights to; no answers in puzzle heroes.
- Printables (when they help the reader: checklists, trackers, calendars): PDF + PNG in `apps/news/public/downloads/<group>/`, preview PNG in `apps/news/src/assets/news/<group>/`, listed under `downloads:` in frontmatter. See `packages/generator/src/november2026.ts` or `shopping2026.ts` for the pattern. Offer 2-3 styles when it is cheap (classic, color, ink saver).

## 5. Check

```bash
pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test
```

All must pass. Then read the page: `pnpm news:serve` and open `http://localhost:4324/news/<slug>/`. Check the hero, tables on a narrow window, and that every link opens.

Fix failures at the source (shorten the title, expand the abbreviation, correct the link); never weaken a check to make it pass.

## 6. Pull request

```bash
git switch -c news/<slug>
git add apps/news/src/content/articles/YYYY/MM/<slug>.md apps/news/src/assets/news/<slug>/ <generator and download files you added>
git commit -m "feat(news): <what the story covers>"
git push -u origin news/<slug>
gh pr create --fill
```

In the PR description list: the query you target, the main sources, and anything not yet confirmed that should be updated later (with the date to recheck). Do not deploy; the editor merges and publishes.
