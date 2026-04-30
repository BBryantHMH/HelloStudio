# Hello Studio — Redesign Prototype

A working HTML/CSS prototype for hellostudio.online, rebuilt around the real offering (1:1 coaching today, workshops + courses + resources coming) and a proper information architecture.

Open `index.html` in any browser — no build step, no dependencies beyond Google Fonts.

---

## What's here

Nine pages + one shared stylesheet. Every page uses the same sticky nav, mobile drawer, and four-column footer so the site feels like one product.

| Page | File | Role |
| --- | --- | --- |
| Home | `index.html` | Positioning, flagship coaching, testimonials, Studios teaser |
| 1:1 Coaching | `coaching.html` | Full pitch, bio, pricing, application form |
| About | `about.html` | Bailey's story + values + HMH sister-company |
| Studios | `studios.html` | Overview of GPS / SPS / Admin / WooDio + Inner Circle |
| Workshops | `workshops.html` | Waitlist — Studio Live + On-Demand |
| Courses | `courses.html` | Waitlist — flagship GPS + SPS courses |
| The Vault | `vault.html` | Resource library (free + paid) with filters |
| Journal | `blog.html` | Essays / field notes index with featured post |
| Contact | `contact.html` | Intent-routing + general message form |

---

## Design rationale

**Kept the brand, clarified the structure.** Hello Mental Health's exact palette (pine, teal, gold, cream) and type system (Playfair Display + Inter as a sans stand-in for sofia-pro/Poppins) carries over verbatim — this has to feel like a sister, not a stranger. What changed is the IA: the old site put everything on one scroll. This version splits it into a home page that positions and routes, plus dedicated pages for the five things you actually sell or plan to sell.

**Flagship today, waitlist tomorrow — visibly.** Coaching is the only thing live, so it's the flagship block on home, the only primary nav item with a direct pricing path, and the destination for every "Work With Me" button. Workshops and Courses are real pages with real content (topics, formats, pricing structure) but honest about being coming-soon — they capture waitlist interest now without pretending to be shipped.

**Copy is yours, not mine.** I used the canonical drafts in `Website Copy/` verbatim where they existed (homepage tagline, pricing, bio, the Sarah Boettner + Brian Valasek quotes, the "Psy.D. · Licensed Psychologist · Group Practice Owner · Business Coach" credential line). The Studios concept, resource titles, and essay titles pull directly from the draft pages you already had on hellostudio.online (the ones only reachable via sitemap.xml).

**Four Studios on the home, five on the Studios page.** Home previews four so the grid stays balanced on desktop and collapses cleanly on mobile. The Studios page shows all four as primary cards and surfaces Inner Circle as a waitlist card — matching the signal that it's the newest and not-yet-open one.

**Forms are functional placeholders.** Every form has a working submit handler that replaces itself with a friendly confirmation ("Got it! Your message is in good hands. 💌"). No backend wired up — swap the handlers for your real provider (Squarespace Forms, ConvertKit, HubSpot, etc.) when you're ready.

**Accessibility + responsive baked in.** `aria-current`, `aria-label`, focus-visible rings, `prefers-reduced-motion` respected on the announce-pill pulse, mobile drawer at ≤860px, font sizes rescale at 720px, grids collapse to single-column at 640px.

---

## Assets

Videos live at `assets/video/` — three compressed MP4s (60MB / 34MB / 28MB, transcoded from the original 350–680MB .mov files) plus a JPG poster for each.

**Images still needed** — drop files with these exact names into the folders below and every page will pick them up automatically. Any image that's missing will simply show blank until the file is in place (the logo gracefully falls back to "Hello Studio" text).

| File path | Used on | What it should be |
| --- | --- | --- |
| `assets/logo/logo-mark.png` | Every page (nav brand) | The circular pine-green HELLO STUDIO wordmark logo (square, ~200px) |
| `assets/photos/bailey-portrait.jpg` | About hero · Coaching bio circle | A clean portrait of Bailey — the couch/iPad shot or the smiling-in-chair one would work |
| `assets/photos/bailey-at-desk.jpg` | Home About section | Bailey at her wooden desk with the tea mug and bookshelf |
| `assets/photos/bailey-at-desktop.jpg` | Journal featured post | Bailey at her desktop monitor editing (landscape 5:4) |

**Video placements (already wired):**
- `assets/video/bailey-brand-01.mp4` → home page, right side of the 1:1 Coaching flagship block
- `assets/video/gps-welcome.mp4` → Studios page, dedicated "A Welcome from Bailey" section above the 4-Studio grid
- `assets/video/bailey-brand-02.mp4` → available in the folder, not yet placed — say the word and I'll put it somewhere (About hero? Contact page? Journal subscribe section?)

---

## What I'd do next (not included)

- Wire form endpoints to a real provider.
- Add one flagship Journal post in full (an actual essay page template) so the Journal isn't just an index.
- Build one Vault resource detail page so free downloads actually download something.
- Light favicon + OG image pass.
- Pull the GPS / SPS / Admin / WooDio studio names into proper sub-brands with their own color identities (the cards hint at this already via `.studio-gps`, `.studio-sps`, etc.).
