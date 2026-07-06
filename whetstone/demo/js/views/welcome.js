// Whetstone — first-run wizard (M4; PRD §9). Three steps:
//   1. Name the collection.
//   2. Choose phone access: home WiFi only, or WiFi + anywhere (Tailscale).
//   3. If Tailscale: status-driven setup — install (one UAC prompt) → sign in
//      (their own browser login, never automated) → poll until online → QRs.
// Re-runnable any time from Settings; finishing sets setup_complete = 1.
import {
  fetchSettings, saveSettings, fetchDashboard,
  fetchTailscaleStatus, tailscaleInstall, tailscaleUp, isDemo
} from '../dataAdapter.js';
import { esc, toast, setCurrency } from '../ui.js';
import { connectBox, remoteBox } from '../qr.js';
import { icon } from '../icons.js';
import { setCollectionName } from '../app.js';

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK'];
let pollTimer = null;

function stopPolling() {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
}

export async function render(root) {
  stopPolling();
  if (isDemo()) { location.hash = '#/home'; return; }

  let s = {};
  try { s = await fetchSettings(); } catch (e) { /* defaults */ }
  const cur = s.currency || 'USD';
  const curOpts = (CURRENCIES.includes(cur) ? CURRENCIES : [cur, ...CURRENCIES])
    .map((c) => `<option ${c === cur ? 'selected' : ''}>${c}</option>`).join('');

  root.innerHTML = `
    <h1>Welcome to Whetstone</h1>
    <p class="muted">Your collection, your machine, your data. Two quick questions and you're in.</p>
    <form class="form" id="wz-form">
      <fieldset>
        <legend>1 · Your collection</legend>
        <div class="form-row">
          <label>Collection name
            <input name="collection_name" value="${esc(s.collection_name || '')}" placeholder="My Collection">
          </label>
          <label>Currency <select name="currency">${curOpts}</select></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>2 · Phone access</legend>
        <label class="checkbox"><input type="radio" name="access" value="lan" ${s.tailscale_enabled === '1' ? '' : 'checked'}>
          <strong>Home WiFi only</strong> — scan a QR when your phone is on the same network. Zero extra setup.</label>
        <label class="checkbox"><input type="radio" name="access" value="tailscale" ${s.tailscale_enabled === '1' ? 'checked' : ''}>
          <strong>WiFi + anywhere</strong> — adds free, private remote access (Tailscale) for knife shows and show-and-tell. A couple of extra steps, once.</label>
      </fieldset>
      <div id="wz-ts"></div>
      <div class="form-actions">
        <button class="btn primary" type="submit" id="wz-finish">Finish setup</button>
      </div>
    </form>
  `;

  const tsPanel = root.querySelector('#wz-ts');
  const radios = root.querySelectorAll('input[name="access"]');
  const refreshPanel = () => {
    const choice = root.querySelector('input[name="access"]:checked').value;
    if (choice === 'tailscale') renderTsPanel(tsPanel);
    else { stopPolling(); tsPanel.innerHTML = ''; }
  };
  radios.forEach((r) => { r.onchange = refreshPanel; });
  refreshPanel();

  root.querySelector('#wz-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const wantsTs = fd.get('access') === 'tailscale';
    try {
      const saved = await saveSettings({
        collection_name: fd.get('collection_name'),
        currency: fd.get('currency'),
        tailscale_enabled: wantsTs ? '1' : '0',
        setup_complete: '1'
      });
      setCurrency(saved.currency);
      const cn = (saved.collection_name && saved.collection_name.trim()) ? saved.collection_name.trim() : 'Whetstone';
      setCollectionName(cn);
      const el = document.getElementById('collection-name');
      if (el) el.textContent = cn === 'Whetstone' ? '' : 'Whetstone';
      document.title = cn === 'Whetstone' ? 'Whetstone' : `${cn} · Whetstone`;
      stopPolling();
      toast('You’re set up. Sharp.', 'success');
      location.hash = '#/home';
    } catch (err) { toast(err.message, 'error'); }
  };
}

// Status-driven Tailscale panel. Every state renders from GET /status; actions
// fire-and-poll. Safe to leave and come back — state is on the server.
async function renderTsPanel(panel) {
  stopPolling();
  panel.innerHTML = '<fieldset><legend>3 · Remote access setup</legend><p class="muted">Checking Tailscale…</p></fieldset>';
  let st;
  try { st = await fetchTailscaleStatus(); }
  catch (e) { panel.innerHTML = tsWrap(`<div class="error">${esc(e.message)}</div>`); return; }

  const again = (ms) => { pollTimer = setTimeout(() => renderTsPanel(panel), ms); };

  if (st.install_state === 'downloading' || st.install_state === 'installing') {
    panel.innerHTML = tsWrap(`<p>${st.install_state === 'downloading' ? 'Downloading Tailscale (~35 MB)…' : 'Installing — approve the Windows permission prompt if it appears.'}</p>`);
    return again(2000);
  }
  if (st.install_state === 'error') {
    panel.innerHTML = tsWrap(`
      <div class="error">${esc(st.install_error || 'Install failed.')}</div>
      <button class="btn primary" type="button" id="ts-install">Try install again</button>`);
    panel.querySelector('#ts-install').onclick = () => { tailscaleInstall(); renderTsPanel(panel); };
    return;
  }

  switch (st.state) {
    case 'not_installed':
      panel.innerHTML = tsWrap(`
        <p>Whetstone uses <strong>Tailscale</strong> — a free, private network between your own devices. No cloud account with us, no data leaving your machine.</p>
        <p class="muted">One Windows permission prompt will appear during install.</p>
        <button class="btn primary" type="button" id="ts-install">Install Tailscale</button>`);
      panel.querySelector('#ts-install').onclick = () => { tailscaleInstall(); renderTsPanel(panel); };
      break;

    case 'needs_login':
    case 'stopped':
    case 'offline':
      panel.innerHTML = tsWrap(`
        <p>Tailscale is installed. Next: sign in with <strong>your own</strong> account (Google, Microsoft, GitHub, or email — free for personal use). Your browser will open.</p>
        ${st.auth_url ? `<p class="muted">Browser didn’t open? <a href="${esc(st.auth_url)}" target="_blank" rel="noopener">Click here to sign in</a>.</p>` : ''}
        <button class="btn primary" type="button" id="ts-up">${st.login_in_progress ? 'Waiting for sign-in…' : 'Sign in to Tailscale'}</button>
        ${st.login_in_progress ? '<p class="muted">Finish signing in — this page updates by itself.</p>' : ''}`);
      panel.querySelector('#ts-up').onclick = () => { tailscaleUp(); renderTsPanel(panel); };
      if (st.login_in_progress) again(2500);
      break;

    case 'online': {
      let d = null;
      try { d = await fetchDashboard(); } catch (e) { /* QR falls back below */ }
      panel.innerHTML = tsWrap(`
        <p>${icon('check')} Connected — this PC is reachable at <code>${esc(st.ip)}</code> from your devices.</p>
        <p><strong>On your phone:</strong> install the Tailscale app (App Store / Play Store), sign in to the <em>same account</em>, then scan:</p>
        ${remoteBox({ ip: st.ip, url: st.url })}
        ${d && d.server ? connectBox(d.server) : ''}
        <p class="muted">A short walkthrough video for the phone pairing is coming with the release build.</p>`);
      break;
    }

    default:
      panel.innerHTML = tsWrap(`<div class="error">${esc(st.error || `Unexpected state: ${st.state}`)}</div>`);
      again(4000);
  }
}

function tsWrap(inner) {
  return `<fieldset><legend>3 · Remote access setup</legend>${inner}</fieldset>`;
}
