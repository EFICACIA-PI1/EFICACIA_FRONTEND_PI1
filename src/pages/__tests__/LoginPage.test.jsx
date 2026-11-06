import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '../LoginPage'

const auth = vi.hoisted(() => ({ isAuthenticated: false, login: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))

function Location() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}

function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hoy" element={<Location />} />
        <Route path="/eventos" element={<Location />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    auth.isAuthenticated = false
    auth.login.mockReset()
  })

  it('valida campos requeridos antes de llamar al servicio', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Ingresa tu usuario.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('inicia sesión y redirige al destino guardado', async () => {
    auth.login.mockResolvedValue()
    renderLogin(['/login', { pathname: '/login', state: { from: '/eventos' } }])
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/eventos')
    expect(auth.login).toHaveBeenCalledWith({ username: 'ana', password: 'secreto' })
  })

  it('muestra errores del servidor sin salir del formulario', async () => {
    auth.login.mockRejectedValue(new Error('Credenciales incorrectas'))
    renderLogin()
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales incorrectas')
  })
})
