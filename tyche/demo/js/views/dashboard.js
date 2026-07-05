// Tyche — Dashboard: the phone home screen. Week header, my starters with
// band chips (+ live points once games run), opponent comparison, connect QR.
import { get } from '../api.js';
import { esc, bandChip } from '../ui.js';
import { connectBox } from '../qr.js';

function lineupCard(title, block, total) {
  if (!block || !block.starters.length) return '';
  const rows = block.starters.map((s) => `
    <div class="slot-row">
      <span class="slot-tag">${esc(s.position_slot)}</span>
      <span class="pl-name">${esc(s.name)}</span>
      <span class="rec-chips">
        ${s.live ? `<span class="live-pts">${s.live.points}${s.live.is_final ? '' : '*'}</span>` : bandChip(s.rec)}
      </span>
    </div>`).join('');
  return `<section class="card">
    <div class="card-head"><h2>${esc(title)}</h2>
      ${total !== null && total !== undefined ? `<span class="lineup-total">${total} pts</span>` : ''}</div>
    ${rows}
  </section>`;
}

export async function render(main) {
  main.innerHTML = '<div class="loading">Loading…</div>';
  const d = await get('/api/dashboard');

  const header = d.week
    ? `Week ${d.week} · ${d.season}${d.matchup ? ` — vs ${esc(d.matchup.opponent_name)}` : ''}`
    : `${d.season || ''} season`;

  const noRoster = !d.me || !d.me.starters.length;

  main.innerHTML = `
    <div class="page-head"><h1>Dashboard</h1><span class="muted">${header}</span></div>
    ${d.me && d.opp && d.me.total !== null && d.opp.total !== null
      ? `<section class="card score-strip">
           <span class="score-side">Me <strong>${d.me.total}</strong></span>
           <span class="muted">vs</span>
           <span class="score-side"><strong>${d.opp.total}</strong> ${esc(d.matchup.opponent_name)}</span>
         </section>` : ''}
    ${noRoster
      ? `<section class="card"><h2>This week</h2>
           <p class="muted">No players rostered yet — build <a href="#/team">My Team</a>, save your
           <a href="#/opponents">opponents</a>, and pick your <a href="#/matchup">weekly matchup</a>.</p>
         </section>`
      : lineupCard('My starters', d.me, d.me.total)}
    ${d.opp ? lineupCard(`${d.matchup.opponent_name}'s starters`, d.opp, d.opp.total) : ''}
    ${connectBox(d.server)}
    <section class="card">
      <h2>Data sync</h2>
      ${d.sync.length
        ? `<table class="table"><tbody>${d.sync.map((s) =>
            `<tr><td>${esc(s.source)}</td><td class="sync-${esc(s.status)}">${esc(s.status)}</td>
             <td class="muted">${esc((s.ran_at || '').slice(0, 16))}</td></tr>`).join('')}</tbody></table>`
        : '<p class="muted">No syncs have run yet.</p>'}
    </section>`;
}
