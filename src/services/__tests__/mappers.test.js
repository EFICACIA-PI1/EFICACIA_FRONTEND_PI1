import { describe, expect, it } from 'vitest'
import { toDateKey } from '../../utils/dates'
import { buildEventPayload, buildTaskPayload, normalizeEvent, normalizeProgress, normalizeTask } from '../mappers'

describe('backend mappers', () => {
  it('normalizes event aliases, date, and optional progress', () => {
    expect(normalizeEvent({
      id: 2,
      name: 'Evento',
      type: 'boda',
      client: 'Cliente',
      date: '2026-11-06T12:00:00',
      location: 'Bogotá',
    })).toEqual({
      id: 2,
      name: 'Evento',
      type: 'boda',
      client: 'Cliente',
      date: toDateKey(new Date('2026-11-06T12:00:00')),
      location: 'Bogotá',
      progress: null,
    })
    expect(normalizeEvent({ event_date: 'no-es-fecha', event_type: 'social' }).date).toBe('no-es-fecha')
    expect(normalizeProgress({ hechas: '2', total: 5, porcentaje: 40 })).toEqual({ done: 2, total: 5, percent: 40 })
    expect(normalizeProgress(null)).toBeNull()
  })

  it('normalizes task aliases, defaults, and event context', () => {
    expect(normalizeTask(
      { id: 4, name: 'Montaje', estimated_hours: '2.5', due_date: '2026-11-07', state: 'hecha', parent: '' },
      { id: 9, name: 'Boda' }
    )).toEqual({
      id: 4,
      eventId: 9,
      name: 'Montaje',
      dueDate: '2026-11-07',
      hours: 2.5,
      description: '',
      note: '',
      done: true,
      doneAt: null,
      state: 'hecha',
      eventName: 'Boda',
      priority: 'normal',
      type: 'task',
      parent: '',
    })
    expect(normalizeTask({ hours: 'bad', event: 3, state: 'pospuesta' })).toMatchObject({
      eventId: 3,
      hours: 0,
      done: false,
      state: 'pospuesta',
    })
  })

  it('builds partial event payloads, validates event type, and converts date-only values', () => {
    expect(buildEventPayload({
      name: ' Boda ',
      type: '  CUMPLEANOS ',
      client: ' Cliente ',
      date: '2026-11-06',
      location: ' Salón ',
    })).toEqual({
      name: 'Boda',
      event_type: 'cumpleanos',
      client_contact: 'Cliente',
      event_date: new Date('2026-11-06T12:00:00').toISOString(),
      location: 'Salón',
    })
    expect(buildEventPayload({ event_type: 'invalid' })).toEqual({ event_type: 'otro' })
    expect(buildEventPayload({ event_date: '' })).toEqual({})
  })

  it('builds task payloads with normalized numeric fields while preserving partial updates', () => {
    expect(buildTaskPayload({
      name: '  Tarea ',
      dueDate: '2026-11-06',
      hours: '2.5',
      description: null,
      note: 'nota',
      parent: '12',
    })).toEqual({
      name: 'Tarea',
      due_date: '2026-11-06',
      estimated_hours: 2.5,
      description: '',
      note: 'nota',
      parent: 12,
    })
    expect(buildTaskPayload({ estimated_hours: '', parent: '' })).toEqual({ estimated_hours: '', parent: null })
    expect(buildTaskPayload({ state: 'hecha', type: 'subtask' })).toEqual({ state: 'hecha', type: 'subtask' })
  })
})
