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
};
export const ADS_ENABLED = process.env.NEWS_ADS !== "0";

/**
 * Rehype plugin: puts Fresh_News_1 before the third H2 of a story, so the centerpiece (lede,
 * hero, key points and the first two sections) is never interrupted. Stories with fewer than
 * four H2 sections get no in-article unit.
 */
export function rehypeMidArticleAd() {
  return (tree, file) => {
    // Stories only: policy pages in src/content/policies stay ad-free.
    if (!ADS_ENABLED || !/[\\/]content[\\/]articles[\\/]/.test(file?.path ?? file?.history?.[0] ?? "")) return;
    const h2 = tree.children.map((n, i) => (n.type === "element" && n.tagName === "h2" ? i : -1)).filter((i) => i >= 0);
    if (h2.length < 4) return;
    tree.children.splice(h2[2], 0, {
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
          dataAdSlot: NEWS_AD_UNITS[1],
          dataAdFormat: "auto",
          dataFullWidthResponsive: "true",
        },
        children: [],
      }],
    });
  };
}
