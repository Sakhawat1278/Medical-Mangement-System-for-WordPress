import { useState, useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import agoraService from '../services/agoraService'

/**
 * useAgoraCall
 *
 * Primary React hook for Agora WebRTC 4.x telemedicine calling.
 * Matches and extends the interface used by VirtualRoom so components
 * can switch seamlessly between Agora and other providers.
 */
export default function useAgoraCall() {
  const [connectionState, setConnectionState] = useState('IDLE') // 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'
  const [isJoined, setIsJoined] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [error, setError] = useState(null)
  const [remoteUsers, setRemoteUsers] = useState([])
  const [isRemoteConnected, setIsRemoteConnected] = useState(false)
  const [hasRemoteLeft, setHasRemoteLeft] = useState(false)
  const [networkQuality, setNetworkQuality] = useState({ uplinkNetworkQuality: 5, downlinkNetworkQuality: 5 })
  const [localTracks, setLocalTracks] = useState({ audioTrack: null, videoTrack: null })
  const [screenTrack, setScreenTrack] = useState(null)

  const activeSessionRef = useRef(null)
  const onLeaveRef = useRef(null)
  const fetchTokenRef = useRef(null)
  const isLeavingRef = useRef(false)

  // Primary remote participant (first remote user with active video/audio)
  const primaryRemoteUser = remoteUsers.length > 0 ? remoteUsers[0] : null

  /**
   * Leave current call and clean up local tracks.
   */
  const leaveCall = useCallback(async () => {
    if (isLeavingRef.current) return
    isLeavingRef.current = true

    try {
      await agoraService.leave()
      activeSessionRef.current = null
      setIsJoined(false)
      setConnectionState('IDLE')
      setIsMuted(false)
      setIsCameraOff(false)
      setIsScreenSharing(false)
      setRemoteUsers([])
      setIsRemoteConnected(false)
      setHasRemoteLeft(false)
      setLocalTracks({ audioTrack: null, videoTrack: null })
      setScreenTrack(null)
      setError(null)

      if (typeof onLeaveRef.current === 'function') {
        onLeaveRef.current()
      }
    } finally {
      isLeavingRef.current = false
    }
  }, [])

  /**
   * Join an Agora telemedicine session.
   *
   * @param {Object} sessionData
   * @param {string} sessionData.appId Agora App ID
   * @param {string} sessionData.channel Server-derived channel name
   * @param {string} sessionData.rtcToken Short-lived RTC token
   * @param {number} sessionData.uid Server-derived deterministic integer UID
   * @param {Object} sessionData.config Feature toggles { video, audio, screenShare }
   * @param {Function} onLeave Callback when call exits
   * @param {Function} fetchToken Callback to fetch fresh token for auto-renewal
   */
  const joinCall = useCallback(async (sessionData, onLeave = null, fetchToken = null) => {
    if (!sessionData || !sessionData.appId || !sessionData.channel || !sessionData.rtcToken) {
      setError('Invalid consultation credentials. Please try re-entering the room.')
      setConnectionState('ERROR')
      return
    }

    const sessionKey = `${sessionData.channel}::${sessionData.uid}`
    if (activeSessionRef.current === sessionKey && isJoined) {
      return
    }

    activeSessionRef.current = sessionKey
    onLeaveRef.current = onLeave
    fetchTokenRef.current = fetchToken
    setError(null)
    setHasRemoteLeft(false)
    setIsRemoteConnected(false)
    setConnectionState('CONNECTING')

    const client = agoraService.getClient()

    // ── Bind Agora RTC client events ──────────────────────────────────────────
    const handleUserPublished = async (user, mediaType) => {
      try {
        await agoraService.subscribe(user, mediaType)
        setRemoteUsers([...client.remoteUsers])
        setIsRemoteConnected(true)
        setHasRemoteLeft(false)
      } catch (subErr) {
        console.warn('Failed to subscribe to remote track:', subErr)
      }
    }

    const handleUserUnpublished = (user, mediaType) => {
      setRemoteUsers([...client.remoteUsers])
    }

    const handleUserJoined = (user) => {
      setRemoteUsers([...client.remoteUsers])
      setIsRemoteConnected(true)
      setHasRemoteLeft(false)
    }

    const handleUserLeft = (user, reason) => {
      const remaining = client.remoteUsers.filter(u => u.uid !== user.uid)
      setRemoteUsers(remaining)
      if (remaining.length === 0) {
        setIsRemoteConnected(false)
        setHasRemoteLeft(true)
      }
    }

    const handleConnectionStateChange = (curState, revState, reason) => {
      if (curState === 'CONNECTED') {
        setConnectionState('CONNECTED')
      } else if (curState === 'RECONNECTING') {
        setConnectionState('RECONNECTING')
      } else if (curState === 'DISCONNECTED') {
        if (reason === 'FALLBACK' || reason === 'INTERRUPTED') {
          setConnectionState('RECONNECTING')
        } else {
          setConnectionState('IDLE')
        }
      }
    }

    const handleNetworkQuality = (stats) => {
      setNetworkQuality({
        uplinkNetworkQuality: stats.uplinkNetworkQuality,
        downlinkNetworkQuality: stats.downlinkNetworkQuality
      })
    }

    const handleTokenWillExpire = async () => {
      toast('Renewing consultation security token…', { icon: '🔑', duration: 2500 })
      if (typeof fetchTokenRef.current === 'function') {
        try {
          const fresh = await fetchTokenRef.current()
          if (fresh?.rtcToken) {
            await agoraService.renewToken(fresh.rtcToken)
          }
        } catch (err) {
          console.error('Auto token renewal failed:', err)
        }
      }
    }

    const handleTokenDidExpire = async () => {
      if (typeof fetchTokenRef.current === 'function') {
        try {
          const fresh = await fetchTokenRef.current()
          if (fresh?.rtcToken) {
            await agoraService.renewToken(fresh.rtcToken)
            return
          }
        } catch (e) {}
      }
      setError('Consultation security token has expired. Please rejoin.')
      setConnectionState('ERROR')
    }

    // Attach listeners
    client.removeAllListeners()
    client.on('user-published', handleUserPublished)
    client.on('user-unpublished', handleUserUnpublished)
    client.on('user-joined', handleUserJoined)
    client.on('user-left', handleUserLeft)
    client.on('connection-state-change', handleConnectionStateChange)
    client.on('network-quality', handleNetworkQuality)
    client.on('token-privilege-will-expire', handleTokenWillExpire)
    client.on('token-privilege-did-expire', handleTokenDidExpire)

    try {
      // 1. Join the Agora Channel
      await agoraService.join({
        appId: sessionData.appId,
        channel: sessionData.channel,
        token: sessionData.rtcToken,
        uid: sessionData.uid
      })

      // 2. Initialize and Publish Local Audio & Video
      const config = sessionData.config || {}
      const wantVideo = config.video !== false
      const wantAudio = config.audio !== false

      const tracks = await agoraService.createLocalTracks({
        video: wantVideo,
        audio: wantAudio
      })

      setLocalTracks(tracks)
      setIsMuted(!tracks.audioTrack)
      setIsCameraOff(!tracks.videoTrack)

      await agoraService.publishTracks()

      setIsJoined(true)
      setConnectionState('CONNECTED')
    } catch (err) {
      console.error('Failed to join Agora consultation:', err)
      activeSessionRef.current = null
      let friendlyError = 'Failed to connect to consultation video room.'
      if (err.name === 'NotAllowedError' || err.code === 'PERMISSION_DENIED') {
        friendlyError = 'Camera or microphone permission was blocked. Please grant access in your browser settings.'
      } else if (err.code === 'CAN_NOT_GET_GATEWAY_SERVER' || err.code === 'NETWORK_ERROR') {
        friendlyError = 'Network connection failed. Please check your internet and firewall settings.'
      } else if (err.code === 'DYNAMIC_KEY_TIMEOUT' || err.message?.includes('token')) {
        friendlyError = 'Consultation token validation failed. Please check Agora App Certificate.'
      } else if (err.message) {
        friendlyError = err.message
      }
      setError(friendlyError)
      setConnectionState('ERROR')
    }
  }, [isJoined])

  /**
   * Toggle microphone mute.
   */
  const toggleMic = useCallback(async () => {
    try {
      const muted = await agoraService.toggleMic()
      setIsMuted(muted)
      toast(muted ? 'Microphone muted' : 'Microphone unmuted', {
        icon: muted ? '🔇' : '🎙️',
        duration: 1500
      })
    } catch (err) {
      console.warn('Failed to toggle mic:', err)
    }
  }, [])

  /**
   * Toggle camera on/off.
   */
  const toggleCamera = useCallback(async () => {
    try {
      const cameraOff = await agoraService.toggleCamera()
      setIsCameraOff(cameraOff)
      toast(cameraOff ? 'Camera turned off' : 'Camera turned on', {
        icon: cameraOff ? '📷' : '📹',
        duration: 1500
      })
    } catch (err) {
      console.warn('Failed to toggle camera:', err)
    }
  }, [])

  /**
   * Switch active camera input device.
   */
  const switchCamera = useCallback(async (deviceId) => {
    const success = await agoraService.switchCamera(deviceId)
    if (success) {
      toast.success('Camera switched successfully')
    } else {
      toast.error('Failed to switch camera device')
    }
  }, [])

  /**
   * Toggle screen sharing.
   */
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await agoraService.stopScreenShare()
      setIsScreenSharing(false)
      setScreenTrack(null)
      toast('Screen sharing stopped')
    } else {
      try {
        const track = await agoraService.startScreenShare(() => {
          setIsScreenSharing(false)
          setScreenTrack(null)
          toast('Screen sharing ended')
        })
        setIsScreenSharing(true)
        setScreenTrack(track)
        toast.success('Screen sharing active')
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast.error('Could not start screen sharing.')
        }
      }
    }
  }, [isScreenSharing])

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      activeSessionRef.current = null
      agoraService.leave().catch(() => {})
    }
  }, [])

  return {
    client: agoraService.getClient(),
    localAudioTrack: localTracks.audioTrack,
    localVideoTrack: localTracks.videoTrack,
    screenTrack,
    remoteUsers,
    primaryRemoteUser,
    isJoined,
    connectionState,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error,
    networkQuality,
    isRemoteConnected,
    hasRemoteLeft,
    joinCall,
    leaveCall,
    toggleMic,
    toggleCamera,
    switchCamera,
    toggleScreenShare,
    callMode: 'agora'
  }
}
