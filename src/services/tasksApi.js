import { ApiError, apiFetch } from './api'
import { getMe } from './authService'
import { getEvent } from './eventsApi'
import { buildTaskPayload, normalizeTask } from './mappers'
import { getPlannedHoursForDate } from './todayApi'

const round1 = (value) => Math.round(value * 10) / 10

/**
 * El backend no valida la sobrecarga al crear (POST responde 201 aunque el día exceda el límite).
 * Se replica aquí con el mismo formato del 409 `daily_overload` para reutilizar los flujos existentes.
 * Es una validación orientativa: si no se puede consultar la agenda, se deja continuar.
 */
async function assertDailyCapacity(data) {
  const date = data.due_date ?? data.dueDate
  const hours = Number(data.estimated_hours ?? data.hours)
  if (!date || !Number.isFinite(hours)) return

  let others
  let limit
  try {
    const [planned, me] = await Promise.all([getPlannedHoursForDate(date), getMe()])
    others = planned
    limit = me.dailyHoursLimit
  } catch {
    return
  }

  const total = round1(others + hours)
  if (total <= limit) return
  throw new ApiError(`Quedarías con ${total} h planificadas (límite ${limit} h) el ${date}.`, 409, {
    detail: `Quedarías con ${total} h planificadas (límite ${limit} h) el ${date}.`,
    code: 'daily_overload',
    date,
    planned_hours: total,
    limit_hours: limit,
    excess_hours: round1(total - limit),
    max_hours_for_this_task: Math.max(0, round1(limit - others)),
    suggested_day: null,
  })
}

export async function createTask(eventId, data) {
  await assertDailyCapacity(buildTaskPayload(data))
  const created = await apiFetch(`/events/${eventId}/tasks/`, {
    method: 'POST',
    body: JSON.stringify(buildTaskPayload(data)),
  })
  const event = await getEvent(eventId)
  return normalizeTask(created, event)
}

export async function updateTask(id, data, eventId = null) {
  const updated = await apiFetch(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(buildTaskPayload(data)),
  })
  return normalizeTask(updated, { id: eventId, name: '' })
}

export async function deleteTask(id) {
  await apiFetch(`/tasks/${id}/`, { method: 'DELETE' })
}

/** Cambia el estado (pendiente | pospuesta | hecha). `note` es opcional y solo se envía si se indica. */
export async function setTaskState(id, state, note) {
  const body = { state }
  if (note !== undefined) body.note = note
  const updated = await apiFetch(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return normalizeTask(updated, null)
}

export function markTaskDone(id) {
  return setTaskState(id, 'hecha')
}

/**
 * Devuelve el conflicto de sobrecarga para una fecha, o null si cabe en el límite diario.
 * El límite es por usuario: se suman las tareas no hechas de todos sus eventos (vía /hoy/).
 */
export async function getConflictForDate(
  _eventId,
  date,
  { excludeId = null, addHours = 0, dailyHoursLimit }
) {
  const data = await apiFetch('/hoy/')
  const sameDay = [...(data.vencidas || []), ...(data.para_hoy || []), ...(data.proximas || [])]
    .map((task) => normalizeTask(task))
    .filter((task) => task.dueDate === date && String(task.id) !== String(excludeId))

  const scheduledHours = round1(sameDay.reduce((sum, task) => sum + task.hours, 0) + Number(addHours))

  if (scheduledHours <= dailyHoursLimit) return null
  return {
    date,
    scheduledHours,
    limitHours: dailyHoursLimit,
    overloadIds: sameDay.map((task) => task.id),
  }
}
