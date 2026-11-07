import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const authMocks = vi.hoisted(() => ({
  token: null,
  getToken: vi.fn(),
  setToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  updateMe: vi.fn(),
  changePassword: vi.fn(),
  normalizeUser: vi.fn((user) => ({ id: user?.id, username: user?.username || '', dailyHoursLimit: 6 })),
}))

vi.mock('../../services/api', () => ({
  getToken: authMocks.getToken,
  setToken: authMocks.setToken,
  setUnauthorizedHandler: authMocks.setUnauthorizedHandler,
}))
vi.mock('../../services/authService', () => ({
  login: authMocks.login,
  register: authMocks.register,
  logout: authMocks.logout,
  getMe: authMocks.getMe,
  updateMe: authMocks.updateMe,
  changePassword: authMocks.changePassword,
  normalizeUser: authMocks.normalizeUser,
}))

import { AuthProvider, useAuth } from '../AuthContext'

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authMocks.token = null
    authMocks.getToken.mockImplementation(() => authMocks.token)
    authMocks.setToken.mockImplementation((token) => {
      authMocks.token = token || null
      if (token) localStorage.setItem('eficacia.token', token)
      else localStorage.removeItem('eficacia.token')
    })
    authMocks.normalizeUser.mockImplementation((user) => ({
      id: user?.id,
      username: user?.username || '',
      dailyHoursLimit: 6,
    }))
  })

  it('rejects useAuth outside its provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe usarse dentro de AuthProvider')
  })

  it('logs in, fetches the profile, and persists the session and cached user', async () => {
    authMocks.login.mockResolvedValue('token-1')
    authMocks.getMe.mockResolvedValue({ id: 1, username: 'ana' })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => result.current.login({ username: 'ana', password: 'pass' }))
    expect(authMocks.login).toHaveBeenCalledWith({ username: 'ana', password: 'pass' })
    expect(authMocks.getMe).toHaveBeenCalledOnce()
    expect(result.current).toMatchObject({
      isAuthenticated: true,
      user: { id: 1, username: 'ana' },
    })
    expect(localStorage.getItem('eficacia.token')).toBe('token-1')
    expect(JSON.parse(localStorage.getItem('eficacia.user'))).toEqual({ id: 1, username: 'ana' })
  })

  it('keeps an authenticated session when profile fetch after login fails', async () => {
    authMocks.login.mockResolvedValue('token-2')
    authMocks.getMe.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => result.current.login({ username: 'a', password: 'p' }))
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('registers with a normalized user and supports profile updates and password changes', async () => {
    authMocks.register.mockResolvedValue({ token: 'reg-token', user: { id: 2, username: 'bea' } })
    authMocks.updateMe.mockResolvedValue({ id: 2, username: 'bea', fullName: 'Bea B.' })
    authMocks.changePassword.mockResolvedValue('token-3')
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => result.current.register({ username: 'bea' }))
    expect(authMocks.normalizeUser).toHaveBeenCalledWith({ id: 2, username: 'bea' })
    expect(result.current).toMatchObject({ isAuthenticated: true, user: { id: 2, username: 'bea' } })
    await act(async () => result.current.updateProfile({ fullName: 'Bea B.' }))
    expect(result.current.user.fullName).toBe('Bea B.')
    await act(async () => result.current.changePassword({ newPassword: 'new' }))
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('eficacia.token')).toBe('token-3')
  })

  it('closes the local session on logout failure and on a registered unauthorized callback', async () => {
    authMocks.login.mockResolvedValue('token-4')
    authMocks.getMe.mockResolvedValue({ id: 4, username: 'c' })
    authMocks.logout.mockRejectedValue(new Error('server error'))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => result.current.login({ username: 'c', password: 'p' }))
    await act(async () => result.current.logout())
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('eficacia.token')).toBeNull()
    expect(localStorage.getItem('eficacia.user')).toBeNull()

    authMocks.login.mockResolvedValue('token-5')
    authMocks.getMe.mockResolvedValue({ id: 5 })
    await act(async () => result.current.login({ username: 'd', password: 'p' }))
    const unauthorized = authMocks.setUnauthorizedHandler.mock.calls
      .map(([handler]) => handler)
      .find((handler) => typeof handler === 'function')
    expect(unauthorized).toBeTypeOf('function')
    act(() => unauthorized())
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false))
  })

  it('refreshes a cached profile on mount and aborts that request on unmount', async () => {
    authMocks.token = 'cached-token'
    localStorage.setItem('eficacia.user', JSON.stringify({ id: 7, username: 'cached' }))
    const controllerSignal = { aborted: false }
    authMocks.getMe.mockImplementation(({ signal }) => {
      signal.addEventListener('abort', () => { controllerSignal.aborted = true })
      return Promise.resolve({ id: 7, username: 'refreshed' })
    })
    const { result, unmount } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user.username).toBe('cached')
    await waitFor(() => expect(result.current.user.username).toBe('refreshed'))
    expect(authMocks.getMe).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) })
    unmount()
    expect(controllerSignal.aborted).toBe(true)
  })
})
