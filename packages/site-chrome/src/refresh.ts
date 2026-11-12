/**
 * 2026-11 refresh. The last layer of the shared stylesheet: one scale for radius, shadow and motion,
 * a neutral ink palette with green kept for actions, and lighter (600) headings. Colors live in the
 * tokens of design.ts; this file only shapes components, so both themes follow without extra rules.
 */
export const REFRESH_CSS = `
:root{
  --r-xs:6px; --r-sm:8px; --r-md:10px; --r-lg:14px; --r-xl:20px; --r-pill:999px;
  --shadow-xs:0 1px 2px rgba(13,21,18,.05);
  --shadow-sm:0 1px 2px rgba(13,21,18,.04),0 2px 8px -2px rgba(13,21,18,.06);
  --shadow-md:0 1px 2px rgba(13,21,18,.04),0 10px 28px -10px rgba(13,21,18,.14);
  --shadow-lg:0 2px 4px rgba(13,21,18,.04),0 24px 56px -16px rgba(13,21,18,.22);
  --ease:cubic-bezier(.2,.7,.2,1);
  --font-display:Sora,"Sora Fallback",Manrope,sans-serif;
  --header-h:64px;
}
html[data-theme=dark]{
  --shadow-xs:0 1px 2px rgba(0,0,0,.4);
  --shadow-sm:0 1px 2px rgba(0,0,0,.4),0 2px 8px -2px rgba(0,0,0,.4);
  --shadow-md:0 1px 2px rgba(0,0,0,.4),0 12px 28px -10px rgba(0,0,0,.6);
  --shadow-lg:0 2px 4px rgba(0,0,0,.4),0 24px 56px -16px rgba(0,0,0,.7);
}

/* ——— Base ——— */
body{color:var(--ink); -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility; -webkit-tap-highlight-color:transparent}
::selection{background:color-mix(in srgb,var(--accent) 22%,transparent); color:var(--ink-strong)}
:focus-visible{outline:2px solid var(--focus); outline-offset:2px}
h1,h2,h3,h4{color:var(--ink-strong); font-weight:600}
h1,.section h2,.section h3,.gallery-copy h3,.showcase-card h3{font-family:var(--font-display)}
:is(a,button,summary,input,select,textarea,.shelf-card,.library-card,.gallery-item){transition:color .15s var(--ease),background-color .15s var(--ease),border-color .15s var(--ease),box-shadow .2s var(--ease),transform .2s var(--ease)}
.overline,.eyebrow,.workspace-heading .eyebrow{font-size:12px; font-weight:600; letter-spacing:.09em; text-transform:uppercase; color:var(--muted)}

/* ——— Header: one quiet bar, the page shows through it ——— */
.site-header-bar{background:transparent; border-bottom:1px solid var(--line-soft)}
/* The blur sits on a pseudo-element: a backdrop-filter on the bar itself would become the
   containing block of the fixed mobile menu. */
.site-header-bar::before{content:""; position:absolute; inset:0; z-index:-1; background:color-mix(in srgb,var(--paper) 84%,transparent); -webkit-backdrop-filter:saturate(1.6) blur(14px); backdrop-filter:saturate(1.6) blur(14px)}
.site-header{min-height:var(--header-h); gap:20px; padding:0}
.brand{margin-right:14px}
.brand-wordmark{font:700 1.375rem/1 var(--font-display); letter-spacing:-.07em}
.nav-group>summary,.nav>a{font-size:14px; font-weight:600; color:var(--ink); border-radius:var(--r-sm)}
.nav-group>summary{gap:6px}
.nav-group>summary::after{content:""; width:6px; height:6px; border:solid currentColor; border-width:0 1.5px 1.5px 0; transform:translateY(-2px) rotate(45deg); opacity:.55; transition:transform .2s var(--ease)}
.nav-group[open]>summary::after{transform:translateY(1px) rotate(225deg)}
.nav-group[open]>summary{color:var(--ink-strong)}
.nav a[aria-current=page]{color:var(--ink-strong); box-shadow:none; background:var(--surface-soft); border-radius:var(--r-sm)}
.nav-panel a{border-radius:var(--r-sm); color:var(--ink)}
.nav a:hover,.nav a:focus-visible,.nav-panel a:hover{background:var(--surface-soft); color:var(--ink-strong)}
.nav-toggle{border:1px solid var(--line); border-radius:var(--r-md); font-weight:600; font-size:14px; background:var(--paper); box-shadow:var(--shadow-xs)}
.nav-toggle-bars i{height:1.5px}
.nav{border-radius:var(--r-lg); border-color:var(--line); box-shadow:var(--shadow-lg); padding:8px}
.nav-drawer[open]::before{background:rgba(9,13,11,.38); -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px)}
.site-search-box{min-height:40px; border-radius:var(--r-md); background:var(--surface-soft); border:1px solid var(--line-soft); color:var(--muted)}
.site-search-box:hover{border-color:var(--line)}
.site-search-box:focus-within{background:var(--paper); border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 16%,transparent)}
.site-search-box:has(input:focus-visible){outline:0}
.site-search input{font-size:14px}
.search-results{border-radius:var(--r-lg); border-color:var(--line); box-shadow:var(--shadow-lg); padding:8px}
.search-results a{border-radius:var(--r-sm)}
.search-results a:hover,.search-results a:focus{background:var(--surface-soft)}
.search-group{font-size:11px; letter-spacing:.09em}
.theme-toggle{min-width:40px; min-height:40px; border-radius:var(--r-md); color:var(--ink)}
.theme-toggle:hover{background:var(--surface-soft); color:var(--ink-strong)}
.header-utilities{gap:6px; margin-left:0}
@media(min-width:1024px){
  .nav-drawer>.nav,.nav-drawer[open]>.nav{gap:2px}
  .nav>a,.nav-group>summary{padding:8px 11px; min-height:36px; color:var(--ink)}
  .nav>a:hover,.nav>a:focus-visible,.nav-group>summary:hover{background:var(--surface-soft); color:var(--ink-strong)}
  .nav-panel{top:calc(100% + 10px); min-width:280px; padding:8px; border-radius:var(--r-lg); border-color:var(--line); box-shadow:var(--shadow-lg)}
  .nav-panel a{padding:9px 12px; font-weight:400}
  .nav-panel a:hover{background:var(--surface-soft); color:var(--ink-strong)}
  .nav-months{border-top-color:var(--line-soft); padding-top:8px; margin-top:8px}
  .nav .nav-months a{justify-content:center; color:var(--muted)}
}
@media(max-width:1023px){
  .site-header{padding:10px 0}
  .nav{top:64px}
  .nav-group>summary,.nav>a{min-height:46px; padding:10px 14px; font-size:15px}
  .nav-panel{border-left-color:var(--line-soft)}
}

/* ——— Buttons ——— */
.btn,.btn-sm{min-height:42px; padding:10px 16px; border-radius:var(--r-md); border-width:1px; font-size:14px; font-weight:600; letter-spacing:-.005em}
.btn:hover{filter:none}
.btn-primary,.prose a.btn-primary{background:var(--brand); border-color:var(--brand); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.14),var(--shadow-xs)}
.btn-primary:hover,.prose a.btn-primary:hover{background:var(--focus); border-color:var(--focus); color:#fff}
html[data-theme=dark] .btn-primary:hover{background:#0c8a52!important; border-color:#0c8a52!important}
.btn-ghost,.prose a.btn-ghost{background:var(--paper); border-color:var(--line); color:var(--ink-strong); box-shadow:var(--shadow-xs)}
.btn-ghost:hover,.prose a.btn-ghost:hover{background:var(--surface-soft); border-color:color-mix(in srgb,var(--ink-strong) 24%,var(--line)); color:var(--ink-strong)}

/* ——— Home hero. Its height stays 505px: the live mini month is placed by percentage on the
   calendar in the photograph, and a taller box would crop the photo away from under it. ——— */
.home-hero{background:var(--wash)}
.home-hero::after{background:linear-gradient(90deg,var(--paper) 0%,color-mix(in srgb,var(--paper) 90%,transparent) 30%,color-mix(in srgb,var(--paper) 4%,transparent) 66%)}
.hero-copy{padding:30px 0}
.home-hero .overline{display:inline-flex; align-items:center; gap:8px; margin:0 0 18px; padding:6px 12px 6px 10px; border:1px solid var(--line); border-radius:var(--r-pill); background:color-mix(in srgb,var(--paper) 80%,transparent); color:var(--ink); font-size:12px; letter-spacing:.06em}
.home-hero .overline::before{content:""; width:6px; height:6px; border-radius:50%; background:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 20%,transparent)}
.home-hero h1{font-size:clamp(34px,3.75vw,54px); font-weight:600; line-height:1.05; letter-spacing:-.04em; max-width:640px; margin:0 0 18px; color:var(--ink-strong)}
.hero-intro{font-size:18px; line-height:1.55; color:var(--ink); max-width:500px; margin:0 0 24px}
.hero-search{max-width:540px; margin:0 0 24px}
.hero-search .site-search-box{min-height:56px; padding:6px 6px 6px 18px; border-radius:var(--r-lg); background:var(--paper); border:1px solid var(--line); box-shadow:var(--shadow-md)}
.hero-search input{font-size:15px; min-height:42px; color:var(--ink-strong)}
.hero-search button{width:44px; height:44px; min-width:44px; border-radius:var(--r-md); background:var(--brand); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.14)}
.hero-search button:hover{background:var(--focus)}
html[data-theme=dark] .hero-search button:hover{background:#0c8a52}
.hero-search button .ui-icon{width:20px; height:20px}
.category-launchers{gap:8px; max-width:700px}
.category-launchers a{gap:10px; min-height:88px; padding:14px 6px; border:1px solid var(--line); border-radius:var(--r-lg); background:color-mix(in srgb,var(--paper) 88%,transparent); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); color:var(--ink-strong); font-size:13px; font-weight:600; line-height:1.3; box-shadow:var(--shadow-xs)}
.category-launchers .ui-icon,.category-launchers [class*=tone-] .ui-icon{width:20px; height:20px; color:var(--ink-strong); opacity:.82; transition:color .15s var(--ease),opacity .15s var(--ease)}
.category-launchers a:hover{border-color:color-mix(in srgb,var(--ink-strong) 22%,var(--line)); background:var(--paper); box-shadow:var(--shadow-md); transform:translateY(-2px)}
.category-launchers a:hover .ui-icon{color:var(--accent); opacity:1}
/* The mini month is drawn on the photographed paper, which stays light in both themes: its
   background is that paper's color clipped to the glyphs, so the contrast gate knows what the text sits on. */
.hero-paper{color:#16211c}
.hero-mini-months{color:#2a3832}
.hero-mini-months .is-today{background:#087443}
@media(max-width:1023px){
  .hero-copy{padding:40px 0}
  .home-hero h1{font-size:40px}
  .home-hero::after{background:linear-gradient(90deg,color-mix(in srgb,var(--paper) 94%,transparent),color-mix(in srgb,var(--paper) 82%,transparent) 55%,color-mix(in srgb,var(--paper) 22%,transparent))}
}
@media(max-width:640px){
  .hero-copy{padding:32px 0 28px}
  .home-hero h1{font-size:34px; max-width:14ch}
  .home-hero .overline{margin-bottom:16px}
  .hero-intro{font-size:16px; margin-bottom:22px}
  .hero-search{margin-bottom:20px}
  .hero-search .site-search-box{min-height:52px; padding-left:14px}
  .hero-search input{font-size:16px}
  .hero-search button{width:40px; height:40px; min-width:40px}
  .category-launchers{gap:8px}
  .category-launchers a{min-height:80px; padding:12px 4px}
  .home-hero::after{background:color-mix(in srgb,var(--paper) 90%,transparent)}
}

/* ——— Shelves and cards ——— */
.popular-calendars{padding:48px 0 40px}
.shelf-heading{margin-bottom:22px; gap:20px}
.shelf-heading h2{font:600 24px/1.2 var(--font-display); letter-spacing:-.03em}
.shelf-heading>a{font-size:14px; font-weight:600; color:var(--ink-strong); padding:8px 12px; margin-right:-12px; border-radius:var(--r-sm)}
.shelf-heading>a:hover{background:var(--surface-soft)}
.shelf-filters{gap:4px; padding:4px; border-radius:var(--r-pill); background:var(--surface-soft); border:1px solid var(--line-soft)}
.shelf-filters button{padding:6px 12px; border:0; border-radius:var(--r-pill); font-size:13px; font-weight:600; color:var(--muted)}
.shelf-filters button:hover{color:var(--ink-strong)}
.shelf-filters button[aria-pressed=true]{background:var(--paper); color:var(--ink-strong); box-shadow:var(--shadow-xs)}
.calendar-shelf{gap:22px; grid-auto-columns:calc((100% - 110px)/6); padding:4px 2px 8px; margin:-4px -2px 0}
.shelf-preview{background:var(--surface-soft); border:1px solid var(--line-soft); border-radius:var(--r-lg); box-shadow:none; padding:10px}
.shelf-preview img{height:186px; background:transparent; filter:drop-shadow(0 1px 1px rgba(13,21,18,.10)) drop-shadow(0 6px 14px rgba(13,21,18,.10)); transition:transform .3s var(--ease)}
.shelf-card:hover .shelf-preview{border-color:var(--line); background:var(--wash)}
.shelf-card:hover .shelf-preview img{transform:translateY(-3px) scale(1.015)}
.shelf-card h3{font-size:15px; font-weight:600; margin:12px 0 8px}
.shelf-card h3 a:hover{color:var(--accent)}
.file-chip{min-height:28px; padding:3px 9px; border-color:var(--line); border-radius:var(--r-xs); font-size:12px; font-weight:600; letter-spacing:.02em; color:var(--ink)}
.file-chip:hover{border-color:var(--accent); color:var(--focus); background:var(--surface-tint)}
.shelf-next{right:-34px; width:36px; height:36px; min-height:36px; display:grid; place-items:center; border:1px solid var(--line); border-radius:50%; background:var(--paper); color:var(--ink-strong); box-shadow:var(--shadow-sm)}
.shelf-next:hover{box-shadow:var(--shadow-md); transform:translateX(2px)}
.home-news{gap:40px; padding:8px 0 48px}
.hn-cards{gap:24px}
.hn-card{gap:8px}
.hn-card img{border-radius:var(--r-md); border-color:var(--line-soft)}
.hn-cat{font-size:11px; letter-spacing:.09em; color:var(--muted)}
.hn-title{font:600 15px/1.35 var(--font-display); letter-spacing:-.015em}
.hn-card:hover .hn-title,.hn-card:focus-visible .hn-title{color:var(--accent); text-decoration:none}
.hn-card time{font-size:13px}
.hn-dates a{border-color:var(--line-soft); border-radius:var(--r-md); background:var(--paper); padding:10px 14px}
.hn-dates a:hover,.hn-dates a:focus-visible{border-color:var(--line); background:var(--surface-soft)}
.hn-d{border-right-color:var(--line-soft); color:var(--muted)}
.hn-in{font-size:13px; font-weight:600}
.home-more{border-top-color:var(--line-soft)}
.gallery-item,.gallery-item:nth-child(even){padding:12px; border-color:var(--line-soft); border-radius:var(--r-lg); gap:12px}
.gallery-item:hover{border-color:var(--line); box-shadow:var(--shadow-md)}
.gallery-visual{background:var(--surface-soft); padding:10px; border-radius:var(--r-md)}
.gallery-visual img,.gallery-visual a.img-link img{box-shadow:none; filter:drop-shadow(0 1px 1px rgba(13,21,18,.10)) drop-shadow(0 6px 14px rgba(13,21,18,.10))}
.gallery-copy h3{font-size:16px; font-weight:600; letter-spacing:-.015em}
.showcase-card,.yearly-band{border-color:var(--line-soft); border-radius:var(--r-lg)}
.feature-list li{border-left:2px solid var(--accent); border-radius:0 var(--r-sm) var(--r-sm) 0; background:var(--surface-soft)}

/* ——— Calendar page (studio): the sheet lies on a desk-colored panel ——— */
.calendar-detail{padding:28px 0 48px}
.concept-breadcrumb{font-size:13px; color:var(--muted); margin-bottom:24px}
.concept-breadcrumb a{color:var(--muted)}
.concept-breadcrumb a:hover{color:var(--ink-strong)}
.studio-columns{gap:48px; max-width:1120px}
.studio-preview{padding:28px; border:1px solid var(--line-soft); border-radius:var(--r-xl); background:var(--surface-soft); box-shadow:none}
.studio-preview>img{background:transparent; filter:drop-shadow(0 1px 2px rgba(13,21,18,.12)) drop-shadow(0 14px 30px rgba(13,21,18,.14))}
.preview-arrow{width:40px; height:40px; min-width:40px; min-height:40px; border:1px solid var(--line); background:var(--paper); color:var(--ink-strong); box-shadow:var(--shadow-sm)}
.preview-arrow:hover{box-shadow:var(--shadow-md)}
.preview-arrow.previous{left:-20px} .preview-arrow.next{right:-20px}
.studio-thumbnails{gap:10px; padding:16px 2px 12px}
.studio-thumbnails button{width:72px; height:88px; padding:4px; border:1px solid var(--line-soft); border-radius:var(--r-md); background:var(--surface-soft)}
.studio-thumbnails button:hover{border-color:var(--line)}
.studio-thumbnails button[aria-pressed=true]{border:1px solid var(--accent); background:var(--paper); box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 30%,transparent)}
.studio-style-tabs{gap:6px}
.studio-style-tabs button{min-height:32px; padding:5px 12px; border:1px solid var(--line-soft); border-radius:var(--r-pill); font-size:13px; font-weight:600; color:var(--ink)}
.studio-style-tabs button:hover{border-color:var(--line); color:var(--ink-strong)}
.studio-style-tabs button[aria-pressed=true]{background:var(--ink-strong); border-color:var(--ink-strong); color:var(--paper)}
.studio-options h1{font:600 clamp(28px,2.6vw,36px)/1.12 var(--font-display); letter-spacing:-.035em; max-width:20ch; margin:0 0 14px}
.studio-options>p{font-size:16px; line-height:1.6; max-width:44ch; margin:0 0 28px; color:var(--muted)}
.studio-options legend,.studio-field>label{font-size:13px; font-weight:600; color:var(--ink-strong); margin:0 0 10px}
.studio-options fieldset{margin-bottom:22px}
.studio-field{margin-bottom:22px}
.studio-field select{min-height:38px; border-radius:var(--r-md); font-size:14px; font-weight:600; color:var(--ink-strong); padding:6px 12px; box-shadow:var(--shadow-xs)}
.option-row{gap:8px}
.option-row button{min-height:40px; padding:8px 14px; border-radius:var(--r-md); border-color:var(--line); font-size:14px; font-weight:600; color:var(--ink); box-shadow:var(--shadow-xs)}
.option-row button:hover{border-color:color-mix(in srgb,var(--ink-strong) 24%,var(--line)); color:var(--ink-strong)}
.option-row button[aria-pressed=true],.option-row button[data-choice=format][aria-pressed=true]{background:var(--ink-strong); border-color:var(--ink-strong); color:var(--paper); box-shadow:none; min-width:0}
.studio-options .format-note{font-size:13px; color:var(--muted); margin:4px 0 12px}
.studio-primary,.studio-secondary{min-height:50px; max-width:380px; border-radius:var(--r-lg); font-size:15px; font-weight:600}
.studio-primary{background:var(--brand); border-color:var(--brand); box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 1px 2px rgba(6,95,55,.3),0 6px 16px -6px rgba(6,95,55,.5)}
.studio-primary:hover{background:var(--focus); border-color:var(--focus); transform:translateY(-1px)}
.studio-primary:active,.studio-secondary:active,.btn:active{transform:scale(.985)}
html[data-theme=dark] .studio-primary:hover{background:#0c8a52!important; border-color:#0c8a52!important}
.studio-secondary{margin-top:10px; color:var(--ink-strong); border-color:var(--line); box-shadow:var(--shadow-xs)}
.studio-secondary:hover{background:var(--surface-soft); border-color:color-mix(in srgb,var(--ink-strong) 24%,var(--line))}
.studio-actions{gap:4px; margin-top:16px; max-width:380px}
.studio-actions a,.studio-actions button{min-height:36px; padding:6px 10px; border-radius:var(--r-sm); font-size:13px; font-weight:600; color:var(--muted)}
.studio-actions a:hover,.studio-actions button:hover{background:var(--surface-soft); color:var(--ink-strong)}
.download-benefits{max-width:1120px; margin-top:40px; padding:22px 26px; gap:24px; border:1px solid var(--line-soft); border-radius:var(--r-xl); background:var(--paper)}
.download-benefits .ui-icon{width:20px; height:20px; padding:9px; box-sizing:content-box; border-radius:var(--r-md); background:var(--surface-soft); color:var(--ink-strong)}
.download-benefits p{font-size:14px}
.download-benefits strong{font-weight:600}
.download-benefits span{font-size:13px}

/* ——— Library, rails and inner pages ——— */
.library-sidebar,.section-rail{border-right-color:var(--line-soft)}
.library-sidebar a,.section-rail nav a{border-radius:var(--r-sm); color:var(--ink); font-size:14px}
.library-sidebar a:hover,.section-rail nav a:hover{background:var(--surface-soft); color:var(--ink-strong)}
.library-sidebar a[aria-current=page],.section-rail nav a[aria-current=page]{background:var(--surface-soft); color:var(--ink-strong); font-weight:600; box-shadow:inset 2px 0 0 var(--accent)}
.library-sidebar .ui-icon,.section-rail .ui-icon{opacity:.75}
.library-sidebar h3,.section-rail h2{font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--muted)}
.rail-help{border-color:var(--line-soft); border-radius:var(--r-lg); background:var(--surface-soft)}
.library-main{padding:32px 0 56px}
.library-main h1,.workspace-heading h1,.tools-page h1,.hero h1{font:600 clamp(28px,2.7vw,38px)/1.12 var(--font-display); letter-spacing:-.035em}
.library-intro,.workspace-heading .lead,.hero .lead{color:var(--muted)}
.library-toolbar select,.library-search{min-height:38px; border-radius:var(--r-md); border-color:var(--line); box-shadow:var(--shadow-xs)}
.library-search:focus-within{border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 16%,transparent)}
.library-grid{gap:20px}
.library-card{padding:10px 10px 12px; border-color:var(--line-soft); border-radius:var(--r-lg)}
.library-card:hover{border-color:var(--line); box-shadow:var(--shadow-md); transform:translateY(-2px)}
.library-card img{border:0; border-radius:var(--r-md); background:var(--surface-soft); padding:10px; filter:none}
.library-card h2{font-size:15px; font-weight:600; margin:10px 4px 8px}
.library-card .file-chips{margin:0 4px}
.workspace-main{padding:32px 0 48px}
.workspace-heading{padding-bottom:28px; border-bottom-color:var(--line-soft)}
.workspace-heading .eyebrow{margin-bottom:12px}
.hero{background:var(--surface-soft)!important; border-bottom-color:var(--line-soft)}
.section{border-top-color:var(--line-soft)}
.section h2,.page-workspace .section h2{font-weight:600; letter-spacing:-.025em; color:var(--ink-strong)}
.section h3,.page-workspace .section h3{font-weight:600; letter-spacing:-.015em; color:var(--ink-strong)}
.prose a{font-weight:600; color:var(--focus); text-decoration-color:color-mix(in srgb,var(--focus) 35%,transparent); text-underline-offset:3px}
.prose a:hover{color:var(--accent); text-decoration-color:currentColor}
.prose code{background:var(--surface-soft); border:1px solid var(--line-soft); border-radius:var(--r-xs); color:var(--ink-strong)}
.section-jumps a{border-color:var(--line-soft); border-radius:var(--r-pill); padding:6px 12px; font-weight:600; color:var(--ink)}
.section-jumps a:hover{border-color:var(--line); background:var(--surface-soft); color:var(--ink-strong)}
.date-answer{gap:8px; max-width:440px; padding:22px 24px; border:1px solid color-mix(in srgb,var(--accent) 18%,var(--line)); border-radius:var(--r-xl); background:var(--surface-tint)}
.date-answer>span{font-size:11px; font-weight:600; letter-spacing:.1em}
.date-answer>strong{font:600 28px/1.15 var(--font-display); letter-spacing:-.03em}
.date-countdown{font-weight:600}
.side-card,.page-workspace .side-card{padding:16px; border-color:var(--line-soft); border-radius:var(--r-lg); background:var(--paper)}
.side-card>*:not(h2):not(h3){padding-left:0; padding-right:0}
.side-card>h2,.side-card>h3{font-family:inherit; font-size:14px; font-weight:600; letter-spacing:0; border-bottom-color:var(--line-soft); padding-bottom:10px; margin-bottom:12px}
.focus-card{background:var(--surface-soft)}
.focus-card strong{font-weight:600; letter-spacing:-.02em}
.side-links a{font-weight:600; color:var(--ink)}
.side-links a:hover{color:var(--accent)}
.month-chips a,.sidebar .month-chips a{border-color:var(--line-soft); border-radius:var(--r-sm); font-weight:600; color:var(--ink)}
.month-chips a:hover{border-color:var(--line); background:var(--surface-soft); color:var(--ink-strong)}
.sidebar .month-chips a.is-current{background:var(--ink-strong); border-color:var(--ink-strong); color:var(--paper)!important}
.sidebar .month-chips a.is-now::after{background:var(--accent)}
.month-pager a{border-color:var(--line); font-weight:600; font-size:14px; box-shadow:var(--shadow-xs)}
.month-pager a:hover,.month-pager a:focus-visible{border-color:color-mix(in srgb,var(--ink-strong) 24%,var(--line)); background:var(--surface-soft); color:var(--ink-strong)}

/* ——— Tables: hairlines, no stripes; the next date keeps its tint ——— */
.table-scroll{border:0; border-radius:var(--r-lg)}
.hol-table,.dates-table{border-color:var(--line-soft); border-radius:var(--r-lg)}
.hol-table th,.dates-table th{background:var(--surface-soft); color:var(--muted); font-size:11px; font-weight:600; letter-spacing:.09em; text-transform:uppercase; padding:11px 14px}
.hol-table td,.dates-table td{padding:13px 14px; border-top-color:var(--line-soft)}
.hol-table tr:nth-child(even) td{background:none}
.hol-table tbody tr:hover td{background:var(--surface-soft)}
.hol-table a{color:var(--ink-strong); font-weight:600}
.hol-table a:hover{color:var(--accent)}
.kind-pill{border-radius:var(--r-pill); padding:3px 9px; font-size:12px; font-weight:600}
.holiday-toolbar{padding:10px; border-color:var(--line-soft); border-radius:var(--r-lg)}
.holiday-toolbar input,.holiday-toolbar select{min-height:38px; border-radius:var(--r-md)}
.holiday-country-tabs{gap:4px; padding:4px; width:max-content; max-width:100%; border:1px solid var(--line-soft); border-radius:var(--r-pill); background:var(--surface-soft)}
.holiday-country-tabs a{border:0; border-radius:var(--r-pill); padding:6px 14px; font-weight:600; color:var(--muted)}
.holiday-country-tabs a:hover{color:var(--ink-strong)}
.holiday-country-tabs a[aria-current=page]{background:var(--paper); color:var(--ink-strong); box-shadow:var(--shadow-xs)}
html[data-theme=dark] .holiday-country-tabs a[aria-current=page]{background:var(--line)}
@media(max-width:600px){.hol-table tr:nth-child(even){background:none}}

/* ——— FAQ: a drawn plus that turns into a minus ——— */
.faq details{border-color:var(--line-soft); border-radius:var(--r-lg); padding:0 18px}
.faq details:hover{border-color:var(--line)}
.faq details[open]{background:var(--surface-soft)}
.faq summary{list-style:none; justify-content:space-between; gap:16px; padding:14px 0; font-weight:600}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:""; flex:none; width:12px; height:12px; background:linear-gradient(currentColor,currentColor) center/12px 1.5px no-repeat,linear-gradient(currentColor,currentColor) center/1.5px 12px no-repeat; opacity:.6; transition:transform .25s var(--ease)}
.faq details[open] summary::after{background:linear-gradient(currentColor,currentColor) center/12px 1.5px no-repeat; transform:rotate(180deg)}

/* ——— Forms and tools ——— */
.contact-form input,.contact-form textarea,.contact-form select,.date-tools input{border-color:var(--line); border-radius:var(--r-md); box-shadow:var(--shadow-xs)}
.contact-form :is(input,select,textarea):focus,.date-tools input:focus{outline:0; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 16%,transparent)}
.page-workspace .contact-form,.page-workspace[data-workspace=policy] .main{border-color:var(--line-soft); border-radius:var(--r-xl)}
.date-tools form{border-color:var(--line-soft); border-radius:var(--r-xl); background:var(--surface-soft)}
.date-tools h2{font:600 18px/1.3 var(--font-display); letter-spacing:-.02em}
.date-tools output{font-weight:600; color:var(--ink-strong)}

/* ——— Error page ——— */
.error-visual{border-color:var(--line-soft); border-radius:var(--r-xl)}
.error-visual>strong{font-weight:600; letter-spacing:-.06em}
.error-content h1{font-weight:600}
.error-links a{border-radius:var(--r-md); font-weight:600; font-size:14px; color:var(--ink-strong); box-shadow:var(--shadow-xs)}
.error-links a:first-child{background:var(--brand); border-color:var(--brand)}
.nf-suggest{border:1px solid color-mix(in srgb,var(--accent) 18%,var(--line)); border-radius:var(--r-xl)}

/* ——— Footer ——— */
.site-footer-bar{background:var(--surface-soft); border-top-color:var(--line-soft)}
.footer-grid{padding:56px 0 40px; gap:32px}
.footer-grid h2{font-family:inherit; font-size:13px; font-weight:600; letter-spacing:0; margin-bottom:14px}
.footer-grid nav{gap:10px}
.footer-grid nav a{color:var(--muted)}
.footer-grid nav a:hover{color:var(--ink-strong); text-decoration:none}
.footer-brand p{color:var(--muted)}
.footer-bottom{border-top-color:var(--line-soft); padding:20px 0 28px}
.footer-bottom a{color:var(--muted)}
.footer-bottom a:hover{color:var(--ink-strong)}

/* ——— Small screens ——— */
@media(max-width:1023px){
  .calendar-shelf{grid-auto-columns:calc((100% - 54px)/4); gap:18px}
  .studio-columns{gap:28px}
  .studio-preview{padding:18px}
  .shelf-next{right:-18px}
}
@media(max-width:640px){
  .popular-calendars{padding:32px 0 28px}
  /* The heading may wrap so its link stays on the same row instead of dropping below it. */
  .shelf-heading h2{font-size:18px; flex:1 1 0; min-width:0; white-space:normal}
  .shelf-heading>a{flex-shrink:0}
  .shelf-filters{padding:3px; border-radius:var(--r-lg)}
  .shelf-filters button{min-height:38px}
  .calendar-shelf{grid-auto-columns:calc((100% - 14px)/2); gap:14px}
  .shelf-preview img{height:200px}
  .studio-preview{padding:14px; border-radius:var(--r-lg)}
  .studio-options h1{font-size:27px}
  .studio-primary,.studio-secondary{max-width:none}
  .download-benefits{padding:18px; margin-top:28px; border-radius:var(--r-lg)}
  .library-main h1,.workspace-heading h1,.tools-page h1,.hero h1{font-size:27px}
  .library-card img{padding:6px}
  .date-answer>strong{font-size:24px}
  .footer-grid{padding:36px 0 28px}
}
/* Phone and tablet header: the appearance button sits beside Menu instead of floating between it and
   the logo, and the open menu lines up with the page margins. */
@media(max-width:1023px){
  .site-header{gap:8px}
  .site-header{justify-content:flex-start}
  .site-header .brand{margin-right:auto}
  .site-header .nav-drawer{margin-left:0}
  /* The home hero has its own search box; a second one in the header only pushes it down. */
  html[data-design-layout="home"] .site-header>.site-search{display:none}
  .site-header .header-utilities{margin:0}
  .theme-toggle{min-width:42px; min-height:42px; border:1px solid var(--line); background:var(--paper); box-shadow:var(--shadow-xs)}
  .nav-toggle{min-height:42px; padding:0 12px}
  .nav-drawer>.nav{left:20px; right:20px; width:auto; max-height:calc(100dvh - 84px); padding:8px}
  .nav>a,.nav-group>summary{min-height:48px; padding:10px 14px; font-size:16px}
  .nav-months{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:4px}
  .nav-months a{justify-content:center; min-height:40px}
}
@media(max-width:640px){
  .nav-drawer>.nav{left:16px; right:16px}
  /* Seven launchers in four columns: the last one fills the row. */
  .category-launchers a:last-child{grid-column:span 2}
  /* Arrows stay inside the screen edge. */
  .preview-arrow.previous{left:-6px}
  .preview-arrow.next{right:-6px}
  .file-chip{min-height:36px; padding:6px 10px; font-size:13px}
  .ny-card .cta{display:grid; grid-template-columns:1fr; gap:8px}
  .ny-card .cta .btn{width:100%; justify-content:center; text-align:center}
}
/* Month pages: the same month next year, one wide card. */
.ny-card{display:grid; grid-template-columns:150px 1fr; gap:22px; align-items:center; padding:18px; border:1px solid var(--line); border-radius:var(--r-lg); background:var(--paper)}
.ny-card img{width:100%; height:auto; border-radius:var(--r-sm); border:1px solid var(--line-soft); display:block}
.ny-card h3{margin:0 0 6px}
.ny-card p{margin:0 0 14px; color:var(--muted)}
@media(max-width:520px){.ny-card{grid-template-columns:96px 1fr; gap:14px; padding:14px; align-items:start}}
@media print{.next-year-month{display:none}}
@media(prefers-reduced-motion:reduce){.shelf-card:hover .shelf-preview img,.library-card:hover,.category-launchers a:hover,.studio-primary:hover{transform:none!important}}
@media print{.site-header-bar::before{display:none}}
`;
