'use client'

import React from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Crown, AlertCircle, Heart, MessageCircle, Calendar, Home, Menu } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  isEmailVerified?: boolean
  subscriptionStatus?: 'free' | 'premium'
  isPremium?: boolean
  canAccessMatchmaking?: boolean
}

interface DatingHeaderProps {
  isAuthenticated?: boolean
  user?: User | null
  onLogout?: () => void
}

export function DatingHeader({ isAuthenticated = false, user, onLogout }: DatingHeaderProps) {
  const getInitials = (email?: string, name?: string) => {
    if (!email && !name) return 'U' // Default fallback
    
    if (name && name.trim()) {
      return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    
    if (email && email.trim()) {
      return email.trim().charAt(0).toUpperCase()
    }
    
    return 'U' // Fallback
  }

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <img src="/ChaatMeLogo.jpg" alt="ChaatMe Logo" width={28} height={28} className="rounded sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-xl font-semibold text-gray-900">ChaatMe.com</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarFallback className="bg-purple-600 text-white text-xs sm:text-sm">
                        {getInitials(user.email, user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {user.subscriptionStatus === 'premium' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                    <p className="text-xs leading-none text-gray-600">{user.email || ''}</p>
                    <div className="flex items-center mt-1">
                      {user.subscriptionStatus === 'premium' ? (
                        <div className="flex items-center text-xs text-yellow-600">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-500">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Free Plan
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/match-making" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Match Making</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/plan-date" className="cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Plan a Date</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/chat" className="cursor-pointer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Messages</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/subscription" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4" />
                      <span>Subscription</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Desktop Navigation - Hidden on mobile */}
                <div className="hidden md:flex items-center space-x-3">
                  <Button asChild variant="ghost">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>

                {/* Mobile Navigation - Dropdown */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-10 sm:w-10 p-0">
                        <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48" align="end" forceMount>
                      <DropdownMenuItem asChild>
                        <Link href="/login" className="cursor-pointer">
                          <span>Sign In</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/register" className="cursor-pointer">
                          <span>Get Started</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 