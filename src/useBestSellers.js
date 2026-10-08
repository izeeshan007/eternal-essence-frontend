import { useEffect, useMemo, useRef, useState } from 'react';

const normalizeId = value => String(value || '').replace(/^db_/, '');

export default function useBestSellers(products, fallback = [], limit = 8) {
  const [ids, setIds] = useState([]);
  const [revision,setRevision]=useState(0);
  const retryDelay=useRef(5000);
  useEffect(()=>{const refresh=()=>setRevision(value=>value+1);window.addEventListener('ee:backend-refresh',refresh);return()=>window.removeEventListener('ee:backend-refresh',refresh)},[]);
  useEffect(() => {
    let active=true;
    const controller = new AbortController();
    const timeout=setTimeout(()=>controller.abort(),25000);
    let retryTimer;
    const base = window.__EE_CONFIG__?.BACKEND_BASE_URL || '';
    fetch(`${base}/api/products/best-sellers`, { signal: controller.signal,cache:'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Best sellers unavailable')))
      .then(data => { if(!data.success||!Array.isArray(data.productIds))throw new Error('Best sellers unavailable');if(active){retryDelay.current=5000;setIds(data.productIds)} })
      .catch(() => {if(active){retryTimer=setTimeout(()=>setRevision(value=>value+1),retryDelay.current);retryDelay.current=Math.min(retryDelay.current*2,60000)}})
      .finally(()=>clearTimeout(timeout));
    return () => {active=false;controller.abort();clearTimeout(timeout);clearTimeout(retryTimer)};
  }, [revision]);
  return useMemo(() => {
    const ranked = ids.map(id => products.find(product => normalizeId(product.id || product._id || product.legacyId) === normalizeId(id))).filter(Boolean);
    const seen = new Set(ranked.map(product => normalizeId(product.id || product._id || product.legacyId)));
    const filled = [...ranked, ...fallback.filter(product => !seen.has(normalizeId(product.id || product._id || product.legacyId)))];
    return { products: filled.slice(0, limit), basedOnOrders: ranked.length > 0 };
  }, [products, fallback, ids, limit]);
}
