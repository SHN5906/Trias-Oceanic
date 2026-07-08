// Son-Mak (son-mak.com.tr) catalogue crawler. WordPress + Elementor, English content.
// Page list curated from the Yoast page-sitemap. Output: scrape/sonmak__all.json
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = 'https://son-mak.com.tr'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const OUT = new URL('./scrape/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const PAGES = {
  'Core Drilling Rigs': [
    '/products/core-drilling-rigs/levent-1001/', '/products/core-drilling-rigs/levent-2002-3-2/',
    '/products/core-drilling-rigs/levent-3003/', '/products/core-drilling-rigs/levent-4004-5/',
    '/products/core-drilling-rigs/rx-4/', '/products/core-drilling-rigs/rx-5-2/', '/products/core-drilling-rigs/rx-7-2/',
  ],
  'Mud Pumps': ['/tp-45/', '/mud-pumps-and-spares/tp-80/', '/mud-pumps-and-spares/tp-135/', '/mud-pumps-and-spares/tp-220/'],
  'Grouting Systems': [
    '/grouting-systems/agp-01-3/', '/grouting-systems/agp-02-3/', '/grouting-systems/ep-150/',
    '/grouting-systems/epm-150/', '/grouting-systems/gps-150/', '/grouting-systems/packers/',
  ],
  'Water Swivels': [
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/underground-water-swivel/ws-ao-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/underground-water-swivel/ws-awj-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/underground-water-swivel/ws-no-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/underground-water-swivel/ws-bo-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/underground-water-swivel/ws-bwj-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/underground-water-swivel/ws-nwj-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/heavy-duty-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/compact-plus-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/standard-duty-water-swivel/',
    '/products/exploration-drilling-tools/water-swivels-spare-parts-kit-2/water-swivel-spare-parts-kit/',
  ],
  'Wireline Core Barrels': [
    '/bo-wireline-core-barrel-2/', '/bo-u-underground-core-barrel/', '/bou-underground-core-barrel-system/',
    '/no-wireline-core-barrel-2/', '/no-u-underground-core-barrel/', '/no3-triple-tube-wireline-core-barrel/',
    '/ho-u-underground-core-barrel/', '/ho3-triple-tube-wireline-core-barrel/',
    '/po-wireline-core-barrel/', '/po3-triple-tube-wireline-core-barrel/',
    '/bo-wireline-core-barrel/', '/no-wireline-core-barrel/', '/nou-underground-core-barrel-system/',
    '/no3-triple-tube-wireline-core-barrel-system/', '/ho-wireline-core-barrel/', '/hou-underground-corel-barrel-system/',
    '/ho3-triple-tube-wireline-core-barrel-system/', '/po-wireline-core-barrel-system/', '/po3-triple-tube-wireline-core-barrel-system/',
  ],
  'Head Assemblies': [
    '/bo-head-assemblies/', '/bo-u-underground-head-assemblies/', '/no-head-assemblies/',
    '/no-u-underground-head-assemblies/', '/ho-head-assemblies/', '/ho-u-underground-head-assemblies/', '/po-head-assemblies/',
  ],
  'Overshots & Loading Chambers': [
    '/bo-overshot/', '/ho-overshot/', '/po-overshot/', '/bo-u-underground-overshot/',
    '/no-u-underground-overshot/', '/ho-u-underground-overshot/',
    '/bo-bo-u-loading-chamber/', '/no-no-u-loading-chamber/', '/ho-ho-u-loading-chamber/',
  ],
  'Diamond Products': ['/core-bits-2/', '/reaming-shell-2/', '/casing-shoes-2/', '/rod-shoes-2/'],
  'Rods & Casings': [
    '/no-wireline-rods/', '/bo-wireline-rods/', '/ho-wireline-rods/', '/phd-wireline-rods/',
    '/awj-conventional-rods/', '/bwj-conventional-rods/', '/nwj-conventional-rods/',
    '/bw-casings/', '/nw-casings/', '/pw-casings/', '/hw-casings/', '/nwt-casings/', '/hwt-casings/', '/pwt-casings/',
  ],
  'Handling Tools & Spares': [
    '/coring-wrenches/ao-coring-wrenches/', '/coring-wrenches/bo-coring-wrenches/', '/coring-wrenches/no-coring-wrenches/',
    '/coring-wrenches/ho-coring-wrenches/', '/coring-wrenches/po-coring-wrenches/', '/coring-wrenches/heavy-duty-straight-pipe-wrenches/',
    '/casing-cutters/bw-casing-cutter-assembly/', '/casing-cutters/nw-casing-rod-cutter-assembly/',
    '/casing-cutters/hw-casing-cutter-assembly/', '/casing-cutters/pw-casing-cutter-assembly/',
    '/adapter-subs/rotation-adapter-subs/', '/adapter-subs/drill-rod-adapter-subs/', '/adapter-subs/recovery-tool-adapter-subs/',
    '/adapter-subs/casing-adapter-subs/', '/adapter-subs/hosting-plug-adapter-subs/', '/adapter-subs/water-swivel-adapter-subs/',
    '/recovery-taps/', '/standard-hoisting-plug/', '/standard-duty-hosting-plug/', '/spare-parts-kit/',
  ],
}

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
      if (res.status === 404) { console.error(`404 ${url}`); return null }
    } catch (e) { console.error(`ERR ${url}: ${e.message}`) }
    await sleep(1200 * (i + 1))
  }
  return null
}

function extract(html, path) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const name = h1 ? decode(h1[1].replace(/<[^>]+>/g, '')) : null
  // paragraphs: skip script/style junk
  let desc = ''
  const md = html.match(/<meta name="description" content="([^"]+)"/)
  if (md) desc = decode(md[1])
  if (desc.length < 40) {
    for (const pm of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
      const t = decode(pm[1].replace(/<[^>]+>/g, ' '))
      if (t.length > 60 && !/[{}]|lazyload|cookie|newsletter|@|copyright/i.test(t)) { desc = t; break }
    }
  }
  // spec rows: 2-cell table rows
  const specs = []
  for (const tm of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    for (const rm of tm[0].matchAll(/<tr[\s\S]*?<\/tr>/g)) {
      const cells = [...rm[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => decode(c[1].replace(/<[^>]+>/g, ' ')))
      if (cells.length === 2 && cells[0] && cells[1] && cells[0].length <= 40 && cells[1].length <= 90 && !/^\d+$/.test(cells[0])) specs.push(`${cells[0]}: ${cells[1]}`)
      if (specs.length >= 6) break
    }
    if (specs.length >= 6) break
  }
  // image candidates: content uploads, strip WP size suffixes, filter chrome
  const slugTokens = path.split('/').filter(Boolean).pop().split('-').filter((t) => t.length > 1)
  const seen = new Set()
  const candidates = []
  for (const m of html.matchAll(/<img[^>]+src="(https:\/\/son-mak\.com\.tr\/wp-content\/uploads\/[^"]+)"/g)) {
    let u = m[1].replace(/-\d+x\d+(\.\w+)$/, '$1')
    if (/logo|cropped|removebg|favicon|icon|placeholder|whatsapp|\.svg/i.test(u)) continue
    if (seen.has(u)) continue
    seen.add(u)
    const fname = u.toLowerCase()
    const score = slugTokens.filter((t) => fname.includes(t)).length + (/\.jpe?g$/i.test(u) ? 0.5 : 0)
    candidates.push({ u, score })
  }
  candidates.sort((a, b) => b.score - a.score)
  return { name, description: desc, specs, imageCandidates: candidates.slice(0, 4).map((c) => c.u) }
}

const out = []
for (const [category, paths] of Object.entries(PAGES)) {
  for (const path of paths) {
    const html = await get(BASE + path)
    if (!html) continue
    const rec = extract(html, path)
    if (!rec.name) { console.error(`no h1: ${path}`); continue }
    out.push({ name: rec.name, category, description: rec.description, specs: rec.specs, imageCandidates: rec.imageCandidates, sourceUrl: BASE + path })
    console.error(`[${category}] ${rec.name} · desc:${rec.description.length} specs:${rec.specs.length} imgs:${rec.imageCandidates.length}`)
    await sleep(150)
  }
}

// dedupe by normalized name, keep the record with more content
const byName = new Map()
for (const p of out) {
  const k = p.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const prev = byName.get(k)
  const richness = (x) => x.description.length + x.specs.length * 30 + x.imageCandidates.length * 10
  if (!prev || richness(p) > richness(prev)) byName.set(k, p)
}
const final = [...byName.values()]
writeFileSync(OUT + 'sonmak__all.json', JSON.stringify({ brand: 'Son-Mak', brandKey: 'sonmak', products: final }, null, 1))
console.error(`WROTE ${final.length} products (${out.length} pages scraped)`)
