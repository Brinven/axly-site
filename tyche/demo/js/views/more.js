// Tyche — "More" fan-out menu for the mobile bottom nav.
export async function render(main) {
  main.innerHTML = `
    <div class="page-head"><h1>More</h1></div>
    <nav class="more-menu">
      <a class="more-link" href="#/opponents">🤼 Opponents<span class="muted">saved league-mates & their rosters</span></a>
      <a class="more-link" href="#/matchup">📅 Matchups<span class="muted">who you're facing each week</span></a>
      <a class="more-link" href="#/history">📊 History<span class="muted">head-to-head records & past seasons</span></a>
      <a class="more-link" href="#/settings">⚙️ Settings<span class="muted">lineup slots, scoring rules, syncs</span></a>
    </nav>`;
}
