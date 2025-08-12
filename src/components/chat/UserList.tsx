'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { chatService, type User } from '@/services/chatService'
import { callService } from '@/services/callService'
import { socketService } from '@/services/socketService'
import { 
  Search, 
  MessageCircle, 
  Phone, 
  Video, 
  Users, 
  Crown,
  Heart,
  MapPin,
  Briefcase
} from 'lucide-react'

interface UserListProps {
  onUserSelect: (user: User) => void
  onStartCall: (user: User, type: 'audio' | 'video') => void
  selectedUserId?: string
}

export default function UserList({ onUserSelect, onStartCall, selectedUserId }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])

  useEffect(() => {
    loadUsers()
    loadOnlineUsers()
  }, [])

  useEffect(() => {
    // Listen for real-time online status updates
    const handleUserStatusChanged = (...args: unknown[]) => {
      const data = args[0] as { userId: string; isOnline: boolean }
      setOnlineUsers(prev => {
        if (data.isOnline) {
          // Add user to online list if not already there
          if (!prev.some(user => user.id === data.userId)) {
            const user = users.find(u => u.id === data.userId)
            if (user) {
              return [...prev, user]
            }
          }
        } else {
          // Remove user from online list
          return prev.filter(user => user.id !== data.userId)
        }
        return prev
      })
    }

    socketService.on('user_status_changed', handleUserStatusChanged)

    return () => {
      socketService.off('user_status_changed', handleUserStatusChanged)
    }
  }, []) // Remove users dependency to prevent infinite loop

  useEffect(() => {
    // Filter users based on search query
    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.realName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [users, searchQuery])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await chatService.getUsers(1, 50, '')
      if (response.success) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const response = await chatService.getOnlineUsers()
      if (response.success) {
        setOnlineUsers(response.data)
      }
    } catch (error) {
      console.error('Error loading online users:', error)
    }
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(user => user.id === userId)
  }

  const getDisplayName = (user: User) => {
    return user.realName || user.name || user.username || 'Unknown User'
  }

  const getInitials = (user: User) => {
    const name = getDisplayName(user)
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleStartCall = async (user: User, type: 'audio' | 'video') => {
    try {
      const response = await callService.initiateCall({
        receiverId: user.id,
        type
      })
      if (response.success) {
        onStartCall(user, type)
      }
    } catch (error) {
      console.error('Error initiating call:', error)
    }
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000]"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users ({filteredUsers.length})
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedUserId === user.id ? 'bg-[#8B0000]/10 border-r-2 border-[#8B0000]' : ''
                  }`}
                  onClick={() => onUserSelect(user)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePicture} alt={getDisplayName(user)} />
                        <AvatarFallback className="bg-[#8B0000] text-white text-sm">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      {isUserOnline(user.id) && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {getDisplayName(user)}
                        </h4>
                        {(user as any).isPremium && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {user.occupation && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate">{user.occupation}</span>
                          </div>
                        )}
                        {user.country && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{user.country}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1">
                        <Badge 
                          variant={isUserOnline(user.id) ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {isUserOnline(user.id) ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUserSelect(user)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartCall(user, 'audio')
                        }}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartCall(user, 'video')
                        }}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
