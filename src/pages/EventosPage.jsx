import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import Skeleton from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import ResultModal from '../components/ResultModal'
import { listEventsWithProgress, deleteEvent } from '../services/eventService'
import { formatDate } from '../utils/format'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-edge p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

export default function EventosPage() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [events, setEvents] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutating, setMutating] = useState(false)
  const [result, setResult] = useState(null)

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

  async function handleDeleteConfirm() {
    setMutating(true)
    try {
      await deleteEvent(deleteTarget.id)
      setDeleteTarget(null)
      setResult({
        type: 'success',
        title: 'Evento eliminado',
        message: 'El evento ha sido eliminado junto con sus gestiones.',
      })
      load()
    } catch {
      setDeleteTarget(null)
      setResult({
        type: 'error',
        title: 'Error',
        message: 'Ha ocurrido un error al eliminar, inténtalo de nuevo.',
      })
    } finally {
      setMutating(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1 text-subtle">Gestión</p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-navy font-display">Mis Eventos</h1>
          <Button onClick={() => navigate('/crear')}>+ Nuevo evento</Button>
        </div>
        <p className="text-sm mt-1 text-muted">
          {state === 'loading' && 'Cargando…'}
          {state === 'success' &&
            `${events.length} evento${events.length !== 1 ? 's' : ''} activo${events.length !== 1 ? 's' : ''}`}
          {state === 'empty' && 'Aún no tienes eventos creados.'}
          {state === 'error' && 'No se han podido cargar los eventos.'}
        </p>
      </header>

      {state === 'loading' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span
            role="img"
            aria-label="Error al cargar eventos"
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-danger-bg text-2xl font-bold text-danger mb-4"
          >
            !
          </span>
          <h2 className="text-xl font-semibold text-navy mb-1.5">Error cargando eventos</h2>
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
          <span role="img" aria-label="Calendario vacío" className="text-6xl mb-5">
            🗂️
          </span>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">No tienes eventos creados.</h2>
          <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
            ¿Deseas crear tu primer evento y su plan logístico?
          </p>
          <Button onClick={() => navigate('/crear')}>Crear evento</Button>
        </div>
      )}

      {state === 'success' && (
        <ul className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }} role="list">
          {events.map((event) => (
            <li key={event.id}>
              <article
                className="bg-white rounded-xl border border-edge p-5 hover:shadow-sm transition-shadow duration-150"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: event.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900 leading-tight truncate">{event.name}</h2>
                      <p className="text-sm mt-0.5 text-muted truncate">
                        {event.type ? `${event.type} · ` : ''}{event.client || 'Sin cliente'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: event.id, name: event.name })}
                    aria-label={`Eliminar evento "${event.name}"`}
                    className="p-2 rounded-lg text-subtle hover:text-danger hover:bg-danger-bg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-muted">
                  <div>
                    <p className="font-medium text-gray-500 mb-0.5">Fecha</p>
                    <p className="truncate">{formatDate(event.date)}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="font-medium text-gray-500 mb-0.5">Gestiones</p>
                    <p>{event.progress.done} de {event.progress.total} completadas</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Progreso global</span>
                    <span className="font-semibold" style={{ color: event.color }}>
                      {event.progress.percent}%
                    </span>
                  </div>
                  <ProgressBar
                    percent={event.progress.percent}
                    color={event.color}
                    label={`Progreso del evento ${event.name}`}
                    height="h-1.5"
                  />
                </div>

                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="neutral"
                    onClick={() => navigate(`/evento/${event.id}`)}
                    aria-label={`Ver detalle de ${event.name}`}
                  >
                    Ver detalle
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="¿Eliminar evento?"
        message="Esta acción eliminará el evento y todas sus gestiones. No se puede deshacer."
        busy={mutating}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <ResultModal
        type={result?.type}
        open={Boolean(result)}
        title={result?.title}
        message={result?.message}
        actionLabel={result?.type === 'success' ? 'Aceptar' : 'Cerrar'}
        onClose={() => setResult(null)}
      />
    </div>
  )
}