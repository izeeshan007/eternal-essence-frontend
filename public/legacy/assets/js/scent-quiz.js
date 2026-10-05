// Beginner-friendly scent finder. Only live, visible products can be shown.
const SCENT_QUIZ_QUESTIONS = [
  { id:'intent', title:'How do you want to feel wearing it?', hint:'Think about the impression you want to make.', options:[
    ['fresh','Fresh and approachable','Easy to be around','fa-sun'],
    ['calm','Calm and comfortable','A moment for yourself','fa-leaf'],
    ['confident','Confident and polished','Ready for anything','fa-star'],
    ['romantic','Warm and inviting','Close, personal moments','fa-heart'],
    ['bold','Bold and memorable','Make an entrance','fa-fire']
  ]},
  { id:'setting', title:'Where will you wear it most?', hint:'Pick the moment you can picture most clearly.', options:[
    ['everyday','Everyday errands','An easy daily companion','fa-house'],
    ['work','Work or college','Comfortable around others','fa-briefcase'],
    ['date','A date or dinner','Personal and inviting','fa-moon'],
    ['social','Celebrations or nights out','Something people remember','fa-champagne-glasses'],
    ['ritual','Quiet or traditional moments','For reflection and ritual','fa-hands-praying']
  ]},
  { id:'aroma', title:'Which familiar smells sound good?', hint:'There is no perfume knowledge needed here.', options:[
    ['fresh','Fresh shower and citrus','Bright, clean and airy','fa-water'],
    ['sweet','Vanilla and desserts','Soft, warm sweetness','fa-cookie-bite'],
    ['floral','Fresh flowers','Petals and gentle elegance','fa-fan'],
    ['woody','Trees and warm woods','Grounded and natural','fa-tree'],
    ['oud','Incense and rich oud','Deep and distinctive','fa-fire-flame-curved'],
    ['unsure','Surprise me','Use my other answers','fa-wand-magic-sparkles']
  ]},
  { id:'presence', title:'How noticeable should it feel?', hint:'Choose your comfort level, not a technical strength rating.', options:[
    ['soft','Close and gentle','Mostly for me and people nearby','fa-feather'],
    ['balanced','Somewhere in the middle','Present without taking over','fa-scale-balanced'],
    ['statement','A clear statement','I enjoy a richer scent','fa-bolt']
  ]},
  { id:'climate', title:'What weather will you wear it in?', hint:'Weather changes which scent styles feel most comfortable.', options:[
    ['current','The current Indian season','Use today’s seasonal edit','fa-calendar-day'],
    ['hot','Warm or humid days','Light and refreshing','fa-temperature-high'],
    ['cool','Cooler days or evenings','Warm and enveloping','fa-snowflake'],
    ['all','A mix of weather','Versatile is best','fa-earth-asia']
  ]},
  { id:'format', title:'How would you like to apply it?', hint:'We will show products you can open and shop now.', options:[
    ['Perfume','Perfume spray','A familiar spray bottle','fa-spray-can-sparkles'],
    ['Attar','Attar oil','A concentrated oil','fa-droplet'],
    ['Either','Either is fine','Show my strongest matches','fa-wand-magic-sparkles']
  ]}
];
const QUIZ_AROMAS = {
  fresh:['fresh','aquatic','marine','citrus','bergamot','lemon','lime','mint','clean','green'],
  sweet:['vanilla','sweet','gourmand','caramel','chocolate','honey','tonka','coffee'],
  floral:['floral','rose','jasmine','peony','gardenia','tuberose','lavender','violet'],
  woody:['woody','wood','cedar','sandalwood','vetiver','oakmoss','patchouli'],
  oud:['oud','agarwood','incense','saffron','amber','resin','oriental']
};
const QUIZ_INTENTS = {
  fresh:['fresh','aquatic','citrus','clean','green','aromatic'],
  calm:['musk','sandalwood','lavender','soft','powdery','herbal'],
  confident:['woody','amber','leather','spicy','aromatic','vetiver'],
  romantic:['rose','floral','vanilla','musk','sweet','amber'],
  bold:['oud','leather','tobacco','saffron','smoky','incense']
};
const QUIZ_SETTINGS = {
  everyday:['fresh','clean','citrus','musk','aromatic'],
  work:['clean','fresh','musk','woody','citrus','sandalwood'],
  date:['vanilla','rose','amber','musk','floral','sweet'],
  social:['amber','oud','spicy','leather','sweet','saffron'],
  ritual:['attar','oud','rose','sandalwood','incense','musk']
};
let scentQuizState = { step:0, answers:{}, results:[], timer:null };
function quizElement(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}
function quizMatches(text, terms) { return terms.filter(term => text.includes(term)); }
function quizCategory(product) { return String(product.type || product.category || '').toLowerCase(); }
function quizImage(product) {
  const source = String(product.image || product.images?.[0] || 'ee-brand-20260819.webp');
  return /^https?:\/\//i.test(source) ? source : '/products/' + source.split('/').pop().replace(/\.(png|jpe?g)$/i,'.webp');
}
function currentQuizClimate() {
  if (window.__EE_CURATED__?.season) return window.__EE_CURATED__.season === 'winter' ? 'cool' : 'hot';
  const month = Number(new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata', month:'numeric' }).format(new Date()));
  return month >= 3 && month <= 10 ? 'hot' : 'cool';
}
function getQuizEligibleProducts() {
  if (window.__EE_CATALOG_STATUS__ !== 'ready') return [];
  return (window.EE?.getProducts?.() || []).filter(product => {
    const category = quizCategory(product);
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    return (category === 'perfume' || category === 'attar') && product.isActive !== false
      && (!sizes.length || sizes.some(size => size.isStorefrontVisible !== false));
  });
}
function scoreScentProduct(product, answers) {
  const accords = [product.family, ...(Array.isArray(product.accords) ? product.accords : [])].filter(Boolean).join(' ').toLowerCase();
  const notes = [product.top, product.mid, product.base, product.notes?.top, product.notes?.mid, product.notes?.base].filter(Boolean).join(' ').toLowerCase();
  const details = (accords + ' ' + notes + ' ' + (product.name || '') + ' ' + (product.description || '')).toLowerCase();
  const climate = answers.climate === 'current' ? currentQuizClimate() : answers.climate;
  let score = 0;
  const reasons = [];
  if (answers.aroma !== 'unsure') {
    const terms = QUIZ_AROMAS[answers.aroma] || [];
    const main = quizMatches(accords, terms), supporting = quizMatches(notes, terms);
    score += Math.min(42, main.length * 12 + supporting.length * 6 + (main.length || supporting.length ? 4 : 0));
    if (main.length || supporting.length) reasons.push((main[0] || supporting[0]) + ' notes match the smells you picked');
  }
  const mood = quizMatches(details, QUIZ_INTENTS[answers.intent] || []);
  score += Math.min(30, mood.length * (answers.aroma === 'unsure' ? 12 : 8));
  if (mood.length) reasons.push(mood[0] + ' character supports your ' + answers.intent + ' mood');
  const moment = quizMatches(details, QUIZ_SETTINGS[answers.setting] || []);
  score += Math.min(20, moment.length * 6);
  if (moment.length) reasons.push('a good direction for ' + ({work:'work or college',social:'celebrations'}[answers.setting] || answers.setting) + ' wear');
  const rich = quizMatches(details, ['oud','amber','leather','incense','tobacco','smoky','spicy','intense']).length;
  score += answers.presence === 'statement' ? (rich ? 10 : 1) : answers.presence === 'soft' ? (rich ? 1 : 10) : 7;
  const season = String(product.season || '').toLowerCase();
  const allSeason = /all\s*season/.test(season);
  const warmFit = /summer|spring/.test(season) || quizMatches(details, QUIZ_AROMAS.fresh).length > 1;
  const coolFit = /winter|autumn/.test(season) || rich > 1;
  if (climate === 'all' || allSeason) score += 8;
  else if ((climate === 'hot' && warmFit) || (climate === 'cool' && coolFit)) {
    score += 10;
    reasons.push('fits ' + (climate === 'hot' ? 'warmer' : 'cooler') + ' weather');
  }
  return { product, score, reasons:[...new Set(reasons)].slice(0,3) };
}
function rankScentProducts(products, answers) {
  const eligible = products.filter(product => answers.format === 'Either' || quizCategory(product) === String(answers.format || '').toLowerCase());
  const ranked = eligible.map(product => scoreScentProduct(product, answers))
    .sort((a,b) => b.score - a.score || String(a.product.name).localeCompare(String(b.product.name)));
  const seen = new Set();
  return ranked.filter(result => {
    const name = String(result.product.name || '').toLowerCase();
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}
function openScentQuiz() {
  clearTimeout(scentQuizState.timer);
  scentQuizState = { step:0, answers:{}, results:[], timer:null };
  const modal = document.getElementById('scent-quiz-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderScentQuiz();
}
function closeScentQuiz() {
  clearTimeout(scentQuizState.timer);
  document.getElementById('scent-quiz-modal')?.classList.add('hidden');
  document.body.style.overflow = '';
}
function quizHeader(step) {
  const top = quizElement('div','ee-quiz-top');
  const label = quizElement('div','ee-quiz-count','Find your signature scent · ' + (step + 1) + ' of ' + SCENT_QUIZ_QUESTIONS.length);
  const progress = quizElement('div','ee-quiz-progress');
  const fill = quizElement('div');
  fill.style.width = Math.round((step + 1) / SCENT_QUIZ_QUESTIONS.length * 100) + '%';
  progress.appendChild(fill);
  top.append(label,progress);
  return top;
}
function renderScentQuiz() {
  const question = SCENT_QUIZ_QUESTIONS[scentQuizState.step];
  const body = document.getElementById('scent-quiz-body');
  if (!body || !question) return;
  const intro = quizElement('div','ee-quiz-intro');
  intro.append(quizElement('p','ee-quiz-kicker','A few easy choices'),quizElement('h2','brand-font',question.title),quizElement('p','ee-quiz-hint',question.hint));
  const options = quizElement('div','ee-quiz-options');
  question.options.forEach(option => {
    const button = quizElement('button','ee-quiz-option');
    button.type = 'button';
    const icon = quizElement('i','fas ' + option[3]);
    button.append(icon,quizElement('strong','',option[1]),quizElement('small','',option[2]));
    button.addEventListener('click',() => answerScentQuiz(question.id, option[0]));
    options.appendChild(button);
  });
  body.replaceChildren(quizHeader(scentQuizState.step),intro,options);
  if (scentQuizState.step > 0) {
    const back = quizElement('button','ee-quiz-back','← Back');
    back.type = 'button';
    back.addEventListener('click',previousScentQuestion);
    body.appendChild(back);
  }
}
function answerScentQuiz(id,value) {
  scentQuizState.answers[id] = value;
  if (scentQuizState.step < SCENT_QUIZ_QUESTIONS.length - 1) {
    scentQuizState.step++;
    renderScentQuiz();
  } else renderScentAnalysis();
}
function previousScentQuestion() {
  if (scentQuizState.step > 0) { scentQuizState.step--; renderScentQuiz(); }
}
function renderScentAnalysis() {
  const body = document.getElementById('scent-quiz-body');
  body.replaceChildren(quizElement('h2','ee-quiz-loading brand-font','Finding your fragrances…'),quizElement('p','ee-quiz-hint','Matching your choices with products available now.'));
  scentQuizState.timer = setTimeout(renderScentResults,350);
}
function renderScentResults() {
  const body = document.getElementById('scent-quiz-body');
  const answers = scentQuizState.answers;
  scentQuizState.results = rankScentProducts(getQuizEligibleProducts(),answers).slice(0,3);
  if (!scentQuizState.results.length) {
    body.replaceChildren(quizElement('h2','brand-font','The collection is unavailable right now'),quizElement('p','ee-quiz-hint','Please try again when the live catalogue has loaded.'));
    const retry = quizElement('button','ee-quiz-retry','Try again');
    retry.addEventListener('click',openScentQuiz);
    body.appendChild(retry);
    return;
  }
  const direction = {fresh:'Fresh and easy',calm:'Comforting and understated',confident:'Polished confidence',romantic:'Warm and inviting',bold:'Bold and distinctive'}[answers.intent] || 'Your scent direction';
  const intro = quizElement('div','ee-quiz-intro');
  intro.append(quizElement('p','ee-quiz-kicker','Your scent direction'),quizElement('h2','brand-font',direction),quizElement('p','ee-quiz-hint','These live products fit the feeling, moment and smells you chose. Open one to see its notes, sizes and price.'));
  const list = quizElement('div','ee-quiz-results');
  scentQuizState.results.forEach((result,index) => {
    const card = quizElement('article','ee-result-card ee-quiz-result');
    const image = quizElement('img');
    image.src = quizImage(result.product);
    image.alt = result.product.name;
    image.onerror = () => { image.onerror = null; image.src = '/products/ee-brand-20260819.webp'; };
    const content = quizElement('div');
    const label = quizElement('span','ee-quiz-result-label',(index === 0 ? 'Start here' : 'Option ' + (index + 1)) + ' · ' + (result.product.type || result.product.category || 'Fragrance'));
    const name = quizElement('h3','brand-font',result.product.name);
    const explanation = quizElement('p','',result.reasons.length ? result.reasons.join(' · ') : 'A balanced starting point based on your choices');
    const open = quizElement('button','','Open this fragrance →');
    open.type = 'button';
    open.addEventListener('click',() => {
      closeScentQuiz();
      window.eeNavigateToProduct?.(result.product,{size:window.eeDefaultProductSize?.(result.product) || ''});
    });
    content.append(label,name,explanation,open);
    card.append(image,content);
    list.appendChild(card);
  });
  const retake = quizElement('button','ee-quiz-retry','Try different answers');
  retake.type = 'button';
  retake.addEventListener('click',openScentQuiz);
  body.replaceChildren(intro,list,retake);
}
window.__EE_SCENT_QUIZ__ = { rankScentProducts,scoreScentProduct,getQuizEligibleProducts };
document.addEventListener('keydown',event => {
  if (event.key === 'Escape' && !document.getElementById('scent-quiz-modal')?.classList.contains('hidden')) closeScentQuiz();
});
