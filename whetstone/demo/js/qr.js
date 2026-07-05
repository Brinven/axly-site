// Whetstone — shared "connect your phone" widget. Used on the Dashboard and Settings.
// Generates a scannable QR of the LAN URL entirely client-side (the only input is
// server.url, which /api/dashboard already computes via server/localIp.js).
// Vendored qrcode-generator (no bundler). Fails soft to URL-only text if QR gen throws.
import { esc } from './ui.js';
import qrcode from './vendor/qrcode-generator.js';

// QR as a GIF data-URI <img> (sized in CSS). typeNumber 0 = auto-size; 'M' ECC.
export function qrImg(url) {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return `<img class="lan-qr" alt="QR code — scan to open Whetstone on your phone" src="${qr.createDataURL(5, 12)}">`;
  } catch (_) {
    return '';
  }
}

// Full connect card. `server` is the { lan_ip, port, url } block from /api/dashboard.
// Returns '' when no server info is available (caller can fall back).
export function connectBox(server) {
  if (!server || !server.url) return '';
  return `<section class="lan-box">
      <div class="lan-qr-wrap">${qrImg(server.url)}</div>
      <div class="lan-text">
        <div class="lan-head">📱 Open Whetstone on your phone</div>
        <p class="lan-sub">On the same WiFi, point your phone's camera at the code — or type this in:</p>
        <code class="lan-url">${esc(server.url)}</code>
      </div>
    </section>`;
}
