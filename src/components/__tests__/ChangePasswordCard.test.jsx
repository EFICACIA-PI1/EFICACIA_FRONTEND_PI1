import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ changePassword: vi.fn(), success: vi.fn(), error: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ changePassword: mocks.changePassword }) }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ success: mocks.success, error: mocks.error }) }))
import ChangePasswordCard from '../ChangePasswordCard'

afterEach(() => vi.clearAllMocks())

describe('ChangePasswordCard', () => {
  it('validates required fields and password confirmation before saving', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordCard />)
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
    expect(screen.getByText('Ingresa tu contraseña actual.')).toBeInTheDocument()
    expect(mocks.changePassword).not.toHaveBeenCalled()
  })

  it('saves valid values, reports success, and closes the form', async () => {
    mocks.changePassword.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ChangePasswordCard />)
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    await user.type(screen.getByLabelText(/Contraseña actual/), 'current1')
    await user.type(screen.getByLabelText(/Nueva contraseña/), 'newpass123')
    await user.type(screen.getByLabelText(/Confirmar nueva contraseña/), 'newpass123')
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith({
      oldPassword: 'current1', newPassword: 'newpass123', confirm: 'newpass123',
    }))
    expect(mocks.success).toHaveBeenCalledWith('Contraseña actualizada.')
    expect(screen.queryByLabelText(/Contraseña actual/)).not.toBeInTheDocument()
  })
})
