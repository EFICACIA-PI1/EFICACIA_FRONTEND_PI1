import { LoadingState } from './StateViews'

// Fallback de Suspense mientras se descarga el código de una ruta.
export default function PageLoader() {
  return <LoadingState className="min-h-[60vh]" />
}
