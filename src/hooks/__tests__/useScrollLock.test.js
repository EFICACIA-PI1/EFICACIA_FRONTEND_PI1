import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import useScrollLock from '../useScrollLock'

describe('useScrollLock', () => {
  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('locks while enabled and restores the previous overflow value on unlock/unmount', () => {
    document.body.style.overflow = 'auto'
    const { rerender, unmount } = renderHook(({ locked }) => useScrollLock(locked), {
      initialProps: { locked: true },
    })
    expect(document.body.style.overflow).toBe('hidden')
    rerender({ locked: false })
    expect(document.body.style.overflow).toBe('auto')
    rerender({ locked: true })
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('does not alter the body while initially unlocked', () => {
    document.body.style.overflow = 'scroll'
    const { unmount } = renderHook(() => useScrollLock(false))
    expect(document.body.style.overflow).toBe('scroll')
    unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })
})
