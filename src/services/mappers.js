import { toDateKey } from '../utils/dates'

const EVENT_TYPES = ['boda', 'social', 'corporativo', 'cumpleanos', 'otro']

function normalizeDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return toDateKey(date)
}

export function normalizeEvent(raw = {}) {
  return {
    id: raw.id,
    name: raw.name || '',
    type: raw.event_type || raw.type || '',
    client: raw.client_contact || raw.client || '',
    date: normalizeDateTime(raw.event_date || raw.date),
    location: raw.location || '',
  }
}

export function normalizeTask(raw = {}, event = null) {
  const hours = Number(raw.estimated_hours ?? raw.hours ?? 0)
  return {
    id: raw.id,
    eventId: raw.event ?? event?.id ?? null,
    name: raw.name || '',
    dueDate: raw.due_date || raw.dueDate || '',
    hours: Number.isFinite(hours) ? hours : 0,
    note: raw.description || raw.note || '',
    done: raw.state === 'hecha' || raw.state === 'done' || Boolean(raw.done),
    postponed: raw.state === 'pospuesta' || Boolean(raw.postponed),
    state: raw.state || 'pendiente',
    eventName: event?.name || raw.event_name || '',
    priority: raw.priority || 'normal',
    type: raw.type || 'task',
    parent: raw.parent ?? null,
  }
}

function mapEventType(type) {
  const normalized = String(type || '').trim().toLowerCase()
  return EVENT_TYPES.includes(normalized) ? normalized : 'otro'
}

export function buildEventPayload(data) {
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

export function buildTaskPayload(data) {
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
