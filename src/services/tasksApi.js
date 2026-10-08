import { apiFetch } from './api'
import { getEvent } from './eventsApi'
import { buildTaskPayload, normalizeTask } from './mappers'
import { toDateKey } from '../utils/dates'

export async function createTask(eventId, data) {
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

export async function markTaskDone(id) {
  return apiFetch(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'hecha' }),
  })
}

export async function postponeTask(id) {
  const current = await apiFetch(`/tasks/${id}/`)
  const nextDay = new Date(`${current.due_date}T00:00:00`)
  nextDay.setDate(nextDay.getDate() + 1)
  return apiFetch(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ due_date: toDateKey(nextDay) }),
  })
}

/** Devuelve el conflicto de sobrecarga para una fecha, o null si cabe en el límite diario. */
export async function getConflictForDate(
  eventId,
  date,
  { excludeId = null, addHours = 0, dailyHoursLimit }
) {
  const raw = await apiFetch(`/events/${eventId}/tasks/`)
  const pendingThatDay = raw
    .map((task) => normalizeTask(task))
    .filter((task) => !task.done && task.dueDate === date && String(task.id) !== String(excludeId))

  const scheduled = pendingThatDay.reduce((sum, task) => sum + task.hours, 0) + Number(addHours)
  const scheduledHours = Math.round(scheduled * 10) / 10

  if (scheduledHours <= dailyHoursLimit) return null
  return {
    date,
    scheduledHours,
    limitHours: dailyHoursLimit,
    overloadIds: pendingThatDay.map((task) => task.id),
  }
}
