// Whetstone — inline SVG icon library (M6.5 reskin, Lloyd's line-art style).
// Two families: silhouettes (fill) for the category marks, strokes for UI
// glyphs. Everything uses currentColor so CSS owns the palette. Lloyd's
// original PNGs are 45px with baked-in labels — these are redrawn vectors.

const FILL = 'f';
const STROKE = 's';

const ICONS = {
  // --- category marks (silhouette family) ---
  knife: [FILL, `<path d="M4.6 2.6 7 1.8c3.3 4.2 6 8.2 8.3 12.4l-3.4.4C9.3 10.5 6.8 6.6 4.6 2.6Z"/>
    <rect x="6.6" y="15.4" width="14.6" height="4.4" rx="2.2"/>`],
  sword: [FILL, `<path d="M20.2 2.2 22 4 10.9 15.1l-2-2L20.1 2.2Z"/>
    <path d="M6.4 11.9c1.9 1 3.7 2.4 5.7 5.7l-1.7 1.7c-1.4-1.2-2.7-1.7-4.2-2.1-.4-.1-.8-.5-.7-1l.9-4.3Z"/>
    <path d="M6.9 17.1l-3.6 4.4-1-1 4.4-3.6c.4.3.8.8.2.2Z"/>
    <circle cx="3.6" cy="20.4" r="1.6"/>`],
  razor: [FILL, `<path d="M3.4 5.6 20 2.4l.9 2.3L4.5 8.5c-.6-1-1-1.9-1.1-2.9Z"/>
    <path d="M17.6 4l3.3.7L10 21.6l-2.1-1.2L17.6 4Z"/>`],
  axe: [FILL, `<rect x="11.1" y="4.5" width="2.2" height="17.5" rx="1.1" transform="rotate(26 12.2 13)"/>
    <path d="M13.5 2.2l3.2 1.7c-.5 1.2-.6 2.4-.3 3.7l3.4 1.2c-.4 2.2-1.6 4-3.5 5.2-1.7-2.3-4-3.9-6.7-4.7.1-2.9 1.5-5.4 3.9-7.1Z"/>`],
  other: [FILL, `<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z"/>`],
  collection: [STROKE, `<rect x="3.2" y="3.6" width="17.6" height="15.2" rx="1.6"/>
    <rect x="6" y="6.4" width="12" height="9.6" rx="1"/>
    <circle cx="12" cy="10.2" r="2.1"/>
    <path d="M12 12.3v1.9M7 19v2M17 19v2"/>`],

  // --- UI glyphs (stroke family) ---
  menu: [STROKE, `<path d="M4 7h16M4 12h16M4 17h16"/>`],
  back: [STROKE, `<path d="M14.5 5 7.5 12l7 7"/>`],
  search: [STROKE, `<circle cx="11" cy="11" r="6"/><path d="m15.6 15.6 4.4 4.4"/>`],
  list: [STROKE, `<path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01M9 6h11M9 12h11M9 18h11"/>`],
  grid: [STROKE, `<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>`],
  pencil: [STROKE, `<path d="m4 20 1-4L16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1Z"/><path d="m14.5 6.5 3 3"/>`],
  trash: [STROKE, `<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13M10 11v6M14 11v6"/>`],
  camera: [STROKE, `<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8.5 7 10 4.5h4L15.5 7"/>`],
  close: [STROKE, `<path d="m6 6 12 12M18 6 6 18"/>`],
  qr: [STROKE, `<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h3v3h-3ZM20 14v.01M14 20v.01M17.5 17.5 20 20"/>`],
  star: [STROKE, `<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6Z"/>`],
  plus: [STROKE, `<path d="M12 5v14M5 12h14"/>`],
  gear: [STROKE, `<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.7M12 18.5v2.7M2.8 12h2.7M18.5 12h2.7M5.4 5.4l1.9 1.9M16.7 16.7l1.9 1.9M18.6 5.4l-1.9 1.9M7.3 16.7l-1.9 1.9"/>`],
  home: [STROKE, `<path d="M4 11.5 12 4.5l8 7"/><path d="M6.5 10v9.5h11V10"/>`],
  phone: [STROKE, `<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M11 18.5h2"/>`],
  money: [STROKE, `<path d="M12 4v16"/><path d="M15.7 7.2c-.7-1.1-2-1.7-3.7-1.7-2.1 0-3.7 1-3.7 2.9 0 3.9 7.6 2 7.6 5.9 0 1.9-1.7 3.2-3.9 3.2-1.9 0-3.3-.8-4-2"/>`],
  undo: [STROKE, `<path d="M8 5 4 9l4 4"/><path d="M4 9h9.5a6 6 0 1 1 0 12H11"/>`],
  check: [STROKE, `<path d="m5 12.5 5 5L19 7"/>`],
  upload: [STROKE, `<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>`],
};

export function icon(name, cls = '') {
  const def = ICONS[name] || ICONS.other;
  const [family, body] = def;
  const attrs = family === STROKE
    ? 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    : 'fill="currentColor" stroke="none"';
  return `<svg class="icn${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" ${attrs} aria-hidden="true">${body}</svg>`;
}

// Category name → mark. Name-based heuristic: works for the seeded defaults
// and degrades to the "other" plus mark for user-created categories.
export function categoryIcon(name, cls = '') {
  const n = String(name || '').toLowerCase();
  if (n.includes('knife') || n.includes('knives')) return icon('knife', cls);
  if (n.includes('sword')) return icon('sword', cls);
  if (n.includes('razor')) return icon('razor', cls);
  if (n.includes('axe') || n.includes('hawk')) return icon('axe', cls);
  return icon('other', cls);
}

// Shared test: is this category the knife category (drives knife_type UI)?
export function isKnifeCategory(name) {
  const n = String(name || '').toLowerCase();
  return n.includes('knife') || n.includes('knives');
}
