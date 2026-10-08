const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
const TOKEN_KEY = 'eficacia.token'

let onUnauthorized = null

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // almacenamiento no disponible: la sesión dura solo mientras la pestaña esté abierta
  }
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.status = status
    this.payload = payload
    this.data = payload
  }
}

export function isOverloadConflict(error) {
  return error?.status === 409 && error?.data?.code === 'daily_overload'
}

/** Convierte las respuestas de error de DRF en un mensaje legible y errores por campo. */
function parseError(payload, status) {
  if (status === 429) {
    return { message: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.', fields: {} }
  }
  if (payload && typeof payload === 'object') {
    if (typeof payload.detail === 'string') return { message: payload.detail, fields: {} }
    const fields = {}
    for (const [key, value] of Object.entries(payload)) {
      fields[key] = Array.isArray(value) ? value.join(' ') : String(value)
    }
    const first = Object.values(fields)[0]
    if (first) return { message: first, fields }
  }
  if (!status) {
    return { message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', fields: {} }
  }
  return { message: 'Ocurrió un error inesperado. Inténtalo de nuevo.', fields: {} }
}

export async function apiFetch(path, { auth = true, headers, ...options } = {}) {
  const token = auth ? getToken() : null
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...(headers || {}),
      },
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    const { message } = parseError(null, 0)
    throw new ApiError(message, 0, null)
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth && onUnauthorized) onUnauthorized()
    const { message, fields } = parseError(payload, response.status)
    const error = new ApiError(message, response.status, payload)
    error.fields = fields
    throw error
  }

  return payload
}
