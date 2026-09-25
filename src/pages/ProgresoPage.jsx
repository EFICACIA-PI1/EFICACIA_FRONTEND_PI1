import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import Skeleton from '../components/Skeleton'
import { listEventsWithProgress } from '../services/eventService'

function StatCard({ label, value, sub, color = 'var(--color-primary)' }) {
  return (
    <div className="bg-white rounded-xl border border-edge p-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-subtle">{label}</p>
      <p className="text-3xl font-bold font-display" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-1 text-muted">{sub}</p>}
    </div>
  )
}

export default function ProgresoPage() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [events, setEvents] = useState([])

  const load = useCallback(async () => {
    try {
      const data = await listEventsWithProgress()
      setEvents(data)
      setState(data.length === 0 ? 'empty' : 'success')
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

  const totalDone = events.reduce((s, e) => s + e.progress.done, 0)
  const totalAll = events.reduce((s, e) => s + e.progress.total, 0)
  const avgProgress = events.length
    ? Math.round(events.reduce((s, e) => s + e.progress.percent, 0) / events.length)
    : 0

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1 text-subtle">Analítica</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-navy font-display">Progreso</h1>
        <p className="text-sm mt-1 text-muted">
          Resumen de tu actividad y avance en eventos activos.
        </p>
      </header>

      {state === 'success' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Gestiones completadas" value={`${totalDone}/${totalAll}`} sub="en total" />
          <StatCard label="Eventos activos" value={events.length} sub="en curso" color="#7c3aed" />
          <StatCard label="Progreso medio" value={`${avgProgress}%`} sub="entre todos los eventos" color="#0891b2" />
          <StatCard
            label="Eventos al 100%"
            value={events.filter((e) => e.progress.percent === 100).length}
            sub="listos para el gran día"
            color="#16a34a"
          />
        </div>
      )}

      <section aria-labelledby="events-progress-heading">
        <h2 id="events-progress-heading" className="text-xs font-semibold uppercase tracking-widest mb-4 text-subtle">
          Avance por evento
        </h2>

        {state === 'loading' && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-edge p-5 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-edge">
            <span
              role="img"
              aria-label="Error al cargar el progreso"
              className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-danger-bg text-2xl font-bold text-danger mb-4"
            >
              !
            </span>
            <h2 className="text-xl font-semibold text-navy mb-1.5">No pudimos cargar el progreso de este evento</h2>
            <p className="text-sm text-muted max-w-sm mb-6">
              Ha ocurrido un error cargando la información, inténtalo de nuevo.
            </p>
            <Button variant="neutral" onClick={retry}>
              Reintentar
            </Button>
          </div>
        )}

        {state === 'empty' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span role="img" aria-label="Sin eventos registrados" className="text-6xl mb-5">
              📈
            </span>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">No tienes eventos creados.</h2>
            <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
              ¿Deseas crear tu primer evento y empezar a registrar avances?
            </p>
            <Button onClick={() => navigate('/crear')}>Crear evento</Button>
          </div>
        )}

        {state === 'success' && (
          <ul className="space-y-4" role="list">
            {events.map((event) => (
              <li key={event.id}>
                <div className="bg-white rounded-xl border border-edge p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: event.color }} aria-hidden="true" />
                      <span className="text-sm font-semibold text-navy font-display">{event.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: event.color }}>
                      {event.progress.percent}%
                    </span>
                  </div>
                  <ProgressBar
                    percent={event.progress.percent}
                    color={
                      event.progress.percent === 100 ? 'var(--color-success)' : event.color
                    }
                    label={`Progreso de ${event.name}: ${event.progress.percent}%`}
                  />
                  <p className="text-xs mt-2 text-muted">
                    {event.progress.percent === 100 ? (
                      <span className="inline-flex items-center gap-1 text-success font-medium">
                        <span aria-hidden="true">✔</span> Evento listo · todas las gestiones completadas
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