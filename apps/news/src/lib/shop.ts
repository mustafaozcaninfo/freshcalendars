/**
 * Fresh Calendars Shop cards: a labeled block after a story's printables that points readers to
 * the shop's seasonal page (owner decision 2026-11-09). A story opts in with `shop: <campaign id>`
 * in its frontmatter; the copy lives here, once per campaign, so every story says the same thing
 * and one edit updates them all. A campaign drops off every page at the first build after `until`.
 * The shop is an affiliate storefront (Amazon Associates), so the card says so in plain words.
 */
export interface ShopCampaign {
  /** The shop's page for the campaign. */
  href: string;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  /** Up to four products, each linking to its page on the shop. */
  items: { name: string; href: string }[];
  /** UTM campaign name, so the shop's analytics can tell the stories apart. */
  utm: string;
  /** Last moment the card shows (ISO with offset). */
  until: string;
}

const SHOP = "https://shop.freshcalendars.com";

export const SHOP_CAMPAIGNS = {
  "veterans-day": {
    href: `${SHOP}/veterans-day-gifts`,
    kicker: "Veterans Day gift ideas",
    title: "Military memory journals for a veteran's service story",
    text: "Guided journals for the Army, Marine Corps and Air Force, flag notebooks, and red, white and blue washi tape and stickers for marking Nov. 11 in a planner.",
    cta: "See Veterans Day gifts",
    items: [
      { name: "Soldier's Story Journal", href: `${SHOP}/products/i-m-a-soldier-and-this-is-my-story-guided-journal` },
      { name: "Marine Story Journal", href: `${SHOP}/products/i-m-a-marine-and-this-is-my-story-guided-journal` },
      { name: "Airman Story Journal", href: `${SHOP}/products/i-m-an-airman-and-this-is-my-story-guided-journal` },
      { name: "Military Memories Journal", href: `${SHOP}/products/military-memories-lined-journal-keepsake-with-writing-prompts` },
    ],
    utm: "veterans-day-2026",
    until: "2026-11-30T23:59:00-05:00",
  },
} satisfies Record<string, ShopCampaign>;

export type ShopCampaignId = keyof typeof SHOP_CAMPAIGNS;
export const SHOP_CAMPAIGN_IDS = Object.keys(SHOP_CAMPAIGNS) as [ShopCampaignId, ...ShopCampaignId[]];

/** The campaign a story shows, or null when it has none or the campaign has ended. */
export function shopCampaign(id: string | undefined, now = new Date()): ShopCampaign | null {
  const c = id ? (SHOP_CAMPAIGNS as Record<string, ShopCampaign>)[id] : undefined;
  return c && now <= new Date(c.until) ? c : null;
}

/** A shop link tagged with where the reader came from. */
export function shopLink(href: string, campaign: ShopCampaign, slug: string, place: string): string {
  const u = new URL(href);
  u.searchParams.set("utm_source", "freshcalendars-news");
  u.searchParams.set("utm_medium", place);
  u.searchParams.set("utm_campaign", campaign.utm);
  u.searchParams.set("utm_content", slug);
  return u.toString();
}
