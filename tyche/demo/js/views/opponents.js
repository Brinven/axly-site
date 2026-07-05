// Tyche — saved league-mates. List at #/opponents, roster detail at
// #/opponents/<id> (same shared roster component as My Team).
import { get, post, put, del } from '../api.js';
import { esc, openModal, closeModal, toast } from '../ui.js';
import { renderRoster } from '../roster.js';

export async function render(main, params) {
  if (params && params[0]) return renderDetail(main, Number(params[0]));
  return renderList(main);
}

async function renderList(main) {
  main.innerHTML = '<div class="loading">Loading…</div>';
  const opps = await get('/api/opponents');
  main.innerHTML = `
    <div class="page-head"><h1>Opponents</h1>
      <button id="add-opp" class="btn-sm">+ Add</button></div>
    ${opps.length
      ? opps.map((o) => `
        <div class="card opp-card">
          <a class="opp-link" href="#/opponents/${o.id}">
            <strong>${esc(o.name)}</strong>
            <span class="muted">${o.roster_count} player${o.roster_count === 1 ? '' : 's'} rostered</span>
          </a>
          <span class="opp-actions">
            <button class="secondary btn-sm" data-rename="${o.id}" data-name="${esc(o.name)}">Rename</button>
            <button class="danger btn-sm" data-del="${o.id}" data-name="${esc(o.name)}">Delete</button>
          </span>
        </div>`).join('')
      : '<section class="card"><p class="muted">No opponents saved yet. Add your league-mates once — pick who you\'re facing each week on the Matchups screen.</p></section>'}`;

  main.querySelector('#add-opp').onclick = () => nameModal('Add opponent', '', async (name) => {
    await post('/api/opponents', { name });
    renderList(main);
  });
  main.querySelectorAll('button[data-rename]').forEach((b) => {
    b.onclick = () => nameModal('Rename opponent', b.dataset.name, async (name) => {
      await put(`/api/opponents/${b.dataset.rename}`, { name });
      renderList(main);
    });
  });
  main.querySelectorAll('button[data-del]').forEach((b) => {
    b.onclick = () => {
      const m = openModal(`
        <h2>Delete ${esc(b.dataset.name)}?</h2>
        <p class="muted">Their roster and weekly matchup assignments go too. Past score history is kept.</p>
        <div class="move-btns">
          <button class="danger" id="confirm-del">Delete</button>
          <button class="secondary" id="cancel-del">Cancel</button>
        </div>`);
      m.panel.querySelector('#confirm-del').onclick = async () => {
        try { await del(`/api/opponents/${b.dataset.del}`); closeModal(); renderList(main); }
        catch (e) { toast(e.message, 'error'); }
      };
      m.panel.querySelector('#cancel-del').onclick = closeModal;
    };
  });
}

function nameModal(title, initial, onSave) {
  const m = openModal(`
    <h2>${esc(title)}</h2>
    <label>Name</label><input id="opp-name" value="${esc(initial)}" autocomplete="off">
    <div class="move-btns"><button id="save-opp">Save</button></div>`);
  const input = m.panel.querySelector('#opp-name');
  const save = async () => {
    const name = input.value.trim();
    if (!name) return;
    try { await onSave(name); closeModal(); } catch (e) { toast(e.message, 'error'); }
  };
  m.panel.querySelector('#save-opp').onclick = save;
  input.onkeydown = (e) => { if (e.key === 'Enter') save(); };
  input.focus();
}

async function renderDetail(main, id) {
  main.innerHTML = '<div class="loading">Loading…</div>';
  const opps = await get('/api/opponents');
  const opp = opps.find((o) => o.id === id);
  if (!opp) { main.innerHTML = '<div class="error">Opponent not found.</div>'; return; }
  main.innerHTML = `
    <div class="page-head">
      <a class="back-link" href="#/opponents">←</a>
      <h1>${esc(opp.name)}</h1>
      <span class="muted">opponent roster</span>
    </div>
    <div id="roster-box"><div class="loading">Loading…</div></div>`;
  await renderRoster(main.querySelector('#roster-box'), String(id));
}
