// The brand lockup ships as an SVG with live <text> (Montserrat). Inlining the
// raw markup into the DOM lets the page's loaded Montserrat render it; an <img>
// src would sandbox the SVG and fall back to a system font.
import logo from '../assets/brand/trias-oceanic-logo.svg?raw'
import logoReverse from '../assets/brand/trias-oceanic-logo-reverse.svg?raw'

export default function Logo({ reverse = false }: { reverse?: boolean }) {
  return (
    <span
      className="logo-lockup"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: reverse ? logoReverse : logo }}
    />
  )
}
