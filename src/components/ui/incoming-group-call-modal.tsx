'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { 
  Phone, 
  PhoneOff, 
  Users,
  User as UserIcon
} from 'lucide-react'

export interface GroupCallParticipant {
  id: string
  name: string
  realName?: string
  avatar?: string
  isOnline: boolean
}

export interface IncomingGroupCallModalProps {
  isOpen: boolean
  groupName: string
  groupAvatar?: string
  callerName: string
  callerAvatar?: string
  participants: GroupCallParticipant[]
  onAccept: () => void
  onDecline: () => void
}

const IncomingGroupCallModal: React.FC<IncomingGroupCallModalProps> = ({
  isOpen,
  groupName,
  groupAvatar,
  callerName,
  callerAvatar,
  participants,
  onAccept,
  onDecline
}) => {
  const [isRinging, setIsRinging] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsRinging(true)
      const interval = setInterval(() => {
        setIsRinging(prev => !prev)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl p-8 mx-4 max-w-md w-full text-white shadow-2xl">
        {/* Group Avatar */}
        <div className="text-center mb-6">
          <div className={`transition-transform duration-300 ${isRinging ? 'scale-110' : 'scale-100'}`}>
            <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-white/20">
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
          <p className="text-blue-200 mb-1">
            Incoming group call from <span className="font-medium">{callerName}</span>
          </p>
          <p className="text-sm text-blue-300">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Participants Preview */}
        {participants.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-2 mb-3">
              <span className="text-sm text-blue-200">Participants:</span>
            </div>
            
            <div className="flex justify-center items-center space-x-2">
              {participants.slice(0, 4).map((participant, index) => (
                <Avatar key={participant.id} className="h-8 w-8 ring-2 ring-white/20">
                  {participant.avatar ? (
                    <AuthenticatedImage
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center rounded-full">
                      <UserIcon className="h-4 w-4 text-gray-300" />
                    </div>
                  )}
                </Avatar>
              ))}
              
              {participants.length > 4 && (
                <div className="h-8 w-8 bg-gray-600/50 rounded-full flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-xs text-white font-medium">
                    +{participants.length - 4}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-2 text-center">
              <div className="text-xs text-blue-300">
                {participants.slice(0, 3).map(p => p.realName || p.name).join(', ')}
                {participants.length > 3 && ` and ${participants.length - 3} more`}
              </div>
            </div>
          </div>
        )}

        {/* Ringing indicator */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
            isRinging ? 'bg-green-400' : 'bg-green-400/50'
          } transition-all duration-300`}>
            <div className={`w-2 h-2 rounded-full bg-white ${
              isRinging ? 'animate-pulse' : ''
            }`} />
          </div>
          <p className="text-sm text-blue-200 mt-2">Ringing...</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-8">
          <Button
            onClick={onDecline}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <PhoneOff className="h-8 w-8" />
          </Button>
          
          <Button
            onClick={onAccept}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Phone className="h-8 w-8" />
          </Button>
        </div>

        {/* Quick actions hint */}
        <div className="flex justify-between mt-6 text-xs text-blue-300">
          <span>Decline</span>
          <span>Accept</span>
        </div>
      </div>
    </div>
  )
}

export default IncomingGroupCallModal
