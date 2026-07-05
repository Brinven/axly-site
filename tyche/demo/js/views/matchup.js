// Tyche — weekly matchup picker: assign a saved opponent to each week (PRD §4.1).
import { get, put } from '../api.js';
import { esc, toast } from '../ui.js';

export async function render(main) {
  main.innerHTML = '<div class="loading">Loading…</div>';
  const [data, opps] = await Promise.all([get('/api/matchups'), get('/api/opponents')]);

  if (!opps.length) {
    main.innerHTML = `
      <div class="page-head"><h1>Matchups</h1></div>
      <section class="card"><p class="muted">Save your league-mates on the
      <a href="#/opponents">Opponents</a> screen first, then assign who you're facing each week here.</p></section>`;
    return;
  }

  const options = (selected) => ['<option value="">—</option>']
    .concat(opps.map((o) => `<option value="${o.id}" ${o.id === selected ? 'selected' : ''}>${esc(o.name)}</option>`))
    .join('');

  main.innerHTML = `
    <div class="page-head"><h1>Matchups</h1><span class="muted">${data.season} season</span></div>
    <section class="card">
      ${data.weeks.map((w) => `
        <div class="week-row">
          <span class="week-label">Week ${w.week}</span>
          <select data-week="${w.week}">${options(w.opponent_id)}</select>
        </div>`).join('')}
    </section>`;

  main.querySelectorAll('select[data-week]').forEach((sel) => {
    sel.onchange = async () => {
      try {
        await put(`/api/matchups/${sel.dataset.week}`, { opponent_id: sel.value || null });
        toast(`Week ${sel.dataset.week} saved`, 'success');
      } catch (e) { toast(e.message, 'error'); }
    };
  });
}
