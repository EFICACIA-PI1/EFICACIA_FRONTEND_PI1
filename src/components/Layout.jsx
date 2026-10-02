import { useEffect, useRef, useState } from 'react'
import useScrollLock from '../hooks/useScrollLock'
import { Outlet, NavLink } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'
import logoHorizontal from '../assets/Logo/LogoHorizontal.webp'

const NAV_LINKS = [
  { to: '/hoy', label: 'Hoy', icon: 'today' },
  { to: '/eventos', label: 'Mis Eventos', icon: 'events' },
  { to: '/crear', label: 'Crear Evento', icon: 'plus' },
  { to: '/progreso', label: 'Progreso', icon: 'progress' },
  { to: '/perfil', label: 'Mi perfil', icon: 'user' },
]

function Brand({ small = false }) {
  return (
    <img
      src={logoHorizontal}
      alt="Eficacia"
      className={`w-auto object-contain ${small ? 'h-11 -my-1' : 'h-16 -my-3'}`}
    />
  )
}

function linkClass({ isActive }) {
  return [
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left',
    isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-gray-50',
  ].join(' ')
}

// Zona de «Cerrar sesión»: único bloque del menú con el color de marca.
const logoutZoneClass = 'p-3 bg-primary'
const logoutButtonClass =
  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-white/15 transition-colors text-left'

function Sidebar() {
  const { logout } = useAuth()
  return (
    <nav
      aria-label="Navegación principal"
      className="hidden lg:flex flex-col w-60 bg-white border-r h-screen sticky top-0 overflow-y-auto flex-shrink-0 border-edge"
    >
      <div className="px-6 py-5 border-b border-edge">
        <Brand />
      </div>

      <ul className="flex flex-col gap-1 p-3 flex-1" role="list">
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} className={linkClass} aria-label={link.label}>
              {({ isActive }) => (
                <>
                  <Icon name={link.icon} />
                  {link.label}
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={logoutZoneClass}>
        <button type="button" onClick={logout} className={logoutButtonClass}>
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

function MobileTopBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { logout } = useAuth()
  const closeRef = useRef(null)
  const openRef = useRef(null)

  useScrollLock(menuOpen)

  useEffect(() => {
    if (!menuOpen) return undefined
    closeRef.current?.focus()
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        openRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header className="lg:hidden bg-white border-b border-edge px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
      <button
        ref={openRef}
        type="button"
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen(true)}
        className="p-2 -ml-2 rounded-lg text-muted hover:bg-gray-50"
      >
        <Icon name="menu" />
      </button>
      <Brand small />

      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <nav
        id="mobile-menu"
        aria-label="Navegación principal"
        inert={!menuOpen}
        className={`fixed inset-y-0 left-0 z-[51] w-72 max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform duration-200 ease-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full invisible'
        }`}
      >
        <div className="px-4 py-3 border-b border-edge flex items-center justify-between">
          <Brand />
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="p-2 -mr-2 rounded-lg text-muted hover:bg-gray-50"
          >
            <Icon name="close" />
          </button>
        </div>
        <ul className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} onClick={() => setMenuOpen(false)} className={linkClass}>
                <Icon name={link.icon} />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className={logoutZoneClass}>
          <button type="button" onClick={logout} className={logoutButtonClass}>
            <Icon name="logout" />
            Cerrar sesión
          </button>
        </div>
      </nav>
    </header>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen flex bg-surface font-body">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar />
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}