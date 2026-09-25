import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import TodayPage from './pages/TodayPage'
import EventsPage from './pages/EventsPage'
import CreatePage from './pages/CreatePage'
import EventDetailPage from './pages/EventDetailPage'
import ProgressPage from './pages/ProgressPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/hoy" replace />} />
        <Route path="/hoy" element={<TodayPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/crear" element={<CreatePage />} />
        <Route path="/evento/:id" element={<EventDetailPage />} />
        <Route path="/progreso" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/hoy" replace />} />
      </Route>
    </Routes>
  )
}