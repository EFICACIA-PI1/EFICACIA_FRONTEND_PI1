import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError, getToken, isOverloadConflict, setToken, setUnauthorizedHandler } from '../api'

function response(status, body = '') {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

describe('api service', () => {
  afterEach(() => {
    setUnauthorizedHandler(null)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('stores and clears the session token', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
    setToken(null)
    expect(getToken()).toBeNull()
  })

  it('sends JSON and auth headers, then parses the response body', async () => {
    setToken('secret-token')
    const fetchMock = vi.fn().mockResolvedValue(response(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('/tasks/')).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tasks\/$/),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Token secret-token',
        },
      })
    )
  })

  it('allows unauthenticated requests and merges caller headers', async () => {
    setToken('secret-token')
    const fetchMock = vi.fn().mockResolvedValue(response(200, 'plain text'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(apiFetch('/auth/login/', { auth: false, headers: { 'X-Trace': 'one' } })).resolves.toBe(
      'plain text'
    )
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      'X-Trace': 'one',
    })
  })

  it('converts field errors and specially handles invalid task states', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(400, { name: ['Required'], state: ['Not a valid choice.'] })))
    try {
      await apiFetch('/tasks/1/')
      throw new Error('Expected apiFetch to reject')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(400)
      expect(error.message).toBe('Required')
      expect(error.fields).toEqual({
        name: 'Required',
        state: 'No pudimos cambiar el estado de la tarea. Actualiza la página e inténtalo de nuevo.',
      })
      expect(error.payload).toEqual({ name: ['Required'], state: ['Not a valid choice.'] })
    }
  })

  it('uses detail and rate-limit messages and calls the unauthorized handler only for authenticated 401s', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, { detail: 'Sesión expirada.' }))
      .mockResolvedValueOnce(response(429, { detail: 'ignored' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('/private/')).rejects.toMatchObject({ status: 401, message: 'Sesión expirada.' })
    expect(handler).toHaveBeenCalledOnce()
    await expect(apiFetch('/login/', { auth: false })).rejects.toMatchObject({
      status: 429,
      message: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
    })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('normalizes network errors but preserves abort errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')))
    await expect(apiFetch('/offline/')).rejects.toMatchObject({
      status: 0,
      message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    })
    const abort = new DOMException('cancelled', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))
    await expect(apiFetch('/cancelled/')).rejects.toBe(abort)
  })

  it('returns null for an empty success body and exposes overload conflicts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(204)))
    await expect(apiFetch('/logout/')).resolves.toBeNull()
    expect(isOverloadConflict(new ApiError('full', 409, { code: 'daily_overload' }))).toBe(true)
    expect(isOverloadConflict({ status: 409, data: { code: 'other' } })).toBe(false)
  })
})
