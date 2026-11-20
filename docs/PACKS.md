# Paid printable packs

A test from Nov. 20, 2026: one calendar page sells a download. The first pack is the
**January 2028 Calendar Printable Pack** for $0.99 on `/january-2028-calendar/`.

## What is sold

The eight free sheets of the month, bound into four PDF files (US Letter and A4, each with a Sunday
and a Monday start, eight pages per file) in one ZIP with a short note. The single sheets stay free
on the page; the pack sells one file per paper size.

## How it is built

| Piece | Where |
|---|---|
| The list of packs: price, SKU, refund days, checkout link | `cloudflare/products.js` |
| The ZIP, the three cover pictures (1:1, 4:3, 16:9), the buy box, the terms section and the Product data | `packages/generator/src/packs.ts` |
| Where the box and the data go on the month page | `packages/generator/src/datedPages.ts` (`monthPage`) |
| Styles | `packages/site-chrome/src/refresh.ts` (`.pack-*`) |
| The page a buyer lands on after paying | `cloudflare/worker.js` (`order`, `/api/order`) |

**A pack is on sale only while its `checkoutUrl` is set.** With it empty the month page is the free
page it always was: no buy box, no Product data, no pack file. Google's merchant listing data is
allowed only on a page where a shopper can buy, so the data and the button always appear together.

`FC_PACK_PREVIEW=1 pnpm fc gen-meta` draws the box with a disabled button for a local look.
`pnpm fc packs` builds the pack files without a checkout link (to open the ZIP and the covers).

## Structured data

One `Product` with one `Offer` on the month page (`packLd`): name, description, three images, SKU,
brand, price and currency, `priceValidUntil` (the last day of the month it prints), availability,
the seller, free shipping with no delivery time (a download), and the return policy stated on the
page (`#pack-terms`). No rating and no review: the pack has none, and invented ones are a manual
action. The visible price and the price in the data come from the same field, and a unit test holds
them together.

Google Merchant Center's free listings are a different thing and do not take this product: its
policy lists digital books and PDFs as unsupported. The Product data here is for the organic result.

## Turning the sale on (owner)

1. In Stripe, create a product "January 2028 Calendar Printable Pack" at $0.99 (one-time) and a
   **Payment Link** for it.
2. On the Payment Link: under "After payment" choose "Don't show confirmation page" and set the
   redirect to `https://freshcalendars.com/api/order?session_id={CHECKOUT_SESSION_ID}`. Add
   metadata `pack` = `january-2028-calendar-pack`.
3. Create a **restricted API key** with one permission, Checkout Sessions: Read. Save it as the
   Worker secret `STRIPE_SECRET` (Cloudflare dashboard, Worker `freshcalendars`, Settings,
   Variables and Secrets). It is never written into the repository.
4. Put the Payment Link URL into `checkoutUrl` in `cloudflare/products.js` and push. The next
   `Calendar site` run builds the pack, uploads it and publishes the page with the buy box.
5. Buy it once with a real card, check the download page and the receipt, then refund yourself.

Stripe is the card processor, not the seller of record: sales tax and VAT on these sales are ours
to handle. Stripe Tax can compute them on the Payment Link.

## Known limits

- The buy box is on the dated page only. When the evergreen page (`/january-calendars.html`) moves
  to the pack's year, the dated page's canonical points there and the Product data is left out, so
  the box has to move to the evergreen page before then (for January 2028: early 2027).
- The ZIP sits on the CDN under a random folder name. Its sheets are the free ones, so the link is
  not guarded beyond that.
- Refunds are made by hand in the Stripe dashboard.

## Checking it

- `pnpm test` covers the box, the data, the ZIP writer and the order page.
- After it is live: Google's Rich Results Test on the page URL should report one valid
  "Merchant listings" item and one "Product snippets" item with no errors.
- Search Console, Shopping tab listings and Merchant listings reports, show the page a few days
  after it is crawled.
