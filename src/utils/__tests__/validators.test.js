import { describe, expect, it } from 'vitest'
import {
  MIN_PASSWORD_LENGTH,
  compactErrors,
  validateDailyHoursLimit,
  validateEmail,
  validateFullName,
  validateNewPassword,
  validatePhone,
  validateRequired,
} from '../validators'

describe('validateRequired', () => {
  it('rechaza vacíos y espacios', () => {
    expect(validateRequired('')).not.toBe('')
    expect(validateRequired('   ')).not.toBe('')
    expect(validateRequired(null)).not.toBe('')
  })
  it('acepta texto y usa mensaje personalizado', () => {
    expect(validateRequired('hola')).toBe('')
    expect(validateRequired('', 'Falta')).toBe('Falta')
  })
})

describe('validateFullName', () => {
  it('valida longitud entre 3 y 150', () => {
    expect(validateFullName('')).toBe('Ingresa tu nombre completo.')
    expect(validateFullName('Al')).toMatch(/entre 3 y 150/)
    expect(validateFullName('a'.repeat(151))).toMatch(/entre 3 y 150/)
    expect(validateFullName('Ana Gómez')).toBe('')
  })
})

describe('validateEmail', () => {
  it('acepta correos válidos', () => {
    expect(validateEmail('nombre@correo.com')).toBe('')
  })
  it('rechaza vacío y formatos inválidos', () => {
    expect(validateEmail('')).toBe('Ingresa tu correo.')
    expect(validateEmail('sin-arroba.com')).toMatch(/correo válido/)
    expect(validateEmail('a@b')).toMatch(/correo válido/)
  })
})

describe('validatePhone', () => {
  it('acepta 7 a 15 dígitos con + opcional', () => {
    expect(validatePhone('3001234567')).toBe('')
    expect(validatePhone('+573001234567')).toBe('')
  })
  it('rechaza vacío, corto, largo o con letras', () => {
    expect(validatePhone('')).toBe('Ingresa tu teléfono.')
    expect(validatePhone('123456')).toMatch(/7 y 15/)
    expect(validatePhone('1'.repeat(16))).toMatch(/7 y 15/)
    expect(validatePhone('30012abc')).toMatch(/7 y 15/)
  })
})

describe('validateDailyHoursLimit', () => {
  it('permite vacío (usa el valor por defecto)', () => {
    expect(validateDailyHoursLimit('')).toBe('')
  })
  it('acepta enteros de 1 a 16', () => {
    expect(validateDailyHoursLimit('1')).toBe('')
    expect(validateDailyHoursLimit('6')).toBe('')
    expect(validateDailyHoursLimit('16')).toBe('')
  })
  it('rechaza fuera de rango, decimales y texto', () => {
    for (const value of ['0', '17', '2.5', 'abc', '-3']) {
      expect(validateDailyHoursLimit(value)).toBe('Escribe un número entero entre 1 y 16.')
    }
  })
})

describe('validateNewPassword', () => {
  it('no devuelve errores con contraseña válida y coincidente', () => {
    expect(validateNewPassword('12345678', '12345678')).toEqual({})
  })
  it('detecta contraseña corta y confirmación distinta', () => {
    const errors = validateNewPassword('abc', 'xyz')
    expect(errors.password).toContain(String(MIN_PASSWORD_LENGTH))
    expect(errors.confirm).toBe('Las contraseñas no coinciden.')
  })
})

describe('compactErrors', () => {
  it('quita los mensajes vacíos', () => {
    expect(compactErrors({ email: '', phone: 'Error', name: '' })).toEqual({ phone: 'Error' })
  })
})