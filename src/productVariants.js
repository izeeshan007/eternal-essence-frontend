// Keep all variants in the API; only the regular product selector filters them.
export function variantKey(size) {
  return `${Number(size?.value)}${String(size?.unit || '').toLowerCase().replace(/\s+/g, '')}`;
}

export function storefrontSizes(product, liveRows = {}, fallback = []) {
  const supplied = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : fallback;
  return supplied.map(size => {
    const row = liveRows.shared || liveRows[variantKey(size)];
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
