import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskFormModal from '../TaskFormModal'

describe('TaskFormModal', () => {
  it('validates missing data and saves normalized task details', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<TaskFormModal open mode="create" event={{ id: 'e1' }} eventDate="2099-06-15" onSave={onSave} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    expect(screen.getByText('Escribe el nombre de la tarea.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText(/Nombre de la tarea/), '  Reservar salón  ')
    fireEvent.change(screen.getByLabelText(/Fecha límite de la tarea/), { target: { value: '2099-06-10' } })
    await user.type(screen.getByLabelText(/Horas estimadas/), '2')
    await user.type(screen.getByLabelText(/Nota/), '  Confirmar aforo  ')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      name: 'Reservar salón', dueDate: '2099-06-10', hours: 2, description: 'Confirmar aforo',
      due_date: '2099-06-10', estimated_hours: 2,
    }))
  })

  it('does not submit a complete form when its event has no identifier', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<TaskFormModal open mode="create" event={{}} onSave={onSave} onClose={vi.fn()} />)
    await user.type(screen.getByLabelText(/Nombre de la tarea/), 'Tarea')
    fireEvent.change(screen.getByLabelText(/Fecha límite de la tarea/), { target: { value: '2099-06-10' } })
    await user.type(screen.getByLabelText(/Horas estimadas/), '2')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    expect(onSave).not.toHaveBeenCalled()
  })
})
