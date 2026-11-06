import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  save: vi.fn(), clearError: vi.fn(), cancel: vi.fn(), moveToAnotherDay: vi.fn(),
  retryWithHours: vi.fn(), retryWithDate: vi.fn(), postpone: vi.fn(), success: vi.fn(),
}))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { dailyHoursLimit: 8 } }) }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ success: mocks.success }) }))
vi.mock('../../hooks/useRescheduleFlow', () => ({
  default: () => ({
    conflict: null, lastData: null, error: '', busy: false, save: mocks.save,
    clearError: mocks.clearError, cancel: mocks.cancel, moveToAnotherDay: mocks.moveToAnotherDay,
    retryWithHours: mocks.retryWithHours, retryWithDate: mocks.retryWithDate, postpone: mocks.postpone,
  }),
}))
import TaskQuickEditDialogs from '../TaskQuickEditDialogs'

afterEach(() => vi.clearAllMocks())

const request = { mode: 'hours', task: { id: 't1', name: 'Llamar proveedores', hours: 2, dueDate: '2099-06-10' }, event: { id: 'e1', date: '2099-06-15' } }

describe('TaskQuickEditDialogs', () => {
  it('rejects unchanged hours and saves a changed estimate', async () => {
    const user = userEvent.setup()
    render(<TaskQuickEditDialogs request={request} onClose={vi.fn()} onDone={vi.fn()} />)
    const input = screen.getByLabelText(/Horas estimadas/)
    await user.clear(input)
    await user.type(input, '2')
    await user.click(screen.getByRole('button', { name: 'Guardar horas' }))
    expect(screen.getByText('Escribe un valor distinto al actual.')).toBeInTheDocument()
    await user.clear(input)
    await user.type(input, '3')
    await user.click(screen.getByRole('button', { name: 'Guardar horas' }))
    expect(mocks.save).toHaveBeenCalledWith({ mode: 'hours', task: request.task, event: request.event }, { estimated_hours: 3 })
  })

  it('closes via cancel and provides the current task context', () => {
    const onClose = vi.fn()
    render(<TaskQuickEditDialogs request={request} onClose={onClose} />)
    expect(screen.getByRole('dialog')).toHaveTextContent('Llamar proveedores')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(mocks.cancel).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
