import { apiFetch } from './api'
import { DEFAULT_DAILY_HOURS_LIMIT } from '../utils/tasks'

const json = (body) => JSON.stringify(body)

/** POST /auth/login/ -> token */
export async function login({ username, password }) {
  const data = await apiFetch('/auth/login/', {
    method: 'POST',
    auth: false,
    body: json({ username: username.trim(), password }),
  })
  return data.token
}

/** POST /auth/register/ -> { token, user } */
export async function register(form) {
  return apiFetch('/auth/register/', {
    method: 'POST',
    auth: false,
    body: json({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirm: form.confirm,
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    }),
  })
}

/** POST /auth/logout/ invalida el token en el servidor (204). */
export async function logout() {
  await apiFetch('/auth/logout/', { method: 'POST' })
}

/** GET /auth/me/ */
export async function getMe({ signal } = {}) {
  return normalizeUser(await apiFetch('/auth/me/', { signal }))
}

/** PATCH /auth/me/ — solo full_name, phone, address y email son editables. */
export async function updateMe({ fullName, phone, address, email, dailyHoursLimit }) {
  const data = await apiFetch('/auth/me/', {
    method: 'PATCH',
    body: json({
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      email: email.trim(),
      daily_hours_limit: Number(dailyHoursLimit),
    }),
  })
  return normalizeUser(data)
}

/** POST /auth/change-password/ -> nuevo token (el anterior queda invalidado). */
export async function changePassword({ oldPassword, newPassword, confirm }) {
  const data = await apiFetch('/auth/change-password/', {
    method: 'POST',
    body: json({
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: confirm,
    }),
  })
  return data.token
}

/** POST /auth/password-reset/ — siempre responde 200 con el mismo mensaje. */
export async function requestPasswordReset(email) {
  const data = await apiFetch('/auth/password-reset/', {
    method: 'POST',
    auth: false,
    body: json({ email: email.trim() }),
  })
  return data.detail
}

/** POST /auth/password-reset/confirm/ */
export async function confirmPasswordReset({ uid, token, newPassword, confirm }) {
  const data = await apiFetch('/auth/password-reset/confirm/', {
    method: 'POST',
    auth: false,
    body: json({ uid, token, new_password: newPassword, new_password_confirm: confirm }),
  })
  return data.detail
}

export function normalizeUser(raw = {}) {
  return {
    id: raw.id,
    username: raw.username || '',
    email: raw.email || '',
    fullName: raw.full_name || '',
    phone: raw.phone || '',
    address: raw.address || '',
    dailyHoursLimit: Number(raw.daily_hours_limit ?? DEFAULT_DAILY_HOURS_LIMIT),
  }
}
