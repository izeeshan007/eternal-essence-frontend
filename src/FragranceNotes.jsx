import React from 'react';
import { Sparkles } from 'lucide-react';

const split = value => String(value || '').split(/[,|•]/).map(note => note.trim()).filter(Boolean);

// Original transparent ingredient cutouts, arranged in four-by-four atlases.
// A note only uses a picture when it describes that ingredient (or its close variant).
const ingredientArtwork = [
  // Keep specific notes ahead of broad families, so a named ingredient gets its own cutout.
  [/gardenia/, 5, 0], [/frangipani/, 5, 1], [/watermelon/, 5, 2],
  [/red fruits?|fruity notes?|^fruity$|candied fruits?/, 5, 3], [/ambroxan/, 5, 4],
  [/bubble gum/, 5, 5], [/rock sugar/, 5, 6], [/cashmere wood/, 5, 7],
  [/peony/, 5, 8], [/bitter almond/, 5, 9], [/brown sugar/, 5, 10],
  [/fresh spices?|fresh spicy/, 5, 11], [/apricot/, 5, 12],
  [/blue lily|\blilies\b|\blily\b/, 5, 13], [/white orchid|\borchids?\b/, 5, 14],
  [/litchi|lychee/, 5, 15],
  [/ambrette/, 6, 0], [/artemisia/, 6, 1], [/bakhoor/, 6, 2],
  [/basil/, 6, 3], [/bay leaf/, 6, 4], [/brandy/, 6, 5],
  [/candied fruit/, 6, 6], [/cassia/, 6, 7], [/chamomile/, 6, 8],
  [/clove/, 6, 9], [/coriander/, 6, 10], [/coumarin/, 6, 11],
  [/cyclamen/, 6, 12], [/davana/, 6, 13], [/dried fruits?/, 6, 14],
  [/fir resin/, 6, 15],
  [/galbanum/, 7, 0], [/\bgrass\b/, 7, 1], [/hawthorn/, 7, 2],
  [/henna|\bhina\b/, 7, 3], [/cypress/, 7, 4], [/juniper/, 7, 5],
  [/kewda|screw pine/, 7, 6], [/licorice/, 7, 7], [/\bmelon\b/, 7, 8],
  [/mitti|soil tincture|earthy/, 7, 9], [/myrrh/, 7, 10],
  [/myrtle/, 7, 11], [/osmanthus/, 7, 12], [/papyrus/, 7, 13],
  [/passionfruit/, 7, 14], [/\bplum\b/, 7, 15],
  [/pimento/, 8, 0], [/quince/, 8, 1],
  [/resins?|resinous|balsamic/, 8, 2], [/sea water/, 8, 3],
  [/smok(?:e|y)/, 8, 4], [/sugar cane/, 8, 5], [/water lily/, 8, 6],
  [/watercress/, 8, 7], [/whiskey|whisky/, 8, 8], [/yuzu/, 8, 9],
  [/almond blossom/, 8, 10], [/cashmeran/, 8, 11], [/calone/, 8, 12],
  [/iso e super/, 8, 13], [/hedione/, 8, 14], [/petitgrain/, 8, 15],
  // Broad accords use a representative ingredient instead of an empty symbol.
  [/\bcitrus(?:es| fruits?)?\b/, 2, 8],
  [/floral accords?|floral notes?|soft florals?|white flowers?/, 5, 0],
  [/herbal notes?|green notes?/, 3, 12],
  [/spices?|spicy notes?|warm spices?/, 5, 11],
  [/powdery notes?/, 4, 7], [/\bsugar\b/, 5, 6],
  [/\bwoody\b|warm woods?/, 2, 0],
  [/\bmoss\b/, 1, 9], [/\bvanille\b/, 1, 11],
  [/pineapple/, 1, 0], [/bergamot/, 1, 1], [/black\s?currant|cassis/, 1, 2],
  [/green apple|apple/, 1, 3], [/birch/, 1, 4], [/patchouli/, 1, 5],
  [/jasmine/, 1, 6], [/rose(?!\s*wood)|damask rose/, 1, 7],
  [/musk/, 1, 8], [/oakmoss|oak moss/, 1, 9], [/ambergris/, 1, 10],
  [/vanilla/, 1, 11], [/amberwood|amber|labdanum/, 1, 12],
  [/sandalwood|sandal wood/, 1, 13], [/oud|agarwood/, 1, 14], [/lavender/, 1, 15],
  [/cedarwood|cedar|woody notes|woods/, 2, 0], [/saffron/, 2, 1],
  [/cardamom/, 2, 2], [/vetiver/, 2, 3], [/cinnamon/, 2, 4],
  [/tonka/, 2, 5], [/lemon|citron|lime/, 2, 6], [/grapefruit/, 2, 7],
  [/mandarin|tangerine/, 2, 8], [/pink pepper/, 2, 9], [/tobacco/, 2, 10],
  [/freesia/, 2, 11], [/ginger/, 2, 12], [/geranium/, 2, 13],
  [/peach/, 2, 14], [/mint/, 2, 15],
  [/leather|suede/, 3, 0], [/rosemary/, 3, 1], [/honey|beeswax/, 3, 2],
  [/orange(?! blossom)|blood orange/, 3, 3], [/ylang/, 3, 4],
  [/violet/, 3, 5], [/caramel|toffee/, 3, 6], [/benzoin/, 3, 7],
  [/nutmeg/, 3, 8], [/lotus/, 3, 9], [/neroli|orange blossom/, 3, 10],
  [/pear/, 3, 11], [/green notes|green leaves|leaves/, 3, 12],
  [/incense|frankincense|olibanum/, 3, 13], [/black pepper|pepper/, 3, 14],
  [/coconut/, 3, 15],
  [/aldehyd/, 4, 0], [/seagrass|sea grass/, 4, 1],
  [/rosewood|rose wood/, 4, 2], [/guaiac|guayac/, 4, 3],
  [/aquatic|water notes|watery/, 4, 4], [/marine|sea salt|sea notes/, 4, 5],
  [/lily.of.the.valley|muguet/, 4, 6], [/iris|orris/, 4, 7],
  [/coffee/, 4, 8], [/cacao|cocoa|chocolate/, 4, 9],
  [/praline|hazelnut/, 4, 10], [/black tea|tea/, 4, 11],
  [/clary sage|sage/, 4, 12], [/magnolia/, 4, 13],
  [/red berries|berries|berry/, 4, 14], [/cherry|cherries/, 4, 15]
];

export function noteArtworkFor(note) {
  const artwork = ingredientArtwork.find(([pattern]) => pattern.test(String(note || '').toLowerCase()));
  if (!artwork) return null;
  const [, atlas, index] = artwork;
  const roomy = atlas === 1 && index < 4;
  const broadAtlas = atlas === 3 || atlas === 4;
  const xPositions = roomy || broadAtlas ? [0,32.5,67.5,100] : [0,100 / 3,200 / 3,100];
  const yPositions = roomy || broadAtlas ? [0,32.5,67.5,100] : atlas === 1 ? [0,37.2,69.1,100] : [0,100 / 3,200 / 3,100];
  return {
    image: `/notes/ingredient-atlas-${atlas}.png`,
    // Fruit needs a wider crop. Lower rows sit just below the grid line, so
    // move their crop down to exclude the ingredient in the row above.
    position: `${xPositions[index % 4]}% ${yPositions[Math.floor(index / 4)]}%`,
    size: roomy ? '350% 350%' : broadAtlas ? '385% 385%' : '400% 400%'
  };
}
if (typeof window !== 'undefined') window.eeFragranceNoteArtwork = noteArtworkFor;

function NoteIcon({ note }) {
  const artwork = noteArtworkFor(note);
  if (!artwork) return <span className="ee-note-icon ee-note-unknown" aria-hidden="true" title={note}><Sparkles size={17} strokeWidth={1.7}/></span>;
  return <span className="ee-note-icon ee-note-photo" aria-hidden="true" title={note}>
    <span className="ee-note-sprite" style={{backgroundImage:`url(${artwork.image})`,backgroundPosition:artwork.position,backgroundSize:artwork.size}}/>
  </span>;
}

export function noteGroups(product) {
  return [
    { label: 'Top', detail: 'First impression', notes: split(product?.top ?? product?.notes?.top) },
    { label: 'Heart', detail: 'The character', notes: split(product?.mid ?? product?.notes?.mid) },
    { label: 'Base', detail: 'The lasting trail', notes: split(product?.base ?? product?.notes?.base) }
  ];
}

function NotesContent({ product, compact = false, condensed = false, all = false }) {
  return noteGroups(product).map(group => <section className="ee-note-group" key={group.label}>
    <div className="ee-note-group-heading"><strong>{group.label}</strong>{!compact && <small>{group.detail}</small>}</div>
    <ul>{group.notes.length ? group.notes.slice(0, all ? group.notes.length : condensed ? 1 : compact ? 3 : 5).map((note, index) => {
      return <li key={`${note}-${index}`}><NoteIcon note={note}/><span>{note}</span></li>;
    }) : <li><span className="ee-note-icon"><Sparkles size={15}/></span><span>Discover the blend</span></li>}</ul>
  </section>);
}

export function NoteOverlay({ product, condensed = false, all = false }) {
  return <aside className="ee-note-overlay" aria-label={`${product?.name || 'Fragrance'} notes`}>
    <span className="ee-note-overline">SCENT NOTES</span><NotesContent product={product} compact={!all} condensed={condensed} all={all} />
  </aside>;
}

export function NotesArtwork({ product }) {
  const groups = noteGroups(product);
  return <div className="ee-notes-artwork" role="group" aria-label={`${product?.name || 'Fragrance'} top, heart and base notes`}>
    <div className="ee-notes-artwork-head"><span>THE FRAGRANCE PROFILE</span><h2>{product?.name || 'Scent notes'}</h2><p>From first impression to lasting trail</p></div>
    <div className="ee-notes-artwork-grid ee-notes-flow">
      {groups.map((group, groupIndex) => <section className="ee-notes-flow-stage" key={group.label}>
        <span className="ee-notes-flow-marker" aria-hidden="true">0{groupIndex + 1}</span>
        <div className="ee-notes-flow-content">
          <div className="ee-notes-flow-heading"><strong>{group.label} notes</strong><small>{group.detail}</small></div>
          <ul>{group.notes.length ? group.notes.map((note, index) => {
            return <li key={`${note}-${index}`}><NoteIcon note={note}/><span>{note}</span></li>;
          }) : <li><NoteIcon note="Discover the blend"/><span>Discover the blend</span></li>}</ul>
        </div>
      </section>)}
    </div>
  </div>;
}
