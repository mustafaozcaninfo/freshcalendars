---
name: news-article
description: Write, update or publish-prepare a Fresh Calendars /news/ story (Astro, apps/news) from research to a pushed commit on main. Use whenever someone asks for a news article, story, explainer, puzzle hints page, store hours list, holiday or date story, or an update to an existing /news/ story.
---

# Writing a /news/ story

Read `CLAUDE.md` first; its content rules apply to every step. The finished work is a commit pushed to `main`, not a deploy; the owner publishes it.

**Daily puzzle pages** (Wordle, Connections, Strands, Pips, Spelling Bee and the other games) follow the `news-puzzles` skill: official data saved first, answers checked with `pnpm news:puzzle-check`, boards and tap-to-reveal hints drawn by the build.

Two companion skills hold the detail: **`news-seo`** (choosing the query, the angle and the page structure that ranks) and **`news-visuals`** (a unique hero and the printable). Read both before step 1 of a new story.

## Who does what (keeps token use low)

Run this skill in a fresh session for each story or small batch of related stories; long sessions re-read their whole history on every turn.

- **Research → `news-researcher` agent (Haiku).** Send it the topic and the exact questions (dates, times, names, numbers, URLs to check). It returns a fact sheet with sources and an UNCONFIRMED/BLOCKED list. If it reports BLOCKED official pages that matter, open them yourself in the built-in browser in one pass (`get_page_text`; collapsed sections open with a click or `javascript_tool` on their `<summary>`/accordion headers). A waiting room or queue page usually lets a real browser through; a bot challenge never gets worked around.
- **Writing and checks → `news-writer` agent (Sonnet).** Send it the slug, target query, category, related slugs and the fact sheet. It writes the file with an `assets:` block, runs `pnpm fc news-assets <slug>`, and runs the checks until they pass.
- **The main session** decides new-vs-update and the angle (`news-seo`), picks the hero photo or scene (`news-visuals`), resolves conflicting sources, looks at the hero and printable images, reads the finished story once, commits and pushes. Use the strongest model only for this part.

Write a one-off generator (step 4) only when a story truly needs a custom visual that `news-assets` cannot draw.

## 1. Decide: new story or update

Run the page / section / link decision tree in `news-seo` (section 1), then search existing stories:

```bash
grep -ril "<main keyword>" apps/news/src/content/articles | head
```

- Same search intent already covered → update that file: edit the facts, set `updatedAt` to now (ET), add a `<p class="callout"><b>Last updated Mon. D, YYYY, H:MM a.m. ET.</b> …</p>` line at the top of the body if the change matters to readers, and add a `corrections` entry if a fact was wrong.
- A question that `/when-is/<holiday>/` already answers ("when is X") → write a different angle (what is open, why this date, deals) and link to the when-is page instead of competing with it.
- Otherwise → new story. Write down the one thing it adds that the top results lack (a computed table, a printable, a fact others missed); if there is nothing, do not write it.

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
authors: [alex-morgan]  # the beat editor who reviews the story (see "Bylines" below); puzzles: [news-desk]
category: holidays    # holidays | elections | calendar-guides | planning | puzzles | retail-dates | school-calendars | sky-events | time-change | uk-canada
keywords: ["<main query>", "<variant>", "<variant>"]   # 1-5
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

## Bylines

`authors` is the editor responsible for the story's beat; that editor reviews the story before it is published. Daily puzzle pages (Wordle, Connections, Strands and similar) use `[news-desk]`. When a story spans two beats, ask the person you are working with which editor reviews it.

| Author id | Editor | Beat |
|---|---|---|
| `alex-morgan` | Alex Morgan, Senior Editor | holidays (`holidays`), elections (`elections`), UK and Canada (`uk-canada`), government and tax deadlines: Social Security, Medicare, IRS, open enrollment, market closures |
| `emily-carter` | Emily Carter, Managing Editor | school calendars (`school-calendars`), school breaks, SAT, ACT, LSAT and MCAT dates, family printables |
| `jordan-bennett` | Jordan Bennett, News Editor | clock changes (`time-change`), sky events (`sky-events`), calendar guides (`calendar-guides`), retail dates (`retail-dates`), sports, festival and event schedules, travel, movable dates such as Ramadan and Lunar New Year |

A new Person author needs a real, confirmed person and `confirmedAt` in `apps/news/src/content/authors/<id>.json`; `news:seo-audit` (07-NO-FAKE-EXPERTS) rejects any other Person.

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

Every story gets **its own** hero, made by a command; never hand-place an image. `news-assets` refuses a hero that repeats another story's scene or picture, and the audit check `12-HERO-UNIQUE` fails the build. The full method is in the `news-visuals` skill; the order is:

1. A real subject a photo can show → licensed photo with `assets.overlay: true` (B below). This is the default.
2. An abstract date topic → an illustrated scene no story has used yet (`pnpm fc news-heroes` lists free scenes) (A below).
3. Neither → add a scene (`news-visuals`, section 4).

### A. Illustrated hero: `pnpm fc news-assets <slug>`

Add an `assets:` block to the frontmatter (Astro ignores it) and run the command. It draws a 2400×1350 hero: a 3D scene on the right (three.js in headless Chromium, `packages/generator/render3d/`, with studio light, soft shadows and a photographic finish from `fx.ts`), the kicker, an optional date tile and a white card on the left. Every model is built in code from primitives, so the image is ours. The slug only seeds small details, so two stories with the same scene show the same picture: each scene is used once. The calendar scene shows the story's real month with `assets.date` circled. A render takes about 5 seconds.

- `scene:` picks the picture. Run `pnpm fc news-scenes` (or `--only gaming,sports`) to see them on one sheet (`.cache/news-scenes.png`). In 3D: calendar, election, halloween, halloween-party, thanksgiving, winter-holidays, night-sky, time-change, shopping, school, money, puzzle, gaming (a generic game pad), sports (an American football), phone (a generic foldable). Flat SVG only: fireworks, spring, autumn. `render: 2d` forces the older flat SVG scene; `scene: none` gives the flat poster. Without `scene:` the category's default is used.
- Match the scene to the subject, not the category: a turkey story is `thanksgiving` even in `holidays`; a meteor story is `night-sky`.
- `title:` is optional and short (under 40 characters); Discover shows the real headline beside the image.

### B. Licensed photo: `pnpm fc news-photo` (default)

Use a real photo whenever the story has a real subject (a NASA image of the event, a landmark, a real place, the vehicle or venue), with our overlay on top. Only sources with a machine-readable license, checked again at download:

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
- **Print checks.** Every sheet then passes the "Printable PDF rules" below (safe area, no overlap, fonts, type size, contrast) before it is written.
- **The note starts with "Source:"** and names the same sources as the story. A header icon matching the scene and the footer link are added for you.

Then paste the `downloads:` entry the command prints (two entries with `inkSaver`).

- **Custom visuals only when needed:** a story-specific generator in `packages/generator/src/<topic>.ts` with a `news-<topic>` command in `cli.ts` (patterns: `oct24.ts`, `november2026.ts`, `renderPrintables()` in `printables.ts`). No answers in puzzle heroes.

### Printable PDF rules (checked when the sheet is drawn and again by `10-PDF-*` in the audit)

Every printable goes through two gates. `renderPrintables()` (and the Julian and Ramadan renderers) measures the laid-out sheet in Chromium before printing (`packages/generator/src/printCheck.ts`) and refuses to write a sheet that breaks a rule; the audit reads the PDF that ships (`scripts/lib/pdf-print.mjs`). `FC_PRINT_DRY=1 pnpm fc <command>` runs the first gate without writing any file. When a gate fails, fix the template; never loosen a threshold.

| # | Rule | Why | Checked by |
|---|---|---|---|
| 1 | **Real text, all vector.** Build the sheet in HTML/SVG with `doc()` from `julian.ts` and print it with `renderPrintables()`. No screenshots, no page images, no `box-shadow`, CSS `filter`, SVG `<pattern>` or repeating-gradient backgrounds: Chromium turns those into 72 dpi bitmaps that print soft. Draw ruled lines, hatching and dividers with borders or plain SVG shapes. | Copy-paste and search need text; bitmaps blur on paper | `10-PDF-FILES` (text layer), raster warning in the generator, `10-PDF-RASTER` |
| 2 | **US Letter**, 816 x 1056 px (`LETTER`) or landscape (`LETTER_LANDSCAPE`). A4 or tabloid only as an extra file whose name ends in `-a4` or `-tabloid`. One page unless the content needs more. | Our readers print on Letter | `10-PDF-PAGE` |
| 3 | **Safe area: text at least 24 px (0.25 in) from every edge.** The footer (`.foot`) and anything marked `data-print-edge` may come to 16 px (1/6 in). The top-right 0.25 in band is where the build stamps the "freshcalendars.com" link, so keep it free of text. | Home printers lose 0.12 to 0.25 in at the edges | generator (24 px), `10-PDF-SAFE-AREA` (12 pt on the PDF) |
| 4 | **Nothing overflows, clips or collides.** No text past its box or the page, nothing on top of the footer. The generator prints the space left above the footer; under 6 px is a warning that one more row will collide. | Overflow used to be caught only by looking at the PNG | generator, `10-PDF-OVERLAP` |
| 5 | **Fill the page.** A sheet whose bottom quarter is empty gets a warning: add a notes area or a second table, or let the type grow (`newsPrintable.ts` does this for you). | A half-empty page looks unfinished | generator warning |
| 6 | **Only Sora and Manrope glyphs** (`fontFaces()`), embedded. Characters outside their Latin set (★ ✂ ✓ → ⁻ ²) fall back to a system font that differs between a Mac and CI; draw symbols as inline SVG and write "to" or "-" instead of arrows. | The PDF must look the same everywhere | generator (font actually used per text run), `10-PDF-FONTS` |
| 7 | **Type at least 8 px (6 pt)**; body text 10 px or more, cells 9 px or more. | Smaller does not survive a home printer | generator |
| 8 | **Contrast at least 3:1 against the background** (error); aim for 4.5:1 for anything a reader must read (warning). Muted text such as dates outside the month still needs 3:1. Never carry meaning by color alone: tags and keys also say it in words. | Pale gray and gold fade out, and many people print in black and white | generator |
| 9 | **Ink saver**: for color-heavy sheets add a `-ink` version (`inkSaver: true` in `assets.printable`): black on white, outlines instead of fills. | Saves a cartridge, prints well in gray | review |
| 10 | **A clear `<h1>`** that uses the words of `downloads[].title`, and the footer `Free printable from Fresh Calendars · freshcalendars.com/news/<slug>/` (`.foot`). | The title becomes the PDF title in search results | `10-PDF-TITLE` (warning), `10-PDF-TEXT` |
| 11 | **Sources and dates on the sheet** in a note that starts with "Source:", the same facts as the story. Nothing on a printable that the story does not support. | Same rule as the story | review |
| 12 | **No third-party art, logos or brand marks.** Draw everything; name brands in text only. | Licensing | review |
| 13 | **Under 2 MB** (most sheets are under 300 KB). | Fast download on a phone | `10-PDF-FILES` |
| 14 | **File names** lowercase kebab-case with the year (`black-friday-planner-2026-bold.pdf`). If the content changes a lot after publishing, use a new name so search engines refetch it, and update the frontmatter. `downloads[].title` (5-80 characters) and `description` (20-200) become the PDF's title and subject. | | schema, `10-PDF-PROPERTIES` |
| 15 | **Look at it once.** Read the PNG (or open the PDF) before you commit: nothing cut off, nothing covered, the eye lands on the title first. Select all and paste: the text comes out in reading order. | No check sees everything | you |

Accessibility comes with the pipeline: `doc()` sets `<html lang="en">`, `pdfOptions()` prints a tagged PDF (structure tree, reading order) and the build stamps the language and title. Keep the HTML semantic (`h1`, `h2`, `table`, `ul`) so the tags mean something.

You do not add metadata by hand. On every build `apps/news/src/lib/pdf-meta.mjs` stamps each PDF that a story lists: title, author (Fresh Calendars), subject, keywords (the story's keywords plus "free printable"), language en-US, the story's dates, copyright and the terms-of-use license, "show title" for viewers, the top link to the story, and an entry in the nginx map that sends `Link: <story>; rel="canonical"` with the file. A PDF that no story lists gets none of this, so always list it under `downloads:`.

## 5. Check

```bash
pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test
```

All must pass, including every `10-PDF-*` check for any printable. Open one PDF from `dist/news/downloads/<group>/` and check the title in the viewer's title bar, the top-right link and that the text can be selected. Then read the page: `pnpm news:serve` and open `http://localhost:4324/news/<slug>/`. Check the hero, tables on a narrow window, and that every link opens.

Fix failures at the source (shorten the title, expand the abbreviation, correct the link); never weaken a check to make it pass.

## 6. Commit and push

```bash
git pull origin main
git add apps/news/src/content/articles/YYYY/MM/<slug>.md apps/news/src/assets/news/<slug>/ <generator and download files you added>
git commit -m "feat(news): <what the story covers>"
git push origin main
```

Writers push stories straight to `main` once every check passes. In the commit message list the main sources and anything not yet confirmed that should be rechecked (with the date). When CI passes on that commit, the server publishes it within about two minutes; watch the CI run (`gh run list --branch main --limit 1`) and fix a red one with a new commit right away, because nothing after it publishes until main is green. Never deploy, never force-push.
