const LS_EVENTS = 'eficacia.events.v1'
const LS_GESTIONES = 'eficacia.gestiones.v1'

const EVENT_COLORS = ['#3b6fe0', '#7c3aed', '#0891b2', '#16a34a', '#d97706', '#dc2626']

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

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

export function getGestionStatus(gestion, today = todayKey()) {
  if (gestion.done) return 'hecha'
  if (gestion.dueDate < today) return 'vencida'
  return 'pendiente'
}

export function eventProgress(gestiones) {
  const total = gestiones.length
  const done = gestiones.filter((g) => g.done).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, percent }
}

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeRaw(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function seedEvents() {
  return [
    {
      id: 'e1',
      name: 'Boda de Laura',
      type: 'Social',
      client: 'Laura Gómez',
      date: addDays(90),
      location: 'Hacienda Las Mercedes',
      notes: 'Ceremonia al atardecer, 120 invitados.',
      color: EVENT_COLORS[0],
      dailyLimitHours: 6,
      createdAt: addDays(-10),
    },
    {
      id: 'e2',
      name: 'Conferencia Tech',
      type: 'Corporativo',
      client: 'TechSummit S.L.',
      date: addDays(20),
      location: 'Centro de Convenciones',
      notes: 'Cuatro salas paralelas y transmisión en vivo.',
      color: EVENT_COLORS[1],
      dailyLimitHours: 6,
      createdAt: addDays(-7),
    },
  ]
}

function seedGestiones() {
  return [
    { id: 'g1', eventId: 'e1', name: 'Reservar salón', dueDate: addDays(-5), hours: 1.5, done: true, postponed: false, note: 'Salón principal reservado.' },
    { id: 'g2', eventId: 'e1', name: 'Enviar invitaciones', dueDate: addDays(-3), hours: 2, done: true, postponed: false, note: '' },
    { id: 'g3', eventId: 'e1', name: 'Confirmar menú de catering', dueDate: addDays(0), hours: 3, done: false, postponed: false, note: '' },
    { id: 'g4', eventId: 'e1', name: 'Coordinar proveedores', dueDate: addDays(0), hours: 3.5, done: false, postponed: false, note: '' },
    { id: 'g5', eventId: 'e1', name: 'Organizar decoración', dueDate: addDays(3), hours: 2.5, done: false, postponed: false, note: '' },
    { id: 'g6', eventId: 'e2', name: 'Auditar aforo del recinto', dueDate: addDays(-1), hours: 1.5, done: true, postponed: false, note: '' },
    { id: 'g7', eventId: 'e2', name: 'Contratar equipo audiovisual', dueDate: addDays(0), hours: 2, done: false, postponed: false, note: '' },
    { id: 'g8', eventId: 'e2', name: 'Diseñar agenda de ponentes', dueDate: addDays(2), hours: 3, done: false, postponed: false, note: '' },
    { id: 'g9', eventId: 'e2', name: 'Enviar invitaciones VIP', dueDate: addDays(5), hours: 1, done: false, postponed: false, note: '' },
  ]
}

function ensureSeed() {
  if (!readRaw(LS_EVENTS)) {
    writeRaw(LS_EVENTS, seedEvents())
    writeRaw(LS_GESTIONES, seedGestiones())
  }
}

function readEvents() {
  ensureSeed()
  return readRaw(LS_EVENTS) || []
}

function readGestiones() {
  ensureSeed()
  return readRaw(LS_GESTIONES) || []
}

function getAllEvents() {
  return readEvents()
}

function getGestionesOfEvent(eventId) {
  return readGestiones().filter((g) => g.eventId === eventId)
}

export async function listEvents() {
  await delay(500)
  return getAllEvents()
}

export async function listEventsWithProgress() {
  await delay(600)
  return getAllEvents().map((event) => ({
    ...event,
    progress: eventProgress(getGestionesOfEvent(event.id)),
  }))
}

export async function getEvent(id) {
  await delay(400)
  const event = getAllEvents().find((e) => e.id === id)
  return event || null
}

export async function getEventDetail(id) {
  await delay(600)
  const event = getAllEvents().find((e) => e.id === id)
  if (!event) return null
  const gestiones = getGestionesOfEvent(id).sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  )
  return { event, gestiones, progress: eventProgress(gestiones) }
}

export async function createEvent(data) {
  await delay(600)
  const events = readEvents()
  const event = {
    id: uid('ev'),
    name: data.name,
    type: data.type || '',
    client: data.client || '',
    date: data.date,
    location: data.location || '',
    notes: data.notes || '',
    dailyLimitHours: Number(data.dailyLimitHours) || 6,
    color: EVENT_COLORS[events.length % EVENT_COLORS.length],
    createdAt: todayKey(),
  }
  events.push(event)
  writeRaw(LS_EVENTS, events)
  return event
}

export async function updateEvent(id, data) {
  await delay(500)
  const events = readEvents()
  const index = events.findIndex((e) => e.id === id)
  if (index === -1) throw new Error('not_found')
  events[index] = { ...events[index], ...data, id }
  writeRaw(LS_EVENTS, events)
  return events[index]
}

export async function deleteEvent(id) {
  await delay(500)
  const events = readEvents().filter((e) => e.id !== id)
  writeRaw(LS_EVENTS, events)
  const gestiones = readGestiones().filter((g) => g.eventId !== id)
  writeRaw(LS_GESTIONES, gestiones)
}

export async function createGestion(eventId, data) {
  await delay(500)
  const gestiones = readGestiones()
  const gestion = {
    id: uid('ge'),
    eventId,
    name: data.name,
    dueDate: data.dueDate,
    hours: Number(data.hours),
    note: data.note || '',
    done: false,
    postponed: false,
  }
  gestiones.push(gestion)
  writeRaw(LS_GESTIONES, gestiones)
  return gestion
}

export async function updateGestion(id, data) {
  await delay(500)
  const gestiones = readGestiones()
  const index = gestiones.findIndex((g) => g.id === id)
  if (index === -1) throw new Error('not_found')
  gestiones[index] = { ...gestiones[index], ...data, id }
  writeRaw(LS_GESTIONES, gestiones)
  return gestiones[index]
}

export async function deleteGestion(id) {
  await delay(400)
  const gestiones = readGestiones().filter((g) => g.id !== id)
  writeRaw(LS_GESTIONES, gestiones)
}

export async function markGestionDone(id, note) {
  await delay(300)
  updateGestion(id, { done: true, note: note || '' })
}

export async function postponeGestion(id) {
  await delay(300)
  const gestiones = readGestiones()
  const index = gestiones.findIndex((g) => g.id === id)
  if (index === -1) return
  const next = addDays(1)
  if (gestiones[index].dueDate <= todayKey()) {
    gestiones[index] = { ...gestiones[index], dueDate: next, postponed: true }
  } else {
    const d = new Date(`${gestiones[index].dueDate}T00:00:00`)
    d.setDate(d.getDate() + 1)
    gestiones[index] = { ...gestiones[index], dueDate: toDateKey(d), postponed: true }
  }
  writeRaw(LS_GESTIONES, gestiones)
  return gestiones[index]
}

export async function getConflictForDate(eventId, date, { excludeId = null, addHours = 0 } = {}) {
  await delay(250)
  const event = getAllEvents().find((e) => e.id === eventId)
  if (!event) return null
  const pendingThatDay = getGestionesOfEvent(eventId).filter(
    (g) => !g.done && !g.postponed && g.dueDate === date && g.id !== excludeId
  )
  const scheduled = pendingThatDay.reduce((sum, g) => sum + Number(g.hours), 0) + Number(addHours)
  const rounded = Math.round(scheduled * 10) / 10
  if (rounded <= Number(event.dailyLimitHours)) return null
  return {
    date,
    scheduledHours: rounded,
    limitHours: Number(event.dailyLimitHours),
    overloadIds: pendingThatDay.map((g) => g.id),
  }
}

function computeTodayConflicts() {
  const today = todayKey()
  const conflicts = []
  for (const event of getAllEvents()) {
    const todayPending = getGestionesOfEvent(event.id).filter(
      (g) => !g.done && g.dueDate === today
    )
    if (todayPending.length === 0) continue
    const scheduled = todayPending.reduce((sum, g) => sum + Number(g.hours), 0)
    const rounded = Math.round(scheduled * 10) / 10
    if (rounded > Number(event.dailyLimitHours)) {
      conflicts.push({
        eventId: event.id,
        eventName: event.name,
        eventColor: event.color,
        date: today,
        scheduledHours: rounded,
        limitHours: Number(event.dailyLimitHours),
        overloadIds: todayPending.map((g) => g.id),
      })
    }
  }
  return conflicts
}

const PRIORITY_ORDER = { vencida: 0, urgent: 1, overload: 2, upcoming: 3, normal: 4 }

function priorityOf(gestion, eventId, conflicts) {
  const today = todayKey()
  const onConflictedDay = conflicts.some(
    (c) => c.eventId === eventId && c.date === gestion.dueDate
  )
  if (gestion.dueDate < today) return 'vencida'
  if (gestion.dueDate === today) return onConflictedDay ? 'overload' : 'urgent'
  const d = new Date(`${gestion.dueDate}T00:00:00`)
  const limit = new Date()
  limit.setDate(limit.getDate() + 2)
  if (d <= limit) return 'upcoming'
  return 'normal'
}

export async function getTodayData() {
  await delay(500)
  const events = getAllEvents()
  const byId = new Map(events.map((e) => [e.id, e]))
  const conflicts = computeTodayConflicts()
  const items = readGestiones()
    .filter((g) => !g.done)
    .map((g) => {
      const event = byId.get(g.eventId)
      return {
        ...g,
        eventName: event ? event.name : '',
        eventColor: event ? event.color : '#6b7280',
        priority: priorityOf(g, g.eventId, conflicts),
      }
    })
    .filter((g) => g.priority !== 'normal')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  const eventsWithProgress = events.map((e) => ({
    ...e,
    progress: eventProgress(getGestionesOfEvent(e.id)).percent,
    pendingToday: getGestionesOfEvent(e.id).filter(
      (g) => !g.done && g.dueDate === todayKey()
    ).length,
  }))

  return { items, conflicts, events: eventsWithProgress }
}