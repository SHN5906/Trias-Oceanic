import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static multi-page site (home + products), deployed at the domain root.
// Each route is a real HTML file so deep links work on any static host.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: 'index.html',
        products: 'products/index.html',
        contact: 'contact/index.html',
      },
    },
  },
})
