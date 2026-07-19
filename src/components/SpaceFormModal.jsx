import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { uploadImage } from '../lib/uploadImage'
import { esPrecioValido, esCantidadValida, esTextoSeguro, limpiarTexto, validarImagen, MAX_NOMBRE, MAX_TEXTO_LARGO } from '../lib/validation'

const empty = { nombre: '', descripcion: '', caracteristicas: '', precio_mensual: '', cantidad: '1', disponible: true }

export default function SpaceFormModal({ espacio, onClose, onSaved }) {
  const [form, setForm] = useState(
    espacio
      ? {
          ...espacio,
          precio_mensual: String(espacio.precio_mensual),
          cantidad: String(espacio.cantidad ?? 1),
          caracteristicas: (espacio.caracteristicas || []).join(', '),
        }
      : empty
  )
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(espacio?.imagen_url || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    const { valido, error: imgError } = validarImagen(f)
    if (!valido) {
      setError(imgError)
      e.target.value = ''
      return
    }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const nombre = form.nombre.trim()
    if (!nombre) {
      setError('El nombre del espacio es obligatorio.')
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
    const descripcion = form.descripcion.trim()
    if (descripcion.length > MAX_TEXTO_LARGO) {
      setError(`La descripción no puede superar ${MAX_TEXTO_LARGO} caracteres.`)
      return
    }
    if (!esTextoSeguro(descripcion) || !esTextoSeguro(form.caracteristicas)) {
      setError('La descripción o las características contienen caracteres no permitidos (< > { } \\ ^ ~ `).')
      return
    }
    if (!esPrecioValido(form.precio_mensual)) {
      setError('El precio mensual debe ser un número mayor a 0.')
      return
    }
    if (!esCantidadValida(form.cantidad, { opcional: false }) || Number(form.cantidad) < 1) {
      setError('La cantidad de espacios debe ser un número entero de 1 en adelante.')
      return
    }

    setSaving(true)

    let imagen_url = espacio?.imagen_url || null
    if (file) {
      const { url, error: uploadErr } = await uploadImage(file)
      if (uploadErr) {
        setSaving(false)
        setError('No se pudo subir la imagen.')
        return
      }
      imagen_url = url
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      caracteristicas: form.caracteristicas
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      precio_mensual: Number(form.precio_mensual),
      cantidad: Number(form.cantidad) || 1,
      disponible: form.disponible,
      imagen_url,
    }

    const { error: dbError } = espacio
      ? await supabase.from('espacios_renta').update(payload).eq('id', espacio.id)
      : await supabase.from('espacios_renta').insert(payload)

    setSaving(false)

    if (dbError) {
      setError('No se pudo guardar el espacio.')
      return
    }

    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 className="modal__title">{espacio ? 'Editar espacio' : 'Nuevo espacio'}</h2>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Nombre del espacio</label>
            <input value={form.nombre} onChange={(e) => update('nombre', limpiarTexto(e.target.value))} />
          </div>
          <div className="form-field">
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => update('descripcion', limpiarTexto(e.target.value))} />
          </div>
          <div className="form-field">
            <label>Características (separadas por coma)</label>
            <input
              value={form.caracteristicas}
              onChange={(e) => update('caracteristicas', limpiarTexto(e.target.value))}
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Precio mensual</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio_mensual}
                onChange={(e) => update('precio_mensual', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Cantidad de espacios iguales</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.cantidad}
                onChange={(e) => update('cantidad', e.target.value)}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Foto</label>
            {preview && (
              <div className="pd-image" style={{ marginBottom: '0.6rem' }}>
                <img src={preview} alt="Vista previa" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFile} />
          </div>
          <div className="form-field">
            <label>
              <input
                type="checkbox"
                checked={form.disponible}
                onChange={(e) => update('disponible', e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Disponible para rentar
            </label>
          </div>
          <button className="btn btn--brown btn--full" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar espacio'}
          </button>
        </form>
      </div>
    </div>
  )
}
