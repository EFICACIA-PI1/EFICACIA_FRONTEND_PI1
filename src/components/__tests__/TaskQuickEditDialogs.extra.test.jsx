
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  clearError: vi.fn(),
  cancel: vi.fn(),
  moveToAnotherDay: vi.fn(),
  retryWithHours: vi.fn(),
  retryWithDate: vi.fn(),
  postpone: vi.fn(),
  success: vi.fn(),
  getPlannedHours: vi.fn(),
  conflict: null,
  error: '',
  busy: false,
  lastData: null,
  flowOptions: null,
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { dailyHoursLimit: 8 } }),
}))

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ success: mocks.success }),
}))

vi.mock('../../hooks/useRescheduleFlow', () => ({
  default: (options) => {
    mocks.flowOptions = options
    return {
      conflict: mocks.conflict,
      lastData: mocks.lastData,
      error: mocks.error,
      busy: mocks.busy,
      save: mocks.save,
      clearError: mocks.clearError,
      cancel: mocks.cancel,
      moveToAnotherDay: mocks.moveToAnotherDay,
      retryWithHours: mocks.retryWithHours,
      retryWithDate: mocks.retryWithDate,
      postpone: mocks.postpone,
    }
  },
}))

vi.mock('../../services/todayApi', () => ({
  getPlannedHoursForDate: mocks.getPlannedHours,
}))

vi.mock('../CalendarPicker', () => ({
  default: ({ value, onChange }) => (
    <div>
      <p>Fecha seleccionada: {value}</p>
      <button
        type="button"
        onClick={() => onChange('2099-06-12')}
      >
        Elegir 2099-06-12
      </button>
      <button
        type="button"
        onClick={() => onChange('2099-06-15')}
      >
        Elegir 2099-06-15
      </button>
    </div>
  ),
}))


vi.mock('../OverloadConflictModal', () => ({
  default: ({
    open,
    onMoveToAnotherDay,
    onReduceHours,
    onUseSuggestedDay,
    onPostpone,
    onCancel,
  }) =>
    open ? (
      <div role="dialog" aria-label="Conflicto de sobrecarga">
        <button
          type="button"
          onClick={() => {
            mocks.conflict = null
            onMoveToAnotherDay()
          }}
        >
          Mover a otro día
        </button>

        <button type="button" onClick={onReduceHours}>
          Reducir horas
        </button>

        <button type="button" onClick={onUseSuggestedDay}>
          Usar fecha sugerida
        </button>

        <button type="button" onClick={onPostpone}>
          Posponer
        </button>

        <button type="button" onClick={onCancel}>
          Cancelar conflicto
        </button>
      </div>
    ) : null,
}))


import TaskQuickEditDialogs from '../TaskQuickEditDialogs'

const requestHours = {
  mode: 'hours',
  task: {
    id: 't1',
    name: 'Llamar proveedores',
    hours: 2,
    dueDate: '2099-06-10',
  },
  event: {
    id: 'e1',
    date: '2099-06-15',
  },
}

const requestDate = {
  ...requestHours,
  mode: 'date',
}

function renderDialog(request = requestHours, props = {}) {
  const onClose = props.onClose ?? vi.fn()
  const onDone = props.onDone ?? vi.fn()

  render(
    <TaskQuickEditDialogs
      request={request}
      onClose={onClose}
      onDone={onDone}
    />,
  )

  return { onClose, onDone }
}

describe('TaskQuickEditDialogs - pruebas adicionales', () => {
  beforeEach(() => {
    mocks.conflict = null
    mocks.error = ''
    mocks.busy = false
    mocks.lastData = null
    mocks.flowOptions = null
    mocks.getPlannedHours.mockResolvedValue(3)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Modificar horas', () => {
    it('muestra error cuando las horas están vacías', async () => {
      const user = userEvent.setup()
      renderDialog()

      const input = screen.getByLabelText(/Horas estimadas/)
      await user.clear(input)

      await user.click(
        screen.getByRole('button', { name: 'Guardar horas' }),
      )

      expect(
        screen.getByText('Escribe las horas estimadas.'),
      ).toBeInTheDocument()

      expect(mocks.save).not.toHaveBeenCalled()
    })

    it('rechaza horas iguales a cero o negativas', async () => {
      const user = userEvent.setup()
      renderDialog()

      const input = screen.getByLabelText(/Horas estimadas/)
      await user.clear(input)
      await user.type(input, '0')

      await user.click(
        screen.getByRole('button', { name: 'Guardar horas' }),
      )

      expect(
        screen.getByText(
          'Las horas estimadas deben ser mayores que 0.',
        ),
      ).toBeInTheDocument()

      expect(mocks.save).not.toHaveBeenCalled()
    })

    it('rechaza un valor igual al número de horas actual', async () => {
      const user = userEvent.setup()
      renderDialog()

      const input = screen.getByLabelText(/Horas estimadas/)
      await user.clear(input)
      await user.type(input, '2')

      await user.click(
        screen.getByRole('button', { name: 'Guardar horas' }),
      )

      expect(
        screen.getByText(
          'Escribe un valor distinto al actual.',
        ),
      ).toBeInTheDocument()

      expect(mocks.save).not.toHaveBeenCalled()
    })

    it('limpia el error al cambiar el campo y guarda las horas nuevas', async () => {
      const user = userEvent.setup()
      renderDialog()

      const input = screen.getByLabelText(/Horas estimadas/)
      await user.clear(input)

      await user.click(
        screen.getByRole('button', { name: 'Guardar horas' }),
      )

      expect(
        screen.getByText('Escribe las horas estimadas.'),
      ).toBeInTheDocument()

      await user.type(input, '3')

      expect(
        screen.queryByText('Escribe las horas estimadas.'),
      ).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: 'Guardar horas' }),
      )

      expect(mocks.save).toHaveBeenCalledWith(
        {
          mode: 'hours',
          task: requestHours.task,
          event: requestHours.event,
        },
        {
          estimated_hours: 3,
        },
      )
    })

    it('cancela el flujo y cierra el diálogo', () => {
      const onClose = vi.fn()
      renderDialog(requestHours, { onClose })

      fireEvent.click(
        screen.getByRole('button', { name: 'Cancelar' }),
      )

      expect(mocks.cancel).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('muestra el error del flujo cuando existe', () => {
      mocks.error = 'No fue posible guardar'
      renderDialog()

      expect(
        screen.getByText('No fue posible guardar'),
      ).toBeInTheDocument()

      expect(
        screen.getByLabelText(/Horas estimadas/),
      ).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Reprogramar fecha', () => {
    it('consulta las horas y muestra confirmación cuando no supera el límite', async () => {
      const user = userEvent.setup()
      renderDialog(requestDate)

      await user.click(
        screen.getByRole('button', {
          name: 'Elegir 2099-06-12',
        }),
      )

      await user.click(
        screen.getByRole('button', {
          name: 'Reprogramar',
        }),
      )

      await waitFor(() => {
        expect(mocks.getPlannedHours).toHaveBeenCalledWith(
          '2099-06-12',
          {
            excludeTaskId: requestDate.task.id,
          },
        )
      })

      expect(
        await screen.findByRole('heading', {
          name: '¿Estás seguro?',
        }),
      ).toBeInTheDocument()

      expect(screen.getByText(/Quedarías con/)).toHaveTextContent('5')
      expect(mocks.save).not.toHaveBeenCalled()
    })

    it('confirma la reprogramación y guarda la fecha seleccionada', async () => {
      const user = userEvent.setup()
      renderDialog(requestDate)

      await user.click(
        screen.getByRole('button', {
          name: 'Elegir 2099-06-12',
        }),
      )

      await user.click(
        screen.getByRole('button', {
          name: 'Reprogramar',
        }),
      )

      await screen.findByRole('button', { name: 'Aceptar' })

      await user.click(
        screen.getByRole('button', { name: 'Aceptar' }),
      )

      expect(mocks.save).toHaveBeenCalledWith(
        {
          mode: 'date',
          task: requestDate.task,
          event: requestDate.event,
        },
        {
          due_date: '2099-06-12',
        },
      )
    })

    it('guarda directamente si las horas planificadas superan el límite diario', async () => {
      const user = userEvent.setup()
      mocks.getPlannedHours.mockResolvedValue(7)

      renderDialog(requestDate)

      await user.click(
        screen.getByRole('button', {
          name: 'Elegir 2099-06-12',
        }),
      )

      await user.click(
        screen.getByRole('button', {
          name: 'Reprogramar',
        }),
      )

      await waitFor(() => {
        expect(mocks.save).toHaveBeenCalledWith(
          {
            mode: 'date',
            task: requestDate.task,
            event: requestDate.event,
          },
          {
            due_date: '2099-06-12',
          },
        )
      })

      expect(
        screen.queryByRole('heading', {
          name: '¿Estás seguro?',
        }),
      ).not.toBeInTheDocument()
    })

    it('continúa con el guardado si falla la consulta previa de horas', async () => {
      const user = userEvent.setup()

      mocks.getPlannedHours.mockRejectedValue(
        new Error('Error de consulta'),
      )

      renderDialog(requestDate)

      await user.click(
        screen.getByRole('button', {
          name: 'Elegir 2099-06-12',
        }),
      )

      await user.click(
        screen.getByRole('button', {
          name: 'Reprogramar',
        }),
      )

      await waitFor(() => {
        expect(mocks.save).toHaveBeenCalledWith(
          {
            mode: 'date',
            task: requestDate.task,
            event: requestDate.event,
          },
          {
            due_date: '2099-06-12',
          },
        )
      })
    })

    it('no permite reprogramar si la fecha seleccionada es la actual', () => {
      const sameDateRequest = {
        ...requestDate,
        task: {
          ...requestDate.task,
          dueDate: '2099-06-15',
        },
      }

      renderDialog(sameDateRequest)

      expect(
        screen.getByRole('button', { name: 'Reprogramar' }),
      ).toBeDisabled()
    })

    it('muestra una alerta y oculta el calendario si el evento ya pasó', () => {
      const pastEventRequest = {
        ...requestDate,
        event: {
          ...requestDate.event,
          date: '2000-01-01',
        },
      }

      renderDialog(pastEventRequest)

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Este evento ya pasó',
      )

      expect(
        screen.queryByText('Fecha seleccionada:'),
      ).not.toBeInTheDocument()

      expect(
        screen.queryByRole('button', {
          name: 'Reprogramar',
        }),
      ).not.toBeInTheDocument()
    })

    it('permite volver de la confirmación al calendario', async () => {
      const user = userEvent.setup()
      renderDialog(requestDate)

      await user.click(
        screen.getByRole('button', {
          name: 'Elegir 2099-06-12',
        }),
      )

      await user.click(
        screen.getByRole('button', {
          name: 'Reprogramar',
        }),
      )

      await user.click(
        await screen.findByRole('button', {
          name: 'Cancelar',
        }),
      )

      expect(
        screen.getByRole('heading', {
          name: 'Reprogramar tarea',
        }),
      ).toBeInTheDocument()

      expect(mocks.save).not.toHaveBeenCalled()
    })

    
it('incluye las horas nuevas al reprogramar desde el modo horas', async () =>  {
  const user = userEvent.setup()

  mocks.conflict = { message: 'Sobrecarga' }

  renderDialog(requestHours)

  await user.click(
    screen.getByRole('button', {
      name: 'Mover a otro día',
    }),
  )

  await user.click(
    screen.getByRole('button', {
      name: 'Elegir 2099-06-12',
    }),
  )

  await user.click(
    screen.getByRole('button', {
      name: 'Reprogramar',
    }),
  )

  await screen.findByRole('button', {
    name: 'Aceptar',
  })

  await user.click(
    screen.getByRole('button', {
      name: 'Aceptar',
    }),
  )

  expect(mocks.save).toHaveBeenCalledWith(
    {
      mode: 'date',
      task: requestHours.task,
      event: requestHours.event,
    },
    {
      due_date: '2099-06-12',
      estimated_hours: 2,
    },
  )
})

  })

  describe('Conflicto y callbacks del flujo', () => {
    
it('mueve la tarea a otro día desde el modal de conflicto', () => {
  mocks.conflict = { message: 'Sobrecarga' }

  const onClose = vi.fn()

  renderDialog(requestDate, { onClose })

  fireEvent.click(
    screen.getByRole('button', {
      name: 'Mover a otro día',
    }),
  )

  expect(mocks.moveToAnotherDay).toHaveBeenCalledTimes(1)
  expect(mocks.clearError).toHaveBeenCalledTimes(1)
  expect(onClose).not.toHaveBeenCalled()
})

    it('ejecuta las acciones del conflicto disponibles', () => {
      mocks.conflict = { message: 'Sobrecarga' }
      const onClose = vi.fn()

      renderDialog(requestDate, { onClose })

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Reducir horas',
        }),
      )

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Usar fecha sugerida',
        }),
      )

      fireEvent.click(
        screen.getByRole('button', { name: 'Posponer' }),
      )

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Cancelar conflicto',
        }),
      )

      expect(mocks.retryWithHours).toHaveBeenCalledTimes(1)
      expect(mocks.retryWithDate).toHaveBeenCalledTimes(1)
      expect(mocks.postpone).toHaveBeenCalledTimes(1)
      expect(mocks.cancel).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    
it('muestra confirmación cuando el flujo informa un error 400 en modo fecha', async () => {
  const user = userEvent.setup()

  renderDialog(requestDate)

  await user.click(
    screen.getByRole('button', {
      name: 'Elegir 2099-06-12',
    }),
  )

  await act(async () => {
    mocks.flowOptions.onError(
      { status: 400 },
      { mode: 'date' },
    )
  })

  expect(
    await screen.findByRole('heading', {
      name: '¿Estás seguro?',
    }),
  ).toBeInTheDocument()
})


    it('ejecuta callbacks de éxito para horas y fecha', async () => {
      const onClose = vi.fn()
      const onDone = vi.fn()

      renderDialog(requestHours, { onClose, onDone })

      await mocks.flowOptions.onSuccess({
        mode: 'hours',
        data: { estimated_hours: 4 },
      })

      expect(mocks.success).toHaveBeenCalledWith(
         'Horas estimadas actualizadas a 4 h.',
     )

      expect(onDone).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('ejecuta el callback de éxito para reprogramación y posposición', async () => {
      const onClose = vi.fn()
      const onDone = vi.fn()

      renderDialog(requestDate, { onClose, onDone })

      await mocks.flowOptions.onSuccess({
        mode: 'date',
        data: { due_date: '2099-06-12' },
      })

      expect(mocks.success).toHaveBeenCalledWith(
        expect.stringContaining('Tarea reprogramada para el'),
      )

      expect(onDone).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)

      await mocks.flowOptions.onPostponed()

      expect(mocks.success).toHaveBeenCalledWith(
        'Tarea pospuesta. Su fecha y horas no cambiaron.',
      )
    })
  })
})
