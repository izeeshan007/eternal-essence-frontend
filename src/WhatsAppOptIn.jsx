import React,{useEffect,useState} from 'react';
import {MessageCircle,X} from 'lucide-react';

const DISMISS_KEY='ee_whatsapp_prompt_dismissed_at';
const ACCEPTED_KEY='ee_whatsapp_prompt_accepted';
const DISMISS_MS=7*24*60*60*1000;

export default function WhatsAppOptIn({backendBase,visitorId}){
  const [config,setConfig]=useState(null),[visible,setVisible]=useState(false),[phone,setPhone]=useState(''),[consent,setConsent]=useState(false),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{
    let active=true;
    fetch(`${backendBase}/api/whatsapp/config`).then(response=>response.json()).then(data=>{if(active&&data.success)setConfig(data)}).catch(()=>{});
    return()=>{active=false};
  },[backendBase]);
  useEffect(()=>{
    if(!config?.enabled||localStorage.getItem(ACCEPTED_KEY)==='1')return;
    const dismissed=Number(localStorage.getItem(DISMISS_KEY)||0);
    if(Date.now()-dismissed<DISMISS_MS)return;
    const reveal=()=>setVisible(true);
    const onEngagement=event=>{if(event.detail?.eligible)setTimeout(reveal,650)};
    const onExit=event=>{if(window.innerWidth>=900&&event.clientY<=4)reveal()};
    window.addEventListener('ee:whatsapp-engagement',onEngagement);
    document.addEventListener('mouseout',onExit);
    return()=>{window.removeEventListener('ee:whatsapp-engagement',onEngagement);document.removeEventListener('mouseout',onExit)};
  },[config]);
  const dismiss=()=>{localStorage.setItem(DISMISS_KEY,String(Date.now()));setVisible(false)};
  const trackClick=()=>fetch(`${backendBase}/api/whatsapp/cta-click`,{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({visitorId,path:location.pathname+location.search})}).catch(()=>{});
  const submit=async()=>{
    setStatus('');
    if(config.mode==='click_to_chat'){
      await trackClick();
      if(config.clickToChatUrl)window.open(config.clickToChatUrl,'_blank','noopener,noreferrer');
      localStorage.setItem(DISMISS_KEY,String(Date.now()));setVisible(false);return;
    }
    if(!phone.trim()){setStatus('Enter your WhatsApp mobile number.');return}
    if(!consent){setStatus('Please confirm WhatsApp marketing consent.');return}
    try{
      setBusy(true);
      const response=await fetch(`${backendBase}/api/whatsapp/consent`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId,phone,consent:true,source:'welcome_popup',path:location.pathname+location.search})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.success)throw new Error(data.error||'Could not save your preference.');
      localStorage.setItem(ACCEPTED_KEY,'1');setStatus('You’re in — your WhatsApp welcome offer is being prepared.');
      setTimeout(()=>setVisible(false),1800);
    }catch(error){setStatus(error.message)}finally{setBusy(false)}
  };
  if(!visible||!config?.enabled)return null;
  return <div className="ee-wa-layer" role="dialog" aria-modal="true" aria-labelledby="ee-wa-title">
    <section className="ee-wa-card">
      <button type="button" className="ee-wa-close" onClick={dismiss} aria-label="Not now"><X size={18}/></button>
      <div className="ee-wa-mark"><MessageCircle size={25}/></div>
      <span className="ee-wa-kicker">A PRIVATE WELCOME</span>
      <h2 id="ee-wa-title">Get ₹100 OFF on WhatsApp</h2>
      <p>Receive your welcome offer, cart reminders and occasional Eternal Essence offers on WhatsApp.</p>
      {config.mode==='cloud_api'&&<>
        <label className="ee-wa-phone"><span>WHATSAPP NUMBER</span><input value={phone} onChange={event=>setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="e.g. 98765 43210"/></label>
        <label className="ee-wa-consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/><span>I agree to receive WhatsApp marketing from Eternal Essence. I can reply STOP at any time.</span></label>
      </>}
      {config.mode==='click_to_chat'&&<small>WhatsApp will open with a prefilled request. Opening the chat does not subscribe you automatically.</small>}
      <button type="button" className="ee-wa-primary" disabled={busy} onClick={submit}><MessageCircle size={17}/>{busy?'SAVING…':config.mode==='click_to_chat'?'OPEN WHATSAPP':'GET MY ₹100 OFFER'}</button>
      <button type="button" className="ee-wa-later" onClick={dismiss}>Not now</button>
      {status&&<div className="ee-wa-status" role="status">{status}</div>}
    </section>
  </div>;
}
