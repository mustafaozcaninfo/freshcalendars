/** Selection identity, failure recovery, calculators and dependent filters; local mocks only. */
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire}from'node:module';
const require=createRequire(path.join(process.cwd(),'packages/generator/package.json'));const{chromium}=require('playwright');
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1440,height:1000}}),checks=[],issues=[];
await context.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
await context.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text;}}});});
const page=await context.newPage(),base='http://localhost:4324';
function check(ok,label){checks.push({label,ok:!!ok});if(!ok)issues.push({route:page.url(),label});}
page.on('pageerror',e=>issues.push({route:page.url(),label:e.message}));
try{
  for(const family of ['yearly','blank','weekly','monthly']){
    await page.goto(base+'/calendars/?family='+family+'&year=2030');
    check(await page.locator('[data-library-family][aria-current=page]').getAttribute('data-library-family')===family,family+' category rail follows selected family');
    if(!['blank','weekly'].includes(family))check((await page.locator('[data-library-intro]').textContent()).includes('2030'),family+' description follows selected year');
    await page.locator('[name=library-search]').fill('no-such-template');check(await page.locator('[data-library-empty]').isVisible(),family+' library empty state');
    await page.locator('[data-library-reset]').click();check(await page.locator('[data-library-card]:visible').count()>0,family+' reset restores results');
  }
  await page.goto(base+'/blank-calendars.html');await page.evaluate(()=>localStorage.removeItem('fc-favorites'));await page.reload();await page.locator('[data-favorite]').click();
  for(const route of ['/printable-blank-yearly-calendar.html','/printable-school-calendar.html','/printable-calendars.html?style=classic']){
    await page.goto(base+route);check(await page.locator('[data-favorite]').getAttribute('aria-pressed')==='false',route+' is independent of blank monthly favorite');
  }
  await page.goto(base+'/blank-calendars.html');check(await page.locator('[data-favorite]').getAttribute('aria-pressed')==='true','Saved blank monthly survives navigation');
  await page.locator('[data-favorite]').click();await page.reload();check(await page.locator('[data-favorite]').getAttribute('aria-pressed')==='false','Favorite removal survives reload');
  await page.goto(base+'/january-calendars.html?year=2030&style=floral&paper=a4&start=monday');
  await page.locator('[data-calendar-share]').click();check(await page.evaluate(()=>window.__copied===location.href),'Calendar copy includes every selected option');
  const initial=await page.locator('[data-main-preview]').getAttribute('src');await page.locator('[data-style-step="1"]').click();await page.locator('[data-style-step="-1"]').click();check(await page.locator('[data-main-preview]').getAttribute('src')===initial,'Preview arrows round-trip to selected style');
  await page.goto(base+'/calendar-tools/');const between=page.locator('[data-date-tool=between]'),add=page.locator('[data-date-tool=add]');
  for(const [from,to,n]of [['2028-02-28','2028-03-01',2],['2026-03-07','2026-03-09',2],['2026-10-26','2026-10-26',0],['2027-01-01','2026-12-31',1]]){
    await between.locator('[name=from]').fill(from);await between.locator('[name=to]').fill(to);await between.locator('button').click();check((await between.locator('output').textContent()).startsWith(n+' days'),from+' to '+to+' computes '+n);
  }
  for(const [from,n,expected]of [['2028-02-28','1','February 29, 2028'],['2027-01-01','-1','December 31, 2026'],['2026-10-26','0','October 26, 2026']]){
    await add.locator('[name=from]').fill(from);await add.locator('[name=days]').fill(n);await add.locator('button').click();check((await add.locator('output').textContent()).includes(expected),'Add '+n+' days to '+from);
  }
  await page.goto(base+'/news/printables/');for(const button of await page.locator('[data-topic][aria-pressed]').all()){
    const topic=await button.getAttribute('data-topic');await button.click();const cards=page.locator('[data-printable]:visible');check(await cards.count()>0,'Printable category '+topic+' has files');check(await cards.evaluateAll((a,t)=>a.every(e=>!t||e.dataset.topic===t),topic),'Printable category '+topic+' only shows its files');
  }
  await page.locator('[data-printables-reset]').click();await page.locator('#pr-q').fill('nonexistent-zzyy');check(await page.locator('#pr-none').isVisible(),'Printable no-match state');
  await page.goto(base+'/page/contact/');let attempts=0;let release;const pending=new Promise(r=>{release=r;});
  await page.route('**/api/contact.php',async r=>{attempts++;if(attempts===1)await pending;await r.fulfill({status:attempts===1?503:200,contentType:'application/json',body:JSON.stringify(attempts===1?{ok:false,error:'Try again later.'}:{ok:true})});});
  await page.locator('[name=name]').fill('Local smoke');await page.locator('[name=email]').fill('preview@example.com');await page.locator('[name=message]').fill('Intercepted locally.');
  await page.locator('#contact-form').evaluate(form=>{form.requestSubmit();form.requestSubmit();});await page.waitForTimeout(100);
  check(attempts===1,'Contact prevents duplicate requests while sending');release();
  await page.locator('#contact-msg.err').waitFor();check((await page.locator('#contact-msg').textContent()).includes('Try again'),'Contact shows temporary server failure');
  await page.locator('button[type=submit]').click();await page.locator('#contact-msg.ok').waitFor();check(await page.locator('[name=message]').inputValue()==='','Contact retry succeeds and clears message');
  await page.goto(base+'/');for(const button of await page.locator('[data-shelf-filter]').all()){
    const filter=await button.getAttribute('data-shelf-filter');await button.click();
    check(await page.locator('[data-shelf-card]:visible').count()>0,'Popular calendars '+filter+' has results');
    check(await page.locator('[data-shelf-card]:visible').evaluateAll((a,f)=>a.every(e=>f==='all'||e.dataset.tags.split(' ').includes(f)),filter),'Popular calendars '+filter+' filters correctly');
  }
  await page.locator('[data-shelf-next]').click();await page.waitForFunction(()=>document.querySelector('.calendar-shelf').scrollLeft>0);check(true,'Popular shelf next scrolls to additional templates');
  await page.locator('h1').click();await page.keyboard.press('/');check(await page.locator('#site-q').evaluate(e=>e===document.activeElement),'Slash keyboard shortcut focuses search');
  await page.goto(base+'/january-calendars.html');for(const format of ['pdf','png']){
    await page.locator('[data-choice=format][data-value='+format+']').click();
    const downloadPromise=page.waitForEvent('download');await page.locator('[data-primary-download]').click();const download=await downloadPromise;
    check(download.suggestedFilename().endsWith('.'+format)&&!await download.failure(),'Browser receives actual '+format.toUpperCase()+' download');
  }
  const fallback=await browser.newContext();await fallback.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await fallback.route('**/news/search/index.json',r=>r.fulfill({status:503,body:'unavailable'}));const fp=await fallback.newPage();await fp.goto(base+'/');await fp.locator('#site-q').fill('January');await fp.locator('#site-q-results a').first().waitFor();check(await fp.locator('#site-q-results a[href="/january-calendars.html"]').count()===1,'Calendar search survives unavailable news index');await fallback.close();
  const restricted=await browser.newContext();await restricted.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('Storage disabled');}});});await restricted.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());const rp=await restricted.newPage(),storageErrors=[];rp.on('pageerror',e=>storageErrors.push(e.message));
  for(const route of ['/','/january-calendars.html','/news/','/news/printable-nfl-schedule-2026-2027-pdf/']){await rp.goto(base+route);await rp.locator('[data-theme-toggle]').click();check(await rp.locator('html').getAttribute('data-theme')==='dark',route+' works with browser storage disabled');}
  check(!storageErrors.length,'No runtime errors with browser storage disabled');await restricted.close();
  const delayed=await browser.newContext();await delayed.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());let releaseIndex;const indexGate=new Promise(r=>{releaseIndex=r;});
  await delayed.route('**/news/search/index.json',async r=>{await indexGate;await r.fulfill({status:200,contentType:'application/json',body:await fs.readFile('dist/news/search/index.json','utf8')});});
  const dp=await delayed.newPage();await dp.goto(base+'/');await dp.locator('#hero-q').fill('January');await dp.locator('#hero-q').press('ArrowDown');await dp.keyboard.press('Escape');const arrived=dp.waitForResponse(r=>r.url().endsWith('/news/search/index.json'));releaseIndex();await arrived;await dp.waitForFunction(()=>document.querySelector('#hero-q-results').hidden&&document.activeElement.id==='hero-q');
  await dp.waitForTimeout(100);check(await dp.locator('#hero-q-results').isHidden(),'Late news search response cannot reopen Escape-dismissed results');await dp.locator('#hero-q').fill('Wordle');await dp.locator('#hero-q-results a').first().waitFor();check(await dp.locator('#hero-q-results a').count()>0,'Typing resumes search after dismissal');await delayed.close();
}finally{await browser.close();await fs.writeFile('output/design-audit/feature-edge-smoke.json',JSON.stringify({checks:checks.length,issues,results:checks},null,2));}
console.log(JSON.stringify({checks:checks.length,issues}));if(issues.length)process.exitCode=1;
