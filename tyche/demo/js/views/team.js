// Tyche — My Team view: the shared roster component with side='me'.
import { renderRoster } from '../roster.js';

export async function render(main) {
  main.innerHTML = `
    <div class="page-head"><h1>My Team</h1></div>
    <div id="roster-box"><div class="loading">Loading…</div></div>`;
  await renderRoster(main.querySelector('#roster-box'), 'me');
}
