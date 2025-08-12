'use client'

import React from 'react'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'

interface ToastState {
  id: string
  title?: string
  description: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastContextType {
  toasts: ToastState[]
  addToast: (toast: Omit<ToastState, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {}
})

// Use a counter for deterministic ID generation
let toastIdCounter = 0

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastState[]>([])

  const addToast = React.useCallback((toast: Omit<ToastState, 'id'>) => {
    // Use a simple counter-based ID that's deterministic
    const id = `toast-${++toastIdCounter}`
    const newToast: ToastState = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    const duration = toast.duration || (toast.variant === 'destructive' ? 5000 : 3000)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const contextValue = React.useMemo(() => ({
    toasts,
    addToast,
    removeToast
  }), [toasts, addToast, removeToast])

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastProvider>
        {children}
        <ToastViewport>
          {toasts.map(toast => (
            <Toast key={toast.id} variant={toast.variant}>
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              <ToastDescription>{toast.description}</ToastDescription>
              <ToastClose onClick={() => removeToast(toast.id)} />
            </Toast>
          ))}
        </ToastViewport>
      </ToastProvider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastContextProvider')
  }
  
  return {
    showToast: context.addToast,
    showError: (message: string, title?: string) => 
      context.addToast({ description: message, title, variant: 'destructive' }),
    showSuccess: (message: string, title?: string) => 
      context.addToast({ description: message, title, variant: 'success' }),
    showInfo: (message: string, title?: string) => 
      context.addToast({ description: message, title })
  }
} 