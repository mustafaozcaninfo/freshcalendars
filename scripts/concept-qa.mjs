import {readyImages} from "./qa-images.mjs";
/** End-to-end checks for the actual concept controls and downloadable outputs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(path.join(process.cwd(),'packages/generator/package.json'));
const {chromium}=require('playwright');
const pdfRequire=createRequire(path.join(process.cwd(),'apps/news/package.json'));
const {PDFDocument}=pdfRequire('pdf-lib');
const base='http://localhost:4324',out='output/design-audit';
const browser=await chromium.launch();const context=await browser.newContext();
await context.route('**/*',r=>['localhost','cdn.freshcalendars.com'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
function assert(ok,label){if(!ok)throw Error(label);checks.push(label);}
await page.goto(base+'/monthly-calendars/');
assert(await page.locator('[data-library-card]:visible').count()===12,'Monthly library starts with 12 months');
await page.selectOption('[name=year]','2030');await page.selectOption('[name=month]','2');await page.selectOption('[name=design]','floral');await page.selectOption('[name=paper]','a4');await page.selectOption('[name=start]','monday');
assert(await page.locator('[data-library-card]:visible').count()===1,'Month/year/design filters combine');
const url=await page.locator('[data-library-card]:visible [data-card-open]').getAttribute('href');
assert(url.includes('2030')&&url.includes('floral')&&url.includes('a4')&&url.includes('monday'),'Library carries every selection to detail page');
await page.goto(base+url);
assert((await page.locator('h1').textContent()).includes('2030'),'Detail loads selected year');
assert((await page.locator('[data-main-preview]').getAttribute('src')).includes('a4-monday'),'Preview loads selected paper and start day');
const pdfHref=await page.locator('[data-primary-download]').getAttribute('href');
const response=await context.request.get(base+pdfHref);assert(response.status()===200,'Selected A4 PDF exists');
const pdf=await PDFDocument.load(await response.body());assert(pdf.getPageCount()===1,'Monthly PDF is one page');const size=pdf.getPage(0).getSize();assert(Math.abs(size.width-595.276)<.02&&Math.abs(size.height-841.89)<.02,'A4 PDF has exact A4 dimensions');
await page.locator('[data-choice=paper][data-value=letter]').click();await page.locator('[data-choice=start][data-value=sunday]').click();
const letter=await PDFDocument.load(await(await context.request.get(base+await page.locator('[data-primary-download]').getAttribute('href'))).body());assert(letter.getPage(0).getWidth()===612&&letter.getPage(0).getHeight()===792,'Letter PDF has exact US Letter dimensions');
await page.locator('[data-choice=format][data-value=png]').click();assert((await page.locator('[data-primary-download]').getAttribute('href')).endsWith('.png'),'PNG selection changes primary download');assert((await page.locator('.studio-secondary').getAttribute('href')).endsWith('.pdf'),'Alternate download remains available');
for(const style of ['scenic','color-modern','classic-bw','floral','landscape-soft','holidays','notes-planner']){
 await page.locator('.studio-style-tabs [data-value="'+style+'"]').click();const src=await page.locator('[data-main-preview]').getAttribute('src');assert((await context.request.get(base+src)).status()===200,style+' preview exists');
}
await page.locator('[data-favorite]').click();assert(await page.locator('[data-favorite]').getAttribute('aria-pressed')==='true','Favorite is saved');await page.reload();assert(await page.locator('[data-favorite]').getAttribute('aria-pressed')==='true','Favorite survives reload');
await page.goto(base+'/printable-calendars.html');for(const style of ['minimal','floral','classic','monday-start']){await page.locator('.studio-style-tabs [data-value="'+style+'"]').click();await page.locator('[data-choice=paper][data-value=a4]').click();assert((await context.request.get(base+await page.locator('[data-primary-download]').getAttribute('href'))).status()===200,'Yearly '+style+' A4 exists');}
await page.selectOption('[data-studio-year]','2030');assert((await context.request.get(base+await page.locator('[data-primary-download]').getAttribute('href'))).status()===200,'Future yearly selection exists');
await page.goto(base+'/calendar-tools/');const between=page.locator('[data-date-tool=between]');await between.locator('[name=from]').fill('2028-02-28');await between.locator('[name=to]').fill('2028-03-01');await between.locator('button').click();assert((await between.locator('output').textContent()).startsWith('2 days'),'Date tool handles leap day');
await page.goto(base+'/');assert(await page.locator('.category-launchers a').count()===7,'Home has all seven category launchers');
await page.locator('#hero-q').fill('January');await page.locator('#hero-q-results a').first().waitFor();assert(await page.locator('#hero-q-results a[href="/january-calendars.html"]').count()===1,'Hero search works independently of header search');
await page.locator('[data-shelf-filter=blank]').click();assert(await page.locator('[data-shelf-card]:visible').count()===1,'Popular shelf filters real cards');
await page.locator('[data-theme-toggle]').click();assert(await page.locator('html').getAttribute('data-theme')==='dark','Appearance toggle works');await page.reload();assert(await page.locator('html').getAttribute('data-theme')==='dark','Appearance preference survives reload');await page.locator('[data-theme-toggle]').click();
const routes=[['home','/'],['library','/monthly-calendars/'],['detail','/january-calendars.html?year=2026'],['news','/news/'],['article','/news/advent-calendar-2026-dates-free-printable/'],['yearly','/printable-calendars.html'],['tools','/calendar-tools/']];
for(const width of [390,768,1024,1440]){await page.setViewportSize({width,height:1000});for(const[name,route]of routes){await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);assert(await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)<=innerWidth+1),name+' has no overflow at '+width);if(width===390||width===1440){await readyImages(page);await page.screenshot({path:path.join(out,'concept-'+name+'-'+width+'.png')});}}}
assert(errors.length===0,'No browser JavaScript errors');
await fs.writeFile(path.join(out,'concept-qa.json'),JSON.stringify({passed:checks.length,checks,errors},null,2));await browser.close();console.log(JSON.stringify({passed:checks.length,errors}));
