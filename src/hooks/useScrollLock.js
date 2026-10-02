import { useEffect } from 'react'

/** Bloquea el scroll del body mientras `locked` sea true. */
export default function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}
