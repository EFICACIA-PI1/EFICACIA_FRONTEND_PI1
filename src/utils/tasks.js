import { todayKey } from './dates'

export const DEFAULT_DAILY_HOURS_LIMIT = 6

export const TASK_STATES = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'pospuesta', label: 'Pospuestas' },
]

export function formatHours(hours) {
  const h = Number(hours)
  if (Number.isNaN(h)) return ''
  const rounded = Math.round(h * 10) / 10
  return `${rounded} h`
}

export function getTaskStatus(task, today = todayKey()) {
  if (task.done) return 'done'
  if (task.dueDate < today) return 'overdue'
  return 'pending'
}

/**
 * Orden de la vista Hoy dentro de cada grupo: fecha límite ascendente y,
 * si coincide, menor esfuerzo estimado (horas) primero. Es el mismo criterio de /hoy/.
 */
export function compareByDueDateThenHours(a, b) {
  return a.dueDate.localeCompare(b.dueDate) || a.hours - b.hours
}

export function computeProgress(tasks) {
  const total = tasks.length
  const done = tasks.filter((task) => task.done).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, percent }
}
