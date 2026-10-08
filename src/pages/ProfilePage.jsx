import { useState } from 'react'
import Button from '../components/Button'
import ChangePasswordCard from '../components/ChangePasswordCard'
import Field from '../components/Field'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { inputCls, inputErrorCls } from '../utils/forms'
import { compactErrors, validateEmail, validateFullName, validatePhone } from '../utils/validators'
import usePageTitle from '../hooks/usePageTitle'

function initialsOf(user) {
  const parts = (user?.fullName || user?.username || '').trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || '').slice(0, 2)
  return letters.toUpperCase() || '?'
}

// Nombres de campo del backend -> nombres del formulario
const SERVER_FIELDS = {
  full_name: 'fullName',
  daily_hours_limit: 'dailyHoursLimit',
}

function ProfileForm({ user, onCancel, onSaved }) {
  const { updateProfile } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    email: user.email,
    dailyHoursLimit: String(user.dailyHoursLimit ?? 6),
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const invalid = compactErrors({
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      dailyHoursLimit:
        Number.isInteger(Number(form.dailyHoursLimit)) &&
        Number(form.dailyHoursLimit) >= 1 &&
        Number(form.dailyHoursLimit) <= 16
          ? ''
          : 'El límite debe ser un número entero entre 1 y 16 horas.',
    })
    setErrors(invalid)
    const first = Object.keys(invalid)[0]
    if (first) {
      document.getElementById(`pf-${first}`)?.focus()
      return
    }

    setLoading(true)
    try {
      await updateProfile(form)
      toast.success('Perfil actualizado.')
      onSaved()
    } catch (err) {
      const fieldErrors = {}
      for (const [key, msg] of Object.entries(err.fields || {})) {
        const mapped = SERVER_FIELDS[key] || key
        if (mapped in form) fieldErrors[mapped] = msg
      }
      setErrors(fieldErrors)
      if (!Object.keys(fieldErrors).length) toast.error(err.message)
      setLoading(false)
    }
  }

  function field(id, label, { required = true, hint, ...props } = {}) {
    return (
      <Field label={label} htmlFor={`pf-${id}`} required={required} optional={!required} hint={hint} error={errors[id]}>
        <input
          id={`pf-${id}`}
          value={form[id]}
          onChange={(e) => update(id, e.target.value)}
          aria-invalid={Boolean(errors[id])}
          aria-required={required}
          aria-describedby={errors[id] ? `pf-${id}-error` : undefined}
          className={errors[id] ? inputErrorCls : inputCls}
          {...props}
        />
      </Field>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
      {field('fullName', 'Nombre completo', { autoComplete: 'name', autoFocus: true })}
      {field('email', 'Correo electrónico', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('phone', 'Teléfono', { type: 'tel', autoComplete: 'tel' })}
        {field('address', 'Dirección', { required: false, autoComplete: 'street-address' })}
      </div>
      {field('dailyHoursLimit', 'Límite diario de horas', {
        type: 'number',
        min: 1,
        max: 16,
        step: 1,
        hint: 'Horas máximas que quieres planificar por día.',
      })}
      <p className="text-xs text-muted">El usuario no se puede modificar.</p>
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <Button type="submit" loading={loading}>
          Guardar cambios
        </Button>
        <Button type="button" variant="neutral" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default function ProfilePage() {
  usePageTitle('Mi perfil')
  const { user, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const rows = [
    { label: 'Nombre completo', value: user?.fullName },
    { label: 'Usuario', value: user?.username },
    { label: 'Correo electrónico', value: user?.email },
    { label: 'Teléfono', value: user?.phone },
    { label: 'Límite diario de horas', value: `${user?.dailyHoursLimit ?? 6} h` },
    { label: 'Dirección', value: user?.address },
  ]

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16 max-w-4xl mx-auto w-full space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-navy font-display">Mi perfil</h1>
      </header>

      <section aria-labelledby="profile-name" className="bg-white rounded-xl border border-edge">
        <div className="p-5 flex items-center gap-4 border-b border-edge">
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-lg font-semibold font-display shrink-0"
            aria-hidden="true"
          >
            {initialsOf(user)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="profile-name" className="text-lg font-semibold text-navy font-display truncate">
              {user?.fullName || user?.username || 'Usuario'}
            </h2>
            <p className="text-sm text-muted truncate">{user?.email || 'Organizador de eventos'}</p>
          </div>
          {!editing && user && (
            <Button variant="neutral" size="sm" onClick={() => setEditing(true)}>
              <Icon name="edit" className="w-4 h-4" />
              Editar
            </Button>
          )}
        </div>

        {!user && <p className="p-5 text-sm text-muted">No pudimos cargar tus datos. Recarga la página.</p>}

        {user && editing && (
          <ProfileForm user={user} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
        )}

        {user && !editing && (
          <dl className="divide-y divide-edge">
            {rows.map((row) => (
              <div key={row.label} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
                <dt className="sm:w-48 text-sm font-semibold text-gray-700">{row.label}</dt>
                <dd className="text-sm text-muted break-words">{row.value || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <ChangePasswordCard />

      <div>
        <Button variant="neutral" onClick={handleLogout} loading={loggingOut}>
          <Icon name="logout" className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
