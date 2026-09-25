import Modal from './Modal'
import Button from './Button'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true,
  busy = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="confirm-title" describedBy="confirm-desc">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-danger-bg shrink-0"
          >
            <svg
              className="w-5 h-5 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </span>
          <h2 id="confirm-title" className="text-lg font-semibold text-navy">
            {title}
          </h2>
        </div>
        <p id="confirm-desc" className="text-sm text-muted leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="neutral" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}