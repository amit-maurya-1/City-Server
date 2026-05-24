import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [profileError, setProfileError] = useState(null)
  const isFetching = useRef(false)  // 👈 prevents double fetch

  async function fetchProfile(userId) {
    if (isFetching.current) return  // 👈 guard against race condition
    isFetching.current = true
    setProfileError(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('*, cities(id, name, slug)')
      .eq('id', userId)
      .single()

    isFetching.current = false

    if (error) {
      console.error('Error fetching profile:', error.message)
      setProfileError(error.message)  // 👈 expose error to UI
      return null
    }
    return data
  }

  useEffect(() => {
    // Only use onAuthStateChange — skip getSession to avoid double fetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setProfile(profile)
        } else {
          setProfile(null)
          setProfileError(null)
        }
        setLoading(false)  // always called, even on error
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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
    profileError,   // 👈 expose so UI can show error instead of infinite spinner
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
