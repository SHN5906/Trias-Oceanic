export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <h1 className="display anim d2">
            Equipment, parts &amp; safety for mining in <span className="cu">Papua New Guinea</span>
          </h1>
          <p className="lead anim d3">
            Trias Oceanic sources, supplies and distributes equipment for the mining and exploration
            industries. Fire suppression, drilling, safety and critical spare parts, delivered where
            operations need them.
          </p>
          <div className="cta-row anim d4">
            <a className="btn btn-copper" href="/contact/">
              Request a quote
            </a>
            <a className="btn btn-ghost" href="#brands">
              What we distribute
            </a>
          </div>
        </div>

        <figure className="shot anim d3">
          <div className="ph" role="img" aria-label="Image placeholder">
            Image placeholder
          </div>
        </figure>
      </div>
    </section>
  )
}
