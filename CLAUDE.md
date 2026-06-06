# Axly.com — Website

## Project Context
Public marketing/portfolio site for Axly's Customs. Creative, maker-driven, AI-forward brand — NOT an MSP/IT site. The full redesign shipped 2026-04-10; this repo is now in **ongoing maintenance + content mode** (blog posts, tweaks, occasional new sections). Original redesign PRD: `axly-redesign-PRD.md`.

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
- `main` = production. GitHub Pages auto-deploys to axly.com on every push.
- Work happens **directly on `main`** (solo, no PR review). Commit + push when Mike says so.
- `pre-redesign` tag = rollback point for the original redesign. The `redesign` branch is historical (already merged).
- Preview locally: `python -m http.server 8099`, then browse the page. No branch preview URLs.

## Critical Safety Rules
- **goldmine/index.html** — READ ONLY. Do not modify. (Goldmine backend lives in a separate repo, out of scope.)
- **thothai/** — leave alone.
- **All existing SEO** — meta, schema, OG tags, canonical URLs, sitemap — preserve exactly.
- **JS fetch mechanisms** — preserve the `posts.json`, `images.json`, and `stats.json` client-side fetches in `js/main.js`.
- The blog **is** actively maintained now (see Blog Publishing Workflow). It is no longer frozen — but follow the workflow and don't break the fetch mechanism.

## Blog Publishing Workflow
Adding a post touches **5 spots** (3 tracked content locations + 2 static-render spots):
1. `blog/<slug>/index.html` — standalone page from the existing template (Geist font, light/dark toggle, BlogPosting JSON-LD, OG/canonical/Twitter meta, CTA).
2. `blog/posts.json` — `{slug, title, date, excerpt, tags}` entry (source of truth for the JS).
3. `sitemap.xml` — a `<url>` entry.
4. `blog/index.html` — a **static** `<a class="post-card">` card (newest-first). The listing must NOT be JS-only; non-JS crawlers / AI answer engines need it.
5. `index.html` homepage teaser — a **static** `blog-item`, IF the post is among the 3 newest.
- Draft markdown is staged in `tasks/blog-drafts/` (gitignored, local-only — never deploys).
- Backdate publish dates so posts don't look dumped on the same day.

## Brand Tokens
- Dark-only design (deep navy backgrounds). No light-mode toggle on the main site (the blog subsection has its own).
- **Steel-blue primary** accent (buttons, links, CTAs); **hot-pink secondary**, used sparingly for high-impact moments.
- Chrome/metal accents from the logo.
- Fonts: **Saira** (display) + **Lexend** (body) on the main site; the **blog** uses **Geist**.
- CSS custom properties (OKLCH) for all colors — no hardcoded values.
- No emoji — custom chrome/metallic graphics instead.

## Copy Rules
- First person singular ("I build") except the web design section ("we").
- No buzzwords: leverage, synergy, cutting-edge, revolutionize.
- Contractions fine — not corporate copy.
- Preserve existing copy (refine, don't rewrite).
- **Em-dash rule:** BLOG posts contain ZERO em-dashes (use commas) so they read hand-written. The REST of the site deliberately KEEPS its em-dashes as an "I use AI" signal. Do not "fix" em-dashes outside the blog.

## File Map
```
/
├── index.html              ← Homepage (~11 sections; static blog teaser + JS hydration)
├── css/style.css           ← Token-based CSS (OKLCH)
├── js/main.js              ← Theme, scroll reveals, posts.json/images.json/stats.json fetches, anti-scrape contact
├── webdesign/index.html    ← Service page (Web3Forms intake) + thank-you/
├── blog/                   ← index.html (static list + JS) + posts.json + <slug>/index.html per post
├── admin.html              ← Dark-themed admin
├── goldmine/index.html     ← DO NOT TOUCH
├── thothai/                ← LEAVE ALONE
├── gallery/                ← Image gallery
└── images/                 ← Site assets (images/GImages/ = gitignored local icon backups)
```
Wallpapers (`wallpapers.axly.com`) is an external subdomain, a separate property — not in this repo.

## Local-only (gitignored) folders
- `tasks/blog-drafts/` — raw blog draft markdown.
- `images/GImages/` — backup/source copies of the site icons (already wired into `/images/` under final names). Leave alone; nothing references them.

## Logo
- PNG only for now (SVG coming later). Use as-is, do not alter.

## Useful Skills
- `/seo` — any new/modified page (blog posts especially)
- `/polish`, `/critique` — before shipping visual changes

## Lessons
See `tasks/lessons.md` for corrections and patterns.
