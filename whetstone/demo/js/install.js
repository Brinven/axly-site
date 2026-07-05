// Whetstone — "Add to Home Screen" helper. Maximally cross-browser.
//
// Reality check (why this is native-prompt-OR-instructions, not one button):
//  - Chromium (Android + desktop) fires `beforeinstallprompt` -> a real one-tap
//    install, but ONLY in a secure context (HTTPS or localhost). Whetstone reached
//    over plain-HTTP LAN (http://192.168.x.x:4595) is NOT a secure context, so on
//    phones this event usually never fires (and the service worker won't register).
//    Accepted tradeoff for local-first (CLAUDE.md Gotcha #8) — don't fight it.
//  - iOS Safari: no install API has ever existed; the user taps Share -> Add to
//    Home Screen. This works over plain HTTP (needs no SW / secure context).
//  - iOS Chrome/Firefox/Edge: can't add to Home Screen -> must open in Safari.
// So: fire the native prompt when the browser offers it, else show tailored steps.
import { openModal, closeModal, esc } from './ui.js';

// Capture the install prompt the moment this module loads (the event fires early).
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();            // suppress Chrome's mini-infobar; our button triggers it
  deferredPrompt = e;
});
window.addEventListener('appinstalled', () => { deferredPrompt = null; });

// Already running as an installed app (standalone)?
export function isStandalone() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone === true; // iOS Safari
}

export function canNativeInstall() {
  return !!deferredPrompt;
}

// Returns 'accepted' | 'dismissed' | 'unavailable'.
export async function nativeInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice && choice.outcome ? choice.outcome : 'dismissed';
}

function detectPlatform() {
  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports a desktop-Safari UA; detect via touch points.
  const isIpad = /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || isIpad;
  const iOSOtherBrowser = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua); // Chrome/FF/Edge/Opera on iOS
  return {
    isIOS,
    iOSSafari: isIOS && !iOSOtherBrowser,
    iOSOtherBrowser,
    isAndroid: /Android/.test(ua),
    isFirefox: /Firefox/.test(ua) && !isIOS,
    isSamsung: /SamsungBrowser/.test(ua)
  };
}

// Human instructions for the detected browser. step strings may contain <strong>.
export function installGuide() {
  const p = detectPlatform();
  if (p.iOSSafari) {
    return { title: 'Add Whetstone to your iPhone or iPad', steps: [
      'Tap the <strong>Share</strong> button (the square with an arrow) in Safari’s toolbar.',
      'Scroll down and tap <strong>Add to Home Screen</strong>.',
      'Tap <strong>Add</strong> (top-right). Whetstone now opens like an app.'
    ] };
  }
  if (p.iOSOtherBrowser) {
    return { title: 'Open Whetstone in Safari to add it', steps: [
      'On iPhone/iPad, only <strong>Safari</strong> can add a site to the Home Screen.',
      'Tap your browser’s menu and choose <strong>Open in Safari</strong> (or copy this address into Safari).',
      'In Safari, tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.'
    ] };
  }
  if (p.isAndroid || p.isSamsung) {
    return { title: 'Add Whetstone to your phone', steps: [
      'Tap the <strong>⋮</strong> menu (top-right of the browser).',
      'Tap <strong>Add to Home screen</strong> (it may say <strong>Install app</strong>).',
      'Confirm. Whetstone now opens from your home screen.'
    ] };
  }
  if (p.isFirefox) {
    return { title: 'Add Whetstone to your home screen', steps: [
      'Tap the <strong>⋮</strong> menu.',
      'Choose <strong>Install</strong> or <strong>Add to Home screen</strong>.'
    ] };
  }
  // Desktop / anything else.
  return { title: 'Add Whetstone as an app', steps: [
    'In Chrome or Edge, click the <strong>install icon</strong> in the address bar (a screen with a down-arrow).',
    'Or open the browser menu and choose <strong>Install Whetstone</strong> / <strong>Add to Home screen</strong>.'
  ] };
}

export function showInstallHelp() {
  const g = installGuide();
  const steps = g.steps
    .map((s, i) => `<li><span class="a2hs-step-n">${i + 1}</span><span>${s}</span></li>`)
    .join('');
  const m = openModal(`
    <h2>${esc(g.title)}</h2>
    <ol class="a2hs-steps">${steps}</ol>
    <div class="form-actions">
      <button type="button" class="btn primary" id="a2hs-ok">Got it</button>
    </div>
  `);
  m.panel.querySelector('#a2hs-ok').onclick = closeModal;
}

// Single entry point for any "Add to Home Screen" button: native one-tap prompt
// if the browser offers it, otherwise tailored per-browser instructions.
// Returns 'accepted' | 'dismissed' | 'instructions'.
export async function addToHomeScreen() {
  if (canNativeInstall()) {
    const outcome = await nativeInstall();
    if (outcome === 'accepted' || outcome === 'dismissed') return outcome;
  }
  showInstallHelp();
  return 'instructions';
}
