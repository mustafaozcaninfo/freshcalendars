/**
 * Fresh Calendars Shop cards: a labeled block after a story's printables that points readers to
 * the shop's seasonal page (owner decision 2026-11-09). A story opts in with `shop: <campaign id>`
 * in its frontmatter; the copy lives here, once per campaign, so every story says the same thing
 * and one edit updates them all. A campaign drops off every page at the first build after `until`,
 * or hands over to the campaign named in `then`.
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
  /**
   * The campaign that takes this one's place after `until`, so a story keeps a card through the
   * season: advent cards hand over to Christmas gifts on Dec. 3, those to 2027 planners after
   * Christmas (Nov. 26, 2026).
   */
  then?: string;
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
  "advent-calendars": {
    href: `${SHOP}/categories/advent-calendars`,
    kicker: "Advent calendars 2026",
    title: "Advent calendars compared by cost per day",
    text: "More than 1,600 advent calendars in 40 kinds. Each product page lists the days, what the doors hold, the ages the maker gives and today's price at Amazon.",
    cta: "See advent calendars by kind",
    items: [
      { name: "Fill your own", href: `${SHOP}/categories/fillable-advent-calendars` },
      { name: "Toy calendars", href: `${SHOP}/categories/toy-advent-calendars` },
      { name: "Fishing, golf and hobby", href: `${SHOP}/categories/fishing-advent-calendars` },
      { name: "Calendars under $25", href: `${SHOP}/advent-calendars-under-25` },
    ],
    utm: "advent-2026",
    until: "2026-12-02T23:59:00-05:00",
    then: "christmas-gifts",
  },
  "lego-advent": {
    href: `${SHOP}/articles/lego-advent-calendars`,
    kicker: "LEGO advent calendars 2026",
    title: "LEGO sets and block alternatives by cost per day",
    text: "Three LEGO advent calendars and six building-block calendars from other makers in one table: pieces, days and the cost per day at today's price.",
    cta: "Compare the nine sets",
    items: [
      { name: "LEGO Friends 2026", href: `${SHOP}/products/lego-friends-advent-calendar-2026-42698-christmas-countdown` },
      { name: "LEGO Marvel 2026", href: `${SHOP}/products/lego-marvel-advent-calendar-2026-317-pieces-6-minifigures` },
      { name: "All block calendars", href: `${SHOP}/categories/building-block-advent-calendars` },
    ],
    utm: "advent-2026",
    until: "2026-12-02T23:59:00-05:00",
    then: "christmas-gifts",
  },
  // Topic cards for advent stories (Nov. 22, 2026): a story about one kind of calendar points at
  // that kind's guide, not at the whole category. Counts in the text come from the guides' titles.
  "food-advent": {
    href: `${SHOP}/articles/chocolate-advent-calendars`,
    kicker: "Food and drink advent calendars 2026",
    title: "Chocolate, tea, coffee and snack calendars by cost per day",
    text: "Four guides to the advent calendars you eat or drink, each with the number of days, what the doors hold and the cost per day at today's price.",
    cta: "Compare chocolate calendars",
    items: [
      { name: "Chocolate calendars", href: `${SHOP}/articles/chocolate-advent-calendars` },
      { name: "Tea calendars", href: `${SHOP}/articles/tea-advent-calendars` },
      { name: "Coffee calendars", href: `${SHOP}/articles/coffee-advent-calendars` },
      { name: "Snack and jam boxes", href: `${SHOP}/articles/hot-sauce-and-snack-advent-calendars` },
    ],
    utm: "advent-2026",
    until: "2026-12-02T23:59:00-05:00",
    then: "christmas-gifts",
  },
  "disney-advent": {
    href: `${SHOP}/articles/disney-advent-calendars`,
    kicker: "Disney advent calendars 2026",
    title: "Disney advent calendars compared by cost per day",
    text: "Twelve Disney advent calendars in one table: figure, puzzle, sock, beauty and story sets, with the days in each box and the cost per day at today's price.",
    cta: "Compare the 12 Disney sets",
    items: [
      { name: "Funko Pop calendars", href: `${SHOP}/articles/funko-pop-advent-calendars` },
      { name: "Harry Potter calendars", href: `${SHOP}/articles/harry-potter-advent-calendars` },
      { name: "All character calendars", href: `${SHOP}/categories/character-advent-calendars` },
    ],
    utm: "advent-2026",
    until: "2026-12-02T23:59:00-05:00",
    then: "christmas-gifts",
  },
  "craft-advent": {
    href: `${SHOP}/articles/craft-advent-calendars`,
    kicker: "Craft advent calendars 2026",
    title: "Craft kit advent calendars ranked by cost per day",
    text: "Ten craft advent calendars with the projects and ages each maker lists, plus guides to diamond painting sets, art supply calendars and boxes you fill yourself.",
    cta: "Compare the 10 craft kits",
    items: [
      { name: "Diamond painting calendars", href: `${SHOP}/articles/diamond-painting-advent-calendars` },
      { name: "Art supply calendars", href: `${SHOP}/articles/art-supply-advent-calendars` },
      { name: "Fill your own", href: `${SHOP}/articles/fillable-advent-calendars` },
    ],
    utm: "advent-2026",
    until: "2026-12-02T23:59:00-05:00",
    then: "christmas-gifts",
  },
  "religious-advent": {
    href: `${SHOP}/articles/nativity-advent-calendars`,
    kicker: "Nativity advent calendars 2026",
    title: "Nativity advent calendars compared by cost per day",
    text: "Ten nativity advent calendars with the figures and doors each listing names, plus guides to wooden calendars with drawers, candle sets and traditional paper calendars.",
    cta: "Compare the 10 nativity sets",
    items: [
      { name: "Wooden calendars with drawers", href: `${SHOP}/articles/wooden-advent-calendars` },
      { name: "Candle calendars", href: `${SHOP}/articles/candle-advent-calendars` },
      { name: "Traditional paper calendars", href: `${SHOP}/articles/paper-advent-calendars` },
    ],
    utm: "advent-2026",
    until: "2026-12-02T23:59:00-05:00",
    then: "christmas-gifts",
  },
  "kids-advent": {
    href: `${SHOP}/articles/advent-calendars-for-kids`,
    kicker: "Advent calendars for kids 2026",
    title: "Toy advent calendars for kids ranked by cost per day",
    text: "Thirteen toy advent calendars for children in one table, with separate guides for toddlers, girls and boys and the cost per day at today's price.",
    cta: "See the 13 toy sets",
    items: [
      { name: "For toddlers", href: `${SHOP}/articles/advent-calendars-for-toddlers` },
      { name: "For girls", href: `${SHOP}/articles/advent-calendars-for-girls` },
      { name: "For boys", href: `${SHOP}/articles/advent-calendars-for-boys` },
      { name: "LEGO and block calendars", href: `${SHOP}/articles/lego-advent-calendars` },
    ],
    utm: "advent-2026",
    until: "2026-12-02T23:59:00-05:00",
    then: "christmas-gifts",
  },
  "advent-deals": {
    href: `${SHOP}/black-friday-advent-calendar-deals`,
    kicker: "Advent calendar prices 2026",
    title: "Advent calendars priced below their list price",
    text: "Advent calendars selling 15% or more below their list price, largest cut first, with separate lists by budget.",
    cta: "See today's price cuts",
    items: [
      { name: "Under $25", href: `${SHOP}/advent-calendars-under-25` },
      { name: "$25 to $50", href: `${SHOP}/advent-calendars-25-to-50` },
      { name: "All advent calendars", href: `${SHOP}/categories/advent-calendars` },
    ],
    utm: "advent-2026",
    until: "2026-12-02T23:59:00-05:00",
    then: "christmas-gifts",
  },
  // After advent (Nov. 26, 2026): the shop's Christmas gift kinds, then the planners for the new year.
  "christmas-gifts": {
    href: `${SHOP}/categories/christmas-gifts`,
    kicker: "Christmas gifts 2026",
    title: "Christmas gifts by kind, compared from the listings",
    text: "More than 800 gifts in 22 kinds, from wooden train sets and trading card tins to gift sets and stocking stuffers. Each page lists pieces, sizes, ages and today's price at Amazon.",
    cta: "See Christmas gifts by kind",
    items: [
      { name: "Stocking stuffers", href: `${SHOP}/categories/stocking-stuffers` },
      { name: "Wooden train sets", href: `${SHOP}/categories/wooden-train-sets` },
      { name: "Gift sets for women", href: `${SHOP}/categories/gift-sets-for-women` },
      { name: "Elf kits", href: `${SHOP}/categories/elf-kits` },
    ],
    utm: "christmas-2026",
    until: "2026-12-24T23:59:00-05:00",
    then: "planners-2027",
  },
  "planners-2027": {
    href: `${SHOP}/categories/planners`,
    kicker: "2027 planners",
    title: "2027 planners compared by size, paper and dates",
    text: "More than 600 planners for 2027: daily, weekly and monthly layouts, with the page size, paper weight and the months each one covers, read from the listing.",
    cta: "See 2027 planners",
    items: [
      { name: "Weekly planners", href: `${SHOP}/categories/weekly-planners` },
      { name: "Daily planners", href: `${SHOP}/categories/daily-planners` },
      { name: "Monthly planners", href: `${SHOP}/categories/monthly-planners` },
      { name: "2027 wall calendars", href: `${SHOP}/categories/wall-calendars` },
    ],
    utm: "planners-2027",
    until: "2027-01-31T23:59:00-05:00",
  },
} satisfies Record<string, ShopCampaign>;

export type ShopCampaignId = keyof typeof SHOP_CAMPAIGNS;
export const SHOP_CAMPAIGN_IDS = Object.keys(SHOP_CAMPAIGNS) as [ShopCampaignId, ...ShopCampaignId[]];

/** The campaign a story shows, or null when it has none or the campaign has ended. */
export function shopCampaign(id: string | undefined, now = new Date()): ShopCampaign | null {
  const all = SHOP_CAMPAIGNS as Record<string, ShopCampaign>;
  // Follow the handover chain to the first campaign still running (at most a few steps).
  for (let c = id ? all[id] : undefined, n = 0; c && n < 5; c = c.then ? all[c.then] : undefined, n++) {
    if (now <= new Date(c.until)) return c;
  }
  return null;
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
