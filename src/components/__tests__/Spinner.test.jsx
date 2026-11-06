import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Spinner from '../Spinner'

describe('Spinner', () => {
  it('renders an accessible-hidden svg with the requested size class', () => {
    const { container } = render(<Spinner className="w-8 h-8" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg')).toHaveClass('animate-spin', 'w-8', 'h-8')
  })
})
