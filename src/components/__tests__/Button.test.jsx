import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Button from '../Button'

describe('Button', () => {
  it('renders children, forwards button props and calls its handler', () => {
    const onClick = vi.fn()
    render(<Button aria-label="Guardar" onClick={onClick}>Guardar</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows a spinner and disables itself while loading', () => {
    render(<Button loading>Guardando</Button>)
    expect(screen.getByRole('button', { name: 'Guardando' })).toBeDisabled()
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
