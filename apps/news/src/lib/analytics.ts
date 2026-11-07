/**
 * Google Analytics 4 for /news/ (every page, including policy and 404 pages).
 *
 * The gtag queue and config are set up at once and sent when gtag.js arrives; the library is
 * injected after window load (idle, max 1.5 s) so it never competes with the LCP image or fonts.
 * Trade-off: a reader who leaves before the page finishes loading is not counted. The snippet rides in the existing nav inline script: pages
 * keep ≤2 inline scripts and no <script src> in the HTML (audit 02-NO-JS-CONTENT, 01-GA-LOAD).
 * NEWS_GA=0 at build time turns it off.
 */
export const GA_ID = "G-VT08H0GXHZ";
export const GA_ENABLED = process.env.NEWS_GA !== "0";
/**
 * Microsoft Clarity (heatmaps, session recordings, rage and dead clicks) for UX and ad placement.
 * The project id is public (it is in every page's source), so it lives here, not in a secret.
 * Empty turns it off. It loads with gtag.js after window load, so it costs no LCP time. No consent
 * signal is sent: in the EEA, UK and Switzerland Clarity then runs without cookies until a
 * consent banner exists (see docs/ANALYTICS.md).
 */
export const CLARITY_ID = "z9rxjv1l0s";
export const GA_ORIGINS = ["https://www.googletagmanager.com", "https://analytics.google.com", ...(CLARITY_ID ? ["https://www.clarity.ms"] : [])];

const CLARITY_LOAD = CLARITY_ID
  ? `window.clarity=window.clarity||function(){(clarity.q=clarity.q||[]).push(arguments)};
    var c=document.createElement('script');
    c.async=true; c.src='https://www.clarity.ms/tag/${CLARITY_ID}';
    document.head.appendChild(c);`
  : "";

export const GA_JS = `
(function(){
  var id='${GA_ID}';
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){dataLayer.push(arguments);};
  gtag('js',new Date());
  gtag('config',id);
  function load(){
    var s=document.createElement('script');
    s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+id;
    document.head.appendChild(s);
    ${CLARITY_LOAD}
  }
  function later(){ 'requestIdleCallback' in window ? requestIdleCallback(load,{timeout:1500}) : setTimeout(load,200); }
  document.readyState==='complete' ? later() : addEventListener('load',later);
})();
`;

/**
 * First-party page-view beacon to /api/pv (cloudflare/worker.js pageView): one POST when the reader
 * leaves or hides the tab, with the path, the referrer host, seconds on the page and the deepest
 * scroll. It is the traffic number to trust: same-origin, so ad blockers let it through, and set
 * up at once in the inline script, so a reader who leaves before gtag.js loads still counts.
 * No cookie or id. NEWS_PV=0 at build time turns it off.
 */
export const PV_ENABLED = process.env.NEWS_PV !== "0";
export const PV_JS = `
(function(){
  if(!navigator.sendBeacon) return;
  var t0=Date.now(),max=0,sent=0;
  function sc(){var h=document.documentElement,b=h.scrollHeight-h.clientHeight,y=window.scrollY||h.scrollTop;var p=b>0?Math.round(100*y/b):100;if(p>max)max=p;}
  addEventListener('scroll',sc,{passive:true});
  function send(){
    if(sent) return; sent=1; sc();
    var r=''; try{ r=document.referrer?new URL(document.referrer).hostname:''; }catch(e){}
    navigator.sendBeacon('/api/pv',JSON.stringify({p:location.pathname,r:r,t:Math.round((Date.now()-t0)/1000),s:Math.min(100,max)}));
  }
  addEventListener('pagehide',send);
  document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden') send(); });
})();
`;
