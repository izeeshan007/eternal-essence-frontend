import { useEffect, useMemo, useState } from 'react';

const normalizeId = value => String(value || '').replace(/^db_/, '');

export default function useBestSellers(products, fallback = [], limit = 8) {
  const [ids, setIds] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    const base = window.__EE_CONFIG__?.BACKEND_BASE_URL || '';
    fetch(`${base}/api/products/best-sellers`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => { if (data.success && Array.isArray(data.productIds)) setIds(data.productIds); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return useMemo(() => {
    const ranked = ids.map(id => products.find(product => normalizeId(product.id || product._id || product.legacyId) === normalizeId(id))).filter(Boolean);
    const seen = new Set(ranked.map(product => normalizeId(product.id || product._id || product.legacyId)));
    const filled = [...ranked, ...fallback.filter(product => !seen.has(normalizeId(product.id || product._id || product.legacyId)))];
    return { products: filled.slice(0, limit), basedOnOrders: ranked.length > 0 };
  }, [products, fallback, ids, limit]);
}
