import React,{useEffect,useState} from 'react';
import catalog from '../data/current-catalog.json';
import {Heart,Eye,ShoppingBag,Search,UserRound,Menu,X,ArrowRight,Star,Camera,Flame,MapPin,Phone,Mail} from 'lucide-react';
import CollectionMenu from './CollectionMenu.jsx';
import { NoteOverlay } from './FragranceNotes.jsx';
import { storefrontSizes, variantPricing } from './productVariants.js';
import { providedReviewsForProduct, providedSummaryForProduct, withProvidedReviews } from './productReviews.js';
import useBestSellers from './useBestSellers.js';

// Keep promotions on the same API origin as the admin dashboard in production.
const promotionApiBase=()=>location.hostname==='localhost'||location.hostname==='127.0.0.1'
  ?(window.EE?.getBackendBase?.()||'http://localhost:5000')
  :location.origin;
const apiBase=()=>window.EE?.getBackendBase?.()||(location.hostname==='localhost'||location.hostname==='127.0.0.1'?'http://localhost:5000':'');
const localProducts=catalog.map(p=>({...p,id:p.legacyId,type:p.category,image:p.images?.[0]}));
const providedSummaries=Object.fromEntries(localProducts.flatMap(product=>{
  const summary=providedSummaryForProduct(product);
  return summary?[[String(product.id).replace(/^db_/,''),summary]]:[];
}));
const slug=value=>String(value||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const productPath=p=>`/products/${String(p.type||p.category||'Perfume').toLowerCase().includes('attar')?'attars':'perfumes'}/${slug(p.name)}${String(p.type||p.category||'').toLowerCase().includes('attar')?'_attar':''}`;
const imageUrl=p=>{let file=String(p?.image||p?.images?.[0]||p?.images?.[6]||'ee-brand-20260819.webp');return /^https?:/i.test(file)?file:`/products/${file.split('/').pop().replace(/\.(png|jpe?g)$/i,'.webp')}`};
const defaultSize=p=>window.eeDefaultProductSize?.(p)||(String(p?.type||p?.category).toLowerCase().includes('attar')?'3 ml':'30 ml');
const displayedPrice=p=>{if(!/perfume/i.test(p?.type||p?.category||''))return Number(p?.price)||0;const sizes=storefrontSizes(p,{},[{value:8,unit:'ml',priceMultiplier:.2985971943887776},{value:20,unit:'ml',priceMultiplier:.6993987},{value:30,unit:'ml',priceMultiplier:1.2},{value:50,unit:'ml',priceMultiplier:1.601},{value:100,unit:'ml',priceMultiplier:2.6032}]);const selected=sizes.find(size=>Number(size.value)===30)||sizes[0];return selected?variantPricing(p.price,selected.priceMultiplier,selected.mrp,selected.websitePrice).selling:Number(p.price)||0};
function navigateProduct(p,hash='') {const path=productPath(p)+hash; history.pushState({},'',path);window.dispatchEvent(new CustomEvent('ee:route',{detail:{path}}));window.scrollTo(0,0);if(hash)setTimeout(()=>document.querySelector(hash)?.scrollIntoView({behavior:'smooth'}),350)}
function useProducts(){const [products,setProducts]=useState(localProducts);useEffect(()=>{const update=()=>{const list=window.EE?.getProducts?.();if(Array.isArray(list))setProducts(list)};update();window.addEventListener('ee:ready',update);window.addEventListener('ee:catalog-updated',update);return()=>{window.removeEventListener('ee:ready',update);window.removeEventListener('ee:catalog-updated',update)}},[]);return products}
let reviewPromise;
let reviewRetries=0;
function combinedSummaries(remote={},includesProvided=false){
  const merged={...providedSummaries};
  for(const [key,summary] of Object.entries(remote)){
    const provided=providedSummaries[key];
    if(!provided){merged[key]=summary;continue}
    // A running API may still have an older review bundle during a frontend
    // rollout. Never let that stale summary hide newer supplied reviews.
    if(includesProvided){merged[key]=Number(summary.count||0)<provided.count?provided:summary;continue}
    const count=Number(summary.count||0)+provided.count;
    merged[key]={count,average:Math.round((Number(summary.average||0)*Number(summary.count||0)+provided.average*provided.count)/count*10)/10};
  }
  return merged;
}
function loadSummaries(){if(!reviewPromise)reviewPromise=fetch(`${apiBase()}/api/reviews/summary`).then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(!data?.success)throw new Error('Review summaries unavailable');window.__EE_REVIEW_SUMMARIES__=combinedSummaries(data.summaries||{},data.providedReviewsIncluded===true);window.__EE_REVIEW_SUMMARY_STATUS__='ready';window.dispatchEvent(new Event('ee:review-summaries'));return window.__EE_REVIEW_SUMMARIES__}).catch(()=>{window.__EE_REVIEW_SUMMARIES__={...providedSummaries};window.__EE_REVIEW_SUMMARY_STATUS__='unavailable';window.dispatchEvent(new Event('ee:review-summaries'));reviewPromise=null;if(reviewRetries++<2)setTimeout(loadSummaries,5000);return providedSummaries});return reviewPromise}
function currentSummary(remote,product){const provided=providedSummaryForProduct(product);return !remote||Number(remote.count||0)<Number(provided?.count||0)?provided||remote:remote}
function fillLegacyReviews(){const summaries=window.__EE_REVIEW_SUMMARIES__||{};const unavailable=window.__EE_REVIEW_SUMMARY_STATUS__==='unavailable';document.querySelectorAll('.ee-card-review').forEach(node=>{const productName=node.closest('.product-card')?.querySelector('h3')?.textContent;const review=currentSummary(summaries[node.dataset.reviewKey],productName);node.innerHTML=review?.count?`<strong>${Number(review.average).toFixed(1)} ★</strong> ${Number(review.count)} review${Number(review.count)===1?'':'s'}`:unavailable?'Ratings unavailable':'No reviews yet';node.setAttribute('aria-label',review?.count?`${Number(review.average).toFixed(1)} out of 5 from ${Number(review.count)} customer reviews. Read reviews`:unavailable?'Ratings unavailable. View product':'No reviews yet. View product')})}
function useSummaries(){const [summaries,setSummaries]=useState(window.__EE_REVIEW_SUMMARIES__||{});useEffect(()=>{let active=true;const sync=()=>{fillLegacyReviews();if(active)setSummaries({...window.__EE_REVIEW_SUMMARIES__})};loadSummaries().then(sync);window.addEventListener('ee:catalog-cards-rendered',fillLegacyReviews);window.addEventListener('ee:review-summaries',sync);fillLegacyReviews();return()=>{active=false;window.removeEventListener('ee:catalog-cards-rendered',fillLegacyReviews);window.removeEventListener('ee:review-summaries',sync)}},[]);return summaries}
function ReviewStars({product,summaries,onClick}){const id=String(product.id||product._id||product.legacyId||'').replace(/^db_/,'');const review=currentSummary(summaries[id],product);const unavailable=window.__EE_REVIEW_SUMMARY_STATUS__==='unavailable';return <button className="ee-tile-rating" type="button" onClick={onClick} aria-label={review?.count?`${review.average} out of 5 from ${review.count} reviews. Read reviews`:unavailable?'Ratings unavailable. View product':'No reviews yet. View product'}>{review?.count?<><strong>{Number(review.average).toFixed(1)} <Star size={12} fill="currentColor"/></strong><span>{review.count} review{review.count===1?'':'s'}</span></>:<span>{unavailable?'Ratings unavailable':'No reviews yet'}</span>}</button>}
export function ProductTile({product,summaries:provided}){
  const live=useSummaries();const summaries=provided||live;const [preview,setPreview]=useState(false),[quickReviews,setQuickReviews]=useState(()=>providedReviewsForProduct(product)),[wish,setWish]=useState(()=>Boolean(window.EE?.isWishlistSaved?.(product?.id||product?._id,defaultSize(product))));
  useEffect(()=>{const sync=()=>setWish(Boolean(window.EE?.isWishlistSaved?.(product?.id||product?._id,defaultSize(product))));sync();window.addEventListener('ee:ready',sync);window.addEventListener('ee:wishlist-updated',sync);return()=>{window.removeEventListener('ee:ready',sync);window.removeEventListener('ee:wishlist-updated',sync)}},[product?.id,product?._id,product?.name]);
  useEffect(()=>{if(!preview)return;let active=true;setQuickReviews(providedReviewsForProduct(product));Promise.resolve().then(()=>window.EE?.getReviews?.(product.id||product._id)).then(data=>{if(active&&Array.isArray(data?.reviews))setQuickReviews(withProvidedReviews(data.reviews,product))}).catch(()=>{if(active)setQuickReviews(providedReviewsForProduct(product))});return()=>{active=false}},[preview,product?.id,product?._id,product?.name]);
  if(!product)return null;
  const size=defaultSize(product),price=displayedPrice(product),reviewKey=String(product.id||product._id||product.legacyId||'').replace(/^db_/,''),reviewSummary=currentSummary(summaries[reviewKey],product),topReview=quickReviews.filter(review=>String(review.comment||review.review||review.text||'').trim()).sort((a,b)=>Number(b.rating||0)-Number(a.rating||0))[0];
  const quickAdd=()=>{if(!window.quickAddProduct){navigateProduct(product);return}window.quickAddProduct(product.id)};
  const toggleWish=async()=>{if(!window.EE?.getAuth?.()?.token){location.href='/account';return}window.EE.setSelection(product,size,price);const ok=await window.EE.toggleWishlist();if(ok){const next=Boolean(window.EE?.isWishlistSaved?.(product.id||product._id,size));setWish(next);window.dispatchEvent(new Event('ee:wishlist-updated'))}};
  return <article className="ee-shop-card"><div className="ee-shop-photo"><button className="ee-shop-image" type="button" onClick={()=>navigateProduct(product)}><img src={imageUrl(product)} alt={product.name} loading="lazy" onError={e=>{e.currentTarget.src='/products/ee-brand-20260819.webp'}}/></button><button className={`ee-shop-wish ${wish?'saved':''}`} type="button" aria-label={wish?'Remove from wishlist':'Add to wishlist'} onClick={toggleWish}><Heart size={19} fill={wish?'currentColor':'none'}/></button><div className="ee-shop-quick-actions"><button className="ee-shop-view" type="button" aria-label={`Quick view ${product.name}`} title="Quick view" onClick={()=>setPreview(true)}><Eye size={19}/></button><button className="ee-shop-add" type="button" aria-label={`Quick add ${product.name} to cart`} title="Quick add to cart" onClick={quickAdd}><ShoppingBag size={19}/></button></div></div><div className="ee-shop-copy"><small>{product.family||product.type||'ETERNAL ESSENCE'}</small><button type="button" onClick={()=>navigateProduct(product)}>{product.name}</button><ReviewStars product={product} summaries={summaries} onClick={()=>navigateProduct(product,'#ee-customer-reviews')}/><strong>₹{price.toLocaleString('en-IN')}</strong></div>{preview&&<div className="ee-quick-overlay" role="presentation" onMouseDown={()=>setPreview(false)}><div className="ee-quick-panel" role="dialog" aria-modal="true" aria-label={`Quick view ${product.name}`} onMouseDown={e=>e.stopPropagation()}><button type="button" className="ee-quick-close" onClick={()=>setPreview(false)} aria-label="Close quick view"><X size={20}/></button><div className="ee-quick-photo"><img src={imageUrl(product)} alt={product.name}/><NoteOverlay product={product} all/></div><div className="ee-quick-details"><small>ETERNAL ESSENCE · {product.type||product.category}</small><h2>{product.name}</h2>{reviewSummary?.count>0&&<div className="ee-quick-rating"><b>{Number(reviewSummary.average).toFixed(1)} <Star size={13} fill="currentColor"/></b><span>{reviewSummary.count} customer review{reviewSummary.count===1?'':'s'}</span></div>}{topReview&&<blockquote className="ee-quick-top-review"><span>TOP CUSTOMER REVIEW · {'★'.repeat(Math.min(5,Math.max(1,Number(topReview.rating)||5)))}</span><p>“{String(topReview.comment||topReview.review||topReview.text).trim()}”</p><small>{topReview.verifiedPurchase===false||topReview.source==='store-provided'?'Shared by store':'Verified purchase'}</small></blockquote>}<p className="ee-quick-description">{product.description||product.family||'Explore this fragrance and its notes.'}</p><strong>₹{price.toLocaleString('en-IN')}</strong><button type="button" onClick={quickAdd}>Add to cart</button><button type="button" onClick={()=>{setPreview(false);navigateProduct(product)}}>View full details <ArrowRight size={15}/></button></div></div></div>}</article>
}
const footerShop=[['All fragrances','/collections'],['Perfumes','/collections/perfumes'],['Attars','/collections/attars'],['Bakhoors','/collections/bakhoors'],['Hot selling','/collections/hot-selling'],['For him','/collections/perfumes/for-him'],['For her','/collections/perfumes/for-her'],['Unisex','/collections/perfumes/unisex']];
const footerDiscover=[['Create a custom set','/custom-set'],['Perfume cards','/perfume-card'],['Our story','/pages/about-us'],['Fragrance journal','/journal/reading-a-fragrance'],['Happy customers','/pages/happy-customers']];
const footerSupport=[['My orders','/orders'],['Track your order','/pages/track-your-order'],['Shipping policy','/pages/shipping-policy'],['Returns & refunds','/pages/return-refund-policy'],['Contact us','/contact']];
function OfferRibbon(){
  const [promotion,setPromotion]=useState({offers:[],coupons:[]});
  useEffect(()=>{
    let active=true;
    let controller;
    const refresh=()=>{
      controller?.abort();
      controller=new AbortController();
      const requestController=controller;
      // The API sends no-store response headers. Do not add Cache-Control to
      // this cross-origin GET: the local API CORS allow-list intentionally
      // permits only Content-Type and Authorization request headers.
      fetch(`${promotionApiBase()}/api/offers/active`,{signal:requestController.signal,cache:'no-store'})
        .then(r=>r.ok?r.json():Promise.reject(new Error(`Offer request failed (${r.status})`)))
        .then(data=>{
          if(!active||!data.success)return;
          setPromotion({offers:Array.isArray(data.offers)?data.offers:[],coupons:Array.isArray(data.coupons)?data.coupons:[]});
        })
        .catch(error=>{if(active&&!requestController.signal.aborted)console.warn('Could not load ribbon promotions:',error.message)});
    };
    const refreshOnReturn=()=>{if(document.visibilityState==='visible')refresh()};
    refresh();
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refreshOnReturn);
    return()=>{active=false;controller?.abort();window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refreshOnReturn)};
  },[]);
  const discountText=(type,value)=>type==='percentage'?`${Number(value)||0}% OFF`:`₹${(Number(value)||0).toLocaleString('en-IN')} OFF`;
  const firstOrderCoupons=promotion.coupons.filter(coupon=>coupon.firstTimeOnly);
  const otherCoupons=promotion.coupons.filter(coupon=>!coupon.firstTimeOnly);
  const items=[
    ...[...firstOrderCoupons,...otherCoupons].map(coupon=>({
      eyebrow:coupon.firstTimeOnly?'WELCOME OFFER':'EXCLUSIVE OFFER',
      title:coupon.firstTimeOnly?'For your first order':discountText(coupon.discountType,coupon.discountValue),
      detail:coupon.firstTimeOnly?`${discountText(coupon.discountType,coupon.discountValue)}${Number(coupon.minOrderValue)>0?` on orders ₹${Number(coupon.minOrderValue).toLocaleString('en-IN')}+`:''}`:Number(coupon.minOrderValue)>0?`On orders ₹${Number(coupon.minOrderValue).toLocaleString('en-IN')}+`:'On your order',
      code:coupon.code
    })),
    ...promotion.offers.map(offer=>({
      eyebrow:'CURATED OFFER',
      title:offer.name,
      detail:`${offer.offerType==='buy_x_get_y'?`Buy ${offer.requiredQuantity}, get ${offer.freeQuantity}`:discountText(offer.offerType,offer.discountValue)}${Number(offer.minCartValue)>0?` · ₹${Number(offer.minCartValue).toLocaleString('en-IN')}+`:''}`,
      code:offer.code
    }))
  ];
  const visibleItems=items.length?items:[{eyebrow:'ETERNAL ESSENCE',title:'Discover your signature scent',detail:'',code:''}];
  const loopItems=visibleItems.length===1?[...visibleItems,...visibleItems]:visibleItems;
  return <div className="ee-offer-ribbon" aria-label={items.length?'Current offers and coupons':'Eternal Essence'}>
    <div className="ee-offer-track">{[0,1].map(repetition=><div className="ee-offer-group" key={repetition} aria-hidden={repetition===1?'true':undefined}>{loopItems.map((item,index)=><div className={`ee-offer-entry ${item.eyebrow==='WELCOME OFFER'?'ee-offer-entry-welcome':''}`} key={`${item.code||item.title}-${index}`}><span className="ee-offer-sparkle" aria-hidden="true">✦</span><span className="ee-offer-eyebrow">{item.eyebrow}</span><strong>{item.title}</strong>{item.detail&&<span className="ee-offer-detail">{item.detail}</span>}{item.code&&<span className="ee-offer-code">CODE {item.code}</span>}</div>)}</div>)}</div>
  </div>;
}
export default function StorefrontChrome(){
  useSummaries();
  const products=useProducts();
  const [menuOpen,setMenuOpen]=useState(false),[query,setQuery]=useState('');
  const [path,setPath]=useState(location.pathname);
  useEffect(()=>{const sync=()=>setPath(location.pathname);window.addEventListener('ee:route',sync);window.addEventListener('popstate',sync);return()=>{window.removeEventListener('ee:route',sync);window.removeEventListener('popstate',sync)}},[]);
  const submit=e=>{e.preventDefault();location.href=`/collections?search=${encodeURIComponent(query.trim())}`};
  const navigation=[['OUR STORY','/pages/about-us'],['CUSTOM SET','/custom-set'],['PERFUME CARDS','/perfume-card'],['CONTACT','/contact'],['MY ORDERS','/orders'],['HOT SELLING','/collections/hot-selling']];
  const hasCategory=pattern=>products.some(product=>pattern.test(String(product.type||product.category||'')));
  const shopLinks=[...footerShop.slice(0,4),
    ...(hasCategory(/agarbatti|incense/i)?[['Incense & agarbatti','/collections/agarbatti-incense-sticks']]:[]),
    ...(hasCategory(/miniature/i)?[['Miniatures','/collections/miniatures']]:[]),
    ...footerShop.slice(4)];
  const isHome=path==='/'||path==='';
  return <>
    <header className="ee-shop-header"><div className="ee-shop-nav">
      <a className="ee-shop-brand" href="/"><img src="/products/ee-brand-20260819.webp" alt=""/><span>ETERNAL <b>ESSENCE</b></span></a>
      <nav className={menuOpen?'open':''} aria-label="Main menu"><CollectionMenu closeMobile={()=>setMenuOpen(false)}/>{navigation.map(([label,href])=><a className={path===href?'active':''} href={href} key={href} onClick={()=>setMenuOpen(false)}>{href==='/collections/hot-selling'&&<Flame size={15} aria-hidden="true"/>}{label}</a>)}<form className="ee-mobile-search" onSubmit={submit}><input aria-label="Search fragrances" placeholder="Search anything on Eternal Essence" value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit" aria-label="Search"><Search size={19}/><span>SEARCH</span></button></form></nav>
      <div className="ee-shop-tools"><form onSubmit={submit}><input aria-label="Search fragrances" placeholder="Search fragrances" value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit" aria-label="Search"><Search size={20}/></button></form><a href="https://www.instagram.com/eternal_essense/" target="_blank" rel="noopener noreferrer" aria-label="Eternal Essence on Instagram"><Camera size={21}/></a><a href="/account" aria-label="Account"><UserRound size={21}/></a><a href="/profile" aria-label="Wishlist"><Heart size={21}/></a><button type="button" aria-label="Open cart" onClick={()=>window.dispatchEvent(new Event('ee:mini-cart-open'))}><ShoppingBag size={21}/></button><button className="ee-shop-menu-toggle" type="button" aria-label={menuOpen?'Close menu':'Open menu'} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X size={21}/>:<Menu size={21}/>}</button></div>
    </div></header>{isHome&&<OfferRibbon/>}
    <div className="ee-shop-footer-wrap"><footer className="ee-shop-footer" aria-label="Eternal Essence footer">
      <div className="ee-footer-feature"><div><span className="ee-footer-kicker">THE ETERNAL ESSENCE COLLECTION</span><h2>Find your next signature.</h2><p>From expressive perfumes to concentrated attars and fragrant bakhoors, discover the scent that stays with you.</p></div><div className="ee-footer-feature-actions"><a href="/collections">EXPLORE ALL PRODUCTS <ArrowRight size={17}/></a><a href="/custom-set">CREATE A CUSTOM SET <ArrowRight size={17}/></a></div></div>
      <div className="ee-footer-grid">
        <div className="ee-footer-brand-column"><a className="ee-footer-brand" href="/" aria-label="Eternal Essence home"><img src="/products/ee-brand-20260819.webp" alt=""/><span>ETERNAL<br/><b>ESSENCE</b></span></a><p>Essence, redefined. Perfumes, attars and bakhoors from Byculla, Mumbai.</p><a className="ee-footer-instagram" href="https://www.instagram.com/eternal_essense/" target="_blank" rel="noopener noreferrer"><Camera size={17}/> Follow @eternal_essense <ArrowRight size={14}/></a></div>
        <nav aria-label="Shop collections"><h3>Shop collections</h3>{shopLinks.map(([label,href])=><a key={href} href={href}>{label}</a>)}</nav>
        <nav aria-label="Explore Eternal Essence"><h3>Discover more</h3>{footerDiscover.map(([label,href])=><a key={href} href={href}>{label}</a>)}</nav>
        <div className="ee-footer-support"><nav aria-label="Customer care"><h3>Customer care</h3>{footerSupport.map(([label,href])=><a key={href} href={href}>{label}</a>)}</nav><div className="ee-footer-contact"><a href="tel:+917303862657"><Phone size={15}/> +91 73038 62657</a><a href="mailto:eternalessencefragrances@gmail.com"><Mail size={15}/> eternalessencefragrances@gmail.com</a><span><MapPin size={15}/> Byculla, Mumbai, India</span></div></div>
      </div>
      <div className="ee-footer-bottom"><span>© {new Date().getFullYear()} Eternal Essence · Byculla, Mumbai.</span><div><a href="/pages/privacy-policy">Privacy policy</a><a href="/pages/terms-conditions">Terms & conditions</a></div></div>
    </footer></div>
  </>;
}
export function HotSelling(){const products=useProducts(),summaries=useSummaries();const preferred=['Aventus','Eternal White','Cool Essence','Divine Essence','Al Wadi','Titanium','Purple OUD','Golden Flora'];const fallback=preferred.map(name=>products.find(p=>p.name?.toLowerCase()===name.toLowerCase()&&String(p.type||p.category).toLowerCase()==='perfume')||products.find(p=>p.name?.toLowerCase()===name.toLowerCase())).filter(Boolean);const {products:selected,basedOnOrders}=useBestSellers(products,fallback,16);return <main className="ee-hot-page"><div><span>THE ETERNAL EDIT</span><h1>Hot Selling</h1><p>{basedOnOrders?'Our most ordered fragrances, ranked by customer purchases.':'Explore signature scents from the current collection.'}</p></div><div className="ee-featured-grid">{selected.map((p,index)=><ProductTile key={p.id||index} product={p} summaries={summaries}/>)}</div></main>}
const support=<><a href="mailto:eternalessencefragrances@gmail.com">eternalessencefragrances@gmail.com</a> or <a href="tel:+917303862657">+91 73038 62657</a></>;
export function InfoPage({slug}){const products=useProducts(),summaries=useSummaries();const content={
  'about-us':['About Us',<><p>Eternal Essence brings together perfumes and attars designed around distinct notes, moods and moments. Explore the fragrance profile, sizes and customer experiences before choosing a scent.</p><p>We are based in Byculla, Mumbai. For product or order help, contact {support}.</p></>],
  'shipping-policy':['Shipping Policy',<><p>We ship orders within India. Shipping charges and the available delivery estimate are shown during checkout, based on the destination and order.</p><p>Once your order has been placed, use your order page for updates. For delivery questions, contact {support} with your order number.</p></>],
  'return-refund-policy':['Return & Refund Policy',<><p>If an item arrives broken or damaged, contact customer support as soon as possible with your order number and clear photos of the item and packaging. We will review the issue and help arrange an appropriate replacement or refund.</p><p>For assistance, contact {support}. Keep the packaging until your request is reviewed. This policy does not limit any rights you may have under applicable law.</p></>],
  'privacy-policy':['Privacy Policy',<><p>We use the information you provide to process orders, deliver products, provide account and customer support, and communicate about your purchases. Payment processing and delivery may involve service providers needed to complete your order.</p><p>For questions about personal information or requests concerning your account, contact {support}.</p></>],
  'terms-conditions':['Terms & Conditions',<><p>Product information, availability and prices are displayed on each product page and at checkout. Orders are subject to confirmation and stock availability. Please review the item, size, shipping details and total before placing an order.</p><p>For order support or questions about these terms, contact {support}.</p></>],
  'track-your-order':['Track Your Order',<><p>Order as a guest with your email. To see your order history later, verify that same email on the Orders page. No account is needed to place an online order.</p><p><a className="ee-info-cta" href="/orders">View my orders <ArrowRight size={16}/></a></p><p>Need help? Contact {support} with your order number.</p></>],
  'happy-customers':['Happy Customers',<><p>Read fragrance feedback on each product page. Reviews from delivered purchases are marked Verified purchase.</p><div className="ee-featured-grid">{products.filter(p=>summaries[String(p.id||p.legacyId).replace(/^db_/,'')]?.count).slice(0,4).map(p=><ProductTile key={p.id} product={p} summaries={summaries}/>)}</div>{!Object.keys(summaries).length&&<p>Customer experiences will appear as reviews are published.</p>}</>]
};const [title,body]=content[slug]||['Information',<p>Contact {support} for help.</p>];return <main className="ee-info-page"><a href="/">Home</a><span> / {title}</span><h1>{title}</h1><div>{body}</div></main>}
