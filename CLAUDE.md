# Axly.com — Site Redesign

## Project Context
Full aesthetic redesign of axly.com + new /webdesign/ service page.
This is NOT an MSP/IT site. Brand is creative, maker-driven, AI-forward.
PRD: `axly-redesign-PRD.md`

## Stack (locked)
- **HTML / CSS / JS** — no frameworks, no build steps
- **Cloudflare Pages** — static hosting via GitHub (main branch = production)
- **Web3Forms** — contact form backend for /webdesign/ intake
- **Google Fonts** — loaded async with display=swap

## Branch Strategy
- `main` = production (auto-deploys to axly.com)
- `redesign` = all work happens here (Cloudflare generates preview URL)
- `pre-redesign` tag = rollback point
- Merge to main only when approved by Mike

## Critical Safety Rules
- **goldmine/index.html** — READ ONLY. Do not modify.
- **Goldmine backend** — lives in separate repo. Not in scope.
- **All existing SEO** — meta, schema, OG tags, canonical URLs, sitemap — preserve exactly
- **blog/posts.json** + blog post pages — do not modify
- **stats.json fetch** + **blog preview fetch** — preserve these JS mechanisms
- **thothai/** — leave alone for now (revisit after redesign is complete)

## File Architecture (new)
```
/
├── index.html              ← Redesigned homepage
├── css/style.css           ← Extracted, token-based CSS
├── js/main.js              ← Extracted JS (theme, blog fetch, stats fetch, scroll reveals)
├── webdesign/
│   ├── index.html          ← NEW service page
│   └── thank-you/
│       └── index.html      ← NEW form confirmation
├── admin.html              ← Light refresh to match new design
├── goldmine/index.html     ← DO NOT TOUCH
├── gallery/index.html      ← Light refresh later if needed
├── thothai/                ← DO NOT TOUCH (for now)
├── blog/                   ← DO NOT TOUCH content; homepage teaser redesigned
└── [everything else stays]
```

## Brand Tokens
- Dark-first design (deep navy backgrounds)
- Chrome/metal accents from logo
- Hot pink accent, steel blue secondary
- Bold display font (NOT Inter/Roboto/Arial)
- CSS custom properties for all colors — no hardcoded values

## Copy Rules
- First person singular ("I build") except web design section ("we")
- No buzzwords: leverage, synergy, cutting-edge, revolutionize
- Contractions fine — not corporate copy
- Preserve all existing copy (refine, don't rewrite)

## Skills to Use
- `/shape` — design brief before coding
- `/impeccable` — throughout build
- `/polish` — after each major section
- `/audit` — before final review
- `/overdrive` — hero sections
- `/critique` — full-page review before handoff
- `/seo` — all new/modified pages

## Logo
- PNG only for now (SVG coming later)
- Use as-is, do not alter

## Lessons
See `tasks/lessons.md` for corrections and patterns.
