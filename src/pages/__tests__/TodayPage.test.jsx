import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TodayPage from '../TodayPage'
import { getTodayData } from '../../services/todayApi'
import { setTaskState } from '../../services/tasksApi'

const auth = vi.hoisted(() => ({ user: { fullName: 'Ana Pérez', dailyHoursLimit: 6 } }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => toast }))
vi.mock('../../services/todayApi', () => ({ getTodayData: vi.fn() }))
vi.mock('../../services/tasksApi', () => ({ setTaskState: vi.fn() }))

const task = {
  id: 12, name: 'Confirmar catering', eventId: 3, eventName: 'Boda Ana', dueDate: '2099-12-01',
  hours: 2, priority: 'urgent', state: 'pendiente',
}
const payload = {
  allEvents: [{ id: 3, name: 'Boda Ana' }],
  items: [task],
  groups: { vencidas: [], paraHoy: [task], proximas: [] },
  conflicts: [],
}

describe('TodayPage', () => {
  beforeEach(() => {
    getTodayData.mockReset()
    setTaskState.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
  })

  it('carga y muestra los datos del plan y completa una tarea', async () => {
    getTodayData.mockResolvedValue(payload)
    setTaskState.mockResolvedValue()
    render(<MemoryRouter><TodayPage /></MemoryRouter>)
    expect(await screen.findByText('Confirmar catering')).toBeInTheDocument()
    expect(screen.getByText('Hola, Ana. Aquí está tu plan logístico para hoy.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Marcar "Confirmar catering" como hecha' }))
    await waitFor(() => expect(setTaskState).toHaveBeenCalledWith(12, 'hecha'))
    expect(toast.success).toHaveBeenCalledWith('Tarea hecha. Ya no cuenta en tus horas del día.')
  })

  it('permite filtrar por evento a través de la URL y recarga datos filtrados', async () => {
    getTodayData.mockResolvedValue(payload)
    render(<MemoryRouter initialEntries={['/hoy']}><TodayPage /></MemoryRouter>)
    await screen.findByText('Confirmar catering')
    fireEvent.change(screen.getByLabelText('Evento'), { target: { value: '3' } })
    await waitFor(() => expect(getTodayData).toHaveBeenCalledWith(expect.objectContaining({ eventId: '3' })))
  })

  it('presenta el estado de error y vuelve a intentar la carga', async () => {
    getTodayData.mockRejectedValueOnce(Object.assign(new Error('Sin red'), { status: 0 }))
      .mockResolvedValueOnce({ ...payload, items: [], groups: { vencidas: [], paraHoy: [], proximas: [] } })
    render(<MemoryRouter><TodayPage /></MemoryRouter>)
    expect(await screen.findByText('Sin conexión con el servidor')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('¡Día libre!')).toBeInTheDocument()
    expect(getTodayData).toHaveBeenCalledTimes(2)
  })
})
