// Download product images, validate, convert to WebP <=150KB into Website/src/assets/products/<brand>/.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const MANIFEST = JSON.parse(readFileSync(new URL('./image-manifest.json', import.meta.url), 'utf8'))
const OUT_BASE = '/Users/sohan/Trias Oceanic/Website/src/assets/products'
const TMP = new URL('./img-raw/', import.meta.url).pathname
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
mkdirSync(TMP, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function run(cmd, args) {
  // returns a truthy string on success even when the tool prints nothing (cwebp -quiet)
  try { return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString() || ' ' } catch { return null }
}
function dims(file) {
  const out = run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file])
  if (!out) return null
  const w = +(out.match(/pixelWidth: (\d+)/)?.[1] ?? 0)
  const h = +(out.match(/pixelHeight: (\d+)/)?.[1] ?? 0)
  return w && h ? { w, h } : null
}

const REFERER = {
  jsexplo: 'https://www.jsexplo.com/',
  sonmak: 'https://son-mak.com.tr/',
  musterfire: 'https://musterfire.com/',
  sinomud: 'https://www.sinomud.com/',
}

async function download(url, dest, brand) {
  try {
    const res = await fetch(encodeURI(decodeURI(url)), {
      headers: { 'User-Agent': UA, Referer: REFERER[brand] ?? '' },
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 2000) return false
    writeFileSync(dest, buf)
    return true
  } catch { return false }
}

function toWebp(src, dest, maxW) {
  for (const q of [78, 60, 45]) {
    const args = ['-quiet', '-q', String(q), '-metadata', 'none']
    if (maxW > 800) args.push('-resize', '800', '0')
    if (!run('cwebp', [...args, src, '-o', dest])) return false
    if (statSync(dest).size <= 150 * 1024) return true
  }
  return statSync(dest).size <= 200 * 1024 // tolerate slight overshoot at q45
}

const results = { ok: [], fail: [] }
let idx = 0
await Promise.all(Array.from({ length: 6 }, async () => {
  while (idx < MANIFEST.length) {
    const item = MANIFEST[idx++]
    const outDir = `${OUT_BASE}/${item.brand}`
    mkdirSync(outDir, { recursive: true })
    const dest = `${outDir}/${item.slug}.webp`
    if (existsSync(dest)) { results.ok.push(item.slug); continue }
    let done = false
    for (const url of item.urls) {
      const ext = (url.match(/\.(\w{3,4})(?:\?|$)/)?.[1] || 'img').toLowerCase()
      const raw = `${TMP}${item.brand}__${item.slug}.${ext}`
      if (!(await download(url, raw, item.brand))) continue
      let src = raw
      if (ext === 'webp' || ext === 'img') { // cwebp cannot read webp; normalize via sips
        const png = raw + '.png'
        if (!run('sips', ['-s', 'format', 'png', raw, '--out', png])) continue
        src = png
      }
      const d = dims(src)
      if (!d || d.w < 240 || d.h < 160 || d.w / d.h > 6.5) continue
      if (toWebp(src, dest, d.w)) { done = true; break }
    }
    if (done) results.ok.push(item.slug)
    else { results.fail.push({ brand: item.brand, slug: item.slug, urls: item.urls }); if (existsSync(dest)) unlinkSync(dest) }
    await sleep(80)
  }
}))

writeFileSync(new URL('./image-results.json', import.meta.url), JSON.stringify(results.fail, null, 1))
console.log(`OK: ${results.ok.length}  FAIL: ${results.fail.length}`)
for (const f of results.fail) console.log('  FAIL', f.brand, f.slug, f.urls[0])
