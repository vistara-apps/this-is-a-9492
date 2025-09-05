import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { userService } from '../lib/database.js'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await handleUserSession(session.user)
        }
      } else {
        // Fallback to localStorage for demo
        const savedUser = localStorage.getItem('rightsguard-user')
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await handleUserSession(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const handleUserSession = async (supabaseUser) => {
    try {
      // Get or create user profile
      let userProfile = await userService.getUser(supabaseUser.id)
      
      if (!userProfile) {
        // Create new user profile
        userProfile = await userService.createUser({
          id: supabaseUser.id,
          email: supabaseUser.email
        })
      }

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        profile: userProfile,
        created_at: supabaseUser.created_at
      })
    } catch (error) {
      console.error('Error handling user session:', error)
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        created_at: supabaseUser.created_at
      })
    }
  }

  const signIn = async (email, password) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return data.user
    } else {
      // Fallback mock for demo
      const mockUser = {
        id: 'user_123',
        email,
        created_at: new Date().toISOString()
      }
      setUser(mockUser)
      localStorage.setItem('rightsguard-user', JSON.stringify(mockUser))
      return mockUser
    }
  }

  const signUp = async (email, password) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return data.user
    } else {
      // Fallback mock for demo
      const mockUser = {
        id: 'user_' + Date.now(),
        email,
        created_at: new Date().toISOString()
      }
      setUser(mockUser)
      localStorage.setItem('rightsguard-user', JSON.stringify(mockUser))
      return mockUser
    }
  }

  const signOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } else {
      // Fallback for demo
      localStorage.removeItem('rightsguard-user')
    }
    setUser(null)
  }

  const resetPassword = async (email) => {
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      if (error) throw error
    } else {
      // Mock success for demo
      console.log('Password reset email sent (mock)')
    }
  }

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
