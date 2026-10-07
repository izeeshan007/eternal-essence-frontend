import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import catalog from '../data/current-catalog.json';

const categories = [
  { label: 'Perfumes', href: '/collections/perfumes', facets: [
    { key: 'gender', label: 'By gender', options: [['For him', 'Male'], ['For her', 'Female'], ['Unisex', 'Unisex']] },
    { key: 'season', label: 'By season', options: [['Summer', 'Spring-Summer'], ['Winter', 'Autumn-Winter'], ['All season', 'All Season']] },
    { key: 'time', label: 'By time', options: [['Day', 'Day'], ['Night', 'Night'], ['Day / night', 'Day/Night']] }
  ] },
  { label: 'Attars', href: '/collections/attars', facets: [
    { key: 'gender', label: 'By gender', options: [['For him', 'Male'], ['For her', 'Female'], ['Unisex', 'Unisex']] },
    { key: 'season', label: 'By season', options: [['Summer', 'Spring-Summer'], ['Winter', 'Autumn-Winter'], ['All season', 'All Season']] },
    { key: 'time', label: 'By time', options: [['Day', 'Day'], ['Night', 'Night'], ['Day / night', 'Day/Night']] }
  ] },
  { label: 'Bakhoors', href: '/collections/bakhoors', facets: [] }
];

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function CollectionMenu({ closeMobile }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState('');
  const [activeFacet, setActiveFacet] = useState('');
  const [activeOption, setActiveOption] = useState('');
  const [preview, setPreview] = useState(null);
  const [products, setProducts] = useState(() => catalog.map(item => ({ ...item, id: item.legacyId, type: item.category, image: item.images?.[0] })));

  useEffect(() => {
    const sync = () => {
      const live = window.EE?.getProducts?.();
      if (Array.isArray(live)) setProducts(live);
    };
    sync();
    window.addEventListener('ee:ready', sync);
    window.addEventListener('ee:catalog-updated', sync);
    return () => {
      window.removeEventListener('ee:ready', sync);
      window.removeEventListener('ee:catalog-updated', sync);
    };
  }, []);

  const productsFor = label => products.filter(product => {
    const type = String(product.type || product.category || '').toLowerCase();
    if (label === 'Bakhoors') return /bakhoor|bukhoor|incense/.test(type);
    if (label === 'Attars') return type.includes('attar');
    return type.includes('perfume');
  });
  const productsForOption = (category, facet, value) => productsFor(category.label).filter(product => {
    const source = product[facet.key] ?? product.facets?.[facet.key];
    if (facet.key === 'season') return normalize(source).includes(normalize(value));
    return normalize(source) === normalize(value);
  });
  const imageFor = product => {
    const image = String(product?.image || product?.images?.[0] || 'ee-brand-20260819.webp');
    return /^https?:/i.test(image) ? image : `/products/${image.split('/').pop().replace(/\.(png|jpe?g)$/i, '.webp')}`;
  };
  const pathFor = product => {
    const type = String(product.type || product.category || '').toLowerCase();
    const category = type.includes('attar') ? 'attars' : type.includes('perfume') ? 'perfumes' : type.replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const name = String(product.name || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `/products/${category}/${name}${type.includes('attar') ? '_attar' : ''}`;
  };

  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        setExpanded('');
        setActiveFacet('');
        setActiveOption('');
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  const resetPanels = () => { setExpanded(''); setActiveFacet(''); setActiveOption(''); setPreview(null); };
  const onNavigate = () => { setOpen(false); resetPanels(); closeMobile?.(); };
  const toggleOpen = () => {
    const next = window.matchMedia('(hover:hover)').matches ? true : !open;
    setOpen(next);
    if (!next) resetPanels();
  };

  return <div className={`ee-nav-collection${open ? ' open' : ''}`}
    onMouseEnter={() => { if (window.matchMedia('(hover:hover)').matches) setOpen(true); }}
    onMouseLeave={() => { if (window.matchMedia('(hover:hover)').matches) { setOpen(false); resetPanels(); } }}>
    <button type="button" className="ee-nav-collection-trigger" aria-expanded={open} aria-controls="ee-collection-dropdown" onClick={toggleOpen}>
      COLLECTION <ChevronDown size={14} />
    </button>
    <div id="ee-collection-dropdown" className="ee-collection-dropdown" aria-label="Collection categories">
      <a className="ee-collection-all" href="/collections" onClick={onNavigate}>Shop all products <ChevronRight size={15} /></a>
      {categories.map(category => {
        const categoryProducts = productsFor(category.label);
        const isExpanded = expanded === category.label;
        return <div className={`ee-collection-category${isExpanded ? ' expanded' : ''}`} key={category.label}
          onMouseEnter={() => { if (window.matchMedia('(hover:hover)').matches) { setExpanded(category.label); setActiveFacet(''); setActiveOption(''); setPreview(null); } }}>
          <div className="ee-collection-category-row">
            <a href={category.href} onClick={onNavigate}>{category.label}</a>
            <button type="button" aria-label={`Show ${category.label} subcategories`} aria-expanded={isExpanded}
              onClick={() => { const next = isExpanded ? '' : category.label; setExpanded(next); setActiveFacet(''); setActiveOption(''); }}>
              <ChevronRight size={16} />
            </button>
          </div>
          {isExpanded && <div className="ee-collection-flyout" onMouseEnter={() => setExpanded(category.label)}>
            <div className="ee-collection-submenu">
              <a className="ee-collection-all" href={category.href} onClick={onNavigate}>All {category.label.toLowerCase()} <ChevronRight size={14} /></a>
              {category.facets.map(item => <div className={`ee-collection-facet${activeFacet === item.key ? ' active' : ''}`} key={item.key}
                onMouseEnter={() => { if (window.matchMedia('(hover:hover)').matches) { setActiveFacet(item.key); setActiveOption(''); setPreview(null); } }}>
                <button type="button" onClick={() => setActiveFacet(window.matchMedia('(hover:hover)').matches ? item.key : activeFacet === item.key ? '' : item.key)} aria-expanded={activeFacet === item.key}>
                  {item.label}<ChevronRight size={14} />
                </button>
                {activeFacet === item.key && <div className="ee-collection-facet-options">
                  <span>{item.label}</span>
                  {item.options.map(([label, value]) => {
                    const matches = productsForOption(category, item, value);
                    return <div className={`ee-collection-facet-option${activeOption === value ? ' active' : ''}`} key={value}
                      onMouseEnter={() => { if (window.matchMedia('(hover:hover)').matches) { setActiveOption(value); setPreview(null); } }}>
                      <button type="button" onClick={() => setActiveOption(window.matchMedia('(hover:hover)').matches ? value : activeOption === value ? '' : value)} aria-expanded={activeOption === value}>
                        {label}<ChevronRight size={13} />
                      </button>
                      {activeOption === value && <div className="ee-collection-product-list">
                        <span>{label} · {category.label}</span>
                        {matches.length ? matches.map(product => <a href={product.href || pathFor(product)} key={product.id || product._id || product.name}
                          onClick={onNavigate} onMouseEnter={() => setPreview({ product, category: category.label })} onFocus={() => setPreview({ product, category: category.label })}>
                          {product.name}<small>₹{Number(product.price || 0).toLocaleString('en-IN')}</small>
                        </a>) : <small className="ee-collection-empty">No fragrances in this group</small>}
                      </div>}
                    </div>;
                  })}
                </div>}
              </div>)}
              {!category.facets.length && <div className="ee-collection-product-list ee-collection-bakhoor-list">
                <span>Featured bakhoors</span>
                {categoryProducts.map(product => <a href={product.href || pathFor(product)} key={product.id || product._id || product.name}
                  onClick={onNavigate} onMouseEnter={() => setPreview({ product, category: category.label })} onFocus={() => setPreview({ product, category: category.label })}>
                  {product.name}<small>₹{Number(product.price || 0).toLocaleString('en-IN')}</small>
                </a>)}
              </div>}
            </div>
            {preview?.category === category.label && <aside className="ee-collection-product-preview" aria-hidden="true">
              <img src={imageFor(preview.product)} alt="" />
              <strong>{preview.product.name}</strong>
              <small>{preview.product.family || preview.product.type || 'Fragrance'}</small>
              <b>₹{Number(preview.product.price || 0).toLocaleString('en-IN')}</b>
              <div className="ee-collection-preview-notes">{String(preview.product.top || preview.product.notes?.top || '').split(/[,|•]/).map(note => note.trim()).filter(Boolean).slice(0, 3).join(' · ')}</div>
            </aside>}
          </div>}
        </div>;
      })}
    </div>
  </div>;
}
