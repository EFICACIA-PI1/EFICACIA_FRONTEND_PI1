import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const TodayPage = lazy(() => import('./pages/TodayPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const CreatePage = lazy(() => import('./pages/CreatePage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<SignUpPage />} />
        <Route path="/recuperar" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/hoy" replace />} />
            <Route path="/hoy" element={<TodayPage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/crear" element={<CreatePage />} />
            <Route path="/evento/:id" element={<EventDetailPage />} />
            <Route path="/progreso" element={<ProgressPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
