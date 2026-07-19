import { supabase } from './supabaseClient'
import { validarImagen } from './validation'

export async function uploadImage(file) {
  if (!file) return { url: null, error: null }

  const { valido, error: validationError } = validarImagen(file)
  if (!valido) return { url: null, error: new Error(validationError) }

  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from('imagenes').upload(path, file)
  if (error) return { url: null, error }

  const { data } = supabase.storage.from('imagenes').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
