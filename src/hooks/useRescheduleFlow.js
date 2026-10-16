import { useState } from 'react'
import { createTask, setTaskState, updateTask } from '../services/tasksApi'
import { isOverloadConflict } from '../services/api'

export default function useRescheduleFlow({ onSuccess, onError, onPostponed }) {
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
      } else {
        setConflict(null)
        setError(err.message || 'No se pudo guardar la tarea. Inténtalo de nuevo.')
        onError?.(err, context)
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
    // Crear y editar conservan el resto de campos: el 409 no guardó nada y se perderían.
    const data = target.mode === 'create' || target.mode === 'edit'
      ? { ...lastData, hours: nextHours, estimated_hours: nextHours }
      : target.mode === 'hours'
        ? { estimated_hours: nextHours }
        : {
            due_date: lastData.due_date ?? lastData.dueDate,
            estimated_hours: nextHours,
          }
    setLastData(data)
    return attempt(target, data)
  }

  /** Reintenta con el `suggested_day` del 409, conservando las horas pedidas en la petición original. */
  function retryWithDate(day) {
    if (!target || !lastData || !day) return
    const data = { ...lastData, due_date: day, dueDate: day }
    setLastData(data)
    return attempt(target, data)
  }

  /** Alternativa al conflicto: deja la tarea sin cambios de fecha ni horas y la marca como pospuesta. */
  async function postpone() {
    if (!target?.task?.id || target.mode === 'create') return
    const context = target
    setBusy(true)
    setError('')
    try {
      await setTaskState(context.task.id, 'pospuesta')
      setConflict(null)
      setTarget(null)
      setLastData(null)
      await onPostponed?.(context)
    } catch (err) {
      setConflict(null)
      setError(err.message || 'No pudimos posponer la tarea. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return {
    target,
    conflict,
    lastData,
    error,
    busy,
    focusDateRequest,
    save,
    retryWithHours,
    retryWithDate,
    postpone,
    moveToAnotherDay,
    cancel,
    clearError,
  }
}