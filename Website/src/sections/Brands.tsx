import muster from '../assets/logos/muster.png'
import sonmakBlack from '../assets/logos/sonmak-black.png'
import jsexplo from '../assets/logos/jsexplo.png'
import sinomud from '../assets/logos/sinomud.png'

const BRANDS = [
  {
    name: 'Muster Fire',
    key: 'musterfire',
    logo: muster,
    alt: 'Muster Fire',
    desc: 'Automatic fire suppression for mobile equipment and fixed plant.',
  },
  {
    name: 'Son-Mak',
    key: 'sonmak',
    logo: sonmakBlack,
    alt: 'Son-Mak',
    desc: 'Exploration drilling rigs, mud pumps and tooling.',
  },
  {
    name: 'JS Explo',
    key: 'jsexplo',
    logo: jsexplo,
    alt: 'JS Explo / Jinshi Drilltech',
    desc: 'Geological drilling tools by Jinshi Drilltech: bits, rods and core barrels.',
  },
  {
    name: 'SinoMud',
    key: 'sinomud',
    logo: sinomud,
    alt: 'SinoMud drilling fluids',
    desc: 'Drilling muds, bentonite, polymers and fluid additives.',
  },
]

export default function Brands() {
  return (
    <section className="brands" id="brands">
      <div className="wrap">
        <h2>Partner brands</h2>
        <div className="grid3">
          {BRANDS.map((b) => (
            <a className="plate plate-link" key={b.name} href={`/products/#${b.key}`}>
              <span className="logo">
                <img src={b.logo} alt={b.alt} />
              </span>
              <span className="body">
                <h3>{b.name}</h3>
                <p>{b.desc}</p>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
