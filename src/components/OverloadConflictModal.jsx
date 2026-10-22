import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import Icon from './Icon'
import { inputCls } from '../utils/forms'
import { formatDateLong, formatDateShort } from '../utils/format'
import { formatHours } from '../utils/tasks'

function OptionRow({ icon, title, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 focus-visible:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span className="mt-0.5 text-muted">
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-navy">{title}</span>
        {description && <span className="block text-xs text-muted mt-0.5">{description}</span>}
      </span>
    </button>
  )
}

export default function OverloadConflictModal({
  open,
  conflict,
  currentHours,
  taskName,
  busy = false,
  onMoveToAnotherDay,
  onReduceHours,
  onUseSuggestedDay,
  onPostpone,
  onCancel,
}) {
  const primaryRef = useRef(null)
  const cancelRef = useRef(null)
  const maxHours = Number(conflict?.max_hours_for_this_task ?? 0)
  const limitHours = Number(conflict?.limit_hours ?? 0)
  const suggestedDay = (onUseSuggestedDay && conflict?.suggested_day) || null
  const taskExceedsLimit = Number(currentHours) > limitHours
  const canReduce = maxHours >= 0.1
  const canChangeDay = !taskExceedsLimit

  const [view, setView] = useState('options')
  const [hours, setHours] = useState(String(Math.min(Number(currentHours) || 0, maxHours)))
  const hoursValue = Number(hours)
  const hoursValid = canReduce && hoursValue >= 0.1 && hoursValue <= maxHours

  useEffect(() => {
    setView('options')
    setHours(String(Math.min(Number(currentHours) || 0, maxHours)))
  }, [conflict, currentHours, maxHours])

  // Una sola acción recomendada; el resto queda como opciones secundarias.
  let primary
  if (suggestedDay && canChangeDay) {
    primary = {
      label: `Mover al ${formatDateShort(suggestedDay)}`,
      hint: 'Es el primer día con espacio para esta gestión.',
      run: () => onUseSuggestedDay(suggestedDay),
    }
  } else if (canReduce) {
    primary = {
      label: 'Reducir horas estimadas',
      hint: `Para que quepa, puede tener hasta ${formatHours(maxHours)}.`,
      run: () => setView('reduce'),
    }
  } else {
    primary = {
      label: 'Elegir otra fecha',
      hint: 'Ese día ya está completo.',
      run: onMoveToAnotherDay,
    }
  }

  const others = []
  if (canChangeDay && primary.label !== 'Elegir otra fecha') {
    others.push({ key: 'date', icon: 'calendar', title: 'Elegir otra fecha', run: onMoveToAnotherDay })
  }
  if (canReduce && primary.label !== 'Reducir horas estimadas') {
    others.push({
      key: 'hours',
      icon: 'edit',
      title: 'Reducir horas estimadas',
      description: `Hasta ${formatHours(maxHours)}`,
      run: () => setView('reduce'),
    })
  }
  if (onPostpone) {
    others.push({
      key: 'postpone',
      icon: 'clock',
      title: 'Posponer la gestión',
      description: 'Sin cambiar su fecha ni sus horas.',
      run: onPostpone,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy="overload-title"
      describedBy="overload-description"
      initialFocusRef={view === 'options' ? primaryRef : cancelRef}
    >
      <div className="p-5 sm:p-6">
        <div className="rounded-xl border border-warning-border bg-warning-bg p-4">
          <h2 id="overload-title" className="text-lg font-semibold text-navy font-display">
            Ese día quedaría sobrecargado
          </h2>
          {taskName && <p className="text-sm font-medium text-warning-text-dark mt-1 break-words">{taskName}</p>}
          <p id="overload-description" className="text-sm text-warning-text-dark leading-relaxed mt-2">
            El <strong>{formatDateLong(conflict?.date)}</strong> quedarías con{' '}
            <strong>{formatHours(conflict?.planned_hours)}</strong> de gestión planificadas (límite{' '}
            <strong>{formatHours(limitHours)}</strong>). Te pasas por{' '}
            <strong>{formatHours(conflict?.excess_hours)}</strong>.
          </p>
        </div>

        {taskExceedsLimit && (
          <p className="text-sm text-warning-text-dark mt-3" role="note">
            Esta gestión sola supera tu límite diario de {formatHours(limitHours)}. Reduce sus horas para poder agendarla.
          </p>
        )}

        {view === 'reduce' ? (
          <div className="mt-4">
            <Field
              label="Horas estimadas"
              htmlFor="overload-hours"
              hint={`Para que quepa, esta gestión puede tener hasta ${formatHours(maxHours)}.`}
            >
              <input
                id="overload-hours"
                type="number"
                min="0.1"
                step="0.5"
                max={maxHours}
                autoFocus
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                aria-required="true"
                className={inputCls}
              />
            </Field>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button ref={cancelRef} variant="neutral" onClick={() => setView('options')} disabled={busy}>
                Volver
              </Button>
              <Button onClick={() => onReduceHours(hoursValue)} disabled={busy || !hoursValid} loading={busy}>
                Aplicar horas
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-subtle mb-2">Te recomendamos</p>
            <Button ref={primaryRef} className="w-full" onClick={primary.run} disabled={busy} loading={busy}>
              {primary.label}
            </Button>
            <p className="text-xs text-muted mt-1.5">{primary.hint}</p>

            {others.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-subtle mb-1">Otras opciones</p>
                <div className="-mx-1">
                  {others.map((option) => (
                    <OptionRow
                      key={option.key}
                      icon={option.icon}
                      title={option.title}
                      description={option.description}
                      onClick={option.run}
                      disabled={busy}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button ref={cancelRef} variant="neutral" size="sm" onClick={onCancel} disabled={busy}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
