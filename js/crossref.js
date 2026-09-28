const BASE='https://api.crossref.org/works';
function clean(v){return String(v||'').replace(/[<>]/g,'').trim()}
function yearOf(m){
  const p=m?.published?.['date-parts']?.[0]||m?.issued?.['date-parts']?.[0]||m?.created?.['date-parts']?.[0];
  return p?.[0]||'';
}
function authorsOf(m){return (m?.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' ')).join('; ')}
export function normalizeCrossref(m){
  return {source:'Crossref',doi:clean(m?.DOI),isbn:(m?.ISBN||[]).join('; '),title:clean(m?.title?.[0]),subtitle:clean(m?.subtitle?.[0]),authors:authorsOf(m),publisher:clean(m?.publisher),year:yearOf(m),type:clean(m?.type),abstract:clean((m?.abstract||'').replace(/<[^>]+>/g,' ')),subjects:(m?.subject||[]).map(clean).filter(Boolean),language:clean(m?.language),url:clean(m?.URL)};
}
async function getJson(url){
  const r=await fetch(url,{headers:{Accept:'application/json'}});
  if(!r.ok) throw new Error(`Crossref respondió ${r.status}`);
  return r.json();
}
export async function lookupDOI(raw){
  const doi=raw.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i,'');
  if(!doi) throw new Error('Introduce un DOI.');
  const j=await getJson(`${BASE}/${encodeURIComponent(doi)}`);
  if(!j?.message) throw new Error('No se encontró el DOI en Crossref.');
  return normalizeCrossref(j.message);
}
export async function lookupISBN(raw){
  const isbn=raw.replace(/[^0-9Xx]/g,'');
  if(isbn.length!==10&&isbn.length!==13) throw new Error('El ISBN debe tener 10 o 13 caracteres.');
  const j=await getJson(`${BASE}?filter=isbn:${encodeURIComponent(isbn)}&rows=5`);
  const items=j?.message?.items||[];
  if(!items.length) throw new Error('Crossref no devolvió registros para ese ISBN.');
  const exact=items.find(x=>(x.ISBN||[]).some(v=>v.replace(/[^0-9Xx]/g,'')===isbn))||items[0];
  return normalizeCrossref(exact);
}
