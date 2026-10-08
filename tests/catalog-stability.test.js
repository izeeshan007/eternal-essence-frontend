import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/legacy/assets/js/storefront.js',import.meta.url),'utf8');
const pricingSource=source.slice(source.indexOf('function roundTo99('),source.indexOf('function updatePriceDisplay('));
const filterSource=source.slice(source.indexOf('function applyFilters() {'),source.indexOf('function renderFilteredProducts('));

test('the first catalog paint and live API both show the visible 30 ml perfume price',()=>{
  const context=vm.createContext({
    normalize:value=>String(value||'').toLowerCase(),
    getSizesByCategory:()=>[
      {value:8,unit:'ml',priceMultiplier:.2985971943887776},
      {value:30,unit:'ml',priceMultiplier:1.2}
    ]
  });
  vm.runInContext(pricingSource,context);
  const bundled={type:'Perfume',price:499,sizes:[]};
  const live={...bundled,sizes:[
    {value:8,unit:'ml',priceMultiplier:.2985971943887776,websitePrice:149,isStorefrontVisible:false},
    {value:30,unit:'ml',priceMultiplier:1.2,websitePrice:599,isStorefrontVisible:true}
  ]};
  assert.equal(vm.runInContext('getProductDisplayPricing',context)(bundled).sellingPrice,599);
  assert.equal(vm.runInContext('getProductDisplayPricing',context)(live).sellingPrice,599);
});

test('price sorting uses the visible variant price',()=>{
  const inputs={
    allProducts:[
      {id:'first',catalogOrder:0,name:'First',type:'Perfume',price:499,sizes:[{value:30,unit:'ml',priceMultiplier:1.2,websitePrice:599}]},
      {id:'second',catalogOrder:1,name:'Second',type:'Perfume',price:550,sizes:[{value:30,unit:'ml',priceMultiplier:1,websitePrice:499}]}
    ],
    activeCategory:'all',location:{search:''},window:{},
    document:{getElementById:id=>id==='sort-filter'?{value:'price-asc'}:null},
    normalize:value=>String(value||'').toLowerCase(),
    getSizesByCategory:()=>[],renderProducts:items=>{inputs.rendered=items},URLSearchParams
  };
  const context=vm.createContext(inputs);
  vm.runInContext(pricingSource+filterSource,context);
  vm.runInContext('applyFilters()',context);
  assert.deepEqual(Array.from(inputs.rendered,p=>p.id),['second','first']);
});

test('unchanged catalog API refreshes do not rebuild the grid',async()=>{
  const apiSource=source.slice(source.indexOf('let catalogRefreshInFlight = false;'),source.indexOf('function mergeProducts() {'));
  let merges=0,events=0,cacheWrites=0;
  let payload={success:true,products:[{_id:'13',catalogOrder:12,name:'Aventus',category:'Perfume',price:499,sizes:[],images:[]}]};
  const context=vm.createContext({
    backendProducts:[],BACKEND_BASE_URL:'http://example.test',
    fetchWithTimeout:async()=>({ok:true,text:async()=>JSON.stringify(payload)}),
    resolveMergeImage:value=>value,
    mergeProducts:()=>{merges++},
    renderCuratedHero:()=>{},
    window:{dispatchEvent:()=>{events++}},
    localStorage:{setItem:()=>{cacheWrites++}},
    CustomEvent:class CustomEvent{},
    clearTimeout:()=>{},setTimeout:()=>0,
    console
  });
  vm.runInContext(apiSource,context);
  const refresh=vm.runInContext('loadBackendProducts',context);
  await refresh();
  await refresh();
  assert.equal(merges,1);
  assert.equal(events,1);
  assert.equal(cacheWrites,1);
  payload={...payload,products:[{...payload.products[0],price:599}]};
  await refresh();
  assert.equal(merges,2);
  assert.equal(events,2);
});

test('a perfume link preselects its custom set item once across catalog IDs',()=>{
  const keySource=source.slice(source.indexOf('function getProductKey(product) {'),source.indexOf('function getBundleRule('));
  const prefillSource=source.slice(source.indexOf('function prefillBundleFromRoute() {'),source.indexOf('function renderBundleBuilder() {'));
  const address=new URL('https://example.test/custom-set?product=13');
  const inputs={
    location:{pathname:address.pathname,search:address.search,href:address.href},
    history:{state:{},replaceState(_state,_title,path){
      const next=new URL(path,'https://example.test');
      inputs.location={pathname:next.pathname,search:next.search,href:next.href};
    }},
    document:{getElementById:()=>({value:'previous filter'})},
    bundleState:{sizeMl:20,setQty:2,selections:{old:2},preference:'fresh'},
    getBundleEligibleProducts:()=>[{id:'frontend_13',name:'Aventus'}],
    getBundleQtyOptions:size=>size===8?[4,6]:[2,4],
    URL,URLSearchParams
  };
  const context=vm.createContext(inputs);
  vm.runInContext(keySource+prefillSource,context);
  assert.equal(vm.runInContext("getProductKey({id:'db_13'})",context),'13');
  assert.equal(vm.runInContext("getProductKey({id:'frontend_13'})",context),'13');
  vm.runInContext('prefillBundleFromRoute()',context);
  assert.equal(inputs.bundleState.selections['13'],1);
  assert.equal(inputs.bundleState.sizeMl,8);
  assert.equal(inputs.bundleState.setQty,4);
  assert.equal(inputs.bundleState.preference,'');
  assert.equal(inputs.location.search,'');
  inputs.bundleState.selections['13']=2;
  inputs.getBundleEligibleProducts=()=>[{id:'db_13',name:'Aventus'}];
  vm.runInContext('prefillBundleFromRoute()',context);
  assert.equal(inputs.bundleState.selections['13'],2);
  inputs.location={pathname:'/custom-set',search:'?product=13',href:'https://example.test/custom-set?product=13'};
  inputs.getBundleEligibleProducts=()=>inputs.bundleState.sizeMl===20?[{id:'db_13',name:'Aventus'}]:[];
  vm.runInContext('prefillBundleFromRoute()',context);
  assert.equal(inputs.bundleState.sizeMl,20);
  assert.equal(inputs.bundleState.setQty,2);
  assert.equal(inputs.bundleState.selections['13'],1);
  inputs.location={pathname:'/custom-set',search:'?product=new',href:'https://example.test/custom-set?product=new'};
  inputs.getBundleEligibleProducts=()=>[];
  vm.runInContext('prefillBundleFromRoute()',context);
  assert.equal(inputs.location.search,'?product=new');
  assert.equal(inputs.bundleState.sizeMl,20);
});
