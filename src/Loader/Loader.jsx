import './loadder.css'

export const Loader = ({ label = 'Cargando…' }) => {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="loader-dot loader-dot-1" aria-hidden="true"></div>
      <div className="loader-dot loader-dot-2" aria-hidden="true"></div>
      <div className="loader-dot loader-dot-3" aria-hidden="true"></div>
      <div className="loader-dot loader-dot-4" aria-hidden="true"></div>
      <div className="loader-dot loader-dot-5" aria-hidden="true"></div>
    </div>
  )
}
