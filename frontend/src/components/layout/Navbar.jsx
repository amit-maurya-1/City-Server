// src/components/layout/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Plus, LayoutDashboard, LogOut, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-emerald-700 text-lg">
          <MapPin className="w-5 h-5" />
          CityServe
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {user ? (
            <>
              {/* City indicator */}
              {profile?.cities?.name && (
                <span className="hidden sm:inline text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {profile.cities.name}
                </span>
              )}

              {/* Citizen: Report button */}
              {!isAdmin && (
                <Link
                  to="/report"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 
                             text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Report Issue</span>
                </Link>
              )}

              {/* Admin: Dashboard button */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 
                             text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 
                           transition-colors p-1.5 rounded-lg hover:bg-red-50"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 
                           transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 
                           text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
