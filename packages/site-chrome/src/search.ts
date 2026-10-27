/** Shared search combines existing calendar URLs and the static news index. */
export const SITE_SEARCH_JS = `(function(){
document.querySelectorAll('[data-site-search]').forEach(function(form){
var input=form.querySelector('input'),list=form.querySelector('ul'),status=form.querySelector('[aria-live]');
var months=['January','February','March','April','May','June','July','August','September','October','November','December'],years=JSON.parse(form.dataset.monthYears),year=Number(form.dataset.year);
var calendars=months.map(function(m,i){return {t:m+' '+years[i]+' printable calendars',u:'/'+m.toLowerCase()+'-calendars.html',c:'Monthly calendars',k:m+' monthly calendar pdf png'};});
[[year+' yearly calendars','/printable-calendars.html'],[(year+1)+' yearly calendars','/printable-yearly-calendar.html'],['Blank calendars','/blank-calendars.html'],['Weekly planners','/printable-weekly-calendar.html'],['School calendars','/printable-school-calendar.html'],['Monday-start calendars','/printable-monday-start-calendar.html'],['US holidays','/holidays/'],['UK holidays','/uk-holidays/'],['Canada holidays','/canada-holidays/'],['Print guide','/print-guide.html']].forEach(function(x){calendars.push({t:x[0],u:x[1],c:'Calendars & guides',k:'calendar printable pdf png'});});
var aliases={gta:'grand theft auto',dst:'daylight saving',cps:'chicago public schools',nyc:'new york city',ssa:'social security',cola:'cost of living',nyse:'stock market',usps:'postal'};
var index=calendars,loaded=false,loading=null,dismissed=false;
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function close(){dismissed=true;list.hidden=true;input.setAttribute('aria-expanded','false');}
function render(){
 dismissed=false;
 var raw=norm(input.value),words=raw.split(' ').filter(Boolean).flatMap(function(w){return aliases[w]?aliases[w].split(' '):[w];});list.replaceChildren();
 if(!words.length){close();status.textContent='';return;}
 var matches=index.map(function(x,i){var title=norm(x.t),all=title+' '+norm(x.k)+' '+norm(x.c)+' '+norm(x.d);return words.every(function(w){return all.indexOf(w)>=0;})?{x:x,s:(title.indexOf(raw)===0?100:0)+words.filter(function(w){return title.indexOf(w)>=0;}).length*10-i/10000}:null;}).filter(Boolean).sort(function(a,b){return b.s-a.s;}).slice(0,8);
 matches.forEach(function(m){var li=document.createElement('li'),a=document.createElement('a'),b=document.createElement('b'),small=document.createElement('small');a.href=m.x.u;b.textContent=m.x.t;small.textContent=m.x.c;a.append(b,small);li.append(a);list.append(li);});
 if(!matches.length){var li=document.createElement('li');li.className='search-empty';li.textContent='No matches. Try a month, holiday or topic.';list.append(li);}
 list.hidden=false;input.setAttribute('aria-expanded','true');status.textContent=matches.length+' results. Tab or arrow down to explore.';
}
function load(){if(loaded||loading)return;loading=fetch('/news/search/index.json').then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(data){index=calendars.concat(data.filter(function(x){return typeof x.u==='string'&&x.u.startsWith('/news/');}));loaded=true;if(document.activeElement===input&&!dismissed)render();}).catch(function(){status.textContent='News search is unavailable. Calendar results are still available.';}).finally(function(){loading=null;});}
input.addEventListener('focus',function(){load();render();});input.addEventListener('input',render);
input.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){var a=list.querySelector('a');if(a){e.preventDefault();a.focus();}}if(e.key==='Escape')close();});
list.addEventListener('keydown',function(e){var a=Array.from(list.querySelectorAll('a')),i=a.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();var n=i+(e.key==='ArrowDown'?1:-1);if(n<0)input.focus();else (a[n]||a[0]).focus();}if(e.key==='Escape'){close();input.focus();close();}});
form.addEventListener('submit',function(e){e.preventDefault();var first=list.querySelector('a');if(first)location.href=first.href;else render();});
document.addEventListener('pointerdown',function(e){if(!form.contains(e.target))close();});
if(input.id==='site-q')document.addEventListener('keydown',function(e){if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();input.focus();}});
});})();`;
