import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { uploadImage } from '../lib/uploadImage'
import { fetchCategoriasConSub } from '../lib/categorias'
import { esPrecioValido, esCantidadValida, esTextoSeguro, limpiarTexto, validarImagen, MAX_NOMBRE, MAX_TEXTO_LARGO } from '../lib/validation'

const empty = {
  nombre: '', descripcion: '', precio: '',
  categoria_id: '', subcategoria_id: '', sub_subcategoria_id: '',
  cantidad: '', disponible: true,
}

export default function ProductFormModal({ producto, onClose, onSaved }) {
  const [form, setForm] = useState(
    producto
      ? {
          ...empty,
          ...producto,
          precio: String(producto.precio),
          cantidad: producto.cantidad === null || producto.cantidad === undefined ? '' : String(producto.cantidad),
          categoria_id: producto.categoria_id || '',
          subcategoria_id: producto.subcategoria_id || '',
          sub_subcategoria_id: producto.sub_subcategoria_id || '',
        }
      : empty
  )
  const [categorias, setCategorias] = useState([])
  const [variantes, setVariantes] = useState([]) 
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(producto?.imagen_url || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingVariantes, setLoadingVariantes] = useState(!!producto)

  useEffect(() => {
    fetchCategoriasConSub().then(setCategorias)
  }, [])

  useEffect(() => {
    async function cargarVariantes() {
      if (!producto) { setLoadingVariantes(false); return }
      const { data } = await supabase
        .from('producto_variantes')
        .select('*')
        .eq('producto_id', producto.id)
      setVariantes(data || [])
      setLoadingVariantes(false)
    }
    cargarVariantes()
  }, [producto])

  const categoriaSeleccionada = categorias.find((c) => c.id === form.categoria_id)
  const subcategoriaSeleccionada = categoriaSeleccionada?.subcategorias.find((s) => s.id === form.subcategoria_id)

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

  function addVariante() {
    setVariantes((v) => [...v, { color: '', medida: '', cantidad: 0 }])
  }

  function updateVariante(idx, field, value) {
    setVariantes((v) => v.map((row, i) => (i === idx ? { ...row, [field]: value } : row)))
  }

  function removeVariante(idx) {
    setVariantes((v) => v.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const nombre = form.nombre.trim()
    if (!nombre) {
      setError('El nombre es obligatorio.')
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
    if (!esTextoSeguro(descripcion)) {
      setError('La descripción contiene caracteres no permitidos (< > { } \\ ^ ~ `).')
      return
    }
    if (!esPrecioValido(form.precio)) {
      setError('El precio debe ser un número mayor a 0.')
      return
    }
    if (!form.categoria_id) {
      setError('Elige una categoría.')
      return
    }
    if (!esCantidadValida(form.cantidad)) {
      setError('La cantidad en stock debe ser un número entero de 0 en adelante.')
      return
    }
    for (const v of variantes) {
      if (!esCantidadValida(v.cantidad, { opcional: false })) {
        setError('El stock de cada variante debe ser un número entero de 0 en adelante.')
        return
      }
      if (!esTextoSeguro(v.color) || !esTextoSeguro(v.medida)) {
        setError('El color o la medida de una variante contienen caracteres no permitidos.')
        return
      }
    }

    setSaving(true)

    let imagen_url = producto?.imagen_url || null
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
      precio: Number(form.precio),
      categoria_id: form.categoria_id || null,
      subcategoria_id: form.subcategoria_id || null,
      sub_subcategoria_id: form.sub_subcategoria_id || null,
      disponible: form.disponible,
      cantidad: variantes.length > 0 ? null : (form.cantidad === '' ? null : Number(form.cantidad)),
      imagen_url,
    }

    let productoId = producto?.id

    if (producto) {
      const { error: dbError } = await supabase.from('productos').update(payload).eq('id', producto.id)
      if (dbError) {
        setSaving(false)
        setError('No se pudo guardar el producto.')
        return
      }
    } else {
      const { data, error: dbError } = await supabase.from('productos').insert(payload).select().single()
      if (dbError) {
        setSaving(false)
        setError('No se pudo guardar el producto.')
        return
      }
      productoId = data.id
    }

    
    await supabase.from('producto_variantes').delete().eq('producto_id', productoId)
    const variantesValidas = variantes.filter((v) => v.color.trim() || v.medida.trim())
    if (variantesValidas.length > 0) {
      await supabase.from('producto_variantes').insert(
        variantesValidas.map((v) => ({
          producto_id: productoId,
          color: v.color.trim() || null,
          medida: v.medida.trim() || null,
          cantidad: Number(v.cantidad) || 0,
        }))
      )
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 className="modal__title">{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => update('nombre', limpiarTexto(e.target.value))} />
          </div>
          <div className="form-field">
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => update('descripcion', limpiarTexto(e.target.value))} />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Categoría</label>
              <select
                value={form.categoria_id}
                onChange={(e) => setForm((f) => ({ ...f, categoria_id: e.target.value, subcategoria_id: '', sub_subcategoria_id: '' }))}
              >
                <option value="">Elige una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Subcategoría (opcional)</label>
              <select
                value={form.subcategoria_id}
                onChange={(e) => setForm((f) => ({ ...f, subcategoria_id: e.target.value, sub_subcategoria_id: '' }))}
                disabled={!categoriaSeleccionada || categoriaSeleccionada.subcategorias.length === 0}
              >
                <option value="">Sin subcategoría</option>
                {categoriaSeleccionada?.subcategorias.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Sub-subcategoría (opcional)</label>
            <select
              value={form.sub_subcategoria_id}
              onChange={(e) => update('sub_subcategoria_id', e.target.value)}
              disabled={!subcategoriaSeleccionada || subcategoriaSeleccionada.subSubcategorias.length === 0}
            >
              <option value="">Sin sub-subcategoría</option>
              {subcategoriaSeleccionada?.subSubcategorias.map((ss) => (
                <option key={ss.id} value={ss.id}>{ss.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Precio</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio}
                onChange={(e) => update('precio', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>
                Cantidad en stock {variantes.length > 0 && '(deshabilitado: usa variantes)'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.cantidad}
                disabled={variantes.length > 0}
                onChange={(e) => update('cantidad', e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Foto (relación 1:1, se recorta al centro)</label>
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
              Disponible
            </label>
          </div>

          <div className="form-field">
            <label>Variantes (color / medida), cada una con su propio stock</label>
            {loadingVariantes ? (
              <p className="empty-state" style={{ padding: '1rem' }}>Cargando variantes...</p>
            ) : (
              <>
                {variantes.map((v, idx) => (
                  <div className="variante-row" key={idx}>
                    <input
                      className="variante-row__color"
                      placeholder="Color"
                      value={v.color}
                      onChange={(e) => updateVariante(idx, 'color', limpiarTexto(e.target.value))}
                    />
                    <input
                      className="variante-row__medida"
                      placeholder="Medida"
                      value={v.medida}
                      onChange={(e) => updateVariante(idx, 'medida', limpiarTexto(e.target.value))}
                    />
                    <input
                      className="variante-row__stock"
                      type="number"
                      min="0"
                      placeholder="Stock"
                      value={v.cantidad}
                      onChange={(e) => updateVariante(idx, 'cantidad', e.target.value)}
                    />
                    <button type="button" className="btn btn--outline btn--sm variante-row__borrar" onClick={() => removeVariante(idx)}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn--outline btn--sm" onClick={addVariante} style={{ marginTop: '0.4rem' }}>
                  + Agregar variante
                </button>
              </>
            )}
          </div>

          <button className="btn btn--brown btn--full" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </form>
      </div>
    </div>
  )
}
