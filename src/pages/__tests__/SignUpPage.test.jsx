import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SignUpPage from '../SignUpPage'

const auth = vi.hoisted(() => ({ isAuthenticated: false, register: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))

function Location() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <Routes>
        <Route path="/registro" element={<SignUpPage />} />
        <Route path="/hoy" element={<Location />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SignUpPage', () => {
  beforeEach(() => {
    auth.isAuthenticated = false
    auth.register.mockReset()
  })

  it('presenta errores de validación y no registra datos incompletos', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Ingresa tu nombre completo.')).toBeInTheDocument()
    expect(auth.register).not.toHaveBeenCalled()
  })

  it('envía los datos válidos y navega al plan', async () => {
    auth.register.mockResolvedValue()
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana Pérez' } })
    fireEvent.change(screen.getByLabelText(/Usuario/), { target: { value: 'ana.perez' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirmar contraseña/), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/hoy')
    expect(auth.register).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Ana Pérez',
      username: 'ana.perez',
      email: 'ana@example.com',
      phone: '3001234567',
    }))
  })

  it('mapea errores del backend a los campos correspondientes', async () => {
    auth.register.mockRejectedValue(Object.assign(new Error('Datos inválidos'), {
      fields: { full_name: 'Nombre ya usado' },
    }))
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana Pérez' } })
    fireEvent.change(screen.getByLabelText(/Usuario/), { target: { value: 'ana.perez' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirmar contraseña/), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Revisa los campos marcados.')).toBeInTheDocument()
    expect(screen.getByText('Nombre ya usado')).toBeInTheDocument()
  })
})
