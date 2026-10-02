import { useState } from 'react'
import { authInputCls, authInputErrorCls } from '../utils/forms'
import logoColor from '../assets/Logo/LogoEficacia.webp'

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-white font-body lg:grid lg:grid-cols-2">
      <main className="flex flex-col justify-center px-6 sm:px-12 py-10 min-h-screen">
        <div className="w-full max-w-md mx-auto">
          <img
            src={logoColor}
            alt="Eficacia"
            className="lg:hidden h-24 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-navy font-display text-center">{title}</h1>
          <p className="text-sm text-muted text-center mt-2 mb-8">{subtitle}</p>
          {children}
          <p className="text-sm text-muted text-center mt-8">{footer}</p>
        </div>
      </main>

      <aside
        aria-hidden="true"
        className="hidden lg:flex flex-col items-center justify-center sticky top-0 h-screen bg-gradient-to-br from-primary-dark via-primary to-accent text-white text-center px-12"
      >
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <img src={logoColor} alt="" className="w-72 max-w-full h-auto object-contain" />
        </div>
        <p className="mt-8 text-xl font-display font-medium max-w-xs leading-snug text-white/95">
          Organiza, planifica y gestiona tus eventos con eficacia
        </p>
      </aside>
    </div>
  )
}

export function FormAlert({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="mb-5 rounded-lg border border-danger-border bg-danger-bg text-danger text-sm px-3 py-2.5"
    >
      {message}
    </div>
  )
}

export function PasswordInput({ id, error, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={`${error ? authInputErrorCls : authInputCls} pr-20`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-primary hover:text-primary-dark rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  )
}
