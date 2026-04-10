# Axly.com Redesign — Design Brief
**Confirmed by Mike — 2026-04-10**

---

## Homepage Section Order (final)

1. **Nav** — Sticky. Logo left, links right (Web Design, Goldmine, ThothAI, Art, Blog), "Get a Website" CTA button in hot pink
2. **Hero** — Full viewport. Design-driven (no photo). Bold display type, abstract geometric background echoing logo wing motifs. Asymmetric CTA placement. `/overdrive` moment.
3. **Services strip** — 4 pillars (Web Design, Goldmine, ThothAI, Art). Custom icons. Varied sizing — Web Design gets most weight.
4. **Web Design teaser** — Asymmetric two-column. Bold headline + pitch + CTA left, abstract graphic right.
5. **Goldmine** — Flagship product. Logo large, stats as bold typographic elements, source tags flowing strip, links to Pickaxe + Shovel.
6. **The Shovel** — Standalone high-visibility section. Full-width CTA strip, high contrast. Newsletter subscribe is the action. This is the funnel.
7. **ThothAI** — Opposite rhythm from Goldmine. Logo, pitch, platform badges. Tight and restrained.
8. **Digital Art** — Visual break. 3-4 pieces pulled dynamically from images.json. Link to gallery.
9. **About** — Brief, personal, left-aligned. No card wrapper. Personality in copy.
10. **Blog teaser** — 3 recent posts from posts.json. Quiet section.
11. **Footer** — Full-width dark band. Nav links, socials, copyright.

## /webdesign/ Page Sections

1. Hero / value prop
2. What You Get (outcomes, 4-5 items, custom icons)
3. How It Works (4-step process, custom icons)
4. Pricing (Base $1,500 + Email add-on + Custom tier)
5. Portfolio placeholder (commented out HTML)
6. Intake form (Web3Forms, placeholder key)
7. Footer CTA (phone, email, human)

## Theme
- Dark only. No toggle.
- Deep navy canvas, hot pink + steel blue signal colors, chrome/silver neutrals.

## Typography
- Bold display font (TBD — selected via impeccable font procedure)
- Refined body font (TBD)
- NOT: Inter, Roboto, Arial, Geist, Syne, or any reflex-list font

## Custom Graphics Needed

| Graphic | Description | Dimensions | Style |
|---------|------------|------------|-------|
| Service icons (x4) | Web Design, Goldmine, ThothAI, Art | 80x80 | Chrome/metallic on transparent, angular |
| Hero background | Abstract geometric/angular wing shapes | 1920x1080 | Deep navy, subtle pink/blue edges, low opacity |
| Web Design graphic | Browser frame or code/design hybrid | ~600x400 | Metallic/chrome, transparent BG |
| How It Works icons (x4) | Form, Chat, Design, Launch | 64x64 | Chrome/metallic, matching service icons |
| Shovel newsletter graphic | Newsletter/envelope/inbox concept | ~200x200 | Metallic, on-brand, eye-catching |
| Favicon | Updated brand mark | 32x32 + SVG | Hot pink + navy, wing element or logo mark |

## Layout Principles
- Asymmetric compositions, not centered grids
- No two sections composed the same way
- Varied spacing for rhythm and hierarchy
- Cards used sparingly, never nested
- Mobile: single column, stacked, hamburger nav

## Interaction
- Scroll-triggered section reveals (opacity + translate, staggered)
- Hero: one strong animation moment
- Nav: sticky with backdrop blur
- Mobile: hamburger → full-screen overlay
- Form: inline validation, loading state on submit
- Reduced motion: all animations disabled

## Content
- Preserve all existing copy (refine, don't rewrite)
- New copy needed for: hero headline, services strip, web design teaser, /webdesign/ page, thank-you page
- Dynamic: tool count (stats.json), blog posts (posts.json), gallery images (images.json)
