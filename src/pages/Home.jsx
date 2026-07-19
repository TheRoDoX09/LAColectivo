import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Logo from '../components/Logo'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'

export default function Home() {
  const [destacados, setDestacados] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase
      .from('productos')
      .select('*, categorias(nombre, slug), subcategorias(nombre, slug)')
      .eq('disponible', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setDestacados(data || []))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero__logo-slot">
          <Logo variant="full" />
        </div>
        <span className="tag hero__eyebrow">Tienda colaborativa</span>
        <h1 className="sr-only">LA Colectivo</h1>
        <p className="hero__subtitle">
          Un mismo espacio, muchas manos: ropa, accesorios, figuras, perfumes y más,
          hechos y curados por emprendedores locales.
        </p>
        <div className="hero__actions">
          <Link to="/catalogo" className="btn btn--brown">Ver catálogo</Link>
          <Link to="/emprendedores" className="btn btn--outline">Renta un espacio</Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">¿Qué es <span>LA Colectivo</span>?</h2>
            <p className="section__subtitle">
              Un bazar permanente donde varios emprendedores comparten un mismo local
              para vender sus productos, sin intermediarios ni comisiones por venta.
            </p>
          </div>
          <div className="about-grid">
            <div className="info-card">
              <h3 className="info-card__title">Hecho local</h3>
              <p className="info-card__text">Cada producto viene de un emprendedor de la comunidad.</p>
            </div>
            <div className="info-card">
              <h3 className="info-card__title">Catálogo variado</h3>
              <p className="info-card__text">Ropa, accesorios, figuras, perfumes y categorías nuevas cada mes.</p>
            </div>
            <div className="info-card">
              <h3 className="info-card__title">Recoge o recibe</h3>
              <p className="info-card__text">Elige pasar por tu pedido o recibirlo a domicilio.</p>
            </div>
            <div className="info-card">
              <h3 className="info-card__title">Espacio para crecer</h3>
              <p className="info-card__text">Rentamos espacios mensuales a nuevos emprendedores, sin comisión.</p>
            </div>
          </div>
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="section__head">
              <h2 className="section__title">Recién <span>llegados</span></h2>
            </div>
            <div className="grid">
              {destacados.map((p) => (
                <ProductCard key={p.id} producto={p} onClick={setSelected} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2.2rem' }}>
              <Link to="/catalogo" className="btn btn--outline">Ver todo el catálogo</Link>
            </div>
          </div>
        </section>
      )}

      <ProductModal producto={selected} onClose={() => setSelected(null)} />
    </>
  )
}
