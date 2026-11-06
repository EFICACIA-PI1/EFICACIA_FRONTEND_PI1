import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TaskDraftList from '../TaskDraftList'

const draft = { key: 'draft-1', name: 'Reservar salón', dueDate: '2099-06-10', hours: '2', note: 'Montaje' }

describe('TaskDraftList', () => {
  it('renders draft values and handles editing, removing, retrying, and adding', () => {
    const onChange = vi.fn(), onRemove = vi.fn(), onRetryDraft = vi.fn(), onAdd = vi.fn()
    render(<TaskDraftList drafts={[draft]} errors={{}} onChange={onChange} onBlur={vi.fn()} retryDraftKey="draft-1"
      onRetryDraft={onRetryDraft} onAdd={onAdd} onRemove={onRemove} />)
    expect(screen.getByDisplayValue('Reservar salón')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Nombre de la tarea/), { target: { value: 'Contratar salón' } })
    expect(onChange).toHaveBeenCalledWith('draft-1', 'name', 'Contratar salón')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar tarea' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar tarea 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    expect(onRetryDraft).toHaveBeenCalledWith('draft-1')
    expect(onRemove).toHaveBeenCalledWith('draft-1')
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('shows validation errors and locks saved drafts against removal', () => {
    render(<TaskDraftList drafts={[draft]} errors={{ 'draft-1': { name: 'Nombre requerido' }}} onChange={vi.fn()}
      onBlur={vi.fn()} savedDraftKeys={['draft-1']} onAdd={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Nombre requerido')
    expect(screen.getByRole('button', { name: 'Quitar tarea 1' })).toBeDisabled()
    expect(screen.getByLabelText(/Nombre de la tarea/)).toBeDisabled()
  })
})
