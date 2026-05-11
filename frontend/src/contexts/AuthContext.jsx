// src/contexts/AuthContext.jsx
// Provides auth state (user, profile, role) to the entire app.
// Wrap <App /> with <AuthProvider> in main.jsx.

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)   // Supabase session
  const [profile, setProfile]   = useState(null)   // profiles table row
  const [loading, setLoading]   = useState(true)   // initial auth check

  // Fetch user profile from profiles table
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, cities(id, name, slug)')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error.message)
      return null
    }
    return data
  }

  useEffect(() => {
    // 1. Get current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setProfile(profile)
      }
      setLoading(false)
    })

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setProfile(profile)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Convenience helpers
  const user    = session?.user ?? null
  const role    = profile?.role ?? null
  const cityId  = profile?.city_id ?? null
  const city    = profile?.cities ?? null
  const isAdmin = role === 'admin'

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user,
    profile,
    role,
    cityId,
    city,
    isAdmin,
    loading,
    signOut,
    refreshProfile: async () => {
      if (user) {
        const updated = await fetchProfile(user.id)
        setProfile(updated)
      }
    },
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook — use this in every component that needs auth state
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
