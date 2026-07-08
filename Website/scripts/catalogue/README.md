# Catalogue data pipeline

One-shot scrapers that built `src/data/products.ts` and `src/assets/products/` (July 2026).
Re-run only to refresh the catalogue from the partner factory sites.

Order:

1. `node jsexplo-scrape.mjs`, `node sonmak-scrape.mjs`, `node sinomud-scrape.mjs`
   Write raw per-brand JSON into `./scrape/`. Muster Fire JSON was produced separately
   (per-category files `musterfire__*.json` in the same folder, same shape).
2. `node assemble.mjs`
   Cleans, dedupes and curates everything into `./catalogue.json` + `./image-manifest.json`.
   All editorial fixes (typos on the factory sites, renamed translation artifacts, pooled
   Muster shared components, hand-written descriptions for spec-sheet-only pages) live here.
3. `node images.mjs`
   Downloads the manifest images (Referer header required for the JS Explo CDN),
   validates dimensions, converts to WebP under 150 KB into `src/assets/products/<brand>/`.
   Needs `cwebp` (brew) and `sips` (macOS).
4. `node gen-products.mjs`
   Emits `src/data/products.ts` from `catalogue.json`, nulling images that failed to download.

`images.mjs` and `gen-products.mjs` contain absolute paths to this repo; adjust if the
checkout moves. Rate limits are polite (4-6 concurrent, small delays): keep them.
