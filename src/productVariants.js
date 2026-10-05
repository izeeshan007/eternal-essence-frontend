// Keep all variants in the API; only the regular product selector filters them.
export function variantKey(size) {
  return `${Number(size?.value)}${String(size?.unit || '').toLowerCase().replace(/\s+/g, '')}`;
}

export function storefrontSizes(product, liveRows = {}, fallback = []) {
  const supplied = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : fallback;
  const perfume = /perfume/i.test(product?.category || product?.type || '');
  const giftFactors = { 30: 1.2, 50: 1.601, 100: 2.6032 };
  const retiredFactors = { 30: 1, 50: 1.4008, 100: 2.4028 };
  const normalized = perfume ? supplied.filter(size => ![30,50,100].includes(Number(size.value)) || /gift/i.test(size.unit || '') || !supplied.some(other => Number(other.value) === Number(size.value) && /gift/i.test(other.unit || '')))
    .map(size => {
      if (![30,50,100].includes(Number(size.value))) return size;
      const retired = Number(size.priceMultiplier) === retiredFactors[Number(size.value)];
      return { ...size, unit: 'ml', priceMultiplier: retired ? giftFactors[Number(size.value)] : size.priceMultiplier,
        websitePrice: retired ? undefined : size.websitePrice };
    }) : supplied;
  return normalized.map(size => {
    const row = liveRows.shared || (perfume && [30,50,100].includes(Number(size.value)) ? liveRows[`${size.value}mlgift`] : null) || liveRows[variantKey(size)];
    if (!row) return size;
    const factor = Number(row.priceMultiplier) > 0 ? Number(row.priceMultiplier) : Number(size.priceMultiplier || 1);
    const base = Number(row.basePrice) > 0 ? Number(row.basePrice) : Number(product.price || 0);
    return { ...size, priceMultiplier: factor,
      websitePrice: Number(row.websitePrice) > 0 ? Number(row.websitePrice) : Math.round(base * factor),
      mrp: Number(row.mrp) > 0 ? Number(row.mrp) : size.mrp,
      isStorefrontVisible: typeof row.isStorefrontVisible === 'boolean' ? row.isStorefrontVisible : size.isStorefrontVisible
    };
  }).filter(size => size.isStorefrontVisible !== false);
}

export function variantPricing(base, factor = 1, explicitMrp = 0, websitePrice = 0) {
  const selling = Number(websitePrice) > 0 ? Number(websitePrice) : Math.round(Number(base || 0) * Number(factor || 1));
  const mrp = Math.max(selling, Number(explicitMrp) > 0 ? Number(explicitMrp) : Math.ceil(selling * 1.35 / 100) * 100 - 1);
  return { selling, mrp, discount: mrp ? Math.round((mrp - selling) / mrp * 100) : 0 };
}
