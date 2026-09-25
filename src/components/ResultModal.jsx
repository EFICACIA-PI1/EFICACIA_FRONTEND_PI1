import Modal from './Modal'
import Button from './Button'

export default function ResultModal({ type = 'success', open, title, message, actionLabel, onClose }) {
  const isSuccess = type === 'success'
  return (
    <Modal open={open} onClose={onClose} labelledBy="result-title" describedBy="result-desc" closeOnOverlay={false}>
      <div className="p-6 text-center">
        <span
          role={isSuccess ? 'status' : 'alert'}
          className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 text-2xl font-bold ${
            isSuccess ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
          }`}
        >
          {isSuccess ? '✓' : '✕'}
        </span>
        <h2 id="result-title" className="text-lg font-semibold text-navy">
          {title}
        </h2>
        <p id="result-desc" className="text-sm text-muted leading-relaxed mt-1.5">
          {message}
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant={isSuccess ? 'primary' : 'danger'} onClick={onClose} autoFocus>
            {actionLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}