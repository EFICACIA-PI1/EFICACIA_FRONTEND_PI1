import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import NotFoundPage from '../NotFoundPage'

describe('NotFoundPage', () => {
  it('explica el error y ofrece navegación hacia Hoy', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a Hoy' })).toHaveAttribute('href', '/hoy')
  })
})
