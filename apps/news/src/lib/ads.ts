/**
 * AdSense for /news/ only: the five Fresh_News units. The calendar site keeps its own slots in
 * @freshcalendars/site-chrome; these IDs must not be reused there.
 *
 * Placement rules (SEO-HARITASI-TAM.md §01 l.214, l.314, enforced by 01-ADS-CENTER in
 * scripts/news-seo-audit.mjs): nothing above the fold or inside the centerpiece (H1, lede, hero,
 * key points and the first two prose sections), every unit labeled and its height reserved,
 * at most five per page, none on policy pages.
 *
 * Ads are on by default so the VPS cron build matches local builds; NEWS_ADS=0 turns them off.
 * Unit IDs live in ./ad-units.mjs (shared with the in-article rehype plugin).
 */
import { ADS_ENABLED, NEWS_AD_CLIENT, NEWS_AD_UNITS } from "./ad-units.mjs";

export { ADS_ENABLED, NEWS_AD_UNITS };
export const ADSENSE_CLIENT = NEWS_AD_CLIENT;
export type NewsAdUnit = 1 | 2 | 3 | 4 | 5;

/** Hosts AdSense contacts first; preconnected in <head> so the late load costs no handshakes. */
export const AD_ORIGINS = {
  preconnect: ["https://pagead2.googlesyndication.com"],
  dnsPrefetch: ["https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"],
};

/**
 * Loader, appended to the existing nav inline script (the page keeps ≤2 inline scripts and no
 * external <script src>). After window load and an idle slot, it watches each unit and injects
 * adsbygoogle.js the first time one comes within 600px of the viewport, then fills units as they
 * approach. Units hidden by CSS (the sidebar on phones) are never requested. No ?client= on the
 * script, so account-level Auto ads cannot inject unplanned units.
 */
export const ADS_LOADER_JS = `
(function(){
  var slots=[].slice.call(document.querySelectorAll('.ad-slot ins.adsbygoogle'));
  if(!slots.length) return;
  var loaded=false;
  function lib(){
    if(loaded) return; loaded=true;
    var s=document.createElement('script');
    s.async=true; s.crossOrigin='anonymous';
    s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    document.head.appendChild(s);
  }
  function fill(ins){
    if(ins.dataset.pushed||!ins.offsetWidth) return;
    ins.dataset.pushed='1'; lib();
    try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){}
  }
  function start(){
    if(!('IntersectionObserver' in window)){ slots.forEach(fill); return; }
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting&&e.target.offsetWidth){ io.unobserve(e.target); fill(e.target); } });
    },{rootMargin:'600px 0px'});
    slots.forEach(function(ins){ io.observe(ins); });
  }
  function later(){ 'requestIdleCallback' in window ? requestIdleCallback(start,{timeout:1500}) : setTimeout(start,300); }
  document.readyState==='complete' ? later() : addEventListener('load',later);
})();
`;
