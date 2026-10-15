import { useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import { inputCls } from '../utils/forms'

const NOTE_MAX = 500

/** Pide la nota opcional al posponer una tarea (o al editar la nota de una pospuesta). */
export default function TaskStateDialog({ task, busy = false, error = '', onConfirm, onClose }) {
  const [note, setNote] = useState(task.note || '')
  const noteRef = useRef(null)
  const editing = task.state === 'pospuesta'

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      labelledBy="postpone-title"
      describedBy="postpone-description"
      initialFocusRef={noteRef}
    >
      <form
        className="p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm(note.trim())
        }}
      >
        <h2 id="postpone-title" className="text-lg font-semibold text-navy font-display">
          {editing ? 'Editar nota de la tarea' : 'Posponer tarea'}
        </h2>
        <p id="postpone-description" className="text-sm text-muted mt-1">
          <strong>{task.name}</strong> seguirá en tu plan y contará para las horas del día hasta que la marques como hecha.
        </p>

        <div className="mt-4">
          <Field
            label="¿Por qué la pospones?"
            htmlFor="postpone-note"
            optional
            hint="Ejemplo: esperando confirmación del salón."
            error={error}
          >
            <textarea
              id="postpone-note"
              ref={noteRef}
              rows={3}
              maxLength={NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Esperando confirmación del proveedor…"
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="neutral" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" loading={busy}>
            {editing ? 'Guardar nota' : 'Posponer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
