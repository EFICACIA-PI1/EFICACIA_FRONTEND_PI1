import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '../api'
import { createEvent, deleteEvent, getEvent, getEventDetail, getOverallProgress, listEvents, sumProgress, updateEvent } from '../eventsApi'

describe('eventsApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes event lists and fills missing progress', async () => {
    apiFetch.mockResolvedValue([
      { id: 1, name: 'Uno', progress: { hechas: 1, total: 2, porcentaje: 50 } },
      { id: 2, name: 'Dos' },
    ])
    await expect(listEvents()).resolves.toEqual([
      { id: 1, name: 'Uno', type: '', client: '', date: '', location: '', progress: { done: 1, total: 2, percent: 50 } },
      { id: 2, name: 'Dos', type: '', client: '', date: '', location: '', progress: { done: 0, total: 0, percent: 0 } },
    ])
    expect(apiFetch).toHaveBeenCalledWith('/events/', { signal: undefined })
  })

  it('sums progress and uses normalized global progress or the empty fallback', async () => {
    expect(sumProgress([
      { progress: { done: 1, total: 3 } },
      { progress: { done: 2, total: 3 } },
      {},
    ])).toEqual({ done: 3, total: 6, percent: 50 })
    expect(sumProgress([])).toEqual({ done: 0, total: 0, percent: 0 })
    apiFetch.mockResolvedValueOnce({ hechas: 2, total: 4, porcentaje: 50 }).mockResolvedValueOnce(null)
    await expect(getOverallProgress()).resolves.toEqual({ done: 2, total: 4, percent: 50 })
    await expect(getOverallProgress()).resolves.toEqual({ done: 0, total: 0, percent: 0 })
  })

  it('loads one event and derives detail progress from task states when absent', async () => {
    apiFetch.mockResolvedValueOnce({ id: 7, name: 'Evento' })
      .mockResolvedValueOnce({ id: 7, name: 'Evento', tasks: [{ id: 1, state: 'hecha' }, { id: 2, state: 'pendiente' }] })
    await expect(getEvent(7)).resolves.toMatchObject({ id: 7, name: 'Evento' })
    const detail = await getEventDetail(7)
    expect(detail.event.id).toBe(7)
    expect(detail.tasks).toHaveLength(2)
    expect(detail.tasks[0]).toMatchObject({ eventId: 7, eventName: 'Evento', done: true })
    expect(detail.progress).toEqual({ total: 2, done: 1, percent: 50 })
    expect(apiFetch).toHaveBeenLastCalledWith('/events/7/', { signal: undefined })
  })

  it('creates, patches, and deletes events with mapped payloads', async () => {
    apiFetch.mockResolvedValueOnce({ id: 3, name: 'New', event_type: 'boda' })
      .mockResolvedValueOnce({ id: 3, name: 'Updated', event_type: 'boda' })
      .mockResolvedValueOnce(undefined)
    await expect(createEvent({ name: ' New ', type: 'boda' })).resolves.toMatchObject({ name: 'New', type: 'boda' })
    expect(apiFetch.mock.calls[0][0]).toBe('/events/')
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ name: 'New', event_type: 'boda' })
    await expect(updateEvent(3, { name: ' Updated ' })).resolves.toMatchObject({ name: 'Updated' })
    expect(apiFetch.mock.calls[1][1].method).toBe('PATCH')
    await deleteEvent(3)
    expect(apiFetch).toHaveBeenLastCalledWith('/events/3/', { method: 'DELETE' })
  })
})
