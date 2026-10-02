import { useState } from 'react'
import Button from './Button'
import Field from './Field'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { inputCls, inputErrorCls } from '../utils/forms'
import { validateNewPassword, validateRequired } from '../utils/validators'

const EMPTY = { oldPassword: '', password: '', confirm: '' }

export default function ChangePasswordCard() {
  const { changePassword } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function close() {
    setOpen(false)
    setForm(EMPTY)
    setErrors({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = {
      oldPassword: validateRequired(form.oldPassword, 'Ingresa tu contraseña actual.'),
      ...validateNewPassword(form.password, form.confirm),
    }
    const invalid = Object.fromEntries(Object.entries(next).filter(([, msg]) => msg))
    setErrors(invalid)
    const first = Object.keys(invalid)[0]
    if (first) {
      document.getElementById(`cp-${first}`)?.focus()
      return
    }

    setLoading(true)
    try {
      await changePassword({ oldPassword: form.oldPassword, newPassword: form.password, confirm: form.confirm })
      toast.success('Contraseña actualizada.')
      close()
    } catch (err) {
      const fieldErrors = {
        oldPassword: err.fields?.old_password,
        password: err.fields?.new_password,
        confirm: err.fields?.new_password_confirm,
      }
      setErrors(fieldErrors)
      // Sin errores por campo (red, límite de intentos…) se avisa con un toast.
      if (!Object.values(fieldErrors).some(Boolean)) toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  function passwordField(id, name, label, props = {}) {
    return (
      <Field label={label} htmlFor={`cp-${id}`} required error={errors[id]} {...props.field}>
        <input
          id={`cp-${id}`}
          type="password"
          autoComplete={name}
          value={form[id]}
          onChange={(e) => update(id, e.target.value)}
          aria-invalid={Boolean(errors[id])}
          aria-describedby={errors[id] ? `cp-${id}-error` : undefined}
          className={errors[id] ? inputErrorCls : inputCls}
        />
      </Field>
    )
  }

  return (
    <section aria-labelledby="password-heading" className="bg-white rounded-xl border border-edge">
      <div className="p-5 flex items-center justify-between gap-3">
        <div>
          <h2 id="password-heading" className="text-base font-semibold text-navy font-display">
            Contraseña
          </h2>
          <p className="text-sm text-muted mt-0.5">Cámbiala periódicamente para mantener tu cuenta segura.</p>
        </div>
        {!open && (
          <Button variant="neutral" size="sm" onClick={() => setOpen(true)}>
            Cambiar contraseña
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} noValidate className="px-5 pb-5 space-y-4 border-t border-edge pt-5">
          {passwordField('oldPassword', 'current-password', 'Contraseña actual')}
          {passwordField('password', 'new-password', 'Nueva contraseña', {
            field: { hint: 'Mínimo 8 caracteres.' },
          })}
          {passwordField('confirm', 'new-password', 'Confirmar nueva contraseña')}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button type="submit" loading={loading}>
              Guardar contraseña
            </Button>
            <Button type="button" variant="neutral" onClick={close} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
