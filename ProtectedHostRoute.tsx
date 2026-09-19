import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedHostRoute() {
  const { loading, session, isHost } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center font-semibold">Securing your dashboard…</div>
  if (!session) return <Navigate to="/host/login" replace />
  if (!isHost) return <Navigate to="/" replace />
  return <Outlet />
}
