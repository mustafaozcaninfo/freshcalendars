/**
 * Shared search combines existing calendar URLs and the static news index (instant title and keyword
 * matches), then adds stories whose text matches from the Pagefind index the news build writes to
 * /news/pagefind/ (apps/news/src/lib/search-index.mjs), with a highlighted excerpt. Pagefind loads
 * on first focus; if it cannot load (old browser, local calendar preview) the title matches stay.
 */
export const SITE_SEARCH_JS = `(function(){
var pagefind=null;
function loadPagefind(){if(!pagefind)pagefind=import('/news/pagefind/pagefind.js').then(function(pf){return pf.init().then(function(){return pf;});}).catch(function(){return null;});return pagefind;}
document.querySelectorAll('[data-site-search]').forEach(function(form){
var input=form.querySelector('input'),list=form.querySelector('ul'),status=form.querySelector('[aria-live]');
var textQuery='',textPending='',textHits=[],textBusy=false,byUrl={};
var months=['January','February','March','April','May','June','July','August','September','October','November','December'],years=JSON.parse(form.dataset.monthYears),year=Number(form.dataset.year);
var calendars=months.map(function(m,i){return {t:m+' '+years[i]+' printable calendars',u:'/'+m.toLowerCase()+'-calendars.html',c:'Monthly calendars',k:m+' monthly calendar pdf png'};});
[[year+' yearly calendars','/printable-calendars.html'],[(year+1)+' yearly calendars','/printable-yearly-calendar.html'],['Blank calendars','/blank-calendars.html'],['Weekly planners','/printable-weekly-calendar.html'],['School calendars','/printable-school-calendar.html'],['Monday-start calendars','/printable-monday-start-calendar.html'],['US holidays','/holidays/'],['UK holidays','/uk-holidays/'],['Canada holidays','/canada-holidays/'],['Print guide','/print-guide.html']].forEach(function(x){calendars.push({t:x[0],u:x[1],c:'Calendars & guides',k:'calendar printable pdf png'});});
var aliases={gta:'grand theft auto',dst:'daylight saving',cps:'chicago public schools',nyc:'new york city',ssa:'social security',cola:'cost of living',nyse:'stock market',usps:'postal'};
var index=calendars,loaded=false,loading=null,dismissed=false;
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
/* Normalized once per entry, not on every keystroke: with thousands of stories that was the slow part. */
function prep(x){x._t=norm(x.t);x._a=x._t+' '+norm(x.k)+' '+norm(x.c)+' '+norm(x.d);return x;}
calendars.forEach(prep);
function close(){dismissed=true;list.hidden=true;input.setAttribute('aria-expanded','false');}
function item(u,t,c){var li=document.createElement('li'),a=document.createElement('a'),b=document.createElement('b'),small=document.createElement('small');a.href=u;b.textContent=t;small.textContent=c||'';a.append(b);if(c)a.append(small);li.append(a);return li;}
/* Pagefind excerpts are escaped text with <mark> around matches; rebuild them as text and mark nodes only. */
function excerpt(html){var p=document.createElement('p'),t=document.createElement('template');p.className='search-excerpt';t.innerHTML=html;t.content.childNodes.forEach(function(n){if(n.nodeName==='MARK'){var m=document.createElement('mark');m.textContent=n.textContent;p.append(m);}else p.append(n.textContent||'');});return p;}
function render(){
 dismissed=false;
 var raw=norm(input.value),words=raw.split(' ').filter(Boolean).flatMap(function(w){return aliases[w]?aliases[w].split(' '):[w];});list.replaceChildren();
 if(!words.length){close();status.textContent='';return;}
 var matches=index.map(function(x,i){var title=x._t,all=x._a;return words.every(function(w){return all.indexOf(w)>=0;})?{x:x,s:(title.indexOf(raw)===0?100:0)+words.filter(function(w){return title.indexOf(w)>=0;}).length*10-i/10000}:null;}).filter(Boolean).sort(function(a,b){return b.s-a.s;}).slice(0,6);
 matches.forEach(function(m){list.append(item(m.x.u,m.x.t,m.x.c));});
 var shown={};matches.forEach(function(m){shown[m.x.u]=1;});
 var hits=textQuery===words.join(' ')?textHits.filter(function(h){return !shown[h.url];}).slice(0,5):[];
 if(hits.length){var g=document.createElement('li');g.className='search-group';g.textContent=matches.length?'Also in story text':'Found in story text';list.append(g);}
 hits.forEach(function(h){var li=item(h.url,h.meta.title,(byUrl[h.url]||{}).c);li.firstChild.append(excerpt(h.excerpt));list.append(li);});
 list.classList.toggle('has-text',hits.length>0);
 if(!matches.length&&!hits.length){var li=document.createElement('li');li.className='search-empty';li.textContent=textBusy?'Searching stories…':'No matches. Try a month, holiday or topic.';list.append(li);}
 list.hidden=false;input.setAttribute('aria-expanded','true');status.textContent=(matches.length+hits.length)+' results. Tab or arrow down to explore.';
 if(textQuery!==words.join(' '))searchText(words.join(' '));
}
/* Story text search; a newer keystroke cancels an older one (debouncedSearch resolves to null). */
function searchText(q){
 if(textPending===q)return;textPending=q;textBusy=true;
 loadPagefind().then(function(pf){
  if(!pf)return [];
  return pf.debouncedSearch(q,{},150).then(function(r){return r?Promise.all(r.results.slice(0,11).map(function(x){return x.data();})):null;});
 }).then(function(data){
  if(data===null||q!==textPending)return;
  textBusy=false;textQuery=q;textHits=data;
  /* Re-draw only while the reader is still in the box: re-drawing under a focused result would drop focus. */
  if(!dismissed&&document.activeElement===input)render();
 });
}
function load(){loadPagefind();if(loaded||loading)return;loading=fetch('/news/search/index.json').then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(data){index=calendars.concat(data.filter(function(x){return typeof x.u==='string'&&x.u.startsWith('/news/');}).map(prep));index.forEach(function(x){byUrl[x.u]=x;});loaded=true;if(document.activeElement===input&&!dismissed)render();}).catch(function(){status.textContent='News search is unavailable. Calendar results are still available.';}).finally(function(){loading=null;});}
input.addEventListener('focus',function(){load();render();});input.addEventListener('input',render);
input.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){var a=list.querySelector('a');if(a){e.preventDefault();a.focus();}}if(e.key==='Escape')close();});
list.addEventListener('keydown',function(e){var a=Array.from(list.querySelectorAll('a')),i=a.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();var n=i+(e.key==='ArrowDown'?1:-1);if(n<0)input.focus();else (a[n]||a[0]).focus();}if(e.key==='Escape'){close();input.focus();close();}});
form.addEventListener('submit',function(e){e.preventDefault();var first=list.querySelector('a');if(first)location.href=first.href;else render();});
document.addEventListener('pointerdown',function(e){if(!form.contains(e.target))close();});
if(input.id==='site-q')document.addEventListener('keydown',function(e){if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();input.focus();}});
});})();`;
