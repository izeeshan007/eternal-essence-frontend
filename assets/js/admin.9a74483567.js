const BACKEND_BASE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://eternal-essence-backend.onrender.com';
const ADMIN_TOKEN_KEY = 'ee_admin_token_v1';
let adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || null;
const loginCard = document.getElementById('login-card');
const dashboardEl = document.getElementById('dashboard');
const adminStatus = document.getElementById('admin-status');
const ordersTbody = document.getElementById('orders-tbody');
const usersTbody = document.getElementById('users-tbody');
const btnLogin = document.getElementById('btn-admin-login');
const btnLogout = document.getElementById('btn-logout');
const loginMsg = document.getElementById('admin-login-msg');
let orders = [], filtered = [], page = 1, rowsPerPage = 10;
let users = [];
let dateFilter = { startDate: null, endDate: null };
let editingProductId = null;
let adminProducts = [];
let hardcodedProducts = [];
let inventoryByProductId = new Map();
let selectedOrder = null;
let salesChart = null;
let statusChart = null;
let bundleRules = [];
let knownOrderIds = new Set();
let orderNotificationsReady = false;
let orderNotificationPoller = null;
function notifyNewOrders(nextOrders) {
const nextIds = new Set(nextOrders.map(order => String(order._id || order.orderId)));
if (orderNotificationsReady) {
const newOrders = nextOrders.filter(order => !knownOrderIds.has(String(order._id || order.orderId)));
if (newOrders.length) {
const message = `${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} received.`;
document.title = `(${newOrders.length}) New order — Eternal Essence Admin`;
if ('Notification' in window && Notification.permission === 'granted') new Notification('Eternal Essence', { body: message });
else alert(message);
}
}
knownOrderIds = nextIds;
orderNotificationsReady = true;
}
function setAuthUI() {
if (adminToken) {
adminStatus.textContent = 'Authenticated';
loginCard.classList.add('hidden');
dashboardEl.classList.remove('hidden');
btnLogout.classList.remove('hidden');
} else {
adminStatus.textContent = 'Not authenticated';
loginCard.classList.remove('hidden');
dashboardEl.classList.add('hidden');
btnLogout.classList.add('hidden');
ordersTbody.innerHTML = '';
}
}
let adminSessionInvalidated = false;
let adminPageInitializing = false;
let adminInitialLoadDone = false;
let adminReconnectTimer = null;
async function adminFetch(path, opts = {}) {
const headers = new Headers(opts.headers || {});
if (adminToken) headers.set('Authorization', `Bearer ${adminToken}`);
try {
const res = await fetch(BACKEND_BASE_URL + path, { ...opts, headers });
const json = await res.json().catch(() => ({}));
if (res.status === 401) {
const msg = String(json.error || '').toLowerCase();
const realAuthFailure =
msg.includes('invalid token') ||
msg.includes('expired') ||
msg.includes('missing token') ||
msg.includes('jwt');
if (realAuthFailure) invalidateAdminSession(json.error || 'Admin session expired.');
}
return { ok: res.ok, status: res.status, body: json };
} catch (err) {
if (/Failed to fetch|NetworkError|Load failed/i.test(String(err.message || err))) {
throw new Error('Backend is waking up or unreachable. Please try again in a few seconds.');
}
throw err;
}
}
function invalidateAdminSession(message) {
if (adminSessionInvalidated) return;
adminSessionInvalidated = true;
localStorage.removeItem(ADMIN_TOKEN_KEY);
adminToken = null;
if (orderNotificationPoller) {
clearInterval(orderNotificationPoller);
orderNotificationPoller = null;
}
if (adminReconnectTimer) {
clearTimeout(adminReconnectTimer);
adminReconnectTimer = null;
}
adminPageInitializing = false;
setAuthUI();
if (loginMsg) {
loginMsg.textContent = message || 'Please sign in again.';
loginMsg.style.color = 'red';
}
}
async function validateAdminSession() {
if (!adminToken) {
setAuthUI();
return false;
}
try {
const { ok, status, body } = await adminFetch('/api/admin/session');
if (ok) {
adminSessionInvalidated = false;
return true;
}
if (status === 401) return false;
console.warn('Could not validate admin session:', body.error || `HTTP ${status}`);
return null;
} catch (err) {
console.warn('Admin session check temporarily failed:', err.message);
return null;
}
}
function formatINR(n){ return '₹' + Number(n||0).toLocaleString('en-IN'); }
function escapeHtml(s){ if (!s && s !== 0) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const CARD_ASSET_BASE = `${BACKEND_BASE_URL}/card/`;
const CARD_PRODUCT_IMAGES = { attar_2ml: 'card2a.png', attar_3ml: 'card3a.png', perfume_8ml: 'card8p.png' };
function renderAdminCardPreview(meta = {}, small = false) {
const names = meta.occasion === 'birthday'
? `${escapeHtml(meta.personName || 'Name')} ${meta.age ? '- ' + escapeHtml(meta.age) : ''}`
: meta.occasion === 'mehndi'
? `${escapeHtml(meta.brideName || 'Bride')} Ki Mehndi`
: `${escapeHtml(meta.brideName || 'Bride')} & ${escapeHtml(meta.groomName || 'Groom')}`;
const design = meta.design || `${meta.occasion || 'mehndi'}_bg1`;
const productImg = meta.productImage || CARD_PRODUCT_IMAGES[meta.productType] || 'card3a.png';
return `
<div class="admin-card-preview ${small ? 'small' : ''}">
<img class="bg" src="${CARD_ASSET_BASE}${design}.png" onerror="this.style.display='none'">
<div class="txt">
<strong>${escapeHtml(meta.occasionLabel || meta.occasion || '')}</strong>
<div style="margin-top:6px;font-weight:bold;">${names}</div>
${small ? '' : `<div style="margin-top:8px;">${escapeHtml(meta.eventDate || '')}</div><div>${escapeHtml(meta.location || '')}</div><p style="margin-top:10px;line-height:1.4;">${escapeHtml(meta.message || '')}</p>`}
</div>
<img class="prod" src="${CARD_ASSET_BASE}${productImg}" onerror="this.style.display='none'">
</div>
`;
}
function renderCardOrdersTable() {
const tbody = document.getElementById('card-orders-tbody');
if (!tbody) return;
const cardOrders = orders.filter(order => order.orderType === 'perfume_card' || (order.items || []).some(item => item.itemType === 'perfume_card'));
tbody.innerHTML = cardOrders.map(order => {
const item = (order.items || []).find(i => i.itemType === 'perfume_card') || {};
const meta = item.cardMeta || order.cardMeta || {};
return `
<tr class="hover:bg-gray-50 border-b border-gray-100">
<td class="p-3 font-semibold monospace tiny">${escapeHtml(order.orderId || order._id)}</td>
<td class="p-3 tiny"><div class="font-semibold">${escapeHtml(order.name || '')}</div><div class="text-gray-500">${escapeHtml(order.buyerEmail || '')}</div></td>
<td class="p-3 tiny"><div class="flex gap-3 items-center">${renderAdminCardPreview(meta, true)}<div><div class="font-semibold">${escapeHtml(meta.occasionLabel || '')}</div><div>${escapeHtml(meta.productLabel || '')} x ${escapeHtml(meta.qty || 1)}</div><div>${escapeHtml(meta.message || '')}</div></div></div></td>
<td class="p-3 font-bold">${formatINR(order.total)}</td>
<td class="p-3"><button onclick="openOrderModal('${order._id || order.orderId}')" class="px-3 py-1 bg-black text-white rounded tiny hover:text-yellow-500">Open</button></td>
</tr>
`;
}).join('') || `<tr><td colspan="5" class="p-4 text-gray-500">No custom card orders yet.</td></tr>`;
}
btnLogin.addEventListener('click', async ()=> {
const email = document.getElementById('admin-email').value.trim();
const password = document.getElementById('admin-password').value.trim();
if (!email || !password) return;
try {
btnLogin.disabled = true; loginMsg.textContent = 'Signing in...';
const res = await fetch(`${BACKEND_BASE_URL}/api/admin/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
const d = await res.json();
if (!res.ok || !d.success) throw new Error(d.error || 'Login failed');
adminToken = d.token;
localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
adminSessionInvalidated = false;
adminPageInitializing = false;
adminInitialLoadDone = false;
loginMsg.textContent = '';
loginMsg.style.color = '';
setAuthUI();
await initData();
} catch (err) { loginMsg.textContent = err.message; loginMsg.style.color = 'red'; }
finally { btnLogin.disabled = false; }
});
btnLogout.addEventListener('click', logoutAdmin);
function logoutAdmin() {
localStorage.removeItem(ADMIN_TOKEN_KEY);
adminToken = null;
adminSessionInvalidated = false;
adminPageInitializing = false;
adminInitialLoadDone = false;
if (orderNotificationPoller) {
clearInterval(orderNotificationPoller);
orderNotificationPoller = null;
}
if (adminReconnectTimer) {
clearTimeout(adminReconnectTimer);
adminReconnectTimer = null;
}
setAuthUI();
}
async function initData() {
if (!adminToken) return;
if ('Notification' in window && Notification.permission === 'default') {
setTimeout(() => Notification.requestPermission().catch(() => {}), 1500);
}
setAdminLoading(true);
try {
await Promise.allSettled([loadDashboard(), loadOrders()]);
adminInitialLoadDone = true;
setAdminLoading(false);
Promise.allSettled([loadUsers(), loadCoupons(), loadBundleRules()])
.catch(err => console.warn('Secondary admin data load failed:', err));
loadHardcodedProducts()
.then(() => Promise.allSettled([syncAndLoadInventory(), loadAdminProducts()]))
.catch(err => console.warn('Catalogue background load failed:', err));
} catch (err) {
console.error('Admin initialization error:', err);
} finally {
setAdminLoading(false);
}
if (!orderNotificationPoller) {
orderNotificationPoller = setInterval(() => {
if (adminToken) loadOrders();
}, 30000);
}
}
async function initializeAdminPage() {
if (adminPageInitializing) return;
setAuthUI();
if (!adminToken) return;
adminPageInitializing = true;
setAdminLoading(true);
try {
const sessionValid = await validateAdminSession();
if (sessionValid === true) {
if (adminReconnectTimer) {
clearTimeout(adminReconnectTimer);
adminReconnectTimer = null;
}
await initData();
return;
}
if (sessionValid === null) {
if (adminStatus) adminStatus.textContent = 'Connecting to server...';
if (!adminReconnectTimer) {
adminReconnectTimer = setTimeout(() => {
adminReconnectTimer = null;
initializeAdminPage();
}, 3000);
}
return;
}
setAdminLoading(false);
} finally {
adminPageInitializing = false;
}
}
initializeAdminPage();
function setAdminLoading(isLoading) {
const label = document.getElementById('admin-status');
if (label && adminToken) label.textContent = isLoading ? 'Loading dashboard...' : 'Authenticated';
}
async function loadDashboard() {
try {
const qs = new URLSearchParams();
if (dateFilter.startDate) qs.append('startDate', dateFilter.startDate);
if (dateFilter.endDate) qs.append('endDate', dateFilter.endDate);
const { ok, body } = await adminFetch(`/api/admin/dashboard?${qs.toString()}`);
if (!ok) throw new Error();
document.getElementById('kpi-sales').textContent = formatINR(body.monthlySales || 0);
document.getElementById('kpi-orders').textContent = body.monthlyOrders||0;
document.getElementById('kpi-aov').textContent = formatINR(body.avgOrderValue||0);
document.getElementById('kpi-pending').textContent = body.pendingCount||0;
document.getElementById('kpi-success').textContent = body.successCount||0;
renderSalesChart(body);
renderStatusChart(body.ordersByStatus || {});
const tbody = document.getElementById('top-products-tbody');
tbody.innerHTML = (body.topProducts || []).map(p => `
<tr class="hover:bg-gray-50 border-b border-gray-100">
<td class="p-3 font-semibold text-sm">${p._id}</td>
<td class="p-3 text-sm">${p.totalSold} Units</td>
<td class="p-3 font-bold text-yellow-600 text-sm">${formatINR(p.revenue)}</td>
</tr>
`).join('');
} catch (err) { console.error(err); }
}
function renderSalesChart(body) {
const view = document.getElementById('chart-view')?.value || 'month';
const source = view === 'state' ? (body.salesByState || []) : (body.salesByMonth || []);
const labels = source.map(x => x.label);
const values = source.map(x => Number(x.total || 0));
const ctx = document.getElementById('salesChart');
if (!ctx) return;
if (salesChart) salesChart.destroy();
salesChart = new Chart(ctx, {
type: 'bar',
data: {
labels,
datasets: [{ label: 'Revenue', data: values, backgroundColor: '#eab308' }]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false } },
scales: { y: { beginAtZero: true } }
}
});
}
function renderStatusChart(statuses) {
const labels = Object.keys(statuses);
const values = Object.values(statuses);
const ctx = document.getElementById('statusChart');
if (!ctx) return;
if (statusChart) statusChart.destroy();
statusChart = new Chart(ctx, {
type: 'doughnut',
data: {
labels,
datasets: [{ data: values, backgroundColor: ['#facc15', '#22c55e', '#3b82f6', '#f97316', '#ef4444', '#64748b'] }]
},
options: { responsive: true, maintainAspectRatio: false }
});
document.getElementById('status-legend').innerHTML = labels.map((label, i) =>
`<div class="flex justify-between border-b py-1"><span>${escapeHtml(label)}</span><strong>${values[i]}</strong></div>`
).join('');
}
async function loadCoupons() {
try {
const { ok, body } = await adminFetch('/api/admin/coupons');
if (ok) {
document.getElementById('coupons-tbody').innerHTML = (body.coupons || []).map(c => `
<tr class="hover:bg-gray-50 border-b border-gray-100">
<td class="p-3 font-bold text-sm uppercase">${c.code}</td>
<td class="p-3 text-sm capitalize">${c.discountType}</td>
<td class="p-3 text-sm">${c.discountType === 'percentage' ? c.discountValue + '%' : formatINR(c.discountValue)}</td>
<td class="p-3 text-sm">${formatINR(c.minOrderValue)}</td>
<td class="p-3"><button onclick="deleteCoupon('${c._id}')" class="text-red-500 hover:text-red-700 text-xs font-bold uppercase"><i class="fas fa-trash"></i></button></td>
</tr>
`).join('');
}
} catch (err) { console.error(err); }
}
async function createCoupon() {
const code = document.getElementById('c-code').value.trim();
const discountType = document.getElementById('c-type').value;
const discountValue = Number(document.getElementById('c-value').value);
const minOrderValue = Number(document.getElementById('c-min').value) || 0;
const msg = document.getElementById('c-msg');
if(!code || !discountValue) return msg.textContent = 'Fill required fields';
try {
const { ok } = await adminFetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, discountType, discountValue, minOrderValue }) });
if(ok) { msg.textContent = 'Coupon created!'; msg.className='text-green-600 text-xs mt-2'; document.getElementById('c-code').value=''; await loadCoupons(); }
} catch (err) { msg.textContent = 'Failed to create coupon'; msg.className='text-red-600 text-xs mt-2'; }
}
async function deleteCoupon(id) {
if(!confirm('Delete this coupon?')) return;
await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
loadCoupons();
}
function allowedBundleQty(sizeMl) {
return Number(sizeMl) === 8 ? [4, 6] : [2, 4];
}
function syncBundleQtyOptions() {
const size = Number(document.getElementById('b-size').value);
const qtySelect = document.getElementById('b-qty');
const current = Number(qtySelect.value);
const allowed = allowedBundleQty(size);
qtySelect.innerHTML = allowed.map(q => `<option value="${q}">Set of ${q}</option>`).join('');
if (allowed.includes(current)) qtySelect.value = current;
}
function describeBundleOffer(rule) {
if (!rule || rule.discountType === 'none' || !Number(rule.discountValue)) return 'No price discount';
return rule.discountType === 'percentage'
? `${rule.discountValue}% off`
: `${formatINR(rule.discountValue)} off`;
}
async function loadBundleRules() {
try {
const { ok, body } = await adminFetch('/api/admin/bundle-rules');
if (!ok) throw new Error(body.error || 'Could not load set rules');
bundleRules = body.rules || [];
document.getElementById('bundle-rules-tbody').innerHTML = bundleRules.map(rule => `
<tr class="hover:bg-gray-50 border-b border-gray-100">
<td class="p-3">
<div class="font-semibold text-sm">${escapeHtml(rule.label || `${rule.setQty} x ${rule.sizeMl} ml`)}</div>
<div class="tiny text-gray-500">${rule.setQty} products of ${rule.sizeMl} ml</div>
</td>
<td class="p-3 text-sm">${describeBundleOffer(rule)}</td>
<td class="p-3 text-sm">
${rule.freeGiftEnabled ? `${escapeHtml(rule.freeGiftName || 'Free gift')} ${escapeHtml(rule.freeGiftSize || '')}` : 'None'}
${rule.minCartValue ? `<div class="tiny text-green-700">Cart above ${formatINR(rule.minCartValue)}</div>` : ''}
</td>
<td class="p-3 tiny">${rule.isActive ? 'Active' : 'Hidden'}</td>
<td class="p-3 space-x-2">
<button onclick="editBundleRule('${rule._id}')" class="px-2 py-1 border rounded tiny">Edit</button>
<button onclick="deleteBundleRule('${rule._id}')" class="px-2 py-1 border rounded tiny text-red-600">Delete</button>
</td>
</tr>
`).join('') || `<tr><td colspan="5" class="p-4 text-gray-500">No custom set rules yet.</td></tr>`;
} catch (err) {
document.getElementById('bundle-rules-tbody').innerHTML = `<tr><td colspan="5" class="p-4 text-red-600">${escapeHtml(err.message)}</td></tr>`;
}
}
function editBundleRule(id) {
const rule = bundleRules.find(r => String(r._id) === String(id));
if (!rule) return;
document.getElementById('b-size').value = rule.sizeMl;
syncBundleQtyOptions();
document.getElementById('b-qty').value = rule.setQty;
document.getElementById('b-label').value = rule.label || '';
document.getElementById('b-discount-type').value = rule.discountType || 'none';
document.getElementById('b-discount-value').value = rule.discountValue || '';
document.getElementById('b-gift-enabled').checked = !!rule.freeGiftEnabled;
document.getElementById('b-gift-name').value = rule.freeGiftName || '';
document.getElementById('b-gift-size').value = rule.freeGiftSize || '';
document.getElementById('b-gift-product-id').value = rule.freeGiftProductId || '';
document.getElementById('b-gift-type').value = rule.freeGiftType || '';
document.getElementById('b-gift-image').value = rule.freeGiftImage || '';
document.getElementById('b-min-cart-value').value = rule.minCartValue || '';
document.getElementById('b-active').checked = !!rule.isActive;
toggleGiftPickerPanel();
syncGiftSummary();
}
async function saveBundleRule() {
const msg = document.getElementById('b-msg');
const payload = {
sizeMl: Number(document.getElementById('b-size').value),
setQty: Number(document.getElementById('b-qty').value),
label: document.getElementById('b-label').value.trim(),
discountType: document.getElementById('b-discount-type').value,
discountValue: Number(document.getElementById('b-discount-value').value) || 0,
freeGiftEnabled: document.getElementById('b-gift-enabled').checked,
freeGiftName: document.getElementById('b-gift-name').value.trim(),
freeGiftSize: document.getElementById('b-gift-size').value.trim(),
freeGiftProductId: document.getElementById('b-gift-product-id').value.trim(),
freeGiftType: document.getElementById('b-gift-type').value.trim(),
freeGiftImage: document.getElementById('b-gift-image').value.trim(),
minCartValue: Number(document.getElementById('b-min-cart-value').value) || 0,
isActive: document.getElementById('b-active').checked
};
try {
msg.textContent = 'Saving set rule...';
msg.className = 'text-xs mt-2 text-gray-600';
const { ok, body } = await adminFetch('/api/admin/bundle-rules', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(payload)
});
if (!ok) throw new Error(body.error || 'Could not save set rule');
msg.textContent = 'Set rule saved.';
msg.className = 'text-xs mt-2 text-green-600';
await loadBundleRules();
} catch (err) {
msg.textContent = err.message;
msg.className = 'text-xs mt-2 text-red-600';
}
}
async function deleteBundleRule(id) {
if (!confirm('Delete this set rule?')) return;
await adminFetch(`/api/admin/bundle-rules/${id}`, { method: 'DELETE' });
loadBundleRules();
}
async function loadOrders() {
const qs = new URLSearchParams();
if (dateFilter.startDate) qs.append('startDate', dateFilter.startDate);
if (dateFilter.endDate) qs.append('endDate', dateFilter.endDate);
qs.append('limit', '200');
try {
const { ok, body } = await adminFetch(`/api/admin/orders?${qs.toString()}`);
if (!ok) throw new Error(body.error || 'Could not load orders');
orders = body.orders || [];
notifyNewOrders(orders);
applyOrderFilters();
renderCardOrdersTable();
} catch (err) {
ordersTbody.innerHTML = `<tr><td colspan="7" class="p-4 text-red-600">${escapeHtml(err.message)}</td></tr>`;
}
}
async function loadUsers() {
if (!usersTbody) return;
const qs = new URLSearchParams();
const q = document.getElementById('user-search')?.value.trim();
if (q) qs.append('q', q);
qs.append('limit', '200');
try {
const { ok, body } = await adminFetch(`/api/admin/users?${qs.toString()}`);
if (!ok) throw new Error(body.error || 'Could not load users');
users = (body.users || []).filter(user => user.isVerified);
usersTbody.innerHTML = users.map(user => {
const address = user.address || {};
const addressText = [address.addressLine, address.city, address.pincode, address.state].filter(Boolean).join(', ');
return `
<tr class="hover:bg-gray-50 border-b border-gray-100">
<td class="p-3">
<div class="font-semibold text-sm">${escapeHtml(user.name || 'Customer')}</div>
<div class="tiny text-gray-500">${escapeHtml(user.email || '')}</div>
</td>
<td class="p-3 tiny">${escapeHtml(user.phone || address.phone || '')}</td>
<td class="p-3 tiny">${escapeHtml(addressText || 'No saved address')}</td>
<td class="p-3 tiny">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : ''}</td>
</tr>
`;
}).join('') || `<tr><td colspan="4" class="p-4 text-gray-500">No verified users found.</td></tr>`;
} catch (err) {
usersTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-red-600">${escapeHtml(err.message)}</td></tr>`;
}
}
function applyOrderFilters() {
const q = (document.getElementById('q-search')?.value || '').trim().toLowerCase();
const status = document.getElementById('status-filter')?.value || '';
filtered = orders.filter(order => {
const normalizedStatus = adminNormalizedStatus(order.status);
const searchable = [
order.orderId, order._id, order.name, order.buyerEmail, order.phone,
order.paymentMethod, order.awb, order.deliveryPartner, order.shippingAddress,
...(order.items || []).map(item => `${item.name || ''} ${item.size || ''}`)
].filter(Boolean).join(' ').toLowerCase();
const matchesSearch = !q || searchable.includes(q);
const matchesStatus = !status || normalizedStatus === status;
return matchesSearch && matchesStatus;
});
page = 1;
renderOrdersPage();
}
function resetOrderFilters() {
const search = document.getElementById('q-search');
const status = document.getElementById('status-filter');
if (search) search.value = '';
if (status) status.value = '';
applyOrderFilters();
}
function renderOrdersPage() {
rowsPerPage = Number(document.getElementById('rows-per-page')?.value || rowsPerPage);
const total = filtered.length;
const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
page = Math.min(Math.max(1, page), totalPages);
const start = (page - 1) * rowsPerPage;
const pageRows = filtered.slice(start, start + rowsPerPage);
ordersTbody.innerHTML = pageRows.map(order => {
const id = String(order._id || order.orderId);
return `
<tr tabindex="0" role="button" aria-label="Open order ${escapeHtml(order.orderId || order._id)}"
onclick="openOrderModal('${escapeHtml(id)}')"
onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openOrderModal('${escapeHtml(id)}')}"
class="cursor-pointer hover:bg-yellow-50 focus:bg-yellow-50 focus:outline-none border-b border-gray-100 transition">
<td class="p-3 font-semibold monospace tiny">${escapeHtml(order.orderId || order._id)}</td>
<td class="p-3 tiny">${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}</td>
<td class="p-3">
<div class="font-semibold text-sm">${escapeHtml(order.name || '')}</div>
<div class="tiny text-gray-500">${escapeHtml(order.buyerEmail || '')}</div>
</td>
<td class="p-3 font-bold">${formatINR(order.total)}</td>
<td class="p-3 tiny">${escapeHtml(order.paymentMethod || '')}</td>
<td class="p-3"><span class="px-2 py-1 rounded-full bg-gray-100 tiny font-semibold">${escapeHtml(adminStatusLabel(order.status))}</span></td>
<td class="p-3 text-right text-gray-400"><i class="fas fa-chevron-right"></i></td>
</tr>`;
}).join('') || `<tr><td colspan="7" class="p-8 text-center text-gray-500"><i class="fas fa-search text-2xl mb-2 block text-gray-300"></i>No orders match the current search or filter.</td></tr>`;
document.getElementById('page-from').textContent = total ? start + 1 : 0;
document.getElementById('page-to').textContent = Math.min(start + rowsPerPage, total);
document.getElementById('page-total').textContent = total;
const prev = document.getElementById('prev-page');
const next = document.getElementById('next-page');
if (prev) prev.disabled = page <= 1;
if (next) next.disabled = page >= totalPages;
if (prev) prev.classList.toggle('opacity-40', prev.disabled);
if (next) next.classList.toggle('opacity-40', next.disabled);
}
function adminStatusLabel(status) {
return ({ PENDING_PAYMENT: 'Payment Pending', PAYMENT_FAILED: 'Payment Failed', ORDER_PLACED: 'Order Placed', PROCESSING: 'Processing', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REJECTED: 'Rejected', PAID: 'Order Placed', Processing: 'Processing', Shipped: 'Dispatched', Delivered: 'Delivered', Cancelled: 'Cancelled' })[status] || status || 'Payment Pending';
}
function adminNormalizedStatus(status) {
return ({ PAID: 'ORDER_PLACED', Processing: 'PROCESSING', Shipped: 'DISPATCHED', Delivered: 'DELIVERED', Cancelled: 'CANCELLED' })[status] || status;
}
function cleanAdminAddress(order) {
const lines = String(order.shippingAddress || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
if (lines[0] === String(order.name || '').trim()) lines.shift();
if (/^phone\s*:/i.test(lines[0] || '') || lines[0] === String(order.phone || '').trim()) lines.shift();
return lines.join('\n');
}
function openOrderModal(id) {
selectedOrder = orders.find(
o =>
String(o._id) === String(id) ||
String(o.orderId) === String(id)
);
if (!selectedOrder) return;
const orderId =
selectedOrder._id || selectedOrder.orderId;
const currentStatus =
adminNormalizedStatus(selectedOrder.status);
document.getElementById('modal-order-title').textContent =
`Order ${selectedOrder.orderId || selectedOrder._id}`;
document.getElementById('modal-order-sub').textContent =
`${selectedOrder.buyerEmail || ''} • ${
selectedOrder.phone || ''
}`;
const itemsHtml = (selectedOrder.items || [])
.map(
item => `
<div class="border rounded-lg p-3 bg-gray-50">
<div class="font-semibold">
${escapeHtml(item.name || 'Product')}
</div>
<div class="text-gray-500 mt-1">
${escapeHtml(item.size || '')}
${item.qty ? ` × ${escapeHtml(item.qty)}` : ''}
</div>
${
item.price !== undefined
? `
<div class="font-bold mt-1">
${formatINR(item.price)}
</div>
`
: ''
}
</div>
`
)
.join('');
const supportHtml = (selectedOrder.supportRequests || [])
.map(r => `
<div class="border rounded-lg p-3 mt-3 bg-gray-50">
<div class="flex justify-between gap-3">
<strong>Customer query</strong>
<span class="text-gray-400 tiny">
${
r.createdAt
? new Date(r.createdAt).toLocaleString('en-IN')
: ''
}
</span>
</div>
<div class="mt-2">
${escapeHtml(r.message || '')}
</div>
${
r.reply
? `
<div class="mt-3 rounded bg-green-50 p-3">
<strong>Your reply:</strong>
${escapeHtml(r.reply)}
</div>
`
: `
<div class="mt-3">
<label class="block font-semibold mb-1">
Quick reply suggestion
</label>
<select
onchange="applySupportReplyPreset(
'${r._id}',
this.value
)"
class="w-full rounded border p-2 bg-white"
>
<option value="">
Choose a suggested reply...
</option>
${getSupportReplyPresets(r.message)
.map(
p => `
<option value="${escapeHtml(p)}">
${escapeHtml(p)}
</option>
`
)
.join('')}
<option value="__custom__">
Other — write a custom reply
</option>
</select>
<textarea
id="support-reply-${r._id}"
rows="3"
class="mt-2 w-full rounded border p-2"
placeholder="Select a suggestion above or write a custom reply..."
></textarea>
<button
onclick="replyToSupport(
'${orderId}',
'${r._id}'
)"
class="mt-2 rounded bg-black px-3 py-2 text-white hover:text-yellow-500"
>
Send Reply
</button>
</div>
`
}
</div>
`)
.join('');
const statusOptions = [
{
value: 'ORDER_PLACED',
label: 'Order Placed'
},
{
value: 'PROCESSING',
label: 'Processing'
},
{
value: 'DISPATCHED',
label: 'Dispatched'
},
{
value: 'DELIVERED',
label: 'Delivered'
},
{
value: 'CANCELLED',
label: 'Cancelled'
},
{
value: 'REJECTED',
label: 'Rejected'
}
];
document.getElementById('modal-body').innerHTML = `
<!-- CUSTOMER DETAILS -->
<div class="space-y-4">
<div class="border rounded-xl p-4">
<h4 class="font-bold text-base mb-3">
Customer Details
</h4>
<div>
<strong>Name:</strong>
${escapeHtml(selectedOrder.name || '')}
</div>
<div class="mt-1">
<strong>Email:</strong>
${escapeHtml(selectedOrder.buyerEmail || '')}
</div>
<div class="mt-1">
<strong>Phone:</strong>
${escapeHtml(selectedOrder.phone || '')}
</div>
<div class="mt-1">
<strong>Address:</strong>
${escapeHtml(selectedOrder.shippingAddress || '')}
</div>
<div class="mt-3">
<strong>Payment:</strong>
${escapeHtml(selectedOrder.paymentMethod || '')}
</div>
<div class="font-bold text-lg mt-2">
Total: ${formatINR(selectedOrder.total)}
</div>
<div class="mt-3">
<span class="text-xs text-gray-500">
Current status
</span>
<div>
<span
class="inline-flex mt-1 px-3 py-1 rounded-full bg-gray-100 tiny font-semibold"
>
${escapeHtml(adminStatusLabel(currentStatus))}
</span>
</div>
</div>
</div>
<!-- COURIER DETAILS -->
<div class="border rounded-xl p-4">
<div class="flex items-start justify-between gap-3 mb-3">
<div>
<h4 class="font-bold text-base">
Courier Details
</h4>
<p class="tiny text-gray-500 mt-1">
You can save or correct these details without
changing the order status.
</p>
</div>
<i class="fas fa-truck text-yellow-500 text-xl"></i>
</div>
<label class="block font-semibold mb-1">
Delivery Partner
</label>
<input
id="modal-delivery-partner"
type="text"
value="${escapeHtml(
selectedOrder.deliveryPartner || ''
)}"
placeholder="Example: Delhivery, Shiprocket, DTDC"
class="w-full p-2 border rounded outline-none focus:border-yellow-500"
>
<label class="block font-semibold mt-3 mb-1">
AWB / Tracking Number
</label>
<input
id="modal-awb"
type="text"
value="${escapeHtml(selectedOrder.awb || '')}"
placeholder="Enter AWB or tracking number"
class="w-full p-2 border rounded outline-none focus:border-yellow-500"
>
<div class="flex flex-wrap gap-2 mt-4">
<button
onclick="saveCourierDetails('${orderId}')"
id="save-courier-btn"
class="px-4 py-2 bg-black text-white rounded font-semibold hover:text-yellow-500 transition"
>
<i class="fas fa-save mr-1"></i>
Save Courier Details
</button>
${
selectedOrder.awb
? `
<button
onclick="copyOrderAwb()"
class="px-4 py-2 border rounded font-semibold hover:bg-gray-100"
>
<i class="fas fa-copy mr-1"></i>
Copy AWB
</button>
`
: ''
}
</div>
<p
id="courier-save-message"
class="tiny mt-2"
></p>
</div>
<!-- MANUAL STATUS CORRECTION -->
<div class="border rounded-xl p-4 border-orange-200 bg-orange-50">
<div class="flex items-start justify-between gap-3">
<div>
<h4 class="font-bold text-base">
Correct Order Status
</h4>
<p class="tiny text-gray-600 mt-1">
Use this only when you need to correct an
accidentally selected status or move an order
back to a previous stage.
</p>
</div>
<i class="fas fa-rotate-left text-orange-500 text-xl"></i>
</div>
<label class="block font-semibold mt-4 mb-1">
Select Status
</label>
<select
id="modal-manual-status"
class="w-full p-2 border rounded bg-white outline-none focus:border-orange-500"
>
${statusOptions
.map(
option => `
<option
value="${option.value}"
${
option.value === currentStatus
? 'selected'
: ''
}
>
${option.label}
</option>
`
)
.join('')}
</select>
<button
onclick="saveManualOrderStatus('${orderId}')"
id="save-manual-status-btn"
class="mt-3 px-4 py-2 bg-orange-600 text-white rounded font-semibold hover:bg-orange-700 transition"
>
<i class="fas fa-save mr-1"></i>
Save Corrected Status
</button>
<p
id="manual-status-message"
class="tiny mt-2"
></p>
</div>
</div>
<!-- ORDER DETAILS / ACTIONS -->
<div class="space-y-4">
<div class="border rounded-xl p-4">
<h4 class="font-bold text-base mb-3">
Ordered Items
</h4>
<div class="space-y-2">
${
itemsHtml ||
'<div class="text-gray-500">No items found.</div>'
}
</div>
</div>
<!-- NORMAL WORKFLOW BUTTONS -->
<div class="border rounded-xl p-4">
<h4 class="font-bold text-base">
Order Actions
</h4>
<p class="tiny text-gray-500 mt-1 mb-3">
Use these buttons for the normal order workflow.
</p>
<div class="flex flex-wrap gap-2">
${
currentStatus === 'ORDER_PLACED'
? `
<button
onclick="acceptOrder('${orderId}')"
class="px-4 py-2 bg-green-600 text-white rounded font-semibold"
>
Accept Order
</button>
`
: ''
}
${
currentStatus === 'PROCESSING'
? `
<button
onclick="dispatchOrder('${orderId}')"
class="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
>
Dispatch Order
</button>
`
: ''
}
${
currentStatus === 'DISPATCHED'
? `
<button
onclick="markDelivered('${orderId}')"
class="px-4 py-2 bg-green-700 text-white rounded font-semibold"
>
Mark Delivered
</button>
`
: ''
}
${
![
'CANCELLED',
'REJECTED',
'DELIVERED'
].includes(currentStatus)
? `
<button
onclick="rejectOrder('${orderId}')"
class="px-4 py-2 bg-red-600 text-white rounded font-semibold"
>
Reject Order
</button>
`
: ''
}
</div>
</div>
${
supportHtml
? `
<div class="border rounded-xl p-4">
<h4 class="font-bold text-base">
Customer Support Queries
</h4>
${supportHtml}
</div>
`
: ''
}
</div>
`;
document
.getElementById('order-modal')
.classList.remove('hidden');
document.body.style.overflow = 'hidden';
}
/* ================== SAVE COURIER DETAILS ================== */
async function saveCourierDetails(id) {
const deliveryPartner =
document
.getElementById('modal-delivery-partner')
?.value.trim() || '';
const awb =
document
.getElementById('modal-awb')
?.value.trim() || '';
const message =
document.getElementById('courier-save-message');
const button =
document.getElementById('save-courier-btn');
try {
if (message) {
message.textContent = 'Saving courier details...';
message.className = 'tiny mt-2 text-gray-600';
}
if (button) {
button.disabled = true;
button.innerHTML = `
<i class="fas fa-spinner fa-spin mr-1"></i>
Saving...
`;
}
const { ok, body } = await adminFetch(
`/api/admin/orders/${id}`,
{
method: 'PUT',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify({
deliveryPartner,
awb
})
}
);
if (!ok) {
throw new Error(
body.error || 'Could not save courier details.'
);
}
if (message) {
message.textContent =
'Courier details saved successfully.';
message.className =
'tiny mt-2 text-green-600 font-semibold';
}
/*
Update currently selected order immediately
so the modal does not show stale information.
*/
if (body.order) {
selectedOrder = body.order;
const index = orders.findIndex(
order =>
String(order._id) === String(body.order._id) ||
String(order.orderId) ===
String(body.order.orderId)
);
if (index !== -1) {
orders[index] = body.order;
}
}
await loadOrders();
} catch (err) {
if (message) {
message.textContent =
err.message || 'Could not save courier details.';
message.className =
'tiny mt-2 text-red-600 font-semibold';
}
} finally {
if (button) {
button.disabled = false;
button.innerHTML = `
<i class="fas fa-save mr-1"></i>
Save Courier Details
`;
}
}
}
/* ================== MANUAL STATUS CORRECTION ================== */
async function saveManualOrderStatus(id) {
const status =
document.getElementById('modal-manual-status')?.value;
const message =
document.getElementById('manual-status-message');
const button =
document.getElementById('save-manual-status-btn');
if (!status) {
if (message) {
message.textContent = 'Please select a status.';
message.className = 'tiny mt-2 text-red-600';
}
return;
}
const currentStatus =
adminNormalizedStatus(selectedOrder?.status);
if (status === currentStatus) {
if (message) {
message.textContent =
'The order is already in this status.';
message.className =
'tiny mt-2 text-orange-700';
}
return;
}
const statusName = adminStatusLabel(status);
const confirmed = confirm(
`Change order status from "${adminStatusLabel(
currentStatus
)}" to "${statusName}"?\n\n` +
`This is an admin correction and can move the order ` +
`forward or backward in the workflow.`
);
if (!confirmed) return;
try {
if (message) {
message.textContent = 'Updating order status...';
message.className = 'tiny mt-2 text-gray-600';
}
if (button) {
button.disabled = true;
button.innerHTML = `
<i class="fas fa-spinner fa-spin mr-1"></i>
Updating...
`;
}
const payload = {
status,
adminOverride: true
};
/*
Preserve courier fields when changing status.
*/
const deliveryPartner =
document
.getElementById('modal-delivery-partner')
?.value.trim();
const awb =
document
.getElementById('modal-awb')
?.value.trim();
if (deliveryPartner !== undefined) {
payload.deliveryPartner = deliveryPartner;
}
if (awb !== undefined) {
payload.awb = awb;
}
/*
REJECTED status should still go through the
dedicated rejection modal because a reason is required.
*/
if (status === 'REJECTED') {
if (message) {
message.textContent =
'Use the Reject Order button to provide a rejection reason.';
message.className =
'tiny mt-2 text-red-600';
}
rejectOrder(id);
return;
}
const { ok, body } = await adminFetch(
`/api/admin/orders/${id}`,
{
method: 'PUT',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify(payload)
}
);
if (!ok) {
throw new Error(
body.error || 'Could not update order status.'
);
}
if (message) {
message.textContent =
`Order status changed to ${statusName}.`;
message.className =
'tiny mt-2 text-green-600 font-semibold';
}
await loadOrders();
await loadDashboard();
/*
Reopen modal with fresh order data.
*/
const freshOrder = orders.find(
order =>
String(order._id) === String(id) ||
String(order.orderId) === String(id)
);
if (freshOrder) {
openOrderModal(
freshOrder._id || freshOrder.orderId
);
}
} catch (err) {
if (message) {
message.textContent =
err.message || 'Could not update order status.';
message.className =
'tiny mt-2 text-red-600 font-semibold';
}
} finally {
if (button) {
button.disabled = false;
button.innerHTML = `
<i class="fas fa-save mr-1"></i>
Save Corrected Status
`;
}
}
}
/* ================== COPY AWB ================== */
async function copyOrderAwb() {
const awb =
document
.getElementById('modal-awb')
?.value.trim();
if (!awb) {
alert('No AWB number is available to copy.');
return;
}
try {
await navigator.clipboard.writeText(awb);
} catch (err) {
console.error('Could not copy AWB:', err);
}
}
function closeOrderModal() { document.getElementById('order-modal').classList.add('hidden'); }
async function acceptOrder(id) {
const { ok, body } = await adminFetch(`/api/admin/orders/${id}`, {
method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PROCESSING' })
});
if (!ok) return alert(body.error || 'Could not accept order');
closeOrderModal();
await loadOrders();
await loadDashboard();
}
async function updateOrderProgress(id, status) {
const deliveryPartner = document.getElementById('modal-delivery-partner')?.value.trim() || '';
const awb = document.getElementById('modal-awb')?.value.trim() || '';
if (status === 'DISPATCHED' && (!deliveryPartner || !awb)) {
alert('Please enter delivery partner and AWB before dispatching.');
return;
}
const { ok, body } = await adminFetch(`/api/admin/orders/${id}`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ status, deliveryPartner, awb })
});
if (!ok) return alert(body.error || 'Could not update order');
closeOrderModal();
await loadOrders();
await loadDashboard();
}
function dispatchOrder(id) {
updateOrderProgress(id, 'DISPATCHED');
}
function markDelivered(id) {
updateOrderProgress(id, 'DELIVERED');
}
async function cancelAdminOrder(id) {
if (!confirm('Cancel this order?')) return;
const { ok, body } = await adminFetch(`/api/admin/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }) });
if (!ok) return alert(body.error || 'Could not cancel order');
closeOrderModal(); await loadOrders(); await loadDashboard();
}
function rejectOrder(id) {
const order = orders.find(o => String(o._id) === String(id) || String(o.orderId) === String(id));
document.getElementById('reject-order-id').value = id;
document.getElementById('reject-order-reference').textContent = order ? `Order ${order.orderId || order._id} • ${order.name || order.buyerEmail || 'Customer'}` : `Order ${id}`;
document.getElementById('reject-reason-preset').value = '';
document.getElementById('reject-reason-text').value = '';
document.getElementById('reject-reason-count').textContent = '0/500';
document.getElementById('reject-order-msg').textContent = '';
document.getElementById('reject-order-modal').classList.remove('hidden');
document.body.style.overflow = 'hidden';
}
function closeRejectOrderModal() {
document.getElementById('reject-order-modal').classList.add('hidden');
document.body.style.overflow = '';
}
async function confirmRejectOrder() {
const id = document.getElementById('reject-order-id').value;
const rejectionReason = document.getElementById('reject-reason-text').value.trim();
const msg = document.getElementById('reject-order-msg');
const btn = document.getElementById('confirm-reject-order-btn');
if (!rejectionReason) {
msg.textContent = 'Please select or write a rejection reason.';
msg.className = 'tiny mt-2 text-red-600';
return;
}
try {
btn.disabled = true;
btn.textContent = 'Rejecting...';
const { ok, body } = await adminFetch(`/api/admin/orders/${id}`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ status: 'REJECTED', rejectionReason, adminOverride: true })
});
if (!ok) throw new Error(body.error || 'Could not reject order');
closeRejectOrderModal();
closeOrderModal();
await loadOrders();
await loadDashboard();
} catch (err) {
msg.textContent = err.message || 'Could not reject order';
msg.className = 'tiny mt-2 text-red-600';
} finally {
btn.disabled = false;
btn.textContent = 'Reject Order';
}
}
function getSupportReplyPresets(message = '') {
const q = String(message).toLowerCase();
const common = [
'Thank you for contacting Eternal Essence. We have received your query and are checking it now.',
'Thank you for the details. Our team is reviewing your request and will update you shortly.',
'We apologize for the inconvenience. We are checking this on priority and will assist you as soon as possible.'
];
if (/track|where|status|delivery|arrive|shipped|dispatch/.test(q)) return [
'Your order is being checked. We will share the latest delivery or tracking update with you shortly.',
'Your order has been dispatched. Please use the tracking details shared with your order to follow its journey.',
...common
];
if (/damage|broken|leak|wrong|incorrect/.test(q)) return [
'We are sorry about the issue with your order. Please share clear photos of the product and packaging so we can verify it and assist you.',
'Thank you for sharing the details. We are reviewing the damaged or incorrect item and will update you with the next resolution step shortly.',
...common
];
if (/refund|money|payment|paid|failed/.test(q)) return [
'We are checking the payment or refund status for your order and will update you shortly.',
'If an amount was debited for a failed payment, the reversal timeline depends on your bank or payment provider. We will also verify the transaction from our side.',
...common
];
if (/address|phone|contact|change/.test(q)) return [
'We have received your request to update the order details. If the order has not yet been dispatched, we will check whether the change can still be made.',
'Please share the complete corrected details. We will update them if the order has not entered the shipping process.',
...common
];
if (/cancel/.test(q)) return [
'We have received your cancellation request and are checking whether the order is still eligible for cancellation.',
'Your cancellation request is being reviewed. We will confirm the outcome shortly.',
...common
];
return common;
}
function applySupportReplyPreset(requestId, value) {
const input = document.getElementById(`support-reply-${requestId}`);
if (!input) return;
if (!value || value === '__custom__') {
if (value === '__custom__') input.focus();
return;
}
input.value = value;
}
async function replyToSupport(orderId, requestId) {
const input = document.getElementById(`support-reply-${requestId}`);
const reply = input?.value.trim();
if (!reply) return alert('Please write a reply first.');
const { ok, body } = await adminFetch(`/api/admin/orders/${orderId}/support/${requestId}/reply`, {
method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply })
});
if (!ok) return alert(body.error || 'Could not save reply');
selectedOrder = body.order;
const index = orders.findIndex(order => String(order._id) === String(selectedOrder._id));
if (index >= 0) orders[index] = selectedOrder;
openOrderModal(selectedOrder._id);
}
async function loadAdminProducts() {
try {
const { ok, body } = await adminFetch('/api/admin/products');
if (!ok) throw new Error(body.error || 'Could not load products');
adminProducts = body.products || [];
renderInventoryProducts();
} catch (err) {
document.getElementById('products-tbody').innerHTML = `<tr><td colspan="7" class="p-4 text-red-600">${escapeHtml(err.message)}</td></tr>`;
}
}
function renderInventoryProducts() {
const seen = new Set();
const catalog = [...hardcodedProducts, ...adminProducts.map(product => ({ ...product, id: product._id, type: product.category, source: 'backend' }))]
.filter(product => { const id = String(product.id || product._id); if (seen.has(id)) return false; seen.add(id); return true; });
document.getElementById('products-tbody').innerHTML = catalog.map(p => {
const productId = String(p.id || p._id);
const inventory = inventoryByProductId.get(productId);
const stock = Number(inventory?.stock || 0);
return `
<tr class="hover:bg-gray-50 border-b border-gray-100">
<td class="p-3"><img src="${productImage(p)}" class="w-12 h-12 object-cover rounded border" onerror="this.style.display='none'"></td>
<td class="p-3">
<div class="font-semibold text-sm">${escapeHtml(p.name)}</div>
<div class="tiny text-gray-500">${escapeHtml(p.inspiredBy || '')}</div>
</td>
<td class="p-3 tiny">${escapeHtml(p.category || p.type || '')}</td>
<td class="p-3 font-bold">${formatINR(p.price)}</td>
<td class="p-3"><div class="flex items-center gap-2"><input id="stock-${productId}" type="number" min="0" value="${stock}" class="w-20 p-1 border rounded tiny"><button onclick="saveInventoryStock('${productId}')" class="px-2 py-1 border rounded tiny">Save</button></div></td>
<td class="p-3 tiny">${stock > 0 ? (p.isActive === false ? 'Hidden' : 'In Stock') : 'Out of Stock'}</td>
<td class="p-3 space-x-2">
${p._id ? `<button onclick="toggleProductStatus('${p._id}', ${p.isActive ? 'false' : 'true'})" class="px-2 py-1 border rounded tiny">${p.isActive ? 'Hide' : 'Show'}</button><button onclick="deleteProduct('${p._id}')" class="px-2 py-1 text-red-600 border rounded tiny">Delete</button>` : '<span class="tiny text-gray-500">Frontend catalogue</span>'}
</td>
</tr>`;
}).join('') || `<tr><td colspan="7" class="p-4 text-gray-500">No products found.</td></tr>`;
}
function productImage(product) {
const img = product.images?.[0] || product.image || '';
if (!img) return '';
if (img.startsWith('http')) return img;
if (product.source === 'hardcoded') return img;
return `${BACKEND_BASE_URL}/products/${img}`;
}
async function loadHardcodedProducts() {
try {
const res = await fetch('index.html', { cache: 'no-store' });
const html = await res.text();
const start = html.indexOf('const products = [');
if (start === -1) return;
const arrayStart = html.indexOf('[', start);
const endMarker = '\n];';
const end = html.indexOf(endMarker, arrayStart);
if (arrayStart === -1 || end === -1) return;
const source = html.slice(arrayStart, end + 2);
const parsed = Function(`"use strict"; return (${source});`)();
hardcodedProducts = Array.isArray(parsed)
? parsed.map(p => ({ ...p, category: p.type || p.category || 'Perfume', source: 'hardcoded' }))
: [];
} catch (err) {
console.warn('Could not load hardcoded products for gift picker', err);
hardcodedProducts = [];
}
}
async function syncAndLoadInventory() {
const products = hardcodedProducts.map(product => ({
productId: String(product.id),
name: product.name,
category: product.category || product.type || 'Perfume',
image: product.images?.[0] || product.image || ''
}));
try {
if (products.length) await adminFetch('/api/admin/inventory/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products }) });
const { ok, body } = await adminFetch('/api/admin/inventory');
if (!ok) throw new Error(body.error || 'Could not load inventory');
inventoryByProductId = new Map((body.inventory || []).map(item => [String(item.productId), item]));
} catch (err) {
console.warn('Inventory unavailable', err);
}
}
async function saveInventoryStock(productId) {
const stock = Number(document.getElementById(`stock-${productId}`)?.value);
const { ok, body } = await adminFetch(`/api/admin/inventory/${encodeURIComponent(productId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }) });
if (!ok) return alert(body.error || 'Could not save stock');
inventoryByProductId.set(String(productId), body.item);
renderInventoryProducts();
}
function getGiftProducts() {
const dbProducts = (adminProducts || []).map(p => ({ ...p, source: 'backend' }));
const seen = new Set();
return [...hardcodedProducts, ...dbProducts].filter(product => {
const key = `${product.source}:${product._id || product.id || product.name}`;
if (seen.has(key)) return false;
seen.add(key);
return true;
});
}
function giftImageBySize(product, sizeLabel) {
const idxMap = { '8 ml': 1, '20 ml': 2, '30 ml': 3, '50 ml': 4, '100 ml': 5, '30 ml Gift': 6, '50 ml Gift': 7, '100 ml Gift': 8 };
const idx = product.category === 'Perfume' ? (idxMap[sizeLabel] || 0) : 0;
const img = product.images?.[idx] || product.images?.[0] || product.image || '';
if (!img) return '';
if (product.source === 'hardcoded') return img;
return img.startsWith('http') ? img : `${BACKEND_BASE_URL}/products/${img}`;
}
function syncGiftSummary() {
const name = document.getElementById('b-gift-name').value;
const size = document.getElementById('b-gift-size').value;
const type = document.getElementById('b-gift-type').value;
document.getElementById('b-gift-summary').textContent = name ? `${name} ${size ? `(${size})` : ''}${type ? ` - ${type}` : ''}` : 'No gift selected';
}
function toggleGiftPickerPanel() {
const enabled = document.getElementById('b-gift-enabled').checked;
const panel = document.getElementById('b-gift-picker-panel');
if (panel) panel.classList.toggle('hidden', !enabled);
if (!enabled) {
['b-gift-name','b-gift-size','b-gift-product-id','b-gift-type','b-gift-image','b-min-cart-value'].forEach(id => {
const el = document.getElementById(id);
if (el) el.value = '';
});
syncGiftSummary();
}
}
function openGiftPicker() {
renderGiftPicker();
document.getElementById('gift-picker-modal').classList.remove('hidden');
}
function closeGiftPicker() {
document.getElementById('gift-picker-modal').classList.add('hidden');
}
function renderGiftPicker() {
const grid = document.getElementById('gift-picker-grid');
if (!grid) return;
const q = (document.getElementById('gift-search')?.value || '').trim().toLowerCase();
const type = document.getElementById('gift-type-filter')?.value || '';
const size = document.getElementById('gift-size')?.value || '8 ml';
const list = getGiftProducts().filter(p =>
(!q || [p.name, p.family, p.inspiredBy].join(' ').toLowerCase().includes(q)) &&
(!type || p.category === type)
);
grid.innerHTML = list.map(p => {
const img = giftImageBySize(p, size) || productImage(p);
const key = `${p.source}:${p._id || p.id || p.name}`;
return `
<button type="button" onclick="selectGiftProductByKey('${escapeHtml(key)}')" class="text-left border rounded overflow-hidden hover:border-yellow-500 bg-white">
<div class="aspect-[4/5] bg-gray-100"><img src="${img}" class="w-full h-full object-cover" onerror="this.style.display='none'"></div>
<div class="p-2">
<div class="font-semibold text-sm truncate">${escapeHtml(p.name)}</div>
<div class="tiny text-gray-500">${escapeHtml(p.category || '')} ${p.source === 'hardcoded' ? '- index.html' : '- admin'}</div>
</div>
</button>`;
}).join('') || '<p class="col-span-full text-gray-500">No products found.</p>';
}
function selectGiftProductByKey(key) {
const product = getGiftProducts().find(p => `${p.source}:${p._id || p.id || p.name}` === key);
if (!product) return;
const size = document.getElementById('gift-size').value;
const image = giftImageBySize(product, size) || productImage(product);
document.getElementById('b-gift-product-id').value = product._id || product.id || product.name;
document.getElementById('b-gift-name').value = product.name || '';
document.getElementById('b-gift-size').value = size;
document.getElementById('b-gift-type').value = product.category || product.type || '';
document.getElementById('b-gift-image').value = image;
document.getElementById('b-gift-enabled').checked = true;
toggleGiftPickerPanel();
syncGiftSummary();
closeGiftPicker();
}
function collectProductForm() {
return {
name: document.getElementById('p-name').value.trim(),
description: document.getElementById('p-description').value.trim(),
category: document.getElementById('p-category').value,
price: Number(document.getElementById('p-price').value),
inspiredBy: document.getElementById('p-inspired').value.trim(),
gender: document.getElementById('p-gender').value,
family: document.getElementById('p-family').value.trim(),
season: document.getElementById('p-season').value.trim(),
time: document.getElementById('p-time').value,
notes: {
top: document.getElementById('p-top').value.trim(),
mid: document.getElementById('p-mid').value.trim(),
base: document.getElementById('p-base').value.trim()
},
accords: document.getElementById('p-accords').value.split(',').map(x => x.trim()).filter(Boolean),
images: document.getElementById('p-images').value.split(',').map(x => x.trim()).filter(Boolean),
isActive: true
};
}
function clearProductForm() {
['p-name','p-description','p-price','p-inspired','p-family','p-season','p-top','p-mid','p-base','p-accords','p-images'].forEach(id => {
document.getElementById(id).value = '';
});
}
async function saveProduct() {
const msg = document.getElementById('add-product-msg');
const payload = collectProductForm();
if (!payload.name || !payload.category || !payload.price) {
msg.textContent = 'Name, category and price are required.';
msg.className = 'text-sm mt-2 text-red-600';
return;
}
try {
msg.textContent = 'Saving product...';
msg.className = 'text-sm mt-2 text-gray-600';
const { ok, body } = await adminFetch('/api/admin/products', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(payload)
});
if (!ok) throw new Error(body.error || 'Product save failed');
msg.textContent = 'Product added.';
msg.className = 'text-sm mt-2 text-green-600';
clearProductForm();
await loadAdminProducts();
} catch (err) {
msg.textContent = err.message;
msg.className = 'text-sm mt-2 text-red-600';
}
}
async function toggleProductStatus(id, isActive) {
await adminFetch(`/api/admin/products/${id}`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ isActive })
});
loadAdminProducts();
}
async function deleteProduct(id) {
if (!confirm('Delete this product?')) return;
await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
loadAdminProducts();
}
function applyDateFilter() {
dateFilter.startDate = document.getElementById('from-date').value || null;
dateFilter.endDate = document.getElementById('to-date').value || null;
loadDashboard();
loadOrders();
}
function resetDateFilter() {
dateFilter = { startDate: null, endDate: null };
document.getElementById('from-date').value = '';
document.getElementById('to-date').value = '';
loadDashboard();
loadOrders();
}
document.getElementById('chart-view').addEventListener('change', loadDashboard);
document.getElementById('user-search').addEventListener('input', loadUsers);
document.getElementById('btn-add-product').addEventListener('click', saveProduct);
document.getElementById('b-size').addEventListener('change', syncBundleQtyOptions);
document.getElementById('b-gift-enabled').addEventListener('change', toggleGiftPickerPanel);
syncBundleQtyOptions();
toggleGiftPickerPanel();
(function init() {
function setupOrderManagementControls() {
const search = document.getElementById('q-search');
const status = document.getElementById('status-filter');
const rows = document.getElementById('rows-per-page');
const clear = document.getElementById('clear-order-search');
const reset = document.getElementById('reset-order-filters');
let searchTimer;
search?.addEventListener('input', () => {
clear?.classList.toggle('hidden', !search.value);
clearTimeout(searchTimer);
searchTimer = setTimeout(applyOrderFilters, 180);
});
status?.addEventListener('change', applyOrderFilters);
rows?.addEventListener('change', () => { page = 1; renderOrdersPage(); });
clear?.addEventListener('click', () => {
search.value = '';
clear.classList.add('hidden');
search.focus();
applyOrderFilters();
});
reset?.addEventListener('click', resetOrderFilters);
document.getElementById('prev-page')?.addEventListener('click', () => {
if (page > 1) { page--; renderOrdersPage(); }
});
document.getElementById('next-page')?.addEventListener('click', () => {
if (page * rowsPerPage < filtered.length) { page++; renderOrdersPage(); }
});
document.getElementById('reject-reason-preset')?.addEventListener('change', e => {
const textarea = document.getElementById('reject-reason-text');
if (e.target.value === '__custom__') {
textarea.value = '';
textarea.focus();
} else if (e.target.value) {
textarea.value = e.target.value;
}
document.getElementById('reject-reason-count').textContent = `${textarea.value.length}/500`;
});
document.getElementById('reject-reason-text')?.addEventListener('input', e => {
document.getElementById('reject-reason-count').textContent = `${e.target.value.length}/500`;
});
}
setupOrderManagementControls();
setAuthUI(); if (adminToken) initData(); })();