import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({ apiFetch: vi.fn() }))
vi.mock('../eventsApi', () => ({ listEvents: vi.fn() }))

import { addDaysToDateKey, todayKey } from '../../utils/dates'
import { apiFetch } from '../api'
import { listEvents } from '../eventsApi'
import { getOpenTaskCounts, getPlannedHoursForDate, getTodayData } from '../todayApi'

const eventList = [
  { id: 1, name: 'Boda', progress: { done: 2, total: 4, percent: 50 } },
  { id: 2, name: 'Social', progress: { done: 0, total: 2, percent: 0 } },
]

describe('todayApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listEvents.mockResolvedValue(eventList)
  })

  it('combines and sorts event task groups, marks overload, and applies filters', async () => {
    const today = todayKey()
    apiFetch.mockImplementation((path) => {
      if (path.includes('event=1')) {
        return Promise.resolve({
          vencidas: [{ id: 1, name: 'Atrasada', due_date: addDaysToDateKey(today, -1), estimated_hours: 1 }],
          para_hoy: [
            { id: 2, name: 'Dos horas', due_date: today, estimated_hours: 2, state: 'pendiente' },
            { id: 3, name: 'Una hora', due_date: today, estimated_hours: 1, state: 'pospuesta' },
          ],
          proximas: [{ id: 4, name: 'Próxima', due_date: addDaysToDateKey(today, 1), estimated_hours: 1 }],
        })
      }
      return Promise.resolve({
        vencidas: [],
        para_hoy: [{ id: 5, name: 'Otra', due_date: today, estimated_hours: 3, state: 'pendiente' }],
        proximas: [],
      })
    })

    const result = await getTodayData({ dailyHoursLimit: 5 })
    expect(result.groups.vencidas[0]).toMatchObject({ id: 1, priority: 'vencida', eventName: 'Boda' })
    expect(result.groups.paraHoy.map((task) => task.id)).toEqual([3, 2, 5])
    expect(result.groups.paraHoy.every((task) => task.priority === 'overload')).toBe(true)
    expect(result.conflicts).toEqual([{
      eventId: null,
      eventName: 'tu agenda',
      date: today,
      scheduledHours: 6,
      limitHours: 5,
      overloadIds: [2, 3, 5],
    }])
    expect(result.events).toEqual([
      { ...eventList[0], progress: 50, pendingToday: 2 },
      { ...eventList[1], progress: 0, pendingToday: 1 },
    ])
    expect(result.items.map((task) => task.id)).toEqual([1, 3, 2, 5, 4])
    expect(apiFetch).toHaveBeenNthCalledWith(1, '/hoy/?event=1', { signal: undefined })

    const filtered = await getTodayData({ eventId: '1', state: 'pospuesta', dailyHoursLimit: 10 })
    expect(filtered.items.map((task) => task.id)).toEqual([3])
    expect(filtered.conflicts).toEqual([])
  })

  it('counts pending, postponed, and overdue tasks once with postponed status taking precedence', async () => {
    const today = todayKey()
    apiFetch.mockResolvedValue({
      vencidas: [
        { id: 1, due_date: addDaysToDateKey(today, -1), state: 'pendiente' },
        { id: 2, due_date: addDaysToDateKey(today, -1), state: 'pospuesta' },
      ],
      para_hoy: [{ id: 3, due_date: today, state: 'pendiente' }],
      proximas: [{ id: 4, due_date: addDaysToDateKey(today, 1), state: 'pendiente' }],
    })
    await expect(getOpenTaskCounts()).resolves.toEqual({ pending: 2, postponed: 1, overdue: 1 })
    expect(apiFetch).toHaveBeenCalledWith('/hoy/', { signal: undefined })
  })

  it('sums planned hours for a date while excluding the edited task', async () => {
    apiFetch.mockResolvedValue({
      vencidas: [{ id: 1, due_date: '2026-11-06', estimated_hours: '1.5' }],
      para_hoy: [
        { id: 2, due_date: '2026-11-06', estimated_hours: '2' },
        { id: 3, due_date: '2026-11-07', estimated_hours: '4' },
      ],
      proximas: [{ id: 4, due_date: '2026-11-06', estimated_hours: '3' }],
    })
    await expect(getPlannedHoursForDate('2026-11-06', { excludeTaskId: 2 })).resolves.toBe(4.5)
    expect(apiFetch).toHaveBeenCalledWith('/hoy/', { signal: undefined })
  })
})
