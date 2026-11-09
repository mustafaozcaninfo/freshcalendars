// Read-only UI audit of one page at one width.
// Usage: node shot.mjs <url> <width> <out.png> [--full] [--click "<css selector>"] [--hover "<css selector>"]
// Prints JSON: overflow, small tap targets, unnamed controls, low-contrast text, broken images, console errors.
import { createRequire } from 'module';
const require = createRequire(new URL('../../packages/generator/package.json', import.meta.url));
const { chromium } = require('playwright');

const [url, w = '390', out = '/tmp/shot.png', ...rest] = process.argv.slice(2);
const full = rest.includes('--full');
const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const width = Number(w), mobile = width < 768;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width, height: mobile ? 844 : 900 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
  userAgent: mobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => null);
await page.waitForTimeout(800);
if (opt('--click')) { await page.click(opt('--click'), { timeout: 5000 }).catch((e) => errors.push('click failed: ' + e.message.slice(0, 120))); await page.waitForTimeout(700); }
if (opt('--hover')) { await page.hover(opt('--hover'), { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(300); }
await page.screenshot({ path: out, fullPage: full });
const report = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const desc = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3); if (c.length) s += '.' + c.join('.'); return s; };
  const txt = (el) => (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 50);
  const overflow = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) {
      let p = el.parentElement, clipped = false;
      while (p) { const s = getComputedStyle(p); if (/(hidden|auto|scroll|clip)/.test(s.overflowX)) { clipped = true; break; } p = p.parentElement; }
      if (!clipped) overflow.push({ el: desc(el), text: txt(el), left: Math.round(r.left), right: Math.round(r.right) });
    }
  }
  const small = [];
  for (const el of document.querySelectorAll('a[href],button,input,select,textarea,[role=button]')) {
    if (!vis(el)) continue; const r = el.getBoundingClientRect();
    if ((r.width < 24 || r.height < 24) && !el.closest('p,li')) small.push({ el: desc(el), text: txt(el), w: Math.round(r.width), h: Math.round(r.height) });
  }
  const unnamed = [];
  for (const el of document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea')) {
    if (!vis(el)) continue;
    const name = txt(el) || el.getAttribute('aria-labelledby') || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.getAttribute('placeholder') || el.querySelector('img[alt]:not([alt=""])');
    if (!name) unnamed.push({ el: desc(el), html: el.outerHTML.slice(0, 140) });
  }
  const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const bgOf = (el) => { while (el) { const s = getComputedStyle(el); const m = s.backgroundColor.match(/[\d.]+/g); if (s.backgroundImage !== 'none') return null; if (m && (m.length < 4 || +m[3] > 0.5)) return s.backgroundColor; el = el.parentElement; } return 'rgb(255,255,255)'; };
  const low = []; const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el) || !el.childNodes.length) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) continue;
    const s = getComputedStyle(el); const bg = bgOf(el); if (!bg) continue;
    const a = lum(s.color), b = lum(bg); if (a == null || b == null) continue;
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && +s.fontWeight >= 700);
    if (ratio < (big ? 3 : 4.5)) { const k = desc(el) + s.color; if (!seen.has(k)) { seen.add(k); low.push({ el: desc(el), text: txt(el), ratio: +ratio.toFixed(2), color: s.color, bg }); } }
  }
  const broken = [...document.images].filter((i) => vis(i) && i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
  const h1 = [...document.querySelectorAll('h1')].map((h) => txt(h));
  return { title: document.title, vw, scrollW: document.documentElement.scrollWidth, h1, overflow: overflow.slice(0, 15), small: small.slice(0, 25), unnamed: unnamed.slice(0, 15), lowContrast: low.slice(0, 20), brokenImages: broken.slice(0, 10) };
});
console.log(JSON.stringify({ url, width, status: resp && resp.status(), consoleErrors: errors.slice(0, 10), ...report }, null, 1));
await browser.close();
