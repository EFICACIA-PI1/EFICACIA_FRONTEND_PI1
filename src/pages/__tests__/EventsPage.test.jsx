import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EventsPage from '../EventsPage'
import { deleteEvent, listEvents } from '../../services/eventsApi'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
const auth = vi.hoisted(() => ({ user: null }))
vi.mock('../../services/eventsApi', () => ({ listEvents: vi.fn(), deleteEvent: vi.fn() }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => toast }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))

function Location() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}
const event = {
  id: 17, name: 'Conferencia anual', type: 'Conferencia', client: 'Acme', date: '2099-08-20',
  progress: { done: 2, total: 4, percent: 50 },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/eventos']}>
      <Routes>
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/evento/:id" element={<Location />} />
        <Route path="/crear" element={<Location />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('EventsPage', () => {
  beforeEach(() => {
    listEvents.mockReset()
    deleteEvent.mockReset()
    toast.success.mockReset()
  })

  it('muestra eventos y abre el detalle elegido', async () => {
    listEvents.mockResolvedValue([event])
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Conferencia anual' })).toBeInTheDocument()
    expect(screen.getByText('2 de 4 completadas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Conferencia anual' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/evento/17')
  })

  it('confirma una eliminación y actualiza la lista', async () => {
    listEvents.mockResolvedValueOnce([event]).mockResolvedValueOnce([])
    deleteEvent.mockResolvedValue()
    renderPage()
    await screen.findByRole('heading', { name: 'Conferencia anual' })
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar evento "Conferencia anual"' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar', exact: true }))
    await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith(17))
    expect(await screen.findByText('Aún no tienes eventos creados.')).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith('Evento eliminado junto con sus tareas.')
  })
})
