import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Building2,ChevronLeft,ChevronRight,FileDown,LogOut,Search,ShieldCheck,Store} from 'lucide-react';

const TOKEN_KEY='ee_dealer_token_v1';
const money=value=>`₹${Math.round(Number(value||0)).toLocaleString('en-IN')}`;
const pdfMoney=value=>`Rs. ${Math.round(Number(value||0)).toLocaleString('en-IN')}`;
const PERFUME_SIZES=[
  {value:8,unit:'ml',priceMultiplier:.2985971943887776},{value:20,unit:'ml',priceMultiplier:.6993987},{value:30,unit:'ml',priceMultiplier:1},{value:50,unit:'ml',priceMultiplier:1.4008},{value:100,unit:'ml',priceMultiplier:2.4028},
  {value:30,unit:'ml Gift',priceMultiplier:1.2},{value:50,unit:'ml Gift',priceMultiplier:1.601},{value:100,unit:'ml Gift',priceMultiplier:2.6032}
];
const ATTAR_SIZES=[{value:3,unit:'ml',priceMultiplier:1},{value:6,unit:'ml',priceMultiplier:1.85},{value:8,unit:'ml',priceMultiplier:2.3},{value:12,unit:'ml',priceMultiplier:3.2}];
const productType=product=>String(product?.type||product?.category||'Perfume').toLowerCase().includes('attar')?'Attar':'Perfume';
const sizeKey=size=>`${Number(size?.value||0)}ml${String(size?.unit||'').toLowerCase().includes('gift')?'gift':''}`;
const factorKey=size=>String(size?.unit||'').toLowerCase().includes('gift')?`gift${Number(size.value)}`:`ml${Number(size.value)}`;
const sizeLabel=size=>`${size.value} ${size.unit}`;
function getSizes(product){
  const canonical=productType(product)==='Attar'?ATTAR_SIZES:PERFUME_SIZES;
  const supplied=Array.isArray(product?.sizes)?product.sizes:[];
  const suppliedByKey=new Map(supplied.map(size=>[sizeKey(size),size]));
  const liveByKey=new Map((product?.inventoryPricing||[]).map(row=>[String(row.variantKey||''),row]));
  const merged=canonical.map(size=>{
    const key=sizeKey(size);
    const suppliedSize=suppliedByKey.get(key)||{};
    const live=liveByKey.get(key);
    return {...size,...suppliedSize,...(live?{basePrice:Number(live.basePrice||0),priceMultiplier:Number(live.priceMultiplier||0)}:{})};
  });
  const canonicalKeys=new Set(canonical.map(sizeKey));
  return[...merged,...supplied.filter(size=>!canonicalKeys.has(sizeKey(size)))];
}
function websitePrice(product,size){
  const base=Number(size?.basePrice)>0?Number(size.basePrice):Number(product?.price||0);
  const multiplier=Number(size?.priceMultiplier)>0?Number(size.priceMultiplier):1;
  return Math.round(base*multiplier);
}

function imageUrl(name){
  if(!name)return'/products/placeholder.webp';
  if(String(name).startsWith('http'))return name;
  return`/products/${String(name).split('/').pop().replace(/\.(png|jpe?g)$/i,'.webp')}`;
}
function perfumeVariantIndex(size){
  const map={'8ml':1,'20ml':2,'30ml':3,'50ml':4,'100ml':5,'30mlgift':6,'50mlgift':7,'100mlgift':8};
  return map[sizeKey(size)]??0;
}
function variantSources(product,size,sizeIndex){
  const images=Array.isArray(product?.images)&&product.images.length?product.images:[product?.image].filter(Boolean);
  const first=images[0]||product?.image;
  if(productType(product)==='Attar')return[...new Set([images[sizeIndex],images[0],first].filter(Boolean).map(imageUrl))];
  const index=perfumeVariantIndex(size),exact=images[index];
  if(!first)return[imageUrl(`common${index}.webp`),'/products/placeholder.webp'];
  const raw=String(first),dot=raw.lastIndexOf('.'),base=(dot<0?raw:raw.slice(0,dot)).replace(/\(\d+\)$/,''),ext=dot<0?'.webp':raw.slice(dot);
  const candidates=[exact,index===6?first:null,`${base}${Number(size.value)}${ext}`,index?`${base}(${index})${ext}`:null,index?`common${index}.webp`:null,first];
  return[...new Set(candidates.filter(Boolean).map(imageUrl))];
}
function VariantImage({sources,alt}){
  const[index,setIndex]=useState(0);
  useEffect(()=>setIndex(0),[sources.join('|')]);
  return <img loading="lazy" src={sources[index]||'/products/placeholder.webp'} alt={alt} onError={()=>setIndex(current=>Math.min(current+1,sources.length-1))}/>;
}

function VariantCarousel({product,prices,activeIndex,setActiveIndex,cardIndex}){
  const rootRef=useRef(null),[paused,setPaused]=useState(false),[visible,setVisible]=useState(true);
  useEffect(()=>{
    if(!rootRef.current||!('IntersectionObserver' in window))return;
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:'120px'});
    observer.observe(rootRef.current);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(paused||!visible||prices.length<2)return;
    const delay=3300+(cardIndex%5)*240;
    const timer=setInterval(()=>setActiveIndex(current=>(current+1)%prices.length),delay);
    return()=>clearInterval(timer);
  },[paused,visible,prices.length,cardIndex,setActiveIndex]);
  useEffect(()=>{if(activeIndex>=prices.length)setActiveIndex(0);},[activeIndex,prices.length,setActiveIndex]);
  const current=prices[activeIndex]||prices[0];
  const move=direction=>setActiveIndex(index=>(index+direction+prices.length)%prices.length);
  if(!current)return null;
  return <div ref={rootRef} className="dealer-card-carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
    <VariantImage sources={variantSources(product,current,activeIndex)} alt={`${product.name} ${sizeLabel(current)}`}/>
    <span className="dealer-type-overlay">{productType(product)}</span><span className="dealer-size-overlay">{sizeLabel(current)}</span>
    {prices.length>1&&<><button type="button" className="dealer-carousel-arrow previous" aria-label={`Previous size of ${product.name}`} onClick={()=>move(-1)}><ChevronLeft/></button><button type="button" className="dealer-carousel-arrow next" aria-label={`Next size of ${product.name}`} onClick={()=>move(1)}><ChevronRight/></button></>}
    <div className="dealer-carousel-position" aria-live="polite"><b>{activeIndex+1}</b><span>/</span>{prices.length}</div>
    <div className="dealer-carousel-dots" aria-hidden="true">{prices.map((row,index)=><i className={index===activeIndex?'active':''} key={`dot-${sizeKey(row)}-${index}`}/>)}</div>
  </div>;
}

function loadCatalogueImage(sources){
  return new Promise(resolve=>{
    const candidates=[...sources];
    const attempt=()=>{
      const src=candidates.shift();
      if(!src){resolve(null);return;}
      const image=new Image();
      image.crossOrigin='anonymous';
      image.onload=()=>{
        try{
          const width=560,height=340,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
          canvas.width=width;canvas.height=height;
          // Catalogue tiles are intentionally full bleed. Cover cropping keeps
          // the original aspect ratio while removing the webpage-like gutters.
          const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);
          const drawWidth=image.naturalWidth*scale,drawHeight=image.naturalHeight*scale;
          ctx.drawImage(image,(width-drawWidth)/2,(height-drawHeight)/2,drawWidth,drawHeight);
          resolve(canvas.toDataURL('image/jpeg',.88));
        }catch{attempt();}
      };
      image.onerror=attempt;image.src=src;
    };
    attempt();
  });
}

function catalogueText(value){return Array.isArray(value)?value.filter(Boolean).join(', '):String(value||'').trim();}
function limitedLines(doc,value,width,count){return doc.splitTextToSize(catalogueText(value),width).slice(0,count);}

export async function exportDealerCatalogue(products,dealer,setStatus=()=>{},options={}){
  if(!products.length)throw new Error('No products match the current filters.');
  const{jsPDF:JsPDF}=await import('jspdf');
  const includePrices=options.includePrices!==false;
  const doc=new JsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
  const imageCache=new Map();

  // Clean, readable trade-catalogue layout:
  // 2 products per row x 2 rows = 4 products/page.
  // Each product uses ONE main image, then only family + accords, followed by
  // a simple size/website/dealer price grid.
  const pageWidth=297,pageHeight=210;
  const marginX=8,top=15,bottom=202,gapX=5,gapY=5;
  const columns=2,rowsPerPage=2,perPage=columns*rowsPerPage;
  const cardWidth=(pageWidth-marginX*2-gapX*(columns-1))/columns;
  const cardHeight=(bottom-top-gapY*(rowsPerPage-1))/rowsPerPage;
  const pageCount=Math.ceil(products.length/perPage);

  // The catalogue card should show the same primary/default perfume variant
  // used by the dealer portal: 30 ml Gift for perfumes, first size for attars.
  function mainImageSize(product){
    const sizes=getSizes(product);
    if(productType(product)==='Perfume'){
      return sizes.find(size=>sizeKey(size)==='30mlgift')||sizes[0];
    }
    return sizes[0];
  }

  for(let pageIndex=0;pageIndex<pageCount;pageIndex+=1){
    if(pageIndex)doc.addPage('a4','landscape');

    // Page header
    doc.setFillColor(8,10,8);
    doc.rect(0,0,pageWidth,11,'F');
    doc.setTextColor(226,184,57);
    doc.setFont('times','bold');
    doc.setFontSize(10);
    doc.text('ETERNAL ESSENCE',marginX,7);
    doc.setTextColor(235,232,222);
    doc.setFont('helvetica','normal');
    doc.setFontSize(5.8);
    doc.text(
      `${String(dealer.displayName||'AUTHORISED DEALER').toUpperCase()}  /  ${includePrices?'TRADE CATALOGUE':'FRAGRANCE CATALOGUE'}`,
      pageWidth-marginX,7,{align:'right'}
    );
    doc.setDrawColor(202,161,43);
    doc.setLineWidth(.35);
    doc.line(marginX,11,pageWidth-marginX,11);

    for(let slot=0;slot<perPage;slot+=1){
      const productIndex=pageIndex*perPage+slot;
      const product=products[productIndex];
      if(!product)continue;

      setStatus(`Designing catalogue card ${productIndex+1} of ${products.length}: ${product.name}`);

      const column=slot%columns;
      const rowIndex=Math.floor(slot/columns);
      const x=marginX+column*(cardWidth+gapX);
      const cardTop=top+rowIndex*(cardHeight+gapY);
      const innerX=x+4;
      const innerWidth=cardWidth-8;

      const sizes=getSizes(product);
      const rows=sizes.map(size=>{
        const website=websitePrice(product,size);
        const factor=Number(dealer.priceFactors?.[factorKey(size)]??dealer.priceFactor??1);
        return{...size,website,dealer:Math.round(website*factor)};
      });

      // ONE main image only.
      const mainSize=mainImageSize(product);
      const imageSources=variantSources(product,mainSize,Math.max(0,sizes.indexOf(mainSize)));
      const cacheKey=imageSources.join('|');
      let mainImage=imageCache.get(cacheKey);
      if(mainImage===undefined){
        mainImage=await loadCatalogueImage(imageSources);
        imageCache.set(cacheKey,mainImage);
      }

      // Card
      doc.setDrawColor(215,205,178);
      doc.setFillColor(253,252,247);
      doc.roundedRect(x,cardTop,cardWidth,cardHeight,1.5,1.5,'FD');

      // Product title bar
      doc.setFillColor(18,19,15);
      doc.roundedRect(x,cardTop,cardWidth,12,1.5,1.5,'F');
      doc.rect(x,cardTop+6,cardWidth,6,'F');
      doc.setTextColor(227,186,61);
      doc.setFont('times','bold');
      doc.setFontSize(9);
      doc.text(String(product.name||'Fragrance').toUpperCase(),innerX,cardTop+5.5,{maxWidth:innerWidth-30});
      doc.setTextColor(220,217,205);
      doc.setFont('helvetica','normal');
      doc.setFontSize(5);
      doc.text(productType(product).toUpperCase(),x+cardWidth-4,cardTop+5.5,{align:'right'});

      // Main image panel
      const imageTop=cardTop+15;
      const imageW=innerWidth;
      const imageH=34;
      doc.setFillColor(246,244,237);
      doc.setDrawColor(224,216,193);
      doc.roundedRect(innerX,imageTop,imageW,imageH,1,1,'FD');
      if(mainImage){
        // Keep the full product image visible; do not make a multi-image grid.
        const imgProps=doc.getImageProperties(mainImage);
        const scale=Math.min((imageW-4)/imgProps.width,(imageH-4)/imgProps.height);
        const drawW=imgProps.width*scale,drawH=imgProps.height*scale;
        doc.addImage(mainImage,'JPEG',innerX+(imageW-drawW)/2,imageTop+(imageH-drawH)/2,drawW,drawH,undefined,'FAST');
      }
      doc.setFillColor(18,19,15);
      doc.rect(innerX,imageTop+imageH-5.5,imageW,5.5,'F');
      doc.setTextColor(239,201,82);
      doc.setFont('helvetica','bold');
      doc.setFontSize(4.6);
      doc.text(sizeLabel(mainSize).toUpperCase(),innerX+imageW/2,imageTop+imageH-1.8,{align:'center'});

      // Only the requested product information: family + accords.
      let y=imageTop+imageH+6;
      doc.setFont('helvetica','bold');
      doc.setFontSize(5.2);
      doc.setTextColor(132,99,20);
      doc.text('FAMILY',innerX,y);
      doc.setFont('helvetica','normal');
      doc.setTextColor(55,53,47);
      doc.text(limitedLines(doc,product.family||'Signature fragrance',innerWidth-18,1),innerX+18,y,{maxWidth:innerWidth-18});

      y+=5;
      doc.setFont('helvetica','bold');
      doc.setTextColor(132,99,20);
      doc.text('ACCORDS',innerX,y);
      doc.setFont('helvetica','normal');
      doc.setTextColor(55,53,47);
      doc.text(
        limitedLines(doc,catalogueText(product.accords)||'—',innerWidth-18,2),
        innerX+18,y,{maxWidth:innerWidth-18}
      );
      y+=8;

      if(includePrices){
        // Clear price grid
        const tableX=innerX;
        const tableW=innerWidth;
        const headerH=6;
        const rowH=4.25;
        const colSize=tableW*.30;
        const colWebsite=tableW*.35;
        const colDealer=tableW-colSize-colWebsite;

        doc.setFillColor(18,19,15);
        doc.rect(tableX,y,tableW,headerH,'F');
        doc.setTextColor(239,201,82);
        doc.setFont('helvetica','bold');
        doc.setFontSize(4.5);
        doc.text('SIZE',tableX+2,y+4);
        doc.text('WEBSITE',tableX+colSize+colWebsite/2,y+4,{align:'center'});
        doc.text('DEALER',tableX+colSize+colWebsite+colDealer/2,y+4,{align:'center'});

        rows.forEach((price,index)=>{
          const py=y+headerH+index*rowH;
          const fill=index%2===0?249:244;
          doc.setFillColor(fill,fill-1,fill-5);
          doc.rect(tableX,py,tableW,rowH,'F');
          doc.setDrawColor(224,216,193);
          doc.rect(tableX,py,tableW,rowH,'S');
          doc.setTextColor(54,52,47);
          doc.setFont('helvetica','normal');
          doc.setFontSize(4.25);
          doc.text(sizeLabel(price),tableX+2,py+2.8);
          doc.setTextColor(70,68,61);
          doc.text(pdfMoney(price.website),tableX+colSize+colWebsite/2,py+2.8,{align:'center'});
          doc.setTextColor(132,96,8);
          doc.setFont('helvetica','bold');
          doc.text(pdfMoney(price.dealer),tableX+colSize+colWebsite+colDealer/2,py+2.8,{align:'center'});
        });
      }else{
        doc.setDrawColor(224,217,199);
        doc.line(innerX,y,innerX+innerWidth,y);
        doc.setTextColor(105,101,91);
        doc.setFont('helvetica','normal');
        doc.setFontSize(4.5);
        doc.text('Prices intentionally omitted from this catalogue.',innerX,y+5);
      }
    }

    doc.setTextColor(103,100,89);
    doc.setFont('helvetica','normal');
    doc.setFontSize(4.3);
    doc.text(
      includePrices?'Private dealer rates - subject to current catalogue terms':'Customer catalogue - prices intentionally omitted',
      marginX,pageHeight-3
    );
    doc.text(`${pageIndex+1} / ${pageCount}`,pageWidth-marginX,pageHeight-3,{align:'right'});
  }

  doc.setProperties({
    title:`${dealer.displayName} - Eternal Essence ${includePrices?'Trade':'Customer'} Catalogue`,
    subject:includePrices?'Filtered dealer price catalogue':'Filtered fragrance catalogue without prices',
    author:'Eternal Essence'
  });
  const suffix=new Date().toISOString().slice(0,10);
  doc.save(`eternal-essence-${includePrices?'dealer-priced':'customer-no-prices'}-catalogue-${suffix}.pdf`);
}
function useProducts(ready,backendBase){
  const[products,setProducts]=useState([]);
  useEffect(()=>{
    let active=true;
    const loadLivePricing=async()=>{
      const current=window.EE?.getProducts?.()||[];
      if(!current.length){if(active)setProducts([]);return;}
      if(active)setProducts(current);
      if(!backendBase)return;
      const enriched=await Promise.all(current.map(async product=>{
        const id=String(product?.id||product?._id||'').trim();
        if(!id)return product;
        try{
          const response=await fetch(`${backendBase}/api/products/inventory?productId=${encodeURIComponent(id)}`);
          const data=await response.json().catch(()=>({}));
          if(!response.ok||!data.success||!Array.isArray(data.inventory))return product;
          return {...product,inventoryPricing:data.inventory};
        }catch{return product;}
      }));
      if(active)setProducts(enriched);
    };
    loadLivePricing();
    return()=>{active=false;};
  },[ready,backendBase]);
  return products;
}

function RateCard({product,priceFactors,fallbackFactor,cardIndex}){
  const[activeIndex,setActiveIndex]=useState(productType(product)==='Perfume'?5:0);
  const sizes=getSizes(product);
  const prices=sizes.map(size=>{const website=websitePrice(product,size);const factor=Number(priceFactors?.[factorKey(size)]??fallbackFactor??1);return{...size,website,dealer:Math.round(website*factor)};});
  const lead=prices[activeIndex]||prices[0];
  return <article className="dealer-product-card">
    <VariantCarousel product={product} prices={prices} activeIndex={activeIndex} setActiveIndex={setActiveIndex} cardIndex={cardIndex}/>
    <div className="dealer-product-copy"><small>{product.family||'Signature fragrance'}</small><h3>{product.name}</h3>
      <div className="dealer-product-meta"><span>{product.gender||'Unisex'}</span><span>{product.season||'All Season'}</span><span>{product.time||'Day/Night'}</span></div>
      <p>{product.description||product.inspiredBy||'Eternal Essence fragrance profile.'}</p>
      <div className="dealer-lead-rate"><div><span>Website price</span><del>{money(lead.website)}</del></div><div><span>Your dealer rate</span><strong>{money(lead.dealer)}</strong></div><em>{sizeLabel(lead)}</em></div>
      <details><summary>View all regular &amp; gift size rates</summary><div className="dealer-size-table"><div className="head"><b>SIZE</b><b>WEBSITE</b><b>DEALER</b></div>{prices.map((row,index)=><div key={`${sizeKey(row)}-${index}`}><span>{sizeLabel(row)}</span><del>{money(row.website)}</del><strong>{money(row.dealer)}</strong></div>)}</div></details>
    </div>
  </article>;
}

export default function DealerPage({backendBase,legacyReady}){
  const[token,setToken]=useState(()=>sessionStorage.getItem(TOKEN_KEY)||'');
  const[dealer,setDealer]=useState(null),[loading,setLoading]=useState(!!token),[error,setError]=useState('');
  const[dealerId,setDealerId]=useState(''),[password,setPassword]=useState('');
  const[query,setQuery]=useState(''),[type,setType]=useState('all'),[gender,setGender]=useState('all');
  const[pdfBusy,setPdfBusy]=useState(false),[pdfStatus,setPdfStatus]=useState('');
  const products=useProducts(legacyReady,backendBase);
  const request=async(path,options={})=>{const response=await fetch(`${backendBase}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers||{})}});const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.error||'Request failed.'),{status:response.status});return data;};
  useEffect(()=>{if(!token){setLoading(false);setDealer(null);return;}let active=true;setLoading(true);request('/api/dealer/session').then(data=>{if(active){setDealer(data.dealer);setError('');}}).catch(err=>{if(active){if(err.status===401){sessionStorage.removeItem(TOKEN_KEY);setToken('');}setError(err.message);}}).finally(()=>active&&setLoading(false));return()=>{active=false};},[token]);
  const login=async event=>{event.preventDefault();setLoading(true);setError('');try{const response=await fetch(`${backendBase}/api/dealer/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dealerId,password})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Sign in failed.');sessionStorage.setItem(TOKEN_KEY,data.token);setPassword('');setDealer(data.dealer);setToken(data.token);}catch(err){setError(err.message);}finally{setLoading(false);}};
  const logout=()=>{sessionStorage.removeItem(TOKEN_KEY);setToken('');setDealer(null);setPassword('');};
  const downloadPdf=async includePrices=>{setPdfBusy(true);setPdfStatus(`Preparing ${includePrices?'dealer-priced':'customer'} catalogue…`);setError('');try{await exportDealerCatalogue(filtered,dealer,setPdfStatus,{includePrices});setPdfStatus(`${includePrices?'Dealer-priced':'Customer'} PDF downloaded successfully.`);}catch(err){setError(err.message);setPdfStatus('');}finally{setPdfBusy(false);}};
  const filtered=useMemo(()=>products.filter(product=>{const haystack=`${product.name||''} ${product.family||''} ${product.inspiredBy||''} ${product.gender||''} ${product.season||''} ${(product.accords||[]).join?.(' ')||product.accords||''}`.toLowerCase();return(!query||haystack.includes(query.toLowerCase()))&&(type==='all'||productType(product)===type)&&(gender==='all'||product.gender===gender);}),[products,query,type,gender]);
  if(loading&&!dealer)return <div className="dealer-loading"><div className="spinner"/><p>Securing your dealer portal…</p></div>;
  if(!dealer)return <main className="dealer-login-page"><a href="/" className="dealer-home-link">← Return to Eternal Essence</a><section className="dealer-login-card"><div className="dealer-login-mark"><ShieldCheck/><span>AUTHORISED TRADE ACCESS</span></div><h1>Dealer Portal</h1><p>Sign in with the dealer ID and password issued by Eternal Essence.</p><form onSubmit={login}><label>Dealer ID<input value={dealerId} onChange={event=>setDealerId(event.target.value)} autoComplete="username" required/></label><label>Password<input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password" required/></label>{error&&<div className="dealer-error">{error}</div>}<button disabled={loading}>{loading?'SIGNING IN…':'OPEN TRADE COLLECTION'}</button></form><small>Credentials are unique to each authorised dealer. Do not share them.</small></section></main>;
  return <main className="dealer-portal"><header className="dealer-header"><a href="/" className="dealer-brand"><img src="/products/ee-brand-20260819.webp" alt=""/><span><b>ETERNAL ESSENCE</b><small>TRADE COLLECTION</small></span></a><div className="dealer-identity"><span><Building2/> {dealer.displayName}</span><button onClick={logout}><LogOut/> Sign out</button></div></header>
    <section className="dealer-hero dealer-hero-private"><div><span><Store/> AUTHORISED DEALER RATE PORTAL</span><h1>Your complete trade collection,<br/>priced for every size.</h1><p>Every regular and premium gift variant is shown with its current website price and your private dealer rate.</p></div></section>
    <section className="dealer-controls"><label><Search/><input placeholder="Search name, gender, season or accord" value={query} onChange={event=>setQuery(event.target.value)}/></label><select value={type} onChange={event=>setType(event.target.value)}><option value="all">All products</option><option value="Perfume">Perfumes</option><option value="Attar">Attars</option></select><select value={gender} onChange={event=>setGender(event.target.value)}><option value="all">All genders</option><option value="Male">For Him</option><option value="Female">For Her</option><option value="Unisex">Unisex</option></select><button type="button" className="dealer-pdf-button" onClick={()=>downloadPdf(true)} disabled={pdfBusy}><FileDown/>{pdfBusy?'BUILDING…':'PDF WITH PRICES'}</button><button type="button" className="dealer-pdf-button secondary" onClick={()=>downloadPdf(false)} disabled={pdfBusy}><FileDown/>{pdfBusy?'BUILDING…':'PDF WITHOUT PRICES'}</button><b>{filtered.length} PRODUCTS</b></section>
    {pdfStatus&&<div className={`dealer-pdf-status ${pdfBusy?'busy':'success'}`}>{pdfStatus}</div>}
    {error&&<div className="dealer-inline-error">{error}</div>}
    <section className="dealer-grid">{filtered.map((product,index)=><RateCard key={`${product._id||product.id||product.name}-${index}`} product={product} priceFactors={dealer.priceFactors} fallbackFactor={dealer.priceFactor} cardIndex={index}/>)}</section>
    {!products.length&&<div className="dealer-empty">The fragrance catalogue is loading…</div>}
    <footer className="dealer-footer"><ShieldCheck/><span>Confidential dealer pricing · Rates follow current website selling prices and update when catalogue prices change.</span></footer>
  </main>;
}
