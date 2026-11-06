import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProgressBar from '../ProgressBar'

describe('ProgressBar', () => {
  it('rounds and clamps the accessible value and applies it to the fill', () => {
    const { rerender, container } = render(<ProgressBar percent={42.6} label="Avance del evento" />)
    expect(screen.getByRole('progressbar', { name: 'Avance del evento' })).toHaveAttribute('aria-valuenow', '43')
    expect(container.querySelector('[style*="width"]')).toHaveStyle({ width: '43%' })
    rerender(<ProgressBar percent={150} label="Avance del evento" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })
})
