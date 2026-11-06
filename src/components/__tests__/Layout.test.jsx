import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ logout: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ logout: mocks.logout }) }))
import Layout from '../Layout'

afterEach(() => vi.clearAllMocks())

describe('Layout', () => {
  it('renders navigation and outlet content, and logs out from the sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/hoy']}>
        <Routes><Route element={<Layout />}><Route path="/hoy" element={<p>Contenido de hoy</p>} /></Route></Routes>
      </MemoryRouter>
    )
    expect(screen.getByRole('main')).toHaveTextContent('Contenido de hoy')
    expect(screen.getAllByRole('link', { name: 'Hoy' })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0])
    expect(mocks.logout).toHaveBeenCalledTimes(1)
  })

  it('opens the mobile navigation and closes it after selecting a route', () => {
    render(
      <MemoryRouter initialEntries={['/hoy']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/hoy" element={<p>Contenido de hoy</p>} />
            <Route path="/eventos" element={<p>Mis eventos</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    const open = screen.getByRole('button', { name: 'Abrir menú' })
    fireEvent.click(open)
    expect(open).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(document.querySelector('#mobile-menu a[href="/eventos"]'))
    expect(screen.getByText('Mis eventos')).toBeInTheDocument()
    expect(open).toHaveAttribute('aria-expanded', 'false')
  })
})
