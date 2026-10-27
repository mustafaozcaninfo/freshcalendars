/** Local-only feature and shared-chrome checks across the complete public page inventory. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(path.join(process.cwd(),'packages/generator/package.json'));
const {chromium}=require('playwright');
const base='http://localhost:4324',out='output/design-audit';
const inventory=JSON.parse(await fs.readFile(path.join(out,'design-coverage.json'),'utf8'));
const browser=await chromium.launch(),checks=[],issues=[],rows=[];
function check(ok,route,label,detail){checks.push({route,label,ok:!!ok});if(!ok)issues.push({route,label,detail});}
const jobs=Object.values(inventory.layouts).flat();
await Promise.all(Array.from({length:3},async()=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await context.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text;}}});
    Object.defineProperty(navigator,'share',{value:async data=>{window.__shared=data;}});
  });
  await context.route('**/*',async r=>{
    const u=new URL(r.request().url());
    if(u.hostname==='cdn.freshcalendars.com')return r.fulfill({response:await context.request.get(base+u.pathname)});
    return u.hostname==='localhost'?r.continue():r.abort();
  });
  const page=await context.newPage();let route;
  page.on('pageerror',e=>issues.push({route,label:'runtime',detail:e.message}));
  for(;(route=jobs.shift());){
    await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);
    const shell=await page.evaluate(()=>{
      const style=s=>{const e=document.querySelector(s),c=e&&getComputedStyle(e);return e?{font:c.fontFamily,size:c.fontSize,height:Math.round(e.getBoundingClientRect().height)}:null;};
      return {header:style('header.site-header'),logo:style('.brand'),nav:style('.nav'),footer:style('footer'),font:getComputedStyle(document.body).fontFamily,accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),headers:document.querySelectorAll('header.site-header').length,footers:document.querySelectorAll('footer').length,navLinks:[...document.querySelectorAll('.nav a')].map(a=>a.getAttribute('href'))};
    });rows.push({route,...shell});
    check(shell.headers===1&&shell.footers===1,route,'One shared header and footer',shell);
    check(shell.navLinks.includes('/news/')&&shell.navLinks.includes('/calendars/'),route,'Shared navigation connects calendar and news');
    await page.locator('[data-theme-toggle]').click();check(await page.locator('html').getAttribute('data-theme')==='dark',route,'Dark appearance control');
    await page.locator('[data-theme-toggle]').click();
    const search=page.locator('#site-q');await search.fill('January');
    check(await page.locator('#site-q-results a[href="/january-calendars.html"]').count()===1,route,'Header calendar search');
    await search.press('Escape');
    const listing=page.locator('[data-listing-search]');
    if(await listing.count()){
      const n=await page.locator('[data-search-text]:visible').count();await listing.fill('zzzz-no-story-zzzz');
      check(await page.locator('[data-listing-empty]').isVisible()&&!await page.locator('[data-search-text]:visible').count(),route,'Listing empty state');
      await listing.fill('');check(await page.locator('[data-search-text]:visible').count()===n,route,'Listing clear restores cards');
    }
    const holiday=page.locator('[data-holiday-filter]');
    if(await holiday.count()){
      const n=await holiday.locator('[data-holiday-row]:visible').count();
      for(const kind of await holiday.locator('[data-holiday-kind] option').evaluateAll(a=>a.map(x=>x.value))){
        await holiday.locator('[data-holiday-kind]').selectOption(kind);
        check(await holiday.locator('[data-holiday-row]:visible').evaluateAll((a,k)=>a.every(x=>!k||x.dataset.kind===k),kind),route,'Holiday type '+kind);
      }
      await holiday.locator('[data-holiday-query]').fill('no-such-date');check(await holiday.locator('[data-holiday-empty]').isVisible(),route,'Holiday empty state');
      await holiday.locator('[data-holiday-reset]').click();check(await holiday.locator('[data-holiday-row]:visible').count()===n,route,'Holiday reset');
    }
    const copy=page.locator('.share .copy').first();
    if(await copy.count()){
      await copy.click();check(await page.evaluate(()=>window.__copied?.startsWith('https://freshcalendars.com/news/')),route,'Article copy uses canonical URL');
      await page.locator('.share .native').first().click();check(await page.evaluate(()=>window.__shared?.url===window.__copied),route,'Article native share');
      const toc=page.locator('[data-toc]').first();if(await toc.count()){
        const hash=await toc.getAttribute('href');await toc.click();await page.waitForFunction(hash=>decodeURIComponent(location.hash)===decodeURIComponent(hash),hash);check(decodeURIComponent(new URL(page.url()).hash)===decodeURIComponent(hash),route,'Article contents navigation');
      }
      await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
      check(await page.locator('.progress span').evaluate(e=>getComputedStyle(e).transform!=='none'),route,'Reading progress initialized');
    }
    for(const details of await page.locator('main details').all()){
      const summary=details.locator(':scope > summary');if(await summary.isVisible()){
        await summary.click();check(await details.evaluate(e=>e.open),route,'Content disclosure opens');await summary.click();
      }
    }
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
    rows[rows.findIndex(r=>r.route===route)].mobile=await page.locator('.site-header').evaluate(e=>({height:Math.round(e.getBoundingClientRect().height),width:Math.round(e.getBoundingClientRect().width),font:getComputedStyle(e).fontFamily,toggleFont:getComputedStyle(e.querySelector('.nav-toggle-label')).fontSize}));
    await page.locator('.nav-toggle').click();await page.waitForFunction(()=>document.documentElement.classList.contains('nav-open'));
    check(await page.locator('.nav').isVisible(),route,'Mobile navigation opens');
    await page.keyboard.press('Escape');check(!await page.locator('html').evaluate(e=>e.classList.contains('nav-open')),route,'Mobile navigation releases page');
    await page.setViewportSize({width:1440,height:1000});
    if(rows.length%50===0)console.log('Feature pages: '+rows.length+'/'+inventory.pages);
  }
  await context.close();
}));
// Computed chrome must agree across both independently built sites.
const reference=rows.find(r=>r.route==='/');
for(const r of rows)for(const field of ['header','logo','nav','footer','accent','navLinks','mobile'])check(JSON.stringify(r[field])===JSON.stringify(reference[field]),r.route,'Shared '+field+' consistency',r[field]);
await browser.close();
await fs.writeFile(path.join(out,'feature-smoke.json'),JSON.stringify({pages:rows.length,checks:checks.length,issues,rows,results:checks},null,2));
console.log(JSON.stringify({pages:rows.length,checks:checks.length,issueCount:issues.length,issues:issues.slice(0,12)}));
if(issues.length)process.exitCode=1;
