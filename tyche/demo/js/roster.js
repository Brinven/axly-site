// Tyche — shared roster component. One implementation for My Team and every
// opponent (side = 'me' | opponent id) because both validate against the same
// lineup structure (PRD §4.1).
import { get, post, put, del } from './api.js';
import { esc, openModal, closeModal, toast } from './ui.js';

const FLEX_ELIGIBLE = ['RB', 'WR', 'TE'];

function eligibleSlots(lineup, position) {
  const out = [];
  for (const s of lineup) {
    if (s.position === position || (s.position === 'FLEX' && FLEX_ELIGIBLE.includes(position))) {
      out.push(s.position);
    }
  }
  out.push('BENCH');
  return out;
}

function playerLine(r) {
  const inj = r.injury_status
    ? ` <span class="inj inj-${esc(String(r.injury_status).toLowerCase())}">${esc(r.injury_status)}</span>` : '';
  return `<span class="pl-name">${esc(r.name)}</span>
    <span class="pl-meta">${esc(r.position)} · ${esc(r.nfl_team || 'FA')}${inj}</span>`;
}

export async function renderRoster(container, side) {
  const data = await get(`/api/roster?side=${side}`);
  const { lineup, starters, bench } = data;

  // Build slot rows in lineup order: filled or empty per (position, index).
  const filled = new Map(starters.map((r) => [`${r.position_slot}#${r.slot_index}`, r]));
  let slotRows = '';
  for (const slot of lineup) {
    for (let i = 1; i <= slot.slot_count; i++) {
      const r = filled.get(`${slot.position}#${i}`);
      slotRows += r
        ? `<div class="slot-row" data-player="${esc(r.player_id)}">
             <span class="slot-tag">${esc(slot.position)}</span>${playerLine(r)}</div>`
        : `<div class="slot-row slot-empty" data-addpos="${esc(slot.position)}">
             <span class="slot-tag">${esc(slot.position)}</span>
             <span class="muted">empty — tap to fill</span></div>`;
    }
  }

  const benchRows = bench.map((r) =>
    `<div class="slot-row" data-player="${esc(r.player_id)}">
       <span class="slot-tag slot-tag-bench">BN</span>${playerLine(r)}</div>`
  ).join('');

  container.innerHTML = `
    <section class="card">
      <div class="card-head"><h2>Starters</h2></div>
      ${slotRows || '<p class="muted">No lineup slots configured.</p>'}
    </section>
    <section class="card">
      <div class="card-head"><h2>Bench</h2>
        <button class="secondary btn-sm" id="add-player">+ Add player</button></div>
      ${benchRows || '<p class="muted">Bench is empty.</p>'}
    </section>`;

  container.querySelector('#add-player').onclick = () => addOverlay(container, side, '');
  container.querySelectorAll('.slot-empty').forEach((el) => {
    el.onclick = () => {
      const pos = el.dataset.addpos;
      addOverlay(container, side, pos === 'FLEX' ? 'RB' : pos, pos);
    };
  });
  container.querySelectorAll('.slot-row[data-player]').forEach((el) => {
    el.onclick = () => moveOverlay(container, side, data, el.dataset.player);
  });
}

function addOverlay(container, side, positionFilter, targetSlot) {
  const posOptions = ['', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF']
    .map((p) => `<option value="${p}" ${p === positionFilter ? 'selected' : ''}>${p || 'Any position'}</option>`)
    .join('');
  const m = openModal(`
    <h2>Add player${targetSlot ? ` → ${esc(targetSlot)}` : ''}</h2>
    <div class="form-row">
      <input id="ps-q" type="search" placeholder="Search name…" autocomplete="off">
      <select id="ps-pos">${posOptions}</select>
    </div>
    <div id="ps-results" class="search-results"><p class="muted">Type a name or pick a position.</p></div>`);

  const qEl = m.panel.querySelector('#ps-q');
  const posEl = m.panel.querySelector('#ps-pos');
  const resEl = m.panel.querySelector('#ps-results');
  let seq = 0;

  async function search() {
    const mySeq = ++seq;
    const q = qEl.value.trim();
    const pos = posEl.value;
    if (!q && !pos) { resEl.innerHTML = '<p class="muted">Type a name or pick a position.</p>'; return; }
    const rows = await get(`/api/players/search?q=${encodeURIComponent(q)}&position=${pos}`);
    if (mySeq !== seq) return; // stale response
    resEl.innerHTML = rows.length
      ? rows.map((r) => `<div class="search-hit" data-id="${esc(r.id)}">${playerLine(r)}</div>`).join('')
      : '<p class="muted">No matches.</p>';
    resEl.querySelectorAll('.search-hit').forEach((el) => {
      el.onclick = async () => {
        try {
          await post(`/api/roster?side=${side}`, {
            player_id: el.dataset.id,
            position_slot: targetSlot || 'BENCH'
          });
          toast('Added', 'success');
          closeModal();
          renderRoster(container, side);
        } catch (e) { toast(e.message, 'error'); }
      };
    });
  }

  qEl.oninput = search;
  posEl.onchange = search;
  qEl.focus();
  if (positionFilter) search();
}

function moveOverlay(container, side, data, playerId) {
  const all = [...data.starters, ...data.bench];
  const player = all.find((r) => r.player_id === playerId);
  if (!player) return;
  const slots = eligibleSlots(data.lineup, player.position)
    .filter((s) => s !== player.position_slot);

  const m = openModal(`
    <h2>${esc(player.name)}</h2>
    <p class="muted">${esc(player.position)} · ${esc(player.nfl_team || 'FA')} — currently ${esc(player.position_slot)}</p>
    <div class="move-btns">
      ${slots.map((s) => `<button class="secondary" data-slot="${s}">Move to ${s === 'BENCH' ? 'bench' : s}</button>`).join('')}
      <button class="danger" data-remove="1">Remove from roster</button>
    </div>`);

  m.panel.querySelectorAll('button[data-slot]').forEach((b) => {
    b.onclick = async () => {
      try {
        await put(`/api/roster/${playerId}?side=${side}`, { position_slot: b.dataset.slot });
        closeModal();
        renderRoster(container, side);
      } catch (e) { toast(e.message, 'error'); }
    };
  });
  m.panel.querySelector('button[data-remove]').onclick = async () => {
    try {
      await del(`/api/roster/${playerId}?side=${side}`);
      toast('Removed');
      closeModal();
      renderRoster(container, side);
    } catch (e) { toast(e.message, 'error'); }
  };
}
