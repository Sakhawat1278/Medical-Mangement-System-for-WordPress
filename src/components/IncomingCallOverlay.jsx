import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, X, VideoCamera, UserCircle, SpeakerHigh } from 'phosphor-react'
import { Portal } from '../utils/portal'

const IncomingCallOverlay = ({ call, onAccept, onReject }) => {
  return (
    <Portal>
      <AnimatePresence>
        {call && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onReject}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{
                width: '320px',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                padding: '2.5rem 2rem',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
          {/* Subtle Ambient Background */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '140px',
            background: 'linear-gradient(180deg, var(--ecare-primary-bg) 0%, white 100%)',
            zIndex: 0
          }} />

          {/* Animated Ringing Rings */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '2rem' }}>
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                style={{
                  position: 'absolute', inset: -10,
                  borderRadius: '38%', border: '2px solid var(--ecare-primary)',
                  zIndex: -1
                }}
              />
            ))}
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '32px', 
              background: 'white', border: '4px solid white', 
              boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserCircle size={80} weight="duotone" color="var(--ecare-primary)" />
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--ecare-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
              Incoming Clinical Call
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--ecare-text-main)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
              {call.patientName}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ecare-text-muted)', fontWeight: 500 }}>
              Urgent Virtual Consultation
            </div>
          </div>

          <div style={{ width: '100%', marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', position: 'relative', zIndex: 1 }}>
            <button 
              onClick={onAccept}
              style={{ 
                width: '100%', padding: '1.125rem', borderRadius: '22px', border: 'none', 
                background: 'var(--ecare-primary)', color: 'white', fontWeight: 800, 
                fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', gap: '10px', boxShadow: '0 15px 25px -5px var(--ecare-primary-shadow)'
              }}
            >
              <VideoCamera size={22} weight="fill" /> Accept
            </button>
            <button 
              onClick={onReject}
              style={{ 
                width: '100%', padding: '1rem', borderRadius: '22px', border: '1.5px solid #f1f5f9', 
                background: 'white', color: '#94a3b8', fontWeight: 700, 
                fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
            >
              Decline
            </button>
          </div>
        </motion.div>
      </div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default IncomingCallOverlay
