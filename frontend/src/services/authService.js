// src/services/authService.js
// All auth-related Supabase calls live here.
// Components never call supabase.auth directly — they use this.

import { supabase } from '@/lib/supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL

// ─── Login ───────────────────────────────────────────────────
export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

// ─── Citizen Registration ─────────────────────────────────────
export async function registerCitizen({ email, password, full_name, city_id }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, city_id, role: 'citizen' },
    },
  })
  if (error) throw new Error(error.message)
  return data
}

// ─── Admin Registration (via Edge Function — secret validated server-side) ───
export async function registerAdmin({ email, password, full_name, city_id, secret_code }) {
  const res = await fetch(`${FUNCTIONS_URL}/register-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name, city_id, secret_code }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Admin registration failed.')
  return json
}

// ─── Logout ──────────────────────────────────────────────────
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

// ─── Fetch all cities (for registration dropdown) ─────────────
export async function fetchCities() {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}
