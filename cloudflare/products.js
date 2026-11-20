// Paid printable packs: one list read by the generator (the buy box and Product data on the
// calendar page, the pack file itself) and by the Worker (the page a buyer lands on after paying).
// See docs/PACKS.md.
//
// A pack is on sale only while `checkoutUrl` is set. With it empty the calendar page is exactly
// the free page it was: no buy box and no Product data, because Google's merchant listing rules
// allow that data only on a page where the shopper can really buy.
//
// `key` is a random folder name on the CDN. The sheets inside a pack are the free ones, so the
// folder is not a secret worth more than the price; it only keeps the bundle from being listed.

export const PACKS = [
  {
    id: "january-2028-calendar-pack",
    sku: "FC-2028-01-PACK",
    year: 2028,
    month: 1,
    name: "January 2028 Calendar Printable Pack",
    price: "0.99",
    currency: "USD",
    // The offer ends with the month it prints.
    validUntil: "2028-01-31",
    refundDays: 14,
    key: "p7k3v9q2xm4t",
    // The Stripe Payment Link (https://buy.stripe.com/...). Empty: not on sale.
    checkoutUrl: "",
  },
];

export const CDN = "https://cdn.freshcalendars.com";
/** Where the generator writes a pack's files and the CDN serves them. */
export const packDir = (p) => `/assets/packs/${p.key}`;
export const packFile = (p) => `${packDir(p)}/${p.id}.zip`;
export const packCovers = (p) => ({
  square: { url: `${packDir(p)}/${p.id}-1x1.jpg`, width: 1600, height: 1600 },
  standard: { url: `${packDir(p)}/${p.id}-4x3.jpg`, width: 1600, height: 1200 },
  wide: { url: `${packDir(p)}/${p.id}-16x9.jpg`, width: 1600, height: 900 },
});
