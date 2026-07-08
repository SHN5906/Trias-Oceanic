import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Cta from '../sections/Cta'
import { BRANDS, PRODUCTS, type BrandInfo, type BrandKey, type Product } from '../data/products'
import logoMuster from '../assets/logos/muster.png'
import logoSonmak from '../assets/logos/sonmak-black.png'
import logoJsexplo from '../assets/logos/jsexplo.png'
import logoSinomud from '../assets/logos/sinomud.png'

// Hashed URLs for every local product photo (downloaded from the factories, served by us).
const IMAGES = import.meta.glob('../assets/products/*/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const imgSrc = (image: string | null) => (image ? IMAGES[`../assets/products/${image}`] : undefined)

const BRAND_LOGOS: Record<BrandKey, string> = {
  musterfire: logoMuster,
  sonmak: logoSonmak,
  jsexplo: logoJsexplo,
  sinomud: logoSinomud,
}

// The four lockups have very different visual densities (full-height wordmarks vs
// icon + microtext stacks); these factors equalise their apparent size.
const LOGO_SCALE: Record<BrandKey, number> = {
  musterfire: 0.8,
  sonmak: 1.35,
  jsexplo: 1.45,
  sinomud: 0.75,
}
const logoStyle = (k: BrandKey) => ({ '--ls': LOGO_SCALE[k] }) as React.CSSProperties

const slug = (s: string) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const BRAND_NAME: Record<string, string> = Object.fromEntries(BRANDS.map((b) => [b.key, b.name]))

// The contact form reads these params and pre-fills the enquiry.
const quoteHref = (p: Product) =>
  `/contact/?product=${encodeURIComponent(p.name)}&brand=${encodeURIComponent(BRAND_NAME[p.brand])}`

// Search haystacks, built once per session.
const HAY = new Map(
  PRODUCTS.map((p) => [
    p,
    `${p.name} ${p.category} ${p.group} ${p.description} ${p.specs.join(' ')}`.toLowerCase(),
  ]),
)

const prefersStillness = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Three states: full-screen brand showroom (landing), one brand's catalogue, everything.
type View = 'choose' | 'all' | BrandKey

function parseView(): View {
  const h = window.location.hash.slice(1)
  if (h === 'all') return 'all'
  if (BRANDS.some((b) => b.key === h)) return h as BrandKey
  const rangeBrand = new URLSearchParams(window.location.search).get('range')?.split(':')[0]
  if (rangeBrand && BRANDS.some((b) => b.key === rangeBrand)) return rangeBrand as BrandKey
  return 'choose'
}

function parseRangeParam(): Record<string, string | null> {
  const out: Record<string, string | null> = {}
  const range = new URLSearchParams(window.location.search).get('range')
  if (range) {
    const [key, g] = range.split(':')
    if (BRANDS.some((b) => b.key === key) && g) {
      const group = [...new Set(PRODUCTS.filter((p) => p.brand === key).map((p) => p.group))].find(
        (x) => slug(x) === g,
      )
      if (group) out[key] = group
    }
  }
  return out
}

// Right-edge fade on horizontal scroll strips: visible only while there is more content.
function useEdgeFade<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [fade, setFade] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setFade(el.scrollWidth - el.clientWidth - el.scrollLeft > 8)
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])
  return { ref, fade }
}

function ProductCard({ p }: { p: Product }) {
  const src = imgSrc(p.image)
  return (
    <li className="pcard">
      <figure className="pcard-img">
        {src ? (
          <img src={src} alt={p.name} loading="lazy" decoding="async" width="400" height="300" />
        ) : (
          <span className="pcard-noimg">Photo on request</span>
        )}
      </figure>
      <div className="pcard-body">
        <p className="pcard-cat">{p.category}</p>
        <h3>{p.name}</h3>
        {p.description && (
          <p className="pcard-desc" title={p.description}>
            {p.description}
          </p>
        )}
        {p.specs.length > 0 && (
          <ul className="pcard-specs">
            {p.specs.slice(0, 3).map((s) => (
              <li key={s} title={s}>
                <span className="pcard-spec-txt">{s}</span>
              </li>
            ))}
          </ul>
        )}
        <a className="pcard-cta" href={quoteHref(p)}>
          <span>
            Request a quote<span className="sr-only">{` for ${p.name}`}</span>
          </span>
          <svg width="12" height="9" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path
              d="M1 5h12m-4-4 4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </li>
  )
}

function BrandSection({
  brand,
  alt,
  filter,
  onFilter,
}: {
  brand: BrandInfo
  alt: boolean
  filter: string | null
  onFilter: (group: string | null) => void
}) {
  const items = useMemo(() => PRODUCTS.filter((p) => p.brand === brand.key), [brand.key])
  const groups = useMemo(() => {
    const g: { name: string; count: number }[] = []
    for (const p of items) {
      const e = g.find((x) => x.name === p.group)
      if (e) e.count += 1
      else g.push({ name: p.group, count: 1 })
    }
    return g
  }, [items])
  const shown = filter ? items.filter((p) => p.group === filter) : items
  // Unfiltered: break the grid into ranges so 90 cards stay scannable.
  // Filtered and still large: break it by factory sub-category (JS Explo's leaf categories).
  const blocks = useMemo(() => {
    if (!filter) {
      if (groups.length > 1)
        return groups.map((g) => ({ name: g.name as string | null, items: items.filter((p) => p.group === g.name) }))
      return [{ name: null as string | null, items }]
    }
    const inGroup = items.filter((p) => p.group === filter)
    const cats = [...new Set(inGroup.map((p) => p.category))]
    if (inGroup.length > 8 && cats.length > 1)
      return cats.map((c) => ({ name: c as string | null, items: inGroup.filter((p) => p.category === c) }))
    return [{ name: null as string | null, items: inGroup }]
  }, [filter, items, groups])
  const { ref: chipsRef, fade: chipsFade } = useEdgeFade<HTMLDivElement>()

  return (
    <section className={alt ? 'bsec alt' : 'bsec'} id={brand.key} aria-labelledby={`${brand.key}-title`}>
      <div className="wrap">
        <div className="bsec-head">
          <div>
            <p className="eyebrow">
              {brand.tag} · {items.length} products
            </p>
            <h2 id={`${brand.key}-title`}>
              <img className="bsec-logo" src={BRAND_LOGOS[brand.key]} alt="" style={logoStyle(brand.key)} />
              <span className="sr-only">{brand.name}</span>
            </h2>
            <p className="bsec-blurb">{brand.blurb}</p>
          </div>
        </div>

        {groups.length > 1 && (
          <div
            className={chipsFade ? 'chiprow fade-r' : 'chiprow'}
            ref={chipsRef}
            role="group"
            aria-label={`Filter ${brand.name} products by range`}
          >
            <button
              type="button"
              className={filter === null ? 'chip on' : 'chip'}
              aria-pressed={filter === null}
              onClick={() => onFilter(null)}
            >
              All <span>{items.length}</span>
            </button>
            {groups.map((g) => (
              <button
                type="button"
                key={g.name}
                className={filter === g.name ? 'chip on' : 'chip'}
                aria-pressed={filter === g.name}
                onClick={() => onFilter(filter === g.name ? null : g.name)}
              >
                {g.name} <span>{g.count}</span>
              </button>
            ))}
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {shown.length} of {items.length} {brand.name} products shown
        </p>

        <ul className="pgrid">
          {blocks.map((b) => (
            <Fragment key={b.name ?? 'all'}>
              {b.name && (
                <li className="pgrid-head">
                  <span>{b.name}</span>
                  <span className="n">{b.items.length}</span>
                </li>
              )}
              {b.items.map((p, i) => (
                <ProductCard key={`${p.category}-${p.name}-${i}`} p={p} />
              ))}
            </Fragment>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function Catalogue() {
  const [view, setViewState] = useState<View>(() => parseView())
  const [active, setActive] = useState<string>(BRANDS[0].key)
  const [filters, setFilters] = useState<Record<string, string | null>>(() => parseRangeParam())
  const [q, setQ] = useState<string>(() => new URLSearchParams(window.location.search).get('q') ?? '')
  const searching = q.trim().length > 0
  // Results grouped by brand, name matches ahead of description-only matches.
  const resultBlocks = useMemo(() => {
    if (!searching) return []
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
    const nameHit = (p: Product) => tokens.every((t) => p.name.toLowerCase().includes(t))
    return BRANDS.map((b) => {
      const found = PRODUCTS.filter(
        (p) => p.brand === b.key && tokens.every((t) => HAY.get(p)!.includes(t)),
      )
      found.sort((a, x) => Number(nameHit(x)) - Number(nameHit(a)))
      return { brand: b, items: found }
    }).filter((x) => x.items.length > 0)
  }, [q, searching])
  const resultCount = resultBlocks.reduce((n, b) => n + b.items.length, 0)
  const searchCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const b of resultBlocks) c[b.brand.key] = b.items.length
    return c
  }, [resultBlocks])
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of PRODUCTS) c[p.brand] = (c[p.brand] ?? 0) + 1
    return c
  }, [])
  const { ref: rowRef, fade: rowFade } = useEdgeFade<HTMLDivElement>()
  const barRef = useRef<HTMLElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  // Page-scoped body class: on mobile this page keeps only the brand bar sticky.
  useEffect(() => {
    document.body.classList.add('pcat')
    return () => document.body.classList.remove('pcat')
  }, [])

  // Expose header + brand bar heights for the sticky offsets.
  // Re-run when the bar mounts (it is absent on the showroom landing).
  const barVisible = view !== 'choose' || searching
  useEffect(() => {
    const header = document.querySelector('header')
    const set = () => {
      document.documentElement.style.setProperty('--hh', `${header?.offsetHeight ?? 0}px`)
      document.documentElement.style.setProperty('--bb', `${barRef.current?.offsetHeight ?? 0}px`)
    }
    set()
    const ro = new ResizeObserver(set)
    if (header) ro.observe(header)
    if (barRef.current) ro.observe(barRef.current)
    return () => ro.disconnect()
  }, [barVisible])

  // Track the visible section, only meaningful on the full view.
  useEffect(() => {
    if (searching || view !== 'all') return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-35% 0px -60% 0px' },
    )
    document.querySelectorAll('section.bsec[id]').forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [searching, view])

  // Keep the highlighted brand link visible inside the scrollable strip.
  const activeKey = view === 'all' ? active : view !== 'choose' ? view : null
  useEffect(() => {
    const row = rowRef.current
    if (!activeKey || !row || row.scrollWidth <= row.clientWidth) return
    const link = row.querySelector<HTMLElement>(`a[href="#${activeKey}"]`)
    if (link)
      row.scrollTo({
        left: link.offsetLeft - (row.clientWidth - link.offsetWidth) / 2,
        behavior: prefersStillness() ? 'auto' : 'smooth',
      })
  }, [activeKey])

  // "/" focuses the search from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Back/forward restores view, filter and search state.
  useEffect(() => {
    const onPop = () => {
      setViewState(parseView())
      setFilters(parseRangeParam())
      setQ(new URLSearchParams(window.location.search).get('q') ?? '')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Mirror the search term in the URL without spamming history.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (q.trim()) url.searchParams.set('q', q.trim())
    else url.searchParams.delete('q')
    window.history.replaceState(null, '', url)
  }, [q])

  const changeView = (v: View, scrollToId?: string) => {
    setViewState(v)
    const url = new URL(window.location.href)
    url.hash = v === 'choose' ? '' : v
    window.history.pushState(null, '', url)
    if (v === 'choose') window.scrollTo({ top: 0 })
    else if (scrollToId)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.getElementById(scrollToId)?.scrollIntoView()),
      )
  }

  const setFilter = (key: string, group: string | null) => {
    setFilters((f) => ({ ...f, [key]: group }))
    const url = new URL(window.location.href)
    if (group) url.searchParams.set('range', `${key}:${slug(group)}`)
    else url.searchParams.delete('range')
    url.hash = view === 'all' ? '' : view
    window.history.pushState(null, '', url)
  }

  // Panel / bar click: select the brand.
  const pickBrand = (e: React.MouseEvent, key: BrandKey) => {
    e.preventDefault()
    if (searching) {
      setQ('')
      changeView(key, key)
      return
    }
    if (view === key) return
    changeView(key, key)
  }

  const seeAll = (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (searching) setQ('')
    changeView('all')
  }

  const soloBrand = view !== 'all' ? BRANDS.find((b) => b.key === view) : null

  return (
    <>
      <Header />
      <main id="top">
        <h1 className="sr-only">Product catalogue</h1>

        {!searching && view === 'choose' && (
          <section className="bsel anim d1" aria-label="Pick a brand">
            <ul className="bsel-grid">
              {BRANDS.map((b) => (
                <li key={b.key}>
                  <a
                    className="bpanel"
                    href={`#${b.key}`}
                    onClick={(e) => pickBrand(e, b.key)}
                    aria-label={`${b.name}, ${b.tag}, ${counts[b.key]} products`}
                  >
                    <img className="bpanel-logo" src={BRAND_LOGOS[b.key]} alt="" style={logoStyle(b.key)} />
                    <span className="bpanel-meta" aria-hidden="true">
                      <span className="bpanel-tag">{b.tag}</span>
                      <span className="bpanel-cta">
                        {counts[b.key]} products
                        <svg width="12" height="9" viewBox="0 0 14 10" fill="none">
                          <path
                            d="M1 5h12m-4-4 4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="bsel-all">
              <button type="button" className="btn btn-copper" onClick={() => seeAll()}>
                See all {PRODUCTS.length} products
              </button>
            </div>
          </section>
        )}

        {(view !== 'choose' || searching) && (
        <nav className="brandbar" aria-label="Catalogue brands" ref={barRef}>
          <div className="wrap brandbar-in">
            <div className={rowFade ? 'brandbar-row fade-r' : 'brandbar-row'} ref={rowRef}>
              {BRANDS.map((b) => {
                const dim = searching && !searchCounts[b.key]
                const on = !searching && activeKey === b.key
                const n = searching ? searchCounts[b.key] ?? 0 : counts[b.key]
                return (
                  <a
                    key={b.key}
                    href={`#${b.key}`}
                    onClick={(e) => pickBrand(e, b.key)}
                    className={dim ? 'dim' : on ? 'on' : undefined}
                    aria-current={on ? 'true' : undefined}
                    aria-label={`${b.name}, ${n} products`}
                  >
                    <img className="bb-logo" src={BRAND_LOGOS[b.key]} alt="" style={logoStyle(b.key)} />
                    <span className="n">{n}</span>
                  </a>
                )
              })}
              <a
                href="#all"
                onClick={(e) => seeAll(e)}
                className={!searching && view === 'all' ? 'on' : undefined}
                aria-current={!searching && view === 'all' ? 'true' : undefined}
              >
                See all
                <span className="n">{PRODUCTS.length}</span>
              </a>
            </div>
            <div className="brandbar-tools">
              <div className="brandbar-search">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4.2-4.2" />
                </svg>
                <input
                  ref={searchRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setQ('')
                  }}
                  placeholder={`Search ${PRODUCTS.length} products`}
                  aria-label={`Search the catalogue, ${PRODUCTS.length} products`}
                />
                <kbd className="skey" aria-hidden="true">
                  /
                </kbd>
              </div>
              <a
                className="brandbar-top"
                href="#top"
                aria-label="Back to top of page"
                onClick={(e) => {
                  // plain scroll: keep the view hash intact
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: prefersStillness() ? 'auto' : 'smooth' })
                }}
              >
                Top
                <svg width="9" height="11" viewBox="0 0 10 14" fill="none" aria-hidden="true">
                  <path
                    d="M5 13V1M1 5l4-4 4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </nav>
        )}

        {searching ? (
          <section className="bsec ssec" aria-labelledby="search-title">
            <div className="wrap">
              <p className="eyebrow" id="search-title" aria-live="polite">
                {resultCount} {resultCount === 1 ? 'result' : 'results'} for “{q.trim()}”
              </p>
              {resultCount > 0 ? (
                <ul className="pgrid">
                  {resultBlocks.map(({ brand, items }) => (
                    <Fragment key={brand.key}>
                      <li className="pgrid-head pgrid-head-brand">
                        <img className="pgh-logo" src={BRAND_LOGOS[brand.key]} alt="" style={logoStyle(brand.key)} />
                        <span className="sr-only">{brand.name}</span>
                        <span className="n">{items.length}</span>
                      </li>
                      {items.map((p, i) => (
                        <ProductCard key={`${p.brand}-${p.name}-${i}`} p={p} />
                      ))}
                    </Fragment>
                  ))}
                </ul>
              ) : (
                <div className="ssec-empty">
                  <h2>No match.</h2>
                  <p className="lead">
                    Try a shorter code or a different word. Not listed does not mean not available:
                    we source to spec.
                  </p>
                  <a className="backlink" href="/contact/">
                    <span>Request a quote</span>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                      <path
                        d="M1 5h12m-4-4 4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </section>
        ) : view === 'all' ? (
          BRANDS.map((b, i) => (
            <BrandSection
              key={b.key}
              brand={b}
              alt={i % 2 === 1}
              filter={filters[b.key] ?? null}
              onFilter={(g) => setFilter(b.key, g)}
            />
          ))
        ) : soloBrand ? (
          <BrandSection
            brand={soloBrand}
            alt={false}
            filter={filters[soloBrand.key] ?? null}
            onFilter={(g) => setFilter(soloBrand.key, g)}
          />
        ) : null}

        <Cta />
      </main>
      <Footer />
    </>
  )
}
