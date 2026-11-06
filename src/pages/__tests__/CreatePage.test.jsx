import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreatePage from '../CreatePage'
import { createEvent } from '../../services/eventsApi'

const auth = vi.hoisted(() => ({ user: { dailyHoursLimit: 6 } }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => toast }))
vi.mock('../../services/eventsApi', () => ({ createEvent: vi.fn() }))
vi.mock('../../services/tasksApi', () => ({ createTask: vi.fn() }))
vi.mock('../../services/api', () => ({ isOverloadConflict: vi.fn(() => false) }))

function Location() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/crear']}>
      <Routes>
        <Route path="/crear" element={<CreatePage />} />
        <Route path="/evento/:id" element={<Location />} />
        <Route path="/eventos" element={<Location />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CreatePage', () => {
  beforeEach(() => {
    createEvent.mockReset()
    toast.success.mockReset()
  })

  it('valida campos obligatorios antes de crear', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    expect(await screen.findByText('Escribe el nombre del evento.')).toBeInTheDocument()
    expect(createEvent).not.toHaveBeenCalled()
  })

  it('crea el evento con sus datos y navega al detalle', async () => {
    createEvent.mockResolvedValue({ id: 42, name: 'Boda de Ana' })
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nombre del evento/), { target: { value: ' Boda de Ana ' } })
    fireEvent.change(screen.getByLabelText('Tipo de evento'), { target: { value: 'Boda' } })
    fireEvent.change(screen.getByLabelText(/Cliente \/ Contratante/), { target: { value: ' Ana Pérez ' } })
    fireEvent.change(screen.getByLabelText(/Fecha del evento/), { target: { value: '2099-12-01' } })
    fireEvent.change(screen.getByLabelText(/Lugar del evento/), { target: { value: ' Hacienda ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/evento/42')
    expect(createEvent).toHaveBeenCalledWith({
      name: 'Boda de Ana', type: 'Boda', client: 'Ana Pérez',
      date: '2099-12-01', location: 'Hacienda', notes: '',
    })
    expect(toast.success).toHaveBeenCalledWith('Evento creado. Ahora agrega sus tareas.')
  })

  it('muestra errores de validación devueltos por el backend', async () => {
    createEvent.mockRejectedValue(Object.assign(new Error('invalid'), {
      fields: { event_date: 'Fecha no disponible' },
    }))
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nombre del evento/), { target: { value: 'Boda' } })
    fireEvent.change(screen.getByLabelText(/Cliente \/ Contratante/), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/Fecha del evento/), { target: { value: '2099-12-01' } })
    fireEvent.change(screen.getByLabelText(/Lugar del evento/), { target: { value: 'Hacienda' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    expect(await screen.findByText('Fecha no disponible')).toBeInTheDocument()
  })
})
