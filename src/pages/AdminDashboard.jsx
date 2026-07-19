import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { fetchCategoriasConSub, slugify } from '../lib/categorias'
import { MAX_NOMBRE, esTextoSeguro, limpiarTexto } from '../lib/validation'
import Logo from '../components/Logo'
import ProductFormModal from '../components/ProductFormModal'
import SpaceFormModal from '../components/SpaceFormModal'

const TABS = [
  { id: 'productos', label: 'Productos' },
  { id: 'espacios', label: 'Espacios' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'pedidos', label: 'Pedidos' },
]

export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('productos')

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Logo />
          <span>Panel administrador</span>
        </div>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button className="btn btn--white btn--sm" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <div className="admin-panel">
        {tab === 'productos' && <ProductosTab />}
        {tab === 'espacios' && <EspaciosTab />}
        {tab === 'categorias' && <CategoriasTab />}
        {tab === 'pedidos' && <PedidosTab />}
      </div>
    </div>
  )
}

const DISPONIBILIDAD_FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'disponible', label: 'Disponibles' },
  { id: 'agotado', label: 'Agotados' },
]

function ProductosTab() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [disponibilidadFiltro, setDisponibilidadFiltro] = useState('todos')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('productos')
      .select('*, categorias(nombre), subcategorias(nombre), producto_variantes(id, color, medida, cantidad)')
      .order('created_at', { ascending: false })
    setProductos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const categoriasDisponibles = useMemo(() => {
    const nombres = new Set(productos.map((p) => p.categorias?.nombre).filter(Boolean))
    return [...nombres].sort()
  }, [productos])

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      if (disponibilidadFiltro === 'disponible' && !p.disponible) return false
      if (disponibilidadFiltro === 'agotado' && p.disponible) return false
      if (categoriaFiltro !== 'todas' && p.categorias?.nombre !== categoriaFiltro) return false
      if (!term) return true
      const haystack = [p.nombre, p.descripcion, p.categorias?.nombre, p.subcategorias?.nombre]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [productos, busqueda, categoriaFiltro, disponibilidadFiltro])

  async function toggleDisponible(p) {
    await supabase.from('productos').update({ disponible: !p.disponible }).eq('id', p.id)
    load()
  }

  async function handleDelete(p) {
    if (!confirm(`¿Borrar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    await supabase.from('productos').delete().eq('id', p.id)
    load()
  }

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(p) {
    setEditing(p)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    load()
  }

  return (
    <div>
      <div className="admin-list-head">
        <h2>Productos ({filtrados.length}{filtrados.length !== productos.length ? ` de ${productos.length}` : ''})</h2>
        <button className="btn btn--brown btn--sm" onClick={openNew}>+ Nuevo producto</button>
      </div>

      <div className="catalog-toolbar" style={{ marginBottom: '1.2rem' }}>
        <div className="tag-row">
          {DISPONIBILIDAD_FILTROS.map((f) => (
            <button
              key={f.id}
              className={`tag tag--filter ${disponibilidadFiltro === f.id ? 'active' : ''}`}
              onClick={() => setDisponibilidadFiltro(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="catalog-toolbar__search">
          <select
            className="search-input catalog-toolbar__search-field"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            {categoriasDisponibles.map((nombre) => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
          <input
            className="search-input catalog-toolbar__search-field"
            placeholder="Buscar producto"
            value={busqueda}
            onChange={(e) => setBusqueda(limpiarTexto(e.target.value))}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-text"><div className="spinner" />Cargando...</div>
      ) : productos.length === 0 ? (
        <p className="empty-state">Aún no hay productos. Agrega el primero.</p>
      ) : filtrados.length === 0 ? (
        <p className="empty-state">No encontramos productos con esos filtros.</p>
      ) : (
        filtrados.map((p) => {
          const tieneVariantes = p.producto_variantes?.length > 0
          const stockTotal = tieneVariantes
            ? p.producto_variantes.reduce((sum, v) => sum + v.cantidad, 0)
            : p.cantidad
          return (
            <div className="admin-row" key={p.id}>
              <div className="admin-row__thumb">
                {p.imagen_url && <img src={p.imagen_url} alt={p.nombre} />}
              </div>
              <div className="admin-row__info">
                <div className="admin-row__name">{p.nombre}</div>
                <div className="admin-row__meta">
                  <span className={`status-dot ${p.disponible ? '' : 'off'}`} />
                  {p.disponible ? 'Disponible' : 'Agotado'} · ${Number(p.precio).toFixed(2)}
                  {' · '}{p.categorias?.nombre}{p.subcategorias?.nombre ? ` / ${p.subcategorias.nombre}` : ''}
                  {typeof stockTotal === 'number' && ` · Stock: ${stockTotal}`}
                  {tieneVariantes && ` · ${p.producto_variantes.length} variante(s)`}
                </div>
              </div>
              <div className="admin-row__actions">
                <button className="btn btn--outline btn--sm" onClick={() => toggleDisponible(p)}>
                  {p.disponible ? 'Marcar agotado' : 'Marcar disponible'}
                </button>
                <button className="btn btn--outline btn--sm" onClick={() => openEdit(p)}>Editar</button>
                <button className="btn btn--outline btn--sm" onClick={() => handleDelete(p)}>Borrar</button>
              </div>
            </div>
          )
        })
      )}

      {showForm && (
        <ProductFormModal producto={editing} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}

function EspaciosTab() {
  const [espacios, setEspacios] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [precioMin, setPrecioMin] = useState('')
  const [precioMax, setPrecioMax] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('espacios_renta').select('*').order('created_at', { ascending: false })
    setEspacios(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function updatePrecioMin(value) {
    if (value !== '' && Number(value) < 0) return
    setPrecioMin(value)
  }

  function updatePrecioMax(value) {
    if (value !== '' && Number(value) < 0) return
    setPrecioMax(value)
  }

  const min = precioMin === '' ? null : Number(precioMin)
  const max = precioMax === '' ? null : Number(precioMax)
  const rangoInvalido = min !== null && max !== null && min > max

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (rangoInvalido) return []
    return espacios.filter((e) => {
      const precio = Number(e.precio_mensual)
      if (min !== null && precio < min) return false
      if (max !== null && precio > max) return false
      if (!term) return true
      return e.nombre.toLowerCase().includes(term)
    })
  }, [espacios, busqueda, min, max, rangoInvalido])

  async function toggleDisponible(e) {
    await supabase.from('espacios_renta').update({ disponible: !e.disponible }).eq('id', e.id)
    load()
  }

  async function handleDelete(e) {
    if (!confirm(`¿Borrar "${e.nombre}"? Esta acción no se puede deshacer.`)) return
    await supabase.from('espacios_renta').delete().eq('id', e.id)
    load()
  }

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(e) {
    setEditing(e)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    load()
  }

  return (
    <div>
      <div className="admin-list-head">
        <h2>Espacios de renta ({filtrados.length}{filtrados.length !== espacios.length ? ` de ${espacios.length}` : ''})</h2>
        <button className="btn btn--brown btn--sm" onClick={openNew}>+ Nuevo espacio</button>
      </div>

      <div className="catalog-toolbar" style={{ marginBottom: '1.2rem' }}>
        <input
          className="search-input catalog-toolbar__search-field"
          placeholder="Buscar espacio"
          value={busqueda}
          onChange={(e) => setBusqueda(limpiarTexto(e.target.value))}
        />
        <div className="catalog-toolbar__price-group">
          <input
            className="search-input catalog-toolbar__price-field"
            type="number"
            min="0"
            step="1"
            placeholder="Precio mín."
            value={precioMin}
            onChange={(e) => updatePrecioMin(e.target.value)}
          />
          <input
            className="search-input catalog-toolbar__price-field"
            type="number"
            min="0"
            step="1"
            placeholder="Precio máx."
            value={precioMax}
            onChange={(e) => updatePrecioMax(e.target.value)}
          />
        </div>
      </div>
      {rangoInvalido && <div className="form-error">El precio mínimo no puede ser mayor al precio máximo.</div>}

      {loading ? (
        <div className="loading-text"><div className="spinner" />Cargando...</div>
      ) : espacios.length === 0 ? (
        <p className="empty-state">Aún no hay espacios publicados.</p>
      ) : filtrados.length === 0 ? (
        <p className="empty-state">No encontramos espacios con esos filtros.</p>
      ) : (
        filtrados.map((e) => (
          <div className="admin-row" key={e.id}>
            <div className="admin-row__thumb">
              {e.imagen_url && <img src={e.imagen_url} alt={e.nombre} />}
            </div>
            <div className="admin-row__info">
              <div className="admin-row__name">{e.nombre}</div>
              <div className="admin-row__meta">
                <span className={`status-dot ${e.disponible ? '' : 'off'}`} />
                {e.disponible ? 'Disponible' : 'Ocupado'} · ${Number(e.precio_mensual).toFixed(2)}/mes · Cantidad: {e.cantidad ?? 1}
              </div>
            </div>
            <div className="admin-row__actions">
              <button className="btn btn--outline btn--sm" onClick={() => toggleDisponible(e)}>
                {e.disponible ? 'Marcar ocupado' : 'Marcar disponible'}
              </button>
              <button className="btn btn--outline btn--sm" onClick={() => openEdit(e)}>Editar</button>
              <button className="btn btn--outline btn--sm" onClick={() => handleDelete(e)}>Borrar</button>
            </div>
          </div>
        ))
      )}

      {showForm && (
        <SpaceFormModal espacio={editing} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}

function CategoriasTab() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [nuevaCat, setNuevaCat] = useState('')
  const [nuevaSub, setNuevaSub] = useState({}) 
  const [nuevaSubSub, setNuevaSubSub] = useState({}) 
  const [openSub, setOpenSub] = useState({}) 
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setCategorias(await fetchCategoriasConSub())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addCategoria() {
    const nombre = nuevaCat.trim()
    if (!nombre) return
    if (nombre.length > MAX_NOMBRE) { setError(`El nombre no puede superar ${MAX_NOMBRE} caracteres.`); return }
    if (!esTextoSeguro(nombre)) { setError('El nombre contiene caracteres no permitidos (< > { } \\ ^ ~ `).'); return }
    if (categorias.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
      setError('Ya existe una categoría con ese nombre.')
      return
    }
    setError('')
    const { error: err } = await supabase.from('categorias').insert({
      nombre,
      slug: slugify(nombre),
      orden: categorias.length + 1,
    })
    if (err) { setError('No se pudo crear la categoría (¿ya existe?).'); return }
    setNuevaCat('')
    load()
  }

  async function deleteCategoria(cat) {
    if (!confirm(`¿Borrar la categoría "${cat.nombre}" y todas sus subcategorías? Los productos que la usaban se quedarán sin categoría.`)) return
    await supabase.from('categorias').delete().eq('id', cat.id)
    load()
  }

  async function addSubcategoria(cat) {
    const nombre = (nuevaSub[cat.id] || '').trim()
    if (!nombre) return
    if (nombre.length > MAX_NOMBRE) { setError(`El nombre no puede superar ${MAX_NOMBRE} caracteres.`); return }
    if (!esTextoSeguro(nombre)) { setError('El nombre contiene caracteres no permitidos (< > { } \\ ^ ~ `).'); return }
    if (cat.subcategorias.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase())) {
      setError('Ya existe una subcategoría con ese nombre en esta categoría.')
      return
    }
    setError('')
    const { error: err } = await supabase.from('subcategorias').insert({
      categoria_id: cat.id,
      nombre,
      slug: slugify(nombre),
      orden: cat.subcategorias.length + 1,
    })
    if (err) { setError('No se pudo crear la subcategoría (¿ya existe en esta categoría?).'); return }
    setNuevaSub((s) => ({ ...s, [cat.id]: '' }))
    load()
  }

  async function deleteSubcategoria(sub) {
    if (!confirm(`¿Borrar la subcategoría "${sub.nombre}" y todas sus sub-subcategorías?`)) return
    await supabase.from('subcategorias').delete().eq('id', sub.id)
    load()
  }

  async function addSubSubcategoria(sub) {
    const nombre = (nuevaSubSub[sub.id] || '').trim()
    if (!nombre) return
    if (nombre.length > MAX_NOMBRE) { setError(`El nombre no puede superar ${MAX_NOMBRE} caracteres.`); return }
    if (!esTextoSeguro(nombre)) { setError('El nombre contiene caracteres no permitidos (< > { } \\ ^ ~ `).'); return }
    if (sub.subSubcategorias.some((ss) => ss.nombre.toLowerCase() === nombre.toLowerCase())) {
      setError('Ya existe una sub-subcategoría con ese nombre en esta subcategoría.')
      return
    }
    setError('')
    const { error: err } = await supabase.from('sub_subcategorias').insert({
      subcategoria_id: sub.id,
      nombre,
      slug: slugify(nombre),
      orden: sub.subSubcategorias.length + 1,
    })
    if (err) { setError('No se pudo crear la sub-subcategoría (¿ya existe en esta subcategoría?).'); return }
    setNuevaSubSub((s) => ({ ...s, [sub.id]: '' }))
    load()
  }

  async function deleteSubSubcategoria(subSub) {
    if (!confirm(`¿Borrar "${subSub.nombre}"?`)) return
    await supabase.from('sub_subcategorias').delete().eq('id', subSub.id)
    load()
  }

  return (
    <div>
      <div className="admin-list-head">
        <h2>Categorías y subcategorías</h2>
      </div>
      {error && <div className="form-error">{error}</div>}

      <div className="admin-row" style={{ marginBottom: '1.5rem' }}>
        <input
          className="search-input"
          style={{ flex: 1 }}
          placeholder="Nombre de la nueva categoría"
          value={nuevaCat}
          onChange={(e) => setNuevaCat(limpiarTexto(e.target.value))}
        />
        <button className="btn btn--brown btn--sm" onClick={addCategoria}>+ Agregar categoría</button>
      </div>

      {loading ? (
        <div className="loading-text"><div className="spinner" />Cargando...</div>
      ) : (
        categorias.map((cat) => (
          <div className="categoria-block" key={cat.id}>
            <div className="categoria-block__head">
              <strong>{cat.nombre}</strong>
              <button className="btn btn--outline btn--sm" onClick={() => deleteCategoria(cat)}>Borrar categoría</button>
            </div>

            <ul className="categoria-block__subs">
              {cat.subcategorias.map((sub) => (
                <li key={sub.id} style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <button
                      type="button"
                      className="cat-tree__link"
                      style={{ padding: 0, border: 'none', background: 'none', font: 'inherit', cursor: 'pointer' }}
                      onClick={() => setOpenSub((o) => ({ ...o, [sub.id]: !o[sub.id] }))}
                    >
                      {sub.subSubcategorias.length > 0 ? (openSub[sub.id] ? '− ' : '+ ') : ''}{sub.nombre}
                    </button>
                    <button className="btn btn--outline btn--sm" onClick={() => deleteSubcategoria(sub)}>Borrar</button>
                  </div>

                  {openSub[sub.id] && (
                    <ul className="categoria-block__subs" style={{ marginLeft: '1.2rem', marginTop: '0.5rem' }}>
                      {sub.subSubcategorias.map((subSub) => (
                        <li key={subSub.id}>
                          <span>{subSub.nombre}</span>
                          <button className="btn btn--outline btn--sm" onClick={() => deleteSubSubcategoria(subSub)}>Borrar</button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {openSub[sub.id] && (
                    <div className="categoria-block__add" style={{ marginLeft: '1.2rem' }}>
                      <input
                        className="search-input"
                        placeholder="Nueva sub-subcategoría (ej. Hombre)"
                        value={nuevaSubSub[sub.id] || ''}
                        onChange={(e) => setNuevaSubSub((s) => ({ ...s, [sub.id]: limpiarTexto(e.target.value) }))}
                      />
                      <button className="btn btn--outline btn--sm" onClick={() => addSubSubcategoria(sub)}>+ Agregar</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="categoria-block__add">
              <input
                className="search-input"
                placeholder="Nueva subcategoría"
                value={nuevaSub[cat.id] || ''}
                onChange={(e) => setNuevaSub((s) => ({ ...s, [cat.id]: limpiarTexto(e.target.value) }))}
              />
              <button className="btn btn--outline btn--sm" onClick={() => addSubcategoria(cat)}>+ Agregar</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const RANGOS = [
  { id: 'dia', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
  { id: 'todos', label: 'Todos' },
]

function dentroDeRango(fechaISO, rango) {
  const fecha = new Date(fechaISO)
  const ahora = new Date()
  if (rango === 'todos') return true
  if (rango === 'dia') {
    return fecha.toDateString() === ahora.toDateString()
  }
  if (rango === 'semana') {
    const inicioSemana = new Date(ahora)
    inicioSemana.setDate(ahora.getDate() - ahora.getDay())
    inicioSemana.setHours(0, 0, 0, 0)
    return fecha >= inicioSemana
  }
  if (rango === 'mes') {
    return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
  }
  return true
}

function PedidoCard({ p, onUpdateEstado }) {
  return (
    <div className="pedido-card">
      <div className="pedido-card__head">
        <div>
          <strong>{p.cliente_nombre}</strong> · {p.cliente_telefono}
          <div className="admin-row__meta" style={{ marginTop: '0.2rem' }}>
            {p.tipo_entrega === 'domicilio' ? `Domicilio: ${p.direccion}` : 'Recoge en tienda'}
            {' · '}{new Date(p.created_at).toLocaleString('es-MX')}
          </div>
        </div>
        <span className={`tag ${p.estado === 'cancelado' ? 'tag--sold' : 'tag--brown'}`}>{p.estado}</span>
      </div>
      <div className="pedido-card__items">
        {p.items?.map((it) => `${it.cantidad}× ${it.nombre}${it.color || it.medida ? ` (${[it.color, it.medida].filter(Boolean).join(' · ')})` : ''}`).join(' · ')}
        {p.notas && <div style={{ marginTop: '0.3rem' }}>Notas: {p.notas}</div>}
      </div>
      <strong>Total: ${Number(p.total).toFixed(2)}</strong>

      <div className="pedido-card__actions">
        {p.estado === 'pendiente' && (
          <>
            <button className="btn btn--brown btn--sm" onClick={() => onUpdateEstado(p, 'confirmado')}>Confirmar</button>
            <button className="btn btn--outline btn--sm" onClick={() => onUpdateEstado(p, 'cancelado')}>Cancelar</button>
          </>
        )}
        {p.estado === 'confirmado' && (
          <>
            <button className="btn btn--brown btn--sm" onClick={() => onUpdateEstado(p, 'entregado')}>Marcar entregado</button>
            <button className="btn btn--outline btn--sm" onClick={() => onUpdateEstado(p, 'cancelado')}>Cancelar</button>
          </>
        )}
        {(p.estado === 'entregado' || p.estado === 'cancelado') && (
          <button className="btn btn--outline btn--sm" onClick={() => onUpdateEstado(p, 'pendiente')}>Reabrir</button>
        )}
      </div>
    </div>
  )
}

function PedidosTab() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [rango, setRango] = useState('todos')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false })
    setPedidos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateEstado(pedido, estado) {
    await supabase.from('pedidos').update({ estado }).eq('id', pedido.id)
    load()
  }

  const enRango = useMemo(
    () => pedidos.filter((p) => dentroDeRango(p.created_at, rango)),
    [pedidos, rango]
  )

  const buscados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return enRango
    return enRango.filter((p) => p.cliente_nombre.toLowerCase().includes(term))
  }, [enRango, busqueda])

  const pendientes = useMemo(() => buscados.filter((p) => p.estado === 'pendiente'), [buscados])
  const confirmados = useMemo(() => buscados.filter((p) => p.estado === 'confirmado'), [buscados])
  const entregados = useMemo(() => buscados.filter((p) => p.estado === 'entregado'), [buscados])
  const cancelados = useMemo(() => buscados.filter((p) => p.estado === 'cancelado'), [buscados])

  return (
    <div>
      <div className="admin-list-head">
        <h2>Pedidos</h2>
      </div>

      <div className="catalog-toolbar" style={{ marginTop: '1.2rem' }}>
        <div className="stats-row" style={{ marginBottom: 0 }}>
          {RANGOS.map((r) => (
            <button
              key={r.id}
              className={`admin-tab ${rango === r.id ? 'active' : ''}`}
              onClick={() => setRango(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <input
          className="search-input catalog-toolbar__search-field"
          placeholder="Buscar nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(limpiarTexto(e.target.value))}
        />
      </div>

      {loading ? (
        <div className="loading-text"><div className="spinner" />Cargando...</div>
      ) : (
        <>
          <div className="admin-list-head" style={{ marginTop: '1.5rem' }}>
            <h3>Pedidos pendientes ({pendientes.length})</h3>
          </div>
          {pendientes.length === 0 ? (
            <p className="empty-state">No hay pedidos pendientes con esos filtros.</p>
          ) : (
            pendientes.map((p) => <PedidoCard key={p.id} p={p} onUpdateEstado={updateEstado} />)
          )}

          <div className="admin-list-head" style={{ marginTop: '1.5rem' }}>
            <h3>Pedidos confirmados ({confirmados.length})</h3>
          </div>
          {confirmados.length === 0 ? (
            <p className="empty-state">No hay pedidos confirmados con esos filtros.</p>
          ) : (
            confirmados.map((p) => <PedidoCard key={p.id} p={p} onUpdateEstado={updateEstado} />)
          )}

          <div className="admin-list-head" style={{ marginTop: '1.5rem' }}>
            <h3>Pedidos entregados ({entregados.length})</h3>
          </div>
          {entregados.length === 0 ? (
            <p className="empty-state">No hay pedidos entregados con esos filtros.</p>
          ) : (
            entregados.map((p) => <PedidoCard key={p.id} p={p} onUpdateEstado={updateEstado} />)
          )}

          <div className="admin-list-head" style={{ marginTop: '1.5rem' }}>
            <h3>Pedidos cancelados ({cancelados.length})</h3>
          </div>
          {cancelados.length === 0 ? (
            <p className="empty-state">No hay pedidos cancelados con esos filtros.</p>
          ) : (
            cancelados.map((p) => <PedidoCard key={p.id} p={p} onUpdateEstado={updateEstado} />)
          )}
        </>
      )}
    </div>
  )
}
