import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from '../ProfilePage'

const auth = vi.hoisted(() => ({
  user: { fullName: 'Ana Pérez', username: 'ana', email: 'ana@example.com', phone: '3001234567', dailyHoursLimit: 6 },
  updateProfile: vi.fn(), logout: vi.fn(), changePassword: vi.fn(),
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => toast }))

describe('ProfilePage', () => {
  beforeEach(() => {
    auth.updateProfile.mockReset()
    auth.logout.mockReset()
    auth.changePassword.mockReset()
    toast.success.mockReset()
  })

  it('muestra datos del usuario y permite editar y guardar el perfil', async () => {
    auth.updateProfile.mockResolvedValue()
    render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Ana Pérez' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana María Pérez' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(auth.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Ana María Pérez',
    })))
    expect(toast.success).toHaveBeenCalledWith('Perfil actualizado.')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument())
  })

  it('muestra errores de validación dentro del formulario', async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'mal' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText(/correo válido/i)).toBeInTheDocument()
    expect(auth.updateProfile).not.toHaveBeenCalled()
  })

  it('permite cancelar edición y cerrar sesión', async () => {
    auth.logout.mockResolvedValue()
    render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() => expect(auth.logout).toHaveBeenCalledOnce())
  })
})
