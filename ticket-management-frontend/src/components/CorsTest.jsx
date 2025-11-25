import React, { useState } from 'react'
import api from '../services/api'

const CorsTest = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testCors = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await api.get('/cors-test')
      setResult(response.data)
    } catch (err) {
      setError(err.message)
      console.error('CORS test failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">CORS Connection Test</h3>
      
      <button
        onClick={testCors}
        disabled={loading}
        className="btn-primary mb-4"
      >
        {loading ? 'Testing...' : 'Test CORS Connection'}
      </button>

      {result && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <h4 className="font-medium text-green-800">✅ Success!</h4>
          <pre className="text-sm text-green-700 mt-2">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
          <h4 className="font-medium text-red-800">❌ Error!</h4>
          <p className="text-sm text-red-700 mt-2">{error}</p>
        </div>
      )}
    </div>
  )
}

export default CorsTest