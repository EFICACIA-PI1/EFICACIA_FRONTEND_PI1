import { apiFetch } from './api'
import { listEvents } from './eventsApi'
import { normalizeTask } from './mappers'
import { todayKey } from '../utils/dates'
import { compareByDueDateThenHours, computeProgress, DAILY_LIMIT_HOURS } from '../utils/tasks'

function buildQuery(params) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) query.set(key, value)
  }
  const text = query.toString()
  return text ? `?${text}` : ''
}

/**
 * Vista Hoy. Usa GET /hoy/ (vencidas, para_hoy, proximas) con los filtros opcionales
 * `event` (id) y `state` (pendiente | pospuesta | hecha) que resuelve el backend.
 * Las tareas de /hoy/ no traen el evento, por eso se consulta un evento a la vez.
 */
export async function getTodayData({ eventId = '', state = '', signal } = {}) {
  const allEvents = await listEvents({ signal })
  const events = eventId ? allEvents.filter((event) => String(event.id) === String(eventId)) : allEvents

  const perEvent = await Promise.all(
    events.map(async (event) => {
      const [hoy, detail] = await Promise.all([
        apiFetch(`/hoy/${buildQuery({ event: event.id, state })}`, { signal }),
        apiFetch(`/events/${event.id}/`, { signal }),
      ])
      return { event, hoy, detail }
    })
  )

  const groups = { vencidas: [], paraHoy: [], proximas: [] }
  const conflicts = []
  const eventsWithProgress = []

  for (const { event, hoy, detail } of perEvent) {
    const withEvent = (task, priority) => ({
      ...normalizeTask(task, event),
      eventName: event.name,
      priority,
    })

    const todayTasks = (hoy.para_hoy || []).filter((task) => task.state !== 'hecha')
    const scheduledHours = todayTasks.reduce((sum, task) => sum + Number(task.estimated_hours), 0)
    const overloaded = scheduledHours > DAILY_LIMIT_HOURS

    if (overloaded) {
      conflicts.push({
        eventId: event.id,
        eventName: event.name,
        date: todayKey(),
        scheduledHours: Math.round(scheduledHours * 10) / 10,
        limitHours: DAILY_LIMIT_HOURS,
        overloadIds: todayTasks.map((task) => task.id),
      })
    }

    groups.vencidas.push(...(hoy.vencidas || []).map((task) => withEvent(task, 'vencida')))
    groups.paraHoy.push(...todayTasks.map((task) => withEvent(task, overloaded ? 'overload' : 'urgent')))
    groups.proximas.push(...(hoy.proximas || []).map((task) => withEvent(task, 'upcoming')))

    const taskList = (detail.tasks || []).map((task) => normalizeTask(task, event))
    eventsWithProgress.push({
      ...event,
      progress: computeProgress(taskList).percent,
      pendingToday: todayTasks.length,
    })
  }

  // Cada grupo se pide por evento: al unirlos hay que volver a ordenar.
  for (const group of Object.values(groups)) group.sort(compareByDueDateThenHours)

  const items = [...groups.vencidas, ...groups.paraHoy, ...groups.proximas]

  return { groups, items, conflicts, events: eventsWithProgress, allEvents }
}
