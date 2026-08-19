
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Heart,Share2,ShoppingBag,Minus,Plus,ArrowLeft,ShoppingCart,Sparkles,Eye} from 'lucide-react';

function normalize(p){
  if(!p)return null;
  return {...p,
    id:String(p.id??p._id??''),
    type:p.type||p.category||'Perfume',
    top:p.top??p.notes?.top??'',
    mid:p.mid??p.notes?.mid??'',
    base:p.base??p.notes?.base??'',
    accords:Array.isArray(p.accords)?p.accords:String(p.accords||'').split(/[|,]/).map(s=>s.trim()).filter(Boolean),
    images:Array.isArray(p.images)&&p.images.length?p.images:[p.image].filter(Boolean),
  };
}
function slugify(v){return String(v||'').trim().toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
function categorySlug(p){return String(p?.type||p?.category||'perfume').toLowerCase().includes('attar')?'attars':'perfumes';}
function productSlug(p){const s=slugify(p?.name||'product');return categorySlug(p)==='attars'?`${s}_attar`:s;}
function imgUrl(name){
  if(!name)return '/products/placeholder.webp';
  if(String(name).startsWith('http'))return name;
  return `/products/${String(name).split('/').pop().replace(/\.(png|jpe?g)$/i,'.webp')}`;
}
const SIZE_CACHE=new Map();
const PERFUME_SIZE_SET=[
  {value:8,unit:'ml',priceMultiplier:.278557114228},{value:20,unit:'ml',priceMultiplier:.6993987},{value:30,unit:'ml',priceMultiplier:1},{value:50,unit:'ml',priceMultiplier:1.4008},{value:100,unit:'ml',priceMultiplier:2.4028},
  {value:30,unit:'ml Gift',priceMultiplier:1.2},{value:50,unit:'ml Gift',priceMultiplier:1.601},{value:100,unit:'ml Gift',priceMultiplier:2.6032}
];
const ATTAR_SIZE_SET=[{value:3,unit:'ml',priceMultiplier:1},{value:6,unit:'ml',priceMultiplier:1.85},{value:8,unit:'ml',priceMultiplier:2.3},{value:12,unit:'ml',priceMultiplier:3.2}];
function getSizes(product){
  const key=String(product?.id||product?._id||product?.name||'');
  if(SIZE_CACHE.has(key))return SIZE_CACHE.get(key);
  const canonical=String(product?.type||product?.category||'').toLowerCase().includes('attar')?ATTAR_SIZE_SET:PERFUME_SIZE_SET;
  const supplied=Array.isArray(product?.sizes)?product.sizes:[];
  const sizeKey=size=>`${Number(size?.value||0)}-${String(size?.unit||'').toLowerCase().replace(/\s+/g,'')}`;
  const suppliedByKey=new Map(supplied.map(size=>[sizeKey(size),size]));
  const canonicalKeys=new Set(canonical.map(sizeKey));
  const result=[...canonical.map(size=>({...size,...(suppliedByKey.get(sizeKey(size))||{})})),...supplied.filter(size=>!canonicalKeys.has(sizeKey(size)))];
  SIZE_CACHE.set(key,result); return result;
}
function pricing(base,mult){
  const selling=Math.round(Number(base||0)*Number(mult||1));
  const mrp=Math.round(selling/.80);
  return {selling,mrp,discount:mrp?Math.round((mrp-selling)/mrp*100):0};
}
function splitNotes(v){return String(v||'').split(/[,|•]/).map(s=>s.trim()).filter(Boolean);}
function variantIndex(size){
  const k=size&&typeof size==='object'
    ? `${size.value}${String(size.unit||'').toLowerCase().replace(/\s+/g,'')}`
    : String(size??'').toLowerCase().replace(/\s+/g,'');
  const map={'8ml':1,'20ml':2,'30ml':3,'50ml':4,'100ml':5,'30mlgift':6,'50mlgift':7,'100mlgift':8};
  return map[k]??0;
}
function sizeKey(size){
  if(!size)return '';
  return `${size.value}${String(size.unit||'').toLowerCase().replace(/\s+/g,'')}`;
}
function normalizeSizeLabel(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  const match=raw.match(/[\d.]+/);
  if(!match)return raw.toLowerCase().replace(/\s+/g,'');
  return `${match[0]}ml${/gift/i.test(raw)?'gift':''}`;
}
function sizeFromUrl(product,sizes){
  const requested=new URLSearchParams(location.search).get('size')||window.__eePendingProductSelection?.size||'';
  const key=normalizeSizeLabel(requested);
  const match=sizes.find(s=>normalizeSizeLabel(`${s.value} ${s.unit}`)===key);
  return {size:match||sizes[0],unavailable:!!requested&&!match,requested};
}
function variantImages(product,size){
  if(!product)return ['/products/placeholder.webp'];
  const idx=variantIndex(size), first=product.images?.[0]||product.image;
  if(categorySlug(product)==='attars')return [imgUrl(first)];
  const exact=product.images?.[idx], ml=Number(size?.value||0);
  if(!first)return [`/products/common${idx}.webp`,'/products/placeholder.webp'];
  const s=String(first),dot=s.lastIndexOf('.'),base=dot<0?s:s.slice(0,dot).replace(/\(\d+\)$/,'');
  const ext=dot<0?'.webp':s.slice(dot);
  const candidates=[exact, idx===6?first:null, ml?`${base}${ml}${ext}`:null, idx?`${base}(${idx})${ext}`:null, idx?`common${idx}.webp`:null, first].filter(Boolean).map(imgUrl);
  return [...new Set(candidates)];
}
function ProductImage({sources,alt}){const [index,setIndex]=useState(0);useEffect(()=>setIndex(0),[sources.join('|')]);return <img src={sources[index]||'/products/placeholder.webp'} alt={alt} onError={()=>setIndex(i=>Math.min(i+1,sources.length-1))}/>;}

const LONGEVITY={'cool essence':[24,48],'divine essence':[10,24],aventus:[10,16],'eternal white':[8,14],'golden aura':[12,36],titanium:[10,16],'purple oud':[10,16],'golden blush':[8,12],'aqua wave':[8,12],'intense suede':[10,16],'vanilla blossom':[10,24],intus:[10,16],'caramel oud':[10,24],'eternal ember':[10,24],qahwa:[12,16],'blue oud':[24,72],'azure tide':[6,12],ombre:[10,16],'pulse royale':[8,14],'eternal elixir':[10,16],'eternal sauvage':[6,12],invictus:[8,14],'bleu voyage':[6,12],'golden flora':[8,14],'fresh impact':[8,14],'alpha blue':[6,12],'cool tide':[6,12],'luminous veil':[6,12],'most wanted':[8,14],'fresh horizon':[8,14],'br 540':[8,14],'ruh al wadi':[10,36],'fume vanille':[10,36],'fire oud':[10,36],'afternoon dive':[6,14],noble:[10,36],mukhaklat:[10,36],million:[8,12],'pink vanilla':[10,16],'tao mist':[10,16],'urban icon':[8,12],vanaffe:[8,12],'white oud':[8,16],symphoria:[8,16],melior:[10,24]};
function cleanKey(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function longevityFor(product){const match=[product.name,product.inspiredBy].map(cleanKey).map(key=>LONGEVITY[key]).find(Boolean)||[8,14];return {min:match[0],max:match[1],label:`${match[0]}–${match[1]} hours`};}
function displayHour(hours,max,isAfter=false){
  if(isAfter)return `After ${max} h`;
  if(hours<=0)return 'Spray';
  if(hours<1)return `${Math.round(hours*60)} min`;
  return `${Number.isInteger(hours)?hours:hours.toFixed(1)} h`;
}
function makeJourney(product){
  const top=splitNotes(product.top), heart=splitNotes(product.mid), base=splitNotes(product.base), acc=product.accords||[];
  const longevity=longevityFor(product),max=longevity.max,timelineMax=max/.92,counts=[top.length,heart.length,base.length];
  const strength=Math.min(.94,.55+counts[0]*.03+counts[1]*.025+counts[2]*.025);
  const fresh=acc.some(a=>/citrus|fresh|aquatic|marine|green|aromatic/i.test(a));
  const woody=acc.some(a=>/oud|woody|leather|amber|smoky|musk/i.test(a));
  const sweet=acc.some(a=>/sweet|vanilla|gourmand|caramel|tonka|fruity/i.test(a));
  const peak=Math.min(.96,strength+(fresh?.05:0)+(woody?.025:0));
  const tail=Math.min(.72,.18+(max/72)*.36+base.length*.028+(woody?.10:0)+(sweet?.05:0));
  const openingEnd=Math.min(2,Math.max(.6,max*.11)),heartEnd=Math.min(max*.58,Math.max(openingEnd+1.4,max*.32));
  const feel=(phase,notes,t)=>notes.length?(
    phase==='Opening'?`${notes.slice(0,3).join(', ')} open with ${fresh?'lift and brightness':'a distinct first impression'}.`:
    phase==='Heart'?`${notes.slice(0,3).join(', ')} build the signature character and depth.`:
    `${notes.slice(0,3).join(', ')} settle into a ${woody?'warm, lasting':'smooth'} finish.`
  ):`${phase} notes shape the fragrance as it evolves.`;
  const h=t=>displayHour(t,max);
  const kf=[{t:0,v:.04,phase:'Opening',time:'Spray',feel:'The first impression begins.',proj:0,hours:0},{t:openingEnd*.32,v:peak*(fresh?.96:.83),phase:'Opening',time:h(openingEnd*.32),feel:feel('Opening',top),proj:Math.round(135*peak),hours:openingEnd*.32},{t:openingEnd,v:peak*(fresh?.78:.88),phase:'Opening',time:h(openingEnd),feel:feel('Opening',top),proj:Math.round(112*peak),hours:openingEnd},{t:heartEnd*.62,v:Math.min(.88,.52+heart.length*.04+(sweet?.1:0)),phase:'Heart',time:h(heartEnd*.62),feel:feel('Heart',heart),proj:Math.round(74*peak),hours:heartEnd*.62},{t:heartEnd,v:Math.min(.7,.40+heart.length*.035+(woody?.08:0)),phase:'Heart',time:h(heartEnd),feel:feel('Heart',heart),proj:Math.round(48*peak),hours:heartEnd},{t:max*.78,v:Math.min(.62,tail+.12),phase:'Dry-down',time:h(max*.78),feel:feel('Dry-down',base),proj:Math.round(25*peak),hours:max*.78},{t:max,v:.05,phase:'Dry-down',time:`${max} h`,feel:feel('Dry-down',base),proj:Math.max(3,Math.round(5*peak)),hours:max},{t:timelineMax,v:.03,phase:'Afterglow',time:`After ${max} h`,feel:'Only a faint 2–5% trace may remain beyond the estimated wear window.',proj:2,hours:timelineMax}];
  const notes=[
    {t:openingEnd/timelineMax,label:(top[0]||'Top note'),kind:'Opening'},
    {t:heartEnd/timelineMax,label:(heart[0]||'Heart note'),kind:'Heart'},
    {t:.76,label:(base[0]||'Base note'),kind:'Dry-down'}
  ];
  return {kf:kf.map(k=>({...k,t:k.t/timelineMax})),notes,peak,longevity,timelineMax,phases:{openingEnd:openingEnd/timelineMax,heartEnd:heartEnd/timelineMax,maxEnd:max/timelineMax}};
}
function monotoneCurve(pts,steps=24){
  if(pts.length<2)return pts;
  const slopes=pts.slice(0,-1).map((p,i)=>(pts[i+1][1]-p[1])/(pts[i+1][0]-p[0]||1));
  const tangents=pts.map((_,i)=>i===0?slopes[0]:i===pts.length-1?slopes.at(-1):(slopes[i-1]*slopes[i]<=0?0:(slopes[i-1]+slopes[i])/2));
  slopes.forEach((s,i)=>{
    if(s===0){tangents[i]=0;tangents[i+1]=0;return;}
    const a=tangents[i]/s,b=tangents[i+1]/s,magnitude=a*a+b*b;
    if(magnitude>9){const scale=3/Math.sqrt(magnitude);tangents[i]=scale*a*s;tangents[i+1]=scale*b*s;}
  });
  const out=[];
  for(let i=0;i<pts.length-1;i++){
    const [x0,y0]=pts[i],[x1,y1]=pts[i+1],dx=x1-x0;
    for(let n=0;n<steps;n++){
      const t=n/steps,t2=t*t,t3=t2*t;
      out.push([x0+dx*t,(2*t3-3*t2+1)*y0+(t3-2*t2+t)*dx*tangents[i]+(-2*t3+3*t2)*y1+(t3-t2)*dx*tangents[i+1]]);
    }
  }
  out.push(pts.at(-1));return out;
}
function lerp(a,b,t){return a+(b-a)*t;}
function yOnCurve(points,x){
  if(!points.length)return 0;
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1];
    if(x>=a[0]&&x<=b[0]){
      const f=b[0]!==a[0]?(x-a[0])/(b[0]-a[0]):0;
      return lerp(a[1],b[1],f);
    }
  }
  return points[x<points[0][0]?0:points.length-1][1];
}
export function ScentJourney({product}){
  const {kf,notes,longevity,timelineMax,phases}=useMemo(()=>makeJourney(product),[product]);
  const canvas=useRef(null),wrap=useRef(null),raf=useRef(0);
  const [hover,setHover]=useState(null),[chartWidth,setChartWidth]=useState(0); const dragging=useRef(false);
  const PL=28,PR=28;

  useEffect(()=>{
    const measure=()=>setChartWidth(Math.max(280,Math.round(wrap.current?.clientWidth||0)));
    measure();
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
    if(observer&&wrap.current)observer.observe(wrap.current);
    window.addEventListener('resize',measure);
    return()=>{observer?.disconnect();window.removeEventListener('resize',measure);};
  },[]);

  useEffect(()=>{
    const cv=canvas.current;if(!cv)return;
    const ctx=cv.getContext('2d');
    const W=Math.max(280,chartWidth||Math.round(wrap.current?.clientWidth||720)),compact=W<560,H=compact?250:Math.max(260,Math.min(360,Math.round(W*.32))),PT=18,PB=compact?50:76,cW=W-PL-PR,cH=H-PT-PB;
    const DPR=Math.min(3,window.devicePixelRatio||1);
    cv.width=W*DPR;cv.height=H*DPR;cv.style.width='100%';cv.style.height=`${H}px`;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    const px=t=>PL+t*cW,py=v=>PT+cH-v*cH;
    const points=monotoneCurve(kf.map(k=>[px(k.t),py(k.v)]));
    const phaseColor=p=>p==='Opening'?'#d2ad36':p==='Heart'?'#54b96a':p==='Afterglow'?'#8a8060':'#8f8e53';
    const getAt=t=>{
      let i=kf.findIndex((k,j)=>t>=k.t&&t<=(kf[j+1]?.t??1)); if(i<0)i=kf.length-2;
      const a=kf[i],b=kf[Math.min(i+1,kf.length-1)],f=b.t>a.t?(t-a.t)/(b.t-a.t):0;
      const hours=t*timelineMax,isAfter=hours>longevity.max;
      return {...a,v:lerp(a.v,b.v,f),proj:Math.round(lerp(a.proj,b.proj,f)),time:displayHour(Math.min(hours,longevity.max),longevity.max,isAfter),phase:isAfter?'Afterglow':(f<.5?a.phase:b.phase),feel:isAfter?'Only a faint 2–5% trace may remain beyond the estimated wear window.':(f<.5?a.feel:b.feel)};
    };
    const draw=t=>{
      ctx.clearRect(0,0,W,H);
      const bands=[[0,phases.openingEnd,'rgba(252,196,41,.07)'],[phases.openingEnd,phases.heartEnd,'rgba(45,155,73,.08)'],[phases.heartEnd,phases.maxEnd,'rgba(147,142,83,.07)'],[phases.maxEnd,1,'rgba(70,66,51,.11)']];
      bands.forEach(([a,b,c])=>{ctx.fillStyle=c;ctx.fillRect(px(a),PT,(b-a)*cW,cH);});
      ctx.strokeStyle='rgba(252,196,41,.22)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(PL,PT+cH);ctx.lineTo(W-PR,PT+cH);ctx.stroke();
      const ticks=[[0,'Spray'],...([.25,.5,.75,1].map(f=>[longevity.max*f/timelineMax,displayHour(longevity.max*f,longevity.max)]))];
      ticks.forEach(([tt,label])=>{const x=px(tt);ctx.strokeStyle='rgba(167,127,18,.28)';ctx.beginPath();ctx.moveTo(x,PT+cH);ctx.lineTo(x,PT+cH+4);ctx.stroke();ctx.fillStyle='#6d5a25';ctx.font='600 11px Lato,Arial';ctx.textAlign='center';ctx.fillText(label,x,PT+cH+17);});
      [['Opening',compact?.13:phases.openingEnd/2,'#d2ad36'],['Heart',compact?.45:(phases.openingEnd+phases.heartEnd)/2,'#54b96a'],['Dry-down',compact?.78:(phases.heartEnd+phases.maxEnd)/2,'#9d8c4c']].forEach(([label,x,c])=>{ctx.fillStyle=c;ctx.font=`700 ${compact?9:10}px Lato,Arial`;ctx.textAlign='center';ctx.fillText(label,px(x),PT+cH+34);});
      ctx.fillStyle='#82785b';ctx.font=`700 ${W<520?7:9}px Lato,Arial`;ctx.textAlign='right';ctx.fillText(W<520?'TRACE':'AFTERGLOW · 2–5% TRACE',W-PR-3,PT+13);
      ctx.beginPath();ctx.moveTo(points[0][0],PT+cH);points.forEach(p=>ctx.lineTo(p[0],p[1]));ctx.lineTo(points.at(-1)[0],PT+cH);ctx.closePath();
      const fill=ctx.createLinearGradient(0,PT,0,PT+cH);fill.addColorStop(0,'rgba(58,127,63,.10)');fill.addColorStop(1,'rgba(252,196,41,.02)');ctx.fillStyle=fill;ctx.fill();
      ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle='#a77f12';ctx.lineWidth=2.6;ctx.shadowColor='rgba(167,127,18,.20)';ctx.shadowBlur=3;ctx.stroke();ctx.shadowBlur=0;
      notes.forEach(n=>{const x=px(n.t);ctx.strokeStyle='rgba(167,127,18,.28)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,PT+8);ctx.lineTo(x,PT+cH-3);ctx.stroke();ctx.setLineDash([]);if(!compact){ctx.fillStyle='#4a463b';ctx.font='600 11px Lato,Arial';ctx.textAlign='center';ctx.fillText(n.label.length>23?n.label.slice(0,23)+'…':n.label,x,PT+cH+53);}});
      if(t!=null){
        const d=getAt(t),x=px(t),y=yOnCurve(points,x),c=phaseColor(d.phase);
        ctx.strokeStyle=c;ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,PT);ctx.lineTo(x,PT+cH);ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
      }
    };
    draw(hover);
    return()=>cancelAnimationFrame(raf.current);
  },[kf,notes,hover,longevity,phases,timelineMax,chartWidth]);

  const setT=e=>{
    const r=canvas.current?.getBoundingClientRect();if(!r)return;
    const scale=r.width/(chartWidth||r.width),leftPadding=PL*scale,rightPadding=PR*scale;
    const t=Math.max(0,Math.min(1,(e.clientX-r.left-leftPadding)/(r.width-leftPadding-rightPadding)));setHover(t);
  };
  const active=hover==null?null:(()=>{
    let i=kf.findIndex((k,j)=>hover>=k.t&&hover<=(kf[j+1]?.t??1));if(i<0)i=kf.length-2;
    const a=kf[i],b=kf[i+1],f=(hover-a.t)/(b.t-a.t);
    const v=lerp(a.v,b.v,f),proj=Math.round(lerp(a.proj,b.proj,f)),hours=hover*timelineMax,isAfter=hours>longevity.max;return {phase:isAfter?'Afterglow':(f<.5?a.phase:b.phase),time:displayHour(Math.min(hours,longevity.max),longevity.max,isAfter),feel:isAfter?'Only a faint 2–5% trace may remain beyond the estimated wear window.':(f<.5?a.feel:b.feel),v,proj};
  })();

  return <section className="ee-scent-journey">
    <div className="sj-kicker">{product.name?.toUpperCase()}</div>
    <h2>The life of this fragrance</h2>
    <p className="sj-hint"><Sparkles size={13}/> Estimated wear: <b>{longevity.label}</b> · move across the curve to follow its evolution</p><p className="sj-disclaimer">* Wear time is an estimate, not a guarantee. It varies with skin, clothing, weather, storage and application. The afterglow represents only a faint 2–5% trace.</p>
    <div className="sj-chart-wrap" ref={wrap}>
      <canvas ref={canvas} className="sj-canvas" onMouseEnter={e=>setT(e)} onMouseMove={e=>{if(dragging.current||e.buttons===0)setT(e)}} onMouseDown={e=>{dragging.current=true;setT(e)}} onMouseUp={()=>{dragging.current=false}} onMouseLeave={()=>{if(!dragging.current)setHover(null)}} onTouchStart={e=>setT({clientX:e.touches[0].clientX})} onTouchMove={e=>setT({clientX:e.touches[0].clientX})}/>
      {active && <div className="sj-tooltip" style={{left:`${Math.min(chartWidth<560?70:82,Math.max(chartWidth<560?30:18,((PL+(hover??0)*Math.max(1,(chartWidth||720)-PL-PR))/(chartWidth||720))*100))}%`}}>
        <strong>{active.phase}</strong><b>{active.time} · {Math.round(active.v*100)}%</b><span>{active.feel}</span>
      </div>}
    </div>
    <div className="sj-note-summary"><div><span>OPENING</span><b>{product.top||'—'}</b></div><div><span>HEART</span><b>{product.mid||'—'}</b></div><div><span>DRY-DOWN</span><b>{product.base||'—'}</b></div></div>
    <div className="sj-stats">
      <div><span>PHASE</span><b>{active?.phase||'Move across the wave'}</b><small>{active?.time||'See the transition'}</small></div>
      <div><span>INTENSITY</span><b>{active? (active.v>.8?'Very strong':active.v>.58?'Strong':active.v>.34?'Moderate':active.v>.17?'Refined':'Intimate'):'—'}</b><small>{active?`${Math.round(active.v*100)}% of peak`:'—'}</small></div>
      <div><span>PROJECTION</span><b>{active?`${active.proj} cm`:'—'}</b><small>{active?(active.proj>100?'Commands the room':active.proj>60?'Fills your space':active.proj>30?'Personal aura':'Skin close'):'How far it travels'}</small></div>
    </div>
    <div className="sj-tags">
      {(product.accords||[]).slice(0,5).map(a=><span key={a}>{a}</span>)}
    </div>
  </section>;
}

function WhySection(){return <section className="ee-why"><div className="ee-section-title"><span/>WHY ETERNAL ESSENCE<span/></div><div className="ee-why-grid"><div><b>100+ HAPPY CUSTOMERS</b><span>And counting</span></div><div><b>CURATED FRAGRANCE OILS</b><span>Selected for character</span></div><div><b>LONG-LASTING PROFILES</b><span>Built for day-to-night wear</span></div><div><b>TOP · HEART · BASE</b><span>Clear scent journey</span></div><div><b>CRUELTY-CONSCIOUS</b><span>Responsible product choices</span></div><div><b>QUALITY ASSURED</b><span>Made for repeat wear</span></div></div></section>}
function ProductFooter(){return <footer className="ee-product-footer"><img src="/products/ee-brand-20260819.webp" alt="Eternal Essence"/><div><b>ETERNAL ESSENCE</b><span>Essence, Redefined.</span></div><small>© 2026 Eternal Essence · Byculla, Mumbai</small></footer>}
function readCartCount(){
  try{
    const cart=window.EE?.getCart?.()||JSON.parse(localStorage.getItem('ee_cart_v1')||'[]');
    return Number(cart?.reduce?.((sum,item)=>sum+Number(item.quantity||item.qty||1),0)||0);
  }catch{return 0;}
}

export default function ProductPage({product,route,onBack}){
  const [p,setP]=useState(()=>normalize(product)),[size,setSize]=useState(null),[qty,setQty]=useState(1),[img,setImg]=useState(0),[wish,setWish]=useState(false),[reviews,setReviews]=useState([]);
  const [variantNotice,setVariantNotice]=useState('');
  const [variantStock,setVariantStock]=useState({});
  const [viewerCount,setViewerCount]=useState(0);
  const [cartCount,setCartCount]=useState(readCartCount);
  const pendingSelection=window.__eePendingProductSelection;
  const requestedSize=new URLSearchParams(location.search).get('size')||pendingSelection?.size||'';
  const isEditingCartItem=pendingSelection?.cartIndex!=null&&String(pendingSelection?.productId||'').replace(/^db_/,'')===String(p?.id||'').replace(/^db_/,'');
  useEffect(()=>{
    const sync=()=>setCartCount(readCartCount());
    window.addEventListener('ee:cart-updated',sync);
    const timer=setInterval(sync,700);
    return()=>{window.removeEventListener('ee:cart-updated',sync);clearInterval(timer);};
  },[]);
  useEffect(()=>{setP(normalize(product));},[product]);
  useEffect(()=>{if(!p?.id)return;let active=true;const base=window.EE?.getBackendBase?.()||'http://localhost:5000';fetch(`${base}/api/products/inventory?productId=${encodeURIComponent(p.id)}`).then(response=>response.json()).then(data=>{if(active&&data.success)setVariantStock(Object.fromEntries((data.inventory||[]).map(item=>[item.variantKey,Number(item.available)])));}).catch(()=>{});return()=>{active=false};},[p?.id]);
  useEffect(()=>{
    if(!p?.id)return;
    let active=true;
    const base=window.EE?.getBackendBase?.()||'http://localhost:5000';
    const visitorId=window.eeAnalyticsVisitorId?.()||sessionStorage.getItem('ee_analytics_visitor_v1');
    const heartbeat=()=>fetch(`${base}/api/analytics/products/${encodeURIComponent(p.id)}/heartbeat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId,productName:p.name})}).then(response=>response.json()).then(data=>{if(active&&data.success)setViewerCount(Number(data.displayCount||0));}).catch(()=>{});
    window.eeTrackAnalytics?.('product_view',{productId:p.id,productName:p.name});
    heartbeat();
    const timer=setInterval(heartbeat,20000);
    return()=>{active=false;clearInterval(timer);fetch(`${base}/api/analytics/products/${encodeURIComponent(p.id)}/heartbeat`,{method:'DELETE',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({visitorId})}).catch(()=>{});};
  },[p?.id,p?.name]);
  useEffect(()=>{
    if(!p)return;
    const sizes=getSizes(p),selection=sizeFromUrl(p,sizes),nextSize=selection.size;setSize(nextSize);
    setVariantNotice(selection.unavailable?`The shared size “${selection.requested}” is no longer available. Please choose one of the available sizes below.`:'');
    const pending=window.__eePendingProductSelection;
    if(pending?.cartIndex!=null&&String(pending.productId||'').replace(/^db_/,'')===String(p.id||'').replace(/^db_/,''))setQty(Math.max(1,Math.floor(Number(pending.quantity)||1)));
    else setQty(1);
    try{setWish(!!window.EE?.isWishlistSaved?.(p.id,`${nextSize?.value} ${nextSize?.unit}`));}catch{}
    try{window.EE?.getReviews?.(p.id).then(d=>setReviews(d?.reviews||[])).catch(()=>{});}catch{}
  },[p?.id,requestedSize,route?.slug,route?.legacyId]);
  useEffect(()=>{
    if(!p||!size)return;
    try{setWish(!!window.EE?.isWishlistSaved?.(p.id,`${size.value} ${size.unit}`));}catch{}
  },[p?.id,size]);
  useEffect(()=>{
    if(p&&size){
      const idx=variantIndex(size);setImg(idx);
      const pr=pricing(p.price,size.priceMultiplier);window.EE?.setSelection?.(p,`${size.value} ${size.unit}`,pr.selling,idx);
    }
  },[p,size]);
  if(!p)return <div className="ee-notfound"><h1>Fragrance not found</h1><button onClick={onBack}>Back to collection</button></div>;
  const sizes=getSizes(p),selectedSize=size||sizes[0],pr=pricing(p.price,selectedSize?.priceMultiplier||1),gallery=p.images?.length?p.images:[p.image];
  const selectedStock=variantStock.shared??variantStock[normalizeSizeLabel(`${selectedSize?.value} ${selectedSize?.unit}`)]??12;
  const selectedVariantIndex=variantIndex(selectedSize);
  const currentSources=img===selectedVariantIndex ? variantImages(p,selectedSize) : [imgUrl(gallery[img])];
  const add=()=>{
    if(selectedStock<=0){setVariantNotice(`${selectedSize.value} ${selectedSize.unit} is currently out of stock. Please choose another size.`);return;}
    const editing=isEditingCartItem;
    window.EE?.addToCart?.(p,`${selectedSize.value} ${selectedSize.unit}`,pr.selling,qty);
    window.__eePendingProductSelection=null;
    setTimeout(()=>{
      setCartCount(readCartCount());window.dispatchEvent(new Event('ee:cart-updated'));
      if(editing)goCart();
    },80);
  };
  const toggle=()=>{try{window.EE?.setSelection?.(p,`${selectedSize.value} ${selectedSize.unit}`,pr.selling,variantIndex(selectedSize));window.EE?.toggleWishlist?.();setWish(v=>!v);}catch{}};
  const selectSize=nextSize=>{setSize(nextSize);setImg(variantIndex(nextSize));setVariantNotice('');const url=new URL(location.href);url.searchParams.set('size',`${nextSize.value} ${nextSize.unit}`);history.replaceState(history.state,'',`${url.pathname}${url.search}${url.hash}`);};
  const share=()=>{const url=new URL(location.href);url.searchParams.set('size',`${selectedSize.value} ${selectedSize.unit}`);const sharedUrl=url.toString();navigator.share?navigator.share({title:p.name,text:`${p.name} – Eternal Essence`,url:sharedUrl}).catch(()=>{}):navigator.clipboard?.writeText(sharedUrl);};
  const goCart=()=>{if(window.eeNavigatePage)window.eeNavigatePage('cart');else{history.pushState({},'', '/cart');window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:'/cart'}}));}};
  return <div className="ee-product-page">
    <div className="ee-product-toolbar"><button onClick={()=>window.eeNavigateCollection?.(categorySlug(p))||onBack()}><ArrowLeft size={16}/> Collection</button><button className="ee-floating-cart" onClick={goCart}><ShoppingCart size={17}/><span>Cart</span><b>{cartCount}</b></button></div>
    <div className="ee-breadcrumb"><button type="button" onClick={()=>window.eeNavigateCollection?.('all')}>Products</button><b>/</b><button type="button" onClick={()=>window.eeNavigateCollection?.(categorySlug(p))}>{categorySlug(p)}</button><b>/</b><strong>{productSlug(p)}</strong></div>
    <div className="ee-product-hero">
      <div className="ee-product-gallery"><div className="ee-thumbs">{gallery.slice(0,9).map((g,i)=><button key={i} className={i===img?'active':''} onClick={()=>{setImg(i);window.EE?.setSelection?.(p,`${size?.value} ${size?.unit}`,pr.selling,i)}}><img src={imgUrl(g)} alt=""/></button>)}</div><div className="ee-main-image"><button onClick={()=>setImg((img+gallery.length-1)%gallery.length)}><ChevronLeft/></button><ProductImage sources={currentSources} alt={p.name}/><button onClick={()=>setImg((img+1)%gallery.length)}><ChevronRight/></button></div></div>
      <div className="ee-product-info">{isEditingCartItem&&<div className="ee-editing-cart">EDITING CART ITEM</div>}<div className="ee-gender">{p.gender||'UNISEX'}</div><h1>{p.name}</h1><div className="ee-meta">{(p.family||'SIGNATURE FRAGRANCE').toUpperCase()}</div>{viewerCount>0&&<div className="ee-live-viewers" role="status"><Eye size={15}/><span><b>{viewerCount}</b> people are viewing this fragrance now</span><i/></div>}<div className="ee-divider"/><p className="ee-quote">“A fragrance journey designed around character, balance and a memorable dry-down.”</p><div className="ee-best"><div><span>BEST FOR</span><b>{p.time||'Day & Night'} · {p.season||'All seasons'}</b></div><div><span>MOOD</span><b>{p.accords?.slice(0,3).join(' · ')||'Signature'}</b></div></div><div className="ee-price"><div><strong>₹{pr.selling.toLocaleString('en-IN')}</strong> <del>₹{pr.mrp.toLocaleString('en-IN')}</del><em>{pr.discount}% OFF</em></div><div className="ee-qty" aria-label="Product quantity"><button type="button" aria-label="Decrease quantity" onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={15}/></button><b>{qty}</b><button type="button" aria-label="Increase quantity" disabled={qty>=selectedStock} onClick={()=>setQty(Math.min(selectedStock,qty+1))}><Plus size={15}/></button></div></div><span className="ee-label">SELECT SIZE · {selectedStock>2?'IN STOCK':selectedStock>0?`HURRY — ONLY ${selectedStock} LEFT`:'OUT OF STOCK'}</span>{variantNotice&&<div className="ee-variant-notice" role="status">{variantNotice}</div>}<div className="ee-sizes">{sizes.map((s,i)=><button key={i} className={s===size?'selected':''} onClick={()=>selectSize(s)}>{s.value} {s.unit}</button>)}</div><div className="ee-actions"><button className={'ee-icon '+(wish?'saved':'')} onClick={toggle}><Heart fill={wish?'currentColor':'none'}/></button><button className="ee-icon" onClick={share}><Share2/></button><button className="ee-add" disabled={selectedStock<=0} onClick={add}><ShoppingBag size={18}/> {selectedStock<=0?'OUT OF STOCK':isEditingCartItem?'UPDATE CART':'ADD TO CART'}</button></div><div className="ee-micro"><span>✓ All India shipping</span><span>✓ Secure checkout</span><span>✓ Quality assured</span></div></div>
    </div>
    <ScentJourney product={p}/>
    <section className="ee-notes ee-accords-only"><div><span className="ee-kicker">MAIN ACCORDS</span><div className="ee-chips">{(p.accords||[]).map(a=><span key={a}>{a}</span>)}</div></div></section>
    <WhySection/>
    <section className="ee-reviews"><div className="ee-section-title"><span/>CUSTOMER REVIEWS<span/></div>{reviews.length?<div className="review-grid">{reviews.slice(0,8).map((r,i)=><div className="review-card" key={i}><div className="stars">{'★'.repeat(Number(r.rating)||5)}</div><b>{r.name||r.user?.name||r.userEmail?.split('@')[0]||'Customer'}</b><p>{r.comment||r.review||r.text||''}</p></div>)}</div>:<p className="empty-reviews">No reviews yet for this fragrance.</p>}</section><ProductFooter/>
  </div>;
}
