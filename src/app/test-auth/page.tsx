'use client'

import { useAuth } from '@/lib/store'
import { tokenManager } from '@/lib/api'
import { useState } from 'react'

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading, isInitialized, token, login, logout, initialize } = useAuth()
  const [testResult, setTestResult] = useState<string>('')

  const runAuthTest = async () => {
    setTestResult('Running auth test...')
    
    try {
      // Test 1: Check localStorage token
      const localStorageToken = tokenManager.get()
      console.log('LocalStorage token:', localStorageToken ? 'Found' : 'Not found')
      
      // Test 2: Check store token
      console.log('Store token:', token ? 'Found' : 'Not found')
      
      // Test 3: Check authentication state
      console.log('Auth state:', {
        isInitialized,
        isLoading,
        isAuthenticated,
        hasUser: !!user
      })
      
      // Test 4: Try to reinitialize
      await initialize()
      
      setTestResult('Auth test completed. Check console for details.')
    } catch (error) {
      setTestResult(`Auth test failed: ${error}`)
    }
  }

  const clearAuth = () => {
    tokenManager.remove()
    logout()
    setTestResult('Auth cleared')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="space-y-2 text-sm">
            <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
            <div>Loading: {isLoading ? '🔄' : '✅'}</div>
            <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
            <div>Has User: {user ? '✅' : '❌'}</div>
            <div>Store Token: {token ? '✅' : '❌'}</div>
            <div>LocalStorage Token: {tokenManager.get() ? '✅' : '❌'}</div>
            {user && (
              <div>User: {user.name || user.email}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={runAuthTest}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Run Auth Test
            </button>
            <button
              onClick={clearAuth}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Clear Auth
            </button>
          </div>
          {testResult && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              {testResult}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <div className="text-xs font-mono bg-gray-100 p-4 rounded overflow-auto">
            <div>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</div>
            <div>LocalStorage: {tokenManager.get() ? `${tokenManager.get()?.substring(0, 20)}...` : 'None'}</div>
            <div>User ID: {user?.id || 'None'}</div>
            <div>User Email: {user?.email || 'None'}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 