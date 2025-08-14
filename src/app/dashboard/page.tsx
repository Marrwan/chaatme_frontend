'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/store'
import { userService } from '@/services/userService'
import { matchPreferenceService } from '@/services/matchPreferenceService'
import { datePlanService } from '@/services/datePlanService'
import { chatService, type User as ChatUser } from '@/services/chatService'
import { callService, type Call } from '@/services/callService'
import { socketService } from '@/services/socketService'
import type { MatchPreference } from '@/services/matchPreferenceService'
import type { DatePlanStats } from '@/services/datePlanService'
import UserList from '@/components/chat/UserList'
import ChatWindow from '@/components/chat/ChatWindow'
import WhatsAppCallInterface from '@/components/ui/whatsapp-call-interface'
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Heart, 
  Calendar, 
  MessageCircle,
  Star,
  CheckCircle,
  AlertCircle,
  Users,
  PlusCircle,
  Search,
  Crown,
  Phone,
  Video,
  TrendingUp,
  Activity,
  Target,
  Award
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [matchPreference, setMatchPreference] = useState<MatchPreference | null>(null)
  const [datePlanStats, setDatePlanStats] = useState<DatePlanStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [dashboardStats, setDashboardStats] = useState({
    totalMatches: 0,
    activeConversations: 0,
    completedDates: 0,
    profileViews: 0
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    loadDashboardData()
    setupCallHandlers()
  }, [isAuthenticated, router])

  const setupCallHandlers = () => {
    // Listen for incoming calls
    const handleIncomingCall = (data: any) => {
      console.log('📞 Incoming call received:', data)
      setIncomingCall(data)
    }

    socketService.on('incoming_call', handleIncomingCall)

    return () => {
      socketService.off('incoming_call', handleIncomingCall)
    }
  }

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load user profile
      if (user) {
        const updatedUser = await userService.getProfile()
        updateUser(updatedUser)
        setProfileCompletion(userService.getProfileCompletionPercentage(updatedUser))
      }

      // Load match preference
      try {
        const preference = await matchPreferenceService.getMatchPreference()
        setMatchPreference(preference)
      } catch (error) {
        console.log('No match preference found')
        setMatchPreference(null)
      }

      // Load date plan stats
      try {
        const stats = await datePlanService.getDatePlanStats()
        setDatePlanStats(stats)
      } catch (error) {
        console.log('Could not load date plan stats')
        setDatePlanStats(null)
      }

      // Load dashboard stats
      try {
        const stats = await userService.getDashboardStats()
        setDashboardStats({
          totalMatches: stats.totalMatches || 0,
          activeConversations: 0, // Will be calculated from conversations
          completedDates: stats.activeDatePlans || 0,
          profileViews: 0 // Placeholder
        })
      } catch (error) {
        console.log('Could not load dashboard stats')
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

  const getDisplayName = (user: any) => {
    return user?.realName || user?.name || 'User'
  }

  const handleUserSelect = (user: ChatUser) => {
    setSelectedUser(user)
  }

  const handleStartCall = async (user: ChatUser, type: 'audio' | 'video') => {
    try {
      const response = await callService.initiateCall({
        receiverId: user.id,
        type
      })
      if (response.success) {
        setActiveCall(response.data)
      }
    } catch (error) {
      console.error('Error starting call:', error)
    }
  }

  const handleEndCall = () => {
    setActiveCall(null)
  }

  const handleAcceptCall = () => {
    // Call accepted logic
    setActiveCall(prev => prev ? { ...prev, status: 'accepted' } : null)
  }

  const handleRejectCall = () => {
    setActiveCall(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="h-8 w-8 text-purple-600" />
                Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Welcome back, {getDisplayName(user)}!</p>
            </div>
            <div className="flex items-center gap-2">
              {user?.isPremium && (
                <Badge variant="default" className="flex items-center gap-1 bg-purple-600">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Matches</p>
                  <p className="text-2xl font-bold">{dashboardStats.totalMatches}</p>
                </div>
                <Heart className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Active Chats</p>
                  <p className="text-2xl font-bold">{dashboardStats.activeConversations}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Completed Dates</p>
                  <p className="text-2xl font-bold">{dashboardStats.completedDates}</p>
                </div>
                <Calendar className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Profile Views</p>
                  <p className="text-2xl font-bold">{dashboardStats.profileViews}</p>
                </div>
                <Activity className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="dates" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Completion */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5" />
                    Profile Completion
                  </CardTitle>
                  <CardDescription>
                    Complete your profile to get better matches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Profile Progress</span>
                      <span className="text-sm text-gray-500">{profileCompletion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${profileCompletion}%` }}
                      ></div>
                    </div>
                    {profileCompletion < 100 && (
                      <Link href="/dashboard/profile">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          <UserIcon className="mr-2 h-4 w-4" />
                          Complete Profile
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common actions to improve your dating experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link href="/dashboard/match-making">
                      <Button variant="outline" className="w-full justify-start">
                        <Search className="mr-2 h-4 w-4" />
                        Find Matches
                      </Button>
                    </Link>
                    <Link href="/dashboard/plan-date">
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Plan a Date
                      </Button>
                    </Link>
                    <Link href="/dashboard/settings">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              <div className="lg:col-span-1">
                <UserList 
                  onUserSelect={handleUserSelect}
                  onStartCall={handleStartCall}
                  selectedUserId={selectedUser?.id}
                />
              </div>
              <div className="lg:col-span-2">
                <ChatWindow 
                  selectedUser={selectedUser}
                  onStartCall={handleStartCall}
                  currentUserId={user?.id}
                />
              </div>
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Your Matches
                </CardTitle>
                <CardDescription>
                  People who match your preferences and are interested in you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Heart className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">No Matches Yet</h3>
                  <p className="mb-4">Complete your profile and set preferences to find matches</p>
                  <Link href="/dashboard/match-making">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Search className="mr-2 h-4 w-4" />
                      Find Matches
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dates Tab */}
          <TabsContent value="dates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Your Date Plans
                </CardTitle>
                <CardDescription>
                  Plan and manage your romantic dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">No Date Plans Yet</h3>
                  <p className="mb-4">Start planning romantic dates with your matches</p>
                  <Link href="/dashboard/plan-date">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Plan a Date
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Call Interface */}
      {activeCall && (
        <WhatsAppCallInterface
          call={activeCall}
          currentUser={user}
          onEndCall={handleEndCall}
          onAcceptCall={handleAcceptCall}
          onRejectCall={handleRejectCall}
        />
      )}

      {/* Incoming Call Interface */}
      {incomingCall && user && (
        <WhatsAppCallInterface
          call={{
            id: incomingCall.callId,
            callerId: incomingCall.fromUserId,
            receiverId: user.id,
            type: incomingCall.callType,
            status: 'pending',
            caller: incomingCall.from,
            receiver: {
              id: user.id,
              name: user.name || '',
              realName: user.realName,
              profilePicture: user.profilePicture
            }
          }}
          currentUser={user}
          onEndCall={() => setIncomingCall(null)}
          onAcceptCall={() => {
            setActiveCall({
              id: incomingCall.callId,
              callerId: incomingCall.fromUserId,
              receiverId: user.id,
              type: incomingCall.callType,
              status: 'accepted',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              caller: incomingCall.from,
              receiver: {
                id: user.id,
                name: user.name || '',
                realName: user.realName,
                profilePicture: user.profilePicture
              }
            })
            setIncomingCall(null)
          }}
          onRejectCall={() => setIncomingCall(null)}
        />
      )}
    </div>
  )
}