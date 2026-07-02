import Header from '../components/Header'
import Hero from '../sections/Hero'
import Brands from '../sections/Brands'
import Cta from '../sections/Cta'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <Brands />
        <Cta />
      </main>
      <Footer />
    </>
  )
}
