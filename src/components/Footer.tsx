import Logo from './Logo'

export default function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <a className="brand" href="/" aria-label="Trias Oceanic">
          <Logo reverse />
        </a>
        <span className="legal">© 2026 Trias Oceanic · [Legal]</span>
      </div>
    </footer>
  )
}
