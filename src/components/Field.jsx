export default function Field({ label, htmlFor, required = false, optional = false, hint, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium mb-1.5 text-navy">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
        {optional && <span className="font-normal text-subtle"> (opcional)</span>}
      </label>
      {hint && <p className="text-xs text-muted mb-1.5">{hint}</p>}
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger mt-1.5">
          {error}
        </p>
      )}
    </div>
  )
}