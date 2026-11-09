# Product page batches: writer brief, family guide, link pools

Agents never call the shop API. The main session runs `import_products.py verify`, which writes `.cache/shop/import/listings/<id>.json` (offer title and feature bullets, verbatim). It then gives each writer agent a list of ids. Writers draft `.cache/shop/products/drafts/<id>.json` and run the checker; the main session reviews, writes and publishes.

## Writer agent (Sonnet, general-purpose, 12 to 20 products of one family)

```text
Read .claude/skills/shop-product/SKILL.md (all of it) and .claude/skills/shop-product/references/briefs.md,
and the model draft shop/products/examples/325-zebra-mildliner.json. Their rules are binding.
For each id in <list>: read .cache/shop/import/listings/<id>.json. Look for the maker's own product page with
WebSearch (the brand's domain, not a retailer); record it in maker_source (or "none found") and any extra fact
in maker_facts, quoted. Write .cache/shop/products/drafts/<id>.json in the format of the model draft, with
category_ids [<category id>]. Every fact from the listing or the maker page; every number must appear there.
Make each page particular to its product: its own H3 wording with the line name, its own reader question
picked from its own gaps or claims, its own link choice from the pools below. Never reuse a sentence from
another draft. Then run python3 shop/tools/product_check.py <each draft> and fix every FAIL (it compares
your drafts with each other and with every live page). Do not call the shop API. Reply with PASS/FAIL per id
and the ids you left out (listing too thin, wrong category, dated 2026 or earlier, trademark).
```

Leave a product out, and say why, when:
- its listing has no feature bullets and its title gives fewer than three facts
- it is in the wrong category
- it is dated to 2026 or earlier only
- it is licensed or trademark merchandise

The main session then deletes it or moves it to the right category.

## Family guide (what leads, which rows, which question)

| Family | Lead with | Table rows to look for | Typical reader question |
|---|---|---|---|
| Dated planners | the date range | dates, size, layout, binding, tabs, paper weight, extras | "Does the {line} start in {month}?" / "How many months does it cover?" |
| Undated, hourly, appointment | the layout | layout, time range and increment, size, pages, binding | "What hours does the {line} print?" |
| Notebooks and journals | paper and ruling | ruling, paper weight, pages or sheets, size, binding, cover | "Will gel ink show through the {line}?" |
| Guided, memory, log books | what each page asks | prompts or columns, days or entries covered, pages, size, cover | "How many {days/entries} does it hold?" |
| Wall, desk, pocket calendars | size and dates | size, dates, block size, binding or stand, holidays, extras | "Does the {line} print US holidays?" |
| Dry erase, magnetic | surface and size | size, surface, grid, markers included, mounting | "Will it fit a fridge door?" (only from listed size) |
| Pens, markers, highlighters | tip and ink | count, tip type and width, ink base, colors, case | "Does the ink bleed through planner paper?" |
| Stickers, washi, stencils, stamps, paper | count and size | count, sheet or roll size, finish, themes, storage | "Will the {item} fit an A5 planner?" (from listed sizes) |
| Accessories, inserts, refills | fit | hole pattern or size it fits, material, count, what is included | "Which planner sizes does it fit?" |

## Link pools (rotate; the checker allows at most 2 links shared with any other page)

- **Category**: the product's own category, at `https://shop.freshcalendars.com/categories/<slug>`. Add a sibling or parent category when it helps the reader, for example pens linked from a notebook page.
- **Shop articles**: `https://shop.freshcalendars.com/articles/<slug>`. Pick the one whose subject matches the page's question.
  - `best-calendar-year-planners`: planners
  - `planner-dates-and-holidays`: dated products, holidays
  - `best-wall-calendars`: wall and desk calendars
  - `best-gratitude-journals`: guided journals
  - `christmas-gifts-for-planner-lovers`: gifts and supplies
  - `how-to-choose-a-planner`: layouts, sizes, paper
  - `how-to-use-a-daily-planner`: daily and hourly planners
  - `journaling-for-beginners`: notebooks, journals, pens
  - `types-of-journals`: journal types (live from Nov. 12, 2026)
  - `planner-accessories-guide`: supplies (live from Nov. 15, 2026)

  A scheduled article answers 404 before its date, and `--live` fails it.
- **freshcalendars.com** (all checked live Nov. 9, 2026):
  - `monthly-calendars/`
  - `printable-weekly-calendar.html`
  - `printable-yearly-calendar.html`
  - `printable-blank-yearly-calendar.html`
  - `blank-calendars.html`
  - `printable-monday-start-calendar.html`
  - `guides/monday-start-calendar.html`
  - `printable-school-calendar.html`
  - `guides/classroom-printable-calendars.html`
  - `guides/fiscal-year-calendar.html`
  - `print-guide.html`
  - `calendar-tools/`
  - `printable-calendars.html`
  - `holidays/`
  - `canada-holidays/`
  - `page/school-holidays/`
  - `page/daylight-savings/`
  - the twelve month pages `january-calendars.html` to `december-calendars.html`
  - `when-is/christmas-day/`, `when-is/thanksgiving/`, `when-is/valentines-day/`, `when-is/mothers-day/` and `when-is/easter/`
  - `news/printables/`

  Choose the one that fits the product's size, dates or use: a school planner gets the school calendar, a budget book the fiscal-year guide, a gift item the matching holiday date page.
