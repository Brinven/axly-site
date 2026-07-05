// Tyche — Settings: lineup structure, scoring rules (presets + per-stat),
// data syncs, integrations, unresolved cross-IDs. Season rollover joins in P7.
import { get, post, put } from '../api.js';
import { esc, toast, openModal, closeModal } from '../ui.js';

export async function render(main) {
  main.innerHTML = '<div class="loading">Loading…</div>';
  const [s, lineup, scoring, sync] = await Promise.all([
    get('/api/settings'),
    get('/api/lineup-settings'),
    get('/api/scoring-rules'),
    get('/api/sync/status')
  ]);

  main.innerHTML = `
    <div class="page-head"><h1>Settings</h1></div>
    <section class="card" id="lineup-card">
      <div class="card-head"><h2>Lineup structure</h2>
        <button class="secondary btn-sm" id="edit-lineup">Edit</button></div>
      <p class="muted">Shared by My Team and every opponent roster.</p>
      <div>${lineup.map((l) => `<span class="slot-pill">${esc(l.position)} × ${l.slot_count}</span>`).join(' ')}</div>
    </section>

    <section class="card" id="scoring-card">
      <div class="card-head"><h2>Scoring rules</h2><span class="muted">${scoring.season} · ${esc(scoring.preset)}</span></div>
      <div class="preset-btns">
        ${['standard', 'half_ppr', 'full_ppr'].map((p) =>
          `<button class="${scoring.preset === p ? '' : 'secondary'} btn-sm" data-preset="${p}">${p.replace('_', ' ')}</button>`).join('')}
        <button class="secondary btn-sm" id="edit-scoring">Edit values…</button>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>Data sync</h2></div>
      ${sync.length
        ? `<table class="table"><tbody>${sync.map((r) => `
            <tr><td>${esc(r.source)}</td>
                <td class="sync-${esc(r.status)}">${esc(r.status)}${r.running ? ' (running…)' : ''}</td>
                <td class="muted">${esc((r.ran_at || '').slice(0, 16))}</td>
                <td><button class="secondary btn-sm" data-sync="${esc(r.source)}">Run</button></td></tr>`).join('')}
          </tbody></table>`
        : '<p class="muted">No syncs recorded yet — they start automatically.</p>'}
    </section>

    <section class="card" id="season-card">
      <div class="card-head"><h2>Season</h2>
        <button class="secondary btn-sm" id="rollover-btn">Roll over…</button></div>
      <p class="muted">Active season: <strong>${esc(String(scoring.season))}</strong>.
      Rolling over archives it (read-only, still in History) and starts fresh.</p>
    </section>

    <section class="card">
      <h2>Integrations</h2>
      <p>The Odds API key: ${s.odds_api_key_present === '1'
        ? '<span class="ok">configured ✓</span>'
        : '<span class="warn">not set</span> <span class="muted">(add ODDS_API_KEY to .env, then restart — Vegas signal falls back to nflverse lines)</span>'}</p>
      ${s.odds_quota_remaining !== undefined && s.odds_quota_remaining !== null
        ? `<p class="muted">Odds API quota: ${esc(String(s.odds_quota_remaining))} of 500 monthly credits left.
           Props pause automatically below 80 to protect game-line syncs.</p>` : ''}
    </section>

    <section class="card" id="ids-card">
      <div class="card-head"><h2>Player ID health</h2></div>
      <div id="ids-body"><p class="muted">Checking…</p></div>
    </section>`;

  // Lineup editor
  main.querySelector('#edit-lineup').onclick = () => lineupEditor(lineup, () => render(main));

  // Season rollover
  main.querySelector('#rollover-btn').onclick = () => {
    const nextYear = scoring.season + 1;
    const m = openModal(`
      <h2>Roll over to a new season</h2>
      <p class="muted">${scoring.season} becomes read-only (history stays browsable).
      This is one-way — no undo button.</p>
      <label>New season year</label><input id="ro-year" type="number" value="${nextYear}">
      <label><input type="checkbox" id="ro-rosters" checked style="width:auto"> Copy rosters forward</label>
      <label><input type="checkbox" id="ro-scoring" checked style="width:auto"> Copy scoring rules forward</label>
      <div class="move-btns"><button class="danger" id="ro-go">Archive ${scoring.season} & start new season</button></div>`);
    m.panel.querySelector('#ro-go').onclick = async () => {
      try {
        const out = await post('/api/seasons/rollover', {
          new_year: Number(m.panel.querySelector('#ro-year').value),
          copy_rosters: m.panel.querySelector('#ro-rosters').checked,
          copy_scoring: m.panel.querySelector('#ro-scoring').checked
        });
        toast(`Season ${out.new_season} started`, 'success');
        closeModal();
        render(main);
      } catch (e) { toast(e.message, 'error'); }
    };
  };

  // Scoring preset buttons + editor
  main.querySelectorAll('button[data-preset]').forEach((b) => {
    b.onclick = async () => {
      try {
        await post('/api/scoring-rules/preset', { name: b.dataset.preset });
        toast(`Applied ${b.dataset.preset.replace('_', ' ')}`, 'success');
        render(main);
      } catch (e) { toast(e.message, 'error'); }
    };
  });
  main.querySelector('#edit-scoring').onclick = () => scoringEditor(scoring, () => render(main));

  // Manual syncs
  main.querySelectorAll('button[data-sync]').forEach((b) => {
    b.onclick = async () => {
      b.disabled = true;
      try { await post(`/api/sync/${b.dataset.sync}`); toast(`${b.dataset.sync} sync started`); }
      catch (e) { toast(e.message, 'error'); b.disabled = false; }
    };
  });

  // Unresolved IDs panel (async — can be slow right after first sync)
  loadIdHealth(main).catch(() => {
    const el = main.querySelector('#ids-body');
    if (el) el.innerHTML = '<p class="muted">Could not load ID health.</p>';
  });
}

async function loadIdHealth(main) {
  const data = await get('/api/players/unresolved');
  const el = main.querySelector('#ids-body');
  if (!el) return;
  const cov = data.coverage;
  const head = `<p class="muted">Top-300 coverage: gsis ${cov.gsis_pct_vets ?? cov.gsis_pct}% of veterans,
    espn ${cov.espn_pct}% (${cov.rookies ?? 0} rookies get GSIS ids near season start).</p>`;
  if (!data.players.length) { el.innerHTML = head + '<p class="ok">No unresolved rostered/top-500 players ✓</p>'; return; }
  el.innerHTML = head + data.players.slice(0, 30).map((p) => `
    <div class="slot-row" data-fix="${esc(p.id)}" data-name="${esc(p.name)}">
      <span class="slot-tag">${esc(p.position)}</span>
      <span class="pl-name">${esc(p.name)}</span>
      <span class="pl-meta">${esc(p.nfl_team || 'FA')} · missing ${!p.gsis_id ? 'gsis' : ''}${!p.gsis_id && !p.espn_id ? ' + ' : ''}${!p.espn_id ? 'espn' : ''}</span>
    </div>`).join('');
  el.querySelectorAll('[data-fix]').forEach((row) => {
    row.onclick = () => {
      const m = openModal(`
        <h2>Fix IDs — ${esc(row.dataset.name)}</h2>
        <p class="muted">Manual overrides always win and survive re-syncs. Leave a field blank to keep it.</p>
        <label>GSIS id (e.g. 00-0026158)</label><input id="fix-gsis" autocomplete="off">
        <label>ESPN id (numeric)</label><input id="fix-espn" autocomplete="off">
        <div class="move-btns"><button id="fix-save">Save override</button></div>`);
      m.panel.querySelector('#fix-save').onclick = async () => {
        const gsis = m.panel.querySelector('#fix-gsis').value.trim();
        const espn = m.panel.querySelector('#fix-espn').value.trim();
        if (!gsis && !espn) return;
        try {
          await post(`/api/players/${row.dataset.fix}/ids`, { gsis_id: gsis || null, espn_id: espn || null });
          toast('Override saved', 'success');
          closeModal();
          loadIdHealth(main);
        } catch (e) { toast(e.message, 'error'); }
      };
    };
  });
}

function lineupEditor(lineup, onDone) {
  const ALLOWED = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DEF', 'K'];
  let rows = lineup.map((l) => ({ ...l }));
  const m = openModal('<h2>Lineup structure</h2><div id="lineup-rows"></div>' +
    '<div class="move-btns"><button class="secondary" id="lu-add">+ Add position</button>' +
    '<button id="lu-save">Save</button></div>' +
    '<p class="muted">Players in removed or shrunk slots are moved to the bench automatically.</p>');

  function draw() {
    m.panel.querySelector('#lineup-rows').innerHTML = rows.map((r, i) => `
      <div class="form-row lu-row">
        <select data-i="${i}" data-f="position">
          ${ALLOWED.map((p) => `<option ${p === r.position ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
        <input data-i="${i}" data-f="slot_count" type="number" min="1" max="6" value="${r.slot_count}">
        <button class="danger btn-sm" data-rm="${i}">✕</button>
      </div>`).join('');
    m.panel.querySelectorAll('[data-f]').forEach((el) => {
      el.onchange = () => { rows[Number(el.dataset.i)][el.dataset.f] = el.dataset.f === 'slot_count' ? Number(el.value) : el.value; };
    });
    m.panel.querySelectorAll('[data-rm]').forEach((el) => {
      el.onclick = () => { rows.splice(Number(el.dataset.rm), 1); draw(); };
    });
  }
  draw();

  m.panel.querySelector('#lu-add').onclick = () => {
    const unused = ALLOWED.find((p) => !rows.some((r) => r.position === p));
    rows.push({ position: unused || 'RB', slot_count: 1 });
    draw();
  };
  m.panel.querySelector('#lu-save').onclick = async () => {
    try {
      const out = await put('/api/lineup-settings', { slots: rows });
      if (out.auto_benched.length) toast(`Saved — ${out.auto_benched.length} player(s) auto-benched`);
      else toast('Lineup saved', 'success');
      closeModal();
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };
}

function scoringEditor(scoring, onDone) {
  const groups = {};
  for (const sk of scoring.stat_keys) (groups[sk.group] = groups[sk.group] || []).push(sk);
  const m = openModal(`<h2>Scoring values</h2>
    <div class="scoring-grid">
      ${Object.entries(groups).map(([g, keys]) => `
        <h3 class="scoring-group">${esc(g)}</h3>
        ${keys.map((k) => `
          <label class="scoring-row">${esc(k.label)}
            <input type="number" step="0.01" data-key="${k.key}" value="${scoring.rules[k.key] ?? 0}">
          </label>`).join('')}`).join('')}
    </div>
    <div class="move-btns"><button id="sc-save">Save</button></div>`);
  m.panel.querySelector('#sc-save').onclick = async () => {
    const rules = {};
    m.panel.querySelectorAll('input[data-key]').forEach((el) => { rules[el.dataset.key] = Number(el.value); });
    try {
      await put('/api/scoring-rules', { rules });
      toast('Scoring saved (recommendations will recompute)', 'success');
      closeModal();
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };
}
