import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CONTACTO, WHATSAPP_NUMERO } from '../lib/constants'
import Breadcrumbs from '../components/Breadcrumbs'

function whatsappLinkEspacio(espacio) {
  const mensaje = `Hola, me interesa rentar el espacio "${espacio.nombre}" ($${Number(espacio.precio_mensual).toFixed(2)}/mes) que vi en la página de LA Colectivo.`
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`
}

export default function Entrepreneurs() {
  const [espacios, setEspacios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('espacios_renta')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEspacios(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <section className="section">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Emprendedores' }]} />

        <div className="section__head" style={{ marginTop: '1rem' }}>
          <h1 className="section__title">Espacios para <span>emprendedores</span></h1>
          <p className="section__subtitle">
            Renta un espacio dentro de LA Colectivo y vende tus productos junto a otros emprendedores.
          </p>
        </div>

        <div className="terms-banner">
          <h3>¿Cómo funciona?</h3>
          <p>Renta mensual fija, sin comisión por venta. Tú pones el precio, tú te quedas con la ganancia.</p>
        </div>

        {loading ? (
          <div className="loading-text"><div className="spinner" />Cargando espacios...</div>
        ) : espacios.length === 0 ? (
          <p className="empty-state">Por ahora no hay espacios publicados. Vuelve pronto.</p>
        ) : (
          <div className="grid">
            {espacios.map((e) => (
              <div className="space-card" key={e.id}>
                <div className="space-card__image">
                  {e.imagen_url && <img src={e.imagen_url} alt={e.nombre} />}
                </div>
                <div className="space-card__body">
                  <h3>{e.nombre}</h3>
                  <p style={{ textTransform: 'none', fontSize: '0.9rem', color: '#4a3a20' }}>
                    {e.descripcion}
                  </p>
                  <div className="space-card__features">
                    {e.caracteristicas?.map((c) => (
                      <span key={c} className="tag tag--sage">{c}</span>
                    ))}
                  </div>
                  <div className="space-card__price">
                    ${Number(e.precio_mensual).toFixed(2)} <small>/ mes</small>
                  </div>

                  {e.disponible ? (
                    <>
                      <span className="space-card__stock">
                        {e.cantidad > 1 ? `${e.cantidad} espacios disponibles` : 'Disponible'}
                      </span>
                      <p className="space-card__contact-note">
                        Pregunta por este espacio: {CONTACTO.correo}
                      </p>
                      <a
                        className="btn btn--brown btn--sm btn--full"
                        href={whatsappLinkEspacio(e)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Solicitar por WhatsApp
                      </a>
                    </>
                  ) : (
                    <span className="tag tag--sold">Ocupado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
