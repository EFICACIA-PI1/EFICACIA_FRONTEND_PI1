import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import { inputCls, inputErrorCls } from '../utils/forms'
import { todayKey } from '../utils/dates'
import { formatDateToast } from '../utils/format'

const MODE_META = {
  create: {
    title: 'Agregar tarea',
    subtitle: 'Añade una tarea al plan logístico del evento.',
    cta: 'Agregar tarea',
  },
  edit: {
    title: 'Editar tarea',
    subtitle: 'Actualiza los datos de la tarea.',
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
  const [form, setForm] = useState(() =>
    task
      ? { name: task.name, dueDate: task.dueDate, hours: String(task.hours), note: task.description || '' }
      : emptyForm
  )
  const [errors, setErrors] = useState({})
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
    if (!values.name.trim()) next.name = 'Escribe el nombre de la tarea.'
    const dateChanged = mode === 'create' || values.dueDate !== task?.dueDate
    if (mode === 'create' && effectiveEventDate && effectiveEventDate < todayKey()) {
      next.dueDate = `Este evento ya pasó (${formatDateToast(effectiveEventDate)}); no se pueden agendar tareas nuevas.`
    } else if (!values.dueDate) {
      next.dueDate = 'Elige la fecha de la tarea.'
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
      next.dueDate = 'Ingresa una fecha válida.'
    } else if (dateChanged && values.dueDate < todayKey()) {
      next.dueDate = 'La fecha de la tarea no puede ser anterior a hoy.'
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
    setSaveError('')
    setSubmitting(true)
    try {
      await onSave({
        name: form.name.trim(),
        dueDate: form.dueDate,
        hours: Number(form.hours),
        description: form.note.trim(),
        due_date: form.dueDate,
        estimated_hours: Number(form.hours),
      })
    } catch (err) {
      const dueDateError = err.fields?.due_date
      if (dueDateError) {
        setErrors((prev) => ({ ...prev, dueDate: dueDateError }))
      } else {
        setSaveError(err.message || 'No se pudo guardar la tarea. Inténtalo de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-6 py-5 border-b border-edge">
        <h2 id="tarea-form-title" className="text-lg font-semibold text-navy">
          {meta.title}
        </h2>
        <p className="text-sm text-muted mt-0.5">{meta.subtitle}</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        <Field label="Nombre de la tarea" htmlFor="ge-name" required error={errors.name}>
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
          <Field label="Fecha límite de la tarea" htmlFor="ge-date" required error={errors.dueDate}>
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
    <Modal open={open} onClose={onClose} labelledBy="tarea-form-title">
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