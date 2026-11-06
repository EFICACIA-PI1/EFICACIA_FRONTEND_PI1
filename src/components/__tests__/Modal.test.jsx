import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Modal from '../Modal'

describe('Modal', () => {
  it('does not render while closed and closes by Escape or overlay click', () => {
    const onClose = vi.fn()
    const { rerender } = render(<Modal open={false} onClose={onClose}>Contenido</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(<Modal open onClose={onClose} labelledBy="title"><h2 id="title">Título</h2>Contenido</Modal>)
    expect(screen.getByRole('dialog', { name: 'Título' })).toHaveAttribute('aria-modal', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(document.querySelector('[aria-hidden="true"]'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('keeps the modal open when overlay closing is disabled', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} closeOnOverlay={false}>Dentro</Modal>)
    fireEvent.click(document.querySelector('[aria-hidden="true"]'))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
