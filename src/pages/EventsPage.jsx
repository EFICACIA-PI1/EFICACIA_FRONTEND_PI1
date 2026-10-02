import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../context/ToastContext'
import ResultModal from '../components/ResultModal'
import { listEventsWithProgress, deleteEvent } from '../services/eventsApi'
import { formatDate } from '../utils/format'
import usePageTitle from '../hooks/usePageTitle'
import Icon from '../components/Icon'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'

export default function EventsPage() {
  usePageTitle('Mis eventos')
  const navigate = useNavigate()
  const toast = useToast()
  const [state, setState] = useState('loading')
  const [events, setEvents] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutating, setMutating] = useState(false)
  const [result, setResult] = useState(null)

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

  async function handleDeleteConfirm() {
    setMutating(true)
    try {
      await deleteEvent(deleteTarget.id)
      setDeleteTarget(null)
      toast.success('Evento eliminado junto con sus gestiones.')
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
    <div className="px-4 sm:px-6 lg:px-8 py-16 max-w-4xl mx-auto w-full">
      <header className="mb-8">
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

      {state === 'loading' && <LoadingState label="Cargando tus eventos…" />}

      {state === 'error' && <ErrorState error={loadError} title="Error cargando eventos" onRetry={retry} />}

      {state === 'empty' && (
        <EmptyState
          icon="events"
          title="No tienes eventos creados."
          description="¿Deseas crear tu primer evento y su plan logístico?"
          action={<Button onClick={() => navigate('/crear')}>Crear evento</Button>}
        />
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
                    <Icon name="trash" className="w-4 h-4" />
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
                    <span className="font-semibold text-primary">{event.progress.percent}%</span>
                  </div>
                  <ProgressBar
                    percent={event.progress.percent}
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