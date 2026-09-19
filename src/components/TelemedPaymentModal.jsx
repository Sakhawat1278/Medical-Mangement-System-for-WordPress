import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, ShieldCheck, Lightning, User, VideoCamera, LockKey } from 'phosphor-react'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'

const TelemedPaymentModal = () => {
  const { 
    isTelemedPaymentModalOpen, 
    setTelemedPaymentModal, 
    telemedPaymentData,
    processTelemedPayment,
    currencySymbol
  } = useStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('card')

  const handlePay = async () => {
    if (!telemedPaymentData) return
    setIsProcessing(true)
    // Simulate gateway delay
    const success = await processTelemedPayment(telemedPaymentData.appointmentId, { method: selectedMethod })
    setIsProcessing(false)
    if (success) {
      setTelemedPaymentModal(false)
      if (telemedPaymentData.onSuccess) telemedPaymentData.onSuccess()
    }
  }

  const fees = {
    doctor: telemedPaymentData?.doctorFee || 500,
    service: telemedPaymentData?.serviceFee !== undefined ? telemedPaymentData.serviceFee : 50,
    total: (telemedPaymentData?.doctorFee || 500) + (telemedPaymentData?.serviceFee !== undefined ? telemedPaymentData.serviceFee : 50)
  }

  return (
    <Portal>
      <AnimatePresence>
        {isTelemedPaymentModalOpen && telemedPaymentData && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setTelemedPaymentModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{ 
                width: '100%', 
                maxWidth: '440px', 
                position: 'relative', 
                padding: 0,
                border: 'none',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                   <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                      <VideoCamera size={20} weight="duotone" />
                   </div>
                   <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Consultation Payment</h3>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>Secure Clinical Checkout</div>
                   </div>
                </div>
                <button 
                  onClick={() => setTelemedPaymentModal(false)}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div style={{ padding: '1.75rem' }}>
                 {/* Summary */}
                 <div style={{ padding: '1.25rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                       <span style={{ fontSize: '0.875rem', color: 'var(--ecare-text-muted)', fontWeight: 500 }}>Doctor Consultation</span>
                       <span style={{ fontSize: '0.875rem', color: 'var(--ecare-text-main)', fontWeight: 700 }}>{currencySymbol}{fees.doctor}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                       <span style={{ fontSize: '0.875rem', color: 'var(--ecare-text-muted)', fontWeight: 500 }}>Technology Fee</span>
                       <span style={{ fontSize: '0.875rem', color: 'var(--ecare-text-main)', fontWeight: 700 }}>{currencySymbol}{fees.service}</span>
                    </div>
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '0.75rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <span style={{ fontSize: '1rem', color: 'var(--ecare-text-main)', fontWeight: 800 }}>Total Amount</span>
                       <span style={{ fontSize: '1.125rem', color: 'var(--ecare-primary)', fontWeight: 900 }}>{currencySymbol}{fees.total}</span>
                    </div>
                 </div>

                 {/* Payment Methods */}
                 <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Select Payment Method</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                       {['card', 'bkash', 'nagad', 'paypal'].map(m => (
                          <div 
                            key={m}
                            onClick={() => setSelectedMethod(m)}
                            style={{ 
                              padding: '1rem', borderRadius: '12px', border: `2px solid ${selectedMethod === m ? 'var(--ecare-primary)' : '#f1f5f9'}`,
                              background: selectedMethod === m ? 'var(--ecare-primary-bg)' : 'white',
                              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                              fontSize: '0.8125rem', fontWeight: 700, color: selectedMethod === m ? 'var(--ecare-primary)' : '#64748b',
                              textTransform: 'capitalize'
                            }}
                          >
                            {m}
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Action */}
                 <button 
                   onClick={handlePay}
                   disabled={isProcessing}
                   style={{ 
                     width: '100%', padding: '1rem', borderRadius: '16px', border: 'none',
                     background: isProcessing ? '#94a3b8' : 'var(--ecare-primary)', color: 'white',
                     fontWeight: 800, fontSize: '1rem', cursor: isProcessing ? 'default' : 'pointer',
                     boxShadow: '0 10px 15px -3px var(--ecare-primary-shadow)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                   }}
                 >
                   {isProcessing ? (
                     <>Processing...</>
                   ) : (
                     <>
                       <LockKey size={20} weight="bold" />
                       Confirm & Pay {currencySymbol}{fees.total}
                     </>
                   )}
                 </button>

                 <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ShieldCheck size={18} weight="fill" color="var(--ecare-primary)" />
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>HIPAA Compliant • Encrypted Transaction</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default TelemedPaymentModal
