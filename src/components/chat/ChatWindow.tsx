'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { chatService, type Message, type User, type Conversation } from '@/services/chatService'
import { callService } from '@/services/callService'
import { socketService } from '@/services/socketService'
import MessageBubble from './MessageBubble'
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Phone, 
  Video, 
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Mic,
  MessageCircle
} from 'lucide-react'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  selectedUser: User | null
  onStartCall: (user: User, type: 'audio' | 'video') => void
  currentUserId?: string
}

// Use a counter for deterministic message ID generation
let messageIdCounter = 0

export default function ChatWindow({ selectedUser, onStartCall, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectedUser) {
      loadConversation()
    }
  }, [selectedUser])

  useEffect(() => {
    // Socket event handlers for real-time features
    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversation?.id) {
        // Only add message if it's not from current user (to avoid duplicates)
        if (data.message.senderId !== currentUserId) {
          setMessages(prev => [...prev, data.message])
          // Mark message as delivered and read
          socketService.sendMessageDelivered(data.message.id)
          socketService.sendMessageRead(data.message.id)
        }
      }
    }

    const handleMessageSent = (data: any) => {
      // Update message status to sent
      setMessages(prev => prev.map(msg => 
        msg.tempMessageId === data.tempMessageId 
          ? { ...msg, id: data.messageId, status: 'sent' as const }
          : msg
      ))
    }

    const handleMessageDelivered = (data: any) => {
      // Update message status to delivered
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, status: 'delivered' as const }
          : msg
      ))
    }

    const handleMessageRead = (data: any) => {
      // Update message status to read
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, status: 'read' as const }
          : msg
      ))
    }

    const handleUserTyping = (data: any) => {
      if (data.conversationId === conversation?.id && data.userId !== currentUserId) {
        setTypingUsers(prev => new Set(prev).add(data.userId))
      }
    }

    const handleUserStoppedTyping = (data: any) => {
      if (data.conversationId === conversation?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }
    }

    // Register event handlers
    socketService.on('new_message', handleNewMessage)
    socketService.on('message_sent', handleMessageSent)
    socketService.on('message_delivered', handleMessageDelivered)
    socketService.on('message_read', handleMessageRead)
    socketService.on('user_typing', handleUserTyping)
    socketService.on('user_stopped_typing', handleUserStoppedTyping)

    // Cleanup
    return () => {
      socketService.off('new_message', handleNewMessage)
      socketService.off('message_sent', handleMessageSent)
      socketService.off('message_delivered', handleMessageDelivered)
      socketService.off('message_read', handleMessageRead)
      socketService.off('user_typing', handleUserTyping)
      socketService.off('user_stopped_typing', handleUserStoppedTyping)
    }
  }, [conversation?.id, selectedUser?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversation = async () => {
    if (!selectedUser) return

    try {
      setIsLoading(true)
      // Get or create conversation
      const convResponse = await chatService.getOrCreateConversation(selectedUser.id)
      if (convResponse.success) {
        setConversation(convResponse.data)
        // Load messages
        const messagesResponse = await chatService.getMessages(convResponse.data.id)
        if (messagesResponse.success) {
          setMessages(messagesResponse.data)
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || isSending) return

    const tempMessageId = `temp_${++messageIdCounter}`
    const tempMessage: Message = {
      id: tempMessageId,
      conversationId: conversation.id,
      senderId: currentUserId || '',
      content: newMessage.trim(),
      messageType: 'text',
      status: 'pending',
      isRead: false,
      isDeleted: false,
      tempMessageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: selectedUser!
    }

    // Add temporary message to UI immediately
    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')

    try {
      setIsSending(true)
      
      // Send via socket for real-time delivery
      socketService.sendMessage({
        conversationId: conversation.id,
        content: newMessage.trim(),
        messageType: 'text',
        tempMessageId
      })

      // Also send via API for persistence
      const response = await chatService.sendMessage(conversation.id, {
        content: newMessage.trim(),
        messageType: 'text'
      })
      
      if (response.success) {
        // Update the temporary message with the real message data
        setMessages(prev => prev.map(msg => 
          msg.tempMessageId === tempMessageId 
            ? { ...response.data, tempMessageId }
            : msg
        ))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.tempMessageId !== tempMessageId))
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !conversation) return

    try {
      setIsSending(true)
      const response = await chatService.sendMessage(conversation.id, {
        messageType: 'file',
        attachments: files
      })
      
      if (response.success) {
        setMessages(prev => [...prev, response.data])
      }
    } catch (error) {
      console.error('Error sending file:', error)
    } finally {
      setIsSending(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    // Send typing indicator
    if (conversation) {
      socketService.sendTyping(conversation.id)
    }
  }

  const handleInputBlur = () => {
    // Send stop typing indicator
    if (conversation) {
      socketService.sendStopTyping(conversation.id)
    }
  }



  if (!selectedUser) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium mb-2">Select a user to start chatting</h3>
            <p>Choose someone from the user list to begin a conversation</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedUser.profilePicture} alt={getDisplayName(selectedUser)} />
              <AvatarFallback className="bg-green-500 text-white">
                {getInitials(selectedUser)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{getDisplayName(selectedUser)}</CardTitle>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  selectedUser.isOnline ? "bg-green-500" : "bg-gray-400"
                )} />
                <div className="text-sm text-gray-500">
                  {selectedUser.isOnline ? 'Online' : 'Offline'}
                  {selectedUser.occupation && ` • ${selectedUser.occupation}`}
                  {selectedUser.country && ` • ${selectedUser.country}`}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStartCall(selectedUser, 'audio')}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStartCall(selectedUser, 'video')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-medium mb-2">No messages yet</p>
                  <p>Start the conversation with {getDisplayName(selectedUser)}!</p>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id || message.tempMessageId}
                      message={message}
                      currentUserId={currentUserId || ''}
                      sender={message.sender || selectedUser!}
                      isLastMessage={index === messages.length - 1}
                      showAvatar={true}
                    />
                  ))}
                  
                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex items-end space-x-2 mb-4">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={selectedUser?.profilePicture} alt={getDisplayName(selectedUser!)} />
                        <AvatarFallback className="text-xs">
                          {getInitials(selectedUser!)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-2xl px-4 py-2 rounded-bl-md">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <EmojiPicker
                  onEmojiSelect={(emoji) => {
                    setNewMessage(prev => prev + emoji)
                  }}
                />
                
                <div className="flex-1">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onBlur={handleInputBlur}
                    disabled={isSending}
                    className="border-0 focus-visible:ring-0 bg-gray-100 rounded-full px-4 py-2"
                  />
                </div>
                
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 p-0"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
