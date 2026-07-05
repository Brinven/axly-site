// Tyche — Start/Sit view (PRD §4.3 hybrid display): banded list of my
// starters + bench with confidence scores; tap for the factor breakdown.
import { get, post } from '../api.js';
import { esc, bandChip, openModal, toast } from '../ui.js';

const FACTOR_LABELS = {
  props: 'Props (market projection)',
  matchup: 'Matchup (def vs pos)',
  vegas: 'Vegas (implied total)',
  form: 'Recent form',
  health: 'Injury / practice'
};

const PROP_NAMES = {
  rec: 'rec', rec_yd: 'rec yds', rush_yd: 'rush yds',
  pass_yd: 'pass yds', pass_td: 'pass TD'
};

export async function render(main) {
  main.innerHTML = '<div class="loading">Loading…</div>';
  const [recsData, roster] = await Promise.all([
    get('/api/recommendations'),
    get('/api/roster?side=me')
  ]);
  const byId = new Map(recsData.recs.map((r) => [r.player_id, r]));
  const all = [...roster.starters, ...roster.bench];

  if (!all.length) {
    main.innerHTML = `<div class="page-head"><h1>Start / Sit</h1></div>
      <section class="card"><p class="muted">Add players to <a href="#/team">My Team</a> first —
      recommendations compute for everyone rostered.</p></section>`;
    return;
  }

  const row = (p) => {
    const rec = byId.get(p.player_id);
    return `<div class="slot-row rec-row" data-player="${esc(p.player_id)}">
      <span class="slot-tag ${p.position_slot === 'BENCH' ? 'slot-tag-bench' : ''}">${esc(p.position_slot === 'BENCH' ? 'BN' : p.position_slot)}</span>
      <span class="pl-name">${esc(p.name)}</span>
      <span class="rec-chips">${bandChip(rec)}</span>
    </div>`;
  };

  const sorted = [...all].sort((a, b) => (byId.get(b.player_id)?.score ?? -1) - (byId.get(a.player_id)?.score ?? -1));

  main.innerHTML = `
    <div class="page-head"><h1>Start / Sit</h1>
      <span class="muted">Week ${recsData.week} · ${recsData.season}</span>
      <button class="secondary btn-sm" id="refresh-recs">↻ Recompute</button>
    </div>
    <section class="card">${sorted.map(row).join('')}</section>
    <p class="muted" style="font-size:12px">Scores are 0–100 confidence. Thin-data weeks pull
    scores toward toss-up rather than faking certainty — the factor detail says why.</p>`;

  main.querySelector('#refresh-recs').onclick = async () => {
    try {
      await post('/api/recommendations/refresh', {});
      toast('Recomputed', 'success');
      render(main);
    } catch (e) { toast(e.message, 'error'); }
  };

  main.querySelectorAll('.rec-row').forEach((el) => {
    el.onclick = () => {
      const rec = byId.get(el.dataset.player);
      const p = all.find((x) => x.player_id === el.dataset.player);
      if (!rec || !p) return;
      detailModal(p, rec);
    };
  });
}

function factorBar(name, f) {
  if (!f) return '';
  const pct = Math.round((f.value ?? 0) * 100);
  let detail = '';
  if (name === 'props') {
    const parts = Object.entries(f.markets || {})
      .filter(([k]) => k !== 'anytime_td')
      .map(([k, v]) => `${v} ${PROP_NAMES[k] || k}`);
    if (f.td_prob != null) parts.push(`TD ${Math.round(f.td_prob * 100)}%`);
    detail = `books: ${parts.join(', ')} → ~${f.projection} pts`;
  }
  if (name === 'matchup') detail = `vs ${esc(f.opp)} — ranked #${f.rank}/32 vs position`;
  if (name === 'vegas') detail = `implied ${f.implied} pts (total ${f.total}, ${esc(f.source)})`;
  if (name === 'form') detail = `${f.weighted_pts} weighted pts — last games: ${f.recent.join(', ')}`;
  if (name === 'health') detail = f.status ? `${esc(f.status)}${f.practice ? ` (practice: ${esc(f.practice)})` : ''}` : 'healthy';
  return `<div class="factor">
    <div class="factor-head"><span>${FACTOR_LABELS[name]}</span><span class="muted">${pct}</span></div>
    <div class="factor-track"><div class="factor-fill" style="width:${pct}%"></div></div>
    <div class="factor-detail muted">${detail}</div>
  </div>`;
}

function detailModal(p, rec) {
  const f = rec.factors;
  const gates = (f.gates || []).map((g) => `<span class="band band-sit">${esc(g)}</span>`).join(' ');
  const missing = (f.missing || []).length
    ? `<p class="muted">No data for: ${f.missing.map(esc).join(', ')} — remaining factors reweighted.</p>` : '';
  const thin = rec.data_sufficiency != null && rec.data_sufficiency < 0.6
    ? '<p class="warn">Thin data week — score pulled toward toss-up.</p>' : '';
  openModal(`
    <h2>${esc(p.name)}</h2>
    <p class="muted">${esc(p.position)} · ${esc(p.nfl_team || 'FA')}</p>
    <div style="margin:10px 0">${bandChip(rec)} ${gates}</div>
    ${thin}${missing}
    ${['props', 'matchup', 'vegas', 'form', 'health'].map((n) => factorBar(n, f[n])).join('')}
    <p class="muted" style="font-size:12px;margin-top:10px">raw ${f.raw} → final ${f.final}
      (data sufficiency ${Math.round((f.sufficiency ?? 1) * 100)}%)</p>`);
}
