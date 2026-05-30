import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx'
import ProtectedRoute from '@/components/layout/ProtectedRoute.jsx'
import Navbar from '@/components/layout/Navbar.jsx'

// Pages — lazy imports for better initial load time
import { lazy, Suspense } from 'react'

const MapPage         = lazy(() => import('@/pages/MapPage.jsx'))
const ReportPage      = lazy(() => import('@/pages/ReportPage.jsx'))
const IssueDetailPage = lazy(() => import('@/pages/IssueDetailPage.jsx'))
const AdminPage       = lazy(() => import('@/pages/AdminPage.jsx'))
const LoginPage       = lazy(() => import('@/pages/LoginPage.jsx'))
const RegisterPage    = lazy(() => import('@/pages/RegisterPage.jsx'))
const NotFoundPage    = lazy(() => import('@/pages/NotFoundPage.jsx'))

// Full-screen spinner for lazy page loads
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  )
}

// Smart redirect after login — based on role
function RoleRedirect() {
  const { profile, loading, profileError } = useAuth()

  if (loading) return <PageLoader />

  // 👇 Show error instead of silent redirect to home
  if (profileError) return (
    <div className="min-h-screen flex items-center justify-center text-red-500 text-sm">
      Failed to load profile. Please refresh or contact support.
    </div>
  )

  if (!profile) return <Navigate to="/login" replace />  // 👈 /login not /
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/'} replace />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public routes */}
          <Route path="/"           element={<MapPage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />

          {/* After login — smart redirect */}
          <Route path="/dashboard"  element={<RoleRedirect />} />

          {/* Citizen-only */}
          <Route
            path="/report"
            element={
              <ProtectedRoute role="citizen">
                <ReportPage />
              </ProtectedRoute>
            }
          />

          {/* Admin-only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
