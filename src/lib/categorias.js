import { supabase } from './supabaseClient'

export async function fetchCategoriasConSub() {
  const [catRes, subRes, subSubRes] = await Promise.all([
    supabase.from('categorias').select('*').order('orden'),
    supabase.from('subcategorias').select('*').order('orden'),
    supabase.from('sub_subcategorias').select('*').order('orden'),
  ])

  const categorias = catRes.data || []
  const subcategorias = subRes.data || []
  const subSubcategorias = subSubRes.data || []

  return categorias.map((cat) => ({
    ...cat,
    subcategorias: subcategorias
      .filter((s) => s.categoria_id === cat.id)
      .map((sub) => ({
        ...sub,
        subSubcategorias: subSubcategorias.filter((ss) => ss.subcategoria_id === sub.id),
      })),
  }))
}

export function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
