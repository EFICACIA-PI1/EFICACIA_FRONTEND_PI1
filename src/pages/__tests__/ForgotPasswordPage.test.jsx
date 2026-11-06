import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPasswordPage from '../ForgotPasswordPage'
import { requestPasswordReset } from '../../services/authService'

vi.mock('../../services/authService', () => ({ requestPasswordReset: vi.fn() }))

describe('ForgotPasswordPage', () => {
  beforeEach(() => requestPasswordReset.mockReset())

  it('rechaza un correo inválido sin llamar al servicio', async () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'no-es-correo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(await screen.findByText(/correo válido/i)).toBeInTheDocument()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it('muestra confirmación después de solicitar el enlace', async () => {
    requestPasswordReset.mockResolvedValue()
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(await screen.findByRole('status')).toHaveTextContent('ana@example.com')
    expect(requestPasswordReset).toHaveBeenCalledWith('ana@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Usar otro correo' }))
    expect(screen.getByRole('heading', { name: 'Recupera tu contraseña' })).toBeInTheDocument()
  })

  it('limpia el error de validación al corregir el correo', async () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'no-es-correo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(await screen.findByText(/correo válido/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } })
    expect(screen.queryByText(/correo válido/i)).not.toBeInTheDocument()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })
})
