/**
 * Google Analytics 4 for /news/ (every page, including policy and 404 pages).
 *
 * The gtag queue is set up at once, so the page_view is recorded even if the reader leaves before
 * the library arrives; gtag.js itself is injected after window load (idle, max 1.5 s), so it never
 * competes with the LCP image or fonts. The snippet rides in the existing nav inline script: pages
 * keep ≤2 inline scripts and no <script src> in the HTML (audit 02-NO-JS-CONTENT, 01-GA-LOAD).
 * NEWS_GA=0 at build time turns it off.
 */
export const GA_ID = "G-VT08H0GXHZ";
export const GA_ENABLED = process.env.NEWS_GA !== "0";
export const GA_ORIGINS = ["https://www.googletagmanager.com", "https://analytics.google.com"];

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
  }
  function later(){ 'requestIdleCallback' in window ? requestIdleCallback(load,{timeout:1500}) : setTimeout(load,200); }
  document.readyState==='complete' ? later() : addEventListener('load',later);
})();
`;
