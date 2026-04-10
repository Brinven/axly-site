# axly.com — Site Redesign PRD
**Axly's Customs**
**Project:** Full site redesign + Web Design service page addition
**Prepared for Claude Code**

---

## Overview

axly.com is the primary brand hub for Axly's Customs — a one-person creative/maker workshop building AI tools, digital art, and web design services. The current site has solid copy and SEO groundwork but lacks visual design quality and is missing the Web Design service entirely. This project is a full aesthetic overhaul plus a new service section.

**This is NOT an MSP/IT site.** Managed IT and corporate tech services belong to TOBS Houston (separate domain, separate project, future work). axly.com's brand is creative, maker-driven, and AI-forward.

---

## Brand Identity

**Name:** Axly's Customs
**Domain:** axly.com
**Tagline:** "Tools That Put AI to Work"
**Voice:** Direct, curious, slightly irreverent. One person building real things. No VC-speak, no enterprise fluff.
**Audience:** Developers, researchers, creators, small business owners, AI enthusiasts
**Tone:** Like a smart friend who builds cool stuff and tells you about it straight

**Brand Colors (existing — preserve these):**
- Pull from the Axly's Customs logo (chrome/metal aesthetic with hot pink and steel blue)
- Deep navy, hot pink accent, steel blue secondary, light off-white backgrounds
- These are established — do not reinvent the palette

**NOT the brand:** Corporate, enterprise, purple gradients, Inter font everywhere, generic card layouts, stock photo hero shots

---

## Current State Assessment

**What exists:**
- Single long-scrolling homepage covering all products/services
- Sections: About, Products (Goldmine, ThothAI), Creative (art/commissions), Blog teaser
- Footer with nav links
- SEO groundwork recently completed (meta, schema, sitemap, etc.) — **preserve all SEO work**
- Hosted on GitHub Pages (DNS through Cloudflare), backed by GitHub repo

**What's missing:**
- Web Design service — not on the site at all
- Visual design quality — reads like a well-written README, not a product site
- Clear visual hierarchy — everything has equal weight, eye has nowhere to go
- Strong aesthetic direction — no memorable design identity
- Intake/contact mechanism for web design clients

**What to keep:**
- All existing copy (it's good — refine don't rewrite)
- All SEO meta, schema markup, canonical URLs, sitemap
- Site structure on Cloudflare — don't change hosting
- All existing product sub-pages (ThothAI at /thothai/, gallery at /gallery/, etc.)
- Blog at /blog/

---

## Site Architecture

### Pages (Revised)

```
axly.com/                    ← Homepage (redesigned)
axly.com/webdesign/          ← NEW: Web Design service page
axly.com/thothai/            ← Existing (light refresh only)
axly.com/gallery/            ← Existing (light refresh only)
axly.com/blog/               ← Existing (no changes)
```

### Homepage Section Order (Revised)

1. **Hero** — strong visual statement, tagline, primary CTAs
2. **Services strip** — quick visual nav to the four pillars (Web Design, Goldmine, ThothAI, Art)
3. **Web Design** — new section, prominent, with link to /webdesign/
4. **Goldmine / Pickaxe / Shovel** — existing product section, redesigned
5. **ThothAI** — existing product section, redesigned
6. **Digital Art** — existing creative section, redesigned
7. **About** — brief, personal, authentic
8. **Footer** — nav, socials, copyright

---

## New Page: /webdesign/

This is the priority new addition. It should feel like a confident service offering, not an afterthought.

### Page Sections

**1. Hero / Value Prop**
- Headline: Something in the spirit of "Your Business Deserves a Real Website"
- Sub: Fast, professional, local-business-focused web design. Built clean, launched fast, looks like you paid a lot more.
- Primary CTA: "Get Started" → scrolls to intake form
- Secondary CTA: "See What We Build" → could link to CityWide demo or similar

**2. What You Get**
- 4–5 clear deliverables: Custom design, Mobile-first build, Domain + hosting setup, Email setup, Ongoing updates
- Not a features list — frame as outcomes ("Your site will load fast and look great on every phone")

**3. How It Works**
- Simple 4-step process: Fill out the form → We talk → You get a design → We launch
- Make it feel easy and low-friction — target audience is non-technical small business owners

**4. Pricing Tiers** ← Publish these openly
Display as clean pricing cards. Three tiers:

**Base Site — $1,500**
- Up to 5 pages (Home, Services, About, Contact, Thank You)
- Custom design built from your branding
- Mobile-first, fast-loading, clean code
- Contact form (Web3Forms)
- Domain + Cloudflare hosting setup
- LocalBusiness SEO schema + sitemap
- 1 year hosting included ($250/yr after that)

**+ Email Setup** (add-on, not a separate tier)
- Cloudflare Email Routing (forwarding only): included free
- Zoho Mail up to 5 mailboxes (IMAP/POP, works with any email client): $75 setup, ~$12/mo after free tier
- Google Workspace or Microsoft 365: $12/user/month (billed through provider) + $50 setup fee

**Custom / Larger Projects**
- More pages, booking integrations, e-commerce, custom features
- "Contact us for a quote" — no fixed price displayed

Note for CC: Display pricing honestly and plainly. No dark patterns, no "starting at" bait. The $1,500 is the real base price for a real site.

**5. Intake Form** ← Critical feature
- Embedded directly on the page (not a link to a PDF)
- Web3Forms backend (same as client sites)
- Fields mapped from the intake questionnaire:
  - Business name
  - Your name + contact info (phone, email)
  - What does your business do?
  - How many pages do you need?
  - Do you have a logo? (yes / no / need one)
  - Do you have a domain? (yes / no)
  - What's your timeline?
  - Tell us about your project (open textarea)
- This is a *shorter* version of the full questionnaire — captures enough to have the first conversation
- Full questionnaire (DOCX) offered as download for those who want to go deeper
- Submissions go to Mike's email via Web3Forms

**6. Footer CTA**
- Phone number, email, "or just send us a message"

---

## Design Direction for CC

### Before writing any code:
1. Run `/impeccable teach` to establish project design context
2. Run `/shape` to work through the design brief for the homepage and /webdesign/ page
3. Use `/audit` after initial build to catch anti-patterns before finalizing
4. Use `/polish` on completed sections before marking done
5. Use `/overdrive` selectively on hero sections for maximum visual impact

### Aesthetic Direction
- **Dark-first** — deep navy/dark backgrounds with light text. The logo and brand colors suit dark mode naturally.
- **Chrome/metal accents** — consistent with the Axly's Customs logo aesthetic
- **Bold typography** — strong display font, clear hierarchy. No Inter. No system fonts.
- **Asymmetric layouts** — break the card grid. Not everything should be 3 equal columns.
- **Motion** — subtle scroll-triggered reveals, one strong hero animation. Not everywhere — high impact moments only.
- **No purple gradients. No cardocalypse. No generic AI aesthetic.**

### Anti-patterns to explicitly avoid (Impeccable will catch these):
- Purple gradients on white
- Inter/Roboto/Arial as display fonts
- Nested cards inside cards
- Every section the same 3-column grid
- Stock photo hero
- Generic "hero with headline + two buttons + mockup" layout

---

## Technical Requirements

### Stack (do not change)
- GitHub Pages for static hosting (main branch, custom domain via CNAME)
- DNS managed through Cloudflare (proxy/CDN only — hosting is GitHub Pages)
- GitHub repo for source control (CC has access)
- Goldmine backend is a SEPARATE repo with its own Cloudflare Workers/D1/KV — not in this repo

### New Technical Additions
- Web3Forms integration for /webdesign/ intake form
  - Web3Forms access key: **[Mike to add before launch]**
  - Redirect to: axly.com/webdesign/thank-you/
- /webdesign/thank-you/ page (simple, branded, links back to homepage)

### SEO — Preserve Everything
- All existing meta descriptions, OG tags, canonical URLs stay intact
- New pages need their own unique meta:
  - /webdesign/: "Professional website design for small businesses in the Houston area — Axly's Customs. Fast, clean, mobile-first. Get a free quote."
- Add /webdesign/ to sitemap.xml
- Add LocalBusiness or Service schema to /webdesign/ page

### Performance
- Target: 90+ PageSpeed Insights mobile on all pages
- All images WebP format
- Fonts preconnected, loaded async with display=swap
- No render-blocking resources

---

## Skills to Use

CC should load and apply these skills for this project:

1. **Impeccable** (`/impeccable teach` first, then commands throughout)
   - `/shape` — design brief before coding homepage and /webdesign/
   - `/polish` — after each major section
   - `/audit` — before final review
   - `/overdrive` — hero sections
   - `/critique` — full-page review before handoff

2. **SEO skill** — apply to all new and modified pages

3. **VibeWebDev skill** (axly.com/webdesign/ page) — the /webdesign/ page follows the same static HTML/CSS/JS principles as client sites, treat it like a service landing page

---

## Content Notes for CC

### Copy Tone Reminders
- First person singular ("I build" not "we build") — this is a one-person shop
- Exception: "we" is fine in the web design section where Mike works with clients
- No buzzwords: "leverage", "synergy", "cutting-edge", "revolutionize"
- Contractions are fine — this isn't corporate copy
- The About section should feel like a real person wrote it

### Placeholder Handling
- If product screenshots/mockups are needed: create clearly labeled placeholders `[ Pickaxe screenshot — 1200x800 ]`
- Do not use Lorem Ipsum anywhere — flag missing content explicitly
- Mike will provide: updated hero image, any new product screenshots

### Logo
- Existing Axly's Customs logo is in the repo
- Use as-is — do not redesign or alter

---

## Out of Scope (This Project)

- MSP / IT services / TOBS Houston content — not on this site
- Changes to Goldmine D1 database, Workers logic, or Pickaxe/Shovel functionality
- New blog posts
- Gallery additions
- ThothAI page rebuild (light CSS refresh only if needed for consistency)
- Mobile app store listings

---

## Definition of Done

- [ ] Homepage redesigned — all sections present, new visual direction applied
- [ ] /webdesign/ page live with intake form functional
- [ ] /webdesign/thank-you/ page exists and form redirects correctly
- [ ] Form submissions arriving at Mike's email
- [ ] All existing SEO preserved (meta, schema, sitemap, canonicals)
- [ ] /webdesign/ added to sitemap.xml
- [ ] PageSpeed Insights 90+ mobile on homepage and /webdesign/
- [ ] Impeccable `/audit` passes with no critical findings
- [ ] Tested on mobile (375px) and desktop (1440px)
- [ ] All links working — no 404s
- [ ] Merged to main — GitHub Pages auto-deploys
- [ ] Live at axly.com

---

## Pre-Flight Checklist for CC (Before Starting)

All open questions resolved. Do these before writing any code:

1. **Pricing** ✅ — Resolved. Publish openly. See /webdesign/ pricing section above.

2. **Web3Forms key** — Mike to sign up at web3forms.com and paste key into the form before launch. CC should insert `YOUR_WEB3FORMS_KEY` as placeholder and leave a clear comment in the HTML.

3. **"See What We Build" portfolio section** — Do NOT build yet. Leave a commented-out placeholder block in the HTML: `<!-- PORTFOLIO SECTION: Add when 3+ client sites are live -->`. When ready, this section will show 3–6 demo sites including: real client sites (CityWide Landscape, etc.) + purpose-built demo sites for common niches (BBQ restaurant, Mexican food, handmade craft shop, etc.) — these will be built specifically to showcase range, not padding.

4. **Hero** ✅ — Design-only hero. No photo. Strong typography + geometric/abstract elements consistent with the chrome/metal brand aesthetic. Use `/overdrive` here.

5. **Blog** ✅ — Keep the blog teaser section. Site has 4 posts. The fetch didn't render them because they load dynamically. Keep the section, ensure it pulls and displays correctly.

6. **Impeccable install** — Run this in the project root before starting:
   ```bash
   npx skills add pbakaus/impeccable
   ```
   Then verify it appears in CC with `/impeccable teach`. If the plugin marketplace shows it, update it there too. Do not proceed with design work until Impeccable is confirmed loaded.

---

*PRD prepared in claude.ai session — April 2026*
*Ready to hand to Claude Code once open questions are resolved*
