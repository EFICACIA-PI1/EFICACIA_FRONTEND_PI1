import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTaskDraft, validateTaskDrafts } from '../taskDrafts'

describe('createTaskDraft', () => {
  it('creates blank drafts with distinct numeric keys', () => {
    const first = createTaskDraft()
    const second = createTaskDraft()
    expect(first).toMatchObject({ name: '', dueDate: '', hours: '', note: '' })
    expect(typeof first.key).toBe('number')
    expect(second.key).toBe(first.key + 1)
  })
})

describe('validateTaskDrafts', () => {
  afterEach(() => vi.useRealTimers())

  it('reports required name, date, and hours errors by draft key', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T17:00:00Z'))
    const draft = { key: 'row-a', name: '  ', dueDate: '', hours: '' }
    expect(validateTaskDrafts([draft], 6)).toEqual({
      'row-a': {
        name: 'Escribe el nombre de la tarea.',
        dueDate: 'Elige la fecha de la tarea.',
        hours: 'Escribe las horas estimadas.',
      },
    })
  })

  it('checks date and positive numeric hour formats', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T17:00:00Z'))
    const drafts = [
      { key: 1, name: 'A', dueDate: '2026/11/07', hours: 'abc' },
      { key: 2, name: 'B', dueDate: '2026-11-05', hours: '0' },
    ]
    const errors = validateTaskDrafts(drafts, 6)
    expect(errors[1]).toEqual({ dueDate: 'Ingresa una fecha válida.', hours: 'Escribe un número válido de horas.' })
    expect(errors[2]).toEqual({
      dueDate: 'La fecha de la tarea no puede ser anterior a hoy.',
      hours: 'Las horas estimadas deben ser mayores que 0.',
    })
  })

  it('enforces event date and per-day limits with rounded totals', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T17:00:00Z'))
    const drafts = [
      { key: 1, name: 'Uno', dueDate: '2026-11-07', hours: '3.25' },
      { key: 2, name: 'Dos', dueDate: '2026-11-07', hours: '3.25' },
      { key: 3, name: 'Fuera', dueDate: '2026-11-09', hours: '1' },
    ]
    const errors = validateTaskDrafts(drafts, 6, '2026-11-08')
    expect(errors[1].hours).toContain('6.5 h')
    expect(errors[2].hours).toContain('6.5 h')
    expect(errors[3].dueDate).toContain('fecha del evento')
  })

  it('rejects all new tasks for an event that has already passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T17:00:00Z'))
    const errors = validateTaskDrafts(
      [{ key: 'old', name: 'Tarea', dueDate: '2026-11-07', hours: '1' }],
      6,
      '2026-11-05'
    )
    expect(errors.old.dueDate).toContain('Este evento ya pasó')
  })
})
