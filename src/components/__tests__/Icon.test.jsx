import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Icon from '../Icon'

describe('Icon', () => {
  it('renders a known icon as decorative and accepts styling props', () => {
    const { container } = render(<Icon name="check" className="custom-icon" data-testid="icon" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveClass('shrink-0', 'custom-icon')
    expect(svg).toHaveAttribute('data-testid', 'icon')
  })

  it('renders nothing for an unknown semantic name', () => {
    const { container } = render(<Icon name="missing" />)
    expect(container).toBeEmptyDOMElement()
  })
})
