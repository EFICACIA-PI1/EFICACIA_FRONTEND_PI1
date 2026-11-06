import { describe, expect, it } from 'vitest'
import { formatDate, formatDateLong, formatDateShort, formatDateToast, parseLocal } from '../format'

describe('date formatting', () => {
  it('parses date keys at local midnight without shifting the calendar date', () => {
    const date = parseLocal('2026-11-06')
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 6, 0])
  })

  it('formats the full, short, toast, and long variants in Spanish', () => {
    expect(formatDate('2026-11-06')).toContain('2026')
    expect(formatDate('2026-11-06').toLowerCase()).toContain('vie')
    expect(formatDateShort('2026-11-06')).toContain('2026')
    expect(formatDateToast('2026-11-06').toLowerCase()).toContain('noviembre')
    expect(formatDateLong('2026-11-06')).toContain('2026')
  })

  it('returns an empty string for missing dates', () => {
    for (const format of [formatDate, formatDateShort, formatDateToast, formatDateLong]) {
      expect(format('')).toBe('')
      expect(format(null)).toBe('')
    }
  })
})
