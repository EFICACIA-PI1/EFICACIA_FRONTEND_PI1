import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventFormModal from '../EventFormModal'

const baseProps = {
  open: true,
  event: { id: 'e1', name: 'Conferencia', type: 'corporativo', client: 'Acme', date: '2099-06-15', location: 'Bogotá' },
  onSave: vi.fn(),
  onClose: vi.fn(),
}

describe('EventFormModal', () => {
  it('validates required fields and submits normalized event details', async () => {
    const user = userEvent.setup()
    baseProps.onSave.mockResolvedValue(undefined)
    render(<EventFormModal {...baseProps} />)
    await user.clear(screen.getByLabelText(/Nombre del evento/))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByText('Escribe el nombre del evento.')).toBeInTheDocument()
    expect(baseProps.onSave).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText(/Nombre del evento/), '  Feria anual  ')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(baseProps.onSave).toHaveBeenCalledWith({
      name: 'Feria anual', type: 'corporativo', client: 'Acme', date: '2099-06-15', location: 'Bogotá',
    }))
  })

  it('closes on cancel and renders nothing when closed', () => {
    const { rerender } = render(<EventFormModal {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
    rerender(<EventFormModal {...baseProps} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
