
import React,{useEffect,useRef,useState,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import ProductPage from './ProductPage';
import JournalPage from './JournalPage';
import OfferPopup from './OfferPopup';
import HomeEnhancements from './HomeEnhancements';
import DealerPage from './DealerPage';
import './legacy.css';
import './app.css';

window.eeLoadPdfEngine=async()=>{
  if(window.jspdf?.jsPDF)return window.jspdf;
  const[{jsPDF},{applyPlugin}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
  applyPlugin(jsPDF);
  window.jspdf={...(window.jspdf||{}),jsPDF};
  return window.jspdf;
};

const normalizeBackendBase=value=>String(value||'').trim().replace(/\/+$/,'');
const isLocalFrontend=location.hostname==='localhost'||location.hostname==='127.0.0.1';
const primaryBackendBase=normalizeBackendBase(
  import.meta.env.VITE_BACKEND_BASE_URL ||
  // Production is routed through the Cloudflare `/api/*` worker. Keeping the
  // default same-origin makes apex/www use the same backend and avoids a
  // deployment silently bypassing the worker when the Pages variable is
  // missing. A Pages environment variable can still override this explicitly.
  (isLocalFrontend?'http://localhost:5000':location.origin)
);
const fallbackBackendBase=normalizeBackendBase(
  import.meta.env.VITE_BACKEND_FALLBACK_URL ||
  (isLocalFrontend?'':'https://eternal-essence-backend.onrender.com')
);
let activeBackendBase=primaryBackendBase;
function backendUrl(){return primaryBackendBase;}
function backendRequestUrl(input){
  if(typeof input==='string')return input;
  if(input instanceof URL)return input.href;
  return input?.url||'';
}
function canSafelyFailOver(method,url){
  if(['GET','HEAD','OPTIONS'].includes(method))return true;
  const pathname=new URL(url,location.origin).pathname.replace(/\/+$/,'');
  return [
    '/api/auth/login',
    '/api/auth/me',
    '/api/analytics/event',
    '/api/orders/quote',
    '/api/orders/validate-coupon',
    '/api/orders/coupon-suggestions'
  ].includes(pathname);
}
function installBackendFailover(){
  if(window.__EE_BACKEND_FAILOVER_INSTALLED__||!fallbackBackendBase||fallbackBackendBase===primaryBackendBase)return;
  window.__EE_BACKEND_FAILOVER_INSTALLED__=true;
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
    const requestUrl=backendRequestUrl(input);
    if(!requestUrl.startsWith(`${primaryBackendBase}/`))return nativeFetch(input,init);
    const method=String(init.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
    const safeRetry=canSafelyFailOver(method,requestUrl);
    const fallbackUrl=fallbackBackendBase+requestUrl.slice(primaryBackendBase.length);
    const requestClone=input instanceof Request?input.clone():null;
    if(activeBackendBase===fallbackBackendBase){
      const activeInput=requestClone?new Request(fallbackUrl,requestClone):fallbackUrl;
      return nativeFetch(activeInput,init);
    }
    try{
      const response=await nativeFetch(input,init);
      const unavailable=[502,503,504,521,522,523,524].includes(response.status);
      const htmlNotFound=response.status===404&&String(response.headers.get('content-type')||'').includes('text/html');
      if(safeRetry&&(unavailable||htmlNotFound)){
        console.warn(`Primary backend unavailable (${response.status}); using Render backup.`);
        const retryInput=requestClone?new Request(fallbackUrl,requestClone):fallbackUrl;
        const fallbackResponse=await nativeFetch(retryInput,init);
        if(![502,503,504,521,522,523,524].includes(fallbackResponse.status)){
          activeBackendBase=fallbackBackendBase;
          window.__EE_CONFIG__.ACTIVE_BACKEND_BASE_URL=fallbackBackendBase;
        }
        return fallbackResponse;
      }
      return response;
    }catch(error){
      if(!safeRetry)throw error;
      console.warn('Primary backend could not be reached; using Render backup.');
      const retryInput=requestClone?new Request(fallbackUrl,requestClone):fallbackUrl;
      const fallbackResponse=await nativeFetch(retryInput,init);
      if(![502,503,504,521,522,523,524].includes(fallbackResponse.status)){
        activeBackendBase=fallbackBackendBase;
        window.__EE_CONFIG__.ACTIVE_BACKEND_BASE_URL=fallbackBackendBase;
      }
      return fallbackResponse;
    }
  };
}
window.__EE_CONFIG__={
  ...(window.__EE_CONFIG__||{}),
  BACKEND_BASE_URL:primaryBackendBase,
  BACKEND_FALLBACK_URL:fallbackBackendBase
};
installBackendFailover();
function analyticsVisitorId(){
  const key='ee_analytics_visitor_v1';
  let id=sessionStorage.getItem(key);
  if(!id){id=globalThis.crypto?.randomUUID?.()||`ee-${Date.now()}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem(key,id);}
  return id;
}
function trackAnalytics(eventType,payload={}){
  return fetch(`${backendUrl()}/api/analytics/event`,{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({visitorId:analyticsVisitorId(),eventType,path:location.pathname+location.search,referrer:document.referrer,...payload})}).catch(()=>{});
}
window.eeAnalyticsVisitorId=analyticsVisitorId;
window.eeTrackAnalytics=trackAnalytics;
function slugify(value){
  return String(value||'').trim().toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'');
}
function categorySlug(product){
  return String(product?.type||product?.category||'perfume').toLowerCase().includes('attar') ? 'attars' : 'perfumes';
}
function productSlug(product){
  const base=slugify(product?.name||'product');
  return categorySlug(product)==='attars' ? `${base}_attar` : base;
}
function productPath(product){
  return `/products/${categorySlug(product)}/${productSlug(product)}`;
}
function journalPath(slug){return `/journal/${slug}`;}
function pagePath(page, hash=''){
  const routes={home:'/', collection:'/collections', 'custom-set':'/custom-set','perfume-card':'/perfume-card','about':'/about','contact':'/contact','cart':'/cart','orders':'/orders','account':'/account','profile':'/profile'};
  if(page==='home' && hash) return `/?${hash}`;
  return routes[page] || '/';
}

function LegacyShell({active,page,onReady,productOnly=false,collectionOnly=false}){
  const ref=useRef(null); const hooked=useRef(false);
  useEffect(()=>{
    let cancelled=false;
    async function mount(){
      if(!ref.current) return;
      try{
        const r=await fetch('/legacy/legacy-body.html');
        const markup=(await r.text())
          .replace(/" onchange="applyFilters\(\)"><option value="">\s*$/,'')
          .replace(
            'id="season-filterAll Seasons</option>',
            'id="season-filter" onchange="applyFilters()"><option value="">All Seasons</option>'
          )
          .replace(
            "onclick=\"goToCategory('Attar')\"",
            "onclick=\"window.eeNavigateCollection?.('Attar')\""
          )
          .replace(
            'onclick="document.getElementById(\'filter-bar\').scrollIntoView({behavior:\'smooth\'})"',
            'onclick="window.eeNavigateCollection?.(\'all\')"'
          )
          .replace(
            '<th class="p-4">Price</th>',
            '<th class="p-4">Quantity</th><th class="p-4">Price</th>'
          );
        if(cancelled)return;
        ref.current.innerHTML=markup;
        const catalogueSearch=ref.current.querySelector('#search-input');
        if(catalogueSearch){
          catalogueSearch.type='search';catalogueSearch.name='ee_catalogue_query';catalogueSearch.autocomplete='off';
          catalogueSearch.setAttribute('data-lpignore','true');catalogueSearch.setAttribute('data-1p-ignore','true');catalogueSearch.setAttribute('autocorrect','off');catalogueSearch.spellcheck=false;
          catalogueSearch.readOnly=true;
          const unlock=()=>{catalogueSearch.readOnly=false;if(!catalogueSearch.dataset.eeUserTyped)catalogueSearch.value='';catalogueSearch.dataset.eeUserTyped='1';};
          catalogueSearch.addEventListener('pointerdown',unlock,{once:true});catalogueSearch.addEventListener('keydown',unlock,{once:true});
        }
        // The deployed logo asset is case-sensitive (`ee.webp`). Normalize the
        // two legacy header/footer references before the old scripts render.
        ref.current.querySelectorAll('img[src="/products/ee.webp"]').forEach(img=>{img.src='/products/ee-brand-20260819.webp';});
        const home=document.getElementById('page-home');
        if(home && !document.getElementById('ee-home-react-mount')){
          const mount=document.createElement('div');
          mount.id='ee-home-react-mount';
          const filterBar=document.getElementById('filter-bar');
          if(filterBar) home.insertBefore(mount,filterBar);
          else home.appendChild(mount);
        }
        window.__EE_CONFIG__={
          ...(window.__EE_CONFIG__||{}),
          BACKEND_BASE_URL:backendUrl(),
          BACKEND_FALLBACK_URL:fallbackBackendBase
        };
        window.__EE_IMAGE_BASE__='/products/';
        window.__EE_CARD_BASE__='/card/';
        const add=(src)=>new Promise((resolve,reject)=>{
          const s=document.createElement('script'); s.src=src; s.async=false; s.onload=resolve; s.onerror=reject; document.body.appendChild(s);
        });
        // Payments are optional during initial catalogue boot; a blocked
        // checkout CDN must never prevent products, admin or PDFs from loading.
        add('https://checkout.razorpay.com/v1/checkout.js').catch(e=>console.warn('Payment widget unavailable until checkout.',e));
        for(const src of ['/legacy/assets/js/index.496a4899fd.js','/legacy/assets/js/index.75993714cf.js','/legacy/assets/js/index.3563c0bc19.js']){
          try{await add(src);}catch(e){console.error(`Legacy asset failed to load: ${src}`,e);}
        }
        if(!window.EE){
          await new Promise(resolve=>{
            const done=()=>{window.removeEventListener('ee:ready',done);resolve()};
            window.addEventListener('ee:ready',done,{once:true});
            setTimeout(done,8000);
          });
        }
        if(cancelled)return;
        // Keep a display-only page switch for React route changes. Calling the
        // navigation wrapper here used to replace /products/... with `/` when
        // opening an item from Cart or Wishlist.
        const legacySwitch=window.switchPage;
        if(legacySwitch && !window.eeShowLegacyPage){
          window.eeShowLegacyPage=(pageId)=>legacySwitch(pageId);
        }
        if(legacySwitch && !hooked.current){
          let preserveInitialRoute=productOnly||collectionOnly;
          const wrapped=function(pageId,forceNavigate=false){
            const hash=location.hash||'';
            legacySwitch(pageId);
            const query=(pageId==='home' && hash.startsWith('#home?')) ? hash.slice('#home?'.length) : '';
            // Product, collection and journal routes all display the legacy
            // home shell behind React. Legacy popstate listeners must not turn
            // that display change into a navigation back to `/`.
            const ownsHomeShell=/^\/(?:products|collections|journal|dealer)(?:\/|$)/i.test(location.pathname);
            if(!((preserveInitialRoute||ownsHomeShell) && pageId==='home' && !forceNavigate)){
              const p=pagePath(pageId,query);
              history.replaceState({},'',p);
              window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:p}}));
            }
            preserveInitialRoute=false;
          };
          window.switchPage=wrapped;
          window.eeNavigatePage=(pageId)=>wrapped(pageId,true);
          hooked.current=true;
        }
        try{ window.eeShowLegacyPage?.(page||'home'); }catch{}
        if((page||'home')==='home' && !collectionOnly && !new URLSearchParams(location.search).get('collection')){
          document.getElementById('filter-bar')?.classList.add('ee-catalog-hidden');
          document.getElementById('collection-section')?.classList.add('ee-catalog-hidden');
        }
        try{
          const cat=initialCategory();
          if(cat && (page==='home' || collectionOnly)) window.setCategory?.(cat,true);
          if(collectionOnly){
            const state=collectionStateFromLocation();
            window.setCategory?.(state.kind,true);
            const gender=document.getElementById('gender-filter');
            const search=document.getElementById('search-input');
            if(gender)gender.value=state.gender||'';
            if(search)search.value=state.search||'';
            safeLegacyApplyFilters();
          }
        }catch{}
        // Intercept legacy hash links so /cart, /about etc are real routes.
        if(!hooked.current || !ref.current.dataset.eeNavBound){
          document.addEventListener('click',(ev)=>{
            const a=ev.target.closest?.('a[href^="#"]');
            if(!a) return;
            const href=a.getAttribute('href')||'';
            const key=href.slice(1).split('?')[0];
            if(['home','custom-set','perfume-card','about','contact','cart','orders','account','profile'].includes(key)){
              ev.preventDefault();
              window.eeNavigatePage?.(key);
            }
          },true);
          ref.current.dataset.eeNavBound='1';
        }
        window.eeNavigateToProduct=(id,options={})=>{
          const products=window.EE?.getProducts?.()||[];
          const p=typeof id==='object' ? id : (
            window.EE?.findProduct?.(id) ||
            products.find(product=>String(product.name||'').toLowerCase()===String(options?.name||'').toLowerCase())
          );
          if(p){
            const size=options?.size ? String(options.size) : '';
            const path=productPath(p)+(size?`?size=${encodeURIComponent(size)}`:'');
            window.__eePendingProductSelection={productId:String(p.id||p._id||id||''),size,cartIndex:options?.cartIndex??null,quantity:Math.max(1,Number(options?.quantity)||1)};
            window.scrollTo(0,0);
            history.pushState({},'',path);
            window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:location.pathname+location.search}}));
          }
        };
        // Product cards in the legacy grid still called the old modal directly.
        // Route them through React so size images, the scent panel and page layout apply.
        if(window.openModal && !window.__eeProductModalBridge){
          window.openModal=(productOrId)=>{
            const product=typeof productOrId==='object' ? productOrId : window.EE?.findProduct?.(productOrId);
            if(product) window.eeNavigateToProduct(product);
          };
          window.__eeProductModalBridge=true;
        }
        // Legacy collection links use pushState, so make their filter update immediate.
        const legacyCategory=window.goToCategory;
        if(legacyCategory && !window.__eeCategoryBridge){
          window.goToCategory=(category)=>{const state={gender:document.getElementById('gender-filter')?.value||'',search:document.getElementById('search-input')?.value||''};history.pushState({},'',collectionPath(category,state));document.getElementById('filter-bar')?.classList.remove('ee-catalog-hidden');document.getElementById('collection-section')?.classList.remove('ee-catalog-hidden');window.setCategory?.(category,true); safeLegacyApplyFilters(); window.scrollTo(0,0); window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:location.pathname+location.search}}));};
          window.__eeCategoryBridge=true;
        }
        window.eeNavigateCollection=(category='all')=>{
          const normalized=String(category||'all').toLowerCase().includes('attar')?'Attar':String(category||'all').toLowerCase().includes('perfume')?'Perfume':'all';
          history.pushState({},'',collectionPath(normalized,{}));
          document.getElementById('filter-bar')?.classList.remove('ee-catalog-hidden');
          document.getElementById('collection-section')?.classList.remove('ee-catalog-hidden');
          ['search-input','gender-filter','season-filter','time-filter','sort-filter'].forEach(id=>{const control=document.getElementById(id);if(control)control.value='';});
          window.setCategory?.(normalized,true); safeLegacyApplyFilters(); window.scrollTo(0,0);
          window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:location.pathname+location.search}}));
        };
        const profileButton=document.getElementById('nav-profile-btn');
        if(profileButton&&!profileButton.dataset.eeProfileBound){
          profileButton.addEventListener('click',ev=>{ev.preventDefault();ev.stopImmediatePropagation();window.eeNavigatePage?.('profile');},true);
          profileButton.dataset.eeProfileBound='1';
        }
        window.eeNavigateToJournal=(slug)=>{const path=journalPath(slug);history.pushState({},'',path);window.scrollTo(0,0);window.dispatchEvent(new CustomEvent('ee:route',{detail:{path}}));};
        window.eeProductPath=(id)=>{const p=typeof id==='object'?id:window.EE?.findProduct?.(id); return p?productPath(p):'/';};
        onReady?.();
      }catch(e){console.error('Legacy shell boot failed',e); onReady?.()}
    }
    mount();
    return()=>{cancelled=true};
  },[]);

  useEffect(()=>{
    if(active && window.eeShowLegacyPage){
      try{ window.eeShowLegacyPage(page||'home'); }catch{}
      window.scrollTo(0,0);
    }
  },[active,page]);
  return <div ref={ref} className={`${active?'ee-legacy-root':'ee-legacy-root ee-hidden'}${productOnly?' ee-product-shell':''}${collectionOnly?' ee-collection-shell':''}`}/>;
}

function productFromRoute(path){
  const cleanPath=String(path||'').split('?')[0];
  const m=cleanPath.match(/^\/products\/(perfumes|attars)\/([^/]+)\/?$/i);
  if(m) return {category:m[1].toLowerCase(),slug:decodeURIComponent(m[2])};
  const old=cleanPath.match(/^\/product\/([^/]+)\/?$/i);
  if(old) return {legacyId:decodeURIComponent(old[1])};
  return null;
}
function journalFromRoute(path){const m=path.match(/^\/journal\/([^/]+)\/?$/i);return m?decodeURIComponent(m[1]):null;}
function pageFromLocation(){
  const path=location.pathname;
  const map={'/cart':'cart','/orders':'orders','/account':'account','/profile':'profile','/about':'about','/contact':'contact','/custom-set':'custom-set','/perfume-card':'perfume-card'};
  if(path==='/collection') return 'collection';
  if(/^\/collections(?:\/|$)/i.test(path)) return 'collection';
  if(map[path]) return map[path];
  const hash=(location.hash||'').replace(/^#/,'').split('?')[0];
  return ['cart','orders','account','profile','about','contact','custom-set','perfume-card','collection'].includes(hash)?hash:'home';
}
function initialCategory(){
  const q=new URLSearchParams(location.search).get('cat');
  if(q)return q;
  const h=location.hash||'';
  return h.startsWith('#home?')?new URLSearchParams(h.slice('#home?'.length)).get('cat'):'';
}
function collectionStateFromLocation(){
  const parts=location.pathname.split('/').filter(Boolean).map(v=>decodeURIComponent(v).toLowerCase());
  const kind=parts[1]==='attar'?'Attar':parts[1]==='perfume'?'Perfume':'all';
  const facet=parts[2]||'';
  const state={gender:'',search:''};
  if(facet==='for-him')state.gender='Male';
  else if(facet==='for-her')state.gender='Female';
  else if(facet==='unisex')state.gender='Unisex';
  else if(facet==='fresh-attars')state.search='fresh';
  else if(facet==='woody-oud')state.search='oud';
  else if(facet==='sweet-musky')state.search='musk';
  return {...state,kind};
}
function collectionPath(category='all',state={}){
  const kind=String(category||state.kind||'all').toLowerCase().includes('attar')?'attar':String(category||state.kind||'').toLowerCase().includes('perfume')?'perfume':'';
  if(!kind)return '/collections';
  if(state.gender)return `/collections/${kind}/${state.gender==='Male'?'for-him':state.gender==='Female'?'for-her':'unisex'}`;
  if(state.search)return `/collections/${kind}/${String(state.search).includes('oud')?'woody-oud':String(state.search).includes('musk')?'sweet-musky':'fresh-attars'}`;
  return `/collections/${kind}`;
}
function safeLegacyApplyFilters(){
  try{window.applyFilters?.();}catch(e){console.warn('Legacy filters skipped until catalog controls are ready',e);}
}

function findProductByRoute(route){
  const list=window.EE?.getProducts?.()||[];
  if(route?.legacyId){
    return list.find(p=>String(p.id||p._id).replace(/^db_/,'')===String(route.legacyId).replace(/^db_/,''));
  }
  if(!route) return null;
  const toSlug=v=>slugify(v);
  return list.find(p=>{
    const cat=categorySlug(p);
    const slug=productSlug(p);
    return cat===route.category && slug===route.slug;
  })||null;
}

function App(){
  const [path,setPath]=useState(location.pathname+location.search);
  const [legacyReady,setLegacyReady]=useState(false);
  const sync=()=>setPath(location.pathname+location.search);
  useEffect(()=>{
    const onPop=sync; const onRoute=sync; const onHash=sync;
    window.addEventListener('popstate',onPop); window.addEventListener('hashchange',onHash); window.addEventListener('ee:route',onRoute);
    return()=>{window.removeEventListener('popstate',onPop);window.removeEventListener('hashchange',onHash);window.removeEventListener('ee:route',onRoute)};
  },[]);
  useEffect(()=>{trackAnalytics('page_view');},[path]);
  useEffect(()=>{
    if(!legacyReady)return;
    const input=document.getElementById('search-input');
    if(!input)return;
    let timer;
    const onSearch=()=>{clearTimeout(timer);const query=input.value.trim();if(query.length>=2)timer=setTimeout(()=>trackAnalytics('search',{query}),700);};
    input.addEventListener('input',onSearch);
    return()=>{clearTimeout(timer);input.removeEventListener('input',onSearch);};
  },[legacyReady]);
  const route=productFromRoute(path);
  const journalSlug=journalFromRoute(path);
  const product=route ? findProductByRoute(route) : null;
  const isProduct=!!route;
  const isJournal=!!journalSlug;
  const cleanPath=location.pathname.replace(/\/+$/,'')||'/';
  const isDealer=cleanPath==='/dealer';
  const page=pageFromLocation();
  const isCollection=page==='collection' && !isProduct;

  // Once legacy data is ready, refresh product resolution so direct links work.
  useEffect(()=>{ if(legacyReady) setPath(location.pathname+location.search); },[legacyReady]);

  const handleLegacyReady=useCallback(()=>setLegacyReady(true),[]);
  const navigateHome=()=>{
    history.pushState({},'', '/');
    setPath('/');
    window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:'/'}}));
  };
  return <>
    <LegacyShell active={!isDealer} page={isProduct||isJournal?'home':(isCollection?'home':page)} collectionOnly={isCollection} productOnly={isProduct||isJournal||isDealer} onReady={handleLegacyReady}/>
    {!isProduct && !isJournal && !isCollection && !isDealer && legacyReady && document.getElementById('ee-home-react-mount') &&
      createPortal(<HomeEnhancements/>,document.getElementById('ee-home-react-mount'))}
    {isProduct && (legacyReady ? <ProductPage product={product} route={route} onBack={navigateHome}/> : <div className="ee-loading"><div className="spinner"></div><p>Loading fragrance…</p></div>)}
    {isJournal && (legacyReady ? <JournalPage slug={journalSlug} onBack={navigateHome}/> : <div className="ee-loading"><div className="spinner"></div><p>Loading journal...</p></div>)}
    {isDealer&&<DealerPage backendBase={backendUrl()} legacyReady={legacyReady}/>}
    {!isDealer&&<OfferPopup/>}
  </>;
}
const rootElement=document.getElementById('root');
const reactRoot=window.__eeReactRoot||(window.__eeReactRoot=createRoot(rootElement));
reactRoot.render(<App/>);
