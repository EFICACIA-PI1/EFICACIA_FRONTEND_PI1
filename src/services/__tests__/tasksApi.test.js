import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => {
  class ApiError extends Error {
    constructor(message, status, payload) {
      super(message)
      this.status = status
      this.data = payload
      this.payload = payload
    }
  }
  return { ApiError, apiFetch: vi.fn() }
})
vi.mock('../authService', () => ({ getMe: vi.fn() }))
vi.mock('../eventsApi', () => ({ getEvent: vi.fn() }))
vi.mock('../todayApi', () => ({ getPlannedHoursForDate: vi.fn() }))

import { apiFetch } from '../api'
import { getMe } from '../authService'
import { getEvent } from '../eventsApi'
import { createTask, deleteTask, markTaskDone, setTaskState, updateTask } from '../tasksApi'
import { getPlannedHoursForDate } from '../todayApi'

describe('tasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPlannedHoursForDate.mockResolvedValue(0)
    getMe.mockResolvedValue({ dailyHoursLimit: 6 })
  })

  it('checks planned capacity before creating and normalizes the created task', async () => {
    getPlannedHoursForDate.mockResolvedValue(2)
    getEvent.mockResolvedValue({ id: 5, name: 'Boda' })
    apiFetch.mockResolvedValue({ id: 11, name: 'Montaje', estimated_hours: 3, due_date: '2026-11-07' })
    await expect(createTask(5, { name: ' Montaje ', dueDate: '2026-11-07', hours: '3' })).resolves.toMatchObject({
      id: 11,
      eventId: 5,
      eventName: 'Boda',
      hours: 3,
    })
    expect(getPlannedHoursForDate).toHaveBeenCalledWith('2026-11-07')
    expect(apiFetch).toHaveBeenCalledWith('/events/5/tasks/', {
      method: 'POST',
      body: JSON.stringify({ name: 'Montaje', due_date: '2026-11-07', estimated_hours: 3 }),
    })
  })

  it('rejects new work that would exceed the daily limit using the overload error shape', async () => {
    getPlannedHoursForDate.mockResolvedValue(5.5)
    await expect(createTask(5, { due_date: '2026-11-07', estimated_hours: 1 })).rejects.toMatchObject({
      status: 409,
      data: {
        code: 'daily_overload',
        date: '2026-11-07',
        planned_hours: 6.5,
        limit_hours: 6,
        excess_hours: 0.5,
        max_hours_for_this_task: 0.5,
      },
    })
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('continues creation when capacity lookup fails', async () => {
    getPlannedHoursForDate.mockRejectedValue(new Error('offline'))
    getEvent.mockResolvedValue({ id: 1, name: 'Evento' })
    apiFetch.mockResolvedValue({ id: 1, state: 'pendiente' })
    await expect(createTask(1, { dueDate: '2026-11-07', hours: 2 })).resolves.toMatchObject({ id: 1 })
    expect(apiFetch).toHaveBeenCalledOnce()
  })

  it('patches and deletes tasks, and only includes an optional state note when supplied', async () => {
    apiFetch.mockResolvedValueOnce({ id: 2, event: 4, name: 'Editada' })
      .mockResolvedValueOnce({ id: 2, state: 'pospuesta' })
      .mockResolvedValueOnce({ id: 2, state: 'hecha' })
      .mockResolvedValueOnce(undefined)
    await expect(updateTask(2, { name: ' Editada ' }, 4)).resolves.toMatchObject({ id: 2, eventId: 4, name: 'Editada' })
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ name: 'Editada' })
    await setTaskState(2, 'pospuesta')
    expect(JSON.parse(apiFetch.mock.calls[1][1].body)).toEqual({ state: 'pospuesta' })
    await markTaskDone(2)
    expect(JSON.parse(apiFetch.mock.calls[2][1].body)).toEqual({ state: 'hecha' })
    await deleteTask(2)
    expect(apiFetch).toHaveBeenLastCalledWith('/tasks/2/', { method: 'DELETE' })
  })

  it('includes an explicit empty note when changing task state', async () => {
    apiFetch.mockResolvedValue({ id: 9, state: 'pospuesta', note: '' })
    await setTaskState(9, 'pospuesta', '')
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ state: 'pospuesta', note: '' })
  })
})
