import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Phone, Video, X } from 'lucide-react'
import { webrtcService, type CallType } from '@/services/webrtcService'
import { callService } from '@/services/callService'

interface CallModalProps {
  isOpen: boolean
  onClose: () => void
  targetUser: {
    id: string
    name: string
    avatar?: string
  } | null
  currentUser: {
    id: string
    name: string
    avatar?: string
  } | null
}

export function CallModal({ isOpen, onClose, targetUser, currentUser }: CallModalProps) {
  const [isInitiating, setIsInitiating] = useState(false)
  const [callType, setCallType] = useState<CallType>('audio')

  const handleInitiateCall = async (type: CallType) => {
    if (!targetUser || !currentUser) return

    setIsInitiating(true)
    setCallType(type)

    try {
      // Initialize WebRTC call
      await webrtcService.initializeCall({
        callType: type,
        isVideoEnabled: type === 'video',
        isAudioEnabled: true
      })

      // Initiate call through API
      const response = await callService.initiateCall({
        receiverId: targetUser.id,
        type: type
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to initiate call')
      }

      // Start WebRTC call
      await webrtcService.startCall(targetUser.id)

      console.log(`[Call] Initiated ${type} call to ${targetUser.name}`)
      onClose()
    } catch (error) {
      console.error('[Call] Error initiating call:', error)
      alert('Failed to initiate call. Please try again.')
    } finally {
      setIsInitiating(false)
    }
  }

  const handleClose = () => {
    if (!isInitiating) {
      onClose()
    }
  }

  if (!targetUser) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Call {targetUser.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-6">
          {/* User Avatar */}
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            {targetUser.avatar ? (
              <img
                src={targetUser.avatar}
                alt={targetUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-600">
                {targetUser.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Name */}
          <h3 className="text-lg font-semibold text-gray-900">{targetUser.name}</h3>

          {/* Call Options */}
          <div className="flex space-x-4">
            {/* Audio Call Button */}
            <Button
              onClick={() => handleInitiateCall('audio')}
              disabled={isInitiating}
              className="flex flex-col items-center space-y-2 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full"
            >
              <Phone className="w-6 h-6" />
              <span className="text-sm">Audio</span>
            </Button>

            {/* Video Call Button */}
            <Button
              onClick={() => handleInitiateCall('video')}
              disabled={isInitiating}
              className="flex flex-col items-center space-y-2 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full"
            >
              <Video className="w-6 h-6" />
              <span className="text-sm">Video</span>
            </Button>
          </div>

          {/* Loading State */}
          {isInitiating && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">
                Initiating {callType} call...
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isInitiating}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
            </div>
      </DialogContent>
    </Dialog>
  )
} 