import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    setLoading(true)
    try {
      const res = await authAPI.login(username, password)
      const { access_token, role } = res.data
      localStorage.setItem('access_token', access_token)
      const profileRes = await authAPI.profile()
      const userData = { ...profileRes.data, role }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const loginWithToken = async (token, role) => {
    setLoading(true)
    try {
      localStorage.setItem('access_token', token)
      const profileRes = await authAPI.profile()
      const userData = { ...profileRes.data, role }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    } catch (err) {
      localStorage.removeItem('access_token')
      return { success: false, error: err.response?.data?.detail || 'OAuth verification failed' }
    } finally {
      setLoading(false)
    }
  }

  const register = async (data) => {
    setLoading(true)
    try {
      await authAPI.register(data)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
