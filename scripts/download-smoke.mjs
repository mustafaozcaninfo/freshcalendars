/** Parse actual local print files, including every selectable studio variant. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=process.cwd(),out='output/design-audit';
const require=createRequire(path.join(root,'apps/news/package.json'));
const {PDFDocument}=require('pdf-lib');
const generatorRequire=createRequire(path.join(root,'packages/generator/package.json'));
const sharp=generatorRequire('sharp');
const coverage=JSON.parse(await fs.readFile(path.join(out,'design-coverage.json'),'utf8'));
const candidates=new Map(),calendars=new Set(),models=[],issues=[],counts={pdf:0,png:0,webp:0,studioStates:0,ics:0,events:0};
function add(url,paper){const u=new URL(url,'http://localhost:4324');if(!['localhost','freshcalendars.com','cdn.freshcalendars.com'].includes(u.hostname))return;const name=decodeURIComponent(u.pathname);if(!/\.(pdf|png|webp)$/.test(name))return;const record=candidates.get(name)||{url:name};if(paper)record.paper=paper;candidates.set(name,record);}
for(const route of Object.values(coverage.layouts).flat()){
  const folder=route.startsWith('/news/')?'news':'site',rel=route.replace(folder==='news'?/^\/news\//:/^\//,'');
  const html=await fs.readFile(path.join(root,'dist',folder,rel,route.endsWith('/')?'index.html':''),'utf8');
  for(const m of html.matchAll(/(?:href|src)="([^"]+\.(?:pdf|png|webp))"/g))add(m[1]);
  for(const m of html.matchAll(/href="([^"]+)"/g))if(m[1].startsWith('data:text/calendar')||/\.ics$/.test(m[1]))calendars.add(m[1]);
  const match=html.match(/<script type="application\/json" data-studio-model>(.*?)<\/script>/s);
  if(!match)continue;
  const model=JSON.parse(match[1]);models.push({route,model});
  for(const year of model.years)for(const style of model.styles)for(const paper of ['letter','a4'])for(const start of model.month?['sunday','monday']:['sunday']){
    const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
    const file=model.month?`/assets/studio/${year}/${months[model.month-1]}/${style.id}/${paper}-${start}`:new URL(style.pdf,'http://localhost').pathname.replace(/\.pdf$/,'').replace('/'+model.year+'/','/'+year+'/')+'-'+paper;
    for(const ext of ['pdf','png','webp'])add(file+'.'+ext,paper);counts.studioStates++;
  }
}
const jobs=[...candidates.values()];
await Promise.all(Array.from({length:3},async()=>{
  for(let job;(job=jobs.shift());){
    const folder=job.url.startsWith('/news/')?'news':'site',file=path.join(root,'dist',folder,job.url.replace(folder==='news'?/^\/news\//:/^\//,''));
    try{
      if(job.url.endsWith('.pdf')){
        const pdf=await PDFDocument.load(await fs.readFile(file));if(!pdf.getPageCount())throw Error('PDF has no pages');
        if(job.paper){const expected=job.paper==='a4'?[595.276,841.89]:[612,792];for(const page of pdf.getPages()){const actual=[page.getWidth(),page.getHeight()].sort((a,b)=>a-b);if(actual.some((v,i)=>Math.abs(v-expected[i])>1))throw Error('Wrong paper dimensions '+actual.join(' × '));}}
        counts.pdf++;
      }else{
        const meta=await sharp(file).metadata();if(!meta.width||!meta.height)throw Error('Missing image dimensions');counts[job.url.endsWith('.png')?'png':'webp']++;
      }
    }catch(e){issues.push({url:job.url,paper:job.paper,message:e.message});}
  }
}));
for(const url of calendars){
  try{
    let ics;if(url.startsWith('data:'))ics=decodeURIComponent(url.slice(url.indexOf(',')+1));else{const u=new URL(url,'http://localhost');ics=await fs.readFile(path.join(root,'dist',u.pathname.startsWith('/news/')?'news':'site',u.pathname.replace(u.pathname.startsWith('/news/')?/^\/news\//:/^\//,'')),'utf8');}
    ics=ics.replace(/\r?\n[ \t]/g,'');
    if(!ics.startsWith('BEGIN:VCALENDAR')||!ics.includes('VERSION:2.0')||!ics.includes('END:VCALENDAR'))throw Error('Invalid iCalendar envelope');
    for(const match of ics.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)){
      const event=match[1],start=event.match(/DTSTART(?:;VALUE=DATE)?:([^\r\n]+)/)?.[1],end=event.match(/DTEND(?:;VALUE=DATE)?:([^\r\n]+)/)?.[1];
      if(!start||!event.includes('UID:')||!event.includes('SUMMARY:'))throw Error('Missing required event fields');
      const instant=s=>Date.parse(s.replace(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z)?$/,(m,y,mo,d,h,mi,se)=>`${y}-${mo}-${d}T${h||'00'}:${mi||'00'}:${se||'00'}Z`));
      if(!Number.isFinite(instant(start))||end&&!(instant(end)>instant(start)))throw Error('Invalid event boundaries');
      if(/^\d{8}$/.test(start)&&end&&instant(end)-instant(start)!==864e5)throw Error('All-day event must end the next day');
      counts.events++;
    }
    counts.ics++;
  }catch(e){issues.push({url:url.startsWith('data:')?url.slice(0,80):url,message:e.message});}
}
await fs.writeFile(path.join(out,'download-smoke.json'),JSON.stringify({models:models.length,files:candidates.size,counts,issues},null,2));
console.log(JSON.stringify({models:models.length,files:candidates.size,counts,issues}));if(issues.length)process.exitCode=1;
