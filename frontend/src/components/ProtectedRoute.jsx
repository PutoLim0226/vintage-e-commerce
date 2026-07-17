import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// 未登入則導向 /login，登入後原路返回
export default function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
