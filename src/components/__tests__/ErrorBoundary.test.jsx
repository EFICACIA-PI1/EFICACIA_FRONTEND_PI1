import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

afterEach(() => vi.restoreAllMocks())

describe('ErrorBoundary', () => {
  it('renders its children normally', () => {
    render(<ErrorBoundary><p>Todo bien</p></ErrorBoundary>)
    expect(screen.getByText('Todo bien')).toBeInTheDocument()
  })

  it('replaces a crashing subtree with the recovery screen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Broken() { throw new Error('render failure') }
    render(<ErrorBoundary><Broken /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal')
    expect(screen.getByRole('link', { name: 'Ir a Hoy' })).toHaveAttribute('href', '/hoy')
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeInTheDocument()
  })
})
