import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import { useAuth } from '../context/AuthContext'
import { inputCls, inputErrorCls } from '../utils/forms'
import { getConflictForDate } from '../services/tasksApi'
import { todayKey } from '../utils/dates'
import { formatDateShort, formatDateToast } from '../utils/format'
import { DEFAULT_DAILY_HOURS_LIMIT } from '../utils/tasks'

const MODE_META = {
  create: {
    title: 'Agregar gestión',
    subtitle: 'Añade una gestión al plan logístico del evento.',
    cta: 'Agregar gestión',
  },
  edit: {
    title: 'Editar gestión',
    subtitle: 'Actualiza los datos de la gestión.',
    cta: 'Guardar cambios',
  },
}

const emptyForm = { name: '', dueDate: '', hours: '', note: '' }

const FIELD_IDS = {
  name: 'ge-name',
  dueDate: 'ge-date',
  hours: 'ge-hours',
}

function TaskFormFields({
  mode,
  event,
  eventDate,
  task,
  onSave,
  onClose,
  saveError: externalSaveError,
  onClearSaveError,
  focusDateRequest,
}) {
  const effectiveEventDate = eventDate || event?.date || ''
  const { user } = useAuth()
  const dailyHoursLimit = user?.dailyHoursLimit ?? DEFAULT_DAILY_HOURS_LIMIT
  const [form, setForm] = useState(() =>
    task
      ? { name: task.name, dueDate: task.dueDate, hours: String(task.hours), note: task.note || '' }
      : emptyForm
  )
  const [errors, setErrors] = useState({})
  const [conflict, setConflict] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const hoursRef = useRef(null)
  const dateRef = useRef(null)
  const meta = MODE_META[mode]

  useEffect(() => {
    if (focusDateRequest <= 0) return undefined
    const frame = window.requestAnimationFrame(() => dateRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [focusDateRequest])

  function setField(field, value) {
    const nextForm = { ...form, [field]: value }
    setForm(nextForm)
    const fieldError = validate(nextForm)[field]
    setErrors((prev) => ({ ...prev, [field]: fieldError || undefined }))
    setSaveError('')
    onClearSaveError?.()
  }

  function validateOnBlur(field) {
    const fieldError = validate(form)[field]
    if (fieldError) setErrors((prev) => ({ ...prev, [field]: fieldError }))
  }

  function validate(values) {
    const next = {}
    if (!values.name.trim()) next.name = 'Escribe el nombre de la gestión.'
    const dateChanged = mode === 'create' || values.dueDate !== task?.dueDate
    if (mode === 'create' && effectiveEventDate && effectiveEventDate < todayKey()) {
      next.dueDate = `Este evento ya pasó (${formatDateToast(effectiveEventDate)}); no se pueden agendar gestiones nuevas.`
    } else if (!values.dueDate) {
      next.dueDate = 'Elige la fecha de la gestión.'
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
      next.dueDate = 'Ingresa una fecha válida.'
    } else if (dateChanged && values.dueDate < todayKey()) {
      next.dueDate = 'La fecha de la gestión no puede ser anterior a hoy.'
    } else if (dateChanged && effectiveEventDate && values.dueDate > effectiveEventDate) {
      next.dueDate = `La fecha límite no puede ser posterior a la fecha del evento (${formatDateToast(effectiveEventDate)}).`
    }
    if (values.hours === '' || values.hours === null) {
      next.hours = 'Escribe las horas estimadas.'
    } else {
      const num = Number(values.hours)
      if (Number.isNaN(num)) next.hours = 'Escribe un número válido de horas.'
      else if (num <= 0) next.hours = 'Las horas estimadas deben ser mayores que 0.'
    }
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    if (!event?.id) {
      setErrors((prev) => ({ ...prev, _global: 'No se pudo identificar el evento asociado.' }))
      return
    }
    const nextErrors = validate(form)
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      const firstField = Object.keys(nextErrors)[0]
      document.getElementById(FIELD_IDS[firstField])?.focus()
      return
    }
    setConflict(null)
    const found = await getConflictForDate(event.id, form.dueDate, {
      excludeId: mode === 'create' ? null : task?.id,
      addHours: Number(form.hours),
      dailyHoursLimit,
    })
    if (found) {
      setConflict(found)
      return
    }
    setSaveError('')
    setSubmitting(true)
    try {
      await onSave({
        name: form.name.trim(),
        dueDate: form.dueDate,
        hours: Number(form.hours),
        note: form.note.trim(),
        description: form.note.trim(),
        due_date: form.dueDate,
        estimated_hours: Number(form.hours),
      })
    } catch (err) {
      const dueDateError = err.fields?.due_date
      if (dueDateError) {
        setErrors((prev) => ({ ...prev, dueDate: dueDateError }))
      } else {
        setSaveError(err.message || 'No se pudo guardar la gestión. Inténtalo de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function resolveConflict(target) {
    setConflict(null)
    if (target === 'date') {
      dateRef.current?.focus()
    } else if (target === 'hours') {
      hoursRef.current?.focus()
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-6 py-5 border-b border-edge">
        <h2 id="gestion-form-title" className="text-lg font-semibold text-navy">
          {meta.title}
        </h2>
        <p className="text-xs text-muted mt-1"><span className="text-danger" aria-hidden="true">*</span> Campo obligatorio</p>
        <p className="text-sm text-muted mt-0.5">{meta.subtitle}</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        <Field label="Nombre de la gestión" htmlFor="ge-name" required error={errors.name}>
          <input
            id="ge-name"
            type="text"
            placeholder="Ej. Reservar salón principal"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => validateOnBlur('name')}
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'ge-name-error' : undefined}
            className={errors.name ? inputErrorCls : inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha límite de la gestión" htmlFor="ge-date" required error={errors.dueDate}>
            <input
              id="ge-date"
              ref={dateRef}
              type="date"
              value={form.dueDate}
              onChange={(e) => setField('dueDate', e.target.value)}
              onBlur={() => validateOnBlur('dueDate')}
              aria-required="true"
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? 'ge-date-error' : undefined}
              className={errors.dueDate ? inputErrorCls : inputCls}
            />
          </Field>
          <Field
            label="Horas estimadas"
            htmlFor="ge-hours"
            required
            error={errors.hours}
          >
            <input
              id="ge-hours"
              ref={hoursRef}
              type="number"
              min="0.5"
              step="0.5"
              placeholder="Ej. 2"
              value={form.hours}
              onChange={(e) => setField('hours', e.target.value)}
              onBlur={() => validateOnBlur('hours')}
              aria-required="true"
              aria-invalid={Boolean(errors.hours)}
              aria-describedby={errors.hours ? 'ge-hours-error' : undefined}
              className={errors.hours ? inputErrorCls : inputCls}
            />
          </Field>
        </div>

        <Field label="Nota" htmlFor="ge-note" optional>
          <textarea
            id="ge-note"
            rows={2}
            value={form.note}
            onChange={(e) => setField('note', e.target.value)}
            placeholder="Detalles, proveedores, requisitos…"
            className={`${inputCls} resize-none`}
          />
        </Field>

        {conflict && (
          <div
            role="alert"
            className="rounded-xl p-4 border border-warning-border bg-warning-bg"
          >
            <div className="flex items-start gap-3">
              <Icon name="alert" className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-warning-text">
                  Conflicto de sobrecarga
                </p>
                <p className="text-sm mt-1 leading-relaxed text-warning-text-dark">
                  Este cambio supera tu límite diario de <strong>{conflict.limitHours} h</strong> de
                  gestión para el {formatDateShort(conflict.date)}. Quedarían programadas{' '}
                  <strong>{conflict.scheduledHours} h</strong> (límite: {conflict.limitHours} h).
                </p>
                <p className="text-sm mt-1 text-warning-text-dark">
                  Elige otra fecha o reduce las horas estimadas para resolverlo.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="neutral" onClick={() => resolveConflict('date')}>
                    Elegir otra fecha
                  </Button>
                  <Button size="sm" variant="neutral" onClick={() => resolveConflict('hours')}>
                    Reducir horas estimadas
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {(externalSaveError || saveError) && (
          <div role="alert" className="rounded-xl p-3 border border-danger-border bg-danger-bg text-sm text-danger">
            {externalSaveError || saveError}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-edge flex justify-end gap-3">
        <Button type="button" variant="neutral" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {meta.cta}
        </Button>
      </div>
    </form>
  )
}

export default function TaskFormModal({
  open,
  mode,
  event,
  eventDate,
  task,
  onSave,
  onClose,
  saveError,
  onClearSaveError,
  focusDateRequest = 0,
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="gestion-form-title">
      {open && (
        <TaskFormFields
          key={`${mode}-${task?.id || 'new'}`}
          mode={mode}
          event={event}
          eventDate={eventDate}
          task={task}
          onSave={onSave}
          onClose={onClose}
          saveError={saveError}
          onClearSaveError={onClearSaveError}
          focusDateRequest={focusDateRequest}
        />
      )}
    </Modal>
  )
}