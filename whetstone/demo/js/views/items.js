// Whetstone — Collection view: list / detail / add / edit (M2).
// Routes: #/collection · #/collection/new · #/collection/:id · #/collection/:id/edit
// All data access goes through dataAdapter.js — never fetch('/api/...') directly.
import {
  fetchItems, fetchItem, createItem, updateItem, deleteItem,
  fetchCategories, addPhoto, deletePhoto, isDemo,
  fetchCustomFields, fetchItemFieldValues, saveItemFieldValues,
  fetchMaintenance, addMaintenance, deleteMaintenance
} from '../dataAdapter.js';
import { esc, fmtMoney, toast, openModal, closeModal, todayStr } from '../ui.js';

const ACTIVITY = {
  sharpen: ['🪨', 'Sharpened'],
  oil: ['🛢️', 'Oiled'],
  clean: ['🧼', 'Cleaned'],
  repair: ['🔧', 'Repaired'],
  other: ['📝', 'Note']
};

const CONDITIONS = ['New in Box', 'Mint', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'User'];

// List filter survives navigation (dashboard cards set it before jumping here).
let listFilter = { category_id: '', q: '', include_sold: '' };
export function setListFilter(f) { listFilter = { category_id: '', q: '', include_sold: '', ...f }; }

export async function render(root, params = []) {
  if (params[0] === 'new') return renderForm(root, null);
  if (params[0] && params[1] === 'edit') return renderForm(root, await fetchItem(params[0]));
  if (params[0]) return renderDetail(root, params[0]);
  return renderList(root);
}

// ---------------------------------------------------------------- list

async function renderList(root) {
  root.innerHTML = '<h1>Collection</h1><p class="muted">Loading…</p>';
  let cats, items;
  try {
    [cats, items] = await Promise.all([fetchCategories(), fetchItems(listFilter)]);
  } catch (e) {
    root.innerHTML = `<h1>Collection</h1><div class="error">Could not load collection: ${esc(e.message)}</div>`;
    return;
  }

  const catOpts = cats.map((c) =>
    `<option value="${c.id}" ${String(listFilter.category_id) === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('');

  root.innerHTML = `
    <div class="page-head">
      <h1>Collection</h1>
      ${isDemo() ? '' : '<a class="btn primary" href="#/collection/new">➕ Add item</a>'}
    </div>
    <div class="filters">
      <input type="search" id="item-q" placeholder="Search name, maker, model, steel…" value="${esc(listFilter.q)}" aria-label="Search collection">
      <select id="item-cat" aria-label="Filter by category">
        <option value="">All categories</option>
        ${catOpts}
      </select>
      <label class="checkbox inline"><input type="checkbox" id="item-sold" ${listFilter.include_sold === '1' ? 'checked' : ''}> Include sold</label>
    </div>
    ${items.length ? `<div class="item-grid">${items.map(cardHtml).join('')}</div>`
      : '<div class="empty">Nothing here yet — tap “Add item” to log the first piece.</div>'}
  `;

  let qTimer = null;
  root.querySelector('#item-q').addEventListener('input', (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { listFilter.q = e.target.value.trim(); refreshGrid(root); }, 250);
  });
  root.querySelector('#item-cat').onchange = (e) => { listFilter.category_id = e.target.value; refreshGrid(root); };
  root.querySelector('#item-sold').onchange = (e) => { listFilter.include_sold = e.target.checked ? '1' : ''; refreshGrid(root); };
}

// Re-fetch and swap only the grid so the search box keeps focus while typing.
async function refreshGrid(root) {
  try {
    const items = await fetchItems(listFilter);
    const grid = root.querySelector('.item-grid') || root.querySelector('.empty');
    if (!grid) return;
    const html = items.length
      ? `<div class="item-grid">${items.map(cardHtml).join('')}</div>`
      : '<div class="empty">No matches.</div>';
    grid.outerHTML = html;
  } catch (e) { toast(e.message, 'error'); }
}

function cardHtml(i) {
  // Relative src (no leading slash): resolves against / in the real app and
  // against the subpath in the deployed demo (axly.com/whetstone/demo/).
  const thumb = i.thumb
    ? `<img class="item-thumb" src="${esc(i.thumb)}" alt="" loading="lazy">`
    : '<div class="item-thumb placeholder" aria-hidden="true">🗡️</div>';
  const sub = [i.maker, i.model].filter(Boolean).map(esc).join(' · ');
  return `<a class="item-card" href="#/collection/${i.id}">
    ${thumb}
    <div class="item-meta">
      <div class="item-name">${esc(i.name)} ${i.is_sold ? '<span class="badge sold">Sold</span>' : ''}</div>
      <div class="item-sub">${sub || esc(i.category_name || '')}</div>
      <div class="item-sub">${i.current_value != null ? fmtMoney(i.current_value) : ''}</div>
    </div>
  </a>`;
}

// ---------------------------------------------------------------- detail

const SPEC_LABELS = [
  ['category_name', 'Category'],
  ['maker', 'Maker / Brand'],
  ['model', 'Model'],
  ['condition', 'Condition'],
  ['acquisition_date', 'Acquired'],
  ['acquisition_price', 'Paid', 'money'],
  ['current_value', 'Current value', 'money'],
  ['storage_location', 'Storage location'],
  ['blade_length', 'Blade length (in)'],
  ['overall_length', 'Overall length (in)'],
  ['weight', 'Weight (oz)'],
  ['steel_type', 'Steel'],
  ['handle_material', 'Handle material'],
  ['lock_type', 'Lock type'],
  ['blade_grind', 'Blade grind'],
  ['bevel_type', 'Bevel type'],
  ['bevel_angle', 'Bevel angle (°)'],
  ['edge_type', 'Edge type'],
  ['sold_date', 'Sold on'],
  ['sold_price', 'Sold for', 'money']
];

// Format a custom field value for display, per its type.
function fmtFieldValue(f) {
  if (f.field_type === 'currency') return fmtMoney(f.value);
  if (f.field_type === 'boolean') return f.value === '1' ? 'Yes' : 'No';
  return esc(f.value);
}

async function renderDetail(root, id) {
  root.innerHTML = '<p class="muted">Loading…</p>';
  let item, fieldValues = [], maintenance = [];
  try {
    item = await fetchItem(id);
    [fieldValues, maintenance] = await Promise.all([
      fetchItemFieldValues(id).catch(() => []),
      fetchMaintenance(id).catch(() => [])
    ]);
  }
  catch (e) { root.innerHTML = `<div class="error">${esc(e.message)}</div>`; return; }

  const photos = item.photos || [];
  const specs = SPEC_LABELS
    .filter(([k]) => item[k] != null && item[k] !== '')
    .map(([k, label, kind]) => `<div class="spec">
        <div class="spec-label">${label}</div>
        <div class="spec-value">${kind === 'money' ? fmtMoney(item[k]) : esc(item[k])}</div>
      </div>`)
    .join('');

  // Custom field values — archived fields' values stay visible (Critical
  // Accuracy #2), just labeled as archived.
  const customSpecs = fieldValues
    .filter((f) => f.value != null && f.value !== '')
    .map((f) => `<div class="spec">
        <div class="spec-label">${esc(f.field_name)}${f.is_archived ? ' (archived)' : ''}</div>
        <div class="spec-value">${fmtFieldValue(f)}</div>
      </div>`)
    .join('');

  root.innerHTML = `
    <a class="back" href="#/collection">← Collection</a>
    <div class="detail-head">
      <div class="detail-headmeta">
        <h1>${esc(item.name)} ${item.is_sold ? '<span class="badge sold">Sold</span>' : ''}</h1>
        <div class="muted">${[item.maker, item.model].filter(Boolean).map(esc).join(' · ')}</div>
      </div>
      <div class="detail-actions">
        ${isDemo() ? '' : `
          <a class="btn" href="#/collection/${item.id}/edit">✏️ Edit</a>
          <button class="btn" id="add-photo">📷 Add photo</button>
          ${item.is_sold
            ? '<button class="btn" id="unsell-item">↩️ Un-sell</button>'
            : '<button class="btn" id="sell-item">💰 Mark sold</button>'}
          <button class="btn danger" id="del-item">Delete</button>`}
      </div>
    </div>
    ${galleryHtml(photos)}
    <div class="spec-grid">${specs}${customSpecs}</div>
    ${item.notes ? `<h2 class="section-title">Notes</h2><div class="notes-box">${esc(item.notes)}</div>` : ''}
    <div class="tab-head between">
      <h2 class="section-title">Maintenance</h2>
      ${isDemo() ? '' : '<button class="btn small" id="add-maint">➕ Log entry</button>'}
    </div>
    ${maintenance.length ? `<ul class="event-list">${maintenance.map((m) => maintRow(m)).join('')}</ul>`
      : '<div class="empty small">No maintenance logged yet.</div>'}
    <input type="file" id="photo-file" accept="image/*" hidden>
  `;

  wireGallery(root, item);

  if (isDemo()) return;

  // --- Sell / un-sell ---
  const sellBtn = root.querySelector('#sell-item');
  if (sellBtn) sellBtn.onclick = () => {
    const m = openModal(`
      <h2>Mark “${esc(item.name)}” sold</h2>
      <p class="muted">Sold items leave the active collection and its totals, but stay in your history (and in realized gain/loss).</p>
      <form class="form" id="sell-form">
        <div class="form-row">
          <label>Sold on <input name="sold_date" type="date" value="${todayStr()}"></label>
          <label>Sold for <input name="sold_price" type="number" step="0.01" placeholder="0.00"></label>
        </div>
        <div class="form-actions">
          <button class="btn primary" type="submit">Mark sold</button>
          <button class="btn" type="button" id="sell-cancel">Cancel</button>
        </div>
      </form>`);
    m.panel.querySelector('#sell-cancel').onclick = closeModal;
    m.panel.querySelector('#sell-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await updateItem(item.id, { is_sold: 1, sold_date: fd.get('sold_date'), sold_price: fd.get('sold_price') });
        closeModal(); toast('Marked sold', 'success');
        renderDetail(root, item.id);
      } catch (err) { toast(err.message, 'error'); }
    };
  };
  const unsellBtn = root.querySelector('#unsell-item');
  if (unsellBtn) unsellBtn.onclick = async () => {
    try {
      await updateItem(item.id, { is_sold: 0, sold_date: '', sold_price: '' });
      toast('Back in the collection', 'success');
      renderDetail(root, item.id);
    } catch (e) { toast(e.message, 'error'); }
  };

  // --- Maintenance log ---
  const maintBtn = root.querySelector('#add-maint');
  if (maintBtn) maintBtn.onclick = () => {
    const typeOpts = Object.entries(ACTIVITY)
      .map(([v, [icon, label]]) => `<option value="${v}">${icon} ${label}</option>`).join('');
    const m = openModal(`
      <h2>Log maintenance</h2>
      <form class="form" id="maint-form">
        <div class="form-row">
          <label>Date <input name="log_date" type="date" value="${todayStr()}" required></label>
          <label>Activity <select name="activity_type">${typeOpts}</select></label>
        </div>
        <label>Notes <textarea name="notes" rows="3" placeholder="Stones used, angle, what was fixed…"></textarea></label>
        <div class="form-actions">
          <button class="btn primary" type="submit">Log it</button>
          <button class="btn" type="button" id="maint-cancel">Cancel</button>
        </div>
      </form>`);
    m.panel.querySelector('#maint-cancel').onclick = closeModal;
    m.panel.querySelector('#maint-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await addMaintenance(item.id, {
          log_date: fd.get('log_date'), activity_type: fd.get('activity_type'), notes: fd.get('notes')
        });
        closeModal(); toast('Logged', 'success');
        renderDetail(root, item.id);
      } catch (err) { toast(err.message, 'error'); }
    };
  };
  root.querySelectorAll('[data-maint-del]').forEach((b) => {
    b.onclick = async () => {
      try {
        await deleteMaintenance(item.id, b.dataset.maintDel);
        toast('Entry removed', 'success');
        renderDetail(root, item.id);
      } catch (e) { toast(e.message, 'error'); }
    };
  });

  const fileInput = root.querySelector('#photo-file');
  root.querySelector('#add-photo').onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await addPhoto(item.id, { photo: reader.result });
        toast('Photo added', 'success');
        renderDetail(root, item.id);
      } catch (e) { toast(e.message, 'error'); }
    };
    reader.readAsDataURL(f);
  };

  root.querySelector('#del-item').onclick = () => {
    const m = openModal(`
      <h2>Delete “${esc(item.name)}”?</h2>
      <p>This permanently removes the item, its photos, custom field values, and maintenance history. If it was sold, consider marking it sold instead so it stays in your records.</p>
      <div class="form-actions">
        <button class="btn danger" id="confirm-del">Delete permanently</button>
        <button class="btn" id="cancel-del">Cancel</button>
      </div>`);
    m.panel.querySelector('#cancel-del').onclick = closeModal;
    m.panel.querySelector('#confirm-del').onclick = async () => {
      try {
        await deleteItem(item.id);
        closeModal();
        toast('Item deleted', 'success');
        location.hash = '#/collection';
      } catch (e) { toast(e.message, 'error'); }
    };
  };
}

function maintRow(m) {
  const [icon, label] = ACTIVITY[m.activity_type] || ACTIVITY.other;
  return `<li class="event">
    <div class="event-top">
      <span class="event-type">${icon} ${label}</span>
      <span class="event-date">${esc(m.log_date)}</span>
      ${isDemo() ? '' : `<button class="btn small danger" data-maint-del="${m.id}" aria-label="Delete entry">✕</button>`}
    </div>
    ${m.notes ? `<div class="event-body">${esc(m.notes)}</div>` : ''}
  </li>`;
}

function galleryHtml(photos) {
  if (!photos.length) return '<div class="empty">No photos yet.</div>';
  const main = photos[0];
  const thumbs = photos.map((p, idx) => `
    <span class="gallery-thumb ${idx === 0 ? 'current' : ''}" data-idx="${idx}">
      <img src="${esc(p.file_path)}" alt="${esc(p.caption || 'photo')}" loading="lazy">
      ${isDemo() ? '' : `<button class="thumb-del" data-photo-id="${p.id}" aria-label="Delete photo">✕</button>`}
    </span>`).join('');
  return `<div class="gallery">
    <img class="gallery-main" src="${esc(main.file_path)}" alt="${esc(main.caption || 'photo')}">
    ${main.caption ? `<p class="gallery-caption">${esc(main.caption)}</p>` : ''}
    ${photos.length > 1 || !isDemo() ? `<div class="gallery-thumbs">${thumbs}</div>` : ''}
  </div>`;
}

function wireGallery(root, item) {
  const photos = item.photos || [];
  const mainImg = root.querySelector('.gallery-main');
  root.querySelectorAll('.gallery-thumb').forEach((el) => {
    el.querySelector('img').onclick = () => {
      const p = photos[Number(el.dataset.idx)];
      if (!p || !mainImg) return;
      mainImg.src = p.file_path;
      const cap = root.querySelector('.gallery-caption');
      if (cap) cap.textContent = p.caption || '';
      root.querySelectorAll('.gallery-thumb').forEach((t) => t.classList.remove('current'));
      el.classList.add('current');
    };
    const del = el.querySelector('.thumb-del');
    if (del) del.onclick = async () => {
      try {
        await deletePhoto(item.id, del.dataset.photoId);
        toast('Photo removed', 'success');
        renderDetail(root, item.id);
      } catch (e) { toast(e.message, 'error'); }
    };
  });
}

// ---------------------------------------------------------------- form

function field(label, name, item, opts = {}) {
  const val = item && item[name] != null ? item[name] : '';
  const type = opts.type || 'text';
  const extra = [
    opts.step ? `step="${opts.step}"` : '',
    opts.required ? 'required' : '',
    opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''
  ].join(' ');
  return `<label>${label}${opts.required ? ' <span class="req">*</span>' : ''}
    <input name="${name}" type="${type}" value="${esc(val)}" ${extra}>
  </label>`;
}

// Input for one custom field, per its type. Values ride as cf_<definitionId>.
function cfInput(f, val) {
  const name = `cf_${f.id}`;
  const v = val == null ? '' : val;
  switch (f.field_type) {
    case 'number':
      return `<label>${esc(f.field_name)}<input name="${name}" type="number" step="any" value="${esc(v)}"></label>`;
    case 'currency':
      return `<label>${esc(f.field_name)}<input name="${name}" type="number" step="0.01" value="${esc(v)}"></label>`;
    case 'date':
      return `<label>${esc(f.field_name)}<input name="${name}" type="date" value="${esc(v)}"></label>`;
    case 'boolean':
      return `<label class="checkbox"><input name="${name}" type="checkbox" value="1" ${v === '1' ? 'checked' : ''}> ${esc(f.field_name)}</label>`;
    case 'dropdown': {
      const opts = JSON.parse(f.dropdown_options || '[]');
      const list = (v && !opts.includes(v)) ? [v, ...opts] : opts;
      return `<label>${esc(f.field_name)}<select name="${name}">
        <option value=""></option>
        ${list.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}
      </select></label>`;
    }
    default:
      return `<label>${esc(f.field_name)}<input name="${name}" type="text" value="${esc(v)}"></label>`;
  }
}

async function renderForm(root, item) {
  let cats, cfDefs = [];
  const cfValues = {};
  try {
    [cats, cfDefs] = await Promise.all([fetchCategories(), fetchCustomFields().catch(() => [])]);
    if (item) {
      const vals = await fetchItemFieldValues(item.id).catch(() => []);
      for (const v of vals) cfValues[v.field_definition_id] = v.value == null ? '' : v.value;
    }
  }
  catch (e) { root.innerHTML = `<div class="error">${esc(e.message)}</div>`; return; }

  const cfApplicable = (catId) => cfDefs.filter((f) => !f.category_id || String(f.category_id) === String(catId));
  const cfFieldsetHtml = (catId) => {
    const list = cfApplicable(catId);
    if (!list.length) return '<fieldset id="cf-fieldset" hidden></fieldset>';
    return `<fieldset id="cf-fieldset"><legend>Custom fields</legend>
      <div class="form-row">${list.map((f) => cfInput(f, cfValues[f.id])).join('')}</div>
    </fieldset>`;
  };
  // Read whatever custom inputs are currently rendered (checkboxes → '1'/'').
  const readCfValues = (form) => {
    const out = [];
    form.querySelectorAll('[name^="cf_"]').forEach((el) => {
      const id = Number(el.name.slice(3));
      out.push({ field_definition_id: id, value: el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value });
    });
    return out;
  };

  const isEdit = !!item;
  const catOpts = cats.map((c) =>
    `<option value="${c.id}" ${item && item.category_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const condVal = item && item.condition ? item.condition : '';
  const condOpts = ['<option value=""></option>']
    .concat((CONDITIONS.includes(condVal) || !condVal ? CONDITIONS : [condVal, ...CONDITIONS])
      .map((c) => `<option ${c === condVal ? 'selected' : ''}>${esc(c)}</option>`))
    .join('');

  root.innerHTML = `
    <a class="back" href="${isEdit ? `#/collection/${item.id}` : '#/collection'}">← Back</a>
    <h1>${isEdit ? `Edit ${esc(item.name)}` : 'Add item'}</h1>
    <form class="form" id="item-form" novalidate>
      <fieldset>
        <legend>Basics</legend>
        <div class="form-row">
          ${field('Name', 'name', item, { required: true, placeholder: 'e.g. Spyderco Para 3' })}
          <label>Category <span class="req">*</span>
            <select name="category_id" required>${catOpts}</select>
          </label>
        </div>
        <div class="form-row">
          ${field('Maker / Brand', 'maker', item)}
          ${field('Model', 'model', item)}
        </div>
      </fieldset>
      <fieldset>
        <legend>Acquisition &amp; value</legend>
        <div class="form-row">
          ${field('Acquired on', 'acquisition_date', item, { type: 'date' })}
          <label>Condition <select name="condition">${condOpts}</select></label>
        </div>
        <div class="form-row">
          ${field('Price paid', 'acquisition_price', item, { type: 'number', step: '0.01' })}
          ${field('Current value', 'current_value', item, { type: 'number', step: '0.01' })}
        </div>
        ${field('Storage location', 'storage_location', item, { placeholder: 'e.g. Safe, display case, EDC rotation' })}
      </fieldset>
      <fieldset>
        <legend>Blade specs</legend>
        <div class="form-row">
          ${field('Blade length (in)', 'blade_length', item, { type: 'number', step: '0.01' })}
          ${field('Overall length (in)', 'overall_length', item, { type: 'number', step: '0.01' })}
          ${field('Weight (oz)', 'weight', item, { type: 'number', step: '0.01' })}
        </div>
        <div class="form-row">
          ${field('Steel', 'steel_type', item, { placeholder: 'e.g. CPM S45VN, 1095, T10' })}
          ${field('Blade grind', 'blade_grind', item, { placeholder: 'e.g. Full flat, hollow, scandi' })}
        </div>
        <div class="form-row">
          ${field('Bevel type', 'bevel_type', item, { placeholder: 'e.g. V, convex, chisel' })}
          ${field('Bevel angle (°)', 'bevel_angle', item, { type: 'number', step: '0.5' })}
          ${field('Edge type', 'edge_type', item, { placeholder: 'e.g. Plain, serrated, combo' })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Handle &amp; lock</legend>
        <div class="form-row">
          ${field('Handle material', 'handle_material', item, { placeholder: 'e.g. G-10, micarta, stag' })}
          ${field('Lock type', 'lock_type', item, { placeholder: 'Folders only — e.g. liner, frame, compression' })}
        </div>
      </fieldset>
      ${cfFieldsetHtml(item ? item.category_id : (cats[0] ? cats[0].id : ''))}
      <fieldset>
        <legend>Notes</legend>
        <label>Notes <textarea name="notes" rows="4">${esc(item && item.notes ? item.notes : '')}</textarea></label>
      </fieldset>
      <div class="form-actions">
        <button class="btn primary" type="submit">${isEdit ? 'Save changes' : 'Add to collection'}</button>
        <a class="btn" href="${isEdit ? `#/collection/${item.id}` : '#/collection'}">Cancel</a>
      </div>
    </form>
  `;

  // Category switch re-renders the custom fieldset for the new category,
  // carrying over anything already typed into still-applicable fields.
  root.querySelector('select[name="category_id"]').onchange = (e) => {
    const form = root.querySelector('#item-form');
    for (const c of readCfValues(form)) cfValues[c.field_definition_id] = c.value;
    form.querySelector('#cf-fieldset').outerHTML = cfFieldsetHtml(e.target.value);
  };

  root.querySelector('#item-form').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const body = {};
    for (const [k, v] of fd.entries()) if (!k.startsWith('cf_')) body[k] = v;
    if (!body.name || !body.name.trim()) { toast('Name is required', 'error'); return; }
    const cfList = readCfValues(form);
    try {
      const saved = isEdit ? await updateItem(item.id, body) : await createItem(body);
      if (cfList.length) {
        try { await saveItemFieldValues(saved.id, cfList); }
        catch (cfErr) {
          toast(`Item saved, but custom fields failed: ${cfErr.message}`, 'error');
          location.hash = `#/collection/${saved.id}`;
          return;
        }
      }
      toast(isEdit ? 'Saved' : 'Added to collection', 'success');
      location.hash = `#/collection/${saved.id}`;
    } catch (err) { toast(err.message, 'error'); }
  };
}
