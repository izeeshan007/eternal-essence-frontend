const normalize = value => String(value ?? '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

const inspirationAliases = value => String(value ?? '')
  .replace(/\bLV\b/gi, 'Louis Vuitton LV')
  .replace(/\bMFK\b/gi, 'Maison Francis Kurkdjian MFK')
  .replace(/\bTF\b/gi, 'Tom Ford TF');

const splitNotes = value => Array.isArray(value) ? value.flatMap(splitNotes) : String(value ?? '').split(/[,;/]+/).map(part => part.trim()).filter(Boolean);
const productNotes = product => [product.notes?.top ?? product.top, product.notes?.mid ?? product.mid ?? product.heart, product.notes?.base ?? product.base].flatMap(splitNotes);
const matches = (haystack, tokens) => tokens.every(token => haystack.includes(token));

export const sitePages = [
  {title:'All products',subtitle:'Explore the full collection',href:'/collections',terms:'shop fragrances perfume attar bakhoor collection'},
  {title:'Perfumes',subtitle:'The perfume collection',href:'/collections/perfumes',terms:'fragrances scents eau de parfum'},
  {title:'Attars',subtitle:'Concentrated fragrance oils',href:'/collections/attars',terms:'attar perfume oil'},
  {title:'Bakhoors',subtitle:'Fragrance for your space',href:'/collections/bakhoors',terms:'bakhoor incense oud home fragrance'},
  {title:'Hot selling',subtitle:'Customer favourites',href:'/collections/hot-selling',terms:'best sellers popular trending'},
  {title:'For him',subtitle:'Shop perfumes',href:'/collections/perfumes/for-him',terms:'men male masculine'},
  {title:'For her',subtitle:'Shop perfumes',href:'/collections/perfumes/for-her',terms:'women female feminine'},
  {title:'Custom set',subtitle:'Build your own fragrance set',href:'/custom-set',terms:'create gift set bundle'},
  {title:'Perfume cards',subtitle:'Discover the cards',href:'/perfume-card',terms:'gift card fragrance card'},
  {title:'Our story',subtitle:'About Eternal Essence',href:'/pages/about-us',terms:'about us brand byculla mumbai'},
  {title:'Fragrance journal',subtitle:'Explore fragrance stories',href:'/journal/reading-a-fragrance',terms:'blog learn notes'},
  {title:'Happy customers',subtitle:'Customer experiences',href:'/pages/happy-customers',terms:'reviews ratings testimonials'},
  {title:'My orders',subtitle:'See your purchases',href:'/orders',terms:'order history account'},
  {title:'Track your order',subtitle:'Delivery updates',href:'/pages/track-your-order',terms:'tracking shipment delivery'},
  {title:'Shipping policy',subtitle:'Delivery information',href:'/pages/shipping-policy',terms:'shipping delivery charges'},
  {title:'Returns & refunds',subtitle:'Return information',href:'/pages/return-refund-policy',terms:'return refund exchange damaged'},
  {title:'Contact us',subtitle:'Get in touch',href:'/contact',terms:'help support phone email'},
  {title:'Privacy policy',subtitle:'How we use your information',href:'/pages/privacy-policy',terms:'privacy data'},
  {title:'Terms & conditions',subtitle:'Store terms',href:'/pages/terms-conditions',terms:'conditions policy'}
];

export function searchProducts(products, query) {
  const phrase = normalize(query);
  if (!phrase) return [];
  const tokens = phrase.split(' ');
  return products.flatMap(product => {
    if (product.isActive === false || product.active === false) return [];
    const name = normalize(product.name);
    const inspiration = normalize(inspirationAliases(product.inspiredBy));
    const notes = productNotes(product);
    const noteText = normalize(notes.join(' '));
    const accords = normalize(Array.isArray(product.accords) ? product.accords.join(' ') : product.accords);
    const details = normalize([product.family, product.type, product.category, product.gender, product.season, product.time, product.description].join(' '));
    const fullText = [name, inspiration, noteText, accords, details].join(' ');
    if (!matches(fullText, tokens)) return [];
    let score = 10;
    let match = 'Fragrance profile';
    if (name === phrase) { score = 120; match = 'Product name'; }
    else if (name.startsWith(phrase)) { score = 105; match = 'Product name'; }
    else if (name.includes(phrase)) { score = 90; match = 'Product name'; }
    else if (inspiration.includes(phrase) || matches(inspiration, tokens)) { score = 75; match = product.inspiredBy ? `Inspired by ${product.inspiredBy}` : 'Fragrance inspiration'; }
    else {
      const note = notes.find(value => matches(normalize(value), tokens));
      if (note) { score = 65; match = `Note: ${note}`; }
      else if (matches(noteText, tokens)) { score = 60; match = 'Fragrance notes'; }
      else if (matches(accords, tokens)) { score = 50; match = `Accords: ${Array.isArray(product.accords) ? product.accords.slice(0, 3).join(' · ') : product.accords}`; }
      else if (matches(details, tokens)) { score = 40; match = product.family || product.category || product.type || 'Fragrance profile'; }
    }
    return [{product, score, match}];
  }).sort((a, b) => b.score - a.score || String(a.product.name).localeCompare(String(b.product.name)));
}

export function searchPages(query) {
  const phrase = normalize(query);
  if (!phrase) return [];
  const tokens = phrase.split(' ');
  return sitePages.flatMap(page => {
    const title = normalize(page.title);
    const content = normalize(`${page.title} ${page.subtitle} ${page.terms}`);
    if (!matches(content, tokens)) return [];
    return [{...page, score: title === phrase ? 100 : title.startsWith(phrase) ? 80 : title.includes(phrase) ? 65 : 35}];
  }).sort((a, b) => b.score - a.score);
}

export function matchesProductSearch(product, query) { return searchProducts([product], query).length > 0; }
