
import React,{useEffect,useState} from 'react';

const DAY=24*60*60*1000;
const backendBase=()=>window.EE?.getBackendBase?.()||window.__EE_CONFIG__?.BACKEND_BASE_URL||((location.hostname==='localhost'||location.hostname==='127.0.0.1')?'http://localhost:5000':'https://eternal-essence-backend.onrender.com');

function offerHeading(offer){
  if(offer.offerType==='buy_x_get_y')return <>BUY {offer.requiredQuantity}, GET <span>{offer.freeQuantity}</span></>;
  if(offer.offerType==='percentage')return <><span>{offer.discountValue}%</span> OFF</>;
  return <>SAVE <span>₹{Number(offer.discountValue||0).toLocaleString('en-IN')}</span></>;
}

export default function OfferPopup(){
  const [offer,setOffer]=useState(null),[open,setOpen]=useState(false),[left,setLeft]=useState(10*60);
  useEffect(()=>{
    let active=true;
    fetch(`${backendBase()}/api/offers/featured`).then(r=>r.json()).then(data=>{
      if(!active||!data.success||!data.offer)return;
      const key=`ee_offer_last_shown_${data.offer._id||data.offer.code}`;
      let show=false;
      try{const last=Number(localStorage.getItem(key)||0);if(Date.now()-last>=DAY){localStorage.setItem(key,String(Date.now()));show=true;}}catch{show=true}
      if(show){setOffer(data.offer);setOpen(true);}
    }).catch(()=>{});
    return()=>{active=false};
  },[]);
  useEffect(()=>{if(!open)return;const timer=setInterval(()=>setLeft(value=>value>0?value-1:0),1000);return()=>clearInterval(timer);},[open]);
  if(!open||!offer)return null;
  const mm=String(Math.floor(left/60)).padStart(2,'0'),ss=String(left%60).padStart(2,'0');
  const activate=async()=>{try{await window.EE?.activateOfferAndGoCart?.(offer.code);window.eeNavigatePage?.('cart');}catch{}setOpen(false)};
  return <div className="ee-offer-overlay" onClick={()=>setOpen(false)}><div className="ee-offer-modal" onClick={event=>event.stopPropagation()}><button className="ee-offer-close" aria-label="Close offer" onClick={()=>setOpen(false)}>×</button><div className="ee-offer-brand">ETERNAL ESSENCE</div><div className="ee-offer-pill">LIMITED COLLECTION OFFER</div><h2>{offerHeading(offer)}</h2><p>{offer.description||'Add the eligible fragrances to your cart and the offer will be calculated securely at checkout.'}</p><div className="ee-coupon"><small>OFFER CODE</small><strong>{offer.code}</strong><span>Eligibility and savings are validated automatically in your cart.</span></div><div className="ee-count"><b>OFFER WINDOW</b><div><strong>{mm}</strong><em>:</em><strong>{ss}</strong></div><small>MINS&nbsp;&nbsp;&nbsp;&nbsp;SECS</small></div><button className="ee-offer-cta" onClick={activate}>EXPLORE THE OFFER</button></div></div>;
}
