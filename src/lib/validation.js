export const MAX_NOMBRE = 120
export const MAX_TEXTO_LARGO = 2000
export const MAX_IMAGEN_MB = 5

export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function esTelefonoValido(telefono) {
  const digitos = telefono.replace(/[^0-9]/g, '')
  return digitos.length === 10
}

export function esPrecioValido(precio) {
  if (precio === '' || precio === null || precio === undefined) return false
  const n = Number(precio)
  return Number.isFinite(n) && n > 0
}

export function esCantidadValida(cantidad, { opcional = true } = {}) {
  if (cantidad === '' || cantidad === null || cantidad === undefined) return opcional
  const n = Number(cantidad)
  return Number.isInteger(n) && n >= 0
}

const CARACTERES_PELIGROSOS = /[<>{}\\^~`]/
const CARACTERES_PELIGROSOS_GLOBAL = /[<>{}\\^~`]/g

export function esTextoSeguro(texto) {
  return !CARACTERES_PELIGROSOS.test(texto)
}

export function limpiarTexto(texto) {
  return texto.replace(CARACTERES_PELIGROSOS_GLOBAL, '')
}

export function validarImagen(file, maxMB = MAX_IMAGEN_MB) {
  if (!file) return { valido: true, error: '' }
  if (!file.type.startsWith('image/')) return { valido: false, error: 'El archivo debe ser una imagen.' }
  if (file.size > maxMB * 1024 * 1024) return { valido: false, error: `La imagen no debe superar ${maxMB} MB.` }
  return { valido: true, error: '' }
}
