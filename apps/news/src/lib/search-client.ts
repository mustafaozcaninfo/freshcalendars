/**
 * News bar search, appended to the layout's inline script (the page keeps ≤2 inline scripts).
 * The index (/news/search/index.json) loads on first focus or hover, so pages carry no data.
 * Matching: every query word must hit the title, keywords, category or description, by word
 * prefix (or substring for words of 4+ letters); title hits rank highest, then keywords, then
 * recency; a title that starts with, or contains, the whole query gets a bonus. Accents and punctuation are ignored, and a few common short forms expand.
 * Keyboard: "/" focuses, arrows move, Enter opens, Escape closes. Picks are sent to GA4 as the
 * recommended "search" event.
 */
export const SEARCH_JS = `
(function(){
  var form=document.querySelector('[data-news-search]'); if(!form) return;
  var q=form.querySelector('input'), list=form.querySelector('[role=listbox]'), status=form.querySelector('.nq-status');
  var idx=null, loading=null, items=[], active=-1;
  var ALIAS={gta:'grand theft auto',dst:'daylight saving',cps:'chicago public schools',nyc:'new york city',ssa:'social security',cola:'cost-of-living',nyse:'stock market',usps:'postal'};
  function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9$]+/g,' ').trim();}
  function load(){ if(idx||loading) return loading; loading=fetch('/news/search/index.json').then(function(r){return r.json();}).then(function(a){ idx=a.map(function(x,i){return {x:x,i:i,t:' '+norm(x.t),k:' '+norm(x.k),c:' '+norm(x.c),d:' '+norm(x.d)};}); return idx; }).catch(function(){loading=null;}); return loading; }
  function hit(f,w){ return f.indexOf(' '+w)>=0 ? 2 : (w.length>3 && f.indexOf(w)>=0 ? 1 : 0); }
  function search(raw){
    var words=norm(raw).split(' ').filter(Boolean); if(!words.length) return [];
    words=words.map(function(w){return ALIAS[w]?norm(ALIAS[w]).split(' '):[w];});
    return idx.map(function(e){
      var s=0; for(var g=0;g<words.length;g++){ var best=0; for(var j=0;j<words[g].length;j++){ var w=words[g][j], v=hit(e.t,w)*6||hit(e.k,w)*4||hit(e.c,w)*3||hit(e.d,w); if(!v){best=0;break;} best+=v; } if(!best) return null; s+=best; }
      var ph=' '+norm(raw); if(e.t.indexOf(ph)===0) s+=8; else if(e.t.indexOf(ph)>=0) s+=4; if(e.k.indexOf(ph)>=0) s+=3;
      return {e:e,s:s-e.i*0.01};
    }).filter(Boolean).sort(function(a,b){return b.s-a.s;}).map(function(r){return r.e.x;});
  }
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function mark(t,raw){ var out=esc(t); norm(raw).split(' ').filter(function(w){return w.length>1;}).forEach(function(w){ out=out.replace(new RegExp('\\\\b('+w.replace(/[^a-z0-9]/g,'')+')','gi'),'<mark>$1</mark>'); }); return out; }
  function render(raw){
    var head=raw.trim()?'':'<li class="nq-head" role="presentation">Latest stories</li>';
    items=raw.trim()?search(raw).slice(0,8):idx.slice(0,5).map(function(e){return e.x;});
    active=-1; q.setAttribute('aria-activedescendant','');
    if(raw.trim()&&!items.length){ list.innerHTML='<li class="nq-none" role="presentation">No stories match “'+esc(raw.trim())+'”. Try one word, such as “holiday” or “moon”.</li>'; }
    else list.innerHTML=head+items.map(function(x,i){return '<li role="option" id="nq-o'+i+'" aria-selected="false"><a href="'+x.u+'" tabindex="-1"><b>'+mark(x.t,raw)+'</b><span>'+esc(x.c)+' · '+esc(x.p)+(x.n?' · '+x.n+' free printable'+(x.n>1?'s':''):'')+'</span></a></li>';}).join('');
    status.textContent=raw.trim()?(items.length?items.length+' result'+(items.length>1?'s':'')+'. Use the arrow keys to choose.':'No results.'):'';
    open(true);
  }
  function open(on){ list.hidden=!on; q.setAttribute('aria-expanded',on?'true':'false'); form.classList.toggle('is-open',on); }
  function move(d){ var opts=list.querySelectorAll('[role=option]'); if(!opts.length) return; if(active>=0) opts[active].setAttribute('aria-selected','false'); active=(active+d+opts.length)%opts.length; opts[active].setAttribute('aria-selected','true'); q.setAttribute('aria-activedescendant',opts[active].id); opts[active].scrollIntoView({block:'nearest'}); }
  function go(i){ var x=items[i]; if(!x) return; try{ if(typeof gtag==='function') gtag('event','search',{search_term:q.value.trim()}); }catch(e){} location.href=x.u; }
  function show(){ load().then(function(){ if(document.activeElement===q) render(q.value); }); }
  q.addEventListener('focus',show); form.addEventListener('pointerenter',load,{once:true});
  q.addEventListener('input',function(){ if(idx) render(q.value); else show(); });
  q.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault(); if(list.hidden) show(); else move(1);} else if(e.key==='ArrowUp'){e.preventDefault(); move(-1);}
    else if(e.key==='Enter'){e.preventDefault(); go(active>=0?active:0);} else if(e.key==='Escape'){ if(q.value){q.value=''; render('');} else {open(false); q.blur();} }
  });
  list.addEventListener('mousedown',function(e){ var li=e.target.closest('[role=option]'); if(li){ e.preventDefault(); go(+li.id.slice(4)); } });
  document.addEventListener('pointerdown',function(e){ if(!form.contains(e.target)) open(false); });
  document.addEventListener('keydown',function(e){ if(e.key==='/'&&!/^(input|textarea|select)$/i.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){ e.preventDefault(); q.focus(); } });
})();
`;
