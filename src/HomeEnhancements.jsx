import React,{useEffect,useMemo,useState} from 'react';
import currentCatalog from '../data/current-catalog.json';
import {ProductTile} from './StorefrontChrome';
import CustomerVoices from './CustomerVoices';
import useBestSellers from './useBestSellers';

// Home tiles use the same canonical full-product image as collection cards.
// Product detail/variant views still retain their complete gallery arrays.
const imageCandidates=p=>{
  const images=Array.isArray(p?.images)?p.images:[];
  const isAttar=typeOf(p).toLowerCase().includes('attar');
  let image=p?.image||images[6]||images[0]||'';
  if(!p?.image&&!images[6]&&image&&!String(image).startsWith('http')){
    const raw=String(image).split('/').pop();
    const match=raw.match(/^(.*?)(?:\d+)\.(png|jpe?g|webp)$/i);
    if(match) image=raw.replace(raw,`${match[1]}.${match[2]}`);
  }
  const candidates=isAttar
    ? [images[0],images[1],images[2],image,p?.comboOverlayImages?.[8],p?.comboOverlayImages?.[20],images[6]]
    : [image,images[6],images[3],images[2],images[1],images[0]];
  return [...new Set(candidates.filter(Boolean).map(candidate=>{
    let value=String(candidate);
    if(value.split('/').pop().toLowerCase()==='eternal_white.webp')value='eternal white.webp';
    return value.startsWith('http')?value:`/products/${value.split('/').pop().replace(/\.(png|jpe?g)$/i,'.webp')}`;
  }).concat('/products/ee-brand-20260819.webp'))];
};
const typeOf=p=>String(p?.type||p?.category||'Perfume').trim()||'Perfume';
function useProducts(){const [products,setProducts]=useState(()=>currentCatalog.map(p=>({...p,id:p.legacyId,type:p.category,image:p.images?.[0],top:p.notes?.top,mid:p.notes?.mid,base:p.notes?.base})));useEffect(()=>{const sync=()=>{const live=window.EE?.getProducts?.();if(Array.isArray(live))setProducts(live)};sync();window.addEventListener('ee:ready',sync);window.addEventListener('ee:catalog-updated',sync);return()=>{window.removeEventListener('ee:ready',sync);window.removeEventListener('ee:catalog-updated',sync)};},[]);return products;}
function useCurated(){const [curated,setCurated]=useState(window.__EE_CURATED__?.collections||{});useEffect(()=>{const sync=()=>setCurated(window.__EE_CURATED__?.collections||{});window.addEventListener('ee:curated-loaded',sync);return()=>window.removeEventListener('ee:curated-loaded',sync);},[]);return curated;}
function collectionRoute(type,filter={}){const raw=String(type||'all').trim(),lower=raw.toLowerCase();let kind=lower.includes('attar')?'attars':lower.includes('perfume')?'perfumes':lower==='all'?'':raw.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(kind&&!kind.endsWith('s'))kind+='s';const gender=filter.gender;if(gender)return `/collections/${kind}/${gender==='Male'?'for-him':gender==='Female'?'for-her':'unisex'}`;const mood=filter.mood;if(mood)return `/collections/${kind}/${mood}`;return kind?`/collections/${kind}`:'/collections';}
function applyLegacyFilters(){try{window.applyFilters?.();}catch(error){console.warn('Legacy filters skipped until catalog controls are ready',error);}}
function goToCollection(type='all',filter={}){history.pushState({},'',type==='all'?'/collections':collectionRoute(type,filter));window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:location.pathname}}));document.getElementById('filter-bar')?.classList.remove('ee-catalog-hidden');document.getElementById('collection-section')?.classList.remove('ee-catalog-hidden');window.setCategory?.(type,true);setTimeout(()=>{const search=document.getElementById('search-input');if(search)search.value='';for(const id of ['gender-filter','season-filter','time-filter','sort-filter']){const control=document.getElementById(id);if(control)control.value='';}if(filter.gender){const f=document.getElementById('gender-filter');if(f)f.value=filter.gender;}if(filter.mood&&search)search.value=filter.mood==='woody-oud'?'oud':filter.mood==='sweet-musky'?'musk':'fresh';applyLegacyFilters();window.scrollTo(0,0);},80);}
function ProductArtwork({product,alt='',loading='lazy'}){const sources=imageCandidates(product),[index,setIndex]=useState(0);useEffect(()=>setIndex(0),[product?.id,product?._id,product?.name]);return <img src={sources[index]} alt={alt} loading={loading} onError={()=>setIndex(current=>Math.min(current+1,sources.length-1))}/>;}
function Tile({title,description,product,onClick,label}){return <button className="ee-collection-tile" onClick={onClick}><ProductArtwork product={product}/><span className="ee-collection-shade"/><span className="ee-collection-copy"><em>{label}</em><strong>{title}</strong><small>{description}</small><b>EXPLORE <i>→</i></b></span></button>;}
function Benefit({icon,title,copy}){return <div className="ee-benefit"><span>{icon}</span><strong>{title}</strong><small>{copy}</small></div>;}

const heroSlides=[
  {eyebrow:'THE GOLDEN STANDARD',first:'Timeless',accent:'Luxury',copy:'Elegance is not being noticed, it is being remembered.',image:'/products/purple_oud.webp',button:'SHOP COLLECTION',action:()=>goToCollection('all')},
  {eyebrow:'PURE CONCENTRATED OILS',first:'Royal',accent:'Attars',copy:'Discover the ancient art of perfumery with our premium collection.',image:'/products/oudcombodip.webp',button:'VIEW ATTARS',action:()=>goToCollection('Attar')},
  {eyebrow:'PERSONALISED GIFTING',first:'Create Your',accent:'Set',copy:'Mix your favourite perfumes and make a gift that feels personal.',image:'/products/golden_blush.webp',button:'BUILD A SET',action:()=>{if(window.eeNavigatePage)window.eeNavigatePage('custom-set');else window.location.assign('/custom-set')}}
];
function openScentFinder(){
  if(typeof window.openScentQuiz==='function')window.openScentQuiz();
  else window.addEventListener('ee:quiz-ready',()=>window.openScentQuiz?.(),{once:true});
}
function HeroCarousel(){
  const [active,setActive]=useState(0),[paused,setPaused]=useState(false);
  useEffect(()=>{if(paused||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=setInterval(()=>setActive(index=>(index+1)%heroSlides.length),5500);return()=>clearInterval(timer)},[paused]);
  return <section className="ee-hero-carousel" aria-label="Featured fragrance collections" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false)}}>
    {heroSlides.map((slide,index)=><div className={`ee-hero-slide${active===index?' active':''}`} key={slide.accent} style={{backgroundImage:`linear-gradient(rgba(0,0,0,.62),rgba(0,0,0,.62)),url("${slide.image}")`}} aria-hidden={active!==index}><div className="ee-hero-slide-copy"><span>{slide.eyebrow}</span><h1>{slide.first} <em>{slide.accent}</em></h1><p>{slide.copy}</p><div className="ee-hero-slide-actions"><button type="button" tabIndex={active===index?0:-1} onClick={slide.action}>{slide.button}</button><button type="button" className="ee-hero-find" tabIndex={active===index?0:-1} onClick={openScentFinder}>FIND MY SCENT ✦</button></div></div></div>)}
    <div className="ee-hero-dots" aria-label="Choose a featured collection">{heroSlides.map((slide,index)=><button type="button" key={slide.accent} className={active===index?'active':''} aria-label={`Show ${slide.first} ${slide.accent}`} aria-current={active===index?'true':undefined} onClick={()=>setActive(index)}/>)}</div>
  </section>;
}

const instagramThumbnailBase=()=>location.hostname==='localhost'||location.hostname==='127.0.0.1'?(window.EE?.getBackendBase?.()||'http://localhost:5000'):location.origin;
function InstagramReel({id,label,poster}){
  const [active,setActive]=useState(false),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
  const url=`https://www.instagram.com/p/${id}/`;
  const embedUrl=`https://www.instagram.com/p/${id}/embed/?autoplay=1&muted=1`;
  const thumbnailUrl=`${instagramThumbnailBase()}/api/instagram/reels/${id}/thumbnail`;
  const start=()=>{if(active)return;setFailed(false);setLoaded(false);setActive(true)};
  const stop=()=>{setActive(false);setLoaded(false)};
  useEffect(()=>{
    if(!active||loaded||failed)return;
    const timer=setTimeout(()=>setFailed(true),7000);
    return()=>clearTimeout(timer);
  },[active,loaded,failed]);
  return <article className={`ee-instagram-post${active?' playing':''}`} onMouseEnter={start} onMouseLeave={stop} onFocusCapture={start} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))stop()}}>
    <button className="ee-instagram-preview" type="button" onClick={start} aria-label={`Play ${label} Instagram video here`}>
      <img src={thumbnailUrl} alt={`${label} from Eternal Essence`} loading="lazy" onError={event=>{if(event.currentTarget.src!==new URL(poster,location.origin).href)event.currentTarget.src=poster}}/>
      <span className="ee-reel-play" aria-hidden="true">▶</span>
      <span className="ee-reel-caption"><small>@ETERNAL_ESSENSE · VIDEO</small><strong>{label}</strong><em>{failed?'WATCH ON INSTAGRAM':'HOVER TO PLAY · TAP TO OPEN'}</em></span>
    </button>
    {active&&!failed&&<iframe className={`ee-instagram-frame${loaded?' loaded':''}`} src={embedUrl} title={`${label} Instagram reel`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>}
    {active&&failed&&<a className="ee-reel-fallback" href={url} target="_blank" rel="noopener noreferrer">Preview unavailable here <strong>Watch on Instagram ↗</strong></a>}
    {active&&!failed&&<a className="ee-instagram-open" href={url} target="_blank" rel="noopener noreferrer">WATCH ON INSTAGRAM ↗</a>}
  </article>;
}

export default function HomeEnhancements(){
  const products=useProducts();
  const curated=useCurated();
  useEffect(()=>{if(!new URLSearchParams(location.search).get('collection')){document.getElementById('filter-bar')?.classList.add('ee-catalog-hidden');document.getElementById('collection-section')?.classList.add('ee-catalog-hidden');}},[]);
  const perfumes=useMemo(()=>products.filter(p=>typeOf(p)==='Perfume'),[products]);
  const attars=useMemo(()=>products.filter(p=>typeOf(p)==='Attar'),[products]);
  const customCategories=useMemo(()=>[...new Map(products.filter(p=>!['perfume','attar','combo'].includes(String(typeOf(p)).toLowerCase().replace(/\s+/g,''))).map(p=>[String(typeOf(p)).toLowerCase(),typeOf(p)])).values()],[products]);
  const namedProduct=(list,names)=>names.map(name=>list.find(product=>String(product.name||'').toLowerCase()===name.toLowerCase())).find(Boolean);
  const attarLead=namedProduct(attars,['Al Wadi','Mukhallat','Cool Tide'])||attars[0];
  const freshAttar=namedProduct(attars,['Cool Tide','Aqua Wave','Iceberg'])||attars.find(p=>/fresh|citrus|marine|aquatic/i.test(`${p.accords} ${p.family}`));
  const woodyAttar=namedProduct(attars,['Al Wadi','Mukhallat','Ameer Al OUD'])||attars.find(p=>/oud|wood|amber/i.test(`${p.accords} ${p.family}`));
  const sweetAttar=namedProduct(attars,['Mukhallat','Pink Vanilla','Chocolate Musk'])||attars.find(p=>/sweet|gourmand|musk|vanilla/i.test(`${p.accords} ${p.family}`));
  const groups=[
    {title:'For Him',label:'PERFUMES',description:'Fresh, aromatic and statement profiles.',product:perfumes.find(p=>p.gender==='Male'),action:()=>goToCollection('Perfume',{gender:'Male'})},
    {title:'For Her',label:'PERFUMES',description:'Floral, luminous and softly sweet signatures.',product:perfumes.find(p=>p.gender==='Female'),action:()=>goToCollection('Perfume',{gender:'Female'})},
    {title:'Unisex',label:'PERFUMES',description:'Balanced blends made to be shared.',product:perfumes.find(p=>p.gender==='Unisex'),action:()=>goToCollection('Perfume',{gender:'Unisex'})},
    {title:'Fresh Attars',label:'ATTARS',description:'Clean citrus, marine and aromatic oils.',product:freshAttar,action:()=>goToCollection('Attar',{mood:'fresh-attars'})},
    {title:'Woody & Oud',label:'ATTARS',description:'Deep woods, amber and lasting oud.',product:woodyAttar,action:()=>goToCollection('Attar',{mood:'woody-oud'})},
    {title:'Sweet & Musky',label:'ATTARS',description:'Warm gourmand and skin-close blends.',product:sweetAttar,action:()=>goToCollection('Attar',{mood:'sweet-musky'})}
  ];
  const featuredNames=['Aventus','Eternal White','Cool Essence','Divine Essence','Al Wadi','Titanium'];
  const featured=featuredNames.map(name=>{
    const matches=products.filter(p=>String(p.name||'').toLowerCase()===name.toLowerCase());
    return matches.find(p=>typeOf(p)==='Perfume'&&Number(p.price)>=400)||matches.find(p=>Number(p.price)>=400)||matches[0];
  }).filter(Boolean);
  const {products:hotProducts,basedOnOrders:hasOrderRanking}=useBestSellers(products,featured,6);
  const oudIds=curated.oud;
  const oudProducts=Array.isArray(oudIds) ? oudIds.map(id=>products.find(p=>String(p.id||p._id||'').replace(/^db_/,'')===String(id))).filter(Boolean)
    : ['Blue OUD','Dark Rebel','Mukhallat'].map(name=>products.find(p=>String(p.name||'').toLowerCase()===name.toLowerCase()&&typeOf(p)==='Perfume')||products.find(p=>String(p.name||'').toLowerCase()===name.toLowerCase())).filter(Boolean);
  const lead=featured[0]||products[0], fresh=perfumes.find(p=>/fresh|aquatic|citrus|marine/i.test(`${p.accords} ${p.family}`))||perfumes[1], deep=products.find(p=>/oud|woody|amber|musk/i.test(`${p.accords} ${p.family}`))||attars[0];
  const notes=p=>[p?.top,p?.mid,p?.base].filter(Boolean).join(' → ')||'top, heart and base notes';
  const journal=[
    {slug:'reading-a-fragrance',tag:'NOTE MAP',title:'How to read any fragrance from opening to dry-down',copy:`Start with the opening, follow the heart and let the base settle. Use ${lead?.name||'your chosen fragrance'} as one example, then compare the character of every blend.`,productId:lead?.id||lead?._id},
    {slug:'fresh-fragrance-for-warm-weather',tag:'WARM WEATHER',title:`When to wear ${fresh?.name||'a fresh profile'}`,copy:`${fresh?.name||'Fresh profiles'} brings ${fresh?.top||'bright opening notes'} into focus, then settles through ${fresh?.mid||'a clean heart'} toward ${fresh?.base||'a smooth base'}.`,productId:fresh?.id||fresh?._id},
    {slug:'woods-oud-and-evening-wear',tag:'DEPTH & LASTING',title:`Layer your evening around ${deep?.name||'woods and oud'}`,copy:`${deep?.name||'Woody profiles'} is built around ${deep?.base||deep?.family||'richer base notes'}. Wear time varies with skin, clothing, weather and application.`,productId:deep?.id||deep?._id}
  ];
  return <>
    <HeroCarousel/>
    <section className="ee-home-collections">
      <div className="ee-home-intro"><span>THE COLLECTION</span><h2>Find the scent that feels like you.</h2><p>Start with a fragrance family, then refine it by mood, gender and the way you wear it.</p></div>
      <div className="ee-main-collections"><Tile title="Perfumes" label="01 · EAU DE PARFUM" description="Signature sprays for everyday wear, evenings and statement moments." product={perfumes[0]} onClick={()=>goToCollection('Perfume')}/><Tile title="Attars" label="02 · CONCENTRATED OILS" description="Oil-rich blends built around oud, amber, musk, woods and florals." product={attarLead} onClick={()=>goToCollection('Attar')}/></div>
      <div className="ee-subcollection-head"><span/><b>SHOP BY MOOD & STYLE</b><span/></div><div className="ee-subcollection-grid">{groups.map(group=><Tile key={group.title} {...group} onClick={group.action}/>)}{customCategories.map(category=><Tile key={category} title={category} label="COLLECTION" description={`Explore our ${category.toLowerCase()} collection.`} product={products.find(p=>typeOf(p)===category)} onClick={()=>goToCollection(category)}/>)}</div>
      <div className="ee-explore-more"><button onClick={()=>goToCollection('all')}>EXPLORE ALL PRODUCTS <span>→</span></button></div>
    </section>
    <section className="ee-home-featured"><div className="ee-home-section-heading"><span>HOT SELLING</span><h2>Find your next signature.</h2><p>{hasOrderRanking?'The fragrances customers order most.':'Explore signature picks from the collection.'}</p><button onClick={()=>{location.href='/collections/hot-selling'}}>VIEW HOT SELLING →</button></div><div className="ee-featured-grid">{hotProducts.map(p=><ProductTile key={p.id||p._id||p.name} product={p}/>)}</div></section>
    <section className="ee-home-featured"><div className="ee-home-section-heading"><span>OUD LOVERS</span><h2>Find your oud.</h2><p>Explore our selected oud fragrances.</p><button onClick={()=>window.eeOpenCuratedCollection?.('oud')}>VIEW OUD LOVERS →</button></div><div className="ee-featured-grid">{oudProducts.map(p=><button className="ee-featured-card" key={p.id||p._id||p.name} onClick={()=>window.eeNavigateToProduct?.(p,{size:window.eeDefaultProductSize?.(p)})}><ProductArtwork product={p} alt={p.name}/><span><small>{p.family||'OUD PROFILE'}</small><strong>{p.name}</strong><em>{Array.isArray(p.accords)?p.accords.slice(0,3).join(' · '):'Oud fragrance'}</em></span></button>)}</div></section>
    <section className="ee-why-home"><div className="ee-home-section-heading centered"><span>WHY ETERNAL ESSENCE</span><h2>Thoughtful fragrance, made transparent.</h2><p>Everything you need to choose confidently, from the first note to the final dry-down.</p></div><div className="ee-benefit-grid"><Benefit icon="✦" title="Curated profiles" copy="Every blend is organised by notes, mood and wear occasion."/><Benefit icon="◌" title="Clear disclosure" copy="See the top, heart and base notes before you make a choice."/><Benefit icon="◇" title="Made for gifting" copy="Create custom sets and perfume cards for meaningful moments."/><Benefit icon="✓" title="Reliable service" copy="Secure checkout, India-wide shipping and quality assurance."/></div></section>
    <section className="ee-home-compare"><div className="ee-home-section-heading centered"><span>THE DIFFERENCE</span><h2>How Eternal Essence compares.</h2><p>Luxury details should be clear, not hidden.</p></div><div className="ee-compare-card"><div className="ee-compare-row head"><b>DETAIL</b><strong>ETERNAL ESSENCE</strong><em>OTHERS</em></div>{[['Ingredient quality','Luxury-grade oils','Often undisclosed'],['Oil concentration','35–45% extrait','15–20%'],['Longevity','6–10+ hours*','3–5 hours'],['Formula transparency','Full disclosure','Not always']].map(row=><div className="ee-compare-row" key={row[0]}><b>{row[0]}</b><strong>{row[1]}</strong><em>{row[2]}</em></div>)}</div></section>
    <CustomerVoices products={products}/>
    <section className="ee-instagram-home" aria-labelledby="ee-instagram-title"><div className="ee-home-section-heading centered"><span>FROM OUR INSTAGRAM</span><h2 id="ee-instagram-title">See the fragrance story.</h2><p>Explore four posts from @eternal_essense.</p></div><div className="ee-instagram-reels">{[['DbsGJXSsdFA','Fragrance story 01','/products/set_bg.webp'],['DU0KYN9EqLO','Fragrance story 02','/products/aventus3.webp'],['DaIPFbtML3Y','Fragrance story 03','/products/afternoon_dive3.webp'],['DaXesoHsGTu','Fragrance story 04','/products/purple_oud.webp']].map(([id,label,poster])=><InstagramReel key={id} id={id} label={label} poster={poster}/>)}</div><a className="ee-instagram-follow" href="https://www.instagram.com/eternal_essense/" target="_blank" rel="noopener noreferrer">FOLLOW @ETERNAL_ESSENSE ↗</a></section>
    <section className="ee-home-journal"><div className="ee-home-section-heading centered"><span>THE JOURNAL</span><h2>Ideas for wearing fragrance well.</h2><p>Product-led notes, seasonal edits and practical guidance from the collection.</p></div><div className="ee-journal-grid">{journal.map(item=><article key={item.slug}><span>{item.tag}</span><h3>{item.title}</h3><p>{item.copy}</p><button onClick={()=>window.eeNavigateToJournal?.(item.slug)}>READ THE ARTICLE →</button></article>)}</div></section>
    <section className="ee-home-trust"><Benefit icon="♢" title="Free shipping" copy="Pan India delivery"/><Benefit icon="▣" title="Secure payment" copy="Safe and encrypted checkout"/><Benefit icon="◫" title="Authenticity assured" copy="Made for repeat wear"/><Benefit icon="◉" title="Online support" copy="We are here when you need us"/></section>
  </>;
}
