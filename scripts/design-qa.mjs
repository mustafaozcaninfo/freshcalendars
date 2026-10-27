import {readyImages} from "./qa-images.mjs";
/** Render every built HTML page at phone/desktop widths and preserve visual examples. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const root = process.cwd();
const require = createRequire(path.join(root, 'packages/generator/package.json'));
const { chromium } = require('playwright');
const out = path.join(root, 'output/design-audit');
await fs.mkdir(out, {recursive:true});
const base = process.env.DESIGN_BASE || 'http://localhost:4324';
async function walk(dir) {
  const files=[];
  for (const e of await fs.readdir(dir,{withFileTypes:true})) {
    const f=path.join(dir,e.name);
    if(e.isDirectory()) files.push(...await walk(f));
    else if(e.name.endsWith('.html')&&!/^google[a-f0-9]+\.html$/.test(e.name)) files.push(f);
  }
  return files;
}
const routes=[];
for(const [folder,prefix] of [['site',''],['news','/news']]) {
  for(const f of await walk(path.join(root,'dist',folder))) {
    let p=path.relative(path.join(root,'dist',folder),f).replaceAll(path.sep,'/');
    p=p.replace(/(^|\/)index\.html$/,'$1');
    routes.push(prefix+'/'+p);
  }
}
const samples=new Map([
  ['/','home'], ['/october-calendars.html','monthly'], ['/printable-calendars.html','yearly'],
  ['/blank-calendars.html','blank'], ['/printable-weekly-calendar.html','weekly'],
  ['/holidays/','holidays'], ['/when-is/thanksgiving/','holiday'], ['/page/contact/','contact'],
  ['/calendars/','library'], ['/calendar-tools/','tools'], ['/printable-school-calendar.html','school'], ['/print-guide.html','guide'], ['/page/privacy-policy/','policy'], ['/404.html','error'], ['/news/404.html','news-error'], ['/news/author/emily-carter/','author'], ['/news/author/news-desk/','desk'], ['/news/topic/thanksgiving-2026/','topic'], ['/news/page/2/','pagination'], ['/news/editorial-policy/','news-policy'], ['/news/','news'], ['/news/printables/','printables'], ['/news/category/holidays/','category'],
]);
const inventory=JSON.parse(await fs.readFile(path.join(out,'live-inventory.json'),'utf8'));
const story=inventory.pages.find(p=>p.class==='news'&&p.downloads.length>10&&new URL(p.url).pathname.split('/').length===4);
if(story)samples.set(new URL(story.url).pathname,'article');
const browser=await chromium.launch({headless:true});
const rows=[],issues=[];
const jobs=[...new Set(routes)].sort().flatMap(route=>[390,1440].map(width=>({route,width})));
await Promise.all(Array.from({length:3},async()=>{
  const context=await browser.newContext();
  await context.route('**/*',r=>{
    const host=new URL(r.request().url()).hostname;
    return ['localhost','127.0.0.1','cdn.freshcalendars.com'].includes(host)?r.continue():r.abort();
  });
  const page=await context.newPage();
  page.on("pageerror",error=>issues.push({route:new URL(page.url()).pathname,javascriptError:error.message}));
  for(let job;(job=jobs.shift());){
    const {route,width}=job;
    await page.setViewportSize({width,height:width===390?844:1000});
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    const state=await page.evaluate(()=>({
      h1:document.querySelectorAll('h1').length,
      designVersion:document.documentElement.dataset.designVersion,
      designLayout:document.documentElement.dataset.designLayout,
      layoutVerified:(()=>{const m={'home':'.home-hero','calendar-detail':'[data-studio]','calendar-library':'[data-library]','tools':'[data-date-tool]','holiday-list':'[data-holiday-filter]','holiday-date':'.date-answer','policy':'.page-workspace','contact':'.contact-form','guide':'.page-workspace','error':'.error-page','news-error':'.error-page','news-home':'.concept-news-lead','news-author':'.news-workspace','news-category':'.news-workspace','news-topic':'.news-workspace','news-pagination':'.news-workspace','news-policy':'.news-workspace','news-printables':'.news-workspace','news-article':'.article-layout'};const s=m[document.documentElement.dataset.designLayout];return !!s&&!!document.querySelector(s);})(),
      overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
      title:document.title,
      downloads:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(s=>/\.(pdf|png)(\?|$)/.test(s)),
    }));
    const row={route,width,status:response.status(),...state}; rows.push(row);
    if(state.h1!==1||state.overflow>1||response.status()!==200||state.designVersion!=='concept-v3'||!state.layoutVerified)issues.push(row);
    if(samples.has(route)){
      await readyImages(page);
      await page.screenshot({path:path.join(out,`${samples.get(route)}-${width}.png`),fullPage:false});
    }
    if(rows.length%50===0)console.log(`Rendered ${rows.length} viewport checks`);
  }
  await context.close();
}));
// Interactions whose markup changed: keyboard menus, mobile navigation and both search sources.
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route('**/*',r=>/googlesyndication|google-analytics|doubleclick/.test(r.request().url())?r.abort():r.continue());
await page.goto(base);
await page.getByText('Calendars',{exact:true}).first().click();
if(!await page.locator('.nav-panel').first().isVisible())issues.push({interaction:'desktop menu failed'});
await page.keyboard.press('Escape');
await page.locator('#site-q').fill('January');
await page.locator('#site-q-results a').first().waitFor();
if(!await page.locator('#site-q-results a[href="/january-calendars.html"]').count())issues.push({interaction:'calendar search failed'});
await page.locator('#site-q').fill('Wordle');
await page.waitForFunction(()=>[...document.querySelectorAll('#site-q-results a')].some(a=>a.getAttribute('href').startsWith('/news/')));
await page.setViewportSize({width:390,height:844});
await page.goto(base);
await page.locator('.nav-toggle').click();
if(!await page.locator('.nav').isVisible())issues.push({interaction:'mobile menu failed'});
await page.keyboard.press('Escape');
if(await page.locator('html').evaluate(e=>e.classList.contains('nav-open')))issues.push({interaction:'mobile menu did not close'});
for(const route of ['/missing-design-check/','/news/page/99/']){
  const response=await page.goto(base+route);
  if(response.status()!==404)issues.push({route,interaction:'missing route did not return 404'});
}
const livePaths=inventory.pages.map(p=>new URL(p.url).pathname);
const covered=new Set(rows.filter(p=>p.width===1440).map(p=>p.route));
const missing=livePaths.filter(p=>!covered.has(p));
for(const live of inventory.pages){
  const route=new URL(live.url).pathname;
  const built=rows.find(r=>r.route===route&&r.width===1440);
  const lost=live.downloads.filter(href=>built&&!built.downloads.includes(href));
  if(lost.length)issues.push({route,lostDownloads:[...new Set(lost)]});
}
const coverage={};for(const r of rows.filter(r=>r.width===1440)){(coverage[r.designLayout]??=[]).push(r.route);}await fs.writeFile(path.join(out,'design-coverage.json'),JSON.stringify({pages:covered.size,layouts:coverage,missingLivePaths:missing,issues},null,2));
await fs.writeFile(path.join(out,'local-qa.json'),JSON.stringify({pages:covered.size,checks:rows.length,missingLivePaths:missing,issues,rows},null,2));
await browser.close();
console.log(JSON.stringify({pages:covered.size,checks:rows.length,missingLivePaths:missing,issues},null,2));
if(issues.length||missing.length)process.exitCode=1;
