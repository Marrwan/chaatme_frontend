'use client'

import { io, Socket } from 'socket.io-client'
import { Message } from './chatService'

export interface SocketMessage {
  message: Message
  conversationId: string
}

export interface TypingIndicator {
  userId: string
  conversationId: string
  timestamp: string
}

export interface MessageReadStatus {
  messageId: string
  readBy: string
  readAt: string
}

export interface UserStatusChanged {
  userId: string
  isOnline: boolean
  timestamp: string
}

export interface MessageSentConfirmation {
  tempMessageId: string
  timestamp: string
}

export interface MessageDeleted {
  messageId: string
  deletedBy: string
}

type SocketEventCallback = (...args: unknown[]) => void

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers: Map<string, SocketEventCallback[]> = new Map()
  private isConnecting = false
  private connectionId: string | null = null // Track unique connection

  /**
   * Initialize socket connection
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected, skipping...')
      return
    }

    if (this.isConnecting) {
      console.log('🔌 Socket connection already in progress, skipping...')
      return
    }

    this.isConnecting = true

    // Get the backend URL from API URL by removing /api suffix
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const backendUrl = apiUrl.replace('/api', '')
    
    // Generate unique connection ID to prevent duplicates
    this.connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🔌 Connecting to socket server:', backendUrl)
    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
    console.log('🆔 Connection ID:', this.connectionId)
    
    // Detect browser for Edge-specific handling
    const isEdge = navigator.userAgent.includes('Edg') || navigator.userAgent.includes('Edge')
    console.log('🌐 Browser detected:', isEdge ? 'Edge' : 'Other')
    
    this.socket = io(backendUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      withCredentials: true,
      secure: process.env.NODE_ENV === 'production',
      timeout: 10000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      path: '/socket.io/',
      query: {
        token: token,
        browser: isEdge ? 'edge' : 'other',
        connectionId: this.connectionId,
        timestamp: Date.now().toString()
      }
    })

    // Setup event handlers BEFORE connection to ensure they're registered early
    this.setupEventHandlers()

    // Add comprehensive socket event logging using onAny
    this.socket.onAny((eventName, ...args) => {
      console.log(`\n=== SOCKET EVENT RECEIVED ===`)
      console.log(`🔌 Event: ${eventName}`)
      console.log(`📦 Data:`, args)
      console.log(`⏰ Timestamp:`, new Date().toISOString())
      console.log(`🌐 Browser:`, isEdge ? 'Edge' : 'Other')
      console.log(`🆔 Connection ID:`, this.connectionId)
      
      // Special highlighting for key events we're debugging
      if (eventName === 'incoming_call') {
        console.log(`🚨 INCOMING_CALL EVENT DETECTED! Data:`, JSON.stringify(args, null, 2))
      }
      if (eventName === 'new_message') {
        console.log(`📨 NEW_MESSAGE EVENT DETECTED! Data:`, JSON.stringify(args, null, 2))
      }
      
      console.log(`=== END SOCKET EVENT ===\n`)
    })
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...')
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnecting = false
    this.connectionId = null
    this.clearEventHandlers()
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Get connection ID
   */
  getConnectionId(): string | null {
    return this.connectionId
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    const isEdge = navigator.userAgent.includes('Edg') || navigator.userAgent.includes('Edge')

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully:', this.socket?.id)
      console.log('🌐 Browser:', isEdge ? 'Edge' : 'Other')
      this.reconnectAttempts = 0
      this.emitToHandlers('connected')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      console.log('🌐 Browser:', isEdge ? 'Edge' : 'Other')
      this.emitToHandlers('disconnected', reason)
      
      // Edge-specific reconnection logic
      if (isEdge) {
        console.log('🔄 Edge browser detected - using enhanced reconnection logic')
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 10000)
          console.log(`🔄 Edge: Attempting to reconnect in ${delay}ms (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
          setTimeout(() => {
            this.reconnectAttempts++
            if (this.socket) {
              this.socket.connect()
            }
          }, delay)
        }
      } else {
        // Standard reconnection logic for other browsers
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
          setTimeout(() => {
            this.reconnectAttempts++
            this.socket?.connect()
          }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
        }
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message)
      console.log('🌐 Browser:', isEdge ? 'Edge' : 'Other')
      
      // Edge-specific error handling
      if (isEdge) {
        console.log('🔄 Edge: Connection error detected, will retry with polling fallback')
        // Force polling transport for Edge on connection error
        if (this.socket && this.socket.io && this.socket.io.opts.transports) {
          console.log('🔄 Edge: Switching to polling transport')
          this.socket.io.opts.transports = ['polling' as any]
        }
      }
      
      this.emitToHandlers('error', error)
    })

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
      console.log('🌐 Browser:', isEdge ? 'Edge' : 'Other')
      this.emitToHandlers('error', error)
    })

    // Add transport upgrade handling for Edge
    this.socket.on('upgrade', () => {
      console.log('🔄 Socket transport upgraded')
      console.log('🌐 Browser:', isEdge ? 'Edge' : 'Other')
    })

    this.socket.on('upgradeError', (error) => {
      console.error('❌ Socket upgrade error:', error)
      console.log('🌐 Browser:', isEdge ? 'Edge' : 'Other')
      // For Edge, fallback to polling if upgrade fails
      if (isEdge && this.socket) {
        console.log('🔄 Edge: Upgrade failed, staying with polling transport')
      }
    })

    // Chat-specific events
    this.socket.on('new_message', (data) => {
      console.log('📨 New message received:', data)
      this.emitToHandlers('new_message', data)
      // Optionally, trigger a UI update or notification here
    })

    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data)
      this.emitToHandlers('user_typing', data)
    })

    this.socket.on('user_stopped_typing', (data) => {
      console.log('⏹️ User stopped typing:', data)
      this.emitToHandlers('user_stopped_typing', data)
    })

    this.socket.on('message_read', (data) => {
      console.log('✅ Message read:', data)
      this.emitToHandlers('message_read', data)
    })

    this.socket.on('message_delivered', (data) => {
      console.log('📬 Message delivered:', data)
      this.emitToHandlers('message_delivered', data)
    })

    this.socket.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data)
      this.emitToHandlers('message_sent', data)
    })

    this.socket.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted:', data)
      this.emitToHandlers('message_deleted', data)
    })

    this.socket.on('user_online', (data) => {
      console.log('🟢 User online:', data)
      this.emitToHandlers('user_online', data)
    })

    this.socket.on('user_offline', (data) => {
      console.log('🔴 User offline:', data)
      this.emitToHandlers('user_offline', data)
    })

    // Call-related events
    this.socket.on('incoming_call', (data) => {
      console.log('📞 Incoming call received:', data)
      this.emitToHandlers('incoming_call', data)
    })

    this.socket.on('call_initiated', (data) => {
      console.log('📞 Call initiated:', data)
      this.emitToHandlers('call_initiated', data)
    })

    this.socket.on('call_accepted', (data) => {
      console.log('📞 Call accepted:', data)
      this.emitToHandlers('call_accepted', data)
    })

    this.socket.on('call_declined', (data) => {
      console.log('📞 Call declined:', data)
      this.emitToHandlers('call_declined', data)
    })
    
    this.socket.on('call_rejected', (data) => {
      console.log('📞 Call rejected:', data)
      this.emitToHandlers('call_rejected', data)
    })

    this.socket.on('call_ended', (data) => {
      console.log('📞 Call ended:', data)
      this.emitToHandlers('call_ended', data)
    })

    this.socket.on('call_status_updated', (data) => {
      console.log('📞 Call status updated:', data)
      this.emitToHandlers('call_status_updated', data)
    })

    // WebRTC signaling events
    this.socket.on('call_offer_received', (data) => {
      console.log('📞 Call offer received:', data)
      this.emitToHandlers('call_offer_received', data)
    })

    this.socket.on('call_answer_received', (data) => {
      console.log('📞 Call answer received:', data)
      this.emitToHandlers('call_answer_received', data)
    })

    this.socket.on('call_ice_candidate_received', (data) => {
      console.log('📞 ICE candidate received:', data)
      this.emitToHandlers('call_ice_candidate_received', data)
    })

    this.socket.on('call_ringing_confirmed', (data) => {
      console.log('📞 Call ringing confirmed:', data)
      this.emitToHandlers('call_ringing_confirmed', data)
    })

    this.socket.on('call_busy_received', (data) => {
      console.log('📞 Call busy received:', data)
      this.emitToHandlers('call_busy_received', data)
    })

    this.socket.on('call_connection_failed_received', (data) => {
      console.log('📞 Call connection failed received:', data)
      this.emitToHandlers('call_connection_failed_received', data)
    })

    this.socket.on('call_peer_disconnected', (data) => {
      console.log('📞 Call peer disconnected:', data)
      this.emitToHandlers('call_peer_disconnected', data)
    })
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      console.log(`[Socket] Joining conversation: ${conversationId}`)
      this.socket.emit('join_conversation', conversationId)
    } else {
      console.warn(`[Socket] Cannot join conversation ${conversationId}: Socket not connected`)
    }
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId)
    }
  }

  /**
   * Send a message (optimistic)
   */
  sendMessage(data: {
    conversationId: string
    content?: string
    messageType?: string
    tempMessageId: string
  }): void {
    if (this.socket?.connected) {
      console.log(`[Socket] Sending message to conversation: ${data.conversationId}`)
      console.log(`[Socket] Message data:`, JSON.stringify(data, null, 2))
      this.socket.emit('send_message', data)
    } else {
      console.error(`[Socket] Cannot send message: Socket not connected`)
      
      // Try to reconnect if not connected
      if (this.socket && !this.socket.connected) {
        console.log(`[Socket] Attempting to reconnect...`)
        this.socket.connect()
        
        // Wait a bit and try again
        setTimeout(() => {
          if (this.socket?.connected) {
            console.log(`[Socket] Reconnected, sending message now`)
            this.socket.emit('send_message', data)
          } else {
            console.error(`[Socket] Reconnection failed, message lost`)
            // Emit error event for UI handling
            this.emitToHandlers('message_error', {
              tempMessageId: data.tempMessageId,
              error: 'Socket not connected - message lost'
            })
          }
        }, 1000)
      } else {
        // Emit error event for UI handling
        this.emitToHandlers('message_error', {
          tempMessageId: data.tempMessageId,
          error: 'Socket not connected'
        })
      }
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId })
    }
  }

  /**
   * Send stop typing indicator
   */
  sendStopTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('stop_typing', { conversationId })
    }
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string, conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_message_read', { messageId, conversationId })
    }
  }

  /**
   * Send message acknowledgment
   */
  sendMessageAck(messageId: string, tempMessageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message_ack', { messageId, tempMessageId })
    }
  }

  /**
   * Send message delivered confirmation
   */
  sendMessageDelivered(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message_delivered', { messageId })
    }
  }

  /**
   * Send message read confirmation
   */
  sendMessageRead(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message_read', { messageId })
    }
  }

  /**
   * Call signaling methods
   */
  initiateCall(data: { targetUserId: string; callType: 'audio' | 'video'; conversationId: string; from?: { id: string; name: string; avatar?: string } }) {
    console.log('🚀 Initiating call:', data)
    console.log('🔍 Socket connected:', this.isConnected())
    console.log('🔍 Socket ID:', this.socket?.id)
    
    if (!this.isConnected()) {
      console.error('❌ Cannot initiate call: Socket not connected')
      return false
    }
    
    this.emit('initiate-call', data)
    return true
  }
  sendOffer(data: { targetUserId: string; offer: RTCSessionDescriptionInit; conversationId: string }) {
    this.emit('send-offer', data)
  }
  sendAnswer(data: { targetUserId: string; answer: RTCSessionDescriptionInit; conversationId: string }) {
    this.emit('send-answer', data)
  }
  sendIceCandidate(data: { targetUserId: string; candidate: RTCIceCandidateInit; conversationId: string }) {
    this.emit('send-ice-candidate', data)
  }
  endCall(data: { targetUserId: string; conversationId: string }) {
    this.emit('end-call', data)
  }
  rejectCall(data: { targetUserId: string; conversationId: string }) {
    this.emit('reject-call', data)
  }
  acceptCall(data: { targetUserId: string; conversationId: string }) {
    this.emit('accept-call', data)
  }

  /**
   * Add event listener
   */
  on(event: string, callback: SocketEventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    
    // Check if callback already exists to prevent duplicates
    const existingHandlers = this.eventHandlers.get(event) || []
    const callbackExists = existingHandlers.some(handler => handler === callback)
    
    if (!callbackExists) {
      this.eventHandlers.get(event)!.push(callback)
      console.log(`📡 Event handler registered for: ${event}`)
    } else {
      console.log(`📡 Event handler already exists for: ${event}, skipping duplicate`)
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: SocketEventCallback): void {
    if (!callback) {
      // Remove all handlers for this event
      this.eventHandlers.delete(event)
      console.log(`📡 All event handlers removed for: ${event}`)
    } else {
      // Remove specific callback
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        const index = handlers.indexOf(callback)
        if (index > -1) {
          handlers.splice(index, 1)
          console.log(`📡 Event handler removed for: ${event}`)
        }
      }
    }
  }

  /**
   * Emit event to socket
   */
  private emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Cannot emit event:', event)
      return
    }
    
    this.socket.emit(event, data)
  }

  /**
   * Emit event to registered handlers
   */
  private emitToHandlers(event: string, data?: unknown): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Clear all event handlers
   */
  private clearEventHandlers(): void {
    console.log('🧹 Clearing all event handlers')
    this.eventHandlers.clear()
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket
  }
}

// Create singleton instance
const socketServiceInstance = new SocketService()

// Export the singleton instance
export const socketService = socketServiceInstance

// Export the class for testing
export { SocketService }

// Function to set up socket service reference for auth store
export const setupSocketServiceReference = () => {
  try {
    // Dynamic import to avoid circular dependencies
    import('@/lib/store').then(({ setSocketService }) => {
      setSocketService(socketServiceInstance)
      console.log('🔌 Socket service reference set up for auth store')
    }).catch(error => {
      console.warn('Failed to set up socket service reference:', error)
    })
  } catch (error) {
    console.warn('Failed to set up socket service reference:', error)
  }
} 