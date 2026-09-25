import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import Skeleton from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import ResultModal from '../components/ResultModal'
import TaskFormModal from '../components/TaskFormModal'
import {
  getEventDetail,
  createTask,
  updateTask,
  deleteTask,
  deleteEvent,
  postponeGestion,
  formatHours,
  getTaskStatus,
} from '../services/eventService'
import { formatDate, formatDateShort } from '../utils/format'

const LOADING_CARD = () => (
  <div className="bg-white rounded-xl border border-edge p-5 space-y-3">
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
)

function ErrorState({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span
        role="img"
        aria-label="Error cargando el evento"
        className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-danger-bg text-2xl font-bold text-danger mb-4"
      >
        !
      </span>
      <h2 className="text-xl font-semibold text-navy mb-1.5">No se ha podido cargar el evento</h2>
      <p className="text-sm text-muted max-w-sm mb-6">
        Ha ocurrido un error cargando la información, inténtalo de nuevo.
      </p>
      <Button variant="neutral" onClick={onBack}>
        ← Volver a eventos
      </Button>
    </div>
  )
}

function TaskCard({ task, onPostpone, onReschedule, onEdit, onDelete }) {
  const status = getTaskStatus(task)
  const dotClass =
    status === 'done'
      ? 'bg-success'
      : status === 'overdue'
        ? 'bg-danger'
        : 'bg-primary'
  return (
    <article className="bg-white rounded-xl border border-edge p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotClass}`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900 leading-snug">{task.name}</h3>
              <StatusBadge task={task} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted">
              <span>⏱️ {formatHours(task.hours)}</span>
              <span>📅 {formatDateShort(task.dueDate)}</span>
            </div>
            {task.note && (
              <p className="text-xs text-muted mt-2 bg-surface border border-edge rounded-lg px-3 py-2">
                {task.note}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
          <Button size="sm" variant="neutral" onClick={() => onPostpone(task)}>
            Posponer
          </Button>
          <Button size="sm" variant="neutral" onClick={() => onReschedule(task)}>
            Reprogramar
          </Button>
          <Button size="sm" variant="neutral" onClick={() => onEdit(task)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(task)}
            aria-label={`Eliminar gestión "${task.name}"`}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </article>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [state, setState] = useState('loading')
  const [event, setEvent] = useState(null)
  const [tasks, setTasks] = useState([])
  const [progress, setProgress] = useState({ total: 0, done: 0, percent: 0 })

  const [taskForm, setTaskForm] = useState({ open: false, mode: 'create', task: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutating, setMutating] = useState(false)
  const [result, setResult] = useState(null)

  const load = useCallback(async () => {
    try {
      const detail = await getEventDetail(id)
      if (!detail) {
        setState('error')
        return
      }
      setEvent(detail.event)
      setTasks(detail.tasks)
      setProgress(detail.progress)
      setState('success')
    } catch {
      setState('error')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  function successModal(title, message, hub) {
    setResult({ type: 'success', title, message, hub })
  }

  function errorModal(title, message) {
    setResult({ type: 'error', title, message })
  }

  async function handleTaskSave(data) {
    const { mode, task } = taskForm
    try {
      if (!event?.id && mode !== 'create') {
        throw new Error('Evento no encontrado')
      }
      if (mode === 'create') {
        await createTask(event.id, data)
        successModal('Gestión creada', 'La gestión se ha agregado al plan logístico.')
      } else if (mode === 'reschedule') {
        await updateTask(task.id, data, event.id)
        successModal('Gestión reprogramada', 'La gestión ha sido movida a la nueva fecha.')
      } else {
        await updateTask(task.id, data, event.id)
        successModal('Gestión editada', 'La gestión ha sido editada exitosamente.')
      }
      setTaskForm({ open: false, mode: 'create', task: null })
      load()
    } catch {
      setTaskForm({ open: false, mode: 'create', task: null })
      errorModal('Error', 'Ha ocurrido un error al guardar la gestión, inténtalo de nuevo.')
    }
  }

  async function handleDeleteConfirm() {
    setMutating(true)
    try {
      if (deleteTarget.type === 'task') {
        await deleteTask(deleteTarget.id)
        setDeleteTarget(null)
        successModal('Gestión eliminada', 'La gestión ha sido eliminada.')
      } else {
        await deleteEvent(event.id)
        setDeleteTarget(null)
        successModal('Evento eliminado', 'El evento ha sido eliminado junto con sus gestiones.', {
          after: () => navigate('/eventos', { replace: true }),
        })
      }
      load()
    } catch {
      setDeleteTarget(null)
      errorModal('Error', 'Ha ocurrido un error al eliminar, inténtalo de nuevo.')
    } finally {
      setMutating(false)
    }
  }

  async function handlePostpone(task) {
    try {
      await postponeGestion(task.id)
      successModal('Gestión pospuesta', 'La gestión se ha movido al siguiente día.')
      load()
    } catch {
      errorModal('Error', 'Ha ocurrido un error al posponer la gestión, inténtalo de nuevo.')
    }
  }

  function closeResult() {
    if (result?.hub?.after) {
      result.hub.after()
      return
    }
    setResult(null)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button variant="neutral" size="sm" onClick={() => navigate('/eventos')}>
          ← Volver a mis eventos
        </Button>
        {state === 'success' && event && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget({ type: 'evento' })}
            aria-label={`Eliminar evento "${event.name}"`}
          >
            Eliminar evento
          </Button>
        )}
      </div>

      {state === 'loading' && (
        <div className="space-y-4">
          <LOADING_CARD />
          <LOADING_CARD />
          <LOADING_CARD />
        </div>
      )}

      {state === 'error' && <ErrorState onBack={() => navigate('/eventos')} />}

      {state === 'success' && event && (
        <>
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-navy font-display">
                {event.name}
              </h1>
              {event.type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-bg text-neutral border border-neutral-border font-medium">
                  {event.type}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm text-muted">
              <div>
                <p className="font-medium text-gray-500 mb-0.5 text-xs uppercase tracking-wider">Cliente</p>
                <p>{event.client || '—'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500 mb-0.5 text-xs uppercase tracking-wider">Fecha del evento</p>
                <p>{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500 mb-0.5 text-xs uppercase tracking-wider">Lugar</p>
                <p>{event.location || '—'}</p>
              </div>
            </div>

            <section
              aria-label="Progreso de preparación del evento"
              className="bg-white rounded-xl border border-edge p-5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-gray-700">Progreso de preparación</p>
                {progress.percent === 100 ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success-bg text-success border border-success-border font-medium">
                    <span aria-hidden="true">✔</span> Gestión completa
                  </span>
                ) : (
                  <span
                    className="text-sm font-bold"
                    style={{ color: progress.percent > 0 ? 'var(--color-primary)' : 'var(--color-success)' }}
                  >
                    {progress.percent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mb-3">
                {progress.total === 0
                  ? 'Todavía no hay gestiones registradas en este evento.'
                  : `${progress.done} de ${progress.total} gestiones completadas`}
              </p>
              <ProgressBar
                percent={progress.percent}
                color={progress.percent === 100 ? 'var(--color-success)' : 'var(--color-primary)'}
                label={`Progreso de preparación del evento ${event.name}`}
              />
            </section>
          </header>

          <section aria-labelledby="gestiones-heading">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div>
                <h2 id="gestiones-heading" className="text-xs font-semibold uppercase tracking-widest text-subtle">
                  Gestiones logísticas
                </h2>
                <p className="text-sm text-muted mt-0.5">
                  {tasks.length === 0
                    ? 'Aún no has definido tu plan de trabajo logístico.'
                    : `${tasks.length} gestión${tasks.length !== 1 ? 'es' : ''} en el plan`}
                </p>
              </div>
              <Button onClick={() => setTaskForm({ open: true, mode: 'create', task: null })}>
                + Agregar gestión
              </Button>
            </div>

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-dashed border-edge">
                <span
                  role="img"
                  aria-label="Libro abierto, sin gestiones"
                  className="text-5xl mb-4"
                >
                  📖
                </span>
                <h3 className="text-lg font-semibold text-gray-800 mb-1.5">¿Deseas agregar tu primera gestión?</h3>
                <p className="text-sm text-muted max-w-sm mb-6">
                  Reserva de salón, invitaciones, catering y proveedores son ejemplos de gestiones
                  que puedes planear aquí.
                </p>
                <Button onClick={() => setTaskForm({ open: true, mode: 'create', task: null })}>
                  + Agregar gestión
                </Button>
              </div>
            ) : (
              <ul className="space-y-3" role="list">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <TaskCard
                      task={task}
                      onPostpone={handlePostpone}
                      onReschedule={() => setTaskForm({ open: true, mode: 'reschedule', task: task })}
                      onEdit={() => setTaskForm({ open: true, mode: 'edit', task: task })}
                      onDelete={() => setDeleteTarget({ type: 'task', id: task.id, name: task.name })}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <TaskFormModal
        open={taskForm.open}
        mode={taskForm.mode}
        event={event}
        task={taskForm.task}
        onSave={handleTaskSave}
        onClose={() => setTaskForm({ open: false, mode: 'create', task: null })}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'evento' ? '¿Eliminar evento?' : '¿Eliminar gestión?'}
        message={
          deleteTarget?.type === 'evento'
            ? 'Esta acción eliminará el evento y todas sus gestiones. No se puede deshacer.'
            : "Esta acción eliminará la gestión y su información. No se puede deshacer."
        }
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
        onClose={closeResult}
      />
    </div>
  )
}