// Tyche — fetch wrapper for all API calls. JSON in / JSON out. (Epona pattern.)
// Demo builds are the exception: scripts/build-demo.js bakes window.__TYCHE_DEMO__
// into the emitted HTML (build-time, never togglable at runtime), and every GET
// is answered from static demo-data.json captured off a real instance. Writes
// refuse with a friendly error — the deployed demo has no server behind it.
const DEMO_MODE = typeof window !== 'undefined' && window.__TYCHE_DEMO__ === true;

let demoCache = null;
async function demoData() {
  if (!demoCache) {
    // Relative path — the demo may live under a subpath (axly.com/tyche/demo/).
    const res = await fetch('demo-data.json');
    demoCache = await res.json();
  }
  return demoCache;
}

async function demoApi(path, opts) {
  const method = String(opts.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    throw new Error('Read-only demo — this is sample data. The real Tyche runs locally with your own league.');
  }
  if (path.startsWith('/api/players/search')) return []; // search only feeds the add-player (write) flow
  const d = await demoData();
  if (Object.prototype.hasOwnProperty.call(d, path)) return d[path];
  const base = path.split('?')[0];
  if (Object.prototype.hasOwnProperty.call(d, base)) return d[base];
  throw new Error('Not part of this demo.');
}

export async function api(path, opts = {}) {
  if (DEMO_MODE) return demoApi(path, opts);
  const init = { headers: { 'Content-Type': 'application/json' }, ...opts };
  if (init.body && typeof init.body !== 'string') init.body = JSON.stringify(init.body);
  const res = await fetch(path, init);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (data && data.error) || res.statusText || 'request failed';
    throw new Error(msg);
  }
  return data;
}

export const get = (p) => api(p);
export const post = (p, body) => api(p, { method: 'POST', body });
export const put = (p, body) => api(p, { method: 'PUT', body });
export const del = (p, body) => api(p, { method: 'DELETE', body });
