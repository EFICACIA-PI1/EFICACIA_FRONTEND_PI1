import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getToken, setToken, setUnauthorizedHandler } from '../services/api'
import * as authService from '../services/authService'

const AuthContext = createContext(null)
const USER_KEY = 'eficacia.user'

// El perfil se guarda como caché para pintar el saludo al instante;
// la fuente de verdad es GET /auth/me/, que se refresca al cargar la app.
function readCachedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null
  } catch {
    return null
  }
}

function cacheUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // almacenamiento no disponible: el perfil dura solo mientras la pestaña esté abierta
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUserState] = useState(() => (getToken() ? readCachedUser() : null))

  const startSession = useCallback((newToken, newUser) => {
    setToken(newToken)
    cacheUser(newUser)
    setTokenState(newToken)
    setUserState(newUser)
  }, [])

  const setUser = useCallback((newUser) => {
    cacheUser(newUser)
    setUserState(newUser)
  }, [])

  // Cierre local (sin llamar a la API): sesión vencida o respuesta 401.
  const clearSession = useCallback(() => startSession(null, null), [startSession])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    if (!getToken()) return undefined
    const controller = new AbortController()
    authService
      .getMe({ signal: controller.signal })
      .then(setUser)
      .catch(() => {
        // Si falla se conserva la caché; un 401 ya cierra la sesión vía el handler.
      })
    return () => controller.abort()
  }, [setUser])

  const login = useCallback(
    async (credentials) => {
      const newToken = await authService.login(credentials)
      setToken(newToken) // apiFetch lee el token del almacenamiento
      let profile = null
      try {
        profile = await authService.getMe()
      } catch {
        // el perfil se recupera en la siguiente carga
      }
      startSession(newToken, profile)
    },
    [startSession]
  )

  const register = useCallback(
    async (form) => {
      const data = await authService.register(form)
      startSession(data.token, authService.normalizeUser(data.user))
    },
    [startSession]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // aunque el servidor falle, la sesión local debe cerrarse
    }
    clearSession()
  }, [clearSession])

  const updateProfile = useCallback(
    async (data) => {
      const updated = await authService.updateMe(data)
      setUser(updated)
      return updated
    },
    [setUser]
  )

  // El backend invalida el token anterior y devuelve uno nuevo.
  const changePassword = useCallback(async (data) => {
    const newToken = await authService.changePassword(data)
    setToken(newToken)
    setTokenState(newToken)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      user,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [token, user, login, register, logout, updateProfile, changePassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
