import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { AuthShell, FormAlert, PasswordInput } from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { authInputCls, authInputErrorCls } from '../utils/forms'
import usePageTitle from '../hooks/usePageTitle'
import {
  compactErrors,
  validateEmail,
  validateFullName,
  validateNewPassword,
  validatePhone,
  validateRequired,
} from '../utils/validators'

function validate(form) {
  return compactErrors({
    fullName: validateFullName(form.fullName),
    username: validateRequired(form.username, 'Elige un nombre de usuario.'),
    email: validateEmail(form.email),
    phone: validatePhone(form.phone),
    ...validateNewPassword(form.password, form.confirm),
  })
}

// Nombres de campo del backend -> nombres del formulario
const SERVER_FIELDS = {
  full_name: 'fullName',
  password_confirm: 'confirm',
}

export default function SignUpPage() {
  usePageTitle('Crear cuenta')
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/hoy" replace />

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = validate(form)
    setErrors(next)
    setServerError('')
    const firstInvalid = Object.keys(next)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setLoading(true)
    try {
      await register(form)
      navigate('/hoy', { replace: true })
    } catch (err) {
      const fieldErrors = {}
      for (const [key, msg] of Object.entries(err.fields || {})) {
        const mapped = SERVER_FIELDS[key] || key
        if (mapped in form) fieldErrors[mapped] = msg
      }
      setErrors(fieldErrors)
      setServerError(Object.keys(fieldErrors).length ? 'Revisa los campos marcados.' : err.message)
      setLoading(false)
    }
  }

  function textField(id, label, { optional = false, ...props } = {}) {
    return (
      <Field label={label} htmlFor={id} required={!optional} optional={optional} error={errors[id]}>
        <input
          id={id}
          name={id}
          value={form[id]}
          onChange={(e) => update(id, e.target.value)}
          className={errors[id] ? authInputErrorCls : authInputCls}
          aria-invalid={Boolean(errors[id])}
          aria-describedby={errors[id] ? `${id}-error` : undefined}
          {...props}
        />
      </Field>
    )
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Organiza, planifica y programa tus eventos en un solo lugar."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <FormAlert message={serverError} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {textField('fullName', 'Nombre completo', { autoComplete: 'name', autoFocus: true, placeholder: 'Ej. María Pérez' })}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-4">
          {textField('username', 'Usuario', { autoComplete: 'username', placeholder: 'Ej. maria.perez' })}
          {textField('phone', 'Teléfono', { type: 'tel', autoComplete: 'tel', placeholder: '300 123 4567' })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-4">
          {textField('email', 'Correo electrónico', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'correo@ejemplo.com' })}
          {textField('address', 'Dirección', { optional: true, autoComplete: 'street-address', placeholder: 'Calle 10 # 5-20' })}
        </div>
        <Field label="Contraseña" htmlFor="password" required hint="Mínimo 8 caracteres." error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Contraseña"
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
            placeholder="Repite tu contraseña"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            error={errors.confirm}
          />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthShell>
  )
}
