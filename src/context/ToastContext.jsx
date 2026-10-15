import { createContext, useContext, useMemo } from 'react'
import Swal from 'sweetalert2'

const ToastContext = createContext(null)

const SUCCESS_AUTOCLOSE_MS = 5000

function primaryColor() {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#0060e0'
  } catch {
    return '#0060e0'
  }
}

function showModal({ icon, title, message, autoClose = false }) {
  return Swal.fire({
    icon,
    title,
    text: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: primaryColor(),
    timer: autoClose ? SUCCESS_AUTOCLOSE_MS : undefined,
    customClass: { popup: 'rounded-2xl' },
  })
}

/**
 * Mantiene la API `toast.success/error/info`, pero los avisos se muestran como modales
 * de SweetAlert2. Un aviso nuevo reemplaza al anterior si aún está abierto.
 */
export function ToastProvider({ children }) {
  const api = useMemo(
    () => ({
      success: (message) => {
        showModal({ icon: 'success', title: '¡Listo!', message, autoClose: true })
      },
      error: (message) => {
        showModal({ icon: 'error', title: 'No se pudo completar', message })
      },
      info: (message) => {
        showModal({ icon: 'info', title: 'Aviso', message })
      },
    }),
    []
  )

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
