import { apiFetch } from './api'
import { buildEventPayload, normalizeEvent, normalizeTask } from './mappers'
import { computeProgress } from '../utils/tasks'

export async function listEvents({ signal } = {}) {
  const data = await apiFetch('/events/', { signal })
  return data.map((event) => normalizeEvent(event))
}

export async function getEvent(id) {
  return normalizeEvent(await apiFetch(`/events/${id}/`))
}

export async function getEventDetail(id, { signal } = {}) {
  const detail = await apiFetch(`/events/${id}/`, { signal })
  const event = normalizeEvent(detail)
  const tasks = (detail.tasks || []).map((task) => normalizeTask(task, event))
  return { event, tasks, progress: computeProgress(tasks) }
}

/** Eventos con su progreso; los detalles se piden en paralelo. */
export async function listEventsWithProgress({ signal } = {}) {
  const events = await listEvents({ signal })
  return Promise.all(
    events.map(async (event) => {
      const { progress } = await getEventDetail(event.id, { signal })
      return { ...event, progress }
    })
  )
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
