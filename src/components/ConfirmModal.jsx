import Modal from './Modal'
import Button from './Button'
import Icon from './Icon'

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
            <Icon name="trash" className="w-5 h-5 text-danger" />
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