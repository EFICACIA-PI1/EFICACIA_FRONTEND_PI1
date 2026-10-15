import { apiFetch } from './api'
import { listEvents } from './eventsApi'
import { normalizeTask } from './mappers'
import { todayKey } from '../utils/dates'
import { compareByDueDateThenHours, DEFAULT_DAILY_HOURS_LIMIT } from '../utils/tasks'

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
export async function getTodayData({
  eventId = '',
  state = '',
  signal,
  dailyHoursLimit = DEFAULT_DAILY_HOURS_LIMIT,
} = {}) {
  const allEvents = await listEvents({ signal })

  const perEvent = await Promise.all(
    allEvents.map(async (event) => {
      const hoy = await apiFetch(`/hoy/${buildQuery({ event: event.id })}`, { signal })
      return { event, hoy }
    })
  )

  const groups = { vencidas: [], paraHoy: [], proximas: [] }
  const conflicts = []
  const eventsWithProgress = []

  for (const { event, hoy } of perEvent) {
    const withEvent = (task, priority) => ({
      ...normalizeTask(task, event),
      eventName: event.name,
      priority,
    })

    // /hoy/ ya excluye las hechas; las pospuestas siguen visibles y cuentan para las horas del día.
    const todayTasks = hoy.para_hoy || []

    groups.vencidas.push(...(hoy.vencidas || []).map((task) => withEvent(task, 'vencida')))
    groups.paraHoy.push(...todayTasks.map((task) => withEvent(task, 'urgent')))
    groups.proximas.push(...(hoy.proximas || []).map((task) => withEvent(task, 'upcoming')))

    eventsWithProgress.push({
      ...event,
      progress: event.progress.percent,
      pendingToday: todayTasks.length,
    })
  }

  const scheduledHours = groups.paraHoy.reduce((sum, task) => sum + task.hours, 0)
  if (scheduledHours > dailyHoursLimit) {
    const roundedHours = Math.round(scheduledHours * 10) / 10
    const overloadIds = groups.paraHoy.map((task) => task.id)
    groups.paraHoy.forEach((task) => {
      task.priority = 'overload'
    })
    conflicts.push({
      eventId: null,
      eventName: 'tu agenda',
      date: todayKey(),
      scheduledHours: roundedHours,
      limitHours: dailyHoursLimit,
      overloadIds,
    })
  }

  // Cada grupo se pide por evento: al unirlos hay que volver a ordenar.
  for (const group of Object.values(groups)) group.sort(compareByDueDateThenHours)

  const visibleGroups = Object.fromEntries(
    Object.entries(groups).map(([key, tasks]) => [
      key,
      tasks.filter((task) => {
        if (eventId && String(task.eventId) !== String(eventId)) return false
        if (state && task.state !== state) return false
        return true
      }),
    ])
  )
  const items = [...visibleGroups.vencidas, ...visibleGroups.paraHoy, ...visibleGroups.proximas]

  return { groups: visibleGroups, items, conflicts, events: eventsWithProgress, allEvents }
}

export async function getPlannedHoursForDate(dateKey, { excludeTaskId, signal } = {}) {
  const data = await apiFetch('/hoy/', { signal })
  const tasks = [...(data.vencidas || []), ...(data.para_hoy || []), ...(data.proximas || [])]

  return tasks
    .filter((task) => task.due_date === dateKey && String(task.id) !== String(excludeTaskId))
    .reduce((total, task) => total + Number(task.estimated_hours), 0)
}
