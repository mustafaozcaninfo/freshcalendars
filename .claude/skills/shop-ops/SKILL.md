---
name: shop-ops
description: Run Fresh Calendars Shop (shop.freshcalendars.com, the FreshStore affiliate shop) through its Site API. Use for adding or cleaning products, long-tail product research, categories, seasonal pages, product ratings (Fresh Calendars Score), shop design fixes, shop audits, or anything else about the shop.
---

# Shop operations

Read `shop/README.md` before anything else. It covers setup (the API key lives in `.cache/shop/token`, never in git), the rules, platform behavior, the current state and step-by-step routines.

Key points:

- **Rate limit.** 60 API requests a minute, shared by every caller. Only the main session calls the API; agents research and draft into files.
- **Back up, change, read back, then check the live page.** After any change, clear the cache and wait 2 to 4 minutes before checking.
- **Ratings.** They carry Jessica Hartwell's name and go live only after her approval. Only scores of 4.0 or more are shown. The method is in `shop/ratings/METHODS.md`. Never raise a score by hand.
- **Owner decisions.** Do not touch the disabled merchants, the generated review stars or the empty affiliate tracking IDs.
- **Design changes go to the repo first.** Edit `shop/design/` first, then push it to the store, then check with `shop/tools/ui_shot.mjs`.
- **What to do next.** `shop/ROADMAP.md` gives the order of work.
