import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PageLoader from '../PageLoader'

describe('PageLoader', () => {
  it('shows the default loading message while a route is loading', () => {
    render(<PageLoader />)
    expect(screen.getByText('Cargando…', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('status').parentElement).toHaveClass('min-h-[60vh]')
  })
})
