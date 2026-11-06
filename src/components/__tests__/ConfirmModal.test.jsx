import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ConfirmModal from '../ConfirmModal'

describe('ConfirmModal', () => {
  it('shows the confirmation prompt and runs confirm/cancel actions', () => {
    const onConfirm = vi.fn(), onClose = vi.fn()
    render(<ConfirmModal open title="Eliminar evento" message="No se puede deshacer" onConfirm={onConfirm} onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Eliminar evento' })).toHaveTextContent('No se puede deshacer')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('disables dismissal and confirms while busy', () => {
    render(<ConfirmModal open title="Procesando" message="Espera" busy onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled()
  })
})
