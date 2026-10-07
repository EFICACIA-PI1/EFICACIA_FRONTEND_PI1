// Reglas espejo de backend/api/validators.py para dar feedback antes de enviar.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?\d{7,15}$/

export const MIN_PASSWORD_LENGTH = 8

export function validateRequired(value, message = 'Este campo es obligatorio.') {
  return String(value ?? '').trim() ? '' : message
}

export function validateFullName(value) {
  const name = String(value ?? '').trim()
  if (!name) return 'Ingresa tu nombre completo.'
  if (name.length < 3 || name.length > 150) return 'El nombre completo debe tener entre 3 y 150 caracteres.'
  return ''
}

export function validateEmail(value) {
  const email = String(value ?? '').trim()
  if (!email) return 'Ingresa tu correo.'
  if (!EMAIL_RE.test(email)) return 'Escribe un correo válido, por ejemplo nombre@correo.com.'
  return ''
}

export function validatePhone(value) {
  const phone = String(value ?? '').trim()
  if (!phone) return 'Ingresa tu teléfono.'
  if (!PHONE_RE.test(phone)) return 'Usa entre 7 y 15 dígitos, con un «+» opcional al inicio.'
  return ''
}

export function validateNewPassword(password, confirm) {
  const errors = {}
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (confirm !== password) errors.confirm = 'Las contraseñas no coinciden.'
  return errors
}

/** Quita los mensajes vacíos para quedarse solo con los campos con error. */
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}
