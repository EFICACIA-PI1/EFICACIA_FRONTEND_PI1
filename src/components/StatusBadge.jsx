import { getGestionStatus } from '../services/eventService'

const STATUS = {
  hecha: { label: 'Hecha', icon: '✔', cls: 'bg-success-bg text-success border-success-border' },
  pendiente: { label: 'Pendiente', icon: '', cls: 'bg-neutral-bg text-neutral border-neutral-border' },
  vencida: { label: 'Vencida', icon: '', cls: 'bg-danger-bg text-danger border-danger-border' },
}

export default function StatusBadge({ gestion }) {
  const status = getGestionStatus(gestion)
  const config = STATUS[status]
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${config.cls}`}
    >
      {config.icon && (
        <span aria-hidden="true" className="text-[10px]">
          {config.icon}
        </span>
      )}
      {config.label}
    </span>
  )
}