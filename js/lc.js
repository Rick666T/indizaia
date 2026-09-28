const BASE='https://id.loc.gov/authorities';
const NS='http://www.loc.gov/mads/rdf/v1#';
function https(u){return String(u||'').replace(/^http:/,'https:')}
async function fetchJson(url){const r=await fetch(https(url),{headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`Library of Congress respondió ${r.status}`);return r.json()}
async function fetchText(url){const r=await fetch(https(url),{headers:{Accept:'application/xml,text/xml;q=.9,*/*;q=.5'}});if(!r.ok)throw new Error(`Library of Congress respondió ${r.status}`);return r.text()}
export async function suggestLC(query,kind='subjects'){
  const q=query.trim();if(!q)return[];const data=await fetchJson(`${BASE}/${kind}/suggest/?q=${encodeURIComponent(q)}`);const labels=data?.[1]||[],uris=data?.[3]||[];return labels.map((label,i)=>({label,uri:https(uris[i]),kind})).filter(x=>x.uri);
}
function vals(node,key){const v=node?.[key];if(!v)return[];return (Array.isArray(v)?v:[v]).map(x=>typeof x==='string'?x:(x?.['@value']??x?.['@id']??'')).filter(Boolean)}
function typeNames(node){return vals(node,'@type').map(x=>x.split('#').pop())}
function labelOfNode(node){return vals(node,`${NS}authoritativeLabel`)[0]||vals(node,'http://www.w3.org/2004/02/skos/core#prefLabel')[0]||vals(node,'http://www.w3.org/2000/01/rdf-schema#label')[0]||''}
function relatedLabels(graph,refs){const map=new Map(graph.map(n=>[https(n['@id']),n]));return refs.map(r=>{const n=map.get(https(r));return n?labelOfNode(n):r}).filter(Boolean)}
function parseMads(raw,u){
  const nodes=Array.isArray(raw)?raw:(raw?.['@graph']||[]);const main=nodes.find(n=>https(n?.['@id'])===u)||nodes.find(n=>labelOfNode(n))||{};const types=typeNames(main);
  const notes=[...vals(main,`${NS}scopeNote`),...vals(main,`${NS}note`),...vals(main,'http://www.w3.org/2004/02/skos/core#scopeNote')];
  const variants=vals(main,`${NS}variantLabel`);if(!variants.length){for(const n of nodes){if(typeNames(n).some(t=>/Variant/.test(t)))variants.push(labelOfNode(n))}}
  const broaderRefs=[...vals(main,`${NS}hasBroaderAuthority`),...vals(main,'http://www.w3.org/2004/02/skos/core#broader')];const relatedRefs=[...vals(main,`${NS}hasRelatedAuthority`),...vals(main,'http://www.w3.org/2004/02/skos/core#related')];const collections=vals(main,`${NS}isMemberOfMADSCollection`);
  return {label:labelOfNode(main)||u.split('/').pop(),types,scope:[...new Set(notes)],variants:[...new Set(variants)].slice(0,12),broader:relatedLabels(nodes,broaderRefs).slice(0,8),related:relatedLabels(nodes,relatedRefs).slice(0,8),collections,maySubdivideGeographically:collections.some(x=>/SubdivideGeographically|MaySubdivideGeographically/i.test(x))};
}
function els(parent,name){return [...parent.getElementsByTagNameNS('*',name)]}
function subfields(field){return els(field,'subfield').map(s=>({code:s.getAttribute('code')||'',value:(s.textContent||'').trim()})).filter(x=>x.value)}
function formatAuthorityField(field){if(!field)return'';return subfields(field).map(x=>`$${x.code} ${x.value}`).join(' ')}
function parseMarcXml(xml){
  const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('MARCXML no pudo interpretarse.');const fields=els(doc,'datafield');const main=fields.find(f=>['100','110','111','130','148','150','151','155'].includes(f.getAttribute('tag')))||null;
  const publicNotes=fields.filter(f=>f.getAttribute('tag')==='680').map(f=>subfields(f).map(x=>x.value).join(' ')).filter(Boolean);
  const generalNotes=fields.filter(f=>f.getAttribute('tag')==='667').map(f=>subfields(f).map(x=>x.value).join(' ')).filter(Boolean);
  const citations=fields.filter(f=>f.getAttribute('tag')==='670').slice(0,6).map(f=>subfields(f).map(x=>x.value).join(' ')).filter(Boolean);
  return main?{authorityTag:main.getAttribute('tag'),ind1:main.getAttribute('ind1')||' ',ind2:main.getAttribute('ind2')||' ',subfields:subfields(main),authorityDisplay:formatAuthorityField(main),publicNotes,generalNotes,citations}:null;
}
export async function getAuthority(uri){
  const u=https(uri).replace(/\/$/,'');const [mj,mx]=await Promise.allSettled([fetchJson(`${u}.json`),fetchText(`${u}.marcxml.xml`)]);let mads={label:u.split('/').pop(),types:[],scope:[],variants:[],broader:[],related:[],collections:[],maySubdivideGeographically:false};let marc=null;
  if(mj.status==='fulfilled')mads=parseMads(mj.value,u);if(mx.status==='fulfilled'){try{marc=parseMarcXml(mx.value)}catch{marc=null}}
  if(mj.status==='rejected'&&mx.status==='rejected')throw new Error('No fue posible recuperar la autoridad.');
  const notes=[...mads.scope,...(marc?.publicNotes||[])];return {uri:u,...mads,scope:[...new Set(notes)],marcAuthority:marc,citations:marc?.citations||[],generalNotes:marc?.generalNotes||[]};
}
const AUTH_TO_BIB={100:'600',110:'610',111:'611',130:'630',148:'648',150:'650',151:'651',155:'655'};
const AUTH_LABEL={100:'Nombre personal como materia',110:'Entidad corporativa como materia',111:'Reunión como materia',130:'Título uniforme como materia',148:'Término cronológico',150:'Término temático',151:'Nombre geográfico como materia',155:'Género/forma'};
export function classifyAuthority(a){
  const tag=a?.marcAuthority?.authorityTag;if(tag&&AUTH_TO_BIB[tag])return{field:AUTH_TO_BIB[tag],label:AUTH_LABEL[tag],authorityTag:tag,ind1:a.marcAuthority.ind1};
  const t=(a.types||[]).join(' ');if(/PersonalName/i.test(t))return{field:'600',label:'Nombre personal como materia',ind1:'1'};if(/FamilyName/i.test(t))return{field:'600',label:'Familia como materia',ind1:'3'};if(/CorporateName/i.test(t))return{field:'610',label:'Entidad corporativa como materia',ind1:'2'};if(/ConferenceName/i.test(t))return{field:'611',label:'Reunión como materia',ind1:'2'};if(/Title|NameTitle/i.test(t))return{field:'630',label:'Título uniforme como materia',ind1:'0'};if(/Geographic/i.test(t))return{field:'651',label:'Nombre geográfico como materia',ind1:' '};if(/Temporal/i.test(t))return{field:'648',label:'Término cronológico',ind1:' '};if(/GenreForm/i.test(t))return{field:'655',label:'Género/forma',ind1:' '};return{field:'650',label:'Término temático',ind1:' '};
}
function visibleInd(v){return !v||v===' '?'#':v}
function bibFromMarcAuthority(a){
  const m=a.marcAuthority;if(!m?.authorityTag||!AUTH_TO_BIB[m.authorityTag])return null;const tag=AUTH_TO_BIB[m.authorityTag];const ind1=['100','110','111','130'].includes(m.authorityTag)?visibleInd(m.ind1):'#';const ind2=tag==='655'?'7':'0';let code=`${tag} ${ind1}${ind2}`;for(const s of m.subfields)code+=` $${s.code} ${s.value}`;code+=` $0 ${a.uri}`;if(tag==='655')code+=' $2 lcgft';return{field:tag,typeLabel:AUTH_LABEL[m.authorityTag],code,review:false,note:'La estructura de subcampos se tomó del campo autorizado 1XX del MARCXML oficial de ID.LOC.GOV y se transformó al campo bibliográfico 6XX correspondiente.'};
}
function fallbackMarc(a){const cls=classifyAuthority(a);const second=cls.field==='655'?'7':'0';const first=visibleInd(cls.ind1);let code=`${cls.field} ${first}${second} $a ${a.label}`;if(a.uri)code+=` $0 ${a.uri}`;if(cls.field==='655')code+=' $2 lcgft';return{field:cls.field,typeLabel:cls.label,code,review:true,note:'No se recuperó MARCXML de la autoridad. La forma autorizada está vinculada, pero la codificación de subcampos/indicadores debe revisarse manualmente antes de incorporarla al catálogo.'};
}
export function marcForAuthority(a){return bibFromMarcAuthority(a)||fallbackMarc(a)}
