import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WarningCircle, Trash, X } from 'phosphor-react'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'

const ConfirmModal = () => {
  const { confirmModal, closeConfirm } = useStore()

  if (!confirmModal.isOpen) return null

  return (
    <Portal>
      <AnimatePresence>
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeConfirm}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="ecare-card"
            style={{ width: '100%', maxWidth: '420px', position: 'relative', padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WarningCircle size={20} weight="bold" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                    {confirmModal.title}
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Confirmation Required</p>
                </div>
              </div>
              <button 
                onClick={closeConfirm}
                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' }}>
                {confirmModal.message}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', padding: '0 1.5rem 1.25rem' }}>
              <button 
                onClick={closeConfirm}
                className="ecare-btn-secondary"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontWeight: 600 }}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  const { onConfirm } = confirmModal;
                  if (typeof onConfirm === 'function') {
                    onConfirm();
                  }
                  closeConfirm();
                }}
                className="ecare-button"
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  fontWeight: 600, 
                  background: '#ef4444', 
                  borderColor: '#ef4444',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem' 
                }}
              >
                <Trash size={16} weight="bold" />
                <span>{confirmModal.confirmText || 'Confirm'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  )
}

export default ConfirmModal
