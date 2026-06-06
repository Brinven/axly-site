# Axly.com — Site Redesign

## Project Context
Full aesthetic redesign of axly.com + new /webdesign/ service page.
This is NOT an MSP/IT site. Brand is creative, maker-driven, AI-forward.
PRD: `axly-redesign-PRD.md`

## Stack (locked)
- **HTML / CSS / JS** — no frameworks, no build steps
- **GitHub Pages** — static hosting from `main` branch, custom domain via CNAME
- **DNS through Cloudflare** — but hosting is GitHub Pages, NOT Cloudflare Pages
- **Web3Forms** — contact form backend for /webdesign/ intake
- **Google Fonts** — loaded async with display=swap

## Memory
Persistent memory for this project routes as follows:
- **Hindsight bank `axly-site`** — durable project facts: stack/hosting, the blog publishing workflow, brand/design tokens, SEO + content conventions, and off-limits rules. Check this bank at the start of a session and retain new project facts here. **This is the bank claude.ai can read.**
- **Ib** — personal/relational context and Mike's working preferences (e.g., the *why* behind the blog em-dash convention).
- **Hindsight bank `axly-infra`** — cross-project infra only (pm2, ports, Cloudflare DNS, Tailscale).
- **Claude Code local file-memory** (`~/.claude/projects/G--AxlyGitHub-axlyapps-axly-site/memory/*.md`) — working notes for this CC instance. NOT visible to claude.ai, so anything claude.ai needs must also live in `axly-site` or Ib.

Don't duplicate across stores. Skip anything reachable via `git log`.

## Branch Strategy
- `main` = production (GitHub Pages auto-deploys to axly.com)
- `redesign` = all work happens here
- `pre-redesign` tag = rollback point
- Preview via local server (`python -m http.server 8080`) — no branch preview URLs
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
