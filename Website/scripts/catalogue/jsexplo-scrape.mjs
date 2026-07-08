// JS Explo (jsexplo.com) catalogue crawler. Server-rendered HTML, no JS needed.
// Output: scrape/jsexplo__all.json  {brand, brandKey, products: [{name, category, group, description, specs, imageUrl, sourceUrl}]}
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = 'https://www.jsexplo.com'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const OUT = new URL('./scrape/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const decode = (s) =>
  s
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim()

async function get(path, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(path.startsWith('http') ? path : BASE + path, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(45000),
      })
      if (res.ok) return await res.text()
      console.error(`HTTP ${res.status} ${path}`)
    } catch (e) {
      console.error(`ERR ${path}: ${e.message}`)
    }
    await sleep(1200 * (i + 1))
  }
  return null
}

// ---- 1. category tree from the sidebar/mega-nav ----
// Tokenize <ul class="p_c_content"> nesting; anchors: p_c_titleN > a > span
function parseTree(html) {
  const region = html
  const tokens = [...region.matchAll(/<ul class="p_c_content[^"]*"|<\/ul>|<p class="p_c_title\d[^"]*">\s*<a href="(\/(?:prd_list|products_list)\/[^"]+)"[^>]*>\s*<span>([^<]*)<\/span>/gs)]
  const cats = new Map() // href -> {name, depth, parents:[]}
  let stack = []
  let last = null
  for (const t of tokens) {
    if (t[0].startsWith('<ul')) { if (last) stack.push(last) }
    else if (t[0] === '</ul>') { stack.pop() }
    else {
      const href = t[1]
      const name = decode(t[2])
      const entry = { href, name, parents: stack.map((s) => s.name), depth: stack.length }
      // keep the deepest placement of a href
      if (!cats.has(href) || cats.get(href).depth < entry.depth) cats.set(href, entry)
      last = entry
    }
  }
  return [...cats.values()]
}

// ---- 2. product tiles on a category page ----
function parseTiles(html) {
  const tiles = []
  const re = /<a href="(\/products_detail\/[^"]+)"[^>]*>\s*<img src="([^"]+)"[^>]*alt="([^"]*)"/gs
  for (const m of html.matchAll(re)) tiles.push({ sourceUrl: BASE + m[1], imageUrl: m[2], name: decode(m[3]) })
  return tiles
}

function parsePager(html, catPath) {
  const id = catPath.match(/\/(\d+)\.html/)?.[1]
  if (!id) return []
  const re = new RegExp(`href="((?:/prd_list|/products_list)/${id}[_-]\\d+\\.html)"`, 'g')
  return [...new Set([...html.matchAll(re)].map((m) => m[1]))]
}

// ---- 3. detail page: description + specs ----
function parseDetail(html) {
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''
  const specs = []
  for (const tm of html.matchAll(/<table.*?<\/table>/gs)) {
    for (const rm of tm[0].matchAll(/<tr.*?<\/tr>/gs)) {
      const cells = [...rm[0].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gs)].map((c) => decode(c[1].replace(/<[^>]+>/g, ' ')))
      if (cells.length === 2 && cells[0] && cells[1] && cells[0].length <= 40 && cells[1].length <= 80 && !/^\d+$/.test(cells[0])) {
        specs.push(`${cells[0]}: ${cells[1]}`)
      }
      if (specs.length >= 6) break
    }
    if (specs.length >= 6) break
  }
  return { desc: decode(desc), specs }
}

async function pool(items, n, fn) {
  const out = []
  let i = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx], idx)
        await sleep(150)
      }
    })
  )
  return out
}

// ---- main ----
const seedHtml = await get('/prd_list/42.html')
if (!seedHtml) { console.error('FATAL: seed fetch failed'); process.exit(1) }
const tree = parseTree(seedHtml)
console.error(`categories in nav: ${tree.length}`)
const childHrefs = new Set(tree.map((c) => c.href))
const isLeaf = (c) => !tree.some((o) => o.parents.includes(c.name))
const leaves = tree.filter(isLeaf)
console.error(`leaf categories: ${leaves.length}`)
leaves.forEach((c) => console.error(`  ${c.href}  ${[...c.parents, c.name].join(' > ')}`))

const products = new Map() // sourceUrl -> product
const catResults = await pool(leaves, 4, async (cat) => {
  const html = await get(cat.href)
  if (!html) return { cat, tiles: [] }
  let tiles = parseTiles(html)
  for (const extra of parsePager(html, cat.href)) {
    const h2 = await get(extra)
    if (h2) tiles = tiles.concat(parseTiles(h2))
  }
  return { cat, tiles }
})
for (const { cat, tiles } of catResults) {
  const group = cat.parents[0] ?? cat.name
  for (const t of tiles) {
    if (!products.has(t.sourceUrl)) products.set(t.sourceUrl, { ...t, category: cat.name, group })
  }
  console.error(`${cat.name}: ${tiles.length} tiles`)
}
console.error(`unique products: ${products.size}`)

const list = [...products.values()]
await pool(list, 4, async (p) => {
  const html = await get(p.sourceUrl)
  if (!html) { p.description = ''; p.specs = []; return }
  const { desc, specs } = parseDetail(html)
  p.description = desc
  p.specs = specs
})

const final = list.map((p) => ({
  name: p.name, category: p.category, group: p.group,
  description: p.description, specs: p.specs, imageUrl: p.imageUrl, sourceUrl: p.sourceUrl,
}))
writeFileSync(OUT + 'jsexplo__all.json', JSON.stringify({ brand: 'JS Explo', brandKey: 'jsexplo', products: final }, null, 1))
console.error(`WROTE ${final.length} products`)
