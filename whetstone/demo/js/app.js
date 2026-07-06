// Whetstone — SPA router, appbar, drawer. Hash-based, no framework.
// M6.5 reskin: hamburger + back-arrow IA (Lloyd's mockup) replaces the old
// sidebar/bottom-nav. Views call setAppbar() to override title/back.
import { fetchSettings, isDemo } from './dataAdapter.js';
import { setCurrency } from './ui.js';
import { isStandalone, addToHomeScreen } from './install.js';
import { icon } from './icons.js';
import * as home from './views/dashboard.js';
import * as items from './views/items.js';
import * as wishlist from './views/wishlist.js';
import * as settings from './views/settings.js';
import * as welcome from './views/welcome.js';
import * as connect from './views/connect.js';

const routes = {
  '': home,
  home,
  dashboard: home, // old bookmarks / installed PWAs
  collection: items,
  wishlist,
  settings,
  welcome,
  connect
};

let collectionName = 'Whetstone';
let needsSetup = false; // true only during the gated first-run wizard

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'home', params: parts.slice(1) };
}

// Logical parent for the appbar back arrow — computed from the hash, not
// history.back(), so deep links (QR straight to an item) get a sane path.
// Item detail overrides via setAppbar (it knows its category).
function parentFor(name, params) {
  if (name === 'collection') {
    if (!params.length) return '#/home';
    if (params[0] === 'cat' || params[0] === 'all' || params[0] === 'new') return '#/collection';
    if (params[1] === 'edit') return `#/collection/${params[0]}`;
    return '#/collection'; // detail fallback until the view overrides
  }
  if (name === 'wishlist' || name === 'settings' || name === 'connect') return '#/home';
  return null; // home + welcome: no back arrow
}

function titleFor(name) {
  switch (name) {
    case 'collection': return 'Your Collection';
    case 'wishlist': return 'Wishlist';
    case 'settings': return 'Settings';
    case 'connect': return 'Connect Phone';
    case 'welcome': return 'Welcome';
    default: return collectionName;
  }
}

// The wizard/settings save a new collection name after init — keep the home
// title in sync (they call this alongside updating #collection-name).
export function setCollectionName(cn) {
  collectionName = (cn && cn.trim()) ? cn.trim() : 'Whetstone';
}

// Views may call this after render to refine the appbar (e.g. category name
// as title, detail's true parent list).
export function setAppbar({ back, title } = {}) {
  const backEl = document.getElementById('appbar-back');
  if (back !== undefined) {
    backEl.innerHTML = back
      ? `<a class="appbar-backlink" href="${back}" aria-label="Back">${icon('back')}</a>`
      : '';
  }
  if (title !== undefined) {
    document.getElementById('appbar-title').textContent = title;
  }
}

// ---------------------------------------------------------------- drawer

const DRAWER_LINKS = [
  { route: 'home', href: '#/home', label: 'Home', icn: 'home' },
  { route: 'collection', href: '#/collection', label: 'Your Collection', icn: 'collection' },
  { route: 'wishlist', href: '#/wishlist', label: 'Wishlist', icn: 'star' },
  { route: 'connect', href: '#/connect', label: 'Connect Phone', icn: 'qr', realOnly: true },
  { route: 'settings', href: '#/settings', label: 'Settings', icn: 'gear' },
  { route: 'welcome', href: '#/welcome', label: 'Re-run Setup', icn: 'undo', realOnly: true }
];

function renderDrawer(active) {
  const links = DRAWER_LINKS.filter((l) => !(l.realOnly && isDemo()));
  document.getElementById('drawer').innerHTML = `
    <div class="drawer-head">
      <span class="drawer-brand">WHETSTONE</span>
      <button class="drawer-close" id="drawer-close" aria-label="Close menu">${icon('close')}</button>
    </div>
    ${links.map((l) => `<a class="drawer-link ${l.route === active ? 'active' : ''}" href="${l.href}">
      <span class="drawer-icn">${icon(l.icn)}</span>${l.label}</a>`).join('')}
  `;
  document.getElementById('drawer-close').onclick = closeDrawer;
}

function openDrawer() {
  document.getElementById('drawer').hidden = false;
  document.getElementById('drawer-overlay').hidden = false;
  document.body.classList.add('drawer-open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'true');
}

function closeDrawer() {
  document.body.classList.remove('drawer-open');
  document.getElementById('drawer').hidden = true;
  document.getElementById('drawer-overlay').hidden = true;
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
}

function wireDrawer() {
  const burger = document.getElementById('hamburger');
  burger.innerHTML = icon('menu');
  burger.onclick = () => (document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer());
  document.getElementById('drawer-overlay').onclick = closeDrawer;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
}

// ---------------------------------------------------------------- routing

async function route() {
  const { name, params } = parseHash();
  const view = routes[name] || home;
  const main = document.getElementById('view');
  closeDrawer();
  renderDrawer(name === 'dashboard' || name === '' ? 'home' : name);
  setAppbar({ back: parentFor(name, params), title: titleFor(name) });
  // The gated first-run wizard owns the screen — no menu until it finishes.
  if (name !== 'welcome') needsSetup = false;
  document.getElementById('hamburger').style.display = (needsSetup && name === 'welcome') ? 'none' : '';
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
    bar.innerHTML = '<span>Add Whetstone to your Home Screen for one-tap access.</span>'
      + '<span class="a2hs-actions">'
      + '<button class="a2hs-add">Add</button>'
      + '<button class="a2hs-close" aria-label="Dismiss">&#10005;</button></span>';
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
  wireDrawer();
  try {
    const s = await fetchSettings();
    setCurrency(s.currency);
    needsSetup = !isDemo() && s.setup_complete !== '1';
    const cn = (s.collection_name && s.collection_name.trim()) ? s.collection_name.trim() : 'Whetstone';
    collectionName = cn;
    const el = document.getElementById('collection-name');
    if (el) el.textContent = cn === 'Whetstone' ? '' : 'Whetstone';
    document.title = cn === 'Whetstone' ? 'Whetstone' : `${cn} · Whetstone`;
  } catch (e) {
    /* defaults stand if settings unreachable */
  }
  window.addEventListener('hashchange', route);
  // First run: the wizard takes over until it's finished (or skipped via
  // Settings later — finishing sets setup_complete).
  const target = needsSetup ? '#/welcome' : (location.hash || '#/home');
  if (location.hash !== target) location.hash = target; else route();
  maybeShowInstallBanner();
  // No SW in demo mode — the demo is a plain static page.
  if (!isDemo() && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

init();
