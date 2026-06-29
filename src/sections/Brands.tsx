import muster from '../assets/logos/muster.png'
import sonmakBlack from '../assets/logos/sonmak-black.png'
import jsexplo from '../assets/logos/jsexplo.png'
import sinomud from '../assets/logos/sinomud.png'

const BRANDS = [
  {
    name: 'Muster Fire',
    logo: muster,
    alt: 'Muster Fire',
    desc: 'Automatic fire suppression for mobile equipment and fixed plant.',
  },
  {
    name: 'Son-Mak',
    logo: sonmakBlack,
    alt: 'Son-Mak',
    desc: 'Exploration drilling rigs, mud pumps and tooling.',
  },
  {
    name: 'JS Explo',
    logo: jsexplo,
    alt: 'JS Explo / Jinshi Drilltech',
    desc: 'Geological drilling tools, bits, rods and core barrels.',
  },
  {
    name: 'SinoMud',
    logo: sinomud,
    alt: 'SinoMud drilling fluids',
    desc: 'Drilling muds, bentonite, polymers and fluid additives.',
  },
]

export default function Brands() {
  return (
    <section className="brands" id="brands">
      <div className="wrap">
        <h2>Reference brands</h2>
        <div className="grid3">
          {BRANDS.map((b) => (
            <div className="plate" key={b.name}>
              <div className="logo">
                <img src={b.logo} alt={b.alt} />
              </div>
              <div className="body">
                <h3>{b.name}</h3>
                <p>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
