import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/hoy', label: 'Hoy', icon: '📋' },
  { to: '/eventos', label: 'Mis Eventos', icon: '🗂️' },
  { to: '/crear', label: 'Crear Evento', icon: '➕' },
  { to: '/progreso', label: 'Progreso', icon: '📈' },
]

const MOBILE_LINKS = [
  { to: '/hoy', label: 'Hoy', icon: '📋' },
  { to: '/eventos', label: 'Eventos', icon: '🗂️' },
  { to: '/crear', label: 'Crear', icon: '➕' },
  { to: '/progreso', label: 'Progreso', icon: '📈' },
]

function Brand({ small = false }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${
          small ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
        } rounded-lg flex items-center justify-center text-white font-bold bg-primary font-display`}
        aria-hidden="true"
      >
        EF
      </div>
      <span
        className={`font-semibold text-navy font-display ${small ? 'text-base' : 'text-lg'}`}
      >
        EFICACIA
      </span>
    </div>
  )
}

function linkClass({ isActive }) {
  return [
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left',
    isActive ? 'bg-[#eff4ff] text-primary' : 'text-muted hover:bg-gray-50',
  ].join(' ')
}

function Sidebar() {
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
                  <span aria-hidden="true">{link.icon}</span>
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

      <div className="p-4 border-t border-edge">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 bg-purple-700"
            aria-label="Avatar de María López"
          >
            ML
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">María López</p>
            <p className="text-xs text-subtle truncate">Organizadora independiente</p>
          </div>
          <span
            className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-neutral-bg text-neutral border border-neutral-border font-medium"
            title="Usuario demo: el login llega en el Sprint 2"
          >
            Demo
          </span>
        </div>
      </div>
    </nav>
  )
}

function MobileTopBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="lg:hidden bg-white border-b border-edge px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <Brand small />
      <button
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen((v) => !v)}
        className="p-2 rounded-lg text-muted hover:bg-gray-50"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="absolute top-full left-0 right-0 bg-white border-b border-edge shadow-md p-3 flex flex-col gap-1"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  isActive ? 'bg-[#eff4ff] text-primary' : 'text-muted',
                ].join(' ')
              }
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}

function MobileBottomNav() {
  return (
    <nav
      aria-label="Navegación inferior"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-edge flex z-30"
    >
      {MOBILE_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            [
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-[#9ca3af]',
            ].join(' ')
          }
        >
          <span className="text-base" aria-hidden="true">
            {link.icon}
          </span>
          {link.label}
        </NavLink>
      ))}
    </nav>
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
        <main id="main-content" className="flex-1 pb-16 lg:pb-0">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}