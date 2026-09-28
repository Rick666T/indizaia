const END='https://vocabularies.unesco.org/sparql';
async function sparql(query){const url=`${END}?query=${encodeURIComponent(query)}&format=application%2Fsparql-results%2Bjson`;const r=await fetch(url,{headers:{Accept:'application/sparql-results+json'}});if(!r.ok)throw new Error(`UNESCO respondió ${r.status}`);return r.json()}
export async function searchUnesco(term,lang='es',limit=6){
  const safe=term.replace(/["\\]/g,' ').trim();if(!safe)return[];
  const q=`PREFIX skos:<http://www.w3.org/2004/02/skos/core#> SELECT DISTINCT ?c ?label ?en WHERE { ?c a skos:Concept ; skos:prefLabel ?label . FILTER(lang(?label)="${lang}") FILTER(CONTAINS(LCASE(STR(?label)),LCASE("${safe}"))) OPTIONAL{?c skos:prefLabel ?en . FILTER(lang(?en)="en")} } LIMIT ${limit}`;
  const j=await sparql(q);return (j?.results?.bindings||[]).map(b=>({uri:b.c?.value,label:b.label?.value,en:b.en?.value||''}));
}
export async function getUnesco(uri){
  const q=`PREFIX skos:<http://www.w3.org/2004/02/skos/core#> SELECT ?p ?o ?ol WHERE { <${uri}> ?p ?o . OPTIONAL { ?o skos:prefLabel ?ol . FILTER(lang(?ol)="es") } }`;
  const j=await sparql(q);const out={uri,pref:[],alt:[],scope:[],broader:[],narrower:[],related:[]};for(const b of j?.results?.bindings||[]){const p=b.p?.value||'',v=b.o?.value||'',ol=b.ol?.value||'';if(p.endsWith('prefLabel'))out.pref.push(v);else if(p.endsWith('altLabel'))out.alt.push(v);else if(p.endsWith('scopeNote'))out.scope.push(v);else if(p.endsWith('broader'))out.broader.push(ol||v);else if(p.endsWith('narrower'))out.narrower.push(ol||v);else if(p.endsWith('related'))out.related.push(ol||v)}return out;
}
