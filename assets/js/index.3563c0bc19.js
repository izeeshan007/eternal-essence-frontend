function openRejectOrderModal(orderId){
document.getElementById('reject-order-id').value = orderId || '';
document.getElementById('reject-reason-preset').value = '';
document.getElementById('reject-reason-text').value = '';
document.getElementById('reject-order-msg').textContent = '';
document.getElementById('reject-order-modal').classList.remove('hidden');
document.body.style.overflow='hidden';
}
function closeRejectOrderModal(){
document.getElementById('reject-order-modal')?.classList.add('hidden');
document.body.style.overflow='';
}
function applyRejectReasonPreset(){
const preset=document.getElementById('reject-reason-preset')?.value||'';
if(preset && !preset.startsWith('Other')) document.getElementById('reject-reason-text').value=preset;
}
async function confirmRejectOrder(){
const orderId=document.getElementById('reject-order-id')?.value;
const reason=document.getElementById('reject-reason-text')?.value.trim();
const msg=document.getElementById('reject-order-msg');
if(!reason){ msg.textContent='Please select or write a rejection reason.'; msg.className='text-xs mt-2 text-red-600'; return; }
if(typeof window.performRejectOrder === 'function'){
await window.performRejectOrder(orderId, reason);
closeRejectOrderModal();
return;
}
msg.textContent='The customer page is ready. Connect performRejectOrder(orderId, reason) in your admin page to its existing rejection API.';
msg.className='text-xs mt-2 text-amber-700';
}