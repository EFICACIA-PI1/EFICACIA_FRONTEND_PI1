import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

const auth = vi.hoisted(() => ({ isAuthenticated: false }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../components/Layout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: () => <><div>Authenticated layout</div><Outlet /></> }
})
vi.mock('../pages/LoginPage', async () => {
  const { useLocation } = await import('react-router-dom')
  return {
    default: function LoginRoute() {
      const location = useLocation()
      return <><div>Login route</div><output data-testid="return-to">{location.state?.from}</output></>
    },
  }
})
vi.mock('../pages/ForgotPasswordPage', () => ({ default: () => <div>Forgot route</div> }))

function Location() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

vi.mock('../pages/TodayPage', () => ({ default: () => <Location /> }))

describe('App', () => {
  beforeEach(() => { auth.isAuthenticated = false })

  it('redirige rutas protegidas al login guardando la ruta de retorno', async () => {
    render(<MemoryRouter initialEntries={['/hoy?view=week']}><App /></MemoryRouter>)
    expect(await screen.findByText('Login route')).toBeInTheDocument()
    expect(screen.getByTestId('return-to')).toHaveTextContent('/hoy?view=week')
  })

  it('mantiene accesible la ruta pública de recuperación', async () => {
    render(<MemoryRouter initialEntries={['/recuperar']}><App /></MemoryRouter>)
    expect(await screen.findByText('Forgot route')).toBeInTheDocument()
  })

  it('redirige la ruta índice al plan cuando existe sesión', async () => {
    auth.isAuthenticated = true
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(await screen.findByTestId('location')).toHaveTextContent('/hoy')
  })
})
