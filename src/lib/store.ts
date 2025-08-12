import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '@/services/authService'
import type { User } from '@/services/userService'
import { tokenManager } from '@/lib/api'
import { browserUtils, safeBrowserUtils } from '@/lib/utils'
import { socketService } from '@/services/socketService'

// Import socket service for cleanup
let socketServiceInstance: any = null

// Function to set socket service reference
export const setSocketService = (service: any) => {
  socketServiceInstance = service
}

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  token: string | null
  
  // Actions
  login: (user: User, token?: string) => void
  logout: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      token: null,

      // Actions
      login: (user: User, token?: string) => {
        console.log('[AuthStore] Logging in user:', user.email, 'Token provided:', !!token)
        if (token) {
          console.log('[AuthStore] Setting token:', token.substring(0, 20) + '...')
          tokenManager.set(token)
          set({ token })
          
          // Connect socket after successful login
          try {
            console.log('[AuthStore] Connecting socket...')
            socketService.connect(token)
            console.log('[AuthStore] Socket connected successfully')
          } catch (error) {
            console.error('[AuthStore] Failed to connect socket:', error)
          }
        }
        set({
          user: {
            ...user,
            subscriptionStatus: user.subscriptionStatus || 'free',
            isPremium: user.isPremium || false,
            canAccessMatchmaking: user.canAccessMatchmaking || false
          },
          isAuthenticated: true,
          isLoading: false
        })
        console.log('[AuthStore] User logged in successfully')
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          console.log('[AuthStore] Logging out...')
          
          // Disconnect socket first
          if (socketServiceInstance) {
            console.log('[AuthStore] Disconnecting socket...')
            socketServiceInstance.disconnect()
          }
          
          // Also disconnect using the imported socketService
          try {
            console.log('[AuthStore] Disconnecting socket via socketService...')
            socketService.disconnect()
          } catch (error) {
            console.warn('[AuthStore] Socket disconnect error:', error)
          }
          
          await authService.logout()
        } catch (error) {
          console.warn('Logout error:', error)
        } finally {
          // Clear token and state
          tokenManager.remove()
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            token: null,
            isInitialized: false // Reset initialization to force re-initialization
          })
          console.log('[AuthStore] User logged out, token cleared')
          
          // Force page reload to clear all state and socket connections
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { 
              ...currentUser, 
              ...userData,
              subscriptionStatus: userData.subscriptionStatus || currentUser.subscriptionStatus || 'free',
              isPremium: userData.isPremium || currentUser.isPremium || false,
              canAccessMatchmaking: userData.canAccessMatchmaking || currentUser.canAccessMatchmaking || false
            }
          })
          console.log('[AuthStore] User updated:', userData)
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Initialize auth state on app load
      initialize: async () => {
        if (get().isInitialized) return
        set({ isLoading: true })
        try {
          // First check localStorage directly
          const localStorageToken = tokenManager.get()
          const storeToken = get().token
          const token = storeToken || localStorageToken
          
          console.log('[AuthStore] Initializing. Store token:', storeToken ? 'Yes' : 'No', 'LocalStorage token:', localStorageToken ? 'Yes' : 'No')
          
          if (token) {
            // Ensure token is in both places
            tokenManager.set(token)
            set({ token })
            
            // Verify token and get user data
            console.log('[AuthStore] Attempting to get user profile...')
            const user = await authService.getProfile()
            console.log('[AuthStore] User profile retrieved:', user)
            
            set({
              user: {
                ...user,
                subscriptionStatus: user.subscriptionStatus || 'free',
                isPremium: user.isPremium || false,
                canAccessMatchmaking: user.canAccessMatchmaking || false
              },
              isAuthenticated: true,
              isInitialized: true,
              token
            })
            
            // Connect socket if user is authenticated
            try {
              console.log('[AuthStore] Connecting socket during initialization...')
              socketService.connect(token)
              console.log('[AuthStore] Socket connected during initialization')
            } catch (error) {
              console.error('[AuthStore] Failed to connect socket during initialization:', error)
            }
            
            console.log('[AuthStore] Initialization success. User authenticated')
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              token: null
            })
            console.log('[AuthStore] Initialization: No token found, not authenticated')
          }
        } catch (error) {
          console.error('[AuthStore] Auth initialization failed:', error)
          // Clear invalid token
          tokenManager.remove()
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            token: null
          })
          console.log('[AuthStore] Initialization failed, token cleared')
        } finally {
          set({ isLoading: false })
        }
      },

      // Refresh user data
      refreshUser: async () => {
        if (!get().isAuthenticated) return
        try {
          const user = await authService.getProfile()
          set({ 
            user: {
              ...user,
              subscriptionStatus: user.subscriptionStatus || 'free',
              isPremium: user.isPremium || false,
              canAccessMatchmaking: user.canAccessMatchmaking || false
            }
          })
          console.log('[AuthStore] User refreshed:', user)
        } catch (error) {
          console.error('Failed to refresh user:', error)
          // If token is invalid, logout
          if (error instanceof Error && error.message.includes('401')) {
            get().logout()
          }
        }
      }
    }),
    {
      name: 'choice-talent-auth',
      storage: createJSONStorage(() => {
        const browserName = safeBrowserUtils.getBrowserName()
        const storage = safeBrowserUtils.getBestStorage()
        console.log(`[AuthStore] Creating storage for ${browserName}, storage available:`, !!storage)
        return storage || localStorage // Fallback to localStorage if browserUtils fails
      }),
      partialize: (state) => {
        const browserName = safeBrowserUtils.getBrowserName()
        console.log(`[AuthStore] Partializing state for ${browserName}:`, {
          hasUser: !!state.user,
          isAuthenticated: state.isAuthenticated,
          hasToken: !!state.token
        })
        return {
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          token: state.token,
          isInitialized: state.isInitialized
        }
      },
      onRehydrateStorage: () => (state) => {
        const browserName = safeBrowserUtils.getBrowserName()
        console.log(`[AuthStore] Rehydrating state for ${browserName}:`, state)
      },
    }
  )
)

// Helper hooks
export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    login, 
    logout, 
    updateUser, 
    setLoading,
    initialize,
    refreshUser
  } = useAuthStore()
  
  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout,
    updateUser,
    setLoading,
    initialize,
    refreshUser
  }
} 