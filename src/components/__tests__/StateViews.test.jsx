import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState, ErrorState, LoadingState } from '../StateViews'

describe('StateViews', () => {
  it('renders a labelled loading state', () => {
    render(<LoadingState label="Cargando eventos" />)
    expect(screen.getByText('Cargando eventos', { selector: 'p' })).toBeInTheDocument()
  })

  it('renders the empty state description and supplied action', () => {
    render(<EmptyState icon="events" title="Sin eventos" description="Crea tu primer evento" action={<button>Crear</button>} />)
    expect(screen.getByRole('heading', { name: 'Sin eventos' })).toBeInTheDocument()
    expect(screen.getByText('Crea tu primer evento')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
  })

  it('explains connection errors and invokes retry', () => {
    const onRetry = vi.fn()
    render(<ErrorState error={{ status: 0 }} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión con el servidor')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
