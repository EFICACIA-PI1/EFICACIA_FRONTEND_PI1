import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Skeleton from '../components/Skeleton'
import ProgressBar from '../components/ProgressBar'
import Modal from '../components/Modal'
import Field from '../components/Field'
import { inputCls } from '../utils/forms'
import {
  getTodayData,
  markGestionDone,
  postponeGestion,
  formatHours,
} from '../services/eventService'
import { formatDate } from '../utils/format'

const PRIORITY_CONFIG = {
  vencida: {
    label: 'Vencida',
    icon: '⏰',
    textColor: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  urgent: {
    label: 'Vence hoy',
    icon: '🕐',
    textColor: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  overload: {
    label: 'Contribuye a la sobrecarga',
    icon: '⚠️',
    textColor: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  upcoming: {
    label: 'Próxima',
    icon: '📅',
    textColor: '#475569',
    bgColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
}

function LoadingState() {
  return (
    <div className="space-y-6" aria-label="Cargando contenido..." aria-busy="true">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-edge p-5 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-edge p-5 flex gap-4">
            <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ onViewPlan }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-6" role="img" aria-label="Calendario con sol">
        🌤️
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2 font-display">¡Día libre!</h2>
      <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
        No tienes gestiones urgentes para hoy. ¿Quieres adelantar trabajo o tomar un descanso?
      </p>
      <Button variant="neutral" onClick={onViewPlan}>
        Ver plan completo
      </Button>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span
        role="img"
        aria-label="Error al cargar las gestiones del día"
        className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-danger-bg text-2xl font-bold text-danger mb-4"
      >
        !
      </span>
      <h2 className="text-xl font-semibold text-navy mb-1.5">Ha ocurrido un error</h2>
      <p className="text-sm text-muted max-w-sm mb-6">
        Ha ocurrido un error cargando la información, inténtalo de nuevo.
      </p>
      <Button variant="neutral" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

function TaskCard({ task, noteOpen, noteText, onCheck, onNoteChange, onSaveNote, onCancelNote, onPostpone }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.upcoming

  return (
    <article className="bg-white rounded-xl border border-edge p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={noteOpen}
            onChange={(e) => onCheck(task.id, e.target.checked)}
            className="w-5 h-5 rounded cursor-pointer accent-primary"
            aria-label={`Marcar "${task.name}" como hecho`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug text-navy">{task.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${task.eventColor}18`, color: task.eventColor }}
            >
              {task.eventName}
            </span>
            <span className="text-xs text-muted">⏱️ {formatHours(task.hours)}</span>
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border"
              style={{ backgroundColor: p.bgColor, color: p.textColor, borderColor: p.borderColor }}
            >
              <span aria-hidden="true">{p.icon}</span>
              {p.label}
            </span>
          </div>
        </div>

        <Button size="sm" variant="neutral" onClick={() => onPostpone(task.id)}>
          📆 Posponer
        </Button>
      </div>

      {noteOpen && (
        <div className="mt-3 pl-9">
          <Field label="Nota de ejecución" htmlFor={`note-${task.id}`} optional>
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                id={`note-${task.id}`}
                rows={2}
                value={noteText}
                onChange={(e) => onNoteChange(task.id, e.target.value)}
                placeholder="Añadir nota de ejecución..."
                className={`${inputCls} resize-none flex-1`}
                autoFocus
              />
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => onSaveNote(task.id)}>
                  Guardar
                </Button>
                <Button size="sm" variant="neutral" onClick={() => onCancelNote(task.id)}>
                  Deshacer
                </Button>
              </div>
            </div>
          </Field>
        </div>
      )}
    </article>
  )
}

export default function HoyPage() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [items, setItems] = useState([])
  const [events, setEvents] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [noteOpen, setNoteOpen] = useState({})
  const [noteText, setNoteText] = useState({})
  const [modalConflict, setModalConflict] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getTodayData()
      setItems(data.items)
      setEvents(data.events)
      setConflicts(data.conflicts)
      setNoteOpen({})
      setNoteText({})
      setState(data.items.length === 0 ? 'empty' : 'success')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function retry() {
    setState('loading')
    load()
  }

  function handleCheck(id, checked) {
    setNoteOpen((prev) => ({ ...prev, [id]: checked }))
    if (checked) setNoteText((prev) => ({ ...prev, [id]: '' }))
  }

  function handleNoteChange(id, value) {
    setNoteText((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSaveNote(id) {
    setBusy(true)
    await markGestionDone(id, noteText[id] || '')
    setBusy(false)
    load()
  }

  function handleCancelNote(id) {
    setNoteOpen((prev) => ({ ...prev, [id]: false }))
    setNoteText((prev) => ({ ...prev, [id]: '' }))
  }

  async function handlePostpone(id) {
    setBusy(true)
    await postponeGestion(id)
    setBusy(false)
    setModalConflict(null)
    load()
  }

  const urgentCount = items.filter((t) => t.priority === 'urgent' || t.priority === 'vencida').length
  const overloadTotal = conflicts.reduce((s, c) => s + (c.scheduledHours - c.limitHours), 0)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1 text-subtle">Vista del día</p>
        <h1 className="text-2xl sm:text-3xl font-semibold leading-tight mb-2 text-navy font-display">
          Hola, María. Aquí está tu plan logístico para hoy.
        </h1>
        {state === 'success' && (
          <p className="text-base text-muted">
            {urgentCount > 0
              ? `Tienes ${urgentCount} gestión${urgentCount !== 1 ? 'es' : ''} urgente${urgentCount !== 1 ? 's' : ''}${conflicts.length > 0 ? ' y un conflicto de agenda' : ''}.`
              : 'Todo bajo control. Sin urgencias pendientes hoy.'}
            <br />
            <time dateTime={new Date().toISOString().slice(0, 10)} className="text-sm text-subtle">
              {formatDate(new Date().toISOString().slice(0, 10))}
            </time>
          </p>
        )}
      </header>

      {state === 'loading' && <LoadingState />}
      {state === 'empty' && <EmptyState onViewPlan={() => navigate('/eventos')} />}
      {state === 'error' && <ErrorState onRetry={retry} />}

      {state === 'success' && (
        <div className="space-y-8">
          {conflicts.length > 0 && (
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.eventId}
                  role="alert"
                  className="rounded-xl p-4 border border-warning-border flex flex-col sm:flex-row sm:items-center gap-4"
                  style={{ backgroundColor: 'var(--color-warning-bg)' }}
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">
                      ⚠️
                    </span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#92400e' }}>
                        Alerta de sobrecarga · {conflict.eventName}
                      </p>
                      <p className="text-sm mt-0.5 leading-relaxed" style={{ color: '#78350f' }}>
                        Tienes programadas <strong>{conflict.scheduledHours} horas</strong> de gestión
                        para hoy, superando tu límite diario de {conflict.limitHours} horas.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="warning" onClick={() => setModalConflict(conflict)}>
                    Resolver conflicto
                  </Button>
                </div>
              ))}
            </div>
          )}

          {events.length > 0 && (
            <section aria-labelledby="events-heading">
              <h2 id="events-heading" className="text-xs font-semibold uppercase tracking-widest mb-3 text-subtle">
                Eventos activos hoy
              </h2>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
              >
                {events.map((event) => (
                  <article
                    key={event.id}
                    className="bg-white rounded-xl p-5 border border-edge"
                    aria-label={`${event.name}: ${event.progress}% completado, ${event.pendingToday} gestiones hoy`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-800 leading-tight font-display">
                          {event.name}
                        </h3>
                        <p className="text-xs mt-0.5 text-subtle">
                          {event.pendingToday} gestión{event.pendingToday !== 1 ? 'es' : ''} hoy
                        </p>
                      </div>
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: event.color }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted">Progreso global</span>
                        <span className="text-xs font-semibold" style={{ color: event.color }}>
                          {event.progress}%
                        </span>
                      </div>
                      <ProgressBar
                        percent={event.progress}
                        color={event.color}
                        label={`Progreso de ${event.name}`}
                        height="h-1.5"
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="tasks-heading">
            <h2 id="tasks-heading" className="text-xs font-semibold uppercase tracking-widest mb-3 text-subtle">
              Gestiones urgentes del día
            </h2>
            <div className="space-y-3">
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  noteOpen={Boolean(noteOpen[task.id])}
                  noteText={noteText[task.id] || ''}
                  onCheck={handleCheck}
                  onNoteChange={handleNoteChange}
                  onSaveNote={handleSaveNote}
                  onCancelNote={handleCancelNote}
                  onPostpone={handlePostpone}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      <Modal
        open={Boolean(modalConflict)}
        onClose={() => setModalConflict(null)}
        labelledBy="conflict-title"
        describedBy="conflict-desc"
      >
        <div className="px-6 py-5 border-b border-edge">
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">
              ⚠️
            </span>
            <div>
              <h2 id="conflict-title" className="font-semibold text-gray-900 text-lg font-display">
                Resolver conflicto de sobrecarga
              </h2>
              <p id="conflict-desc" className="text-sm mt-0.5 text-muted">
                Tienes <strong>{modalConflict?.scheduledHours} h</strong> programadas (límite:{' '}
                {modalConflict?.limitHours} h). Pospón al menos{' '}
                <strong>{Math.ceil((overloadTotal * 10) / 10)} h</strong> de trabajo.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalConflict(null)}
            aria-label="Cerrar modal"
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-subtle">
            Gestiones candidatas a reprogramar
          </p>
          <ul className="space-y-3" role="list">
            {items
              .filter((t) => t.priority === 'overload')
              .map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-warning-border"
                  style={{ backgroundColor: 'var(--color-warning-bg)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${task.eventColor}18`, color: task.eventColor }}
                      >
                        {task.eventName}
                      </span>
                      <span className="text-xs text-muted">⏱️ {formatHours(task.hours)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => handlePostpone(task.id)}
                    disabled={busy}
                  >
                    Posponer
                  </Button>
                </li>
              ))}
          </ul>
        </div>

        <div className="px-6 py-4 border-t border-edge flex justify-end">
          <Button variant="neutral" onClick={() => setModalConflict(null)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  )
}