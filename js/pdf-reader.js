let pdfjsLib=null;
async function getPdfJs(){
  if(pdfjsLib)return pdfjsLib;
  pdfjsLib=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  return pdfjsLib;
}
export async function readPdf(file,{ocr=false,onProgress=()=>{}}={}){
  const lib=await getPdfJs(); const bytes=new Uint8Array(await file.arrayBuffer());
  const pdf=await lib.getDocument({data:bytes}).promise; let full=''; let textPages=0; const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    onProgress({stage:'text',page:i,total:pdf.numPages}); const page=await pdf.getPage(i); const c=await page.getTextContent(); const t=c.items.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim();
    if(t.length>40)textPages++; pages.push(t); full+=`\n\n[PAGE ${i}]\n${t}`;
  }
  const coverage=textPages/Math.max(pdf.numPages,1); let ocrPages=0;
  if(ocr&&coverage<.35){
    const T=await loadTesseract();
    // OCR estratégico para no congelar el navegador en libros extensos.
    const picks=[...new Set([...Array(Math.min(18,pdf.numPages)).keys()].map(x=>x+1),...Array.from({length:Math.min(8,pdf.numPages)},(_,k)=>pdf.numPages-k))].sort((a,b)=>a-b);
    for(const i of picks){if((pages[i-1]||'').length>80)continue;onProgress({stage:'ocr',page:i,total:picks.length});const page=await pdf.getPage(i);const vp=page.getViewport({scale:1.7});const canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});await page.render({canvasContext:ctx,viewport:vp}).promise;const result=await T.recognize(canvas,'spa+eng',{logger:()=>{}});pages[i-1]=result?.data?.text||'';ocrPages++;}
    full=pages.map((t,i)=>`\n\n[PAGE ${i+1}]\n${t}`).join('');
  }
  const chars=pages.reduce((n,t)=>n+t.length,0); const avg=chars/Math.max(pdf.numPages,1); const quality=coverage>.75?'alta':coverage>.35?'media':(ocrPages?'ocr-apoyo':'baja');
  return {text:full,pages,pageCount:pdf.numPages,textCoverage:Math.round(coverage*100),ocrPages,quality,avgChars:Math.round(avg)};
}
async function loadTesseract(){
  if(window.Tesseract)return window.Tesseract;
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('No fue posible cargar el motor OCR.'));document.head.appendChild(s)});return window.Tesseract;
}
