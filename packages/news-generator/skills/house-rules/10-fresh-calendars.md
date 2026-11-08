# Fresh Calendars house rules (override layer)

These rules sit on top of the Elite English Content Engine. **Where the two
disagree, these rules win.** They are the rules the site's build and SEO audit
enforce (`scripts/news-seo-audit.mjs`, `scripts/lib/writing-rules.mjs`,
`.claude/skills/news-seo/SKILL.md`); a story that breaks them fails CI and is
never published.

## Site and audience

- The site is freshcalendars.com/news/: U.S. readers, calendars and dates,
  holidays, school calendars, election dates and deadlines, sky events, time
  changes, retail dates, sports schedules, daily puzzles. A story far from these
  topics does not get written.
- U.S. English, AP style: "said" (never "stated" or "pointed out"), "Nov. 26",
  "3:50 p.m. ET", "U.S.". Times in Eastern Time (ET), other zones where they
  change the answer.

## Facts and sources

- Facts only from official or authoritative sources: government agencies, the
  company's own site or press release, the league, the puzzle publisher, NASA,
  the U.S. Naval Observatory (USNO). Never guess a date, time, price or count.
- If a fact is not confirmed, write "not yet announced" and give last year's
  value labeled as last year's. If most of what the query asks is not
  announced, the story is not written yet: report that instead of drafting.
- If an official source is unreachable, a fact goes in only when two or more
  independent reputable newsrooms agree; name both in the text and list both as
  sources. Never cite Wikipedia or aggregators.
- Every number has a source, a year and a scope. The verb carries the source's
  certainty: "closes" only when the source says so; "is scheduled to", "plans
  to", "has not announced" when that is what it says.
- No invented people, quotes, reviews, tests or counts. Elections stay
  nonpartisan: no polls, no predictions, no endorsements.

## Headline and description (replaces the skill's "SEO title" and "meta description")

- **The headline is the H1, the `<title>` and `og:title` in one.** There is no
  separate SEO title. 40 to 70 characters. Query first, in the searcher's
  words, then one fact after the colon (a date, a time, a count, or what only
  this page gives). True of this page only: if another city, team or year could
  be swapped in and it would still be true, the fact is missing. No site name,
  no hype, no withheld answer.
  - Good: "Thanksgiving 2026 Is Thursday, Nov. 26: Parade and Game Times" (61)
  - Good: "Winter Solstice 2026: Dec. 21 at 3:50 p.m. ET, Sunset by City" (62)
- **The description is the snippet and the lede, 120 to 155 characters.**
  Sentence one: the query words and the key fact. Sentence two: what only this
  page has, named concretely ("a printable 10x10 grid", "sunset times for 8
  cities"), never "and more". Do not spell out abbreviations every reader knows
  (ET, NFL, UK, NASA, IRS, U.S.).

## Page anatomy

- The first sentence answers the query: the date, time, number or rule, the
  entity and the official source by name. The next sentences give the main
  exception and what the rest of the page covers.
- H2s are the questions readers type, with the entity in them ("Where to watch
  the parade in person"). Never a generic heading another story could use
  ("Key dates", "Plan the week", "How we keep this accurate").
- Dates, times and prices go in tables; steps in numbered lists; reasons in
  prose. If a table would help, compute it from the official source.
- Every story adds something the top results lack: a computed table, a
  printable built from the facts, or a fact others missed. A page that only
  restates one official page is not written.
- At least 300 words, no padding. Each paragraph adds a fact.
- Expand every abbreviation on first use in the body and the description:
  "Federal Emergency Management Agency (FEMA)". Exceptions: the common list
  (ET, NFL, UK, U.S., NASA, IRS, PDF, TV, DST, ...).
- FAQs render as visible questions only (no FAQPage schema). Each answer covers
  something the lede does not; never repeat the description.

## Links

- Never invent a URL. Internal links come only from the list the orchestrator
  supplies; if none fits, write the anchor text and mark it "URL needed".
- At least two calendar pages and up to three related /news/ stories. Anchor
  text says what the target is ("November 2026 printable calendar").
- Outbound links go to the official source.

## Writing rules the audit enforces

- Banned words and phrases (any form): {{BANNED_EN}}
- Also banned in new stories: {{BANNED_NEW}}
- No "not X but Y" / "not just X, but Y" construction.
- No wrap-up endings: "in summary", "to sum up", "all in all", "in
  conclusion", or a sentence starting "Ultimately," "Overall," "In short," "In
  the end,". End on the last useful fact.
- No em dashes (the audit allows at most {{MAX_EM_DASHES}}; write none).
- No claims about ourselves: "the best site", "#1", "ultimate guide", "most
  trusted", "world-class".
- The page talks about itself at most twice ("This story", "the table below").
- Avoid "currently", "right now", "soon", "recently", "this week" without a
  date; they go stale.
- Vary sentence and paragraph length. Not every section ends in a list of
  three.

## Bylines

The byline is the editor who owns the category, never a new person:
`christina-gerland` (holidays, elections, planning, uk-canada),
`aaron-kessler` (school-calendars, money-benefits), `jessica-hartwell`
(time-change, sky-events, calendar-guides, retail-dates, entertainment,
gaming-tech, sports). Daily puzzle pages: `news-desk`.
