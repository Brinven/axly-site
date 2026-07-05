// Tyche — shared "connect your phone" widget (Epona pattern; Tailscale-first).
// Generates a scannable QR of the tailnet URL entirely client-side (the only
// input is server.url, which /api/dashboard computes via server/lan.js —
// preferring the Tailscale interface). Fails soft to URL-only text.
import { esc } from './ui.js';
import qrcode from './vendor/qrcode-generator.js';

// QR as a GIF data-URI <img> (sized in CSS). typeNumber 0 = auto-size; 'M' ECC.
export function qrImg(url) {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return `<img class="lan-qr" alt="QR code — scan to open Tyche on your phone" src="${qr.createDataURL(5, 12)}">`;
  } catch (_) {
    return '';
  }
}

// Full connect card. `server` is the { lan_ip, port, url, tailscale } block
// from /api/dashboard. When the Tailscale interface is missing (service down),
// say so instead of handing out a QR that silently only works on home WiFi.
export function connectBox(server) {
  if (!server || !server.url) return '';
  const sub = server.tailscale === false
    ? `<p class="lan-sub warn">⚠ Tailscale interface not found — this QR uses the home-LAN address,
       so it only works with the phone on the same WiFi. Start Tailscale and restart the server
       (tray → Restart Server) for anywhere-access.</p>`
    : `<p class="lan-sub">With Tailscale connected, point your phone's camera at the code — or type this in:</p>`;
  return `<section class="lan-box">
      <div class="lan-qr-wrap">${qrImg(server.url)}</div>
      <div class="lan-text">
        <div class="lan-head">📱 Open Tyche on your phone</div>
        ${sub}
        <code class="lan-url">${esc(server.url)}</code>
      </div>
    </section>`;
}
