import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { AuthShell, FormAlert, PasswordInput } from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { authInputCls, authInputErrorCls } from '../utils/forms'
import usePageTitle from '../hooks/usePageTitle'

export default function LoginPage() {
  usePageTitle('Iniciar sesión')
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/hoy'

  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = {}
    if (!form.username.trim()) next.username = 'Ingresa tu usuario.'
    if (!form.password) next.password = 'Ingresa tu contraseña.'
    setErrors(next)
    setServerError('')
    if (Object.keys(next).length) {
      document.getElementById(next.username ? 'username' : 'password')?.focus()
      return
    }

    setLoading(true)
    try {
      await login(form)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Accede para ver el plan logístico de tus eventos."
      footer={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-primary hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <FormAlert message={serverError} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Usuario" htmlFor="username" error={errors.username}>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoFocus
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            className={errors.username ? authInputErrorCls : authInputCls}
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/recuperar" className="text-sm font-medium text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>
    </AuthShell>
  )
}
