import { useRef, useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

/**
 * useJitsiCall — Jitsi Meet External API hook for E-CARE telemedicine.
 *
 * Wraps the Jitsi Meet iFrame API loaded from the target Jitsi server.
 * No API key required — works with the free public meet.jit.si server.
 *
 * Returned interface (mirrors useDailyCall so VirtualRoom props are unchanged):
 *   jitsiContainerRef  — attach to a <div> that Jitsi will render its iframe into
 *   joinCall(roomName, jitsiServer, userName)
 *   leaveCall()
 *   toggleMic()
 *   toggleCamera()
 *   toggleScreenShare()
 *   connectionState     — 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'
 *   isMuted
 *   isCameraOff
 *   isScreenSharing
 *   error
 *   isRemoteConnected
 *   hasRemoteLeft
 *   networkQuality      — { uplinkNetworkQuality: 5, downlinkNetworkQuality: 5 } (always good)
 *   primaryRemoteUser   — { hasAudio: bool }
 *   callMode            — always 'jitsi' (drives UI conditional in VirtualRoom)
 */
export default function useJitsiCall() {
  const jitsiContainerRef = useRef(null)
  const jitsiApiRef = useRef(null)
  const activeRoomRef = useRef(null)
  const isDisposingRef = useRef(false)

  const [connectionState, setConnectionState] = useState('IDLE')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [error, setError] = useState(null)
  const [isRemoteConnected, setIsRemoteConnected] = useState(false)
  const [hasRemoteLeft, setHasRemoteLeft] = useState(false)
  const [primaryRemoteUser, setPrimaryRemoteUser] = useState(null)

  const onLeaveRef = useRef(null)
  const networkQuality = { uplinkNetworkQuality: 5, downlinkNetworkQuality: 5 }

  const loadJitsiScript = useCallback((jitsiServer) => {
    return new Promise((resolve, reject) => {
      const domain = jitsiServer.replace(/^https?:\/\//, '').replace(/\/$/, '')
      const scriptId = 'jitsi-external-api-script'

      if (window.JitsiMeetExternalAPI) { resolve(); return }

      const existingScript = document.getElementById(scriptId)
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Jitsi script')))
        return
      }

      const script = document.createElement('script')
      script.id = scriptId
      script.src = `https://${domain}/external_api.js`
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load Jitsi script from ${domain}`))
      document.head.appendChild(script)
    })
  }, [])

  const leaveCall = useCallback(async () => {
    if (isDisposingRef.current) return
    isDisposingRef.current = true

    try {
      activeRoomRef.current = null
      if (jitsiApiRef.current) {
        const api = jitsiApiRef.current
        jitsiApiRef.current = null
        try { api.dispose() } catch (e) {}
      }
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = ''
      }
      setConnectionState('IDLE')
      setIsMuted(false)
      setIsCameraOff(false)
      setIsScreenSharing(false)
      setIsRemoteConnected(false)
      setHasRemoteLeft(false)
      setPrimaryRemoteUser(null)
      setError(null)
    } finally {
      isDisposingRef.current = false
    }
  }, [])

  const joinCall = useCallback(async (roomName, jitsiServer = 'https://meet.jit.si', userName = 'Participant', onLeave = null) => {
    const roomKey = `${jitsiServer}::${roomName}`

    // If already active or connecting for the same room, prevent duplicate teardown and reload
    if (activeRoomRef.current === roomKey && jitsiApiRef.current && connectionState !== 'ERROR') {
      return
    }

    activeRoomRef.current = roomKey
    onLeaveRef.current = onLeave
    setError(null)
    setHasRemoteLeft(false)
    setIsRemoteConnected(false)
    setConnectionState('CONNECTING')

    try {
      await loadJitsiScript(jitsiServer)
    } catch (err) {
      activeRoomRef.current = null
      setError('Could not load Jitsi Meet. Check your internet connection and Jitsi server URL.')
      setConnectionState('ERROR')
      return
    }

    if (!window.JitsiMeetExternalAPI) {
      activeRoomRef.current = null
      setError('Jitsi Meet External API is not available. Please refresh the page.')
      setConnectionState('ERROR')
      return
    }

    if (!jitsiContainerRef.current) {
      activeRoomRef.current = null
      setError('Jitsi container not found. Please refresh.')
      setConnectionState('ERROR')
      return
    }

    // Clean up previous instance before creating a new one
    if (jitsiApiRef.current) {
      isDisposingRef.current = true
      try { jitsiApiRef.current.dispose() } catch (e) {}
      jitsiApiRef.current = null
      isDisposingRef.current = false
    }
    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = ''
    }

    // Check device availability and avoid crashing if camera is locked or absent
    let startVideoMuted = false
    let startAudioMuted = false
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        testStream.getTracks().forEach(t => t.stop())
      }
    } catch (mediaErr) {
      if (mediaErr.name === 'NotReadableError' || mediaErr.name === 'TrackStartError') {
        toast('Webcam in use by another app. Joining with camera off...', { icon: '📷' })
        startVideoMuted = true
      } else if (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError') {
        startVideoMuted = true
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          audioStream.getTracks().forEach(t => t.stop())
        } catch (audioErr) {
          startAudioMuted = true
        }
      } else if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
        toast('Camera/microphone blocked. Joining with audio & video off...', { icon: '🔒' })
        startVideoMuted = true
        startAudioMuted = true
      } else {
        startVideoMuted = true
      }
    }

    const domain = jitsiServer.replace(/^https?:\/\//, '').replace(/\/$/, '')

    try {
      const api = new window.JitsiMeetExternalAPI(domain, {
        roomName: roomName,
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName: userName },
        configOverwrite: {
          prejoinConfig: {
            enabled: false,
          },
          prejoinPageEnabled: false,
          skipPrejoinPage: true,
          enableWelcomePage: false,
          enableClosePage: false,
          disableDeepLinking: true,
          disableInviteFunctions: true,
          requireDisplayName: false,
          enableNoAudioDetection: false,
          enableNoisyMicDetection: false,
          startWithAudioMuted: startAudioMuted,
          startWithVideoMuted: startVideoMuted,
          doNotStoreRoom: true,
          hideConferenceSubject: true,
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'chat',
            'raisehand', 'tileview', 'fullscreen', 'hangup'
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_FOOTER: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_APP_PROMO: false,
          TILE_VIEW_MAX_COLUMNS: 2,
        },
        width: '100%',
        height: '100%',
      })

      // Ensure iframe has all necessary hardware permissions
      try {
        const iframe = api.getIFrame()
        if (iframe) {
          iframe.setAttribute('allow', 'camera; microphone; display-capture; autoplay; clipboard-write; hid')
        }
      } catch (e) {}

      jitsiApiRef.current = api

      api.addEventListener('videoConferenceJoined', () => { 
        setConnectionState('CONNECTED') 
      })

      api.addEventListener('videoConferenceLeft', () => {
        setConnectionState('IDLE')
        setIsRemoteConnected(false)
        activeRoomRef.current = null
        if (!isDisposingRef.current && typeof onLeaveRef.current === 'function') {
          onLeaveRef.current()
        }
      })

      api.addEventListener('readyToClose', () => {
        setConnectionState('IDLE')
        setIsRemoteConnected(false)
        activeRoomRef.current = null
        if (!isDisposingRef.current && typeof onLeaveRef.current === 'function') {
          onLeaveRef.current()
        }
      })

      api.addEventListener('participantJoined', () => {
        setIsRemoteConnected(true)
        setHasRemoteLeft(false)
        setPrimaryRemoteUser({ hasAudio: true })
      })

      api.addEventListener('participantLeft', () => {
        try {
          const participants = api.getParticipantsInfo()
          if (!participants || participants.length === 0) {
            setIsRemoteConnected(false)
            setHasRemoteLeft(true)
            setPrimaryRemoteUser(null)
          }
        } catch (e) {
          setIsRemoteConnected(false)
          setHasRemoteLeft(true)
          setPrimaryRemoteUser(null)
        }
      })

      api.addEventListener('audioMuteStatusChanged', ({ muted }) => { setIsMuted(muted) })
      api.addEventListener('videoMuteStatusChanged', ({ muted }) => { setIsCameraOff(muted) })
      api.addEventListener('screenSharingStatusChanged', ({ on }) => { setIsScreenSharing(on) })

      api.addEventListener('errorOccurred', ({ error: errObj }) => {
        setError(errObj?.message || 'An error occurred in the video call.')
        setConnectionState('ERROR')
      })

      api.addEventListener('connectionFailed', () => {
        setError('Connection to Jitsi server failed. Please check your network.')
        setConnectionState('ERROR')
      })

    } catch (err) {
      activeRoomRef.current = null
      setError(err.message || 'Failed to initialize Jitsi Meet.')
      setConnectionState('ERROR')
    }
  }, [loadJitsiScript, connectionState])

  const toggleMic = useCallback(() => {
    if (jitsiApiRef.current) jitsiApiRef.current.executeCommand('toggleAudio')
  }, [])

  const toggleCamera = useCallback(() => {
    if (jitsiApiRef.current) jitsiApiRef.current.executeCommand('toggleVideo')
  }, [])

  const toggleScreenShare = useCallback(() => {
    if (jitsiApiRef.current) jitsiApiRef.current.executeCommand('toggleShareScreen')
  }, [])

  useEffect(() => {
    return () => {
      activeRoomRef.current = null
      if (jitsiApiRef.current) {
        isDisposingRef.current = true
        try { jitsiApiRef.current.dispose() } catch (e) {}
        jitsiApiRef.current = null
        isDisposingRef.current = false
      }
    }
  }, [])

  return {
    jitsiContainerRef,
    localVideoRef: null,
    remoteVideoRef: null,
    prebuiltContainerRef: jitsiContainerRef,
    joinCall,
    leaveCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    connectionState,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error,
    isRemoteConnected,
    hasRemoteLeft,
    primaryRemoteUser,
    networkQuality,
    callMode: 'jitsi',
  }
}
