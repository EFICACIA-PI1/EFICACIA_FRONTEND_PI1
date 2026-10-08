import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import Icon from './Icon'
import OverloadConflictModal from './OverloadConflictModal'
import CalendarPicker from './CalendarPicker'
import { useToast } from '../context/ToastContext'
import { inputCls, inputErrorCls } from '../utils/forms'
import { getPlannedHoursForDate } from '../services/todayApi'
import { todayKey } from '../utils/dates'
import { formatDateLong, formatDateToast } from '../utils/format'
import { DEFAULT_DAILY_HOURS_LIMIT, formatHours } from '../utils/tasks'
import { useAuth } from '../context/AuthContext'
import useRescheduleFlow from '../hooks/useRescheduleFlow'

function initialDate(request) {
  const today = todayKey()
  const eventDate = request.event?.date
  if (eventDate && eventDate < today) return eventDate
  if (request.task.dueDate < today) return today
  if (eventDate && request.task.dueDate > eventDate) return eventDate
  return request.task.dueDate || today
}

function compactHours(hours) {
  return formatHours(hours).replace(' ', '')
}

export default function TaskQuickEditDialogs({ request, onClose, onDone }) {
  const { user } = useAuth()
  const dailyHoursLimit = user?.dailyHoursLimit ?? DEFAULT_DAILY_HOURS_LIMIT
  const [hours, setHours] = useState(String(request.task.hours ?? ''))
  const [fieldError, setFieldError] = useState('')
  const [step, setStep] = useState(request.mode === 'date' ? 'date' : 'hours')
  const [selectedDate, setSelectedDate] = useState(() => initialDate(request))
  const [plannedHours, setPlannedHours] = useState(null)
  const [checkingPlan, setCheckingPlan] = useState(false)
  const toast = useToast()

  const flow = useRescheduleFlow({
    onSuccess: async ({ mode, data }) => {
      if (mode === 'hours') {
        const savedHours = data?.estimated_hours ?? Number(hours)
        toast.success(`Horas estimadas actualizadas a ${formatHours(savedHours)}.`)
      } else {
        const savedDate = data?.due_date ?? selectedDate
        toast.success(`Gestión reprogramada para el ${formatDateToast(savedDate)}.`)
      }
      await onDone?.()
      onClose()
    },
  })

  function cancel() {
    flow.cancel()
    onClose()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (hours === '') {
      setFieldError('Escribe las horas estimadas.')
      return
    }
    const nextHours = Number(hours)
    if (!Number.isFinite(nextHours)) {
      setFieldError('Escribe un número válido de horas.')
      return
    }
    if (nextHours <= 0) {
      setFieldError('Las horas estimadas deben ser mayores que 0.')
      return
    }
    if (nextHours === Number(request.task.hours)) {
      setFieldError('Escribe un valor distinto al actual.')
      return
    }
    setFieldError('')
    return flow.save(
      { mode: 'hours', task: request.task, event: request.event },
      { estimated_hours: nextHours }
    )
  }

  function moveToAnotherDay() {
    flow.moveToAnotherDay()
    flow.clearError()
    setPlannedHours(null)
    setStep('date')
  }

  async function saveDate() {
    const data = { due_date: selectedDate }
    if (request.mode === 'hours') data.estimated_hours = Number(hours)
    return flow.save({ mode: 'date', task: request.task, event: request.event }, data)
  }

  async function continueFromCalendar() {
    if (selectedDate === request.task.dueDate || checkingPlan) return
    setCheckingPlan(true)
    flow.clearError()
    try {
      const otherHours = await getPlannedHoursForDate(selectedDate, {
        excludeTaskId: request.task.id,
      })
      const currentHours = request.mode === 'hours' ? Number(hours) : Number(request.task.hours)
      const total = otherHours + currentHours
      if (total <= dailyHoursLimit) {
        setPlannedHours(total)
        setStep('confirm')
        return
      }
    } catch {
      // El backend resuelve la sobrecarga; la consulta previa solo prepara el aviso.
    } finally {
      setCheckingPlan(false)
    }
    await saveDate()
  }

  const eventDate = request.event?.date || ''
  const eventHasPassed = Boolean(eventDate && eventDate < todayKey())
  const calendarError = flow.error && (step === 'date' || step === 'confirm')

  if (step === 'date') {
    return (
      <>
        <Modal
          open={!flow.conflict}
          onClose={cancel}
          labelledBy="quick-date-title"
          describedBy="quick-date-description"
          maxWidth="max-w-sm"
        >
          <div className="px-6 py-5 border-b border-edge">
            <h2 id="quick-date-title" className="text-lg font-semibold text-navy font-display">
              Reprogramar gestión
            </h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-medium text-navy">{request.task.name}</p>
            {eventHasPassed ? (
              <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger">
                Este evento ya pasó ({formatDateLong(eventDate)}); no se puede reprogramar.
              </p>
            ) : (
              <>
                <p id="quick-date-description" className="text-sm text-muted">
                  Elige una fecha entre hoy y el {formatDateToast(eventDate)}
                </p>
                <CalendarPicker
                  value={selectedDate}
                  onChange={(dateKey) => {
                    setSelectedDate(dateKey)
                    setPlannedHours(null)
                    flow.clearError()
                  }}
                  min={todayKey()}
                  max={eventDate || undefined}
                />
              </>
            )}
            {calendarError && (
              <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger">
                {flow.error}
              </p>
            )}
          </div>
          <div className="px-6 py-4 border-t border-edge flex justify-end gap-3">
            <Button type="button" variant="neutral" onClick={cancel} disabled={flow.busy || checkingPlan}>
              Cancelar
            </Button>
            {!eventHasPassed && (
              <Button
                type="button"
                onClick={continueFromCalendar}
                loading={checkingPlan || flow.busy}
                disabled={selectedDate === request.task.dueDate || checkingPlan || flow.busy}
              >
                Reprogramar
              </Button>
            )}
          </div>
        </Modal>
        <OverloadConflictModal
          open={Boolean(flow.conflict)}
          conflict={flow.conflict}
          currentHours={flow.lastData?.estimated_hours ?? (Number(hours) || request.task.hours)}
          busy={flow.busy}
          onMoveToAnotherDay={moveToAnotherDay}
          onReduceHours={flow.retryWithHours}
          onCancel={cancel}
        />
      </>
    )
  }

  if (step === 'confirm') {
    return (
      <>
        <Modal
          open={!flow.conflict}
          onClose={cancel}
          labelledBy="quick-confirm-title"
          describedBy="quick-confirm-description"
          maxWidth="max-w-md"
        >
          <div className="p-6">
            <div className="flex items-start gap-3">
              <Icon name="alert" className="w-7 h-7 text-warning mt-0.5" />
              <div className="min-w-0">
                <h2 id="quick-confirm-title" className="text-lg font-semibold text-navy font-display">
                  ¿Estás seguro?
                </h2>
                <p id="quick-confirm-description" className="text-sm text-muted leading-relaxed mt-2">
                  ¿Seguro que quieres reprogramar la gestión para el {formatDateLong(selectedDate)}?
                </p>
                <p className="text-sm text-muted leading-relaxed mt-2">
                  Quedarías con {compactHours(plannedHours)} para este día (tu límite es {compactHours(dailyHoursLimit)}).
                </p>
              </div>
            </div>
            {calendarError && (
              <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger mt-4">
                {flow.error}
              </p>
            )}
            <div className="mt-6 flex justify-between gap-3">
              <Button type="button" onClick={saveDate} loading={flow.busy}>
                Aceptar
              </Button>
              <Button type="button" variant="danger" onClick={() => setStep('date')} disabled={flow.busy}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
        <OverloadConflictModal
          open={Boolean(flow.conflict)}
          conflict={flow.conflict}
          currentHours={flow.lastData?.estimated_hours ?? (Number(hours) || request.task.hours)}
          busy={flow.busy}
          onMoveToAnotherDay={moveToAnotherDay}
          onReduceHours={flow.retryWithHours}
          onCancel={cancel}
        />
      </>
    )
  }

  return (
    <>
      <Modal
        open={!flow.conflict}
        onClose={cancel}
        labelledBy="quick-hours-title"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 border-b border-edge">
            <h2 id="quick-hours-title" className="text-lg font-semibold text-navy font-display">
              Modificar horas estimadas
            </h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-navy">{request.task.name}</p>
              <p className="text-sm text-muted mt-1">
                Horas actuales: {formatHours(request.task.hours)}
              </p>
            </div>
            <p className="text-xs text-muted">
              <span className="text-danger" aria-hidden="true">*</span> Campo obligatorio
            </p>
            <Field label="Horas estimadas" htmlFor="quick-hours" required error={fieldError || flow.error}>
              <input
                id="quick-hours"
                type="number"
                min="0.1"
                step="0.5"
                required
                autoFocus
                value={hours}
                onChange={(event) => {
                  setHours(event.target.value)
                  setFieldError('')
                  flow.clearError()
                }}
                aria-required="true"
                aria-invalid={Boolean(fieldError || flow.error)}
                aria-describedby={fieldError || flow.error ? 'quick-hours-error' : undefined}
                className={fieldError || flow.error ? inputErrorCls : inputCls}
              />
            </Field>
          </div>
          <div className="px-6 py-4 border-t border-edge flex justify-end gap-3">
            <Button type="button" variant="neutral" onClick={cancel} disabled={flow.busy}>
              Cancelar
            </Button>
            <Button type="submit" loading={flow.busy}>
              Guardar horas
            </Button>
          </div>
        </form>
      </Modal>
      <OverloadConflictModal
        open={Boolean(flow.conflict)}
        conflict={flow.conflict}
        currentHours={Number(hours)}
        busy={flow.busy}
        onMoveToAnotherDay={moveToAnotherDay}
        onReduceHours={flow.retryWithHours}
        onCancel={cancel}
      />
    </>
  )
}