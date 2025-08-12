'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Settings,
  MessageSquare
} from 'lucide-react'
import { socketService } from '@/services/socketService'
import { callService } from '@/services/callService'
import { useAuth } from '@/lib/store'
import { cn } from '@/lib/utils'

interface CallInterfaceProps {
  call: {
    id: string
    callerId: string
    receiverId: string
    type: 'audio' | 'video'
    status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'missed'
    caller: {
      id: string
      name: string
      realName?: string
      profilePicture?: string
    }
    receiver: {
      id: string
      name: string
      realName?: string
      profilePicture?: string
    }
  }
  currentUser: any
  onEndCall: () => void
  onAcceptCall?: () => void
  onRejectCall?: () => void
}

export default function WhatsAppCallInterface({
  call,
  currentUser,
  onEndCall,
  onAcceptCall,
  onRejectCall
}: CallInterfaceProps) {
  const [isAccepted, setIsAccepted] = useState(call.status === 'accepted')
  const [isRinging, setIsRinging] = useState(call.status === 'pending')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(call.type === 'video')
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const isIncomingCall = call.receiverId === currentUser?.id
  const otherUser = isIncomingCall ? call.caller : call.receiver

  useEffect(() => {
    if (isAccepted) {
      startCall()
      startDurationTimer()
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      cleanupCall()
    }
  }, [isAccepted])

  useEffect(() => {
    // Listen for call events
    const handleCallAccepted = (data: any) => {
      if (data.callId === call.id) {
        setIsAccepted(true)
        setIsRinging(false)
      }
    }

    const handleCallRejected = (data: any) => {
      if (data.callId === call.id) {
        onEndCall()
      }
    }

    const handleCallEnded = (data: any) => {
      if (data.callId === call.id) {
        onEndCall()
      }
    }

    socketService.on('call_accepted', handleCallAccepted)
    socketService.on('call_rejected', handleCallRejected)
    socketService.on('call_ended', handleCallEnded)

    return () => {
      socketService.off('call_accepted', handleCallAccepted)
      socketService.off('call_rejected', handleCallRejected)
      socketService.off('call_ended', handleCallEnded)
    }
  }, [call.id, onEndCall])

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startCall = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.type === 'video'
      })

      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      peerConnectionRef.current = peerConnection

      // Add local stream
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0]
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendIceCandidate({
            targetUserId: otherUser.id,
            candidate: event.candidate,
            conversationId: call.id
          })
        }
      }

      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      socketService.sendOffer({
        targetUserId: otherUser.id,
        offer: offer,
        conversationId: call.id
      })

      setIsConnecting(false)

    } catch (error) {
      console.error('Error starting call:', error)
      setError('Failed to start call. Please check your camera and microphone permissions.')
      setIsConnecting(false)
    }
  }

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }

  const handleAcceptCall = async () => {
    try {
      const response = await callService.acceptCall(call.id)
      if (response.success) {
        setIsAccepted(true)
        setIsRinging(false)
        if (onAcceptCall) onAcceptCall()
      }
    } catch (error) {
      console.error('Error accepting call:', error)
      setError('Failed to accept call')
    }
  }

  const handleRejectCall = async () => {
    try {
      await callService.rejectCall(call.id)
      if (onRejectCall) onRejectCall()
    } catch (error) {
      console.error('Error rejecting call:', error)
    }
  }

  const handleEndCall = async () => {
    try {
      await callService.endCall(call.id)
      cleanupCall()
      onEndCall()
    } catch (error) {
      console.error('Error ending call:', error)
      cleanupCall()
      onEndCall()
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    // In a real implementation, you would control the audio output device
  }

  const getDisplayName = (user: any) => {
    return user.realName || user.name || 'Unknown User'
  }

  const getInitials = (user: any) => {
    const name = getDisplayName(user)
    return name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <PhoneOff className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Call Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={onEndCall} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
        {/* Video Area */}
        {call.type === 'video' && isAccepted && (
          <div className="relative w-full h-full">
            {/* Remote Video (Main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Small) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-white text-center">
                    <VideoOff className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs">Camera Off</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio Call Interface */}
        {call.type === 'audio' && (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white/20">
                <AvatarImage src={otherUser.profilePicture} alt={getDisplayName(otherUser)} />
                <AvatarFallback className="text-2xl bg-white/20">
                  {getInitials(otherUser)}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-semibold mb-2">{getDisplayName(otherUser)}</h2>
              
              {isRinging && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="animate-pulse">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Ringing...</span>
                </div>
              )}
              
              {isAccepted && (
                <div className="text-sm mb-4 font-medium">
                  {formatDuration(callDuration)}
                </div>
              )}
              
              {isConnecting && (
                <div className="text-sm mb-4">Connecting...</div>
              )}
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm p-6">
          <div className="flex items-center justify-center gap-4">
            {isRinging && isIncomingCall ? (
              // Incoming call controls
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleRejectCall}
                  className="bg-red-500 hover:bg-red-600 text-white border-red-500 rounded-full w-16 h-16 p-0"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                
                <Button
                  size="lg"
                  onClick={handleAcceptCall}
                  className="bg-green-500 hover:bg-green-600 rounded-full w-16 h-16 p-0"
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            ) : (
              // Active call controls
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={toggleMute}
                  className={cn(
                    "rounded-full w-12 h-12 p-0",
                    isMuted ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                  )}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {call.type === 'video' && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={toggleVideo}
                    className={cn(
                      "rounded-full w-12 h-12 p-0",
                      !isVideoEnabled ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                    )}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={toggleSpeaker}
                  className={cn(
                    "rounded-full w-12 h-12 p-0",
                    !isSpeakerOn ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                  )}
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>

                <Button
                  size="lg"
                  onClick={handleEndCall}
                  className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16 p-0"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Call Type Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-black/50 text-white border-0">
            {call.type === 'video' ? 'Video Call' : 'Audio Call'}
          </Badge>
        </div>

        {/* Call Status */}
        {isConnecting && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
