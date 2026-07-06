// Whetstone — Wishlist (M5). Separate from the owned collection; priority
// 0-5, most-wanted first.
import {
  fetchWishlist, createWishlistItem, updateWishlistItem, deleteWishlistItem,
  fetchCategories, isDemo
} from '../dataAdapter.js';
import { esc, fmtMoney, toast, openModal, closeModal } from '../ui.js';
import { icon } from '../icons.js';

const STARS = (p) => '★'.repeat(p) + '☆'.repeat(5 - p);

export async function render(root) {
  root.innerHTML = '<h1>Wishlist</h1><p class="muted">Loading…</p>';
  let list, cats;
  try {
    [list, cats] = await Promise.all([fetchWishlist(), fetchCategories()]);
  } catch (e) {
    root.innerHTML = `<h1>Wishlist</h1><div class="error">${esc(e.message)}</div>`;
    return;
  }

  const rows = list.map((w) => `
    <li class="rem">
      <div class="rem-main">
        <div class="rem-top">
          <span class="rem-title">${esc(w.name)}</span>
          ${w.priority ? `<span class="badge" title="Priority ${w.priority}/5">${STARS(w.priority)}</span>` : ''}
        </div>
        <div class="rem-sub">
          ${w.category_name ? `<span>${esc(w.category_name)}</span>` : ''}
          ${w.target_price != null ? `<span class="rem-date">target ${fmtMoney(w.target_price)}</span>` : ''}
          ${w.notes ? `<span class="muted">${esc(w.notes)}</span>` : ''}
        </div>
      </div>
      <div class="rem-actions">
        ${isDemo() ? '' : `
          <button class="btn small" data-edit="${w.id}">Edit</button>
          <button class="btn small danger" data-del="${w.id}">Remove</button>`}
      </div>
    </li>`).join('');

  root.innerHTML = `
    <div class="page-head">
      <h1>Wishlist</h1>
      ${isDemo() ? '' : `<button class="btn primary" id="wl-add">${icon('plus')} Add to wishlist</button>`}
    </div>
    ${list.length ? `<ul class="rem-list">${rows}</ul>`
      : '<div class="empty">Nothing on the wishlist yet — the grail list starts here.</div>'}
  `;

  if (isDemo()) return;

  root.querySelector('#wl-add').onclick = () => wishModal(null, cats, () => render(root));
  root.querySelectorAll('[data-edit]').forEach((b) => {
    b.onclick = () => wishModal(list.find((w) => String(w.id) === b.dataset.edit), cats, () => render(root));
  });
  root.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = async () => {
      try {
        await deleteWishlistItem(b.dataset.del);
        toast('Removed from wishlist', 'success');
        render(root);
      } catch (e) { toast(e.message, 'error'); }
    };
  });
}

function wishModal(existing, cats, onDone) {
  const isEdit = !!existing;
  const catOpts = ['<option value="">Any category</option>']
    .concat(cats.map((c) => `<option value="${c.id}" ${existing && existing.category_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`))
    .join('');
  const priOpts = [0, 1, 2, 3, 4, 5]
    .map((p) => `<option value="${p}" ${existing && existing.priority === p ? 'selected' : ''}>${p ? STARS(p) : '—'}</option>`)
    .join('');

  const m = openModal(`
    <h2>${isEdit ? 'Edit wishlist entry' : 'Add to wishlist'}</h2>
    <form class="form" id="wl-form">
      <label>Name <span class="req">*</span>
        <input name="name" required value="${esc(existing ? existing.name : '')}" placeholder="e.g. Chris Reeve Sebenza 31">
      </label>
      <div class="form-row">
        <label>Category <select name="category_id">${catOpts}</select></label>
        <label>Priority <select name="priority">${priOpts}</select></label>
      </div>
      <label>Target price
        <input name="target_price" type="number" step="0.01" value="${esc(existing && existing.target_price != null ? existing.target_price : '')}">
      </label>
      <label>Notes <textarea name="notes" rows="3">${esc(existing && existing.notes ? existing.notes : '')}</textarea></label>
      <div class="form-actions">
        <button class="btn primary" type="submit">${isEdit ? 'Save' : 'Add'}</button>
        <button class="btn" type="button" id="wl-cancel">Cancel</button>
      </div>
    </form>`);

  m.panel.querySelector('#wl-cancel').onclick = closeModal;
  m.panel.querySelector('#wl-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    for (const [k, v] of fd.entries()) body[k] = v;
    try {
      if (isEdit) await updateWishlistItem(existing.id, body);
      else await createWishlistItem(body);
      closeModal();
      toast(isEdit ? 'Saved' : 'Added to wishlist', 'success');
      onDone();
    } catch (err) { toast(err.message, 'error'); }
  };
}
