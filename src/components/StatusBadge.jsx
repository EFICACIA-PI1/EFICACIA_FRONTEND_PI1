import Icon from './Icon'
import { getTaskStatus } from '../utils/tasks'

const STATUS = {
  done: { label: 'Hecha', icon: 'check', cls: 'bg-success-bg text-success border-success-border' },
  pending: { label: 'Pendiente', icon: '', cls: 'bg-neutral-bg text-neutral border-neutral-border' },
  overdue: { label: 'Vencida', icon: '', cls: 'bg-danger-bg text-danger border-danger-border' },
}

export default function StatusBadge({ task }) {
  const status = getTaskStatus(task)
  const config = STATUS[status] || STATUS.pending
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${config.cls}`}
    >
      {config.icon && <Icon name={config.icon} className="w-3 h-3" />}
      {config.label}
    </span>
  )
}