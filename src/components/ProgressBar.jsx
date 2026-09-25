export default function ProgressBar({ percent, color = 'var(--color-primary)', label, height = 'h-2' }) {
  const safe = Math.min(100, Math.max(0, Math.round(percent)))
  return (
    <div
      className={`${height} rounded-full overflow-hidden`}
      style={{ backgroundColor: 'var(--color-surface)' }}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${safe}%`, backgroundColor: color }}
      />
    </div>
  )
}