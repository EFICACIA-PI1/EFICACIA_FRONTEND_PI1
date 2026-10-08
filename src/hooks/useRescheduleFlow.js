import { useState } from 'react'
import { createTask, updateTask } from '../services/tasksApi'
import { isOverloadConflict } from '../services/api'
import { addDaysToDateKey } from '../utils/dates'
import { formatDateToast } from '../utils/format'

export default function useRescheduleFlow({ onSuccess, onFailure, onInvalid }) {
  const [target, setTarget] = useState(null)
  const [conflict, setConflict] = useState(null)
  const [lastData, setLastData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [focusDateRequest, setFocusDateRequest] = useState(0)

  async function attempt(context, data) {
    setBusy(true)
    setError('')
    try {
      if (context.mode === 'create') {
        await createTask(context.event.id, data)
      } else {
        await updateTask(context.task.id, data, context.event.id)
      }
      setConflict(null)
      setTarget(null)
      setLastData(null)
      await onSuccess({ ...context, data })
    } catch (err) {
      if (isOverloadConflict(err)) {
        setConflict(err.data)
      } else if (context.mode === 'postpone') {
        setConflict(null)
        onFailure?.(err)
      } else {
        setConflict(null)
        setError(err.message || 'No se pudo guardar la gestión. Inténtalo de nuevo.')
      }
    } finally {
      setBusy(false)
    }
  }

  function save(context, data) {
    setTarget(context)
    setLastData(data)
    setConflict(null)
    setError('')
    return attempt(context, data)
  }

  function postpone(context) {
    const nextDueDate = addDaysToDateKey(context.task.dueDate, 1)
    if (context.event?.date && nextDueDate > context.event.date) {
      onInvalid?.(`No se puede posponer: el evento es el ${formatDateToast(context.event.date)}.`)
      return
    }
    return save({ ...context, mode: 'postpone' }, { due_date: nextDueDate })
  }

  function clearError() {
    setError('')
  }

  function moveToAnotherDay() {
    setConflict(null)
    setFocusDateRequest((request) => request + 1)
  }

  function cancel() {
    setTarget(null)
    setConflict(null)
    setLastData(null)
    setError('')
  }

  function retryWithHours(hours) {
    if (!target || !lastData) return
    const nextHours = Number(hours)
    const data = target.mode === 'create'
      ? { ...lastData, hours: nextHours, estimated_hours: nextHours }
      : {
          due_date: lastData.due_date ?? lastData.dueDate,
          estimated_hours: nextHours,
        }
    setLastData(data)
    return attempt(target, data)
  }

  return {
    target,
    conflict,
    lastData,
    error,
    busy,
    focusDateRequest,
    save,
    postpone,
    retryWithHours,
    moveToAnotherDay,
    cancel,
    clearError,
  }
}