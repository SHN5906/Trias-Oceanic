import Logo from './Logo'

const NAV = [
  ['Partners', '/partners/'],
  ['Catalogue', '/products/'],
  ['Contact', '/contact/'],
] as const

export default function Header() {
  return (
    <header>
      <div className="wrap bar">
        <a className="brand" href="/" aria-label="Trias Oceanic, home">
          <Logo />
        </a>
        <nav className="nav" aria-label="Primary">
          {NAV.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
