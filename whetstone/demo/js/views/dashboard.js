// Whetstone — HOME (M6.5 reskin). Mockup screen 2: big icon-tile grid —
// YOUR COLLECTION + one quick-add tile per category. Valuation strip below.
// (File keeps its dashboard.js name to limit sw/demo churn; route is #/home.)
import { fetchDashboard, fetchCategories, isDemo } from '../dataAdapter.js';
import { esc, fmtMoney } from '../ui.js';
import { icon, categoryIcon } from '../icons.js';

export async function render(root) {
  root.innerHTML = '<p class="muted">Loading…</p>';
  let d, cats;
  try { [d, cats] = await Promise.all([fetchDashboard(), fetchCategories()]); }
  catch (e) { root.innerHTML = `<div class="error">Could not load: ${esc(e.message)}</div>`; return; }

  const ordered = [...cats].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  // Real mode: mockup-style ADD tiles. Demo mode is read-only — the same grid
  // browses each category instead (write buttons never render in the demo).
  const catTiles = ordered.map((c) => (isDemo()
    ? `<a class="tile" href="#/collection/cat/${c.id}">
        ${categoryIcon(c.name)}
        <span>${esc(c.name)}</span>
        <span class="tile-count">${c.item_count || 0} item${(c.item_count || 0) === 1 ? '' : 's'}</span>
      </a>`
    : `<a class="tile" href="#/collection/new/${c.id}" aria-label="Add ${esc(c.name)}">
        ${categoryIcon(c.name)}
        <span>Add ${esc(c.name)}</span>
      </a>`)).join('');

  root.innerHTML = `
    ${isDemo() ? '<div class="lan-box"><div class="lan-text"><div class="lan-head">Whetstone demo</div><p class="lan-sub">A read-only sample collection. The real app runs entirely on your own PC — no cloud, no account.</p></div></div>' : ''}
    <div class="tile-grid">
      <a class="tile" href="#/collection" aria-label="Your collection">
        ${icon('collection')}
        <span>Your Collection</span>
        ${d.counts.total ? `<span class="tile-count">${d.counts.total} item${d.counts.total === 1 ? '' : 's'}</span>` : ''}
      </a>
      ${catTiles}
    </div>
    ${d.counts.total === 0 && d.counts.sold_total === 0 && !isDemo()
      ? '<div class="empty">No items yet — tap an ADD tile to log the first piece of your collection.</div>' : ''}
    ${valuationHtml(d.valuation, d.counts)}
    ${isDemo() ? '' : `<div class="quick-add"><a class="btn" href="#/connect">${icon('qr')} Connect your phone</a></div>`}
  `;
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
    ${missing.length ? `<p class="muted">${missing.join('; ')} — totals only reflect entered figures.</p>` : ''}
  </section>`;
}
