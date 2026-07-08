// Emit Website/src/data/products.ts from catalogue.json.
// Images that failed to download are nulled so the UI renders a no-photo tile.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const cat = JSON.parse(readFileSync(new URL('./catalogue.json', import.meta.url), 'utf8'))
const ASSETS = '/Users/sohan/Trias Oceanic/Website/src/assets/products'

const BRANDS = [
  { key: 'musterfire', name: 'Muster Fire', tag: 'Fire suppression', blurb: 'Automatic fire suppression for mobile equipment and fixed plant, from detection to discharge.' },
  { key: 'sonmak', name: 'Son-Mak', tag: 'Drilling rigs & tooling', blurb: 'Exploration drilling rigs, mud pumps and the wireline tooling that keeps them turning.' },
  { key: 'jsexplo', name: 'JS Explo', tag: 'Drilling tools', blurb: 'Geological drilling tools: bits, rods, casing, core barrels and rig accessories.' },
  { key: 'sinomud', name: 'SinoMud', tag: 'Drilling fluids', blurb: 'Drilling muds, bentonite, polymers, additives and the kit to test them.' },
]

const order = Object.fromEntries(BRANDS.map((b, i) => [b.key, i]))
const products = cat
  .map((p) => ({
    brand: p.brandKey,
    category: p.category,
    group: p.group,
    name: p.name,
    description: p.description,
    specs: p.specs,
    image: p.image && existsSync(`${ASSETS}/${p.image}`) ? p.image : null,
  }))
  .sort((a, b) => order[a.brand] - order[b.brand])

const esc = (v) => JSON.stringify(v)
const lines = products.map(
  (p) =>
    `  { brand: ${esc(p.brand)}, category: ${esc(p.category)}, group: ${esc(p.group)}, name: ${esc(p.name)}, description: ${esc(p.description)}, specs: ${esc(p.specs)}, image: ${esc(p.image)} },`
)

const ts = `// Full product catalogue, one entry per line item.
// Extracted from the four partner factory sites (musterfire.com, son-mak.com.tr,
// jsexplo.com, sinomud.com) in July 2026; descriptions rewritten, specs kept as published.
// Images live in src/assets/products/<brand>/ and are resolved in the page component.

export type BrandKey = 'musterfire' | 'sonmak' | 'jsexplo' | 'sinomud'

export type Product = {
  brand: BrandKey
  /** fine-grained factory category, shown on the card */
  category: string
  /** filter group within the brand section */
  group: string
  name: string
  description: string
  specs: string[]
  /** file under src/assets/products/, null when the factory has no usable photo */
  image: string | null
}

export type BrandInfo = {
  key: BrandKey
  name: string
  tag: string
  blurb: string
}

export const BRANDS: BrandInfo[] = ${JSON.stringify(BRANDS, null, 2).replace(/"(\w+)":/g, '$1:')}

export const PRODUCTS: Product[] = [
${lines.join('\n')}
]
`
writeFileSync('/Users/sohan/Trias Oceanic/Website/src/data/products.ts', ts)
const noImg = products.filter((p) => !p.image)
console.log(`products.ts written: ${products.length} products, ${noImg.length} without image, ${(ts.length / 1024).toFixed(0)} KB`)
console.log(noImg.map((p) => `${p.brand}:${p.name}`).join('\n'))
