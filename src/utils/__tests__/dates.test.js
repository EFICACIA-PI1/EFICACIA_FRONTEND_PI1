import { afterEach, describe, expect, it, vi } from 'vitest'
import { addDaysToDateKey, todayKey, toDateKey } from '../dates'

describe('toDateKey', () => {
  it('formatea una fecha como YYYY-MM-DD con ceros', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 10, 20))).toBe('2026-11-20')
  })
})

describe('addDaysToDateKey', () => {
  it('suma días dentro del mismo mes', () => {
    expect(addDaysToDateKey('2026-11-02', 4)).toBe('2026-11-06')
  })
  it('cruza el cambio de mes y de año', () => {
    expect(addDaysToDateKey('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDaysToDateKey('2026-12-31', 1)).toBe('2027-01-01')
  })
  it('resta días con valores negativos', () => {
    expect(addDaysToDateKey('2026-11-01', -1)).toBe('2026-10-31')
  })
})

describe('todayKey', () => {
  afterEach(() => vi.useRealTimers())

  it('usa la zona horaria de Bogotá (UTC-5)', () => {
    vi.useFakeTimers()
    // 03:00 UTC del 6 de noviembre sigue siendo el 5 en Bogotá
    vi.setSystemTime(new Date('2026-11-06T03:00:00Z'))
    expect(todayKey()).toBe('2026-11-05')
  })
})