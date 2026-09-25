import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HoyPage from './pages/HoyPage'
import EventosPage from './pages/EventosPage'
import CrearPage from './pages/CrearPage'
import EventoDetailPage from './pages/EventoDetailPage'
import ProgresoPage from './pages/ProgresoPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/hoy" replace />} />
        <Route path="/hoy" element={<HoyPage />} />
        <Route path="/eventos" element={<EventosPage />} />
        <Route path="/crear" element={<CrearPage />} />
        <Route path="/evento/:id" element={<EventoDetailPage />} />
        <Route path="/progreso" element={<ProgresoPage />} />
        <Route path="*" element={<Navigate to="/hoy" replace />} />
      </Route>
    </Routes>
  )
}