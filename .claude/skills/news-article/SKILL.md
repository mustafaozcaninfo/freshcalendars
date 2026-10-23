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
category: holidays    # holidays | elections | calendar-guides | planning | puzzles | retail-dates | school-calendars | sky-events | time-change | uk-canada
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
related: [<slug>, <slug>, <slug>]   # existing /news/ slugs on the same topic  (optional; similar stories fill the rest automatically)
draft: false
---

**First sentence answers the query with the date, time or number.** Then context and attribution.

## Short, descriptive H2s

Tables for anything structured (dates by state, store hours). Lists for steps.
```

### Google Discover (most /news/ traffic can come from here)

Discover picks stories for people's feeds without a search. The technical part is already done by the templates (`max-image-preview:large`, 16:9 `og:image` at 1344 px, schema images in 16:9, 4:3 and 1:1, RSS feed). What you control:

- **Headline says what the story says.** "Halloween 2026 Is on a Saturday: Trick-or-Treat Hours by City" is good; "You Won't Believe When Trick-or-Treating Starts" is clickbait. No hype, no outrage, no withholding the answer, no exclamation marks (the audit's `11-DISCOVER-HEADLINE` blocks the usual phrases).
- **Timely and original.** Write before the date people care about, add something others don't have (a printable, a full date table from the official source, a computed countdown), and update the same story instead of writing a near-copy.
- **Stay in our topics.** Since the February 2026 Discover core update Google judges expertise topic by topic. Ours: calendars and dates, holidays, school calendars, election dates and deadlines, sky events, time changes, retail dates, daily puzzles. A one-off story far from these is unlikely to show.
- **US readers first.** The update favors sites from the reader's country; use US dates, times (ET with other zones) and sources.
- **Hero image: a picture, not a poster.** Google advises against text-heavy images, and Discover shows the real headline beside the image. With `news-assets`, leave `assets.title` out (or keep it under 40 characters) and let the kicker, calendar card and one short white card carry the image.

Writing rules the audit enforces: no banned words (list in `scripts/news-seo-audit.mjs`), at most two em dashes, no "not X but Y", no closing summaries ("in conclusion", "overall,"), mixed sentence lengths, abbreviations expanded on first use. Link related /news/ stories and calendar pages inside the body text where they help the reader, not in a link dump.

Valid calendar-site links: check that the page answers on freshcalendars.com before using it. The ones stories use most: `/<month>-calendars.html`, `/printable-weekly-calendar.html`, `/printable-yearly-calendar.html`, `/printable-school-calendar.html`, `/when-is/<holiday>/`. To see what others link: `grep -rhoE 'href: "/[^"]+"' apps/news/src/content/articles | sort | uniq -c | sort -rn | head -20`.

## 4. Hero image and printables

Every story gets one of two heroes. Both come from commands; never hand-place an image.

### A. Illustrated hero (default): `pnpm fc news-assets <slug>`

Add an `assets:` block to the frontmatter (Astro ignores it) and run the command. It draws a 2400×1350 hero: a 3D scene on the right (three.js in headless Chromium, `packages/generator/render3d/`, with studio light, soft shadows and a photographic finish from `fx.ts`), the kicker, an optional date tile and a white card on the left. Every model is built in code from primitives, so the image is ours and unique to the story (the slug seeds the details). The calendar scene shows the story's real month with `assets.date` circled. A render takes about 5 seconds.

- `scene:` picks the picture. Run `pnpm fc news-scenes` (or `--only gaming,sports`) to see them on one sheet (`.cache/news-scenes.png`). In 3D: calendar, election, halloween, halloween-party, thanksgiving, winter-holidays, night-sky, time-change, shopping, school, money, puzzle, gaming (a generic game pad), sports (an American football), phone (a generic foldable). Flat SVG only: fireworks, spring, autumn. `render: 2d` forces the older flat SVG scene; `scene: none` gives the flat poster. Without `scene:` the category's default is used.
- Match the scene to the subject, not the category: a turkey story is `thanksgiving` even in `holidays`; a meteor story is `night-sky`.
- `title:` is optional and short (under 40 characters); Discover shows the real headline beside the image.

### B. Licensed photo: `pnpm fc news-photo`

Use a real photo when it helps the reader more than an illustration (a NASA image of the event, a landmark, a real place). Only sources with a machine-readable license, checked again at download:

```bash
pnpm fc news-photo search "Leonid meteor" --source nasa      # or commons, openverse, pexels, all
pnpm fc news-photo use <slug> 3                              # number from the search list
```

`use` crops to 16:9 (never upscales, needs 1600 px), writes `<slug>.webp` with the author and license embedded, the untouched crop as `<slug>.source.webp`, a `<slug>.photo.json` record, and prints the `hero:` block with `credit` and `license`. Paste it and write the `alt` and `caption` yourself. The page then shows the credit with links to the source and the license, and the schema names the photographer and license instead of us. `news-assets` keeps a licensed photo and only draws the printable.

To put our layer on the photo (kicker, date tile, card, brand line, a scrim and the same finish as the 3D heroes), add `overlay: true` to `assets:` and run `pnpm fc news-assets <slug>`. It always redraws from `<slug>.source.webp`, keeps the source width, and changes the credit to end in ", edited", which CC BY and CC BY-SA require when an image is changed. Copy that new credit into `hero.credit`. Overlays are for photos we are licensed to adapt; the allowlist below already excludes ND (no derivatives).

Sources: Wikimedia Commons and NASA (no key), Openverse (no key; museums such as the Smithsonian, Wikimedia and Flickr), Pexels (`PEXELS_API_KEY` in the environment). Openverse Flickr results are refused unless you pass `--allow-flickr` to `use`, and only after you open the page and confirm the uploader took the photo; re-uploads of other people's work under a CC label are common there.

Photo rules (the schema and the tool enforce most of them):
- Allowed: public domain (U.S. federal works such as NASA), CC0, CC BY, CC BY-SA, the Pexels License. Refused: NC, ND, GFDL-only, "fair use", no license, NASA items credited to someone else.
- **Never** take an image from a search engine, a news site, a stock agency (Getty, AP, Reuters, Shutterstock) or social media. Being a news site does not license a photo, and a credit line is attribution, not permission.
- Look at the Commons page before using a candidate: no recognizable private people as the subject, no logos as the subject, nothing misleading for the story (a 2019 crowd is not "this year's" crowd; say "file photo" in the caption when it is not from this event).
- Press-kit images: `pnpm fc news-photo press <slug> --url <image> --terms <terms page> --author "<company>"`, only when the company's terms page allows editorial use by the press. The main session reads that page before committing.

### Printables (`assets.printable`, drawn by `news-assets`)

A printable is the product readers keep, so plan it with the story, not after it. Every story whose content can be acted on gets one: dates to mark, steps to follow, things to bring or check. Pick the rows that someone would stick on a fridge; the story carries the explanation.

```yaml
assets:
  scene: thanksgiving
  kicker: "Thanksgiving 2026 · Thu., Nov. 26"
  date: "2026-11-26"
  card: { top: "Thaw a 20 lb turkey from", big: "Sat., Nov. 21", bottom: "In a fridge at 40°F or below" }
  printable:
    slug: thanksgiving-turkey-thaw-dates-2026
    group: thanksgiving-2026
    title: "Thanksgiving Turkey Thaw Dates, Nov. 26, 2026"
    subtitle: "When to move a frozen turkey to the refrigerator"
    rows:
      - ["Fri., Nov. 20 to Sat., Nov. 21", "20 to 24 lb turkey, refrigerator (5 to 6 days)"]
      - ["Thu., Nov. 26", "Cook to 165°F (74°C)"]
    note: "Source: USDA Food Safety and Inspection Service, Turkey Basics: Safe Thawing."
    inkSaver: true            # also writes <slug>-ink for home printers
    description: "..."
    alt: "..."
```

The layout is chosen from the rows (`layout: auto`); set `layout:` only to override it:

| Content | Layout | How to write the rows |
|---|---|---|
| Dated days or short ranges inside one or two months, at most three on any day | `month`: calendar grid with numbered markers and a legend | `["Sat., Nov. 21", "..."]` or ranges `"Fri., Nov. 20 to Sat., Nov. 21"`, `"Oct. 22-24"` |
| Up to 12 ordered steps that do not overlap | `timeline` | one step per row, earliest first |
| Things to bring, check or do, in groups | `checklist`: two columns of tick boxes | `{ when: "Sat., Oct. 31", what: "Flashlight", section: "Bring" }` |
| Many overlapping ranges (by state, by store) or anything else | `list`: date, what, Done | keep `what` under 140 characters |

Rules the generator enforces:
- **Weekdays are checked.** "Fri., Nov. 21" in a 2026 sheet fails, because Nov. 21, 2026 is a Saturday. The year comes from the printable title (put it there), `year:`, or `assets.date`.
- **One page, always full.** The sheet is measured in the browser: long content scales down to 80%, short content scales up to 130%, and a lined notes area takes the rest. If it still does not fit, the build fails: cut rows or split into two printables (max 40 rows).
- **The note starts with "Source:"** and names the same sources as the story. A header icon matching the scene and the footer link are added for you.

Then paste the `downloads:` entry the command prints (two entries with `inkSaver`).

- **Custom visuals only when needed:** a story-specific generator in `packages/generator/src/<topic>.ts` with a `news-<topic>` command in `cli.ts` (patterns: `oct24.ts`, `november2026.ts`, `renderPrintables()` in `printables.ts`). No answers in puzzle heroes.

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
