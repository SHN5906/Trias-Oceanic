// SinoMud (sinomud.com) catalogue crawler. WordPress, server-rendered.
// Output: scrape/sinomud__all.json
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = 'https://www.sinomud.com'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const OUT = new URL('./scrape/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

// functional categories first (assignment priority), applications as fallback
const FUNCTIONAL = [
  ['viscosifiers', 'Viscosifiers'],
  ['drilling-polymer', 'Drilling Polymers'],
  ['filtrate-control-agents', 'Filtrate Control Agents'],
  ['clay-shale-stabilisers', 'Clay & Shale Stabilisers'],
  ['lost-circulation-materials', 'Lost Circulation Materials'],
  ['weighting-materials', 'Weighting Materials'],
  ['treating-chemicals', 'Treating Chemicals'],
  ['flocculants-dispersants', 'Flocculants & Dispersants'],
  ['grease', 'Grease'],
  ['lubricants-cutting-oils', 'Lubricants & Cutting Oils'],
  ['foaming-foam-plus', 'Foaming Agents & Detergents'],
  ['cement-grouting-additives', 'Cement & Grouting Additives'],
  ['mud-test-equipment', 'Mud Test Equipment'],
  ['mud-mixer', 'Mud Mixers'],
  ['core-trays', 'Core Trays'],
]
const APPS = [
  ['oil-gas', 'Oil & Gas'],
  ['cbmgeothermal', 'CBM & Geothermal'],
  ['hddtbm', 'HDD & TBM'],
  ['mining-drilling-mineral-drilling', 'Mining Drilling'],
  ['mining', 'Mining Drilling'],
  ['water-well-drilling', 'Water Well'],
  ['water-well', 'Water Well'],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&nbsp;|&#160;/g, ' ').replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;|&#8212;|&mdash;/g, ', ').replace(/&quot;|&#8220;|&#8221;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45000) })
      if (res.ok) return await res.text()
      if (res.status === 404) return null
      console.error(`HTTP ${res.status} ${url}`)
    } catch (e) { console.error(`ERR ${url}: ${e.message}`) }
    await sleep(1200 * (i + 1))
  }
  return null
}

function parseTiles(html) {
  const tiles = []
  const re = /<div class="type-product[^"]*status-publish[^"]*?"|class="([^"]*)"><div class="product_item_holder"[\s\S]{0,900}?<a href="(https:\/\/www\.sinomud\.com\/product-detail\/[^"]+)" title="([^"]*)"[^>]*><img src="([^"]+)"/g
  for (const m of html.matchAll(/class="([^"]*)"[^>]*><div class="product_item_holder"[\s\S]{0,900}?<a href="(https:\/\/www\.sinomud\.com\/product-detail\/[^"]+)"\s+title="([^"]*)"[^>]*>\s*<img src="([^"]+)"/g)) {
    tiles.push({ classes: m[1], sourceUrl: m[2], name: decode(m[3]), tileImg: m[4] })
  }
  return tiles
}

const products = new Map() // detail url -> record
const allCats = [...FUNCTIONAL, ...APPS]
for (const [slug, label] of allCats) {
  let page = 1
  while (page < 8) {
    const url = `${BASE}/product/${slug}/${page > 1 ? `page/${page}/` : ''}`
    const html = await get(url)
    if (!html) break
    const tiles = parseTiles(html)
    console.error(`${slug} p${page}: ${tiles.length} tiles`)
    for (const t of tiles) {
      if (!products.has(t.sourceUrl)) products.set(t.sourceUrl, t)
    }
    if (!new RegExp(`/product/${slug}/page/${page + 1}/`).test(html)) break
    page++
    await sleep(150)
  }
}
console.error(`unique products: ${products.size}`)

// category assignment from tile classes
function assignCat(classes) {
  for (const [slug, label] of FUNCTIONAL) if (classes.split(/\s+/).includes(slug)) return label
  for (const [slug, label] of APPS) if (classes.split(/\s+/).includes(slug)) return label
  return 'Other'
}

const list = [...products.values()]
let i = 0
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (i < list.length) {
      const p = list[i++]
      const html = await get(p.sourceUrl)
      p.category = assignCat(p.classes)
      if (!html) { p.description = ''; p.specs = []; p.imageUrl = p.tileImg; continue }
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
      if (h1) p.name = decode(h1[1].replace(/<[^>]+>/g, ''))
      const sd = html.match(/itemprop="description"[^>]*>([\s\S]*?)<\//)
      const md = html.match(/<meta name="description" content="([^"]+)"/)
      let desc = sd ? decode(sd[1].replace(/<[^>]+>/g, ' ')) : md ? decode(md[1]) : ''
      if (desc.length < 40) {
        const sec = html.match(/class="product_holder([\s\S]*?)(?:class="related|<footer)/)
        const body = sec ? sec[1] : ''
        for (const pm of body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
          const t = decode(pm[1].replace(/<[^>]+>/g, ' '))
          if (t.length > 60 && !t.includes('{')) { desc = t; break }
        }
      }
      p.description = desc
      const im = html.match(/itemprop="image"[^>]*(?:src|content)="([^"]+)"/) || html.match(/<meta property="og:image" content="([^"]+)"/)
      p.imageUrl = im ? im[1] : p.tileImg
      const specs = []
      const scope = html.slice(0, html.indexOf('class="related') > 0 ? html.indexOf('class="related') : html.length)
      for (const tm of scope.matchAll(/<table[\s\S]*?<\/table>/g)) {
        for (const rm of tm[0].matchAll(/<tr[\s\S]*?<\/tr>/g)) {
          const cells = [...rm[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => decode(c[1].replace(/<[^>]+>/g, ' ')))
          if (cells.length === 2 && cells[0] && cells[1] && cells[0].length <= 40 && cells[1].length <= 90) specs.push(`${cells[0]}: ${cells[1]}`)
          if (specs.length >= 6) break
        }
        if (specs.length >= 6) break
      }
      p.specs = specs
      await sleep(150)
    }
  })
)

const final = list.map((p) => ({
  name: p.name, category: p.category, description: p.description,
  specs: p.specs, imageUrl: p.imageUrl, sourceUrl: p.sourceUrl,
}))
writeFileSync(OUT + 'sinomud__all.json', JSON.stringify({ brand: 'SinoMud', brandKey: 'sinomud', products: final }, null, 1))
console.error(`WROTE ${final.length} products`)
final.forEach((p) => console.error(`  [${p.category}] ${p.name}`))
