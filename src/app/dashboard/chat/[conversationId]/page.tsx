'use client'

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { useAuth } from '@/lib/store'
import { chatService, Message, User, Conversation } from '@/services/chatService'
import { socketService, setupSocketServiceReference } from '@/services/socketService'
import { useToast } from '@/lib/useToast'
import { CallInterface } from '@/components/ui/call-interface'
import IncomingCallModal from '@/components/ui/incoming-call-modal'
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Image, 
  File, 
  Download, 
  Trash2, 
  Check,
  CheckCheck,
  User as UserIcon,
  Circle,
  Phone,
  Video,
  Users
} from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onDelete: (messageId: string) => void
  showSender?: boolean // For group chat
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, onDelete, showSender }) => {
  const [showActions, setShowActions] = useState(false)
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const token = localStorage.getItem('chaatme_token')
      if (!token) {
        console.error('No authentication token found')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}${fileUrl}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && showSender && (
          <div className="flex items-center mb-1">
            <Avatar className="h-6 w-6 mr-2">
              {message.sender.profilePicture ? (
                <AuthenticatedImage
                  src={message.sender.profilePicture}
                  alt={message.sender.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
                  <UserIcon className="h-3 w-3 text-gray-400" />
                </div>
              )}
            </Avatar>
            <span className="text-xs text-gray-600 font-medium">
              {message.sender.realName || message.sender.name}
            </span>
          </div>
        )}
        
        <div
          className={`relative rounded-lg px-3 py-2 ${
            isOwn 
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {message.content && (
            <p className="text-sm break-words">{message.content}</p>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.file_type)
                
                if (attachment.file_type.startsWith('image/')) {
                  return (
                    <div key={attachment.id} className="relative">
                      <AuthenticatedImage
                        src={attachment.thumbnail_url || attachment.file_url}
                        alt={attachment.original_name}
                        className="max-w-full h-auto rounded cursor-pointer"
                        onClick={() => downloadFile(attachment.file_url, attachment.original_name)}
                      />
                      <div className="absolute top-2 right-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                          onClick={() => downloadFile(attachment.file_url, attachment.original_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                }
                return (
                  <div 
                    key={attachment.id} 
                    className="flex items-center space-x-2 p-2 rounded border border-gray-200 bg-white/10 cursor-pointer hover:bg-white/20"
                    onClick={() => downloadFile(attachment.file_url, attachment.original_name)}
                  >
                    <FileIcon className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{attachment.original_name}</p>
                      <p className="text-xs opacity-75">{formatFileSize(attachment.size)}</p>
                    </div>
                    <Download className="h-4 w-4" />
                  </div>
                )
              })}
            </div>
          )}
          
          {showActions && isOwn && (
            <div className="absolute top-0 right-0 transform translate-x-full -translate-y-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 bg-white border-red-200 hover:bg-red-50"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
        
        <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <div className="flex items-center">
              {message.isRead ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface TypingIndicatorProps {
  isTyping: boolean
  user?: User
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, user }) => {
  if (!isTyping || !user) return null
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Avatar className="h-6 w-6">
        {user.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={user.name} 
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
            <UserIcon className="h-3 w-3 text-gray-400" />
          </div>
        )}
      </Avatar>
      <div className="flex items-center space-x-1 text-gray-500">
        <span className="text-sm">{user.realName || user.name} is typing</span>
        <div className="flex space-x-1">
          <Circle className="h-1 w-1 fill-current animate-pulse" />
          <Circle className="h-1 w-1 fill-current animate-pulse" style={{ animationDelay: '0.2s' }} />
          <Circle className="h-1 w-1 fill-current animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}

// Use a counter for deterministic message ID generation
let conversationMessageIdCounter = 0

function ChatPageContent() {
  const router = useRouter()
  const { conversationId } = useParams()
  const searchParams = useSearchParams()
  const { user: currentUser } = useAuth()
  const toast = useToast()
  
  // Chat state
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<User | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Call state
  const [callState, setCallState] = useState<'idle' | 'initiating' | 'ringing' | 'incoming_ringing' | 'outgoing_ringing' | 'connecting' | 'active' | 'ended'>('idle')
  const [incomingCall, setIncomingCall] = useState(false)
  const [callType, setCallType] = useState<'audio' | 'video'>('audio')
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [incomingCallData, setIncomingCallData] = useState<{
    fromUserId: string;
    callType: 'audio' | 'video';
    conversationId: string;
    from: {
      id: string;
      name: string;
      avatar?: string;
    };
  } | null>(null)

  // Call functions
  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    })

    pc.onicecandidate = (event) => {
      if (event.candidate && conversation?.otherParticipant) {
        console.log('[Call] Sending ICE candidate:', event.candidate)
        socketService.sendIceCandidate({
          targetUserId: conversation.otherParticipant.id,
          candidate: event.candidate,
          conversationId: conversationId as string
        })
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log('[Call] ICE connection state:', pc.iceConnectionState)
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log('[Call] ICE connection established successfully')
        setCallState('active')
      } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.log('[Call] ICE connection failed or disconnected')
        endCall()
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('[Call] Connection state:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        console.log('[Call] WebRTC connection established')
        setCallState('active')
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log('[Call] WebRTC connection failed')
        endCall()
      }
    }

    pc.ontrack = (event) => {
      console.log('[Call] Remote stream received:', event.streams[0])
      setRemoteStream(event.streams[0])
    }

    return pc
  }

  const getUserMedia = async (audio: boolean, video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video })
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }

  const initiateCall = useCallback(async (type: 'audio' | 'video') => {
    if (!conversation?.otherParticipant) return

    try {
      setCallType(type)
      setCallState('initiating')

      // Get user media with better error handling
      const stream = await getUserMedia(true, type === 'video')
      console.log('[Call] Local media stream obtained:', stream.getTracks().map(t => t.kind))
      
      // Set up peer connection
      const pc = setupPeerConnection()
      setPeerConnection(pc)

      // Add stream to peer connection
      stream.getTracks().forEach(track => {
        console.log('[Call] Adding track to peer connection:', track.kind, track.id)
        pc.addTrack(track, stream)
      })

      // Create offer with proper constraints
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video'
      }
      
      console.log('[Call] Creating offer with options:', offerOptions)
      const offer = await pc.createOffer(offerOptions)
      await pc.setLocalDescription(offer)
      console.log('[Call] Local description set:', offer.type)

      // Send call initiation
      socketService.initiateCall({
        targetUserId: conversation.otherParticipant.id,
        callType: type,
        conversationId: conversationId as string,
        from: {
          id: currentUser?.id || '',
          name: currentUser?.realName || currentUser?.name || '',
          avatar: currentUser?.profilePicture
        }
      })

      // Send offer
      socketService.sendOffer({
        targetUserId: conversation.otherParticipant.id,
        offer,
        conversationId: conversationId as string
      })

      setCallState('outgoing_ringing')
      console.log('[Call] Call initiated successfully')
    } catch (error) {
      console.error('Error initiating call:', error)
      setCallState('idle')
      toast.showError('Failed to start call. Please check your microphone and camera permissions.', 'Error')
    }
  }, [conversation, conversationId, currentUser, toast])

  // Ensure socket is connected when component mounts
  useEffect(() => {
    // Set up socket service reference for auth store
    setupSocketServiceReference()
    
    const token = localStorage.getItem('chaatme_token')
    if (token && currentUser && !socketService.isConnected()) {
      console.log('🔌 [Chat] Initializing socket connection for chat page')
      socketService.connect(token)
    }
  }, [currentUser])

  // Check for call initiation from URL params
  useEffect(() => {
    const callParam = searchParams.get('call')
    if (callParam === 'audio' || callParam === 'video') {
      initiateCall(callParam)
    }
  }, [searchParams, initiateCall])

  // Fetch conversation and messages
  useEffect(() => {
    if (!conversationId || !currentUser) return
    
    const fetchConversation = async () => {
      try {
        const convRes = await chatService.getConversation(conversationId as string)
        if (convRes.success) {
          setConversation(convRes.data)
        }
      } catch (error) {
        console.error('Error fetching conversation:', error)
      }
    }

    const fetchMessages = async () => {
      try {
        const res = await chatService.getMessages(conversationId as string)
        if (res.success) {
          setMessages(res.data)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchConversation()
    fetchMessages()
    
    // Ensure socket is connected before joining conversation
    const joinConversationWithRetry = () => {
      if (socketService.isConnected()) {
        console.log('[Chat] Joining conversation:', conversationId)
        socketService.joinConversation(conversationId as string)
      } else {
        console.log('[Chat] Socket not connected, retrying in 1s...')
        setTimeout(joinConversationWithRetry, 1000)
      }
    }
    
    joinConversationWithRetry()
    
    return () => {
      if (socketService.isConnected()) {
        socketService.leaveConversation(conversationId as string)
      }
    }
  }, [conversationId, currentUser])

  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = (...args: unknown[]) => {
      const data = args[0] as any
      console.log('[Chat] New message event received:', data)
      
      // Handle different data formats
      let messageData: Message
      let msgConversationId: string
      
      if (data.message && data.conversationId) {
        // Format: { message: Message, conversationId: string }
        messageData = data.message
        msgConversationId = data.conversationId
        
        // Replace temporary message with real message if it exists
        if (data.tempMessageId) {
          setMessages((prev) => {
            const filtered = prev.filter(msg => msg.id !== data.tempMessageId)
            return [...filtered, messageData]
          })
          return
        }
      } else if (data.content && data.senderId) {
        // Format: direct message data (legacy)
        messageData = {
          id: data.tempMessageId || `msg-${Date.now()}`,
          senderId: data.senderId,
          content: data.content,
          messageType: data.messageType || 'text',
          conversationId: data.conversationId,
          createdAt: data.timestamp || new Date().toISOString(),
          updatedAt: data.timestamp || new Date().toISOString(),
          isRead: false,
          isDeleted: false,
          sender: {
            id: data.senderId,
            name: 'User', // Will be populated by API
            username: 'user',
            realName: 'User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          attachments: []
        } as Message
        msgConversationId = data.conversationId
      } else {
        console.warn('[Chat] Unrecognized message format:', data)
        return
      }
      
      if (msgConversationId === conversationId) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg.id === messageData.id || 
            (msg.id.startsWith('temp-') && messageData.id.startsWith('temp-') && msg.content === messageData.content))
          if (exists) {
            return prev
          }
          return [...prev, messageData]
        })
      }
    }

    const handleTyping = (...args: unknown[]) => {
      const data = args[0] as { userId: string; conversationId: string }
      if (data.conversationId === conversationId && data.userId !== currentUser?.id) {
        setIsTyping(true)
        // You would need to fetch user data here
      }
    }

    const handleStopTyping = (...args: unknown[]) => {
      const data = args[0] as { userId: string; conversationId: string }
      if (data.conversationId === conversationId && data.userId !== currentUser?.id) {
        setIsTyping(false)
        setTypingUser(null)
      }
    }

    // Call event listeners
    const handleIncomingCall = (...args: unknown[]) => {
      const data = args[0] as {
        fromUserId: string;
        callType: 'audio' | 'video';
        conversationId: string;
        from: { id: string; name: string; avatar?: string };
      }
      console.log('[Call] Incoming call received:', data)
      
      // Only show incoming call if we're not already in a call
      if (callState === 'idle') {
        setIncomingCallData(data)
        setIncomingCall(true)
        setCallType(data.callType)
        setCallState('incoming_ringing')
        console.log('[Call] Incoming call modal should now be visible')
      } else {
        console.log('[Call] Rejecting incoming call - already in a call state:', callState)
        // Automatically reject the call if we're busy
        socketService.rejectCall({
          targetUserId: data.fromUserId,
          conversationId: data.conversationId
        })
      }
    }

    const handleCallAccepted = () => {
      console.log('[Call] Call accepted')
      setCallState('connecting')
      setIncomingCall(false)
    }

    const handleCallEnded = () => {
      console.log('[Call] Call ended')
      endCall()
    }

    const handleCallRejected = () => {
      console.log('[Call] Call rejected')
      endCall()
    }

    // WebRTC signaling
    const handleOfferReceived = async (...args: unknown[]) => {
      const data = args[0] as {
        fromUserId: string;
        offer: RTCSessionDescriptionInit;
        conversationId: string;
      }
      console.log('[Call] Offer received:', data)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.offer)
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        socketService.sendAnswer({
          targetUserId: data.fromUserId,
          answer,
          conversationId: conversationId as string
        })
      }
    }

    const handleAnswerReceived = async (...args: unknown[]) => {
      const data = args[0] as {
        fromUserId: string;
        answer: RTCSessionDescriptionInit;
        conversationId: string;
      }
      console.log('[Call] Answer received:', data)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer)
      }
    }

    const handleIceCandidateReceived = async (...args: unknown[]) => {
      const data = args[0] as {
        fromUserId: string;
        candidate: RTCIceCandidateInit;
        conversationId: string;
      }
      console.log('[Call] ICE candidate received:', data)
      if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate)
      }
    }

    const handleMessageSent = (...args: unknown[]) => {
      const data = args[0] as any
      console.log('[Chat] Message sent confirmation received:', data)
      
      // Replace temporary message with confirmed message
      if (data.tempMessageId && data.messageId) {
        setMessages((prev) => {
          return prev.map(msg => 
            msg.id === data.tempMessageId 
              ? { ...msg, id: data.messageId, confirmed: true }
              : msg
          )
        })
      }
    }

    const handleMessageError = (...args: unknown[]) => {
      const data = args[0] as any
      console.error('[Chat] Message error received:', data)
      
      // Remove failed message and show error
      if (data.tempMessageId) {
        setMessages((prev) => prev.filter(msg => msg.id !== data.tempMessageId))
        toast.showError('Failed to send message', 'Error')
      }
    }

    // Register socket event listeners with proper cleanup
    const eventListeners = [
      { event: 'new_message', handler: handleNewMessage },
      { event: 'user_typing', handler: handleTyping },
      { event: 'user_stopped_typing', handler: handleStopTyping },
      { event: 'message_sent', handler: handleMessageSent },
      { event: 'message_error', handler: handleMessageError },
      { event: 'incoming_call', handler: handleIncomingCall },
      { event: 'call_accepted', handler: handleCallAccepted },
      { event: 'call_ended', handler: handleCallEnded },
      { event: 'call_rejected', handler: handleCallRejected },
      { event: 'call_offer_received', handler: handleOfferReceived },
      { event: 'call_answer_received', handler: handleAnswerReceived },
      { event: 'call_ice_candidate_received', handler: handleIceCandidateReceived }
    ]

    // Register all event listeners
    eventListeners.forEach(({ event, handler }) => {
      console.log(`[Chat] Registering event listener: ${event}`)
      socketService.on(event, handler)
    })

    return () => {
      // Clean up all event listeners
      eventListeners.forEach(({ event, handler }) => {
        console.log(`[Chat] Cleaning up event listener: ${event}`)
        socketService.off(event, handler)
      })
    }
  }, [conversationId, currentUser, peerConnection])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Message handlers
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !conversationId) return

    const tempMessageId = `temp-${++conversationMessageIdCounter}`
    const messageData = {
      conversationId: conversationId as string,
      content: newMessage,
      tempMessageId,
      messageType: 'text' as const,
    }

    // Add optimistic message
    const optimisticMessage: Message = {
      id: tempMessageId,
      senderId: currentUser?.id || '',
      content: newMessage,
      messageType: 'text',
      conversationId: conversationId as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRead: false,
      isDeleted: false,
      status: 'pending',
      sender: {
        id: currentUser?.id || '',
        name: currentUser?.name || 'User',
        realName: currentUser?.realName || currentUser?.name || 'User',
        username: currentUser?.username || 'user',
        profilePicture: currentUser?.profilePicture,
        interests: currentUser?.interests,
        hobbies: currentUser?.hobbies,
        occupation: currentUser?.occupation,
        country: currentUser?.country,
        state: currentUser?.state,
        isOnline: currentUser?.isOnline,
        createdAt: currentUser?.createdAt || new Date().toISOString()
      },
      attachments: []
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage('')
    
    // Send via socket only - the backend will handle saving to database
    socketService.sendMessage(messageData)
    
    // Listen for message error
    const handleMessageError = (data: any) => {
      if (data.tempMessageId === tempMessageId) {
        console.error('Message sending failed:', data.error)
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(msg => msg.id !== tempMessageId))
        toast.showError('Failed to send message', 'Error')
      }
    }
    
    socketService.on('message_error', handleMessageError)
    
    // Clean up error listener after 5 seconds
    setTimeout(() => {
      socketService.off('message_error', handleMessageError)
    }, 5000)
  }

  const handleTyping = () => {
    socketService.sendTyping(conversationId as string)
  }

  const handleStopTyping = () => {
    socketService.sendStopTyping(conversationId as string)
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }


  const acceptCall = async () => {
    if (!incomingCallData) {
      console.warn('[Call] No incoming call data available')
      return
    }

    try {
      console.log('[Call] Accepting call...', incomingCallData)
      setIncomingCall(false)
      setCallState('connecting')

      // Get user media with better error handling
      const stream = await getUserMedia(true, callType === 'video')
      console.log('[Call] Local media stream obtained for incoming call:', stream.getTracks().map(t => t.kind))
      
      // Set up peer connection
      const pc = setupPeerConnection()
      setPeerConnection(pc)

      // Add stream to peer connection
      stream.getTracks().forEach(track => {
        console.log('[Call] Adding track to peer connection for incoming call:', track.kind, track.id)
        pc.addTrack(track, stream)
      })

      // Send accept signal
      socketService.acceptCall({
        targetUserId: incomingCallData.fromUserId,
        conversationId: conversationId as string
      })

      setCallState('active')
      console.log('[Call] Call accepted successfully')
    } catch (error) {
      console.error('Error accepting call:', error)
      setIncomingCall(false)
      setIncomingCallData(null)
      endCall()
      toast.showError('Failed to accept call. Please check your microphone and camera permissions.', 'Error')
    }
  }

  const declineCall = () => {
    if (!incomingCallData) {
      console.warn('[Call] No incoming call data available for decline')
      return
    }

    console.log('[Call] Declining call...', incomingCallData)
    
    socketService.rejectCall({
      targetUserId: incomingCallData.fromUserId,
      conversationId: conversationId as string
    })

    setIncomingCall(false)
    setCallState('idle')
    setIncomingCallData(null)
    console.log('[Call] Call declined successfully')
  }

  const endCall = () => {
    // Clean up streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
      setRemoteStream(null)
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close()
      setPeerConnection(null)
    }

    // Send end call signal
    if (conversation?.otherParticipant && callState !== 'idle') {
      socketService.endCall({
        targetUserId: conversation.otherParticipant.id,
        conversationId: conversationId as string
      })
    }

    setCallState('idle')
    setIncomingCall(false)
    setIncomingCallData(null)
    setCallDuration(0)
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleCamera = () => {
    if (localStream && callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsCameraOn(videoTrack.enabled)
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
  }

  if (!currentUser) {
    return null
  }

  // Call interface
  if (callState !== 'idle') {
    return (
      <CallInterface
        callState={callState}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onEndCall={endCall}
        participantName={conversation?.otherParticipant?.realName || conversation?.otherParticipant?.name || 'Unknown'}
        participantAvatar={conversation?.otherParticipant?.profilePicture}
        callDuration={callDuration}
        onToggleSpeaker={toggleSpeaker}
        isSpeakerOn={isSpeakerOn}
        isVideo={callType === 'video'}
        isCameraOn={isCameraOn}
        onToggleCamera={toggleCamera}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        onAcceptCall={acceptCall}
        onDeclineCall={declineCall}
        localStream={localStream}
        remoteStream={remoteStream}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Incoming call modal */}
      {incomingCall && incomingCallData && (
        <IncomingCallModal
          isVisible={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
          callerName={incomingCallData.from?.name || 'Unknown Caller'}
          callerAvatar={incomingCallData.from?.avatar}
          callType={callType}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between py-3 px-4 bg-white border-b shadow-sm">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="mr-3 p-1">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <Avatar className="h-10 w-10 mr-3">
            {conversation?.type === 'group' ? (
              conversation.groupAvatar ? (
                <AuthenticatedImage
                  src={conversation.groupAvatar}
                  alt={conversation.groupName || 'Group'}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-blue-200 flex items-center justify-center rounded-full">
                  <Users className="h-5 w-5 text-blue-700" />
                </div>
              )
            ) : (
              conversation?.otherParticipant?.profilePicture ? (
                <AuthenticatedImage
                  src={conversation.otherParticipant.profilePicture}
                  alt={conversation.otherParticipant.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
              )
            )}
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">
              {conversation?.type === 'group' 
                ? conversation.groupName 
                : (conversation?.otherParticipant?.realName || conversation?.otherParticipant?.name || 'Chat')
              }
            </h2>
            <p className="text-sm text-gray-500">
              {conversation?.type === 'group' 
                ? `${conversation.memberCount || 0} members`
                : (conversation?.otherParticipant?.isOnline ? 'Online' : 'Offline')
              }
            </p>
          </div>
        </div>
        
        {/* Call buttons - only for direct conversations */}
        {conversation?.type !== 'group' && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => initiateCall('audio')}
              className="p-2"
            >
              <Phone className="h-5 w-5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => initiateCall('video')}
              className="p-2"
            >
              <Video className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm">Start a conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUser?.id}
                onDelete={handleDeleteMessage}
                showSender={conversation?.type === 'group'}
              />
            ))}
            <div ref={messagesEndRef} />
            {isTyping && typingUser && (
              <TypingIndicator isTyping={isTyping} user={typingUser} />
            )}
          </>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              // Handle file upload
              console.log('File selected:', e.target.files)
            }}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            multiple
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-2"
          >
            <Paperclip className="h-5 w-5 text-gray-600" />
          </Button>
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={handleTyping}
            onBlur={handleStopTyping}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
