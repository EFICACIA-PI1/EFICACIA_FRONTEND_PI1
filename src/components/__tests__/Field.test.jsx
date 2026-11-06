import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Field from '../Field'

describe('Field', () => {
  it('associates the label and displays required, optional, hint, and error states', () => {
    render(
      <Field label="Correo" htmlFor="email" required optional hint="Usaremos este correo" error="Formato inválido">
        <input id="email" />
      </Field>
    )
    expect(screen.getByLabelText(/Correo/)).toHaveAttribute('id', 'email')
    expect(screen.getByText('Usaremos este correo')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Formato inválido')
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'email-error')
  })
})
