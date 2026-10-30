---
name: news-seo
description: The Fresh Calendars SEO playbook (SEO-HARITASI-TAM.md) as decisions a /news/ writer makes before and while writing - topic and intent, new story vs update vs section, cannibalization with /when-is/ pages, page anatomy, information gain, Discover and AI Overviews, linking and velocity. Use when choosing a story angle, planning a batch of stories, writing or reviewing a headline, lede or structure, or asking why a story does not rank.
---

# Ranking /news/ stories

The audit (`pnpm news:seo-audit`, `scripts/news-seo-audit.mjs`) already blocks the mechanical rules: banned words, em dashes, abbreviations, schema, H1, sitemaps, thin pages, clickbait, PDF metadata and repeated heroes. This skill covers the calls the audit cannot make. Sources are `(§NN l.LINE)` in `SEO-HARITASI-TAM.md`; `docs/NEWS-SEO-COMPLIANCE.md` maps every rule to its check.

## 1. Before writing: is this a page?

Run every candidate query through this tree (§04 l.1056-1084):

1. **Do we already have it?** `grep -ril "<keyword>" apps/news/src/content/articles` and check the calendar site's `/when-is/<holiday>/`. Search the query (WebSearch): if three or more of the top ten results would also answer one of our pages, it is the same intent. **Update that page** (§04 l.1060-1064).
2. **Different intent, and it is the core of a story?** New story.
3. **A sub-question with its own facts?** A section (H2) in the story that owns the topic.
4. **One sentence answers it?** One sentence plus an internal link to the page that owns it.

**Modifier variants are not new pages.** "Is the post office open on Veterans Day in Texas" and the same query for Ohio share one intent; a copy per state, city or store where only the name changes is a doorway page. Put the variants in a table in one story. A variant earns its own story only when it has different official facts (its own closures, rules or schedule from its own source).

**Cannibalization (§04 l.1195, l.1212).** The date answer ("when is Thanksgiving 2026") belongs to `/when-is/`. A story takes another intent (what is open, why this date, travel days, deals, hours, how to watch) and links to the when-is page.

**Stay in our source context (§04 l.947, l.1010-1015).** Calendars and dates, holidays, school calendars, election dates and deadlines, sky events, time changes, retail dates, daily puzzles. Since the February 2026 Discover core update, Google judges expertise topic by topic; a story far from these does not show (audit `04-TOPIC-FOCUS`).

**Pick the angle that deserves to rank (§04 l.925, l.1036).** Ask what we add that the top results lack. One of these, at least:
- a full date or time table computed from the official source (by state, by time zone, by wave),
- a printable a reader keeps,
- a side-by-side of official sources, or a fact others missed on the official page (the NYC Marathon's first course change in 15 years; a fee-free day three days away that the brief did not mention),
- a countdown or computed weekday answer.
A page that only restates one official page has no information gain and is the first thing a core update replaces (§02 l.464, l.589).

## 2. Timing

- **Publish before the searches peak**, not on the day: a race, holiday or deadline story 5 to 10 days ahead, a sky event a week ahead. Our Google News sitemap lists a story only for 48 hours after `publishedAt` (`09-NEWS-SITEMAP`), so that window should fall while people are searching.
- **Update rather than duplicate (§03 l.880).** Same intent next week or next year: edit the existing story and set `updatedAt` to now (ET). Updates and error fixes are silent: no "Last updated" callout and no new `corrections` entry; the page's Updated time is the signal (corrections policy, revised 2026-10-30). Correction notes already published stay. A page with click history ranks better than a new copy of it.
- **Plan the update when you publish.** If an official figure is still pending (AAA forecast, closure times), say so in the story and list the recheck date in the commit message.
- **Velocity (§03 l.758, l.834).** No fixed weekly cap since 2026-10-25 (owner's decision); `03-VELOCITY` only warns above 150 stories in 7 days. Publish only as many as the editors can check. **Stop rule:** if the indexed share or new queries fall two weeks in a row, publish fewer new stories and update existing ones until they recover.

## 3. Page anatomy

- **First sentence answers the query (§08 l.2329)** with the date, time, number or rule, the entity and the official source by name. The next sentences give the main condition or exception (which states, which offices, which time zone) and what the rest of the story covers. Context comes after.
- **Centerpiece unbroken (§01 l.202-206, l.314):** H1, lede, byline, hero and key points sit together; nothing splits them.
- **Headline:** the main query first, then the specific fact ("NYC Marathon 2026: Start Times, TV Schedule, Road Closures and Where to Watch on Nov. 1"), at most 90 characters (`13-TITLE-LENGTH`). It states what the story says; Discover demotes hype and withheld answers.
- **`description` is the lede:** the answer plus the next most useful fact, abbreviations expanded.
- **H2s are the questions readers type (§04 l.1100, §08 l.2336):** "Where to watch in person", "What the waiver does and does not cover". Short, with the entity or attribute in them. A heading that three other stories already use word for word ("How we keep this accurate", "Key dates", "Print your checklist", "Plan the week") fails `13-H2-REUSE`; write "Christmas market dates to mark in Toronto" instead. Dated series (NBA games today) may share their headings.
- **Match the form to the content (§08 l.2494-2522):** dates, times and prices go in tables, steps in a numbered list, items without order in a bulleted list; what and why go in prose. If the search results show tables, give a better table.
- **Every number has a source, a year and a scope.** Official source first; when none is reachable, the fact goes in only if a search finds it in two or more independent reputable sources that agree (both listed in `sources:` with their dates and named in the text). Write the fact with what it applies to: "USPS post offices close on Nov. 11, per the USPS holiday schedule" rather than "mail is closed". Last year's figure is labeled as last year's, never presented as this year's.
- **The verb carries the source's certainty (§08 l.2329).** "Closes", "is", "requires" only when the official source states it; "is scheduled to", "plans to", "has not announced" when that is what it says. Do not hedge a confirmed fact, and do not firm up a plan into a fact. Pick the exact relation: "observes" a holiday is not "closes for" it, "is eligible" is not "will receive".
- **Bridges, not link dumps (§04 l.959):** link a calendar page or related story in the sentence where the reader needs it.
- **Word economy (§08 l.2320):** every paragraph adds a fact. Long but useful is fine; padding to look complete is not. Floor: 300 words (`01-THIN`).

## 4. Writing that reads as human work

The audit catches the banned list, em dashes, "not X but Y", wrap-up endings and low burstiness. Also avoid (§02 l.605-612):
- every section ending in a three-item list, or every paragraph of the same length,
- the same hook in unrelated stories: the clock change ("U.S. clocks fall back Nov. 1") goes in the description or summary only when the story is about it (Time Change category or the headline says so); elsewhere it is one body sentence where it changes a time (`13-CLOCK-HOOK`),
- a description or first summary bullet that copies another story's opening; start from this story's own fact,
- a closing summary of what was just said,
- opinion in factual prose (`08-NO-OPINION`); opinions only as attributed quotes, and election stories stay nonpartisan,
- unsourced superlatives, invented people, quotes, counts or reviewers (§02 l.469, §07 l.2148).
Vary sentence length on purpose; the audit only enforces a floor.

## 5. AI Overviews and Discover

- **Cited answers get quoted (§05 l.1548):** name the source in the sentence, include the exact number, and keep the answer in the first lines. Studies show citations, quotations and statistics raise visibility in AI answers; keyword repetition does not.
- **Utility is the click AI cannot take (§05 l.1244):** the printable, the full table, the countdown. Point to them early in the story.
- **Discover image:** a unique hero, no text-heavy poster (see the `news-visuals` skill). A repeated picture across stories is a repeated page to the feed.
- **US readers:** U.S. dates and Eastern Time (ET) with other zones where it matters; U.S. sources first.

## 6. Links and entity

- At least two calendar pages (`internalLinks`) and up to three related stories (`related`); every story reachable from /news/ (`04-OUTER-CORE`, `04-NO-ORPHANS`).
- **Link back from existing stories.** A new story is added to the `related` list or the body of 1-2 existing stories on the same topic (replace the weakest pick if a list already has three). Only when the topics really match: a Black Friday story links from the Cyber Monday story, not from a meteor shower. `13-INBOUND` fails a new story no other story links to; the automatic similarity picks do not count.
- Anchor text says what the target is ("November 2026 printable calendar"), never a bare keyword string (§06 l.1622, l.1719).
- Outbound links go to the official source. Commercial links carry `rel="sponsored"` and a disclosure (`06-SPONSORED`).
- One organization entity, byline `news-desk` unless a real named editor signs; no `sameAs` we do not own (§07 l.2159).
- Off-site tactics in the playbook (micro-sites, Reddit networks, external link campaigns) are not writer work and several break Google's policies (§06 l.1683-1706, §07 l.2181-2192).

## 7. Red lines (§00 l.100-108)

No deceptive pages or redirects, no fake accounts or networks, no unprovable superiority claims, no "free" promise that is not fully true, no thin pages written to look short, no hiding sources or credits.

## 8. Self-check before commit

- [ ] The query is not already owned by another story or a `/when-is/` page.
- [ ] The story adds at least one thing the top results lack (and it is in the first screen).
- [ ] First sentence: date or number, entity, official source.
- [ ] Every figure has its source, year and scope; verbs match what the source confirms; pending figures say "not yet announced" with last year's value labeled.
- [ ] H2s are reader questions; structured facts are in tables.
- [ ] Hero is unique and printable is built from the story's facts (`news-visuals`).
- [ ] Two calendar links, up to three related stories, linked in context; 1-2 existing stories on the same topic now link to this one.
- [ ] Headline at most 90 characters; no H2 or opening copied from other stories; no clock-change hook outside a time-change story.
- [ ] `pnpm news:build && pnpm news:verify && pnpm news:seo-audit && pnpm test` pass.
