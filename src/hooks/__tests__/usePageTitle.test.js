import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import usePageTitle from '../usePageTitle'

describe('usePageTitle', () => {
  const originalTitle = document.title
  afterEach(() => {
    document.title = originalTitle
  })

  it('sets the app title with a page title and falls back when empty', () => {
    const { rerender, unmount } = renderHook(({ title }) => usePageTitle(title), { initialProps: { title: 'Eventos' } })
    expect(document.title).toBe('Eventos · EFICACIA')
    rerender({ title: '' })
    expect(document.title).toBe('EFICACIA · Organizador de eventos')
    unmount()
  })
})
