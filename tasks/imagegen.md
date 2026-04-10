# Axly.com Redesign — Image Generation Guide

All graphics should match the Axly's Customs brand aesthetic: **chrome/metallic finish, angular details echoing the logo's wing motifs, deep navy or transparent backgrounds**. Think brushed steel, not flat icons.

---

## Priority 1 — Needed Before Launch

### 1. Axly's Customs Logo (web-ready)
- **Where used:** Nav bar, hero section, favicon source
- **Format:** PNG with transparent background (SVG preferred if possible)
- **Size:** 512x512 minimum (will be displayed at various sizes from 40px to 140px)
- **Notes:** The existing wing/chrome logo works — just need a clean file with transparent background, not the white background version. Square crop preferred.

### 2. Service Icons (×4)
- **Where used:** Services strip on homepage
- **Size:** 192x192 (displayed at 96px, need 2x for retina)
- **Format:** PNG with transparent background
- **Style:** Chrome/metallic, angular, minimal detail at small size. Each should be instantly recognizable at 96px.

| Icon | Subject | Visual Direction |
|------|---------|-----------------|
| **Web Design** | Browser window with code/design elements | Chrome browser frame, maybe a cursor or paintbrush element. Should read as "we build websites." |
| **Goldmine** | Already have logo — skip unless you want a simplified icon version | Could use existing goldmine-logo.png as-is |
| **ThothAI** | Already have logo — skip unless you want a simplified icon version | Could use existing thoth-logo.jpg as-is, or create a square PNG version |
| **Digital Art** | Paintbrush, palette, or stylus | Chrome brush or stylus with a color splash. Should feel creative, not corporate. |

**Net new icons needed: 2** (Web Design + Digital Art). Goldmine and ThothAI already have logos in use.

### 3. Favicon
- **Where used:** Browser tab, bookmarks
- **Sizes needed:** 32x32 (.ico), 16x16 (within .ico), plus an SVG version
- **Format:** .ico and .svg
- **Style:** Simplified version of the logo mark — could be just the wing element or the "A" with a metallic treatment. Must be recognizable at 16px.
- **Notes:** You can generate a larger version (256x256) and I'll convert it down to .ico. For SVG, a simplified geometric shape works best.

---

## Priority 2 — Improves Quality Significantly

### 4. Hero Background Graphic
- **Where used:** Behind the hero text on homepage (very low opacity, atmospheric)
- **Size:** 1920x1080
- **Format:** PNG with transparency, or WebP
- **Style:** Abstract angular/geometric shapes echoing the wing motif from the logo. Think shattered glass or angular wing fragments. Colors: subtle steel blue and hot pink edges on transparent/deep navy. This sits at ~5-8% opacity behind text, so it should be detailed but not overpowering when faded.
- **Notes:** Currently using CSS-generated geometric shapes as placeholder. A real graphic will add depth.

### 5. Web Design Section Graphic
- **Where used:** Right column of the "Your Business Deserves a Real Website" teaser section on homepage
- **Size:** 600x450 (4:3 ratio)
- **Format:** PNG with transparent background
- **Style:** Abstract representation of web design — could be a chrome browser frame at an angle showing a mockup site, or a design/code hybrid visual. Metallic aesthetic. Should communicate "we build professional websites" without being a literal screenshot.
- **Notes:** Currently a text placeholder. This is visible on desktop — mobile stacks it below the text.

### 6. Shovel Newsletter Graphic
- **Where used:** The Shovel newsletter CTA section on homepage
- **Size:** 200x200
- **Format:** PNG with transparent background
- **Style:** A metallic shovel, envelope, or inbox concept. Could be a literal chrome shovel with a newsletter/email emerging from it. Should feel energetic — this is a CTA section trying to get subscriptions.
- **Notes:** Not currently in the layout but adding it would elevate the section significantly. I'll add it once you have the asset.

---

## Priority 3 — Nice to Have

### 7. OG Preview Image (updated)
- **Where used:** Social media share previews (Facebook, Twitter, LinkedIn, Slack, etc.)
- **Size:** 1200x630 (required for OG)
- **Format:** PNG or WebP
- **Style:** The Axly's Customs logo on the deep navy background with the tagline "Tools That Put AI to Work." Clean, bold, branded. This is what people see when someone shares axly.com on social.
- **Notes:** Currently using `og-preview.png` which may be outdated. A fresh one matching the new design direction would improve social sharing appearance.

### 8. OG Preview Image for /webdesign/
- **Where used:** When someone shares axly.com/webdesign/ on social media
- **Size:** 1200x630
- **Format:** PNG or WebP
- **Style:** Axly's Customs branding with "Web Design for Small Businesses" or similar. Same deep navy background. Makes the service look legitimate when shared.
- **Notes:** Currently using the same generic OG image. A unique one would look more professional.

### 9. "How It Works" Step Icons (×4)
- **Where used:** /webdesign/ page, "Four Steps to Launch" section
- **Size:** 128x128 (displayed at 64px, 2x for retina)
- **Format:** PNG with transparent background
- **Style:** Chrome/metallic, matching the service icons

| Icon | Subject | Visual Direction |
|------|---------|-----------------|
| **Step 1** | Fill out form | Chrome clipboard or form with a pen |
| **Step 2** | We talk | Chrome speech bubbles or phone |
| **Step 3** | Design | Chrome browser with a paintbrush or design tool |
| **Step 4** | Launch | Chrome rocket or "go live" button |

- **Notes:** Currently using CSS counter numbers (01, 02, etc.) which look clean. These icons would add personality but aren't required — the numbered approach works.

### 10. "What You Get" Outcome Icons (×5)
- **Where used:** /webdesign/ page, outcomes grid
- **Size:** 128x128 (displayed at 64px)
- **Format:** PNG with transparent background
- **Style:** Chrome/metallic

| Icon | Subject |
|------|---------|
| Custom design | Paintbrush + palette |
| Mobile-first | Phone with checkmark |
| Fast loading | Lightning bolt |
| Found on Google | Magnifying glass + search |
| Full setup | Wrench + gear |

- **Notes:** Same as step icons — the numbered approach currently used works fine. These would be an enhancement.

---

## Image Generation Tips

- **Transparent backgrounds are critical** — these all sit on deep navy (#0F0B2E). Any white/light halos will be visible.
- **Chrome/metallic finish** is the brand signature — think brushed steel, not flat color.
- **Test at display size** — a 192x192 image that looks great zoomed in may be unreadable at 96px. Check both.
- **WebP for photos, PNG for icons** — icons need transparency. Photos/backgrounds can use WebP for smaller files.
- **Retina consideration** — generate at 2x the display size (e.g., 192px for a 96px display) so they look sharp on high-DPI screens.

---

## File Naming & Placement

| File | Path |
|------|------|
| Logo | `/images/axly-logo.png` |
| Web Design service icon | `/images/icon-webdesign.png` |
| Digital Art service icon | `/images/icon-art.png` |
| Favicon source | `/images/favicon-source.png` (I'll convert to .ico/.svg) |
| Hero background | `/images/hero-bg.png` |
| Web Design section graphic | `/images/webdesign-graphic.png` |
| Shovel newsletter graphic | `/images/shovel-graphic.png` |
| OG preview (homepage) | `/images/og-preview.png` (replace existing) |
| OG preview (webdesign) | `/images/og-webdesign.png` |
| How It Works icons | `/images/icon-step-1.png` through `icon-step-4.png` |
| Outcome icons | `/images/icon-outcome-1.png` through `icon-outcome-5.png` |

Drop files into these paths and let me know — I'll wire them into the HTML.
