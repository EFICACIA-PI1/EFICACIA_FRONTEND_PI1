import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthShell, FormAlert, PasswordInput } from '../AuthShell'

describe('AuthShell y componentes de formulario', () => {
  it('presenta el contenido de autenticación y su pie de página', () => {
    render(<AuthShell title="Iniciar sesión" subtitle="Accede a tu cuenta" footer="¿Necesitas ayuda?"><button>Entrar</button></AuthShell>)
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByText('Accede a tu cuenta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByText('¿Necesitas ayuda?')).toBeInTheDocument()
  })

  it('solo muestra alertas con mensaje', () => {
    const { rerender } = render(<FormAlert />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    rerender(<FormAlert message="Credenciales incorrectas" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Credenciales incorrectas')
  })

  it('permite alternar visibilidad y expone el error del campo', () => {
    render(<PasswordInput id="password" error="Requerida" aria-label="Contraseña" />)
    const input = screen.getByLabelText('Contraseña')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})
