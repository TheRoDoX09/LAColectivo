import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { fetchCategoriasConSub } from '../lib/categorias'
import { limpiarTexto } from '../lib/validation'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'

export default function Catalog() {
  const { categoriaSlug, subcategoriaSlug, subSubcategoriaSlug } = useParams()
  const navigate = useNavigate()

  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [openCat, setOpenCat] = useState(categoriaSlug || null)
  const [openSub, setOpenSub] = useState(subcategoriaSlug || null)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setLoading(true)
      const [cats, prodsRes] = await Promise.all([
        fetchCategoriasConSub(),
        supabase
          .from('productos')
          .select('*, categorias(nombre, slug), subcategorias(nombre, slug), sub_subcategorias(nombre, slug)')
          .order('created_at', { ascending: false }),
      ])
      if (cancelado) return
      setCategorias(cats)
      setProductos(prodsRes.data || [])
      setLoading(false)
    }

    cargar()
    return () => { cancelado = true }
  }, [])

  useEffect(() => {
    if (categoriaSlug) setOpenCat(categoriaSlug)
  }, [categoriaSlug])

  useEffect(() => {
    if (subcategoriaSlug) setOpenSub(subcategoriaSlug)
  }, [subcategoriaSlug])

  const categoriaActiva = categorias.find((c) => c.slug === categoriaSlug)
  const subcategoriaActiva = categoriaActiva?.subcategorias.find((s) => s.slug === subcategoriaSlug)
  const subSubcategoriaActiva = subcategoriaActiva?.subSubcategorias.find((ss) => ss.slug === subSubcategoriaSlug)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return productos.filter((p) => {
      if (categoriaSlug && p.categorias?.slug !== categoriaSlug) return false
      if (subcategoriaSlug && p.subcategorias?.slug !== subcategoriaSlug) return false
      if (subSubcategoriaSlug && p.sub_subcategorias?.slug !== subSubcategoriaSlug) return false
      if (!term) return true
      const haystack = [p.nombre, p.descripcion, p.categorias?.nombre, p.subcategorias?.nombre, p.sub_subcategorias?.nombre]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [productos, search, categoriaSlug, subcategoriaSlug, subSubcategoriaSlug])

  const crumbs = [
    { label: 'Inicio', to: '/' },
    { label: 'Catálogo', to: '/catalogo' },
  ]
  if (categoriaActiva) crumbs.push({ label: categoriaActiva.nombre, to: `/catalogo/${categoriaActiva.slug}` })
  if (subcategoriaActiva) crumbs.push({ label: subcategoriaActiva.nombre, to: `/catalogo/${categoriaActiva.slug}/${subcategoriaActiva.slug}` })
  if (subSubcategoriaActiva) crumbs.push({ label: subSubcategoriaActiva.nombre })

  return (
    <section className="section">
      <div className="container">
        <Breadcrumbs items={crumbs} />

        <div className="section__head" style={{ textAlign: 'left', marginTop: '1rem' }}>
          <h1 className="section__title">
            {subSubcategoriaActiva?.nombre || subcategoriaActiva?.nombre || categoriaActiva?.nombre || 'Catálogo'}
          </h1>
        </div>

        <div className="catalog-layout">
          <aside className="catalog-sidebar">
            <input
              className="search-input"
              style={{ width: '100%', marginBottom: '1.2rem' }}
              placeholder="Buscar producto"
              value={search}
              onChange={(e) => setSearch(limpiarTexto(e.target.value))}
            />

            <ul className="cat-tree">
              <li>
                <button
                  className={`cat-tree__link ${!categoriaSlug ? 'active' : ''}`}
                  onClick={() => navigate('/catalogo')}
                >
                  Todas las categorías
                </button>
              </li>
              {categorias.map((cat) => (
                <li key={cat.id}>
                  <button
                    className={`cat-tree__link ${categoriaSlug === cat.slug ? 'active' : ''}`}
                    onClick={() => {
                      setOpenCat(openCat === cat.slug ? null : cat.slug)
                      navigate(`/catalogo/${cat.slug}`)
                    }}
                  >
                    {cat.nombre}
                    {cat.subcategorias.length > 0 && (
                      <span className="cat-tree__chevron">{openCat === cat.slug ? '−' : '+'}</span>
                    )}
                  </button>
                  {openCat === cat.slug && cat.subcategorias.length > 0 && (
                    <ul className="cat-tree__sub">
                      {cat.subcategorias.map((sub) => (
                        <li key={sub.id}>
                          <button
                            className={`cat-tree__sublink ${categoriaSlug === cat.slug && subcategoriaSlug === sub.slug ? 'active' : ''}`}
                            onClick={() => {
                              setOpenSub(openSub === sub.slug ? null : sub.slug)
                              navigate(`/catalogo/${cat.slug}/${sub.slug}`)
                            }}
                          >
                            {sub.nombre}
                            {sub.subSubcategorias.length > 0 && (
                              <span className="cat-tree__chevron">{openSub === sub.slug ? '−' : '+'}</span>
                            )}
                          </button>
                          {openSub === sub.slug && sub.subSubcategorias.length > 0 && (
                            <ul className="cat-tree__sub">
                              {sub.subSubcategorias.map((subSub) => (
                                <li key={subSub.id}>
                                  <button
                                    className={`cat-tree__sublink ${subSubcategoriaSlug === subSub.slug ? 'active' : ''}`}
                                    onClick={() => navigate(`/catalogo/${cat.slug}/${sub.slug}/${subSub.slug}`)}
                                  >
                                    {subSub.nombre}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </aside>

          <div className="catalog-main">
            {loading ? (
              <div className="loading-text"><div className="spinner" />Cargando productos...</div>
            ) : filtered.length === 0 ? (
              <p className="empty-state">No encontramos productos con esos filtros.</p>
            ) : (
              <div className="grid">
                {filtered.map((p) => (
                  <ProductCard key={p.id} producto={p} onClick={setSelected} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductModal producto={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
