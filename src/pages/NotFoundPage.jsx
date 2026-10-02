import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import usePageTitle from '../hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Página no encontrada')
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
        <Icon name="search" className="w-8 h-8" />
      </span>
      <h1 className="text-2xl font-semibold text-navy font-display mb-2">No encontramos esta página</h1>
      <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
        Puede que el enlace esté roto o que la página ya no exista.
      </p>
      <Link
        to="/hoy"
        className="inline-flex items-center justify-center rounded-lg font-semibold text-sm px-4 py-2 bg-primary text-white hover:bg-primary-dark transition-colors"
      >
        Ir a Hoy
      </Link>
    </div>
  )
}
