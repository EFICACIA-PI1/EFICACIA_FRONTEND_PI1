import { useEffect } from 'react'
import Button from './Button'
import Field from './Field'
import Icon from './Icon'
import { inputCls, inputErrorCls } from '../utils/forms'
import { todayKey } from '../utils/dates'

export default function TaskDraftList({
  drafts,
  errors,
  onChange,
  onBlur,
  retryDraftKey,
  savedDraftKeys = [],
  focusDateKey,
  focusDateRequest,
  onRetryDraft,
  onAdd,
  onRemove,
}) {
  useEffect(() => {
    if (focusDateKey === null) return undefined
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`tk-${focusDateKey}-dueDate`)?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusDateKey, focusDateRequest])

  return (
    <section aria-labelledby="drafts-heading" className="pt-2">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 id="drafts-heading" className="text-sm font-semibold text-navy">
            Gestiones del evento <span className="font-normal text-subtle">(opcional)</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Define desde ya el plan logístico. También podrás agregarlas después desde el detalle del evento.
          </p>
        </div>
      </div>

      {drafts.length > 0 && (
        <ul className="space-y-3" role="list">
          {drafts.map((draft, index) => {
            const rowErrors = errors[draft.key] || {}
            const isSaved = savedDraftKeys.includes(draft.key)
            const id = (field) => `tk-${draft.key}-${field}`
            return (
              <li key={draft.key} className="rounded-xl border border-edge bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                    Gestión {index + 1}
                  </p>
                  {retryDraftKey === draft.key && (
                    <Button type="button" size="sm" onClick={() => onRetryDraft(draft.key)}>
                      Reintentar gestión
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="subtle-danger"
                    onClick={() => onRemove(draft.key)}
                    disabled={isSaved}
                    aria-label={`Quitar gestión ${index + 1}`}
                  >
                    <Icon name="trash" className="w-4 h-4" />
                    Quitar
                  </Button>
                </div>

                <Field label="Nombre de la gestión" htmlFor={id('name')} required error={rowErrors.name}>
                  <input
                    id={id('name')}
                    type="text"
                    placeholder="Ej. Reservar salón principal"
                    value={draft.name}
                    disabled={isSaved}
                    onChange={(e) => onChange(draft.key, 'name', e.target.value)}
                    onBlur={() => onBlur(draft.key, 'name')}
                    aria-required="true"
                    aria-invalid={Boolean(rowErrors.name)}
                    aria-describedby={rowErrors.name ? `${id('name')}-error` : undefined}
                    className={rowErrors.name ? inputErrorCls : inputCls}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Fecha límite" htmlFor={id('dueDate')} required error={rowErrors.dueDate}>
                    <input
                      id={id('dueDate')}
                      type="date"
                      min={todayKey()}
                      value={draft.dueDate}
                      disabled={isSaved}
                      onChange={(e) => onChange(draft.key, 'dueDate', e.target.value)}
                      onBlur={() => onBlur(draft.key, 'dueDate')}
                      aria-required="true"
                      aria-invalid={Boolean(rowErrors.dueDate)}
                      aria-describedby={rowErrors.dueDate ? `${id('dueDate')}-error` : undefined}
                      className={rowErrors.dueDate ? inputErrorCls : inputCls}
                    />
                  </Field>
                  <Field label="Horas estimadas" htmlFor={id('hours')} required error={rowErrors.hours}>
                    <input
                      id={id('hours')}
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder="Ej. 2"
                      value={draft.hours}
                      disabled={isSaved}
                      onChange={(e) => onChange(draft.key, 'hours', e.target.value)}
                      onBlur={() => onBlur(draft.key, 'hours')}
                      aria-required="true"
                      aria-invalid={Boolean(rowErrors.hours)}
                      aria-describedby={rowErrors.hours ? `${id('hours')}-error` : undefined}
                      className={rowErrors.hours ? inputErrorCls : inputCls}
                    />
                  </Field>
                </div>

                <Field label="Nota" htmlFor={id('note')} optional>
                  <input
                    id={id('note')}
                    type="text"
                    placeholder="Detalles, proveedores, requisitos…"
                    value={draft.note}
                    disabled={isSaved}
                    onChange={(e) => onChange(draft.key, 'note', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </li>
            )
          })}
        </ul>
      )}

      <Button type="button" variant="neutral" size="sm" onClick={onAdd} className={drafts.length ? 'mt-3' : ''}>
        <Icon name="plus" className="w-4 h-4" />
        Agregar gestión
      </Button>
    </section>
  )
}
