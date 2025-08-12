'use client'

import React from 'react'
import { DatingHeader } from './dating-header'

interface DatingLayoutProps {
  children: React.ReactNode
  isAuthenticated?: boolean
  user?: any
  onLogout?: () => void
}

export function DatingLayout({ children, isAuthenticated, user, onLogout }: DatingLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DatingHeader 
        isAuthenticated={isAuthenticated} 
        user={user} 
        onLogout={onLogout} 
      />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
} 