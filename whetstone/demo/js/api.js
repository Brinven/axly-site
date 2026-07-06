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

// POST with upload progress — fetch() can't report upload bytes, XHR can.
// onProgress(loaded, total) fires during the upload (bytes of the JSON body);
// onProgress(null, null) fires once when the body is fully sent and the
// server is processing (jimp compression on big photos takes a moment).
export function postWithProgress(path, body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded, e.total); };
      xhr.upload.onload = () => onProgress(null, null);
    }
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch (e) { data = xhr.responseText; }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error((data && data.error) || xhr.statusText || 'request failed'));
    };
    xhr.onerror = () => reject(new Error('network error during upload'));
    xhr.ontimeout = () => reject(new Error('upload timed out'));
    xhr.send(JSON.stringify(body));
  });
}
