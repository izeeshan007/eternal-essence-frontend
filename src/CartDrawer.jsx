import React,{useEffect,useMemo,useState} from 'react';
import {ArrowRight,ShoppingBag,X} from 'lucide-react';

const BRAND_IMAGE='/products/ee-brand-20260819.webp';
const money=value=>`₹${Math.round(Number(value||0)).toLocaleString('en-IN')}`;
const quantity=item=>Math.max(1,Math.floor(Number(item?.quantity||item?.qty)||1));
const imageUrl=value=>{
  if(!value)return BRAND_IMAGE;
  const raw=String(value);
  if(/^https?:\/\//i.test(raw))return raw;
  return `/products/${raw.split('/').pop().replace(/\.(png|jpe?g)$/i,'.webp')}`;
};

export default function CartDrawer(){
  const[open,setOpen]=useState(false);
  const[items,setItems]=useState([]);
  const sync=()=>setItems([...(window.EE?.getCart?.()||[])]);
  useEffect(()=>{
    const show=()=>{sync();setOpen(true)};
    const update=()=>sync();
    const close=()=>setOpen(false);
    window.addEventListener('ee:mini-cart-open',show);
    window.addEventListener('ee:cart-updated',update);
    window.addEventListener('ee:route',close);
    return()=>{window.removeEventListener('ee:mini-cart-open',show);window.removeEventListener('ee:cart-updated',update);window.removeEventListener('ee:route',close)};
  },[]);
  useEffect(()=>{
    if(!open)return;
    const onKey=event=>{if(event.key==='Escape')setOpen(false)};
    document.addEventListener('keydown',onKey);
    return()=>document.removeEventListener('keydown',onKey);
  },[open]);
  const total=useMemo(()=>items.reduce((sum,item)=>sum+Number(item.finalPrice||item.price||0)*quantity(item),0),[items]);
  const count=useMemo(()=>items.reduce((sum,item)=>sum+quantity(item),0),[items]);
  const goCart=()=>{setOpen(false);window.eeNavigatePage?.('cart')};
  const continueShopping=()=>{
    setOpen(false);
    if(location.pathname==='/cart')window.eeNavigateCollection?.('all');
  };
  const viewItem=item=>{
    if(item.itemType&&item.itemType!=='product'){goCart();return;}
    setOpen(false);
    window.eeNavigateToProduct?.(item.id||item.productId,{name:item.name,size:item.selectedSize});
  };
  if(!open)return null;
  return <div className="ee-mini-cart-layer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
    <aside className="ee-mini-cart" role="dialog" aria-modal="true" aria-labelledby="ee-mini-cart-title">
      <header><div><span>YOUR BAG</span><h2 id="ee-mini-cart-title">Cart preview</h2></div><button type="button" aria-label="Close cart preview" onClick={()=>setOpen(false)}><X/></button></header>
      {items.length?<>
        <div className="ee-mini-cart-items">{items.slice(0,4).map((item,index)=><button type="button" className="ee-mini-cart-item" onClick={()=>viewItem(item)} key={`${item.id||item.productId||item.name}-${item.selectedSize}-${index}`}>
          <img src={imageUrl(item.image||item.images?.[0])} alt="" onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src=BRAND_IMAGE}}/>
          <span><b>{item.name}</b><small>{item.selectedSize||item.size||'Standard'} · Qty {quantity(item)}</small></span>
          <strong>{money(Number(item.finalPrice||item.price||0)*quantity(item))}</strong>
        </button>)}</div>
        {items.length>4&&<p className="ee-mini-cart-more">+ {items.length-4} more item{items.length-4===1?'':'s'} in your cart</p>}
        <div className="ee-mini-cart-total"><span>{count} item{count===1?'':'s'}</span><b>{money(total)}</b></div>
      </>:<div className="ee-mini-cart-empty"><ShoppingBag/><b>Your cart is empty</b><span>Explore the collection and find your next signature.</span></div>}
      <footer>
        <button type="button" className="secondary" onClick={continueShopping}>Continue shopping</button>
        {items.length>0&&<button type="button" className="primary" onClick={goCart}>View cart &amp; checkout <ArrowRight/></button>}
      </footer>
    </aside>
  </div>;
}
