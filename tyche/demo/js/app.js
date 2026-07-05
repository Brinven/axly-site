// Tyche — SPA router, nav, init. Hash-based, no framework. (Epona pattern.)
import { get } from './api.js';
import { closeModal } from './ui.js';
import * as dashboard from './views/dashboard.js';
import * as team from './views/team.js';
import * as opponents from './views/opponents.js';
import * as matchup from './views/matchup.js';
import * as recs from './views/recs.js';
import * as live from './views/live.js';
import * as history from './views/history.js';
import * as settings from './views/settings.js';
import * as more from './views/more.js';

const routes = {
  '': dashboard,
  dashboard,
  team,
  opponents,
  matchup,
  recs,
  live,
  history,
  settings,
  more
};

// Desktop sidebar — everything visible.
const NAV = [
  { route: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { route: 'team', label: 'My Team', icon: '🏈' },
  { route: 'recs', label: 'Start/Sit', icon: '🎯' },
  { route: 'live', label: 'Live', icon: '📡' },
  { route: 'opponents', label: 'Opponents', icon: '🤼' },
  { route: 'matchup', label: 'Matchups', icon: '📅' },
  { route: 'history', label: 'History', icon: '📊' },
  { route: 'settings', label: 'Settings', icon: '⚙️' }
];

// Mobile bottom nav — the phone-check-in loop (PRD §4.6). "More" fans out.
const BOTTOM = [
  { route: 'dashboard', label: 'Home', icon: '🏠' },
  { route: 'team', label: 'Team', icon: '🏈' },
  { route: 'recs', label: 'Start/Sit', icon: '🎯' },
  { route: 'live', label: 'Live', icon: '📡' },
  { route: 'more', label: 'More', icon: '☰' }
];

// Routes that highlight "More" in the bottom nav.
const MORE_ROUTES = ['more', 'opponents', 'matchup', 'history', 'settings'];

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'dashboard', params: parts.slice(1) };
}

function renderNav(r) {
  document.getElementById('sidebar').innerHTML = NAV
    .map((n) => `<a class="nav-link ${n.route === r ? 'active' : ''}" href="#/${n.route}"><span aria-hidden="true">${n.icon}</span> ${n.label}</a>`)
    .join('');
  document.getElementById('bottomnav').innerHTML = BOTTOM
    .map((n) => {
      const active = n.route === r || (n.route === 'more' && MORE_ROUTES.includes(r));
      return `<a class="bnav-link ${active ? 'active' : ''}" href="#/${n.route}"><span class="bnav-icon" aria-hidden="true">${n.icon}</span><span class="bnav-label">${n.label}</span></a>`;
    })
    .join('');
}

async function route() {
  closeModal(); // navigating away must not strand an open modal
  const { name, params } = parseHash();
  const view = routes[name] || dashboard;
  const main = document.getElementById('view');
  renderNav(name);
  try {
    await view.render(main, params);
  } catch (e) {
    main.innerHTML = `<div class="error">${e.message}</div>`;
  }
  main.scrollTop = 0;
}

async function updateWeekBadge() {
  try {
    const d = await get('/api/dashboard');
    const el = document.getElementById('appbar-week');
    if (el) el.textContent = d.week ? `Wk ${d.week} · ${d.season}` : (d.season || '');
  } catch (_) { /* badge is decorative */ }
}

function init() {
  if (window.__TYCHE_DEMO__ === true) {
    document.querySelector('.appbar-titles')
      ?.insertAdjacentHTML('afterend', '<span class="demo-chip" title="Sample data — read-only">DEMO</span>');
  }
  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/dashboard'; else route();
  updateWeekBadge();
}

init();
