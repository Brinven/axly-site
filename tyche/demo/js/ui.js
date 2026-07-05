// Tyche — shared UI helpers (modal, toast, HTML escaping). No framework. (Epona pattern.)
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
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

// Band chip — the start/toss-up/sit color band with the 0–100 confidence
// underneath (PRD §4.3 hybrid display). Used everywhere recommendations show.
export function bandChip(rec) {
  if (!rec) return '<span class="band band-none">—</span>';
  const label = { start: 'START', tossup: 'TOSS-UP', sit: 'SIT' }[rec.band] || '—';
  const thin = rec.data_sufficiency != null && rec.data_sufficiency < 0.6
    ? '<span class="thin-chip" title="Limited data — score pulled toward toss-up">thin data</span>' : '';
  return `<span class="band band-${esc(rec.band)}">${label}</span>` +
         `<span class="band-score">${Math.round(rec.score)}</span>${thin}`;
}
