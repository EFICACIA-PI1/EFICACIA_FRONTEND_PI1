import { describe, expect, it } from 'vitest'
import { EVENT_TYPE_OPTIONS, eventTypeLabel } from '../events'

describe('event types', () => {
  it('exposes the backend event types with visible labels', () => {
    expect(EVENT_TYPE_OPTIONS).toEqual([
      { value: 'boda', label: 'Boda' },
      { value: 'social', label: 'Social' },
      { value: 'corporativo', label: 'Corporativo' },
      { value: 'cumpleanos', label: 'Cumpleaños' },
      { value: 'otro', label: 'Otro' },
    ])
  })

  it('returns a known label and preserves unknown values', () => {
    expect(eventTypeLabel('cumpleanos')).toBe('Cumpleaños')
    expect(eventTypeLabel('personalizado')).toBe('personalizado')
    expect(eventTypeLabel('')).toBe('')
    expect(eventTypeLabel(undefined)).toBeUndefined()
  })
})
