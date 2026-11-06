import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProgressPage from '../ProgressPage'
import { getOverallProgress, listEvents } from '../../services/eventsApi'
import { getOpenTaskCounts } from '../../services/todayApi'

vi.mock('../../services/eventsApi', () => ({
  getOverallProgress: vi.fn(), listEvents: vi.fn(), sumProgress: vi.fn(() => ({ done: 1, total: 2, percent: 50 })),
}))
vi.mock('../../services/todayApi', () => ({ getOpenTaskCounts: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }))

const event = { id: 5, name: 'Lanzamiento', progress: { done: 1, total: 2, percent: 50 } }

describe('ProgressPage', () => {
  beforeEach(() => {
    listEvents.mockReset()
    getOverallProgress.mockReset()
    getOpenTaskCounts.mockReset()
  })

  it('resume el avance y las tareas por estado', async () => {
    listEvents.mockResolvedValue([event])
    getOverallProgress.mockResolvedValue({ done: 1, total: 2, percent: 50 })
    getOpenTaskCounts.mockResolvedValue({ pending: 1, postponed: 0, overdue: 0 })
    render(<MemoryRouter><ProgressPage /></MemoryRouter>)
    expect(await screen.findByText('Lanzamiento')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.getByText('1 Pendientes')).toBeInTheDocument()
  })

  it('permite reintentar después de un error al cargar', async () => {
    listEvents.mockRejectedValueOnce(Object.assign(new Error('Offline'), { status: 0 })).mockResolvedValueOnce([])
    getOverallProgress.mockResolvedValue({ done: 0, total: 0, percent: 0 })
    getOpenTaskCounts.mockResolvedValue({ pending: 0, postponed: 0, overdue: 0 })
    render(<MemoryRouter><ProgressPage /></MemoryRouter>)
    expect(await screen.findByText('No pudimos cargar el progreso')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('No tienes eventos creados.')).toBeInTheDocument()
    expect(listEvents).toHaveBeenCalledTimes(2)
  })
})
