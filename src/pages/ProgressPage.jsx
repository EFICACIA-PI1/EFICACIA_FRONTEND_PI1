import Icon from '../components/Icon'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import { listEventsWithProgress } from '../services/eventsApi'
import usePageTitle from '../hooks/usePageTitle'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'

function StatCard({ label, value, sub, colorClass = 'text-primary' }) {
  return (
    <div className="bg-white rounded-xl border border-edge p-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-subtle">{label}</p>
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
  const [loadError, setLoadError] = useState(null)

  const load = useCallback(async (signal) => {
    try {
      const data = await listEventsWithProgress({ signal })
      setEvents(data)
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

  const totalDone = events.reduce((s, e) => s + e.progress.done, 0)
  const totalAll = events.reduce((s, e) => s + e.progress.total, 0)
  const avgProgress = events.length
    ? Math.round(events.reduce((s, e) => s + e.progress.percent, 0) / events.length)
    : 0

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-navy font-display">Progreso</h1>
        <p className="text-sm mt-1 text-muted">
          Resumen de tu actividad y avance en eventos activos.
        </p>
      </header>

      {state === 'success' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Gestiones completadas" value={`${totalDone}/${totalAll}`} sub="en total" />
          <StatCard label="Eventos activos" value={events.length} sub="en curso" />
          <StatCard label="Progreso medio" value={`${avgProgress}%`} sub="entre todos los eventos" />
          <StatCard
            label="Eventos al 100%"
            value={events.filter((e) => e.progress.percent === 100).length}
            sub="listos para el gran día"
            colorClass="text-success"
          />
        </div>
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
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-navy font-display">{event.name}</span>
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
                        <Icon name="check" className="w-4 h-4 inline" /> Evento listo · todas las gestiones completadas
                      </span>
                    ) : event.progress.total === 0 ? (
                      'Todavía no hay gestiones registradas.'
                    ) : (
                      `${event.progress.done} de ${event.progress.total} gestiones completadas`
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}