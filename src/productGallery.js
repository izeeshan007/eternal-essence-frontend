const PERFUME_IMAGE_SIZES = ['8ml', '20ml', '30ml', '50ml', '100ml', '30mlgift', '50mlgift', '100mlgift'];

export function visibleGalleryIndices(product, sizes = []) {
  const images = Array.isArray(product?.images) && product.images.length
    ? product.images : [product?.image].filter(Boolean);
  const category = String(product?.type || product?.category || '').toLowerCase();
  if (!category.includes('perfume')) return images.map((_, index) => index);
  // When the server has hidden every regular size, the cover can remain but
  // size-specific gallery slots must not be exposed.
  if (!sizes.length) return Array.isArray(product?.sizes) && product.sizes.length
    ? images.length ? [0] : []
    : images.map((_, index) => index);
  const visible = new Set(sizes.filter(size => size?.isStorefrontVisible !== false)
    .map(size => `${Number(size.value)}${String(size.unit || '').toLowerCase().replace(/\s+/g, '')}`));
  return images.flatMap((image, index) => {
    if (!image) return [];
    const variant = PERFUME_IMAGE_SIZES[index - 1];
    return !variant || visible.has(variant) ? [index] : [];
  });
}
