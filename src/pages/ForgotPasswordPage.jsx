import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import Icon from '../components/Icon'
import { AuthShell, FormAlert } from '../components/AuthShell'
import { requestPasswordReset } from '../services/authService'
import { authInputCls, authInputErrorCls } from '../utils/forms'
import { validateEmail } from '../utils/validators'
import usePageTitle from '../hooks/usePageTitle'

export default function ForgotPasswordPage() {
  usePageTitle('Recuperar contraseña')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const invalid = validateEmail(email)
    setError(invalid)
    setServerError('')
    if (invalid) {
      document.getElementById('email')?.focus()
      return
    }

    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSentTo(email.trim())
    } catch (err) {
      setServerError(err.fields?.email || err.message)
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <Link to="/login" className="font-medium text-primary hover:underline">
      ← Volver a iniciar sesión
    </Link>
  )

  if (sentTo) {
    return (
      <AuthShell title="Revisa tu correo" subtitle="Si el correo está registrado, te enviamos las instrucciones." footer={footer}>
        <div role="status" className="rounded-xl border border-success-border bg-success-bg px-4 py-5 text-center">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-success mb-3">
            <Icon name="check" className="w-6 h-6" />
          </span>
          <p className="text-sm text-navy leading-relaxed">
            Enviamos un enlace a <strong className="break-all">{sentTo}</strong>. Ábrelo para crear una nueva
            contraseña. Si no lo ves, revisa la carpeta de spam.
          </p>
        </div>
        <Button variant="neutral" size="lg" className="w-full mt-4" onClick={() => setSentTo('')}>
          Usar otro correo
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Escribe tu correo y te enviaremos un enlace para restablecerla."
      footer={footer}
    >
      <FormAlert message={serverError} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Correo electrónico" htmlFor="email" error={error}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            className={error ? authInputErrorCls : authInputCls}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'email-error' : undefined}
          />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </form>
    </AuthShell>
  )
}
