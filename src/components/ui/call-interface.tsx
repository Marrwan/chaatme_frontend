import React, { useState, useEffect, useRef } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { User, PhoneOff, Volume2, VolumeX, Mic, MicOff, Video, VideoOff, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import { CallInterfaceProps } from "./call-interface-types"
import { webrtcService, type CallState, type CallType } from "@/services/webrtcService"

export function CallInterface({
  callState,
  isMuted,
  onToggleMute,
  onEndCall,
  participantName = "Caller",
  participantAvatar,
  callDuration,
  onToggleSpeaker = () => {},
  isSpeakerOn = false,
  isVideo = false,
  isCameraOn = true,
  onToggleCamera = () => {},
  localVideoRef,
  remoteVideoRef,
  onAcceptCall,
  onDeclineCall,
  // Add props to access the actual streams
  localStream,
  remoteStream,
}: CallInterfaceProps) {
  const [elapsedTime, setElapsedTime] = useState(callDuration)
  const [currentCallState, setCurrentCallState] = useState<CallState>('idle')
  const [isLocalMuted, setIsLocalMuted] = useState(false)
  const [isLocalCameraOn, setIsLocalCameraOn] = useState(true)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const ringingAudioRef = useRef<HTMLAudioElement | null>(null)

  console.log('[Call] Current state:', callState)

  // Initialize WebRTC service listeners
  useEffect(() => {
    const unsubscribeState = webrtcService.onCallStateChange((state) => {
      console.log('[Call] WebRTC state changed:', state)
      setCurrentCallState(state)
    })

    return () => {
      unsubscribeState()
    }
  }, [])

  // Handle remote audio stream for audio calls - IMPROVED
  useEffect(() => {
    if (remoteStream && (callState === 'active' || callState === 'connecting')) {
      console.log('[Call Audio] Setting up remote audio for stream:', remoteStream.getAudioTracks().length, 'audio tracks')
      
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio()
        remoteAudioRef.current.autoplay = true
        remoteAudioRef.current.playsInline = true
        remoteAudioRef.current.volume = 1.0
        console.log('[Call Audio] Created remote audio element')
      }
      
      try {
        // Ensure we have audio tracks
        if (remoteStream.getAudioTracks().length > 0) {
          remoteAudioRef.current.srcObject = remoteStream
          
          // Try to play with better error handling
          const playPromise = remoteAudioRef.current.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('[Call Audio] Remote audio playing successfully')
              })
              .catch(e => {
                console.log('[Call Audio] Remote audio play failed:', e)
                // Try to enable audio on user interaction
                document.addEventListener('click', () => {
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.play().catch(console.log)
                  }
                }, { once: true })
              })
          }
          console.log('[Call Audio] Attached remote stream to audio element')
        } else {
          console.log('[Call Audio] No audio tracks in remote stream')
        }
      } catch (error) {
        console.error('[Call Audio] Error setting up remote audio:', error)
      }
    } else if (callState !== 'active' && callState !== 'connecting') {
      // Clean up when call is not active
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
        console.log('[Call Audio] Cleaned up remote audio element - call not active')
      }
    }
    
    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
        console.log('[Call Audio] Cleaned up remote audio element')
      }
    }
  }, [remoteStream, callState])

  // Handle ringing sound with improved audio file playback
  useEffect(() => {
    const isRinging = callState === 'ringing' || callState === 'incoming_ringing' || callState === 'outgoing_ringing'
    if (isRinging) {
      if (!ringingAudioRef.current) {
        try {
          const ringtoneAudio = new Audio('/ringtone.mp3')
          ringtoneAudio.loop = true
          ringtoneAudio.volume = 0.8
          ringtoneAudio.preload = 'auto'
          ringtoneAudio.play().catch(() => {})
          ringingAudioRef.current = ringtoneAudio
        } catch {}
      }
    } else {
      if (ringingAudioRef.current) {
          if (ringingAudioRef.current instanceof HTMLAudioElement) {
            ringingAudioRef.current.pause()
            ringingAudioRef.current.currentTime = 0
        } else if (ringingAudioRef.current.stop) {
          ringingAudioRef.current.stop()
        }
        ringingAudioRef.current = null
      }
    }
    // Stop ringtone on active/connecting/ended
    if ((callState === 'active' || callState === 'connecting' || callState === 'ended') && ringingAudioRef.current) {
      if (ringingAudioRef.current instanceof HTMLAudioElement) {
        ringingAudioRef.current.pause()
        ringingAudioRef.current.currentTime = 0
      } else if (ringingAudioRef.current.stop) {
        ringingAudioRef.current.stop()
          }
      ringingAudioRef.current = null
    }
    return () => {
      if (ringingAudioRef.current) {
          if (ringingAudioRef.current instanceof HTMLAudioElement) {
            ringingAudioRef.current.pause()
            ringingAudioRef.current.currentTime = 0
          } else if (ringingAudioRef.current.stop) {
            ringingAudioRef.current.stop()
        }
        ringingAudioRef.current = null
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }
    }
  }, [callState])

  // Always attach remote audio stream for audio calls
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream && !isVideo) {
      remoteAudioRef.current.srcObject = remoteStream
    } else if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
  }, [remoteStream, isVideo])

  // Attach remote video stream for video calls
  useEffect(() => {
    if (remoteVideoRef && remoteVideoRef.current && remoteStream && isVideo) {
      remoteVideoRef.current.srcObject = remoteStream
    } else if (remoteVideoRef && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
  }, [remoteStream, isVideo, remoteVideoRef])

  // Ensure local video stream is properly set up - IMPROVED
  useEffect(() => {
    if (localVideoRef?.current && localStream && isVideo) {
      console.log('[Local Video] Setting up local video stream:', localStream.getVideoTracks().length, 'video tracks')
      try {
        localVideoRef.current.srcObject = localStream
        localVideoRef.current.play().catch(e => {
          console.log('[Local Video] Local video play failed:', e)
        })
      } catch (error) {
        console.error('[Local Video] Error setting up local video:', error)
      }
    }
  }, [localStream, isVideo, localVideoRef])

  // Ensure remote video stream is properly set up - IMPROVED
  useEffect(() => {
    if (remoteVideoRef?.current && remoteStream && isVideo) {
      console.log('[Remote Video] Setting up remote video stream:', remoteStream.getVideoTracks().length, 'video tracks')
      try {
        remoteVideoRef.current.srcObject = remoteStream
        remoteVideoRef.current.play().catch(e => {
          console.log('[Remote Video] Remote video play failed:', e)
        })
      } catch (error) {
        console.error('[Remote Video] Error setting up remote video:', error)
      }
    }
  }, [remoteStream, isVideo, remoteVideoRef])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callState === "active") {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callState])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getCallStatus = () => {
    switch (callState) {
      case "active":
        return formatTime(elapsedTime)
      case "connecting":
        return "Connecting..."
      case "ringing":
      case "incoming_ringing":
        return "Ringing..."
      case "outgoing_ringing":
      case "initiating":
        return "Calling..."
      case "ended":
        return "Call ended"
      default:
        return ""
    }
  }

  // Enhanced mute toggle with WebRTC integration
  const handleToggleMute = async () => {
    try {
      const newMuteState = await webrtcService.toggleMute()
      setIsLocalMuted(!newMuteState)
      if (onToggleMute) {
        onToggleMute()
      }
    } catch (error) {
      console.error('Error toggling mute:', error)
    }
  }

  // Enhanced camera toggle with WebRTC integration
  const handleToggleCamera = async () => {
    try {
      const newCameraState = await webrtcService.toggleVideo()
      setIsLocalCameraOn(newCameraState)
      if (onToggleCamera) {
        onToggleCamera()
      }
    } catch (error) {
      console.error('Error toggling camera:', error)
    }
  }

  // Enhanced end call with WebRTC cleanup
  const handleEndCall = async () => {
    try {
      await webrtcService.endCall()
      if (onEndCall) {
        onEndCall()
      }
    } catch (error) {
      console.error('Error ending call:', error)
      if (onEndCall) {
        onEndCall()
      }
    }
  }

  // WhatsApp-like controls logic - FIXED
  const isCallerInitiating = callState === 'outgoing_ringing' || callState === 'initiating'
  const isReceiverRinging = callState === 'incoming_ringing'
  const isInCall = callState === 'active' || callState === 'connecting'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      {/* Video Call UI - FIXED */}
      {isVideo ? (
        <div className="flex flex-col w-full h-full">
          {/* Remote video (large, full screen-like) */}
          <div className="relative flex-1 w-full bg-black flex items-center justify-center">
            {remoteVideoRef ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black/80">
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  {participantAvatar ? (
                    <img
                      src={participantAvatar}
                      alt={participantName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white/70" />
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-1">{participantName}</h2>
                <p className="text-white/80">{getCallStatus()}</p>
              </div>
            )}
            
            {/* Local video preview in bottom right corner - FIXED */}
            <div className="absolute bottom-20 right-4 w-32 h-24 bg-black/60 rounded-lg overflow-hidden border-2 border-white">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
                style={{ display: (localStream && localStream.getVideoTracks().length > 0) ? 'block' : 'none' }}
              />
              {/* Placeholder when no local video */}
              {(!localStream || localStream.getVideoTracks().length === 0) && (
                <div className="w-full h-full flex items-center justify-center bg-black/80">
                  <User className="w-8 h-8 text-white/50" />
                </div>
              )}
            </div>
            
            {/* Call info overlay for video calls */}
            {callState !== 'active' && (
              <div className="absolute top-4 left-4 right-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-1">{participantName}</h2>
                  <p className="text-white/80">{getCallStatus()}</p>
                </div>
              </div>
            )}
            
            {/* Call info during active call */}
            {callState === 'active' && (
              <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-2">
                <div className="text-white text-sm">
                  <p className="font-medium">{participantName}</p>
                  <p className="text-white/80">{getCallStatus()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Audio Call UI
        <>
          <div className="flex flex-col items-center mb-12">
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-6">
              {participantAvatar ? (
                <img
                  src={participantAvatar}
                  alt={participantName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white/70" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-1">{participantName}</h2>
            <p className="text-white/80">{getCallStatus()}</p>
          </div>
          
          {/* Hidden audio element for remote audio playback in audio calls */}
          {callState === 'active' && (
            <audio 
              ref={remoteAudioRef}
              autoPlay 
              playsInline 
              style={{ display: 'none' }}
            />
          )}
        </>
      )}

      {/* Call controls - WhatsApp-like logic - FIXED */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-6 z-10">
        {/* Caller initiating: End and Speaker only */}
        {isCallerInitiating && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleSpeaker}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                      isSpeakerOn ? "bg-blue-500 hover:bg-blue-600" : "bg-white/10 hover:bg-white/20"
                    )}
                  >
                    {isSpeakerOn ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSpeakerOn ? "Speaker Off" : "Speaker On"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-transform hover:scale-105"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>End Call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
        
        {/* Receiver ringing: Accept and Decline */}
        {isReceiverRinging && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onDeclineCall || handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-transform hover:scale-105"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Decline</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onAcceptCall}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-transform hover:scale-105"
                  >
                    <Phone className="w-6 h-6 text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Accept</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
        
        {/* In-call: Mic, Camera (video), Speaker, End */}
        {isInCall && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleToggleMute}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                      (isMuted || isLocalMuted) ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
                    )}
                  >
                    {(isMuted || isLocalMuted) ? (
                      <MicOff className="w-6 h-6 text-white" />
                    ) : (
                      <Mic className="w-6 h-6 text-white" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {(isMuted || isLocalMuted) ? "Unmute" : "Mute"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isVideo && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleCamera}
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                        (isCameraOn && isLocalCameraOn) ? "bg-white/10 hover:bg-white/20" : "bg-red-500 hover:bg-red-600"
                      )}
                    >
                      {(isCameraOn && isLocalCameraOn) ? (
                        <Video className="w-6 h-6 text-white" />
                      ) : (
                        <VideoOff className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {(isCameraOn && isLocalCameraOn) ? "Turn Camera Off" : "Turn Camera On"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleSpeaker}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                      isSpeakerOn ? "bg-blue-500 hover:bg-blue-600" : "bg-white/10 hover:bg-white/20"
                    )}
                  >
                    {isSpeakerOn ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSpeakerOn ? "Speaker Off" : "Speaker On"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-transform hover:scale-105"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>End Call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </div>
  )
}
