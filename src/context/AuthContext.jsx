import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { setAuthToken, clearAuthToken, getUserIdFromToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('levelup_token') || null)
  const [userId, setUserId] = useState(() => {
    const saved = localStorage.getItem('levelup_userId')
    if (saved) return parseInt(saved, 10)
    if (token) {
      const id = getUserIdFromToken(token)
      if (id) localStorage.setItem('levelup_userId', String(id))
      return id || null
    }
    return null
  })

  useEffect(() => {
    if (token) setAuthToken(token)
    else clearAuthToken()
  }, [token])

  const login = (tok) => {
    setToken(tok)
    localStorage.setItem('levelup_token', tok)
    const id = getUserIdFromToken(tok)
    if (id) {
      setUserId(id)
      localStorage.setItem('levelup_userId', String(id))
    }
  }

  const logout = () => {
    setToken(null)
    setUserId(null)
    localStorage.removeItem('levelup_token')
    localStorage.removeItem('levelup_userId')
    clearAuthToken()
  }

  const value = useMemo(() => ({
    token, userId,
    isAuthenticated: !!token && !!userId,
    login, logout
  }), [token, userId])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
