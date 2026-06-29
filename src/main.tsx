import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/Home'
import Products from './pages/Products'
import Contact from './pages/Contact'

// Static MPA: each route is a real HTML file (see vite.config.ts inputs).
// All pages load this entry; the page component is chosen from the URL path.
function resolvePage() {
  const path = window.location.pathname.replace(/index\.html$/, '')
  if (path.startsWith('/products')) return Products
  if (path.startsWith('/contact')) return Contact
  return Home
}

const Page = resolvePage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
