import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate auth check - in real app, this would use Supabase
    const savedUser = localStorage.getItem('rightsguard-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email, password) => {
    // Simulate sign in - in real app, this would use Supabase auth
    const mockUser = {
      id: 'user_123',
      email,
      created_at: new Date().toISOString()
    }
    setUser(mockUser)
    localStorage.setItem('rightsguard-user', JSON.stringify(mockUser))
    return mockUser
  }

  const signUp = async (email, password) => {
    // Simulate sign up - in real app, this would use Supabase auth
    const mockUser = {
      id: 'user_' + Date.now(),
      email,
      created_at: new Date().toISOString()
    }
    setUser(mockUser)
    localStorage.setItem('rightsguard-user', JSON.stringify(mockUser))
    return mockUser
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('rightsguard-user')
  }

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}