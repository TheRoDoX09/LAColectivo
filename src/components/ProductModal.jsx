import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabaseClient'

export default function ProductModal({ producto, onClose }) {
  const { addItem } = useCart()
  const [variantes, setVariantes] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)

  useEffect(() => {
    setSeleccionada(null)
    if (!producto) return
    supabase
      .from('producto_variantes')
      .select('*')
      .eq('producto_id', producto.id)
      .then(({ data }) => setVariantes(data || []))
  }, [producto])

  if (!producto) return null

  const tieneVariantes = variantes.length > 0
  const stockDisponible = tieneVariantes
    ? seleccionada?.cantidad > 0
    : producto.disponible && (producto.cantidad === null || producto.cantidad === undefined || producto.cantidad > 0)

  function handleAdd() {
    addItem({
      id: tieneVariantes ? `${producto.id}-${seleccionada.id}` : producto.id,
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen_url: producto.imagen_url,
      color: seleccionada?.color || null,
      medida: seleccionada?.medida || null,
    })
    onClose()
  }

  function variantLabel(v) {
    return [v.color, v.medida].filter(Boolean).join(' · ')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        <div className="pd-image">
          {producto.imagen_url ? (
            <img src={producto.imagen_url} alt={producto.nombre} />
          ) : null}
        </div>
        <div className="tag-row" style={{ marginBottom: '0.6rem' }}>
          {producto.categorias?.nombre && <span className="tag tag--brown">{producto.categorias.nombre}</span>}
          {producto.subcategorias?.nombre && <span className="tag tag--sage">{producto.subcategorias.nombre}</span>}
        </div>
        <h2 className="modal__title">{producto.nombre}</h2>
        <p className="pd-desc">{producto.descripcion || 'Sin descripción disponible.'}</p>
        <div className="pd-price">${Number(producto.precio).toFixed(2)}</div>

        {tieneVariantes && (
          <div className="form-field">
            <label>Elige color / medida</label>
            <div className="tag-row">
              {variantes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`tag tag--filter ${seleccionada?.id === v.id ? 'active' : ''} ${v.cantidad === 0 ? 'tag--sold' : ''}`}
                  disabled={v.cantidad === 0}
                  onClick={() => setSeleccionada(v)}
                >
                  {variantLabel(v)} {v.cantidad === 0 ? '(agotado)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {!tieneVariantes && typeof producto.cantidad === 'number' && producto.cantidad > 0 && (
          <p style={{ textTransform: 'none', fontSize: '0.85rem', color: '#4a3a20' }}>
            Quedan {producto.cantidad} disponibles
          </p>
        )}

        <button
          className="btn btn--brown btn--full"
          style={{ marginTop: '1.2rem' }}
          disabled={!stockDisponible || (tieneVariantes && !seleccionada)}
          onClick={handleAdd}
        >
          {stockDisponible ? 'Agregar al pedido' : 'Agotado'}
        </button>
      </div>
    </div>
  )
}
