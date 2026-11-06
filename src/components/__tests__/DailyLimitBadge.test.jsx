import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ user: { dailyHoursLimit: 8 } }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }))
import DailyLimitBadge from '../DailyLimitBadge'

afterEach(() => { mocks.user = { dailyHoursLimit: 8 }; vi.clearAllMocks() })

describe('DailyLimitBadge', () => {
  it('shows the account limit and opens its tooltip on hover', () => {
    render(<DailyLimitBadge />)
    const badge = screen.getByRole('button', { name: 'Límite diario: 8 h' })
    expect(screen.getByRole('tooltip')).toHaveClass('hidden')
    fireEvent.pointerEnter(badge, { pointerType: 'mouse' })
    expect(screen.getByRole('tooltip')).not.toHaveClass('hidden')
    expect(badge).toHaveAttribute('aria-expanded', 'true')
    fireEvent.pointerLeave(badge, { pointerType: 'mouse' })
    expect(screen.getByRole('tooltip')).toHaveClass('hidden')
  })

  it('renders nothing when no daily limit is available', () => {
    mocks.user = null
    const { container } = render(<DailyLimitBadge />)
    expect(container).toBeEmptyDOMElement()
  })
})
