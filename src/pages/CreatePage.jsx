import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import OverloadConflictModal from '../components/OverloadConflictModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ResultModal from '../components/ResultModal'
import { inputCls, inputErrorCls } from '../utils/forms'
import TaskDraftList from '../components/TaskDraftList'
import { createTaskDraft, validateTaskDrafts } from '../utils/taskDrafts'
import { createEvent } from '../services/eventsApi'
import { createTask } from '../services/tasksApi'
import { isOverloadConflict } from '../services/api'
import { todayKey } from '../utils/dates'
import { DEFAULT_DAILY_HOURS_LIMIT } from '../utils/tasks'
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
  notes: '',
}

const EVENT_SERVER_FIELDS = {
  name: 'name',
  event_type: 'type',
  client_contact: 'client',
  event_date: 'date',
  location: 'location',
}

const FIELD_IDS = {
  name: 'ev-name',
  type: 'ev-type',
  client: 'ev-client',
  date: 'ev-date',
  location: 'ev-location',
}

export default function CreatePage() {
  usePageTitle('Crear evento')
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const dailyHoursLimit = user?.dailyHoursLimit ?? DEFAULT_DAILY_HOURS_LIMIT
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [drafts, setDrafts] = useState([])
  const [draftErrors, setDraftErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [createdEvent, setCreatedEvent] = useState(null)
  const [draftConflict, setDraftConflict] = useState(null)
  const [draftConflictQueue, setDraftConflictQueue] = useState([])
  const [draftConflictOpen, setDraftConflictOpen] = useState(false)
  const [failedDraftCount, setFailedDraftCount] = useState(0)
  const [savedDraftKeys, setSavedDraftKeys] = useState([])
  const [retryingDraft, setRetryingDraft] = useState(false)
  const [focusDraftDateKey, setFocusDraftDateKey] = useState(null)
  const [focusDraftDateRequest, setFocusDraftDateRequest] = useState(0)

  function setField(field, value) {
    const nextForm = { ...form, [field]: value }
    setForm(nextForm)
    if (field === 'date') {
      const validation = validateTaskDrafts(drafts, dailyHoursLimit, value)
      setDraftErrors((previous) => {
        const next = { ...previous }
        for (const draft of drafts) {
          next[draft.key] = {
            ...previous[draft.key],
            dueDate: validation[draft.key]?.dueDate,
          }
        }
        return next
      })
    }
    const fieldError = validate(nextForm)[field]
    setErrors((prev) => ({ ...prev, [field]: fieldError || undefined }))
  }

  function validateOnBlur(field) {
    const fieldError = validate(form)[field]
    if (fieldError) setErrors((prev) => ({ ...prev, [field]: fieldError }))
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

  function validateDraftOnBlur(key, field) {
    const fieldError = validateTaskDrafts(drafts, dailyHoursLimit, form.date)[key]?.[field]
    if (fieldError) {
      setDraftErrors((prev) => ({ ...prev, [key]: { ...prev[key], [field]: fieldError } }))
    }
  }

  function finishDraftCreation(event, failedCount) {
    if (failedCount > 0) {
      toast.error(
        `El evento se creó, pero ${failedCount} gestión${failedCount !== 1 ? 'es' : ''} no se pudo guardar. Agrégala${failedCount !== 1 ? 's' : ''} desde el detalle.`
      )
    } else if (drafts.length > 0) {
      toast.success(`Evento creado con ${drafts.length} gestión${drafts.length !== 1 ? 'es' : ''}.`)
    } else {
      toast.success('Evento creado. Ahora agrega sus gestiones.')
    }
    navigate(`/evento/${event.id}`)
  }

  function advanceDraftConflict(failedCount) {
    const [next, ...remaining] = draftConflictQueue
    setDraftConflictQueue(remaining)
    if (next) {
      setDraftConflict({ ...next, event: createdEvent, hours: Number(next.draft.hours) })
      setDraftConflictOpen(true)
    } else {
      setDraftConflict(null)
      setDraftConflictOpen(false)
      finishDraftCreation(createdEvent, failedCount)
    }
  }

  async function retryDraft(draftOverride = null) {
    if (!draftConflict || retryingDraft) return
    const draft = draftOverride || drafts.find((item) => item.key === draftConflict.draft.key)
    if (!draft) return
    setRetryingDraft(true)
    try {
      await createTask(createdEvent.id, {
        name: draft.name,
        dueDate: draft.dueDate,
        hours: Number(draft.hours),
        note: draft.note,
      })
      setSavedDraftKeys((keys) => [...keys, draft.key])
      advanceDraftConflict(failedDraftCount)
    } catch (err) {
      if (isOverloadConflict(err)) {
        setDraftConflict((current) => ({
          ...current,
          draft,
          hours: Number(draft.hours),
          conflict: err.data,
        }))
        setDraftConflictOpen(true)
      } else {
        const nextFailedCount = failedDraftCount + 1
        setFailedDraftCount(nextFailedCount)
        advanceDraftConflict(nextFailedCount)
      }
    } finally {
      setRetryingDraft(false)
    }
  }

  function reduceDraftHours(hours) {
    const draft = drafts.find((item) => item.key === draftConflict?.draft.key)
    if (!draft) return
    const updatedDraft = { ...draft, hours: String(hours) }
    setDrafts((prev) => prev.map((item) => (item.key === draft.key ? updatedDraft : item)))
    return retryDraft(updatedDraft)
  }

  function cancelDraftConflict() {
    const failedCount = failedDraftCount + 1 + draftConflictQueue.length
    setDraftConflict(null)
    setDraftConflictQueue([])
    setDraftConflictOpen(false)
    finishDraftCreation(createdEvent, failedCount)
  }

  function validate(values) {
    const next = {}
    if (!values.name.trim()) next.name = 'Escribe el nombre del evento.'
    if (!values.client.trim()) next.client = 'Escribe el nombre del cliente o contratante.'
    if (!values.date) {
      next.date = 'Elige la fecha del evento.'
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) {
      next.date = 'Ingresa una fecha válida.'
    } else if (values.date < todayKey()) {
      next.date = 'La fecha no puede ser anterior a hoy.'
    }
    if (!values.location.trim()) next.location = 'Escribe el lugar del evento.'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting || createdEvent) return
    const nextErrors = validate(form)
    const nextDraftErrors = validateTaskDrafts(drafts, dailyHoursLimit, form.date)
    setErrors(nextErrors)
    setDraftErrors(nextDraftErrors)
    if (Object.values(nextErrors).some(Boolean) || Object.keys(nextDraftErrors).length) {
      const firstEventField = Object.keys(nextErrors)[0]
      if (firstEventField && FIELD_IDS[firstEventField]) {
        document.getElementById(FIELD_IDS[firstEventField])?.focus()
      } else if (!firstEventField) {
        const firstKey = Object.keys(nextDraftErrors)[0]
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
      })

      setCreatedEvent(event)
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
      const overloads = results.flatMap((resultItem, index) =>
        resultItem.status === 'rejected' && isOverloadConflict(resultItem.reason)
          ? [{ draft: drafts[index], index, conflict: resultItem.reason.data }]
          : []
      )
      const failed = results.filter(
        (resultItem) => resultItem.status === 'rejected' && !isOverloadConflict(resultItem.reason)
      ).length
      setSavedDraftKeys(results.flatMap((resultItem, index) =>
        resultItem.status === 'fulfilled' ? [drafts[index].key] : []
      ))
      setFailedDraftCount(failed)
      if (overloads.length > 0) {
        const [first, ...remaining] = overloads
        setDraftConflict({ ...first, event, hours: Number(first.draft.hours) })
        setDraftConflictQueue(remaining)
        setDraftConflictOpen(true)
        return
      }
      finishDraftCreation(event, failed)
    } catch (err) {
      const fieldErrors = {}
      for (const [serverField, message] of Object.entries(err.fields || {})) {
        const field = EVENT_SERVER_FIELDS[serverField]
        if (field) fieldErrors[field] = message
      }
      if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }))
      else setResult({ type: 'error', event: null })
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
        <p className="text-xs text-muted mt-2"><span className="text-danger">*</span> Campo obligatorio</p>
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
            onBlur={() => validateOnBlur('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'ev-name-error' : undefined}
            className={errors.name ? inputErrorCls : inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de evento" htmlFor="ev-type" error={errors.type}>
            <select
              id="ev-type"
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
              onBlur={() => validateOnBlur('type')}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={errors.type ? 'ev-type-error' : undefined}
              className={errors.type ? inputErrorCls : inputCls}
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

          <Field label="Cliente / Contratante" htmlFor="ev-client" required error={errors.client}>
            <input
              id="ev-client"
              type="text"
              placeholder="Ej. Laura Gómez"
              value={form.client}
              onChange={(e) => setField('client', e.target.value)}
              onBlur={() => validateOnBlur('client')}
              aria-invalid={Boolean(errors.client)}
              aria-describedby={errors.client ? 'ev-client-error' : undefined}
              className={errors.client ? inputErrorCls : inputCls}
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
              onBlur={() => validateOnBlur('date')}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'ev-date-error' : undefined}
              className={errors.date ? inputErrorCls : inputCls}
            />
          </Field>

          <Field label="Lugar / Venue" htmlFor="ev-location" required error={errors.location}>
            <input
              id="ev-location"
              type="text"
              placeholder="Ej. Hacienda San Miguel"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              onBlur={() => validateOnBlur('location')}
              aria-invalid={Boolean(errors.location)}
              aria-describedby={errors.location ? 'ev-location-error' : undefined}
              className={errors.location ? inputErrorCls : inputCls}
            />
          </Field>
        </div>

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
          onBlur={validateDraftOnBlur}
          retryDraftKey={draftConflict && !draftConflictOpen ? draftConflict.draft.key : null}
          savedDraftKeys={savedDraftKeys}
          focusDateKey={focusDraftDateKey}
          focusDateRequest={focusDraftDateRequest}
          onRetryDraft={(key) => {
            if (key === draftConflict?.draft.key) retryDraft()
          }}
          onAdd={addDraft}
          onRemove={removeDraft}
        />

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button type="submit" loading={submitting} disabled={Boolean(createdEvent)} className="sm:w-auto">
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
      <OverloadConflictModal
        open={Boolean(draftConflict && draftConflictOpen)}
        conflict={draftConflict?.conflict}
        currentHours={draftConflict?.hours}
        busy={retryingDraft}
        onMoveToAnotherDay={() => {
          setDraftConflictOpen(false)
          setFocusDraftDateKey(draftConflict?.draft.key)
          setFocusDraftDateRequest((request) => request + 1)
        }}
        onReduceHours={reduceDraftHours}
        onCancel={cancelDraftConflict}
      />
    </div>
  )
}