---
name: news-article
description: Write, update or publish-prepare a Fresh Calendars /news/ story (Astro, apps/news) from research to a pushed commit on main. Use whenever someone asks for a news article, story, explainer, puzzle hints page, store hours list, holiday or date story, or an update to an existing /news/ story.
---

# Writing a /news/ story

Read `CLAUDE.md` first; its content rules apply to every step. The finished work is a commit pushed to `main`, not a deploy; the owner publishes it.

## Who does what (keeps token use low)

Run this skill in a fresh session for each story or small batch of related stories; long sessions re-read their whole history on every turn.

- **Research → `news-researcher` agent (Haiku).** Send it the topic and the exact questions (dates, times, names, numbers, URLs to check). It returns a fact sheet with sources and an UNCONFIRMED/BLOCKED list. If it reports a BLOCKED official page that matters, open it yourself in the browser; never get around a bot challenge.
- **Writing and checks → `news-writer` agent (Sonnet).** Send it the slug, target query, category, related slugs and the fact sheet. It writes the file with an `assets:` block, runs `pnpm fc news-assets <slug>`, and runs the checks until they pass.
- **The main session** decides new-vs-update, resolves conflicting sources, does one quick look at the hero and printable images, reads the finished story once, commits and pushes. Use the strongest model only for this part.

Write a one-off generator (step 4) only when a story truly needs a custom visual that `news-assets` cannot draw.

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

- **Default: `pnpm fc news-assets <slug>`.** Add an `assets:` block to the frontmatter (Astro ignores it) and run the command. It draws the hero (2400×1350 JPEG with kicker, title, an optional calendar card for `date`, and an optional white card) and, if you give `printable:`, a one-page date-list printable with a Done column and notes, then prints the `downloads:` entry to paste. The full field list is at the top of `packages/generator/src/newsAssets.ts`. Example:

```yaml
assets:
  kicker: "Texas · Nov. 3, 2026"
  title: "Every Texas voting deadline left"
  date: "2026-11-03"
  card: { top: "Early voting runs through", big: "Fri., Oct. 30", bottom: "Polls 7 a.m.-7 p.m." }
  printable:
    slug: texas-key-dates-2026
    group: election-2026
    title: "Texas Key Dates, Nov. 3, 2026"
    subtitle: "Every remaining deadline from the Texas Secretary of State"
    rows:
      - ["Fri., Oct. 23", "Mail ballot applications must be received"]
      - ["Tue., Nov. 3, 7 a.m.-7 p.m.", "Election Day"]
    note: "Source: Texas Secretary of State, Election Advisory No. 2026-21."
    description: "Every remaining Texas voting deadline for Nov. 3, 2026, with boxes to tick off."
    alt: "Texas key dates 2026 printable with early voting, mail ballot and Election Day deadlines"
```

- **Custom visuals only when needed:** a story-specific generator in `packages/generator/src/<topic>.ts` with a `news-<topic>` command in `cli.ts` (patterns: `oct24.ts`, `november2026.ts`, `renderPrintables()` in `printables.ts`). No stock photos or images you don't have rights to; no answers in puzzle heroes.

### Printable PDF rules (Google's guidance on PDFs; checked by `10-PDF-*` in the audit)

Write the template so the PDF is good on its own, because Google indexes PDFs like pages:

- **Real text, never page images.** Build the sheet in HTML/SVG and let `renderPrintables()` print it with Chromium; do not screenshot a page into the PDF or embed the whole sheet as one image. Test: select all text in the PDF and paste it; it must come out readable.
- **US Letter, usually one page** (`LETTER` from `julian.ts`; two pages only when the content needs it), under 5 MB, fonts from `fontFaces()`. Keep at least 18 pt clear at the top right: the build puts a small "freshcalendars.com" link there.
- **A clear `<h1>` title on the sheet** that matches the `downloads[].title` in frontmatter, and a footer with `Free printable from Fresh Calendars · freshcalendars.com/news/<slug>/` (the `.foot` class).
- **Sources and dates on the sheet** in a short note line, the same facts as the story. Nothing on a printable that the story does not support.
- **No third-party art, logos or brand marks.** Draw everything; name brands in text only.
- **File names:** lowercase kebab-case with the year (`black-friday-planner-2026-bold.pdf`). If the content changes in a big way after publishing, give the file a new name so search engines refetch it, and update the frontmatter.
- **`downloads[].title` (5-80 characters) and `description` (20-200)** become the PDF's title and subject, so write them as you would a page title and meta description.

You do not add metadata by hand. On every build `apps/news/src/lib/pdf-meta.mjs` stamps each PDF that a story lists: title, author (Fresh Calendars), subject, keywords (the story's keywords plus "free printable"), language en-US, the story's dates, copyright and the terms-of-use license, "show title" for viewers, the top link to the story, and an entry in the nginx map that sends `Link: <story>; rel="canonical"` with the file. A PDF that no story lists gets none of this, so always list it under `downloads:`.

## 5. Check

```bash
pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test
```

All must pass, including `10-PDF-FILES`, `10-PDF-PROPERTIES` and `10-PDF-LINK-CANONICAL` for any printable. Open one PDF from `dist/news/downloads/<group>/` and check the title in the viewer's title bar, the top-right link and that the text can be selected. Then read the page: `pnpm news:serve` and open `http://localhost:4324/news/<slug>/`. Check the hero, tables on a narrow window, and that every link opens.

Fix failures at the source (shorten the title, expand the abbreviation, correct the link); never weaken a check to make it pass.

## 6. Commit and push

```bash
git pull origin main
git add apps/news/src/content/articles/YYYY/MM/<slug>.md apps/news/src/assets/news/<slug>/ <generator and download files you added>
git commit -m "feat(news): <what the story covers>"
git push origin main
```

Writers push stories straight to `main` once every check passes. In the commit message list the main sources and anything not yet confirmed that should be rechecked (with the date). Then tell the owner the story is pushed; the owner deploys it. Never deploy, never force-push.
