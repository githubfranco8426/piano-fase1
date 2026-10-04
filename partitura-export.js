document.getElementById('viewerDownload').addEventListener('click',async()=>{
  const doc=pdfDocument;if(!doc)return;
  const status=document.getElementById('viewerActionStatus');
  try{
    const bytes=await doc.getData();const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const link=document.createElement('a');link.href=url;
    link.download=document.getElementById('viewerTitle').textContent.replace(/[^\p{L}\p{N} -]/gu,'').trim()+'.pdf';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    status.textContent='PDF preparado para descargar. Revisa las descargas de tu navegador.';
  }catch(e){status.textContent='No se pudo descargar. Usa «Abrir PDF en otra pestaña» y descárgalo allí.';}
});
const printDialog=document.createElement('dialog');printDialog.id='printDialog';printDialog.setAttribute('aria-label','Vista de impresión');document.body.append(printDialog);
let printVersion=0;
function closePrint(){printVersion++;printDialog.close();printDialog.replaceChildren();}
printDialog.addEventListener('cancel',event=>{event.preventDefault();closePrint();});
document.getElementById('viewerPrint').addEventListener('click',async()=>{
  const doc=pdfDocument;if(!doc)return;
  const button=document.getElementById('viewerPrint'),status=document.getElementById('viewerActionStatus');
  const pageNumbers=document.getElementById('printRange').value==='current'?[pageIndex]:Array.from({length:doc.numPages},(_,i)=>i+1);
  const version=++printVersion;
  button.disabled=true;
  const output=document;
  const header=output.createElement('header');const title=output.createElement('h1');title.textContent=document.getElementById('viewerTitle').textContent;
  const printButton=output.createElement('button');printButton.textContent='Imprimir / Guardar como PDF';printButton.disabled=true;printButton.addEventListener('click',()=>window.print());
  const closeButton=output.createElement('button');closeButton.textContent='Volver a la partitura';closeButton.className='secondary';closeButton.addEventListener('click',closePrint);
  const message=output.createElement('p');message.id='printStatus';message.setAttribute('role','status');header.append(title,printButton,closeButton,message);printDialog.replaceChildren(header);printDialog.showModal();
  try{
    for(let i=0;i<pageNumbers.length;i++){
      if(version!==printVersion)break;
      message.textContent='Preparando página '+(i+1)+' de '+pageNumbers.length+'…';
      const page=await doc.getPage(pageNumbers[i]);const viewport=page.getViewport({scale:1.8});
      const canvas=output.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
      const sheet=output.createElement('section');sheet.className='print-page';const img=output.createElement('img');img.alt='Partitura · página '+pageNumbers[i];img.src=canvas.toDataURL('image/png');await img.decode();if(version!==printVersion)break;sheet.append(img);printDialog.append(sheet);canvas.width=canvas.height=0;
    }
    if(version===printVersion){printButton.disabled=false;message.textContent=pageNumbers.length+' página(s) listas. Elige impresora o «Guardar como PDF» en el diálogo. Papel A4; desactiva encabezados y pies de página.';status.textContent='Partitura preparada para imprimir.';}
  }catch(e){if(version===printVersion)message.textContent='No se completó la preparación. Vuelve a la partitura e inténtalo de nuevo.';status.textContent='No se pudo preparar la impresión completa.';}
  finally{button.disabled=!pdfDocument;}
});
