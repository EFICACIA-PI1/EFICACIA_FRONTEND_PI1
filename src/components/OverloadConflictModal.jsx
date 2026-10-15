import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import { inputCls } from '../utils/forms'
import { formatDateLong, formatDateShort } from '../utils/format'
import { formatHours } from '../utils/tasks'

export default function OverloadConflictModal({
  open,
  conflict,
  currentHours,
  busy = false,
  onMoveToAnotherDay,
  onReduceHours,
  onUseSuggestedDay,
  onPostpone,
  onCancel,
}) {
  const cancelRef = useRef(null)
  const moveRef = useRef(null)
  const reduceRef = useRef(null)
  const maxHours = Number(conflict?.max_hours_for_this_task ?? 0)
  const limitHours = Number(conflict?.limit_hours ?? 0)
  const suggestedDay = conflict?.suggested_day || null
  const taskExceedsLimit = Number(currentHours) > limitHours
  const initialFocusRef = taskExceedsLimit && maxHours >= 0.1
    ? reduceRef
    : maxHours < 0.1
      ? cancelRef
      : moveRef
  const [hours, setHours] = useState(String(Math.min(Number(currentHours) || 0, maxHours)))
  const hoursValue = Number(hours)
  const canReduce = maxHours >= 0.1 && hoursValue >= 0.1 && hoursValue <= maxHours

  useEffect(() => {
    setHours(String(Math.min(Number(currentHours) || 0, maxHours)))
  }, [conflict, currentHours, maxHours])

  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy="overload-title"
      describedBy="overload-description"
      initialFocusRef={initialFocusRef}
    >
      <div className="p-5 sm:p-6">
        <div className="rounded-xl border border-warning-border bg-warning-bg p-4">
          <h2 id="overload-title" className="text-lg font-semibold text-navy font-display">
            Ese día quedaría sobrecargado
          </h2>
          <p id="overload-description" className="text-sm text-warning-text-dark leading-relaxed mt-2">
            Quedarías con <strong>{formatHours(conflict?.planned_hours)}</strong> de tarea planificadas
            {' '}(límite <strong>{formatHours(limitHours)}</strong>) el{' '}
            <strong>{formatDateLong(conflict?.date)}</strong>. Te pasas por{' '}
            <strong>{formatHours(conflict?.excess_hours)}</strong>.
          </p>
        </div>

        <div className="mt-4">
          {taskExceedsLimit && (
            <p className="text-sm text-warning-text-dark mb-3" role="note">
              Esta tarea sola supera tu límite diario de {formatHours(limitHours)}. Reduce sus horas para poder agendarla.
            </p>
          )}
          {suggestedDay && onUseSuggestedDay && (
            <p className="text-sm text-navy mb-3" role="note">
              El <strong>{formatDateLong(suggestedDay)}</strong> es el primer día con espacio para esta tarea.
            </p>
          )}
          {maxHours < 0.1 ? (
            <p className="text-sm text-muted mb-3" role="note">
              Ese día ya está completo. Elige otro día.
            </p>
          ) : (
            <Field
              label="Horas estimadas"
              htmlFor="overload-hours"
              hint={`Para que quepa, esta tarea puede tener hasta ${formatHours(maxHours)}.`}
            >
              <input
                id="overload-hours"
                type="number"
                min="0.1"
                step="0.5"
                max={maxHours}
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                aria-required="true"
                className={inputCls}
              />
            </Field>
          )}
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-2">
          <Button ref={cancelRef} variant="neutral" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          {suggestedDay && onUseSuggestedDay && (
            <Button
              variant={taskExceedsLimit ? 'neutral' : 'primary'}
              onClick={() => onUseSuggestedDay(suggestedDay)}
              disabled={busy}
              loading={busy}
            >
              Mover al {formatDateShort(suggestedDay)}
            </Button>
          )}
          {onPostpone && (
            <Button variant="neutral" onClick={onPostpone} disabled={busy}>
              Posponer tarea
            </Button>
          )}
          <Button
            ref={moveRef}
            variant="neutral"
            onClick={onMoveToAnotherDay}
            disabled={busy || taskExceedsLimit}
          >
            Mover a otro día
          </Button>
          <Button
            ref={reduceRef}
            variant={taskExceedsLimit ? 'primary' : 'neutral'}
            onClick={() => onReduceHours(hoursValue)}
            disabled={busy || maxHours < 0.1 || !canReduce}
            loading={busy}
          >
            Reducir horas estimadas
          </Button>
        </div>
      </div>
    </Modal>
  )
}