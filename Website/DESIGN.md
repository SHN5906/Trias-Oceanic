# DESIGN.md · Trias Oceanic "Field Survey"

Client-approved direction. The whole design lives as **plain CSS in `src/index.css`** (CSS variables + semantic classes). Tailwind is installed but barely used: do NOT Tailwind-ify, keep parity with the approved look.

## Palette (tokens in `:root` and `tailwind.config.js`)
- White base `--white #FFFFFF`, mist band `--mist #F1F4F3`, hairline `--line #E2E7E4`
- Ink `--ink #13241F`, mute `--mute #4B5A54`, subtle `--subtle #8A968F`
- Deep green anchor `--deep #0F3D2E`, deepest (footer) `--deepest #0A2A20`
- Copper accent `--copper #B5793F`, dim `#9A6533`, light `#CE9356`
- Strategy: white corporate base + deep-green anchor + ONE copper accent per page (≤ ~8%). Never stack two green sections.

## Typography
- **Montserrat only** (400/500/600/700/800, Google Fonts). User-chosen; do not swap.
- Display: 800, uppercase, tight line-height 1.05 (`.display`).
- Eyebrows and micro-labels: 11px / 600 / uppercase / letter-spacing 0.2em / `--subtle` (`.eyebrow`). Unified across the site.
- Body: 13.5px to 17px, `--mute`, line-height 1.6 to 1.7.

## Components / classes
- `.wrap` max-width 1120px. `.btn-copper` / `.btn-ghost` square buttons, uppercase 13px.
- `.plate`: hairline-bordered brand tile, copper border on hover.
- `.plist`: hairline-separated list, 8px square copper bullet.
- `.anim` + `.d1..d4`: CSS rise-in on load (0.7s ease-out), honors `prefers-reduced-motion`.
- Header: sticky, white 95% + blur, hairline bottom; inlined SVG logo lockup (`Logo.tsx`, hexagon + 3 strata mark).
- Footer: `--deepest`, reverse logo.

## Motifs
- Thin hairline rules, square (no border-radius anywhere), numbered items in copper, geological "strata" logo.
- Real industrial photography; colour-splash series (B&W except one hue) on brand pages.

## Pages (static MPA, one HTML entry per route)
- `/` home, `/partners/` synthetic brand overview (ex `/what-we-sell/`), `/contact/` contact page, `/products/` full catalogue.
- Wiring: `vite.config.ts` rollupOptions.input + path routing in `src/main.tsx`.

## Catalogue page (`/products/`, `src/pages/Catalogue.tsx`)
- Data: `src/data/products.ts` (249 items, generated; see `scripts/catalogue/README.md`). Images: `src/assets/products/<brand>/*.webp`, all local, ≤150 KB, lazy-loaded.
- Classes: `.brandbar` sticky brand jump-nav (copper underline on the active section, top offsets from measured `--hh`/`--bb` heights) with an inline catalogue-wide search field (`.brandbar-search`, underline style); `.bsec`/`.bsec.alt` white↔mist brand sections with big copper index numbers (`.bsec-no`); `.chip` square filter chips (copper inset line when active, sticky under the brand bar on desktop, horizontal scroll strip on mobile); `.pgrid-head` range subheadings inside the unfiltered grid; `.pcard` hairline product cards, copper border on hover, contained image on white, max 3 spec rows, per-card "Request a quote" link that pre-fills the contact form via `?product=&brand=`.
- Landing = full-viewport brand showroom: `.bsel` fills `100vh - header` with a 2×2 grid of `.bpanel` logo panels (white, hairline joints, logo + tag + product count, copper inset line on hover) and a centred copper "See all N products" button below the grid. Clicking a panel opens that brand's catalogue (`#<brand>`); "See all" opens the four sections stacked (`#all`). The sticky brand bar (brand links + See all + search + Top) only exists inside the catalogue views; back/forward walks showroom ↔ views (popstate).
- URL state: `?range=<brand>:<group>` on chip clicks (pushState, restored on popstate), `?q=` mirrors the search. On mobile the site header goes static on this page (`body.pcat`); only the brand bar + search stay sticky. Horizontal strips get a right-edge fade (`.fade-r`) while more content is scrollable.
- Search results are grouped by brand under `.pgrid-head` rows, name matches first; during a search the brand-bar counts switch to per-brand result counts (zero = `.dim`). Chips ride a single scrollable line everywhere (sticky ~54px on desktop). Filtered groups >8 items break by factory sub-category. `/` focuses the search (`.skey` hint, desktop only), `.brandbar-top` jumps to `#top`. Copper `:focus-visible` on chips/links/CTAs; programmatic scrolls honour `prefers-reduced-motion`.
- Colour rhythm holds: white → mist alternation, ONE green band (the shared CTA) before the footer.
