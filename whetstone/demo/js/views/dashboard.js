// Whetstone — Dashboard (home). Category counts + connect-your-phone QR.
// Valuation totals land at M5.
import { fetchDashboard, isDemo } from '../dataAdapter.js';
import { esc, fmtMoney } from '../ui.js';
import { setListFilter } from './items.js';
import { connectBox } from '../qr.js';

export async function render(root) {
  root.innerHTML = '<h1>Dashboard</h1><p class="muted">Loading…</p>';
  let d;
  try { d = await fetchDashboard(); }
  catch (e) { root.innerHTML = `<h1>Dashboard</h1><div class="error">Could not load dashboard: ${esc(e.message)}</div>`; return; }

  const CAT_ICONS = { 'Knife': '🔪', 'Sword': '⚔️', 'Axe/Hawk': '🪓', 'Other Melee': '🛡️' };
  // Each category card opens the Collection filtered to that category.
  const cards = d.counts.by_category
    .map((c) => `<button class="card card-btn" data-category-id="${c.id}" aria-label="View ${esc(c.name)}">
        <div class="card-icon" aria-hidden="true">${CAT_ICONS[c.name] || '🗡️'}</div>
        <div class="card-count">${c.count}</div>
        <div class="card-label">${esc(c.name)}</div>
      </button>`)
    .join('');

  const lan = isDemo() ? '' : connectBox(d.server);

  root.innerHTML = `
    <h1>Dashboard</h1>
    ${isDemo() ? '<div class="lan-box">👋 You’re browsing the Whetstone demo — a read-only sample collection. The real app runs entirely on your own PC.</div>' : `
    <div class="quick-add">
      <a class="btn primary" href="#/collection/new">➕ Add item</a>
      <a class="btn" href="#/collection">🗡️ Browse collection</a>
    </div>`}
    ${d.counts.total === 0 ? '<div class="empty">No items yet — tap “Add item” to log the first piece of your collection.</div>' : ''}
    <div class="cards">${cards}</div>
    ${valuationHtml(d.valuation, d.counts)}
    ${lan}
  `;

  root.querySelectorAll('.card-btn').forEach((el) => {
    el.onclick = () => {
      setListFilter({ category_id: el.dataset.categoryId });
      location.hash = '#/collection';
    };
  });
}

// Valuation summary (Critical Accuracy #1): raw sums arrive from the server;
// fmtMoney does the only rounding. Gain/loss covers items with both prices —
// incomplete data is disclosed, never silently mixed in.
function valuationHtml(v, counts) {
  // Show whenever there's anything to value — including a fully-sold
  // collection, where realized gain/loss is exactly what still matters.
  if (!v || (counts.total === 0 && counts.sold_total === 0)) return '';
  const gainClass = (n) => (n < 0 ? ' overdue' : '');
  const missing = [];
  if (v.missing_current) missing.push(`${v.missing_current} item${v.missing_current === 1 ? '' : 's'} missing a current value`);
  if (v.missing_cost) missing.push(`${v.missing_cost} missing a purchase price`);
  return `<section class="valuation">
    <h2 class="section-title">Collection value</h2>
    <div class="stat-row">
      <div class="stat"><div class="stat-num">${fmtMoney(v.current_total)}</div><div class="card-label">Current value</div></div>
      <div class="stat"><div class="stat-num">${fmtMoney(v.cost_basis)}</div><div class="card-label">Cost basis</div></div>
      <div class="stat"><div class="stat-num${gainClass(v.unrealized_gain)}">${v.unrealized_gain >= 0 ? '+' : ''}${fmtMoney(v.unrealized_gain)}</div><div class="card-label">Unrealized gain/loss</div></div>
      ${counts.sold_total ? `<div class="stat"><div class="stat-num${gainClass(v.realized_gain)}">${v.realized_gain >= 0 ? '+' : ''}${fmtMoney(v.realized_gain)}</div><div class="card-label">Realized (${counts.sold_total} sold)</div></div>` : ''}
    </div>
    ${missing.length ? `<p class="muted">⚠️ ${missing.join('; ')} — totals only reflect entered figures.</p>` : ''}
  </section>`;
}
