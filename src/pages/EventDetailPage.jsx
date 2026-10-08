import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import ConfirmModal from '../components/ConfirmModal'
import Icon from '../components/Icon'
import { useToast } from '../context/ToastContext'
import ResultModal from '../components/ResultModal'
import TaskFormModal from '../components/TaskFormModal'
import TaskQuickEditDialogs from '../components/TaskQuickEditDialogs'
import OverloadConflictModal from '../components/OverloadConflictModal'
import EventFormModal from '../components/EventFormModal'
import { getEventDetail, updateEvent, deleteEvent } from '../services/eventsApi'
import { eventTypeLabel } from '../utils/events'
import { updateTask, deleteTask } from '../services/tasksApi'
import { formatHours, getTaskStatus } from '../utils/tasks'
import { formatDate, formatDateShort } from '../utils/format'
import usePageTitle from '../hooks/usePageTitle'
import useRescheduleFlow from '../hooks/useRescheduleFlow'
import { ErrorState, LoadingState } from '../components/StateViews'

function TaskCard({ task, onEditHours, onReschedule, onEdit, onDelete }) {
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
              <span className="inline-flex items-center gap-1"><Icon name="clock" className="w-4 h-4" />{formatHours(task.hours)}</span>
              <span className="inline-flex items-center gap-1"><Icon name="calendar" className="w-4 h-4" />{formatDateShort(task.dueDate)}</span>
            </div>
            {task.note && (
              <p className="text-xs text-muted mt-2 bg-surface border border-edge rounded-lg px-3 py-2">
                {task.note}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
          <Button size="sm" variant="neutral" onClick={() => onEditHours(task)}>
            Modificar horas
          </Button>
          <Button size="sm" variant="neutral" onClick={() => onReschedule(task)}>
            Reprogramar
          </Button>
          <Button size="sm" variant="neutral" onClick={() => onEdit(task)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="subtle-danger"
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
  usePageTitle('Detalle del evento')
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [state, setState] = useState('loading')
  const [event, setEvent] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [progress, setProgress] = useState({ total: 0, done: 0, percent: 0 })

  const [taskForm, setTaskForm] = useState({ open: false, mode: 'create', task: null })
  const [quick, setQuick] = useState(null)
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutating, setMutating] = useState(false)
  const [result, setResult] = useState(null)

  const load = useCallback(async (signal) => {
    try {
      const detail = await getEventDetail(id, { signal })
      if (!detail) {
        setState('error')
        return
      }
      setEvent(detail.event)
      setTasks(detail.tasks)
      setProgress(detail.progress)
      setState('success')
    } catch (err) {
      if (err.name === 'AbortError') return
      setLoadError(err)
      setState('error')
    }
  }, [id])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const taskSaveFlow = useRescheduleFlow({
    onSuccess: () => {
      setTaskForm({ open: false, mode: 'create', task: null })
      toast.success('Gestión agregada al plan logístico.')
      load()
    },
  })

  function errorModal(title, message) {
    setResult({ type: 'error', title, message })
  }

  async function handleEventSave(data) {
    try {
      await updateEvent(event.id, data)
      setEventFormOpen(false)
      toast.success('Evento actualizado.')
      load()
    } catch (err) {
      setEventFormOpen(false)
      errorModal('Error', err.message || 'Ha ocurrido un error al guardar el evento, inténtalo de nuevo.')
    }
  }

  async function handleTaskSave(data) {
    const { mode, task } = taskForm
    if (mode === 'create') {
      await taskSaveFlow.save({ mode, event, task }, data)
      return
    }
    try {
      if (!event?.id) {
        throw new Error('Evento no encontrado')
      }
      await updateTask(task.id, data, event.id)
      toast.success('Gestión actualizada.')
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
        toast.success('Gestión eliminada.')
      } else {
        await deleteEvent(event.id)
        setDeleteTarget(null)
        toast.success('Evento eliminado junto con sus gestiones.')
        navigate('/eventos', { replace: true })
        return
      }
      load()
    } catch {
      setDeleteTarget(null)
      errorModal('Error', 'Ha ocurrido un error al eliminar, inténtalo de nuevo.')
    } finally {
      setMutating(false)
    }
  }

  function moveConflictToAnotherDay() {
    taskSaveFlow.moveToAnotherDay()
  }

  function openQuickEditHours(task) {
    setQuick({ mode: 'hours', task, event })
  }

  function closeResult() {
    setResult(null)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button variant="neutral" size="sm" onClick={() => navigate('/eventos')}>
          ← Volver a mis eventos
        </Button>
        {state === 'success' && event && (
          <div className="flex items-center gap-2">
            <Button variant="neutral" size="sm" onClick={() => setEventFormOpen(true)}>
              <Icon name="edit" className="w-4 h-4" />
              Editar evento
            </Button>
            <Button
              variant="subtle-danger"
              size="sm"
              onClick={() => setDeleteTarget({ type: 'evento' })}
              aria-label={`Eliminar evento "${event.name}"`}
            >
              Eliminar evento
            </Button>
          </div>
        )}
      </div>

      {state === 'loading' && <LoadingState label="Cargando el evento…" />}

      {state === 'error' && (
        <ErrorState
          error={loadError}
          title="No se ha podido cargar el evento"
          onRetry={() => navigate('/eventos')}
          retryLabel="← Volver a eventos"
        />
      )}

      {state === 'success' && event && (
        <>
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-navy font-display">
                {event.name}
              </h1>
              {event.type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-bg text-neutral border border-neutral-border font-medium">
                  {eventTypeLabel(event.type)}
                </span>
              )}
            </div>

            <dl className="flex flex-wrap gap-x-6 gap-y-1 mb-6 text-sm">
              {[
                { label: 'Cliente', value: event.client },
                { label: 'Fecha del evento', value: formatDate(event.date) },
                { label: 'Lugar', value: event.location },
              ].map((item) => (
                <div key={item.label} className="flex gap-1.5">
                  <dt className="font-semibold text-gray-700">{item.label}:</dt>
                  <dd className="text-muted">{item.value || '—'}</dd>
                </div>
              ))}
            </dl>

            <section
              aria-label="Progreso de preparación del evento"
              className="bg-white rounded-xl border border-edge p-5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-gray-700">Progreso de preparación</p>
                {progress.percent === 100 ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success-bg text-success border border-success-border font-medium">
                    <Icon name="check" className="w-4 h-4 inline" /> Gestión completa
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
              {tasks.length > 0 && (
                <Button onClick={() => setTaskForm({ open: true, mode: 'create', task: null })}>
                  + Agregar gestión
                </Button>
              )}
            </div>

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-dashed border-edge">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4"><Icon name="book" className="w-7 h-7" /></span>
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
                      onEditHours={openQuickEditHours}
                      onReschedule={() => setQuick({ mode: 'date', task, event })}
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

      {event && (
        <EventFormModal
          open={eventFormOpen}
          event={event}
          onSave={handleEventSave}
          onClose={() => setEventFormOpen(false)}
        />
      )}

      <TaskFormModal
        open={taskForm.open}
        mode={taskForm.mode}
        event={event}
        eventDate={event?.date}
        task={taskForm.task}
        onSave={handleTaskSave}
        onClose={() => {
          setTaskForm({ open: false, mode: 'create', task: null })
          taskSaveFlow.cancel()
        }}
        saveError={taskSaveFlow.error}
        onClearSaveError={taskSaveFlow.clearError}
        focusDateRequest={taskSaveFlow.focusDateRequest}
      />
      {quick && (
        <TaskQuickEditDialogs
          request={quick}
          onClose={() => setQuick(null)}
          onDone={load}
        />
      )}

      <OverloadConflictModal
        open={Boolean(taskSaveFlow.conflict)}
        conflict={taskSaveFlow.conflict}
        currentHours={taskSaveFlow.lastData?.estimated_hours ?? taskSaveFlow.lastData?.hours ?? taskForm.task?.hours ?? taskSaveFlow.target?.task.hours}
        busy={taskSaveFlow.busy}
        onMoveToAnotherDay={moveConflictToAnotherDay}
        onReduceHours={taskSaveFlow.retryWithHours}
        onCancel={() => {
          setTaskForm({ open: false, mode: 'create', task: null })
          taskSaveFlow.cancel()
        }}
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