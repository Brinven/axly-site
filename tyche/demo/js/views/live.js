// Tyche — Live gameday scoreboard (M9). Two stacked lineups with live fantasy
// points; auto-refreshes every 30s while any game is in progress.
import { get, post } from '../api.js';
import { esc, toast } from '../ui.js';

let timer = null;

function gameStatus(games, team) {
  const g = games.find((x) => x.home_team === team || x.away_team === team);
  if (!g) return '<span class="muted">BYE</span>';
  const score = `${g.away_team} ${g.away_score ?? ''} @ ${g.home_team} ${g.home_score ?? ''}`;
  if (g.status === 'in') return `<span class="live-dot">●</span> ${esc(score)}`;
  if (g.status === 'post') return `<span class="muted">Final: ${esc(score)}</span>`;
  const t = g.kickoff ? new Date(g.kickoff).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '';
  return `<span class="muted">${esc(t)}</span>`;
}

function lineupCard(title, block, games) {
  if (!block) return '';
  const starters = block.players.filter((p) => p.position_slot !== 'BENCH');
  return `<section class="card">
    <div class="card-head"><h2>${esc(title)}</h2><span class="lineup-total">${block.total} pts</span></div>
    ${starters.map((p) => `
      <div class="slot-row">
        <span class="slot-tag">${esc(p.position_slot)}</span>
        <div class="live-mid">
          <span class="pl-name">${esc(p.name)}</span>
          <span class="live-game">${gameStatus(games, p.nfl_team)}</span>
        </div>
        <span class="rec-chips live-pts">${p.points ?? '—'}${p.points != null && !p.is_final ? '*' : ''}</span>
      </div>`).join('')}
  </section>`;
}

export async function render(main) {
  clearInterval(timer);
  main.innerHTML = '<div class="loading">Loading…</div>';
  await draw(main);
}

async function draw(main) {
  const d = await get('/api/live');
  if (!d.week) {
    main.innerHTML = `<div class="page-head"><h1>Live</h1></div>
      <section class="card"><p class="muted">No schedule data yet — syncs run automatically.</p></section>`;
    return;
  }
  const inGames = d.games.filter((g) => g.status === 'in').length;

  main.innerHTML = `
    <div class="page-head"><h1>Live</h1>
      <span class="muted">Week ${d.week} · ${d.season}${inGames ? ` · ${inGames} game${inGames > 1 ? 's' : ''} live` : ''}</span>
      <button class="secondary btn-sm" id="live-refresh">↻</button>
    </div>
    ${d.me && d.opp && d.matchup
      ? `<section class="card score-strip">
           <span class="score-side">Me <strong>${d.me.total}</strong></span><span class="muted">vs</span>
           <span class="score-side"><strong>${d.opp.total}</strong> ${esc(d.matchup.opponent_name)}</span>
         </section>` : ''}
    ${lineupCard('My starters', d.me, d.games)}
    ${d.opp ? lineupCard(`${d.matchup.opponent_name}'s starters`, d.opp, d.games) : ''}
    <p class="muted" style="font-size:12px">* live/unofficial — kicker distances and some D/ST stats
    are approximated in-game; official finals from nflverse land Tue/Wed and freeze the week.</p>`;

  main.querySelector('#live-refresh').onclick = async () => {
    try { await post('/api/live/poll', {}); } catch (e) { toast(e.message, 'error'); }
    draw(main);
  };

  if (d.any_live) {
    clearInterval(timer);
    timer = setInterval(() => {
      // stop refreshing if the user navigated away
      if (!document.querySelector('#live-refresh')) { clearInterval(timer); return; }
      draw(main);
    }, 30000);
  }
}
