import React, { useEffect, useRef, useState } from 'react'
import { 
  VideoCamera, Microphone, MicrophoneSlash, VideoCameraSlash, 
  PhoneDisconnect, Chats, Users, FileText, 
  PaperPlaneRight, X, Minus, CornersOut, 
  ShareNetwork, DotsThreeVertical, Heartbeat, 
  Clock, Calendar, IdentificationCard, 
  ShieldCheck, ArrowLeft, MagnifyingGlass, UserCircle,
  Lightning, Broadcast, LockKey, WifiHigh, WifiLow, WifiMedium,
  Monitor, Warning, Spinner, CheckCircle, CameraRotate
} from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import agoraService from '../../services/agoraService'

const NetQualityIcon = ({ quality }) => {
  if (quality <= 2) return <WifiHigh size={18} weight="bold" color="#22c55e" />
  if (quality <= 4) return <WifiMedium size={18} weight="bold" color="#eab308" />
  return <WifiLow size={18} weight="bold" color="#ef4444" />
}

/**
 * AgoraVideoRoom
 *
 * Clinical-grade native video rendering interface for Agora WebRTC 4.x.
 * Features remote video display, Picture-in-Picture local camera,
 * screen share banner, connection quality badges, authoritative timer,
 * and partner reconnection grace period.
 */
const AgoraVideoRoom = ({
  callState,
  roomData,
  partnerName,
  user,
  isDoctor,
  startedAt,
  timeLeft,
  onExit,
  showInCallChat,
  setShowInCallChat,
}) => {
  const {
    localAudioTrack,
    localVideoTrack,
    screenTrack,
    remoteUsers,
    primaryRemoteUser,
    connectionState,
    isMuted,
    isCameraOff,
    isScreenSharing,
    networkQuality,
    isRemoteConnected,
    hasRemoteLeft,
    toggleMic,
    toggleCamera,
    switchCamera,
    toggleScreenShare,
    error
  } = callState

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const screenVideoRef = useRef(null)
  const [availableCameras, setAvailableCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState(120)

  // Enumerate available cameras for device switching
  useEffect(() => {
    agoraService.getDevices().then(({ cameras }) => {
      if (cameras && cameras.length > 0) {
        setAvailableCameras(cameras)
        setSelectedCameraId(cameras[0].deviceId)
      }
    })
  }, [])

  // ── Bind Local Video Track ──────────────────────────────────────────────
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current && !isCameraOff) {
      localVideoTrack.play(localVideoRef.current)
    }
    return () => {
      if (localVideoTrack) {
        try { localVideoTrack.stop() } catch (e) {}
      }
    }
  }, [localVideoTrack, isCameraOff])

  // ── Bind Primary Remote Video Track ──────────────────────────────────────
  useEffect(() => {
    if (primaryRemoteUser?.videoTrack && remoteVideoRef.current) {
      primaryRemoteUser.videoTrack.play(remoteVideoRef.current)
    }
    return () => {
      if (primaryRemoteUser?.videoTrack) {
        try { primaryRemoteUser.videoTrack.stop() } catch (e) {}
      }
    }
  }, [primaryRemoteUser, primaryRemoteUser?.videoTrack])

  // ── Partner Disconnect Grace Period Countdown ───────────────────────────
  useEffect(() => {
    let interval = null
    if (hasRemoteLeft && connectionState === 'CONNECTED') {
      setGracePeriodSeconds(120)
      interval = setInterval(() => {
        setGracePeriodSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            toast('Partner did not reconnect within the 2-minute grace period.')
            onExit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setGracePeriodSeconds(120)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [hasRemoteLeft, connectionState, onExit])

  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) {
      toast('Only one camera device detected.')
      return
    }
    const currentIndex = availableCameras.findIndex(c => c.deviceId === selectedCameraId)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]
    setSelectedCameraId(nextCamera.deviceId)
    await switchCamera(nextCamera.deviceId)
  }

  return (
    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#020617', display: 'flex' }}>
      {/* ── Main Viewport (Remote Video or Screen Share) ── */}
      <div style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Remote Video Container */}
        {isRemoteConnected && primaryRemoteUser?.hasVideo ? (
          <div 
            ref={remoteVideoRef} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              position: 'absolute',
              inset: 0
            }} 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', color: 'white', textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '36px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
            }}>
              <UserCircle size={80} weight="thin" color="rgba(255,255,255,0.7)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                {partnerName || (isDoctor ? 'Waiting for Patient' : 'Waiting for Doctor')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                {isRemoteConnected ? 'Participant camera is off' : 'Waiting for participant to join the room…'}
              </p>
            </div>
          </div>
        )}

        {/* ── Screen Sharing Banner ── */}
        {isScreenSharing && (
          <div style={{
            position: 'absolute', top: '5.5rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(16, 185, 129, 0.9)', backdropFilter: 'blur(12px)',
            padding: '8px 20px', borderRadius: '24px', color: 'white',
            display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
            zIndex: 30, fontSize: '0.8125rem', fontWeight: 700
          }}>
            <Monitor size={18} weight="bold" />
            <span>You are sharing your screen with {partnerName || 'partner'}</span>
            <button
              onClick={toggleScreenShare}
              style={{
                marginLeft: '8px', padding: '4px 10px', borderRadius: '12px',
                background: 'white', color: '#047857', border: 'none',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
              }}
            >
              Stop Sharing
            </button>
          </div>
        )}

        {/* ── Partner Disconnected Grace Period Banner ── */}
        {hasRemoteLeft && connectionState === 'CONNECTED' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute', top: '5.5rem', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(239, 68, 68, 0.9)', backdropFilter: 'blur(12px)',
              padding: '10px 24px', borderRadius: '24px', color: 'white',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 10px 20px -3px rgba(239, 68, 68, 0.4)',
              zIndex: 30, fontSize: '0.85rem', fontWeight: 700
            }}
          >
            <Warning size={20} weight="bold" />
            <span>Partner disconnected. Grace period active ({gracePeriodSeconds}s remaining to reconnect)...</span>
          </motion.div>
        )}

        {/* ── Reconnecting Banner ── */}
        {connectionState === 'RECONNECTING' && (
          <div style={{
            position: 'absolute', top: '5.5rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(245, 158, 11, 0.95)', backdropFilter: 'blur(12px)',
            padding: '10px 24px', borderRadius: '24px', color: 'white',
            display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 10px 20px -3px rgba(245, 158, 11, 0.4)',
            zIndex: 30, fontSize: '0.85rem', fontWeight: 700
          }}>
            <Spinner size={20} weight="bold" className="ecare-spin" />
            <span>Network interrupted. Reconnecting to consultation room…</span>
          </div>
        )}

        {/* ── Local Camera PiP (Picture in Picture) ── */}
        <motion.div
          drag
          dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
          style={{
            position: 'absolute',
            bottom: '6rem',
            right: '2rem',
            width: '200px',
            height: '130px',
            borderRadius: '20px',
            background: '#0f172a',
            border: '2px solid rgba(255,255,255,0.15)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            zIndex: 40,
            cursor: 'grab'
          }}
        >
          {isCameraOff ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '4px' }}>
              <UserCircle size={40} weight="duotone" color="rgba(255,255,255,0.4)" />
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Camera Off</span>
            </div>
          ) : (
            <div 
              ref={localVideoRef} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            />
          )}

          {/* Local Participant Badge */}
          <div style={{
            position: 'absolute', bottom: '6px', left: '8px', right: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '0.65rem', color: 'white', fontWeight: 700,
            background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '10px'
          }}>
            <span>You ({isDoctor ? 'Doctor' : 'Patient'})</span>
            {isMuted && <MicrophoneSlash size={12} weight="bold" color="#ef4444" />}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Agora Control Bar ── */}
      <div style={{ 
        position: 'absolute',
        bottom: '1.75rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.75rem 2rem', 
        display: 'flex', 
        alignItems: 'center',
        gap: '1.25rem',
        background: 'rgba(15, 23, 42, 0.85)', 
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
        zIndex: 100
      }}>
        {/* Microphone Toggle */}
        <button 
          onClick={toggleMic}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          style={{ 
            width: '52px', height: '52px', borderRadius: '16px', 
            background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', 
            border: 'none', color: 'white', cursor: 'pointer', 
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          {isMuted ? <MicrophoneSlash size={24} weight="bold" /> : <Microphone size={24} weight="bold" />}
        </button>

        {/* Camera Toggle */}
        <button 
          onClick={toggleCamera}
          title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          style={{ 
            width: '52px', height: '52px', borderRadius: '16px', 
            background: isCameraOff ? '#ef4444' : 'rgba(255,255,255,0.1)', 
            border: 'none', color: 'white', cursor: 'pointer', 
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          {isCameraOff ? <VideoCameraSlash size={24} weight="bold" /> : <VideoCamera size={24} weight="bold" />}
        </button>

        {/* Switch Camera (if available) */}
        {availableCameras.length > 1 && (
          <button 
            onClick={handleSwitchCamera}
            title="Switch Camera Device"
            style={{ 
              width: '52px', height: '52px', borderRadius: '16px', 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', color: 'white', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <CameraRotate size={24} weight="bold" />
          </button>
        )}
        
        <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.12)', margin: '0 0.25rem' }} />

        {/* Screen Share Toggle */}
        <button 
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          style={{ 
            width: '52px', height: '52px', borderRadius: '16px', 
            background: isScreenSharing ? 'var(--ecare-primary)' : 'rgba(255,255,255,0.1)', 
            border: 'none', color: 'white', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          <Monitor size={24} weight="bold" />
        </button>
        
        {/* In-Call Clinical Chat Toggle */}
        <button 
          onClick={() => setShowInCallChat(!showInCallChat)}
          title="Clinical Consultation Chat"
          style={{ 
            width: '52px', height: '52px', borderRadius: '16px', 
            background: showInCallChat ? 'var(--ecare-primary)' : 'rgba(255,255,255,0.1)', 
            border: 'none', color: 'white', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          <Chats size={24} weight="bold" />
        </button>

        {/* End Call Button */}
        <button 
          onClick={onExit}
          title="End Consultation"
          style={{ 
            width: '80px', height: '52px', borderRadius: '18px', 
            background: '#ef4444', border: 'none', color: 'white', 
            cursor: 'pointer', fontWeight: 800, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)' 
          }}
        >
          <PhoneDisconnect size={28} weight="bold" />
        </button>
      </div>
    </div>
  )
}

export default AgoraVideoRoom
