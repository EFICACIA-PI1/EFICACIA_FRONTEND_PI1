import { Component } from 'react'
import Icon from './Icon'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Error de render no controlado:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        role="alert"
        className="min-h-screen bg-surface font-body flex flex-col items-center justify-center text-center px-4"
      >
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger-bg text-danger mb-6">
          <Icon name="alert" className="w-8 h-8" />
        </span>
        <h1 className="text-2xl font-semibold text-navy font-display mb-2">Algo salió mal</h1>
        <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
          Ocurrió un error inesperado. Puedes recargar la página o volver al inicio.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg font-semibold text-sm px-4 py-2 bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Recargar página
          </button>
          <a
            href="/hoy"
            className="rounded-lg font-semibold text-sm px-4 py-2 bg-white text-navy border border-edge hover:bg-gray-50 transition-colors"
          >
            Ir a Hoy
          </a>
        </div>
      </div>
    )
  }
}
