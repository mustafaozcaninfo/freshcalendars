/**
 * "From the shop" box: one contextual link from a calendar page to the matching list on the
 * Fresh Calendars Shop (shop.freshcalendars.com, our affiliate storefront). A reader printing a
 * 2027 calendar is often choosing a 2027 planner too, and a new shop gets found sooner through
 * pages people already visit. Only pages with a real match get a box; every other page gets nothing.
 */
const SHOP = "https://shop.freshcalendars.com";

type Box = { title: string; text: string; href: string; cta: string };

const BOXES: Record<string, Box> = {
  yearly: { title: "Planning the year on paper?", text: "2027 planners compared by size, paper weight and price, from the maker listings.", href: `${SHOP}/categories/dated-planners`, cta: "See 2027 planners" },
  monthly: { title: "Want the month on the wall?", text: "2027 wall calendars that print holidays, with sizes and prices in one table.", href: `${SHOP}/2027-wall-calendars-with-holidays`, cta: "Compare wall calendars" },
  weekly: { title: "Prefer a bound weekly planner?", text: "Undated weekly planners in A5: start in any week, compared by pages and paper.", href: `${SHOP}/undated-weekly-planners-a5`, cta: "Compare weekly planners" },
  school: { title: "Need a planner for the school year?", text: "2026-2027 academic planners in 8.5 x 11 inches, compared by layout and cover.", href: `${SHOP}/academic-planners-2026-2027-8-5-x-11`, cta: "Compare academic planners" },
  "when-is:black-friday": { title: "Planner prices below list", text: "Planners and calendars priced 15% or more below their list price, largest cut first.", href: `${SHOP}/black-friday-planner-deals`, cta: "See the price cuts" },
  "when-is:cyber-monday": { title: "Journal and pen prices below list", text: "Journals, notebooks and pens priced 15% or more below their list price.", href: `${SHOP}/black-friday-journal-deals`, cta: "See the price cuts" },
  "when-is:christmas-day": { title: "A gift for someone who plans", text: "Christmas gifts for planner lovers, picked from the maker listings.", href: `${SHOP}/articles/christmas-gifts-for-planner-lovers`, cta: "Read the gift guide" },
  "when-is:christmas-eve": { title: "A gift for someone who plans", text: "Christmas gifts for planner lovers, picked from the maker listings.", href: `${SHOP}/articles/christmas-gifts-for-planner-lovers`, cta: "Read the gift guide" },
  "when-is:mothers-day": { title: "A planner gift for mom", text: "22 planner gifts by mom type and budget, with sizes drawn to scale.", href: `${SHOP}/articles/planner-gifts-for-moms`, cta: "Read the gift guide" },
  "when-is:veterans-day": { title: "A gift that keeps a service story", text: "Military memory journals by branch, flag notebooks and patriotic planner supplies.", href: `${SHOP}/veterans-day-gifts`, cta: "See Veterans Day gifts" },
  "when-is:new-years-day": { title: "Starting a planner on January 1?", text: "2027 planners in A5, compared by layout, paper and price.", href: `${SHOP}/2027-planners-a5`, cta: "Compare 2027 planners" },
  "when-is:new-years-eve": { title: "Starting a planner on January 1?", text: "2027 planners in A5, compared by layout, paper and price.", href: `${SHOP}/2027-planners-a5`, cta: "Compare 2027 planners" },
};

/** Keys with a box, for tests and link checks. */
export const SHOP_BOX_KEYS = Object.keys(BOXES);
export const shopBoxHref = (key: string): string | undefined => BOXES[key]?.href;

/** The box for a page key ("yearly", "weekly", "when-is:black-friday"), or "" when the page has no match. */
export function shopBoxHtml(key: string): string {
  const b = BOXES[key];
  if (!b) return "";
  return `<aside class="shop-box" aria-label="From the Fresh Calendars Shop"><span class="shop-box-kicker">From the Fresh Calendars Shop</span><strong>${b.title}</strong><p>${b.text}</p><a href="${b.href}">${b.cta} →</a><small>The shop earns a commission when you buy through its retailer links.</small></aside>`;
}
