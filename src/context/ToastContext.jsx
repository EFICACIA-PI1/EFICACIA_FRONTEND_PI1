import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon'

const ToastContext = createContext(null)

const VARIANTS = {
  success: { icon: 'check', cls: 'border-success-border text-success' },
  error: { icon: 'alert', cls: 'border-danger-border text-danger' },
  info: { icon: 'info', cls: 'border-neutral-border text-neutral' },
}

const DURATION_MS = 4000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (type, message) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss]
  )

  const api = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[70] bottom-4 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => {
          const v = VARIANTS[toast.type]
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 bg-white border rounded-xl shadow-lg px-4 py-3 ${v.cls}`}
            >
              <Icon name={v.icon} className="w-5 h-5 mt-0.5" />
              <p className="flex-1 text-sm text-navy">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar notificación"
                className="p-1 -m-1 rounded text-subtle hover:text-navy"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
