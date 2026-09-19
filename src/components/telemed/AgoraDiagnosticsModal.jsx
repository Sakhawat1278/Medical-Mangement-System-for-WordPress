import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, WarningCircle, Broadcast, Spinner, X, ShieldCheck } from 'phosphor-react'
import { Portal } from '../../utils/portal'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const AgoraDiagnosticsModal = ({ isOpen, onClose, agoraAppId, agoraAppCertificate, hasAgoraAppCertificate = false }) => {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)

  const isCertSet = Boolean(agoraAppCertificate || hasAgoraAppCertificate)

  const runTest = async () => {
    setTesting(true)
    setResults(null)
    try {
      const response = await api.post('telemed/agora/test', {
        app_id: agoraAppId,
        app_certificate: agoraAppCertificate
      })
      if (response.data?.diagnostics) {
        setResults(response.data.diagnostics)
        if (response.data.diagnostics.configured) {
          toast.success('Agora RTC token service verified!')
        } else {
          toast.error(response.data.diagnostics.message || 'Agora verification failed')
        }
      }
    } catch (err) {
      const diag = err.response?.data?.data?.diagnostics || {
        configured: false,
        message: err.response?.data?.message || 'Agora connection test failed.'
      }
      setResults(diag)
      toast.error(diag.message || 'Connection test failed')
    } finally {
      setTesting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Portal>
      <AnimatePresence>
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="ecare-card"
            style={{ width: '100%', maxWidth: '480px', position: 'relative', padding: 0, border: 'none', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Broadcast size={20} weight="bold" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Agora Diagnostics & Health</h3>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Cryptographic Token Verification</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}>
                <X size={18} weight="bold" />
              </button>
            </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {/* Status Rows */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 600, color: '#64748b' }}>Agora RTC SDK:</span>
              <span style={{ fontWeight: 800, color: '#16a34a' }}>v4.x Installed</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 600, color: '#64748b' }}>App ID:</span>
              <span style={{ fontWeight: 800, color: agoraAppId ? '#16a34a' : '#ef4444' }}>
                {agoraAppId ? 'Configured' : 'Missing'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 600, color: '#64748b' }}>App Certificate:</span>
              <span style={{ fontWeight: 800, color: isCertSet ? '#16a34a' : '#ef4444' }}>
                {isCertSet ? 'Configured (Server-Protected)' : 'Missing'}
              </span>
            </div>

            {results && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>RTC Token Engine:</span>
                  <span style={{ fontWeight: 800, color: results.rtc_token_service === 'Working' ? '#16a34a' : '#ef4444' }}>
                    {results.rtc_token_service}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>Signaling Engine:</span>
                  <span style={{ fontWeight: 800, color: results.signaling_service === 'Working' ? '#16a34a' : '#ef4444' }}>
                    {results.signaling_service}
                  </span>
                </div>

                <div style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '12px',
                  background: results.configured ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${results.configured ? '#bbf7d0' : '#fecaca'}`,
                  fontSize: '0.8125rem',
                  color: results.configured ? '#166534' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {results.configured ? <CheckCircle size={18} weight="bold" /> : <WarningCircle size={18} weight="bold" />}
                  <span>{results.message}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={runTest}
              disabled={testing}
              style={{
                flex: 1, padding: '0.875rem', borderRadius: '14px',
                background: 'var(--ecare-primary)', color: 'white',
                border: 'none', fontWeight: 800, fontSize: '0.875rem',
                cursor: testing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {testing ? <Spinner size={18} className="ecare-spin" /> : <Broadcast size={18} weight="bold" />}
              {testing ? 'Testing Token Generation…' : 'Test Agora Connection'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.875rem 1.5rem', borderRadius: '14px',
                background: '#f1f5f9', color: '#64748b',
                border: 'none', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
      </div>
    </AnimatePresence>
  </Portal>
  )
}

export default AgoraDiagnosticsModal
