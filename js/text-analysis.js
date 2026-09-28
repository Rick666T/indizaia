const STOP_ES=new Set(`a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era eran es esa esas ese eso esos esta estaba estaban este esto estos fue fueron ha han hasta hay la las le les lo los mas más me mi mis muy ni no nos o otra para pero poco por porque que qué se sea ser si sin sobre su sus te tiene todo tras tu un una unas uno unos y ya mediante según así`.split(/\s+/));
const STOP_EN=new Set(`a an and are as at be been being but by can could did do does for from had has have he her hers him his how i if in into is it its may might more most must no not of on one or our ours she should so than that the their theirs them then there these they this those through to too under up us was we were what when where which who why will with would you your yours`.split(/\s+/));
const GENERIC=new Set(`document documento documents documentos study estudio studies research investigación investigacion analysis análisis analisis results resultado resultados information información informacion data datos chapter chapters capítulo capitulos capítulos book libro article artículo articulo paper work obra works method methods metodología metodologia introduction introducción introduccion conclusion conclusions conclusiones author authors autor autores`.split(/\s+/));
export function normalizeText(s){return String(s||'').normalize('NFKC').replace(/\u00ad/g,'').replace(/\s+/g,' ').trim()}
export function detectLanguage(text){
  const words=normalizeText(text).toLowerCase().match(/[\p{L}]{2,}/gu)||[]; let es=0,en=0;
  for(const w of words.slice(0,5000)){if(STOP_ES.has(w))es++;if(STOP_EN.has(w))en++;}
  if(es>en*1.25)return'es';if(en>es*1.25)return'en';return'und';
}
function tokens(text){return (normalizeText(text).toLowerCase().match(/[\p{L}][\p{L}\p{M}\-]{2,}/gu)||[]).filter(w=>!STOP_ES.has(w)&&!STOP_EN.has(w)&&!GENERIC.has(w)&&w.length>2)}
function stemLite(w){return w.replace(/(mente|ciones|ción|siones|sión|amientos|amiento|idades|idad|ingly|edly|ments|ment|ations|ation|ities|ity|ing|ed|es|s)$/i,'')}
export function extractKeywords(text,{limit=18,title='',abstract=''}={}){
  const body=normalizeText(text); const lang=detectLanguage(body+' '+title+' '+abstract);
  const all=tokens(body); const N=Math.max(all.length,1); const counts=new Map(); const positions=new Map();
  all.forEach((w,i)=>{const k=stemLite(w);counts.set(k,(counts.get(k)||0)+1);if(!positions.has(k))positions.set(k,[]);positions.get(k).push(i/N)});
  const originals=new Map(); for(const w of all){const k=stemLite(w);if(!originals.has(k)||w.length>originals.get(k).length) originals.set(k,w)}
  const titleTok=new Set(tokens(title).map(stemLite)); const absTok=new Set(tokens(abstract).map(stemLite));
  const unigram=[];
  for(const [k,c] of counts){
    if(c<2&&N>250)continue; const pos=positions.get(k); const spread=new Set(pos.map(x=>Math.floor(x*5))).size/5; const zone=pos.some(x=>x<.12)?1.18:1; const titleBoost=titleTok.has(k)?1.9:1; const absBoost=absTok.has(k)?1.4:1; const freq=Math.log1p(c); const specificity=Math.min(1.25,.75+(originals.get(k)?.length||4)/28); const score=freq*(.65+.7*spread)*zone*titleBoost*absBoost*specificity;
    unigram.push({term:originals.get(k),score,count:c,spread:Math.round(spread*100),source:'unigram'});
  }
  const phraseCounts=new Map(); const raw=tokens(body);
  for(let n=2;n<=3;n++)for(let i=0;i<=raw.length-n;i++){const p=raw.slice(i,i+n);if(p.some(w=>w.length<3))continue;const key=p.join(' ');phraseCounts.set(key,(phraseCounts.get(key)||0)+1)}
  const phrases=[]; for(const [p,c] of phraseCounts){if(c<2)continue;const uniq=new Set(p.split(' '));if(uniq.size<2)continue;const score=Math.log1p(c)*(1.55+.18*p.split(' ').length)*(tokens(title).join(' ').includes(p)?1.8:1);phrases.push({term:p,score,count:c,spread:0,source:'phrase'})}
  const merged=[...phrases,...unigram].sort((a,b)=>b.score-a.score); const out=[];
  for(const item of merged){const norm=item.term.toLowerCase();if(out.some(x=>x.term.toLowerCase().includes(norm)||norm.includes(x.term.toLowerCase())))continue;out.push(item);if(out.length>=limit)break}
  const max=Math.max(...out.map(x=>x.score),1);out.forEach(x=>{x.relevance=Math.round(100*x.score/max);x.reason=reasonFor(x)});return {language:lang,terms:out,wordCount:N};
}
function reasonFor(x){const bits=[];if(x.count>=5)bits.push(`aparece ${x.count} veces`);else bits.push(`aparece ${x.count} ${x.count===1?'vez':'veces'}`);if(x.spread>=60)bits.push('está distribuido en varias zonas');if(x.source==='phrase')bits.push('forma una expresión compuesta');if(x.relevance>=80)bits.push('tiene alta relevancia relativa');return bits.join('; ')+'.'}
export function detectEntities(text){
  const sample=String(text||'').slice(0,180000); const counts=new Map();
  const rx=/\b([A-ZÁÉÍÓÚÑ][\p{L}\p{M}'’.-]+(?:\s+(?:de|del|la|las|los|y|of|the|and)?\s*[A-ZÁÉÍÓÚÑ][\p{L}\p{M}'’.-]+){1,4})\b/gu;
  for(const m of sample.matchAll(rx)){const v=m[1].replace(/\s+/g,' ').trim();if(v.length<6||/^(Library of Congress|Table of Contents)$/i.test(v))continue;counts.set(v,(counts.get(v)||0)+1)}
  return [...counts].filter(([,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([term,count])=>({term,count}));
}
