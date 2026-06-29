import Header from '../components/Header'
import Footer from '../components/Footer'
import ContactForm from '../components/ContactForm'

type Detail = { label: string; value: React.ReactNode; href?: string }

const DETAILS: Detail[] = [
  { label: 'Email', value: '[email]', href: 'mailto:[email]' },
  { label: 'Phone', value: '[phone]', href: 'tel:[phone]' },
  { label: 'Address', value: '[address]' },
]

export default function Contact() {
  return (
    <>
      <Header />
      <main id="top">
        <section className="cpage">
          <div className="wrap cpage-grid">
            <div className="cpage-intro anim d2">
              <p className="eyebrow">Contact</p>
              <h1 className="display">
                Let's work <span className="cu">together.</span>
              </h1>
              <p className="lead">
                Tell us the scope, site location and timeline, and we'll get the right equipment to
                your operation. We reply within one business day.
              </p>
              <dl className="contact-details">
                {DETAILS.map((d) => (
                  <div className="contact-row" key={d.label}>
                    <dt>{d.label}</dt>
                    <dd>{d.href ? <a href={d.href}>{d.value}</a> : d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="cpage-form anim d3">
              <ContactForm />
            </div>
          </div>
          <div className="wrap cpage-back">
            <a className="backlink" href="/">
              <span>Back to home</span>
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
      </main>
      <Footer />
    </>
  )
}
