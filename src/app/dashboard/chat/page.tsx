'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { useAuth } from '@/lib/store'
import { chatService, Conversation, Group } from '@/services/chatService'
import { socketService, setupSocketServiceReference } from '@/services/socketService'
import { 
  MessageSquare, 
  User as UserIcon,
  Plus,
  Phone,
  Video
} from 'lucide-react'
import CreateGroupModal from '@/components/CreateGroupModal';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  attachments?: Array<{ mimeType: string }>;
}

interface ConversationCardProps {
  conversation: Conversation
  currentUserId: string
  onClick: () => void
}

const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, currentUserId, onClick }) => {
  const router = useRouter()
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const isGroup = conversation.type === 'group';
  return (
    <div onClick={onClick} className="cursor-pointer p-4 bg-white rounded-lg shadow hover:bg-gray-50 flex items-center space-x-3">
            <Avatar className="h-12 w-12">
        {isGroup ? (
          conversation.groupAvatar ? (
            <AuthenticatedImage src={conversation.groupAvatar} alt={conversation.groupName} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full bg-blue-200 flex items-center justify-center rounded-full">
              <span className="font-bold text-lg text-blue-700">G</span>
            </div>
          )
        ) : (
          conversation.otherParticipant.profilePicture ? (
            <AuthenticatedImage src={conversation.otherParticipant.profilePicture} alt={conversation.otherParticipant.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
              <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
          )
              )}
            </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 truncate">
            {isGroup ? conversation.groupName : (conversation.otherParticipant.realName || conversation.otherParticipant.name)}
            {isGroup && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Group</span>}
              </h3>
              <div className="flex items-center space-x-2">
            {/* Call icons for direct only */}
            {!isGroup && (
              <>
                <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/chat/${conversation.id}?call=audio`) }} className="p-1 hover:bg-gray-100 rounded-full transition-colors" title="Audio Call"><Phone className="h-4 w-4 text-gray-600 hover:text-blue-600" /></button>
                <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/chat/${conversation.id}?call=video`) }} className="p-1 hover:bg-gray-100 rounded-full transition-colors" title="Video Call"><Video className="h-4 w-4 text-gray-600 hover:text-blue-600" /></button>
              </>
            )}
                {conversation.lastMessage && (
              <span className="text-xs text-gray-500">{formatTime(conversation.lastMessage.createdAt)}</span>
                )}
              </div>
            </div>
        <div className="truncate text-gray-600 text-sm">
          {isGroup ? (conversation.lastMessage ? `${conversation.lastMessage.sender?.realName || conversation.lastMessage.sender?.name}: ${conversation.lastMessage.content}` : 'No messages yet') : (conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet')}
        </div>
      </div>
    </div>
  );
};

export default function ConversationsPage() {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Set up socket service reference for auth store
    setupSocketServiceReference()

    async function fetchConversations() {
      try {
        const res = await chatService.getConversations();
        if (res.success) setConversations(res.data);
      } catch (error) {
        console.error('Error fetching conversations:', error)
      }
    }
    fetchConversations();
    
    async function fetchGroups() {
      try {
        const res = await chatService.getGroups();
        if (res.success) setGroups(res.data);
      } catch (error) {
        console.error('Error fetching groups:', error)
      }
    }
    fetchGroups();
    
    // Connect to socket for real-time updates
    const token = localStorage.getItem('chaatme_token')
    if (token) {
      console.log('[Chat] Connecting to socket with token')
      socketService.connect(token)
    }
  }, [isAuthenticated, router])

  // Socket.io setup for real-time updates
  useEffect(() => {
    if (!currentUser) return

    const handleNewMessage = (data: {
      message: Message;
      conversationId: string;
    }) => {
      // Show browser notification if not from current user
      if (data.message.senderId !== currentUser.id) {
        showNotification(data.message)
      }

      // Update conversation with new message
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === data.conversationId) {
            // Check if this message is newer than the current last message
            const currentLastMessageTime = conv.lastMessage 
              ? new Date(conv.lastMessage.createdAt).getTime() 
              : 0
            const newMessageTime = new Date(data.message.createdAt).getTime()
            
            // Only update if this message is newer
            if (newMessageTime > currentLastMessageTime) {
              return {
                ...conv,
                lastMessage: data.message,
                lastMessageAt: data.message.createdAt
              }
            }
            return conv
          }
          return conv
        })
        
        // Sort by last message time
        return updated.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
          return timeB - timeA
        })
      })
    }

    const handleMessageRead = (data: { messageId: string; readAt: string }) => {
      setConversations(prev => prev.map(conv => {
        if (conv.lastMessage && conv.lastMessage.id === data.messageId) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              isRead: true,
              readAt: data.readAt
            }
          }
        }
        return conv
      }))
    }

    const handleUserStatusChanged = (data: { userId: string; isOnline: boolean }) => {
      // Update conversations with online status
      setConversations(prev => prev.map(conv => ({
        ...conv,
        otherParticipant: {
          ...conv.otherParticipant,
          isOnline: data.userId === conv.otherParticipant.id ? data.isOnline : conv.otherParticipant.isOnline
        }
      })))
    }

    socketService.on('new_message', handleNewMessage)
    socketService.on('message_read', handleMessageRead)
    socketService.on('user_status_changed', handleUserStatusChanged)

    return () => {
      socketService.off('new_message', handleNewMessage)
      socketService.off('message_read', handleMessageRead)
      socketService.off('user_status_changed', handleUserStatusChanged)
    }
  }, [currentUser])

  // Browser notification function
  const showNotification = (message: {
    sender: { realName?: string; name: string; profilePicture?: string };
    content?: string;
    attachments?: Array<{ mimeType: string }>;
    conversationId: string;
  }) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const sender = message.sender.realName || message.sender.name
      const notificationContent = message.content || 
        (message.attachments && message.attachments.length > 0 ? 
          message.attachments[0].mimeType.startsWith('image/') ? '📷 Photo' : '📎 File' 
          : 'New message')

      new Notification(`${sender} sent a message`, {
        body: notificationContent,
        icon: message.sender.profilePicture || '/default-avatar.png',
        badge: '/favicon.ico',
        tag: `chat-conversation-${message.conversationId}`,
        silent: false
      })
    }
  }

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await chatService.getConversations()
      setConversations(response.data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConversationClick = (conversationId: string) => {
    console.group('handleConversationClick');
    console.log('Conversation ID:', conversationId);
    console.log('Router object:', router);
    
    try {
      if (!conversationId) {
        throw new Error('No conversation ID provided');
      }
      
      const path = `/dashboard/chat/${conversationId}`;
      console.log('Attempting navigation to path:', path);
      
      // Try navigation with error handling
      const navigate = async () => {
        try {
          await router.push(path);
          console.log('Navigation successful');
        } catch (error) {
          console.error('Navigation with push() failed:', error);
          try {
            await router.replace(path);
            console.log('Navigation with replace() successful');
          } catch (replaceError) {
            console.error('All navigation attempts failed:', replaceError);
            window.location.href = path; // Fallback to full page reload
          }
        }
      };
      
      navigate();
    } catch (error) {
      console.error('Error in handleConversationClick:', error);
    } finally {
      console.groupEnd();
    }
  }

  const handleCreateGroup = async (name: string, description: string, members: string[]) => {
    const res = await chatService.createGroup({ name, description, members });
    if (res.success) {
      setGroups(prev => [...prev, res.data]);
      setShowCreateGroup(false);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return null
  }

  // Test navigation function
  const testNavigation = () => {
    console.log('Test navigation button clicked');
    const testConversationId = conversations.length > 0 ? conversations[0].id : 'test-id';
    console.log('Navigating to conversation:', testConversationId);
    window.location.href = `/dashboard/chat/${testConversationId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <button 
              onClick={testNavigation}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
            >
              Test Navigation
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-2">
                Your conversations with other users
              </p>
            </div>
            <Link href="/dashboard/users">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* My Groups Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My Groups</h2>
            <Button onClick={() => setShowCreateGroup(true)}><Plus className="h-4 w-4 mr-2" />Create Group</Button>
          </div>
          <div className="space-y-2 mb-8">
            {groups.map(group => (
              <div key={group.id} className="p-3 bg-white rounded shadow flex items-center cursor-pointer hover:bg-blue-50" onClick={() => router.push(`/dashboard/chat/${group.conversation_id}`)}>
                <Avatar className="h-10 w-10">
                  {group.avatar_url ? (
                    <AuthenticatedImage src={group.avatar_url} alt={group.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-blue-200 flex items-center justify-center rounded-full">
                      <span className="font-bold text-lg text-blue-700">G</span>
                    </div>
                  )}
                </Avatar>
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-gray-900">{group.name}</div>
                  <div className="text-xs text-gray-500">{group.member_count} members</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversations */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start chatting with other users to see your conversations here
            </p>
            <Link href="/dashboard/users">
              <Button>
                <UserIcon className="h-4 w-4 mr-2" />
                Find People to Chat With
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUser.id}
                onClick={() => handleConversationClick(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreate={handleCreateGroup} />
      )}
    </div>
  )
} 