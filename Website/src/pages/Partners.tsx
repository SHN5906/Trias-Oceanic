import Header from '../components/Header'
import Footer from '../components/Footer'
import Cta from '../sections/Cta'
import productMuster from '../assets/photos/product-muster.webp'
import productSonmak from '../assets/photos/product-sonmak.webp'
import productJsexplo from '../assets/photos/product-jsexplo.webp'
import productSinomud from '../assets/photos/product-sinomud.webp'

type Product = {
  brand: string
  tag: string
  img: string
  desc: string
  items: string[]
}

const PRODUCTS: Product[] = [
  {
    brand: 'Muster Fire',
    tag: 'Fire suppression',
    img: productMuster,
    desc: 'Automatic fire suppression for mobile equipment and fixed plant, plus manual extinguishers and fire risk assessments.',
    items: [
      'Automatic suppression for mobile & fixed plant',
      'Manual extinguishers & PPE',
    ],
  },
  {
    brand: 'Son-Mak',
    tag: 'Drilling rigs & tooling',
    img: productSonmak,
    desc: 'Exploration drilling rigs, mud pumps and the tooling that keeps them turning on site.',
    items: ['Exploration & core drilling rigs', 'Mud pumps', 'Rods, tooling & spares'],
  },
  {
    brand: 'JS Explo',
    tag: 'Drilling tools · Jinshi Drilltech',
    img: productJsexplo,
    desc: 'Geological drilling tools by Jinshi Drilltech: the consumables exploration programmes burn through.',
    items: ['Diamond bits & reaming shells', 'Drill rods & casing', 'Core barrels & wireline tools'],
  },
  {
    brand: 'SinoMud',
    tag: 'Drilling fluids',
    img: productSinomud,
    desc: 'Drilling muds and fluid additives that keep boreholes stable, clean and moving.',
    items: ['Bentonite & CX gel', 'Liquid polymers (super-poly)', 'CX TROL, CHP & additives'],
  },
]

export default function Partners() {
  return (
    <>
      <Header />
      <main id="top">
        <section className="phead">
          <div className="wrap">
            <p className="eyebrow">Partners</p>
            <h1 className="display">Equipment &amp; consumables we distribute</h1>
            <p className="lead">
              From fire suppression and drilling rigs to the fluids and spares that keep operations
              running.
            </p>
          </div>
        </section>

        {PRODUCTS.map((p, i) => (
          <section className={i % 2 ? 'prow alt' : 'prow'} key={p.brand}>
            <div className="wrap prow-grid">
              <figure className="prow-img">
                <img
                  src={p.img}
                  alt={`${p.brand}, ${p.tag}`}
                  width="1200"
                  height="800"
                  loading={i === 0 ? undefined : 'lazy'}
                  decoding="async"
                />
              </figure>
              <div className="prow-text">
                <p className="eyebrow">{p.tag}</p>
                <h2>{p.brand}</h2>
                <p className="lead">{p.desc}</p>
                <ul className="plist">
                  {p.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}

        <section className="cat-cta">
          <div className="wrap">
            <a className="backlink" href="/products/">
              <span>Browse the full catalogue</span>
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
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  )
}
