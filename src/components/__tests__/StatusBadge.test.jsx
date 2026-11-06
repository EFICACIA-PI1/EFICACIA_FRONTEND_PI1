import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from '../StatusBadge'

describe('StatusBadge', () => {
  it.each([
    [{ done: true, dueDate: '2099-01-01' }, 'Hecha'],
    [{ state: 'pospuesta', dueDate: '2099-01-01' }, 'Pospuesta'],
    [{ dueDate: '2099-01-01' }, 'Pendiente'],
    [{ dueDate: '2000-01-01' }, 'Vencida'],
  ])('shows status derived from task data', (task, label) => {
    render(<StatusBadge task={task} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
