import Button from './Button'
import Icon from './Icon'
import { Loader } from '../Loader/Loader'

export function LoadingState({ label = 'Cargando…', className = 'py-24' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Loader label={label} />
      <p aria-hidden="true" className="mt-6 text-sm font-medium text-muted">
        {label}
      </p>
    </div>
  )
}

export function EmptyState({ icon, title, description, action, className = 'py-20', variant = 'default' }) {
  const today = variant === 'today'
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <span className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary ${today ? 'mb-4' : 'mb-5'}`}>
        <Icon name={icon} className="w-8 h-8" />
      </span>
      <h2 className={`text-xl font-semibold text-gray-800 font-display ${today ? 'mb-2' : 'mb-1'}`}>
        {title}
      </h2>
      {description && (
        <p className={`text-sm text-muted mb-6 ${today ? 'max-w-lg leading-7' : 'max-w-sm leading-relaxed'}`}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

function describeError(error) {
  if (error?.status === 0) {
    return {
      title: 'Sin conexión con el servidor',
      message: 'Revisa tu conexión a internet e inténtalo de nuevo.',
    }
  }
  if (error?.status >= 500) {
    return {
      title: 'El servidor tuvo un problema',
      message: 'Es un fallo de nuestro lado. Inténtalo de nuevo en unos minutos.',
    }
  }
  return {
    title: 'No pudimos cargar la información',
    message: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
  }
}

export function ErrorState({ error, title, onRetry, retryLabel = 'Reintentar', className = 'py-16' }) {
  const info = describeError(error)
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center ${className}`}>
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-danger-bg text-danger mb-4">
        <Icon name="alert" className="w-7 h-7" />
      </span>
      <h2 className="text-xl font-semibold text-navy mb-1.5 font-display">{title || info.title}</h2>
      <p className="text-sm text-muted max-w-sm mb-6">{info.message}</p>
      <Button variant="neutral" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  )
}
