// API Configuration and Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Token management
const TOKEN_KEY = 'choice_talent_token'

// Import browser utilities
import { browserUtils } from './utils'

export const tokenManager = {
  get: (): string | null => {
    if (typeof window === 'undefined') {
      console.log('[TokenManager] Window not available (SSR)')
      return null
    }
    
    const storage = browserUtils.getBestStorage()
    if (!storage) {
      console.log('[TokenManager] No storage available')
      return null
    }
    
    try {
      const token = storage.getItem(TOKEN_KEY)
      const browserName = browserUtils.getBrowserName()
      console.log(`[TokenManager] Getting token from ${browserName}:`, token ? `Found (${token.substring(0, 20)}...)` : 'Not found')
      return token
    } catch (error) {
      console.error('[TokenManager] Error getting token:', error)
      return null
    }
  },
  
  set: (token: string): void => {
    if (typeof window === 'undefined') {
      console.log('[TokenManager] Window not available (SSR), cannot set token')
      return
    }
    
    const storage = browserUtils.getBestStorage()
    if (!storage) {
      console.log('[TokenManager] No storage available, cannot set token')
      return
    }
    
    try {
      const browserName = browserUtils.getBrowserName()
      console.log(`[TokenManager] Setting token in ${browserName}:`, token ? `Token set (${token.substring(0, 20)}...)` : 'No token')
      storage.setItem(TOKEN_KEY, token)
    } catch (error) {
      console.error('[TokenManager] Error setting token:', error)
    }
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') {
      console.log('[TokenManager] Window not available (SSR), cannot remove token')
      return
    }
    
    const storage = browserUtils.getBestStorage()
    if (!storage) {
      console.log('[TokenManager] No storage available, cannot remove token')
      return
    }
    
    try {
      const browserName = browserUtils.getBrowserName()
      console.log(`[TokenManager] Removing token from ${browserName}`)
      storage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error('[TokenManager] Error removing token:', error)
    }
  }
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface ApiError {
  message: string
  status: number
  details?: unknown
}

// Create custom error class
export class ApiRequestError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.details = details
  }
}

// Request configuration interface
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  data?: FormData | object | undefined
  params?: Record<string, string | number>
  headers?: Record<string, string>
  requiresAuth?: boolean
  isFormData?: boolean
}

// Main API client
export const apiClient = {
  async request<T = unknown>({
    method,
    endpoint,
    data,
    params,
    headers = {},
    requiresAuth = false,
    isFormData = false
  }: RequestConfig): Promise<T> {
    let url = `${API_BASE_URL}${endpoint}`
    
    // Add query parameters for GET requests
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value.toString())
      })
      url += `?${searchParams.toString()}`
    }
    
    // Default headers - don't set Content-Type for FormData
    const defaultHeaders: Record<string, string> = {}
    
    // Only set Content-Type for non-FormData requests
    if (!(data instanceof FormData) && !isFormData) {
      defaultHeaders['Content-Type'] = 'application/json'
    }
    
    // Add auth header if required
    if (requiresAuth) {
      const token = tokenManager.get()
      if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`
        console.log('[API] Adding auth header for:', endpoint)
      } else {
        console.error('[API] No token found for authenticated request:', endpoint)
        throw new ApiRequestError('No authentication token found', 401)
      }
    }
    
    // Merge headers
    const finalHeaders = { ...defaultHeaders, ...headers }
    
    // Request configuration
    const requestConfig: RequestInit = {
      method,
      headers: finalHeaders,
    }
    
    // Add body for non-GET requests
    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        requestConfig.body = data
      } else {
        requestConfig.body = JSON.stringify(data)
      }
    }

    console.log('[API] Making request:', method, endpoint, requiresAuth ? '(Auth required)' : '(No auth)')

    try {
      const response = await fetch(url, requestConfig)
      
      console.log('[API] Response status:', response.status, 'for:', endpoint)
      
      // Parse response
      let responseData: ApiResponse<T>
      try {
        responseData = await response.json()
      } catch (parseError) {
        throw new ApiRequestError(
          'Invalid response format',
          response.status,
          { originalError: parseError }
        )
      }
      
      // Handle HTTP errors
      if (!response.ok) {
        console.log('[API] Error response:', response.status, responseData.message)
        throw new ApiRequestError(
          responseData.message || responseData.error || `HTTP ${response.status}`,
          response.status,
          responseData
        )
      }
      
      console.log('[API] Success response for:', endpoint)
      // Return success response
      return responseData as T
    } catch (error) {
      // Re-throw ApiRequestError
      if (error instanceof ApiRequestError) {
        throw error
      }
      
      // Handle network errors
      throw new ApiRequestError(
        'Network error or server unavailable',
        0,
        { originalError: error }
      )
    }
  },

  // Convenience methods
  async get<T = unknown>(endpoint: string, requiresAuth = false, params?: Record<string, string | number>): Promise<T> {
    return this.request<T>({ method: 'GET', endpoint, requiresAuth, params })
  },

  async post<T = unknown>(endpoint: string, data?: FormData | object, requiresAuth = false): Promise<T> {
    return this.request<T>({ method: 'POST', endpoint, data, requiresAuth })
  },

  async put<T = unknown>(endpoint: string, data?: FormData | object, requiresAuth = false): Promise<T> {
    return this.request<T>({ method: 'PUT', endpoint, data, requiresAuth })
  },

  async delete<T = unknown>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>({ method: 'DELETE', endpoint, requiresAuth })
  }
} 