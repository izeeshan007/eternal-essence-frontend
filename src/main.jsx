
import React,{useEffect,useRef,useState,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import ProductPage from './ProductPage';
import JournalPage from './JournalPage';
import OfferPopup from './OfferPopup';
import HomeEnhancements from './HomeEnhancements';
import DealerPage from './DealerPage';
import CartDrawer from './CartDrawer';
import WhatsAppOptIn from './WhatsAppOptIn';
import currentCatalog from "../data/current-catalog.json";
import './legacy.css';
import './app.css';
import './catalog.css';

window.__EE_LOCAL_CATALOG__=currentCatalog;

const LEGACY_ASSET_VERSION='20260831-2';
const LEGACY_SCRIPTS=[
  '/legacy/assets/js/storefront.js',
  '/legacy/assets/js/scent-quiz.js',
  '/legacy/assets/js/order-actions.js'
];

window.eeLoadPdfEngine=async()=>{
  if(window.jspdf?.jsPDF)return window.jspdf;
  const[{jsPDF},{applyPlugin}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
  applyPlugin(jsPDF);
  window.jspdf={...(window.jspdf||{}),jsPDF};
  return window.jspdf;
};

const normalizeBackendBase=value=>String(value||'').trim().replace(/\/+$/,'');
const isLocalFrontend=location.hostname==='localhost'||location.hostname==='127.0.0.1';
// Production API traffic MUST stay same-origin so `/api/*` is always handled
// by the Cloudflare Worker route attached to eternalessence.in/www. This also
// prevents an accidentally stale Cloudflare environment variable from sending
// the browser directly to Railway/Render. Local development continues to use
// the local backend.
const primaryBackendBase=normalizeBackendBase(
  isLocalFrontend
    ? (import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000')
    : location.origin
);
// Railway -> Render failover is handled by the Cloudflare Worker in production.
// Do not install a second browser-side Render failover layer.
const fallbackBackendBase='';
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
  const key='ee_visitor_id',legacyKey='ee_analytics_visitor_v1';
  let id=localStorage.getItem(key)||sessionStorage.getItem(legacyKey);
  if(!id)id=globalThis.crypto?.randomUUID?.()||`ee-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(key,id);sessionStorage.setItem(legacyKey,id);
  return id;
}
function analyticsAttribution(){
  const key='ee_attribution_v1';
  const params=new URLSearchParams(location.search);
  if(params.get('utm_source')){
    const value={source:params.get('utm_source')||'',medium:params.get('utm_medium')||'',campaign:params.get('utm_campaign')||''};
    localStorage.setItem(key,JSON.stringify(value));return value;
  }
  try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}
}
const engagement={pageViews:0,productViews:0,meaningful:false};
function trackAnalytics(eventType,payload={}){
  if(eventType==='page_view')engagement.pageViews+=1;
  if(eventType==='product_view')engagement.productViews+=1;
  if(['add_to_cart','checkout_started','product_view_duration'].includes(eventType))engagement.meaningful=true;
  const eligible=engagement.meaningful||engagement.productViews>=2||engagement.pageViews>=3;
  window.dispatchEvent(new CustomEvent('ee:whatsapp-engagement',{detail:{eventType,eligible}}));
  return fetch(`${backendUrl()}/api/analytics/event`,{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({visitorId:analyticsVisitorId(),eventType,path:location.pathname+location.search,referrer:document.referrer,attribution:analyticsAttribution(),...payload})}).catch(()=>{});
}
window.eeAnalyticsVisitorId=analyticsVisitorId;
window.eeTrackAnalytics=trackAnalytics;
window.eeTrackCommerceEvent=trackAnalytics;
window.eeGetAttribution=analyticsAttribution;
function slugify(value){
  return String(value||'').trim().toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'');
}
function categoryName(product){return String(product?.type||product?.category||'Perfume').trim()||'Perfume';}
function categorySlug(product){
  const category=categoryName(product).toLowerCase();
  if(category.includes('attar'))return 'attars';
  if(category.includes('perfume'))return 'perfumes';
  return slugify(category);
}
function productSlug(product){
  const base=slugify(product?.name||'product');
  return categorySlug(product)==='attars' ? `${base}_attar` : base;
}
function productPath(product){
  return `/products/${categorySlug(product)}/${productSlug(product)}`;
}
function defaultProductSize(product){
  const category=categoryName(product).toLowerCase();
  if(category.includes('perfume'))return '30 ml Gift';
  if(category.includes('attar'))return '3 ml';
  const first=Array.isArray(product?.sizes)?product.sizes[0]:null;
  if(!first)return '';
  return `${first.value??''} ${first.unit??''}`.trim();
}
window.eeDefaultProductSize=defaultProductSize;
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
        const r=await fetch(`/legacy/legacy-body.html?v=${LEGACY_ASSET_VERSION}`);
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
          )
          .replace(
            '<div class="container mx-auto px-6"><h1 class="text-3xl brand-font font-bold">Shopping Cart</h1></div>',
            '<div class="container mx-auto px-6 flex flex-wrap items-center justify-between gap-4"><div><p class="text-[10px] uppercase tracking-[0.22em] text-yellow-700 font-bold mb-2">Your selection</p><h1 class="text-3xl brand-font font-bold">Shopping Cart</h1></div><button type="button" class="ee-cart-continue" onclick="continueShopping()"><i class="fas fa-arrow-left"></i> Continue shopping</button></div>'
          );
        if(cancelled)return;
        ref.current.innerHTML=markup;
        // The legacy shell is fetched asynchronously. Hide catalog-only
        // sections before the browser gets a chance to paint them on `/`.
        // This prevents the collection grid from flashing before the home
        // route finishes booting.
        const initialCollectionRoute=/^\/collections(?:\/|$)/i.test(location.pathname) || location.pathname==='/collection';
        const initialFloatingFilter=ref.current.querySelector('button[onclick="openFloatingFilters()"]');
        if(initialFloatingFilter)initialFloatingFilter.id='catalog-floating-filter';
        if(!initialCollectionRoute){
          ref.current.querySelector('#filter-bar')?.classList.add('ee-catalog-hidden');
          ref.current.querySelector('#collection-section')?.classList.add('ee-catalog-hidden');
          initialFloatingFilter?.classList.add('ee-catalog-hidden');
        }
        const filterBar=ref.current.querySelector('#filter-bar');
        const productGrid=ref.current.querySelector('#product-grid');
        if(filterBar&&productGrid&&!ref.current.querySelector('.ee-catalog-view-toggle')){
          const viewToggle=document.createElement('div');
          viewToggle.className='ee-catalog-view-toggle';
          viewToggle.setAttribute('aria-label','Product grid view');
          viewToggle.innerHTML='<span>VIEW</span><button type="button" data-view="2">2 COL</button><button type="button" data-view="3">3 COL</button><button type="button" data-view="list">LIST</button>';
          const storedView=localStorage.getItem('ee_catalog_view_v1')||'2';
          const setCatalogView=view=>{
            const normalized=['2','3','list'].includes(view)?view:'2';
            productGrid.classList.toggle('ee-catalog-view-3',normalized==='3');
            productGrid.classList.toggle('ee-catalog-view-list',normalized==='list');
            viewToggle.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.view===normalized));
            localStorage.setItem('ee_catalog_view_v1',normalized);
          };
          viewToggle.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>setCatalogView(button.dataset.view)));
          filterBar.appendChild(viewToggle);
          setCatalogView(storedView);
        }
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
        // Load the payment widget only when checkout actually needs it. This
        // keeps Razorpay's iframe and sensor warnings out of normal browsing.
        window.eeLoadRazorpay=window.eeLoadRazorpay||(()=>{
          if(window.Razorpay)return Promise.resolve(window.Razorpay);
          if(window.__eeRazorpayPromise)return window.__eeRazorpayPromise;
          window.__eeRazorpayPromise=add('https://checkout.razorpay.com/v1/checkout.js').then(()=>{
            if(!window.Razorpay)throw new Error('Payment widget did not initialise.');
            return window.Razorpay;
          }).catch(error=>{window.__eeRazorpayPromise=null;throw error});
          return window.__eeRazorpayPromise;
        });
        // Keep source filenames readable; the release query still invalidates
        // CDN/browser caches when one of these compatibility scripts changes.
        for(const path of LEGACY_SCRIPTS){
          const src=`${path}?v=${LEGACY_ASSET_VERSION}`;
          try{await add(src);}catch(e){console.error(`Legacy asset failed to load: ${path}`,e);}
        }
        // Inline handlers in legacy-body.html call these functions by global
        // name. Explicitly expose the legacy menu function for strict/module
        // execution contexts.
        if(typeof window.openMobileMenu==='function') window.openMobileMenu=window.openMobileMenu;
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
            if(product) window.eeNavigateToProduct(product,{size:defaultProductSize(product)});
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
          const raw=String(category||'all').trim();
          const normalized=/attar/i.test(raw)?'Attar':/perfume/i.test(raw)?'Perfume':raw||'all';
          history.pushState({},'',collectionPath(normalized,{}));
          document.getElementById('filter-bar')?.classList.remove('ee-catalog-hidden');
          document.getElementById('collection-section')?.classList.remove('ee-catalog-hidden');
          ['search-input','gender-filter','season-filter','time-filter','sort-filter'].forEach(id=>{const control=document.getElementById(id);if(control)control.value='';});
          window.setCategory?.(normalized,true); safeLegacyApplyFilters(); window.scrollTo(0,0);
          window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:location.pathname+location.search}}));
        };
        const profileButton=document.getElementById('nav-profile-btn');
        if(profileButton&&!profileButton.dataset.eeProfileBound){
          profileButton.addEventListener('click',ev=>{ev.preventDefault();ev.stopImmediatePropagation();const auth=window.EE?.getAuth?.();window.eeNavigatePage?.(auth?.token&&auth?.user?'profile':'account');},true);
          profileButton.dataset.eeProfileBound='1';
        }
        const navCartButton=document.getElementById('cart-count-badge')?.closest('button');
        if(navCartButton&&!navCartButton.dataset.eeMiniCartBound){
          navCartButton.removeAttribute('onclick');
          navCartButton.setAttribute('aria-label','Open cart preview');
          navCartButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();window.dispatchEvent(new Event('ee:mini-cart-open'))});
          navCartButton.dataset.eeMiniCartBound='1';
        }
        const floatingFilter=document.querySelector('button[onclick="openFloatingFilters()"]');
        if(floatingFilter)floatingFilter.id='catalog-floating-filter';
        if(page==='profile' && !window.EE?.getAuth?.()?.token) window.eeNavigatePage?.('account');
        if(page==='account' && window.EE?.getAuth?.()?.token) window.eeNavigatePage?.('profile');
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
  const m=cleanPath.match(/^\/products\/([^/]+)\/([^/]+)\/?$/i);
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
  const segment=parts[1]||'';
  const kind=categoryFromCollectionSegment(segment);
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
function categoryCollectionSegment(category='all'){
  const raw=String(category||'all').trim();
  const lower=raw.toLowerCase();
  if(lower==='all')return '';
  if(lower.includes('attar'))return 'attars';
  if(lower.includes('perfume'))return 'perfumes';
  const base=slugify(raw).replace(/_/g,'-');
  return base.endsWith('s')?base:`${base}s`;
}
function categoryFromCollectionSegment(segment=''){
  const value=String(segment||'').toLowerCase();
  if(!value)return 'all';
  if(value==='attar'||value==='attars')return 'Attar';
  if(value==='perfume'||value==='perfumes')return 'Perfume';
  const products=window.EE?.getProducts?.()||[];
  const match=products.find(product=>categoryCollectionSegment(categoryName(product))===value);
  if(match)return categoryName(match);
  return value.replace(/s$/,'').replace(/[-_]+/g,' ');
}
function collectionPath(category='all',state={}){
  const raw=String(category||state.kind||'all').trim();
  const kind=categoryCollectionSegment(raw);
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

  useEffect(()=>{
    if(!legacyReady)return;
    const visible=isCollection;
    ['filter-bar','collection-section','catalog-floating-filter'].forEach(id=>document.getElementById(id)?.classList.toggle('ee-catalog-hidden',!visible));
  },[legacyReady,isCollection,path]);

  // Once legacy data is ready, refresh product resolution so direct links work.
  useEffect(()=>{ if(legacyReady) setPath(location.pathname+location.search); },[legacyReady]);

  const handleLegacyReady=useCallback(()=>setLegacyReady(true),[]);
  const navigateHome=()=>{
    history.pushState({},'', '/');
    setPath('/');
    window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:'/'}}));
  };
  return <div className="ee-route-view">
    <LegacyShell active={!isDealer} page={isProduct||isJournal?'home':(isCollection?'home':page)} collectionOnly={isCollection} productOnly={isProduct||isJournal||isDealer} onReady={handleLegacyReady}/>
    {!isDealer&&!legacyReady&&<div className="ee-app-boot" role="status" aria-live="polite"><img src="/products/ee-brand-20260819.webp" alt=""/><p>ETERNAL ESSENCE</p><span>Preparing your collection</span></div>}
    {!isProduct && !isJournal && !isCollection && !isDealer && legacyReady && document.getElementById('ee-home-react-mount') &&
      createPortal(<HomeEnhancements/>,document.getElementById('ee-home-react-mount'))}
    {isProduct && (legacyReady ? <ProductPage product={product} route={route} onBack={navigateHome}/> : <div className="ee-loading"><div className="spinner"></div><p>Loading fragrance…</p></div>)}
    {isJournal && (legacyReady ? <JournalPage slug={journalSlug} onBack={navigateHome}/> : <div className="ee-loading"><div className="spinner"></div><p>Loading journal...</p></div>)}
    {isDealer&&<DealerPage backendBase={backendUrl()} legacyReady={legacyReady}/>}
    {!isDealer&&<CartDrawer/>}
    {!isDealer&&<OfferPopup/>}
    {!isDealer&&<WhatsAppOptIn backendBase={backendUrl()} visitorId={analyticsVisitorId()}/>}
  </div>;
}
const rootElement=document.getElementById('root');
const reactRoot=import.meta.hot?.data.reactRoot||createRoot(rootElement);
if(import.meta.hot)import.meta.hot.data.reactRoot=reactRoot;
reactRoot.render(<App/>);
