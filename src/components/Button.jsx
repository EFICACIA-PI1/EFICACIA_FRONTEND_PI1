import { forwardRef } from 'react'

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  danger: 'bg-danger text-white hover:bg-danger-dark',
  warning: 'bg-warning text-white hover:bg-amber-700',
  neutral: 'bg-white text-navy border border-edge hover:bg-gray-50',
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
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70"
        />
      )}
      {children}
    </button>
  )
})

export default Button