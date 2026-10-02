import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { useToast } from '../context/ToastContext'
import ResultModal from '../components/ResultModal'
import { inputCls, inputErrorCls } from '../utils/forms'
import TaskDraftList from '../components/TaskDraftList'
import { createTaskDraft, validateTaskDrafts } from '../utils/taskDrafts'
import { createEvent } from '../services/eventsApi'
import { createTask } from '../services/tasksApi'
import { todayKey } from '../utils/dates'
import usePageTitle from '../hooks/usePageTitle'

const EVENT_TYPES = [
  'Boda',
  'Conferencia',
  'Cumpleaños',
  'Corporativo',
  'Concierto',
  'Otro',
]

const emptyForm = {
  name: '',
  type: '',
  client: '',
  date: '',
  location: '',
  dailyLimitHours: '6',
  notes: '',
}

export default function CreatePage() {
  usePageTitle('Crear evento')
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [drafts, setDrafts] = useState([])
  const [draftErrors, setDraftErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function addDraft() {
    setDrafts((prev) => [...prev, createTaskDraft()])
  }

  function removeDraft(key) {
    setDrafts((prev) => prev.filter((draft) => draft.key !== key))
    setDraftErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function changeDraft(key, field, value) {
    setDrafts((prev) => prev.map((draft) => (draft.key === key ? { ...draft, [field]: value } : draft)))
    setDraftErrors((prev) => ({ ...prev, [key]: { ...prev[key], [field]: undefined } }))
  }

  function validate(values) {
    const next = {}
    if (!values.name.trim()) next.name = 'Este campo es obligatorio.'
    if (!values.date) {
      next.date = 'Este campo es obligatorio.'
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) {
      next.date = 'Ingresa una fecha válida.'
    } else if (values.date < todayKey()) {
      next.date = 'La fecha del evento no puede ser anterior a hoy.'
    }
    if (values.dailyLimitHours !== '') {
      const num = Number(values.dailyLimitHours)
      if (Number.isNaN(num)) next.dailyLimitHours = 'Ingresa un número válido.'
      else if (num < 1) next.dailyLimitHours = 'El límite diario debe ser al menos 1 hora.'
    }
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    const nextErrors = validate(form)
    const limitHours = form.dailyLimitHours === '' ? 6 : Number(form.dailyLimitHours)
    const nextDraftErrors = validateTaskDrafts(drafts, limitHours)
    setErrors(nextErrors)
    setDraftErrors(nextDraftErrors)
    if (Object.values(nextErrors).some(Boolean) || Object.keys(nextDraftErrors).length) {
      // Lleva el foco al primer campo de gestión con error para que sea visible.
      const firstKey = Object.keys(nextDraftErrors)[0]
      if (firstKey !== undefined && !Object.values(nextErrors).some(Boolean)) {
        const firstField = Object.keys(nextDraftErrors[firstKey])[0]
        document.getElementById(`tk-${firstKey}-${firstField}`)?.focus()
      }
      return
    }
    setSubmitting(true)
    try {
      const event = await createEvent({
        name: form.name.trim(),
        type: form.type,
        client: form.client.trim(),
        date: form.date,
        location: form.location.trim(),
        notes: form.notes.trim(),
        dailyLimitHours: limitHours,
      })

      // El evento ya existe: si alguna gestión falla no se pierde el evento, se avisa.
      const results = await Promise.allSettled(
        drafts.map((draft) =>
          createTask(event.id, {
            name: draft.name,
            dueDate: draft.dueDate,
            hours: Number(draft.hours),
            note: draft.note,
          })
        )
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed > 0) {
        toast.error(
          `El evento se creó, pero ${failed} gestión${failed !== 1 ? 'es' : ''} no se pudo guardar. Agrégala${failed !== 1 ? 's' : ''} desde el detalle.`
        )
      } else if (drafts.length > 0) {
        toast.success(`Evento creado con ${drafts.length} gestión${drafts.length !== 1 ? 'es' : ''}.`)
      } else {
        toast.success('Evento creado. Ahora agrega sus gestiones.')
      }
      navigate(`/evento/${event.id}`)
      return
    } catch {
      setResult({ type: 'error', event: null })
    } finally {
      setSubmitting(false)
    }
  }

  function closeResult() {
    setResult(null)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-navy font-display">Crear Evento</h1>
        <p className="text-sm mt-1 text-muted">
          Completa los datos básicos para empezar a gestionar tu evento.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Nombre del evento" htmlFor="ev-name" required error={errors.name}>
          <input
            id="ev-name"
            type="text"
            placeholder="Ej. Boda de Laura y Andrés"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'ev-name-error' : undefined}
            className={errors.name ? inputErrorCls : inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de evento" htmlFor="ev-type">
            <select
              id="ev-type"
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
              className={inputCls}
            >
              <option value="" disabled>
                Selecciona un tipo…
              </option>
              {EVENT_TYPES.map((typeItem) => (
                <option key={typeItem} value={typeItem}>
                  {typeItem}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Cliente / Contratante" htmlFor="ev-client">
            <input
              id="ev-client"
              type="text"
              placeholder="Ej. Laura Gómez"
              value={form.client}
              onChange={(e) => setField('client', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha del evento" htmlFor="ev-date" required error={errors.date}>
            <input
              id="ev-date"
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'ev-date-error' : undefined}
              className={errors.date ? inputErrorCls : inputCls}
            />
          </Field>

          <Field label="Lugar / Venue" htmlFor="ev-location">
            <input
              id="ev-location"
              type="text"
              placeholder="Ej. Hacienda San Miguel"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field
          label="Límite diario de gestión"
          htmlFor="ev-limit"
          optional
          hint="Horas máximas de gestión que puedes dedicar al día para este evento. Usado para detectar conflictos de sobrecarga."
          error={errors.dailyLimitHours}
        >
          <input
            id="ev-limit"
            type="number"
            min="1"
            step="0.5"
            placeholder="6"
            value={form.dailyLimitHours}
            onChange={(e) => setField('dailyLimitHours', e.target.value)}
            aria-invalid={Boolean(errors.dailyLimitHours)}
            aria-describedby={errors.dailyLimitHours ? 'ev-limit-error' : undefined}
            className={`${errors.dailyLimitHours ? inputErrorCls : inputCls} max-w-[180px]`}
          />
        </Field>

        <Field label="Notas iniciales" htmlFor="ev-notes" optional>
          <textarea
            id="ev-notes"
            rows={3}
            placeholder="Detalles relevantes, requerimientos especiales…"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <TaskDraftList
          drafts={drafts}
          errors={draftErrors}
          onChange={changeDraft}
          onAdd={addDraft}
          onRemove={removeDraft}
        />

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button type="submit" loading={submitting} className="sm:w-auto">
            {drafts.length > 0
              ? `Crear evento y ${drafts.length} gestión${drafts.length !== 1 ? 'es' : ''}`
              : 'Crear evento'}
          </Button>
          <Button type="button" variant="neutral" onClick={() => navigate('/eventos')} disabled={submitting}>
            Cancelar
          </Button>
        </div>
      </form>

      <ResultModal
        type={result?.type}
        open={Boolean(result)}
        title="Error"
        message="Ha ocurrido un error al crear el evento, inténtalo de nuevo."
        actionLabel="Cerrar"
        onClose={closeResult}
      />
    </div>
  )
}