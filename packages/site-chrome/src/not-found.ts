/**
 * "Did you mean" on the 404 pages. The words of the missing address are matched against the two
 * search indexes the header search already uses (/search/calendars.json, /news/search/index.json),
 * with room for one or two typos, so /thanksgving-2026 still points to Thanksgiving 2026. Runs only
 * on the 404 page; a dead end otherwise gives the reader nowhere to go but the home page.
 */
export const NOT_FOUND_JS = `
(function(){
  var box=document.querySelector('[data-nf-suggest]');
  if(!box||!window.fetch) return;
  var stop={html:1,htm:1,php:1,www:1,the:1,and:1,for:1,news:1,page:1,amp:1,index:1};
  var words=decodeURIComponent(location.pathname).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(function(w){return (w.length>1||/^[0-9]$/.test(w))&&!stop[w];});
  if(!words.length) return;
  function dist(a,b){
    if(Math.abs(a.length-b.length)>2) return 9;
    var prev=[],cur,i,j;
    for(j=0;j<=b.length;j++) prev[j]=j;
    for(i=1;i<=a.length;i++){
      cur=[i];
      for(j=1;j<=b.length;j++) cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
      prev=cur;
    }
    return prev[b.length];
  }
  function score(entry){
    var hay=(entry.t+' '+(entry.k||'')+' '+entry.u).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ');
    var s=0,hit=0;
    words.forEach(function(w){
      var best=0;
      for(var i=0;i<hay.length;i++){
        var h=hay[i]; if(!h) continue;
        if(h===w){best=3;break;}
        if(w.length>=4&&h.indexOf(w)===0) best=Math.max(best,2);
        else if(w.length>=5&&dist(w,h)<=(w.length>=8?2:1)) best=Math.max(best,2);
      }
      if(best){s+=best;hit++;}
    });
    // Every matched word counts; a page that matches most of the address wins over one long word.
    return hit?s+hit*2-(words.length-hit):0;
  }
  var news=location.pathname.indexOf('/news/')===0;
  function get(u){return fetch(u).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];});}
  Promise.all([get('/search/calendars.json'),get('/news/search/index.json')]).then(function(res){
    var all=(news?res[1].concat(res[0]):res[0].concat(res[1])).filter(function(x){return x&&typeof x.u==='string'&&x.t;});
    var ranked=all.map(function(x,i){return {x:x,s:score(x)-i/1e5};}).filter(function(r){return r.s>=3;}).sort(function(a,b){return b.s-a.s;});
    var seen={},picks=[];
    ranked.forEach(function(r){if(picks.length<3&&!seen[r.x.u]){seen[r.x.u]=1;picks.push(r.x);}});
    if(!picks.length) return;
    var h=document.createElement('h2'); h.textContent='Did you mean'; box.appendChild(h);
    var ul=document.createElement('ul');
    picks.forEach(function(p){
      var li=document.createElement('li'),a=document.createElement('a');
      a.href=p.u; a.textContent=p.t; li.appendChild(a);
      if(p.c){var s=document.createElement('span'); s.textContent=p.c; li.appendChild(s);}
      ul.appendChild(li);
    });
    box.appendChild(ul); box.hidden=false;
  });
})();
`;
