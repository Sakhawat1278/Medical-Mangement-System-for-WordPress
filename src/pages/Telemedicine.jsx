import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { 
  VideoCamera, Microphone, MicrophoneSlash, VideoCameraSlash, 
  PhoneDisconnect, Chats, Users, FileText, 
  PaperPlaneRight, X, Minus, CornersOut, 
  ShareNetwork, DotsThreeVertical, Heartbeat, 
  Clock, Calendar, IdentificationCard, 
  ShieldCheck, ArrowLeft, MagnifyingGlass, UserCircle,
  Lightning, Broadcast, LockKey, WifiHigh, WifiLow, WifiMedium,
  Monitor, Warning, Spinner, CheckCircle
} from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore, { isTimeslotActive, isTimeslotFuture, isTimeslotEnded } from '../store/useStore'
import useAuth from '../hooks/useAuth'
import useJitsiCall from '../hooks/useJitsiCall'
import useAgoraCall from '../hooks/useAgoraCall'
import AgoraVideoRoom from '../components/telemed/AgoraVideoRoom'
import toast from 'react-hot-toast'

const isVideoConsultMode = (mode) => {
  const normalized = String(mode || '').trim().toLowerCase()
  return normalized === 'video consult' || normalized === 'telemedicine'
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

const ChatMessage = ({ msg, isMe, onReply, onEdit, onDelete, parentMsg, isMobile, onCallBack }) => {
  if (msg.type === 'call_event' || msg.event_type) {
    const eventType = String(msg.event_type || msg.message || '').toLowerCase()
    const isMissed = eventType.includes('missed')
    const isDeclined = eventType.includes('declined') || eventType.includes('rejected')
    const isEnded = !isMissed && !isDeclined

    return (
      <div 
        id={`msg-${msg.id}`}
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: isMobile ? '0.75rem' : '1rem' 
        }}
      >
        <div style={{
          background: 'white',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '0.875rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          maxWidth: '380px',
          width: '100%'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: isEnded ? 'var(--ecare-primary-bg)' : (isMissed ? '#fee2e2' : '#fef3c7'),
            color: isEnded ? 'var(--ecare-primary)' : (isMissed ? '#ef4444' : '#d97706'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {isEnded ? <VideoCamera size={22} weight="bold" /> : <PhoneDisconnect size={22} weight="bold" />}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>
              {isEnded ? 'Video Consultation Ended' : (isMissed ? 'Missed Video Call' : 'Call Declined')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {msg.message || (isEnded ? 'Session ended' : 'No answer')} • {new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {onCallBack && (
            <button 
              type="button"
              onClick={onCallBack}
              style={{
                padding: '6px 14px',
                borderRadius: '12px',
                background: 'var(--ecare-primary)',
                color: 'white',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)'
              }}
            >
              Call Back
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      id={`msg-${msg.id}`}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: isMobile ? '0.75rem' : '1rem',
        width: '100%'
      }}
    >
      <div style={{ 
        maxWidth: '85%', 
        padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem', 
        borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
        background: isMe ? 'var(--ecare-primary)' : 'white',
        color: isMe ? 'white' : 'var(--ecare-text-main)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        fontSize: isMobile ? '0.8125rem' : '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
        textAlign: 'left'
      }}>
        {parentMsg && (
          <div 
            onClick={() => {
              const el = document.getElementById(`msg-${parentMsg.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            style={{
              background: isMe ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
              borderLeft: `3px solid ${isMe ? 'white' : 'var(--ecare-primary)'}`,
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              marginBottom: '6px',
              cursor: 'pointer',
              color: isMe ? 'white' : 'var(--ecare-text-main)',
              opacity: 0.95
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.7rem', marginBottom: '2px', color: isMe ? 'white' : 'var(--ecare-primary)' }}>
              {parentMsg.sender_name || (parentMsg.sender_id == msg.sender_id ? 'You' : 'Partner')}
            </div>
            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
              {parentMsg.message || parentMsg.text}
            </div>
          </div>
        )}
        {msg.message || msg.text}
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px', alignItems: 'center', flexDirection: isMe ? 'row-reverse' : 'row' }}>
        <span style={{ fontSize: '0.625rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>
          {new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button 
          type="button" 
          onClick={() => onReply(msg)}
          style={{ background: 'none', border: 'none', color: 'var(--ecare-text-muted)', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
        >
          Reply
        </button>
        {isMe && (
          <button 
            type="button" 
            onClick={() => onEdit(msg)}
            style={{ background: 'none', border: 'none', color: 'var(--ecare-text-muted)', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
          >
            Edit
          </button>
        )}
        <button 
          type="button" 
          onClick={() => onDelete(msg.id)}
          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
        >
          Delete
        </button>
        {msg.is_edited && (
          <span style={{ fontSize: '0.6rem', color: 'var(--ecare-text-muted)', fontStyle: 'italic' }}>
            (edited)
          </span>
        )}
      </div>
    </div>
  )
}

// ── Network quality icon helper ────────────────────────────────────────────
const NetQualityIcon = ({ quality }) => {
  if (quality <= 2) return <WifiHigh size={16} weight="bold" color="#22c55e" />
  if (quality <= 4) return <WifiMedium size={16} weight="bold" color="#f59e0b" />
  return <WifiLow size={16} weight="bold" color="#ef4444" />
}

// ── Connection state badge helper ───────────────────────────────────────────
const ConnStateBadge = ({ state, sessionType }) => {
  const map = {
    IDLE:          { color: '#94a3b8', label: 'IDLE' },
    CONNECTING:    { color: '#f59e0b', label: 'CONNECTING…' },
    CONNECTED:     { color: '#22c55e', label: 'LIVE' },
    RECONNECTING:  { color: '#f59e0b', label: 'RECONNECTING…' },
    DISCONNECTED:  { color: '#ef4444', label: 'DISCONNECTED' },
    ERROR:         { color: '#ef4444', label: 'ERROR' },
  }
  const { color, label } = map[state] || map.IDLE
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '6px 14px', borderRadius: '20px' }}>
      <motion.div
        animate={state === 'CONNECTED' ? { opacity: [1, 0.3, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.4 }}
        style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}
      />
      <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>
        {label}{sessionType ? ` • ${String(sessionType).toUpperCase()} CONSULT` : ''}
      </span>
    </div>
  )
}

const AgoraCallSession = ({ onExit, sessionType, roomData, partnerName, startedAt, fetchAgoraToken }) => {
  const { isDoctor, user } = useAuth()
  const [showInCallChat, setShowInCallChat] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [chatInput, setChatInput] = useState('')

  const agoraCall = useAgoraCall()
  const {
    connectionState,
    networkQuality,
    joinCall,
    leaveCall,
    error: agoraError,
  } = agoraCall

  const roomDataRef = useRef(roomData)
  roomDataRef.current = roomData

  const onExitRef = useRef(onExit)
  onExitRef.current = onExit

  const leaveCallRef = useRef(leaveCall)
  leaveCallRef.current = leaveCall

  const handleExit = useCallback(async () => {
    const currentRoom = roomDataRef.current
    if (currentRoom?.id && (currentRoom.callStatus === 'connected' || currentRoom.callStatus === 'ringing')) {
      const { updateTelemedRoomCall, handleOp, updateTelemedSessionPresence } = useStore.getState()
      await updateTelemedRoomCall(currentRoom.id, { callStatus: 'ended', callerId: null, callerName: null })
      try {
        await updateTelemedSessionPresence(currentRoom.id, 'leave')
      } catch (e) {}
      try {
        await handleOp('telemed-messages', 'post', {
          room_id: currentRoom.id,
          sender_id: user?.id || 0,
          message: 'Video Call Ended',
          type: 'call_event',
          event_type: 'ended'
        }, null, 'telemedMessages')
      } catch (e) {}
    }
    if (leaveCallRef.current) {
      await leaveCallRef.current()
    }
    if (onExitRef.current) {
      onExitRef.current()
    }
  }, [user?.id])

  // ── Auto-cancel ringing call if unanswered after 30s ─────────────────────
  useEffect(() => {
    if (roomData?.callStatus === 'ringing' && parseInt(roomData?.callerId) === parseInt(user?.id)) {
      const timer = setTimeout(() => {
        toast.error('No response from partner. Call timed out.')
        handleExit()
      }, 30000)
      return () => clearTimeout(timer)
    }
  }, [roomData?.callStatus, roomData?.callerId, user?.id, handleExit])

  // ── Listen for call signaling status (reject / hangup) ───────────────────
  useEffect(() => {
    if (!roomData?.id || !user?.id) return

    const currentUserId = parseInt(user.id)
    const isCaller = parseInt(roomData.callerId) === currentUserId

    if (roomData.callStatus === 'rejected' && isCaller) {
      toast.error('Call declined by partner')
      const { updateTelemedRoomCall } = useStore.getState()
      updateTelemedRoomCall(roomData.id, { callStatus: 'idle', callerId: null, callerName: null })
      leaveCall()
      onExit()
    } else if (roomData.callStatus === 'ended') {
      toast('Call ended by partner')
      const { updateTelemedRoomCall } = useStore.getState()
      updateTelemedRoomCall(roomData.id, { callStatus: 'idle', callerId: null, callerName: null })
      leaveCall()
      onExit()
    }
  }, [roomData?.callStatus, roomData?.callerId, roomData?.id, user?.id, leaveCall, onExit])

  // ── Session countdown timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!startedAt) return
    let parsedDate
    if (typeof startedAt === 'string') {
      const formatted = startedAt.includes('T') ? startedAt : (startedAt.replace(' ', 'T') + 'Z')
      parsedDate = new Date(formatted)
    } else {
      parsedDate = new Date(startedAt)
    }
    if (isNaN(parsedDate.getTime())) return
    const end = parsedDate.getTime() + 60 * 60 * 1000
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const diff = end - now
      if (diff <= 0) {
        clearInterval(timer)
        setTimeLeft('00:00:00')
        toast.error('Session time has expired.')
        handleExit()
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0')
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0')
        setTimeLeft(`${h}:${m}:${s}`)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [startedAt, handleExit])

  // ── Auto-join Agora room on mount (guaranteed once per roomId) ─────────────
  const joinedRoomIdRef = useRef(null)
  const isJoiningRef = useRef(false)
  const fetchTokenRef = useRef(fetchAgoraToken)
  fetchTokenRef.current = fetchAgoraToken
  const joinCallRef = useRef(joinCall)
  joinCallRef.current = joinCall
  const handleExitRef = useRef(handleExit)
  handleExitRef.current = handleExit

  useEffect(() => {
    const targetRoomId = roomData?.id
    if (!targetRoomId) return
    if (joinedRoomIdRef.current === targetRoomId || isJoiningRef.current) return

    joinedRoomIdRef.current = targetRoomId
    isJoiningRef.current = true
    setIsJoining(true)

    let cancelled = false
    const doJoin = async () => {
      try {
        const tokenFetcher = fetchTokenRef.current || useStore.getState().fetchAgoraToken
        const sessionData = tokenFetcher ? await tokenFetcher(targetRoomId, roomData?.appointment_id) : null
        if (cancelled) return

        if (!sessionData || !sessionData.appId || !sessionData.rtcToken) {
          setIsJoining(false)
          isJoiningRef.current = false
          toast.error('Unable to initialize Agora video session. Please check Agora settings.')
          return
        }

        if (joinCallRef.current) {
          await joinCallRef.current(
            sessionData,
            () => {
              if (handleExitRef.current) handleExitRef.current()
            },
            () => {
              const fetcher = fetchTokenRef.current || useStore.getState().fetchAgoraToken
              return fetcher(targetRoomId, roomData?.appointment_id)
            }
          )
          try {
            await useStore.getState().updateTelemedSessionPresence(targetRoomId, 'join')
          } catch (e) {}
        }
      } catch (err) {
        console.error('Error joining Agora room:', err)
      } finally {
        if (!cancelled) {
          setIsJoining(false)
          isJoiningRef.current = false
        }
      }
    }

    doJoin()

    return () => {
      cancelled = true
    }
  }, [roomData?.id, roomData?.appointment_id])

  // ── Messages for in-call chat drawer ──
  const telemedMessages = useStore(state => state.telemedMessages)
  const inCallMessages = useMemo(() => {
    if (!roomData?.id) return []
    return (telemedMessages || [])
      .filter(m => String(m.room_id) === String(roomData.id) && m.type !== 'call_event')
      .sort((a, b) => new Date(a.timestamp || a.created_at || 0) - new Date(b.timestamp || b.created_at || 0))
  }, [telemedMessages, roomData?.id])

  const handleSendInCallMessage = async () => {
    if (!chatInput.trim() || !roomData?.id) return
    const text = chatInput.trim()
    setChatInput('')
    try {
      await useStore.getState().handleOp('telemed-messages', 'post', {
        room_id: roomData.id,
        sender_id: user.id,
        message: text,
        type: 'text'
      }, null, 'telemedMessages')
    } catch (e) {
      toast.error('Failed to send message')
    }
  }

  return (
    <motion.div 
      className="ecare-virtual-room"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#020617', 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Ringing/Calling overlay for the caller */}
      {roomData?.callStatus === 'ringing' && parseInt(roomData?.callerId) === parseInt(user?.id) && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 150, background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          <div style={{ position: 'relative' }}>
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                style={{
                  position: 'absolute', inset: -20,
                  borderRadius: '50%', border: '2px solid var(--ecare-primary)',
                  zIndex: -1
                }}
              />
            ))}
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserCircle size={100} weight="thin" color="white" />
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Calling via Agora WebRTC...</h3>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Waiting for {partnerName || 'partner'} to answer</p>
          </div>
          <button 
            onClick={handleExit} 
            style={{ 
              padding: '0.875rem 2.5rem', borderRadius: '16px', background: '#ef4444', 
              border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)'
            }}
          >
            <PhoneDisconnect size={20} weight="bold" /> Cancel
          </button>
        </div>
      )}

      {/* Header: Session Status */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', right: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <ConnStateBadge state={connectionState} sessionType={sessionType} />
          {startedAt && timeLeft && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '6px 14px', borderRadius: '20px' }}>
              <Clock size={16} weight="bold" />
              {timeLeft} Left
            </div>
          )}
          {connectionState === 'CONNECTED' && networkQuality && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '20px' }}>
              <NetQualityIcon quality={networkQuality.uplinkNetworkQuality || 5} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '12px' }}>
            <ShieldCheck size={18} weight="fill" color="var(--ecare-primary)" />
            <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>Agora RTC Encrypted</span>
          </div>
          <button 
            onClick={handleExit}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '6px 16px', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '0.75rem', 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
            }}
          >
            <PhoneDisconnect size={16} weight="bold" />
            Leave Room
          </button>
        </div>
      </div>

      {/* Connecting overlay */}
      <AnimatePresence>
        {(isJoining || connectionState === 'CONNECTING' || connectionState === 'RECONNECTING') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, zIndex: 200, background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Spinner size={48} weight="bold" color="var(--ecare-primary)" />
            </motion.div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
              {connectionState === 'RECONNECTING' ? 'Reconnecting to Agora consultation channel…' : 'Connecting to secure Agora video room…'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agora Error Overlay */}
      <AnimatePresence>
        {connectionState === 'ERROR' && agoraError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(2,6,23,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}
          >
            <Warning size={48} weight="duotone" color="#ef4444" />
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.125rem' }}>Agora Consultation Error</div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: '380px', lineHeight: 1.6 }}>{agoraError}</div>
            <button onClick={handleExit} style={{ marginTop: '1rem', padding: '0.75rem 2rem', borderRadius: '12px', background: '#ef4444', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
              Return to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Agora Video Area */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <AgoraVideoRoom
          callState={agoraCall}
          roomData={roomData}
          partnerName={partnerName}
          user={user}
          isDoctor={isDoctor}
          startedAt={startedAt}
          timeLeft={timeLeft}
          onExit={handleExit}
          showInCallChat={showInCallChat}
          setShowInCallChat={setShowInCallChat}
        />
      </div>

      {/* In-Call Consultation Chat Drawer */}
      <AnimatePresence>
        {showInCallChat && (
          <motion.div 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            style={{ 
              position: 'absolute', top: '1rem', bottom: '1rem', right: '1rem', 
              width: '380px', background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(24px)', 
              borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', 
              zIndex: 110, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0 }}>Consultation Chat</h3>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Synced with clinical record</p>
              </div>
              <button onClick={() => setShowInCallChat(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} weight="bold" />
              </button>
            </div>

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {inCallMessages.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.8125rem', textAlign: 'center', marginTop: '3rem' }}>
                  No messages yet. Send a note or message during the call.
                </p>
              ) : (
                inCallMessages.map((msg, i) => {
                  const isMe = Number(msg.sender_id) === Number(user?.id)
                  return (
                    <div key={msg.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <div style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isMe ? 'var(--ecare-primary)' : 'rgba(255,255,255,0.12)',
                        color: 'white',
                        fontSize: '0.8125rem'
                      }}>
                        {msg.message || msg.text}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: isMe ? 'right' : 'left', marginTop: '2px' }}>
                        {new Date(msg.timestamp || msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendInCallMessage() }}
                placeholder="Type a clinical message..."
                style={{
                  flex: 1, padding: '0.625rem 1rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white', fontSize: '0.8125rem', outline: 'none'
                }}
              />
              <button 
                onClick={handleSendInCallMessage}
                style={{
                  padding: '0.625rem 1rem', borderRadius: '12px', background: 'var(--ecare-primary)',
                  border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <PaperPlaneRight size={16} weight="bold" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const JitsiCallSession = ({ onExit, sessionType, roomData, partnerName, startedAt, fetchToken }) => {
  const { isDoctor, user } = useAuth()
  const [showInCallChat, setShowInCallChat] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const {
    jitsiContainerRef,
    joinCall,
    leaveCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    connectionState,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error: jitsiError,
    networkQuality,
    isRemoteConnected,
    primaryRemoteUser,
    hasRemoteLeft,
    callMode,
  } = useJitsiCall()

  const roomDataRef = useRef(roomData)
  roomDataRef.current = roomData

  const onExitRef = useRef(onExit)
  onExitRef.current = onExit

  const leaveCallRef = useRef(leaveCall)
  leaveCallRef.current = leaveCall

  const handleExit = useCallback(async () => {
    const currentRoom = roomDataRef.current
    if (currentRoom?.id && (currentRoom.callStatus === 'connected' || currentRoom.callStatus === 'ringing')) {
      const { updateTelemedRoomCall, handleOp } = useStore.getState()
      await updateTelemedRoomCall(currentRoom.id, { callStatus: 'ended', callerId: null, callerName: null })
      try {
        await handleOp('telemed-messages', 'post', {
          room_id: currentRoom.id,
          sender_id: user?.id || 0,
          message: 'Video Call Ended',
          type: 'call_event',
          event_type: 'ended'
        }, null, 'telemedMessages')
      } catch (e) {}
    }
    if (leaveCallRef.current) {
      await leaveCallRef.current()
    }
    if (onExitRef.current) {
      onExitRef.current()
    }
  }, [user?.id])

  // ── Auto-hangup when remote partner disconnects or leaves ──────────────────
  useEffect(() => {
    if (hasRemoteLeft && connectionState === 'CONNECTED') {
      toast('Partner has disconnected from the video call.')
      const timer = setTimeout(() => {
        handleExit()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [hasRemoteLeft, connectionState, handleExit])

  // ── Auto-cancel ringing call if unanswered after 30s ─────────────────────
  useEffect(() => {
    if (roomData?.callStatus === 'ringing' && parseInt(roomData?.callerId) === parseInt(user?.id)) {
      const timer = setTimeout(() => {
        toast.error('No response from partner. Call timed out.')
        handleExit()
      }, 30000)
      return () => clearTimeout(timer)
    }
  }, [roomData?.callStatus, roomData?.callerId, user?.id, handleExit])

  // ── Listen for call signaling status (reject / hangup) ───────────────────
  useEffect(() => {
    if (!roomData?.id || !user?.id) return

    const currentUserId = parseInt(user.id)
    const isCaller = parseInt(roomData.callerId) === currentUserId

    if (roomData.callStatus === 'rejected' && isCaller) {
      toast.error('Call declined by partner')
      const { updateTelemedRoomCall } = useStore.getState()
      updateTelemedRoomCall(roomData.id, { callStatus: 'idle', callerId: null, callerName: null })
      leaveCall()
      onExit()
    } else if (roomData.callStatus === 'ended') {
      toast('Call ended by partner')
      const { updateTelemedRoomCall } = useStore.getState()
      updateTelemedRoomCall(roomData.id, { callStatus: 'idle', callerId: null, callerName: null })
      leaveCall()
      onExit()
    }
  }, [roomData?.callStatus, roomData?.callerId, roomData?.id, user?.id, leaveCall, onExit])

  // ── Session countdown timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!startedAt) return
    let parsedDate
    if (typeof startedAt === 'string') {
      const formatted = startedAt.includes('T') ? startedAt : (startedAt.replace(' ', 'T') + 'Z')
      parsedDate = new Date(formatted)
    } else {
      parsedDate = new Date(startedAt)
    }
    if (isNaN(parsedDate.getTime())) return
    const end = parsedDate.getTime() + 60 * 60 * 1000
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const diff = end - now
      if (diff <= 0) {
        clearInterval(timer)
        setTimeLeft('00:00:00')
        toast.error('Session time has expired.')
        handleExit()
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0')
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0')
        setTimeLeft(`${h}:${m}:${s}`)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [startedAt, handleExit])

  // ── Auto-join Jitsi room on mount (guaranteed once per roomId) ─────────────
  const joinedRoomIdRef = useRef(null)
  const isJoiningRef = useRef(false)
  const fetchTokenRef = useRef(fetchToken)
  fetchTokenRef.current = fetchToken
  const joinCallRef = useRef(joinCall)
  joinCallRef.current = joinCall
  const handleExitRef = useRef(handleExit)
  handleExitRef.current = handleExit

  useEffect(() => {
    const targetRoomId = roomData?.id
    if (!targetRoomId) return
    if (joinedRoomIdRef.current === targetRoomId || isJoiningRef.current) return

    joinedRoomIdRef.current = targetRoomId
    isJoiningRef.current = true
    setIsJoining(true)

    let cancelled = false
    const doJoin = async () => {
      try {
        const tokenFetcher = fetchTokenRef.current
        const sessionData = tokenFetcher ? await tokenFetcher(targetRoomId) : null
        if (cancelled) return

        if (!sessionData || !sessionData.room_name) { 
          setIsJoining(false)
          isJoiningRef.current = false
          toast.error('Unable to initialize Jitsi video session. Please check your settings.')
          return 
        }

        const jitsiServer = sessionData.jitsi_server || 'https://meet.jit.si'
        const userName = sessionData.user_name || 'Participant'

        if (joinCallRef.current) {
          await joinCallRef.current(sessionData.room_name, jitsiServer, userName, () => {
            if (handleExitRef.current) handleExitRef.current()
          })
        }
      } catch (err) {
        console.error('Error joining Jitsi room:', err)
      } finally {
        if (!cancelled) {
          setIsJoining(false)
          isJoiningRef.current = false
        }
      }
    }

    doJoin()

    return () => {
      cancelled = true
    }
  }, [roomData?.id])

  // ── Jitsi Error Screen ───────────────────────────────────────────────────────
  if (connectionState === 'ERROR') {
    const isNotConfigured = jitsiError?.toLowerCase().includes('not configured') || jitsiError?.toLowerCase().includes('not available')

    return (
      <div style={{ height: '100%', background: '#0f172a', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '2rem', textAlign: 'center' }}>
        <Warning size={48} weight="duotone" color="#f59e0b" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          {isNotConfigured ? 'Telemedicine Not Configured' : 'Unable to Connect Video Call'}
        </h2>
        <p style={{ maxWidth: '420px', opacity: 0.8, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          {isNotConfigured ? (
            <>
              Jitsi server could not be loaded. Please go to <strong>E-CARE Settings → Telemedicine</strong> and verify the Jitsi Server URL.
            </>
          ) : (
            jitsiError || 'An error occurred while connecting to the video room. Please check your camera and microphone permissions and try again.'
          )}
        </p>
        <button onClick={onExit} style={{ padding: '0.75rem 2rem', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <motion.div 
      className="ecare-virtual-room"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#020617', 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* ── Ringing/Calling overlay for the caller ── */}
      {roomData?.callStatus === 'ringing' && parseInt(roomData?.callerId) === parseInt(user?.id) && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 150, background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          <div style={{ position: 'relative' }}>
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                style={{
                  position: 'absolute', inset: -20,
                  borderRadius: '50%', border: '2px solid var(--ecare-primary)',
                  zIndex: -1
                }}
              />
            ))}
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserCircle size={100} weight="thin" color="white" />
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Calling...</h3>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Waiting for {partnerName || 'partner'} to answer</p>
          </div>
          <button 
            onClick={handleExit} 
            style={{ 
              padding: '0.875rem 2.5rem', borderRadius: '16px', background: '#ef4444', 
              border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)'
            }}
          >
            <PhoneDisconnect size={20} weight="bold" /> Cancel
          </button>
        </div>
      )}

      {/* ── Header: Session Status ── */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', right: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <ConnStateBadge state={connectionState} sessionType={sessionType} />
          {startedAt && timeLeft && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '6px 14px', borderRadius: '20px' }}>
              <Clock size={16} weight="bold" />
              {timeLeft} Left
            </div>
          )}
          {connectionState === 'CONNECTED' && networkQuality && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '20px' }}>
              <NetQualityIcon quality={networkQuality.uplinkNetworkQuality || 5} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '12px' }}>
            <ShieldCheck size={18} weight="fill" color="var(--ecare-primary)" />
            <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>End-to-End Encrypted</span>
          </div>
          <button 
            onClick={handleExit}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '6px 16px', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '0.75rem', 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
            }}
          >
            <PhoneDisconnect size={16} weight="bold" />
            Leave Room
          </button>
        </div>
      </div>

      {/* ── Connecting overlay ── */}
      <AnimatePresence>
        {(isJoining || connectionState === 'CONNECTING' || connectionState === 'RECONNECTING') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, zIndex: 200, background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Spinner size={48} weight="bold" color="var(--ecare-primary)" />
            </motion.div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
              {connectionState === 'RECONNECTING' ? 'Reconnecting to session…' : 'Joining secure consultation room…'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Participant Area — Jitsi iframe renders here ── */}
      <div style={{ flex: 1, padding: '4rem 1.5rem 1.5rem 1.5rem', position: 'relative' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', background: '#0f172a' }}>
          <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* ── Bottom Control Bar — hidden for Jitsi (Jitsi has its own toolbar) ── */}
      {callMode !== 'jitsi' && (
        <div style={{ 
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.75rem 2rem', 
          display: 'flex', 
          alignItems: 'center',
          gap: '1.25rem',
          background: 'rgba(255,255,255,0.08)', 
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          zIndex: 100
        }}>
          {/* Mic toggle */}
          <button 
            onClick={toggleMic}
            title={isMuted ? 'Unmute' : 'Mute'}
            style={{ width: '52px', height: '52px', borderRadius: '16px', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isMuted ? <MicrophoneSlash size={24} weight="bold" /> : <Microphone size={24} weight="bold" />}
          </button>

          {/* Camera toggle */}
          <button 
            onClick={toggleCamera}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            style={{ width: '52px', height: '52px', borderRadius: '16px', background: isCameraOff ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isCameraOff ? <VideoCameraSlash size={24} weight="bold" /> : <VideoCamera size={24} weight="bold" />}
          </button>
          
          <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }} />

          {/* Screen share */}
          <button 
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
            style={{ width: '52px', height: '52px', borderRadius: '16px', background: isScreenSharing ? 'var(--ecare-primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Monitor size={24} weight="bold" />
          </button>
          
          {/* In-call chat toggle */}
          <button 
            onClick={() => setShowInCallChat(!showInCallChat)}
            title="In-call chat"
            style={{ width: '52px', height: '52px', borderRadius: '16px', background: showInCallChat ? 'var(--ecare-primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Chats size={24} weight="bold" />
          </button>

          {/* End call */}
          <button 
            onClick={handleExit}
            title="End call"
            style={{ width: '80px', height: '52px', borderRadius: '18px', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)' }}
          >
            <PhoneDisconnect size={28} weight="bold" />
          </button>
        </div>
      )}

      {/* ── In-Call Chat Sidebar ── */}
      <AnimatePresence>
        {showInCallChat && (
          <motion.div 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            style={{ position: 'absolute', top: '1rem', bottom: '1rem', right: '1rem', width: '360px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', zIndex: 110, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0 }}>Consultation Chat</h3>
               <button onClick={() => setShowInCallChat(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} weight="bold" /></button>
            </div>
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
               <p style={{ color: '#94a3b8', fontSize: '0.8125rem', textAlign: 'center', marginTop: '2rem' }}>Clinical chat synchronized...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const VirtualRoom = ({ onExit, sessionType, isPaid, roomData, partnerName, startedAt, fetchToken, fetchAgoraToken }) => {
  const telemedProvider = useStore(state => state.telemedSettings?.provider) || window.ecareConfig?.settings?.telemedProvider || 'agora'

  // ── Unpaid gate ─────────────────────────────────────────────────────────
  if (!isPaid) return (
    <div style={{ height: '100%', background: '#0f172a', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '2rem', textAlign: 'center' }}>
       <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <LockKey size={40} weight="duotone" color="#fbbf24" />
       </div>
       <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Payment Required</h2>
       <p style={{ maxWidth: '320px', opacity: 0.7, fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          This clinical session has not been paid for. Please complete the transaction to unlock video and audio features.
       </p>
       <button onClick={onExit} style={{ padding: '0.75rem 2rem', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          Return to Dashboard
       </button>
    </div>
  )

  if (telemedProvider === 'jitsi') {
    return (
      <JitsiCallSession 
        onExit={onExit} 
        sessionType={sessionType} 
        roomData={roomData} 
        partnerName={partnerName} 
        startedAt={startedAt} 
        fetchToken={fetchToken} 
      />
    )
  }

  return (
    <AgoraCallSession 
      onExit={onExit} 
      sessionType={sessionType} 
      roomData={roomData} 
      partnerName={partnerName} 
      startedAt={startedAt} 
      fetchAgoraToken={fetchAgoraToken} 
    />
  )
}

// ─── Main Telemedicine Hub ───────────────────────────────────────────────────

const Telemedicine = () => {
  const { 
    user, setActivePage, appointments, doctorList, patients,
    telemedRooms, telemedMessages, initStore, handleOp,
    setTelemedPaymentModal, createTelemedRoom, isPaymentExpired,
    deleteTelemedMessage, updateTelemedMessage, openConfirm, closeConfirm,
    addAppointment, transactions, instantCallFee, fetchJitsiSession, fetchAgoraToken,
    selectedRoomId, setSelectedRoomId, activeTab, setActiveTab, updateTelemedRoomCall
  } = useStore()
  const { isPatient, isDoctor } = useAuth()
  const [messageInput, setMessageInput] = useState('')
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [isDoctorOnline, setIsDoctorOnline] = useState(true)
  const chatContainerRef = useRef(null)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [showMobileRightPanel, setShowMobileRightPanel] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Polling for live updates
  useEffect(() => {
    const poll = setInterval(() => {
      initStore(true)
    }, 4000)
    return () => clearInterval(poll)
  }, [])

  const activeRooms = useMemo(() => {
    if (isDoctor) {
      return telemedRooms.filter(r => r.doctor_id === user.id || r.doctor_id == user.id)
    }
    return telemedRooms.filter(r => r.patient_id === user.id || r.patient_id == user.id)
  }, [telemedRooms, user.id, isDoctor])

  const selectedRoom = useMemo(() => {
    return telemedRooms.find(r => r.id === selectedRoomId)
  }, [telemedRooms, selectedRoomId])

  const getPartnerName = (room) => {
    if (!room) return '';
    if (isDoctor) {
      const pat = (patients || []).find(p => p.user_id == room.patient_id || p.id == room.patient_id);
      return pat ? pat.name : `Patient #${room.patient_id}`;
    } else {
      const doc = (doctorList || []).find(d => d.user_id == room.doctor_id || d.id == room.doctor_id);
      return doc ? doc.name : `Doctor #${room.doctor_id}`;
    }
  };

  const getRoomLastMessage = (roomId) => {
    const roomMsgs = (telemedMessages || []).filter(m => String(m.room_id) === String(roomId))
    if (roomMsgs.length === 0) return 'Click to view messages'
    const sorted = [...roomMsgs].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.created_at || 0).getTime()
      const timeB = new Date(b.timestamp || b.created_at || 0).getTime()
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) return timeA - timeB
      return Number(a.id || 0) - Number(b.id || 0)
    })
    const lastMsg = sorted[sorted.length - 1]
    return lastMsg.message || lastMsg.text || 'Click to view messages'
  };

  const selectedPartnerName = useMemo(() => {
    return getPartnerName(selectedRoom);
  }, [selectedRoom, patients, doctorList, isDoctor]);

  // Deterministic chronological sorting to prevent layout jumps/swaps during polling
  const activeMessages = useMemo(() => {
    if (!selectedRoomId) return []
    const filtered = telemedMessages.filter(m => String(m.room_id) === String(selectedRoomId))
    return filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.created_at || 0).getTime()
      const timeB = new Date(b.timestamp || b.created_at || 0).getTime()
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeA - timeB
      }
      return Number(a.id || 0) - Number(b.id || 0)
    })
  }, [telemedMessages, selectedRoomId])

  const prevMsgCountRef = useRef(0)
  const prevSelectedRoomRef = useRef(selectedRoomId)

  // Smart Auto-scroll: only scroll when a new message is added or room switches
  useEffect(() => {
    if (!chatContainerRef.current) return
    const currentCount = activeMessages.length
    const isNewMessage = currentCount > prevMsgCountRef.current
    const isRoomChanged = prevSelectedRoomRef.current !== selectedRoomId

    prevMsgCountRef.current = currentCount
    prevSelectedRoomRef.current = selectedRoomId

    if (isNewMessage || isRoomChanged) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: isRoomChanged ? 'auto' : 'smooth'
      })
    }
  }, [activeMessages.length, selectedRoomId])

  const isSessionPaid = useMemo(() => {
    if (isDoctor) return true
    if (!selectedRoom) return false
    const appt = appointments.find(a => a.id == selectedRoom.appointment_id)
    return appt?.paymentStatus === 'Paid'
  }, [selectedRoom, appointments, isDoctor])

  const apptForRoom = useMemo(() => {
    if (!selectedRoom) return null
    return appointments.find(a => a.id == selectedRoom.appointment_id)
  }, [selectedRoom, appointments])

  const currentRoomFees = useMemo(() => {
    if (!selectedRoom) return { doctor: 500, service: 50, total: 550 }
    const appt = appointments.find(a => a.id == selectedRoom.appointment_id)
    if (!appt) return { doctor: 500, service: 50, total: 550 }
    
    // Check billing first
    const billing = (transactions || []).find(t => t.appointmentId == appt.id)
    if (billing) {
      const total = Number(billing.amount)
      // Assume 50 is technology fee if total > 50, else service is 0
      const service = total > 50 ? 50 : 0
      return { doctor: total - service, service, total }
    }

    if (appt.mode === 'Instant Call') {
      const total = Number(instantCallFee || 500)
      const service = total > 50 ? 50 : 0
      return { doctor: total - service, service, total }
    }

    const doc = (doctorList || []).find(d => d.name === appt.doctorName)
    const docFee = doc ? Number(doc.fee || doc.visitationFee) : 500
    return { doctor: docFee, service: 50, total: docFee + 50 }
  }, [selectedRoom, appointments, transactions, doctorList, instantCallFee])

  const isExpired = useMemo(() => {
    if (isDoctor || isSessionPaid) return false
    return isPaymentExpired(apptForRoom)
  }, [apptForRoom, isDoctor, isSessionPaid, isPaymentExpired])

  const isWaitingForDoctor = useMemo(() => {
    if (!selectedRoom) return false
    return !isDoctor && !selectedRoom.doctor_id && String(selectedRoom.status || '').toLowerCase() === 'pending'
  }, [selectedRoom, isDoctor])

  const isSessionEnded = useMemo(() => {
    if (!apptForRoom) return false
    const terminalStatuses = ['completed', 'ended', 'closed', 'expired', 'cancelled']
    const isStatusEnded = terminalStatuses.includes(String(apptForRoom.status || '').toLowerCase())
    if (isStatusEnded) return true

    if (apptForRoom.mode === 'Instant Call') {
      if (apptForRoom.started_at) {
        try {
          const formatted = apptForRoom.started_at.includes('T') ? apptForRoom.started_at : (apptForRoom.started_at.replace(' ', 'T') + 'Z')
          const startedTime = new Date(formatted).getTime()
          if (!isNaN(startedTime)) {
            const oneHour = 60 * 60 * 1000
            return Date.now() > (startedTime + oneHour)
          }
        } catch (e) {}
      }
      return false
    }
    return isTimeslotEnded(apptForRoom.date, apptForRoom.time)
  }, [apptForRoom])

  const isSlotActive = useMemo(() => {
    if (!apptForRoom || isSessionEnded) return false
    if (apptForRoom.mode === 'Instant Call') return !isSessionEnded
    return isTimeslotActive(apptForRoom.date, apptForRoom.time)
  }, [apptForRoom, isSessionEnded])

  const isSlotFuture = useMemo(() => {
    if (!apptForRoom) return false
    if (apptForRoom.mode === 'Instant Call') return false
    return isTimeslotFuture(apptForRoom.date, apptForRoom.time)
  }, [apptForRoom])

  const handleStartCall = useCallback(async () => {
    if (!isSessionPaid) {
      toast.error("Please complete the consultation payment to enable calling.")
      return
    }
    if (isSessionEnded) {
      toast.error("This consultation session has ended.")
      return
    }
    if (!isSlotActive) {
      if (isSlotFuture) {
        toast.error(`This video consultation is scheduled for ${apptForRoom?.date} at ${apptForRoom?.time}. Please return during the scheduled timeslot.`)
      } else {
        toast.error("This consultation timeslot has already ended.")
      }
      return
    }
    
    toast.loading("Initiating clinical call session...", { id: 'call-init' })
    const res = await updateTelemedRoomCall(selectedRoomId, {
       callStatus: 'ringing',
       callerId: user?.id,
       callerName: user?.name
    })
    toast.dismiss('call-init')
    if (res) {
       setActiveTab('room')
    } else {
       toast.error("Failed to initiate call session. Please try again.")
    }
  }, [isSessionPaid, isSessionEnded, isSlotActive, isSlotFuture, apptForRoom, selectedRoomId, user?.id, user?.name, updateTelemedRoomCall, setActiveTab])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoomId) return
    if (!isSessionPaid || isSessionEnded) {
      toast.error("Messaging is disabled for this session.")
      return
    }

    if (editingMessage) {
      await updateTelemedMessage(editingMessage.id, {
        ...editingMessage,
        message: messageInput.trim(),
        is_edited: true
      })
      setEditingMessage(null)
      setMessageInput('')
    } else {
      const msgData = {
        room_id: selectedRoomId,
        sender_id: user.id,
        message: messageInput.trim(),
        type: 'text',
        reply_to_id: replyToMessage ? replyToMessage.id : undefined
      }
      setMessageInput('')
      setReplyToMessage(null)
      await handleOp('telemed-messages', 'post', msgData, null, 'telemedMessages')
    }
  }

  const handleRequestInstantConsult = async () => {
    const apptData = {
      doctorName: 'Pending Broadcast',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5),
      specialty: 'General',
      service: 'Instant Virtual Consultation',
      mode: 'Instant Call',
      paymentStatus: 'Unpaid',
      status: 'Pending',
      reason: 'Urgent Consultation'
    }

    const apptRes = await addAppointment(apptData)
    if (!apptRes || !apptRes.data || !apptRes.data.id) {
      import('react-hot-toast').then(mod => mod.default.error('Failed to initialize appointment. Please try again.'))
      return
    }

    const apptId = apptRes.data.id

    setTelemedPaymentModal(true, {
      appointmentId: apptId,
      doctorFee: 500,
      onSuccess: async () => {
        const state = useStore.getState()
        const doctorObj = (state.doctorList || []).find(d => d.name === apptData.doctorName)
        const res = await createTelemedRoom({
          appointment_id: apptId,
          doctor_id: doctorObj?.user_id || doctorObj?.id || null,
          patient_id: user.id,
          status: doctorObj ? 'Active' : 'Pending',
          type: 'Instant'
        })
        if (res) {
          setSelectedRoomId(res.id || res)
          setActiveTab('room')
        }
      }
    })
  }

  const followupInfo = useMemo(() => {
    if (!selectedRoom || !isPatient) return null
    const doc = (doctorList || []).find(d => d.id == selectedRoom.doctor_id)
    if (!doc) return null
    
    const lastPaid = (appointments || [])
      .filter(a => a.doctorName === doc.name && a.paymentStatus === 'Paid' && isVideoConsultMode(a.mode))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      
    if (!lastPaid) return null
    
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(lastPaid.date)) / (1000 * 60 * 60 * 24))
    const maxDays = Number(doc.followUpDays) || 7
    
    if (diffDays <= maxDays) {
      return { daysLeft: maxDays - diffDays, maxDays }
    }
    return null
  }, [selectedRoom, doctorList, appointments, isPatient])

  const isCallActive = selectedRoom?.callStatus === 'connected' || selectedRoom?.callStatus === 'ringing'

  // If activeTab is 'room' but no call is active or ringing, automatically fall back to 'chats' view
  useEffect(() => {
    if (activeTab === 'room' && !isCallActive) {
      setActiveTab('chats')
    }
  }, [activeTab, isCallActive, setActiveTab])

  if (activeTab === 'room' && selectedRoomId && isCallActive) {
    return (
      <VirtualRoom 
         key={`room-${selectedRoomId}`}
         sessionType={selectedRoom?.type} 
         isPaid={isSessionPaid} 
         roomData={selectedRoom}
         partnerName={selectedPartnerName}
         startedAt={apptForRoom?.started_at}
         fetchToken={fetchJitsiSession}
         fetchAgoraToken={fetchAgoraToken}
         onExit={() => setActiveTab('chats')} 
      />
    )
  }

  return (
    <div style={isMobile ? {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden'
    } : {
      flex: 1,
      minHeight: 0,
      display: 'grid',
      gridTemplateColumns: '320px 1fr 340px',
      gap: '1.5rem'
    }}>
      
      {/* ── Left Rail: Communication Sidebar ───────────────────────────────── */}
      {(!isMobile || !selectedRoomId) && (
        <div className="ecare-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>Clinical Inbox</h3>
               {isDoctor && (
                 <div 
                    onClick={() => setIsDoctorOnline(!isDoctorOnline)}
                    style={{ 
                      width: '40px', height: '22px', borderRadius: '11px', 
                      background: isDoctorOnline ? 'var(--ecare-primary)' : '#cbd5e1', 
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
                    }}
                  >
                    <div style={{ 
                      position: 'absolute', top: '2px', left: isDoctorOnline ? '20px' : '2px', 
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' 
                    }} />
                 </div>
               )}
            </div>
            <div style={{ position: 'relative' }}>
               <MagnifyingGlass size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
               <input placeholder="Search rooms..." style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '0.8125rem', outline: 'none' }} />
            </div>
         </div>
         
         <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {activeRooms.map(room => (
               <motion.div 
                  key={room.id}
                  whileHover={{ background: '#f8fafc' }}
                  onClick={() => setSelectedRoomId(room.id)}
                  style={{ 
                    padding: '1rem', borderRadius: '16px', cursor: 'pointer',
                    background: selectedRoomId === room.id ? 'var(--ecare-primary-bg)' : 'transparent',
                    display: 'flex', gap: '1rem', alignItems: 'center', transition: 'all 0.2s'
                  }}
               >
                  <div style={{ position: 'relative' }}>
                     <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCircle size={32} weight="duotone" color="#64748b" />
                     </div>
                     {room.status === 'Active' && <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: 'var(--ecare-primary)', border: '2.5px solid white' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ecare-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                           {getPartnerName(room)}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{room.type}</span>
                     </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getRoomLastMessage(room.id)}
                      </div>
                  </div>
               </motion.div>
            ))}
            {activeRooms.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
                 No consultation rooms found.
              </div>
            )}
         </div>
      </div>
      )}

      {/* ── Center Area: Consultation View ─────────────────────────────────── */}
      {(!isMobile || selectedRoomId) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', minWidth: 0, minHeight: 0 }}>
          <motion.div 
             key="chat"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="ecare-card" 
             style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
          >
                  <div style={{ padding: isMobile ? '0.625rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem', minWidth: 0 }}>
                        {isMobile && selectedRoomId && (
                           <button 
                              onClick={() => { setSelectedRoomId(null); setShowMobileRightPanel(false); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ecare-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                           >
                              <ArrowLeft size={20} weight="bold" />
                           </button>
                        )}
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                           <Chats size={20} weight="duotone" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                           <div style={{ fontSize: isMobile ? '0.875rem' : '0.9375rem', fontWeight: 800, color: 'var(--ecare-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {selectedRoomId ? selectedPartnerName : 'Select Session'}
                           </div>
                           <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: isWaitingForDoctor ? '#f59e0b' : (isSessionPaid ? 'var(--ecare-primary)' : '#f59e0b'), fontWeight: 600 }}>
                              {selectedRoomId
                                ? (isWaitingForDoctor
                                    ? 'Waiting for Doctor'
                                    : (isSessionPaid ? 'Verified Consultation' : 'Payment Required'))
                                : 'No active session'}
                           </div>
                        </div>
                     </div>
                     {selectedRoomId && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                             {isMobile && (
                                <button 
                                   onClick={() => setShowMobileRightPanel(true)}
                                   style={{ padding: '0.625rem', borderRadius: '12px', border: '1.5px solid #f1f5f9', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                   <IdentificationCard size={18} weight="bold" />
                                </button>
                             )}
                            <button 
                               disabled={!isSessionPaid || !isSlotActive || isSessionEnded}
                               onClick={handleStartCall}
                               style={{ padding: '0.625rem 1.25rem', borderRadius: '12px', border: 'none', background: (isSessionPaid && isSlotActive && !isSessionEnded) ? 'var(--ecare-primary)' : '#cbd5e1', color: 'white', fontWeight: 700, cursor: (isSessionPaid && isSlotActive && !isSessionEnded) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                               <VideoCamera size={18} weight="bold" /> Start Call
                            </button>
                         </div>
                      )}
                  </div>

                  <div 
                    ref={chatContainerRef}
                    style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1.5rem', background: '#f8fafc', position: 'relative' }}
                  >
                      {activeMessages.map(m => {
                        const parentMsg = m.reply_to_id ? activeMessages.find(msg => msg.id == m.reply_to_id) : null;
                        return (
                          <ChatMessage 
                            key={m.id} 
                            msg={m} 
                            isMe={m.sender_id == user.id} 
                            isMobile={isMobile}
                            onReply={(msg) => { setReplyToMessage(msg); setEditingMessage(null); }}
                            onEdit={(msg) => { setEditingMessage(msg); setReplyToMessage(null); setMessageInput(msg.message || msg.text); }}
                            onDelete={(id) => {
                              openConfirm({
                                title: 'Delete Message',
                                message: 'Are you sure you want to permanently delete this message? This action cannot be undone.',
                                confirmText: 'Delete',
                                cancelText: 'Cancel',
                                onConfirm: async () => {
                                  await deleteTelemedMessage(id);
                                  closeConfirm();
                                }
                              });
                            }}
                            parentMsg={parentMsg}
                            onCallBack={(isSessionPaid && isSlotActive && !isSessionEnded) ? handleStartCall : null}
                          />
                        )
                      })}
                     
                     {!selectedRoomId && (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                           Select a clinical conversation from the sidebar to begin.
                        </div>
                     )}
                  </div>

                  <div style={{ padding: isMobile ? '0.75rem' : '1.25rem 1.5rem', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     {replyToMessage && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 1rem', borderLeft: '4px solid var(--ecare-primary)', fontSize: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85%', textAlign: 'left' }}>
                            Replying to <strong style={{ color: 'var(--ecare-primary)' }}>{replyToMessage.sender_name || (replyToMessage.sender_id == user.id ? 'You' : 'Partner')}</strong>: <span style={{ color: 'var(--ecare-text-muted)' }}>{replyToMessage.message || replyToMessage.text}</span>
                          </div>
                          <button type="button" onClick={() => setReplyToMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}><X size={14} weight="bold" /></button>
                        </div>
                     )}
                     {editingMessage && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef3c7', padding: '8px 1rem', borderLeft: '4px solid #f59e0b', fontSize: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85%', textAlign: 'left' }}>
                            Editing message: <span style={{ color: '#b45309' }}>{editingMessage.message || editingMessage.text}</span>
                          </div>
                          <button type="button" onClick={() => { setEditingMessage(null); setMessageInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}><X size={14} weight="bold" /></button>
                        </div>
                     )}
                      {selectedRoomId && (isWaitingForDoctor || !isSessionPaid || isSessionEnded) ? (
                        <div style={{ 
                           background: '#f8fafc', 
                           border: '1.5px solid #e2e8f0', 
                           borderRadius: '16px', 
                           padding: isMobile ? '1rem' : '1.25rem', 
                           display: 'flex', 
                           flexDirection: 'column', 
                           alignItems: 'center', 
                           textAlign: 'center',
                           gap: isMobile ? '0.5rem' : '0.75rem'
                        }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isExpired || isSessionEnded ? '#ef4444' : '#fbbf24', fontWeight: 800, fontSize: '0.875rem' }}>
                              <LockKey size={18} weight="bold" />
                              <span>{isWaitingForDoctor ? 'Waiting for Doctor' : (isSessionEnded ? 'Session Ended' : (isExpired ? 'Window Expired' : 'Messenger Locked'))}</span>
                           </div>
                           <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>
                              {isWaitingForDoctor
                                ? 'Your instant call has been created. A doctor will join the consultation when available.'
                                : isSessionEnded
                                ? 'This virtual consultation session has ended. Messaging is no longer available.'
                                : isExpired 
                                ? 'The payment deadline for this scheduled session has passed. Please contact support.' 
                                : 'Please complete your consultation payment to enable messaging.'}
                           </p>
                           {!isExpired && !isWaitingForDoctor && !isSessionEnded && (
                             <button 
                                onClick={() => setTelemedPaymentModal(true, { 
                                   appointmentId: selectedRoom?.appointment_id, 
                                   doctorFee: currentRoomFees.doctor,
                                   serviceFee: currentRoomFees.service
                                })}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', background: 'var(--ecare-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                             >
                                Pay Now
                             </button>
                           )}
                        </div>
                      ) : (
                        selectedRoomId && (
                           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '16px', border: '1.5px solid #f1f5f9' }}>
                              <button style={{ padding: '0.5rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}><FileText size={20} /></button>
                              <input 
                                 value={messageInput}
                                 onChange={(e) => setMessageInput(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                 placeholder="Type your message..." 
                                 style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '0.875rem', fontWeight: 500 }} 
                              />
                              <button 
                                 onClick={handleSendMessage}
                                 style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--ecare-primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                 <PaperPlaneRight size={20} weight="fill" />
                              </button>
                           </div>
                        )
                      )}
                   </div>
               </motion.div>
        </div>
      )}

      {/* ── Right Panel: Actions & Context ─────────────────────────────────── */}
      {(!isMobile || showMobileRightPanel) && (
        <div style={isMobile ? {
          position: 'absolute',
          inset: 0,
          background: 'white',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.5rem',
          borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        } : {
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          height: '100%',
          minHeight: 0
        }}>
           {isMobile && (
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Clinical Info & Actions</h3>
                <button 
                  onClick={() => setShowMobileRightPanel(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} weight="bold" />
                </button>
             </div>
           )}
         
         {/* Context Sidebar */}
         <div className="ecare-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
               <button 
                  onClick={() => setActiveTab('info')}
                  style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'info' ? '2px solid var(--ecare-primary)' : 'none', color: activeTab === 'info' ? 'var(--ecare-primary)' : '#64748b', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
               >
                  Info
               </button>
               {isDoctor && (
                 <>
                   <button 
                      onClick={() => setActiveTab('prescription')}
                      style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'prescription' ? '2px solid var(--ecare-primary)' : 'none', color: activeTab === 'prescription' ? 'var(--ecare-primary)' : '#64748b', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
                   >
                      Rx
                   </button>
                   <button 
                      onClick={() => setActiveTab('notes')}
                      style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'notes' ? '2px solid var(--ecare-primary)' : 'none', color: activeTab === 'notes' ? 'var(--ecare-primary)' : '#64748b', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
                   >
                      Notes
                   </button>
                 </>
               )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem 1rem' }}>
               {activeTab === 'info' || !isDoctor ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.25rem', borderRadius: '20px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', border: '1px solid var(--ecare-primary-border)' }}>
                       <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden' }}>
                             <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                             <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{user.name}</div>
                             <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>ID: #{user.id?.toString().padStart(6, '0')}</div>
                          </div>
                       </div>
                    </div>

                    <div>
                       <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ecare-text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={18} weight="duotone" color="var(--ecare-primary)" /> Session Health
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                             <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>Encryption</div>
                             <div style={{ fontSize: '0.7rem', color: 'var(--ecare-primary)', fontWeight: 600 }}>End-to-End Secure</div>
                          </div>
                          
                          {followupInfo && (
                             <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--ecare-primary-bg)', border: '1px solid #bbf7d0' }}>
                               <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <CheckCircle size={14} weight="fill" /> Follow-up Eligible
                               </div>
                               <div style={{ fontSize: '0.65rem', color: 'var(--ecare-primary)', fontWeight: 600, marginTop: '2px' }}>
                                  {followupInfo.daysLeft} days remaining in window.
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               ) : activeTab === 'prescription' ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>Prescription Builder</div>
                    <div className="ecare-card" style={{ padding: '1rem', background: '#f8fafc' }}>
                       <input className="ecare-input" placeholder="Medicine name..." style={{ marginBottom: '0.5rem', fontSize: '0.8125rem' }} />
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input className="ecare-input" placeholder="Dosage" style={{ fontSize: '0.8125rem' }} />
                          <input className="ecare-input" placeholder="Duration" style={{ fontSize: '0.8125rem' }} />
                       </div>
                       <button className="ecare-button" style={{ width: '100%', marginTop: '1rem', fontSize: '0.75rem' }}>Add to List</button>
                    </div>
                 </div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>Clinical Notes</div>
                    <textarea 
                       className="ecare-input" 
                       placeholder="Write session notes..." 
                       style={{ minHeight: '200px', fontSize: '0.8125rem', resize: 'none' }}
                    />
                    <button className="ecare-button" style={{ width: '100%' }}>Save Notes</button>
                 </div>
               )}
            </div>

            <div style={{ padding: '1rem', marginTop: 'auto', borderRadius: '16px', background: 'var(--ecare-primary-bg)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <ShieldCheck size={24} weight="duotone" color="var(--ecare-primary)" />
               <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534', lineHeight: 1.4 }}>
                  This session is being recorded for medical auditing.
               </div>
            </div>
         </div>
      </div>
      )}

    </div>
  )
}

export default Telemedicine
