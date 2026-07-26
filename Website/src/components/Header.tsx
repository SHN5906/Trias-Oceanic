import Logo from './Logo'

const NAV = [
  ['Partners', '/partners/'],
  ['Catalogue', '/products/'],
  ['Contact', '/contact/'],
] as const

// Same normalisation as main.tsx's router: /contact/index.html === /contact/ === /contact.
const norm = (p: string) => p.replace(/index\.html$/, '').replace(/\/+$/, '') || '/'

export default function Header() {
  const current = norm(window.location.pathname)
  return (
    <>
      <a className="skip" href="#top">
        Skip to content
      </a>
      <header>
        <div className="wrap bar">
          <a className="brand" href="/" aria-label="Trias Oceanic, home">
            <Logo />
          </a>
          <nav className="nav" aria-label="Primary">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} aria-current={current === norm(href) ? 'page' : undefined}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>
    </>
  )
}
