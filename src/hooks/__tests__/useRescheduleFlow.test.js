import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../../services/tasksApi', () => ({
  createTask: vi.fn(),
  setTaskState: vi.fn(),
  updateTask: vi.fn(),
}))

import { createTask, setTaskState, updateTask } from '../../services/tasksApi'
import useRescheduleFlow from '../useRescheduleFlow'

const context = { mode: 'edit', event: { id: 8 }, task: { id: 3 } }

describe('useRescheduleFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createTask.mockResolvedValue({})
    updateTask.mockResolvedValue({})
    setTaskState.mockResolvedValue({})
  })

  it('saves an edit and calls success with context and data', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useRescheduleFlow({ onSuccess }))
    await act(async () => result.current.save(context, { name: 'Updated', hours: 2 }))
    expect(updateTask).toHaveBeenCalledWith(3, { name: 'Updated', hours: 2 }, 8)
    expect(onSuccess).toHaveBeenCalledWith({ ...context, data: { name: 'Updated', hours: 2 } })
    expect(result.current).toMatchObject({ target: null, conflict: null, lastData: null, error: '', busy: false })
  })

  it('keeps an overload conflict and supports retrying with fewer hours or a suggested day', async () => {
    const overload = Object.assign(new Error('full'), {
      status: 409,
      data: { code: 'daily_overload', suggested_day: '2026-11-08' },
    })
    updateTask.mockRejectedValueOnce(overload).mockResolvedValueOnce({}).mockRejectedValueOnce(overload)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useRescheduleFlow({ onSuccess }))
    await act(async () => result.current.save(context, { dueDate: '2026-11-07', hours: 5 }))
    expect(result.current.conflict).toEqual(overload.data)
    await act(async () => result.current.retryWithHours('3'))
    expect(updateTask).toHaveBeenNthCalledWith(2, 3, {
      dueDate: '2026-11-07',
      hours: 3,
      estimated_hours: 3,
    }, 8)
    expect(result.current.conflict).toBeNull()
    await act(async () => result.current.save(context, { due_date: '2026-11-07', estimated_hours: 5 }))
    expect(result.current.conflict).toEqual(overload.data)
    await act(async () => result.current.retryWithDate('2026-11-09'))
    expect(updateTask).toHaveBeenLastCalledWith(3, {
      due_date: '2026-11-09',
      estimated_hours: 5,
      dueDate: '2026-11-09',
    }, 8)
  })

  it('reports regular errors and provides clear, move, cancel, and retry guards', async () => {
    const failure = new Error('No se guardó')
    updateTask.mockRejectedValueOnce(failure)
    const onError = vi.fn()
    const { result } = renderHook(() => useRescheduleFlow({ onError }))
    await act(async () => result.current.retryWithHours(2))
    await act(async () => result.current.retryWithDate('2026-11-10'))
    expect(updateTask).not.toHaveBeenCalled()
    await act(async () => result.current.save(context, { hours: 1 }))
    expect(result.current.error).toBe('No se guardó')
    expect(onError).toHaveBeenCalledWith(failure, context)
    act(() => result.current.clearError())
    expect(result.current.error).toBe('')
    act(() => result.current.moveToAnotherDay())
    expect(result.current.focusDateRequest).toBe(1)
    await act(async () => result.current.cancel())
    expect(result.current).toMatchObject({ target: null, conflict: null, lastData: null, error: '' })
  })

  it('creates tasks, retries alternate mode payloads, and can postpone an existing task', async () => {
    const onPostponed = vi.fn()
    createTask.mockRejectedValueOnce(Object.assign(new Error('full'), {
      status: 409,
      data: { code: 'daily_overload' },
    })).mockResolvedValueOnce({})
    const createContext = { mode: 'create', event: { id: 2 } }
    const { result } = renderHook(() => useRescheduleFlow({ onPostponed, onSuccess: vi.fn() }))
    await act(async () => result.current.save(createContext, { dueDate: '2026-11-07', hours: 4 }))
    expect(createTask).toHaveBeenCalledWith(2, { dueDate: '2026-11-07', hours: 4 })
    await act(async () => result.current.retryWithHours(2))
    expect(createTask).toHaveBeenLastCalledWith(2, {
      dueDate: '2026-11-07',
      hours: 2,
      estimated_hours: 2,
    })

    updateTask.mockRejectedValueOnce(Object.assign(new Error('full'), {
      status: 409,
      data: { code: 'daily_overload' },
    }))
    await act(async () => result.current.save(context, { hours: 2 }))
    await act(async () => result.current.postpone())
    expect(setTaskState).toHaveBeenCalledWith(3, 'pospuesta')
    expect(onPostponed).toHaveBeenCalledWith(context)
    expect(result.current.target).toBeNull()
  })

  it('does not try to postpone new tasks and retains an error if postponing fails', async () => {
    const createContext = { mode: 'create', event: { id: 4 } }
    const { result } = renderHook(({ callbacks }) => useRescheduleFlow(callbacks), {
      initialProps: { callbacks: { onSuccess: vi.fn() } },
    })
    await act(async () => result.current.save(createContext, { hours: 1 }))
    await act(async () => result.current.postpone())
    expect(setTaskState).not.toHaveBeenCalled()

    const taskContext = { mode: 'edit', event: { id: 4 }, task: { id: 9 } }
    updateTask.mockRejectedValueOnce(Object.assign(new Error('full'), {
      status: 409,
      data: { code: 'daily_overload' },
    }))
    await act(async () => result.current.save(taskContext, { hours: 1 }))
    setTaskState.mockRejectedValueOnce(new Error('No se pudo posponer'))
    await act(async () => result.current.postpone())
    expect(result.current.error).toBe('No se pudo posponer')
  })
})
