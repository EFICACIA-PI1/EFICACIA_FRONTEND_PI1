import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CalendarPicker from '../CalendarPicker'

describe('CalendarPicker', () => {
  it('renders the selected month, changes month, and returns a chosen date', () => {
    const onChange = vi.fn()
    render(<CalendarPicker value="2026-03-15" onChange={onChange} />)
    expect(screen.getByRole('heading', { name: /marzo.*2026/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByRole('heading', { name: /abril.*2026/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /15.*abril.*2026/i }))
    expect(onChange).toHaveBeenCalledWith('2026-04-15')
  })

  it('disables dates outside the allowed range and prevents navigation past it', () => {
    render(<CalendarPicker value="2026-03-15" min="2026-03-10" max="2026-03-20" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: '9 de marzo de 2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '21 de marzo de 2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '15 de marzo de 2026' })).toHaveAttribute('aria-pressed', 'true')
  })
})
