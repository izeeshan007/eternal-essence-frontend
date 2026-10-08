import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const quizSource = fs.readFileSync(new URL('../public/legacy/assets/js/scent-quiz.js', import.meta.url), 'utf8');
const products = [
  { id:'fresh', catalogOrder:0, name:'Fresh', type:'Perfume', accords:['Citrus','Fresh','Marine'], season:'Summer', sizes:[{}] },
  { id:'oud', catalogOrder:1, name:'Oud', type:'Perfume', accords:['Oud','Leather','Amber'], season:'Winter', sizes:[{}] },
  { id:'oil', catalogOrder:2, name:'Oil', type:'Attar', accords:['Oud'], season:'Winter', sizes:[{}] }
];
test('beginner choices lead to different real products and respect format', () => {
  const context = vm.createContext({ window:{dispatchEvent(){}}, document:{addEventListener(){}}, Event:class Event{}, Intl });
  vm.runInContext(quizSource, context);
  const {rankScentProducts:rank} = context.window.__EE_SCENT_QUIZ__;
  assert.equal(rank(products,{intent:'fresh',setting:'work',aroma:'fresh',presence:'soft',climate:'hot',format:'Perfume'})[0].product.id,'fresh');
  assert.equal(rank(products,{intent:'bold',setting:'social',aroma:'oud',presence:'statement',climate:'cool',format:'Perfume'})[0].product.id,'oud');
  assert.equal(rank(products,{aroma:'oud',format:'Attar'})[0].product.id,'oil');
});
test('quiz excludes inactive and hidden products and waits for the live catalog', () => {
  const window = { EE:{getProducts:()=>[...products,{...products[0],id:'hidden',sizes:[{isStorefrontVisible:false}]},{...products[0],id:'inactive',isActive:false}]},dispatchEvent(){} };
  vm.runInContext(quizSource, vm.createContext({window,document:{addEventListener(){}},Event:class Event{},Intl}));
  assert.equal(window.__EE_SCENT_QUIZ__.getQuizEligibleProducts().length,0);
  window.__EE_CATALOG_STATUS__='ready';
  assert.equal(window.__EE_SCENT_QUIZ__.getQuizEligibleProducts().length,3);
});
test('seasonal collection preserves curation while the ordinary grid keeps catalog order', () => {
  const source=fs.readFileSync(new URL('../public/legacy/assets/js/storefront.js',import.meta.url),'utf8');
  const start=source.indexOf('function applyFilters() {');
  const end=source.indexOf('function renderFilteredProducts',start);
  let rendered=[];
  const context=vm.createContext({allProducts:[products[0],products[1],products[2]],activeCategory:'all',location:{search:'?edit=winter'},window:{__EE_CURATED__:{season:'winter',collections:{winter:['oud']}}},document:{getElementById:()=>null},normalize:s=>String(s||'').toLowerCase(),renderProducts:items=>{rendered=items;},URLSearchParams,Intl});
  vm.runInContext(source.slice(start,end),context);
  vm.runInContext('applyFilters()',context);
  assert.deepEqual(Array.from(rendered,p=>p.id),['oud','oil']);
  context.location.search='';
  vm.runInContext('applyFilters()',context);
  assert.deepEqual(Array.from(rendered,p=>p.id),['fresh','oud','oil']);
  context.window.__EE_CURATED__.season='summer';
  context.window.__EE_CURATED__.collections.summer=['fresh'];
  vm.runInContext('applyFilters()',context);
  assert.deepEqual(Array.from(rendered,p=>p.id),['fresh','oud','oil']);
});
