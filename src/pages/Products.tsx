import Header from '../components/Header'
import Footer from '../components/Footer'
import productMuster from '../assets/photos/product-muster.jpg'
import productSonmak from '../assets/photos/product-sonmak.jpg'
import productSinomud from '../assets/photos/product-sinomud.jpg'

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
    brand: 'SinoMud',
    tag: 'Drilling fluids',
    img: productSinomud,
    desc: 'Drilling muds and fluid additives that keep boreholes stable, clean and moving.',
    items: ['Bentonite & CX gel', 'Liquid polymers (super-poly)', 'CX TROL, CHP & additives'],
  },
]

export default function Products() {
  return (
    <>
      <Header />
      <main id="top">
        <section className="phead">
          <div className="wrap">
            <p className="eyebrow">Products</p>
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
                <img src={p.img} alt={`${p.brand}, ${p.tag}`} />
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
      </main>
      <Footer />
    </>
  )
}
