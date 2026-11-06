import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Loader } from '../Loader'

describe('Loader', () => {
  it('expone el estado de carga accesible con la etiqueta predeterminada', () => {
    render(<Loader />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Cargando…')).toHaveClass('sr-only')
  })

  it('presenta la etiqueta personalizada y cinco indicadores decorativos', () => {
    const { container } = render(<Loader label="Guardando cambios" />)
    expect(screen.getByText('Guardando cambios')).toBeInTheDocument()
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(5)
  })
})
