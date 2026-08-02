import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase env vars missing. Using localStorage fallback.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const signIn = (email, password) => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase.auth.signInWithPassword({ email, password })
}

export const signUp = (email, password) => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase.auth.signUp({ email, password })
}

export const resetPassword = (email) => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  })
}

export const signOut = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase.auth.signOut()
}

