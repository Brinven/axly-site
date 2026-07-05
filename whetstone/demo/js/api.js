// Whetstone — fetch wrapper for all API calls. JSON in / JSON out.
// Views never import this directly — they go through dataAdapter.js (§8 PRD).
export async function api(path, opts = {}) {
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
