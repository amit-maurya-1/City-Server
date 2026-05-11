// src/components/layout/ProtectedRoute.jsx
// Guards routes by auth status and role.
// Usage:
//   <ProtectedRoute>          → requires login (any role)
//   <ProtectedRoute role="admin">   → admins only
//   <ProtectedRoute role="citizen"> → citizens only

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Still loading auth — show nothing to avoid flash of wrong content
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  // Not logged in → send to login, preserve where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Profile still loading (rare race condition guard)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  // Role check — redirect wrong role to their correct home
  if (role && profile.role !== role) {
    const fallback = profile.role === 'admin' ? '/admin' : '/'
    return <Navigate to={fallback} replace />
  }

  return children
}
