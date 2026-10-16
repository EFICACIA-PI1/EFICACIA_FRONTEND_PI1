import { apiFetch } from './api'
import { buildEventPayload, normalizeEvent, normalizeProgress, normalizeTask } from './mappers'
import { computeProgress } from '../utils/tasks'

const EMPTY_PROGRESS = { done: 0, total: 0, percent: 0 }

/** Cada evento trae `progress` calculado por el backend (hechas, total, porcentaje). */
export async function listEvents({ signal } = {}) {
  const data = await apiFetch('/events/', { signal })
  return data.map((event) => {
    const normalized = normalizeEvent(event)
    return { ...normalized, progress: normalized.progress ?? EMPTY_PROGRESS }
  })
}

/** Suma el progreso por evento; respaldo si el endpoint global no responde. */
export function sumProgress(events) {
  const done = events.reduce((sum, event) => sum + (event.progress?.done ?? 0), 0)
  const total = events.reduce((sum, event) => sum + (event.progress?.total ?? 0), 0)
  return { done, total, percent: total ? Math.round((done * 100) / total) : 0 }
}

/** Progreso global del usuario: GET /events/progress/. */
export async function getOverallProgress({ signal } = {}) {
  const data = await apiFetch('/events/progress/', { signal })
  return normalizeProgress(data) ?? EMPTY_PROGRESS
}

export async function getEvent(id) {
  return normalizeEvent(await apiFetch(`/events/${id}/`))
}

export async function getEventDetail(id, { signal } = {}) {
  const detail = await apiFetch(`/events/${id}/`, { signal })
  const event = normalizeEvent(detail)
  const tasks = (detail.tasks || []).map((task) => normalizeTask(task, event))
  return { event, tasks, progress: event.progress ?? computeProgress(tasks) }
}

export async function createEvent(data) {
  const created = await apiFetch('/events/', {
    method: 'POST',
    body: JSON.stringify(buildEventPayload(data)),
  })
  return normalizeEvent(created)
}

export async function updateEvent(id, data) {
  const updated = await apiFetch(`/events/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(buildEventPayload(data)),
  })
  return normalizeEvent(updated)
}

export async function deleteEvent(id) {
  await apiFetch(`/events/${id}/`, { method: 'DELETE' })
}
