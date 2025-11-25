import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const AuthDebug = () => {
  const { user, login, logout } = useAuth()
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      const result = await login('admin@enterprise.com', 'admin123')
      setTestResult({
        type: 'login',
        success: result.success,
        error: result.error,
        user: user
      })
    } catch (error) {
      setTestResult({
        type: 'login',
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const testAuthEndpoint = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      const response = await api.get('/auth/me')
      setTestResult({
        type: 'auth',
        success: true,
        data: response.data
      })
    } catch (error) {
      setTestResult({
        type: 'auth',
        success: false,
        error: error.response?.data?.message || error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
      <h3 className="text-lg font-semibold">Authentication Debug</h3>
      
      <div className="space-y-2">
        <p><strong>Current User:</strong> {user ? user.name : 'Not logged in'}</p>
        <p><strong>User Role:</strong> {user ? user.role : 'N/A'}</p>
        <p><strong>Token in Storage:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={testLogin}
          disabled={loading}
          className="btn-primary text-sm"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
        
        <button
          onClick={testAuthEndpoint}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          Test /auth/me
        </button>
        
        <button
          onClick={logout}
          className="btn-secondary text-sm"
        >
          Logout
        </button>
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
          <h4 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {testResult.type === 'login' ? 'Login Test' : 'Auth Endpoint Test'} - {testResult.success ? 'Success' : 'Failed'}
          </h4>
          <pre className={`text-sm mt-2 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default AuthDebug