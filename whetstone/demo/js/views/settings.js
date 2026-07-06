// Whetstone — Settings: collection basics (M2) + Custom Field Manager (M3).
// M4 adds the Tailscale wizard.
// Custom fields are NEVER deleted — archive/restore only (Gotcha #4). The
// server has no delete endpoint; this UI must never pretend otherwise.
import {
  fetchSettings, saveSettings, fetchCategories,
  fetchCustomFields, createCustomField, updateCustomField,
  fetchTailscaleStatus, isDemo
} from '../dataAdapter.js';
import { esc, toast, setCurrency, openModal, closeModal } from '../ui.js';
import { remoteBox } from '../qr.js';
import { icon } from '../icons.js';
import { setCollectionName } from '../app.js';

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK'];
const FIELD_TYPES = [
  ['text', 'Text'], ['number', 'Number'], ['date', 'Date'],
  ['dropdown', 'Dropdown'], ['boolean', 'Yes / No'], ['currency', 'Currency']
];

let showArchived = false;

export async function render(root) {
  root.innerHTML = '<h1>Settings</h1><p class="muted">Loading…</p>';
  let s;
  try {
    s = await fetchSettings();
  } catch (e) {
    root.innerHTML = `<h1>Settings</h1><div class="error">${esc(e.message)}</div>`;
    return;
  }

  const cur = s.currency || 'USD';
  const curOpts = (CURRENCIES.includes(cur) ? CURRENCIES : [cur, ...CURRENCIES])
    .map((c) => `<option ${c === cur ? 'selected' : ''}>${c}</option>`).join('');

  root.innerHTML = `
    <h1>Settings</h1>
    <form class="form" id="settings-form">
      <fieldset>
        <legend>Collection</legend>
        <div class="form-row">
          <label>Collection name
            <input name="collection_name" value="${esc(s.collection_name || '')}" placeholder="My Collection">
          </label>
          <label>Currency
            <select name="currency">${curOpts}</select>
          </label>
        </div>
        <div class="form-actions">
          <button class="btn primary" type="submit">Save</button>
        </div>
      </fieldset>
    </form>

    <h2 class="section-title">Custom fields</h2>
    <p class="muted">Add your own spec fields per category — they show up on item forms and detail pages.
       Fields are archived, never deleted: values already entered stay safe and come back if you restore the field.</p>
    <div id="cf-manager"><p class="muted">Loading…</p></div>

    <h2 class="section-title">Phone access</h2>
    ${isDemo() ? '' : `<div class="quick-add"><a class="btn" href="#/connect">${icon('qr')} Connect your phone — QR codes</a></div>`}
    <div id="ts-panel"><p class="muted">Checking remote access…</p></div>
  `;

  renderTsSettings(root.querySelector('#ts-panel'), s);

  if (isDemo()) {
    // Read-only demo: neutralize the form (a native submit would reload the page).
    root.querySelectorAll('#settings-form input, #settings-form select, #settings-form button')
      .forEach((el) => { el.disabled = true; });
  }

  if (!isDemo()) {
    root.querySelector('#settings-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {};
      for (const [k, v] of fd.entries()) body[k] = v;
      try {
        const saved = await saveSettings(body);
        setCurrency(saved.currency);
        const cn = (saved.collection_name && saved.collection_name.trim()) ? saved.collection_name.trim() : 'Whetstone';
        setCollectionName(cn);
        const el = document.getElementById('collection-name');
        if (el) el.textContent = cn === 'Whetstone' ? '' : 'Whetstone';
        document.title = cn === 'Whetstone' ? 'Whetstone' : `${cn} · Whetstone`;
        toast('Settings saved', 'success');
      } catch (err) { toast(err.message, 'error'); }
    };
  }

  renderFieldManager(root.querySelector('#cf-manager'));
}

// ------------------------------------------------------- remote access (M4)

async function renderTsSettings(panel, settings) {
  if (isDemo()) { panel.innerHTML = ''; return; }
  const enabled = settings.tailscale_enabled === '1';
  let st = null;
  try { st = await fetchTailscaleStatus(); } catch (e) { /* shown below */ }

  const online = st && st.state === 'online';
  const statusLine = !enabled
    ? '<span class="badge">Off</span> Remote access is not set up.'
    : online
      ? `<span class="badge active">Connected</span> Reachable from your devices at <code>${esc(st.ip)}</code>.`
      : `<span class="badge low">Not connected</span> Tailscale is ${st ? esc(st.state.replace('_', ' ')) : 'unreachable'} — re-run setup below.`;

  panel.innerHTML = `
    <h3 class="section-title">Remote access (Tailscale)</h3>
    <p>${statusLine}</p>
    ${enabled && online ? remoteBox({ ip: st.ip, url: st.url }) : ''}
    <div class="form-actions">
      <a class="btn ${enabled ? '' : 'primary'}" href="#/welcome">${enabled ? 'Re-run setup wizard' : 'Set up remote access'}</a>
      ${enabled ? '<button class="btn" id="ts-disable">Turn off remote QR</button>' : ''}
    </div>
    ${enabled ? '<p class="muted">Turning this off only hides the remote QR here — it does not uninstall Tailscale or sign you out.</p>' : ''}
  `;

  const dis = panel.querySelector('#ts-disable');
  if (dis) dis.onclick = async () => {
    try {
      await saveSettings({ tailscale_enabled: '0' });
      toast('Remote QR turned off', 'success');
      renderTsSettings(panel, { ...settings, tailscale_enabled: '0' });
    } catch (e) { toast(e.message, 'error'); }
  };
}

// ---------------------------------------------------------------- manager

async function renderFieldManager(box) {
  let fields, cats;
  try {
    [fields, cats] = await Promise.all([
      fetchCustomFields({ includeArchived: showArchived }),
      fetchCategories()
    ]);
  } catch (e) {
    box.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }

  const typeLabel = Object.fromEntries(FIELD_TYPES);
  const rows = fields.map((f) => `
    <li class="rem ${f.is_archived ? 'is-acked' : ''}">
      <div class="rem-main">
        <div class="rem-top">
          <span class="rem-title">${esc(f.field_name)}</span>
          <span class="badge">${typeLabel[f.field_type] || esc(f.field_type)}</span>
          ${f.is_archived ? '<span class="badge sold">Archived</span>' : ''}
        </div>
        <div class="rem-sub">
          <span>${f.category_id ? esc(f.category_name) : 'All categories'}</span>
          ${f.field_type === 'dropdown' ? `<span class="muted">${esc(JSON.parse(f.dropdown_options || '[]').join(' · '))}</span>` : ''}
          ${f.value_count ? `<span class="muted">${f.value_count} value${f.value_count === 1 ? '' : 's'}</span>` : ''}
        </div>
      </div>
      <div class="rem-actions">
        ${isDemo() ? '' : `
          <button class="btn small" data-move="up" data-id="${f.id}" aria-label="Move up">↑</button>
          <button class="btn small" data-move="down" data-id="${f.id}" aria-label="Move down">↓</button>
          <button class="btn small" data-edit="${f.id}">Edit</button>
          ${f.is_archived
            ? `<button class="btn small" data-restore="${f.id}">Restore</button>`
            : `<button class="btn small danger" data-archive="${f.id}">Archive</button>`}`}
      </div>
    </li>`).join('');

  box.innerHTML = `
    <div class="tab-head between">
      ${isDemo() ? '<span></span>' : `<button class="btn primary" id="cf-add">${icon('plus')} Add field</button>`}
      <label class="checkbox inline"><input type="checkbox" id="cf-archived" ${showArchived ? 'checked' : ''}> Show archived</label>
    </div>
    ${fields.length ? `<ul class="rem-list">${rows}</ul>`
      : '<div class="empty">No custom fields yet — add one to track specs Whetstone doesn’t ship with.</div>'}
  `;

  box.querySelector('#cf-archived').onchange = (e) => {
    showArchived = e.target.checked;
    renderFieldManager(box);
  };

  if (isDemo()) return;

  const addBtn = box.querySelector('#cf-add');
  if (addBtn) addBtn.onclick = () => fieldModal(null, cats, () => renderFieldManager(box));

  box.querySelectorAll('[data-edit]').forEach((b) => {
    b.onclick = () => fieldModal(fields.find((f) => String(f.id) === b.dataset.edit), cats, () => renderFieldManager(box));
  });

  box.querySelectorAll('[data-archive]').forEach((b) => {
    b.onclick = () => {
      const f = fields.find((x) => String(x.id) === b.dataset.archive);
      const m = openModal(`
        <h2>Archive “${esc(f.field_name)}”?</h2>
        <p>The field disappears from item forms, but ${f.value_count ? `the <strong>${f.value_count}</strong> value${f.value_count === 1 ? '' : 's'} already entered stay` : 'any values already entered stay'} stored and visible on item pages. You can restore it any time — nothing is deleted.</p>
        <div class="form-actions">
          <button class="btn danger" id="cf-arch-yes">Archive field</button>
          <button class="btn" id="cf-arch-no">Cancel</button>
        </div>`);
      m.panel.querySelector('#cf-arch-no').onclick = closeModal;
      m.panel.querySelector('#cf-arch-yes').onclick = async () => {
        try {
          await updateCustomField(f.id, { is_archived: 1 });
          closeModal(); toast('Field archived — values preserved', 'success');
          renderFieldManager(box);
        } catch (e) { toast(e.message, 'error'); }
      };
    };
  });

  box.querySelectorAll('[data-restore]').forEach((b) => {
    b.onclick = async () => {
      try {
        await updateCustomField(b.dataset.restore, { is_archived: 0 });
        toast('Field restored', 'success');
        renderFieldManager(box);
      } catch (e) { toast(e.message, 'error'); }
    };
  });

  // Reorder: swap sort_order with the neighbor in the same category scope.
  box.querySelectorAll('[data-move]').forEach((b) => {
    b.onclick = async () => {
      const f = fields.find((x) => String(x.id) === b.dataset.id);
      const scope = fields.filter((x) => String(x.category_id || '') === String(f.category_id || '') && x.is_archived === f.is_archived);
      const idx = scope.findIndex((x) => x.id === f.id);
      const other = b.dataset.move === 'up' ? scope[idx - 1] : scope[idx + 1];
      if (!other) return;
      try {
        await updateCustomField(f.id, { sort_order: other.sort_order });
        await updateCustomField(other.id, { sort_order: f.sort_order });
        renderFieldManager(box);
      } catch (e) { toast(e.message, 'error'); }
    };
  });
}

function fieldModal(existing, cats, onDone) {
  const isEdit = !!existing;
  const catOpts = ['<option value="">All categories</option>']
    .concat(cats.map((c) => `<option value="${c.id}" ${existing && existing.category_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`))
    .join('');
  const typeOpts = FIELD_TYPES
    .map(([v, l]) => `<option value="${v}" ${existing && existing.field_type === v ? 'selected' : ''}>${l}</option>`)
    .join('');
  const optsVal = existing && existing.dropdown_options ? JSON.parse(existing.dropdown_options).join('\n') : '';

  const m = openModal(`
    <h2>${isEdit ? 'Edit field' : 'New custom field'}</h2>
    <form class="form" id="cf-form">
      <label>Field name <span class="req">*</span>
        <input name="field_name" required value="${esc(existing ? existing.field_name : '')}" placeholder="e.g. Sheath material, Tang stamp">
      </label>
      <div class="form-row">
        <label>Type <select name="field_type">${typeOpts}</select></label>
        <label>Applies to <select name="category_id">${catOpts}</select></label>
      </div>
      <label id="cf-opts-wrap" ${(existing && existing.field_type === 'dropdown') ? '' : 'hidden'}>Dropdown options (one per line)
        <textarea name="options" rows="4" placeholder="Leather&#10;Kydex&#10;Nylon">${esc(optsVal)}</textarea>
      </label>
      ${isEdit && existing.value_count ? `<p class="muted">Note: ${existing.value_count} item${existing.value_count === 1 ? ' has' : 's have'} a value in this field — renaming is safe; changing the type may make old values read oddly, but nothing is deleted.</p>` : ''}
      <div class="form-actions">
        <button class="btn primary" type="submit">${isEdit ? 'Save' : 'Add field'}</button>
        <button class="btn" type="button" id="cf-cancel">Cancel</button>
      </div>
    </form>`);

  const form = m.panel.querySelector('#cf-form');
  form.querySelector('[name="field_type"]').onchange = (e) => {
    form.querySelector('#cf-opts-wrap').hidden = e.target.value !== 'dropdown';
  };
  m.panel.querySelector('#cf-cancel').onclick = closeModal;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {
      field_name: fd.get('field_name'),
      field_type: fd.get('field_type'),
      category_id: fd.get('category_id') || null
    };
    if (body.field_type === 'dropdown') {
      body.dropdown_options = String(fd.get('options') || '').split('\n').map((s) => s.trim()).filter(Boolean);
    }
    try {
      if (isEdit) await updateCustomField(existing.id, body);
      else await createCustomField(body);
      closeModal();
      toast(isEdit ? 'Field saved' : 'Field added', 'success');
      onDone();
    } catch (err) { toast(err.message, 'error'); }
  };
}
