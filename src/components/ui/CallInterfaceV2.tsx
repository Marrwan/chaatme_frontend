import React, { useEffect, useRef } from 'react';
import { useWebRTC, CallState } from '@/hooks/useWebRTC';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, User } from 'lucide-react';

export interface CallInterfaceV2Props {
  remoteUserId: string;
  remoteUserName: string;
  remoteUserAvatar?: string;
  callType: 'audio' | 'video';
  callState: 'outgoing' | 'incoming' | 'active' | 'ended';
  onCallEnd?: () => void;
  onCallAccept?: () => void;
  onCallDecline?: () => void;
  className?: string;
}

export function CallInterfaceV2({
  remoteUserId,
  remoteUserName,
  remoteUserAvatar,
  callType,
  callState: initialCallState,
  onCallEnd,
  onCallAccept,
  onCallDecline,
  className,
}: CallInterfaceV2Props) {
  const {
    callState,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOn,
    callDuration,
    error,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const ringingAudioRef = useRef<HTMLAudioElement>(null);

  // Initialize call based on props
  useEffect(() => {
    const initializeCall = async () => {
      try {
        if (initialCallState === 'outgoing') {
          await startCall(remoteUserId, callType);
        } else if (initialCallState === 'incoming') {
          // For incoming calls, we expect the parent to handle the offer
          // and call answerCall with the offer details
        }
      } catch (err) {
        console.error('Error initializing call:', err);
        onCallEnd?.();
      }
    };

    initializeCall();

    return () => {
      if (callState !== 'idle' && callState !== 'ended') {
        endCall().catch(console.error);
      }
    };
  }, [remoteUserId, callType, initialCallState]);

  // Handle local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle remote video stream
  useEffect(() => {
    const remoteStream = remoteStreams.get(remoteUserId);
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStreams, remoteUserId]);

  // Handle remote audio stream
  useEffect(() => {
    const remoteStream = remoteStreams.get(remoteUserId);
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(console.error);
    }
  }, [remoteStreams, remoteUserId]);

  // Handle ringing sound
  useEffect(() => {
    const isRinging = callState === 'ringing' || callState === 'incoming_ringing' || callState === 'outgoing_ringing';
    
    if (isRinging) {
      if (!ringingAudioRef.current) {
        const ringtoneAudio = new Audio('/ringtone.mp3');
        ringtoneAudio.loop = true;
        ringtoneAudio.volume = 0.8;
        ringtoneAudio.preload = 'auto';
        ringingAudioRef.current = ringtoneAudio;
      }
      
      const playRinging = async () => {
        try {
          await ringingAudioRef.current?.play();
        } catch (err) {
          console.error('Error playing ringtone:', err);
        }
      };
      
      playRinging();
    } else {
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
        ringingAudioRef.current.currentTime = 0;
      }
    }
    
    return () => {
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
        ringingAudioRef.current.currentTime = 0;
      }
    };
  }, [callState]);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle call actions
  const handleEndCall = async () => {
    await endCall();
    onCallEnd?.();
  };

  const handleAcceptCall = () => {
    // The actual answer logic is handled by the parent component
    onCallAccept?.();
  };

  const handleDeclineCall = () => {
    endCall().catch(console.error);
    onCallDecline?.();
  };

  // Render call interface based on call state
  const renderCallContent = () => {
    const isRinging = callState === 'ringing' || callState === 'incoming_ringing' || callState === 'outgoing_ringing';
    const isConnecting = callState === 'connecting' || callState === 'initiating';
    const isActive = callState === 'active';
    const isIncoming = initialCallState === 'incoming';
    const isOutgoing = initialCallState === 'outgoing';

    // Call header with duration or status
    const renderHeader = () => (
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-10">
        <div className="flex items-center space-x-2">
          <Avatar className="h-10 w-10">
            {remoteUserAvatar ? (
              <AvatarImage src={remoteUserAvatar} alt={remoteUserName} />
            ) : (
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="font-medium">{remoteUserName}</div>
            <div className="text-xs text-gray-300">
              {isRinging ? (isIncoming ? 'Incoming call...' : 'Calling...') : 
               isConnecting ? 'Connecting...' : 
               isActive ? formatDuration(callDuration) : 'Call ended'}
            </div>
          </div>
        </div>
      </div>
    );

    // Remote video or avatar
    const renderRemoteVideo = () => {
      if (callType === 'video') {
        return (
          <div className="absolute inset-0 bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-2">
                    {remoteUserAvatar ? (
                      <img 
                        src={remoteUserAvatar} 
                        alt={remoteUserName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-white" />
                    )}
                  </div>
                  <div className="text-white font-medium">{remoteUserName}</div>
                  <div className="text-gray-300 text-sm">
                    {isRinging ? (isIncoming ? 'Incoming call...' : 'Calling...') : 
                     isConnecting ? 'Connecting...' : 'Call ended'}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      // Audio call view
      return (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="h-32 w-32 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              {remoteUserAvatar ? (
                <img 
                  src={remoteUserAvatar} 
                  alt={remoteUserName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <div className="text-white text-2xl font-medium">{remoteUserName}</div>
            <div className="text-gray-300 mt-2">
              {isRinging ? (isIncoming ? 'Incoming call...' : 'Calling...') : 
               isConnecting ? 'Connecting...' : 
               isActive ? formatDuration(callDuration) : 'Call ended'}
            </div>
          </div>
        </div>
      );
    };

    // Local video preview (for video calls)
    const renderLocalVideo = () => {
      if (callType !== 'video' || !isActive) return null;
      
      return (
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden z-10 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      );
    };

    // Call controls
    const renderControls = () => {
      if (isRinging && isIncoming) {
        return (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-6 z-10">
            <Button
              onClick={handleDeclineCall}
              className="bg-purple-600 hover:bg-purple-700 rounded-full h-16 w-16"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              onClick={handleAcceptCall}
              className="bg-purple-600 hover:bg-purple-700 rounded-full h-16 w-16"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        );
      }

      if (isRinging && isOutgoing) {
        return (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
            <Button
              onClick={handleEndCall}
              className="bg-purple-600 hover:bg-purple-700 rounded-full h-16 w-16"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        );
      }

      if (isActive || isConnecting) {
        return (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4 z-10">
            <Button
              onClick={toggleMute}
              variant={isMuted ? 'destructive' : 'secondary'}
              className="rounded-full h-14 w-14"
            >
              {isMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            
            {callType === 'video' && (
              <Button
                onClick={toggleVideo}
                variant={isVideoOn ? 'secondary' : 'destructive'}
                className="rounded-full h-14 w-14"
              >
                {isVideoOn ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>
            )}
            
            <Button
              onClick={handleEndCall}
              className="bg-purple-600 hover:bg-purple-700 rounded-full h-14 w-14"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        );
      }
      
      return null;
    };

    return (
      <>
        {renderRemoteVideo()}
        {renderLocalVideo()}
        {renderHeader()}
        {renderControls()}
      </>
    );
  };

  return (
    <div className={cn(
      'relative w-full h-full overflow-hidden bg-gray-900 text-white rounded-lg',
      className
    )}>
      {renderCallContent()}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
    </div>
  );
}

export default CallInterfaceV2;
