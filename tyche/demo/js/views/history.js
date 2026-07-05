// Tyche — History (M10): weekly W/L per season + head-to-head series records.
// Archived seasons stay browsable via the season picker.
import { get } from '../api.js';
import { esc } from '../ui.js';

export async function render(main, params) {
  if (params && params[0] === 'opp' && params[1]) return renderOpponent(main, Number(params[1]));

  const season = params && params[0] ? Number(params[0]) : '';
  main.innerHTML = '<div class="loading">Loading…</div>';
  const h = await get(`/api/history${season ? `?season=${season}` : ''}`);

  const picker = h.seasons.length > 1 ? `
    <select id="season-pick">
      ${h.seasons.map((s) => `<option value="${s.year}" ${s.year === h.season ? 'selected' : ''}>
        ${s.year}${s.status === 'archived' ? ' (archived)' : ''}</option>`).join('')}
    </select>` : `<span class="muted">${h.season}</span>`;

  const scored = h.weeks.filter((w) => w.my_total !== null);
  main.innerHTML = `
    <div class="page-head"><h1>History</h1>${picker}</div>

    ${h.series.length ? `
      <section class="card">
        <h2>Season series</h2>
        ${h.series.map((s) => `
          <a class="slot-row" href="#/history/opp/${s.opponent_id}">
            <span class="pl-name">${esc(s.name)}</span>
            <span class="rec-chips series-rec">${s.wins}–${s.losses}${s.ties ? `–${s.ties}` : ''}</span>
          </a>`).join('')}
      </section>` : ''}

    <section class="card">
      <h2>Weekly results</h2>
      ${scored.length ? `
        <table class="table"><thead><tr><th>Wk</th><th>Me</th><th>Opponent</th><th></th></tr></thead>
        <tbody>${scored.map((w) => `
          <tr>
            <td>${w.week}</td>
            <td><strong>${w.my_total}</strong>${w.final ? '' : '<span class="muted">*</span>'}</td>
            <td>${w.opponent_name ? `${esc(w.opponent_name)} — ${w.opponent_total ?? '?'}` : '<span class="muted">no matchup set</span>'}</td>
            <td>${w.result ? `<span class="wl wl-${w.result}">${w.result}</span>` : ''}</td>
          </tr>`).join('')}
        </tbody></table>`
        : '<p class="muted">No scored weeks yet for this season. Scores are captured live on gamedays and finalized from official stats midweek.</p>'}
    </section>`;

  const pick = main.querySelector('#season-pick');
  if (pick) pick.onchange = () => { location.hash = `#/history/${pick.value}`; };
}

async function renderOpponent(main, oppId) {
  main.innerHTML = '<div class="loading">Loading…</div>';
  const h = await get(`/api/history/${oppId}`);
  main.innerHTML = `
    <div class="page-head">
      <a class="back-link" href="#/history">←</a>
      <h1>vs ${esc(h.opponent.name)}</h1>
      <span class="series-rec">${h.record.wins}–${h.record.losses}${h.record.ties ? `–${h.record.ties}` : ''}</span>
    </div>
    <section class="card">
      ${h.games.length ? `
        <table class="table"><thead><tr><th>Season</th><th>Wk</th><th>Me</th><th>Them</th><th></th></tr></thead>
        <tbody>${h.games.map((g) => `
          <tr><td>${g.season}</td><td>${g.week}</td>
              <td><strong>${g.my_total}</strong></td><td>${g.opponent_total}</td>
              <td><span class="wl wl-${g.result}">${g.result}</span></td></tr>`).join('')}
        </tbody></table>`
        : '<p class="muted">No completed matchups against them yet.</p>'}
    </section>`;
}
