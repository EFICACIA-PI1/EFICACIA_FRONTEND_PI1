import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import OverloadConflictModal from '../OverloadConflictModal'

const conflict = { date: '2026-06-10', planned_hours: 9, limit_hours: 8, excess_hours: 1, max_hours_for_this_task: 3 }

describe('OverloadConflictModal', () => {
  it('offers the suggested day and reports the chosen date', () => {
    const onUseSuggestedDay = vi.fn()
    render(<OverloadConflictModal open conflict={{ ...conflict, suggested_day: '2026-06-11' }} currentHours={2}
      taskName="Llamar proveedores" onUseSuggestedDay={onUseSuggestedDay} onMoveToAnotherDay={vi.fn()}
      onReduceHours={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('dialog')).toHaveTextContent('Llamar proveedores')
    fireEvent.click(screen.getByRole('button', { name: /Mover al/ }))
    expect(onUseSuggestedDay).toHaveBeenCalledWith('2026-06-11')
  })

  it('validates a reduced estimate and submits the value', async () => {
    const user = userEvent.setup()
    const onReduceHours = vi.fn()
    render(<OverloadConflictModal open conflict={conflict} currentHours={4} onReduceHours={onReduceHours}
      onMoveToAnotherDay={vi.fn()} onCancel={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Reducir horas estimadas' }))
    const hours = screen.getByLabelText('Horas estimadas')
    await user.clear(hours)
    await user.type(hours, '2.5')
    await user.click(screen.getByRole('button', { name: 'Aplicar horas' }))
    expect(onReduceHours).toHaveBeenCalledWith(2.5)
  })
})
