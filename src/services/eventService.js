const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
const EVENT_COLORS = ['#3b6fe0', '#7c3aed', '#0891b2', '#16a34a', '#d97706', '#dc2626']
const EVENT_TYPES = ['boda', 'social', 'corporativo', 'cumpleanos', 'otro']

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw payload || new Error(`Request failed: ${response.status}`)
  }

  return payload
}

function normalizeDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return toDateKey(date)
}

function normalizeEvent(raw = {}) {
  return {
    id: raw.id,
    name: raw.name || '',
    type: raw.event_type || raw.type || '',
    client: raw.client_contact || raw.client || '',
    date: normalizeDateTime(raw.event_date || raw.date),
    location: raw.location || '',
    color: raw.color || EVENT_COLORS[(Number(raw.id) || 0) % EVENT_COLORS.length],
  }
}

function normalizeTask(raw = {}, event = null) {
  const hours = Number(raw.estimated_hours ?? raw.hours ?? 0)
  return {
    id: raw.id,
    eventId: raw.event ?? event?.id ?? null,
    name: raw.name || '',
    dueDate: raw.due_date || raw.dueDate || '',
    hours: Number.isFinite(hours) ? hours : 0,
    note: raw.description || raw.note || '',
    done: raw.state === 'done' || raw.state === 'completed' || Boolean(raw.done),
    postponed: Boolean(raw.postponed),
    eventName: event?.name || raw.event_name || '',
    eventColor: event?.color || raw.event_color || '#6b7280',
    priority: raw.priority || 'normal',
    type: raw.type || 'task',
    parent: raw.parent ?? null,
  }
}

function computeProgress(tasks) {
  const total = tasks.length
  const done = tasks.filter((task) => task.done).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, percent }
}

export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey() {
  return toDateKey(new Date())
}

export function addDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}

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

export function getGestionStatus(task, today = todayKey()) {
  return getTaskStatus(task, today)
}

export function eventProgress(tasks) {
  const total = tasks.length
  const done = tasks.filter((task) => task.done).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, percent }
}

function mapEventType(type) {
  const normalized = String(type || '').trim().toLowerCase()
  return EVENT_TYPES.includes(normalized) ? normalized : 'otro'
}

function buildEventPayload(data) {
  const payload = {}

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    payload.name = String(data.name ?? '').trim()
  }
  if (Object.prototype.hasOwnProperty.call(data, 'event_type') || Object.prototype.hasOwnProperty.call(data, 'type')) {
    payload.event_type = mapEventType(data.event_type ?? data.type)
  }
  if (Object.prototype.hasOwnProperty.call(data, 'client_contact') || Object.prototype.hasOwnProperty.call(data, 'client')) {
    payload.client_contact = String(data.client_contact ?? data.client ?? '').trim()
  }
  if (Object.prototype.hasOwnProperty.call(data, 'event_date') || Object.prototype.hasOwnProperty.call(data, 'date')) {
    const rawDate = data.event_date ?? data.date
    if (rawDate) {
      const normalizedDate = rawDate.includes('T') || rawDate.includes('Z')
        ? rawDate
        : new Date(`${rawDate}T12:00:00`).toISOString()
      payload.event_date = normalizedDate
    }
  }
  if (Object.prototype.hasOwnProperty.call(data, 'location')) {
    payload.location = String(data.location ?? '').trim()
  }

  return payload
}

function buildTaskPayload(data) {
  const payload = {}

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    payload.name = String(data.name ?? '').trim()
  }
  if (Object.prototype.hasOwnProperty.call(data, 'due_date') || Object.prototype.hasOwnProperty.call(data, 'dueDate')) {
    payload.due_date = data.due_date ?? data.dueDate ?? ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'estimated_hours') || Object.prototype.hasOwnProperty.call(data, 'hours')) {
    const value = data.estimated_hours ?? data.hours
    payload.estimated_hours = value === '' || value === null || value === undefined ? value : Number(value)
  }
  if (Object.prototype.hasOwnProperty.call(data, 'description') || Object.prototype.hasOwnProperty.call(data, 'note')) {
    payload.description = data.description ?? data.note ?? ''
  }
  if (Object.prototype.hasOwnProperty.call(data, 'type')) {
    payload.type = data.type
  }
  if (Object.prototype.hasOwnProperty.call(data, 'parent')) {
    payload.parent = data.parent === '' || data.parent === null ? null : Number(data.parent)
  }

  return payload
}

async function fetchEventTasks(eventId) {
  const tasks = await apiFetch(`/events/${eventId}/tasks/`)
  return tasks.map((task) => normalizeTask(task))
}

export async function listEvents() {
  const data = await apiFetch('/events/')
  return data.map((event) => normalizeEvent(event))
}

export async function listEventsWithProgress() {
  const events = await listEvents()
  const rows = []

  for (const event of events) {
    const detail = await apiFetch(`/events/${event.id}/`)
    const tasks = (detail.tasks || []).map((task) => normalizeTask(task, event))
    const progress = computeProgress(tasks)
    rows.push({
      ...event,
      progress,
      color: event.color,
    })
  }

  return rows
}

export async function getEvent(id) {
  const data = await apiFetch(`/events/${id}/`)
  return normalizeEvent(data)
}

export async function getEventDetail(id) {
  const detail = await apiFetch(`/events/${id}/`)
  const event = normalizeEvent(detail)
  const tasks = (detail.tasks || []).map((task) => normalizeTask(task, event))
  return {
    event,
    gestiones: tasks,
    tasks,
    progress: computeProgress(tasks),
  }
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
  await apiFetch(`/events/${id}/`, {
    method: 'DELETE',
  })
}

export async function createTask(eventId, data) {
  const created = await apiFetch(`/events/${eventId}/tasks/`, {
    method: 'POST',
    body: JSON.stringify(buildTaskPayload(data)),
  })
  const event = await getEvent(eventId)
  return normalizeTask(created, event)
}

export async function createGestion(eventId, data) {
  return createTask(eventId, data)
}

export async function getTaskDetail(id) {
  const data = await apiFetch(`/tasks/${id}/`)
  return normalizeTask(data)
}

export async function updateTask(id, data, eventId = null) {
  const updated = await apiFetch(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(buildTaskPayload(data)),
  })

  return normalizeTask(updated, { id: eventId ?? null, name: '' })
}

export async function updateGestion(id, data, eventId = null) {
  return updateTask(id, data, eventId)
}

export async function deleteTask(id) {
  await apiFetch(`/tasks/${id}/`, { method: 'DELETE' })
}

export async function deleteGestion(id) {
  return deleteTask(id)
}

export async function markGestionDone(id, note = '') {
  const current = await apiFetch(`/tasks/${id}/`)
  const payload = {
    description: note || current.description || '',
    state: 'done',
  }
  return apiFetch(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function postponeGestion(id) {
  const current = await apiFetch(`/tasks/${id}/`)
  const currentDate = new Date(`${current.due_date}T00:00:00`)
  currentDate.setDate(currentDate.getDate() + 1)
  const nextDate = toDateKey(currentDate)
  return apiFetch(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ due_date: nextDate }),
  })
}

export async function getConflictForDate(eventId, date, { excludeId = null, addHours = 0 } = {}) {
  const tasks = await fetchEventTasks(eventId)
  const pendingThatDay = tasks.filter(
    (task) => !task.done && task.dueDate === date && String(task.id) !== String(excludeId)
  )

  const scheduled = pendingThatDay.reduce((sum, task) => sum + Number(task.hours), 0) + Number(addHours)
  const rounded = Math.round(scheduled * 10) / 10
  const limitHours = 6

  if (rounded <= limitHours) return null
  return {
    date,
    scheduledHours: rounded,
    limitHours,
    overloadIds: pendingThatDay.map((task) => task.id),
  }
}

const PRIORITY_ORDER = { vencida: 0, urgent: 1, overload: 2, upcoming: 3, normal: 4 }

function priorityOf(task, eventId, conflicts) {
  const today = todayKey()
  const onConflictedDay = conflicts.some((conflict) => conflict.eventId === eventId && conflict.date === task.dueDate)

  if (task.dueDate < today) return 'vencida'
  if (task.dueDate === today) return onConflictedDay ? 'overload' : 'urgent'
  const due = new Date(`${task.dueDate}T00:00:00`)
  const limit = new Date()
  limit.setDate(limit.getDate() + 2)
  if (due <= limit) return 'upcoming'
  return 'normal'
}

export async function getTodayData() {
  const events = await listEvents()
  const items = []
  const conflicts = []

  for (const event of events) {
    const tasks = await fetchEventTasks(event.id)
    const pending = tasks.filter((task) => !task.done)

    for (const task of pending) {
      items.push({ ...task, eventName: event.name, eventColor: event.color, priority: 'normal' })
    }

    const todayTasks = pending.filter((task) => task.dueDate === todayKey())
    const scheduledHours = todayTasks.reduce((sum, task) => sum + Number(task.hours), 0)
    if (todayTasks.length && scheduledHours > 6) {
      conflicts.push({
        eventId: event.id,
        eventName: event.name,
        eventColor: event.color,
        date: todayKey(),
        scheduledHours,
        limitHours: 6,
        overloadIds: todayTasks.map((task) => task.id),
      })
    }
  }

  for (const item of items) {
    item.priority = priorityOf(item, item.eventId, conflicts)
  }

  const filtered = items
    .filter((item) => item.priority !== 'normal')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  const eventsWithProgress = []
  for (const event of events) {
    const detail = await apiFetch(`/events/${event.id}/`)
    const taskList = (detail.tasks || []).map((task) => normalizeTask(task, event))
    const progress = computeProgress(taskList)
    eventsWithProgress.push({
      ...event,
      progress: progress.percent,
      pendingToday: taskList.filter((task) => !task.done && task.dueDate === todayKey()).length,
    })
  }

  return { items: filtered, conflicts, events: eventsWithProgress }
}