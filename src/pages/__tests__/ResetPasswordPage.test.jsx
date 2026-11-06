import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResetPasswordPage from '../ResetPasswordPage'
import { confirmPasswordReset } from '../../services/authService'

const toast = vi.hoisted(() => ({ success: vi.fn() }))
vi.mock('../../services/authService', () => ({ confirmPasswordReset: vi.fn() }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => toast }))

function Location() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}

function renderPage(path = '/reset-password?uid=abc&token=xyz') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<Location />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    confirmPasswordReset.mockReset()
    toast.success.mockReset()
  })

  it('solicita un enlace nuevo si faltan uid o token', () => {
    renderPage('/reset-password?uid=abc')
    expect(screen.getByRole('heading', { name: 'Enlace no válido' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Solicitar un nuevo enlace' })).toHaveAttribute('href', '/recuperar')
    expect(confirmPasswordReset).not.toHaveBeenCalled()
  })

  it('valida y confirma la contraseña, y redirige a iniciar sesión', async () => {
    confirmPasswordReset.mockResolvedValue()
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nueva contraseña/), { target: { value: 'nueva-pass-123' } })
    fireEvent.change(screen.getByLabelText(/Confirmar contraseña/), { target: { value: 'nueva-pass-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/login')
    expect(confirmPasswordReset).toHaveBeenCalledWith({
      uid: 'abc', token: 'xyz', newPassword: 'nueva-pass-123', confirm: 'nueva-pass-123',
    })
    expect(toast.success).toHaveBeenCalledWith('Contraseña actualizada. Ya puedes iniciar sesión.')
  })

  it('señala contraseñas que no coinciden sin enviar la solicitud', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nueva contraseña/), { target: { value: 'nueva-pass-123' } })
    fireEvent.change(screen.getByLabelText(/Confirmar contraseña/), { target: { value: 'distinta-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(confirmPasswordReset).not.toHaveBeenCalled()
  })
})
