'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/store'
import { userService } from '@/services/userService'
import type { User } from '@/services/userService'
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Heart, 
  Briefcase,
  Crown
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    loadDashboardData()
  }, [isAuthenticated, router])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load user profile
      if (user) {
        const updatedUser = await userService.getProfile()
        updateUser(updatedUser)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    logout()
    router.push('/login')
  }

  const getDisplayName = (user: User | null) => {
    return user?.realName || user?.name || 'User'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Choice Dating</h2>
          <p className="text-gray-600 mb-8">
            Start your journey to find meaningful relationships and genuine connections.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          {/* Dating Module */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/dating">
              <CardHeader className="text-center">
                              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-[#8B0000]" />
              </div>
              <CardTitle className="text-2xl text-[#8B0000]">Dating</CardTitle>
                <CardDescription>
                  Find meaningful connections and plan romantic dates
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Match making</li>
                  <li>• Date planning</li>
                  <li>• Messaging</li>
                  <li>• Dating preferences</li>
                </ul>
                <Button className="w-full bg-[#8B0000] hover:bg-[#660000]">
                  Go to Dating Dashboard
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <Link href="/dashboard/dating-settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="mr-2 h-4 w-4" />
                    Dating Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}