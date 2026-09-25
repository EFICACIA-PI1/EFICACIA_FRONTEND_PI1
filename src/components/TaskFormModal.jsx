import { useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import { inputCls, inputErrorCls } from '../utils/forms'
import { getConflictForDate, todayKey } from '../services/eventService'
import { formatDateShort } from '../utils/format'

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
  reschedule: {
    title: 'Reprogramar gestión',
    subtitle: 'Elige la nueva fecha límite y ajusta las horas si es necesario.',
    cta: 'Reprogramar gestión',
  },
}

const emptyForm = { name: '', dueDate: '', hours: '', note: '' }

function TaskFormFields({ mode, event, task, onSave, onClose }) {
  const [form, setForm] = useState(() =>
    task
      ? { name: task.name, dueDate: task.dueDate, hours: String(task.hours), note: task.note || '' }
      : emptyForm
  )
  const [errors, setErrors] = useState({})
  const [conflict, setConflict] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const hoursRef = useRef(null)
  const dateRef = useRef(null)
  const meta = MODE_META[mode]

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(values) {
    const next = {}
    if (!values.name.trim()) next.name = 'Este campo es obligatorio.'
    if (!values.dueDate) {
      next.dueDate = 'Este campo es obligatorio.'
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
      next.dueDate = 'Ingresa una fecha válida.'
    } else if (values.dueDate < todayKey()) {
      next.dueDate = 'La fecha límite no puede ser anterior a hoy.'
    }
    if (values.hours === '' || values.hours === null) {
      next.hours = 'Este campo es obligatorio.'
    } else {
      const num = Number(values.hours)
      if (Number.isNaN(num)) next.hours = 'Ingresa un número válido.'
      else if (num <= 0) next.hours = 'Las horas estimadas deben ser mayores a 0.'
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
      return
    }
    setConflict(null)
    const found = await getConflictForDate(event.id, form.dueDate, {
      excludeId: mode === 'create' ? null : task?.id,
      addHours: Number(form.hours),
    })
    if (found) {
      setConflict(found)
      return
    }
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
    } catch {
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
        <p className="text-xs font-medium uppercase tracking-widest mb-1 text-subtle">Plan logístico</p>
        <h2 id="gestion-form-title" className="text-lg font-semibold text-navy">
          {meta.title}
        </h2>
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
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? 'ge-date-error' : undefined}
              className={errors.dueDate ? inputErrorCls : inputCls}
            />
          </Field>
          <Field
            label="Horas estimadas"
            htmlFor="ge-hours"
            required
            hint="Duración estimada para completarla."
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
            className="rounded-xl p-4 border border-warning-border"
            style={{ backgroundColor: 'var(--color-warning-bg)' }}
          >
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-xl" aria-label="Alerta de conflicto">
                ⚠️
              </span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#92400e' }}>
                  Conflicto de sobrecarga
                </p>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: '#78350f' }}>
                  Este cambio supera tu límite diario de <strong>{conflict.limitHours} h</strong> de
                  gestión para el {formatDateShort(conflict.date)}. Quedarían programadas{' '}
                  <strong>{conflict.scheduledHours} h</strong> (límite: {conflict.limitHours} h).
                </p>
                <p className="text-sm mt-1" style={{ color: '#78350f' }}>
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

export default function TaskFormModal({ open, mode, event, task, onSave, onClose }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="gestion-form-title">
      {open && (
        <TaskFormFields
          key={`${mode}-${task?.id || 'new'}`}
          mode={mode}
          event={event}
          task={task}
          onSave={onSave}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}