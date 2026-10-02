import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import Modal from '../components/Modal'
import { inputCls } from '../utils/forms'
import { getTodayData } from '../services/todayApi'
import { markTaskDone, postponeTask } from '../services/tasksApi'
import { formatHours, TASK_STATES } from '../utils/tasks'
import { formatDate, formatDateShort } from '../utils/format'
import usePageTitle from '../hooks/usePageTitle'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'

const DANGER = 'bg-danger-bg text-danger border-danger-border'
const WARNING = 'bg-warning-bg text-warning border-warning-border'
const NEUTRAL = 'bg-neutral-bg text-neutral border-neutral-border'

const PRIORITY_CONFIG = {
  vencida: { label: 'Vencida', icon: 'clock', cls: DANGER },
  urgent: { label: 'Vence hoy', icon: 'clock', cls: DANGER },
  overload: { label: 'Contribuye a la sobrecarga', icon: 'alert', cls: WARNING },
  upcoming: { label: 'Próxima', icon: 'calendar', cls: NEUTRAL },
}

function FilterBar({ events, eventId, taskState, onChange, onClear, disabled }) {
  const active = Boolean(eventId || taskState)
  return (
    <form
      role="search"
      aria-label="Filtrar gestiones"
      onSubmit={(e) => e.preventDefault()}
      className="mb-6 flex flex-col sm:flex-row sm:items-end gap-3"
    >
      <div className="flex-1 min-w-0">
        <label htmlFor="filter-event" className="block text-xs font-medium mb-1 text-muted">
          Evento
        </label>
        <select
          id="filter-event"
          value={eventId}
          disabled={disabled}
          onChange={(e) => onChange({ event: e.target.value })}
          className={inputCls}
        >
          <option value="">Todos los eventos</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-0">
        <label htmlFor="filter-state" className="block text-xs font-medium mb-1 text-muted">
          Estado
        </label>
        <select
          id="filter-state"
          value={taskState}
          disabled={disabled}
          onChange={(e) => onChange({ state: e.target.value })}
          className={inputCls}
        >
          <option value="">Todos los estados</option>
          {TASK_STATES.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      </div>
      {active && (
        <Button type="button" variant="neutral" onClick={onClear} className="sm:mb-0.5">
          Limpiar filtros
        </Button>
      )}
    </form>
  )
}

function TodayEmptyState({ onViewPlan, filtered, onClear }) {
  if (filtered) {
    return (
      <EmptyState
        icon="search"
        title="Sin resultados"
        description="No hay gestiones que coincidan con los filtros seleccionados."
        action={
          <Button variant="neutral" onClick={onClear}>
            Limpiar filtros
          </Button>
        }
        className="py-16"
      />
    )
  }
  return (
    <EmptyState
      icon="sun"
      title="¡Día libre!"
      description="No tienes gestiones urgentes para hoy. ¿Quieres adelantar trabajo o tomar un descanso?"
      action={
        <Button variant="neutral" onClick={onViewPlan}>
          Ver plan completo
        </Button>
      }
      className="py-24"
    />
  )
}

function TaskCard({ task, busy, onComplete, onPostpone }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.upcoming

  return (
    <article className="bg-white rounded-xl border border-edge p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug text-navy">{task.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary-soft text-primary">
              {task.eventName}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Icon name="calendar" className="w-3.5 h-3.5" />
              {formatDateShort(task.dueDate)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted"><Icon name="clock" className="w-3.5 h-3.5" />{formatHours(task.hours)}</span>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${p.cls}`}
            >
              <Icon name={p.icon} className="w-3 h-3" />
              {p.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 shrink-0">
        <Button
          size="sm"
          variant="neutral"
          disabled={busy}
          aria-label={`Marcar "${task.name}" como hecha`}
          onClick={() => onComplete(task.id)}
        >
          <Icon name="check" className="w-4 h-4" />
          Marcar como hecha
        </Button>
        <Button size="sm" variant="neutral" disabled={busy} onClick={() => onPostpone(task.id)}>
          <Icon name="postpone" className="w-4 h-4" />
          Posponer
        </Button>
        </div>
      </div>
    </article>
  )
}

// Orden fijo de las secciones: de la más urgente a la menos urgente.
const TASK_GROUPS = [
  {
    key: 'vencidas',
    title: 'Vencidas',
    empty: 'No tienes gestiones vencidas.',
    countCls: 'bg-danger-bg text-danger border-danger-border',
  },
  {
    key: 'paraHoy',
    title: 'Para hoy',
    empty: 'No tienes gestiones para hoy.',
    countCls: 'bg-primary-soft text-primary border-primary/20',
  },
  {
    key: 'proximas',
    title: 'Próximas',
    empty: 'No tienes gestiones próximas.',
    countCls: 'bg-neutral-bg text-neutral border-neutral-border',
  },
]

function TaskGroup({ id, title, empty, countCls, tasks, busy, onComplete, onPostpone }) {
  return (
    <section aria-labelledby={`group-${id}`}>
      <div className="flex items-center gap-2 mb-3">
        <h2 id={`group-${id}`} className="text-sm font-semibold text-navy font-display">
          {title}
        </h2>
        <span
          className={`inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full border text-xs font-semibold ${countCls}`}
          aria-label={`${tasks.length} gestión${tasks.length !== 1 ? 'es' : ''}`}
        >
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge bg-white px-4 py-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-3" role="list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} busy={busy} onComplete={onComplete} onPostpone={onPostpone} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function TodayPage() {
  usePageTitle('Hoy')
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const displayName = user?.fullName?.trim().split(/\s+/)[0] || user?.username
  const [searchParams, setSearchParams] = useSearchParams()
  const eventId = searchParams.get('event') || ''
  const taskState = searchParams.get('state') || ''
  const [allEvents, setAllEvents] = useState([])
  const [state, setState] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [items, setItems] = useState([])
  const [groups, setGroups] = useState({ vencidas: [], paraHoy: [], proximas: [] })
  const [events, setEvents] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [modalConflict, setModalConflict] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (signal) => {
    try {
      const data = await getTodayData({ eventId, state: taskState, signal })
      setAllEvents(data.allEvents)
      setItems(data.items)
      setGroups(data.groups)
      setEvents(data.events)
      setConflicts(data.conflicts)
      setState(data.items.length === 0 ? 'empty' : 'success')
    } catch (err) {
      if (err.name === 'AbortError') return
      setLoadError(err)
      setState('error')
    }
  }, [eventId, taskState])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  function changeFilter(change) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(change)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setState('loading')
    setSearchParams(next, { replace: true })
  }

  function clearFilters() {
    setState('loading')
    setSearchParams({}, { replace: true })
  }

  function retry() {
    setState('loading')
    load()
  }

  async function handleComplete(id) {
    setBusy(true)
    try {
      await markTaskDone(id)
    } catch (err) {
      toast.error(err.message || 'No se pudo completar la gestión.')
      setBusy(false)
      return
    }
    setBusy(false)
    toast.success('Gestión marcada como hecha.')
    load()
  }

  async function handlePostpone(id) {
    setBusy(true)
    try {
      await postponeTask(id)
    } catch (err) {
      toast.error(err.message || 'No se pudo posponer la gestión.')
      setBusy(false)
      return
    }
    setBusy(false)
    setModalConflict(null)
    toast.success('Gestión pospuesta al siguiente día.')
    load()
  }

  const urgentCount = items.filter((t) => t.priority === 'urgent' || t.priority === 'vencida').length
  const overloadTotal = conflicts.reduce((s, c) => s + (c.scheduledHours - c.limitHours), 0)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold leading-tight mb-2 text-navy font-display">
          {displayName ? `Hola, ${displayName}.` : 'Hola.'} Aquí está tu plan logístico para hoy.
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

      <FilterBar
        events={allEvents}
        eventId={eventId}
        taskState={taskState}
        onChange={changeFilter}
        onClear={clearFilters}
        disabled={state === 'loading' && allEvents.length === 0}
      />

      <div aria-live="polite" className="sr-only">
        {state === 'success' && `${items.length} gestiones encontradas`}
        {state === 'empty' && 'Sin gestiones'}
      </div>

      {state === 'loading' && <LoadingState label="Cargando tu plan del día…" />}
      {state === 'empty' && (
        <TodayEmptyState
          onViewPlan={() => navigate('/eventos')}
          filtered={Boolean(eventId || taskState)}
          onClear={clearFilters}
        />
      )}
      {state === 'error' && <ErrorState error={loadError} onRetry={retry} />}

      {state === 'success' && (
        <div className="space-y-8">
          {conflicts.length > 0 && (
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.eventId}
                  role="alert"
                  className="rounded-xl p-4 border border-warning-border flex flex-col sm:flex-row sm:items-center gap-4"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Icon name="alert" className="w-6 h-6 text-warning mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-warning-text">
                        Alerta de sobrecarga · {conflict.eventName}
                      </p>
                      <p className="text-sm mt-0.5 leading-relaxed text-warning-text-dark">
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
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted">Progreso global</span>
                        <span className="text-xs font-semibold text-primary">{event.progress}%</span>
                      </div>
                      <ProgressBar
                        percent={event.progress}
                        label={`Progreso de ${event.name}`}
                        height="h-1.5"
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-6">
            <div
              role="note"
              className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3"
            >
              <Icon name="info" className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm leading-relaxed text-navy">
                Tus gestiones se agrupan por urgencia: primero las vencidas, luego las de hoy y después las
                próximas. Dentro de cada grupo van primero las de fecha más cercana y, si coinciden, las que
                requieren menos horas.
              </p>
            </div>

            {TASK_GROUPS.map((group) => (
              <TaskGroup
                key={group.key}
                id={group.key}
                title={group.title}
                empty={group.empty}
                countCls={group.countCls}
                tasks={groups[group.key]}
                busy={busy}
                onComplete={handleComplete}
                onPostpone={handlePostpone}
              />
            ))}
          </div>
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
            <Icon name="alert" className="w-7 h-7 text-warning" />
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
            <Icon name="close" className="w-5 h-5" />
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
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary-soft text-primary">
                        {task.eventName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted"><Icon name="clock" className="w-3.5 h-3.5" />{formatHours(task.hours)}</span>
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