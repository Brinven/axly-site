# SKILL: Small Business Website (VibeWebDev)
**Axly's Customs — VibeWebDev Pipeline**

Use this skill when building a static HTML/CSS/JS website for a small business client. This covers the full pipeline from intake through Cloudflare Pages deployment. Read this entirely before writing any code.

---

## Stack (Non-Negotiable)

- **HTML / CSS / JS** — no frameworks, no build steps, no dependencies
- **Hosting** — Cloudflare Pages (free tier) via GitHub repo
- **Forms** — Web3Forms (free tier, no backend required)
- **Fonts** — Google Fonts (loaded async, preconnect in `<head>`)
- **Icons** — Phosphor Icons CDN or inline SVG only
- **Images** — WebP format, lazy-loaded, explicit width/height to prevent CLS
- **No WordPress. No React. No npm. No build tools.**

---

## Phase 1: Intake PRD

Before any design or code work, produce a `PRD.md` in the project root capturing:

```
# [Client Name] — Website PRD

## Business Info
- Business Name:
- Location (city/neighborhood):
- Industry / Services:
- Target Customer:
- Tone (professional / friendly / rustic / upscale / etc.):

## Existing Assets
- Logo: [have it / need it / rough version]
- Brand colors: [hex values or description]
- Photos: [client-provided / stock needed / none]
- Social media presence: [links if any]

## Site Goals
- Primary CTA: [call us / book online / visit us / request quote]
- Secondary goals:

## Pages Required
- [ ] Home (always)
- [ ] About
- [ ] Services / Menu / Gallery
- [ ] Contact
- [ ] Other:

## Special Features
- [ ] Contact form
- [ ] Google Maps embed
- [ ] Photo gallery / lightbox
- [ ] Testimonials section
- [ ] Business hours display
- [ ] Social links

## Competitors to Reference
(sites the client admires or wants to outperform)

## Content Ownership
- Who writes copy: [us / client]
- Photo delivery deadline:
- Approval contact:

## Hosting & Domain
- Domain: (existing / needs purchase)
- DNS managed by: (registrar name)
- Cloudflare Pages project name:
```

**Do not proceed to design until the PRD is populated.** If information is missing, flag it explicitly rather than assuming.

---

## Phase 2: Branding

### If client has no logo
- Use the Axly's Customs logo generation workflow to create one before building the site.
- Deliver logo as SVG (primary) + PNG fallback.
- Establish palette from logo colors.

### Brand Token Sheet
Before writing CSS, define all brand tokens. Create `brand.md` or document in `style.css` header:

```css
/* === BRAND TOKENS ===
   Client: [Name]
   Primary:    #______  (main brand color)
   Secondary:  #______  (accent / CTA)
   Dark:       #______  (backgrounds, text)
   Light:      #______  (backgrounds, text)
   Neutral:    #______  (borders, muted text)
   
   Display Font: [Name] — used for headings
   Body Font:    [Name] — used for paragraphs/UI
   
   Border Radius: [px or rem]
   Transition:    0.2s ease
*/

:root {
  --color-primary:   #______;
  --color-secondary: #______;
  --color-dark:      #______;
  --color-light:     #______;
  --color-neutral:   #______;
  --font-display:    '[Font Name]', serif;
  --font-body:       '[Font Name]', sans-serif;
  --radius:          [value];
  --transition:      0.2s ease;
  --max-width:       1200px;
  --section-pad:     clamp(3rem, 8vw, 6rem);
}
```

**Never hardcode colors or fonts outside of CSS variables.** Every color in the site must reference a `var(--color-*)` token.

---

## Phase 3: File Structure

```
/[client-slug]/
├── index.html
├── about.html          (if applicable)
├── services.html       (or menu.html / gallery.html)
├── contact.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── images/
│   ├── logo.svg
│   ├── logo.png
│   ├── hero.webp
│   └── [others].webp
├── favicon.ico
├── favicon.svg
├── robots.txt
├── sitemap.xml
└── PRD.md
```

---

## Phase 4: HTML Conventions

### `<head>` Template (every page)
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="[150 chars max, unique per page]">
<meta name="robots" content="index, follow">

<!-- Open Graph -->
<meta property="og:title" content="[Page Title] | [Business Name]">
<meta property="og:description" content="[Same as meta description]">
<meta property="og:image" content="/images/og-image.webp">
<meta property="og:type" content="website">
<meta property="og:url" content="https://[domain]/[page]">

<!-- Canonical -->
<link rel="canonical" href="https://[domain]/[page]">

<!-- Fonts (preconnect first) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="[google fonts url]" rel="stylesheet">

<!-- CSS -->
<link rel="stylesheet" href="/css/style.css">

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/x-icon" href="/favicon.ico">

<title>[Page Title] | [Business Name] — [City, State]</title>
```

### Semantic HTML Rules
- Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` correctly
- Every section gets an `id` for anchor linking and SEO
- Every image gets `alt`, `width`, `height`, and `loading="lazy"` (except hero — use `loading="eager"`)
- One `<h1>` per page — on the home page it's the business name or primary value prop
- Heading hierarchy: h1 → h2 → h3 (never skip levels)
- CTAs use `<a>` tags, not `<button>`, when they navigate
- Phone numbers: `<a href="tel:+1XXXXXXXXXX">`
- Addresses: wrap in `<address>` tag

---

## Phase 5: CSS Conventions

### Layout
```css
/* Container */
.container {
  width: 90%;
  max-width: var(--max-width);
  margin-inline: auto;
}

/* Sections */
section {
  padding-block: var(--section-pad);
}

/* Grid helpers */
.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
.grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; }
```

### Responsive
- Mobile-first. Base styles are mobile. Use `min-width` media queries upward.
- Breakpoints: `640px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl)
- Use `clamp()` for fluid type sizes and spacing
- Test at 320px, 375px, 768px, 1024px, 1440px

### Typography Scale
```css
--text-xs:   clamp(0.75rem,  1.5vw, 0.875rem);
--text-sm:   clamp(0.875rem, 1.8vw, 1rem);
--text-base: clamp(1rem,     2vw,   1.125rem);
--text-lg:   clamp(1.125rem, 2.5vw, 1.25rem);
--text-xl:   clamp(1.25rem,  3vw,   1.5rem);
--text-2xl:  clamp(1.5rem,   4vw,   2rem);
--text-3xl:  clamp(2rem,     5vw,   3rem);
--text-4xl:  clamp(2.5rem,   6vw,   4rem);
```

---

## Phase 6: Standard Sections

Build these from scratch per-project using brand tokens. Never recycle layouts verbatim — each client site must feel unique.

### Nav
- Logo left, links right (hamburger on mobile)
- Sticky on scroll with subtle shadow
- Active page link visually indicated
- CTA button in nav (call / book / contact)
- Mobile menu: full-screen overlay or slide-in drawer

### Hero
- Above the fold — no scroll required to see primary CTA
- Business name as `<h1>` or prominent display text
- Tagline (one sentence, what they do + who they serve)
- Primary CTA button
- Hero image: WebP, `loading="eager"`, covers or fills without distortion
- For service businesses: consider a photo of actual work, not stock

### Services / What We Do
- 3–6 cards with icon + heading + 1-2 sentence description
- If applicable: pricing tier or "starting at $X"

### Why Choose Us / About Teaser
- 3 differentiators (trust signals, years experience, local, etc.)
- Photo of owner/team humanizes the business significantly

### Testimonials
- 3 real reviews minimum
- Star rating visual, reviewer name, optional photo
- If pulling from Google Reviews: quote them in the copy with attribution

### CTA Banner
- Full-width section, high contrast
- One action: call, book, or contact
- Phone number large and clickable

### Footer
- Logo + tagline
- Nav links repeated
- Address (schema-marked)
- Phone + email
- Social icons
- Hours (if applicable)
- Copyright + year (JS-generated so it never goes stale)
- "Website by Axly's Customs" with link to axly.com (unless client opts out)

---

## Phase 7: Contact Form (Web3Forms)

```html
<form action="https://api.web3forms.com/submit" method="POST">
  <input type="hidden" name="access_key" value="[CLIENT_WEB3FORMS_KEY]">
  <input type="hidden" name="subject" value="New inquiry from [Business Name] website">
  <input type="hidden" name="redirect" value="https://[domain]/thank-you.html">
  <input type="checkbox" name="botcheck" style="display:none">

  <div class="form-group">
    <label for="name">Name</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div class="form-group">
    <label for="phone">Phone</label>
    <input type="tel" id="phone" name="phone">
  </div>
  <div class="form-group">
    <label for="message">Message</label>
    <textarea id="message" name="message" rows="5" required></textarea>
  </div>
  <button type="submit">Send Message</button>
</form>
```

- Always include a `thank-you.html` page the form redirects to
- Web3Forms free tier: 250 submissions/month per access key
- Each client gets their own Web3Forms account and key (free, email signup)

---

## Phase 8: SEO Checklist

Apply the SEO skill in full. Key requirements:

- [ ] Unique `<title>` on every page (format: `[Page] | [Business] — [City, State]`)
- [ ] Unique meta description on every page (120–150 chars)
- [ ] `robots.txt` present and correct
- [ ] `sitemap.xml` present with all page URLs
- [ ] LocalBusiness schema on homepage (JSON-LD in `<script>` tag)
- [ ] NAP (Name, Address, Phone) consistent and in footer on every page
- [ ] Google Maps embed on contact page
- [ ] Images have descriptive alt text (not "image1.webp")
- [ ] Page load time target: < 2s on mobile (check with PageSpeed Insights)
- [ ] No broken links
- [ ] Canonical URLs set correctly

### LocalBusiness JSON-LD (homepage)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[Business Name]",
  "description": "[Short description]",
  "url": "https://[domain]",
  "telephone": "[phone]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[street]",
    "addressLocality": "[city]",
    "addressRegion": "[state]",
    "postalCode": "[zip]",
    "addressCountry": "US"
  },
  "openingHours": ["Mo-Fr 09:00-17:00"],
  "image": "https://[domain]/images/og-image.webp",
  "priceRange": "$$"
}
</script>
```

---

## Phase 9: Performance

- [ ] All images converted to WebP
- [ ] Images explicitly sized (no layout shift)
- [ ] Google Fonts loaded with `display=swap`
- [ ] CSS minified for production (can be a single `style.min.css`)
- [ ] JS deferred: `<script src="/js/main.js" defer></script>`
- [ ] No render-blocking resources
- [ ] Favicon exists (both `.ico` and `.svg`)

---

## Phase 10: Deployment (Cloudflare Pages)

### Per-Client Setup
1. Create GitHub repo: `[client-slug]-website` (private)
2. Push site files to `main` branch
3. Connect repo to Cloudflare Pages in the Cloudflare dashboard
4. Set custom domain (client's domain) in Pages settings
5. Update client's DNS to point to Cloudflare Pages (provide nameserver or CNAME records)

### For Future Updates
```bash
# Make changes locally
git add .
git commit -m "Update services page copy"
git push origin main
# Cloudflare auto-deploys within ~60 seconds
```

### Branch Preview
Cloudflare Pages auto-generates a preview URL for every branch. Use a `dev` branch for staging changes before pushing to `main`.

---

## Phase 11: Project File Naming Convention

```
[clientslug]-website/          # GitHub repo name
[ClientName]_PRD.md            # Intake doc
[ClientName]_brand.md          # Brand tokens doc
```

Client slugs: lowercase, hyphenated, no spaces. Example: `sunrise-plumbing`, `joes-bbq`, `magnolia-pet-clinic`

---

## Quality Gates (Do Not Ship Without)

These are checked during the **build phase** — before the site is shown to the client for review.

- [ ] Renders correctly on mobile (375px) and desktop (1440px)
- [ ] All links work (no 404s)
- [ ] Form submits and redirects to thank-you page
- [ ] Phone number is clickable (tel: link)
- [ ] Address links to Google Maps
- [ ] Page titles and meta descriptions are unique per page
- [ ] LocalBusiness schema present on homepage
- [ ] All images have alt text
- [ ] Footer copyright year is current (JS-generated)
- [ ] "Website by Axly's Customs" credit in footer
- [ ] PageSpeed Insights score: 90+ mobile

---

## Asset Collection Checklist

**Flag these as blockers in the PRD if not yet received. Do not use Lorem Ipsum or placeholder text — flag missing content explicitly and hold the build until resolved.**

### Must Have Before Build
- [ ] Logo file (SVG preferred, PNG acceptable — transparent background)
- [ ] Business name (exact legal/trading name as it should appear)
- [ ] Phone number(s) — confirm which is primary
- [ ] Physical address (for footer, schema, and Maps embed)
- [ ] Email address (for contact form destination)
- [ ] Service list (exact services offered — business card is a great source)
- [ ] Service area (cities/neighborhoods served)

### Must Have Before Launch
- [ ] Hero image — wide landscape/action shot of actual work (not stock)
- [ ] Team or owner photo (even a good phone photo beats none)
- [ ] At least 3 additional job photos for gallery or service sections
- [ ] **Web3Forms access key** — see Web3Forms Client Setup section below
- [ ] Google Maps embed URL (generated from Google Maps for their address)
- [ ] Client has reviewed and approved all copy

### Nice to Have
- [ ] Google Business Profile link (for reviews and schema)
- [ ] Yelp listing link
- [ ] Social media profile URLs (Facebook, Instagram, etc.)
- [ ] Tagline or slogan (check business card — often already exists)
- [ ] Testimonials / review quotes (3 minimum if used)
- [ ] Community involvement details (local organizations, church, sponsorships)
- [ ] Business hours

**Pro tip:** Always ask for a photo of their business card upfront. It often contains name, address, phone, email, services, and tagline in one shot.

---

## Launch Checklist

The build checklist and launch checklist are two separate moments. The build is done when the code is clean. The launch is done when everything below is confirmed.

**This checklist is for Mike to run through manually — not CC.**

### Content & Assets
- [ ] All placeholder images replaced with real client photos
- [ ] No `[ placeholder ]` text remaining anywhere on any page
- [ ] All copy reviewed and approved by client
- [ ] Tagline confirmed correct
- [ ] Both phone numbers verified as active
- [ ] Email address verified as active

### Forms & Integrations
- [ ] Client has completed Web3Forms signup (send them the Web3Forms Client Setup guide)
- [ ] Client has replied with their access key
- [ ] Web3Forms access key inserted into contact form (`YOUR_ACCESS_KEY` replaced)
- [ ] Web3Forms account is under client's email — NOT Mike's
- [ ] Form tested end-to-end — test submission received at client's email
- [ ] Client has confirmed they received the test email
- [ ] Thank-you page redirect working correctly
- [ ] Botcheck field confirmed hidden

### Maps
- [ ] Google Maps embed replaced with real embed URL (not placeholder coordinates)
- [ ] Address in embed matches address in footer and schema exactly

### SEO & Schema
- [ ] LocalBusiness JSON-LD verified — all fields populated, no placeholders
- [ ] `sitemap.xml` updated with correct domain URLs (not localhost or example.com)
- [ ] `robots.txt` correct — `thank-you.html` set to noindex
- [ ] All canonical URLs pointing to live domain
- [ ] OG image (`og-image.webp`) created and uploaded

### DNS & Hosting
- [ ] GitHub repo created (`[client-slug]-website`, private)
- [ ] Cloudflare Pages project connected to repo
- [ ] Custom domain added in Cloudflare Pages settings
- [ ] Client's domain DNS updated (nameservers or CNAME pointing to Cloudflare Pages)
- [ ] SSL certificate issued and active (Cloudflare does this automatically — verify it's showing)
- [ ] Site loads correctly at `https://[domain]` (not just the Cloudflare Pages preview URL)
- [ ] `www` redirect configured (www → non-www or vice versa, consistently)

### Final QA on Live URL
- [ ] Load site on a real mobile phone (not just browser dev tools)
- [ ] Click every navigation link
- [ ] Click the phone number on mobile — confirm it dials
- [ ] Submit the contact form — confirm email received
- [ ] Check all images loaded (no broken image icons)
- [ ] Run PageSpeed Insights on the live URL (target: 90+ mobile)
- [ ] Confirm no console errors in browser dev tools

### Handoff
- [ ] Client has Cloudflare account login credentials
- [ ] Client has Web3Forms account login credentials
- [ ] Client has domain registrar login credentials
- [ ] Hosting invoice / first year payment collected
- [ ] "Website by Axly's Customs" credit confirmed in footer
- [ ] Note any future change requests and scope them separately

---

## Notes for CC

- Read the full PRD before writing any code
- Establish brand tokens before writing CSS
- Apply the `frontend-design` skill for aesthetic direction — each site must feel unique, not templated
- Apply the `SEO` skill for all on-page SEO decisions
- Do not use placeholder content ("Lorem ipsum") — flag missing content explicitly and list what is needed
- Do not hardcode colors — all colors use CSS variables
- Do not use JavaScript for anything achievable in pure CSS
- Commit message format: `[client-slug] — [what changed]`
- If photos are missing, insert clearly labeled placeholder divs with the required dimensions and descriptive text (e.g. `[ Hero image — wide landscape shot, 1440x800 ]`) so Mike knows exactly what to swap in
- Business cards are often the best single source of truth for small business info — always ask for one
