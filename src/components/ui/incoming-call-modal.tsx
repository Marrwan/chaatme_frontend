import React, { useEffect, useState, useRef, useCallback } from 'react'

interface IncomingCallModalProps {
  isVisible: boolean
  onAccept: () => void
  onDecline: () => void
  callerName: string
  callerAvatar?: string
  callType: 'audio' | 'video'
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isVisible,
  onAccept,
  onDecline,
  callerName,
  callerAvatar,
  callType
}) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const webAudioRef = useRef<{ stop: () => void } | null>(null)
  const isPlayingRef = useRef(false)

  const stopRingtone = useCallback(() => {
    console.log('[Incoming Call] Stopping ringtone')
    isPlayingRef.current = false
    
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
      ringtoneRef.current.removeEventListener('ended', handleRingtoneEnded)
      ringtoneRef.current.removeEventListener('error', handleRingtoneError)
      ringtoneRef.current = null
    }
    if (webAudioRef.current) {
      webAudioRef.current.stop()
      webAudioRef.current = null
    }
  }, [])

  const handleRingtoneEnded = useCallback(() => {
    if (isPlayingRef.current && isVisible) {
      // Restart the ringtone if it ended but we're still showing the modal
      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0
        ringtoneRef.current.play().catch(() => {
          // If replay fails, fall back to Web Audio
          createWebAudioRingtone()
        })
      }
    }
  }, [isVisible])

  const handleRingtoneError = useCallback((error: Event) => {
    console.log('[Incoming Call] Audio file error, using Web Audio API fallback:', error)
    createWebAudioRingtone()
  }, [])

  const createWebAudioRingtone = useCallback(() => {
    if (!isPlayingRef.current) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const createRingTone = () => {
        if (!isPlayingRef.current || !isVisible) return
        
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // Lower frequency for better sound
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3)
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.5)
        
        setTimeout(() => {
          if (isPlayingRef.current && isVisible) {
            createRingTone()
          }
        }, 1500) // Shorter interval for more frequent ringing
      }
      
      createRingTone()
      
      webAudioRef.current = {
        stop: () => {
          isPlayingRef.current = false
          audioContext.close().catch(() => {}) // Ignore close errors
        }
      }
      
    } catch (error) {
      console.error('[Incoming Call] Web Audio API setup failed:', error)
    }
  }, [isVisible])

  const startRingtone = useCallback(() => {
    if (isPlayingRef.current) return // Already playing
    
    isPlayingRef.current = true
    console.log('[Incoming Call] Starting ringtone...')
    
    try {
      // Try to use the ringtone audio file first
      const ringtone = new Audio('/ringtone.mp3')
      ringtone.loop = true
      ringtone.volume = 0.7
      ringtone.preload = 'auto'
      
      // Add event listeners
      ringtone.addEventListener('ended', handleRingtoneEnded)
      ringtone.addEventListener('error', handleRingtoneError)
      
      ringtone.play()
        .then(() => {
          console.log('[Incoming Call] Ringtone playing successfully')
          ringtoneRef.current = ringtone
        })
        .catch((audioError) => {
          console.log('[Incoming Call] Audio file failed, using Web Audio API fallback:', audioError)
          createWebAudioRingtone()
        })
    } catch (error) {
      console.log('[Incoming Call] Audio setup failed, using Web Audio API:', error)
      createWebAudioRingtone()
    }
  }, [createWebAudioRingtone, handleRingtoneEnded, handleRingtoneError])

  // Handle accept call with proper cleanup
  const handleAccept = useCallback(() => {
    console.log('[Incoming Call] Call accepted, stopping ringtone')
    stopRingtone()
    onAccept()
  }, [onAccept, stopRingtone])

  // Handle decline call with proper cleanup
  const handleDecline = useCallback(() => {
    console.log('[Incoming Call] Call declined, stopping ringtone')
    stopRingtone()
    onDecline()
  }, [onDecline, stopRingtone])

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      
      // Small delay to ensure component is mounted and user interaction has occurred
      const timeoutId = setTimeout(() => {
        startRingtone()
      }, 200)
      
      return () => {
        clearTimeout(timeoutId)
      }
    } else {
      setIsAnimating(false)
      stopRingtone()
    }
  }, [isVisible, startRingtone, stopRingtone])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRingtone()
    }
  }, [stopRingtone])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-xs mx-auto p-8 flex flex-col items-center relative transform transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Profile Picture */}
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden border-4 border-green-500">
          {callerAvatar ? (
            <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#e5e7eb"/>
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-2.761-3.582-5-8-5z" fill="#9ca3af"/>
              </svg>
            </div>
          )}
        </div>
        
        {/* Caller Name */}
        <div className="font-bold text-xl text-gray-900 mb-1 text-center">{callerName}</div>
        
        {/* Call Type */}
        <div className="text-green-600 font-medium mb-6 text-center text-lg">
          Incoming {callType} call...
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-8 mt-2">
          {/* Decline Button */}
          <button 
            onClick={handleDecline} 
            aria-label="Decline Call" 
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg focus:outline-none transition-transform hover:scale-105 active:scale-95"
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 7l8 8M16 7l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {/* Accept Button */}
          <button 
            onClick={handleAccept} 
            aria-label="Accept Call" 
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg focus:outline-none transition-transform hover:scale-105 active:scale-95"
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal
