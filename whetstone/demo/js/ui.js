// Whetstone — shared UI helpers (modal, toast, HTML escaping, money). No framework.
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// --- Money (Critical Accuracy #1 / Gotcha #5) ---
// Values are stored raw (REAL); rounding happens HERE, at display, and only
// here. Intl handles the currency's decimal places consistently.
let CURRENCY = 'USD';
export function setCurrency(code) { CURRENCY = code || 'USD'; }
export function fmtMoney(n) {
  if (n == null || n === '') return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY }).format(n);
  } catch (e) {
    return Number(n).toFixed(2); // unknown currency code — plain 2dp fallback
  }
}

let overlayEl = null;
let keyHandler = null;

export function openModal(innerHtml) {
  closeModal();
  overlayEl = document.createElement('div');
  overlayEl.className = 'modal-overlay';
  overlayEl.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${innerHtml}</div>`;
  overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) closeModal(); });
  document.body.appendChild(overlayEl);
  document.body.classList.add('modal-open');
  keyHandler = (e) => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', keyHandler);
  return { overlay: overlayEl, panel: overlayEl.querySelector('.modal'), close: closeModal };
}

export function closeModal() {
  if (!overlayEl) return;
  overlayEl.remove();
  overlayEl = null;
  document.body.classList.remove('modal-open');
  if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
}

let toastTimer = null;
export function toast(msg, kind = 'info') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.className = `toast ${kind} show`;
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 2600);
}

// Local YYYY-MM-DD for date-input defaults.
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
