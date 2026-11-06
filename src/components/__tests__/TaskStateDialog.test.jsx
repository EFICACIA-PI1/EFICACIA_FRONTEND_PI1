import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskStateDialog from '../TaskStateDialog'

describe('TaskStateDialog', () => {
  it('submits a trimmed postponement note and displays backend errors', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<TaskStateDialog task={{ name: 'Confirmar salón' }} onConfirm={onConfirm} onClose={vi.fn()} error="No se pudo posponer" />)
    await user.clear(screen.getByLabelText(/¿Por qué la pospones/))
    await user.type(screen.getByLabelText(/¿Por qué la pospones/), '  Esperando respuesta  ')
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo posponer')
    await user.click(screen.getByRole('button', { name: 'Posponer' }))
    expect(onConfirm).toHaveBeenCalledWith('Esperando respuesta')
  })

  it('allows editing and reactivating an already postponed task', () => {
    const onReactivate = vi.fn(), onConfirm = vi.fn()
    render(<TaskStateDialog task={{ name: 'Confirmar salón', state: 'pospuesta', note: 'Pendiente respuesta' }}
      onConfirm={onConfirm} onReactivate={onReactivate} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Editar nota de la tarea' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar tarea' }))
    expect(onReactivate).toHaveBeenCalledWith('Pendiente respuesta')
    expect(screen.getByRole('button', { name: 'Guardar nota' })).toBeInTheDocument()
  })
})
