import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Bank, CreditCard, Wallet, 
  CheckCircle, CurrencyCircleDollar, 
  ArrowRight, Info, Receipt
} from 'phosphor-react'
import useStore from '../store/useStore'
import CustomSelect from './CustomSelect'
import toast from 'react-hot-toast'
import { Portal } from '../utils/portal'

const DisbursementModal = ({ isOpen, onClose, doctor }) => {
  const { addPayout, processPayout, currencySymbol } = useStore()
  
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showConfirmStep, setShowConfirmStep] = useState(false)

  // Derive available payment methods from doctor's profile.
  // Both bank and mobile options are offered independently if both are configured.
  const availableMethods = useMemo(() => {
    if (!doctor) return []
    const methods = []

    if (doctor.accountNumber) {
      methods.push({ value: 'Bank Transfer', label: '🏦 Bank Transfer' })
    }
    if (doctor.mobileNumber) {
      methods.push({ value: doctor.mobileProvider || 'Mobile Banking', label: `📱 ${doctor.mobileProvider || 'Mobile Banking'}` })
    }

    // Always allow cash as a fallback
    methods.push({ value: 'Cash', label: '💵 Cash' })
    return methods
  }, [doctor])

  const [method, setMethod] = useState(availableMethods[0]?.value || 'Bank Transfer')

  useEffect(() => {
    if (doctor) {
      setAmount(doctor.balanceDue.toString())
      setReference('')
      setNotes(doctor.requestNotes || `Disbursement for clinical earnings. Platform share (${doctor.currentRate || 20}%) applied.`)
      setIsSuccess(false)
      // Default to preferred method if available in the list, otherwise first available
      const preferred = doctor.accountType === 'Bank Account' ? 'Bank Transfer'
        : (doctor.mobileProvider || 'Mobile Banking')
      const prefAvailable = availableMethods.find(m => m.value === preferred)
      setMethod(prefAvailable?.value || availableMethods[0]?.value || 'Cash')
      setShowConfirmStep(false)
    }
  }, [doctor, isOpen, availableMethods])

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }
    setIsProcessing(true)
    
    const payoutData = {
      amount: Number(amount),
      method,
      reference,
      notes,
      status: 'Paid'
    }

    try {
      let success = false
      if (doctor.payoutRequestId) {
        // Update existing pending payout request to Paid
        success = await processPayout(doctor.payoutRequestId, payoutData)
      } else {
        // Create a new payout record
        success = await addPayout({
          ...payoutData,
          doctorId: doctor.id,
          doctorName: doctor.name,
          doctor_id: doctor.id
        })
      }

      if (success) {
        setIsSuccess(true)
        setTimeout(() => {
          setIsSuccess(false)
          onClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Payout failed:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!doctor) return null

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
        <div 
          style={{
            position: 'fixed', inset: 0,
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
        >
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
              width: '100%', maxWidth: '520px', position: 'relative',
              padding: 0, border: 'none', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '1.25rem 1.5rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  {doctor.photo ? (
                    <img 
                      src={doctor.photo} 
                      alt={doctor.name} 
                      style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    />
                  ) : (
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, border: '1px solid #e2e8f0' }}>
                      {doctor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>{doctor.name}</h2>
                  <p style={{ fontSize: '0.72rem', opacity: 1, margin: '1px 0 0 0', fontWeight: 400, color: '#64748b' }}>{doctor.specialization}</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}>
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem 2rem 2rem' }}>
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center', padding: '2.5rem 0' }}
                >
                  <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.2)' }}>
                    <CheckCircle size={52} weight="fill" />
                  </div>
                  <h3 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Payment Finalized</h3>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>The disbursement has been synced to clinical ledger.</p>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Payout Credentials Card */}
                  <div style={{ background: '#f8fafc', borderRadius: '18px', padding: '1rem 1.25rem', border: '1.5px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <CreditCard size={16} weight="duotone" />
                      Recipient Account Details
                    </div>

                    {method === 'Cash' ? (
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, fontStyle: 'italic', padding: '0.5rem 0' }}>
                        Manual cash disbursement. No account details required.
                      </div>
                    ) : method === 'Bank Transfer' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Account Number</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{doctor.accountNumber || 'Not Configured'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Bank / Branch</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{doctor.bankName || '—'}{doctor.branchName ? ` (${doctor.branchName})` : ''}</div>
                        </div>
                        {doctor.accountName && (
                          <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Account Holder</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{doctor.accountName}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Mobile Number</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{doctor.mobileNumber || 'Not Configured'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Provider</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{doctor.mobileProvider || 'Mobile Banking'}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Disbursement Amount</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8' }}>{currencySymbol}</span>
                        <input 
                          type="number" 
                          className="ecare-input" 
                          style={{ paddingLeft: '2.25rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ecare-primary)', borderRadius: '12px' }}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          max={doctor.balanceDue}
                          required
                        />
                      </div>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Payment Method</label>
                      <CustomSelect 
                        value={method}
                        onChange={setMethod}
                        options={availableMethods}
                        customTriggerStyle={{ 
                          borderRadius: '12px', 
                          height: '42px', 
                          fontWeight: 700, 
                          background: '#f8fafc',
                          border: '1.5px solid #e2e8f0'
                        }}
                      />
                    </div>
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Reference / Transaction ID</label>
                    <input 
                      type="text" 
                      className="ecare-input" 
                      placeholder="e.g. Bank Transfer Ref, TrxID"
                      style={{ borderRadius: '12px' }}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Internal Clinical Notes</label>
                    <textarea 
                      className="ecare-input" 
                      style={{ minHeight: '80px', resize: 'none', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="ecare-btn-secondary" 
                      style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', fontWeight: 600 }}
                    >
                      Discard
                    </button>
                    <button 
                      type="button" 
                      disabled={isProcessing || Number(amount) <= 0 || Number(amount) > doctor.balanceDue}
                      onClick={() => {
                        if (Number(amount) <= 0 || Number(amount) > doctor.balanceDue) {
                          toast.error('Invalid disbursement amount.')
                          return
                        }
                        setShowConfirmStep(true)
                      }}
                      className="ecare-button" 
                      style={{ flex: 2, padding: '0.875rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontWeight: 700 }}
                    >
                      {isProcessing ? 'Processing...' : (
                        <>
                          Confirm Payment <ArrowRight size={18} weight="bold" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {showConfirmStep && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 255, 255, 0.96)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', maxWidth: '360px' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: '#ecfdf5', 
                    color: '#059669', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.15)'
                  }}>
                    <CheckCircle size={36} weight="duotone" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Approve Disbursement?</h3>
                    <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                      Are you sure you want to approve the disbursement of <b>{currencySymbol}{Number(amount).toLocaleString()}</b> for <b>{doctor.name}</b>? This will record the transaction and update the clinical ledger.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowConfirmStep(false)}
                      className="ecare-btn-secondary"
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600 }}
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={async (e) => {
                        setShowConfirmStep(false)
                        await handleSubmit(e)
                      }}
                      className="ecare-button"
                      style={{ flex: 1.5, padding: '0.75rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700 }}
                    >
                      {isProcessing ? 'Processing...' : 'Yes, Approve'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </Portal>
  )
}

export default DisbursementModal
