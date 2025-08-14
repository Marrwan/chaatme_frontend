'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Message, User } from '@/services/chatService'
import { Check, CheckCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  currentUserId: string
  sender: User
  isLastMessage?: boolean
  showAvatar?: boolean
}

export default function MessageBubble({ 
  message, 
  currentUserId, 
  sender, 
  isLastMessage = false,
  showAvatar = true 
}: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getMessageStatus = () => {
    if (isOwnMessage) {
      switch (message.status) {
        case 'pending':
          return <Clock className="h-3 w-3 text-gray-400" />
        case 'sent':
          return <Check className="h-3 w-3 text-gray-400" />
        case 'delivered':
          return <CheckCheck className="h-3 w-3 text-gray-400" />
        case 'read':
          return <CheckCheck className="h-3 w-3 text-blue-500" />
        default:
          return <Clock className="h-3 w-3 text-gray-400" />
      }
    }
    return null
  }

  const getMessageContent = () => {
    if (message.messageType === 'image' && message.attachments?.[0]) {
      return (
        <div className="space-y-2">
          <img 
            src={message.attachments[0].file_url} 
            alt="Message attachment"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachments![0].file_url, '_blank')}
          />
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>
      )
    }

    if (message.messageType === 'file' && message.attachments?.[0]) {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.attachments[0].original_name}
              </p>
              <p className="text-xs text-gray-500">
                {(message.attachments[0].size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button 
              onClick={() => window.open(message.attachments![0].file_url, '_blank')}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              Download
            </button>
          </div>
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>
      )
    }

    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {message.content}
      </p>
    )
  }

  return (
    <div className={cn(
      "flex items-end space-x-2 mb-4",
      isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
    )}>
      {showAvatar && !isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender.profilePicture} alt={getDisplayName(sender)} />
          <AvatarFallback className="text-xs">
            {getInitials(sender)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col max-w-xs lg:max-w-md",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        {!isOwnMessage && (
          <p className="text-xs text-gray-500 mb-1 px-2">
            {getDisplayName(sender)}
          </p>
        )}
        
        <div className={cn(
          "rounded-2xl px-4 py-2 shadow-sm break-words relative",
          isOwnMessage 
            ? "bg-purple-600 text-white rounded-br-md" 
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        )}>
          {getMessageContent()}
          
          {/* WhatsApp-style timestamp and status */}
          <div className={cn(
            "flex items-center justify-end space-x-1 mt-1",
            isOwnMessage ? "text-white/70" : "text-gray-500"
          )}>
            <span className="text-xs">
              {formatTime(message.createdAt)}
            </span>
            {getMessageStatus()}
          </div>
        </div>
      </div>
      
      {showAvatar && isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender.profilePicture} alt={getDisplayName(sender)} />
          <AvatarFallback className="text-xs">
            {getInitials(sender)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
