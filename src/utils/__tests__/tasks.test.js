import { describe, expect, it } from 'vitest'
import {
  compareByDueDateThenHours,
  computeProgress,
  DEFAULT_DAILY_HOURS_LIMIT,
  formatHours,
  getTaskStatus,
  TASK_STATES,
} from '../tasks'

describe('task utilities', () => {
  it('exposes the daily default and task state labels', () => {
    expect(DEFAULT_DAILY_HOURS_LIMIT).toBe(6)
    expect(TASK_STATES).toEqual([
      { value: 'pendiente', label: 'Pendientes' },
      { value: 'pospuesta', label: 'Pospuestas' },
    ])
  })

  it('formats numeric hours rounded to one decimal and rejects NaN', () => {
    expect(formatHours('2.34')).toBe('2.3 h')
    expect(formatHours(2.35)).toBe('2.4 h')
    expect(formatHours('no')).toBe('')
  })

  it('prioritizes done then postponed status before overdue dates', () => {
    expect(getTaskStatus({ done: true, state: 'pospuesta', dueDate: '2020-01-01' }, '2026-11-06')).toBe('done')
    expect(getTaskStatus({ state: 'pospuesta', dueDate: '2020-01-01' }, '2026-11-06')).toBe('postponed')
    expect(getTaskStatus({ dueDate: '2026-11-05' }, '2026-11-06')).toBe('overdue')
    expect(getTaskStatus({ dueDate: '2026-11-06' }, '2026-11-06')).toBe('pending')
  })

  it('sorts by due date and then hours and calculates progress', () => {
    const tasks = [
      { dueDate: '2026-11-07', hours: 2 },
      { dueDate: '2026-11-06', hours: 4 },
      { dueDate: '2026-11-06', hours: 1 },
    ]
    expect([...tasks].sort(compareByDueDateThenHours)).toEqual([tasks[2], tasks[1], tasks[0]])
    expect(computeProgress([{ done: true }, { done: false }, { done: true }])).toEqual({
      total: 3,
      done: 2,
      percent: 67,
    })
    expect(computeProgress([])).toEqual({ total: 0, done: 0, percent: 0 })
  })
})
