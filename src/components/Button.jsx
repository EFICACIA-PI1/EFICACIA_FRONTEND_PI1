import { forwardRef } from 'react'
import Spinner from './Spinner'

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  danger: 'bg-danger text-white hover:bg-danger-dark',
  warning: 'bg-warning text-white hover:bg-amber-700',
  neutral: 'bg-white text-navy border border-edge hover:bg-gray-50',
  // Acción destructiva discreta: gris en reposo, rojo solo al pasar el cursor o enfocar.
  'subtle-danger': 'bg-transparent text-muted hover:text-danger hover:bg-danger-bg focus-visible:text-danger',
}

const SIZES = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-sm px-6 py-3',
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
})

export default Button