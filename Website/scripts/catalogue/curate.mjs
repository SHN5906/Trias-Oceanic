// Curation pass over src/data/products.ts: fixes scrape artifacts flagged by the
// 2026-07 content audit (translation-artifact names, HTML entities, factory typos,
// broken units, header rows kept as specs, duplicate SKUs, boilerplate).
// Re-runnable: apply after any catalogue regeneration. Node scripts/catalogue/curate.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const FILE = fileURLToPath(new URL('../../src/data/products.ts', import.meta.url))
const src = readFileSync(FILE, 'utf8')

const LINE_RE =
  /^  \{ brand: (".*?"), category: (".*?"), group: (".*?"), name: (".*?"), description: (".*?"), specs: (\[.*?\]), image: (.*?) \},$/

const lines = src.split('\n')
const products = []
let head = [],
  tail = [],
  inList = false,
  afterList = false
for (const l of lines) {
  const m = l.match(LINE_RE)
  if (m) {
    inList = true
    products.push({
      brand: JSON.parse(m[1]),
      category: JSON.parse(m[2]),
      group: JSON.parse(m[3]),
      name: JSON.parse(m[4]),
      description: JSON.parse(m[5]),
      specs: JSON.parse(m[6]),
      image: m[7] === 'null' ? null : JSON.parse(m[7]),
    })
  } else if (!inList) head.push(l)
  else {
    afterList = true
    tail.push(l)
  }
}
if (!products.length || !afterList) throw new Error('parse failed')

// ---------- 1. remove scraped non-products and duplicate SKUs ----------
const REMOVE = new Set([
  'MOBILE TRANSPORT', // site section heading, not a product
  'Classification of Specific-Purpose Core Barrel',
  'Rope drill pipe packaging',
  'YN- 1000 drilling rig', // duplicates of the YN-1000/1500 entries below
  'YN-1500 type drilling rig',
  'W Series Casing', // duplicate of Direct-Connection Casing with corrupted part numbers
])

// ---------- 2. rename translation artifacts / normalise casing ----------
const RENAME = {
  'Trojan horse gripper': 'Carriage Gripper',
  Faucet: 'Water Swivel',
  'Refundable salvage spear': 'Retrievable Fishing Spear',
  'Free pliers': 'Break-out Tongs',
  'Magnetic salvage': 'Magnetic Fishing Tool',
  Tap: 'Fishing Tap',
  'Hand rubbing type (T type) lifter': 'Manual T-type Lifter',
  'Sleeve Splint': 'Casing Clamp',
  'Pulling fork, pad fork': 'Pulling Fork & Pad Fork',
  'Drill pipe protection powder, lubricating paste': 'Drill Pipe Protection Lubricants',
  'Accident handling tools': 'Fishing & Recovery Tool Set',
  'YN-800 Drill Rig Technical Performance': 'YN-800 Drill Rig',
  'YN-1000 Drill Rig Technical Performance': 'YN-1000 Drill Rig',
  'YN-1500 Drill Rig Technical Performance': 'YN-1500 Drill Rig',
  'YN-1800 Drill Rig Technical Performance': 'YN-1800 Drill Rig',
  'YN-2500 Drill Rig Technical Performance': 'YN-2500 Drill Rig',
  'YN-2500D type drilling rig': 'YN-2500D Drill Rig',
  'X series diamond drill bits': 'X Series Diamond Drill Bits',
  'Direct-Connection Casing': 'W Series Casing',
  'Suction Pipe &amp; Suction Faucet': 'Suction Pipe & Strainer',
  'FOAM PLUG A&#038;B': 'Foam Plug A&B',
  'API GRADE BENTONITE CX-BEN': 'API Grade Bentonite CX-BEN',
  'HDD PREMIUM BENTONITE SUPER GEL': 'HDD Premium Bentonite SUPER GEL',
  'Drilling polymer VIS': 'Drilling Polymer VIS',
  'Drilling polymer CX BIOVIS': 'Drilling Polymer CX BIOVIS',
}

const CAT_RENAME = {
  Sliver: 'Overshots',
  'Unscrewing tool': 'Break-out Tools',
  'Accident handling tools': 'Fishing & Recovery Tools',
  'Sleeve Splint': 'Casing Clamps',
  Faucet: 'Water Swivels',
}

// ---------- 3. description overrides (factual, no invented specs) ----------
const DESC = {
  'S Series Diamond Drill Bits':
    'S series matrix bits are sintered without pressure: the matrix is infiltrated with molten metal and embedded with diamond.',
  'X Series Diamond Drill Bits':
    'Made by simultaneous pressing and sintering: the diamond-embedded matrix is consolidated with the steel body.',
  'Calcium Nitrate Granular': 'Granular calcium nitrate for drilling fluid treatment.',
  'JINSHI Drilltech Standard Core Barrel': 'Core barrel built to the JINSHI Drilltech factory standard.',
  Adapter: 'Adapters for connecting drill string components of different threads and sizes.',
  'Suction Pipe & Strainer': 'Suction hose and strainer set for the mud pump intake line.',
  'Joint Casing': 'Coupling sleeve for joining C series casing.',
  'Water Swivel': 'Feeds flushing fluid from the mud pump into the rotating drill string for borehole circulation.',
  'Break-out Tongs': 'Special tongs for unscrewing drill pipe joints.',
  'Direct-connected wireline coring drill stem': 'Direct-connected wireline coring drill stem for C series systems.',
  'Mud Test Kit': 'Field kit for daily mud checks: Marsh funnel viscometer, mud balance and sand content set.',
  'Soda Ash': 'Sodium carbonate (Na₂CO₃) for drilling fluid treatment.',
  'Sodium Formate': 'Sodium formate (CHNaO₂), a white crystalline salt used in drilling fluids.',
  Cement: 'Low temperature sulfate resisting cement.',
  'pH Test Paper': 'pH indicator strips for checking mud pH on site.',
}

// C-series "Reaming Shell" has a tautological description; the drill-bit one is fine.
const DESC_BY_NAME_AND_OLDDESC = [
  { name: 'Reaming Shell', old: 'Series C Reamer.', desc: 'Reaming shell that holds hole gauge for C series core barrels.' },
]

// ---------- 4. global text repairs (names, descriptions, specs) ----------
const TEXT_FIXES = [
  [/&amp;/g, '&'],
  [/&#0?38;/g, '&'],
  [/\bTorgue\b/g, 'Torque'],
  [/\bLaod\b/g, 'Load'],
  [/\bAgigator\b/g, 'Agitator'],
  [/\bagigator\b/g, 'agitator'],
  [/\bDtandard\b/g, 'Standard'],
  [/\bcaly\b/g, 'clay'],
  [/fresh, sanity and hard water/g, 'fresh, salty and hard water'],
  [/\bploymer\b/g, 'polymer'],
  [/\bpattems\b/g, 'patterns'],
  [/69\.9m m/g, '69.9 mm'],
  [/\b(\d+)lt\b/g, '$1 L'],
  [/ rpm\/min/g, ' rpm'],
  [/(\d+) rev\/min\.?/g, '$1 rpm'],
  [/LowPressure/g, 'Low Pressure'],
  [/Max\.Working/g, 'Max. Working'],
  [/(\d)gal/g, '$1 gal'],
  [/\(10`\)/g, '(10′)'],
  [/60\. 44/g, '60.44'],
  [/to100\.5/g, 'to 100.5'],
  [/,\./g, '.'],
  [/℃/g, ' °C'],
  [/℉/g, ' °F'],
  [/(\d) degrees C\b/g, '$1 °C'],
  [/(\d) C\b(?!\w)/g, '$1 °C'],
  [/g\/cm 3/g, 'g/cm³'],
  [/BaSO 4/g, 'BaSO₄'],
  [/C 6 H 8 O 7/g, 'C₆H₈O₇'],
  [/Na2CO3/g, 'Na₂CO₃'],
  [/CHNaO2/g, 'CHNaO₂'],
  [/\bIt designed\b/g, 'It is designed'],
  [/\ba API\b/g, 'an API'],
  [/\ba upgraded\b/g, 'an upgraded'],
  [/to removes\b/g, 'to remove'],
  [/mud aggravation/g, 'mud weighting'],
  [/for daily\.$/g, 'for daily checks.'],
  [/stabilization/g, 'stabilisation'],
  [/\bcolored\b/g, 'coloured'],
  [/Bentonite SUPER-GEL/g, 'Bentonite SUPER GEL'],
  [/\bSINO MUD\b/g, 'SinoMud'],
  [/\bBIO VIS\b/g, 'CX BIOVIS'],
  [/Drilling fluids Polyxcd/g, 'POLY XCD'],
  [/\bPOLYXCD\b/g, 'POLY XCD'],
  [/hydraulic pipe drawing machine/g, 'hydraulic pipe pulling machine'],
  [/The stirring barrel/g, 'The mixing barrel'],
  [/APPEARANCE: WHITE CRYSTALLINE POWDER/g, 'Appearance: white crystalline powder'],
  [/Goldstone Drilling produces various adapters\./g, 'Adapters for drill string connections.'],
  [/\(42\.8 ?gal\/min\.?\)/g, '(51.5 gal/min)'], // 195 l/min correctly converted
  [/0-65 l\/min\. \(14\.3 gal\/min\.\)/g, '0-65 l/min (17.2 gal/min)'],
  [/0-65 l\/min\. \(17 gal\/min\.\)/g, '0-65 l/min (17.2 gal/min)'],
  [/LUBRICANT Drill Lube/g, 'Drill Lube'],
  // C-series tool-set spec labels: same translation artifacts as the product names
  [/Refundable salvage spear: /g, 'Retrievable fishing spear: '],
  [/magnetic salvage: /g, 'Magnetic fishing tool: '],
  [/\bTap: (?=GSZ)/g, 'Fishing tap: '],
  [/pipe cutter: /g, 'Pipe cutter: '],
  [/Faucet: (?=JS)/g, 'Water swivel: '],
  [/Hand rubbing lifter: /g, 'Manual lifter: '],
  [/drill pipe free tong: /g, 'Drill pipe break-out tong: '],
  [/inner tube free clamp: /g, 'Inner tube clamp: '],
  [/KTDLM-N\. KTDLM-H/g, 'KTDLM-N, KTDLM-H'],
]
const fixText = (s) => TEXT_FIXES.reduce((acc, [re, rep]) => acc.replace(re, rep), s)

// ---------- 5. spec-row surgery ----------
const DROP_SPEC_ROWS = new Set([
  'ITEMS: SPECIFICATIONS',
  'NAME: SODIUM FORMATE 95%',
  'Project: Parameter Performance',
  'Caliber: Product Standards',
  'Lip: Teeth',
])
// jsexplo part-number-to-bare-number tables: keep the part numbers, drop the unit-less values
const PARTNO_ROW = /^([A-Z]{2,4}-[A-Z]{1,3}[A-Z0-9]*-\d{3,4}): [\d. ]+$/

function cleanSpecs(p) {
  let specs = p.specs.map(fixText).map((s) => s.replace(/\.$/, '').trim())
  specs = specs.filter((s) => !DROP_SPEC_ROWS.has(s))
  // drop cryptic single-letter numeric rows (scraped depth-table cells)
  specs = specs.filter((s) => !/^[A-Z]{1,2}: \d+$/.test(s))
  // packers: 6 mm hose spec contradicts the 44-94 mm product; drop the stray rows
  if (p.name === 'Grouting Packers') specs = specs.filter((s) => !/^(Inner|Outer) diameter:/.test(s))
  // collapse part-number tables into one honest row
  const partNos = specs.filter((s) => PARTNO_ROW.test(s)).map((s) => s.match(PARTNO_ROW)[1])
  if (partNos.length >= 2) {
    specs = specs.filter((s) => !PARTNO_ROW.test(s))
    specs.push(`Part numbers: ${partNos.join(', ')}`)
  }
  // duplicate keys: keep the first occurrence only (scraped tables repeated headers)
  const seen = new Set()
  specs = specs.filter((s) => {
    const key = s.split(':')[0].toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return specs.slice(0, 5)
}

// ---------- apply ----------
let out = []
const seenNames = new Set()
for (const p of products) {
  if (REMOVE.has(p.name)) continue
  p.name = RENAME[p.name] ?? p.name
  if (p.brand === 'sonmak') p.name = p.name.replace(/ Head Assemblies$/, ' Head Assembly')
  if (p.brand === 'jsexplo') {
    p.category = CAT_RENAME[p.category] ?? p.category
    // scraped sentence-case menu items -> Title Case like the other brands
    p.category = p.category
      .replace(/(^|\s)([a-z])/g, (m, sp, c) => sp + c.toUpperCase())
      .replace(/ (And|Of|The) /g, (m) => m.toLowerCase())
    // full drill rigs were filed under coring consumables by the source nav
    if (/^Y Series Full Hydraulic/i.test(p.category)) {
      p.category = 'Y Series Drill Rigs'
      p.group = 'Hydraulic Drill Rigs'
    }
  }
  const override = DESC[p.name]
  const condOverride = DESC_BY_NAME_AND_OLDDESC.find((o) => o.name === p.name && p.description === o.old)
  p.description = condOverride ? condOverride.desc : override ?? p.description
  p.description = fixText(p.description)
  // headless scraped openers: give the sentence back its subject
  if (/^\(/.test(p.description) || /^(Acts|acts) as\b/.test(p.description)) {
    const shortName = p.name.replace(/^Drilling Polymer /, '').replace(/ \(.*\)$/, '')
    p.description = `${shortName} ${p.description[0].toLowerCase()}${p.description.slice(1)}`
  }
  p.specs = cleanSpecs(p)
  // Son-Mak rigs: differentiate the cloned family sentence with the rig's own published torque
  if (p.brand === 'sonmak' && p.category === 'Core Drilling Rigs') {
    const torque = p.specs.find((s) => /^Max\.? Torque/i.test(s))
    p.description = torque
      ? `Fully hydraulic core drilling rig with hydraulic rod making and breaking. ${torque.replace(/^Max\.? Torque:?\s*/i, 'Max torque ')}.`
      : p.description
  }
  const k = `${p.brand}:${p.name.toLowerCase()}`
  if (seenNames.has(k)) continue
  seenNames.add(k)
  out.push(p)
}

// brand blurb: reconcile JS Explo with the Jinshi Drilltech logo shown everywhere
head = head.map((l) =>
  l.includes('"key": "jsexplo"') || l.includes('key: "jsexplo"')
    ? l.replace(
        /"blurb": ".*?"/,
        '"blurb": "Geological drilling tools by Jinshi Drilltech: bits, rods, casing, core barrels and rig accessories."',
      )
    : l,
)

const esc = (v) => JSON.stringify(v)
const body = out.map(
  (p) =>
    `  { brand: ${esc(p.brand)}, category: ${esc(p.category)}, group: ${esc(p.group)}, name: ${esc(p.name)}, description: ${esc(p.description)}, specs: ${esc(p.specs)}, image: ${esc(p.image)} },`,
)
writeFileSync(FILE, [...head, ...body, ...tail].join('\n'))
console.log(`curated: ${products.length} -> ${out.length} products (${products.length - out.length} removed)`)
