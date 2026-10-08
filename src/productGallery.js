const PERFUME_IMAGE_SIZES = ['8ml', '20ml', '30ml', '50ml', '100ml', '30mlgift', '50mlgift', '100mlgift'];

export function isNotesImage(image) {
  return /_notes\.(?:webp|png)(?:[?#].*)?$/i.test(String(image || ''));
}
export function withNotesImage(product, availableFiles = []) {
  const images = [...(Array.isArray(product?.images) && product.images.length
    ? product.images : [product?.image].filter(Boolean))];
  const category = String(product?.type || product?.category || 'Perfume').toLowerCase();
  // Avoid attaching perfume posters to identically named attars.
  if (!category.includes('perfume')) return images;
  const slug = String(product?.name || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const filename = availableFiles.find(file => file.toLowerCase() === slug + '_notes.webp')
    || availableFiles.find(file => file.toLowerCase() === slug + '_notes.png');
  if (!filename || images.some(image => String(image || '').split(/[?#]/)[0].split('/').pop()?.toLowerCase() === filename.toLowerCase())) return images;
  // Slots 1–8 belong to sizes throughout the storefront and cart integration.
  while (images.length < 9) images.push(null);
  images.push(filename);
  return images;
}

export function visibleGalleryIndices(product, sizes = [], availableFiles = []) {
  const sources = Array.isArray(product?.images) && product.images.length
    ? product.images : [product?.image].filter(Boolean);
  const available = new Set(availableFiles.map(file => String(file).toLowerCase()));
  const images = sources.map(image => {
    if (!image || !available.size || /^https?:\/\//i.test(String(image))) return image;
    const file = String(image).split(/[?#]/)[0].split('/').pop().toLowerCase();
    return available.has(file) || available.has(file.replace(/\.(png|jpe?g)$/i, '.webp')) ? image : null;
  });
  const category = String(product?.type || product?.category || '').toLowerCase();
  if (!category.includes('perfume')) return images.flatMap((image, index) => image ? [index] : []);
  // When the server has hidden every regular size, the cover can remain but
  // size-specific gallery slots must not be exposed.
  if (!sizes.length) return images.flatMap((image, index) => {
    if (!image) return [];
    const allSizesHidden = Array.isArray(product?.sizes) && product.sizes.length;
    return !allSizesHidden || index === 0 || index > 8 || isNotesImage(image) ? [index] : [];
  });
  const visible = new Set(sizes.filter(size => size?.isStorefrontVisible !== false)
    .map(size => `${Number(size.value)}${String(size.unit || '').toLowerCase().replace(/\s+/g, '')}`));
  return images.flatMap((image, index) => {
    if (!image) return [];
    const variant = PERFUME_IMAGE_SIZES[index - 1];
    // The old unboxed 30/50/100 ml images are retired. Their gift-photo slots
    // are the standard presentation and follow the plain size visibility.
    if (index >= 3 && index <= 5) return [];
    const soldVariant = index >= 6 && index <= 8 ? variant.replace(/gift$/, '') : variant;
    return isNotesImage(image) || !variant || visible.has(soldVariant) ? [index] : [];
  });
}
