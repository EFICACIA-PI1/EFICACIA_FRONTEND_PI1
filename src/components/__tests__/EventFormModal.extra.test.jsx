import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventFormModal from '../EventFormModal'

const event = { id: 'e1', name: 'Conferencia', type: 'corporativo', client: 'Acme', date: '2099-06-15', location: 'Bogotá' }

function renderModal(props = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  render(<EventFormModal open event={event} onSave={onSave} onClose={onClose} {...props} />)
  return { onSave, onClose }
}

const input = (label) => screen.getByLabelText(new RegExp(label))

describe('EventFormModal (extra)', () => {
  it('shows an error on blur only for empty required fields', () => {
    renderModal()
    fireEvent.blur(input('Cliente'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.change(input('Cliente'), { target: { value: '   ' } })
    fireEvent.change(input('Lugar del evento'), { target: { value: '' } })
    fireEvent.blur(input('Cliente'))
    fireEvent.blur(input('Lugar del evento'))

    expect(screen.getByText('Escribe el nombre del cliente o contratante.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el lugar del evento.')).toBeInTheDocument()
    expect(input('Cliente')).toHaveAttribute('aria-invalid', 'true')
    expect(input('Cliente')).toHaveAttribute('aria-describedby', 'ee-client-error')
    expect(input('Lugar del evento')).toHaveAttribute('aria-describedby', 'ee-location-error')
  })

  it('clears a field error as soon as the value becomes valid', () => {
    renderModal()
    fireEvent.change(input('Lugar del evento'), { target: { value: '' } })
    expect(screen.getByText('Escribe el lugar del evento.')).toBeInTheDocument()
    fireEvent.change(input('Lugar del evento'), { target: { value: 'Medellín' } })
    expect(screen.queryByText('Escribe el lugar del evento.')).not.toBeInTheDocument()
    expect(input('Lugar del evento')).toHaveAttribute('aria-invalid', 'false')
  })

  it('validates the event date: required and not earlier than today', () => {
    renderModal()
    fireEvent.change(input('Fecha del evento'), { target: { value: '' } })
    fireEvent.blur(input('Fecha del evento'))
    expect(screen.getByText('Elige la fecha del evento.')).toBeInTheDocument()

    fireEvent.change(input('Fecha del evento'), { target: { value: '2000-01-01' } })
    expect(screen.getByText('La fecha del evento no puede ser anterior a hoy.')).toBeInTheDocument()
    expect(input('Fecha del evento')).toHaveAttribute('aria-describedby', 'ee-date-error')
  })

  it('accepts the original date even if it is already in the past', async () => {
    const pastEvent = { ...event, date: '2000-01-01' }
    const { onSave } = renderModal({ event: pastEvent })
    fireEvent.blur(input('Fecha del evento'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ date: '2000-01-01' })))
  })

  it('focuses the first invalid field and does not save', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()
    await user.clear(input('Cliente'))
    await user.clear(input('Lugar del evento'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(input('Cliente')).toHaveFocus()
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('sends the selected type and trimmed values', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()
    await user.selectOptions(input('Tipo de evento'), 'boda')
    await user.clear(input('Cliente'))
    await user.type(input('Cliente'), '  Familia Pérez ')
    await user.clear(input('Lugar del evento'))
    await user.type(input('Lugar del evento'), ' Cali  ')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      name: 'Conferencia', type: 'boda', client: 'Familia Pérez', date: '2099-06-15', location: 'Cali',
    }))
  })

  it('uses "otro" as the type when the event has none', async () => {
    const { onSave } = renderModal({ event: { ...event, type: '' } })
    expect(input('Tipo de evento')).toHaveValue('otro')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ type: 'otro' })))
  })

  it('shows the date error returned by the backend next to the date field', async () => {
    const onSave = vi.fn().mockRejectedValue({ fields: { event_date: 'Hay tareas con fecha posterior al evento.' } })
    renderModal({ onSave })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Hay tareas con fecha posterior al evento.')).toBeInTheDocument()
    expect(input('Fecha del evento')).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
  })

  it('re-enables the form when saving fails without a field error', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'))
    renderModal({ onSave })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('ignores a second submit while the first one is still saving', async () => {
    let finish
    const onSave = vi.fn(() => new Promise((resolve) => { finish = resolve }))
    renderModal({ onSave })
    const form = screen.getByRole('button', { name: 'Cancelar' }).closest('form')

    fireEvent.submit(form)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled())
    fireEvent.submit(form)
    expect(onSave).toHaveBeenCalledTimes(1)
    finish()
  })
})
