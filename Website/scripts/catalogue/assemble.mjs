// Assemble the 4 brand scrapes into one clean catalogue.json + image manifest.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const DIR = new URL('./scrape/', import.meta.url).pathname
const load = (f) => JSON.parse(readFileSync(DIR + f, 'utf8'))

// ---------- shared cleaning ----------
const NBSP = / /g
function cleanText(s) {
  if (!s) return ''
  return s
    .replace(NBSP, ' ')
    .replace(/[—–−]/g, ', ')
    .replace(/、|，/g, ', ')
    .replace(/。/g, '. ')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,(?=[A-Za-z])/g, ', ')
    .replace(/SON, ?MAK/g, 'Son-Mak')
    .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// strip a leading repetition of the product name, then keep max 2 clean sentences
function cleanDesc(name, desc) {
  let d = cleanText(desc)
  const n = cleanText(name)
  const low = d.toLowerCase()
  if (low.startsWith(n.toLowerCase())) {
    const rest = d.slice(n.length).replace(/^[\s.:,-]+/, '')
    // keep the name when the remainder continues the sentence ("X is a premium...")
    d = /^(is|are|was|has|have|offers|provides|will|can)\b/i.test(rest) ? `${n} ${rest.charAt(0).toLowerCase()}${rest.slice(1)}` : rest
  }
  // cut off CSS/JS junk that some CMSes append to meta descriptions
  d = d.split(/\.image-text|\[data-id|[{}]/)[0].trim()
  // sentence split; drop table-junk sentences
  const sentences = d.split(/(?<=[.!?])\s+/).filter((s) => {
    if (s.length < 8) return false
    if (/[×>]|caliber\d|\d{3,}\s*\d{3,}/i.test(s)) return false
    const alpha = (s.match(/[a-zA-Z\s]/g) || []).length / s.length
    return alpha > 0.55
  })
  d = sentences.slice(0, 2).join(' ')
  if (d && !/[.!?]$/.test(d)) d += '.'
  // uppercase first letter
  return d ? d[0].toUpperCase() + d.slice(1) : ''
}

function cleanSpecs(specs) {
  const seen = new Set()
  const out = []
  for (let s of specs || []) {
    s = cleanText(s).replace(/\s*:[\s:]*/, ': ').replace(/\bLenght\b/g, 'Length')
    if (!s || s.length > 90 || seen.has(s.toLowerCase())) continue
    seen.add(s.toLowerCase())
    out.push(s)
  }
  return out.slice(0, 5)
}

const slugCounts = new Map()
function slugify(brandKey, name) {
  let s = name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  const key = brandKey + '/' + s
  const n = (slugCounts.get(key) || 0) + 1
  slugCounts.set(key, n)
  return n > 1 ? `${s}-${n}` : s
}

const catalogue = []
const manifest = [] // {brand, slug, urls: [candidates in priority order]}

function push(brandKey, brandName, p, imageCandidates) {
  const slug = slugify(brandKey, p.name)
  const urls = (imageCandidates || []).filter(Boolean)
  if (urls.length) manifest.push({ brand: brandKey, slug, urls })
  catalogue.push({
    brand: brandName,
    brandKey,
    category: p.category,
    group: p.group || p.category,
    name: p.name,
    description: p.description,
    specs: p.specs,
    image: urls.length ? `${brandKey}/${slug}.webp` : null,
    sourceUrl: p.sourceUrl,
  })
}

// ---------- JS Explo ----------
{
  const d = load('jsexplo__all.json')
  const GROUP_LABELS = {
    'Geological Drill Bit & Reaming Shell': 'Drill Bits & Reaming Shells',
    'Global Universal Geological Drill Rod': 'Drill Rods & Casing',
    'Geological Core Barrel': 'Core Barrels',
    'Y Series Hydraulic Drill Rig': 'Hydraulic Drill Rigs',
    'Geological Drilling Accessory Tools': 'Accessory Tools',
    'C Series Geological Core Barrel': 'C Series Coring',
    'TW Series Core Barrel': 'TW Series Coring',
  }
  // hand-written minimal descriptions for products whose pages carry none (derived from name/category only)
  const FALLBACK_DESC = {
    'PDC bit': 'Polycrystalline diamond compact bit for geological exploration drilling.',
    'Electric rope winch': 'Electric winch for wireline core retrieval.',
    'Hydraulic rope winch': 'Hydraulically driven winch for wireline core retrieval.',
    'Wire rope': 'Wire rope for wireline coring winches.',
    'Pipe wrench': 'Pipe wrench for drill rod handling.',
    'Reamer': 'Reamer for maintaining borehole diameter.',
    'Specific-Purpose Drill Rod': 'Drill rods for special purpose drilling programmes.',
    'Universal Standard Core Barrel': 'Core barrel built to universal standard dimensions.',
    'JINSHI Drilltech Standard Core Barrel': 'Core barrel built to the JINSHI Drilltech factory standard.',
    'Trojan horse gripper': 'Gripper for clamping the drill string during tripping.',
    'Hydraulic power tong': 'Hydraulic power tong for making and breaking rod joints.',
    'Drilling Casing Shoe Bits': 'Casing shoe bits for advancing casing to depth.',
    'CR series rope drill pipe': 'CR series wireline drill pipe.',
    'Rope drill pipe packaging': 'Bundled packaging for wireline drill pipe shipments.',
    'WT series casing': 'WT series geological casing.',
    'C2 wireline coring tool': 'Wireline coring tool set, C2 configuration.',
    'C3 wireline coring tool': 'Wireline coring tool set, C3 configuration.',
    'CU wireline coring tool': 'Wireline coring tool set, CU configuration.',
    'Series C overshot': 'Overshot for C series wireline core barrels.',
    'CU series overshot': 'Overshot for CU series wireline coring tools.',
    'Accident handling tools': 'Tools for recovering stuck and lost drill string components.',
  }
  const NAME_FIXES = {
    'JINSHI Drilltech Dtandard Core Barrel': 'JINSHI Drilltech Standard Core Barrel',
    // the factory tile for its table-inlaid bit line is titled "Production process of..."
    'Production process of impregnated drill bits': 'Table-Inlaid Impregnated Drill Bits',
  }
  const seenNames = new Set()
  for (const p of d.products) {
    let name = cleanText(p.name)
    name = NAME_FIXES[name] || name
    let category = cleanText(p.category)
    // site translation artifact: "Sold" is the TW-series fishing tool line
    if (name === 'Sold') continue // duplicate of "Wireline coring tool" (TW), same series/specs
    const nkey = name.toLowerCase()
    if (seenNames.has(nkey)) continue // same product listed in two nav branches
    seenNames.add(nkey)
    let desc = cleanDesc(name, p.description) || FALLBACK_DESC[name] || ''
    push('jsexplo', 'JS Explo', {
      name, category,
      group: GROUP_LABELS[p.group] || p.group,
      description: desc,
      specs: cleanSpecs(p.specs),
      sourceUrl: p.sourceUrl,
    }, [p.imageUrl])
  }
}

// ---------- Son-Mak ----------
{
  const d = load('sonmak__all.json')
  const extra = JSON.parse(readFileSync(DIR + 'sonmak__extra.json', 'utf8')).filter((p) => !/Hoist Plugs/.test(p.name))
  const parents = JSON.parse(readFileSync(DIR + '../sonmak-parents.json', 'utf8'))
  const stripSize = (u) => u.replace(/-\d+x\d+(\.\w+)$/, '$1')
  const FAMILY_IMG = {
    casings: parents['casings']?.imgs[0],
    rods: parents['wireline-core-drilling-rods']?.imgs[0],
    adapters: parents['adapter-subs']?.imgs[0],
  }
  const NAME_FIXES = {
    'AGP, 01': 'AGP-01', 'AGP, 02': 'AGP-02', 'EP, 150': 'EP-150', 'EPM, 150': 'EPM-150',
    'GPS, 150': 'GPS-150', 'PACKERS': 'Grouting Packers',
    'Bou Underground Core Barrel System': 'BO-U Underground Core Barrel',
    'Nou Underground Core Barrel System': 'NO-U Underground Core Barrel',
    'Hou Underground Corel Barrel System': 'HO-U Underground Core Barrel',
    'Ho Wireline Core Barrel': 'HO Wireline Core Barrel',
    'No3 Triple Tube Wireline Core Barrel System': 'NO3 Triple Tube Wireline Core Barrel',
    'HO3 Triple Tube Wireline Core Barrel System': 'HO3 Triple Tube Wireline Core Barrel',
    'PO Wireline Core Barrel System': 'PO Wireline Core Barrel',
    'PO3 Triple Tube Wireline Core Barrel System': 'PO3 Triple Tube Wireline Core Barrel',
    'Standard Duty Hosting Plug': 'Standard Duty Hoisting Plug',
    'Hosting Plug Adapter Subs': 'Hoisting Plug Adapter Subs',
  }
  // Their product pages are spec sheets with no body copy; these lines are derived
  // from the product name/family function only. No invented specs.
  const sizeOf = (n) => n.match(/^([A-Z]{2,3}\d?(?:-U)?)\s/)?.[1] ?? ''
  const famDesc = (name, cat) => {
    const s = sizeOf(name)
    if (cat === 'Core Drilling Rigs')
      return 'Fully hydraulic core drilling rig with safe, fast rod handling and hydraulic rod making and breaking. Drills in any direction.'
    if (cat === 'Mud Pumps') return 'Mud pump for drilling fluid circulation on exploration rigs.'
    if (cat === 'Grouting Systems') return /Packers/.test(name) ? 'Packers for isolating grouting intervals.' : 'Grout pump unit for cement grouting operations.'
    if (cat === 'Water Swivels')
      return name.includes('Spare Parts') ? 'Seal and bearing spare parts kit for Son-Mak water swivels.'
        : 'Water swivel that feeds flushing fluid into the rotating drill string.'
    if (cat === 'Wireline Core Barrels')
      return `${s} wireline core barrel. The inner tube assembly is retrieved through the rods by overshot, without tripping the string.`
    if (cat === 'Head Assemblies')
      return `Inner tube head assembly for the ${s.replace('-U', '-U underground')} wireline core barrel.`
    if (cat === 'Overshots & Loading Chambers')
      return /Overshot/.test(name)
        ? 'Overshot that latches onto the inner tube head assembly to retrieve core through the drill string.'
        : 'Loading chamber for inserting and retrieving the wireline inner tube assembly.'
    if (cat === 'Diamond Products') {
      if (/Core Bits/.test(name)) return 'Impregnated diamond core bits, series matched to ground hardness and abrasiveness.'
      if (/Reaming/.test(name)) return 'Reaming shell that holds hole gauge and stabilises the bit.'
      if (/Casing Shoes/.test(name)) return 'Diamond set casing shoe for advancing casing to depth.'
      return 'Diamond set rod shoe for advancing rods through overburden.'
    }
    if (cat === 'Rods & Casings')
      return /Casings/.test(name) ? `${name.split(' ')[0]} size drill casing, supplied in standard lengths.`
        : /Wireline/.test(name) ? `${name.split(' ')[0]} wireline drill rods for core drilling.`
        : `${name.split(' ')[0]} conventional drill rods.`
    if (cat === 'Handling Tools & Spares') {
      if (/Coring Wrenches/.test(name)) return `Coring wrench for ${name.split(' ')[0]} size rods and core barrels.`
      if (/Pipe Wrenches/.test(name)) return 'Heavy duty straight pipe wrenches for rod and casing handling.'
      if (/Cutter/.test(name)) return `Downhole cutter assembly for ${name.split(' ')[0]} casing.`
      if (/Adapter Subs/.test(name)) return `${name.replace(/ Adapter Subs$/, '')} adapter subs for connecting string components.`
      if (/Recovery Taps/.test(name)) return 'Recovery taps for fishing lost rods and casing.'
      if (/Hoisting Plug/.test(name)) return 'Hoisting plug for lifting and lowering drill rods.'
      if (/Spare Parts/.test(name)) return 'Spare parts kit for Son-Mak exploration drilling tools.'
    }
    return ''
  }
  const all = [...d.products, ...extra]
  const byName = new Map()
  for (const p of all) {
    let name = cleanText(p.name)
    name = NAME_FIXES[name] || name
    let desc = cleanText(p.description)
    if (/Kayapa|Phone:|newsletter|\*Operating/i.test(desc)) desc = ''
    let candidates = (p.imageCandidates || []).map(stripSize)
    if (name === 'TP-45') candidates = candidates.filter((u) => !/t-?80|tp-?135|tp-?220/i.test(u))
    if (!candidates.length) {
      if (/Casings$/.test(name)) candidates = [FAMILY_IMG.casings]
      else if (/Rods$/.test(name)) candidates = [FAMILY_IMG.rods]
      else if (/Adapter Subs$/.test(name)) candidates = [FAMILY_IMG.adapters]
    }
    const rec = {
      name, category: p.category,
      description: cleanDesc(name, desc) || famDesc(name, p.category),
      specs: cleanSpecs(p.specs),
      candidates: candidates.map(stripSize).filter(Boolean),
      sourceUrl: p.sourceUrl,
    }
    const k = name.toLowerCase()
    const prev = byName.get(k)
    const rich = (x) => x.specs.length * 30 + x.candidates.length * 10 + x.description.length
    if (!prev || rich(rec) > rich(prev)) byName.set(k, rec)
  }
  for (const p of byName.values()) {
    push('sonmak', 'Son-Mak', {
      name: p.name, category: p.category, description: p.description, specs: p.specs, sourceUrl: p.sourceUrl,
    }, p.candidates)
  }
}

// ---------- Muster Fire ----------
{
  const files = readdirSync(DIR).filter((f) => f.startsWith('musterfire__') && !f.includes('product-range-index'))
  const CAT_LABELS = {
    'Foam Based Systems': 'Foam Based System',
    'Misting System': 'Misting System',
    'Solid Aerosol System': 'Solid Aerosol System (SAG)',
    'Impulse Powder System': 'Impulse Powder System (IPS)',
    'Portable Fire Extinguishers & Accessories': 'Portable Extinguishers & Accessories',
  }
  // components shared across the four system families -> one entry, pooled category
  const SHARED = new Map([
    ['remote actuators', 'Remote Actuators'],
    ['diagnostics module', 'Diagnostics Module'],
    ['remote activation device', 'Remote Activation Device'],
    ['control panels', 'Control Panels'],
    ['alarm panel', 'Muster Alarm Panel (M2AP02)'],
    ['muster alarm panel (m2ap02)', 'Muster Alarm Panel (M2AP02)'],
    ['signal test unit', 'Signal Test Unit'],
    ['initiator signal test unit (m2istu)', 'Initiator Signal Test Unit (M2ISTU)'],
    ['training box', 'Training Box'],
    ['muster 360 cloud-based portal', 'Muster 360 Cloud Portal'],
    ['integration module', 'Integration Module'],
  ])
  const sharedBest = new Map()
  const rest = []
  for (const f of files) {
    const d = load(f)
    const cat = CAT_LABELS[cleanText(d.category)] || cleanText(d.category)
    for (const p of d.products) {
      const name = cleanText(p.name)
      const key = name.toLowerCase()
      const rec = { name, category: cat, description: p.description, specs: p.specs, imageUrl: p.imageUrl, sourceUrl: p.sourceUrl }
      if (SHARED.has(key)) {
        const canon = SHARED.get(key)
        const prev = sharedBest.get(canon)
        const rich = (x) => (x.description || '').length + (x.specs || []).length * 40
        if (!prev || rich(rec) > rich(prev)) sharedBest.set(canon, { ...rec, name: canon })
      } else {
        rest.push(rec)
      }
    }
  }
  for (const p of rest) {
    push('musterfire', 'Muster Fire', {
      name: p.name, category: p.category,
      description: cleanDesc(p.name, p.description), specs: cleanSpecs(p.specs), sourceUrl: p.sourceUrl,
    }, [p.imageUrl])
  }
  for (const p of sharedBest.values()) {
    // site-side image mismatch: RAD tile reuses Indicator-Panel.jpg -> no image
    const img = p.name === 'Remote Activation Device' ? null : p.imageUrl
    push('musterfire', 'Muster Fire', {
      name: p.name, category: 'Controls & Accessories',
      description: cleanDesc(p.name, p.description), specs: cleanSpecs(p.specs), sourceUrl: p.sourceUrl,
    }, [img])
  }
}

// ---------- SinoMud ----------
{
  const d = load('sinomud__all.json')
  const NAME_FIXES = {
    'Lost Circulation Material Bentonite Pettet': 'Lost Circulation Material Bentonite Pellets',
    'Drilling Thiner CX-WELLCLEAN': 'Drilling Thinner CX-WELLCLEAN',
    'GREASE ROD GREASE EXTRA TACKY': 'Rod Grease Extra Tacky',
    'GREASE THREAD GREASE': 'Thread Grease',
    'GREASE COPPER THREAD GREASE': 'Copper Thread Grease',
    'FOAM PLUG A&B': 'Foam Plug A&B',
    'CEMENT': 'Cement',
    'Cement GYPSUM': 'Gypsum',
    'SODA ASH': 'Soda Ash',
    'LUBRICANT CX CUT': 'Cutting Lubricant CX CUT',
    'LUBRICANT Drill Lube': 'Drill Lube',
    'Drilling fluids Polyxcd': 'Drilling Polymer POLY XCD',
  }
  for (const p of d.products) {
    let name = cleanText(p.name)
    name = NAME_FIXES[name] || name
    // the 4 application-only chemicals are treating/brine chemicals
    const category = p.category === 'Oil & Gas' ? 'Treating Chemicals' : p.category
    push('sinomud', 'SinoMud', {
      name, category,
      description: cleanDesc(name, p.description),
      specs: cleanSpecs(p.specs),
      sourceUrl: p.sourceUrl,
    }, [p.imageUrl])
  }
}

writeFileSync(DIR + '../catalogue.json', JSON.stringify(catalogue, null, 1))
writeFileSync(DIR + '../image-manifest.json', JSON.stringify(manifest, null, 1))

const byBrand = {}
for (const p of catalogue) (byBrand[p.brand] ||= []).push(p)
for (const [b, ps] of Object.entries(byBrand)) {
  const cats = [...new Set(ps.map((p) => p.group))]
  console.log(`${b}: ${ps.length} products, ${cats.length} filter groups`)
  for (const c of cats) console.log(`   - ${c} (${ps.filter((p) => p.group === c).length})`)
}
console.log(`TOTAL: ${catalogue.length} products, ${manifest.length} images to fetch`)
const noDesc = catalogue.filter((p) => !p.description)
console.log('missing descriptions:', noDesc.length, noDesc.map((p) => `${p.brandKey}:${p.name}`).slice(0, 20))
