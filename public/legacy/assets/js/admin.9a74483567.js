const normalizeAdminBackend = value => String(value || '').trim().replace(/\/+$/, '');
const BACKEND_BASE_URL = normalizeAdminBackend(window.__EE_BACKEND_BASE_URL__ || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://eternal-essence-backend-production.up.railway.app'));
const BACKEND_FALLBACK_URL = normalizeAdminBackend(window.__EE_BACKEND_FALLBACK_URL__ || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '' : 'https://eternal-essence-backend.onrender.com'));
let activeAdminBackend = BACKEND_BASE_URL;
const ADMIN_TOKEN_KEY = 'ee_admin_token_v1';
const PRODUCT_CATALOGUE_PAGE = location.pathname.replace(/\/+$/, '') === '/admin/products';
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
let adminCoupons = [];
let dateFilter = { startDate: null, endDate: null };
let editingProductId = null;
let adminProducts = [];
let hardcodedProducts = [];
let inventoryByProductId = new Map();
let inventoryRows = [];
let selectedInventoryIds = new Set();
let adminOffers = [];
let editingCouponId = null;
let editingOfferId = null;
let selectedOrder = null;
let salesChart = null;
let statusChart = null;
let dailyOrdersChart = null;
let productPerformanceChart = null;
let paymentMixChart = null;
let orderValueChart = null;
let bundleRules = [];
let knownOrderIds = new Set();
let orderNotificationsReady = false;
let orderNotificationPoller = null;
let adminDealers = [];
let editingDealerId = null;
const DEALER_FACTOR_FIELDS = [
{ key: 'ml3', label: '3 ml', defaultValue: 0.80, group: 'Attar' },
{ key: 'ml6', label: '6 ml', defaultValue: 0.80, group: 'Attar' },
{ key: 'ml8', label: '8 ml', defaultValue: 0.80, group: 'Shared' },
{ key: 'ml12', label: '12 ml', defaultValue: 0.80, group: 'Attar' },
{ key: 'ml20', label: '20 ml', defaultValue: 0.75, group: 'Perfume' },
{ key: 'ml30', label: '30 ml', defaultValue: 0.70, group: 'Perfume' },
{ key: 'gift30', label: '30 ml Gift', defaultValue: 0.70, group: 'Gift' },
{ key: 'ml50', label: '50 ml', defaultValue: 0.65, group: 'Perfume' },
{ key: 'gift50', label: '50 ml Gift', defaultValue: 0.65, group: 'Gift' },
{ key: 'ml100', label: '100 ml', defaultValue: 0.60, group: 'Perfume' },
{ key: 'gift100', label: '100 ml Gift', defaultValue: 0.60, group: 'Gift' }
];
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
let adminCapabilities = null;
function safeAdminFailover(path, opts = {}) {
const method = String(opts.method || 'GET').toUpperCase();
return ['GET', 'HEAD', 'OPTIONS'].includes(method) || (method === 'POST' && path === '/api/admin/login');
}
async function adminBackendFetch(path, opts = {}) {
const safeRetry = safeAdminFailover(path, opts);
const bases = [activeAdminBackend];
if (safeRetry && BACKEND_FALLBACK_URL && BACKEND_FALLBACK_URL !== activeAdminBackend) bases.push(BACKEND_FALLBACK_URL);
let lastError = null;
for (let index = 0; index < bases.length; index += 1) {
const base = bases[index];
try {
const res = await fetch(base + path, opts);
const unavailable = [502, 503, 504, 521, 522, 523, 524].includes(res.status);
const htmlNotFound = res.status === 404 && String(res.headers.get('content-type') || '').includes('text/html');
if (index + 1 < bases.length && (unavailable || htmlNotFound)) continue;
if (res.ok && base !== activeAdminBackend) {
activeAdminBackend = base;
console.warn('Admin switched to the Render backup backend.');
}
return res;
} catch (err) {
lastError = err;
if (index + 1 >= bases.length) throw err;
}
}
throw lastError || new Error('No backend is available.');
}
async function adminFetch(path, opts = {}) {
const headers = new Headers(opts.headers || {});
if (adminToken) headers.set('Authorization', `Bearer ${adminToken}`);
try {
const res = await adminBackendFetch(path, { ...opts, headers });
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
async function loadAdminCapabilities() {
try {
const { ok, body } = await adminFetch('/health');
if (!ok) throw new Error('Health check failed');
return {
adminOffers: body.apiVersion >= 2 && body.features?.adminOffers === true,
adminCouponMutations: body.apiVersion >= 2 && body.features?.adminCouponMutations === true
};
} catch (err) {
console.warn('Could not confirm the current backend feature set:', err);
return { adminOffers: false, adminCouponMutations: false };
}
}
function outdatedBackendMessage() {
return 'The backend currently running on port 5000 is an older build. Restart/deploy the current backend, then refresh this page.';
}
function showOutdatedOffersNotice() {
ensurePromotionAdminUI();
const list = document.getElementById('offers-list');
if (list) list.innerHTML = `<p class="text-amber-700 text-sm">${escapeHtml(outdatedBackendMessage())}</p>`;
const button = document.querySelector('#offers-admin-section button[onclick="createOffer()"]');
if (button) { button.disabled = true; button.title = outdatedBackendMessage(); }
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
function ensureAdvancedAnalytics() {
if (!dashboardEl || document.getElementById('advanced-analytics')) return;
const section = document.createElement('section');
section.id = 'advanced-analytics';
section.className = 'admin-analytics-section';
section.innerHTML = `
<div class="admin-analytics-heading"><div><span>PERFORMANCE INTELLIGENCE</span><h2>Advanced Analytics</h2><p>Revenue, orders, customer behaviour and product performance for the selected reporting period.</p></div><div id="analytics-period-label">Live reporting</div></div>
<div id="analytics-error" class="admin-analytics-error"></div>
<div class="admin-analytics-kpis">
  <article><small>TOTAL ORDERS</small><strong id="analytics-total-orders">0</strong><em>selected KPI period</em></article>
  <article><small>REPEAT CUSTOMERS</small><strong id="analytics-repeat-customers">0</strong><em id="analytics-repeat-rate">0% of customers</em></article>
  <article><small>CANCELLATION RATE</small><strong id="analytics-cancel-rate">0%</strong><em>cancelled or rejected</em></article>
</div>
<div class="admin-analytics-grid">
  <article class="admin-analytics-chart wide"><header><div><h3>Daily business pulse</h3><p>Completed revenue and all orders, day by day</p></div><span class="chart-badge">30 DAY VIEW</span></header><div class="admin-chart-tall"><canvas id="dailyOrdersChart"></canvas></div></article>
  <article class="admin-analytics-chart"><header><div><h3>Payment mix</h3><p>Orders by payment method</p></div></header><div class="admin-chart-tall"><canvas id="paymentMixChart"></canvas></div></article>
  <article class="admin-analytics-chart wide"><header><div><h3>Product momentum</h3><p>Top products ranked by units sold</p></div></header><div class="admin-chart-tall"><canvas id="productPerformanceChart"></canvas></div></article>
  <article class="admin-analytics-chart"><header><div><h3>Order value profile</h3><p>Completed orders by basket value</p></div></header><div class="admin-chart-tall"><canvas id="orderValueChart"></canvas></div></article>
</div>`;
dashboardEl.insertBefore(section, document.getElementById('dealer-management'));
}
function ensureDealerSection() {
if (!dashboardEl || document.getElementById('dealer-management')) return;
const section = document.createElement('section');
section.id = 'dealer-management';
section.className = 'card p-6 mt-8 admin-dealer-section';
section.innerHTML = `
<div class="admin-dealer-heading">
  <div><div class="admin-dealer-kicker">SECURED TRADE ACCESS</div><h2>Dealer Management</h2><p>Create dealer credentials and set an independent website-price factor for every regular and gift size.</p></div>
  <a href="/dealer" target="_blank" rel="noopener">Open dealer sign-in ↗</a>
</div>
<div class="admin-dealer-layout">
  <form id="dealer-form" class="admin-dealer-form">
    <h3 id="dealer-form-title">Create dealer account</h3>
    <label>Dealer display name<input id="dealer-display-name" maxlength="120" placeholder="e.g. Mumbai Central Distributor" required></label>
    <label>Dealer login ID<input id="dealer-login-id" minlength="3" maxlength="64" pattern="[a-z0-9._-]+" placeholder="e.g. mumbai-distributor" required></label>
    <fieldset class="admin-dealer-factor-fieldset"><legend>Price factors by size</legend><p>Each value multiplies that size's current website selling price.</p><div class="admin-dealer-factor-grid">${DEALER_FACTOR_FIELDS.map(field => `<label><span>${field.label}<em>${field.group}</em></span><input id="dealer-factor-${field.key}" data-dealer-factor="${field.key}" type="number" min="0.10" max="1" step="0.01" value="${field.defaultValue.toFixed(2)}" required></label>`).join('')}</div><small>Example: 0.80 = 80%, 0.65 = 65%, and 0.60 = 60% of the website price.</small></fieldset>
    <label>Password <em id="dealer-password-optional"></em><div class="admin-dealer-password"><input id="dealer-password" type="text" minlength="10" placeholder="Minimum 10 characters" required><button id="generate-dealer-password" type="button">Generate</button></div><small>Save or share this once. Only its secure hash is stored and it cannot be retrieved later.</small></label>
    <label class="admin-dealer-check"><input id="dealer-active" type="checkbox" checked> Account active</label>
    <div id="dealer-form-message" class="admin-dealer-message"></div>
    <div class="admin-dealer-form-actions"><button id="save-dealer" type="submit">Create dealer</button><button id="cancel-dealer-edit" type="button" class="secondary hidden">Cancel edit</button></div>
  </form>
  <div class="admin-dealer-list"><div class="admin-dealer-list-head"><div><h3>Authorised accounts</h3><p><span id="active-dealer-count">0</span> active dealer accounts</p></div><button id="refresh-dealers" type="button">Refresh</button></div><div id="dealer-list-body" class="admin-dealer-table"></div></div>
</div>`;
dashboardEl.appendChild(section);
document.getElementById('dealer-form').addEventListener('submit', saveDealer);
document.getElementById('generate-dealer-password').addEventListener('click', generateDealerPassword);
document.getElementById('cancel-dealer-edit').addEventListener('click', resetDealerForm);
document.getElementById('refresh-dealers').addEventListener('click', loadDealers);
document.getElementById('dealer-login-id').addEventListener('input', event => { event.target.value = event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''); });
}
function setDealerMessage(message = '', type = '') {
const node = document.getElementById('dealer-form-message');
if (!node) return;
node.textContent = message;
node.className = `admin-dealer-message ${type}`.trim();
}
function generateDealerPassword() {
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
const bytes = window.crypto.getRandomValues(new Uint8Array(16));
let value = 'Ee7!';
bytes.forEach(byte => { value += alphabet[byte % alphabet.length]; });
document.getElementById('dealer-password').value = value;
setDealerMessage('Strong password generated. Copy it before saving the account.', 'info');
}
function resetDealerForm() {
editingDealerId = null;
const form = document.getElementById('dealer-form');
if (!form) return;
form.reset();
DEALER_FACTOR_FIELDS.forEach(field => { document.getElementById(`dealer-factor-${field.key}`).value = field.defaultValue.toFixed(2); });
document.getElementById('dealer-active').checked = true;
document.getElementById('dealer-password').required = true;
document.getElementById('dealer-password-optional').textContent = '';
document.getElementById('dealer-form-title').textContent = 'Create dealer account';
document.getElementById('save-dealer').textContent = 'Create dealer';
document.getElementById('cancel-dealer-edit').classList.add('hidden');
setDealerMessage();
}
function renderDealers() {
const body = document.getElementById('dealer-list-body');
if (!body) return;
const active = adminDealers.filter(dealer => dealer.isActive).length;
document.getElementById('active-dealer-count').textContent = active;
body.innerHTML = adminDealers.map(dealer => `
<article class="admin-dealer-row ${dealer.isActive ? '' : 'inactive'}">
  <div class="admin-dealer-row-title"><div><strong>${escapeHtml(dealer.displayName)}</strong><code>${escapeHtml(dealer.dealerId)}</code></div><span class="${dealer.isActive ? 'active' : ''}">${dealer.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
  <div class="admin-dealer-facts"><div><small>SIZE FACTORS</small><b>8 ml ${Number(dealer.priceFactors?.ml8 ?? dealer.priceFactor).toFixed(2)} · 50 ml ${Number(dealer.priceFactors?.ml50 ?? dealer.priceFactor).toFixed(2)} · 100 ml ${Number(dealer.priceFactors?.ml100 ?? dealer.priceFactor).toFixed(2)}</b><em>Regular and gift factors can be edited independently</em></div><div><small>LAST LOGIN</small><b>${dealer.lastLoginAt ? new Date(dealer.lastLoginAt).toLocaleString('en-IN') : 'Never'}</b><em>Updated ${new Date(dealer.updatedAt).toLocaleString('en-IN')}</em></div></div>
  <div class="admin-dealer-row-actions"><button type="button" onclick="editDealer('${dealer.id}')">Edit / reset password</button><button type="button" class="${dealer.isActive ? 'deactivate' : 'activate'}" onclick="toggleDealerStatus('${dealer.id}')">${dealer.isActive ? 'Deactivate' : 'Reactivate'}</button></div>
</article>`).join('') || '<div class="admin-dealer-empty">No dealer accounts yet. Create the first account using the form.</div>';
}
async function loadDealers() {
ensureDealerSection();
if (!adminToken) return;
const body = document.getElementById('dealer-list-body');
if (body && !adminDealers.length) body.innerHTML = '<div class="admin-dealer-empty">Loading dealer accounts…</div>';
try {
const { ok, body: response } = await adminFetch('/api/admin/dealers');
if (!ok) throw new Error(response.error || 'Unable to load dealer accounts.');
adminDealers = response.dealers || [];
renderDealers();
} catch (err) {
if (body) body.innerHTML = `<div class="admin-dealer-empty error">${escapeHtml(err.message)}</div>`;
}
}
function editDealer(id) {
const dealer = adminDealers.find(item => String(item.id) === String(id));
if (!dealer) return;
editingDealerId = String(dealer.id);
document.getElementById('dealer-display-name').value = dealer.displayName || '';
document.getElementById('dealer-login-id').value = dealer.dealerId || '';
DEALER_FACTOR_FIELDS.forEach(field => { document.getElementById(`dealer-factor-${field.key}`).value = Number(dealer.priceFactors?.[field.key] ?? dealer.priceFactor ?? field.defaultValue).toFixed(2); });
document.getElementById('dealer-active').checked = !!dealer.isActive;
document.getElementById('dealer-password').value = '';
document.getElementById('dealer-password').required = false;
document.getElementById('dealer-password-optional').textContent = '(leave blank to keep current password)';
document.getElementById('dealer-form-title').textContent = 'Edit dealer account';
document.getElementById('save-dealer').textContent = 'Save changes';
document.getElementById('cancel-dealer-edit').classList.remove('hidden');
setDealerMessage('Changing the password or deactivating the account revokes its current sessions.', 'info');
document.getElementById('dealer-management').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function saveDealer(event) {
event.preventDefault();
const button = document.getElementById('save-dealer');
const password = document.getElementById('dealer-password').value;
const payload = {
displayName: document.getElementById('dealer-display-name').value.trim(),
dealerId: document.getElementById('dealer-login-id').value.trim().toLowerCase(),
priceFactors: Object.fromEntries(DEALER_FACTOR_FIELDS.map(field => [field.key, Number(document.getElementById(`dealer-factor-${field.key}`).value)])),
isActive: document.getElementById('dealer-active').checked,
password
};
if (editingDealerId && !password) delete payload.password;
button.disabled = true;
setDealerMessage(editingDealerId ? 'Saving dealer changes…' : 'Creating secured dealer account…', 'info');
try {
const { ok, body } = await adminFetch(editingDealerId ? `/api/admin/dealers/${editingDealerId}` : '/api/admin/dealers', { method: editingDealerId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
if (!ok) throw new Error(body.error || 'Unable to save dealer account.');
const success = `${body.dealer.displayName} ${editingDealerId ? 'updated' : 'created'} successfully. Passwords are stored only as secure hashes.`;
resetDealerForm();
setDealerMessage(success, 'success');
await loadDealers();
} catch (err) { setDealerMessage(err.message, 'error'); }
finally { button.disabled = false; }
}
async function toggleDealerStatus(id) {
const dealer = adminDealers.find(item => String(item.id) === String(id));
if (!dealer) return;
try {
const { ok, body } = await adminFetch(`/api/admin/dealers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !dealer.isActive }) });
if (!ok) throw new Error(body.error || 'Unable to update dealer status.');
await loadDealers();
} catch (err) { setDealerMessage(err.message, 'error'); }
}
const CARD_ASSET_BASE = `${BACKEND_BASE_URL}/card/`;
const CARD_PRODUCT_IMAGES = { attar_2ml: 'card2a.webp', attar_3ml: 'card3a.webp', perfume_8ml: 'card8p.webp' };
function renderAdminCardPreview(meta = {}, small = false) {
const names = meta.occasion === 'birthday'
? `${escapeHtml(meta.personName || 'Name')} ${meta.age ? '- ' + escapeHtml(meta.age) : ''}`
: meta.occasion === 'mehndi'
? `${escapeHtml(meta.brideName || 'Bride')} Ki Mehndi`
: `${escapeHtml(meta.brideName || 'Bride')} & ${escapeHtml(meta.groomName || 'Groom')}`;
const design = meta.design || `${meta.occasion || 'mehndi'}_bg1`;
const productImg = meta.productImage || CARD_PRODUCT_IMAGES[meta.productType] || 'card3a.webp';
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
const res = await adminBackendFetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
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
adminCapabilities = await loadAdminCapabilities();
await Promise.allSettled([loadDashboard(), loadOrders()]);
adminInitialLoadDone = true;
setAdminLoading(false);
Promise.allSettled([loadUsers(), loadCoupons(), adminCapabilities.adminOffers ? loadOffers() : showOutdatedOffersNotice(), loadBundleRules(), loadDealers(), loadVisitorAnalytics()])
.catch(err => console.warn('Secondary admin data load failed:', err));
loadHardcodedProducts()
.then(() => loadAdminProducts())
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
ensureAdvancedAnalytics();
ensureDealerSection();
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
ensureDealerSection();
initializeAdminPage();
function setAdminLoading(isLoading) {
const label = document.getElementById('admin-status');
if (label && adminToken) label.textContent = isLoading ? 'Loading dashboard...' : 'Authenticated';
}
async function loadDashboard() {
try {
ensureAdvancedAnalytics();
const errorNode = document.getElementById('analytics-error');
if (errorNode) { errorNode.textContent = ''; errorNode.classList.remove('show'); }
const qs = new URLSearchParams();
if (dateFilter.startDate) qs.append('startDate', dateFilter.startDate);
if (dateFilter.endDate) qs.append('endDate', dateFilter.endDate);
const { ok, body } = await adminFetch(`/api/admin/dashboard?${qs.toString()}`);
if (!ok) throw new Error(body.error || 'Unable to load analytics data.');
document.getElementById('kpi-sales').textContent = formatINR(body.monthlySales || 0);
document.getElementById('kpi-orders').textContent = body.monthlyOrders||0;
document.getElementById('kpi-aov').textContent = formatINR(body.avgOrderValue||0);
document.getElementById('kpi-pending').textContent = body.pendingCount||0;
document.getElementById('kpi-success').textContent = body.successCount||0;
renderSalesChart(body);
renderStatusChart(body.ordersByStatus || {});
renderAdvancedAnalytics(body);
const tbody = document.getElementById('top-products-tbody');
tbody.innerHTML = (body.topProducts || []).map(p => `
<tr class="hover:bg-gray-50 border-b border-gray-100">
<td class="p-3 font-semibold text-sm">${p._id}</td>
<td class="p-3 text-sm">${p.totalSold} Units</td>
<td class="p-3 font-bold text-yellow-600 text-sm">${formatINR(p.revenue)}</td>
</tr>
`).join('') || '<tr><td colspan="3" class="p-6 text-center text-gray-500">No completed product sales in this reporting period.</td></tr>';
} catch (err) {
console.error('Analytics load failed:', err);
const errorNode = document.getElementById('analytics-error');
if (errorNode) { errorNode.textContent = err.message || 'Analytics could not be loaded. Please retry.'; errorNode.classList.add('show'); }
}
}
function chartAvailable() {
const available = typeof window.Chart === 'function';
if (!available) {
const errorNode = document.getElementById('analytics-error');
if (errorNode) { errorNode.textContent = 'The chart library did not load. Check the network connection and refresh the admin page.'; errorNode.classList.add('show'); }
}
return available;
}
function renderSalesChart(body) {
const view = document.getElementById('chart-view')?.value || 'month';
const source = view === 'state' ? (body.salesByState || []) : (body.salesByMonth || []);
const labels = source.map(x => x.label);
const values = source.map(x => Number(x.total || 0));
const ctx = document.getElementById('salesChart');
if (!ctx || !chartAvailable()) return;
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
if (!ctx || !chartAvailable()) return;
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
function renderAdvancedAnalytics(body) {
document.getElementById('analytics-total-orders').textContent = Number(body.totalOrders || 0).toLocaleString('en-IN');
document.getElementById('analytics-repeat-customers').textContent = Number(body.repeatCustomers || 0).toLocaleString('en-IN');
document.getElementById('analytics-repeat-rate').textContent = `${Number(body.repeatCustomerRate || 0)}% of customers`;
document.getElementById('analytics-cancel-rate').textContent = `${Number(body.cancellationRate || 0)}%`;
const period = body.analyticsPeriod || {};
if (period.from && period.to) document.getElementById('analytics-period-label').textContent = `${new Date(period.from).toLocaleDateString('en-IN')} — ${new Date(period.to).toLocaleDateString('en-IN')}`;
if (!chartAvailable()) return;
const colors = ['#eab308','#166534','#2563eb','#ea580c','#9333ea','#0891b2','#dc2626','#64748b'];
const daily = body.ordersByDay || [];
const dailyCanvas = document.getElementById('dailyOrdersChart');
if (dailyOrdersChart) dailyOrdersChart.destroy();
dailyOrdersChart = new Chart(dailyCanvas, {type:'line',data:{labels:daily.map(item=>item.label),datasets:[{label:'Revenue',data:daily.map(item=>Number(item.revenue||0)),borderColor:'#ca8a04',backgroundColor:'rgba(234,179,8,.15)',fill:true,tension:.35,pointRadius:2,yAxisID:'revenue'},{label:'Orders',data:daily.map(item=>Number(item.orders||0)),borderColor:'#166534',backgroundColor:'#166534',tension:.35,pointRadius:2,yAxisID:'orders'}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:7}},tooltip:{callbacks:{label:context=>context.dataset.label==='Revenue'?` Revenue: ${formatINR(context.raw)}`:` Orders: ${context.raw}`}}},scales:{revenue:{beginAtZero:true,position:'left',grid:{color:'rgba(148,163,184,.15)'},ticks:{callback:value=>'₹'+Number(value).toLocaleString('en-IN')}},orders:{beginAtZero:true,position:'right',grid:{display:false},ticks:{precision:0}}}}});
const top = (body.topProducts || []).slice(0,7).reverse();
const productCanvas = document.getElementById('productPerformanceChart');
if (productPerformanceChart) productPerformanceChart.destroy();
productPerformanceChart = new Chart(productCanvas,{type:'bar',data:{labels:top.map(item=>item._id),datasets:[{label:'Units sold',data:top.map(item=>Number(item.totalSold||0)),backgroundColor:top.map((_,index)=>index===top.length-1?'#eab308':'#172019'),borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{afterLabel:context=>`Revenue: ${formatINR(top[context.dataIndex]?.revenue||0)}`}}},scales:{x:{beginAtZero:true,ticks:{precision:0},grid:{color:'rgba(148,163,184,.15)'}},y:{grid:{display:false}}}}});
const payments = body.paymentMethods || [];
const paymentCanvas = document.getElementById('paymentMixChart');
if (paymentMixChart) paymentMixChart.destroy();
paymentMixChart = new Chart(paymentCanvas,{type:'doughnut',data:{labels:payments.map(item=>item.label),datasets:[{data:payments.map(item=>Number(item.count||0)),backgroundColor:colors,borderColor:'#fff',borderWidth:3,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'66%',plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:7,padding:12}}}}});
const bands = body.orderValueBands || [];
const valueCanvas = document.getElementById('orderValueChart');
if (orderValueChart) orderValueChart.destroy();
orderValueChart = new Chart(valueCanvas,{type:'bar',data:{labels:bands.map(item=>item.label),datasets:[{label:'Orders',data:bands.map(item=>Number(item.count||0)),backgroundColor:['#d6a900','#b68b00','#8a6800','#172019'],borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0},grid:{color:'rgba(148,163,184,.15)'}},x:{grid:{display:false}}}}});
}
function ensureVisitorAnalyticsUI(){if(document.getElementById('visitor-analytics-section'))return;const heading=[...document.querySelectorAll('h2')].find(node=>node.textContent.includes('Business Overview'));heading?.insertAdjacentHTML('beforebegin',`<section id="visitor-analytics-section" class="mt-7"><div class="flex items-end justify-between gap-3 mb-3"><div><h2 class="text-xl font-bold text-gray-800">Website Visitors & Search Activity</h2><p class="text-xs text-gray-500 mt-1">Privacy-conscious visitor sessions, catalogue searches and live product activity.</p></div><button onclick="loadVisitorAnalytics()" class="px-3 py-2 border rounded tiny font-bold bg-white">Refresh</button></div><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="card p-4 border-l-4 border-yellow-500"><span class="tiny uppercase text-gray-500">Visitors today</span><b id="visitor-today" class="block text-2xl mt-1">0</b></div><div class="card p-4 border-l-4 border-blue-500"><span class="tiny uppercase text-gray-500">Unique visitors (30 days)</span><b id="visitor-month" class="block text-2xl mt-1">0</b></div><div class="card p-4 border-l-4 border-green-500"><span class="tiny uppercase text-gray-500">Real product viewers now</span><b id="visitor-live" class="block text-2xl mt-1">0</b></div></div><div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4"><div class="card p-5"><h3 class="font-bold mb-3">Recent visitor sessions</h3><div class="overflow-auto max-h-80"><table class="w-full text-left"><thead class="bg-gray-100 tiny uppercase"><tr><th class="p-2">Last seen</th><th class="p-2">IP / location</th><th class="p-2">Activity</th></tr></thead><tbody id="visitor-recent-rows"></tbody></table></div></div><div class="card p-5"><h3 class="font-bold mb-3">What customers searched</h3><div id="visitor-searches" class="space-y-2"></div><h3 class="font-bold mt-5 mb-3">Products being viewed now</h3><div id="visitor-products" class="space-y-2"></div></div></div></section>`);}
async function loadVisitorAnalytics(){ensureVisitorAnalyticsUI();try{const{ok,body}=await adminFetch('/api/admin/analytics/visitors?days=30');if(!ok)throw new Error(body.error||'Could not load visitor analytics');document.getElementById('visitor-today').textContent=body.summary?.todayVisitors||0;document.getElementById('visitor-month').textContent=body.summary?.visitors||0;document.getElementById('visitor-live').textContent=body.summary?.currentProductViewers||0;document.getElementById('visitor-recent-rows').innerHTML=(body.recentVisitors||[]).map(item=>`<tr class="border-b"><td class="p-2 tiny whitespace-nowrap">${new Date(item.lastSeenAt).toLocaleString('en-IN')}</td><td class="p-2 tiny"><b>${escapeHtml(item.maskedIp||'Unavailable')}</b><div class="text-gray-500">${escapeHtml([item.city,item.region,item.country].filter(Boolean).join(', ')||'Location unavailable')}</div></td><td class="p-2 tiny"><b>${item.events||0} events</b><div class="text-gray-500">${item.searches||0} searches · ${escapeHtml(item.lastPath||'/')}</div></td></tr>`).join('')||'<tr><td colspan="3" class="p-3 text-gray-500">No visitor data yet.</td></tr>';document.getElementById('visitor-searches').innerHTML=(body.topSearches||[]).slice(0,12).map((item,index)=>`<div class="flex items-center justify-between border rounded p-2"><span class="text-sm"><b class="text-yellow-700 mr-2">${index+1}</b>${escapeHtml(item._id)}</span><strong class="tiny">${item.count} searches</strong></div>`).join('')||'<p class="tiny text-gray-500">No catalogue searches recorded yet.</p>';document.getElementById('visitor-products').innerHTML=(body.activeProducts||[]).map(item=>`<div class="flex items-center justify-between border rounded p-2"><span class="text-sm">${escapeHtml(item.productName||item._id)}</span><strong class="tiny text-green-700">${item.realCount} live</strong></div>`).join('')||'<p class="tiny text-gray-500">No active product pages right now.</p>';}catch(err){const rows=document.getElementById('visitor-recent-rows');if(rows)rows.innerHTML=`<tr><td colspan="3" class="p-3 text-red-600">${escapeHtml(err.message)}</td></tr>`;}}
function ensurePromotionAdminUI() {
const couponButton = document.querySelector('button[onclick="createCoupon()"]');
if (couponButton && !document.getElementById('c-description')) {
couponButton.id = 'c-submit';
couponButton.insertAdjacentHTML('beforebegin', `
<textarea id="c-description" rows="2" placeholder="Short checkout description" class="w-full p-2 border rounded mb-3 outline-none focus:border-yellow-500"></textarea>
<div class="grid grid-cols-2 gap-2 mb-3"><input id="c-start" type="datetime-local" title="Start date" class="p-2 border rounded text-xs"><input id="c-end" type="datetime-local" title="End date" class="p-2 border rounded text-xs"></div>
<label class="flex items-center gap-2 text-sm mb-2"><input id="c-visible" type="checkbox" class="accent-yellow-500"> Show coupon in checkout suggestions</label>
<label class="flex items-center gap-2 text-sm mb-4"><input id="c-active" type="checkbox" class="accent-yellow-500" checked> Coupon is active</label>`);
couponButton.insertAdjacentHTML('afterend','<button id="c-cancel-edit" type="button" onclick="cancelCouponEdit()" class="hidden w-full mt-2 border px-4 py-2 rounded font-semibold">Cancel edit</button>');
}
if (!document.getElementById('offers-admin-section')) {
const couponHeading = [...document.querySelectorAll('h2')].find(node => node.textContent.includes('Discount Coupons'));
const couponGrid = couponHeading?.nextElementSibling;
couponGrid?.insertAdjacentHTML('afterend', `<section id="offers-admin-section"><h2 class="text-xl font-bold text-gray-800 mt-8">Offers & Promotions</h2><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="card p-6"><h3 id="o-form-title" class="text-lg font-bold mb-4">Create Working Offer</h3><input id="o-name" placeholder="Offer name" class="w-full p-2 border rounded mb-3"><input id="o-code" placeholder="Offer code" class="w-full p-2 border rounded mb-3 uppercase"><textarea id="o-description" rows="2" placeholder="Customer-facing description" class="w-full p-2 border rounded mb-3"></textarea><select id="o-type" onchange="syncOfferForm()" class="w-full p-2 border rounded mb-3"><option value="buy_x_get_y">Buy X Get Y</option><option value="percentage">Percentage discount</option><option value="fixed">Fixed discount</option></select><div id="o-quantity-fields" class="grid grid-cols-2 gap-2 mb-3"><input id="o-required" type="number" min="1" placeholder="Buy quantity" class="p-2 border rounded"><input id="o-free" type="number" min="1" placeholder="Free quantity" class="p-2 border rounded"></div><div id="o-discount-fields" class="hidden mb-3"><input id="o-discount" type="number" min="0" placeholder="Discount value" class="w-full p-2 border rounded"></div><input id="o-min" type="number" min="0" placeholder="Minimum cart value" class="w-full p-2 border rounded mb-3"><input id="o-categories" placeholder="Categories (comma separated)" class="w-full p-2 border rounded mb-3"><input id="o-products" placeholder="Product IDs (optional, comma separated)" class="w-full p-2 border rounded mb-3"><input id="o-variants" placeholder="Variant keys e.g. 30ml, 30mlgift" class="w-full p-2 border rounded mb-3"><select id="o-eligibility" class="w-full p-2 border rounded mb-3"><option value="all">All customers</option><option value="first_order">First-order customers only</option></select><div class="grid grid-cols-2 gap-2 mb-3"><input id="o-start" type="datetime-local" class="p-2 border rounded text-xs"><input id="o-end" type="datetime-local" class="p-2 border rounded text-xs"></div><input id="o-priority" type="number" value="0" placeholder="Priority" class="w-full p-2 border rounded mb-3"><label class="flex items-center gap-2 text-sm mb-2"><input id="o-popup" type="checkbox" class="accent-yellow-500"> Show in offer popup</label><label class="flex items-center gap-2 text-sm mb-4"><input id="o-active" type="checkbox" class="accent-yellow-500" checked> Active and enforced at checkout</label><button id="o-submit" onclick="createOffer()" class="w-full bg-black text-white px-4 py-2 rounded font-semibold hover:text-yellow-500">Create Offer</button><button id="o-cancel-edit" onclick="cancelOfferEdit()" class="hidden w-full mt-2 border px-4 py-2 rounded font-semibold">Cancel edit</button><p id="o-msg" class="text-xs mt-2"></p></div><div class="card p-6 lg:col-span-2"><h3 class="text-lg font-bold mb-1">Current Offers</h3><p class="text-xs text-gray-500 mb-4">Active offers are calculated on the server; popup status only controls presentation.</p><div id="offers-list" class="space-y-3"></div></div></div></section>`);
syncOfferForm();
}
}
async function loadCoupons() {
ensurePromotionAdminUI();
try {
const { ok, body } = await adminFetch('/api/admin/coupons');
if (ok) {
adminCoupons = body.coupons || [];
document.getElementById('coupons-tbody').innerHTML = adminCoupons.map(c => `
<tr class="hover:bg-gray-50 border-b border-gray-100">
<td class="p-3"><div class="font-bold text-sm uppercase">${escapeHtml(c.code)}</div><div class="tiny text-gray-500">${escapeHtml(c.description || '')}</div></td>
<td class="p-3 text-sm capitalize">${c.discountType}</td>
<td class="p-3 text-sm">${c.discountType === 'percentage' ? c.discountValue + '%' : formatINR(c.discountValue)}</td>
<td class="p-3 text-sm">${formatINR(c.minOrderValue)}</td>
<td class="p-3"><label class="flex items-center gap-1 tiny mb-2"><input type="checkbox" ${c.showInCheckoutSuggestions?'checked':''} ${adminCapabilities?.adminCouponMutations?'':'disabled'} onchange="toggleCouponSuggestion('${c._id}',this.checked)"> Suggested</label><label class="flex items-center gap-1 tiny mb-2"><input type="checkbox" ${c.isActive!==false?'checked':''} ${adminCapabilities?.adminCouponMutations?'':'disabled'} onchange="toggleCouponActive('${c._id}',this.checked)"> Active</label><div class="flex gap-2"><button onclick="editCoupon('${c._id}')" class="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase"><i class="fas fa-pen"></i> Edit</button>${c.systemManaged?'<span class="tiny text-gray-400">System coupon</span>':`<button onclick="deleteCoupon('${c._id}')" ${adminCapabilities?.adminCouponMutations?'':'disabled title="Restart the current backend to manage coupons"'} class="text-red-500 hover:text-red-700 disabled:text-gray-300 text-xs font-bold uppercase"><i class="fas fa-trash"></i> Delete</button>`}</div></td>
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
const description = document.getElementById('c-description')?.value.trim() || '';
const showInCheckoutSuggestions = !!document.getElementById('c-visible')?.checked;
const isActive = document.getElementById('c-active')?.checked !== false;
const startAt = document.getElementById('c-start')?.value || null;
const endAt = document.getElementById('c-end')?.value || null;
const msg = document.getElementById('c-msg');
if(!code || !discountValue) return msg.textContent = 'Fill required fields';
try {
const endpoint=editingCouponId?`/api/admin/coupons/${editingCouponId}`:'/api/admin/coupons';
const { ok, body } = await adminFetch(endpoint, { method: editingCouponId?'PUT':'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, discountType, discountValue, minOrderValue, description, showInCheckoutSuggestions, isActive, startAt, endAt }) });
if(ok) { msg.textContent = editingCouponId?'Coupon updated!':'Coupon created!'; msg.className='text-green-600 text-xs mt-2'; cancelCouponEdit(); await loadCoupons(); }
else throw new Error(body.error || 'Failed to create coupon');
} catch (err) { msg.textContent = err.message||'Failed to save coupon'; msg.className='text-red-600 text-xs mt-2'; }
}
function localDateTime(value){if(!value)return'';const date=new Date(value);if(Number.isNaN(date.getTime()))return'';return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function editCoupon(id){const c=adminCoupons.find(item=>String(item._id)===String(id));if(!c)return;editingCouponId=id;document.getElementById('c-code').value=c.code||'';document.getElementById('c-code').disabled=true;document.getElementById('c-type').value=c.discountType||'percentage';document.getElementById('c-value').value=c.discountValue??'';document.getElementById('c-min').value=c.minOrderValue??0;document.getElementById('c-description').value=c.description||'';document.getElementById('c-start').value=localDateTime(c.startAt);document.getElementById('c-end').value=localDateTime(c.endAt);document.getElementById('c-visible').checked=!!c.showInCheckoutSuggestions;document.getElementById('c-active').checked=c.isActive!==false;document.getElementById('c-submit').textContent='Save Coupon Changes';document.getElementById('c-cancel-edit').classList.remove('hidden');document.getElementById('c-submit').scrollIntoView({behavior:'smooth',block:'center'});}
function cancelCouponEdit(){editingCouponId=null;['c-code','c-value','c-min','c-description','c-start','c-end'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('c-code').disabled=false;document.getElementById('c-visible').checked=false;document.getElementById('c-active').checked=true;document.getElementById('c-submit').textContent='Create Coupon';document.getElementById('c-cancel-edit').classList.add('hidden');}
async function updateCouponSetting(id, patch) { if(!adminCapabilities?.adminCouponMutations)return alert(outdatedBackendMessage()); const { ok, body } = await adminFetch(`/api/admin/coupons/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(patch) }); if(!ok) alert(body.error || 'Could not update coupon'); await loadCoupons(); }
function toggleCouponSuggestion(id, value) { return updateCouponSetting(id, { showInCheckoutSuggestions:value }); }
function toggleCouponActive(id, value) { return updateCouponSetting(id, { isActive:value }); }
async function deleteCoupon(id) {
if(!adminCapabilities?.adminCouponMutations) return alert(outdatedBackendMessage());
if(!confirm('Delete this coupon?')) return;
const{ok,body}=await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
if(!ok)return alert(body.error||'Could not delete coupon');
adminCoupons=adminCoupons.filter(item=>String(item._id)!==String(id));
await loadCoupons();
}
function syncOfferForm(){const type=document.getElementById('o-type')?.value;document.getElementById('o-quantity-fields')?.classList.toggle('hidden',type!=='buy_x_get_y');document.getElementById('o-discount-fields')?.classList.toggle('hidden',type==='buy_x_get_y');}
function offerFormPayload(){const list=id=>document.getElementById(id).value.split(',').map(value=>value.trim()).filter(Boolean);return{name:document.getElementById('o-name').value.trim(),code:document.getElementById('o-code').value.trim(),description:document.getElementById('o-description').value.trim(),offerType:document.getElementById('o-type').value,requiredQuantity:Number(document.getElementById('o-required').value)||0,freeQuantity:Number(document.getElementById('o-free').value)||0,discountValue:Number(document.getElementById('o-discount').value)||0,minCartValue:Number(document.getElementById('o-min').value)||0,categories:list('o-categories'),productIds:list('o-products'),variantKeys:list('o-variants'),customerEligibility:document.getElementById('o-eligibility').value,startAt:document.getElementById('o-start').value||null,endAt:document.getElementById('o-end').value||null,priority:Number(document.getElementById('o-priority').value)||0,showInPopup:document.getElementById('o-popup').checked,isActive:document.getElementById('o-active').checked};}
async function loadOffers(){ensurePromotionAdminUI();if(!adminCapabilities?.adminOffers)return showOutdatedOffersNotice();try{const{ok,body}=await adminFetch('/api/admin/offers');if(!ok)throw new Error(body.error||'Could not load offers');adminOffers=body.offers||[];document.getElementById('offers-list').innerHTML=adminOffers.map(offer=>`<article class="border rounded-lg p-4 flex items-start justify-between gap-3"><div><div class="flex items-center gap-2"><b>${escapeHtml(offer.name)}</b><code class="tiny bg-gray-100 px-2 py-1 rounded">${escapeHtml(offer.code)}</code></div><p class="tiny text-gray-500 mt-1">${escapeHtml(offer.description||'')}</p><div class="tiny mt-2">${offer.offerType==='buy_x_get_y'?`Buy ${offer.requiredQuantity}, get ${offer.freeQuantity}`:offer.offerType==='percentage'?`${offer.discountValue}% off`:`${formatINR(offer.discountValue)} off`} · Minimum ${formatINR(offer.minCartValue||0)} · Priority ${offer.priority||0}</div><div class="tiny mt-1"><span class="${offer.isActive?'text-green-600':'text-gray-400'}">${offer.isActive?'Active':'Inactive'}</span>${offer.showInPopup?' · Popup visible':''}</div></div><div class="flex flex-wrap gap-2 justify-end"><button onclick="editOffer('${offer._id}')" class="px-2 py-1 border rounded tiny text-blue-700">Edit</button><button onclick="toggleOffer('${offer._id}')" class="px-2 py-1 border rounded tiny">${offer.isActive?'Disable':'Enable'}</button><button onclick="deleteOffer('${offer._id}')" class="px-2 py-1 border rounded tiny text-red-600">Delete</button></div></article>`).join('')||'<p class="text-sm text-gray-500">No offers configured.</p>';}catch(err){const list=document.getElementById('offers-list');if(list)list.innerHTML=`<p class="text-red-600 text-sm">${escapeHtml(err.message)}</p>`;}}
async function createOffer(){const msg=document.getElementById('o-msg');if(!adminCapabilities?.adminOffers){msg.textContent=outdatedBackendMessage();msg.className='text-amber-700 text-xs mt-2';return;}const payload=offerFormPayload();if(!payload.name||!payload.code)return msg.textContent='Name and code are required.';const endpoint=editingOfferId?`/api/admin/offers/${editingOfferId}`:'/api/admin/offers';const{ok,body}=await adminFetch(endpoint,{method:editingOfferId?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});msg.textContent=ok?(editingOfferId?'Offer updated.':'Offer created and ready for server validation.'):(body.error||'Could not save offer');msg.className=ok?'text-green-600 text-xs mt-2':'text-red-600 text-xs mt-2';if(ok){cancelOfferEdit();await loadOffers();}}
function editOffer(id){const offer=adminOffers.find(item=>String(item._id)===String(id));if(!offer)return;editingOfferId=id;const set=(key,value)=>{const el=document.getElementById(key);if(el)el.value=value??'';};set('o-name',offer.name);set('o-code',offer.code);set('o-description',offer.description);set('o-type',offer.offerType);set('o-required',offer.requiredQuantity);set('o-free',offer.freeQuantity);set('o-discount',offer.discountValue);set('o-min',offer.minCartValue);set('o-categories',(offer.categories||[]).join(', '));set('o-products',(offer.productIds||[]).join(', '));set('o-variants',(offer.variantKeys||[]).join(', '));set('o-eligibility',offer.customerEligibility||'all');set('o-start',localDateTime(offer.startAt));set('o-end',localDateTime(offer.endAt));set('o-priority',offer.priority||0);document.getElementById('o-popup').checked=!!offer.showInPopup;document.getElementById('o-active').checked=offer.isActive!==false;document.getElementById('o-form-title').textContent=`Edit ${offer.name}`;document.getElementById('o-submit').textContent='Save Offer Changes';document.getElementById('o-cancel-edit').classList.remove('hidden');syncOfferForm();document.getElementById('o-form-title').scrollIntoView({behavior:'smooth',block:'start'});}
function cancelOfferEdit(){editingOfferId=null;['o-name','o-code','o-description','o-required','o-free','o-discount','o-min','o-categories','o-products','o-variants','o-start','o-end'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('o-type').value='buy_x_get_y';document.getElementById('o-eligibility').value='all';document.getElementById('o-priority').value='0';document.getElementById('o-popup').checked=false;document.getElementById('o-active').checked=true;document.getElementById('o-form-title').textContent='Create Working Offer';document.getElementById('o-submit').textContent='Create Offer';document.getElementById('o-cancel-edit').classList.add('hidden');syncOfferForm();}
async function toggleOffer(id){const offer=adminOffers.find(item=>item._id===id);if(!offer)return;const{_id,__v,createdAt,updatedAt,...payload}=offer;payload.isActive=!offer.isActive;const{ok,body}=await adminFetch(`/api/admin/offers/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!ok)return alert(body.error||'Could not update offer');loadOffers();}
async function deleteOffer(id){if(!confirm('Delete this offer?'))return;const{ok,body}=await adminFetch(`/api/admin/offers/${id}`,{method:'DELETE'});if(!ok)return alert(body.error||'Could not delete offer');adminOffers=adminOffers.filter(item=>String(item._id)!==String(id));if(editingOfferId===id)cancelOfferEdit();await loadOffers();}
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
<div class="mt-3 border-t pt-3">
<span class="text-xs text-gray-500">EEERP sales sync</span>
<div class="flex items-center gap-2 mt-1"><span class="inline-flex px-2 py-1 rounded tiny font-semibold ${selectedOrder.erpSyncState==='SYNCED'?'bg-green-100 text-green-700':selectedOrder.erpSyncState==='FAILED'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}">${escapeHtml(selectedOrder.erpSyncState||'PENDING')}</span>${selectedOrder.erpSyncState!=='SYNCED'?`<button onclick="retryEeerpSync('${orderId}')" class="px-2 py-1 border rounded tiny font-bold">Retry sync</button>`:''}</div>
${selectedOrder.erpSyncError?`<p class="tiny text-red-600 mt-1">${escapeHtml(selectedOrder.erpSyncError)}</p>`:''}
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
async function retryEeerpSync(orderId){const{ok,body}=await adminFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/eeerp-sync`,{method:'POST'});if(!ok)return alert(body.error||'EEERP synchronization failed');const index=orders.findIndex(order=>String(order._id)===String(body.order?._id));if(index>=0)orders[index]=body.order;selectedOrder=body.order;openOrderModal(body.order._id);}
async function loadAdminProducts() {
try {
const { ok, body } = await adminFetch('/api/admin/products');
if (!ok) throw new Error(body.error || 'Could not load products');
adminProducts = body.products || [];
await syncAndLoadInventory();
renderInventoryProducts();
} catch (err) {
document.getElementById('products-tbody').innerHTML = `<tr><td colspan="7" class="p-4 text-red-600">${escapeHtml(err.message)}</td></tr>`;
}
}
function renderInventoryProducts() {
ensureInventoryBulkControls();
const rows=visibleInventoryRows();
document.getElementById('inventory-selection-count').textContent=`${selectedInventoryIds.size} variant${selectedInventoryIds.size===1?'':'s'} selected`;
document.getElementById('inventory-select-all').checked=!!rows.length&&rows.every(item=>selectedInventoryIds.has(String(item._id)));
document.getElementById('products-tbody').innerHTML = rows.map(item => {
const id=String(item._id),stock=Number(item.stock??12),available=Math.max(0,stock-Number(item.reserved||0));
const state=available===0?'<span class="inline-flex px-2 py-1 rounded bg-red-100 text-red-700 font-bold">OUT OF STOCK</span>':available<=Number(item.lowStockThreshold||4)?'<span class="inline-flex px-2 py-1 rounded bg-amber-100 text-amber-700 font-bold">LOW STOCK</span>':'<span class="inline-flex px-2 py-1 rounded bg-green-100 text-green-700 font-bold">IN STOCK</span>';
return `<tr class="hover:bg-gray-50 border-b border-gray-100 ${selectedInventoryIds.has(id)?'bg-yellow-50':''}"><td class="p-3"><input type="checkbox" aria-label="Select ${escapeHtml(item.name)} ${escapeHtml(item.sizeLabel)}" ${selectedInventoryIds.has(id)?'checked':''} onchange="toggleInventorySelection('${id}',this.checked)"></td><td class="p-3"><img src="${productImage(item)}" class="w-12 h-12 object-contain rounded border bg-white" onerror="this.style.display='none'"></td><td class="p-3"><div class="font-semibold text-sm">${escapeHtml(item.name)}</div><div class="tiny text-gray-500">${escapeHtml(item.sizeLabel||'Default')} · ${escapeHtml(item.variantKey)}</div></td><td class="p-3 tiny">${escapeHtml(item.category||'')}</td><td class="p-3 tiny font-bold">${escapeHtml(item.sizeLabel||'Default')}</td><td class="p-3"><div class="flex items-center gap-2"><input id="stock-${id}" type="number" min="0" step="1" value="${stock}" class="w-20 p-1 border rounded tiny"><button onclick="saveInventoryStock('${id}')" class="px-2 py-1 border rounded tiny">Save one</button></div><div class="tiny text-gray-500 mt-1">${item.reserved||0} reserved · ${available} available</div></td><td class="p-3 tiny">${state}</td></tr>`;
}).join('') || `<tr><td colspan="7" class="p-4 text-gray-500">No matching product variants.</td></tr>`;
}
function inventoryAvailable(item){return Math.max(0,Number(item.stock??12)-Number(item.reserved||0));}
function visibleInventoryRows(){const query=(document.getElementById('inventory-search')?.value||'').trim().toLowerCase(),status=document.getElementById('inventory-status-filter')?.value||'all',sort=document.getElementById('inventory-sort')?.value||'name';const rows=inventoryRows.filter(item=>{const available=inventoryAvailable(item),threshold=Number(item.lowStockThreshold||4),matchesQuery=!query||`${item.name} ${item.sizeLabel} ${item.category} ${item.variantKey}`.toLowerCase().includes(query),matchesStatus=status==='all'||(status==='out'&&available===0)||(status==='critical'&&available>0&&available<=2)||(status==='low'&&available>0&&available<=threshold)||(status==='in'&&available>threshold);return matchesQuery&&matchesStatus;});rows.sort((a,b)=>sort==='stock-asc'?inventoryAvailable(a)-inventoryAvailable(b)||a.name.localeCompare(b.name):sort==='stock-desc'?inventoryAvailable(b)-inventoryAvailable(a)||a.name.localeCompare(b.name):sort==='size'?String(a.sizeLabel).localeCompare(String(b.sizeLabel),undefined,{numeric:true})||a.name.localeCompare(b.name):a.name.localeCompare(b.name)||String(a.sizeLabel).localeCompare(String(b.sizeLabel),undefined,{numeric:true}));return rows;}
function ensureInventoryBulkControls(){const table=document.getElementById('products-tbody')?.closest('.overflow-auto');if(!table||document.getElementById('inventory-bulk-controls'))return;table.insertAdjacentHTML('beforebegin',`<div id="inventory-bulk-controls" class="mb-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg"><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[auto_auto_minmax(220px,1fr)_180px_180px_auto] items-center gap-3"><label class="flex items-center gap-2 text-sm font-bold"><input id="inventory-select-all" type="checkbox" onchange="selectAllVisibleInventory(this.checked)"> Select all visible</label><button onclick="clearInventorySelection()" class="px-3 py-2 border bg-white rounded tiny font-bold">Clear selection</button><input id="inventory-search" oninput="renderInventoryProducts()" placeholder="Search product, category or size" class="p-2 border rounded min-w-0"><select id="inventory-status-filter" onchange="renderInventoryProducts()" class="p-2 border rounded bg-white"><option value="all">All stock statuses</option><option value="out">Out of stock</option><option value="critical">Only 1–2 left</option><option value="low">Low stock</option><option value="in">In stock</option></select><select id="inventory-sort" onchange="renderInventoryProducts()" class="p-2 border rounded bg-white"><option value="name">Sort: Product name</option><option value="stock-asc">Sort: Quantity low to high</option><option value="stock-desc">Sort: Quantity high to low</option><option value="size">Sort: Size</option></select><strong id="inventory-selection-count" class="text-sm whitespace-nowrap">0 variants selected</strong></div><div class="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-yellow-200"><span class="tiny font-bold uppercase">Set selected variants to</span><input id="inventory-bulk-stock" type="number" min="0" step="1" value="12" placeholder="Stock quantity" class="p-2 border rounded w-36"><button onclick="applyBulkInventoryStock()" class="px-4 py-2 bg-black text-yellow-400 rounded font-bold">Apply to selected</button><span class="tiny text-gray-600">Only checked size rows change. Unselected stock is preserved.</span></div></div>`);const head=table.querySelector('thead tr');if(head){head.innerHTML='<th class="p-3 w-10">Select</th><th class="p-3">Image</th><th class="p-3">Product / Variant</th><th class="p-3">Category</th><th class="p-3">Size</th><th class="p-3">Stock</th><th class="p-3">Status</th>';}}
function toggleInventorySelection(id,checked){if(checked)selectedInventoryIds.add(String(id));else selectedInventoryIds.delete(String(id));renderInventoryProducts();}
function selectAllVisibleInventory(checked){visibleInventoryRows().forEach(item=>checked?selectedInventoryIds.add(String(item._id)):selectedInventoryIds.delete(String(item._id)));renderInventoryProducts();}
function clearInventorySelection(){selectedInventoryIds.clear();renderInventoryProducts();}
async function applyBulkInventoryStock(){const stock=Number(document.getElementById('inventory-bulk-stock')?.value);if(!selectedInventoryIds.size)return alert('Select at least one product size.');if(!Number.isInteger(stock)||stock<0)return alert('Enter a whole stock quantity of 0 or more.');if(!confirm(`Set stock to ${stock} for ${selectedInventoryIds.size} selected variant(s)?`))return;const{ok,body}=await adminFetch('/api/admin/inventory/bulk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[...selectedInventoryIds],stock})});if(!ok)return alert(body.error||'Could not update selected stock');selectedInventoryIds.clear();await syncAndLoadInventory();renderInventoryProducts();}
function productImage(product) {
const img = product.images?.[0] || product.image || '';
if (!img) return '';
if (img.startsWith('http')) return img;
if (img.startsWith('/')) return img;
if (img.startsWith('products/')) return `/${img}`;
if (product.source === 'hardcoded') return img;
return `${BACKEND_BASE_URL}/products/${img}`;
}
async function loadHardcodedProducts() {
try {
const res = await fetch('/legacy/assets/js/index.496a4899fd.js', { cache: 'no-store' });
const sourceFile = await res.text();
const start = sourceFile.indexOf('const products = [');
if (start === -1) return;
const arrayStart = sourceFile.indexOf('[', start);
const nextFunction = sourceFile.indexOf('function getAttarSeries', arrayStart);
const end = nextFunction === -1 ? -1 : sourceFile.lastIndexOf('];', nextFunction);
if (arrayStart === -1 || end === -1) throw new Error('Product catalogue array boundary was not found.');
const source = sourceFile.slice(arrayStart, end + 1);
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
const seenIds=new Set(),seenNames=new Set();
const products=[...hardcodedProducts,...adminProducts.map(product=>({...product,id:product._id,source:'backend'}))].filter(product=>{const id=String(product.id||product._id),nameKey=`${product.category||product.type||'Perfume'}:${product.name||''}`.trim().toLowerCase();if(!id||seenIds.has(id)||seenNames.has(nameKey))return false;seenIds.add(id);seenNames.add(nameKey);return true;}).map(product=>({productId:String(product.id||product._id),name:product.name,category:product.category||product.type||'Perfume',image:product.images?.[0]||product.image||'',sharedStock:!!product.sharedStock,variants:adminInventoryVariants(product)}));
try {
if (products.length) {const sync=await adminFetch('/api/admin/inventory/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products }) });if(!sync.ok)throw new Error(sync.body.error||'Could not initialize product stock');}
const { ok, body } = await adminFetch('/api/admin/inventory');
if (!ok) throw new Error(body.error || 'Could not load inventory');
inventoryRows = body.inventory || [];
inventoryByProductId = new Map(inventoryRows.map(item => [`${item.productId}:${item.variantKey}`, item]));
} catch (err) {
console.warn('Inventory unavailable', err);
inventoryRows = [];
throw err;
}
}
async function saveInventoryStock(productId) {
const stock = Number(document.getElementById(`stock-${productId}`)?.value);
if(!Number.isInteger(stock)||stock<0)return alert('Stock must be a whole number of 0 or more.');
const { ok, body } = await adminFetch(`/api/admin/inventory/${encodeURIComponent(productId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }) });
if (!ok) return alert(body.error || 'Could not save stock');
const index=inventoryRows.findIndex(item=>String(item._id)===String(productId));if(index>=0)inventoryRows[index]=body.item;
renderInventoryProducts();
}
function adminInventoryVariants(product){if(product.sharedStock)return[{sizeLabel:'Shared stock',variantKey:'shared',image:product.images?.[0]||product.image||''}];const category=String(product.category||product.type||'Perfume').toLowerCase(),images=product.images||[];const labels=category.includes('attar')?['3 ml','6 ml','8 ml','12 ml']:category.includes('perfume')?['8 ml','20 ml','30 ml','50 ml','100 ml','30 ml Gift','50 ml Gift','100 ml Gift']:['Default'];const indexes=category.includes('attar')?[0,0,0,0]:[1,2,3,4,5,6,7,8];return labels.map((sizeLabel,index)=>({sizeLabel,variantKey:sizeLabel==='Default'?'default':`${sizeLabel.match(/[\d.]+/)?.[0]}ml${/gift/i.test(sizeLabel)?'gift':''}`,image:images[indexes[index]]||images[0]||product.image||''}));}
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
function setupProductCataloguePage(){
if(!document.getElementById('admin-products-link')){const link=document.createElement('a');link.id='admin-products-link';link.href=PRODUCT_CATALOGUE_PAGE?'/admin':'/admin/products';link.className='px-3 py-2 border border-yellow-500 rounded text-sm font-bold text-yellow-400 hover:bg-yellow-500 hover:text-black';link.textContent=PRODUCT_CATALOGUE_PAGE?'Back to Dashboard':'Product Catalogue';btnLogout?.parentElement?.insertBefore(link,btnLogout);}
const addCard=document.getElementById('btn-add-product')?.closest('.card'),stockCard=document.getElementById('products-tbody')?.closest('.card');
if(!PRODUCT_CATALOGUE_PAGE){addCard?.classList.add('hidden');stockCard?.classList.add('hidden');if(!document.getElementById('product-catalogue-shortcut')){const shortcut=document.createElement('a');shortcut.id='product-catalogue-shortcut';shortcut.href='/admin/products';shortcut.className='card p-5 border-l-4 border-yellow-500 flex items-center justify-between gap-4 hover:bg-yellow-50 transition';shortcut.innerHTML='<div><b class="text-lg">Product Catalogue & Stock</b><p class="tiny text-gray-500 mt-1">Open the dedicated inventory workspace for product search, filters, sorting and bulk stock updates.</p></div><span class="px-4 py-2 bg-black text-yellow-400 rounded font-bold whitespace-nowrap">Open Catalogue →</span>';dashboardEl.insertBefore(shortcut,dashboardEl.children[1]||null);}return;}
document.title='Product Catalogue — Eternal Essence Admin';
if(!stockCard||document.getElementById('product-catalogue-page'))return;
[...dashboardEl.children].forEach(child=>child.classList.add('hidden'));
const page=document.createElement('section');page.id='product-catalogue-page';page.className='space-y-6';page.innerHTML='<div class="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-yellow-500"><div><span class="tiny uppercase tracking-widest text-yellow-700 font-bold">Inventory workspace</span><h1 class="text-3xl font-bold mt-1">Product Catalogue & Stock</h1><p class="text-sm text-gray-500 mt-2">Search, filter, sort and update individual or selected product sizes without scrolling through the full dashboard.</p></div><a href="/admin" class="px-4 py-2 bg-black text-yellow-400 rounded font-bold text-center">Back to Dashboard</a></div>';
if(addCard){addCard.classList.remove('hidden','mt-8');page.appendChild(addCard);}
stockCard.classList.remove('hidden','mt-8');const title=stockCard.querySelector('h3');if(title)title.textContent='Variant Stock Management';page.appendChild(stockCard);dashboardEl.appendChild(page);ensureInventoryBulkControls();
}
setupProductCataloguePage();
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
