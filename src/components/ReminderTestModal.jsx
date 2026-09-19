import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Portal } from '../utils/portal'
import { 
  CheckCircle, WarningCircle, X, Spinner, PaperPlaneTilt, Bell, 
  Calendar, CreditCard, Flask, Clock, Broadcast, EnvelopeSimple, 
  Info, ArrowsClockwise 
} from 'phosphor-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const REMINDER_FEATURES = [
  {
    id: 'appointment',
    label: 'Appointment Reminder',
    desc: 'Upcoming doctor consultation check-in',
    icon: Calendar,
    color: '#3b82f6',
    previewSubject: 'Upcoming Appointment Reminder',
    previewText: 'Your consultation with Dr. Sarah Jenkins is scheduled for tomorrow at 10:00 AM. Please arrive 10 minutes early.'
  },
  {
    id: 'invoice',
    label: 'Invoice / Billing Reminder',
    desc: 'Outstanding invoice balance notification',
    icon: CreditCard,
    color: '#8b5cf6',
    previewSubject: 'Payment Reminder: Invoice #ECR-8421',
    previewText: 'Invoice #ECR-8421 has an outstanding balance of $120.00 (paid $0.00 of $120.00). Please review in your patient portal.'
  },
  {
    id: 'lab',
    label: 'Lab Result Alert',
    desc: 'Diagnostic report completed notification',
    icon: Flask,
    color: '#06b6d4',
    previewSubject: 'Diagnostic Lab Report Ready',
    previewText: 'Your lab result for Comprehensive Metabolic Panel (CMP) is now completed and ready in your patient portal.'
  },
  {
    id: 'followup',
    label: 'Follow-Up Reminder',
    desc: 'Post-consultation follow-up recommendation',
    icon: Clock,
    color: '#f59e0b',
    previewSubject: 'Follow-Up Consultation Reminder',
    previewText: 'A routine clinical follow-up with Dr. Sarah Jenkins is recommended. Please book your next visit within 7 days.'
  },
  {
    id: 'channel_test',
    label: 'Channel Ping Test',
    desc: 'Raw connectivity diagnostic check',
    icon: Broadcast,
    color: '#10b981',
    previewSubject: 'Reminder Email Diagnostic Test',
    previewText: 'This is an automated diagnostic test ping from E-CARE to verify that the email delivery engine (WordPress wp_mail) is active.'
  }
]

const ReminderTestModal = ({ 
  isOpen, 
  onClose, 
  initialFeature = 'appointment'
}) => {
  const [selectedFeature, setSelectedFeature] = useState(initialFeature)
  const [recipientEmail, setRecipientEmail] = useState(
    window.ecareConfig?.user?.email || window.ecareConfig?.siteEmail || 'admin@example.com'
  )
  const [isSending, setIsSending] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    if (initialFeature) {
      setSelectedFeature(initialFeature)
    }
  }, [initialFeature, isOpen])

  if (!isOpen) return null

  const currentFeatureObj = REMINDER_FEATURES.find(f => f.id === selectedFeature) || REMINDER_FEATURES[0]
  const FeatureIcon = currentFeatureObj.icon

  const handleRunTest = async () => {
    if (!recipientEmail.trim()) {
      toast.error('Please enter a recipient email address to test.')
      return
    }

    setIsSending(true)
    setTestResult(null)

    try {
      const payload = {
        feature: selectedFeature,
        recipient_email: recipientEmail.trim()
      }

      const response = await api.post('reminders/test', payload)
      if (response.data?.diagnostics) {
        setTestResult(response.data.diagnostics)
        if (response.data.diagnostics.success) {
          toast.success('Test reminder email dispatched successfully!')
        } else {
          toast.error('Email dispatch test encountered an issue.')
        }
      } else {
        toast.error(response.data?.message || 'Unexpected response received from reminder service.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send test reminder.'
      toast.error(msg)
      setTestResult({
        success: false,
        results: {
          email: {
            success: false,
            status: 'Request Failed',
            message: msg
          }
        }
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Portal>
      <AnimatePresence>
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
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
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '92vh',
              position: 'relative',
              padding: 0,
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bell size={20} weight="bold" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                    Test Reminder Email Dispatch
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>
                    Live delivery verification for clinical reminder emails via WordPress mail engine
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  color: '#9ca3af', padding: '4px', borderRadius: '6px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Step 1: Select Feature */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Select Reminder Feature to Test
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.625rem' }}>
              {REMINDER_FEATURES.map((item) => {
                const isSelected = selectedFeature === item.id
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setSelectedFeature(item.id); setTestResult(null); }}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: `1.5px solid ${isSelected ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                      background: isSelected ? 'var(--ecare-primary-bg)' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--ecare-primary)' : '#f1f5f9',
                      color: isSelected ? 'white' : item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={18} weight="bold" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? 'var(--ecare-primary)' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Delivery Channel & Recipient */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. Delivery Channel &amp; Recipient
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.875rem' }}>
              <div style={{
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '1.5px solid #3b82f6',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#dbeafe',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <EnvelopeSimple size={20} weight="fill" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1e3a8a' }}>
                    Email Channel
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#3b82f6' }}>
                    WordPress wp_mail()
                  </div>
                </div>
              </div>

              <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                <label className="ecare-label" style={{ fontSize: '0.75rem' }}>
                  Test Recipient Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="email"
                  className="ecare-input" 
                  value={recipientEmail} 
                  onChange={(e) => setRecipientEmail(e.target.value)} 
                  placeholder="admin@example.com"
                  style={{ fontSize: '0.8125rem' }}
                />
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px' }}>
                  Address where the test reminder email will be delivered.
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Template Preview */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              3. Template Preview
            </label>
            <div style={{
              padding: '1rem 1.25rem',
              background: '#f8fafc',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                <FeatureIcon size={14} color={currentFeatureObj.color} />
                <span>{currentFeatureObj.label} Email Template</span>
              </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
              Subject: {currentFeatureObj.previewSubject}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              {currentFeatureObj.previewText}
            </div>
          </div>
          </div>

          {/* Test Results Output */}
          {testResult && (
            <div style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: testResult.success ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.875rem' }}>
                {testResult.success ? (
                  <CheckCircle size={22} weight="fill" color="#16a34a" />
                ) : (
                  <WarningCircle size={22} weight="fill" color="#dc2626" />
                )}
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: testResult.success ? '#15803d' : '#991b1b' }}>
                    {testResult.success ? 'Diagnostic Test Passed' : 'Diagnostic Encountered Issues'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: testResult.success ? '#166534' : '#b91c1c' }}>
                    Tested on {testResult.tested_at}
                  </div>
                </div>
              </div>

              {/* Individual Channel Diagnostics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {testResult.results && Object.entries(testResult.results).map(([chKey, chRes]) => (
                  <div 
                    key={chKey} 
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'white',
                      borderRadius: '10px',
                      border: `1px solid ${chRes.success ? '#dcfce7' : '#fee2e2'}`,
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{chKey}:</span>
                        <span style={{
                          padding: '1px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          background: chRes.success ? '#dcfce7' : '#fee2e2',
                          color: chRes.success ? '#166534' : '#991b1b'
                        }}>
                          {chRes.status}
                        </span>
                      </div>
                      {chRes.elapsed_ms !== undefined && (
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          {chRes.elapsed_ms}ms
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#475569', lineHeight: 1.4 }}>
                      {chRes.message}
                    </div>
                    {chRes.endpoint && (
                      <div style={{ marginTop: '4px', fontSize: '0.68rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                        Endpoint: <code>{chRes.endpoint}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="ecare-button-secondary"
            style={{ padding: '0.625rem 1.25rem', borderRadius: '10px', fontSize: '0.8125rem' }}
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleRunTest}
            disabled={isSending}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '12px',
              background: 'var(--ecare-primary)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: isSending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            {isSending ? (
              <Spinner size={16} className="ecare-spin" />
            ) : (
              <PaperPlaneTilt size={16} weight="bold" />
            )}
            <span>{isSending ? 'Sending Test...' : `Send Test ${currentFeatureObj.label} Email`}</span>
          </button>
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
</Portal>
  )
}

export default ReminderTestModal
