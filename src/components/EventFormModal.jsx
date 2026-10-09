import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import { inputCls, inputErrorCls } from '../utils/forms'
import { EVENT_TYPE_OPTIONS } from '../utils/events'
import { todayKey } from '../utils/dates'

const FIELD_IDS = {
  name: 'ee-name',
  client: 'ee-client',
  date: 'ee-date',
  location: 'ee-location',
}

function EventFormFields({ event, onSave, onClose }) {
  const [form, setForm] = useState({
    name: event.name,
    type: event.type || 'otro',
    client: event.client,
    date: event.date,
    location: event.location,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function setField(field, value) {
    const nextForm = { ...form, [field]: value }
    setForm(nextForm)
    const fieldError = validate(nextForm)[field]
    setErrors((prev) => ({ ...prev, [field]: fieldError || undefined }))
  }

  function validateOnBlur(field) {
    const fieldError = validate(form)[field]
    if (fieldError) setErrors((prev) => ({ ...prev, [field]: fieldError }))
  }

  function validate(values) {
    const next = {}
    if (!values.name.trim()) next.name = 'Escribe el nombre del evento.'
    if (!values.client.trim()) next.client = 'Escribe el nombre del cliente o contratante.'
    if (!values.location.trim()) next.location = 'Escribe el lugar del evento.'
    if (!values.date) next.date = 'Elige la fecha del evento.'
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) next.date = 'Ingresa una fecha válida.'
    else if (values.date !== event.date && values.date < todayKey()) {
      next.date = 'La fecha del evento no puede ser anterior a hoy.'
    }
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    const nextErrors = validate(form)
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      const firstField = Object.keys(nextErrors)[0]
      document.getElementById(FIELD_IDS[firstField])?.focus()
      return
    }
    setSubmitting(true)
    try {
      await onSave({
        name: form.name.trim(),
        type: form.type,
        client: form.client.trim(),
        date: form.date,
        location: form.location.trim(),
      })
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-6 py-5 border-b border-edge">
        <h2 id="event-form-title" className="text-lg font-semibold text-navy">
          Editar evento
        </h2>
        <p className="text-xs text-muted mt-1"><span className="text-danger" aria-hidden="true">*</span> Campo obligatorio</p>
        <p className="text-sm text-muted mt-0.5">Actualiza la información básica del evento.</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        <Field label="Nombre del evento" htmlFor="ee-name" required error={errors.name}>
          <input
            id="ee-name"
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => validateOnBlur('name')}
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'ee-name-error' : undefined}
            className={errors.name ? inputErrorCls : inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de evento" htmlFor="ee-type">
            <select
              id="ee-type"
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
              className={inputCls}
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Cliente / Contratante" htmlFor="ee-client" required error={errors.client}>
            <input
              id="ee-client"
              type="text"
              value={form.client}
              onChange={(e) => setField('client', e.target.value)}
              onBlur={() => validateOnBlur('client')}
              aria-required="true"
              aria-invalid={Boolean(errors.client)}
              aria-describedby={errors.client ? 'ee-client-error' : undefined}
              className={errors.client ? inputErrorCls : inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha del evento" htmlFor="ee-date" required error={errors.date}>
            <input
              id="ee-date"
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              onBlur={() => validateOnBlur('date')}
              aria-required="true"
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'ee-date-error' : undefined}
              className={errors.date ? inputErrorCls : inputCls}
            />
          </Field>

          <Field label="Lugar del evento" htmlFor="ee-location" required error={errors.location}>
            <input
              id="ee-location"
              type="text"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              onBlur={() => validateOnBlur('location')}
              aria-required="true"
              aria-invalid={Boolean(errors.location)}
              aria-describedby={errors.location ? 'ee-location-error' : undefined}
              className={errors.location ? inputErrorCls : inputCls}
            />
          </Field>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-edge flex justify-end gap-3">
        <Button type="button" variant="neutral" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

export default function EventFormModal({ open, event, onSave, onClose }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="event-form-title">
      {open && <EventFormFields key={event.id} event={event} onSave={onSave} onClose={onClose} />}
    </Modal>
  )
}
