/**
 * Shared Fresh Calendars chrome — tokens, fonts, header/footer, nav + AdSense loaders.
 * Single source for the calendar generator (`packages/generator`) and the news app (`apps/news`).
 */
import { SITE_NAME, THEME_COLOR, resolvePlanningYear } from "@freshcalendars/engine";

const BLUE = "#007bff";

export function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Fresh Calendars AdSense — publisher + slots from legacy `backup/public_html/config.php`
 * and `rightmenu.php`. Do NOT reuse ItsCalendar slot IDs.
 */
export const ADSENSE_CLIENT = "ca-pub-2597035827677267";
export const ADS = {
  /** rightmenu.php sticker */
  sidebar: "6770670949",
  /** $ads_new_index */
  homeTop: "1841994350",
  /** $ads_middle FreshCalendars_Middle */
  homeMid: "3908808396",
  /** $ads_new_month_header */
  monthTop: "4642459656",
  /** $ads_new_month_footer */
  monthMid: "3497359365",
  /** $ads_new_year */
  yearTop: "9783105692",
  /** $ads_year_middle */
  yearMid: "6155697786",
  /** $ads_new_blank */
  blankTop: "3848252738",
  /** $ads_new_blank_middle */
  blankMid: "2986311794",
  /** $ads_middle_inarticle */
  inArticle: "1984071374",
  /** $ads_new_holidays */
  holiday: "3705740360",
  /** $ads_middle_footer */
  footer: "5772554403",
  /** $ads_header_fresh / gallery — responsive 300×250 → 728×90 */
  headerUnit: "7115858299",
} as const;

export type AdVariant = "auto" | "banner" | "sidebar" | "header";

export function adUnit(slot: string, label: string, variant: AdVariant = "auto"): string {
  const cls =
    variant === "banner"
      ? "ads ad-unit ad-unit--banner"
      : variant === "sidebar"
        ? "ads ad-unit ad-unit--sidebar"
        : variant === "header"
          ? "ads ad-unit ad-unit--header"
          : "ads ad-unit";
  const formatAttrs =
    variant === "header"
      ? ""
      : variant === "sidebar"
        ? `data-ad-format="auto"\n       data-full-width-responsive="true"`
        : `data-ad-format="auto"\n       data-full-width-responsive="true"`;
  const sizeClass =
    variant === "header"
      ? " FreshCalendars_Header_New_Unit"
      : variant === "sidebar"
        ? " FreshCalendars_Sidebar"
        : "";
  return `
<aside class="${cls}" aria-label="Advertisement">
  <ins class="adsbygoogle${sizeClass}"
       style="display:block"
       data-ad-client="${ADSENSE_CLIENT}"
       data-ad-slot="${esc(slot)}"
       ${formatAttrs}
       data-ad-label="${esc(label)}"></ins>
</aside>`;
}

/** Full-width band under hero / above footer — legacy `.ads` centered band. */
export function adBand(slot: string, label: string, variant: AdVariant = "banner"): string {
  return `<div class="wrap ad-band">${adUnit(slot, label, variant)}</div>`;
}

/** Load AdSense after window load (LCP-safe). Manual units only (Auto top off in dashboard). */
export const ADSENSE_JS = `
(function(){
  var booted=false;
  function pushPending(){
    var nodes=document.querySelectorAll('.ad-unit ins.adsbygoogle:not([data-adsbygoogle-status])');
    if(!nodes.length) return;
    window.adsbygoogle=window.adsbygoogle||[];
    for(var i=0;i<nodes.length;i++){
      try{ window.adsbygoogle.push({}); }
      catch(e){}
    }
  }
  function boot(){
    if(booted) return;
    booted=true;
    var existing=document.querySelector('script[src*="adsbygoogle.js"]');
    if(existing){
      pushPending();
      return;
    }
    var s=document.createElement('script');
    s.async=true;
    /* No ?client= — avoids enabling account Auto ads from the script tag alone */
    s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    s.crossOrigin='anonymous';
    s.onload=pushPending;
    document.head.appendChild(s);
  }
  function schedule(){
    if('requestIdleCallback' in window) window.requestIdleCallback(boot,{timeout:2000});
    else setTimeout(boot,900);
  }
  if(document.readyState==='complete') schedule();
  else window.addEventListener('load',schedule);
})();
`;

/**
 * Critical webfonts — inlined + preloaded.
 * `optional` avoids late-swap CLS (PSI culprit: display font on monthly hero).
 * Fallback faces use size/metric overrides so Arial/Georgia match webfont boxes.
 */
export const FONTS_CSS = `
@font-face{font-family:"Sora Fallback";src:local("Arial Bold"),local("Arial");size-adjust:98%;ascent-override:92%;descent-override:22%;line-gap-override:0%}
@font-face{font-family:"Manrope Fallback";src:local("Arial"),local("Helvetica Neue");size-adjust:100%;ascent-override:95%;descent-override:24%;line-gap-override:0%}
@font-face{font-family:"Source Sans 3 Fallback";src:local("Arial");size-adjust:100%;ascent-override:92%;descent-override:24%;line-gap-override:0%}
@font-face{font-family:Sora;font-style:normal;font-weight:700;font-display:optional;src:url("/fonts/sora-latin-700-normal.woff2") format("woff2")}
@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:optional;src:url("/fonts/manrope-latin-400-normal.woff2") format("woff2")}
@font-face{font-family:Manrope;font-style:normal;font-weight:700;font-display:optional;src:url("/fonts/manrope-latin-700-normal.woff2") format("woff2")}
@font-face{font-family:"Source Sans 3";font-style:normal;font-weight:400;font-display:optional;src:url("/fonts/source-sans-3-latin-400-normal.woff2") format("woff2")}
@font-face{font-family:"Source Sans 3";font-style:normal;font-weight:700;font-display:optional;src:url("/fonts/source-sans-3-latin-700-normal.woff2") format("woff2")}
`;

export const FONT_PRELOAD = `
<link rel="preload" as="font" type="font/woff2" href="/fonts/sora-latin-700-normal.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-latin-400-normal.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/fonts/manrope-latin-700-normal.woff2" crossorigin />
`;

export const CSS = `
:root{
  /* Tokens from legacy css/app.css — Fresh, not ItsCalendar */
  --ink:#37474f;
  --ink-strong:#2e2f2f;
  --paper:#ffffff;
  --panel:#ffffff;
  --wash:#e0e0e0;
  --accent:#007bff;
  --gold:#fccc00;
  --gold-soft:#f5cc3e;
  --cyan:#0092d1;
  --red:#ec1d00;
  --muted:#777777;
  --line:#cccccc;
  --line-soft:#dddddd;
  --footer:#37474f;
  --yearly-ink:#0b3d66;
  --yearly-accent:#007bff;
  --monthly-ink:#1c2430;
  --monthly-accent:#0092d1;
  --blank-ink:#2a3439;
  --blank-accent:#5a6b75;
  --home-accent:#007bff;
  --home-fg:#ffffff;
  --home-muted:#e8eef3;
  --home-eyebrow:#fccc00;
  --focus:#004a7f;
  --danger:#ec1d00;
  --btn-on-dark:#ffffff;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth; overflow-x:clip}
html.nav-open,html.nav-open body{overflow:hidden}
html,body{margin:0;padding:0}
body{
  font-family:Manrope,"Manrope Fallback","Source Sans 3",ui-sans-serif,system-ui,sans-serif; color:var(--muted);
  background:var(--wash);
  line-height:1.6;
  -webkit-text-size-adjust:100%;
  text-size-adjust:100%;
  overflow-x:clip;
  padding-left:env(safe-area-inset-left,0);
  padding-right:env(safe-area-inset-right,0);
  padding-bottom:calc(96px + env(safe-area-inset-bottom,0px));
  -webkit-tap-highlight-color:rgba(0,123,255,.12);
  min-height:100dvh; display:flex; flex-direction:column;
}
#main{
  background:var(--paper);
  box-shadow:0 1px 0 rgba(0,0,0,.04);
  flex:1 0 auto; width:100%;
}
img,svg{max-width:100%; height:auto; display:block}
a{color:inherit}
:focus-visible{
  outline:3px solid var(--focus); outline-offset:2px;
}
.wrap{
  width:min(1180px,calc(100% - 2rem));
  margin:0 auto;
  padding-left:max(0px, env(safe-area-inset-left,0px));
  padding-right:max(0px, env(safe-area-inset-right,0px));
}
.site-header-bar{
  background:var(--accent);
  border-bottom:4px solid var(--gold);
  position:sticky; top:0; z-index:60;
  box-shadow:0 2px 12px rgba(0,74,127,.18);
  flex:0 0 auto;
}
.site-header{
  display:flex; justify-content:space-between; align-items:center; gap:.75rem;
  padding:.55rem 0;
  min-height:56px;
  position:relative; z-index:60;
  background:transparent;
}
.brand{
  text-decoration:none; min-height:44px; display:inline-flex; align-items:center; flex:0 1 auto; min-width:0;
}
.brand img{
  height:clamp(32px, 5.5vw, 44px); width:auto; display:block;
}
.brand-text{
  font-family:Sora,"Sora Fallback",Manrope,sans-serif; font-size:clamp(1.15rem,3.2vw,1.45rem); font-weight:700;
  letter-spacing:-.03em; color:#fff; text-transform:lowercase;
}
.nav-drawer{position:relative; margin-left:auto; flex:0 0 auto; align-self:center; z-index:61}
.nav-toggle{
  list-style:none; cursor:pointer; font-weight:700; color:#fff;
  min-height:44px; min-width:44px; display:inline-flex; align-items:center; justify-content:center; gap:.45rem;
  padding:0 .75rem; border:2px solid rgba(255,255,255,.85); border-radius:4px; background:transparent;
  touch-action:manipulation; user-select:none; -webkit-user-select:none;
}
.nav-toggle::-webkit-details-marker{display:none}
.nav-toggle-bars{
  width:1.1rem; height:.75rem; display:inline-grid; gap:3px; align-content:center;
}
.nav-toggle-bars i{
  display:block; height:2px; background:#fff; border-radius:1px;
}
.nav-toggle-label{font-size:.9rem; letter-spacing:.02em}
.nav-drawer[open] .nav-toggle-label{display:none}
.nav-drawer[open] .nav-toggle::after{content:"Close"; font-size:.9rem}
.nav-drawer[open]::before{
  content:""; position:fixed; inset:0; z-index:62;
  background:rgba(10,16,22,.42);
}
.nav{
  display:none; position:fixed; z-index:63;
  top:max(4.25rem, calc(env(safe-area-inset-top) + 3.5rem)); right:max(.75rem, env(safe-area-inset-right));
  width:min(20rem, calc(100vw - 1.5rem));
  max-height:min(70dvh, calc(100dvh - 5rem));
  overflow:auto; -webkit-overflow-scrolling:touch;
  flex-direction:column; gap:0; flex-wrap:nowrap;
  background:var(--panel); border:1px solid var(--line);
  padding:.4rem; box-shadow:0 20px 50px rgba(0,74,127,.28);
  font-size:.95rem; border-radius:6px;
}
.nav-drawer[open] .nav{display:flex}
.nav a{
  text-decoration:none; color:var(--ink); font-weight:700;
  min-height:48px; display:inline-flex; align-items:center; width:100%;
  padding:.7rem .9rem; border-radius:4px;
  touch-action:manipulation;
}
.nav a:hover,.nav a:focus-visible{background:rgba(0,123,255,.1); color:var(--accent)}
.hero{
  min-height:auto; display:grid; align-content:start; gap:1rem;
  padding:clamp(1.1rem,3.5vw,3.25rem) 0 clamp(1rem,3vw,2.25rem); position:relative;
}
.family-home .hero{
  background:
    linear-gradient(125deg, #004a7f 0%, #007bff 52%, #0092d1 100%);
  color:var(--home-fg); min-height:auto; padding:clamp(1.5rem,5vw,3.25rem) 0 clamp(1.25rem,4vw,2.25rem);
  border-bottom:4px solid var(--gold);
}
.family-yearly .hero{background:linear-gradient(165deg,#e8f1fa,#c5d8e4 70%); color:var(--yearly-ink)}
.family-monthly .hero{background:linear-gradient(180deg,#eef6fb,#d4e8f4); color:var(--monthly-ink)}
.family-blank .hero{background:linear-gradient(160deg,#f2f4f6,#dce3e8); color:var(--blank-ink)}
.family-default .hero{background:linear-gradient(160deg,#ffffff,#e8eef3); color:var(--ink)}
.hero-inner{width:min(1180px,calc(100% - 2rem)); margin:0 auto; display:grid; gap:1.1rem; min-width:0; max-width:100%}
.hero-inner > *{min-width:0; max-width:100%}
.family-home .hero-inner{max-width:720px; margin-left:auto; margin-right:auto; text-align:left}
.eyebrow{letter-spacing:.16em; text-transform:uppercase; font-size:.8rem; font-weight:700}
.family-home .hero .eyebrow{color:var(--home-eyebrow)}
.family-yearly .hero .eyebrow{color:var(--yearly-accent)}
.family-monthly .hero .eyebrow{color:var(--monthly-accent)}
.family-blank .hero .eyebrow{color:var(--blank-accent)}
h1{
  font-family:Sora,"Sora Fallback",Manrope,sans-serif; font-size:clamp(2.1rem,6vw,4.2rem);
  line-height:1.12; text-wrap:balance; margin:0; max-width:16ch; font-weight:700;
}
.family-home .hero h1{max-width:18ch; color:var(--btn-on-dark)}
.lead{max-width:44ch; font-size:clamp(1.02rem,2.4vw,1.12rem); color:var(--muted); margin:0}
.family-home .hero .lead{color:var(--home-muted); max-width:48ch}
.family-home .hero a:not(.btn){color:var(--gold-soft); font-weight:700; text-decoration:underline; text-underline-offset:3px}
.family-home .hero a:not(.btn):hover{color:#fff}
.cta{display:flex; flex-direction:row; flex-wrap:wrap; gap:.65rem; margin-top:.35rem}
/* Mobile-first: each CTA on its own row (avoid column+wrap — wraps sideways in grid tracks) */
.cta .btn{flex:1 1 100%; max-width:100%; text-align:center; min-width:0; box-sizing:border-box}
.btn{
  appearance:none; border:2px solid transparent; text-decoration:none; display:inline-flex; align-items:center; justify-content:center;
  min-height:44px; padding:.75rem 1.2rem; border-radius:4px; font-weight:700;
  transition:transform .15s ease, filter .15s ease; cursor:pointer;
  touch-action:manipulation; max-width:100%;
}
.btn:active{transform:scale(.98)}
.btn:hover{filter:brightness(1.06)}
.btn:focus-visible{outline:3px solid var(--focus); outline-offset:2px}
.btn-primary{background:var(--cyan); color:var(--ink); border-color:var(--cyan)}
.family-home .hero .btn-primary{background:var(--gold-soft); color:var(--ink); border-color:var(--gold-soft)}
.family-yearly .hero .btn-primary{background:var(--accent); color:var(--btn-on-dark); border-color:var(--accent)}
.family-monthly .hero .btn-primary{background:var(--cyan); color:var(--btn-on-dark); border-color:var(--cyan)}
.family-blank .hero .btn-primary{background:var(--blank-accent); color:var(--btn-on-dark); border-color:var(--blank-accent)}
.btn-ghost{
  background:var(--panel); border:2px solid var(--accent); color:var(--accent);
}
.family-home .hero .btn-ghost{
  background:rgba(0,74,127,.35); border-color:var(--home-fg); color:var(--home-fg);
}
.family-yearly .hero .btn-ghost{
  background:rgba(255,255,255,.78); border-color:var(--yearly-ink); color:var(--yearly-ink);
}
.family-monthly .hero .btn-ghost{
  background:rgba(255,255,255,.78); border-color:var(--monthly-ink); color:var(--monthly-ink);
}
.family-blank .hero .btn-ghost{
  background:rgba(255,255,255,.78); border-color:var(--blank-ink); color:var(--blank-ink);
}
.btn-sm{min-height:44px; padding:.65rem 1rem; font-size:.95rem}
.hero-visual-section{padding:0 0 clamp(1.5rem,4vw,2.25rem)}
.hero-visual{
  margin:0; overflow:hidden;
  box-shadow:0 24px 60px rgba(0,74,127,.18);
  max-width:min(540px,100%);
  /* Reserve preview box before image/fonts settle (preview 540×697) */
  aspect-ratio:540 / 697;
  background:var(--panel);
}
.hero-visual a.img-link{height:100%}
.hero-visual img,.hero-visual a.img-link img{display:block; width:100%; height:100%; object-fit:contain; background:var(--panel)}
@keyframes fadein{from{opacity:0} to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important; transition:none!important}
}
.section{padding:clamp(1.75rem,4vw,2.75rem) 0; border-top:1px solid var(--line-soft)}
.section h2{font-family:Sora,"Sora Fallback",Manrope,sans-serif; font-size:clamp(1.5rem,3.5vw,1.85rem); margin:0 0 .85rem; color:var(--ink); line-height:1.2; letter-spacing:-.02em}
.section h3{font-family:Sora,"Sora Fallback",Manrope,sans-serif; font-size:1.15rem; margin:1.4rem 0 .55rem; color:var(--accent); line-height:1.25; font-weight:700}
.prose p{max-width:68ch; color:var(--ink); margin:0 0 1rem}
.prose ul{max-width:68ch; padding-left:1.2rem; margin:0 0 1rem; color:var(--ink)}
.prose li{margin:.35rem 0}
.prose a{color:var(--accent); font-weight:700; text-decoration-thickness:1px; text-underline-offset:2px}
.prose a:hover{color:var(--ink)}
/* Buttons inside .prose must keep button colors — .prose a is more specific than .btn-* */
.prose a.btn{text-decoration:none; font-weight:700}
.prose a.btn-primary,
.prose a.btn-primary:hover{
  color:var(--ink); background:var(--cyan); border-color:var(--cyan);
}
.prose a.btn-ghost,
.prose a.btn-ghost:hover{
  color:var(--accent); background:var(--panel); border-color:var(--accent);
}
.family-home .hero .prose a.btn-primary,
.family-home .hero .prose a.btn-primary:hover{
  color:var(--ink); background:var(--gold-soft); border-color:var(--gold-soft);
}
.family-home .hero .prose a.btn-ghost,
.family-home .hero .prose a.btn-ghost:hover{
  color:var(--home-fg); background:rgba(0,74,127,.35); border-color:var(--home-fg);
}
.family-yearly .hero .prose a.btn-primary,
.family-yearly .hero .prose a.btn-primary:hover{
  color:var(--btn-on-dark); background:var(--yearly-accent); border-color:var(--yearly-accent);
}
.family-yearly .hero .prose a.btn-ghost,
.family-yearly .hero .prose a.btn-ghost:hover{
  color:var(--yearly-ink); background:rgba(255,255,255,.78); border-color:var(--yearly-ink);
}
.family-monthly .hero .prose a.btn-primary,
.family-monthly .hero .prose a.btn-primary:hover{
  color:var(--btn-on-dark); background:var(--monthly-accent); border-color:var(--monthly-accent);
}
.family-monthly .hero .prose a.btn-ghost,
.family-monthly .hero .prose a.btn-ghost:hover{
  color:var(--monthly-ink); background:rgba(255,255,255,.78); border-color:var(--monthly-ink);
}
.family-blank .hero .prose a.btn-primary,
.family-blank .hero .prose a.btn-primary:hover{
  color:var(--btn-on-dark); background:var(--blank-accent); border-color:var(--blank-accent);
}
.family-blank .hero .prose a.btn-ghost,
.family-blank .hero .prose a.btn-ghost:hover{
  color:var(--blank-ink); background:rgba(255,255,255,.78); border-color:var(--blank-ink);
}
.prose code{
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:.9em;
  background:rgba(20,33,43,.06); padding:.1em .35em; border-radius:3px;
}
.legal-doc h2{margin-top:1.75rem}
.legal-doc h3{font-size:1.05rem; margin-top:1.1rem}
.today-card{font-size:.95rem}
.today-card strong{display:block; font-size:1.05rem; margin:.15rem 0 .35rem}
.week-print{
  display:grid; grid-template-columns:1fr; gap:1px;
  border:1px solid var(--line); background:var(--line); margin:1rem 0 1.5rem;
  width:100%; max-width:100%;
}
.week-print .day{
  background:var(--panel); min-height:0; padding:.65rem .75rem;
  display:grid; grid-template-columns:4.25rem minmax(0,1fr); gap:.65rem; align-items:start;
  min-width:0;
}
.week-print .dow{font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); grid-column:1; align-self:end}
.week-print .dom{font-family:Sora,"Sora Fallback",Manrope,sans-serif; font-size:1.35rem; font-weight:700; grid-column:1; line-height:1}
.week-print .lines{border-top:0; border-left:1px dashed var(--line); min-height:3.25rem; padding-left:.75rem; grid-column:2; grid-row:1 / span 2}
.school-months{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.65rem; margin:1rem 0}
.school-months a{
  text-decoration:none; border:1px solid var(--line); background:var(--panel);
  padding:.75rem .85rem; font-weight:700; min-height:44px; display:flex; align-items:center;
}
.school-months a:hover{border-color:var(--ink)}
@media print{
  .site-header-bar,.site-footer-bar,.site-header,.site-footer,.sidebar,.ad-unit,.cta,.nav,.nav-drawer,.faq,.google-auto-placed{display:none!important}
  body{padding-bottom:0!important; display:block}
  .week-print{break-inside:avoid}
  .hero{min-height:auto!important; padding:0 0 1rem; background:#fff!important; color:#000!important}
}
.month-chips{display:flex; flex-wrap:wrap; gap:.5rem}
.month-chips a{
  text-decoration:none; min-height:44px; display:inline-flex; align-items:center;
  padding:.45rem .75rem; border:1px solid var(--line);
  font-size:.9rem; font-weight:700; color:var(--ink); background:var(--panel);
  transition:background .15s ease, border-color .15s ease;
  touch-action:manipulation;
}
.month-chips a:hover,.month-chips a.is-current{border-color:var(--ink); background:#fff}
.faq details{border-top:1px solid var(--line-soft); padding:.85rem 0}
.faq summary{cursor:pointer; font-weight:700; min-height:44px; display:flex; align-items:center; color:var(--ink)}
.faq details p{color:var(--ink)}
.site-footer-bar{
  flex:0 0 auto; width:100%;
  background:var(--footer); color:#ccc;
  border-top:10px solid var(--gold);
  margin-top:auto;
}
.site-footer{
  padding:1.35rem 0 max(1.5rem, calc(1rem + env(safe-area-inset-bottom,0px)));
  font-size:.9rem;
}
.site-footer .footer-copy{margin:0 0 .85rem; max-width:70ch; color:#ccc; line-height:1.45}
.footer-nav{
  display:flex; flex-wrap:wrap; gap:.35rem .85rem; align-items:center;
}
.footer-nav a{
  font-weight:700; color:#f5f3f3; text-decoration:none;
  min-height:36px; display:inline-flex; align-items:center;
  padding:.15rem 0;
}
.footer-nav a:hover,.footer-nav a:focus-visible{color:var(--gold)}
.table-scroll{
  width:100%; max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch;
  overscroll-behavior-x:contain; border:1px solid var(--line-soft); border-radius:4px;
}
.table-scroll .hol-table{min-width:32rem; display:table; width:100%}
.hol-table{width:100%; border-collapse:collapse; min-width:0}
.hol-table th,.hol-table td{text-align:left; padding:.75rem .4rem; border-bottom:1px solid var(--line); color:var(--ink)}
.hol-table th{color:#fff; background:var(--accent); font-size:.9rem; font-weight:700}
.hol-table a{color:var(--accent); font-weight:700}
.gallery{display:grid; gap:2rem; min-width:0; width:100%}
.gallery-item{
  display:grid; grid-template-columns:minmax(0,1fr); gap:1.25rem; align-items:center;
  min-width:0;
}
.gallery-visual,.gallery-copy{min-width:0; max-width:100%}
.gallery-item:nth-child(even) .gallery-copy{order:0}
.gallery-visual{
  aspect-ratio:540 / 697;
  background:var(--panel);
  overflow:hidden;
}
.gallery-visual a.img-link{height:100%}
.gallery-visual img,.gallery-visual a.img-link img{
  display:block; width:100%; height:100%; object-fit:contain;
  box-shadow:0 16px 40px rgba(0,74,127,.12);
}
.gallery-copy h3{margin:0 0 .4rem; font-family:Sora,"Sora Fallback",Manrope,sans-serif; font-size:1.4rem; line-height:1.25}
.gallery-copy p{margin:0 0 1rem; color:var(--muted); max-width:40ch}
.facts{display:grid; gap:.5rem; margin:1rem 0 0; padding:0; list-style:none}
.facts li{padding:.55rem 0; border-bottom:1px solid var(--line); max-width:68ch}
.facts strong{display:inline-block; min-width:9ch; color:var(--monthly-accent)}

.content-shell{padding:2.25rem 0 1rem; max-width:100%}
.layout{
  display:grid; grid-template-columns:minmax(0,1fr); gap:clamp(1.25rem,3vw,2.5rem); align-items:start;
  width:100%; max-width:100%;
}
.main{min-width:0; max-width:100%}
.main > .section:first-child{padding-top:0; border-top:0}
.sidebar{position:sticky; top:1rem; display:grid; gap:1rem; min-width:0; max-width:100%}
.side-card{
  background:#f5f5f5; border:0; padding:0 0 .5rem; overflow:hidden;
}
.side-card > h2,.side-card > h3{
  font-family:Sora,"Sora Fallback",Manrope,sans-serif; font-size:.95rem; margin:0 0 .65rem;
  background:var(--accent); color:#fff; padding:.45rem .75rem; letter-spacing:-.02em;
}
.side-card > *:not(h2):not(h3){padding-left:.75rem; padding-right:.75rem}
.side-card > .cta{padding-bottom:.5rem}
.side-card.ad-side{background:transparent; padding:0}
.side-card.ad-side > *{padding:0}
.side-card p{margin:0 0 .75rem; color:var(--muted); font-size:.95rem}
.side-card .month-chips a{font-size:.85rem}
.side-links{display:grid; gap:.15rem}
.side-links a{
  text-decoration:none; font-weight:700; font-size:.9rem; color:var(--accent);
  min-height:40px; display:flex; align-items:center; padding:.2rem 0;
  touch-action:manipulation;
}
.side-links a:hover{color:var(--ink-strong)}

.showcase{
  display:grid; grid-template-columns:1fr; gap:1.25rem;
  min-width:0; width:100%;
}
.showcase-card{
  background:var(--panel); border:1px solid var(--line); overflow:hidden;
  min-width:0;
}
.showcase-card a.visual,.showcase-card .visual{display:block; min-width:0; max-width:100%; aspect-ratio:540 / 697; background:var(--panel)}
.showcase-card .visual a.img-link{height:100%}
.showcase-card img,.showcase-card .visual a.img-link img{display:block; width:100%; max-width:100%; height:100%; object-fit:contain; background:var(--panel)}
.showcase-card .meta{padding:1rem 1.1rem 1.15rem}
.showcase-card .meta .label{
  letter-spacing:.12em; text-transform:uppercase; font-size:.78rem; font-weight:700; color:var(--accent);
}
.showcase-card h3{font-family:Sora,"Sora Fallback",Manrope,sans-serif; margin:.35rem 0 .5rem; font-size:clamp(1.25rem,3vw,1.45rem); line-height:1.25}
.showcase-card .meta p{color:var(--muted)}
.yearly-band{
  display:grid; grid-template-columns:minmax(0,1fr); gap:1.25rem; align-items:center;
  background:var(--panel); border:1px solid var(--line); padding:clamp(1rem,2.5vw,1.25rem);
  min-width:0; max-width:100%;
}
.yearly-band a.img-link{max-width:100%}
.yearly-band img,.yearly-band a.img-link img{display:block; width:100%; height:auto; aspect-ratio:540 / 697; object-fit:contain; box-shadow:0 14px 36px rgba(0,74,127,.12); background:var(--panel)}
.feature-list{display:grid; gap:.65rem; margin:1rem 0 0; padding:0; list-style:none; max-width:60ch}
.feature-list li{
  padding:.7rem .85rem; border-left:3px solid var(--accent); background:rgba(0,123,255,.06);
}
a.img-link{display:block; text-decoration:none; color:inherit; max-width:100%}
a.img-link img{display:block; width:100%; height:auto}
a.zoomable,img.zoomable{cursor:zoom-in}
.lightbox{
  position:fixed; inset:0; z-index:80; display:none; align-items:center; justify-content:center;
  background:rgba(10,16,22,.9);
  padding:max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
  cursor:zoom-out;
}
.lightbox.is-open{display:flex}
.lightbox img{
  max-width:min(1100px,100%); max-height:min(92vh,100%); width:auto; height:auto;
  box-shadow:0 24px 80px rgba(0,0,0,.45); background:#fff; cursor:default;
}
.lightbox-close{
  position:absolute; top:max(.75rem, env(safe-area-inset-top)); right:max(.75rem, env(safe-area-inset-right));
  border:2px solid var(--ink); background:var(--panel); color:var(--ink);
  font-weight:700; min-height:44px; padding:.55rem .95rem; cursor:pointer; border-radius:4px;
  touch-action:manipulation;
}
.contact-form{
  display:grid; gap:1rem; max-width:34rem; margin:1.25rem 0 0;
}
.contact-form label{display:grid; gap:.35rem; font-weight:700; font-size:.95rem}
.contact-form input,.contact-form textarea,.contact-form select{
  font:inherit; font-size:16px; padding:.75rem .85rem; border:1px solid var(--line); background:#fff;
  border-radius:4px; color:var(--ink); min-height:44px; width:100%; max-width:100%;
}
.contact-form textarea{min-height:140px; resize:vertical}
.contact-form .hp{position:absolute; left:-9999px; opacity:0; height:0; width:0; overflow:hidden}
.contact-form .form-msg{margin:.25rem 0 0; font-weight:700}
.contact-form .form-msg.ok{color:var(--blank-accent)}
.contact-form .form-msg.err{color:var(--danger)}
.kind-pill{
  display:inline-block; font-size:.75rem; font-weight:700; letter-spacing:.08em;
  text-transform:uppercase; padding:.25rem .5rem; border:1px solid var(--line); color:var(--muted);
  background:var(--panel);
}
/* Legacy .ads — centered, reserved height (config.php size classes) */
.ads,.ad-band{padding-bottom:10px; text-align:center; max-width:100%}
.ad-band{margin:clamp(.5rem,2vw,1rem) auto}
.ad-unit{
  display:grid; place-items:center; margin:.75rem auto;
  min-height:100px; width:100%; max-width:100%;
  background:#f5f5f5; overflow:hidden;
}
.ad-unit ins{width:100%!important; max-width:100%; display:block; margin:0 auto}
.sidebar .ad-unit,.ad-unit--sidebar{margin:.25rem 0 0; min-height:250px; background:#fff}
.ad-unit--banner{min-height:90px; max-width:min(728px,100%); margin-left:auto; margin-right:auto}
.ad-unit--header{min-height:250px; max-width:min(728px,100%)}
.FreshCalendars_Header_New_Unit{width:300px; height:250px; max-width:100%}
@media(min-width:500px){.FreshCalendars_Header_New_Unit{width:336px; height:280px}}
@media(min-width:600px){.FreshCalendars_Header_New_Unit{width:580px; height:400px}}
@media(min-width:800px){.FreshCalendars_Header_New_Unit{width:728px; height:90px; min-height:90px}}
.FreshCalendars_Sidebar{width:100%; min-height:250px}
/*
 * Residual In-page Auto ads (account-level) still inject intermittently and shove <main>.
 * Pin every .google-auto-placed to a fixed bottom strip so they never move in-flow content.
 */
.google-auto-placed{
  position:fixed!important; left:0; right:0; bottom:0; top:auto!important;
  width:100%; max-width:100%!important;
  height:90px!important; min-height:90px!important; max-height:90px!important;
  margin:0!important; z-index:70; overflow:hidden; box-sizing:border-box;
  contain:strict;
}
.google-auto-placed iframe,
ins.adsbygoogle-noablate{
  max-width:100%!important; box-sizing:border-box;
}
ins.adsbygoogle[data-anchor-status],
ins.adsbygoogle[data-ad-status="filled"]{
  max-width:100vw!important;
}
/* ——— Responsive breakpoints (mobile-first base above) ——— */

/* Compact phone: SE / 360–480 */
@media (max-width:480px){
  .wrap,.hero-inner{width:min(calc(100% - 1.25rem),1180px)}
  .site-header{padding:.45rem 0; gap:.5rem; min-height:52px}
  .brand img{height:32px}
  .nav-toggle{padding:0 .55rem}
  .nav-toggle-label{font-size:.85rem}
  .cta{gap:.55rem}
  .hero-visual{max-width:100%}
  h1{font-size:clamp(1.55rem,8vw,2.05rem); max-width:14ch}
  .lead{font-size:1rem; max-width:36ch}
  .section{padding:1.35rem 0}
  .btn{padding:.7rem 1rem}
  .month-chips{gap:.4rem}
  .month-chips a{font-size:.85rem; padding:.4rem .65rem}
  .facts strong{min-width:0}
  .hol-table th,.hol-table td{padding:.6rem .4rem; font-size:.9rem}
  .content-shell{padding:1rem 0 .35rem}
  .footer-nav{gap:.25rem .65rem}
  .site-footer{padding:1.1rem 0 1.25rem}
}

/* Phones + small phablets */
@media (max-width:720px){
  .hero-visual{max-width:min(100%,420px)}
}

/* Short landscape phones — keep hero compact */
@media (max-height:480px) and (orientation:landscape){
  .family-home .hero,.hero{min-height:0!important; padding:.85rem 0 .75rem}
  .hero-visual-section{padding:0 0 1rem}
  h1{font-size:clamp(1.5rem,6vw,2rem)}
}

/* Side-by-side CTAs once there is room */
@media (min-width:721px){
  .cta .btn{flex:0 1 auto; min-width:min(100%,11rem)}
}

/* Tablet portrait / large phones: 2-col content bands */
@media (min-width:641px){
  .showcase{grid-template-columns:repeat(2,minmax(0,1fr)); gap:1.35rem}
  .yearly-band{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr); gap:1.5rem; padding:1.25rem}
  .school-months{grid-template-columns:repeat(3,minmax(0,1fr))}
  .contact-form{max-width:36rem}
}

/* Wide tablet: gallery split + denser school grid */
@media (min-width:768px){
  .gallery-item{
    grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr); gap:1.5rem;
  }
  .gallery-item:nth-child(even){grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}
  .gallery-item:nth-child(even) .gallery-copy{order:-1}
  .school-months{grid-template-columns:repeat(4,minmax(0,1fr))}
  .hero-visual{max-width:min(540px,100%)}
  .hol-table th,.hol-table td{padding:.75rem .55rem}
}

/* Week grid needs real width — 7 columns from ~900 */
@media (min-width:900px){
  .week-print{
    grid-template-columns:repeat(7,minmax(0,1fr)); gap:2px;
  }
  .week-print .day{
    grid-template-columns:1fr; min-height:9rem; padding:.55rem .45rem;
    gap:.35rem; align-content:start;
  }
  .week-print .dow,.week-print .dom,.week-print .lines{
    grid-column:auto; grid-row:auto;
  }
  .week-print .lines{
    border-left:0; border-top:1px dashed var(--line); min-height:5.5rem; padding-left:0;
  }
  .school-months{grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr))}
}

/* Desktop: sidebar layout + inline nav + full home hero */
@media (min-width:1024px){
  .layout{grid-template-columns:minmax(0,1fr) minmax(240px,300px); gap:clamp(1.25rem,3vw,2.5rem)}
  .sidebar{position:sticky; top:calc(4.5rem + env(safe-area-inset-top,0px))}
  .site-header{background:transparent; backdrop-filter:none; min-height:60px}
  .nav-toggle{display:none!important}
  .nav-drawer{width:auto; margin-left:0; flex:1 1 auto; min-width:0}
  .nav-drawer[open]::before{display:none}
  .nav-drawer > .nav,
  .nav-drawer[open] > .nav{
    display:flex!important; position:static; width:auto; max-height:none; overflow:visible;
    flex-direction:row; flex-wrap:wrap; gap:.15rem .55rem; justify-content:flex-end; align-items:center;
    background:transparent; border:0; padding:0; box-shadow:none; border-radius:0;
    font-size:.9rem;
  }
  .nav a{
    width:auto; min-height:40px; padding:.2rem .35rem; border-radius:3px;
    color:rgba(255,255,255,.92); font-weight:700; white-space:nowrap;
  }
  .nav a:hover,.nav a:focus-visible{
    background:rgba(255,255,255,.14); color:#fff;
  }
  .family-home .hero{
    min-height:min(72svh,640px); align-content:center;
    padding:clamp(1.75rem,5vw,3.25rem) 0 clamp(1.35rem,3.5vw,2.25rem);
  }
  .content-shell{padding:clamp(1.5rem,3vw,2.25rem) 0 1rem}
}

/* Wide desktop: keep nav on one row */
@media (min-width:1200px){
  .nav-drawer > .nav,.nav-drawer[open] > .nav{flex-wrap:nowrap; gap:.2rem .65rem; font-size:.92rem}
}

/* Large desktop polish */
@media (min-width:1280px){
  .wrap,.hero-inner{width:min(1180px,calc(100% - 3rem))}
  .showcase{gap:1.5rem}
  .gallery-item{gap:2rem}
}

/* Prefers more contrast — thicken interactive borders */
@media (prefers-contrast:more){
  .btn,.nav-toggle,.month-chips a,.side-card{border-width:2px}
  .nav a:hover,.month-chips a:hover{outline:2px solid var(--ink); outline-offset:1px}
}
`;


export const NAV_JS = `
(function(){
  var drawer=document.querySelector('.nav-drawer');
  if(!drawer) return;
  var toggle=drawer.querySelector('.nav-toggle');
  function sync(){
    var open=drawer.hasAttribute('open');
    if(toggle){
      toggle.setAttribute('aria-expanded', open?'true':'false');
      toggle.setAttribute('aria-label', open?'Close menu':'Open menu');
    }
    document.documentElement.classList.toggle('nav-open', open);
  }
  function close(){ if(drawer.hasAttribute('open')){ drawer.removeAttribute('open'); sync(); } }
  drawer.addEventListener('toggle', sync);
  drawer.addEventListener('click', function(e){
    // Backdrop is ::before on details — clicks land on the details element itself
    if(e.target===drawer) close();
  });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape') close();
  });
  sync();
})();
`;

/**
 * Flip to true when /news/ goes live (NEWS-ROADMAP N9). Turns on the News nav/footer
 * links and the news sitemap/llms entries on the calendar site in one place.
 */
export const NEWS_LAUNCHED = false;

export const NEWS_SITEMAPS = ["/news/sitemap.xml", "/news/news-sitemap.xml"] as const;

export type ChromeOpts = {
  /** Show the News nav/footer links. Off for the calendar site until /news/ launches. */
  news?: boolean;
  /** Marks the matching nav link with aria-current="page". */
  current?: "news";
};

function newsNavLink(opts: ChromeOpts): string {
  if (!opts.news) return "";
  const cur = opts.current === "news" ? ' aria-current="page"' : "";
  return `\n      <a href="/news/" title="Calendar and holiday news"${cur}>News</a>`;
}

export function siteHeaderHtml(today: Date = new Date(), opts: ChromeOpts = {}): string {
  const y = resolvePlanningYear(today);
  const nextY = y + 1;
  return `<div class="site-header-bar">
<header class="wrap site-header">
  <a class="brand" href="/" title="Fresh Calendars home">
    <img src="/img/fresh-logo.png" width="300" height="58" alt="Fresh Calendars" />
  </a>
  <details class="nav-drawer">
    <summary class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">
      <span class="nav-toggle-bars" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="nav-toggle-label">Menu</span>
    </summary>
    <nav id="site-nav" class="nav" aria-label="Primary">
      <a href="/printable-calendars.html" title="${y} printable yearly calendar">Yearly</a>
      <a href="/printable-yearly-calendar.html" title="${nextY} printable yearly calendar">Next year</a>
      <a href="/printable-weekly-calendar.html" title="Printable weekly calendar">Weekly</a>
      <a href="/printable-school-calendar.html" title="Printable school year calendar">School</a>
      <a href="/blank-calendars.html" title="Printable blank calendar">Blank</a>
      <a href="/printable-monday-start-calendar.html" title="Monday-start calendars">Mon-start</a>
      <a href="/holidays/" title="${y} holidays">Holidays</a>${newsNavLink(opts)}
      <a href="/print-guide.html" title="How to print a calendar">Print guide</a>
      <a href="/page/about/" title="About Fresh Calendars">About</a>
      <a href="/page/contact/" title="Contact Fresh Calendars">Contact</a>
    </nav>
  </details>
</header>
</div>`;
}

export function siteFooterHtml(today: Date = new Date(), opts: ChromeOpts = {}): string {
  const y = resolvePlanningYear(today);
  const nextY = y + 1;
  return `<footer class="site-footer-bar">
  <div class="wrap site-footer">
    <p class="footer-copy">© ${today.getFullYear()} Fresh Calendars · Free printable calendars for home, school, and work</p>
    <nav class="footer-nav" aria-label="Footer">
      <a href="/page/about/" title="About Fresh Calendars">About</a>
      <a href="/page/privacy-policy/" title="Privacy Policy">Privacy</a>
      <a href="/page/terms-of-use/" title="Terms of Use">Terms</a>
      <a href="/page/advertising/" title="Advertising">Advertising</a>
      <a href="/printable-calendars.html" title="${y} yearly calendar">${y} yearly</a>
      <a href="/printable-yearly-calendar.html" title="${nextY} yearly calendar">${nextY} yearly</a>
      <a href="/print-guide.html" title="Print guide">Print guide</a>
      <a href="/holidays/" title="US holidays">US holidays</a>
      <a href="/uk-holidays/" title="UK holidays">UK</a>
      <a href="/canada-holidays/" title="Canada holidays">Canada</a>${opts.news ? `\n      <a href="/news/" title="Calendar and holiday news">News</a>\n      <a href="/news/editorial-policy/" title="Fresh Calendars News editorial policy">Editorial policy</a>` : ""}
      <a href="/guides/classroom-printable-calendars.html" title="Classroom guides">Guides</a>
      <a href="/sitemap.xml" title="Sitemap">Sitemap</a>
      <a href="/feed.xml" title="RSS feed">RSS</a>
    </nav>
  </div>
</footer>`;
}

/** HTML head fragment: favicons + Apple + PWA (theme-color stays in SEO meta). */
export function brandHeadLinks(): string {
  return `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="${BLUE}" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="${SITE_NAME}" />
<meta name="application-name" content="${SITE_NAME}" />
<meta name="msapplication-TileColor" content="${THEME_COLOR}" />
<meta name="msapplication-config" content="/browserconfig.xml" />
<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
<link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />`;
}
