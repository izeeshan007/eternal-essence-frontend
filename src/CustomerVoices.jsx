import React,{useEffect,useMemo,useState} from 'react';

const backend=()=>window.EE?.getBackendBase?.()||(location.hostname==='localhost'||location.hostname==='127.0.0.1'?'http://localhost:5000':'');
const productId=product=>String(product?.id||product?._id||product?.legacyId||'').replace(/^db_/,'');
const productImage=product=>{
  const source=String(product?.image||product?.images?.[0]||'').split('/').pop();
  return source?`/products/${source.replace(/\.(png|jpe?g)$/i,'.webp')}`:'/products/ee-brand-20260819.webp';
};

export default function CustomerVoices({products=[]}){
  const [page,setPage]=useState(1);
  const [result,setResult]=useState({reviews:[],total:0,pages:0});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    const controller=new AbortController();
    setLoading(true);
    fetch(`${backend()}/api/reviews/latest?page=${page}`,{signal:controller.signal})
      .then(response=>response.ok?response.json():Promise.reject(new Error('Reviews unavailable')))
      .then(data=>{if(active)setResult({reviews:data.reviews||[],total:data.total||0,pages:data.pages||0})})
      .catch(()=>{if(active)setResult({reviews:[],total:0,pages:0})})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false;controller.abort()};
  },[page]);
  const mapped=useMemo(()=>result.reviews.map(review=>({
    ...review,
    product:products.find(item=>productId(item)===String(review.productKey||review.productId||'').replace(/^db_/,''))
  })),[result.reviews,products]);
  const openProduct=product=>{
    if(!product)return;
    if(window.eeNavigateToProduct){
      window.eeNavigateToProduct(product,{size:window.eeDefaultProductSize?.(product)});
      history.replaceState(history.state,'',location.pathname+location.search+'#ee-customer-reviews');
      setTimeout(()=>document.getElementById('ee-customer-reviews')?.scrollIntoView({behavior:'smooth',block:'start'}),350);
      return;
    }
    const category=String(product.type||product.category||'').toLowerCase().includes('attar')?'attars':'perfumes';
    const slug=String(product.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    location.href=`/products/${category}/${slug}${category==='attars'?'_attar':''}#ee-customer-reviews`;
  };
  return <section className="ee-customer-voices" id="customer-stories" aria-labelledby="ee-voices-title">
    <div className="ee-home-section-heading centered"><span>REAL EXPERIENCES</span><h2 id="ee-voices-title">Let customers speak for us.</h2><p>Reviews from delivered Eternal Essence orders. Select a review to explore its fragrance.</p></div>
    {loading?<p className="ee-voices-status">Loading customer reviews…</p>:mapped.length?<>
      <div className="ee-voices-grid">{mapped.map(review=><button type="button" className="ee-voice-card" key={review._id} onClick={()=>openProduct(review.product)} disabled={!review.product} aria-label={`Read ${review.product?.name||'product'} reviews`}>
        <span className="ee-voice-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Math.max(0,Math.min(5,Number(review.rating)||0)))}{'☆'.repeat(5-Math.max(0,Math.min(5,Number(review.rating)||0)))}</span>
        <blockquote>{review.comment}</blockquote>
        <span className="ee-voice-customer">{review.name||'Customer'} <small>{review.createdAt?new Date(review.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}</small></span>
        {review.product&&<span className="ee-voice-product"><img src={productImage(review.product)} alt="" loading="lazy"/><span>{review.product.name}<small>VIEW FRAGRANCE →</small></span></span>}
      </button>)}</div>
      {result.pages>1&&<div className="ee-voices-controls"><button type="button" onClick={()=>setPage(value=>Math.max(1,value-1))} disabled={page===1} aria-label="Previous reviews">←</button><span>{page} / {result.pages}</span><button type="button" onClick={()=>setPage(value=>Math.min(result.pages,value+1))} disabled={page>=result.pages} aria-label="Next reviews">→</button></div>}
    </>:<p className="ee-voices-status">Customer reviews will appear here after verified purchases are reviewed.</p>}
  </section>;
}
