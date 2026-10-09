import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

const TOOLTIP_ID = 'daily-limit-tooltip'

export default function DailyLimitBadge() {
  const { user } = useAuth()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const badgeRef = useRef(null)
  const touchPointer = useRef(false)
  const dailyHoursLimit = user?.dailyHoursLimit
  const open = !dismissed && (hovered || focused || pinned)

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (!badgeRef.current?.contains(event.target)) {
        setHovered(false)
        setFocused(false)
        setPinned(false)
        setDismissed(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setHovered(false)
        setFocused(false)
        setPinned(false)
        setDismissed(true)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!user || dailyHoursLimit == null) return null

  return (
    <div ref={badgeRef} className="fixed bottom-4 right-4 z-40">
      <div
        id={TOOLTIP_ID}
        role="tooltip"
        className={`absolute bottom-full right-0 mb-2 w-60 max-w-[calc(100vw-2rem)] rounded-lg border border-edge bg-white px-3 py-2 text-xs leading-relaxed text-muted shadow-lg ${
          open ? '' : 'hidden'
        }`}
      >
        Estas son las horas máximas que planificas por día. Para cambiarlas, ve al módulo Mi perfil.
      </div>
      <button
        type="button"
        aria-describedby={TOOLTIP_ID}
        aria-expanded={open}
        onPointerDown={(event) => {
          touchPointer.current = event.pointerType === 'touch'
          if (!touchPointer.current) setDismissed(false)
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== 'touch') {
            setDismissed(false)
            setHovered(true)
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== 'touch') {
            setHovered(false)
            setDismissed(false)
          }
        }}
        onFocus={() => {
          if (!touchPointer.current) {
            setDismissed(false)
            setFocused(true)
          }
        }}
        onBlur={() => {
          setFocused(false)
          setDismissed(false)
          touchPointer.current = false
        }}
        onClick={(event) => {
          if (touchPointer.current || event.detail === 0) {
            setDismissed(false)
            setPinned((value) => !value)
          }
        }}
        className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Icon name="clock" className="h-5 w-5" />
        Límite diario: {dailyHoursLimit} h
      </button>
    </div>
  )
}
