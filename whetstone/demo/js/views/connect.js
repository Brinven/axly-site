// Whetstone — Connect Phone view (M6.5). Home of the LAN + Tailscale QR boxes
// (moved off the dashboard in the mockup IA; linked from home and the drawer).
// LAN QR comes from /api/dashboard (localIp.js); the remote QR is sourced from
// `tailscale status --json` server-side — never localIp.js (Gotcha #3).
import { fetchDashboard, isDemo } from '../dataAdapter.js';
import { esc } from '../ui.js';
import { connectBox, remoteBox } from '../qr.js';
import { icon } from '../icons.js';

export async function render(root) {
  if (isDemo()) {
    root.innerHTML = `<div class="empty">The demo runs entirely in your browser — there's no server to connect a phone to.<br><br>
      In the real app, this page shows QR codes that open your collection on your phone: on your WiFi, or from anywhere via Tailscale.</div>`;
    return;
  }

  root.innerHTML = '<p class="muted">Loading…</p>';
  let d;
  try { d = await fetchDashboard(); }
  catch (e) { root.innerHTML = `<div class="error">${esc(e.message)}</div>`; return; }

  const lan = connectBox(d.server)
    || '<div class="empty small">No LAN address detected — check that this PC is on your WiFi/network.</div>';
  const remote = (d.tailscale && d.tailscale.online)
    ? remoteBox(d.tailscale)
    : `<div class="empty small">Remote access is off or not connected.<br><br>
        <a class="btn" href="#/welcome">${icon('qr')} Set up remote access</a></div>`;

  root.innerHTML = `
    <h2 class="section-title">On your WiFi</h2>
    ${lan}
    <h2 class="section-title">From anywhere (Tailscale)</h2>
    ${remote}
    <p class="muted">Tip: with the Tailscale app installed and signed in on your phone, the remote address works at a knife show, a buddy's garage — anywhere with signal.</p>
  `;
}
