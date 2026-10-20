/**
 * AdSense for /news/ only: the six Fresh_News units. The calendar site keeps its own slots in
 * @freshcalendars/site-chrome; these IDs must not be reused there.
 *
 * Placement rules (SEO-HARITASI-TAM.md §01 l.214, l.314, enforced by 01-ADS-CENTER in
 * scripts/news-seo-audit.mjs): one labeled top unit under the breadcrumb on every page, nothing else
 * inside the centerpiece (H1, lede, hero, key points and the first two prose sections), every
 * unit labeled and its height reserved, at most six per page, none on policy pages.
 *
 * Ads are on by default so the VPS cron build matches local builds; NEWS_ADS=0 turns them off.
 * Unit IDs live in ./ad-units.mjs (shared with the in-article rehype plugin).
 */
import { ADS_ENABLED, NEWS_AD_CLIENT, NEWS_AD_UNITS } from "./ad-units.mjs";

export { ADS_ENABLED, NEWS_AD_UNITS };
export const ADSENSE_CLIENT = NEWS_AD_CLIENT;
export type NewsAdUnit = 1 | 2 | 3 | 4 | 5 | 6;

/** Hosts AdSense contacts first; preconnected in <head> so the late load costs no handshakes. */
export const AD_ORIGINS = {
  preconnect: ["https://pagead2.googlesyndication.com"],
  dnsPrefetch: ["https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"],
};

/**
 * Loader, appended to the existing nav inline script at the end of <body> (the page keeps ≤2
 * inline scripts and no external <script src>). It injects adsbygoogle.js right away, while the
 * page is still loading, and requests every visible unit at once. Unfilled units collapse only
 * while off screen (no layout shift in view). Units hidden by CSS (the sidebar
 * on phones) are never requested. No ?client= on the script, so account-level Auto ads cannot
 * inject unplanned units.
 */
export const ADS_LOADER_JS = `
(function(){
  var slots=[].slice.call(document.querySelectorAll('.ad-slot ins.adsbygoogle'));
  if(!slots.length) return;
  var s=document.createElement('script');
  s.async=true; s.crossOrigin='anonymous';
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  document.head.appendChild(s);
  window.adsbygoogle=window.adsbygoogle||[];
  slots.forEach(function(ins){
    if(ins.dataset.pushed||!ins.offsetWidth) return;
    ins.dataset.pushed='1';
    try{window.adsbygoogle.push({});}catch(e){}
  });
  // AdSense first sizes a responsive unit to its largest candidate, then shrinks it to the ad it
  // serves; a slot keeps the tallest height it reached, so content below never jumps up.
  if('ResizeObserver' in window){
    var ro=new ResizeObserver(function(es){ es.forEach(function(e){ var s=e.target, h=s.offsetHeight; if(h>(+s.dataset.maxh||0)){ s.dataset.maxh=h; s.style.minHeight=h+'px'; } }); });
    [].forEach.call(document.querySelectorAll('.ad-slot'),function(s){ if(s.offsetWidth) ro.observe(s); });
  }
  // An unfilled unit (not the top one) collapses only while it is off screen, so the story the
  // reader is looking at never moves (scroll anchoring absorbs shifts above the viewport).
  if(!('IntersectionObserver' in window)||!('MutationObserver' in window)) return;
  var off=new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting){ e.target.classList.add('ad-off'); off.unobserve(e.target); } }); });
  var mo=new MutationObserver(function(ms){ ms.forEach(function(m){ var ins=m.target, slot=ins.closest('.ad-slot');
    if(slot&&!slot.classList.contains('ad-slot--top')&&ins.getAttribute('data-ad-status')==='unfilled') off.observe(slot); }); });
  slots.forEach(function(ins){ mo.observe(ins,{attributes:true,attributeFilter:['data-ad-status']}); });
})();
`;
