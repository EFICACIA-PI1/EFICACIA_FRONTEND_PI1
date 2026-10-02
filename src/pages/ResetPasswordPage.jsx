import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { AuthShell, FormAlert, PasswordInput } from '../components/AuthShell'
import { useToast } from '../context/ToastContext'
import { confirmPasswordReset } from '../services/authService'
import { validateNewPassword } from '../utils/validators'
import usePageTitle from '../hooks/usePageTitle'

export default function ResetPasswordPage() {
  usePageTitle('Nueva contraseña')
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = validateNewPassword(form.password, form.confirm)
    setErrors(next)
    setServerError('')
    const firstInvalid = Object.keys(next)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setLoading(true)
    try {
      await confirmPasswordReset({ uid, token, newPassword: form.password, confirm: form.confirm })
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.')
      navigate('/login', { replace: true })
    } catch (err) {
      const fieldErrors = {}
      if (err.fields?.new_password) fieldErrors.password = err.fields.new_password
      if (err.fields?.new_password_confirm) fieldErrors.confirm = err.fields.new_password_confirm
      setErrors(fieldErrors)
      setServerError(Object.keys(fieldErrors).length ? 'Revisa los campos marcados.' : err.message)
      setLoading(false)
    }
  }

  // Sin uid/token el enlace está incompleto: no tiene sentido mostrar el formulario.
  if (!uid || !token) {
    return (
      <AuthShell
        title="Enlace no válido"
        subtitle="El enlace de recuperación está incompleto o ya expiró."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            ← Volver a iniciar sesión
          </Link>
        }
      >
        <Link
          to="/recuperar"
          className="flex items-center justify-center w-full rounded-lg font-semibold text-sm px-6 py-3 bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          Solicitar un nuevo enlace
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Crea una nueva contraseña"
      subtitle="Elige una contraseña segura que no hayas usado antes."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          ← Volver a iniciar sesión
        </Link>
      }
    >
      <FormAlert message={serverError} />
      {serverError && !Object.keys(errors).length && (
        <p className="-mt-2 mb-4 text-sm text-center">
          <Link to="/recuperar" className="font-medium text-primary hover:underline">
            Solicitar un nuevo enlace
          </Link>
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Nueva contraseña" htmlFor="password" required hint="Mínimo 8 caracteres." error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            autoFocus
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
          />
        </Field>
        <Field label="Confirmar contraseña" htmlFor="confirm" required error={errors.confirm}>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            error={errors.confirm}
          />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </form>
    </AuthShell>
  )
}
