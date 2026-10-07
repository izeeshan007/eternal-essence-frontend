import React from 'react';
import { Sparkles } from 'lucide-react';

const split = value => String(value || '').split(/[,|•]/).map(note => note.trim()).filter(Boolean);

// Original transparent ingredient cutouts, arranged in four-by-four atlases.
// A note only uses a picture when it describes that ingredient (or its close variant).
const ingredientArtwork = [
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
  return {
    image: `/notes/ingredient-atlas-${atlas}.png`,
    position: `${(index % 4 + .1) * 31.25}% ${(Math.floor(index / 4) + .1) * 31.25}%`
  };
}
if (typeof window !== 'undefined') window.eeFragranceNoteArtwork = noteArtworkFor;

function NoteIcon({ note }) {
  const artwork = noteArtworkFor(note);
  if (!artwork) return <span className="ee-note-icon ee-note-unknown" aria-hidden="true" title={note}><Sparkles size={17} strokeWidth={1.7}/></span>;
  return <span className="ee-note-icon ee-note-photo" aria-hidden="true" title={note}>
    <span className="ee-note-sprite" style={{backgroundImage:`url(${artwork.image})`,backgroundPosition:artwork.position}}/>
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
