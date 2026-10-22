import Icon from '../components/Icon'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import { getOverallProgress, listEvents, sumProgress } from '../services/eventsApi'
import { getOpenTaskCounts } from '../services/todayApi'
import usePageTitle from '../hooks/usePageTitle'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import DailyLimitBadge from '../components/DailyLimitBadge'

function StatCard({ label, value, sub, colorClass = 'text-primary' }) {
  return (
    <div className="bg-white rounded-xl border border-edge p-5">
      <p className="text-xs font-semibold tracking-widest mb-2 text-subtle">{label}</p>
      <p className={`text-3xl font-bold font-display ${colorClass}`}>
        {value}
      </p>
      {sub && <p className="text-xs mt-1 text-muted">{sub}</p>}
    </div>
  )
}

export default function ProgressPage() {
  usePageTitle('Progreso')
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [events, setEvents] = useState([])
  const [overall, setOverall] = useState({ done: 0, total: 0, percent: 0 })
  const [openCounts, setOpenCounts] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const load = useCallback(async (signal) => {
    try {
      const [data, global, counts] = await Promise.all([
        listEvents({ signal }),
        // Si el global falla, la pantalla sigue con la suma de los eventos.
        getOverallProgress({ signal }).catch(() => null),
        // Si el conteo por estado falla, solo se oculta esa sección.
        getOpenTaskCounts({ signal }).catch(() => null),
      ])
      setEvents(data)
      setOverall(global ?? sumProgress(data))
      setOpenCounts(counts)
      setState(data.length === 0 ? 'empty' : 'success')
    } catch (err) {
      if (err.name === 'AbortError') return
      setLoadError(err)
      setState('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  function retry() {
    setState('loading')
    load()
  }

  const completedEvents = events.filter((e) => e.progress.percent === 100).length

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16 max-w-4xl mx-auto w-full">
      <DailyLimitBadge />
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-navy font-display">Progreso</h1>
        <p className="text-sm mt-1 text-muted">
          Resumen de tu actividad y avance en eventos activos.
        </p>
      </header>

      {state === 'success' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Tareas completadas" value={`${overall.done}/${overall.total}`} sub="en total" />
          <StatCard label="Eventos activos" value={events.length} sub="en curso" />
          <StatCard label="Progreso global" value={`${overall.percent}%`} sub="de todas tus tareas" />
          <StatCard
            label="Eventos al 100%"
            value={completedEvents}
            sub={completedEvents === 1 ? 'completado' : 'completados'}
            colorClass="text-success"
          />
        </div>
      )}

      {state === 'success' && openCounts && (
        <section aria-labelledby="task-status-heading" className="mb-8">
          <h2 id="task-status-heading" className="text-xs font-semibold uppercase tracking-widest mb-4 text-subtle">
            Tareas por estado
          </h2>
          <ul className="flex flex-wrap gap-2" role="list">
            {[
              { label: 'Completadas', value: overall.done, cls: 'bg-success-bg text-success border-success-border', dot: 'bg-success' },
              { label: 'Pendientes', value: openCounts.pending, cls: 'bg-neutral-bg text-neutral border-neutral-border', dot: 'bg-neutral' },
              { label: 'Pospuestas', value: openCounts.postponed, cls: 'bg-warning-bg text-warning border-warning-border', dot: 'bg-warning' },
              { label: 'Vencidas', value: openCounts.overdue, cls: 'bg-danger-bg text-danger border-danger-border', dot: 'bg-danger' },
            ].map((item) => (
              <li
                key={item.label}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${item.cls}`}
              >
                <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                {item.value} {item.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="events-progress-heading">
        <h2 id="events-progress-heading" className="text-xs font-semibold uppercase tracking-widest mb-4 text-subtle">
          Avance por evento
        </h2>

        {state === 'loading' && <LoadingState label="Calculando tu progreso…" className="py-16" />}

        {state === 'error' && (
          <ErrorState
            error={loadError}
            title="No pudimos cargar el progreso"
            onRetry={retry}
            className="py-16 bg-white rounded-xl border border-edge"
          />
        )}

        {state === 'empty' && (
          <EmptyState
            icon="progress"
            title="No tienes eventos creados."
            description="¿Deseas crear tu primer evento y empezar a registrar avances?"
            action={<Button onClick={() => navigate('/crear')}>Crear evento</Button>}
          />
        )}

        {state === 'success' && (
          <ul className="space-y-4" role="list">
            {events.map((event) => (
              <li key={event.id}>
                <div className="bg-white rounded-xl border border-edge p-5">
                  <div className="flex justify-between items-center gap-3 mb-3">
                    <span className="text-sm font-semibold text-navy font-display break-words min-w-0">{event.name}</span>
                    <span
                      className={`text-sm font-bold ${event.progress.percent === 100 ? 'text-success' : 'text-primary'}`}
                    >
                      {event.progress.percent}%
                    </span>
                  </div>
                  <ProgressBar
                    percent={event.progress.percent}
                    color={event.progress.percent === 100 ? 'var(--color-success)' : 'var(--color-primary)'}
                    label={`Progreso de ${event.name}: ${event.progress.percent}%`}
                  />
                  <p className="text-xs mt-2 text-muted">
                    {event.progress.percent === 100 ? (
                      <span className="inline-flex items-center gap-1 text-success font-medium">
                        <Icon name="check" className="w-4 h-4 inline" /> Todas las tareas completadas ({event.progress.done} de {event.progress.total})
                      </span>
                    ) : event.progress.total === 0 ? (
                      'Todavía no hay tareas registradas.'
                    ) : (
                      `${event.progress.done} de ${event.progress.total} tareas completadas`
                    )}
                  </p>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="neutral"
                      onClick={() => navigate(`/evento/${event.id}`)}
                      aria-label={`Ver detalles de ${event.name}`}
                    >
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}