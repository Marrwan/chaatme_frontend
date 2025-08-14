'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  VolumeX,
  Volume2,
  Users,
  User as UserIcon,
  Maximize2,
  Minimize2
} from 'lucide-react'

export interface GroupCallParticipant {
  id: string
  name: string
  realName?: string
  avatar?: string
  isOnline: boolean
  isMuted?: boolean
  isCameraOn?: boolean
  stream?: MediaStream
}

export interface GroupCallInterfaceProps {
  callState: 'idle' | 'initiating' | 'ringing' | 'connecting' | 'active' | 'ended'
  participants: GroupCallParticipant[]
  groupName: string
  groupAvatar?: string
  isMuted: boolean
  isCameraOn: boolean
  isSpeakerOn: boolean
  localStream: MediaStream | null
  callDuration: number
  isFullScreen: boolean
  onToggleMute: () => void
  onToggleCamera: () => void
  onToggleSpeaker: () => void
  onEndCall: () => void
  onToggleFullScreen: () => void
  onAcceptCall?: () => void
  onDeclineCall?: () => void
}

const GroupCallInterface: React.FC<GroupCallInterfaceProps> = ({
  callState,
  participants,
  groupName,
  groupAvatar,
  isMuted,
  isCameraOn,
  isSpeakerOn,
  localStream,
  callDuration,
  isFullScreen,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onEndCall,
  onToggleFullScreen,
  onAcceptCall,
  onDeclineCall
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [participantStreams, setParticipantStreams] = useState<Map<string, MediaStream>>(new Map())

  // Format call duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  const getGridColumns = (participantCount: number) => {
    if (participantCount <= 1) return 'grid-cols-1'
    if (participantCount <= 4) return 'grid-cols-2'
    if (participantCount <= 9) return 'grid-cols-3'
    return 'grid-cols-4'
  }

  const ParticipantVideo: React.FC<{ participant: GroupCallParticipant; index: number }> = ({ participant, index }) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
      if (participant.stream && videoRef.current) {
        videoRef.current.srcObject = participant.stream
      }
    }, [participant.stream])

    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        {participant.stream && participant.isCameraOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Avatar className="h-20 w-20">
              {participant.avatar ? (
                <AuthenticatedImage
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center rounded-full">
                  <UserIcon className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </Avatar>
          </div>
        )}
        
        {/* Participant info overlay */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-black/50 rounded px-2 py-1 flex items-center justify-between">
            <span className="text-white text-sm font-medium truncate">
              {participant.realName || participant.name}
            </span>
            <div className="flex items-center space-x-1">
              {participant.isMuted && (
                <MicOff className="h-3 w-3 text-red-400" />
              )}
              {!participant.isCameraOn && (
                <VideoOff className="h-3 w-3 text-red-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Incoming call state
  if (callState === 'ringing' || callState === 'connecting') {
    return (
      <div className={`${isFullScreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center text-white`}>
        <div className="text-center mb-8">
          <div className="mb-4">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              {groupAvatar ? (
                <AuthenticatedImage
                  src={groupAvatar}
                  alt={groupName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-blue-200 flex items-center justify-center rounded-full">
                  <Users className="h-12 w-12 text-blue-700" />
                </div>
              )}
            </Avatar>
          </div>
          
          <h2 className="text-2xl font-semibold mb-2">{groupName}</h2>
          <p className="text-blue-200 mb-2">{participants.length} participants</p>
          
          <div className="animate-pulse text-lg">
            {callState === 'ringing' ? 'Calling...' : 'Connecting...'}
          </div>
        </div>

        <div className="flex space-x-6">
          {onDeclineCall && (
            <Button
              onClick={onDeclineCall}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4"
              size="lg"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          )}
          
          {onAcceptCall && (
            <Button
              onClick={onAcceptCall}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4"
              size="lg"
            >
              <Phone className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Active call state
  if (callState === 'active') {
    return (
      <div className={`${isFullScreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gray-900 flex flex-col`}>
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between text-white">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              {groupAvatar ? (
                <AuthenticatedImage
                  src={groupAvatar}
                  alt={groupName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-blue-200 flex items-center justify-center rounded-full">
                  <Users className="h-4 w-4 text-blue-700" />
                </div>
              )}
            </Avatar>
            <div>
              <h3 className="font-semibold">{groupName}</h3>
              <p className="text-sm text-gray-300">{participants.length} participants</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              {formatDuration(callDuration)}
            </span>
            <Button
              onClick={onToggleFullScreen}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700"
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className={`grid ${getGridColumns(participants.length + 1)} gap-4 h-full`}>
            {/* Local video */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {localStream && isCameraOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted={true}
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <span className="text-white text-sm">You</span>
                  </div>
                </div>
              )}
              
              {/* Local user indicator */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/50 rounded px-2 py-1 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">You</span>
                  <div className="flex items-center space-x-1">
                    {isMuted && (
                      <MicOff className="h-3 w-3 text-red-400" />
                    )}
                    {!isCameraOn && (
                      <VideoOff className="h-3 w-3 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Remote participants */}
            {participants.map((participant, index) => (
              <ParticipantVideo
                key={participant.id}
                participant={participant}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={onToggleMute}
              className={`rounded-full p-3 ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </Button>

            <Button
              onClick={onToggleCamera}
              className={`rounded-full p-3 ${
                !isCameraOn 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isCameraOn ? (
                <Video className="h-5 w-5 text-white" />
              ) : (
                <VideoOff className="h-5 w-5 text-white" />
              )}
            </Button>

            <Button
              onClick={onToggleSpeaker}
              className={`rounded-full p-3 ${
                isSpeakerOn 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isSpeakerOn ? (
                <Volume2 className="h-5 w-5 text-white" />
              ) : (
                <VolumeX className="h-5 w-5 text-white" />
              )}
            </Button>

            <Button
              onClick={onEndCall}
              className="bg-purple-600 hover:bg-purple-700 rounded-full p-3"
            >
              <PhoneOff className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default GroupCallInterface
