/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#13241F',
        mute: '#4B5A54',
        subtle: '#8A968F',
        line: '#E2E7E4',
        mist: '#F1F4F3',
        deep: '#0F3D2E',
        deepest: '#0A2A20',
        pine: '#1C6B4E',
        copper: '#B5793F',
        copperdim: '#9A6533',
        copperlt: '#CE9356',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
