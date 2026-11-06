import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '../api'
import {
  changePassword,
  confirmPasswordReset,
  getMe,
  login,
  logout,
  normalizeUser,
  register,
  requestPasswordReset,
  updateMe,
} from '../authService'

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes users and supplies defaults for optional profile fields', () => {
    expect(normalizeUser({ id: 8, username: 'ana', daily_hours_limit: '4.5' })).toEqual({
      id: 8,
      username: 'ana',
      email: '',
      fullName: '',
      phone: '',
      address: '',
      dailyHoursLimit: 4.5,
    })
    expect(normalizeUser().dailyHoursLimit).toBe(6)
  })

  it('logs in with trimmed username and returns the token', async () => {
    apiFetch.mockResolvedValue({ token: 'tok' })
    await expect(login({ username: ' ana ', password: 'pass' })).resolves.toBe('tok')
    expect(apiFetch).toHaveBeenCalledWith('/auth/login/', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ username: 'ana', password: 'pass' }),
    })
  })

  it('registers a trimmed profile and omits a blank daily limit', async () => {
    apiFetch.mockResolvedValue({ token: 't', user: {} })
    const form = {
      username: ' a ',
      email: ' a@b.com ',
      password: 'pw',
      confirm: 'pw2',
      fullName: ' Ana ',
      phone: ' 123 ',
      dailyHoursLimit: ' ',
    }
    await register(form)
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({
      username: 'a',
      email: 'a@b.com',
      password: 'pw',
      password_confirm: 'pw2',
      full_name: 'Ana',
      phone: '123',
    })
    expect(apiFetch.mock.calls[0][1].auth).toBe(false)
  })

  it('gets and updates the normalized current profile', async () => {
    apiFetch.mockResolvedValueOnce({ id: 1, full_name: 'Ana', daily_hours_limit: 5 })
      .mockResolvedValueOnce({ id: 1, full_name: 'Ana P.', daily_hours_limit: 7 })
    const signal = new AbortController().signal
    await expect(getMe({ signal })).resolves.toMatchObject({ fullName: 'Ana', dailyHoursLimit: 5 })
    expect(apiFetch).toHaveBeenNthCalledWith(1, '/auth/me/', { signal })
    await expect(updateMe({ fullName: ' Ana P. ', phone: ' 123 ', email: ' a@b.co ', dailyHoursLimit: '7' }))
      .resolves.toMatchObject({ fullName: 'Ana P.', dailyHoursLimit: 7 })
    expect(JSON.parse(apiFetch.mock.calls[1][1].body)).toEqual({
      full_name: 'Ana P.',
      phone: '123',
      email: 'a@b.co',
      daily_hours_limit: 7,
    })
  })

  it('logs out and changes password using the expected endpoints', async () => {
    apiFetch.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ token: 'new' })
    await logout()
    expect(apiFetch).toHaveBeenNthCalledWith(1, '/auth/logout/', { method: 'POST' })
    await expect(changePassword({ oldPassword: 'old', newPassword: 'new', confirm: 'new' })).resolves.toBe('new')
    expect(JSON.parse(apiFetch.mock.calls[1][1].body)).toEqual({
      old_password: 'old',
      new_password: 'new',
      new_password_confirm: 'new',
    })
  })

  it('requests and confirms password reset, returning the server detail', async () => {
    apiFetch.mockResolvedValueOnce({ detail: 'sent' }).mockResolvedValueOnce({ detail: 'changed' })
    await expect(requestPasswordReset(' user@example.com ')).resolves.toBe('sent')
    expect(apiFetch.mock.calls[0][1]).toMatchObject({ auth: false, body: JSON.stringify({ email: 'user@example.com' }) })
    await expect(confirmPasswordReset({ uid: 'u', token: 't', newPassword: 'n', confirm: 'n' })).resolves.toBe(
      'changed'
    )
    expect(apiFetch.mock.calls[1][0]).toBe('/auth/password-reset/confirm/')
    expect(JSON.parse(apiFetch.mock.calls[1][1].body)).toEqual({
      uid: 'u',
      token: 't',
      new_password: 'n',
      new_password_confirm: 'n',
    })
  })
})
