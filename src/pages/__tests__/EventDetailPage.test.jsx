import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EventDetailPage from '../EventDetailPage'
import { getEventDetail } from '../../services/eventsApi'
import { setTaskState } from '../../services/tasksApi'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('../../services/eventsApi', () => ({
  getEventDetail: vi.fn(), updateEvent: vi.fn(), deleteEvent: vi.fn(),
}))
vi.mock('../../services/tasksApi', () => ({ deleteTask: vi.fn(), setTaskState: vi.fn() }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => toast }))
vi.mock('../../hooks/useRescheduleFlow', () => ({
  default: () => ({
    save: vi.fn(), cancel: vi.fn(), clearError: vi.fn(), moveToAnotherDay: vi.fn(),
    retryWithHours: vi.fn(), retryWithDate: vi.fn(), postpone: vi.fn(),
    error: '', conflict: null, lastData: null, busy: false, target: null, focusDateRequest: 0,
  }),
}))

const detail = {
  event: { id: 7, name: 'Festival', type: 'Concierto', client: 'Acme', date: '2099-06-15', location: 'Parque' },
  tasks: [{ id: 10, name: 'Reservar escenario', hours: 3, dueDate: '2099-05-01', done: false, state: 'pendiente' }],
  progress: { total: 1, done: 0, percent: 0 },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/evento/7']}>
      <Routes><Route path="/evento/:id" element={<EventDetailPage />} /></Routes>
    </MemoryRouter>
  )
}

describe('EventDetailPage', () => {
  beforeEach(() => {
    getEventDetail.mockReset()
    setTaskState.mockReset()
    toast.success.mockReset()
  })

  it('carga el evento y permite marcar una tarea como hecha', async () => {
    getEventDetail.mockResolvedValue(detail)
    setTaskState.mockResolvedValue()
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Festival' })).toBeInTheDocument()
    expect(screen.getByText('Reservar escenario')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hecha' }))
    await waitFor(() => expect(setTaskState).toHaveBeenCalledWith(10, 'hecha', undefined))
    expect(toast.success).toHaveBeenCalledWith('Tarea hecha. Tu progreso se actualizó.')
  })

  it('presenta un error legible si falla la carga', async () => {
    getEventDetail.mockRejectedValue(Object.assign(new Error('Offline'), { status: 0 }))
    renderPage()
    expect(await screen.findByText('No se ha podido cargar el evento')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '← Volver a eventos' })).toBeInTheDocument()
  })
})
