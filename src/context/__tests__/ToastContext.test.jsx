import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import Swal from 'sweetalert2'
import { ToastProvider, useToast } from '../ToastContext'

const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>

describe('ToastContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects useToast outside its provider', () => {
    expect(() => renderHook(() => useToast())).toThrow('useToast debe usarse dentro de ToastProvider')
  })

  it('shows success, error, and info messages with their modal settings', () => {
    const fire = vi.spyOn(Swal, 'fire').mockResolvedValue({})
    document.documentElement.style.setProperty('--color-primary', '#123abc')
    const { result } = renderHook(() => useToast(), { wrapper })

    result.current.success('Guardado')
    expect(fire).toHaveBeenLastCalledWith({
      icon: 'success',
      title: '¡Listo!',
      text: 'Guardado',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#123abc',
      timer: 5000,
      customClass: { popup: 'rounded-2xl' },
    })
    result.current.error('Falló')
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({
      icon: 'error',
      title: 'No se pudo completar',
      text: 'Falló',
      timer: undefined,
    }))
    result.current.info('Aviso')
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({
      icon: 'info',
      title: 'Aviso',
      text: 'Aviso',
      confirmButtonColor: '#123abc',
    }))
    document.documentElement.style.removeProperty('--color-primary')
  })

  it('uses the fallback primary color when no CSS custom property exists', () => {
    document.documentElement.style.removeProperty('--color-primary')
    const fire = vi.spyOn(Swal, 'fire').mockResolvedValue({})
    const { result } = renderHook(() => useToast(), { wrapper })
    result.current.info('Hola')
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ confirmButtonColor: '#0060e0' }))
  })
})
