import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  MONTH_SLUGS,
  allHolidayRules,
  buildMonthGrid,
  getMonthEditorial,
  holidayWhenIsPath,
  holidaysForMonth,
  holidaysForYear,
  usDstFallBack,
  resolveNextHoliday,
  holidaysHubPath,
  holidayLocaleForSlug,
  monthNumberToName,
  monthNumberToSlug,
  monthSlugToNumber,
  monthlyVariantAssetPaths,
  yearlyVariantAssetPaths,
  DEFAULT_MONTHLY_VARIANT,
  DEFAULT_YEARLY_VARIANT,
  resolveHoliday,
  resolveHolidayYear,
  resolveMonthYear,
  resolvePlanningYear,
  sundayWeekRangeLabel,
  sundayWeekStart,
  schoolYearStartYear,
  schoolYearSpanLabel,
  holidayDefBySlug,
  getHolidayEditorial,
  ruleHowCalculated,
  type HolidayLocale,
  type SeoMeta,
  type UrlEntry,
  SITE_ORIGIN,
  absUrl,
  cdnUrl,
} from "@freshcalendars/engine";
import {
  ADS,
  ADSENSE_CLIENT,
  ADSENSE_JS,
  CSS,
  FONTS_CSS,
  FONT_PRELOAD,
  NAV_JS,
  NEWS_LAUNCHED,
  NEWS_SITEMAPS,
  adBand,
  adUnit,
  esc,
  siteFooterHtml,
  siteHeaderHtml,
  pageWorkspaceHtml,
  iconHtml,
  THEME_BOOT_HTML,
} from "@freshcalendars/site-chrome";
import { brandHeadLinks, writeBrandIcons } from "./brandIcons.js";
import { latestNewsHtml, newsStripHtml } from "./newsLinks.js";
import { DIST_SITE, ROOT } from "./paths.js";
import { displayPreview2xUrl, displayPreviewUrl } from "./previews.js";
import { homeConceptHero, homeCalendarShelf, calendarStudio, calendarLibrary, calendarTools } from "./conceptPages.js";

function imgTag(opts: {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  fetchpriority?: "high" | "low" | "auto";
  lightbox?: boolean;
  /** Use full-res for lightbox; show WebP preview in-page when available */
  preview?: boolean;
  /** Wrap in <a href> (defaults to full PNG when lightbox). Fresh legacy pattern. */
  href?: string | false;
}): string {
  const title = opts.title ?? opts.alt;
  const fullSrc = opts.src;
  const usePreview = opts.preview !== false && /\/calendar\.png(\?|$)/.test(fullSrc);
  const displaySrc = usePreview ? displayPreviewUrl(fullSrc) : fullSrc;
  const display2x = usePreview ? displayPreview2xUrl(fullSrc) : "";
  const loading = opts.loading ? ` loading="${opts.loading}"` : "";
  const fp = opts.fetchpriority ? ` fetchpriority="${opts.fetchpriority}"` : "";
  const decoding = opts.fetchpriority === "high" ? ` decoding="sync"` : ` decoding="async"`;
  const w = usePreview ? 540 : opts.width;
  const h = usePreview ? 697 : opts.height;
  const wh = w && h ? ` width="${w}" height="${h}"` : "";
  // Only the LCP candidate gets a 2x srcset; other previews stay 540w so they don't contend.
  const srcset =
    usePreview && opts.fetchpriority === "high"
      ? ` srcset="${esc(displaySrc)} 540w, ${esc(display2x)} 1080w" sizes="(max-width:960px) 92vw, 540px"`
      : "";
  const low = usePreview && opts.fetchpriority !== "high" ? ` fetchpriority="low"` : "";
  const img = `<img src="${esc(displaySrc)}" alt="${esc(opts.alt)}" title="${esc(title)}"${wh}${srcset}${loading}${fp || low}${decoding} />`;
  const linkHref =
    opts.href === false ? undefined : opts.href ?? (opts.lightbox ? fullSrc : undefined);
  if (!linkHref) return img;
  const lbAttrs = opts.lightbox
    ? ` class="zoomable img-link" data-lightbox-src="${esc(fullSrc)}" data-lightbox-alt="${esc(opts.alt)}"`
    : ` class="img-link"`;
  return `<a href="${esc(linkHref)}" title="${esc(title)}"${lbAttrs}>${img}</a>`;
}

function downloadBtn(
  href: string,
  label: string,
  title: string,
  variant: "primary" | "ghost" = "primary",
  size: "" | "sm" = "",
): string {
  const cls = `btn btn-${variant}${size ? ` btn-${size}` : ""}`;
  return `<a class="${cls}" href="${esc(href)}" title="${esc(title)}" download>${esc(label)}</a>`;
}

function familyClass(family: SeoMeta["calendar"]["family"]): string {
  if (family === "home") return "family-home";
  if (family === "yearly") return "family-yearly";
  if (family === "monthly") return "family-monthly";
  if (family === "blank") return "family-blank";
  if (family === "guide") return "family-blank";
  if (family === "holidays" || family === "holiday" || family === "easter") return "family-default";
  return "family-default";
}

function metaTags(meta: SeoMeta, opts: { howTo?: boolean } = {}): string {
  const og = meta.openGraph.images[0]!;
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: meta.breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    // Same @ids as /news/ (apps/news/src/lib/seo.ts) so both sections describe one publisher.
    "@id": "https://freshcalendars.com/#website",
    name: "Fresh Calendars",
    url: "https://freshcalendars.com/",
    publisher: {
      "@type": "Organization",
      "@id": "https://freshcalendars.com/#organization",
      name: "Fresh Calendars",
      legalName: "Fresh Calendars, Inc.",
      email: "info@freshcalendars.com",
      url: "https://freshcalendars.com/",
      address: {
        "@type": "PostalAddress",
        streetAddress: "295 NW Lost Springs Terrace",
        addressLocality: "Portland",
        addressRegion: "OR",
        postalCode: "97229",
        addressCountry: "US",
      },
      logo: {
        "@type": "ImageObject",
        "@id": "https://freshcalendars.com/#logo",
        url: "https://freshcalendars.com/icons/icon-512.png",
        width: 512,
        height: 512,
      },
    },
    // No SearchAction: the site has no search page for it to point at.
  };
  const imageLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: meta.download.png,
    url: meta.download.png,
    name: meta.imageAlts[meta.download.png] ?? meta.title,
    description: meta.description,
    width: 1100,
    height: 1420,
  };
  const howToLd = opts.howTo
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to print a calendar",
        description: meta.description,
        step: [
          { "@type": "HowToStep", name: "Pick the right file", text: "Use PDF for desktop print dialogs; PNG for preview apps." },
          { "@type": "HowToStep", name: "Choose paper", text: "US Letter is default; A4 with fit-to-printable-area also works." },
          { "@type": "HowToStep", name: "Set margins", text: "Prefer fit to printable area if edges clip; disable headers/footers." },
          { "@type": "HowToStep", name: "Save ink", text: "Classic B&W plus grayscale/draft mode for classroom stacks." },
          { "@type": "HowToStep", name: "Print", text: "Confirm orientation and print a test page before a full stack." },
        ],
      }
    : null;
  const alternates = meta.hreflang?.length ? meta.hreflang : [{ lang: "en", href: meta.canonical }];
  // Regional holiday twins carry their own x-default; everything else defaults to itself.
  const withDefault = alternates.some((h) => h.lang === "x-default")
    ? alternates
    : [...alternates, { lang: "x-default", href: meta.canonical }];
  const hreflang = withDefault
    .map((h) => `<link rel="alternate" hreflang="${esc(h.lang)}" href="${esc(h.href)}" />`)
    .join("\n");
  return `
<meta name="description" content="${esc(meta.description)}" />
<meta name="robots" content="${esc(meta.robots)}" />
<meta name="author" content="${esc(meta.author)}" />
<meta name="theme-color" content="${esc(meta.themeColor)}" />
${meta.keywords?.length ? `<meta name="keywords" content="${esc(meta.keywords.join(", "))}" />` : ""}
<link rel="canonical" href="${esc(meta.canonical)}" />
${hreflang}
<link rel="alternate" type="application/rss+xml" title="Fresh Calendars RSS" href="/feed.xml" />
<meta property="og:type" content="${esc(meta.openGraph.type)}" />
<meta property="og:site_name" content="${esc(meta.openGraph.siteName)}" />
<meta property="og:title" content="${esc(meta.openGraph.title)}" />
<meta property="og:description" content="${esc(meta.openGraph.description)}" />
<meta property="og:url" content="${esc(meta.openGraph.url)}" />
<meta property="og:locale" content="${esc(meta.openGraph.locale)}" />
<meta property="og:image" content="${esc(og.url)}" />
<meta property="og:image:width" content="${og.width}" />
<meta property="og:image:height" content="${og.height}" />
<meta property="og:image:alt" content="${esc(og.alt)}" />
<meta name="twitter:card" content="${esc(meta.twitter.card)}" />
<meta name="twitter:title" content="${esc(meta.twitter.title)}" />
<meta name="twitter:description" content="${esc(meta.twitter.description)}" />
<meta name="twitter:image" content="${esc(meta.twitter.image)}" />
<script type="application/ld+json">${JSON.stringify(websiteLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
<script type="application/ld+json">${JSON.stringify(imageLd)}</script>
${meta.faq.length ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>` : ""}
${howToLd ? `<script type="application/ld+json">${JSON.stringify(howToLd)}</script>` : ""}
`;
}

/** Live “Today” card — SSG HTML is only a fallback; visitor local date wins. */
const TODAY_JS = `
(function(){
  var card=document.querySelector('.today-card');
  if(!card) return;
  var dateEl=card.querySelector('[data-today-date]');
  var metaEl=card.querySelector('[data-today-meta]');
  var monthLink=card.querySelector('[data-today-month]');
  if(!dateEl||!metaEl) return;
  var months=['january','february','march','april','may','june','july','august','september','october','november','december'];
  var now=new Date();
  var start=new Date(now.getFullYear(),0,0);
  var doy=Math.floor((now-start)/86400000);
  var t=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));
  t.setUTCDate(t.getUTCDate()+4-(t.getUTCDay()||7));
  var yearStart=new Date(Date.UTC(t.getUTCFullYear(),0,1));
  var week=Math.ceil((((t-yearStart)/86400000)+1)/7);
  dateEl.textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  metaEl.textContent='Week '+week+' · Day '+doy+' of '+now.getFullYear();
  if(monthLink){
    var slug=months[now.getMonth()];
    monthLink.href='/'+slug+'-calendars.html';
    monthLink.title="This month's printable calendar";
  }
})();
`;

const LIGHTBOX_JS = `
(function(){
  var box=document.getElementById('lightbox');
  if(!box) return;
  var img=box.querySelector('img');
  var closeBtn=box.querySelector('.lightbox-close');
  var previousFocus=null, previousOverflow='';
  function open(src,alt){
    previousFocus=document.activeElement; previousOverflow=document.documentElement.style.overflow;
    img.src=src; img.alt=alt||''; img.title=alt||'';
    box.classList.add('is-open'); box.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow='hidden';
    if(!box.open) box.showModal();
    if(closeBtn) closeBtn.focus();
  }
  function close(){
    if(!box.open) return;
    box.close();
    box.classList.remove('is-open'); box.setAttribute('aria-hidden','true');
    img.removeAttribute('src'); document.documentElement.style.overflow=previousOverflow;
    if(previousFocus&&previousFocus.isConnected) previousFocus.focus({preventScroll:true});
  }
  function lbSrc(z){
    if(z.getAttribute('data-lightbox-src')) return z.getAttribute('data-lightbox-src');
    if(z.tagName==='IMG') return z.getAttribute('src');
    var child=z.querySelector('img');
    return child?child.getAttribute('src'):z.getAttribute('href')||'';
  }
  function lbAlt(z){
    if(z.getAttribute('data-lightbox-alt')) return z.getAttribute('data-lightbox-alt');
    if(z.getAttribute('title')) return z.getAttribute('title');
    if(z.tagName==='IMG') return z.getAttribute('alt')||'';
    var child=z.querySelector('img');
    return child?(child.getAttribute('alt')||''):'';
  }
  document.addEventListener('click',function(e){
    var t=e.target;
    if(!(t instanceof Element)) return;
    var z=t.closest('.zoomable');
    if(z){ e.preventDefault(); open(lbSrc(z), lbAlt(z)); }
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') close();
    if((e.key==='Enter'||e.key===' ') && document.activeElement && document.activeElement.classList.contains('zoomable')){
      e.preventDefault();
      var z=document.activeElement;
      open(lbSrc(z), lbAlt(z));
    }
  });
  box.addEventListener('keydown',function(e){if(e.key==='Tab'&&closeBtn){e.preventDefault();closeBtn.focus();}});
  box.addEventListener('cancel',function(e){ e.preventDefault(); close(); });
  box.addEventListener('click',function(e){ if(e.target===box) close(); });
  if(closeBtn) closeBtn.addEventListener('click',function(e){ e.stopPropagation(); close(); });
})();
`;

const CONTACT_JS = `
(function(){
  var form=document.getElementById('contact-form');
  if(!form) return;
  var msg=document.getElementById('contact-msg');
  var sending=false, submit=form.querySelector('button[type="submit"]');
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    if(sending) return;
    sending=true;
    form.setAttribute('aria-busy','true');
    if(submit) submit.disabled=true;
    if(msg){ msg.textContent='Sending…'; msg.className='form-msg'; }
    try{
      var res=await fetch('/api/contact.php',{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}});
      var data=await res.json().catch(function(){return {};});
      if(!res.ok||!data.ok){ throw new Error(data.error||'Could not send message.'); }
      form.reset();
      if(msg){ msg.textContent='Thanks — your message was sent.'; msg.className='form-msg ok'; }
    }catch(err){
      if(msg){ msg.textContent=err&&err.message?err.message:'Could not send message.'; msg.className='form-msg err'; }
    }finally{
      sending=false;
      form.removeAttribute('aria-busy');
      if(submit) submit.disabled=false;
    }
  });
})();
`;

function layout(
  meta: SeoMeta,
  body: string,
  opts: { preloadImage?: string; ads?: boolean; howTo?: boolean; today?: Date } = {},
): string {
  const adsEnabled = opts.ads !== false;
  const today = opts.today ?? new Date();
  const designFamily = body.includes("data-studio>") ? "calendar-detail" : body.includes("data-library ") ? "calendar-library" : meta.pageId === "calendar-tools" ? "tools" : meta.calendar.family === "home" ? "home" : meta.pageId === "legal-contact" ? "contact" : ["legal-school-holidays", "legal-daylight-savings"].includes(meta.pageId) ? "guide" : meta.calendar.family === "legal" ? "policy" : meta.calendar.family === "holidays" ? "holiday-list" : ["holiday", "easter"].includes(meta.calendar.family) ? "holiday-date" : "guide";
  const pageBody = pageWorkspaceHtml(body, meta.title, new URL(meta.canonical).pathname, today, designFamily);
  // Match <img srcset/sizes> so the browser preloads only the chosen density (not both 1x+2x).
  // Preload LCP preview on small screens only; desktop keeps the image below the fold (text LCP).
  const preloadImg = opts.preloadImage
    ? `<link rel="preload" as="image" media="(max-width:960px)" imagesrcset="${esc(opts.preloadImage)} 540w, ${esc(opts.preloadImage.replace(/calendar-preview\.webp/, "calendar-preview-2x.webp"))} 1080w" imagesizes="92vw" fetchpriority="high" />`
    : "";
  return `<!doctype html>
<html lang="en" class="${familyClass(meta.calendar.family)}" data-design-version="concept-v3" data-design-layout="${designFamily}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
${THEME_BOOT_HTML}
<title>${esc(meta.title)}</title>
${brandHeadLinks()}
<meta name="google-adsense-account" content="${ADSENSE_CLIENT}" />
<link rel="preconnect" href="https://cdn.freshcalendars.com" crossorigin />
${adsEnabled ? `<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />` : ""}
${FONT_PRELOAD}
${preloadImg}
${metaTags(meta, { howTo: opts.howTo })}
<style>${FONTS_CSS}${CSS}</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${siteHeaderHtml(today, { news: NEWS_LAUNCHED })}
<main id="main">
${pageBody}
${volatile(newsStripHtml(new URL(meta.canonical).pathname))}
</main>
${siteFooterHtml(today, { news: NEWS_LAUNCHED })}
<dialog id="lightbox" class="lightbox" aria-hidden="true" aria-label="Enlarged calendar preview">
  <button type="button" class="lightbox-close" aria-label="Close preview">Close</button>
  <img alt="" title="" />
</dialog>
<script>${NAV_JS}</script>
<script>${TODAY_JS}</script>
<script>${LIGHTBOX_JS}</script>
${meta.calendar.family === "legal" && meta.pageId === "legal-contact" ? `<script>${CONTACT_JS}</script>` : ""}
${adsEnabled ? `<script>${ADSENSE_JS}</script>` : ""}
</body>
</html>`;
}

function monthChips(currentSlug?: string): string {
  return MONTH_SLUGS.map((m) => {
    const label = `${m[0]!.toUpperCase()}${m.slice(1)}`;
    const cls = currentSlug === m ? " is-current" : "";
    return `<a class="${cls.trim()}" href="/${m}-calendars.html">${label}</a>`;
  }).join("");
}

function isoWeekNumber(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function todaySidebarCard(today: Date = new Date()): string {
  const fmt = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const m = today.getMonth() + 1;
  const slug = monthNumberToSlug(m);
  // Static fallback = last gen/deploy date; TODAY_JS overwrites with the visitor’s local “today”.
  return `
<div class="side-card today-card">
  <h3>Today</h3>
  <strong data-today-date>${esc(fmt)}</strong>
  <p data-today-meta style="margin:0;color:var(--muted)">Week ${isoWeekNumber(today)} · Day ${dayOfYear(today)} of ${today.getFullYear()}</p>
  <div class="side-links" style="margin-top:.65rem">
    <a data-today-month href="/${slug}-calendars.html" title="This month’s printable calendar">This month’s calendar</a>
    <a href="/printable-weekly-calendar.html" title="Printable weekly calendar">This week planner</a>
  </div>
</div>`;
}

function sidebar(opts: {
  title?: string;
  currentSlug?: string;
  year?: number | null;
  month?: number | null;
  downloads?: { png: string; pdf: string };
  downloadTitles?: { png: string; pdf: string };
  extra?: string;
  /** Default true — omit on legal/contact pages */
  ads?: boolean;
  today?: Date;
}): string {
  const y = opts.year ?? new Date().getFullYear();
  const planningY = resolvePlanningYear(opts.today ?? new Date());
  const nextPlanningY = planningY + 1;
  const prevNext =
    opts.month != null
      ? (() => {
          const prev = opts.month === 1 ? 12 : opts.month - 1;
          const next = opts.month === 12 ? 1 : opts.month + 1;
          return `<div class="side-links">
  <a href="/${monthNumberToSlug(prev)}-calendars.html">← ${monthNumberToName(prev)}</a>
  <a href="/${monthNumberToSlug(next)}-calendars.html">${monthNumberToName(next)} →</a>
</div>`;
        })()
      : "";
  const dl = opts.downloads
    ? `<div class="cta" style="margin:0">
  ${downloadBtn(opts.downloads.pdf, "PDF", opts.downloadTitles?.pdf ?? `Download PDF | Fresh Calendars`, "primary", "sm")}
  ${downloadBtn(opts.downloads.png, "PNG", opts.downloadTitles?.png ?? `Download PNG | Fresh Calendars`, "ghost", "sm")}
</div>`
    : "";
  return `
<aside class="sidebar" aria-label="Calendar navigation">
  ${volatile(todaySidebarCard(opts.today))}
  <div class="side-card">
    <h2>${esc(opts.title ?? "Browse months")}</h2>
    <div class="month-chips">${monthChips(opts.currentSlug)}</div>
  </div>
  <div class="side-card">
    <h3>Quick links</h3>
    <div class="side-links">
      <a href="/printable-calendars.html" title="${planningY} printable yearly calendar">${planningY} yearly calendar</a>
      <a href="/printable-yearly-calendar.html" title="${nextPlanningY} printable yearly calendar">${nextPlanningY} yearly calendar</a>
      <a href="/printable-weekly-calendar.html" title="Printable weekly calendar">Weekly calendar</a>
      <a href="/printable-school-calendar.html" title="Printable school year calendar">School year</a>
      <a href="/page/school-holidays/" title="School holiday planning">School holidays</a>
      <a href="/blank-calendars.html" title="Printable blank undated calendar">Blank calendar</a>
      <a href="/printable-blank-yearly-calendar.html" title="Printable blank yearly calendar">Blank yearly</a>
      <a href="/printable-monday-start-calendar.html" title="Monday-start calendars">Monday start</a>
      <a href="/holidays/" title="${planningY} US holidays list">${planningY} US holidays</a>
      <a href="/uk-holidays/" title="${planningY} UK holidays">UK holidays</a>
      <a href="/canada-holidays/" title="${planningY} Canada holidays">Canada holidays</a>
      <a href="/print-guide.html" title="How to print a calendar">Print guide</a>
      <a href="/guides/classroom-printable-calendars.html" title="Classroom printable calendars guide">Classroom guide</a>
      <a href="/guides/monday-start-calendar.html" title="Monday-start vs Sunday-start calendars">Monday vs Sunday start</a>
      <a href="/guides/fiscal-year-calendar.html" title="Fiscal year vs calendar year printables">Fiscal year guide</a>
      <a href="/page/daylight-savings/" title="US daylight saving time dates">Daylight saving time</a>
      <a href="/when-is/thanksgiving/" title="When is Thanksgiving ${y}?">Thanksgiving</a>
      <a href="/when-is/easter/" title="When is Easter ${y}?">Easter</a>
    </div>
    ${prevNext}
  </div>
  ${
    dl
      ? `<div class="side-card"><h3>Download</h3><p>Print-ready PNG and PDF files, ready the moment you click.</p>${dl}</div>`
      : ""
  }
  ${opts.extra ? `<div class="side-card">${opts.extra}</div>` : ""}
  ${opts.ads === false ? "" : `<div class="side-card ad-side">${adUnit(ADS.sidebar, "FreshCalendars_Sidebar", "sidebar")}</div>`}
</aside>`;
}

function withSidebar(mainHtml: string, sideHtml: string): string {
  return `
<div class="wrap content-shell">
  <div class="layout">
    <div class="main">${mainHtml}</div>
    ${sideHtml}
  </div>
</div>`;
}

function downloadHero(meta: SeoMeta, _visualSrc: string, _eyebrow: string, lead: string): string {
  return calendarStudio(meta, lead);
}

function variantGallery(
  meta: SeoMeta,
  opts: { heading?: string; lead?: string } = {},
): string {
  if (!meta.variants?.length) return "";
  const items = meta.variants
    .map((v) => {
      const alt = meta.imageAlts[v.png] ?? `${meta.title} — ${v.label}`;
      const landscape = v.id.includes("landscape");
      return `
<article class="gallery-item" id="template-${esc(v.id)}">
  <div class="gallery-visual">
    ${imgTag({
      src: v.png,
      alt,
      title: alt,
      width: landscape ? 1600 : 1100,
      height: landscape ? 1100 : 1420,
      loading: "lazy",
      lightbox: true,
    })}
  </div>
  <div class="gallery-copy">
    <h3>${esc(v.label)}</h3>
    <p>${esc(v.description)}</p>
    <div class="cta">
      ${downloadBtn(v.pdf, "PDF", v.pdfTitle, "primary", "sm")}
      ${downloadBtn(v.png, "PNG", v.pngTitle, "ghost", "sm")}
    </div>
  </div>
</article>`;
    })
    .join("");
  const heading = opts.heading ?? "Printable templates";
  const lead =
    opts.lead ??
    "Independent designs — not one layout recolored. Pick ink budget, holiday marks, handwriting space, landscape, or Monday-start. Click any preview to enlarge.";
  return `
<section class="section">
  <h2>${esc(heading)}</h2>
  <p class="lead" style="max-width:52ch;margin:0 0 1.5rem">${esc(lead)}</p>
  <div class="gallery">${items}</div>
</section>`;
}

function faqSection(meta: SeoMeta): string {
  if (!meta.faq.length) return "";
  return `
<section class="section faq">
  <h2>FAQ</h2>
  ${meta.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
</section>`;
}

const VOLATILE_OPEN = "<!--fc:volatile-->";
const VOLATILE_CLOSE = "<!--/fc:volatile-->";

/**
 * Marks HTML that changes without the page's own content changing (the
 * "Today" card, news links), so sitemap lastmod can ignore it.
 */
function volatile(html: string): string {
  return html ? `${VOLATILE_OPEN}${html}${VOLATILE_CLOSE}` : "";
}

/** Published HTML (markers removed) plus a hash of everything outside the volatile blocks. */
export function splitVolatile(html: string): { html: string; contentHash: string } {
  const stable = html.split(VOLATILE_OPEN).map((part, i) => (i === 0 ? part : part.split(VOLATILE_CLOSE)[1] ?? "")).join("");
  return {
    html: html.split(VOLATILE_OPEN).join("").split(VOLATILE_CLOSE).join(""),
    contentHash: createHash("sha256").update(stable).digest("hex").slice(0, 16),
  };
}

export async function writeSitePage(filePath: string, html: string): Promise<void> {
  const full = path.join(DIST_SITE, filePath.replace(/^\//, ""));
  await fs.mkdir(path.dirname(full), { recursive: true });
  // Any page rendered with volatile markers (404, extras) ships without them.
  await fs.writeFile(full, html.includes(VOLATILE_OPEN) ? splitVolatile(html).html : html, "utf8");
}

function renderHome(meta: SeoMeta, today: Date): string {
  const planningYear = resolvePlanningYear(today);
  const curM = today.getMonth() + 1;
  const nextM = curM === 12 ? 1 : curM + 1;
  const curY = resolveMonthYear(curM, today);
  const nextY = resolveMonthYear(nextM, today);
  const curSlug = monthNumberToSlug(curM);
  const nextSlug = monthNumberToSlug(nextM);
  const curName = monthNumberToName(curM);
  const nextName = monthNumberToName(nextM);
  const curAssets = monthlyVariantAssetPaths(curY, curSlug, DEFAULT_MONTHLY_VARIANT);
  const nextAssets = monthlyVariantAssetPaths(nextY, nextSlug, DEFAULT_MONTHLY_VARIANT);
  const curPng = cdnUrl(curAssets.png);
  const nextPng = cdnUrl(nextAssets.png);
  const nextPlanning = planningYear + 1;
  const yearlyPaths = yearlyVariantAssetPaths(planningYear, DEFAULT_YEARLY_VARIANT);
  const nextYearlyPaths = yearlyVariantAssetPaths(nextPlanning, DEFAULT_YEARLY_VARIANT);
  const yearlyPng = cdnUrl(yearlyPaths.png);
  const yearlyPdf = cdnUrl(yearlyPaths.pdf);
  const nextYearlyPng = cdnUrl(nextYearlyPaths.png);
  const nextYearlyPdf = cdnUrl(nextYearlyPaths.pdf);

  const hero = homeConceptHero(today) + homeCalendarShelf(today);

  // Legacy index.php included rightmenu.php (sidebar slot 6770670949) alongside home units.
  const main = `
<section class="section">
  <h2>This month &amp; next</h2>
  <p class="lead" style="margin:0 0 1.25rem;max-width:52ch">Each month page shows that month’s next occurrence: today that means ${curName} ${curY} and ${nextName} ${nextY}.</p>
  <div class="showcase">
    <article class="showcase-card">
      <div class="visual">${imgTag({
        src: curPng,
        alt: `Printable ${curName} ${curY} calendar preview`,
        title: `Printable ${curName} ${curY} calendar — click to enlarge`,
        width: 1100,
        height: 1420,
        fetchpriority: "high",
        loading: "eager",
        lightbox: true,
      })}</div>
      <div class="meta">
        <div class="label">Current month</div>
        <h3>${curName} ${curY}</h3>
        <p style="margin:0 0 .85rem;color:var(--muted)">Six print styles — holidays, Monday-start, planner, and more.</p>
        <div class="cta">
          <a class="btn btn-primary btn-sm" href="/${curSlug}-calendars.html" title="Open ${curName} ${curY} printable calendar page">Open ${curName}</a>
          ${downloadBtn(cdnUrl(curAssets.pdf), "PDF", `Download ${curName} ${curY} printable calendar PDF | Fresh Calendars`, "ghost", "sm")}
        </div>
      </div>
    </article>
    <article class="showcase-card">
      <div class="visual">${imgTag({
        src: nextPng,
        alt: `Printable ${nextName} ${nextY} calendar preview`,
        title: `Printable ${nextName} ${nextY} calendar — click to enlarge`,
        width: 1100,
        height: 1420,
        loading: "lazy",
        lightbox: true,
      })}</div>
      <div class="meta">
        <div class="label">Coming up</div>
        <h3>${nextName} ${nextY}</h3>
        <p style="margin:0 0 .85rem;color:var(--muted)">Stay a month ahead — same Fresh Calendars engine, next grid ready.</p>
        <div class="cta">
          <a class="btn btn-primary btn-sm" href="/${nextSlug}-calendars.html" title="Open ${nextName} ${nextY} printable calendar page">Open ${nextName}</a>
          ${downloadBtn(cdnUrl(nextAssets.pdf), "PDF", `Download ${nextName} ${nextY} printable calendar PDF | Fresh Calendars`, "ghost", "sm")}
        </div>
      </div>
    </article>
  </div>
</section>

${adUnit(ADS.homeTop, "FreshCalendars_New_Index", "header")}

<section class="section">
  <h2>${planningYear} &amp; ${nextPlanning} yearly calendars</h2>
  <div class="yearly-band">
    <div>
      <p>One-page year-at-a-glance for ${planningYear}: twelve accurate mini-months, five poster formats, print-ready PNG and PDF.</p>
      <div class="cta">
        <a class="btn btn-primary" href="/printable-calendars.html" title="${planningYear} printable yearly calendar">View ${planningYear}</a>
        ${downloadBtn(yearlyPdf, "PDF", `Download ${planningYear} yearly printable calendar PDF | Fresh Calendars`, "ghost")}
      </div>
    </div>
    ${imgTag({
      src: yearlyPng,
      alt: `Printable ${planningYear} yearly calendar preview`,
      title: `Printable ${planningYear} yearly calendar — click to enlarge`,
      width: 1100,
      height: 1420,
      loading: "lazy",
      lightbox: true,
    })}
  </div>
  <div class="yearly-band" style="margin-top:1.25rem">
    <div>
      <p>Plan ahead with the ${nextPlanning} yearly hub — same five formats, ready on the <a href="/printable-yearly-calendar.html">${nextPlanning} yearly calendar</a> page.</p>
      <div class="cta">
        <a class="btn btn-primary" href="/printable-yearly-calendar.html" title="${nextPlanning} printable yearly calendar">View ${nextPlanning}</a>
        ${downloadBtn(nextYearlyPdf, "PDF", `Download ${nextPlanning} yearly printable calendar PDF | Fresh Calendars`, "ghost")}
      </div>
    </div>
    ${imgTag({
      src: nextYearlyPng,
      alt: `Printable ${nextPlanning} yearly calendar preview`,
      title: `Printable ${nextPlanning} yearly calendar — click to enlarge`,
      width: 1100,
      height: 1420,
      loading: "lazy",
      lightbox: true,
    })}
  </div>
</section>

${adUnit(ADS.homeMid, "FreshCalendars_Home_Mid", "banner")}

<section class="section prose">
  <h2>Why printable calendars still win</h2>
  <p>Screens remind you; paper helps you decide. A printable calendar puts the whole month — or the whole year — in one glance without app notifications competing for attention. Fresh Calendars is built for that: download, print, write, move on.</p>
  <p>Every dated grid is generated from a calendar engine (not hand-edited weekdays), so ${planningYear} federal holidays and month lengths stay correct. Month pages roll forward when a month ends, so in August the January page already shows next January.</p>
  <ul class="feature-list">
    <li><strong>Five monthly designs</strong> — classic B&amp;W, modern color, holidays marked, notes planner, landscape soft.</li>
    <li><strong>Blank undated sheets</strong> — reuse forever when weekdays don't matter yet.</li>
    <li><strong>Yearly poster</strong> — wall planning without flipping twelve pages.</li>
    <li><strong>Instant downloads</strong> — print-ready PNG and PDF without signup.</li>
  </ul>
  <h3>Start here</h3>
  <div class="month-chips">${monthChips(curSlug)}</div>
  <div class="cta" style="margin-top:1.25rem">
    <a class="btn btn-primary" href="/printable-weekly-calendar.html" title="Printable weekly calendar">Weekly calendar</a>
    <a class="btn btn-ghost" href="/printable-school-calendar.html" title="School year calendar">School year</a>
    <a class="btn btn-ghost" href="/print-guide.html" title="How to print a calendar">Print guide</a>
  </div>
</section>
${adUnit(ADS.inArticle, "FreshCalendars_Home_Bottom", "banner")}
${faqSection(meta)}`;

  return layout(
    meta,
    `${hero}<div class="home-more">${withSidebar(main, sidebar({ title: "Browse months", today, currentSlug: curSlug }))}</div>`,
    {},
  );
}

function weekGridHtml(today: Date): string {
  const start = sundayWeekStart(today);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dow = d.toLocaleDateString("en-US", { weekday: "short" });
    const dom = d.getDate();
    const mon = d.toLocaleDateString("en-US", { month: "short" });
    const isToday = d.toDateString() === today.toDateString();
    return `<div class="day"${isToday ? ' style="outline:2px solid var(--accent)"' : ""}>
  <div class="dow">${esc(dow)}</div>
  <div class="dom">${dom} <span style="font-size:.85rem;font-weight:600;color:var(--muted)">${esc(mon)}</span></div>
  <div class="lines" aria-hidden="true"></div>
</div>`;
  }).join("");
  const range = sundayWeekRangeLabel(today);
  return `<p class="lead" style="margin:0 0 .75rem">Week of ${esc(range)} (Sunday start). Print this page for a quick seven-day sheet.</p>
<div class="week-print" role="table" aria-label="Weekly planner ${esc(range)}">${days}</div>`;
}

function schoolYearMonths(today: Date): { label: string; href: string; year: number }[] {
  const m = today.getMonth() + 1;
  const startYear = m >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  const order = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
  return order.map((month) => {
    const year = month >= 8 ? startYear : startYear + 1;
    const slug = monthNumberToSlug(month);
    return {
      label: `${monthNumberToName(month)} ${year}`,
      href: `/${slug}-calendars.html`,
      year,
    };
  });
}

function renderGuidePage(entry: UrlEntry, meta: SeoMeta, today: Date): string {
  const g = entry.guide ?? "print";
  if (g === "weekly") {
    const hero = calendarStudio(meta, "Free undated weekly planners for your schedule, priorities and habits. Choose a design and paper size, then download a reusable PDF or PNG.");
    const main = `
${variantGallery(meta, {
  heading: "Five weekly templates",
  lead: "Undated PNG/PDF packs — classic Sunday, Monday-start, hourly, priorities, and habit tracker. Reuse any week; fill dates by hand.",
})}
<section class="section prose" id="week-grid">
  <h2>This week</h2>
  ${weekGridHtml(today)}
  <p>Tip: In your browser choose <strong>Print → More settings → Background graphics</strong> if outlines look faint. For US Letter, keep default margins — or download a template PDF above for a cleaner sheet.</p>
  <div class="cta">
    ${downloadBtn(meta.download.pdf, "Classic PDF", meta.downloadTitles.pdf)}
    ${downloadBtn(meta.download.png, "Classic PNG", meta.downloadTitles.png, "ghost")}
    <a class="btn btn-ghost" href="/print-guide.html">Print tips</a>
  </div>
</section>
${adUnit(ADS.homeMid, "FreshCalendars_Weekly_Mid", "banner")}
<section class="section prose">
  <h2>Need a full month or year?</h2>
  <p>Weekly sheets are perfect for sprints; dated monthly templates carry holidays and five print styles. Yearly posters cover ${resolvePlanningYear(today)} and ${resolvePlanningYear(today) + 1}.</p>
  <div class="month-chips">${monthChips(monthNumberToSlug(today.getMonth() + 1))}</div>
  <div class="cta" style="margin-top:1rem">
    <a class="btn btn-primary btn-sm" href="/printable-calendars.html">${resolvePlanningYear(today)} yearly</a>
    <a class="btn btn-ghost btn-sm" href="/printable-yearly-calendar.html">${resolvePlanningYear(today) + 1} yearly</a>
  </div>
</section>
${adUnit(ADS.blankMid, "FreshCalendars_Weekly_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(main, sidebar({ title: "Plan further", today, downloads: meta.download, downloadTitles: meta.downloadTitles }))}`,
    );
  }

  if (g === "school") {
    const months = schoolYearMonths(today);
    const startYear = schoolYearStartYear(today);
    const span = schoolYearSpanLabel(startYear);
    const label = `${months[0]!.label.split(" ")[1]}–${months[11]!.label.split(" ")[1]}`;
    const packRows = months
      .map((x) => {
        const mSlug = x.href.replace(/^\//, "").replace("-calendars.html", "");
        const classic = monthlyVariantAssetPaths(x.year, mSlug, "classic-bw");
        const monday = monthlyVariantAssetPaths(x.year, mSlug, "monday-start");
        return `<tr>
  <td><a href="${x.href}" title="Printable ${esc(x.label)}">${esc(x.label)}</a></td>
  <td>${downloadBtn(cdnUrl(classic.pdf), "Classic PDF", `Download ${x.label} Classic B&W PDF`, "ghost", "sm")} ${downloadBtn(cdnUrl(classic.png), "PNG", `Download ${x.label} Classic B&W PNG`, "ghost", "sm")}</td>
  <td>${downloadBtn(cdnUrl(monday.pdf), "Mon PDF", `Download ${x.label} Monday-start PDF`, "ghost", "sm")} ${downloadBtn(cdnUrl(monday.png), "PNG", `Download ${x.label} Monday-start PNG`, "ghost", "sm")}</td>
</tr>`;
      })
      .join("");
    const hero = `${downloadHero(
      meta,
      meta.download.png,
      "Fresh Calendars · School year",
      `August–July academic overview for ${esc(span)} — not a district-official calendar. Mark breaks by hand, then grab Classic or Monday-start months below.`,
    )}
${adBand(ADS.inArticle, "FreshCalendars_School_Top")}`;
    const main = `
<section class="section prose">
  <h2>${esc(label)} month pack</h2>
  <p>Each row links the month page plus direct Classic B&amp;W and Monday-start downloads for that academic month.</p>
  <div class="table-scroll" role="region" aria-label="School year month pack" tabindex="0">
  <table class="hol-table">
    <thead><tr><th>Month</th><th>Classic B&amp;W</th><th>Monday start</th></tr></thead>
    <tbody>${packRows}</tbody>
  </table>
  </div>
  ${adUnit(ADS.homeMid, "FreshCalendars_School_Mid", "banner")}
  <h2>Classroom strip</h2>
  <p>Pair the overview with weekly habit/priorities planners and blank notes for write-ins.</p>
  <div class="cta">
    <a class="btn btn-primary btn-sm" href="/printable-weekly-calendar.html#template-habit">Weekly habits</a>
    <a class="btn btn-ghost btn-sm" href="/printable-weekly-calendar.html#template-priorities">Weekly priorities</a>
    <a class="btn btn-ghost btn-sm" href="/blank-calendars.html#template-notes">Blank notes</a>
    <a class="btn btn-ghost btn-sm" href="/blank-calendars.html#template-kids">Kids blank</a>
    <a class="btn btn-ghost btn-sm" href="/guides/classroom-printable-calendars.html">Classroom guide</a>
    <a class="btn btn-ghost btn-sm" href="/page/school-holidays/">School holiday planning</a>
  </div>
  <h3>Month chips</h3>
  <div class="school-months">
    ${months.map((x) => `<a href="${x.href}" title="Printable ${esc(x.label)} calendar">${esc(x.label)}</a>`).join("")}
  </div>
</section>
${adUnit(ADS.blankMid, "FreshCalendars_School_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(
        main,
        sidebar({
          title: "School tools",
          today,
          downloads: meta.download,
          downloadTitles: meta.downloadTitles,
        }),
      )}`,
      { preloadImage: displayPreviewUrl(meta.download.png) },
    );
  }

  if (g === "monday-start") {
    const curM = today.getMonth() + 1;
    const nextM = curM === 12 ? 1 : curM + 1;
    const curY = resolveMonthYear(curM, today);
    const nextY = resolveMonthYear(nextM, today);
    const curSlug = monthNumberToSlug(curM);
    const nextSlug = monthNumberToSlug(nextM);
    const curName = monthNumberToName(curM);
    const nextName = monthNumberToName(nextM);
    const curAssets = monthlyVariantAssetPaths(curY, curSlug, "monday-start");
    const nextAssets = monthlyVariantAssetPaths(nextY, nextSlug, "monday-start");
    const curPng = cdnUrl(curAssets.png);
    const nextPng = cdnUrl(nextAssets.png);
    const hero = `${calendarStudio(meta,
      "Mon–Sun monthly calendars for workweeks and classrooms — current and next month previews, then every month.",
      {year: curY, month: curM, start: "monday"},
    )}
${adBand(ADS.inArticle, "FreshCalendars_Monday_Top")}`;
    const main = `
<section class="section">
  <h2>This month &amp; next</h2>
  <div class="gallery">
    <article class="gallery-item">
      <div class="gallery-visual">${imgTag({ src: curPng, alt: `${curName} ${curY} Monday-start calendar`, title: `${curName} ${curY} Monday start`, width: 1100, height: 1420, loading: "eager", lightbox: true })}</div>
      <div class="gallery-copy">
        <h3>${esc(curName)} ${curY}</h3>
        <p>Monday-start dated monthly for the current month.</p>
        <div class="cta">
          ${downloadBtn(cdnUrl(curAssets.pdf), "PDF", `Download ${curName} ${curY} Monday-start PDF`, "primary", "sm")}
          ${downloadBtn(curPng, "PNG", `Download ${curName} ${curY} Monday-start PNG`, "ghost", "sm")}
          <a class="btn btn-ghost btn-sm" href="/${curSlug}-calendars.html#template-monday-start">Month page</a>
        </div>
      </div>
    </article>
    <article class="gallery-item">
      <div class="gallery-visual">${imgTag({ src: nextPng, alt: `${nextName} ${nextY} Monday-start calendar`, title: `${nextName} ${nextY} Monday start`, width: 1100, height: 1420, loading: "lazy", lightbox: true })}</div>
      <div class="gallery-copy">
        <h3>${esc(nextName)} ${nextY}</h3>
        <p>Preview next month’s Monday-start sheet.</p>
        <div class="cta">
          ${downloadBtn(cdnUrl(nextAssets.pdf), "PDF", `Download ${nextName} ${nextY} Monday-start PDF`, "primary", "sm")}
          ${downloadBtn(nextPng, "PNG", `Download ${nextName} ${nextY} Monday-start PNG`, "ghost", "sm")}
          <a class="btn btn-ghost btn-sm" href="/${nextSlug}-calendars.html#template-monday-start">Month page</a>
        </div>
      </div>
    </article>
  </div>
</section>
<section class="section prose">
  <h2>All months</h2>
  <p>Every month page includes a Monday-start PDF/PNG in the gallery.</p>
  <div class="month-chips">${monthChips()}</div>
  <p>Also see the <a href="/guides/monday-start-calendar.html">Monday-start how-to</a>, <a href="/blank-calendars.html#template-monday-start">undated Monday blank</a>, and <a href="/printable-weekly-calendar.html#template-monday-start">Monday weekly</a>.</p>
</section>
${adUnit(ADS.blankMid, "FreshCalendars_Monday_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(
        main,
        sidebar({
          title: "Monday-start",
          today,
          downloads: meta.download,
          downloadTitles: meta.downloadTitles,
        }),
      )}`,
      { preloadImage: displayPreviewUrl(curPng) },
    );
  }

  if (g === "classroom" || g === "monday-guide" || g === "fiscal") {
    const copy =
      g === "classroom"
        ? {
            eyebrow: "Guide · Classroom",
            h1: "Calendars built for the classroom",
            lead: "School-year overviews, kids blanks, weekly habit trackers, and Monday-start months for teachers and parents on Fresh Calendars.",
            body: `
  <h2>Start with the school year</h2>
  <p>Download the <a href="/printable-school-calendar.html">Aug–Jul overview</a>, then print Classic B&amp;W or Monday-start months for the wall and handouts. Mark district breaks yourself — this is not an official district calendar.</p>
  <h2>Write-in sheets</h2>
  <p>Use the <a href="/blank-calendars.html#template-kids">kids blank</a> and <a href="/blank-calendars.html#template-notes">notes blank</a> for undated classroom work. Pair with <a href="/printable-weekly-calendar.html#template-habit">weekly habits</a>.</p>
  <h2>Holidays</h2>
  <p>US federal days are on <a href="/holidays/">holidays</a>; UK and Canada lists are separate hubs if you teach internationally.</p>`,
          }
        : g === "monday-guide"
          ? {
              eyebrow: "Guide · Monday start",
              h1: "Monday-start or Sunday-start?",
              lead: "When Mon–Sun grids win for workweeks and schools — and which Fresh Calendars files to download first.",
              body: `
  <h2>Use Monday-start when…</h2>
  <p>Your week is work-first, your school follows ISO-style weeks, or you want weekends together at the end of the row. Jump to the <a href="/printable-monday-start-calendar.html">Monday-start hub</a> for current/next month PDFs.</p>
  <h2>Stay Sunday-start when…</h2>
  <p>US consumer planners, church calendars, or habit of “weekend first” layouts. Classic B&amp;W and most monthly templates remain Sunday-start.</p>
  <h2>Related downloads</h2>
  <p><a href="/blank-calendars.html#template-monday-start">Blank Monday monthly</a> · <a href="/printable-weekly-calendar.html#template-monday-start">Monday weekly</a> · <a href="/printable-calendars.html">Yearly Monday-start poster</a> (in the yearly gallery).</p>`,
            }
          : {
              eyebrow: "Guide · Fiscal year",
              h1: "Which year span should you print?",
              lead: "Jan–Dec, custom fiscal spans, and academic Aug–Jul — matching Fresh Calendars downloads to each.",
              body: `
  <h2>Calendar year</h2>
  <p>January–December. Use the <a href="/printable-calendars.html">dated yearly poster</a> and the monthly pages.</p>
  <h2>Fiscal year</h2>
  <p>Any 12-month accounting span. Print the <a href="/printable-blank-yearly-calendar.html">blank yearly</a> poster and label your fiscal months, or chain dated month PDFs for your span.</p>
  <h2>Academic year</h2>
  <p>August–July lives on the <a href="/printable-school-calendar.html">school year hub</a> with an overview download and month pack.</p>`,
            };
    const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · ${esc(copy.eyebrow)}</div>
  <h1>${esc(copy.h1)}</h1>
  <p class="lead">${esc(copy.lead)}</p>
  <div class="cta">
    <a class="btn btn-primary" href="/printable-school-calendar.html">School year</a>
    <a class="btn btn-ghost" href="/printable-monday-start-calendar.html">Monday start</a>
  </div>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_Guide_Top")}`;
    const main = `
<section class="section prose">${copy.body}
  ${adUnit(ADS.homeMid, "FreshCalendars_Guide_Mid", "banner")}
</section>
${adUnit(ADS.blankMid, "FreshCalendars_Guide_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(meta, `${hero}${withSidebar(main, sidebar({ title: "Guides", today }))}`);
  }

  // print guide
  const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · Print guide</div>
  <h1>Get a clean print every time</h1>
  <p class="lead">Paper size, margins, fit-to-page, ink-saver settings, and PDF vs PNG — so Fresh Calendars sheets actually fit the page.</p>
  <div class="cta">
    <a class="btn btn-primary" href="/blank-calendars.html">Blank calendar</a>
    <a class="btn btn-ghost" href="/printable-calendars.html">Yearly poster</a>
  </div>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_PrintGuide_Top")}`;
  const main = `
<section class="section prose">
  <h2>1. Pick the right file</h2>
  <ul>
    <li><strong>PDF</strong> — best for desktop print dialogs and consistent fonts.</li>
    <li><strong>PNG</strong> — handy for preview, annotation apps, or when PDF viewers misbehave.</li>
    <li>For planning drafts, start with the <strong>classic black &amp; white</strong> monthly template.</li>
  </ul>
  <h2>2. Paper &amp; orientation</h2>
  <p>Choose <strong>US Letter (8.5×11&nbsp;in)</strong> or <strong>A4 (210×297&nbsp;mm)</strong> in the download panel. Each option has its own correctly sized PDF and PNG. Portrait is default for monthly sheets; landscape templates are labeled in the monthly gallery.</p>
  <h2>3. Margins that don’t clip</h2>
  <ul>
    <li>Prefer “Actual size” only when your printer’s non-printable margin is small.</li>
    <li>If edges cut off, switch to <strong>Fit</strong> / shrink to printable area and turn <strong>borderless</strong> off unless you know your printer handles it.</li>
    <li>Disable “Headers and footers” in the browser when printing the weekly on-page grid.</li>
  </ul>
  ${adUnit(ADS.homeMid, "FreshCalendars_PrintGuide_Mid", "banner")}
  <h2>4. Save ink</h2>
  <ul>
    <li>Grayscale + draft/economy mode for classroom stacks.</li>
    <li>Skip color-modern until the final wall copy.</li>
    <li>Reuse the <a href="/blank-calendars.html">blank undated</a> sheet when weekdays don’t matter yet.</li>
  </ul>
  <h2>5. Quick links</h2>
  <div class="cta">
    <a class="btn btn-primary btn-sm" href="/printable-weekly-calendar.html">Weekly</a>
    <a class="btn btn-ghost btn-sm" href="/printable-school-calendar.html">School year</a>
    <a class="btn btn-ghost btn-sm" href="/page/contact/">Print still broken? Contact us</a>
  </div>
</section>
${adUnit(ADS.blankMid, "FreshCalendars_PrintGuide_Bottom", "banner")}
${faqSection(meta)}`;
  return layout(meta, `${hero}${withSidebar(main, sidebar({ title: "Printables", today }))}`, {
    howTo: true,
  });
}

export function renderPageHtml(
  entry: UrlEntry,
  meta: SeoMeta,
  opts: { today?: Date } = {},
): string {
  const today = opts.today ?? new Date();
  const year = meta.calendar.year;
  const month = meta.calendar.month;

  if (entry.kind === "home") {
    return renderHome(meta, today);
  }

  if (entry.kind === "yearly-evergreen" || entry.kind === "yearly-fixed") {
    const y = year ?? new Date().getFullYear();
    const isNext = entry.pageId === "yearly-next";
    const otherY = isNext ? y - 1 : y + 1;
    const otherHref = isNext ? "/printable-calendars.html" : "/printable-yearly-calendar.html";
    const hero = `${downloadHero(
      meta,
      meta.download.png,
      isNext ? "Fresh Calendars · Next year" : "Fresh Calendars · Yearly",
      isNext
        ? `Plan ahead with a ${y} year-at-a-glance poster — five formats and twelve mini-months.`
        : `Poster-style ${y} year-at-a-glance — five formats with twelve accurate mini-months on one sheet.`,
    )}
${adBand(ADS.yearTop, "Freshcalendars_New_Year", "header")}`;
    const main = `
${variantGallery(meta, {
  heading: `Five ${y} yearly templates`,
  lead: "Classic portrait, landscape wall, holidays emphasis, Monday-start, and ink-compact — independent poster designs for the full year.",
})}
${adUnit(ADS.yearMid, "FreshCalendars_Year_InContent", "banner")}
<section class="section prose">
  <h2>Why a ${y} yearly printable</h2>
  <p>The yearly templates are built for wall planning and annual reviews: see every ${y} month without flipping pages. Holidays are tinted on mini cells from the same engine that powers monthly downloads.</p>
  <p>Need large writing cells or named federal holidays in a single month? Jump into a monthly page for five specialized layouts — classic ink-saver, modern color, holidays marked, notes planner, and landscape.</p>
  <p><strong>${isNext ? "Also available" : "Plan ahead"}:</strong> <a href="${otherHref}" title="${otherY} printable yearly calendar">${otherY} yearly calendar</a> with the same five formats.</p>
  <h2>All months</h2>
  <div class="month-chips">${monthChips()}</div>
  <h3>Also useful</h3>
  <div class="cta">
    <a class="btn btn-primary btn-sm" href="/printable-weekly-calendar.html">Weekly planner</a>
    <a class="btn btn-ghost btn-sm" href="/printable-school-calendar.html">School year</a>
    <a class="btn btn-ghost btn-sm" href="/print-guide.html">Print guide</a>
    <a class="btn btn-ghost btn-sm" href="${otherHref}">${otherY} yearly</a>
  </div>
</section>
${adUnit(ADS.inArticle, "FreshCalendars_Year_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(
        main,
        sidebar({
          title: `${y} months`,
          year: y,
          downloads: meta.download,
          downloadTitles: meta.downloadTitles,
          extra: `<h3>${otherY} yearly</h3><p>Same five poster formats for ${otherY}.</p><a class="btn btn-ghost btn-sm" href="${otherHref}">Open ${otherY}</a>`,
        }),
      )}`,
      { preloadImage: displayPreviewUrl(meta.download.png) },
    );
  }

  if (entry.kind === "monthly-evergreen" || entry.kind === "monthly-fixed") {
    const m = month ?? 1;
    const y = year ?? new Date().getFullYear();
    const name = monthNumberToName(m);
    const slug = entry.month ?? monthNumberToSlug(m);
    const grid = buildMonthGrid({ year: y, month: m });
    const hols = holidaysForMonth(y, m);
    const ed = getMonthEditorial(m);
    const startDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      new Date(y, m - 1, 1).getDay()
    ]!;
    const hero = `${downloadHero(meta, meta.download.png, "Fresh Calendars · Monthly", ed.lead(y))}
${adBand(ADS.monthTop, "FreshCalendars_Month_New_Header", "header")}`;
    const main = `
${variantGallery(meta)}
${adUnit(ADS.monthMid, "FreshCalendars_Month_InContent", "banner")}
<section class="section prose">
  <h2>${name} ${y} guide</h2>
  ${ed.overview(y).map((p) => `<p>${esc(p)}</p>`).join("")}
  <h3>At a glance</h3>
  <p>${name} ${y} starts on ${startDay} and spans ${grid.weeks.flat().filter(Boolean).length} days.</p>
  <h3>Holidays this month</h3>
  <ul>${hols.map((h) => `<li><a href="${holidayWhenIsPath(h.slug)}" title="When is ${esc(h.name)} ${y}?"><strong>${esc(h.name)}</strong></a> — ${esc(h.formatted)}</li>`).join("") || "<li>No listed holidays this month.</li>"}</ul>
  <h3>Planning tips for ${name} ${y}</h3>
  <ul>${ed.planningTips(y).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  <h3>${esc(ed.historyTitle)}</h3>
  <p>${esc(ed.historyBlurb(y))}</p>
  <ul class="facts">${ed.historyFacts.map((f) => `<li><strong>${esc(f.label)}</strong> ${esc(f.text)}</li>`).join("")}</ul>
</section>
${adUnit(ADS.inArticle, "FreshCalendars_Month_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(
        main,
        sidebar({
          title: "All months",
          currentSlug: slug,
          year: y,
          month: m,
          downloads: meta.download,
          downloadTitles: meta.downloadTitles,
          extra: `<h3>Templates on this page</h3><p>Scroll the gallery for B&amp;W, color, holidays, planner, landscape, and Monday-start — each is a separate print file. Click previews to enlarge.</p>`,
        }),
      )}`,
      { preloadImage: displayPreviewUrl(meta.download.png) },
    );
  }

  if (entry.kind === "blank") {
    const hero = `${downloadHero(
      meta,
      meta.download.png,
      "Fresh Calendars · Blank",
      "Five undated monthly templates — classic, Monday-start, notes, landscape, and kids/classroom. Reuse any month, then switch to dated sheets when weekdays matter.",
    )}
${adBand(ADS.blankTop, "FreshCalendars_Blank", "header")}`;
    const main = `
${variantGallery(meta, {
  heading: "Five blank templates",
  lead: "Independent undated designs. Primary download is Classic; open Blank yearly for a 12-month fill-in poster.",
})}
${adUnit(ADS.blankMid, "FreshCalendars_Blank_InContent", "banner")}
<section class="section prose">
  <h2>When blank beats dated</h2>
  <p>Blank templates shine for classrooms, bullet journals, and reusable office clipboards. Fill the month name yourself; skip holiday math until you need it.</p>
  <p>Need a year poster without dates? Try the <a href="/printable-blank-yearly-calendar.html">blank yearly calendar</a>. For accurate weekdays, open a dated monthly page (seven designs, each with a Monday-start option).</p>
  <h2>Dated months</h2>
  <div class="month-chips">${monthChips()}</div>
</section>
${adUnit(ADS.inArticle, "FreshCalendars_Blank_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(
        main,
        sidebar({
          title: "Jump to a dated month",
          downloads: meta.download,
          downloadTitles: meta.downloadTitles,
          extra: `<h3>Also</h3><p><a href="/printable-blank-yearly-calendar.html">Blank yearly poster</a> · <a href="/printable-monday-start-calendar.html">Monday-start dated</a></p>`,
        }),
      )}`,
      { preloadImage: displayPreviewUrl(meta.download.png) },
    );
  }

  if (entry.kind === "blank-yearly") {
    const hero = `${downloadHero(
      meta,
      meta.download.png,
      "Fresh Calendars · Blank yearly",
      "Undated twelve mini-month fill-in poster — month names only, empty cells for any year you write in.",
    )}
${adBand(ADS.blankTop, "FreshCalendars_BlankYearly_Header")}`;
    const main = `
<section class="section prose">
  <h2>Undated year at a glance</h2>
  <p>Use this when you need a reusable wall poster, a custom fiscal span, or a draft before printing a dated yearly calendar.</p>
  <div class="cta">
    <a class="btn btn-primary btn-sm" href="/blank-calendars.html">Blank monthly pack</a>
    <a class="btn btn-ghost btn-sm" href="/printable-calendars.html">Dated yearly</a>
    <a class="btn btn-ghost btn-sm" href="/guides/fiscal-year-calendar.html">Fiscal year guide</a>
  </div>
</section>
${adUnit(ADS.blankMid, "FreshCalendars_BlankYearly_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(
        main,
        sidebar({
          title: "Blank tools",
          downloads: meta.download,
          downloadTitles: meta.downloadTitles,
        }),
      )}`,
      { preloadImage: displayPreviewUrl(meta.download.png) },
    );
  }

  if (entry.kind === "guide") {
    return renderGuidePage(entry, meta, today);
  }

  if (entry.kind === "holidays-evergreen" || entry.kind === "holidays-fixed") {
    const y = year ?? new Date().getFullYear();
    const locale: HolidayLocale = entry.holidayLocale ?? "us";
    const list = holidaysForYear(y, { locale });
    const localeLabel = locale === "uk" ? "UK" : locale === "ca" ? "Canada" : "US";
    const primaryWhen =
      locale === "uk"
        ? { href: "/when-is/uk-boxing-day/", label: "Boxing Day" }
        : locale === "ca"
          ? { href: "/when-is/ca-thanksgiving/", label: "Canadian Thanksgiving" }
          : { href: "/when-is/thanksgiving/", label: "Thanksgiving" };
    const alsoLinks =
      locale === "us"
        ? `<p>Also: <a href="/uk-holidays/">UK holidays</a> · <a href="/canada-holidays/">Canada holidays</a>.</p>`
        : locale === "uk"
          ? `<p>Also: <a href="/holidays/">US holidays</a> · <a href="/canada-holidays/">Canada holidays</a>.</p>`
          : `<p>Also: <a href="/holidays/">US holidays</a> · <a href="/uk-holidays/">UK holidays</a>.</p>`;
    const countries = `<nav class="holiday-country-tabs" aria-label="Holiday country">${[["us", "/holidays/", "United States"], ["uk", "/uk-holidays/", "United Kingdom"], ["ca", "/canada-holidays/", "Canada"]].map(([id, href, name]) => `<a href="${href}"${id === locale ? ' aria-current="page"' : ""}>${name}</a>`).join("")}</nav>`;
    const hero = `
<section class="hero"><div class="hero-inner">
  ${countries}
  <div class="eyebrow">Fresh Calendars · ${localeLabel} Holidays</div>
  <h1>${y} ${localeLabel} holiday dates</h1>
  <p class="lead">${esc(meta.description)}</p>
  <div class="cta">
    <a class="btn btn-primary" href="/printable-calendars.html" title="${y} printable yearly calendar">${y} Calendar</a>
    <a class="btn btn-ghost" href="${primaryWhen.href}" title="When is ${primaryWhen.label} ${y}?">${esc(primaryWhen.label)}</a>
  </div>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_Holidays_Top")}`;
    const main = `
<section class="section prose">
  <h2>All ${y} ${localeLabel} holidays and observances</h2>
  <p>Browse the dates below, filter by holiday name or type, and open a holiday for future dates and planning details.</p>
  ${alsoLinks}
  <p>Print the year: <a href="/printable-calendars.html">${y} yearly</a> · <a href="/printable-yearly-calendar.html">${y + 1} yearly</a> · <a href="/printable-school-calendar.html">school year hub</a>.</p>
  <div data-holiday-filter><div class="holiday-toolbar"><label>${iconHtml("search")}<input type="search" data-holiday-query placeholder="Find a holiday…" aria-label="Find a holiday"></label><label>Type<select data-holiday-kind><option value="">All types</option>${[...new Set(list.map(h => h.kind))].map(kind => `<option value="${esc(kind)}">${esc(kind)}</option>`).join("")}</select></label><button type="button" data-holiday-reset>Reset filters</button></div><p class="holiday-result" data-holiday-count aria-live="polite">${list.length} dates</p><div class="table-scroll" role="region" aria-label="${y} holidays table" tabindex="0">
  <table class="hol-table" data-holiday-table>
    <thead><tr><th>Holiday</th><th>Type</th><th>Date</th></tr></thead>
    <tbody>
      ${list
        .map(
          (h) => `<tr data-holiday-row data-name="${esc(h.name.toLowerCase())}" data-kind="${esc(h.kind)}">
        <td><a href="${holidayWhenIsPath(h.slug)}" title="When is ${esc(h.name)} ${y}?">${esc(h.name)}</a></td>
        <td><span class="kind-pill">${esc(h.kind)}</span></td>
        <td>${esc(h.formatted)}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>
  </div><p data-holiday-empty hidden>No holidays match. Try another name or type.</p></div>
</section>
${adUnit(ADS.holiday, "FreshCalendars_New_Holidays", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(
        main,
        sidebar({
          title: `${y} months`,
          year: y,
          downloads: meta.download,
          downloadTitles: meta.downloadTitles,
          extra: `<h3>Print with marks</h3><p>Open any month and choose the holidays template to see labels in-cell.</p>`,
        }),
      )}`,
    );
  }

  if (entry.kind === "holiday" || entry.kind === "easter") {
    const y = year ?? new Date().getFullYear();
    const slug = entry.holidaySlug ?? "easter";
    const def = holidayDefBySlug(slug);
    if (!def) throw new Error(`Unknown holiday ${slug}`);
    const h = resolveHoliday(def, y);
    const dayKey = h.iso.replaceAll("-", "");
    const endDate = new Date(Date.UTC(h.year, h.month - 1, h.day + 1)).toISOString().slice(0, 10).replaceAll("-", "");
    const calendarEvent = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Fresh Calendars//Holiday dates//EN", "BEGIN:VEVENT", `UID:${slug}-${y}@freshcalendars.com`, `DTSTAMP:${today.toISOString().slice(0, 10).replaceAll("-", "")}T000000Z`, `DTSTART;VALUE=DATE:${dayKey}`, `DTEND;VALUE=DATE:${endDate}`, `SUMMARY:${h.name.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;")}`, `URL:https://freshcalendars.com${holidayWhenIsPath(slug)}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    const mSlug = monthNumberToSlug(h.month);
    const mName = monthNumberToName(h.month);
    const locale = holidayLocaleForSlug(slug);
    const hub = holidaysHubPath(locale);
    const hubLabel =
      locale === "uk" ? "UK holidays" : locale === "ca" ? "Canada holidays" : "US holidays";
    const ed = getHolidayEditorial(slug);
    const lead = ed ? ed.lead(h) : `${h.blurb}`;
    const overview = ed
      ? ed.overview(h).map((p) => `<p>${esc(p)}</p>`).join("\n  ")
      : `<p>${esc(h.name)} ${y} falls on <strong>${esc(h.formatted)}</strong>. ${esc(h.blurb)}</p>`;
    const howCalc = ed ? ed.howCalculated(h) : ruleHowCalculated(def, h);
    // Same rule, next five years: answers "when is X 2028" without a page per year.
    const upcoming = [y, y + 1, y + 2, y + 3, y + 4].map((yy) => resolveHoliday(def, yy));
    const datesTable = `<h3>${esc(h.name)} dates, ${y} to ${y + 4}</h3>
  <table class="dates-table">
    <thead><tr><th scope="col">Year</th><th scope="col">Date</th><th scope="col">Day of the week</th></tr></thead>
    <tbody>
      ${upcoming
        .map((u) => {
          const date = u.date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
          return `<tr><td>${u.year}</td><td>${esc(date)}</td><td>${esc(u.weekdayName)}</td></tr>`;
        })
        .join("\n      ")}
    </tbody>
  </table>`;
    const meaning = ed
      ? `<h3>${esc(ed.meaningTitle)}</h3>
  ${ed.meaning(h).map((p) => `<p>${esc(p)}</p>`).join("\n  ")}`
      : "";
    const tips = ed
      ? ed.planningTips(h)
      : [
          `Block travel and school closures on the ${mName} ${y} sheet before the week fills up.`,
          `Use the weekly planner pack for the seven days around ${h.formatted}.`,
          `Scan nearby federal or observance days on the full ${hubLabel} list.`,
          `For classrooms, jump to the school-year hub and mark breaks by hand.`,
        ];
    const printTip =
      locale === "uk"
        ? `Open the <a href="/${mSlug}-calendars.html" title="${mName} ${y} printable calendar">${mName} ${y} printable</a> and mark ${esc(h.name)} on the grid (UK bank holidays are listed on our <a href="${hub}">${hubLabel}</a> hub). Prefer a wall overview? Grab the <a href="/printable-calendars.html">${y} yearly poster</a>.`
        : locale === "ca"
          ? `Open the <a href="/${mSlug}-calendars.html" title="${mName} ${y} printable calendar">${mName} ${y} printable</a> and mark ${esc(h.name)} beside other Canadian dates from our <a href="${hub}">${hubLabel}</a> hub. Prefer a wall overview? Grab the <a href="/printable-calendars.html">${y} yearly poster</a>.`
          : `Open the <a href="/${mSlug}-calendars.html" title="${mName} ${y} printable calendar">${mName} ${y} printable</a> and choose the holidays-marked template so ${esc(h.name)} is labeled in-cell when the engine includes it. Prefer a wall overview? Grab the <a href="/printable-calendars.html">${y} yearly poster</a> or plan ahead with <a href="/printable-yearly-calendar.html">${y + 1} yearly</a>.`;
    // Neighbours by date (across the year boundary), so every when-is page
    // gets links from the pages around it rather than only from January's.
    const pool = [y - 1, y, y + 1]
      .flatMap((yy) => holidaysForYear(yy, { locale }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const at = pool.findIndex((x) => x.slug === slug && x.year === y);
    const seen = new Set([slug]);
    const nearby: typeof pool = [];
    for (let d = 1; nearby.length < 8 && d < pool.length; d++) {
      for (const x of [pool[at + d], pool[at - d]]) {
        if (x && !seen.has(x.slug) && nearby.length < 8) {
          seen.add(x.slug);
          nearby.push(x);
        }
      }
    }
    const related = nearby
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(
        (x) =>
          `<a href="${holidayWhenIsPath(x.slug)}" title="When is ${esc(x.name)}?">${esc(x.name)}</a>`,
      )
      .join("");
    const dstGuide =
      slug === "daylight-savings"
        ? `<p>Need both spring-forward and fall-back dates on one checklist? See our <a href="/page/daylight-savings/">daylight saving time guide</a>.</p>`
        : "";
    const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · When is…</div>
  <h1>When is ${esc(h.name)} ${y}${locale === "uk" && !/\bUK\b/.test(h.name) ? " in the UK" : locale === "ca" && !/Canad/.test(h.name) ? " in Canada" : ""}?</h1>
  <p class="lead">${esc(lead)}</p>
  <div class="date-answer"><span>Next date</span><strong>${esc(h.formatted)}</strong><a href="data:text/calendar;charset=utf-8,${encodeURIComponent(calendarEvent)}" download="${slug}-${y}.ics">${iconHtml("calendar")}Add to calendar</a></div>
  <div class="cta">
    <a class="btn btn-primary" href="/${mSlug}-calendars.html" title="Printable ${mName} ${y} calendar">${mName} calendar</a>
    ${downloadBtn(meta.download.pdf, "Download PDF", meta.downloadTitles.pdf, "ghost")}
  </div>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_WhenIs_Top")}`;
    const main = `
<section class="section prose">
  <h2>${esc(h.name)} ${y}</h2>
  ${overview}
  <p>This page always shows the next ${esc(h.name)}: once ${esc(h.formatted)} has passed, it switches to the ${y + 1} date.</p>
  ${datesTable}
  <h3>How the date is calculated</h3>
  <p>${esc(howCalc)}</p>
  <p>The same holiday engine powers our <a href="${hub}">${hubLabel} list</a>${locale === "us" ? " and US Holidays Marked monthly templates" : ""}.</p>
  ${meaning}
  <h3>Print this month</h3>
  <p>${printTip}</p>
  ${dstGuide}
  <h3>Plan around ${esc(h.name)}</h3>
  <ul>
    ${tips.map((t) => `<li>${esc(t)}</li>`).join("\n    ")}
    <li>Use the <a href="/printable-weekly-calendar.html">weekly planner pack</a> for the days around ${esc(h.formatted)}.</li>
  </ul>
  ${volatile(latestNewsHtml(slug))}${adUnit(ADS.holiday, "FreshCalendars_New_Holidays", "banner")}
  <h3>Nearby holidays</h3>
  <div class="side-links" style="grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));display:grid;gap:.5rem">${related}</div>
</section>
${adUnit(ADS.blankMid, "FreshCalendars_WhenIs_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(
      meta,
      `${hero}${withSidebar(
        main,
        sidebar({
          year: y,
          title: "Related",
          downloads: meta.download,
          downloadTitles: meta.downloadTitles,
          currentSlug: mSlug,
        }),
      )}`,
    );
  }

  const key = entry.legal ?? "contact";
  if (key === "about") {
    const py = resolvePlanningYear(today);
    const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · About</div>
  <h1>About Fresh Calendars</h1>
  <p class="lead">Free printable calendars generated from a live engine — monthly, yearly, weekly, blank, and school hubs with accurate US holidays.</p>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_About_Top")}`;
    const main = `
<section class="section prose">
  <h2>What we make</h2>
  <p>Fresh Calendars publishes evergreen printable pages so bookmarks stay useful: month URLs roll to the next occurrence, and yearly hubs track the current planning year (${py}) plus a dedicated next-year page (${py + 1}).</p>
  <p>Monthly pages offer scenic, modern, minimal, floral, landscape, holiday and planner designs, with Sunday or Monday starts. Yearly pages include minimal and floral posters alongside the original formats. Weekly planners include classic, Monday-start, hourly, priorities, and habit-tracker packs — all free to download.</p>
  <h2>How downloads work</h2>
  <p>PNG and PDF files are generated as print-ready sheets and delivered at full quality. Please link to our calendar pages (not the raw file URLs) when you share Fresh Calendars with others.</p>
  <h2>Get in touch</h2>
  <p>Questions about licensing or a broken file? Use the <a href="/page/contact/">contact form</a>. Advertising details live on <a href="/page/advertising/">About advertising</a>.</p>
  <div class="cta">
    <a class="btn btn-primary" href="/printable-calendars.html">${py} yearly</a>
    <a class="btn btn-ghost" href="/printable-yearly-calendar.html">${py + 1} yearly</a>
    <a class="btn btn-ghost" href="/printable-weekly-calendar.html">Weekly pack</a>
  </div>
</section>
${faqSection(meta)}`;
    return layout(meta, `${hero}${withSidebar(main, sidebar({ title: "Browse", today }))}`);
  }

  if (key === "advertising") {
    const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · Advertising</div>
  <h1>How ads keep Fresh Calendars free</h1>
  <p class="lead">We use Google AdSense so printable calendars can stay free. Here’s how ads appear and how you can control personalization.</p>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_Advertising_Top")}`;
    const main = `
<section class="section prose">
  <h2>Why ads appear</h2>
  <p>Reserved ad units (sidebar, in-content banners) and Google Auto ads help cover hosting so calendars stay free. We do not sell your contact-form messages.</p>
  <h2>What you may see</h2>
  <ul>
    <li>Manual units in content and the sidebar on most pages</li>
    <li>Auto-placed formats configured in our AdSense account (for example in-page or anchor ads)</li>
  </ul>
  <h2>Your choices</h2>
  <p>Manage ad personalization in <a href="https://adssettings.google.com/" rel="noopener noreferrer">Google Ads Settings</a>. See our <a href="/page/privacy-policy/">Privacy Policy</a> for cookies, partners, and logs. Affiliate relationships are summarized on our <a href="/page/disclosure/">disclosure page</a>.</p>
</section>
${faqSection(meta)}`;
    return layout(meta, `${hero}${withSidebar(main, sidebar({ title: "Site", today }))}`);
  }

  if (key === "disclosure") {
    const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · Disclosure</div>
  <h1>Affiliate &amp; advertising disclosure</h1>
  <p class="lead">How Fresh Calendars may earn from advertising and affiliate links while keeping printable calendars free.</p>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_Disclosure_Top")}`;
    const main = `
<section class="section prose">
  <h2>Amazon Associates</h2>
  <p>FreshCalendars.com is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for website owners to earn advertising fees by advertising and linking to Amazon.com, Amazon.co.uk, Amazon.ca, and other sites affiliated with the Amazon Services LLC Associates Program.</p>
  <h2>Display advertising</h2>
  <p>We also use Google AdSense and may show other third-party ads. Ads are not endorsements. See <a href="/page/advertising/">Advertising on Fresh Calendars</a> and our <a href="/page/privacy-policy/">Privacy Policy</a> for cookies and personalization controls.</p>
  <h2>Questions</h2>
  <p>Use the <a href="/page/contact/">contact form</a> if you have questions about this disclosure.</p>
</section>
${faqSection(meta)}`;
    return layout(meta, `${hero}${withSidebar(main, sidebar({ title: "Site", today }))}`);
  }

  if (key === "contact") {
    const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars</div>
  <h1>Message Fresh Calendars</h1>
  <p class="lead">Questions about templates, downloads, licensing, or a broken file — send a note. We store messages securely and reply by email.</p>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_Contact_Top")}`;
    const main = `
<section class="section prose">
  <h2>Send a message</h2>
  <form id="contact-form" class="contact-form" action="/api/contact.php" method="post" novalidate>
    <label>Name
      <input type="text" name="name" required maxlength="120" autocomplete="name" placeholder="Your name" title="Your name" />
    </label>
    <label>Email
      <input type="email" name="email" required maxlength="190" autocomplete="email" placeholder="you@example.com" title="Your email address" />
    </label>
    <label>Subject
      <select name="subject" required title="Message subject">
        <option value="general">General question</option>
        <option value="download">Download / file issue</option>
        <option value="licensing">Licensing</option>
        <option value="other">Other</option>
      </select>
    </label>
    <label>Message
      <textarea name="message" required maxlength="5000" placeholder="How can we help?" title="Your message"></textarea>
    </label>
    <div class="hp" aria-hidden="true">
      <label>Website <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
    </div>
    <div class="cta" style="margin:0">
      <button class="btn btn-primary" type="submit" title="Send contact message">Send message</button>
    </div>
    <p id="contact-msg" class="form-msg" role="status" aria-live="polite"></p>
  </form>
  <h2>Email</h2>
  <p><a href="mailto:info@freshcalendars.com">info@freshcalendars.com</a></p>
  <h2>Mailing address</h2>
  <p>Fresh Calendars, Inc.<br />295 NW Lost Springs Terrace<br />Portland, OR 97229<br />United States</p>
</section>
${adUnit(ADS.homeMid, "FreshCalendars_Contact_Bottom", "banner")}
${faqSection(meta)}`;
    return layout(meta, `${hero}${withSidebar(main, sidebar({ title: "Browse", today }))}`);
  }

  if (key === "school-holidays") {
    const py = resolvePlanningYear(today);
    const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · School year</div>
  <h1>School holidays &amp; academic calendars</h1>
  <p class="lead">August–July school-year planning with printable month packs — mark district breaks yourself and print Classic or Monday-start templates.</p>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_SchoolHolidays_Top")}`;
    const main = `
<section class="section prose">
  <h2>Printable school-year calendars</h2>
  <p>District calendars vary by state and county. Fresh Calendars has a <a href="/printable-school-calendar.html">school-year hub</a> with an Aug–Jul overview and month-by-month downloads for ${py}–${py + 1}.</p>
  <p>For US federal observances, see the <a href="/holidays/">holidays list</a>. For DST planning, see <a href="/page/daylight-savings/">daylight saving time</a>.</p>
  <div class="cta">
    <a class="btn btn-primary" href="/printable-school-calendar.html">School year hub</a>
    <a class="btn btn-ghost" href="/blank-calendars.html">Blank templates</a>
  </div>
</section>
${faqSection(meta)}`;
    return layout(meta, `${hero}${withSidebar(main, sidebar({ title: "Browse", today }))}`);
  }

  if (key === "daylight-savings") {
    const py = resolvePlanningYear(today);
    const dst = holidaysForYear(py).find((h) => h.slug === "daylight-savings");
    const dstNext = holidaysForYear(py + 1).find((h) => h.slug === "daylight-savings");
    // Lead names the next upcoming change of each kind; the bake runs daily.
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const nextFallBack =
      usDstFallBack(py).date.getTime() >= startToday ? usDstFallBack(py) : usDstFallBack(py + 1);
    const springDef = holidayDefBySlug("daylight-savings")!;
    const nextSpring = resolveNextHoliday(springDef, today);
    const hero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · DST</div>
  <h1>Daylight saving time ${py}</h1>
  <p class="lead">Next US clock changes: fall back on ${esc(nextFallBack.formatted)} and spring forward on ${esc(nextSpring.formatted)}, both at 2:00 a.m. local time.</p>
</div></section>
${adBand(ADS.inArticle, "FreshCalendars_Dst_Top")}`;
    const main = `
<section class="section prose">
  <h2>${py} &amp; ${py + 1} dates</h2>
  <ul>
    <li><strong>${py} start:</strong> ${dst ? esc(dst.formatted) : "Second Sunday of March"}, clocks spring forward</li>
    <li><strong>${py} end:</strong> ${esc(usDstFallBack(py).formatted)}, clocks fall back</li>
    <li><strong>${py + 1} start:</strong> ${dstNext ? esc(dstNext.formatted) : "Second Sunday of March"}, clocks spring forward</li>
    <li><strong>${py + 1} end:</strong> ${esc(usDstFallBack(py + 1).formatted)}, clocks fall back</li>
  </ul>
  <p>Daylight saving time starts on the second Sunday of March and ends on the first Sunday of November. Hawaii and most of Arizona stay on standard time all year.</p>
  <p>Also see <a href="/when-is/daylight-savings/">when is daylight saving time</a> for the March start date and a printable March calendar.</p>
  <div class="cta">
    <a class="btn btn-primary" href="/printable-calendars.html">${py} yearly calendar</a>
    <a class="btn btn-ghost" href="/holidays/">US holidays</a>
  </div>
</section>
${faqSection(meta)}`;
    return layout(meta, `${hero}${withSidebar(main, sidebar({ title: "Browse", today }))}`);
  }

  const lead =
    key === "privacy-policy"
      ? "How Fresh Calendars collects, uses, and protects information when you browse, download, or contact us — including cookies, hosting logs, AdSense, and contact-form messages."
      : "Rules for using Fresh Calendars, downloading free printable calendars, linking to our pages, and the limits of our liability.";
  const body = key === "privacy-policy" ? privacyPolicyBody() : termsOfUseBody();
  const label = key === "privacy-policy" ? "Privacy" : "Terms";
  const legalHero = `
<section class="hero"><div class="hero-inner">
  <div class="eyebrow">Fresh Calendars · Legal</div>
  <h1>${esc(meta.title.split("|")[0]!.trim())}</h1>
  <p class="lead">${esc(lead)}</p>
  <p class="lead" style="font-size:.95rem">Last updated: October 25, 2026</p>
</div></section>
${adBand(ADS.inArticle, `FreshCalendars_${label}_Top`)}`;
  const legalMain = `
<section class="section prose legal-doc">
${body}
</section>
${faqSection(meta)}`;
  return layout(meta, `${legalHero}${withSidebar(legalMain, sidebar({ title: "Site", today }))}`);
}

function privacyPolicyBody(): string {
  return `
<p>This Privacy Policy explains how <strong>Fresh Calendars, Inc.</strong> (“Fresh Calendars”, “we”, “us”, “our”) handles information on <a href="https://freshcalendars.com/">https://freshcalendars.com/</a> (the “Site”). We take visitor privacy seriously. If you have questions, use our <a href="/page/contact/">contact form</a>.</p>

<h2>1. Scope</h2>
<p>This policy covers online activity on the Site only — browsing, downloads, advertising impressions, and messages you send through our contact form. It does not cover offline collection or third-party sites we link to.</p>
<p>By using the Site you consent to this Privacy Policy. If you do not agree, please stop using the Site.</p>

<h2>2. Information we collect</h2>
<h3>2.1 Server and delivery logs</h3>
<p>Like most websites, our hosting and file-delivery providers automatically record technical data when you visit, including:</p>
<ul>
  <li>IP address (or truncated network address)</li>
  <li>Browser type and version, device class, and operating system hints</li>
  <li>Date and time of requests, requested URLs, referrer, and response status</li>
  <li>Approximate geography derived from IP (city/region level at most)</li>
</ul>
<p>We use these logs to operate the Site, diagnose errors, protect against abuse, measure traffic, and improve performance. Log data is not combined by us with your name or email unless you also submit a contact form.</p>

<h3>2.2 Contact form</h3>
<p>If you send a message through <a href="/page/contact/">/page/contact/</a>, we collect the fields you provide (typically name, email, subject, and message). We store that inquiry in our database so we can reply and keep a record of support requests. We do not use contact-form fields for advertising profiles, and we do not sell them.</p>

<h3>2.3 Cookies, local storage, and similar technologies</h3>
<p>The Site and our partners may use cookies, pixels, local storage, or similar technologies to:</p>
<ul>
  <li>Remember preferences and keep basic site features working</li>
  <li>Measure visits and content performance</li>
  <li>Deliver and measure advertising (see Advertising below)</li>
</ul>
<p>You can control cookies in your browser settings. Blocking some cookies may affect ads or optional features; core printable downloads remain available.</p>

<h2>3. Advertising (Google AdSense)</h2>
<p>We use <strong>Google AdSense</strong> to show ads so we can keep printable calendars free. Google and its partners may use cookies or device identifiers to serve ads based on your visit to this Site and other sites.</p>
<ul>
  <li>Google’s partner-sites explanation: <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer" target="_blank">policies.google.com/technologies/partner-sites</a></li>
  <li>Ad personalization controls: <a href="https://adssettings.google.com/" rel="noopener noreferrer" target="_blank">adssettings.google.com</a></li>
  <li>About ads &amp; data: <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer" target="_blank">policies.google.com/technologies/ads</a></li>
</ul>
<p>Third-party ad networks receive your IP address when their creative loads and may use JavaScript, cookies, or web beacons to measure campaigns or personalize ads. <strong>Fresh Calendars does not control those third-party cookies</strong> and this Privacy Policy does not govern advertisers’ independent practices. Review each partner’s policy for opt-out details.</p>
<p>Our authorized digital sellers file is published at <a href="/ads.txt">/ads.txt</a>. Affiliate relationships (including Amazon Associates) are described on our <a href="/page/disclosure/">disclosure page</a>.</p>

<h2>4. How we use information</h2>
<p>We use collected information to:</p>
<ul>
  <li>Provide, secure, and improve the Site and downloadable calendars</li>
  <li>Respond to contact-form messages</li>
  <li>Detect fraud, spam, and technical abuse</li>
  <li>Understand aggregate traffic and which calendars people need</li>
  <li>Display advertising that supports free access</li>
  <li>Comply with law or enforce our <a href="/page/terms-of-use/">Terms of Use</a></li>
</ul>
<p><strong>We do not sell personal information.</strong> We do not rent contact-form inboxes to marketers.</p>

<h2>5. Sharing</h2>
<p>We may share limited data with:</p>
<ul>
  <li><strong>Service providers</strong> that host the Site, store form messages, deliver downloadable files, or filter abuse — only as needed to perform those services</li>
  <li><strong>Advertising partners</strong> such as Google, as described above</li>
  <li><strong>Authorities</strong> when required by law, valid legal process, or to protect users, the Site, or our rights</li>
</ul>
<p>Calendar PNG/PDF files you download are served as static assets; downloading a file does not create an account on Fresh Calendars.</p>

<h2>6. Retention</h2>
<p>Server logs are kept for a limited operational period (typically weeks to a few months) unless needed longer for security investigations. Contact-form messages are kept until we resolve your request and for a reasonable archive period afterward, then deleted or anonymized when no longer needed. Advertising cookies follow each partner’s retention rules.</p>

<h2>7. Security</h2>
<p>We use HTTPS, access controls on admin tools, and standard hosting protections. No method of transmission or storage is perfectly secure; please avoid sending sensitive financial or government ID data through the contact form.</p>

<h2>8. Children’s privacy</h2>
<p>The Site is a general-audience resource for printable calendars. We do not knowingly collect personal information from children under 13. If you believe a child under 13 submitted personal data to us, <a href="/page/contact/">contact us</a> and we will delete it promptly.</p>

<h2>9. International visitors</h2>
<p>The Site is operated with infrastructure that may process data in the United States and other countries where our hosts or delivery partners operate. If you access the Site from elsewhere, you consent to that processing as described here.</p>

<h2>10. Your choices</h2>
<ul>
  <li>Use browser controls to block or delete cookies</li>
  <li>Use Google Ads Settings (and similar industry tools) to limit personalized ads</li>
  <li>Request correction or deletion of a contact-form message you sent by contacting us from the same email address</li>
  <li>Stop using the Site if you do not accept this policy</li>
</ul>

<h2>11. Changes</h2>
<p>We may update this Privacy Policy from time to time. The “Last updated” date at the top of this page will change when we do. Continued use of the Site after an update means you accept the revised policy. For material changes we may also highlight the update on the Site when practical.</p>

<h2>12. Contact</h2>
<p>Questions about privacy: email <a href="mailto:info@freshcalendars.com">info@freshcalendars.com</a>, use the <a href="/page/contact/">contact form</a>, or write to Fresh Calendars, Inc., 295 NW Lost Springs Terrace, Portland, OR 97229, United States.</p>
`;
}

function termsOfUseBody(): string {
  return `
<p>Please read these Terms of Use (“Terms”) carefully before using <a href="https://freshcalendars.com/">https://freshcalendars.com/</a> (the “Service” or “Site”) operated by <strong>Fresh Calendars, Inc.</strong>, an Oregon company at 295 NW Lost Springs Terrace, Portland, OR 97229 (“Fresh Calendars”, “we”, “us”, “our”). By accessing or using the Service you agree to these Terms. If you disagree with any part, do not use the Service.</p>

<h2>1. The Service</h2>
<p>Fresh Calendars provides free printable calendar templates (including PNG and PDF downloads), holiday reference pages, and related informational content. Features, URLs, and available years may change as calendars roll forward automatically.</p>

<h2>2. License to use calendars</h2>
<ul>
  <li>Calendars and previews on the Site are <strong>free for personal, classroom, and internal non-commercial use</strong> (for example printing for your home, school, or office wall).</li>
  <li>You may <strong>not</strong> redistribute, resell, sublicense, or re-host our calendar files (PNG, PDF, or other downloads) in bulk, in paid packs, on file-sharing sites, or as a competing download library — whether online or offline.</li>
  <li>You may not use the calendars or Site content for unlawful purposes.</li>
  <li>We do not grant trademark rights in the name “Fresh Calendars” or site branding beyond normal descriptive linking.</li>
</ul>
<p>If you need redistribution, white-label, or commercial licensing beyond personal use, <a href="/page/contact/">contact us</a> before proceeding.</p>

<h2>3. Linking to Fresh Calendars</h2>
<ul>
  <li>You may link to our public HTML pages (paths ending in <code>.html</code> or the Site homepage) from websites or blogs that are not illegal, pornographic, or harmful.</li>
  <li>You may <strong>not</strong> hotlink or deep-link directly to downloadable asset files (for example <code>.pdf</code> or <code>.png</code> file URLs) as a substitute for sending visitors to our pages, except for ordinary user downloads initiated from our Site.</li>
  <li>You may not frame the Site in a way that disguises our branding or misleads visitors about the source of the content.</li>
</ul>

<h2>4. Informational content only</h2>
<p>Holiday dates, weekday layouts, and editorial copy are provided for general information. While we generate calendars from a rules engine, content may contain typographical or technical errors. Do not rely on the Site as your sole source for legal, payroll, religious, or safety-critical scheduling decisions. You use information and downloads at your own risk.</p>

<h2>5. No warranty; downloads</h2>
<p>The Service and all calendars are provided “as is” and “as available,” without warranties of any kind, express or implied — including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that files will open on every device, print perfectly on every printer, or remain available at the same URL forever.</p>
<p>If a downloaded calendar does not meet your expectations, contains a date error, or fails to open, we are not obligated to provide a refund (the files are free) or specific damages; please report issues via the contact form so we can investigate.</p>

<h2>6. Advertising</h2>
<p>The Site may display third-party advertisements (including Google AdSense). Ads are not endorsements. Your use of ads and advertisers’ sites is subject to their terms and privacy policies. See our <a href="/page/privacy-policy/">Privacy Policy</a> for how advertising technologies work on the Site.</p>

<h2>7. Third-party links</h2>
<p>The Service may link to third-party websites or file hosts we do not control. We are not responsible for their content, policies, or practices. Review their terms and privacy policies before using them.</p>

<h2>8. Acceptable use</h2>
<p>You agree not to:</p>
<ul>
  <li>Attack, scrape at abusive volume, or interfere with the Service or its infrastructure</li>
  <li>Attempt to access admin areas, private configuration, or other users’ messages</li>
  <li>Submit spam, malware, or unlawful content through the contact form</li>
  <li>Misrepresent affiliation with Fresh Calendars</li>
</ul>

<h2>9. Changes to the Service</h2>
<p>We may modify, suspend, or discontinue any part of the Service — including templates, years, holiday lists, or downloads — at any time with or without notice. We may also change designs, engine rules, or URLs (for example evergreen month pages that roll to the next occurrence).</p>

<h2>10. Changes to these Terms</h2>
<p>We may update these Terms at our discretion. The “Last updated” date will change when we do. For material changes we will try to provide reasonable notice (for example at least 15 days when practical). Continued use after changes become effective constitutes acceptance. If you do not agree, stop using the Service.</p>

<h2>11. Termination</h2>
<p>We may suspend or block access to the Service immediately, without prior notice, if you breach these Terms or if needed to protect the Site or other users. Provisions that by nature should survive (including ownership, disclaimers, indemnity, and limitations of liability) will survive termination.</p>

<h2>12. Limitation of liability</h2>
<p>To the fullest extent permitted by law, Fresh Calendars and its operators will not be liable for any direct, indirect, incidental, consequential, special, or punitive damages — including lost profits, lost data, lost time, or business interruption — arising out of or related to your use of (or inability to use) the Service or any calendar file, even if advised of the possibility of such damages.</p>

<h2>13. Indemnity</h2>
<p>You agree to indemnify and hold harmless Fresh Calendars and its operators from claims, damages, losses, and expenses (including reasonable legal fees) arising from your misuse of the Service, your redistribution of files in violation of these Terms, or your violation of law or third-party rights.</p>

<h2>14. Governing law</h2>
<p>These Terms are governed by the laws of the State of Oregon, United States, without regard to conflict-of-law rules. State and federal courts located in Oregon will have exclusive jurisdiction over disputes arising from these Terms, except where prohibited by applicable consumer law.</p>

<h2>15. Entire agreement</h2>
<p>These Terms, together with the <a href="/page/privacy-policy/">Privacy Policy</a>, are the entire agreement between you and us regarding the Service and supersede prior agreements on the same subject. If a court finds any provision unenforceable, the remaining provisions remain in effect. Our failure to enforce a provision is not a waiver.</p>

<h2>16. Contact</h2>
<p>Questions about these Terms: email <a href="mailto:info@freshcalendars.com">info@freshcalendars.com</a>, use the <a href="/page/contact/">contact form</a>, or write to Fresh Calendars, Inc., 295 NW Lost Springs Terrace, Portland, OR 97229, United States.</p>
`;
}

export function renderConceptHubs(home: SeoMeta, today: Date): { meta: SeoMeta; html: string; file: string }[] {
  return [
    { id: "calendar-library", path: "/calendars/", title: "Free Printable Calendars | Fresh Calendars", description: "Browse free printable monthly, yearly, blank and weekly calendars. Choose a design and download PDF or PNG files for home, school and work.", body: calendarLibrary(today, false) },
    { id: "monthly-library", path: "/monthly-calendars/", title: "Monthly Calendars | Free PDF & PNG Templates", description: "Find your monthly calendar. Filter by month, year and design, then choose A4 or Letter paper and a Sunday or Monday start. Free PDF and PNG downloads.", body: calendarLibrary(today, true) },
    { id: "calendar-tools", path: "/calendar-tools/", title: "Calendar Tools | Date Calculators & Planning", description: "Calculate days between two dates or add and subtract days from a date. Simple calendar tools to help you plan school, work and everyday life.", body: calendarTools(today) },
  ].map(p => {
    const canonical = `https://freshcalendars.com${p.path}`;
    const ogImagePath = `/og/${p.id}.png`, ogUrl = `https://cdn.freshcalendars.com${ogImagePath}`;
    const meta: SeoMeta = { ...home, pageId: p.id, url: canonical, canonical, title: p.title, description: p.description, faq: [], variants: undefined, calendar: { family: "guide", year: null, month: null, weekStartsOn: 0 }, hreflang: [{ lang: "en", href: canonical }, { lang: "x-default", href: canonical }], openGraph: { ...home.openGraph, title: p.title, description: p.description, url: canonical }, twitter: { ...home.twitter, title: p.title, description: p.description }, breadcrumbs: [{ name: "Home", url: "https://freshcalendars.com/" }, { name: p.title.split("|")[0]!.trim(), url: canonical }], jsonLd: [JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: p.title, description: p.description, url: canonical, inLanguage: "en-US" })] };
    meta.ogImagePath = ogImagePath; meta.openGraph.images = [{ url: ogUrl, width: 1200, height: 630, alt: p.title }]; meta.twitter.image = ogUrl;
    return { meta, html: layout(meta, p.body, { today }), file: p.path.slice(1) + "index.html" };
  });
}

export async function writeSitemap(metas: SeoMeta[]): Promise<void> {
  const indexable = metas.filter((m) => m.robots.includes("index"));
  const urls = indexable
    .map(
      (m) => `  <url>
    <loc>${esc(m.url)}</loc>
    <lastmod>${m.sitemap.lastmod}</lastmod>
    <changefreq>${m.sitemap.changefreq}</changefreq>
    <priority>${m.sitemap.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  await writeSitePage("sitemap.xml", xml);

  const imageUrls = indexable
    .filter((m) => m.download?.png || (m.variants && m.variants.length))
    .map((m) => {
      const imgs = m.variants?.length
        ? m.variants.map((v) => ({ loc: v.png, title: v.pngTitle || v.label }))
        : [{ loc: m.download.png, title: m.downloadTitles.png || m.title }];
      const imageXml = imgs
        .map(
          (img) => `    <image:image>
      <image:loc>${esc(img.loc)}</image:loc>
      <image:title>${esc(img.title)}</image:title>
    </image:image>`,
        )
        .join("\n");
      return `  <url>
    <loc>${esc(m.url)}</loc>
${imageXml}
  </url>`;
    })
    .join("\n");
  const imageSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imageUrls}
</urlset>
`;
  await writeSitePage("sitemap-images.xml", imageSitemap);

  const feedItems = indexable
    .filter((m) =>
      ["home", "yearly", "monthly", "blank", "holidays", "guide"].includes(m.calendar.family),
    )
    .slice(0, 40)
    .map(
      (m) => `    <item>
      <title>${esc(m.title)}</title>
      <link>${esc(m.url)}</link>
      <guid>${esc(m.url)}</guid>
      <description>${esc(m.description)}</description>
      <pubDate>${new Date(m.sitemap.lastmod).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Fresh Calendars</title>
    <link>${absUrl("/")}</link>
    <description>Free printable monthly, weekly, yearly, and blank calendars with US holidays.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${feedItems}
  </channel>
</rss>
`;
  await writeSitePage("feed.xml", rss);

  await writeSitePage(
    "robots.txt",
    `User-agent: *\nAllow: /\nSitemap: ${absUrl("/sitemap.xml")}\nSitemap: ${absUrl("/sitemap-images.xml")}\n` +
      (NEWS_LAUNCHED ? NEWS_SITEMAPS.map((p) => `Sitemap: ${SITE_ORIGIN}${p}\n`).join("") : ""),
  );
  // Legacy Google Search Console HTML verification (backup/public_html).
  await writeSitePage(
    "google4512fedecec7c802.html",
    "google-site-verification: google4512fedecec7c802.html\n",
  );
  // IndexNow key (Bing/Yandex/etc.) — key file must be served at /{key}.txt
  const indexNowKey = "freshcalendars-indexnow-2026";
  await writeSitePage(`${indexNowKey}.txt`, `${indexNowKey}\n`);
  // Authorized sellers for Google AdSense (carry forward prior production ads.txt).
  try {
    const adsTxt = await fs.readFile(path.join(ROOT, "legacy/public_html/ads.txt"), "utf8");
    await writeSitePage("ads.txt", adsTxt.trimEnd() + "\n");
  } catch {
    await writeSitePage(
      "ads.txt",
      "google.com, pub-2597035827677267, DIRECT, f08c47fec0942fa0\n",
    );
  }

  const llms = `# Fresh Calendars

> Free printable monthly, weekly, yearly, school-year, and blank calendars (PNG & PDF) with accurate weekdays and US holidays.

Site: ${absUrl("/")}
Downloads: https://cdn.freshcalendars.com
Feed: ${absUrl("/feed.xml")}

## Primary pages
- ${absUrl("/")} — homepage, current & next month
- ${absUrl("/printable-calendars.html")} — current planning-year yearly posters
- ${absUrl("/printable-yearly-calendar.html")} — next-year yearly posters
- ${absUrl("/printable-weekly-calendar.html")} — weekly planner templates + this week
- ${absUrl("/printable-school-calendar.html")} — August–July academic hub
- ${absUrl("/blank-calendars.html")} — undated blank monthly (5 templates)
- ${absUrl("/printable-blank-yearly-calendar.html")} — undated blank yearly poster
- ${absUrl("/printable-monday-start-calendar.html")} — Monday-start monthly hub
- ${absUrl("/print-guide.html")} — how to print (paper, margins, ink)
- ${absUrl("/holidays")} — US holidays (planning year)
- ${absUrl("/uk-holidays")} — UK bank holidays
- ${absUrl("/canada-holidays")} — Canada holidays
- ${absUrl("/guides/classroom-printable-calendars.html")} — classroom guide
- ${absUrl("/page/about")} — about the site
- ${absUrl("/page/contact")} — contact form

${
  NEWS_LAUNCHED
    ? `## News
- ${SITE_ORIGIN}/news/ — calendar, holiday and date news (Fresh Calendars News Desk)
- ${SITE_ORIGIN}/news/feed.xml — news RSS
- ${SITE_ORIGIN}/news/sitemap.xml — news sitemap index

`
    : ""
}## Monthly evergreen (always next occurrence)
${MONTH_SLUGS.map((m) => `- ${absUrl(`/${m}-calendars.html`)}`).join("\n")}

## Holiday when-is pages (engine-calculated)
${allHolidayRules().map((h) => `- ${absUrl(holidayWhenIsPath(h.slug))} — ${h.name}`).join("\n")}

## Notes for crawlers
- Prefer evergreen month/year/holiday URLs. Year-qualified twin paths 301 to evergreen.
- Monthly, yearly, and weekly pages each offer five independent print templates.
- Print files live under /assets/… on the downloads host; link HTML pages, not raw files.
- Image sitemap: ${absUrl("/sitemap-images.xml")}
`;
  await writeSitePage("llms.txt", llms);

  await writeBrandIcons();
  await writeSitePage("fonts.css", FONTS_CSS);
}

export function htaccessContent(): string {
  /** Real /page/* legal/guide hubs — never rewrite these to when-is. */
  const pageHubs = new Set([
    "about",
    "contact",
    "privacy",
    "privacy-policy",
    "terms",
    "terms-of-use",
    "advertising",
    "disclosure",
    "school-holidays",
    "daylight-savings",
  ]);
  const whenIsSlugs = allHolidayRules()
    .map((h) => h.slug)
    .filter((slug) => !slug.startsWith("uk-") && !slug.startsWith("ca-") && !pageHubs.has(slug));
  // Alternation for /page/{holiday} → /when-is/{holiday}/
  const pageToWhenIs = whenIsSlugs.sort().join("|");
  /** Legacy holiday templates without a live when-is page → US holidays hub. */
  const legacyOrphanPages = [
    "armed-forces-day",
    "constitution-day",
    "day-of-the-dead",
    "dia-de-los-muertos",
    "indigenous-peoples-day",
    "international-womens-day",
    "native-americans-day",
    "samhain",
    "star-wars-day",
    "world-environment-day",
    "world-teachers-day",
  ].join("|");

  return `Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# Legacy year-qualified twins → evergreen (HTTPS absolute; no duplicate indexable URLs)
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

RewriteRule ^printable-calendar\\.html$ https://freshcalendars.com/printable-calendars.html [R=301,L]
RewriteRule ^([a-z]+)-calendar\\.html$ https://freshcalendars.com/$1-calendars.html [R=301,L]
RewriteRule ^blank-calendar\\.html$ https://freshcalendars.com/blank-calendars.html [R=301,L]
RewriteRule ^([0-9]{4})-calendar\\.html$ https://freshcalendars.com/printable-calendars.html [R=301,L]
RewriteRule ^year/([0-9]{4})/?$ https://freshcalendars.com/printable-calendars.html [R=301,L]

RewriteRule ^printable-calendars-([0-9]{4})\\.html$ https://freshcalendars.com/printable-calendars.html [R=301,L]
RewriteRule ^printable-calendar-([0-9]{4})\\.html$ https://freshcalendars.com/printable-calendars.html [R=301,L]
RewriteRule ^([a-z]+)-calendars-([0-9]{4})\\.html$ https://freshcalendars.com/$1-calendars.html [R=301,L]
RewriteRule ^printable-([a-z]+)-([0-9]{4})-calendar\\.html$ https://freshcalendars.com/$1-calendars.html [R=301,L]
RewriteRule ^([0-9]{4})-holidays\\.html$ https://freshcalendars.com/holidays/ [R=301,L]
RewriteRule ^when-is/easter-([0-9]{4})\\.html$ https://freshcalendars.com/when-is/easter/ [R=301,L]
RewriteRule ^when-is/([a-z0-9-]+)-([0-9]{4})\\.html$ https://freshcalendars.com/when-is/$1/ [R=301,L]

# Legacy month printable-* twins only — never rewrite Fresh hubs (yearly/weekly/school/monday-start)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^printable-(january|february|march|april|may|june|july|august|september|october|november|december)-calendar\\.html$ https://freshcalendars.com/$1-calendars.html [R=301,L]
RewriteRule ^printable-blank-calendar\\.html$ https://freshcalendars.com/blank-calendars.html [R=301,L]
RewriteRule ^weekly-calendars\\.html$ https://freshcalendars.com/printable-weekly-calendar.html [R=301,L]
RewriteRule ^school-calendars\\.html$ https://freshcalendars.com/printable-school-calendar.html [R=301,L]
RewriteRule ^monday-start-calendars\\.html$ https://freshcalendars.com/printable-monday-start-calendar.html [R=301,L]
RewriteRule ^yearly-calendars\\.html$ https://freshcalendars.com/printable-yearly-calendar.html [R=301,L]
RewriteRule ^calendar\\.html$ https://freshcalendars.com/printable-calendars.html [R=301,L]
RewriteRule ^holidays\\.html$ https://freshcalendars.com/holidays/ [R=301,L]
RewriteRule ^australia-holidays/?$ https://freshcalendars.com/holidays/ [R=301,L]
RewriteRule ^india-holidays/?$ https://freshcalendars.com/holidays/ [R=301,L]
RewriteRule ^when-is/([a-z0-9-]+)\\.html$ https://freshcalendars.com/when-is/$1/ [R=301,L]
RewriteRule ^about/?$ https://freshcalendars.com/page/about/ [R=301,L]
RewriteRule ^contact/?$ https://freshcalendars.com/page/contact/ [R=301,L]
RewriteRule ^page/privacy/?$ https://freshcalendars.com/page/privacy-policy/ [R=301,L]
RewriteRule ^page/terms/?$ https://freshcalendars.com/page/terms-of-use/ [R=301,L]
RewriteRule ^page/contact\\.html$ https://freshcalendars.com/page/contact/ [R=301,L]
RewriteRule ^page/privacy-policy\\.html$ https://freshcalendars.com/page/privacy-policy/ [R=301,L]
RewriteRule ^page/terms-of-use\\.html$ https://freshcalendars.com/page/terms-of-use/ [R=301,L]
# Legacy /page/{holiday} soft pages → evergreen when-is (legal hubs excluded above / by slug list)
RewriteRule ^page/(${pageToWhenIs})/?$ https://freshcalendars.com/when-is/$1/ [R=301,L]
# Legacy observances without a when-is page → US holidays hub
RewriteRule ^page/(${legacyOrphanPages})/?$ https://freshcalendars.com/holidays/ [R=301,L]
RewriteRule ^editor(/.*)?$ https://freshcalendars.com/blank-calendars.html [R=301,L]

# Legacy JPG asset paths → evergreen month pages
RewriteRule ^printable/monthly/[0-9]{4}/(january|february|march|april|may|june|july|august|september|october|november|december)/ https://freshcalendars.com/$1-calendars.html [R=301,L]
</IfModule>

<IfModule mod_headers.c>
  # Monthly factory + CF purge on deploy → long TTLs are safe and keep TTFB tiny.
  <FilesMatch "\\.(woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(svg|png|ico|webmanifest|webp|jpg|jpeg|css|js)$">
    Header set Cache-Control "public, max-age=2592000, stale-while-revalidate=604800"
  </FilesMatch>
  <FilesMatch "\\.(pdf)$">
    Header set Cache-Control "public, max-age=2592000, stale-while-revalidate=604800"
  </FilesMatch>
  <FilesMatch "\\.(html)$">
    Header set Cache-Control "public, max-age=604800, stale-while-revalidate=2592000"
    Header set CDN-Cache-Control "public, max-age=2678400"
  </FilesMatch>
  # /news/ (apps/news, published every 15 min): short TTLs; hashed /news/_astro/ files are immutable.
  # nginx serves /news/ itself (hestia-apply-nginx-cache.sh); this is the Apache fallback.
  <If "%{REQUEST_URI} =~ m#^/news/_astro/#">
    Header set Cache-Control "public, max-age=31536000, immutable"
    Header unset CDN-Cache-Control
  </If>
  <ElseIf "%{REQUEST_URI} =~ m#^/news/#">
    Header set Cache-Control "public, max-age=300, stale-while-revalidate=600"
    Header set CDN-Cache-Control "public, max-age=600"
  </ElseIf>
</IfModule>
`;
}

export function renderNotFoundHtml(): string {
  const today = new Date();
  return `<!doctype html>
<html lang="en" class="family-default" data-design-version="concept-v3" data-design-layout="error">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
${THEME_BOOT_HTML}
<title>Page not found | Fresh Calendars</title>
<meta name="robots" content="noindex,follow" />
${brandHeadLinks()}
<meta name="theme-color" content="#007b48" />
<link rel="canonical" href="${absUrl("/404.html")}" />
${FONT_PRELOAD}
<style>${FONTS_CSS}${CSS}</style>
</head>
<body>
${siteHeaderHtml(today, { news: NEWS_LAUNCHED })}
<main id="main">
  <section class="concept-wrap error-page"><div class="error-visual" aria-hidden="true"><strong>404</strong></div><div class="error-content"><p class="overline">A fresh start</p><h1>That page isn’t here</h1><p>The address may have changed. Find a calendar in the library, try the search above, or start again from the homepage.</p><div class="error-links"><a href="/calendars/">${iconHtml("calendar")}Browse calendars</a><a href="/">Home</a><a href="/page/contact/">Report a broken link</a></div></div></section>
</main>
${siteFooterHtml(today, { news: NEWS_LAUNCHED })}
<script>${NAV_JS}</script>
</body>
</html>
`;
}

export function resolveEntryYear(
  entry: UrlEntry,
  today: Date,
  planningYear: number,
  monthYears: Record<number, number>,
): { year: number; month?: number } {
  if (entry.kind === "home") {
    return { year: planningYear, month: today.getMonth() + 1 };
  }
  if (entry.year) {
    return {
      year: entry.year,
      month: entry.month ? monthSlugToNumber(entry.month) : undefined,
    };
  }
  if (entry.kind.startsWith("monthly") && entry.month) {
    const month = monthSlugToNumber(entry.month);
    return { year: monthYears[month]!, month };
  }
  if (entry.pageId === "yearly-next") {
    return { year: planningYear + 1 };
  }
  // when-is evergreen: next occurrence of that holiday (like monthly next-occurrence)
  if (entry.kind === "easter" || entry.kind === "holiday") {
    const slug = entry.holidaySlug ?? "easter";
    const def = holidayDefBySlug(slug);
    if (!def) return { year: planningYear };
    return { year: resolveHolidayYear(def, today) };
  }
  if (entry.kind.includes("holidays") || entry.kind.includes("yearly")) {
    return { year: planningYear };
  }
  return { year: planningYear };
}

export function entryToRelPath(entry: UrlEntry): string {
  if (entry.path === "/" || entry.path === "") return "index.html";
  const p = entry.path.replace(/^\//, "").replace(/\/+$/, "");
  if (p.endsWith(".html") || p.endsWith(".xml") || p.endsWith(".txt")) return p;
  return `${p}/index.html`;
}
