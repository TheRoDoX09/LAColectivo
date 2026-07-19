import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabaseClient'
import { esTelefonoValido, esTextoSeguro, limpiarTexto, MAX_NOMBRE, MAX_TEXTO_LARGO } from '../lib/validation'

export default function CartDrawer() {
  const { items, updateQty, total, isOpen, setIsOpen, clearCart } = useCart()
  const [step, setStep] = useState('cart') 
  const [form, setForm] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    tipo_entrega: 'recoger',
    direccion: '',
    notas: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  function close() {
    setIsOpen(false)
    if (step === 'success') {
      setStep('cart')
      setForm({ cliente_nombre: '', cliente_telefono: '', tipo_entrega: 'recoger', direccion: '', notas: '' })
    }
  }

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const nombre = form.cliente_nombre.trim()
    if (!nombre) {
      setError('Completa tu nombre para continuar.')
      return
    }
    if (nombre.length > MAX_NOMBRE) {
      setError(`El nombre no puede superar ${MAX_NOMBRE} caracteres.`)
      return
    }
    if (!esTextoSeguro(nombre)) {
      setError('El nombre contiene caracteres no permitidos (< > { } \\ ^ ~ `).')
      return
    }
    if (!esTelefonoValido(form.cliente_telefono)) {
      setError('Escribe un teléfono válido a 10 dígitos.')
      return
    }
    if (form.tipo_entrega === 'domicilio' && !form.direccion.trim()) {
      setError('Escribe la dirección para el envío a domicilio.')
      return
    }
    const direccion = form.direccion.trim()
    const notas = form.notas.trim()
    if (direccion.length > MAX_TEXTO_LARGO || notas.length > MAX_TEXTO_LARGO) {
      setError('La dirección o las notas son demasiado largas.')
      return
    }
    if (!esTextoSeguro(direccion) || !esTextoSeguro(notas)) {
      setError('La dirección o las notas contienen caracteres no permitidos (< > { } \\ ^ ~ `).')
      return
    }

    setSubmitting(true)
    const { error: dbError } = await supabase.from('pedidos').insert({
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_telefono: form.cliente_telefono.trim(),
      tipo_entrega: form.tipo_entrega,
      direccion: form.tipo_entrega === 'domicilio' ? form.direccion.trim() : null,
      notas: form.notas.trim() || null,
      items: items.map((i) => ({
        producto_id: i.producto_id || i.id,
        nombre: i.nombre,
        color: i.color || null,
        medida: i.medida || null,
        precio: i.precio,
        cantidad: i.cantidad,
      })),
      total,
    })
    setSubmitting(false)

    if (dbError) {
      setError('No se pudo enviar el pedido. Intenta de nuevo en unos minutos.')
      return
    }

    clearCart()
    setStep('success')
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={close} aria-label="Cerrar">✕</button>

        {step === 'cart' && (
          <>
            <h2 className="modal__title">Tu pedido</h2>
            {items.length === 0 ? (
              <p className="empty-state">Todavía no agregas productos.</p>
            ) : (
              <>
                {items.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item__thumb">
                      {item.imagen_url && <img src={item.imagen_url} alt={item.nombre} />}
                    </div>
                    <div className="cart-item__info">
                      <div className="cart-item__name">
                        {item.nombre}
                        {(item.color || item.medida) && (
                          <span className="cart-item__variant"> ({[item.color, item.medida].filter(Boolean).join(' · ')})</span>
                        )}
                      </div>
                      <div className="cart-item__price">${Number(item.precio).toFixed(2)}</div>
                    </div>
                    <div className="qty-control">
                      <button onClick={() => updateQty(item.id, item.cantidad - 1)} aria-label="Quitar uno">−</button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => updateQty(item.id, item.cantidad + 1)} aria-label="Agregar uno">+</button>
                    </div>
                  </div>
                ))}
                <div className="cart-total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <button className="btn btn--brown btn--full" onClick={() => setStep('form')}>
                  Continuar
                </button>
              </>
            )}
          </>
        )}

        {step === 'form' && (
          <>
            <h2 className="modal__title">Datos de tu pedido</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Nombre</label>
                <input
                  value={form.cliente_nombre}
                  onChange={(e) => updateForm('cliente_nombre', limpiarTexto(e.target.value))}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="form-field">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={form.cliente_telefono}
                  onChange={(e) => updateForm('cliente_telefono', e.target.value)}
                  placeholder="10 dígitos"
                />
              </div>

              <div className="form-field">
                <label>Entrega</label>
                <div className="delivery-toggle">
                  <button
                    type="button"
                    className={`delivery-option ${form.tipo_entrega === 'recoger' ? 'active' : ''}`}
                    onClick={() => updateForm('tipo_entrega', 'recoger')}
                  >
                    Recoger en tienda
                  </button>
                  <button
                    type="button"
                    className={`delivery-option ${form.tipo_entrega === 'domicilio' ? 'active' : ''}`}
                    onClick={() => updateForm('tipo_entrega', 'domicilio')}
                  >
                    A domicilio
                  </button>
                </div>
              </div>

              {form.tipo_entrega === 'domicilio' && (
                <div className="form-field">
                  <label>Dirección</label>
                  <textarea
                    value={form.direccion}
                    onChange={(e) => updateForm('direccion', limpiarTexto(e.target.value))}
                    placeholder="Calle, número, colonia, referencias"
                  />
                </div>
              )}

              <div className="form-field">
                <label>Notas (opcional)</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => updateForm('notas', limpiarTexto(e.target.value))}
                  placeholder="Tallas, colores, alguna aclaración..."
                />
              </div>

              <div className="cart-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <p style={{ textTransform: 'none', fontSize: '0.85rem', color: '#4a3a20', marginBottom: '1rem' }}>
                El pago se coordina directamente con el colectivo al confirmar tu pedido (no se procesan pagos en línea).
              </p>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" className="btn btn--outline" onClick={() => setStep('cart')}>
                  Volver
                </button>
                <button type="submit" className="btn btn--brown btn--full" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar pedido'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'success' && (
          <>
            <h2 className="modal__title">¡Pedido enviado!</h2>
            <p className="pd-desc">
              Recibimos tu pedido. El colectivo se pondrá en contacto contigo para confirmar disponibilidad y coordinar el pago.
            </p>
            <button className="btn btn--brown btn--full" onClick={close}>
              Entendido
            </button>
          </>
        )}
      </div>
    </div>
  )
}
