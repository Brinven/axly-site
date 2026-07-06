// Whetstone — single data-access module (PRD §8, CLAUDE.md §3/§7).
// EVERY view calls through here; nothing else touches fetch('/api/...').
// Real mode: the local Express server. Demo mode: static demo-data.json,
// read-only — window.__WHETSTONE_DEMO__ is baked into the demo BUILD at deploy
// time (Gotcha #9), never toggled at runtime.
import { get, post, put, del, postWithProgress } from './api.js';

const DEMO_MODE = window.__WHETSTONE_DEMO__ === true;

let demoCache = null;
async function demo() {
  if (!demoCache) {
    // Relative path — the demo build may live under a subpath on axly.com.
    const res = await fetch('demo-data.json');
    demoCache = await res.json();
  }
  return demoCache;
}

function demoWrite() {
  throw new Error('This is a read-only demo — install Whetstone to manage a real collection.');
}

export function isDemo() { return DEMO_MODE; }

// --- Dashboard ---
export async function fetchDashboard() {
  if (DEMO_MODE) return (await demo()).dashboard;
  return get('/api/dashboard');
}

// --- Categories ---
export async function fetchCategories() {
  if (DEMO_MODE) return (await demo()).categories || [];
  return get('/api/categories');
}
export async function createCategory(body) { if (DEMO_MODE) demoWrite(); return post('/api/categories', body); }
export async function updateCategory(id, body) { if (DEMO_MODE) demoWrite(); return put(`/api/categories/${id}`, body); }
export async function deleteCategory(id) { if (DEMO_MODE) demoWrite(); return del(`/api/categories/${id}`); }

// --- Items ---
export async function fetchItems(filter = {}) {
  if (DEMO_MODE) {
    let items = (await demo()).items || [];
    if (filter.sold === '1') items = items.filter((i) => i.is_sold);
    else if (filter.include_sold !== '1') items = items.filter((i) => !i.is_sold);
    if (filter.category_id) items = items.filter((i) => String(i.category_id) === String(filter.category_id));
    if (filter.knife_type) items = items.filter((i) => i.knife_type === filter.knife_type);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter((i) => [i.name, i.maker, i.model, i.steel_type]
        .some((v) => v && String(v).toLowerCase().includes(q)));
    }
    return items;
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) if (v !== '' && v != null) qs.set(k, v);
  const s = qs.toString();
  return get(`/api/items${s ? '?' + s : ''}`);
}
export async function fetchItem(id) {
  if (DEMO_MODE) {
    const d = await demo();
    const it = (d.item_details || {})[id] || (d.items || []).find((i) => String(i.id) === String(id));
    if (!it) throw new Error('item not found');
    return it;
  }
  return get(`/api/items/${id}`);
}
export async function createItem(body) { if (DEMO_MODE) demoWrite(); return post('/api/items', body); }
export async function updateItem(id, body) { if (DEMO_MODE) demoWrite(); return put(`/api/items/${id}`, body); }
export async function deleteItem(id) { if (DEMO_MODE) demoWrite(); return del(`/api/items/${id}`); }

// --- Photos (per item) ---
export async function addPhoto(itemId, body, onProgress) {
  if (DEMO_MODE) demoWrite();
  return postWithProgress(`/api/items/${itemId}/photos`, body, onProgress);
}
export async function updatePhoto(itemId, photoId, body) { if (DEMO_MODE) demoWrite(); return put(`/api/items/${itemId}/photos/${photoId}`, body); }
export async function deletePhoto(itemId, photoId) { if (DEMO_MODE) demoWrite(); return del(`/api/items/${itemId}/photos/${photoId}`); }

// --- Settings ---
export async function fetchSettings() {
  if (DEMO_MODE) return (await demo()).settings || {};
  return get('/api/settings');
}
export async function saveSettings(body) { if (DEMO_MODE) demoWrite(); return put('/api/settings', body); }

// --- Custom fields (M3) ---
export async function fetchCustomFields(opts = {}) {
  if (DEMO_MODE) return (await demo()).custom_fields || [];
  return get(`/api/custom-fields${opts.includeArchived ? '?include_archived=1' : ''}`);
}
export async function createCustomField(body) { if (DEMO_MODE) demoWrite(); return post('/api/custom-fields', body); }
export async function updateCustomField(id, body) { if (DEMO_MODE) demoWrite(); return put(`/api/custom-fields/${id}`, body); }
export async function fetchItemFieldValues(itemId) {
  if (DEMO_MODE) return ((await demo()).item_field_values || {})[itemId] || [];
  return get(`/api/items/${itemId}/field-values`);
}
export async function saveItemFieldValues(itemId, values) { if (DEMO_MODE) demoWrite(); return put(`/api/items/${itemId}/field-values`, { values }); }

// --- Maintenance log (M5) ---
export async function fetchMaintenance(itemId) {
  if (DEMO_MODE) return ((await demo()).maintenance || {})[itemId] || [];
  return get(`/api/items/${itemId}/maintenance`);
}
export async function addMaintenance(itemId, body) { if (DEMO_MODE) demoWrite(); return post(`/api/items/${itemId}/maintenance`, body); }
export async function deleteMaintenance(itemId, logId) { if (DEMO_MODE) demoWrite(); return del(`/api/items/${itemId}/maintenance/${logId}`); }

// --- Tailscale setup (M4) ---
export async function fetchTailscaleStatus() {
  if (DEMO_MODE) return { installed: false, state: 'demo' };
  return get('/api/tailscale/status');
}
export async function tailscaleInstall() { if (DEMO_MODE) demoWrite(); return post('/api/tailscale/install', {}); }
export async function tailscaleUp() { if (DEMO_MODE) demoWrite(); return post('/api/tailscale/up', {}); }

// --- Wishlist (M5) ---
export async function fetchWishlist() {
  if (DEMO_MODE) return (await demo()).wishlist || [];
  return get('/api/wishlist');
}
export async function createWishlistItem(body) { if (DEMO_MODE) demoWrite(); return post('/api/wishlist', body); }
export async function updateWishlistItem(id, body) { if (DEMO_MODE) demoWrite(); return put(`/api/wishlist/${id}`, body); }
export async function deleteWishlistItem(id) { if (DEMO_MODE) demoWrite(); return del(`/api/wishlist/${id}`); }
