/** Layout and sizing follow the supplied five-panel concept. Print CSS is independent. */
import { INNER_DESIGN_CSS } from "./inner-design.js";
export const DESIGN_CSS = `
:root{--ink:#334b63;--ink-strong:#0e2135;--muted:#526981;--paper:#fff;--panel:#fff;--wash:#f7f9fb;--line:#dbe3ec;--line-soft:#eaf0f5;--accent:#007b48;--focus:#006d41;--cyan:#007b48;--gold:#abc7bd;--gold-soft:#e9f4ef;--surface-soft:#f4f7fa;--surface-tint:#e9f5ef;--surface-warm:#f6f9f8;--warm-line:#d7e7df;--warm-ink:#356153;--footer:#f3f7f8;--yearly-ink:#0e2135;--yearly-accent:#007b48;--yearly-eyebrow:#006d41;--monthly-ink:#0e2135;--monthly-accent:#007b48;--monthly-eyebrow:#006d41;--home-fg:#0e2135;--home-muted:#334b63;--home-eyebrow:#006d41}
body{font-size:.875rem;background:#fff;padding-bottom:0;color:var(--ink)}
body,button,input,select{font-family:Manrope,"Manrope Fallback",sans-serif}
[hidden]{display:none!important}
button,input,select{font-size:inherit}
/* Native controls follow the theme (scrollbars, search clear button, date pickers). */
:root{color-scheme:light;--select-arrow:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%230e2135' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}
html[data-theme=dark]{color-scheme:dark;--select-arrow:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%23edf5fa' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}
/* One drawn chevron for every dropdown: the native arrow differs per browser and sat on the text or vanished on dark panels.
   !important because component rules set the background shorthand, which would reset the image. */
select:not([multiple]):not([size]){-webkit-appearance:none;appearance:none;background-image:var(--select-arrow)!important;background-repeat:no-repeat!important;background-position:right 10px center!important;background-size:12px 12px!important;padding-right:32px!important;text-overflow:ellipsis;cursor:pointer}
.ui-icon{width:18px;height:18px;flex-shrink:0;display:inline-block;vertical-align:middle}
.concept-wrap,.wrap,.hero-inner{width:min(1320px,calc(100% - 80px));margin-left:auto;margin-right:auto}
.site-header-bar{background:var(--paper);border:0;border-bottom:1px solid var(--line-soft);box-shadow:none}
.site-header,.site-footer-bar{font-family:Manrope,"Manrope Fallback",sans-serif}
.site-header{min-height:66px;gap:22px;padding:8px 0;flex-wrap:nowrap}
.brand{flex-shrink:0;min-height:40px;margin-right:22px}
.brand-wordmark{font:700 1.45rem/1 Sora,sans-serif;letter-spacing:-.08em;color:var(--ink-strong)}
.brand-wordmark span{color:var(--accent)}
.nav-drawer{margin-left:0}
.nav-group>summary{display:flex;gap:4px;align-items:center;list-style:none;padding:10px 9px;min-height:40px;font-size:12px;font-weight:700;color:var(--ink-strong);cursor:pointer}
.nav-group>summary::-webkit-details-marker{display:none}
.nav-group[open]>summary{color:var(--focus)}
.nav-panel{padding:8px}
.nav-panel a{font-size:12px;font-weight:400;min-height:40px}
.nav-months{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--line);padding-top:6px;margin-top:5px}
.nav .nav-months a{padding:8px 6px;font-size:11px;min-height:40px}
.nav a:hover,.nav a:focus-visible{background:var(--surface-tint);color:var(--focus)}
.nav a[aria-current=page]{color:var(--focus);background:none;border-bottom:0;box-shadow:inset 0 -2px var(--accent);border-radius:0}
.nav-toggle{border:1px solid var(--line);border-radius:7px;color:var(--ink-strong);min-height:40px}
.nav-toggle-bars i{background:var(--ink-strong)}
.site-search{position:relative;flex:1 1 270px;max-width:370px;margin:0 0 0 auto}
.site-search-box{display:flex;gap:8px;align-items:center;min-height:38px;padding:0 14px;background:#f0f4f8;border:1px solid transparent;border-radius:24px;color:var(--ink-strong)}
.site-search-box:focus-within{background:var(--paper);border-color:var(--accent)}
.site-search input{width:100%;min-width:0;background:none;border:0;outline:0;min-height:36px;font-size:11px;color:var(--ink-strong)}
.site-search input::placeholder{color:var(--muted);opacity:1}
.site-search .ui-icon{width:15px;height:15px}
.search-results{position:absolute;top:calc(100% + 8px);left:0;right:0;max-height:65dvh;overflow:auto;background:var(--paper);border:1px solid var(--line);border-radius:10px;box-shadow:0 12px 32px #0e21351c;padding:6px;margin:0;list-style:none;z-index:66}
.search-results a{display:grid;gap:3px;padding:10px;color:var(--ink-strong);text-decoration:none;font-size:12px;line-height:1.4;border-radius:5px}
.search-results a:hover,.search-results a:focus{background:var(--surface-tint)}
.search-results small{color:var(--muted);font-size:11px}
.search-empty{padding:10px;font-size:12px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.header-utilities{display:flex;align-items:center;gap:18px;flex-shrink:0;margin-left:5px}
.theme-toggle{display:grid;place-items:center;min-width:32px;min-height:40px;border:0;background:none;color:var(--ink-strong);cursor:pointer}
.theme-toggle .ui-icon{width:17px;height:17px}
.home-hero{position:relative;isolation:isolate;min-height:505px;display:flex;align-items:center;overflow:hidden;background:#dfebf1}
.hero-photograph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:-2}
.home-hero:after{position:absolute;content:"";inset:0;background:linear-gradient(90deg,rgba(247,250,253,.97),rgba(247,250,253,.85) 28%,rgba(247,250,253,.03) 67%);z-index:-1}
.hero-copy{padding:36px 0 34px}
.overline{font-size:11px;line-height:1.4;letter-spacing:.06em;font-weight:700;text-transform:uppercase;color:var(--focus);margin:0 0 18px}
.home-hero h1{font-size:clamp(30px,3.2vw,46px);line-height:1.14;letter-spacing:-.04em;max-width:620px;color:#0e2135;margin:0 0 18px}
.hero-intro{font-size:16px;line-height:1.65;color:#263f58;margin:0 0 22px;max-width:550px}
.hero-search{margin:0 0 26px;max-width:560px}
.hero-search .site-search-box{border-radius:12px;min-height:54px;background:rgba(255,255,255,.96);padding:5px 7px 5px 18px;box-shadow:0 2px 8px #0e213509}
.hero-search input{font-size:12px;min-height:40px}
.hero-search button{display:grid;place-items:center;width:42px;height:42px;min-width:42px;border:0;border-radius:8px;background:linear-gradient(#00864f,#007444);color:#fff;box-shadow:0 2px 7px #007d4a33;cursor:pointer}
.hero-search button .ui-icon{width:22px;height:22px}
.category-launchers{display:flex;gap:7px;max-width:680px}
.category-launchers a{flex:1;min-width:0;display:grid;justify-items:center;align-content:center;gap:9px;background:rgba(255,255,255,.96);border:1px solid #fff;border-radius:10px;min-height:90px;padding:12px 7px;text-decoration:none;color:#0e2135;font-size:11px;font-weight:700;text-align:center;line-height:1.4;box-shadow:0 2px 7px #0e213508}
.category-launchers .ui-icon{width:23px;height:23px;color:var(--accent)}
.category-launchers a:hover{border-color:#a4c9b7;transform:translateY(-2px)}
.category-launchers .tone-blue .ui-icon{color:#397cf6}.category-launchers .tone-orange .ui-icon{color:#d9771f}.category-launchers .tone-purple .ui-icon{color:#9a55dc}.category-launchers .tone-pink .ui-icon{color:#d65f9b}
.hero-handwriting{position:absolute;left:53%;top:29%;transform:rotate(-12deg);color:#fff;font:italic 24px/1.1 cursive;text-shadow:0 1px 3px #233b4c55}
.hero-handwriting span{display:block;background:#75bb63;width:90px;height:4px;border-radius:50%;margin:8px 0 0;transform:rotate(-6deg)}
.hero-paper{position:absolute;right:8.7%;top:44%;width:12.9%;height:38%;padding:7% 4px 5px;text-align:center;color:#0e2135;text-decoration:none;transform:rotate(2deg);background:transparent;overflow:hidden}
.hero-paper strong{font:700 clamp(17px,1.6vw,27px)/1 Sora,sans-serif;display:block;margin-top:-48%}
.hero-mini-months{display:grid;grid-template-columns:repeat(7,1fr);gap:8px 3px;padding:16px 9px;font-size:7px;color:#243a4e}
.hero-paper small{font-size:5px;letter-spacing:1px}
.shelf-heading{display:flex;gap:22px;align-items:center;margin-bottom:18px;white-space:nowrap}
.shelf-heading h2{font:700 20px/1.3 Sora,sans-serif;letter-spacing:-.04em;margin:0;flex-shrink:0;color:var(--ink-strong)}
.shelf-heading>a{margin-left:auto;color:var(--focus);font-size:11px;text-decoration:none;font-weight:700}
.popular-calendars{padding:24px 0 30px;position:relative}
.shelf-filters{display:flex;gap:18px;align-items:center;overflow:auto;scrollbar-width:none;margin-left:auto}
.shelf-filters button{flex:none;padding:7px 0;min-width:24px;background:none;border:0;border-bottom:2px solid transparent;color:var(--ink);font-size:11px;white-space:nowrap;cursor:pointer}
.shelf-filters button[aria-pressed=true]{border-color:var(--accent);color:var(--focus)}
.calendar-shelf{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 100px)/6);gap:20px;overflow-x:auto;scrollbar-width:none;padding-bottom:3px}
.shelf-card{min-width:0}.shelf-preview{display:block;background:#f6f8fb;border:1px solid var(--line);border-radius:6px;overflow:hidden;box-shadow:0 1px 3px #0e21351a}
.shelf-preview img{width:100%;height:190px;object-fit:contain;background:#fff}
.shelf-card h3{font-size:11px;line-height:1.4;margin:10px 0 8px;font-weight:700;color:var(--ink-strong)}
.shelf-card h3 a{text-decoration:none}
.file-chips{display:flex;gap:6px;align-items:center}
.file-chip{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:3px 8px;border:1px solid #d6dfe9;border-radius:5px;background:var(--paper);color:var(--ink-strong);text-decoration:none;font-size:11px;font-weight:700}
.file-chip .ui-icon{width:13px;height:13px}.file-chip:hover{border-color:var(--accent);color:var(--focus)}
.shelf-next{position:absolute;right:-29px;top:48%;border:0;background:none;color:var(--ink);cursor:pointer;min-height:40px;min-width:24px}
.home-more{border-top:1px solid var(--line-soft)}
.home-more .section:first-child{padding-top:24px}
.concept-breadcrumb{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:11px;margin:0 0 20px;line-height:1.6}
.concept-breadcrumb a{text-decoration:none;color:var(--ink)}
.calendar-detail{padding:24px 0 32px}
.studio-columns{display:grid;grid-template-columns:minmax(0,1.13fr) minmax(0,.9fr);gap:36px;max-width:1100px;margin:auto}
.studio-visual{min-width:0}
.studio-preview{position:relative;display:grid;place-items:center;border:1px solid #d7e0e9;border-radius:10px;background:var(--paper);padding:13px;box-shadow:0 2px 6px #0e213510}
.studio-preview>img{width:100%;height:540px;object-fit:contain;background:#fff}
.preview-arrow{position:absolute;top:50%;border:0;background:#ffffffdd;border-radius:50%;min-height:34px;min-width:30px;display:grid;place-items:center;color:#0e2135;cursor:pointer;box-shadow:0 1px 5px #0e213515}
.preview-arrow.previous{left:-15px}.preview-arrow.previous .ui-icon{transform:rotate(180deg)}.preview-arrow.next{right:-15px}
.studio-thumbnails{display:flex;gap:8px;padding:14px 0 10px;overflow-x:auto;scrollbar-width:thin}
.studio-thumbnails button{width:72px;height:86px;flex-shrink:0;padding:3px;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer}
.studio-thumbnails button[aria-pressed=true]{border:2px solid #78b6a2;background:#e9f5f0}
.studio-thumbnails img{width:100%;height:100%;object-fit:contain}
.studio-style-tabs{display:flex;gap:6px;flex-wrap:wrap}
.studio-style-tabs button{min-height:29px;border:1px solid var(--line-soft);padding:4px 10px;border-radius:7px;background:var(--paper);color:var(--ink-strong);font-size:11px;cursor:pointer}
.studio-style-tabs button[aria-pressed=true]{background:#e5f3ed;border-color:#e5f3ed;color:#155c42}
.studio-options{padding:2px 0;min-width:0}
.studio-options h1{font:700 27px/1.2 Sora,sans-serif;letter-spacing:-.04em;color:var(--ink-strong);max-width:23ch;margin:0 0 14px}
.studio-options>p{font-size:12px;line-height:1.65;max-width:43ch;margin:0 0 20px;color:var(--muted)}
.studio-options fieldset{border:0;padding:0;margin:0 0 18px;min-width:0}
.studio-options legend,.studio-field>label{font-size:11px;font-weight:700;color:var(--ink-strong);margin:0 0 8px;display:block}
.option-row{display:flex;gap:8px;flex-wrap:wrap}
.option-row button{display:flex;align-items:center;gap:6px;min-height:35px;border:1px solid var(--line);border-radius:6px;color:var(--ink-strong);background:var(--paper);padding:7px 12px;font-size:11px;cursor:pointer;box-shadow:0 1px 2px #0e213507}
.option-row button[aria-pressed=true]{border-color:#8cbda9;background:#f1f9f5;color:#075d38}
.option-row button[data-choice=format][aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff;min-width:64px;justify-content:center}
.option-row .ui-icon{width:14px;height:14px}
.studio-field{margin-bottom:18px;display:flex;gap:12px;align-items:center}
.studio-field>label{margin:0}.studio-field select{min-height:31px;border:1px solid var(--line);background:var(--paper);border-radius:5px;font-size:11px;color:var(--ink);padding:4px 24px 4px 9px}
.studio-options .format-note{font-size:11px;margin:0 0 10px}
.studio-primary,.studio-secondary{display:flex;align-items:center;justify-content:center;gap:8px;min-height:42px;border-radius:7px;max-width:365px;padding:10px 14px;text-decoration:none;font-size:12px;font-weight:700;cursor:pointer}
.studio-primary{color:#fff;background:linear-gradient(#00864f,#007444);border:1px solid #00804a;box-shadow:0 2px 3px #00734420}
.studio-primary:hover{background:#007b49;color:#fff}
.studio-secondary{color:var(--focus);background:var(--paper);border:1px solid var(--line);box-shadow:0 1px 3px #0e213518;margin-top:8px}
.studio-secondary:hover{border-color:var(--accent)}
.studio-actions{display:flex;gap:13px;align-items:center;flex-wrap:wrap;margin-top:17px;max-width:410px}
.studio-actions a,.studio-actions button{display:inline-flex;align-items:center;gap:5px;background:none;border:0;color:var(--ink);text-decoration:none;min-height:32px;font-size:11px;padding:0;cursor:pointer}
.studio-actions .ui-icon{width:13px;height:13px}.studio-actions [aria-pressed=true]{color:var(--focus)}
.studio-options .studio-status{font-size:11px;margin-top:8px;min-height:18px}
.download-benefits{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;background:#edf4f7;border-radius:9px;padding:18px 24px;max-width:1100px;margin:20px auto 0}
.download-benefits>div{display:flex;gap:12px;align-items:center;color:var(--ink-strong)}
.download-benefits .ui-icon{width:24px;height:24px}.download-benefits p{font-size:11px;margin:0;line-height:1.5}.download-benefits strong{display:block;font-weight:700}.download-benefits span{display:block;color:var(--muted);font-size:11px}
.library-layout{display:grid;grid-template-columns:210px minmax(0,1fr);gap:32px;align-items:start}
.library-sidebar{padding:28px 18px 28px 0;border-right:1px solid var(--line-soft);min-height:calc(100vh - 66px)}
.library-sidebar nav{display:grid;gap:4px}
.library-sidebar a{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink-strong);font-size:11px;min-height:37px;padding:8px 10px;border-radius:6px}
.library-sidebar .ui-icon{width:16px;height:16px}
.library-sidebar a[aria-current=page]{background:#e4f3ed;color:#0a5940;font-weight:700}
.library-sidebar a:hover{background:var(--surface-soft)}
.library-sidebar h3{font-size:12px;color:var(--ink-strong);margin:32px 10px 12px}
.library-main{padding:26px 0 40px;min-width:0}
.library-main h1{font:700 28px/1.2 Sora,sans-serif;letter-spacing:-.04em;margin:0 0 10px;color:var(--ink-strong);max-width:none}
.library-intro{font-size:12px;color:var(--muted);margin:0 0 20px;max-width:80ch;line-height:1.6}
.library-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 12px}
.library-toolbar select{max-width:170px;min-height:34px;border:1px solid var(--line);border-radius:6px;padding:7px 24px 7px 10px;background:var(--paper);font-size:11px;color:var(--ink-strong)}
.library-toolbar button{border:0;background:none;color:var(--ink);font-size:11px;text-decoration:underline;text-underline-offset:3px;margin-left:auto;cursor:pointer}
.library-search{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:6px;width:230px;max-width:100%;padding:0 10px}.library-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px var(--surface-tint)}
.library-search .ui-icon{width:14px;height:14px}.library-search input{border:0;outline:0;background:none;min-height:31px;min-width:0;width:100%;font-size:11px;color:var(--ink-strong)}
.library-count{font-size:11px;color:var(--muted);margin:10px 0}
.library-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.library-card{border:1px solid var(--line-soft);border-radius:7px;padding:6px 6px 9px;background:var(--paper);overflow:hidden;min-width:0}
.library-card>a{display:block;text-decoration:none;color:var(--ink-strong)}
.library-card img{display:block;width:100%;height:340px;object-fit:contain;border:1px solid var(--line-soft);border-radius:4px;background:#fff}
.library-card h2{font-size:12px;margin:8px 2px;line-height:1.4;color:var(--ink-strong)}
.library-card .file-chips{margin:0 2px}
.tools-page{padding:30px 0 50px}.tools-page h1{font-size:30px;max-width:none}.date-tools{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:25px 0;max-width:950px}.date-tools form{padding:24px;background:var(--surface-soft);border:1px solid var(--line);border-radius:12px}.date-tools h2{font-size:18px;margin-top:0}.date-tools label{display:grid;gap:7px;margin-bottom:16px;font-size:12px}.date-tools input{min-height:40px;border:1px solid var(--line);border-radius:6px;padding:8px;background:var(--paper);color:var(--ink-strong)}.date-tools output{display:block;min-height:42px;margin-top:18px;font-weight:700}
.hero{padding:26px 0;background:var(--surface-soft)!important;color:var(--ink-strong)!important;border-bottom:1px solid var(--line-soft)}
.hero h1{font-size:30px;max-width:30ch;letter-spacing:-.04em;line-height:1.2}
.hero .lead,.lead{font-size:14px;max-width:65ch}.eyebrow{font-size:11px;letter-spacing:.08em}.section{padding:25px 0}.section h2{font-size:20px}.section h3{font-size:16px}.btn,.btn-sm{font-size:12px;min-height:39px;border-radius:6px;padding:9px 14px}.cta .btn{min-width:0}
.content-shell{padding:24px 0}.layout{grid-template-columns:minmax(0,1fr) 240px;gap:30px}.side-card{background:var(--surface-soft);border:1px solid var(--line-soft);border-radius:9px;padding:14px}.side-card>h2,.side-card>h3{background:none;color:var(--ink-strong);padding:0 0 10px;border-bottom:1px solid var(--line);font-size:13px}.side-card p{font-size:12px}.sidebar{font-size:12px}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.gallery-item,.gallery-item:nth-child(even){display:flex;flex-direction:column;gap:10px;padding:10px;border:1px solid var(--line);border-radius:8px}.gallery-item:nth-child(even) .gallery-copy{order:0}.gallery-visual{background:#f8fafb;padding:7px;border-radius:5px}.gallery-visual img{height:250px;object-fit:contain;width:100%}.gallery-copy h3{font-size:13px;margin:0 0 7px}.gallery-copy p{font-size:11px}.showcase-card,.yearly-band{border:1px solid var(--line);border-radius:10px;overflow:hidden}.month-chips a{font-size:11px;border-radius:5px}.hol-table th,.hol-table td{font-size:12px}.hol-table th{background:var(--surface-tint);color:var(--ink-strong)}
.site-footer-bar{background:var(--surface-soft);border-top:1px solid var(--line);color:var(--ink)}.site-footer{padding:25px 0}.site-footer a,.site-footer .footer-copy{font-size:11px;color:var(--ink)}.site-footer a:hover{color:var(--focus)}
.skip-link{position:absolute;left:-999px;top:0;z-index:100;background:var(--paper);color:var(--focus);padding:12px 16px}.skip-link:focus{left:16px;top:16px}
@media(min-width:1024px){.nav-drawer{flex:0 0 auto;min-width:0}.nav-drawer>.nav,.nav-drawer[open]>.nav{gap:0;flex-wrap:nowrap}.nav>a{font-size:12px;color:var(--ink-strong);padding:10px 9px;min-height:40px}.nav>a:hover,.nav>a:focus-visible{background:none;color:var(--focus)}.nav-group{position:relative}.nav-panel{position:absolute;top:100%;left:0;min-width:270px;max-height:70dvh;overflow:auto;display:grid;padding:7px;background:var(--paper);border:1px solid var(--line);border-radius:8px;box-shadow:0 12px 30px #0e213519}.nav-panel a{width:100%;color:var(--ink);padding:8px 10px;font-weight:400}.nav-panel a:hover{background:var(--surface-tint);color:var(--focus)}.nav-group:not([open])>.nav-panel{display:none}.ad-unit--header{min-height:90px}}
@media(max-width:1250px) and (min-width:1024px){.site-header{gap:10px}.brand{margin-right:0}.brand-wordmark{font-size:20px}.nav-group>summary,.nav>a{padding:10px 6px}.site-search{max-width:290px}.header-utilities{gap:8px}.shelf-heading{flex-wrap:wrap;gap:10px}.shelf-filters{order:2;width:100%;margin-left:0}.hero-copy .category-launchers{max-width:600px}.hero-paper{right:8%;top:43%}}
@media(max-width:1023px){.concept-wrap,.wrap,.hero-inner{width:calc(100% - 40px)}.site-header{flex-wrap:wrap;gap:10px;padding:10px 0}.brand{margin-right:auto}.nav-drawer{order:2}.header-utilities{order:1;margin-right:5px}.site-header>.site-search{order:3;flex-basis:100%;max-width:none}.nav-group>summary{min-height:44px;font-size:13px;padding:10px 14px}.nav-panel{border-left:1px solid var(--line);margin-left:14px}.nav-panel a{min-height:44px;font-size:12px}.nav>a{font-size:13px}.nav-toggle-label{font-size:12px}.nav{top:60px}.home-hero{min-height:490px}.hero-copy{padding:30px 0}.hero-copy .category-launchers{max-width:640px}.home-hero h1{font-size:38px}.hero-handwriting,.hero-paper{display:none}.home-hero:after{background:linear-gradient(90deg,#f7fafdEE,#f7fafdCF 55%,#f7fafd33)}.studio-columns{gap:24px;grid-template-columns:1.1fr .9fr}.studio-preview>img{height:430px}.studio-options h1{font-size:24px}.studio-actions{gap:9px}.download-benefits{padding:15px;gap:12px}.download-benefits>div{gap:7px}.download-benefits .ui-icon{width:19px}.library-layout{grid-template-columns:180px minmax(0,1fr);gap:20px}.library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.library-card img{height:240px}.shelf-heading{flex-wrap:wrap;gap:12px}.shelf-filters{order:3;width:100%;margin-left:0;gap:17px}.calendar-shelf{grid-auto-columns:calc((100% - 48px)/4);gap:16px}.shelf-preview img{height:180px}.shelf-next{right:-20px}.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.layout{grid-template-columns:minmax(0,1fr)}.sidebar{position:static}}
@media(max-width:640px){.concept-wrap,.wrap,.hero-inner{width:calc(100% - 32px)}.site-header{gap:7px}.brand-wordmark{font-size:20px}.header-utilities{gap:8px}.theme-toggle{min-width:28px}.nav-toggle{padding:0 8px}.home-hero{min-height:0}.hero-copy{padding:27px 0 25px}.home-hero h1{font-size:30px;max-width:20ch}.overline{font-size:11px;margin-bottom:14px}.hero-intro{font-size:13px;max-width:34ch;margin-bottom:18px}.desktop-break{display:none}.hero-search{margin-bottom:20px}.hero-search .site-search-box{min-height:48px;padding-left:12px}.hero-search input{font-size:11px}.hero-search button{width:36px;height:36px;min-width:36px}.category-launchers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.category-launchers a{min-height:78px;font-size:11px;gap:7px;padding:10px 4px}.category-launchers .ui-icon{width:20px;height:20px}.home-hero:after{background:rgba(247,250,253,.89)}.shelf-heading h2{font-size:17px}.shelf-heading>a{font-size:11px}.shelf-filters{gap:15px}.shelf-filters button{min-height:44px}.calendar-shelf{grid-auto-columns:calc((100% - 12px)/2);gap:12px}.shelf-preview img{height:210px}.shelf-card h3{font-size:11px}.shelf-next{display:none}.studio-columns{display:flex;flex-direction:column;gap:22px}.calendar-detail{padding-top:18px}.concept-breadcrumb{font-size:11px;margin-bottom:16px}.studio-preview{padding:10px}.studio-preview>img{height:420px}.studio-thumbnails button{width:59px;height:73px}.studio-options h1{font-size:25px;max-width:28ch}.studio-options>p{max-width:none;font-size:12px}.studio-options fieldset{margin-bottom:15px}.option-row button{min-height:40px;font-size:11px}.studio-primary,.studio-secondary{max-width:none;min-height:44px;font-size:12px}.download-benefits{grid-template-columns:1fr 1fr;gap:16px;padding:16px}.library-layout{display:block}.library-sidebar{min-height:0;padding:14px 0 10px;border-right:0;border-bottom:1px solid var(--line)}.library-sidebar nav:first-child{display:flex;overflow-x:auto;white-space:nowrap;gap:5px}.library-sidebar a{font-size:11px;min-height:39px;gap:6px;padding:8px}.library-sidebar h3,.library-sidebar nav:last-child{display:none}.library-main{padding-top:20px}.library-main h1{font-size:24px}.library-intro{font-size:11px}.library-toolbar{gap:6px}.library-toolbar select{max-width:150px;min-height:36px;font-size:11px;padding-left:8px}.library-toolbar button{font-size:11px}.library-grid{gap:10px}.library-card{padding:5px}.library-card img{height:200px}.library-card h2{font-size:11px}.file-chip{font-size:11px;min-height:29px;padding:4px 6px;gap:4px}.file-chip .ui-icon{width:12px;height:12px}.date-tools{grid-template-columns:1fr}.tools-page h1{font-size:26px}.gallery{grid-template-columns:1fr}.section h2{font-size:18px}.hero h1{font-size:26px}.hero .lead{font-size:13px}}
html[data-theme=dark]{--danger:#ffb4ab;--paper:#142536;--panel:#142536;--wash:#102031;--ink:#c7d5df;--ink-strong:#edf5fa;--muted:#aabecb;--line:#34495b;--line-soft:#293e50;--accent:#73d4a6;--focus:#83dfb4;--surface-soft:#1b3042;--surface-tint:#1b4038;--surface-warm:#263c3e;--warm-ink:#c8dfd0;--n-brand-soft:#1b4038}
html[data-theme=dark] body,html[data-theme=dark] #main,html[data-theme=dark] .news-main{background:var(--paper);color:var(--ink)}
html[data-theme=dark] :is(.site-search-box,.library-card,.gallery-item,.side-card,.calendar-detail,.newsbar,.keypoints,.keydates,.downloads,.nb-panel,.pref-src){background:var(--surface-soft)!important;border-color:var(--line)!important}
html[data-theme=dark] .site-search-box:focus-within{border-color:var(--focus)!important}html[data-theme=dark] .hero-search .site-search-box:focus-within{border-color:#007b48!important}
html[data-theme=dark] :is(.downloads li,.download-benefits,.keydates li,.upcoming,.upcoming a,.topic-nav a,.date-tools form){background:var(--surface-soft)!important;border-color:var(--line)!important}
html[data-theme=dark] .hero-search .site-search-box{background:#fff!important;color:#334b63}
html[data-theme=dark] .hero-search input{color:#0e2135}
html[data-theme=dark] :is(.hero-search input,.hero-search button,.category-launchers a,.hero-paper,.preview-arrow):focus-visible{outline-color:#006d41}
html[data-theme=dark] .hero-search .site-search-box:focus-within{border-color:#007b48}
html[data-theme=dark] .hero-search input::placeholder{color:#526981}
html[data-theme=dark] .home-hero .overline{color:#006d41}
html[data-theme=dark] .category-launchers .tone-green .ui-icon{color:#007b48}
html[data-theme=dark] :is(.studio-primary,.btn-primary,.btn.pdf,.option-row button[data-choice=format][aria-pressed=true]){background:#007749!important;color:#fff!important;border-color:#007749!important}
html[data-theme=dark] :is(.hero-copy h1,.hero-intro,.category-launchers a,.hero-paper){color:#0e2135}
html[data-theme=dark] :is(.studio-style-tabs button[aria-pressed=true],.option-row button[aria-pressed=true],.library-sidebar a[aria-current=page]){background:#1b4038;color:#b5edcf}
/* All shared reading and interactive surfaces follow the appearance toggle. */
html[data-theme=dark] :is(input,select,textarea):not(.hero-search input){background-color:var(--paper)!important;color:var(--ink-strong)!important;border-color:var(--line)!important}
html[data-theme=dark] :is(input,textarea)::placeholder{color:var(--muted);opacity:1}
html[data-theme=dark] :is(.skip-link,.pn>a,.faq-block details,.share a,.share button,.month-chips a,.btn.png,.tool-out,.tool-btns>a:not(.tb-main),.start){background:var(--surface-soft)!important;border-color:var(--line)!important;color:var(--ink-strong)!important}
html[data-theme=dark] .news-main :is(.tool-box,.zip-finder){background:var(--surface-soft)!important;border-color:var(--line)!important}
html[data-theme=dark] .news-main .prose-news :is(td,th){background:var(--surface-soft)!important;color:var(--ink-strong)!important;border-color:var(--line)!important}
html[data-theme=dark] .news-main .prose-news tr.is-past td{color:var(--muted)!important}
html[data-theme=dark] :is(.holiday-country-tabs a[aria-current=page],.page-numbers .current,.nb-main a[aria-current=page],.topics button[aria-pressed=true],.tb-main,.zip-finder button,.error-links a:first-child){background:#007749!important;color:#fff!important;border-color:#007749!important}
html[data-theme=dark] .topics button span{background:var(--surface-tint)!important;color:var(--ink-strong)!important}
html[data-theme=dark] .facts strong{color:var(--focus)!important}

html[data-theme=dark] .pref-link:hover,html[data-theme=dark] .pref-link:focus-visible{color:var(--focus)!important}
html.news[data-theme=dark] [data-cat]{--cat:#a7d9c7}
html.news[data-theme=dark] [data-cat=holidays],html.news[data-theme=dark] [data-cat=elections]{--cat:#e1b5a7}
html.news[data-theme=dark] [data-cat=retail-dates]{--cat:#d8c297}
html.news[data-theme=dark] [data-cat=puzzles],html.news[data-theme=dark] [data-cat=sky-events]{--cat:#c5b7de}
html.news[data-theme=dark] [data-cat=uk-canada]{--cat:#d9b3c6}
html[data-theme=dark] .ad-unit{background:var(--surface-soft)}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.category-launchers a{transform:none!important}}
@media print{.site-search,.header-utilities,.category-launchers,.hero-photograph,.hero-handwriting,.hero-paper,.studio-thumbnails,.studio-options,.library-sidebar,.library-toolbar,.library-search{display:none!important}.studio-preview{border:0;box-shadow:none}.studio-columns{display:block}.studio-preview>img{height:auto}.download-benefits{display:none}.home-hero:after{display:none}}
${INNER_DESIGN_CSS}
.page-workspace .prose a,.prose-news a{overflow-wrap:anywhere}
@media(max-width:767px){:is(input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea){font-size:16px!important}}
/* Dark mode: the home hero follows the theme (dark wash over the photo, dark tiles and search); the right side stays clear so the notebook keeps its paper. */
html[data-theme=dark] .home-hero:after{background:linear-gradient(90deg,rgba(16,32,49,.96),rgba(16,32,49,.86) 30%,rgba(16,32,49,.03) 67%)}
@media(max-width:1023px){html[data-theme=dark] .home-hero:after{background:linear-gradient(90deg,#102031f2,#102031d9 55%,#10203133)}}
@media(max-width:640px){html[data-theme=dark] .home-hero:after{background:rgba(16,32,49,.9)}}
html[data-theme=dark] :is(.hero-copy h1,.hero-intro,.category-launchers a){color:var(--ink-strong)}
html[data-theme=dark] .home-hero .overline{color:var(--accent)}
html[data-theme=dark] .home-hero{background-color:var(--wash)}
/* The mini calendar is printed on the photographed paper, not on the dark wash. Its background is that paper's color,
   clipped to the glyphs so nothing is painted; it tells the contrast gate what the text really sits on. */
html[data-theme=dark] .hero-paper{background-color:#efe8df;-webkit-background-clip:text;background-clip:text}
html[data-theme=dark] .category-launchers a{background:rgba(27,48,66,.95);border-color:var(--line)}
html[data-theme=dark] .category-launchers a:hover{border-color:var(--accent)}
html[data-theme=dark] .category-launchers .tone-green .ui-icon{color:var(--accent)}
html[data-theme=dark] .category-launchers .tone-blue .ui-icon{color:#6aa2ff}
html[data-theme=dark] .category-launchers .tone-purple .ui-icon{color:#b98bf0}
html[data-theme=dark] .hero-search .site-search-box{background:var(--surface-soft)!important;color:var(--ink)}
html[data-theme=dark] .hero-search input{color:var(--ink-strong)}
html[data-theme=dark] .hero-search input::placeholder{color:var(--muted)}
html[data-theme=dark] .hero-search .site-search-box:focus-within{border-color:var(--focus)!important}
html[data-theme=dark] :is(.hero-search input,.hero-search button,.category-launchers a,.preview-arrow):focus-visible{outline-color:var(--focus)}
/* The search field is transparent inside its box (the dark input rule above would paint it a second shade). */
html[data-theme=dark] body .site-search-box input[type=search]{background-color:transparent!important}
@media(pointer:coarse){.footer-grid nav a,.footer-bottom a{display:inline-flex;align-items:center;min-height:32px}:is(.concept-breadcrumb,.crumbs) a,:is(.shelf-heading,.trending-heading,.date-answer)>a,h2.sec a,.shelf-card a,:is(.holiday-toolbar,.library-toolbar,.tools) button,details.toc a,.sources a{display:inline-flex;align-items:center;min-height:24px}}
`;
