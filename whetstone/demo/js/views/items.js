// Whetstone — Collection views (M6.5 reskin, Lloyd's mockup IA).
// Routes: #/collection            → category browser (search + tiles)
//         #/collection/cat/:catId → category list (tabs/sort/view/rail)
//         #/collection/all        → same list, every category
//         #/collection/new[/:cat] → add form (category preselected)
//         #/collection/:id        → detail · #/collection/:id/edit → edit form
// Dispatch order matters: new → cat → all → :id/edit → :id.
// All data access goes through dataAdapter.js — never fetch('/api/...') directly.
import {
  fetchItems, fetchItem, createItem, updateItem, deleteItem,
  fetchCategories, addPhoto, deletePhoto, isDemo,
  fetchCustomFields, fetchItemFieldValues, saveItemFieldValues,
  fetchMaintenance, addMaintenance, deleteMaintenance
} from '../dataAdapter.js';
import { esc, fmtMoney, toast, openModal, closeModal, todayStr } from '../ui.js';
import { icon, categoryIcon, isKnifeCategory } from '../icons.js';
import { setAppbar } from '../app.js';

const ACTIVITY = {
  sharpen: ['🪨', 'Sharpened'],
  oil: ['🛢️', 'Oiled'],
  clean: ['🧼', 'Cleaned'],
  repair: ['🔧', 'Repaired'],
  other: ['📝', 'Note']
};

const CONDITIONS = ['New in Box', 'Mint', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'User'];
const KNIFE_TYPES = [['folding', 'Folding'], ['fixed', 'Fixed'], ['auto', 'Auto']];

// ---------------------------------------------------------------- state

// Per-category list state (knife tab, search, sold) — survives hash nav.
const listState = {};
function stateFor(catKey) {
  if (!listState[catKey]) listState[catKey] = { tab: '', q: '', sold: '' };
  return listState[catKey];
}

// Sort + view mode persist across sessions.
const PREFS_KEY = 'whetstone-list-prefs';
const prefs = { sort: 'az', view: 'list' };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) { /* defaults */ }
function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* private mode */ } }

let browseQ = ''; // browser search survives back-from-detail

// ---------------------------------------------------------------- dispatch

export async function render(root, params = []) {
  if (params[0] === 'new') return renderForm(root, null, params[1] || '');
  if (params[0] === 'cat' && params[1]) return renderList(root, params[1]);
  if (params[0] === 'all') return renderList(root, null);
  if (params[0] && params[1] === 'edit') return renderForm(root, await fetchItem(params[0]), '');
  if (params[0]) return renderDetail(root, params[0]);
  return renderBrowse(root);
}

// ---------------------------------------------------------------- browser

async function renderBrowse(root) {
  root.innerHTML = '<p class="muted">Loading…</p>';
  let cats;
  try { cats = await fetchCategories(); }
  catch (e) { root.innerHTML = `<div class="error">Could not load collection: ${esc(e.message)}</div>`; return; }

  const ordered = [...cats].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  root.innerHTML = `
    <div class="filters">
      <input type="search" id="browse-q" placeholder="Search name, maker, model, steel…"
             value="${esc(browseQ)}" aria-label="Search entire collection">
      <a class="btn small" href="#/collection/all">View all</a>
    </div>
    <div id="browse-body"></div>
  `;

  const body = root.querySelector('#browse-body');
  const tilesHtml = `
    <div class="tile-grid">
      ${ordered.map((c) => `<a class="tile" href="#/collection/cat/${c.id}">
          ${categoryIcon(c.name)}
          <span>${esc(c.name)}</span>
          <span class="tile-count">${c.item_count || 0} item${(c.item_count || 0) === 1 ? '' : 's'}</span>
        </a>`).join('')}
    </div>`;

  // Typing swaps the tiles for a cross-category result list, in place.
  async function showResults() {
    if (!browseQ) { body.innerHTML = tilesHtml; return; }
    try {
      const items = await fetchItems({ q: browseQ, include_sold: '1' });
      body.innerHTML = items.length
        ? `<ul class="row-list">${items.map(rowHtml).join('')}</ul>`
        : '<div class="empty small">No matches.</div>';
    } catch (e) { toast(e.message, 'error'); }
  }

  let qTimer = null;
  root.querySelector('#browse-q').addEventListener('input', (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { browseQ = e.target.value.trim(); showResults(); }, 250);
  });
  showResults();
}

// ---------------------------------------------------------------- list

async function renderList(root, catId) {
  const catKey = catId || 'all';
  const st = stateFor(catKey);
  root.innerHTML = '<p class="muted">Loading…</p>';

  let cats;
  try { cats = await fetchCategories(); }
  catch (e) { root.innerHTML = `<div class="error">${esc(e.message)}</div>`; return; }
  const cat = catId ? cats.find((c) => String(c.id) === String(catId)) : null;
  if (catId && !cat) { root.innerHTML = '<div class="error">Category not found.</div>'; return; }
  const knife = cat ? isKnifeCategory(cat.name) : false;
  if (!knife) st.tab = '';

  setAppbar({ title: cat ? cat.name : 'All Items', back: '#/collection' });

  root.innerHTML = `
    <div class="page-head">
      <h1>${cat ? esc(cat.name) : 'All Items'}</h1>
      ${isDemo() ? '' : `<a class="btn small primary" href="#/collection/new${catId ? '/' + catId : ''}">${icon('plus')} Add</a>`}
    </div>
    ${knife ? `<div class="seg" id="knife-tabs" role="tablist">
      ${[['', 'All'], ...KNIFE_TYPES].map(([v, label]) =>
        `<button role="tab" data-tab="${v}" class="${st.tab === v ? 'on' : ''}" aria-selected="${st.tab === v}">${label}</button>`).join('')}
    </div>` : ''}
    <div class="filters">
      <input type="search" id="item-q" placeholder="Search…" value="${esc(st.q)}" aria-label="Search this list">
      <label class="checkbox inline"><input type="checkbox" id="item-sold" ${st.sold === '1' ? 'checked' : ''}> Include sold</label>
    </div>
    <div class="list-tools">
      <div class="seg" id="sort-seg">
        <button data-sort="az" class="${prefs.sort === 'az' ? 'on' : ''}">A–Z</button>
        <button data-sort="brand" class="${prefs.sort === 'brand' ? 'on' : ''}">Brand</button>
      </div>
      <div class="view-toggle">
        <button id="view-list" class="${prefs.view === 'list' ? 'on' : ''}" aria-label="List view">${icon('list')}</button>
        <button id="view-grid" class="${prefs.view === 'grid' ? 'on' : ''}" aria-label="Grid view">${icon('grid')}</button>
      </div>
    </div>
    <div class="list-wrap">
      <div class="list-body" id="list-body"><p class="muted">Loading…</p></div>
      <nav class="az-rail" id="az-rail" aria-label="Jump to letter" hidden></nav>
    </div>
  `;

  async function refresh() {
    const body = root.querySelector('#list-body');
    const rail = root.querySelector('#az-rail');
    if (!body) return;
    let items;
    try {
      items = await fetchItems({
        category_id: catId || '',
        q: st.q,
        include_sold: st.sold,
        knife_type: knife ? st.tab : ''
      });
    } catch (e) { toast(e.message, 'error'); return; }

    const key = (i) => ((prefs.sort === 'brand' ? (i.maker || i.name) : i.name) || '').trim();
    items.sort((a, b) => key(a).localeCompare(key(b), undefined, { sensitivity: 'base' }) || a.name.localeCompare(b.name));

    if (!items.length) {
      body.innerHTML = `<div class="empty">${st.q || st.tab ? 'No matches.' : 'Nothing here yet.'}</div>`;
      rail.hidden = true;
      return;
    }

    const letterOf = (i) => {
      const c = key(i).charAt(0).toUpperCase();
      return c >= 'A' && c <= 'Z' ? c : '#';
    };
    body.innerHTML = prefs.view === 'grid'
      ? `<div class="item-grid">${items.map((i) => cardHtml(i, letterOf(i))).join('')}</div>`
      : `<ul class="row-list">${items.map((i) => `<li data-letter="${letterOf(i)}">${rowHtml(i)}</li>`).join('')}</ul>`;

    // Alphabet rail: sorted list view with enough rows to be worth jumping.
    if (prefs.view === 'list' && items.length >= 15) {
      const present = new Set(items.map(letterOf));
      rail.innerHTML = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
        .map((L) => `<a href="#" data-letter="${L}" class="${present.has(L) ? '' : 'off'}">${L}</a>`).join('');
      rail.hidden = false;
      rail.querySelectorAll('a:not(.off)').forEach((a) => {
        a.onclick = (e) => {
          e.preventDefault();
          const target = body.querySelector(`[data-letter="${a.dataset.letter}"]`);
          if (target) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
        };
      });
    } else {
      rail.hidden = true;
    }
  }

  // --- wiring ---
  if (knife) {
    root.querySelectorAll('#knife-tabs button').forEach((b) => {
      b.onclick = () => {
        st.tab = b.dataset.tab;
        root.querySelectorAll('#knife-tabs button').forEach((x) => {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-selected', String(x === b));
        });
        refresh();
      };
    });
  }
  let qTimer = null;
  root.querySelector('#item-q').addEventListener('input', (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { st.q = e.target.value.trim(); refresh(); }, 250);
  });
  root.querySelector('#item-sold').onchange = (e) => { st.sold = e.target.checked ? '1' : ''; refresh(); };
  root.querySelectorAll('#sort-seg button').forEach((b) => {
    b.onclick = () => {
      prefs.sort = b.dataset.sort;
      savePrefs();
      root.querySelectorAll('#sort-seg button').forEach((x) => x.classList.toggle('on', x === b));
      refresh();
    };
  });
  const viewBtn = (id, mode) => {
    root.querySelector(id).onclick = () => {
      prefs.view = mode;
      savePrefs();
      root.querySelector('#view-list').classList.toggle('on', mode === 'list');
      root.querySelector('#view-grid').classList.toggle('on', mode === 'grid');
      refresh();
    };
  };
  viewBtn('#view-list', 'list');
  viewBtn('#view-grid', 'grid');

  refresh();
}

// Shared list row (mockup: bordered thumb, BRAND bold, name, sub line).
function rowHtml(i) {
  const thumb = i.thumb
    ? `<img class="item-thumb" src="${esc(i.thumb)}" alt="" loading="lazy">`
    : `<span class="item-thumb placeholder" aria-hidden="true">${categoryIcon(i.category_name)}</span>`;
  const sub = [i.model, i.current_value != null ? fmtMoney(i.current_value) : '']
    .filter(Boolean).map(esc).join(' · ');
  return `<a class="item-row" href="#/collection/${i.id}">
    ${thumb}
    <span class="item-meta">
      <span class="item-brand">${esc(i.maker || i.category_name || '')}</span>
      <span class="item-name">${esc(i.name)} ${i.is_sold ? '<span class="badge sold">Sold</span>' : ''}</span>
      <span class="item-sub">${sub}</span>
    </span>
  </a>`;
}

function cardHtml(i, letter) {
  const img = i.thumb
    ? `<img class="card-img" src="${esc(i.thumb)}" alt="" loading="lazy">`
    : `<span class="card-img placeholder" aria-hidden="true">${categoryIcon(i.category_name)}</span>`;
  return `<a class="item-card" href="#/collection/${i.id}" data-letter="${letter}">
    ${img}
    <span class="card-meta">
      <span class="item-brand">${esc(i.maker || i.category_name || '')}</span>
      <span class="item-name">${esc(i.name)} ${i.is_sold ? '<span class="badge sold">Sold</span>' : ''}</span>
    </span>
  </a>`;
}

// ---------------------------------------------------------------- detail

const SPEC_LABELS = [
  ['category_name', 'Category'],
  ['knife_type', 'Type', 'cap'],
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

function fmtSpec(kind, val) {
  if (kind === 'money') return fmtMoney(val);
  if (kind === 'cap') return esc(String(val).charAt(0).toUpperCase() + String(val).slice(1));
  return esc(val);
}

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

  // Back arrow goes to this item's category list (app.js can't know it).
  setAppbar({ title: item.category_name || 'Item', back: `#/collection/cat/${item.category_id}` });

  const photos = item.photos || [];
  const specs = SPEC_LABELS
    .filter(([k]) => item[k] != null && item[k] !== '')
    .map(([k, label, kind]) => `<div class="spec">
        <div class="spec-label">${label}</div>
        <div class="spec-value">${fmtSpec(kind, item[k])}</div>
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

  const brandline = [item.maker, item.model].filter(Boolean).map(esc).join(' | ');

  root.innerHTML = `
    <div class="detail-head">
      <div class="detail-headmeta">
        <h1>${esc(item.name)} ${item.is_sold ? '<span class="badge sold">Sold</span>' : ''}</h1>
        ${brandline ? `<div class="detail-brandline">${brandline}</div>` : ''}
      </div>
      <div class="detail-actions">
        ${isDemo() ? '' : `
          <a class="btn small" href="#/collection/${item.id}/edit">${icon('pencil')} Edit</a>
          <button class="btn small" id="add-photo">${icon('camera')} Photo</button>
          ${item.is_sold
            ? `<button class="btn small" id="unsell-item">${icon('undo')} Un-sell</button>`
            : `<button class="btn small" id="sell-item">${icon('money')} Mark sold</button>`}
          <button class="btn small danger" id="del-item">${icon('trash')} Delete</button>`}
      </div>
    </div>
    ${galleryHtml(photos, item.category_name)}
    <div class="spec-grid">${specs}${customSpecs}</div>
    ${item.notes ? `<h2 class="section-title">Notes</h2><div class="notes-box">${esc(item.notes)}</div>` : ''}
    <div class="tab-head between">
      <h2 class="section-title">Maintenance</h2>
      ${isDemo() ? '' : `<button class="btn small" id="add-maint">${icon('plus')} Log entry</button>`}
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
      .map(([v, [ic, label]]) => `<option value="${v}">${ic} ${label}</option>`).join('');
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
  const photoBtn = root.querySelector('#add-photo');
  photoBtn.onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    // Live progress on the button — over Tailscale/cellular a phone photo
    // takes seconds to send, then the server compresses it. Silence reads
    // as "broken"; numbers read as "working".
    const mb = (n) => (n / 1048576).toFixed(1);
    const setBtn = (txt, disabled) => { photoBtn.textContent = txt; photoBtn.disabled = disabled; };
    const reader = new FileReader();
    reader.onload = async () => {
      setBtn('Uploading…', true);
      try {
        await addPhoto(item.id, { photo: reader.result }, (loaded, total) => {
          if (loaded == null) setBtn('Processing…', true);
          else setBtn(`${mb(loaded)} / ${mb(total)} MB`, true);
        });
        toast('Photo added', 'success');
        renderDetail(root, item.id);
      } catch (e) {
        setBtn('Photo', false);
        toast(e.message, 'error');
      }
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
        const catId = item.category_id;
        await deleteItem(item.id);
        closeModal();
        toast('Item deleted', 'success');
        location.hash = `#/collection/cat/${catId}`;
      } catch (e) { toast(e.message, 'error'); }
    };
  };
}

function maintRow(m) {
  const [ic, label] = ACTIVITY[m.activity_type] || ACTIVITY.other;
  return `<li class="event">
    <div class="event-top">
      <span class="event-type">${ic} ${label}</span>
      <span class="event-date">${esc(m.log_date)}</span>
      ${isDemo() ? '' : `<button class="btn small danger" data-maint-del="${m.id}" aria-label="Delete entry">✕</button>`}
    </div>
    ${m.notes ? `<div class="event-body">${esc(m.notes)}</div>` : ''}
  </li>`;
}

function galleryHtml(photos, categoryName) {
  if (!photos.length) {
    return `<div class="gallery"><div class="item-thumb placeholder gallery-none" aria-hidden="true" style="width:100%;height:180px;">${categoryIcon(categoryName)}</div></div>`;
  }
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

// Knife-type segmented control — rendered only for the knife category.
// Radio-backed so it rides FormData like every other field.
function knifeTypeHtml(catName, current) {
  if (!isKnifeCategory(catName)) return '<div id="knife-type-wrap" hidden></div>';
  const opts = [...KNIFE_TYPES, ['', '—']];
  return `<div id="knife-type-wrap">
    <span class="field-label">Type</span>
    <div class="seg">
      ${opts.map(([v, label]) => `<label class="seg-opt ${String(current || '') === v ? 'on' : ''}">
        <input type="radio" name="knife_type" value="${v}" ${String(current || '') === v ? 'checked' : ''}>${label}
      </label>`).join('')}
    </div>
  </div>`;
}

function wireKnifeTypeSeg(form) {
  form.querySelectorAll('#knife-type-wrap .seg-opt input').forEach((r) => {
    r.addEventListener('change', () => {
      form.querySelectorAll('#knife-type-wrap .seg-opt').forEach((l) => {
        l.classList.toggle('on', l.querySelector('input').checked);
      });
    });
  });
}

async function renderForm(root, item, presetCatId) {
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

  const isEdit = !!item;
  setAppbar({
    title: isEdit ? 'Edit Item' : 'Add Item',
    back: isEdit ? `#/collection/${item.id}` : '#/collection'
  });

  const initialCatId = item ? item.category_id
    : (presetCatId && cats.some((c) => String(c.id) === String(presetCatId)) ? Number(presetCatId)
      : (cats[0] ? cats[0].id : ''));
  const catName = (id) => { const c = cats.find((x) => String(x.id) === String(id)); return c ? c.name : ''; };

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

  const catOpts = cats.map((c) =>
    `<option value="${c.id}" ${String(initialCatId) === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const condVal = item && item.condition ? item.condition : '';
  const condOpts = ['<option value=""></option>']
    .concat((CONDITIONS.includes(condVal) || !condVal ? CONDITIONS : [condVal, ...CONDITIONS])
      .map((c) => `<option ${c === condVal ? 'selected' : ''}>${esc(c)}</option>`))
    .join('');

  root.innerHTML = `
    <h1>${isEdit ? `Edit ${esc(item.name)}` : `Add ${esc(catName(initialCatId) || 'Item')}`}</h1>
    <form class="form" id="item-form" novalidate>
      <fieldset>
        <legend>Basics</legend>
        <div class="form-row">
          ${field('Name', 'name', item, { required: true, placeholder: 'e.g. Spyderco Para 3' })}
          <label>Category <span class="req">*</span>
            <select name="category_id" required>${catOpts}</select>
          </label>
        </div>
        ${knifeTypeHtml(catName(initialCatId), item ? item.knife_type : '')}
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
      ${cfFieldsetHtml(initialCatId)}
      <fieldset>
        <legend>Photos</legend>
        <div class="photo-slots" id="photo-slots"></div>
      </fieldset>
      <fieldset>
        <legend>Notes</legend>
        <label>Notes <textarea name="notes" rows="4">${esc(item && item.notes ? item.notes : '')}</textarea></label>
      </fieldset>
      <div class="form-actions">
        <button class="btn primary" type="submit">${isEdit ? 'Save changes' : 'Save'}</button>
        <a class="btn" href="${isEdit ? `#/collection/${item.id}` : '#/collection'}">Cancel</a>
      </div>
    </form>
    <input type="file" id="form-photo-file" accept="image/*" hidden>
  `;

  const form = root.querySelector('#item-form');
  wireKnifeTypeSeg(form);

  // --- Photo slots (mockup ADD PHOTO row). Edit mode uploads immediately;
  // new mode queues files and uploads after the item is created.
  const queued = []; // File objects (new mode)
  const fileInput = root.querySelector('#form-photo-file');
  const slots = root.querySelector('#photo-slots');
  const mb = (n) => (n / 1048576).toFixed(1);

  function renderSlots() {
    const existing = (item && item.photos ? item.photos : [])
      .map((p) => `<span class="photo-slot filled"><img src="${esc(p.file_path)}" alt=""></span>`).join('');
    const pending = queued
      .map((f, idx) => `<span class="photo-slot filled"><img src="${URL.createObjectURL(f)}" alt="">
        <button type="button" class="slot-del" data-q="${idx}" aria-label="Remove photo">✕</button></span>`).join('');
    slots.innerHTML = `${existing}${pending}
      <button type="button" class="photo-slot" id="slot-add" aria-label="Add photo">${icon('camera')}</button>`;
    slots.querySelector('#slot-add').onclick = () => fileInput.click();
    slots.querySelectorAll('.slot-del').forEach((b) => {
      b.onclick = () => { queued.splice(Number(b.dataset.q), 1); renderSlots(); };
    });
  }
  renderSlots();

  fileInput.onchange = () => {
    const f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    if (!isEdit) { queued.push(f); renderSlots(); return; }
    // Edit mode: upload now, with live progress on the add slot.
    const addBtn = slots.querySelector('#slot-add');
    const reader = new FileReader();
    reader.onload = async () => {
      addBtn.disabled = true;
      try {
        await addPhoto(item.id, { photo: reader.result }, (loaded, total) => {
          addBtn.textContent = loaded == null ? '…' : `${mb(loaded)}MB`;
        });
        item.photos = (await fetchItem(item.id)).photos;
        toast('Photo added', 'success');
        renderSlots();
      } catch (e) {
        toast(e.message, 'error');
        renderSlots();
      }
    };
    reader.readAsDataURL(f);
  };

  // Category switch re-renders the knife-type control + custom fieldset for
  // the new category, carrying over anything already entered where possible.
  form.querySelector('select[name="category_id"]').onchange = (e) => {
    for (const c of readCfValues(form)) cfValues[c.field_definition_id] = c.value;
    const checked = form.querySelector('#knife-type-wrap input:checked');
    const currentType = checked ? checked.value : (item ? item.knife_type : '');
    form.querySelector('#cf-fieldset').outerHTML = cfFieldsetHtml(e.target.value);
    form.querySelector('#knife-type-wrap').outerHTML = knifeTypeHtml(catName(e.target.value), currentType);
    wireKnifeTypeSeg(form);
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {};
    for (const [k, v] of fd.entries()) if (!k.startsWith('cf_')) body[k] = v;
    if (!body.name || !body.name.trim()) { toast('Name is required', 'error'); return; }
    // No knife-type control rendered (non-knife category) → clear the field.
    if (!form.querySelector('#knife-type-wrap input')) body.knife_type = '';
    const cfList = readCfValues(form);
    const submitBtn = form.querySelector('button[type="submit"]');
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
      // New mode: upload the queued photos sequentially, with progress.
      if (!isEdit && queued.length) {
        submitBtn.disabled = true;
        for (let i = 0; i < queued.length; i++) {
          submitBtn.textContent = `Photo ${i + 1}/${queued.length}…`;
          try {
            const dataUrl = await new Promise((res, rej) => {
              const r = new FileReader();
              r.onload = () => res(r.result);
              r.onerror = rej;
              r.readAsDataURL(queued[i]);
            });
            await addPhoto(saved.id, { photo: dataUrl }, (loaded) => {
              submitBtn.textContent = loaded == null
                ? `Photo ${i + 1}/${queued.length}: processing…`
                : `Photo ${i + 1}/${queued.length}: ${mb(loaded)}MB`;
            });
          } catch (phErr) {
            toast(`Item saved, but photo ${i + 1} failed: ${phErr.message}`, 'error');
            break;
          }
        }
      }
      toast(isEdit ? 'Saved' : 'Added to collection', 'success');
      location.hash = `#/collection/${saved.id}`;
    } catch (err) { toast(err.message, 'error'); }
  };
}
