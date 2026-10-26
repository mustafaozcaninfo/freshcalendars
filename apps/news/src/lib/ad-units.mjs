/**
 * Fresh_News AdSense units, in plain JS so astro.config.mjs (the in-article rehype plugin) and
 * src/lib/ads.ts share one copy. The publisher ID matches ADSENSE_CLIENT in site-chrome.
 */
export const NEWS_AD_CLIENT = "ca-pub-2597035827677267";
export const NEWS_AD_UNITS = {
  1: "1955017321", // Fresh_News_1: in-article, before the third prose section · home after "Coming up"
  2: "2717259646", // Fresh_News_2: after the story and printables · listings mid-list
  3: "3950625273", // Fresh_News_3: wide-screen article sidebar · home mid-sections · printables mid-page
  4: "1404177977", // Fresh_News_4: after FAQ and sources
  5: "7542210911", // Fresh_News_5: end of page, above the footer
  6: "8981385284", // Fresh_News_Top: top of every page, under the breadcrumb
};
export const ADS_ENABLED = process.env.NEWS_ADS !== "0";

/** Stories with this many H2 sections or more get three sidebar rail segments (ArticleAside). */
export const LONG_STORY_H2 = 7;

/**
 * In-article spacing, in words of story text. In-body units are where readers' eyes already are,
 * so they earn the best click-through, but only when each one sits between full sections with
 * real reading on both sides: at least ~250 words apart, so two units never share a phone screen.
 * Below-the-fold units are requested this far ahead of the viewport (see ADS_LOADER_JS).
 */
export const NEWS_AD_RULES = {
  minSections: 4, // stories with fewer H2 sections get no in-article unit
  wordsBetween: 250, // story words between two in-article units (about one phone screen)
  wordsAfter: 100, // story words left after the last in-article unit
  maxInBody: 2, // Fresh_News_1, then Fresh_News_5 (moved up from the end of the page)
  maxInBodyElections: 1, // election stories: one unit, never inside ballot or results sections
  lazyMargin: "200%", // request a unit when it is two screens from view
};

/** An H2 that opens a spoiler section ("Monday's answers ... (spoilers)"). */
const SPOILER_H2 = /\bspoilers?\b/i;

/**
 * Rehype plugin: in-article units at H2 boundaries. The first goes before the third H2 (the
 * centerpiece rule: lede, hero, key points and the first two sections stay unbroken), the second
 * before the first later H2 that has wordsBetween words above it and wordsAfter words below.
 * Never inside a spoiler section, so an ad never sits between puzzle answers (one right before the
 * spoiler heading is fine: a pause before the answers). Records the count in the story's
 * remarkPluginFrontmatter.adsInBody so the page can drop its end-of-page unit.
 */
export function rehypeMidArticleAd() {
  return (tree, file) => {
    // Stories only: policy pages in src/content/policies stay ad-free.
    if (!ADS_ENABLED || !/[\\/]content[\\/]articles[\\/]/.test(file?.path ?? file?.history?.[0] ?? "")) return;
    const fm = file.data?.astro?.frontmatter;
    const kids = tree.children;
    const h2 = kids.map((n, i) => (n.type === "element" && n.tagName === "h2" ? i : -1)).filter((i) => i >= 0);
    if (h2.length < NEWS_AD_RULES.minSections) return;
    const max = fm?.category === "elections" ? NEWS_AD_RULES.maxInBodyElections : NEWS_AD_RULES.maxInBody;
    // Running word count before each top-level node.
    const at = [0];
    kids.forEach((n, i) => { at[i + 1] = at[i] + words(n); });
    const total = at[kids.length];
    const spoiler = h2.map((i) => SPOILER_H2.test(text(kids[i])));
    const picks = [];
    for (let k = 2; k < h2.length && picks.length < max; k++) {
      if (spoiler[k - 1]) continue; // the ad would follow answers inside a spoiler section
      if (clickable(near(kids, h2[k], -1)) || clickable(near(kids, h2[k], 1))) continue; // printable or tool next to it
      const prev = picks.length ? at[picks.at(-1)] : 0;
      if (picks.length && at[h2[k]] - prev < NEWS_AD_RULES.wordsBetween) continue;
      if (total - at[h2[k]] < NEWS_AD_RULES.wordsAfter) break;
      picks.push(h2[k]);
    }
    // Insert from the bottom so earlier indexes stay valid.
    picks.map((i, n) => [i, n === 0 ? NEWS_AD_UNITS[1] : NEWS_AD_UNITS[5]]).reverse()
      .forEach(([i, slot]) => kids.splice(i, 0, midAd(slot)));
    if (fm) fm.adsInBody = picks.length;
  };
}

/** The nearest non-blank node before (dir -1) or after the heading at index i (dir 1, skipping it). */
function near(kids, i, dir) {
  for (let j = i + dir; j >= 0 && j < kids.length; j += dir) if (kids[j].type !== "text" || kids[j].value.trim()) return kids[j];
  return null;
}

/** Download links, printable thumbnails and story tools: an ad beside them invites accidental
 * clicks and reads as one more download (Google ad placement policy). */
function clickable(n) {
  if (!n) return false;
  if (n.type === "raw") return /class="(tpl|tool-box)|<form|<button|\.pdf"/.test(n.value);
  if (n.type !== "element") return false;
  const cls = [].concat(n.properties?.className ?? []);
  if (/^(form|button)$/.test(n.tagName) || cls.includes("tpl") || cls.includes("tool-box")) return true;
  if (/\.pdf$|\/downloads\//.test(String(n.properties?.href ?? ""))) return true;
  return (n.children ?? []).some(clickable);
}

function text(n) {
  if (n.type === "text") return n.value;
  if (n.type === "raw") return n.value.replace(/<[^>]*>/g, " ");
  return (n.children ?? []).map(text).join(" ");
}

function words(n) {
  return (text(n).match(/\S+/g) ?? []).length;
}

function midAd(slot) {
  return {
    type: "element",
    tagName: "aside",
    properties: { className: ["ad-slot", "ad-slot--wide", "ad-slot--mid"], ariaLabel: "Advertisement" },
    children: [{
      type: "element",
      tagName: "ins",
      properties: {
        className: ["adsbygoogle"],
        style: "display:block",
        dataAdClient: NEWS_AD_CLIENT,
        dataAdSlot: slot,
        dataAdFormat: "auto",
        dataFullWidthResponsive: "true",
      },
      children: [],
    }],
  };
}
