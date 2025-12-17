import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Verify token validity
      initializeAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const initializeAuth = async () => {
    try {
      await Promise.all([fetchUser(), fetchPermissions()])
    } catch (error) {
      console.error('Auth initialization failed:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      console.error('Failed to fetch user:', error)
      throw error
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permissions/my-permissions')
      setPermissions(response.data.permissionIds || [])
      return response.data.permissionIds
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      // Don't throw here, just set empty permissions so app can still load
      setPermissions([])
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data

      if (!token || !user) {
        throw new Error('Invalid response format from server')
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)

      // Fetch permissions after login
      await fetchPermissions()

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('companyId')
    localStorage.removeItem('company')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setPermissions([])
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const checkPermission = (permissionId) => {
    return permissions.includes(permissionId)
  }

  const value = {
    user,
    permissions,
    checkPermission,
    login,
    logout,
    register,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}