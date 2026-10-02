// Spinner pequeño que hereda el color del texto. Se usa dentro de botones con acción en curso;
// para cargas de sección o de página se usa el Loader de marca (src/Loader).
export default function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 50 50"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`animate-spin shrink-0 ${className}`}
    >
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeOpacity="0.25" strokeWidth="5" />
      <path d="M25 5a20 20 0 0 1 20 20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}
