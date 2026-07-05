// Whetstone — SPA router, nav, init. Hash-based, no framework.
import { fetchSettings, isDemo } from './dataAdapter.js';
import { setCurrency } from './ui.js';
import { isStandalone, addToHomeScreen } from './install.js';
import * as dashboard from './views/dashboard.js';
import * as items from './views/items.js';
import * as wishlist from './views/wishlist.js';
import * as settings from './views/settings.js';

const routes = {
  '': dashboard,
  dashboard,
  collection: items,
  wishlist,
  settings
};

// Desktop sidebar.
const NAV = [
  { route: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { route: 'collection', label: 'Collection', icon: '🗡️' },
  { route: 'wishlist', label: 'Wishlist', icon: '⭐' },
  { route: 'settings', label: 'Settings', icon: '⚙️' }
];

// Mobile bottom nav. Browsing the collection is the primary mobile flow.
const BOTTOM = [
  { route: 'dashboard', label: 'Home', icon: '🏠' },
  { route: 'collection', label: 'Collection', icon: '🗡️' },
  { route: 'collection/new', label: 'Add', icon: '➕' },
  { route: 'wishlist', label: 'Wishlist', icon: '⭐' },
  { route: 'settings', label: 'Settings', icon: '⚙️' }
];

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'dashboard', params: parts.slice(1) };
}

function renderNav(r) {
  document.getElementById('sidebar').innerHTML = NAV
    .map((n) => `<a class="nav-link ${n.route === r ? 'active' : ''}" href="#/${n.route}"><span aria-hidden="true">${n.icon}</span> ${n.label}</a>`)
    .join('');
  document.getElementById('bottomnav').innerHTML = BOTTOM
    .map((n) => `<a class="bnav-link ${n.route.split('/')[0] === r && n.route.indexOf('/') === -1 ? 'active' : ''}" href="#/${n.route}"><span class="bnav-icon" aria-hidden="true">${n.icon}</span><span class="bnav-label">${n.label}</span></a>`)
    .join('');
}

async function route() {
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
  window.scrollTo(0, 0);
}

// On a phone that isn't already installed, offer a dismissible "Add to Home
// Screen" banner. Native prompt where offered, per-browser steps otherwise —
// see install.js for why one-tap isn't universal. Dismissal persists.
function maybeShowInstallBanner() {
  try {
    if (isDemo()) return; // the demo is a website, not an installable app
    if (localStorage.getItem('whetstone-a2hs-dismissed')) return;
    if (isStandalone()) return; // already added to the home screen
    if (!window.matchMedia('(max-width: 768px)').matches) return; // phones/tablets only

    const bar = document.createElement('div');
    bar.className = 'a2hs-banner';
    bar.innerHTML = '<span>📲 Add Whetstone to your Home Screen for one-tap access.</span>'
      + '<span class="a2hs-actions">'
      + '<button class="a2hs-add">Add</button>'
      + '<button class="a2hs-close" aria-label="Dismiss">✕</button></span>';
    document.body.appendChild(bar);

    bar.querySelector('.a2hs-add').onclick = async () => {
      const outcome = await addToHomeScreen();
      if (outcome === 'accepted') {
        bar.remove();
        localStorage.setItem('whetstone-a2hs-dismissed', '1');
      }
    };
    bar.querySelector('.a2hs-close').onclick = () => {
      bar.remove();
      localStorage.setItem('whetstone-a2hs-dismissed', '1');
    };
  } catch (e) { /* no localStorage / matchMedia — skip the hint */ }
}

async function init() {
  try {
    const s = await fetchSettings();
    setCurrency(s.currency);
    const cn = (s.collection_name && s.collection_name.trim()) ? s.collection_name.trim() : 'Whetstone';
    const el = document.getElementById('collection-name');
    if (el) el.textContent = cn;
    document.title = cn === 'Whetstone' ? 'Whetstone' : `${cn} · Whetstone`;
  } catch (e) {
    /* defaults stand if settings unreachable */
  }
  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/dashboard'; else route();
  maybeShowInstallBanner();
  // No SW in demo mode — the demo is a plain static page.
  if (!isDemo() && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

init();
