import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TaskDraftList from '../TaskDraftList'

const drafts = [
  { key: 'd1', name: 'Reservar salón', dueDate: '2099-06-10', hours: '2', note: '' },
  { key: 'd2', name: 'Contratar catering', dueDate: '2099-06-12', hours: '3', note: 'Menú vegetariano' },
]

function renderList(props = {}) {
  const handlers = { onChange: vi.fn(), onBlur: vi.fn(), onAdd: vi.fn(), onRemove: vi.fn(), onRetryDraft: vi.fn() }
  const utils = render(<TaskDraftList drafts={drafts} errors={{}} focusDateKey={null} {...handlers} {...props} />)
  return { ...utils, ...handlers }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TaskDraftList (extra)', () => {
  it('reports every field change and blur with the draft key and field name', () => {
    const { onChange, onBlur } = renderList()
    const [dueDate] = screen.getAllByLabelText(/Fecha límite/)
    const [, hours] = screen.getAllByLabelText(/Horas estimadas/)
    const [, note] = screen.getAllByLabelText(/Nota/)
    const [name] = screen.getAllByLabelText(/Nombre de la tarea/)

    fireEvent.change(dueDate, { target: { value: '2099-07-01' } })
    fireEvent.change(hours, { target: { value: '4.5' } })
    fireEvent.change(note, { target: { value: 'Llevar contrato' } })
    expect(onChange).toHaveBeenCalledWith('d1', 'dueDate', '2099-07-01')
    expect(onChange).toHaveBeenCalledWith('d2', 'hours', '4.5')
    expect(onChange).toHaveBeenCalledWith('d2', 'note', 'Llevar contrato')

    fireEvent.blur(name)
    fireEvent.blur(dueDate)
    fireEvent.blur(hours)
    expect(onBlur).toHaveBeenNthCalledWith(1, 'd1', 'name')
    expect(onBlur).toHaveBeenNthCalledWith(2, 'd1', 'dueDate')
    expect(onBlur).toHaveBeenNthCalledWith(3, 'd2', 'hours')
  })

  it('marks only the fields with errors as invalid and links them to their message', () => {
    renderList({ errors: { d2: { dueDate: 'Elige una fecha.', hours: 'Las horas deben ser mayores a 0.' } } })
    const [firstDate, secondDate] = screen.getAllByLabelText(/Fecha límite/)
    const [firstHours, secondHours] = screen.getAllByLabelText(/Horas estimadas/)

    expect(secondDate).toHaveAttribute('aria-invalid', 'true')
    expect(secondDate).toHaveAttribute('aria-describedby', 'tk-d2-dueDate-error')
    expect(secondHours).toHaveAttribute('aria-describedby', 'tk-d2-hours-error')
    expect(firstDate).toHaveAttribute('aria-invalid', 'false')
    expect(firstHours).not.toHaveAttribute('aria-describedby')
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Elige una fecha.',
      'Las horas deben ser mayores a 0.',
    ])
  })

  it('locks every input of a saved draft but keeps the others editable', () => {
    renderList({ savedDraftKeys: ['d1'] })
    const firstRow = ['Nombre de la tarea', 'Fecha límite', 'Horas estimadas', 'Nota']
      .map((label) => screen.getAllByLabelText(new RegExp(label))[0])
    firstRow.forEach((input) => expect(input).toBeDisabled())
    expect(screen.getAllByLabelText(/Nota/)[1]).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Quitar tarea 2' })).toBeEnabled()
  })

  it('only shows the retry button on the draft that failed', () => {
    const { onRetryDraft } = renderList({ retryDraftKey: 'd2' })
    const retry = screen.getAllByRole('button', { name: 'Reintentar tarea' })
    expect(retry).toHaveLength(1)
    fireEvent.click(retry[0])
    expect(onRetryDraft).toHaveBeenCalledWith('d2')
  })

  it('renders no list when there are no drafts and still allows adding one', () => {
    const { onAdd } = renderList({ drafts: [] })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('focuses the due date of the requested draft on the next animation frame', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 7
    })
    renderList({ focusDateKey: 'd2', focusDateRequest: 1 })
    expect(screen.getAllByLabelText(/Fecha límite/)[1]).toHaveFocus()
  })

  it('does not schedule focus without a target and cancels a pending frame on unmount', () => {
    const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const { unmount } = renderList()
    expect(request).not.toHaveBeenCalled()
    unmount()

    const second = renderList({ focusDateKey: 'd1', focusDateRequest: 1 })
    expect(request).toHaveBeenCalledTimes(1)
    second.unmount()
    expect(cancel).toHaveBeenCalledWith(42)
  })
})
