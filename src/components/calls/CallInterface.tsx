'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { callService, type Call, type User } from '@/services/callService'
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Clock,
  User as UserIcon
} from 'lucide-react'

interface CallInterfaceProps {
  call: Call | null
  currentUser: User | null
  onEndCall: () => void
  onAcceptCall: () => void
  onRejectCall: () => void
}

export default function CallInterface({ 
  call, 
  currentUser, 
  onEndCall, 
  onAcceptCall, 
  onRejectCall 
}: CallInterfaceProps) {
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isIncoming, setIsIncoming] = useState(false)
  const durationRef = useRef<NodeJS.Timeout | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (call) {
      setIsIncoming(call.status === 'pending' && call.receiverId === currentUser?.id)
      
      if (call.status === 'accepted') {
        startCallTimer()
        initializeMedia()
      }
    }

    return () => {
      if (durationRef.current) {
        clearInterval(durationRef.current)
      }
    }
  }, [call, currentUser])

  const startCallTimer = () => {
    if (durationRef.current) {
      clearInterval(durationRef.current)
    }
    
    durationRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: true
      })
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // In a real implementation, you would connect to the remote peer here
      // For now, we'll just show the local video
    } catch (error) {
      console.error('Error accessing media devices:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
    // In a real implementation, you would mute/unmute the audio track
  }

  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    // In a real implementation, you would enable/disable the video track
  }

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    // In a real implementation, you would switch audio output
  }

  const handleAcceptCall = async () => {
    if (!call) return
    
    try {
      const response = await callService.acceptCall(call.id)
      if (response.success) {
        onAcceptCall()
      }
    } catch (error) {
      console.error('Error accepting call:', error)
    }
  }

  const handleRejectCall = async () => {
    if (!call) return
    
    try {
      const response = await callService.rejectCall(call.id)
      if (response.success) {
        onRejectCall()
      }
    } catch (error) {
      console.error('Error rejecting call:', error)
    }
  }

  const handleEndCall = async () => {
    if (!call) return
    
    try {
      const response = await callService.endCall(call.id)
      if (response.success) {
        onEndCall()
      }
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  if (!call) {
    return null
  }

  const otherUser = call.callerId === currentUser?.id ? call.receiver : call.caller
  const isCallActive = call.status === 'accepted'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center pb-4">
          <div className="relative mx-auto mb-4">
            <Avatar className="h-20 w-20 mx-auto">
              <AvatarImage src={otherUser.profilePicture} alt={getDisplayName(otherUser)} />
              <AvatarFallback className="bg-[#8B0000] text-white text-2xl">
                {getInitials(otherUser)}
              </AvatarFallback>
            </Avatar>
            {isCallActive && (
              <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          <CardTitle className="text-xl">{getDisplayName(otherUser)}</CardTitle>
          
          <div className="flex items-center justify-center gap-2">
            <Badge variant={call.type === 'video' ? 'default' : 'secondary'}>
              {call.type === 'video' ? 'Video Call' : 'Audio Call'}
            </Badge>
            {isCallActive && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            {isIncoming 
              ? 'Incoming call...' 
              : isCallActive 
                ? 'Connected' 
                : call.status === 'pending' 
                  ? 'Calling...' 
                  : call.status
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Video Area */}
          {call.type === 'video' && isCallActive && (
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local video picture-in-picture */}
              <div className="absolute top-2 right-2 w-24 h-16 bg-gray-800 rounded overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4">
            {isIncoming ? (
              // Incoming call controls
              <>
                <Button
                  size="lg"
                  onClick={handleRejectCall}
                  className="bg-purple-600 hover:bg-purple-700 text-white h-12 w-12 rounded-full p-0"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                
                <Button
                  size="lg"
                  onClick={handleAcceptCall}
                  className="bg-purple-600 hover:bg-purple-700 text-white h-12 w-12 rounded-full p-0"
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            ) : isCallActive ? (
              // Active call controls
              <>
                <Button
                  size="lg"
                  variant={isMuted ? 'destructive' : 'outline'}
                  onClick={handleToggleMute}
                  className="h-12 w-12 rounded-full p-0"
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                
                {call.type === 'video' && (
                  <Button
                    size="lg"
                    variant={!isVideoEnabled ? 'destructive' : 'outline'}
                    onClick={handleToggleVideo}
                    className="h-12 w-12 rounded-full p-0"
                  >
                    {!isVideoEnabled ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                  </Button>
                )}
                
                <Button
                  size="lg"
                  variant={isSpeakerOn ? 'default' : 'outline'}
                  onClick={handleToggleSpeaker}
                  className="h-12 w-12 rounded-full p-0"
                >
                  {isSpeakerOn ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>
                
                <Button
                  size="lg"
                  onClick={handleEndCall}
                  className="bg-purple-600 hover:bg-purple-700 text-white h-12 w-12 rounded-full p-0"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            ) : (
              // Outgoing call controls
              <Button
                size="lg"
                onClick={handleEndCall}
                className="bg-purple-600 hover:bg-purple-700 text-white h-12 w-12 rounded-full p-0"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
