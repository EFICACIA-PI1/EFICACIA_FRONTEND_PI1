
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Modal from '../Modal'

describe('Modal - pruebas adicionales de accesibilidad', () => {
  it('coloca el foco inicial en el elemento indicado', () => {
    const initialFocusRef = { current: null }

    render(
      <>
        <button>Botón externo</button>
        <Modal
          open
          onClose={vi.fn()}
          initialFocusRef={initialFocusRef}
        >
          <button ref={initialFocusRef}>Foco inicial</button>
        </Modal>
      </>
    )

    expect(initialFocusRef.current).toHaveFocus()
  })

  it('mueve el foco al primer elemento cuando Tab está en el último', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <button>Primero</button>
        <button>Último</button>
      </Modal>
    )

    const first = screen.getByRole('button', { name: 'Primero' })
    const last = screen.getByRole('button', { name: 'Último' })

    last.focus()

    fireEvent.keyDown(document, { key: 'Tab' })

    expect(first).toHaveFocus()
  })

  it('mueve el foco al último elemento cuando Shift+Tab está en el primero', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <button>Primero</button>
        <button>Último</button>
      </Modal>
    )

    const first = screen.getByRole('button', { name: 'Primero' })
    const last = screen.getByRole('button', { name: 'Último' })

    first.focus()

    fireEvent.keyDown(document, {
      key: 'Tab',
      shiftKey: true,
    })

    expect(last).toHaveFocus()
  })


it('restaura el foco al elemento que estaba activo antes de abrir', () => {
  const externalButton = document.createElement('button')
  externalButton.textContent = 'Externo'
  document.body.appendChild(externalButton)

  externalButton.focus()

  const { unmount } = render(
    <Modal open onClose={vi.fn()}>
      <button>Interno</button>
    </Modal>
  )

  // Al abrir, el modal enfoca su panel, no el botón interno.
  expect(document.activeElement).not.toBe(externalButton)

  // Al desmontar, debe restaurar el foco externo.
  unmount()

  expect(externalButton).toHaveFocus()

  externalButton.remove()
})


  it('expone los atributos de accesibilidad y el ancho personalizado', () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        labelledBy="titulo-extra"
        describedBy="descripcion-extra"
        maxWidth="max-w-xl"
      >
        <h2 id="titulo-extra">Título accesible</h2>
        <p id="descripcion-extra">Descripción accesible</p>
      </Modal>
    )

    const dialog = screen.getByRole('dialog', {
      name: 'Título accesible',
    })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-describedby', 'descripcion-extra')
    expect(dialog.firstChild.nextSibling).toHaveClass('max-w-xl')
  })
})
