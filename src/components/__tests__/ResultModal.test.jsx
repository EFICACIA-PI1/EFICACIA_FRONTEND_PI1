import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ResultModal from '../ResultModal'

describe('ResultModal', () => {
  it('shows a success status and closes with the primary action', () => {
    const onClose = vi.fn()
    render(<ResultModal open title="Guardado" message="Cambios listos" actionLabel="Continuar" onClose={onClose} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Guardado' })).toHaveTextContent('Cambios listos')
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders an error alert and nothing when closed', () => {
    const { rerender } = render(<ResultModal type="error" open title="Error" message="Falló" actionLabel="Cerrar" onClose={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(<ResultModal type="error" open={false} title="Error" message="Falló" actionLabel="Cerrar" onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
